<?php

namespace App\Services;

use App\Models\LaporanExpertSystemKonselor;
use App\Models\RuleExpertSystem;
use App\Models\RiwayatSantri;
use App\Models\VariabelDiagnosis;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * ForwardChainingService — Diperbaiki
 *
 * ROOT CAUSE yang diperbaiki:
 * ════════════════════════════════════════════════════════════
 * ForwardChaining sebelumnya HANYA bisa dijalankan via:
 *   - Artisan command: konselor:check-triggers (jam 23:00)
 *   - Manual command: konselor:trigger-manual
 *
 * Tidak ada trigger otomatis saat laporan diselesaikan dan
 * data masuk ke riwayat_santri. Akibatnya meskipun data
 * sudah memenuhi rule, laporan expert system tidak dibuat.
 *
 * SOLUSI yang diterapkan:
 * ════════════════════════════════════════════════════════════
 * 1. Tambah checkForSantri($santriId): scan semua rule untuk
 *    SATU santri tertentu — dipanggil setiap kali ada riwayat
 *    baru (setelah laporan diselesaikan di controller).
 *    Lebih efisien dari checkAllRules() karena hanya scope
 *    ke 1 santri.
 *
 * 2. Tambah checkForSantriList(array $santriIds): batch check
 *    untuk beberapa santri sekaligus.
 *
 * 3. checkAllRules() tetap ada untuk scheduled task harian
 *    sebagai safety net.
 *
 * CARA PENGGUNAAN DI CONTROLLER:
 * ════════════════════════════════════════════════════════════
 * Setelah RiwayatSantri::create(), panggil:
 *
 *   $forwardChaining = app(ForwardChainingService::class);
 *   $forwardChaining->checkForSantri($santriId);
 *
 * Non-blocking: jika error, tidak gagalkan proses utama.
 */
class ForwardChainingService
{
    // ──────────────────────────────────────────────────────────
    // PUBLIC: Check untuk SATU santri (dipanggil dari controller)
    // ──────────────────────────────────────────────────────────

    /**
     * Cek semua rule untuk SATU santri spesifik.
     *
     * Dipanggil setiap kali ada data baru di riwayat_santri:
     * - Setelah LaporanPelanggaran diselesaikan
     * - Setelah LaporanKonselor diselesaikan
     * - Setelah LaporanApresiasi diselesaikan
     *
     * Lebih efisien dari checkAllRules() karena:
     * - Query riwayat di-filter per santri
     * - Tidak perlu scan semua santri
     *
     * @param  int   $santriId
     * @return array ['laporan_created' => int, 'laporan_skipped' => int, 'errors' => []]
     */
    public function checkForSantri(int $santriId): array
    {
        $stats = [
            'santri_id'       => $santriId,
            'rules_checked'   => 0,
            'laporan_created' => 0,
            'laporan_skipped' => 0,
            'errors'          => [],
        ];

        try {
            // Ambil semua kode yang dimiliki santri ini di riwayat
            $santriKodes = DB::table('riwayat_santri')
                ->where('santri_id', $santriId)
                ->pluck('kode')
                ->unique()
                ->values()
                ->toArray();

            if (empty($santriKodes)) {
                Log::debug('ForwardChainingService::checkForSantri: No riwayat found', [
                    'santri_id' => $santriId,
                ]);
                return $stats;
            }

            // Ambil semua rule
            $rules = RuleExpertSystem::all();
            $stats['rules_checked'] = $rules->count();

            foreach ($rules as $rule) {
                try {
                    $result = $this->processRuleForSantri($rule, $santriId, $santriKodes);
                    $stats['laporan_created'] += $result['created'];
                    $stats['laporan_skipped'] += $result['skipped'];
                } catch (\Exception $e) {
                    $stats['errors'][] = [
                        'rule_kode' => $rule->kode_rule,
                        'error'     => $e->getMessage(),
                    ];
                    Log::error('ForwardChainingService::checkForSantri: Rule error', [
                        'santri_id' => $santriId,
                        'rule_kode' => $rule->kode_rule,
                        'error'     => $e->getMessage(),
                    ]);
                }
            }

            if ($stats['laporan_created'] > 0) {
                Log::info('ForwardChainingService::checkForSantri: Laporan created', [
                    'santri_id'       => $santriId,
                    'laporan_created' => $stats['laporan_created'],
                    'rules_checked'   => $stats['rules_checked'],
                ]);
            } else {
                Log::debug('ForwardChainingService::checkForSantri: No new laporan', [
                    'santri_id'     => $santriId,
                    'santri_kodes'  => $santriKodes,
                    'rules_checked' => $stats['rules_checked'],
                ]);
            }

        } catch (\Exception $e) {
            $stats['errors'][] = ['type' => 'fatal', 'error' => $e->getMessage()];
            Log::error('ForwardChainingService::checkForSantri: Fatal error', [
                'santri_id' => $santriId,
                'error'     => $e->getMessage(),
            ]);
        }

        return $stats;
    }

    /**
     * Batch check untuk beberapa santri (misal: santri pelaku + korban).
     *
     * @param  array $santriIds
     * @return array
     */
    public function checkForSantriList(array $santriIds): array
    {
        $allStats = [];
        foreach (array_unique(array_filter($santriIds)) as $santriId) {
            $allStats[$santriId] = $this->checkForSantri((int) $santriId);
        }
        return $allStats;
    }

    // ──────────────────────────────────────────────────────────
    // PUBLIC: Check semua santri (untuk scheduled task)
    // ──────────────────────────────────────────────────────────

    /**
     * Cek semua rule untuk semua santri yang punya riwayat.
     * Dipakai oleh: Artisan command konselor:check-triggers (jam 23:00)
     * sebagai safety net.
     *
     * @return array
     */
    public function checkAllRules(): array
    {
        $stats = [
            'rules_checked'   => 0,
            'santri_matched'  => 0,
            'laporan_created' => 0,
            'laporan_skipped' => 0,
            'errors'          => [],
        ];

        try {
            $rules = RuleExpertSystem::all();
            $stats['rules_checked'] = $rules->count();

            foreach ($rules as $rule) {
                try {
                    $result = $this->processRule($rule);

                    $stats['santri_matched']  += $result['matched_count'];
                    $stats['laporan_created'] += $result['created_count'];
                    $stats['laporan_skipped'] += $result['skipped_count'];

                } catch (\Exception $e) {
                    $stats['errors'][] = [
                        'rule_kode' => $rule->kode_rule,
                        'error'     => $e->getMessage(),
                    ];
                    Log::error('ForwardChainingService::checkAllRules: Error processing rule', [
                        'rule_kode' => $rule->kode_rule,
                        'error'     => $e->getMessage(),
                    ]);
                }
            }

            Log::info('ForwardChainingService::checkAllRules: Completed', $stats);

        } catch (\Exception $e) {
            $stats['errors'][] = ['type' => 'fatal', 'error' => $e->getMessage()];
            Log::error('ForwardChainingService::checkAllRules: Fatal error', [
                'error' => $e->getMessage(),
            ]);
        }

        return $stats;
    }

    // ──────────────────────────────────────────────────────────
    // PRIVATE: Core logic
    // ──────────────────────────────────────────────────────────

    /**
     * Process satu rule untuk satu santri spesifik.
     * Digunakan oleh checkForSantri() — lebih targeted.
     *
     * @param  RuleExpertSystem $rule
     * @param  int              $santriId
     * @param  array            $santriKodes kode yang dimiliki santri (pre-fetched)
     * @return array ['created' => int, 'skipped' => int]
     */
    protected function processRuleForSantri(
        RuleExpertSystem $rule,
        int $santriId,
        array $santriKodes
    ): array {
        $result = ['created' => 0, 'skipped' => 0];

        $requiredCodes = $rule->premise;

        if (empty($requiredCodes) || !is_array($requiredCodes)) {
            return $result;
        }

        // Cek apakah santri punya SEMUA kode yang dibutuhkan (AND logic)
        $missingCodes = array_diff($requiredCodes, $santriKodes);

        if (!empty($missingCodes)) {
            // Santri tidak memenuhi semua premise — skip
            return $result;
        }

        // Santri MATCH — verifikasi dengan query DB untuk DISTINCT kode
        // (memastikan setiap kode muncul setidaknya 1x, bukan hanya dari 1 baris)
        $matchCount = DB::table('riwayat_santri')
            ->where('santri_id', $santriId)
            ->whereIn('kode', $requiredCodes)
            ->distinct('kode')
            ->count('kode');

        if ($matchCount < count($requiredCodes)) {
            return $result;
        }

        // Cek apakah laporan sudah pernah dibuat untuk rule ini
        $exists = LaporanExpertSystemKonselor::where('santri_id', $santriId)
            ->where('rule_kode', $rule->kode_rule)
            ->exists();

        if ($exists) {
            $result['skipped']++;
            Log::debug('ForwardChainingService: Laporan already exists', [
                'santri_id' => $santriId,
                'rule_kode' => $rule->kode_rule,
            ]);
            return $result;
        }

        // Buat laporan
        $this->createLaporan($santriId, $rule, $requiredCodes);
        $result['created']++;

        Log::info('ForwardChainingService: New laporan created (per-santri trigger)', [
            'santri_id'    => $santriId,
            'rule_kode'    => $rule->kode_rule,
            'premise'      => implode(' AND ', $requiredCodes),
            'conclusion'   => $rule->conclusion,
        ]);

        return $result;
    }

    /**
     * Process satu rule untuk semua santri yang match.
     * Digunakan oleh checkAllRules() — untuk scheduled task.
     *
     * @param  RuleExpertSystem $rule
     * @return array
     */
    protected function processRule(RuleExpertSystem $rule): array
    {
        $result = [
            'matched_count' => 0,
            'created_count' => 0,
            'skipped_count' => 0,
        ];

        $requiredCodes = $rule->premise;

        if (empty($requiredCodes) || !is_array($requiredCodes)) {
            Log::warning('ForwardChainingService: Invalid premise', [
                'rule_kode' => $rule->kode_rule,
                'premise'   => $rule->premise,
            ]);
            return $result;
        }

        // Query: santri yang punya SEMUA kode (AND logic)
        $matchingSantris = $this->findMatchingSantris($requiredCodes);
        $result['matched_count'] = $matchingSantris->count();

        foreach ($matchingSantris as $santriId) {
            $exists = LaporanExpertSystemKonselor::where('santri_id', $santriId)
                ->where('rule_kode', $rule->kode_rule)
                ->exists();

            if ($exists) {
                $result['skipped_count']++;
                continue;
            }

            try {
                $this->createLaporan($santriId, $rule, $requiredCodes);
                $result['created_count']++;
                Log::info('ForwardChainingService: Laporan created (bulk)', [
                    'santri_id' => $santriId,
                    'rule_kode' => $rule->kode_rule,
                ]);
            } catch (\Exception $e) {
                Log::error('ForwardChainingService: Failed to create laporan', [
                    'santri_id' => $santriId,
                    'rule_kode' => $rule->kode_rule,
                    'error'     => $e->getMessage(),
                ]);
            }
        }

        return $result;
    }

    /**
     * Cari santri yang punya SEMUA kode dari premise (AND logic).
     *
     * @param  array $requiredCodes
     * @return \Illuminate\Support\Collection
     */
    protected function findMatchingSantris(array $requiredCodes): \Illuminate\Support\Collection
    {
        $totalRequired = count($requiredCodes);

        return DB::table('riwayat_santri')
            ->select('santri_id')
            ->whereIn('kode', $requiredCodes)
            ->groupBy('santri_id')
            ->havingRaw('COUNT(DISTINCT kode) = ?', [$totalRequired])
            ->pluck('santri_id');
    }

    /**
     * Buat LaporanExpertSystemKonselor baru.
     *
     * @param  int              $santriId
     * @param  RuleExpertSystem $rule
     * @param  array            $kodeTerpenuhi
     * @return LaporanExpertSystemKonselor
     * @throws \Exception jika diagnosis tidak ditemukan
     */
    protected function createLaporan(
        int $santriId,
        RuleExpertSystem $rule,
        array $kodeTerpenuhi
    ): LaporanExpertSystemKonselor {
        $diagnosisKode = trim($rule->conclusion);

        $diagnosis = VariabelDiagnosis::where('kode', $diagnosisKode)->first();

        if (!$diagnosis) {
            throw new \Exception("Diagnosis not found: {$diagnosisKode}");
        }

        return LaporanExpertSystemKonselor::create([
            'santri_id'             => $santriId,
            'rule_kode'             => $rule->kode_rule,
            'rule_kategori'         => $rule->kategori,
            'diagnosis_kode'        => $diagnosis->kode,
            'diagnosis_nama'        => $diagnosis->diagnosis,
            'diagnosis_penjelasan'  => $diagnosis->penjelasan,
            'rekomendasi_sistem'    => $diagnosis->rekomendasi,
            'kode_terpenuhi'        => $kodeTerpenuhi,
            'status'                => 'pending',
            'sesi_bimbingan_terakhir' => 0,
            'tanggal_trigger'       => now(),
        ]);
    }

    // ──────────────────────────────────────────────────────────
    // PUBLIC: Statistics
    // ──────────────────────────────────────────────────────────

    /**
     * Statistik untuk dashboard BK.
     */
    public function getStatistics(): array
    {
        return [
            'total_laporan'  => LaporanExpertSystemKonselor::count(),
            'pending'        => LaporanExpertSystemKonselor::where('status', 'pending')->count(),
            'in_progress'    => LaporanExpertSystemKonselor::where('status', 'in_progress')->count(),
            'completed'      => LaporanExpertSystemKonselor::where('status', 'completed')->count(),
            'active_rules'   => RuleExpertSystem::count(),
        ];
    }
}