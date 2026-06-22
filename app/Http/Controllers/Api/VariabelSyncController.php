<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\VariabelPelanggaran;
use App\Models\VariabelApresiasi;
use App\Models\VariabelKonselor;
use App\Models\SantriProfile;

/**
 * Endpoint sinkronisasi (PRD-04 §5.5): aplikasi pengirim menarik daftar kode variabel
 * agar selalu konsisten dengan RamahAnak (auto-update saat variabel bertambah/berkurang).
 */
class VariabelSyncController extends Controller
{
    public function pelanggaran()
    {
        $data = VariabelPelanggaran::orderBy('kode')->get()->map(fn ($v) => [
            'kode'     => $v->kode,
            'kategori' => $v->kategori,
            'poin'     => $v->poin,
            'label'    => $v->tindakan,
        ]);
        return response()->json(['status' => 'ok', 'jenis' => 'pelanggaran', 'data' => $data]);
    }

    public function apresiasi()
    {
        $data = VariabelApresiasi::orderBy('kode')->get()->map(fn ($v) => [
            'kode'     => $v->kode,
            'kategori' => $v->kategori,
            'poin'     => $v->poin,
            'label'    => $v->apresiasi,
        ]);
        return response()->json(['status' => 'ok', 'jenis' => 'apresiasi', 'data' => $data]);
    }

    public function konselor()
    {
        $data = VariabelKonselor::orderBy('kode')->get()->map(fn ($v) => [
            'kode'     => $v->kode,
            'kategori' => $v->gangguan_mental,
            'poin'     => null,
            'label'    => $v->gangguan_mental,
        ]);
        return response()->json(['status' => 'ok', 'jenis' => 'konselor', 'data' => $data]);
    }

    /** Verifikasi santri ada berdasarkan NISN (opsional, untuk UX pengirim). */
    public function santri(string $nisn)
    {
        $profile = SantriProfile::where('nisn', $nisn)->first();
        if (!$profile || !$profile->user || $profile->user->role !== 'santri') {
            return response()->json(['status' => 'santri_not_found'], 404);
        }
        return response()->json([
            'status' => 'ok',
            'nisn'   => $profile->nisn,
            'nama'   => $profile->nama_lengkap,
            'kelas'  => $profile->kelas,
        ]);
    }
}
