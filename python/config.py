#!/usr/bin/env python3
"""
config.py v4
Sinkron dengan Laravel .env file
"""

import os
from dotenv import load_dotenv

load_dotenv()

DB_CONFIG = {
    'host'       : os.getenv('DB_HOST', 'localhost'),
    'port'       : int(os.getenv('DB_PORT', 3306)),
    'user'       : os.getenv('DB_USERNAME', 'root'),
    'password'   : os.getenv('DB_PASSWORD', ''),
    'database'   : os.getenv('DB_DATABASE', 'db_ra'),
    'charset'    : 'utf8mb4',
    'use_unicode': True,
}

CUSTOM_STOPWORDS = [
    'saya', 'aku', 'kamu', 'dia', 'mereka', 'kami', 'kita',
    'ini', 'itu', 'tersebut',
    'ada', 'adalah', 'ialah',
    'dari', 'ke', 'pada', 'dalam', 'untuk',
    'yang', 'dan', 'atau', 'tetapi', 'namun',
]

# ===================================================================
# VERB ROOTS - kata dasar dari semua kata kerja
# Digunakan untuk verifikasi setelah strip prefix (me-/di-/ber-/ter-)
# ===================================================================

VERB_ROOTS = {
    # Kekerasan fisik
    'pukul', 'tendang', 'dorong', 'tolak', 'cubit', 'tarik',
    'lempar', 'tampar', 'injak', 'gigit', 'cekik', 'hajar',
    'tonjok', 'banting', 'jambak', 'cubit', 'cakar', 'siksa',

    # Kekerasan verbal / sosial
    'ejek', 'hina', 'maki', 'caci', 'ancam', 'paksa', 'bully',
    'tipu', 'fitnah', 'sindir', 'olok', 'adu', 'hasut',

    # Pencurian / perusakan
    'ambil', 'curi', 'rusak', 'robek', 'bakar', 'buang',
    'sembunyikan', 'hilang',

    # Positif / apresiasi
    'bantu', 'tolong', 'ajar', 'ajari', 'ajak', 'beri',
    'kasih', 'serahkan', 'wakili', 'pimpin',

    # Lainnya yang punya pelaku-korban
    'jual', 'beli', 'kirim', 'bawa', 'pinjam',
}

# ===================================================================
# TRANSITIVE VERBS - bentuk lengkap (aktif + pasif)
# Digunakan oleh NER untuk mendeteksi kata kerja dalam teks
# ===================================================================

TRANSITIVE_VERBS = {
    # Root forms
    'pukul', 'tendang', 'dorong', 'tolak', 'ejek', 'hina',
    'ancam', 'paksa', 'ambil', 'curi', 'rusak', 'bantu', 'ajar',
    'hajar', 'tonjok', 'maki', 'caci', 'tipu', 'cubit', 'lempar',
    'tarik',

    # Aktif me-
    'memukul', 'menendang', 'mendorong', 'mengejek', 'menghina',
    'mengancam', 'memaksa', 'mengambil', 'mencuri', 'merusak',
    'membantu', 'mengajari', 'menipu', 'mencubit', 'melempar',
    'menarik', 'memaki',

    # Pasif di-
    'dipukul', 'ditendang', 'didorong', 'diejek', 'dihina',
    'diancam', 'dipaksa', 'diambil', 'dicuri', 'dirusak',
    'dibantu', 'diajar', 'diajarkan', 'ditipu', 'dicubit',
    'dilempar', 'ditarik',

    # Informal / slang
    'mukul', 'nendang', 'ngejek', 'ngancam', 'maksa', 'ngambil',
    'ngerusak', 'nonjok', 'ngebantu', 'nipu',
}

# ===================================================================
# INTRANSITIVE VERBS - hanya pelaku, tidak ada korban
# Prefix ber-/ter- - tidak menghasilkan entitas korban
# ===================================================================

INTRANSITIVE_VERBS = {
    'berkelahi', 'berlari', 'berteriak', 'bertengkar', 'berdebat',
    'bermalas', 'bersembunyi', 'berulah', 'berperilaku',
    'terlambat', 'terjatuh', 'tersandung', 'terpeleset',
    'ngaret', 'bolos', 'cabut', 'kabur',
}

# ===================================================================
# VERB PREFIX RULES - aturan awalan untuk penentuan peran
# ===================================================================

VERB_PREFIX_RULES = [
    # (pattern_regex, tipe, peran_sebelum_verb, peran_setelah_verb)
    (r'^mem[bp]',   'aktif',        'pelaku', 'korban'),
    (r'^men[cdj]',  'aktif',        'pelaku', 'korban'),
    (r'^meng',      'aktif',        'pelaku', 'korban'),
    (r'^meny',      'aktif',        'pelaku', 'korban'),
    (r'^me[^n]',    'aktif',        'pelaku', 'korban'),
    (r'^me$',       'aktif',        'pelaku', 'korban'),
    (r'^di',        'pasif',        'korban', 'pelaku'),
    (r'^ber',       'intransitif',  'pelaku', None),
    (r'^ter',       'aksidental',   'pelaku', None),
]

# ===================================================================
# KODE PREFIX MAP - untuk kategorize_kode()
# Urutan: prefix panjang dulu (RA/RB/RC/DX sebelum R)
# ===================================================================

KODE_PREFIX_MAP = [
    # (prefix_atau_tuple, kategori)
    ('P',            'pelanggaran'),
    ('A',            'apresiasi'),
    ('G',            'konselor'),
    ('K',            'konsekuensi'),
    ('DX',           'diagnosis'),
    (('RA','RB','RC'), 'reward'),
    ('R',            'reward'),
]

# ===================================================================
# NEGATION CONFIG
# ===================================================================

NEGATION_PREFIXES = [
    'tidak', 'bukan', 'tak', 'nggak', 'gak', 'enggak',
    'ga', 'ndak', 'kagak'
]

FREQUENCY_MODIFIERS = [
    'pernah', 'selalu', 'sering', 'jarang', 'kadang',
    'sempat', 'biasa', 'kerap'
]

NEGATION_SEPARATORS = [
    'yang', 'tapi', 'tetapi', 'namun', 'karena', 'sebab',
    'meskipun', 'walaupun', 'jika', 'kalau', 'ketika',
    ',', ';', '.'
]

MAX_NEGATION_DISTANCE = 3

PARTIAL_NEGATION = [
    'kurang', 'agak', 'sedikit', 'cukup', 'lumayan'
]

EMPHASIS_WORDS = [
    'sama sekali', 'sangat', 'sekali', 'banget', 'amat',
    'betul-betul', 'sungguh', 'benar-benar'
]