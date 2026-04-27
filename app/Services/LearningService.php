<?php

namespace App\Services;

use App\Models\LearningKnowledgeBase;
use App\Models\VariabelAutoUpdateLog;
use App\Models\VariabelPelanggaran;
use App\Models\VariabelApresiasi;
use App\Models\VariabelKonselor;
use App\Models\HasilPreprocessing;
use App\Models\SantriProfile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * LearningService v3 — Sistem Pembelajaran dari Koreksi BK
 * ══════════════════════════════════════════════════════════
 *
 * PERBAIKAN v3:
 * ─────────────
 * BUG SEBELUMNYA (Filter 5):
 *   extractKeywords() memfilter kata yang SUDAH ADA di kamus manapun.
 *   Akibatnya: jika kata "ngaret" sudah ada di kamus P002 milik variabel
 *   lain, ia tidak bisa dipelajari lagi untuk kode yang sedang di-learn.
 *   → Learning SELALU gagal untuk kata yang sudah pernah ada di sistem.
 *
 * ROOT CAUSE SEBENARNYA:
 *   Filter ini salah desain. Tujuan learning adalah:
 *   "BK menambahkan kode X ke hasil preprocessing, berarti kata-kata
 *    dalam teks laporan itu relevan dengan kode X."
 *   Filter 5 justru memblokir kata relevan karena kata itu mungkin
 *   sudah ada di kamus kode LAIN.
 *
 * FIX v3:
 *   Filter 5 diganti: hanya skip kata yang sudah ada di kamus
 *   KODE YANG SEDANG DIPELAJARI (bukan semua kamus).
 *   Sehingga kata "ngaret" tetap bisa ditambahkan ke P002 meski
 *   mungkin juga ada di kamus variabel lain.
 *
 * LOGIKA BARU:
 *   1. Kumpulkan kata-kata dari kamus kode target (currentKamusWords)
 *   2. Skip kata yang sudah ada di kamus target tsb (duplicate)
 *   3. Kata dari kamus variabel LAIN: tetap BOLEH ditambahkan
 *      (karena mungkin memang relevan untuk dua variabel sekaligus)
 */
class LearningService
{
    // ════════════════════════════════════════════════════════
    // KONFIGURASI
    // ════════════════════════════════════════════════════════

    private const MIN_KEYWORD_LENGTH = 4;

    private const SKIP_WORDS = [
        // Kata Ganti Orang
        'saya', 'aku', 'kamu', 'anda', 'dia', 'mereka',
        'kami', 'kita', 'beliau', 'kalian', 'sendiri',

        // Kata Bantu & Konjungsi
        'tidak', 'bukan', 'yang', 'dan', 'atau', 'ada',
        'itu', 'ini', 'apa', 'siapa',
        'di', 'ke', 'dari', 'untuk', 'pada', 'dengan', 'oleh',
        'sangat', 'sekali', 'lebih', 'kurang', 'sering', 'selalu',
        'sudah', 'telah', 'akan', 'sedang', 'masih', 'belum',
        'karena', 'sebab', 'jadi', 'maka', 'lalu', 'kemudian',
        'tapi', 'tetapi', 'namun', 'melainkan', 'bahwa',
        'meskipun', 'walaupun', 'jika', 'kalau', 'ketika', 'saat',
        'setelah', 'sebelum', 'sampai', 'selama', 'sejak',

        // Kata Keterangan Tempat
        'kelas', 'sekolah', 'ruang', 'kantor', 'toilet',
        'masjid', 'taman', 'lapangan', 'asrama', 'pondok',
        'dalam', 'luar', 'depan', 'belakang',
        'sini', 'sana', 'situ', 'mana',

        // Kata Keterangan Waktu
        'datang', 'pergi', 'pulang', 'berangkat', 'tiba',
        'pagi', 'siang', 'sore', 'malam', 'hari', 'minggu',
        'bulan', 'tahun', 'kemarin', 'besok', 'nanti',
        'sekarang', 'tadi', 'lagi', 'dulu',

        // Kata Kerja Umum
        'jalan', 'lari', 'duduk', 'berdiri', 'main', 'bermain',
        'lihat', 'melihat', 'tahu', 'mengetahui',
        'bilang', 'kata', 'berkata', 'ikut', 'mengikuti',
        'bawa', 'membawa',

        // Kata Pelaporan
        'melapor', 'lapor', 'melaporkan',
        'menyaksikan', 'ketahuan', 'tertangkap', 'terlihat',

        // Kata Sifat Umum
        'besar', 'kecil', 'panjang', 'pendek', 'tinggi', 'rendah',
        'baru', 'lama', 'bagus', 'jelek', 'baik', 'buruk',

        // Angka & Satuan
        'satu', 'dua', 'tiga', 'empat', 'lima',
        'kali', 'buah', 'orang',

        // Bagian Tubuh
        'kepala', 'tangan', 'kaki', 'badan', 'muka', 'wajah',
        'bagian', 'tubuh',
    ];

    // ════════════════════════════════════════════════════════
    // MAIN ENTRY POINT
    // ════════════════════════════════════════════════════════

    public function processLearningFromCorrection(
        HasilPreprocessing $hasil,
        array $originalKodeMatched,
        array $correctedKodeMatched,
        int $userId
    ): array {
        try {
            Log::info('LearningService: Mulai proses learning', [
                'hasil_id'  => $hasil->id,
                'original'  => $originalKodeMatched,
                'corrected' => $correctedKodeMatched,
            ]);

            $addedKodes = array_values(
                array_diff($correctedKodeMatched, $originalKodeMatched)
            );

            if (empty($addedKodes)) {
                Log::info('LearningService: Tidak ada kode baru, skip learning', [
                    'hasil_id' => $hasil->id,
                ]);
                return [
                    'learned' => false,
                    'reason'  => 'Tidak ada kode baru yang ditambahkan BK.',
                ];
            }

            Log::info('LearningService: Kode baru ditemukan', [
                'added' => $addedKodes,
            ]);

            $results = [];

            foreach ($addedKodes as $kode) {
                $result = $this->learnFromKode(
                    $hasil, $kode,
                    $originalKodeMatched, $correctedKodeMatched,
                    $userId
                );

                if ($result['learned']) {
                    $results[] = $result;
                } else {
                    Log::info('LearningService: Kode dilewati', [
                        'kode'   => $kode,
                        'reason' => $result['reason'] ?? '-',
                    ]);
                }
            }

            if (empty($results)) {
                return [
                    'learned' => false,
                    'reason'  => 'Semua kode baru dilewati (G-code atau keyword tidak valid).',
                ];
            }

            return [
                'learned' => true,
                'count'   => count($results),
                'details' => $results,
            ];

        } catch (\Exception $e) {
            Log::error('LearningService: Error fatal', [
                'hasil_id' => $hasil->id,
                'error'    => $e->getMessage(),
                'trace'    => $e->getTraceAsString(),
            ]);

            return [
                'learned' => false,
                'error'   => $e->getMessage(),
            ];
        }
    }

    // ════════════════════════════════════════════════════════
    // LEARNING DARI SATU KODE
    // ════════════════════════════════════════════════════════

    private function learnFromKode(
        HasilPreprocessing $hasil,
        string $kode,
        array $originalKodeMatched,
        array $correctedKodeMatched,
        int $userId
    ): array {
        $type = $this->getKodeType($kode);

        if (!in_array($type, ['pelanggaran', 'apresiasi'])) {
            return [
                'learned' => false,
                'kode'    => $kode,
                'reason'  => "Kode '{$kode}' (tipe: {$type}) tidak di-auto-learn. Hanya P dan A.",
            ];
        }

        $text = $hasil->laporanAwal->text_laporan ?? '';

        if (empty($text)) {
            return [
                'learned' => false,
                'kode'    => $kode,
                'reason'  => 'Teks laporan kosong.',
            ];
        }

        // ── Kumpulkan nama blacklist ──
        $namesToExclude = $this->collectNamesToExclude($hasil);

        // ── Ambil kata yang sudah ada di kamus TARGET ──
        // ✅ FIX v3: hanya skip kata yang sudah ada di kamus KODE INI,
        //            bukan semua kamus (itulah yang menyebabkan bug)
        $currentKamusWords = $this->getKamusWordsForKode($type, $kode);

        // ── Ekstrak keyword ──
        $keywords = $this->extractKeywords($text, $namesToExclude, $currentKamusWords);

        if (empty($keywords)) {
            return [
                'learned' => false,
                'kode'    => $kode,
                'reason'  => 'Tidak ada keyword baru setelah filtering (semua sudah ada di kamus atau terlalu umum).',
            ];
        }

        Log::info('LearningService: Keyword berhasil diekstrak', [
            'kode'           => $kode,
            'keywords'       => $keywords,
            'excluded_names' => array_slice($namesToExclude, 0, 10),
        ]);

        return DB::transaction(function () use (
            $hasil, $kode, $type, $text,
            $keywords, $originalKodeMatched,
            $correctedKodeMatched, $userId
        ) {
            $knowledge = $this->saveKnowledge(
                $hasil, $kode, $type, $text,
                $keywords, $originalKodeMatched,
                $correctedKodeMatched, $userId
            );

            $updateResult = $this->autoUpdateKamusKata(
                $kode, $type, $keywords,
                $knowledge->id, $hasil->id
            );

            return [
                'learned'        => true,
                'kode'           => $kode,
                'type'           => $type,
                'keywords'       => $keywords,
                'knowledge_id'   => $knowledge->id,
                'auto_updated'   => $updateResult['updated'],
                'added_keywords' => $updateResult['added'] ?? [],
                'update_log_id'  => $updateResult['log_id'] ?? null,
            ];
        });
    }

    // ════════════════════════════════════════════════════════
    // KUMPULKAN NAMA BLACKLIST
    // ════════════════════════════════════════════════════════

    private function collectNamesToExclude(HasilPreprocessing $hasil): array
    {
        $names = [];

        if ($hasil->pelaku_nama) {
            $names[] = strtolower(trim($hasil->pelaku_nama));
        }
        if ($hasil->korban_nama) {
            $names[] = strtolower(trim($hasil->korban_nama));
        }

        $profiles = SantriProfile::select('nama_panggilan', 'nama_lengkap')->get();

        foreach ($profiles as $profile) {
            if ($profile->nama_panggilan) {
                $names[] = strtolower(trim($profile->nama_panggilan));
            }
            if ($profile->nama_lengkap) {
                foreach (explode(' ', strtolower(trim($profile->nama_lengkap))) as $part) {
                    $part = trim($part);
                    if (strlen($part) >= 3) {
                        $names[] = $part;
                    }
                }
            }
        }

        return array_unique($names);
    }

    // ════════════════════════════════════════════════════════
    // ✅ NEW v3: Ambil kata kamus untuk SATU kode tertentu
    // ════════════════════════════════════════════════════════

    /**
     * Ambil semua kata yang sudah ada di kamus variabel TERTENTU.
     *
     * MENGAPA HANYA KAMUS KODE TARGET?
     * ─────────────────────────────────
     * Sebelumnya (v2): filter semua kamus semua variabel.
     * Masalah: kata "ngaret" yang sudah ada di kamus P002 tidak bisa
     * dipelajari lagi karena dianggap "sudah dikenal sistem".
     *
     * v3: hanya cek kamus kode yang sedang dipelajari.
     * Sehingga: kata "ngaret" bisa ditambahkan ke P002 jika belum ada,
     * atau di-skip jika memang sudah ada di P002 (duplicate).
     */
    private function getKamusWordsForKode(string $type, string $kode): array
    {
        $model = $this->getVariabelModel($type, $kode);

        if (!$model || empty($model->kamus_kata)) {
            return [];
        }

        return array_map('trim', explode(',', strtolower($model->kamus_kata)));
    }

    // ════════════════════════════════════════════════════════
    // EKSTRAKSI KEYWORD — v3
    // ════════════════════════════════════════════════════════

    /**
     * Ekstrak keyword relevan dari teks laporan.
     *
     * FILTER BERLAPIS (v3):
     * 1. Lowercase + hapus karakter non-huruf
     * 2. Tokenisasi
     * 3. Panjang minimal (≥ MIN_KEYWORD_LENGTH)
     * 4. SKIP_WORDS (kata umum/netral)
     * 5. Nama orang (blacklist dari DB)
     * 6. Numerik
     * 7. ✅ BARU: Hanya skip kata yang sudah ada di kamus KODE TARGET
     *    (bukan semua kamus — ini perbaikan utama dari bug sebelumnya)
     *
     * @param string $text               Teks laporan asli
     * @param array  $namesToExclude     Daftar nama yang harus di-skip
     * @param array  $currentKamusWords  Kata yang sudah ada di kamus KODE TARGET
     */
    private function extractKeywords(
        string $text,
        array $namesToExclude = [],
        array $currentKamusWords = []
    ): array {
        // Normalisasi
        $text = strtolower($text);
        $text = preg_replace('/[^a-z\s]/', ' ', $text);
        $text = preg_replace('/\s+/', ' ', trim($text));

        $tokens   = array_filter(explode(' ', $text));
        $keywords = [];

        foreach ($tokens as $token) {
            $token = trim($token);

            // Filter 1: panjang minimum
            if (strlen($token) < self::MIN_KEYWORD_LENGTH) {
                continue;
            }

            // Filter 2: skip words generik
            if (in_array($token, self::SKIP_WORDS)) {
                continue;
            }

            // Filter 3: nama orang
            if (in_array($token, $namesToExclude)) {
                continue;
            }

            // Filter 4: numerik
            if (is_numeric($token)) {
                continue;
            }

            // Filter 5 (v3 FIX): hanya skip jika sudah ada di kamus KODE TARGET
            // Berbeda dengan v2 yang skip jika ada di kamus manapun
            if (in_array($token, $currentKamusWords)) {
                Log::debug('LearningService: Kata sudah ada di kamus target, skip', [
                    'kata' => $token,
                ]);
                continue;
            }

            $keywords[] = $token;
        }

        return array_values(array_unique($keywords));
    }

    // ════════════════════════════════════════════════════════
    // SIMPAN KE KNOWLEDGE BASE
    // ════════════════════════════════════════════════════════

    private function saveKnowledge(
        HasilPreprocessing $hasil,
        string $kode,
        string $type,
        string $text,
        array $keywords,
        array $originalKodeMatched,
        array $correctedKodeMatched,
        int $userId
    ): LearningKnowledgeBase {
        return LearningKnowledgeBase::create([
            'hasil_preprocessing_id' => $hasil->id,
            'laporan_text'           => $text,
            'extracted_keywords'     => $keywords,
            'learned_for_kode'       => $kode,
            'learned_for_type'       => $type,
            'learning_type'          => 'keyword_addition',
            'original_kode_matched'  => $originalKodeMatched,
            'corrected_kode_matched' => $correctedKodeMatched,
            'confidence_score'       => 0.80,
            'validation_status'      => 'validated',
            'applied_to_variabel'    => false,
            'created_by'             => $userId,
            'validated_by'           => $userId,
            'validated_at'           => now(),
        ]);
    }

    // ════════════════════════════════════════════════════════
    // AUTO-UPDATE KAMUS KATA
    // ════════════════════════════════════════════════════════

    private function autoUpdateKamusKata(
        string $kode,
        string $type,
        array $keywords,
        int $knowledgeId,
        int $hasilId
    ): array {
        $model = $this->getVariabelModel($type, $kode);

        if (!$model) {
            Log::warning('LearningService: Variabel tidak ditemukan', [
                'kode' => $kode, 'type' => $type,
            ]);
            return ['updated' => false, 'reason' => 'Model variabel tidak ditemukan.'];
        }

        $currentKamus = $model->kamus_kata ?? '';
        $currentArray = array_filter(array_map('trim', explode(',', $currentKamus)));

        // Hanya kata yang belum ada di kamus ini
        $newKeywords = array_values(array_diff($keywords, $currentArray));

        if (empty($newKeywords)) {
            $this->incrementStats($model);
            return [
                'updated' => false,
                'reason'  => 'Semua keyword sudah ada di kamus ini.',
            ];
        }

        $updatedArray = array_merge($currentArray, $newKeywords);
        $updatedKamus = implode(',', array_filter($updatedArray));

        $model->update(['kamus_kata' => $updatedKamus]);
        $this->incrementStats($model);

        $log = VariabelAutoUpdateLog::create([
            'variabel_type'         => $type,
            'variabel_kode'         => $kode,
            'field_updated'         => 'kamus_kata',
            'old_value'             => $currentKamus,
            'new_value'             => $updatedKamus,
            'update_reason'         => 'Auto-learned from BK correction',
            'source_knowledge_id'   => $knowledgeId,
            'triggered_by_hasil_id' => $hasilId,
            'requires_approval'     => false,
            'approval_status'       => 'approved',
            'can_rollback'          => true,
        ]);

        LearningKnowledgeBase::find($knowledgeId)?->update([
            'applied_to_variabel'   => true,
            'application_timestamp' => now(),
            'application_notes'     => 'Auto-added: ' . implode(', ', $newKeywords),
        ]);

        Log::info('LearningService: Kamus kata berhasil diperbarui', [
            'kode'           => $kode,
            'type'           => $type,
            'added'          => $newKeywords,
            'total_di_kamus' => count($updatedArray),
        ]);

        return [
            'updated' => true,
            'added'   => $newKeywords,
            'log_id'  => $log->id,
        ];
    }

    private function incrementStats($model): void
    {
        $model->update([
            'learning_count'  => ($model->learning_count ?? 0) + 1,
            'last_learned_at' => now(),
        ]);
    }

    // ════════════════════════════════════════════════════════
    // ROLLBACK
    // ════════════════════════════════════════════════════════

    public function rollbackUpdate(int $logId, int $userId): array
    {
        $log = VariabelAutoUpdateLog::find($logId);

        if (!$log) {
            return ['success' => false, 'reason' => 'Log tidak ditemukan.'];
        }
        if ($log->rolled_back) {
            return ['success' => false, 'reason' => 'Sudah pernah di-rollback.'];
        }
        if (!$log->can_rollback) {
            return ['success' => false, 'reason' => 'Tidak bisa di-rollback.'];
        }

        $model = $this->getVariabelModel($log->variabel_type, $log->variabel_kode);

        if (!$model) {
            return ['success' => false, 'reason' => 'Variabel tidak ditemukan.'];
        }

        DB::transaction(function () use ($log, $model, $userId) {
            $model->update(['kamus_kata' => $log->old_value]);
            $log->update([
                'rolled_back'     => true,
                'rollback_by'     => $userId,
                'rollback_at'     => now(),
                'rollback_reason' => 'Manual rollback by BK',
            ]);
        });

        return ['success' => true, 'message' => 'Kamus kata berhasil dikembalikan.'];
    }

    // ════════════════════════════════════════════════════════
    // HELPERS
    // ════════════════════════════════════════════════════════

    private function getKodeType(string $kode): string
    {
        if (str_starts_with($kode, 'P')) return 'pelanggaran';
        if (str_starts_with($kode, 'A')) return 'apresiasi';
        if (str_starts_with($kode, 'G')) return 'konselor';
        return 'unknown';
    }

    private function getVariabelModel(string $type, string $kode)
    {
        $class = match ($type) {
            'pelanggaran' => VariabelPelanggaran::class,
            'apresiasi'   => VariabelApresiasi::class,
            'konselor'    => VariabelKonselor::class,
            default       => null,
        };

        return $class ? $class::where('kode', $kode)->first() : null;
    }
}