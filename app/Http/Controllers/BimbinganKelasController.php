<?php

namespace App\Http\Controllers;

use App\Models\BimbinganBerkalaJadwal;
use App\Models\BimbinganBerkalaAntrian;
use App\Models\PenugasanKelas;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BimbinganKelasController extends Controller
{
    /**
     * Tampilkan semua jadwal bimbingan di kelas yang ditugaskan
     * ke tenaga pendidik yang sedang login.
     */
    public function index(Request $request)
    {
        $userId = auth()->id();

        // Ambil semua kelas_id yang ditugaskan ke user ini
        $kelasIds = PenugasanKelas::where('user_id', $userId)
            ->where('is_active', 1)
            ->pluck('kelas_id')
            ->toArray();

        if (empty($kelasIds)) {
            return Inertia::render('MyBimbingan/BimbinganKelas/Index', [
                'jadwalList' => [],
                'message'    => 'Anda belum ditugaskan di kelas manapun.',
            ]);
        }

        $query = BimbinganBerkalaJadwal::whereIn('kelas_id', $kelasIds)
            ->with([
                'template:id,judul',
                'kelas:id,kode_kelas,nama',
            ])
            ->withCount('antrian')
            ->orderByDesc('tanggal_jadwal');

        // Filter status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $jadwalList = $query->paginate(15)->through(fn($j) => [
            'id'             => $j->id,
            'judul'          => $j->judul,
            'template_judul' => $j->template?->judul ?? '-',
            'kelas'          => $j->kelas
                ? "{$j->kelas->kode_kelas} — {$j->kelas->nama}"
                : '-',
            'tanggal'        => $j->tanggal_jadwal?->format('d/m/Y'),
            'mode_label'     => $j->mode_label,
            'status'         => $j->status,
            'status_label'   => $j->status_label,
            'status_badge'   => $j->status_badge,
            'progress'       => $j->progress,
            'catatan'        => $j->catatan_untuk_tendik,
        ]);

        return Inertia::render('MyBimbingan/BimbinganKelas/Index', [
            'jadwalList' => $jadwalList,
            'filters'    => $request->only(['status']),
        ]);
    }

    /**
     * Detail progress satu jadwal — tenaga pendidik bisa lihat
     * progress per santri di kelasnya (read-only, tanpa detail jawaban)
     */
    public function show(BimbinganBerkalaJadwal $jadwal)
    {
        $userId = auth()->id();

        // Pastikan jadwal ini ada di kelas yang ditugaskan ke user
        $isAuthorized = PenugasanKelas::where('user_id', $userId)
            ->where('kelas_id', $jadwal->kelas_id)
            ->where('is_active', 1)
            ->exists();

        if (!$isAuthorized) {
            abort(403, 'Anda tidak memiliki akses ke jadwal ini.');
        }

        $jadwal->load([
            'template:id,judul',
            'kelas:id,kode_kelas,nama',
            'antrian' => fn($q) => $q->with([
                'santri:id,username',
                'santri.santriProfile:user_id,nama_panggilan,nisn',
                'sesi:id,antrian_id,status,tindak_lanjut',
            ])->orderBy('nomor_urut'),
        ]);

        return Inertia::render('MyBimbingan/BimbinganKelas/Show', [
            'jadwal' => [
                'id'           => $jadwal->id,
                'judul'        => $jadwal->judul,
                'template'     => $jadwal->template?->judul ?? '-',
                'kelas'        => $jadwal->kelas
                    ? "{$jadwal->kelas->kode_kelas} — {$jadwal->kelas->nama}"
                    : '-',
                'tanggal'      => $jadwal->tanggal_jadwal?->format('d/m/Y'),
                'status'       => $jadwal->status,
                'status_label' => $jadwal->status_label,
                'progress'     => $jadwal->progress,
                'catatan'      => $jadwal->catatan_untuk_tendik,
                'antrian'      => $jadwal->antrian->map(fn($a) => [
                    'nomor_urut'   => $a->nomor_urut,
                    'status'       => $a->status,
                    'status_label' => $a->status_label,
                    'status_badge' => $a->status_badge,
                    'santri_nama'  => $a->santri?->santriProfile?->nama_panggilan
                                  ?? $a->santri?->username ?? '-',
                    'nisn'         => $a->santri?->santriProfile?->nisn ?? '-',
                    // Hanya tampilkan tindak_lanjut (bukan detail gejala)
                    'tindak_lanjut' => $a->sesi?->tindak_lanjut,
                ]),
            ],
        ]);
    }
}