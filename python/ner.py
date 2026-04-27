#!/usr/bin/env python3
"""
NER v4 - Named Entity Recognition
===================================================================
UPGRADE v4:

1. NAMA 2 KATA (extract_compound_names)
   Kata kapital berurutan digabung menjadi 1 unit nama.
   "Ahmad Budi memukul Reza" -> ['Ahmad Budi', 'Reza']
   Batasan desain: maks 2 kata per nama.

2. DETEKSI VERB VIA AWALAN LANGSUNG (detect_verb_with_role)
   Cek awalan me-/di-/ber-/ter- dari kata asli di teks.
   Tidak bergantung stemming atau daftar TRANSITIVE_VERBS.
   Verifikasi root word via VERB_ROOTS untuk akurasi.

3. PENENTUAN PERAN BERDASARKAN AWALAN:
   me-  -> nama sebelum = PELAKU, nama sesudah = KORBAN
   di-  -> nama sebelum = KORBAN, nama sesudah = PELAKU
   ber- -> hanya PELAKU, tidak ada korban
   ter- -> hanya PELAKU (aksidental)

4. BACKWARD COMPATIBLE:
   Semua field output lama tetap ada.
   find_verb_position() masih ada sebagai fallback.

5. KAMUS EXCLUSION (set_kamus_words) - dari v3, dipertahankan.
   Mencegah kata kamus (ngaret, bolos) dianggap nama orang.
===================================================================
"""

import re
import sys
from config import (
    TRANSITIVE_VERBS,
    INTRANSITIVE_VERBS,
    VERB_PREFIX_RULES,
    VERB_ROOTS,
)


class SimpleNER:
    """NER v4 - posisi relatif terhadap kata kerja + nama 2 kata."""

    def __init__(self):
        self.transitive_verbs   = TRANSITIVE_VERBS
        self.intransitive_verbs = INTRANSITIVE_VERBS
        self.verb_prefix_rules  = VERB_PREFIX_RULES
        self.verb_roots         = VERB_ROOTS
        self.common_words       = self._build_common_words()
        self.kamus_words        = set()

    # ------------------------------------------------------------------
    # PUBLIC: inject kamus variabel ke NER exclusion list
    # ------------------------------------------------------------------

    def set_kamus_words(self, words: set):
        """
        Inject kata kamus variabel (ngaret, bolos, dll) ke exclusion list.
        Dipanggil dari preprocessing.py setelah koneksi DB dibuat.
        """
        self.kamus_words = {w.lower().strip() for w in words if w}
        print(
            f" NER kamus_words loaded: {len(self.kamus_words)} kata",
            file=sys.stderr,
        )

    # ------------------------------------------------------------------
    # CORE: deteksi kata kerja via awalan langsung (v4)
    # ------------------------------------------------------------------

    def detect_verb_with_role(self, text):
        """
        Scan teks dan cari kata kerja berdasarkan awalan me-/di-/ber-/ter-.
        Verifikasi root word via VERB_ROOTS untuk memastikan ini kata kerja.

        Return:
            dict | None:
                {
                  'kata'         : str   -- kata asli (misal 'memukul')
                  'posisi'       : int   -- index kata dalam text.split()
                  'tipe'         : str   -- 'aktif'|'pasif'|'intransitif'|'aksidental'
                  'peran_sebelum': str   -- 'pelaku'|'korban'
                  'peran_sesudah': str|None
                  'root'         : str   -- root word (misal 'pukul')
                  'awalan'       : str   -- awalan terdeteksi
                }
        """
        words = text.lower().split()

        # Cek kata kerja intransitif dulu (tidak butuh korban)
        for i, word in enumerate(words):
            if word in self.intransitive_verbs:
                print(
                    f" Intransitive verb at pos {i}: '{word}'",
                    file=sys.stderr,
                )
                return {
                    'kata'         : word,
                    'posisi'       : i,
                    'tipe'         : 'intransitif',
                    'peran_sebelum': 'pelaku',
                    'peran_sesudah': None,
                    'root'         : word,
                    'awalan'       : '',
                }

        # Cek berdasarkan VERB_PREFIX_RULES
        for i, word in enumerate(words):
            for pattern, tipe, peran_sblm, peran_ssdh in self.verb_prefix_rules:
                if re.match(pattern, word):
                    root = self._strip_prefix(word)
                    # Verifikasi: root harus ada di VERB_ROOTS
                    # atau kata asli ada di TRANSITIVE_VERBS
                    if root in self.verb_roots or word in self.transitive_verbs:
                        awalan = re.match(r'^(me[mnrylw]?|mem[bp]?|men[cdj]?|meng|meny|di|ber|ter)', word)
                        awalan_str = awalan.group(0) if awalan else ''
                        print(
                            f" Verb at pos {i}: '{word}' (tipe={tipe}, "
                            f"root='{root}', awalan='{awalan_str}')",
                            file=sys.stderr,
                        )
                        return {
                            'kata'         : word,
                            'posisi'       : i,
                            'tipe'         : tipe,
                            'peran_sebelum': peran_sblm,
                            'peran_sesudah': peran_ssdh,
                            'root'         : root,
                            'awalan'       : awalan_str,
                        }

        # Fallback: cek TRANSITIVE_VERBS langsung (slang/informal)
        for i, word in enumerate(words):
            if word in self.transitive_verbs:
                vtype = self._get_verb_type(word)
                peran_sblm, peran_ssdh = self._get_roles_from_type(vtype)
                print(
                    f" Fallback verb at pos {i}: '{word}' (tipe={vtype})",
                    file=sys.stderr,
                )
                return {
                    'kata'         : word,
                    'posisi'       : i,
                    'tipe'         : vtype,
                    'peran_sebelum': peran_sblm,
                    'peran_sesudah': peran_ssdh,
                    'root'         : word,
                    'awalan'       : '',
                }

        print(" No verb found", file=sys.stderr)
        return None

    # ------------------------------------------------------------------
    # CORE: ekstrak nama (dengan dukungan nama 2 kata) (v4)
    # ------------------------------------------------------------------

    def extract_compound_names(self, text):
        """
        Ekstrak nama dari teks dengan dukungan nama 2 kata.

        Prinsip:
        - Kata kapital berurutan + keduanya bukan common_words/kamus_words
          -> digabung menjadi 1 nama (maks 2 kata)
        - Kata kapital tunggal -> nama 1 kata
        - Lowercase 2-8 huruf bukan common/kamus -> nama 1 kata

        Contoh:
          "Ahmad Budi memukul Reza" -> ['Ahmad Budi', 'Reza']
          "Siti Nur membantu Ahmad" -> ['Siti Nur', 'Ahmad']
          "Ahmad memukul Reza"      -> ['Ahmad', 'Reza']
        """
        words  = text.split()
        names  = []
        i      = 0

        while i < len(words):
            word = words[i]

            if self._is_name_candidate(word):
                # Cek apakah kata berikutnya juga kandidat nama
                if (i + 1 < len(words)
                        and self._is_name_candidate(words[i + 1])
                        and not self._is_verb_word(words[i + 1])):
                    # Gabungkan jadi nama 2 kata
                    compound = f"{word} {words[i + 1]}"
                    names.append(compound)
                    i += 2
                    print(f" Compound name: '{compound}'", file=sys.stderr)
                    continue
                else:
                    names.append(word)

            elif re.match(r'^[a-z]{2,8}$', word):
                if (word not in self.common_words
                        and not self._is_kamus_word(word)):
                    names.append(word.capitalize())

            i += 1

        # Deduplicate (case-insensitive)
        seen   = set()
        unique = []
        for name in names:
            if name.lower() not in seen:
                seen.add(name.lower())
                unique.append(name)

        print(f" Extracted names: {unique}", file=sys.stderr)
        return unique

    # ------------------------------------------------------------------
    # MAIN: extract_entities (v4 - pakai detect_verb_with_role)
    # ------------------------------------------------------------------

    def extract_entities(self, text_original, tokens_stemmed):
        """
        Ekstrak pelaku dan korban dari teks laporan.

        v4: Menggunakan detect_verb_with_role() sebagai primary detector.
            extract_compound_names() untuk nama 2 kata.
            Fallback ke find_verb_position() jika detect_verb gagal.
        """
        # Ekstrak nama (v4: compound support)
        names = self.extract_compound_names(text_original)

        if not names:
            print(" No names found", file=sys.stderr)
            return {'pelaku': None, 'korban': None, 'kata_kerja': None}

        # Deteksi kata kerja via awalan (v4)
        verb_info = self.detect_verb_with_role(text_original)

        # Fallback ke method lama jika v4 gagal
        if verb_info is None:
            verb_index, verb_word, verb_type, kata_kerja = self.find_verb_position(
                text_original, tokens_stemmed
            )
            if verb_index == -1:
                print(
                    " No verb (both methods) - first name = PELAKU",
                    file=sys.stderr,
                )
                return {
                    'pelaku'    : names[0],
                    'korban'    : None,
                    'kata_kerja': None,
                }
            # Bangun verb_info dari method lama
            peran_sblm, peran_ssdh = self._get_roles_from_type(verb_type)
            verb_info = {
                'kata'         : verb_word,
                'posisi'       : verb_index,
                'tipe'         : verb_type,
                'peran_sebelum': peran_sblm,
                'peran_sesudah': peran_ssdh,
                'root'         : kata_kerja or verb_word,
                'awalan'       : '',
            }

        verb_pos       = verb_info['posisi']
        peran_sebelum  = verb_info['peran_sebelum']
        peran_sesudah  = verb_info['peran_sesudah']

        # Tentukan posisi setiap nama dalam teks
        text_lower = text_original.lower()
        words      = text_lower.split()

        name_positions = {}
        for name in names:
            name_lower = name.lower()
            # Untuk nama 2 kata: cari posisi kata pertama
            first_word = name_lower.split()[0]
            for j, word in enumerate(words):
                if first_word in word:
                    name_positions[name] = j
                    break

        print(f" Name positions: {name_positions}", file=sys.stderr)
        print(f" Verb pos={verb_pos}, tipe={verb_info['tipe']}", file=sys.stderr)

        names_before = [n for n, pos in name_positions.items() if pos < verb_pos]
        names_after  = [n for n, pos in name_positions.items() if pos > verb_pos]

        print(f" Before verb: {names_before}", file=sys.stderr)
        print(f" After  verb: {names_after}",  file=sys.stderr)

        # Intransitif / aksidental: tidak ada korban
        if peran_sesudah is None:
            pelaku = names_before[0] if names_before else (names[0] if names else None)
            print(f" INTRANSITIVE: pelaku={pelaku}, korban=None", file=sys.stderr)
            return {
                'pelaku'    : pelaku,
                'korban'    : None,
                'kata_kerja': verb_info['root'],
            }

        # Transitif: tentukan peran berdasarkan posisi
        if peran_sebelum == 'pelaku':
            pelaku = names_before[0] if names_before else None
            korban = names_after[0]  if names_after  else None
        else:  # peran_sebelum == 'korban' (kalimat pasif)
            korban = names_before[0] if names_before else None
            pelaku = names_after[0]  if names_after  else None

        print(
            f" FINAL: pelaku='{pelaku}', korban='{korban}', "
            f"verb='{verb_info['root']}' ({verb_info['tipe']})",
            file=sys.stderr,
        )

        return {
            'pelaku'    : pelaku,
            'korban'    : korban,
            'kata_kerja': verb_info['root'],
            'verb_info' : verb_info,  # bonus: detail verb untuk output
        }

    # ------------------------------------------------------------------
    # VALIDATE: cocokkan nama ke database
    # ------------------------------------------------------------------

    def validate_with_database(self, entities, db):
        """Validasi nama entitas ke database santri."""
        result = {
            'pelaku_nama'      : entities.get('pelaku'),
            'pelaku_santri_id' : None,
            'korban_nama'      : entities.get('korban'),
            'korban_santri_id' : None,
            'kata_kerja_dasar' : entities.get('kata_kerja'),
        }

        if entities.get('pelaku'):
            santri = db.get_santri_by_name(entities['pelaku'])
            if santri:
                result['pelaku_santri_id'] = santri['id']
                result['pelaku_nama']      = santri['nama_panggilan'] or santri['nama_lengkap']
                print(
                    f" Matched pelaku: {result['pelaku_nama']} "
                    f"(id={santri['id']})",
                    file=sys.stderr,
                )

        if entities.get('korban'):
            santri = db.get_santri_by_name(entities['korban'])
            if santri:
                result['korban_santri_id'] = santri['id']
                result['korban_nama']      = santri['nama_panggilan'] or santri['nama_lengkap']
                print(
                    f" Matched korban: {result['korban_nama']} "
                    f"(id={santri['id']})",
                    file=sys.stderr,
                )

        return result

    # ------------------------------------------------------------------
    # LEGACY: find_verb_position (dipertahankan sebagai fallback)
    # ------------------------------------------------------------------

    def find_verb_position(self, text, tokens_stemmed):
        """
        Fallback: cari kata kerja via TRANSITIVE_VERBS dan stemmed tokens.
        Dipanggil jika detect_verb_with_role() tidak menemukan verb.
        """
        text_lower = text.lower()
        words      = text_lower.split()

        for token in tokens_stemmed:
            if token in self.transitive_verbs:
                for i, word in enumerate(words):
                    if token in word or word.startswith('me') or word.startswith('di'):
                        vtype = self._get_verb_type(word)
                        print(
                            f" [Fallback] Verb at pos {i}: '{word}' (type={vtype})",
                            file=sys.stderr,
                        )
                        return i, word, vtype, token

        return -1, None, None, None

    # ------------------------------------------------------------------
    # LEGACY: extract_names (backward compat, replaced by extract_compound_names)
    # ------------------------------------------------------------------

    def extract_names(self, text):
        """
        Backward compatible. Memanggil extract_compound_names() secara internal.
        """
        return self.extract_compound_names(text)

    # ------------------------------------------------------------------
    # PRIVATE HELPERS
    # ------------------------------------------------------------------

    def _build_common_words(self):
        return {
            'saya', 'aku', 'kamu', 'dia', 'kita', 'kami', 'kalian', 'mereka',
            'anda', 'beliau', 'ia',
            'pukul', 'memukul', 'dipukul', 'mukul', 'memukuli',
            'tendang', 'menendang', 'ditendang',
            'ejek', 'mengejek', 'diejek',
            'bully', 'membully', 'dibully',
            'ambil', 'mengambil', 'diambil',
            'rusak', 'merusak', 'dirusak',
            'ancam', 'mengancam', 'diancam',
            'paksa', 'memaksa', 'dipaksa',
            'tipu', 'menipu', 'ditipu',
            'dorong', 'mendorong', 'didorong',
            'lempar', 'melempar', 'dilempar',
            'hina', 'menghina', 'dihina',
            'maki', 'memaki', 'dimaki',
            'gelisah', 'sedih', 'menangis', 'murung', 'cemas', 'takut',
            'senang', 'gembira', 'bahagia',
            'baik', 'buruk', 'besar', 'kecil', 'tinggi', 'rendah',
            'sangat', 'terlalu', 'cukup', 'agak', 'lebih', 'kurang',
            'sudah', 'belum', 'akan', 'sedang', 'masih',
            'di', 'ke', 'dari', 'pada', 'untuk', 'dengan', 'tanpa', 'oleh',
            'dalam', 'luar', 'atas', 'bawah', 'depan', 'belakang',
            'sampai', 'hingga',
            'dan', 'atau', 'tapi', 'tetapi', 'namun', 'karena',
            'jika', 'kalau', 'ketika', 'saat', 'waktu',
            'tidak', 'bukan', 'tak', 'nggak', 'gak',
            'kelas', 'kamar', 'ruang', 'kantor', 'rumah', 'sekolah', 'masjid',
            'kepala', 'muka', 'wajah', 'mata', 'hidung', 'mulut', 'telinga',
            'tangan', 'kaki', 'badan', 'perut',
            'hari', 'minggu', 'bulan', 'tahun', 'pagi', 'siang', 'sore', 'malam',
            'kemarin', 'besok', 'nanti', 'sekarang', 'tadi',
            'hal', 'masalah', 'cara', 'orang', 'anak', 'teman', 'guru',
            'murid', 'santri', 'nama', 'bersama', 'sendiri', 'sama',
            'yang', 'ada', 'adalah', 'ini', 'itu',
        }

    def _is_kamus_word(self, word_lower: str) -> bool:
        return word_lower in self.kamus_words

    def _is_name_candidate(self, word: str) -> bool:
        """Cek apakah kata adalah kandidat nama (huruf kapital, bukan kata umum)."""
        if not re.match(r'^[A-Z][a-zA-Z]+$', word):
            return False
        w_lower = word.lower()
        return (
            w_lower not in self.common_words
            and not self._is_kamus_word(w_lower)
        )

    def _is_verb_word(self, word: str) -> bool:
        """Cek apakah kata adalah kata kerja."""
        w = word.lower()
        if w in self.transitive_verbs or w in self.intransitive_verbs:
            return True
        # Cek awalan
        for pattern, *_ in self.verb_prefix_rules:
            if re.match(pattern, w):
                return True
        return False

    def _strip_prefix(self, word: str) -> str:
        """
        Strip prefix kata kerja untuk mendapatkan root word.
        Urutan: prefix panjang dulu.
        """
        prefixes = [
            'memper', 'diper',
            'mem', 'men', 'meng', 'meny', 'me',
            'di',
            'ber', 'ter',
        ]
        w = word.lower()
        for prefix in prefixes:
            if w.startswith(prefix):
                candidate = w[len(prefix):]
                if len(candidate) >= 3:
                    return candidate
        return w

    def _get_verb_type(self, word: str) -> str:
        """Tentukan tipe verb dari prefiks (legacy helper)."""
        w = word.lower()
        if w.startswith('me') or w.startswith('mem'):
            return 'active'
        elif w.startswith('di'):
            return 'passive'
        elif w.startswith('ber') or w.startswith('ter'):
            return 'intransitive'
        return 'unknown'

    def _get_roles_from_type(self, vtype: str):
        """Mapping tipe verb ke peran (peran_sebelum, peran_sesudah)."""
        mapping = {
            'active'      : ('pelaku', 'korban'),
            'aktif'       : ('pelaku', 'korban'),
            'passive'     : ('korban', 'pelaku'),
            'pasif'       : ('korban', 'pelaku'),
            'intransitive': ('pelaku', None),
            'intransitif' : ('pelaku', None),
            'aksidental'  : ('pelaku', None),
            'unknown'     : ('pelaku', 'korban'),
        }
        return mapping.get(vtype, ('pelaku', 'korban'))


# Singleton
_ner_instance = None

def get_ner():
    global _ner_instance
    if _ner_instance is None:
        _ner_instance = SimpleNER()
    return _ner_instance