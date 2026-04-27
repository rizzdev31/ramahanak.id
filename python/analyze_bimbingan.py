#!/usr/bin/env python3
"""
ANALYZE BIMBINGAN - Script terpisah dari preprocessing.py
Khusus untuk analisis jawaban teks bebas pada fitur My Bimbingan.

PERBEDAAN DARI preprocessing.py:
  - Input: teks langsung (bukan laporan_awal_id)
  - Output: JSON ke stdout (tidak simpan ke database)
  - Analisis: HANYA kode G (konselor/gejala mental), tidak ada P atau A
  - Tidak ada NER (tidak cari nama pelaku/korban)
  - Negasi: jika ada "tidak cemas" → G001 di-skip (bukan flip)

DIPANGGIL oleh: BimbinganBerkalaService::analyzeJawabanTeksBebas()
"""

import argparse
import json
import sys
import re

# ── Import dari file yang sudah ada (hanya config, database) ──
from config import (
    NEGATION_PREFIXES,
    NEGATION_SEPARATORS,
    MAX_NEGATION_DISTANCE,
    PARTIAL_NEGATION,
)
from database import get_db

# ── Coba import Sastrawi ──────────────────────────────────────
try:
    from Sastrawi.Stemmer.StemmerFactory import StemmerFactory
    STEMMER = StemmerFactory().create_stemmer()
except ImportError:
    print("⚠ Sastrawi tidak tersedia, stemming dinonaktifkan.", file=sys.stderr)
    STEMMER = None

# ─────────────────────────────────────────────────────────────
# KONSTANTA
# ─────────────────────────────────────────────────────────────

MIN_WORD_LENGTH = 3    # Lebih rendah dari preprocessing karena curhatan lebih informal
MIN_CONFIDENCE  = 0.55 # Sedikit lebih rendah untuk menangkap lebih banyak gejala (BK yang putuskan)

# Kata yang selalu di-skip (tidak relevan)
SKIP_WORDS = {
    'tidak', 'bukan', 'yang', 'dan', 'atau',
    'ada', 'itu', 'ini', 'apa', 'siapa',
    'di', 'ke', 'dari', 'untuk', 'pada',
    'sangat', 'sekali', 'lebih', 'kurang',
    'saya', 'aku', 'kamu', 'dia', 'kami', 'kita',
    'sudah', 'belum', 'akan', 'sedang', 'masih',
    'tapi', 'tetapi', 'namun', 'karena', 'sebab',
}

# ─────────────────────────────────────────────────────────────
# TEXT PROCESSING (inline, tidak import dari preprocessing.py)
# ─────────────────────────────────────────────────────────────

def clean_text(text: str) -> str:
    """Bersihkan teks dasar."""
    if not text:
        return ""
    text = text.lower()
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


def tokenize(text: str) -> list:
    """Tokenisasi sederhana."""
    return [t for t in text.split() if t.strip()]


INDONESIAN_STOPWORDS = {
    'yang', 'untuk', 'pada', 'ke', 'para', 'namun', 'menurut',
    'antara', 'dia', 'dua', 'ia', 'seperti', 'jika',
    'sehingga', 'kembali', 'dan', 'tidak', 'ini', 'karena',
    'oleh', 'tapi', 'dengan', 'bahwa', 'juga', 'dari', 'dalam',
    'itu', 'bisa', 'ada', 'akan', 'atau', 'adalah',
    'saya', 'aku', 'kamu', 'kami', 'kita',
}


def remove_stopwords(tokens: list) -> list:
    return [t for t in tokens if t.lower() not in INDONESIAN_STOPWORDS]


def stem_tokens(tokens: list) -> list:
    if STEMMER is None:
        return tokens
    return [STEMMER.stem(token) for token in tokens]


# ─────────────────────────────────────────────────────────────
# NEGATION DETECTION (khusus untuk bimbingan)
# TIDAK flip, hanya skip jika ada negasi
# ─────────────────────────────────────────────────────────────

def has_negation_before(tokens: list, target_index: int) -> bool:
    """
    Cek apakah kata target punya negasi sebelumnya.
    Berbeda dari kode_matching.py: untuk G, negasi = skip (tidak flip).
    """
    if target_index <= 0:
        return False

    start_idx = max(0, target_index - MAX_NEGATION_DISTANCE)

    for i in range(start_idx, target_index):
        word = tokens[i]
        if word in NEGATION_PREFIXES:
            # Cek apakah ada separator yang memutus negasi
            has_separator = any(
                tokens[j] in NEGATION_SEPARATORS
                for j in range(i + 1, target_index)
            )
            if not has_separator:
                return True

    return False


def count_negations(tokens: list, target_index: int) -> int:
    """Hitung jumlah negasi sebelum target (untuk double negation)."""
    count = 0
    start_idx = max(0, target_index - MAX_NEGATION_DISTANCE)
    for i in range(start_idx, target_index):
        if tokens[i] in NEGATION_PREFIXES:
            has_separator = any(
                tokens[j] in NEGATION_SEPARATORS
                for j in range(i + 1, target_index)
            )
            if not has_separator:
                count += 1
    return count


# ─────────────────────────────────────────────────────────────
# MAIN MATCHING FUNCTION (hanya kode G)
# ─────────────────────────────────────────────────────────────

def match_gejala_dari_teks(text: str, db) -> dict:
    """
    Match teks dengan kamus kata variabel_konselor (kode G saja).
    Return: dict dengan kode_terdeteksi dan detail
    """
    try:
        # Ambil variabel konselor dari database
        variabel_list = db.get_variabel_konselor_only()

        if not variabel_list:
            print("⚠ Tidak ada data variabel_konselor", file=sys.stderr)
            return {'kode_terdeteksi': []}

        # Preprocessing teks
        text_clean  = clean_text(text)
        tokens      = tokenize(text_clean)
        tokens_ns   = remove_stopwords(tokens)
        tokens_stem = stem_tokens(tokens_ns)

        # Gunakan tokens original (sebelum stopword) untuk deteksi negasi
        # agar kata 'tidak' tidak hilang
        tokens_for_negation = tokens  # sebelum remove_stopwords

        text_lower  = text_clean
        tokens_lower = [t.lower() for t in tokens_for_negation]

        print(f"\n{'='*50}", file=sys.stderr)
        print(f"[BIMBINGAN NLP] Teks: '{text[:80]}...'", file=sys.stderr)
        print(f"Tokens (for matching): {[t.lower() for t in tokens_stem]}", file=sys.stderr)
        print(f"{'='*50}", file=sys.stderr)

        matched_candidates = []

        for variabel in variabel_list:
            kode          = variabel['kode']
            kamus_kata_str = variabel.get('kamus_kata', '')
            gangguan      = variabel.get('gangguan_mental', kode)
            rekomendasi   = variabel.get('rekomendasi', '')

            # Parse kamus kata (comma-separated)
            kamus_list = [k.strip() for k in kamus_kata_str.split(',') if k.strip()]
            kamus_valid = [k for k in kamus_list if len(k) >= MIN_WORD_LENGTH and k not in SKIP_WORDS]

            for kata in kamus_valid:
                # Word boundary matching
                pattern = r'\b' + re.escape(kata) + r'\b'

                if re.search(pattern, text_lower):
                    # Cari index kata dalam tokens
                    kata_index = -1
                    try:
                        kata_index = tokens_lower.index(kata)
                    except ValueError:
                        # Approximate: cari di text
                        words = text_lower.split()
                        for i, word in enumerate(words):
                            if re.search(pattern, word):
                                kata_index = min(i, len(tokens_lower) - 1)
                                break

                    if kata_index == -1:
                        continue

                    # ── Deteksi negasi ───────────────────────────
                    neg_count = count_negations(tokens_lower, kata_index)
                    
                    if neg_count > 0:
                        # Jika jumlah negasi ganjil → skip (kata tidak berlaku)
                        # Jika genap → double negation, kata tetap berlaku
                        if neg_count % 2 == 1:
                            print(
                                f"  ⊘ SKIP (negasi): '{kata}' ({kode}) "
                                f"[neg_count={neg_count}]",
                                file=sys.stderr
                            )
                            continue  # Skip, jangan masukkan ke hasil

                    # ── Confidence scoring ───────────────────────
                    confidence = 0.5
                    word_len   = len(kata)

                    if word_len >= 7:
                        confidence += 0.25
                    elif word_len >= 5:
                        confidence += 0.15
                    elif word_len >= MIN_WORD_LENGTH:
                        confidence += 0.05

                    # Frekuensi
                    occurrences = text_lower.count(kata)
                    if occurrences >= 2:
                        confidence += 0.1

                    if confidence >= MIN_CONFIDENCE:
                        print(
                            f"  ✓ MATCH: '{kata}' → {kode} ({gangguan}) "
                            f"[conf={confidence:.2f}]",
                            file=sys.stderr
                        )
                        matched_candidates.append({
                            'kode'         : kode,
                            'gangguan_mental': gangguan,
                            'rekomendasi'  : rekomendasi,
                            'kata_pemicu'  : kata,
                            'confidence'   : round(confidence, 2),
                            'ada_negasi'   : False,
                        })

        # ── Deduplicate: per kode, simpan semua kata pemicu ──────
        merged = {}
        for c in matched_candidates:
            kode = c['kode']
            if kode not in merged:
                merged[kode] = {
                    'kode'           : kode,
                    'gangguan_mental': c['gangguan_mental'],
                    'rekomendasi'    : c['rekomendasi'],
                    'kata_pemicu'    : [c['kata_pemicu']],
                    'confidence'     : c['confidence'],
                    'ada_negasi'     : False,
                }
            else:
                merged[kode]['kata_pemicu'].append(c['kata_pemicu'])
                # Ambil confidence tertinggi
                if c['confidence'] > merged[kode]['confidence']:
                    merged[kode]['confidence'] = c['confidence']

        result_list = sorted(
            list(merged.values()),
            key=lambda x: x['confidence'],
            reverse=True
        )

        print(f"\n✅ BIMBINGAN NLP RESULT: {len(result_list)} gejala terdeteksi", file=sys.stderr)
        for r in result_list:
            print(f"  → {r['kode']}: {r['gangguan_mental']} (kata: {r['kata_pemicu']})", file=sys.stderr)

        return {
            'kode_terdeteksi': result_list,
            'total_terdeteksi': len(result_list),
        }

    except Exception as e:
        print(f"❌ ERROR match_gejala: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        return {'kode_terdeteksi': []}


# ─────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description='Analisis teks bimbingan berkala — deteksi gejala G saja'
    )
    parser.add_argument(
        '--text',
        type=str,
        required=True,
        help='Teks jawaban santri yang akan dianalisis'
    )
    args = parser.parse_args()

    db = None
    try:
        db = get_db()

        text = args.text.strip()
        if not text:
            result = {
                'status'          : 'error',
                'error'           : 'Teks kosong',
                'kode_terdeteksi' : [],
                'total_terdeteksi': 0,
            }
            print(json.dumps(result, ensure_ascii=False))
            sys.exit(1)

        match_result = match_gejala_dari_teks(text, db)

        output = {
            'status'          : 'success',
            'teks_original'   : text,
            'kode_terdeteksi' : match_result['kode_terdeteksi'],
            'total_terdeteksi': match_result.get('total_terdeteksi', 0),
            'catatan'         : 'Hasil ini adalah SARAN untuk BK. '
                                'BK wajib konfirmasi sebelum data masuk ke pipeline.',
        }

        print(json.dumps(output, ensure_ascii=False))
        sys.stdout.flush()
        sys.exit(0)

    except Exception as e:
        import traceback
        error_result = {
            'status'          : 'error',
            'error'           : str(e),
            'kode_terdeteksi' : [],
            'total_terdeteksi': 0,
        }
        print(json.dumps(error_result, ensure_ascii=False))
        sys.stdout.flush()
        sys.exit(1)

    finally:
        if db:
            try:
                db.close()
            except Exception:
                pass


if __name__ == '__main__':
    main()