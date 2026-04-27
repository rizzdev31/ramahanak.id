#!/usr/bin/env python3
"""
PREPROCESSING SYSTEM v4
===================================================================
UPGRADE v4 (sinkron dengan ner.py v4 dan kode_matching.py v4):

1. SINKRON DENGAN kategorize_kode v4:
   Output kode_by_type sekarang punya semua kategori:
   pelanggaran, apresiasi, konselor, konsekuensi, diagnosis, reward.

2. DISTRIBUSI KODE (distribute_kode):
   Output baru: pelaku_kode dan korban_kode berdasarkan semantik.

3. FORMAT LAPORAN (build_format_laporan):
   Output baru: format_laporan = "Ahmad Budi -memukul- Reza"

4. VERB INFO:
   Output baru: verb_info dari NER v4 (tipe, awalan, root).

5. BACKWARD COMPATIBLE:
   Field lama (pelaku_nama, korban_nama, kode_matched, dll) tetap ada.
   Controller Laravel tidak perlu diubah.

ALUR PIPELINE v4:
  text_original
    |-- clean_text()         -> text_cleaned
    |-- tokenize()           -> tokens (= tokens_clean, TANPA stopword removal)
    |-- remove_stopwords()   -> tokens_no_stopwords
    |-- stem_tokens()        -> tokens_stemmed
    |
    |-- NER v4:
    |     set_kamus_words()  <- inject kata kamus dari DB
    |     extract_compound_names() <- nama 1-2 kata
    |     detect_verb_with_role()  <- awalan me-/di-/ber-/ter-
    |     validate_with_database() <- cari santri di DB
    |
    |-- KODE MATCHING v4:
    |     match_kode_variabel(text, tokens, db, tokens_stemmed)
    |     categorize_kode()  <- P/A/G/K/DX/R/RA/RB/RC
    |     distribute_kode()  <- pelaku_kode & korban_kode
    |
    |-- BUILD RESULT:
          format_laporan, entitas, verb_info, semua field lama
===================================================================
"""

import argparse
import json
import sys
import re
from datetime import datetime

from database import get_db
from ner      import get_ner
from kode_matching import (
    match_kode_variabel,
    categorize_kode,
    distribute_kode,
    build_format_laporan,
)
from config import TRANSITIVE_VERBS

try:
    from Sastrawi.Stemmer.StemmerFactory import StemmerFactory
    STEMMER = StemmerFactory().create_stemmer()
except ImportError:
    print("Warning: Sastrawi not installed. Stemming disabled.", file=sys.stderr)
    STEMMER = None


# ===================================================================
# TEXT PROCESSING
# ===================================================================

def clean_text(text):
    """Lowercase + normalize whitespace."""
    if not text:
        return ""
    text = text.lower()
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


def tokenize(text):
    """Split teks menjadi token per kata."""
    if not text:
        return []
    return [t for t in text.split() if t.strip()]


INDONESIAN_STOPWORDS = {
    'yang', 'untuk', 'pada', 'ke', 'para', 'namun', 'menurut',
    'antara', 'dia', 'dua', 'ia', 'seperti', 'jika',
    'sehingga', 'kembali', 'dan', 'tidak', 'ini', 'karena',
    'oleh', 'tapi', 'dengan', 'bahwa', 'juga', 'dari', 'dalam',
    'itu', 'bisa', 'ada', 'akan', 'atau', 'adalah',
}
# CATATAN: 'tidak' ada di stopwords DI ATAS, tapi tokenize() TIDAK
# menghapus stopwords. remove_stopwords() hanya dipakai untuk
# tokens_no_stopwords -> tokens_stemmed (untuk NER fallback).
# tokens (= tokens_clean) yang dikirim ke kode_matching TIDAK
# dibuang stopword-nya agar kata negasi ('tidak') tetap ada.

def remove_stopwords(tokens):
    return [t for t in tokens if t.lower() not in INDONESIAN_STOPWORDS] if tokens else []


def stem_tokens(tokens):
    if not tokens:
        return []
    if STEMMER is None:
        return tokens
    return [STEMMER.stem(token) for token in tokens]


# ===================================================================
# MAIN PREPROCESSING
# ===================================================================

def preprocess_laporan(laporan_id, save_to_db=False):
    """Main preprocessing function v4."""
    db = None

    try:
        #  STEP 1: Connect DB & ambil laporan 
        db      = get_db()
        laporan = db.get_laporan_awal(laporan_id)

        if not laporan:
            result = {
                'status'    : 'error',
                'error'     : f'Laporan {laporan_id} not found',
                'laporan_id': laporan_id,
            }
            print(json.dumps(result, ensure_ascii=False))
            return result

        text_original = laporan['text_laporan']

        #  STEP 2: Text Cleaning 
        text_cleaned = clean_text(text_original)

        #  STEP 3: Tokenization 
        # tokens = tokens_clean (SEBELUM stopword removal)
        # Kritis untuk negation detection di kode_matching
        tokens = tokenize(text_cleaned)

        #  STEP 4: Stopword Removal 
        tokens_no_stopwords = remove_stopwords(tokens)

        #  STEP 5: Stemming 
        tokens_stemmed = stem_tokens(tokens_no_stopwords)

        #  STEP 6: NER v4 
        ner = get_ner()

        # Inject kamus words: cegah kata kamus dianggap nama orang
        kamus_words = db.get_all_kamus_words_flat()
        ner.set_kamus_words(kamus_words)

        # extract_entities v4: nama 2 kata + deteksi verb via awalan
        entities           = ner.extract_entities(text_original, tokens_stemmed)
        entities_validated = ner.validate_with_database(entities, db)

        # Ambil verb_info dari entities (v4 bonus)
        verb_info = entities.get('verb_info')

        #  STEP 7: Kode Matching v4 
        # tokens (tokens_clean, sebelum stopword) sebagai param ke-2
        # tokens_stemmed sebagai fallback param ke-4
        match_result = match_kode_variabel(
            text_original,
            tokens,           # tokens_clean
            db,
            tokens_stemmed,   # fallback
        )

        kode_matched = match_result.get('matched_kode', [])
        negation_log = match_result.get('negation_log', [])

        # Kategorisasi kode v4 (termasuk DX, R, RA, RB, RC)
        kode_by_type = categorize_kode(kode_matched)

        #  STEP 8: Distribusi kode ke pelaku / korban 
        pelaku_nama = entities_validated.get('pelaku_nama')
        korban_nama = entities_validated.get('korban_nama')

        kode_distribution = distribute_kode(kode_matched, pelaku_nama, korban_nama)

        #  STEP 9: Format laporan ringkas 
        kata_kerja    = entities_validated.get('kata_kerja_dasar')
        format_lpr    = build_format_laporan(pelaku_nama, kata_kerja, korban_nama)

        #  STEP 10: Build result 
        preprocessing_data = {
            'original'    : text_original,
            'case_folding': text_cleaned,
            'cleaning'    : text_cleaned,
            'tokens'      : tokens,
            'no_stopwords': tokens_no_stopwords,
            'stemmed'     : tokens_stemmed,
            'negation_log': negation_log,
        }

        result = {
            'status'          : 'success',
            'laporan_id'      : laporan_id,
            'jenis_laporan'   : laporan['jenis_laporan'],

            # === Kode (backward compat) ===
            'kode_matched'    : kode_matched,
            'kode_pelanggaran': kode_by_type['pelanggaran'],
            'kode_apresiasi'  : kode_by_type['apresiasi'],
            'kode_konselor'   : kode_by_type['konselor'],

            # === Kode kategori BARU (v4) ===
            'kode_konsekuensi': kode_by_type['konsekuensi'],
            'kode_diagnosis'  : kode_by_type['diagnosis'],
            'kode_reward'     : kode_by_type['reward'],

            # === Entitas (backward compat) ===
            'pelaku_nama'         : pelaku_nama,
            'pelaku_santri_id'    : entities_validated.get('pelaku_santri_id'),
            'korban_nama'         : korban_nama,
            'korban_santri_id'    : entities_validated.get('korban_santri_id'),
            'kata_kerja_dasar'    : kata_kerja,

            # === Distribusi kode BARU (v4) ===
            'pelaku_kode'     : kode_distribution['pelaku_kode'],
            'korban_kode'     : kode_distribution['korban_kode'],

            # === Format laporan BARU (v4) ===
            'format_laporan'  : format_lpr,

            # === Verb detail BARU (v4) ===
            'verb_info'       : {
                'kata'         : verb_info.get('kata')   if verb_info else kata_kerja,
                'root'         : verb_info.get('root')   if verb_info else kata_kerja,
                'awalan'       : verb_info.get('awalan') if verb_info else '',
                'tipe'         : verb_info.get('tipe')   if verb_info else 'unknown',
            },

            # === Entitas terstruktur BARU (v4) ===
            'entitas'         : _build_entitas(
                pelaku_nama,
                entities_validated.get('pelaku_santri_id'),
                kode_distribution['pelaku_kode'],
                korban_nama,
                entities_validated.get('korban_santri_id'),
                kode_distribution['korban_kode'],
            ),

            # === Preprocessing steps ===
            'preprocessing_data': preprocessing_data,
            'negation_log'      : negation_log,
            'timestamp'         : datetime.now().isoformat(),
        }

        #  STEP 11: Simpan ke DB 
        if save_to_db:
            hasil_id = db.save_hasil_preprocessing(result)
            result['hasil_preprocessing_id'] = hasil_id
            result['saved_to_db']            = True
        else:
            result['saved_to_db'] = False

        #  STEP 12: Output JSON 
        print(json.dumps(result, ensure_ascii=False, indent=2))
        sys.stdout.flush()

        return result

    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()

        print(f"FATAL ERROR: {e}", file=sys.stderr)
        print(error_trace, file=sys.stderr)

        error_result = {
            'status'     : 'error',
            'error'      : str(e),
            'error_trace': error_trace,
            'laporan_id' : laporan_id,
            'timestamp'  : datetime.now().isoformat(),
        }

        print(json.dumps(error_result, ensure_ascii=False, indent=2))
        sys.stdout.flush()

        if save_to_db and db:
            try:
                db.save_hasil_preprocessing({
                    'laporan_id'        : laporan_id,
                    'kode_matched'      : [],
                    'pelaku_nama'       : None,
                    'pelaku_santri_id'  : None,
                    'korban_nama'       : None,
                    'korban_santri_id'  : None,
                    'kata_kerja_dasar'  : None,
                    'preprocessing_data': {'error': str(e)},
                    'error_message'     : str(e),
                })
            except Exception:
                pass

        return error_result

    finally:
        if db:
            try:
                db.close()
            except Exception:
                pass


# ===================================================================
# HELPER: bangun struktur entitas
# ===================================================================

def _build_entitas(pelaku_nama, pelaku_id, pelaku_kode,
                   korban_nama, korban_id, korban_kode):
    """Bangun list entitas terstruktur untuk output v4."""
    entitas = []

    if pelaku_nama:
        entitas.append({
            'nama'     : pelaku_nama,
            'peran'    : 'pelaku',
            'santri_id': pelaku_id,
            'kode'     : pelaku_kode,
        })

    if korban_nama:
        entitas.append({
            'nama'     : korban_nama,
            'peran'    : 'korban',
            'santri_id': korban_id,
            'kode'     : korban_kode,
        })

    return entitas


# ===================================================================
# CLI ENTRY POINT
# ===================================================================

def main():
    parser = argparse.ArgumentParser(description='Preprocessing System v4')

    parser.add_argument('--laporan_id', type=int, required=True,
                        help='ID laporan_awal yang akan diproses')
    parser.add_argument('--save-to-db', action='store_true',
                        help='Simpan hasil ke database')
    parser.add_argument('--pretty', action='store_true',
                        help='Pretty print JSON output')

    args = parser.parse_args()

    result = preprocess_laporan(
        laporan_id=args.laporan_id,
        save_to_db=args.save_to_db,
    )

    sys.exit(0 if result.get('status') == 'success' else 1)


if __name__ == '__main__':
    main()