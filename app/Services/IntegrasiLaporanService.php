<?php

namespace App\Services;

use App\Models\User;
use App\Models\SantriProfile;
use App\Models\LaporanPelanggaran;
use App\Models\LaporanApresiasi;
use App\Models\LaporanKonselor;
use App\Models\VariabelPelanggaran;
use App\Models\VariabelApresiasi;
use App\Models\VariabelKonselor;
use App\Models\LaporanApproval;
use App\Exceptions\SantriNotFoundException;
use App\Exceptions\KodeNotFoundException;
use Illuminate\Support\Facades\Log;

/**
 * IntegrasiLaporanService — menerima laporan dari aplikasi pengirim (PRD-04).
 *
 * Prinsip:
 * - TANPA preprocessing/NLP. Kode sudah final dari pengirim.
 * - Laporan TETAP melewati GERBANG VALIDASI WALI KELAS seperti alur normal:
 *   dibuat status 'pending' + approval_status 'pending_tenaga_pendidik' + record
 *   laporan_approvals untuk tiap wali kelas santri. Setelah semua wali approve →
 *   'pending_bk' → BK final approve (ApprovalManagementController) → riwayat_santri
 *   + trigger Expert System. Service ini TIDAK melompati gerbang & TIDAK auto-eksekusi.
 * - Fallback: bila santri tidak punya kelas/wali kelas, langsung 'pending_bk' agar
 *   laporan tidak nyangkut (BK tetap bisa memproses).
 * - Idempotensi via external_ref_id (unik per tabel).
 */
class IntegrasiLaporanService
{
    /**
     * Pasang gerbang approval wali kelas (reuse logika LaporanService).
     * Bila tak ada wali (santri tanpa kelas/penugasan) → fallback pending_bk.
     */
    private function setupApproval($laporan, string $type): void
    {
        app(LaporanService::class)->createApprovalRecords($laporan, $type);

        $hasWali = LaporanApproval::where('laporan_type', $type)
            ->where('laporan_id', $laporan->id)->exists();

        if (!$hasWali) {
            $laporan->update(['approval_status' => 'pending_bk']);
            Log::warning('Integrasi: santri tanpa wali kelas → laporan langsung pending_bk', [
                'type' => $type, 'id' => $laporan->id,
            ]);
        }
    }

    /** Resolusi NISN → user santri aktif. Throw bila tidak ada. */
    public function resolveSantri(string $nisn): User
    {
        $profile = SantriProfile::where('nisn', $nisn)->first();
        $user = $profile?->user;

        if (!$user || $user->role !== 'santri') {
            throw new SantriNotFoundException("Santri dengan NISN {$nisn} tidak ditemukan.");
        }
        return $user;
    }

    /** Cek idempotensi: kembalikan laporan lama bila ref_id sudah pernah diproses. */
    private function findExisting(string $modelClass, ?string $refId)
    {
        if (empty($refId)) return null;
        return $modelClass::where('external_ref_id', $refId)->first();
    }

    // ── PELANGGARAN ──────────────────────────────────────────────
    public function buatPelanggaran(array $d): array
    {
        if ($dup = $this->findExisting(LaporanPelanggaran::class, $d['ref_id'] ?? null)) {
            return ['duplicate' => true, 'laporan' => $dup];
        }

        $pelaku = $this->resolveSantri($d['nisn_pelaku']);
        $korban = !empty($d['nisn_korban']) ? $this->resolveSantri($d['nisn_korban']) : null;

        $v = VariabelPelanggaran::where('kode', $d['kode'])->first();
        if (!$v) throw new KodeNotFoundException("Kode pelanggaran {$d['kode']} tidak ditemukan.");

        $laporan = LaporanPelanggaran::create([
            'sumber_input'           => $d['sumber'] ?? 'smart_eksekusi',
            'external_app'           => $d['app'] ?? config('integrasi.default_app'),
            'external_ref_id'        => $d['ref_id'] ?? null,
            'external_actor'         => $d['actor'] ?? null,
            'hasil_preprocessing_id' => null,
            'pelaku_santri_id'       => $pelaku->id,
            'korban_santri_id'       => $korban?->id,
            'kode_pelanggaran'       => $v->kode,
            'bobot_poin'             => $v->poin,
            'tindakan_default'       => $v->tindakan,
            'catatan_bk'             => $d['catatan'] ?? null,
            'tanggal_kejadian'       => $d['tanggal'],
            'status'                 => 'pending',
            'approval_status'        => 'pending_tenaga_pendidik',
        ]);

        $this->setupApproval($laporan, LaporanPelanggaran::class);

        Log::info('Integrasi: laporan_pelanggaran dibuat', [
            'id' => $laporan->id, 'kode' => $v->kode, 'ref_id' => $d['ref_id'] ?? null,
            'sumber' => $laporan->sumber_input, 'approval_status' => $laporan->approval_status,
        ]);

        return ['duplicate' => false, 'laporan' => $laporan->fresh(), 'poin' => $v->poin];
    }

    // ── APRESIASI ────────────────────────────────────────────────
    public function buatApresiasi(array $d): array
    {
        if ($dup = $this->findExisting(LaporanApresiasi::class, $d['ref_id'] ?? null)) {
            return ['duplicate' => true, 'laporan' => $dup];
        }

        $santri = $this->resolveSantri($d['nisn_pelaku']);

        $v = VariabelApresiasi::where('kode', $d['kode'])->first();
        if (!$v) throw new KodeNotFoundException("Kode apresiasi {$d['kode']} tidak ditemukan.");

        $laporan = LaporanApresiasi::create([
            'sumber_input'           => $d['sumber'] ?? 'smart_eksekusi',
            'external_app'           => $d['app'] ?? config('integrasi.default_app'),
            'external_ref_id'        => $d['ref_id'] ?? null,
            'external_actor'         => $d['actor'] ?? null,
            'hasil_preprocessing_id' => null,
            'santri_id'              => $santri->id,
            'kode_apresiasi'         => $v->kode,
            'bobot_poin'             => $v->poin,
            'reward_default'         => $v->apresiasi,
            'catatan_bk'             => $d['catatan'] ?? null,
            'tanggal_kejadian'       => $d['tanggal'],
            'status'                 => 'pending',
            'approval_status'        => 'pending_tenaga_pendidik',
        ]);

        $this->setupApproval($laporan, LaporanApresiasi::class);

        Log::info('Integrasi: laporan_apresiasi dibuat', [
            'id' => $laporan->id, 'kode' => $v->kode, 'ref_id' => $d['ref_id'] ?? null,
            'approval_status' => $laporan->approval_status,
        ]);

        return ['duplicate' => false, 'laporan' => $laporan->fresh(), 'poin' => $v->poin];
    }

    // ── KONSELOR ─────────────────────────────────────────────────
    public function buatKonselor(array $d): array
    {
        if ($dup = $this->findExisting(LaporanKonselor::class, $d['ref_id'] ?? null)) {
            return ['duplicate' => true, 'laporan' => $dup];
        }

        $santri = $this->resolveSantri($d['nisn_korban']);

        $v = VariabelKonselor::where('kode', $d['kode'])->first();
        if (!$v) throw new KodeNotFoundException("Kode konselor {$d['kode']} tidak ditemukan.");

        $laporan = LaporanKonselor::create([
            'sumber_input'           => $d['sumber'] ?? 'smart_eksekusi',
            'external_app'           => $d['app'] ?? config('integrasi.default_app'),
            'external_ref_id'        => $d['ref_id'] ?? null,
            'external_actor'         => $d['actor'] ?? null,
            'hasil_preprocessing_id' => null,
            'santri_id'              => $santri->id,
            'kode_konselor'          => $v->kode,
            'diagnosis_default'      => $v->gangguan_mental,
            'tindakan_default'       => $v->rekomendasi,
            'catatan_bk'             => $d['catatan'] ?? null,
            'tanggal_kejadian'       => $d['tanggal'],
            'status'                 => 'pending',
            'approval_status'        => 'pending_tenaga_pendidik',
        ]);

        $this->setupApproval($laporan, LaporanKonselor::class);

        Log::info('Integrasi: laporan_konselor dibuat', [
            'id' => $laporan->id, 'kode' => $v->kode, 'ref_id' => $d['ref_id'] ?? null,
            'approval_status' => $laporan->approval_status,
        ]);

        return ['duplicate' => false, 'laporan' => $laporan->fresh()];
    }

    // ── ABSENSI TELAT → pelanggaran disiplin waktu ───────────────
    public function buatTelat(array $d): array
    {
        $kode = config('integrasi.absensi_mapping.telat');
        if (!$kode) throw new KodeNotFoundException('Mapping kode telat belum dikonfigurasi.');

        $catatan = trim(($d['kegiatan'] ?? '') . (isset($d['waktu']) ? " (pukul {$d['waktu']})" : ''));

        return $this->buatPelanggaran([
            'nisn_pelaku' => $d['nisn'],
            'nisn_korban' => null,
            'kode'        => $kode,
            'tanggal'     => $d['tanggal'],
            'catatan'     => $catatan !== '' ? "Terlambat: {$catatan}" : 'Terlambat (absensi)',
            'ref_id'      => $d['ref_id'] ?? null,
            'actor'       => $d['actor'] ?? null,
            'app'         => $d['app'] ?? null,
            'sumber'      => 'absensi',
        ]);
    }
}
