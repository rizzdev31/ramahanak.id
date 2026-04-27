<?php

namespace App\Services;

use App\Models\HasilPreprocessing;
use App\Models\LaporanPelanggaran;
use App\Models\LaporanApresiasi;
use App\Models\LaporanKonselor;
use App\Models\LaporanApproval;
use App\Models\PenugasanKelas;
use App\Models\VariabelPelanggaran;
use App\Models\VariabelApresiasi;
use App\Models\VariabelKonselor;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class LaporanService
{
    /**
     * Create laporan dari hasil preprocessing yang di-approve
     * (TANPA verifikasi korban - untuk case tanpa korban atau tanpa pelanggaran)
     */
    public function createLaporanFromHasil(HasilPreprocessing $hasil)
    {
        Log::info('Creating laporan from hasil_preprocessing', [
            'hasil_id' => $hasil->id,
            'kode_matched' => $hasil->kode_matched,
            'pelaku_santri_id' => $hasil->pelaku_santri_id,
            'korban_santri_id' => $hasil->korban_santri_id,
        ]);

        $created = [
            'pelanggaran' => [],
            'apresiasi' => [],
            'konselor' => []
        ];

        DB::beginTransaction();
        
        try {
            $tanggalKejadian = $hasil->laporanAwal->tanggal_kejadian ?? now()->toDateString();

            // ═══════════════════════════════════════════════════════════
            // PELANGGARAN
            // ═══════════════════════════════════════════════════════════
            $kodePelanggaran = array_filter($hasil->kode_matched ?? [], fn($kode) => str_starts_with($kode, 'P'));
            foreach ($kodePelanggaran as $kode) {
                $variabel = VariabelPelanggaran::where('kode', $kode)->first();
                if (!$variabel) continue;

                $laporan = LaporanPelanggaran::create([
                    'hasil_preprocessing_id' => $hasil->id,
                    'pelaku_santri_id' => $hasil->pelaku_santri_id,
                    'korban_santri_id' => $hasil->korban_santri_id,
                    'kode_pelanggaran' => $kode,
                    'bobot_poin' => $variabel->poin ?? 0,
                    'tindakan_default' => $variabel->tindakan ?? 'Tindakan belum ditentukan',
                    'tanggal_kejadian' => $tanggalKejadian,
                    'status' => 'pending',
                    'approval_status' => 'pending_tenaga_pendidik', // ✅ NEW
                ]);

                // ✅ NEW: Auto-create approval records
                $this->createApprovalRecords($laporan, 'App\Models\LaporanPelanggaran');

                $created['pelanggaran'][] = $laporan;
                Log::info("Created laporan pelanggaran with approvals", [
                    'id' => $laporan->id,
                    'kode' => $kode,
                    'poin' => $variabel->poin
                ]);
            }

            // ═══════════════════════════════════════════════════════════
            // APRESIASI
            // ═══════════════════════════════════════════════════════════
            $kodeApresiasi = array_filter($hasil->kode_matched ?? [], fn($kode) => str_starts_with($kode, 'A'));
            foreach ($kodeApresiasi as $kode) {
                $variabel = VariabelApresiasi::where('kode', $kode)->first();
                if (!$variabel) continue;

                $santriId = $hasil->pelaku_santri_id ?? $hasil->korban_santri_id;
                if (!$santriId) continue;

                $laporan = LaporanApresiasi::create([
                    'hasil_preprocessing_id' => $hasil->id,
                    'santri_id' => $santriId,
                    'kode_apresiasi' => $kode,
                    'bobot_poin' => $variabel->poin ?? 0,
                    'reward_default' => $variabel->apresiasi ?? 'Reward belum ditentukan',
                    'tanggal_kejadian' => $tanggalKejadian,
                    'status' => 'pending',
                    'approval_status' => 'pending_tenaga_pendidik', // ✅ NEW
                ]);

                // ✅ NEW: Auto-create approval records
                $this->createApprovalRecords($laporan, 'App\Models\LaporanApresiasi');

                $created['apresiasi'][] = $laporan;
                Log::info("Created laporan apresiasi with approvals", [
                    'id' => $laporan->id,
                    'kode' => $kode,
                    'poin' => $variabel->poin
                ]);
            }

            // ═══════════════════════════════════════════════════════════
            // KONSELOR (dari NER, untuk case tanpa verifikasi)
            // ═══════════════════════════════════════════════════════════
            $kodeKonselor = array_filter($hasil->kode_matched ?? [], fn($kode) => str_starts_with($kode, 'G'));
            foreach ($kodeKonselor as $kode) {
                $variabel = VariabelKonselor::where('kode', $kode)->first();
                if (!$variabel) continue;

                $santriId = $hasil->korban_santri_id ?? $hasil->pelaku_santri_id;

                $laporan = LaporanKonselor::create([
                    'hasil_preprocessing_id' => $hasil->id,
                    'santri_id' => $santriId,
                    'kode_konselor' => $kode,
                    'diagnosis_default' => $variabel->gangguan_mental ?? 'Diagnosis belum ditentukan',
                    'tindakan_default' => $variabel->rekomendasi ?? 'Tindakan belum ditentukan',
                    'tanggal_kejadian' => $tanggalKejadian,
                    'status' => 'pending',
                    'approval_status' => 'pending_tenaga_pendidik', // ✅ NEW
                ]);

                // ✅ NEW: Auto-create approval records
                $this->createApprovalRecords($laporan, 'App\Models\LaporanKonselor');

                $created['konselor'][] = $laporan;
                Log::info("Created laporan konselor with approvals (from NER)", [
                    'id' => $laporan->id,
                    'kode' => $kode
                ]);
            }

            DB::commit();

            Log::info("Successfully created all laporan with approvals", [
                'hasil_id' => $hasil->id,
                'pelanggaran_count' => count($created['pelanggaran']),
                'apresiasi_count' => count($created['apresiasi']),
                'konselor_count' => count($created['konselor']),
                'total' => count($created['pelanggaran']) + count($created['apresiasi']) + count($created['konselor']),
            ]);

            return $created;

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Failed to create laporan", [
                'hasil_id' => $hasil->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }

    /**
     * ✅ Create laporan DENGAN verifikasi korban
     * Method ini dipanggil setelah BK verifikasi kondisi korban
     */
    public function createLaporanWithKorbanVerification(HasilPreprocessing $hasil, array $verifiedKodeKonselor = [])
    {
        Log::info('Creating laporan with korban verification', [
            'hasil_id' => $hasil->id,
            'kode_matched' => $hasil->kode_matched,
            'verified_kode_konselor' => $verifiedKodeKonselor,
        ]);

        $created = [
            'pelanggaran' => [],
            'apresiasi' => [],
            'konselor' => []
        ];

        DB::beginTransaction();
        
        try {
            $tanggalKejadian = $hasil->laporanAwal->tanggal_kejadian ?? now()->toDateString();

            // PELANGGARAN
            $kodePelanggaran = array_filter($hasil->kode_matched ?? [], fn($kode) => str_starts_with($kode, 'P'));
            foreach ($kodePelanggaran as $kode) {
                $variabel = VariabelPelanggaran::where('kode', $kode)->first();
                if (!$variabel) continue;

                $laporan = LaporanPelanggaran::create([
                    'hasil_preprocessing_id' => $hasil->id,
                    'pelaku_santri_id' => $hasil->pelaku_santri_id,
                    'korban_santri_id' => $hasil->korban_santri_id,
                    'kode_pelanggaran' => $kode,
                    'bobot_poin' => $variabel->poin ?? 0,
                    'tindakan_default' => $variabel->tindakan ?? 'Tindakan belum ditentukan',
                    'tanggal_kejadian' => $tanggalKejadian,
                    'status' => 'pending',
                    'approval_status' => 'pending_tenaga_pendidik', // ✅ NEW
                ]);

                // ✅ NEW: Auto-create approval records
                $this->createApprovalRecords($laporan, 'App\Models\LaporanPelanggaran');

                $created['pelanggaran'][] = $laporan;
                Log::info("Created laporan pelanggaran (verified) with approvals", [
                    'id' => $laporan->id,
                    'kode' => $kode,
                    'poin' => $variabel->poin
                ]);
            }

            // APRESIASI
            $kodeApresiasi = array_filter($hasil->kode_matched ?? [], fn($kode) => str_starts_with($kode, 'A'));
            foreach ($kodeApresiasi as $kode) {
                $variabel = VariabelApresiasi::where('kode', $kode)->first();
                if (!$variabel) continue;

                $santriId = $hasil->pelaku_santri_id ?? $hasil->korban_santri_id;
                if (!$santriId) continue;

                $laporan = LaporanApresiasi::create([
                    'hasil_preprocessing_id' => $hasil->id,
                    'santri_id' => $santriId,
                    'kode_apresiasi' => $kode,
                    'bobot_poin' => $variabel->poin ?? 0,
                    'reward_default' => $variabel->apresiasi ?? 'Reward belum ditentukan',
                    'tanggal_kejadian' => $tanggalKejadian,
                    'status' => 'pending',
                    'approval_status' => 'pending_tenaga_pendidik', // ✅ NEW
                ]);

                // ✅ NEW: Auto-create approval records
                $this->createApprovalRecords($laporan, 'App\Models\LaporanApresiasi');

                $created['apresiasi'][] = $laporan;
                Log::info("Created laporan apresiasi (verified) with approvals", [
                    'id' => $laporan->id,
                    'kode' => $kode,
                    'poin' => $variabel->poin
                ]);
            }

            // KONSELOR (BASED ON VERIFICATION!)
            if (empty($verifiedKodeKonselor)) {
                Log::info("No konselor kode to create (korban tidak mengalami kondisi mental)", ['hasil_id' => $hasil->id]);
            }

            foreach ($verifiedKodeKonselor as $kode) {
                $variabel = VariabelKonselor::where('kode', $kode)->first();
                if (!$variabel) {
                    Log::warning("Variabel konselor not found", ['kode' => $kode]);
                    continue;
                }

                $santriId = $hasil->korban_santri_id;
                if (!$santriId) {
                    Log::warning("No korban for konselor", ['hasil_id' => $hasil->id, 'kode' => $kode]);
                    continue;
                }

                $laporan = LaporanKonselor::create([
                    'hasil_preprocessing_id' => $hasil->id,
                    'santri_id' => $santriId,
                    'kode_konselor' => $kode,
                    'diagnosis_default' => $variabel->gangguan_mental ?? 'Diagnosis belum ditentukan',
                    'tindakan_default' => $variabel->rekomendasi ?? 'Tindakan belum ditentukan',
                    'tanggal_kejadian' => $tanggalKejadian,
                    'status' => 'pending',
                    'approval_status' => 'pending_tenaga_pendidik', // ✅ NEW
                ]);

                // ✅ NEW: Auto-create approval records
                $this->createApprovalRecords($laporan, 'App\Models\LaporanKonselor');

                $created['konselor'][] = $laporan;
                Log::info("Created laporan konselor (verified by BK) with approvals", [
                    'id' => $laporan->id,
                    'kode' => $kode,
                    'diagnosis' => $variabel->gangguan_mental,
                    'santri_id' => $santriId,
                    'source' => 'verified_by_bk',
                ]);
            }

            DB::commit();

            Log::info("Successfully created all laporan (with verification & approvals)", [
                'hasil_id' => $hasil->id,
                'pelanggaran_count' => count($created['pelanggaran']),
                'apresiasi_count' => count($created['apresiasi']),
                'konselor_count' => count($created['konselor']),
                'total' => count($created['pelanggaran']) + count($created['apresiasi']) + count($created['konselor']),
            ]);

            return $created;

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Failed to create laporan with verification", [
                'hasil_id' => $hasil->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }

    /**
     * ✅ NEW: Auto-create approval records untuk laporan
     * 
     * Logic:
     * 1. Get santri dari laporan
     * 2. Get kelas santri
     * 3. Get semua tenaga pendidik yang ditugaskan di kelas tersebut
     * 4. Create approval record untuk setiap tenaga pendidik
     */
    protected function createApprovalRecords($laporan, string $laporanType): void
    {
        try {
            // Get santri ID (berbeda per jenis laporan)
            $santriId = match($laporanType) {
                'App\Models\LaporanPelanggaran' => $laporan->pelaku_santri_id,
                'App\Models\LaporanApresiasi' => $laporan->santri_id,
                'App\Models\LaporanKonselor' => $laporan->santri_id,
                default => null,
            };

            if (!$santriId) {
                Log::warning('createApprovalRecords: No santri_id', [
                    'laporan_type' => $laporanType,
                    'laporan_id' => $laporan->id
                ]);
                return;
            }

            // Get santri
            $santri = User::with('santriProfile')->find($santriId);
            
            if (!$santri || !$santri->santriProfile || !$santri->santriProfile->kelas_id) {
                Log::warning('createApprovalRecords: Santri tidak punya kelas', [
                    'santri_id' => $santriId,
                    'laporan_type' => $laporanType,
                    'laporan_id' => $laporan->id
                ]);
                return;
            }

            $kelasId = $santri->santriProfile->kelas_id;

            // Get semua tenaga pendidik yang ditugaskan di kelas ini
            $penugasanList = PenugasanKelas::where('kelas_id', $kelasId)
                ->where('is_active', 1)
                ->get();

            if ($penugasanList->isEmpty()) {
                Log::warning('createApprovalRecords: Kelas tidak punya tenaga pendidik', [
                    'kelas_id' => $kelasId,
                    'laporan_type' => $laporanType,
                    'laporan_id' => $laporan->id
                ]);
                return;
            }

            // Create approval record untuk setiap tenaga pendidik
            foreach ($penugasanList as $penugasan) {
                LaporanApproval::create([
                    'laporan_type' => $laporanType,
                    'laporan_id' => $laporan->id,
                    'tenaga_pendidik_id' => $penugasan->user_id,
                    'deadline_at' => now()->addDay(), // 24 jam deadline
                ]);
            }

            Log::info('createApprovalRecords: Success', [
                'laporan_type' => $laporanType,
                'laporan_id' => $laporan->id,
                'kelas_id' => $kelasId,
                'approval_count' => $penugasanList->count()
            ]);

        } catch (\Exception $e) {
            Log::error('createApprovalRecords: Failed', [
                'laporan_type' => $laporanType,
                'laporan_id' => $laporan->id ?? null,
                'error' => $e->getMessage()
            ]);
            // Don't throw - approval creation failure shouldn't block laporan creation
        }
    }

    /**
     * Check if laporan already created for hasil
     */
    public function laporanExists($hasilId)
    {
        return LaporanPelanggaran::where('hasil_preprocessing_id', $hasilId)->exists()
            || LaporanApresiasi::where('hasil_preprocessing_id', $hasilId)->exists()
            || LaporanKonselor::where('hasil_preprocessing_id', $hasilId)->exists();
    }

    /**
     * Get summary of created laporan
     */
    public function getLaporanSummary($hasilId)
    {
        return [
            'pelanggaran' => LaporanPelanggaran::where('hasil_preprocessing_id', $hasilId)->get(),
            'apresiasi' => LaporanApresiasi::where('hasil_preprocessing_id', $hasilId)->get(),
            'konselor' => LaporanKonselor::where('hasil_preprocessing_id', $hasilId)->get(),
        ];
    }
}