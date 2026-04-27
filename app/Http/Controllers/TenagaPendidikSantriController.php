<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\PenugasanKelas;
use App\Models\LaporanPelanggaran;
use App\Models\LaporanApresiasi;
use App\Models\LaporanKonselor;
use App\Models\LaporanExpertSystemPoint;
use App\Models\LaporanExpertSystemKonselor;
use App\Models\BimbinganBerkalaSesi;
use App\Models\RiwayatSantri;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class TenagaPendidikSantriController extends Controller
{
    // 
    // HELPER: ambil kelas_id yang ditugaskan ke user ini
    // 
    private function getKelasIds(): array
    {
        return PenugasanKelas::where('user_id', auth()->id())
            ->where('is_active', 1)
            ->pluck('kelas_id')
            ->toArray();
    }

    // 
    // INDEX - Daftar santri di kelas yang diampu
    // 
    public function index(Request $request)
    {
        $kelasIds = $this->getKelasIds();

        if (empty($kelasIds)) {
            return Inertia::render('SantriKelas/Index', [
                'santriList' => [],
                'kelasList'  => [],
                'filters'    => [],
                'message'    => 'Anda belum ditugaskan di kelas manapun.',
            ]);
        }

        // Kelas yang diampu (untuk filter dropdown)
        $kelasList = \App\Models\Kelas::whereIn('id', $kelasIds)
            ->orderBy('kode_kelas')
            ->get(['id', 'kode_kelas', 'nama'])
            ->map(fn($k) => [
                'id'    => $k->id,
                'label' => "{$k->kode_kelas} - {$k->nama}",
            ]);

        // Query santri di kelas yang diampu
        $query = User::where('role', 'santri')
            ->where('status', 'active')
            ->whereHas('santriProfile', fn($q) => $q->whereIn('kelas_id', $kelasIds))
            ->with('santriProfile.kelas');

        // Filter per kelas
        if ($request->filled('kelas_id')) {
            $query->whereHas('santriProfile', fn($q) => $q->where('kelas_id', $request->kelas_id));
        }

        // Search nama
        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('santriProfile', fn($q) =>
                $q->where('nama_lengkap', 'like', "%{$search}%")
                  ->orWhere('nama_panggilan', 'like', "%{$search}%")
                  ->orWhere('nisn', 'like', "%{$search}%")
            );
        }

        $santriList = $query->get()->map(function ($santri) {
            $profile = $santri->santriProfile;

            // Hitung poin cepat
            $poinPelanggaran = RiwayatSantri::where('santri_id', $santri->id)
                ->where('jenis_laporan', 'pelanggaran')
                ->sum('bobot_poin');
            $poinApresiasi = RiwayatSantri::where('santri_id', $santri->id)
                ->where('jenis_laporan', 'apresiasi')
                ->sum('bobot_poin');

            // Apakah ada konseling aktif?
            $konselingAktif = LaporanExpertSystemKonselor::where('santri_id', $santri->id)
                ->where('status', 'in_progress')
                ->count();

            // Konsekuensi aktif?
            $konsekuensiAktif = LaporanExpertSystemPoint::where('santri_id', $santri->id)
                ->where('jenis', 'konsekuensi')
                ->whereIn('status', ['pending', 'in_progress'])
                ->count();

            return [
                'id'               => $santri->id,
                'nama'             => $profile?->nama_panggilan ?? $profile?->nama_lengkap ?? $santri->username,
                'nama_lengkap'     => $profile?->nama_lengkap ?? $santri->username,
                'nisn'             => $profile?->nisn ?? '-',
                'foto'             => $profile?->foto ? "/storage/{$profile->foto}" : null,
                'kelas'            => $profile?->kelas ? [
                    'id'   => $profile->kelas->id,
                    'kode' => $profile->kelas->kode_kelas,
                    'nama' => $profile->kelas->nama,
                ] : null,
                'net_poin'         => (int) $poinApresiasi - (int) $poinPelanggaran,
                'poin_pelanggaran' => (int) $poinPelanggaran,
                'poin_apresiasi'   => (int) $poinApresiasi,
                'konseling_aktif'  => $konselingAktif,
                'konsekuensi_aktif'=> $konsekuensiAktif,
                // Flag perlu perhatian
                'perlu_perhatian'  => $konselingAktif > 0 || $konsekuensiAktif > 0 || $poinPelanggaran > $poinApresiasi,
            ];
        });

        return Inertia::render('SantriKelas/Index', [
            'santriList' => $santriList,
            'kelasList'  => $kelasList,
            'filters'    => $request->only(['kelas_id', 'search']),
        ]);
    }

    // 
    // SHOW - Profil lengkap satu santri (read-only)
    // 
    public function show(User $santri)
    {
        // Guard: santri harus role santri
        if ($santri->role !== 'santri') {
            abort(404);
        }

        // Guard: santri harus di kelas yang diampu tendik ini
        $kelasIds = $this->getKelasIds();
        $santriKelasId = $santri->santriProfile?->kelas_id;

        if (!$santriKelasId || !in_array($santriKelasId, $kelasIds)) {
            abort(403, 'Anda tidak memiliki akses ke profil santri ini.');
        }

        $santri->load([
            'santriProfile.kelas.penugasanAktif.user.tenagaPendidikProfile',
            'santriProfile.kelas.penugasanAktif.user.guruBkProfile',
        ]);

        $profile = $santri->santriProfile;
        $kelas   = $profile?->kelas;

        //  Profil 
        $santriInfo = [
            'id'             => $santri->id,
            'nama_lengkap'   => $profile?->nama_lengkap ?? $santri->username,
            'nama_panggilan' => $profile?->nama_panggilan ?? '-',
            'nisn'           => $profile?->nisn ?? '-',
            'foto'           => $profile?->foto ? "/storage/{$profile->foto}" : null,
            'jenis_kelamin'  => $profile?->jenis_kelamin ?? '-',
            'tempat_lahir'   => $profile?->tempat_lahir ?? '-',
            'tanggal_lahir'  => $profile?->tanggal_lahir ?? '-',
            'nama_wali'      => $profile?->nama_wali ?? '-',
        ];

        //  Kelas & Wali 
        $kelasInfo  = null;
        $waliKelas  = null;
        $waliAsrama = [];

        if ($kelas && $kelas->kode_kelas !== 'PENDING') {
            $kelasInfo = [
                'id'           => $kelas->id,
                'nama'         => $kelas->nama_lengkap,
                'kode'         => $kelas->kode_kelas,
                'tahun_ajaran' => $kelas->tahun_ajaran,
            ];

            $wk = $kelas->penugasanAktif->where('jenis_penugasan', 'wali_kelas')->first();
            if ($wk) {
                $waliKelas = [
                    'nama' => $wk->user->tenagaPendidikProfile?->nama_lengkap
                           ?? $wk->user->guruBkProfile?->nama_lengkap ?? '-',
                ];
            }

            $waliAsrama = $kelas->penugasanAktif
                ->where('jenis_penugasan', 'wali_asrama')
                ->map(fn($w) => [
                    'nama' => $w->user->tenagaPendidikProfile?->nama_lengkap
                           ?? $w->user->guruBkProfile?->nama_lengkap ?? '-',
                ])->values()->toArray();
        }

        //  Statistik poin 
        $poinPelanggaran = RiwayatSantri::where('santri_id', $santri->id)
            ->where('jenis_laporan', 'pelanggaran')->sum('bobot_poin');
        $poinApresiasi = RiwayatSantri::where('santri_id', $santri->id)
            ->where('jenis_laporan', 'apresiasi')->sum('bobot_poin');

        $statistics = [
            ['label' => 'Total Pelanggaran', 'value' => LaporanPelanggaran::where('pelaku_santri_id', $santri->id)->count(),       'poin' => $poinPelanggaran, 'color' => 'red',    'icon' => 'warning'],
            ['label' => 'Total Apresiasi',   'value' => LaporanApresiasi::where('santri_id', $santri->id)->count(),                 'poin' => $poinApresiasi,  'color' => 'green',  'icon' => 'star'   ],
            ['label' => 'Konseling',         'value' => LaporanKonselor::where('santri_id', $santri->id)->count(),                  'poin' => null,            'color' => 'blue',   'icon' => 'heart'  ],
            ['label' => 'Expert Triggered',  'value' => LaporanExpertSystemPoint::where('santri_id', $santri->id)->count(),         'poin' => null,            'color' => 'purple', 'icon' => 'zap'    ],
        ];

        //  Expert System Point 
        $expertSystemPoint = LaporanExpertSystemPoint::where('santri_id', $santri->id)
            ->orderBy('tanggal_trigger', 'desc')
            ->get()
            ->map(fn($item) => [
                'id'                => $item->id,
                'jenis'             => $item->jenis,
                'jenis_label'       => $item->jenis_label,
                'kode'              => $item->kode,
                'konsekuensi_reward'=> $item->konsekuensi_atau_reward,
                'total_poin'        => $item->total_poin_saat_trigger,
                'tanggal_trigger'   => $item->tanggal_trigger?->format('d M Y'),
                'status'            => $item->status,
                'status_label'      => $item->status_label,
                'final_status'      => $item->final_status,
                'final_status_label'=> $item->final_status_label,
                'has_bukti'         => $item->has_bukti,
                'bukti_approved'    => $item->bukti_approved,
            ]);

        //  Expert System Konselor 
        $expertSystemKonselor = LaporanExpertSystemKonselor::where('santri_id', $santri->id)
            ->with('sesiList')
            ->orderBy('tanggal_trigger', 'desc')
            ->get()
            ->map(fn($item) => [
                'id'             => $item->id,
                'diagnosis_kode' => $item->diagnosis_kode,
                'diagnosis_nama' => $item->diagnosis_nama,
                'sesi_terakhir'  => $item->sesi_bimbingan_terakhir,
                'sesi_count'     => $item->sesiList->count(),
                'progress'       => $item->progress_percentage ?? 0,
                'tanggal_trigger'=> $item->tanggal_trigger?->format('d M Y'),
                'tanggal_selesai'=> $item->tanggal_selesai?->format('d M Y'),
                'status'         => $item->status,
                'status_label'   => $item->status_label,
            ]);

        //  Laporan Konselor (laporan variabel) 
        $laporanKonseling = LaporanKonselor::where('santri_id', $santri->id)
            ->orderBy('tanggal_kejadian', 'desc')
            ->get()
            ->map(fn($item) => [
                'id'                   => $item->id,
                'kode'                 => $item->kode_konselor,
                'sumber'               => $item->sumber ?? 'preprocessing',
                'diagnosis'            => $item->diagnosis_default,
                'tindakan'             => $item->tindakan_default,
                'tanggal_kejadian'     => $item->tanggal_kejadian?->format('d M Y'),
                'approval_status'      => $item->approval_status,
                'approval_status_label'=> $item->approval_status_label,
                'approval_progress'    => $item->approval_progress,
                'status'               => $item->status,
                'status_label'         => $item->status_label,
            ]);

        //  Riwayat Bimbingan Berkala 
        $riwayatBimbingan = BimbinganBerkalaSesi::where('santri_id', $santri->id)
            ->where('status', 'selesai')
            ->with('jadwal:id,judul,tanggal_jadwal')
            ->orderByDesc('reviewed_at')
            ->get()
            ->map(fn($s) => [
                'id'            => $s->id,
                'jadwal_judul'  => $s->jadwal?->judul ?? '-',
                'tanggal'       => $s->jadwal?->tanggal_jadwal?->format('d M Y') ?? '-',
                'tindak_lanjut' => $s->tindak_lanjut,
                'tl_label'      => $s->tindak_lanjut_label,
                'catatan'       => $s->catatan_keputusan,
            ]);


        //  Laporan Pelanggaran 
        $laporanPelanggaran = LaporanPelanggaran::where('pelaku_santri_id', $santri->id)
            ->with('variabelPelanggaran')
            ->orderBy('tanggal_kejadian', 'desc')
            ->get()
            ->map(fn($item) => [
                'id'                    => $item->id,
                'kode'                  => $item->kode_pelanggaran,
                'bobot_poin'            => $item->bobot_poin,
                'tindakan'              => $item->tindakan_default,
                'catatan_bk'            => $item->catatan_bk,
                'tanggal_kejadian'      => $item->tanggal_kejadian?->format('d M Y'),
                'status'                => $item->status,
                'status_label'          => $item->status_label,
                'approval_status'       => $item->approval_status,
                'approval_status_label' => $item->approval_status_label,
                'approval_progress'     => $item->approval_progress,
                'kategori'              => $item->variabelPelanggaran?->kategori ?? '-',
            ]);

        //  Laporan Apresiasi 
        $laporanApresiasi = LaporanApresiasi::where('santri_id', $santri->id)
            ->with('variabelApresiasi')
            ->orderBy('tanggal_kejadian', 'desc')
            ->get()
            ->map(fn($item) => [
                'id'                    => $item->id,
                'kode'                  => $item->kode_apresiasi,
                'bobot_poin'            => $item->bobot_poin,
                'reward'                => $item->reward_default,
                'catatan_bk'            => $item->catatan_bk,
                'tanggal_kejadian'      => $item->tanggal_kejadian?->format('d M Y'),
                'tanggal_reward'        => $item->tanggal_reward?->format('d M Y'),
                'status'                => $item->status,
                'status_label'          => $item->status_label,
                'approval_status'       => $item->approval_status,
                'approval_status_label' => $item->approval_status_label,
                'approval_progress'     => $item->approval_progress,
                'kategori'              => $item->variabelApresiasi?->kategori ?? '-',
            ]);

        return Inertia::render('SantriKelas/Show', [
            'santriInfo'           => $santriInfo,
            'kelasInfo'            => $kelasInfo,
            'waliKelas'            => $waliKelas,
            'waliAsrama'           => $waliAsrama,
            'statistics'           => $statistics,
            'expertSystemPoint'    => $expertSystemPoint,
            'expertSystemKonselor' => $expertSystemKonselor,
            'laporanKonseling'     => $laporanKonseling,
            'riwayatBimbingan'     => $riwayatBimbingan,
            'laporanPelanggaran'   => $laporanPelanggaran,
            'laporanApresiasi'     => $laporanApresiasi,
        ]);
    }
}