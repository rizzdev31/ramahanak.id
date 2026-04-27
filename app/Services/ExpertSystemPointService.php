<?php

namespace App\Services;

use App\Models\SantriExpertSystemTracking;
use App\Models\LaporanExpertSystemPoint;
use App\Models\VariabelKonsekuensi;
use App\Models\VariabelReward;
use App\Models\RiwayatSantri;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class ExpertSystemPointService
{
    /**
     * Check threshold dan auto-create laporan jika tercapai
     * 
     * @param int $santriId
     * @return array ['konsekuensi' => [...], 'reward' => [...]]
     */
    public function checkThreshold($santriId)
    {
        Log::info('ExpertSystemPointService: Checking threshold', [
            'santri_id' => $santriId
        ]);

        try {
            DB::beginTransaction();

            // Get or create tracking
            $tracking = SantriExpertSystemTracking::getOrCreate($santriId);

            // ✅ FIX: Calculate poin dari riwayat_santri (single source of truth)
            // Riwayat santri sudah di-insert saat complete pelanggaran/apresiasi
            $totalPoinPelanggaran = RiwayatSantri::where('santri_id', $santriId)
                ->where('jenis_laporan', 'pelanggaran')
                ->whereNotNull('bobot_poin') // Exclude korban (poin null)
                ->sum('bobot_poin');

            $totalPoinApresiasi = RiwayatSantri::where('santri_id', $santriId)
                ->where('jenis_laporan', 'apresiasi')
                ->sum('bobot_poin');

            Log::info('ExpertSystemPointService: Poin calculated from riwayat_santri', [
                'santri_id' => $santriId,
                'total_poin_pelanggaran' => $totalPoinPelanggaran,
                'total_poin_apresiasi' => $totalPoinApresiasi,
            ]);

            // Update tracking cache
            $tracking->updatePoinPelanggaran($totalPoinPelanggaran);
            $tracking->updatePoinApresiasi($totalPoinApresiasi);

            $created = [
                'konsekuensi' => [],
                'reward' => [],
            ];

            // Check konsekuensi
            $newKonsekuensi = $tracking->getNewKonsekuensi();
            foreach ($newKonsekuensi as $variabel) {
                $laporan = $this->createLaporanKonsekuensi($santriId, $variabel, $totalPoinPelanggaran);
                $tracking->addKonsekuensi($variabel->kode);
                $created['konsekuensi'][] = $laporan;

                Log::info('ExpertSystemPointService: Konsekuensi triggered', [
                    'santri_id' => $santriId,
                    'kode' => $variabel->kode,
                    'threshold' => $variabel->poin,
                    'laporan_id' => $laporan->id,
                ]);
            }

            // Check reward
            $newReward = $tracking->getNewReward();
            foreach ($newReward as $variabel) {
                $laporan = $this->createLaporanReward($santriId, $variabel, $totalPoinApresiasi);
                $tracking->addReward($variabel->kode);
                $created['reward'][] = $laporan;

                Log::info('ExpertSystemPointService: Reward triggered', [
                    'santri_id' => $santriId,
                    'kode' => $variabel->kode,
                    'threshold' => $variabel->poin,
                    'laporan_id' => $laporan->id,
                ]);
            }

            DB::commit();

            Log::info('ExpertSystemPointService: Check completed', [
                'santri_id' => $santriId,
                'konsekuensi_count' => count($created['konsekuensi']),
                'reward_count' => count($created['reward']),
            ]);

            return $created;

        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('ExpertSystemPointService: Check failed', [
                'santri_id' => $santriId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            throw $e;
        }
    }

    /**
     * Create laporan konsekuensi
     */
    private function createLaporanKonsekuensi($santriId, $variabel, $totalPoin)
    {
        return LaporanExpertSystemPoint::create([
            'santri_id' => $santriId,
            'jenis' => 'konsekuensi',
            'kode' => $variabel->kode,
            'total_poin_saat_trigger' => $totalPoin,
            'threshold_poin_triggered' => $variabel->poin,
            'konsekuensi_atau_reward' => $variabel->konsekuensi,
            'rekomendasi' => $variabel->rekomendasi,
            'status' => 'pending',
            'tanggal_trigger' => now(),
        ]);
    }

    /**
     * Create laporan reward
     */
    private function createLaporanReward($santriId, $variabel, $totalPoin)
    {
        return LaporanExpertSystemPoint::create([
            'santri_id' => $santriId,
            'jenis' => 'reward',
            'kode' => $variabel->kode,
            'total_poin_saat_trigger' => $totalPoin,
            'threshold_poin_triggered' => $variabel->poin,
            'konsekuensi_atau_reward' => $variabel->reward,
            'rekomendasi' => $variabel->rekomendasi,
            'status' => 'pending',
            'tanggal_trigger' => now(),
        ]);
    }

    /**
     * Get statistics untuk santri
     */
    public function getStatistics($santriId)
    {
        $tracking = SantriExpertSystemTracking::getOrCreate($santriId);

        return [
            'total_poin_pelanggaran' => $tracking->total_poin_pelanggaran,
            'total_poin_apresiasi' => $tracking->total_poin_apresiasi,
            'konsekuensi_diberikan' => $tracking->konsekuensi_diberikan ?? [],
            'reward_diberikan' => $tracking->reward_diberikan ?? [],
            'total_konsekuensi' => count($tracking->konsekuensi_diberikan ?? []),
            'total_reward' => count($tracking->reward_diberikan ?? []),
        ];
    }

    /**
     * Get next threshold untuk santri
     */
    public function getNextThreshold($santriId)
    {
        $tracking = SantriExpertSystemTracking::getOrCreate($santriId);

        // Next konsekuensi
        $nextKonsekuensi = VariabelKonsekuensi::where('is_active', true)
            ->where('poin', '>', $tracking->total_poin_pelanggaran)
            ->orderBy('poin', 'asc')
            ->first();

        // Next reward
        $nextReward = VariabelReward::where('is_active', true)
            ->where('poin', '>', $tracking->total_poin_apresiasi)
            ->orderBy('poin', 'asc')
            ->first();

        return [
            'next_konsekuensi' => $nextKonsekuensi ? [
                'kode' => $nextKonsekuensi->kode,
                'threshold' => $nextKonsekuensi->poin,
                'konsekuensi' => $nextKonsekuensi->konsekuensi,
                'poin_needed' => $nextKonsekuensi->poin - $tracking->total_poin_pelanggaran,
            ] : null,
            'next_reward' => $nextReward ? [
                'kode' => $nextReward->kode,
                'threshold' => $nextReward->poin,
                'reward' => $nextReward->reward,
                'poin_needed' => $nextReward->poin - $tracking->total_poin_apresiasi,
            ] : null,
        ];
    }
}