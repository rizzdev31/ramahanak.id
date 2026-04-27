#!/usr/bin/env python3
"""
KODE MATCHING v4
===================================================================
UPGRADE v4:

1. categorize_kode() LENGKAP:
   Tambah kategori DX (diagnosis), R/RA/RB/RC (reward).
   Urutan cek: prefix panjang dulu (RA/RB/RC/DX sebelum R/K).
   Sinkron dengan KODE_PREFIX_MAP di config.py.

2. PHRASE MATCHING (multi-kata):
   Frase seperti 'tepat waktu', 'tidak hadir', 'jam malam'
   dicocokkan sebagai 1 unit sebelum single-word matching.
   Mencegah partial false match.

3. SIGNATURE match_kode_variabel() TIDAK BERUBAH:
   Tetap (text, tokens_clean, db, tokens_stemmed=None).
   Backward compatible dengan preprocessing.py v3.

4. HELPER get_variabel_konselor_only():
   Dibutuhkan analyze_bimbingan.py - tambahkan ke database.py
   (catatan ada di fungsi ini).

5. DISTRIBUSI KODE ke pelaku/korban (distribute_kode):
   Fungsi baru untuk menentukan kode mana milik pelaku / korban
   berdasarkan semantik kategori.
===================================================================
"""

import sys
import re
from config import (
    NEGATION_PREFIXES,
    FREQUENCY_MODIFIERS,
    NEGATION_SEPARATORS,
    MAX_NEGATION_DISTANCE,
    PARTIAL_NEGATION,
    KODE_PREFIX_MAP,
)

# ===================================================================
# CONSTANTS
# ===================================================================

MIN_WORD_LENGTH = 3
MIN_CONFIDENCE  = 0.5

SKIP_WORDS = {
    'tidak', 'bukan', 'yang', 'dan', 'atau',
    'ada', 'itu', 'ini', 'apa', 'siapa',
    'di', 'ke', 'dari', 'untuk', 'pada',
    'sangat', 'sekali', 'lebih', 'kurang',
    'saya', 'aku', 'kamu', 'dia', 'mereka',
    'kami', 'kita', 'ia', 'kalian',
}


# ===================================================================
# VALIDATORS
# ===================================================================

def is_valid_kata(kata):
    """Cek apakah kata layak sebagai kunci matching."""
    if not kata or len(kata) < MIN_WORD_LENGTH:
        return False
    if kata.lower() in SKIP_WORDS:
        return False
    if kata.isdigit():
        return False
    return True


# ===================================================================
# CONFIDENCE SCORING
# ===================================================================

def calculate_match_confidence(kata, tokens, kata_index):
    """
    Hitung confidence score (0.0 - 1.0).

    Faktor:
    1. Panjang kata     -> lebih panjang = lebih spesifik
    2. Frekuensi        -> lebih unik = confidence lebih tinggi
    3. Posisi           -> bukan kata paling pinggir
    4. Multi-kata bonus -> frase lebih spesifik dari kata tunggal
    """
    # Base sedikit lebih tinggi untuk kata >= 4 huruf
    confidence = 0.55 if len(kata) >= 4 else 0.5

    word_len = len(kata)
    if word_len >= 10:
        confidence += 0.35  # frase panjang = sangat spesifik
    elif word_len >= 7:
        confidence += 0.3
    elif word_len >= 5:
        confidence += 0.2
    elif word_len >= 4:
        confidence += 0.1
    elif word_len >= 3:
        confidence += 0.05

    # Frase (mengandung spasi) dapat bonus spesifisitas
    if ' ' in kata:
        confidence += 0.15

    # Keunikan dalam teks
    occurrences = tokens.count(kata)
    if occurrences == 1:
        confidence += 0.2
    elif occurrences == 2:
        confidence += 0.1

    # Posisi
    if 0 < kata_index < len(tokens) - 1:
        confidence += 0.1

    return min(1.0, confidence)


# ===================================================================
# NEGATION DETECTION
# ===================================================================

def has_negation_prefix(tokens_clean, target_index):
    """
    Deteksi negasi sebelum kata target.
    tokens_clean HARUS dari teks asli sebelum stopword removal.
    """
    if target_index <= 0:
        return _no_negation()

    start_idx = max(0, target_index - MAX_NEGATION_DISTANCE)

    for i in range(start_idx, target_index):
        word = tokens_clean[i]

        if word in NEGATION_PREFIXES:
            has_separator = any(
                tokens_clean[j] in NEGATION_SEPARATORS
                for j in range(i + 1, target_index)
            )
            if not has_separator:
                distance   = target_index - i
                confidence = max(0.0, 1.0 - ((distance - 1) * 0.33))
                return {
                    'has_negation'  : True,
                    'negation_word' : word,
                    'negation_index': i,
                    'distance'      : distance,
                    'confidence'    : confidence,
                    'type'          : 'full',
                }

        elif word in PARTIAL_NEGATION:
            distance = target_index - i
            if distance <= 2:
                return {
                    'has_negation'  : True,
                    'negation_word' : word,
                    'negation_index': i,
                    'distance'      : distance,
                    'confidence'    : 0.5,
                    'type'          : 'partial',
                }

    return _no_negation()


def count_negations_before(tokens_clean, target_index):
    """Hitung jumlah negasi sebelum target (untuk double negation)."""
    count     = 0
    start_idx = max(0, target_index - MAX_NEGATION_DISTANCE)
    for i in range(start_idx, target_index):
        if tokens_clean[i] in NEGATION_PREFIXES:
            has_sep = any(
                tokens_clean[j] in NEGATION_SEPARATORS
                for j in range(i + 1, target_index)
            )
            if not has_sep:
                count += 1
    return count


def _no_negation():
    return {
        'has_negation'  : False,
        'negation_word' : None,
        'negation_index': -1,
        'distance'      : 0,
        'confidence'    : 0.0,
        'type'          : 'none',
    }


# ===================================================================
# INDEX FINDER
# ===================================================================

def _find_kata_index(kata, tokens_lower, text_lower):
    """Cari posisi kata dalam tokens. Return index atau -1."""
    try:
        return tokens_lower.index(kata)
    except ValueError:
        pass

    pattern = r'\b' + re.escape(kata) + r'\b'
    for i, token in enumerate(tokens_lower):
        if re.search(pattern, token):
            return i

    return -1


# ===================================================================
# PHRASE MATCHING HELPER
# ===================================================================

def _find_phrase_in_tokens(phrase, tokens_lower):
    """
    Cari posisi frase multi-kata dalam tokens.
    Return index kata pertama atau -1.
    """
    phrase_words = phrase.split()
    n = len(phrase_words)
    for i in range(len(tokens_lower) - n + 1):
        if tokens_lower[i:i + n] == phrase_words:
            return i
    return -1


# ===================================================================
# MAIN MATCHING FUNCTION - v4
# ===================================================================

def match_kode_variabel(text, tokens_clean, db, tokens_stemmed=None):
    """
    Match teks laporan dengan variabel kata di database.

    Parameter (tidak berubah dari v3 agar backward compatible):
    - text          : teks laporan asli
    - tokens_clean  : token SEBELUM stopword removal (kritis untuk negation)
    - db            : DatabaseHelper instance
    - tokens_stemmed: (opsional) fallback token setelah stemming
    """
    try:
        variabel_data = db.get_all_variabel_with_kamus()

        text_lower         = text.lower()
        tokens_clean_lower = [t.lower() for t in tokens_clean]
        tokens_fallback    = (
            [t.lower() for t in tokens_stemmed]
            if tokens_stemmed else tokens_clean_lower
        )

        matched_candidates = []
        negation_log       = []

        print(f"\n{'='*60}", file=sys.stderr)
        print(f"MATCHING v4: '{text}'", file=sys.stderr)
        print(f"Tokens clean  : {tokens_clean_lower}", file=sys.stderr)
        print(f"Variabel loaded: {len(variabel_data)}", file=sys.stderr)
        print(f"{'='*60}", file=sys.stderr)

        for variabel in variabel_data:
            kode             = variabel['kode']
            kategori         = variabel.get('kategori', '')
            kamus_kata_str   = variabel.get('kamus_kata', '')
            negatable        = variabel.get('negatable', False)
            counterpart_kode = variabel.get('counterpart_kode')

            kamus_list  = [k.strip().lower() for k in kamus_kata_str.split(',') if k.strip()]
            kamus_valid = [k for k in kamus_list if is_valid_kata(k)]

            if not kamus_valid:
                continue

            # Pisahkan frase (multi-kata) dan kata tunggal
            frase_list  = [k for k in kamus_valid if ' ' in k]
            single_list = [k for k in kamus_valid if ' ' not in k]

            # Gabungkan: frase dulu (lebih spesifik), lalu kata tunggal
            ordered_list = frase_list + single_list

            matched_this_variabel = set()  # Hindari duplikat per variabel

            for kata in ordered_list:
                # Skip jika variabel ini sudah matched (frase lebih spesifik)
                if kode in matched_this_variabel:
                    continue

                # Regex word boundary matching
                pattern = r'\b' + re.escape(kata) + r'\b'
                if not re.search(pattern, text_lower, re.IGNORECASE):
                    continue

                # Cari index - frase pakai _find_phrase_in_tokens
                if ' ' in kata:
                    kata_index = _find_phrase_in_tokens(kata, tokens_clean_lower)
                    if kata_index < 0:
                        kata_index = _find_phrase_in_tokens(kata, tokens_fallback)
                else:
                    kata_index_c = _find_kata_index(kata, tokens_clean_lower, text_lower)
                    kata_index_f = _find_kata_index(kata, tokens_fallback, text_lower)
                    kata_index   = kata_index_c if kata_index_c >= 0 else kata_index_f

                # Estimasi dari text split jika belum ketemu
                if kata_index < 0:
                    words = text_lower.split()
                    for idx, word in enumerate(words):
                        if re.search(pattern, word, re.IGNORECASE):
                            kata_index = idx
                            break

                if kata_index < 0:
                    print(f"   '{kata}' match di text, tidak di tokens, skip", file=sys.stderr)
                    continue

                # Confidence scoring
                match_conf = calculate_match_confidence(kata, tokens_clean_lower, kata_index)

                # Negation detection (selalu pakai tokens_clean)
                neg_index     = kata_index
                negation_info = has_negation_prefix(tokens_clean_lower, neg_index)

                final_kode    = kode
                flip_happened = False

                if negation_info['has_negation'] and negatable:
                    neg_count   = count_negations_before(tokens_clean_lower, neg_index)
                    should_flip = (neg_count % 2 == 1)

                    if should_flip and negation_info['type'] == 'full' and counterpart_kode:
                        final_kode    = counterpart_kode
                        flip_happened = True

                        negation_log.append({
                            'original_kata'      : kata,
                            'original_kode'      : kode,
                            'flipped_kode'       : final_kode,
                            'negation_word'      : negation_info['negation_word'],
                            'negation_count'     : neg_count,
                            'negation_confidence': negation_info['confidence'],
                            'match_confidence'   : match_conf,
                            'reason'             : 'negation_prefix_flip',
                        })
                        print(
                            f"  FLIP: '{kata}' ({kode}) -> {final_kode} "
                            f"[match:{match_conf:.2f}, neg:{negation_info['confidence']:.2f}]",
                            file=sys.stderr,
                        )
                    elif negation_info['type'] == 'partial':
                        print(f"  PARTIAL NEG: '{kata}' ({kode}) no flip [{match_conf:.2f}]", file=sys.stderr)
                    else:
                        print(f"  DOUBLE NEG: '{kata}' ({kode}) no flip [{match_conf:.2f}]", file=sys.stderr)
                else:
                    print(f"  OK: '{kata}' -> {final_kode} ({kategori}) [{match_conf:.2f}]", file=sys.stderr)

                matched_candidates.append({
                    'kode'      : final_kode,
                    'kata'      : kata,
                    'kategori'  : kategori,
                    'confidence': match_conf,
                    'flip'      : flip_happened,
                })
                matched_this_variabel.add(kode)

        # Filter by confidence
        print(f"\n{'='*60}", file=sys.stderr)
        print(f"FILTERING: {len(matched_candidates)} candidates (>={MIN_CONFIDENCE})", file=sys.stderr)

        high_conf = [c for c in matched_candidates if c['confidence'] >= MIN_CONFIDENCE]
        print(f"After filter: {len(high_conf)}", file=sys.stderr)

        # Deduplicate kode
        matched_kode_set = set()
        for c in high_conf:
            matched_kode_set.add(c['kode'])
            flag = "FLIP" if c['flip'] else "OK"
            print(f"  [{flag}] {c['kode']} <- '{c['kata']}' [{c['confidence']:.2f}]", file=sys.stderr)

        matched_kode = sorted(list(matched_kode_set))

        print(f"\n{'='*60}", file=sys.stderr)
        if matched_kode:
            print(f"FINAL: {len(matched_kode)} kode -> {matched_kode}", file=sys.stderr)
        else:
            print("NO MATCHES", file=sys.stderr)
        print(f"{'='*60}\n", file=sys.stderr)

        return {
            'matched_kode': matched_kode,
            'negation_log': negation_log,
        }

    except Exception as e:
        print(f"ERROR in match_kode_variabel: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        return {'matched_kode': [], 'negation_log': []}


# ===================================================================
# KATEGORISASI KODE - v4 (lengkap: DX, R, RA, RB, RC)
# ===================================================================

def categorize_kode(kode_list):
    """
    Kategorikan kode berdasarkan prefix.

    Prefix yang didukung (sinkron dengan KODE_PREFIX_MAP di config.py):
      P   -> pelanggaran
      A   -> apresiasi
      G   -> konselor (gejala)
      K   -> konsekuensi
      DX  -> diagnosis
      RA/RB/RC/R -> reward

    URUTAN CEK KRITIS:
      RA/RB/RC harus dicek SEBELUM R (karena RA startswith('R') juga).
      DX harus dicek SEBELUM D (jika ada).
    """
    result = {
        'pelanggaran': [],
        'apresiasi'  : [],
        'konselor'   : [],
        'konsekuensi': [],
        'diagnosis'  : [],
        'reward'     : [],
    }

    for kode in kode_list:
        if kode.startswith('P'):
            result['pelanggaran'].append(kode)
        elif kode.startswith('A'):
            result['apresiasi'].append(kode)
        elif kode.startswith('G'):
            result['konselor'].append(kode)
        elif kode.startswith('K'):
            result['konsekuensi'].append(kode)
        elif kode.startswith('DX'):
            result['diagnosis'].append(kode)
        # RA/RB/RC HARUS sebelum R
        elif kode.startswith(('RA', 'RB', 'RC')):
            result['reward'].append(kode)
        elif kode.startswith('R'):
            result['reward'].append(kode)
        # Else: kode tidak dikenal, abaikan

    return result


# ===================================================================
# DISTRIBUSI KODE KE PELAKU / KORBAN
# ===================================================================

def distribute_kode(kode_list, pelaku, korban):
    """
    Distribusikan kode matched ke pelaku atau korban berdasarkan
    semantik kategori kode.

    Logika:
    - P (pelanggaran)  -> pelaku (yang melakukan pelanggaran)
    - A (apresiasi)    -> pelaku/subjek (yang berprestasi)
    - K (konsekuensi)  -> pelaku (yang mendapat konsekuensi)
    - R/RA/RB/RC       -> pelaku (yang mendapat reward)
    - G (gejala)       -> korban (yang mengalami gejala mental)
    - DX (diagnosis)   -> korban (yang didiagnosis)

    Jika tidak ada korban, semua kode masuk ke pelaku.

    Return: {
        'pelaku_kode': [...],
        'korban_kode': [...],
    }
    """
    by_type = categorize_kode(kode_list)

    pelaku_kode = (
        by_type['pelanggaran'] +
        by_type['apresiasi']   +
        by_type['konsekuensi'] +
        by_type['reward']
    )
    korban_kode = (
        by_type['konselor']  +
        by_type['diagnosis']
    )

    # Jika tidak ada korban, semua masuk ke pelaku
    if not korban:
        pelaku_kode = pelaku_kode + korban_kode
        korban_kode = []

    return {
        'pelaku_kode': pelaku_kode,
        'korban_kode': korban_kode,
    }


# ===================================================================
# FORMAT LAPORAN
# ===================================================================

def build_format_laporan(pelaku, verb_root, korban):
    """
    Bangun string format laporan ringkas.
    Contoh: "Ahmad Budi -memukul- Reza"
    """
    bagian = []
    if pelaku:
        bagian.append(pelaku)
    if verb_root:
        bagian.append(f"-{verb_root}-")
    if korban:
        bagian.append(korban)
    return " ".join(bagian) if bagian else "-"