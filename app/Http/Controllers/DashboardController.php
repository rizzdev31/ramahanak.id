<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Kelas;
use App\Models\PenugasanKelas;
use App\Models\RiwayatKelasSantri;
use App\Models\LaporanAwal;
use App\Models\LaporanPelanggaran;
use App\Models\LaporanApresiasi;
use App\Models\LaporanKonselor;
use App\Models\LaporanExpertSystemPoint;
use App\Models\LaporanExpertSystemKonselor;
use App\Models\LaporanApproval;
use App\Models\RiwayatSantri;
use App\Models\BimbinganBerkalaJadwal;
use App\Models\BimbinganBerkalaSesi;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index()
    {
        $user = Auth::user()->load([
            'guruBkProfile',
            'tenagaPendidikProfile',
            'santriProfile.kelas',
        ]);

        $role = $user->role;

        if ($role === 'guru_bk') {
            return Inertia::render('Dashboard/GuruBk', [
                'dashboardData' => $this->dataGuruBk($user),
            ]);
        } elseif ($role === 'tenaga_pendidik') {
            return Inertia::render('Dashboard/TenagaPendidik', [
                'dashboardData' => $this->dataTenagaPendidik($user),
            ]);
        } else {
            return Inertia::render('Dashboard/Santri', [
                'dashboardData' => $this->dataSantri($user),
            ]);
        }
    }

    // =========================================================
    // DATA GURU BK
    // =========================================================
    private function dataGuruBk($user): array
    {
        $profile = $user->guruBkProfile;

        $totalSantri         = User::where('role', 'santri')->where('status', 'active')->count();
        $totalKelas          = Kelas::where('status', 'active')->where('kode_kelas', '!=', 'PENDING')->count();
        $totalTenagaPendidik = User::whereIn('role', ['guru_bk', 'tenaga_pendidik'])->where('status', 'active')->count();
        $userPending         = User::where('status', 'pending')->count();

        $kelasKosong = Kelas::where('status', 'active')
            ->where('kode_kelas', '!=', 'PENDING')
            ->whereDoesntHave('penugasanAktif', fn($q) => $q->where('jenis_penugasan', 'wali_kelas'))
            ->count();

        $userPendingList = User::where('status', 'pending')
            ->with(['guruBkProfile', 'tenagaPendidikProfile', 'santriProfile'])
            ->latest()->take(5)->get()
            ->map(fn($u) => [
                'id'       => $u->id,
                'username' => $u->username,
                'email'    => $u->email,
                'role'     => $u->role,
                'nama'     => $u->guruBkProfile?->nama_lengkap
                           ?? $u->tenagaPendidikProfile?->nama_lengkap
                           ?? $u->santriProfile?->nama_lengkap ?? '-',
            ]);

        // Chart laporan trend 6 bulan
        $chartLaporan = collect();
        for ($i = 5; $i >= 0; $i--) {
            $month = Carbon::now()->subMonths($i);
            $s = $month->copy()->startOfMonth();
            $e = $month->copy()->endOfMonth();
            $chartLaporan->push([
                'bulan'       => $month->format('M'),
                'pelanggaran' => LaporanPelanggaran::whereBetween('created_at', [$s, $e])->count(),
                'apresiasi'   => LaporanApresiasi::whereBetween('created_at', [$s, $e])->count(),
            ]);
        }

        // Chart perkembangan santri
        $santriPoin = DB::table('users')
            ->where('users.role', 'santri')->where('users.status', 'active')
            ->leftJoin('laporan_pelanggaran', function ($j) {
                $j->on('users.id', '=', 'laporan_pelanggaran.pelaku_santri_id')
                  ->where('laporan_pelanggaran.status', 'selesai');
            })
            ->leftJoin('laporan_apresiasi', function ($j) {
                $j->on('users.id', '=', 'laporan_apresiasi.santri_id')
                  ->where('laporan_apresiasi.status', 'diberikan');
            })
            ->select('users.id', DB::raw(
                'COALESCE(SUM(laporan_apresiasi.bobot_poin), 0) - COALESCE(SUM(laporan_pelanggaran.bobot_poin), 0) as total_poin'
            ))
            ->groupBy('users.id')->get();

        $chartPerkembanganSantri = [
            ['kategori' => 'Sangat Baik', 'jumlah' => $santriPoin->filter(fn($s) => $s->total_poin >= 200)->count(),                                  'color' => '#10B981'],
            ['kategori' => 'Baik',        'jumlah' => $santriPoin->filter(fn($s) => $s->total_poin >= 100 && $s->total_poin < 200)->count(),           'color' => '#3B82F6'],
            ['kategori' => 'Cukup',       'jumlah' => $santriPoin->filter(fn($s) => $s->total_poin >= 0   && $s->total_poin < 100)->count(),           'color' => '#F59E0B'],
            ['kategori' => 'Kurang',      'jumlah' => $santriPoin->filter(fn($s) => $s->total_poin < 0)->count(),                                      'color' => '#EF4444'],
        ];

        // Chart expert system
        $chartExpertSystem = [
            ['status' => 'Pending',     'value' => DB::table('laporan_expert_system_konselor')->where('status', 'pending')->count(),     'color' => '#F59E0B'],
            ['status' => 'In Progress', 'value' => DB::table('laporan_expert_system_konselor')->where('status', 'in_progress')->count(), 'color' => '#3B82F6'],
            ['status' => 'Completed',   'value' => DB::table('laporan_expert_system_konselor')->where('status', 'completed')->count(),   'color' => '#10B981'],
        ];

        // Top 5 santri terbaik
        $topSantriBaik = DB::table('users')
            ->where('users.role', 'santri')->where('users.status', 'active')
            ->leftJoin('santri_profiles', 'users.id', '=', 'santri_profiles.user_id')
            ->leftJoin('laporan_pelanggaran', fn($j) => $j->on('users.id', '=', 'laporan_pelanggaran.pelaku_santri_id')->where('laporan_pelanggaran.status', 'selesai'))
            ->leftJoin('laporan_apresiasi',   fn($j) => $j->on('users.id', '=', 'laporan_apresiasi.santri_id')->where('laporan_apresiasi.status', 'diberikan'))
            ->select('users.id', 'santri_profiles.nama_lengkap', 'santri_profiles.foto',
                DB::raw('COALESCE(SUM(laporan_apresiasi.bobot_poin), 0) - COALESCE(SUM(laporan_pelanggaran.bobot_poin), 0) as total_poin'))
            ->groupBy('users.id', 'santri_profiles.nama_lengkap', 'santri_profiles.foto')
            ->orderByDesc('total_poin')->limit(5)->get()
            ->map(fn($s) => ['id' => $s->id, 'nama' => $s->nama_lengkap ?? '-', 'foto' => $s->foto ? "/storage/{$s->foto}" : null, 'poin' => (int) $s->total_poin]);

        // Top 5 santri bermasalah
        $topSantriBermasalah = DB::table('users')
            ->where('users.role', 'santri')->where('users.status', 'active')
            ->leftJoin('santri_profiles', 'users.id', '=', 'santri_profiles.user_id')
            ->leftJoin('laporan_pelanggaran', fn($j) => $j->on('users.id', '=', 'laporan_pelanggaran.pelaku_santri_id')->where('laporan_pelanggaran.status', 'selesai'))
            ->leftJoin('laporan_apresiasi',   fn($j) => $j->on('users.id', '=', 'laporan_apresiasi.santri_id')->where('laporan_apresiasi.status', 'diberikan'))
            ->select('users.id', 'santri_profiles.nama_lengkap', 'santri_profiles.foto',
                DB::raw('COALESCE(SUM(laporan_apresiasi.bobot_poin), 0) - COALESCE(SUM(laporan_pelanggaran.bobot_poin), 0) as total_poin'))
            ->groupBy('users.id', 'santri_profiles.nama_lengkap', 'santri_profiles.foto')
            ->orderBy('total_poin')->limit(5)->get()
            ->map(fn($s) => ['id' => $s->id, 'nama' => $s->nama_lengkap ?? '-', 'foto' => $s->foto ? "/storage/{$s->foto}" : null, 'poin' => (int) $s->total_poin]);

        // Approval pending konselor
        $konselorPendingBk     = LaporanKonselor::where('approval_status', 'pending_bk')->count();
        $konselorPendingTendik = LaporanKonselor::where('approval_status', 'pending_tenaga_pendidik')->count();

        // ---- Bimbingan Berkala statistik --------------------------
        $totalJadwal      = BimbinganBerkalaJadwal::count();
        $jadwalAktif      = BimbinganBerkalaJadwal::whereIn('status', ['aktif', 'berjalan'])->count();
        $jadwalSelesai    = BimbinganBerkalaJadwal::where('status', 'selesai')->count();
        $totalSesiSelesai = BimbinganBerkalaSesi::where('status', 'selesai')->count();

        $tindakLanjutDist = BimbinganBerkalaSesi::where('status', 'selesai')
            ->select('tindak_lanjut', DB::raw('count(*) as total'))
            ->groupBy('tindak_lanjut')
            ->pluck('total', 'tindak_lanjut')->toArray();

        $chartTindakLanjut = [
            ['name' => 'Tidak Perlu',    'value' => $tindakLanjutDist['tidak_perlu']    ?? 0, 'color' => '#10B981'],
            ['name' => 'Dipantau',       'value' => $tindakLanjutDist['pantau']          ?? 0, 'color' => '#F59E0B'],
            ['name' => 'Rujuk Konseling','value' => $tindakLanjutDist['rujuk_konseling'] ?? 0, 'color' => '#EF4444'],
        ];

        $chartBimbingan = collect();
        for ($i = 5; $i >= 0; $i--) {
            $month = Carbon::now()->subMonths($i);
            $s = $month->copy()->startOfMonth();
            $e = $month->copy()->endOfMonth();
            $chartBimbingan->push([
                'bulan'  => $month->format('M'),
                'selesai'=> BimbinganBerkalaSesi::where('status', 'selesai')->whereBetween('reviewed_at', [$s, $e])->count(),
                'rujuk'  => BimbinganBerkalaSesi::where('status', 'selesai')->where('tindak_lanjut', 'rujuk_konseling')->whereBetween('reviewed_at', [$s, $e])->count(),
                'pantau' => BimbinganBerkalaSesi::where('status', 'selesai')->where('tindak_lanjut', 'pantau')->whereBetween('reviewed_at', [$s, $e])->count(),
            ]);
        }

        $jadwalBerjalan = BimbinganBerkalaJadwal::whereIn('status', ['aktif', 'berjalan'])
            ->with(['kelas:id,kode_kelas,nama'])
            ->withCount(['antrian', 'antrian as antrian_selesai_count' => fn($q) => $q->where('status', 'selesai')])
            ->latest()->take(5)->get()
            ->map(fn($j) => [
                'id'     => $j->id,
                'judul'  => $j->judul,
                'kelas'  => $j->kelas?->kode_kelas ?? '-',
                'status' => $j->status,
                'total'  => $j->antrian_count,
                'selesai'=> $j->antrian_selesai_count,
                'persen' => $j->antrian_count > 0 ? round(($j->antrian_selesai_count / $j->antrian_count) * 100) : 0,
            ]);

        // ---- Laporan Baru Masuk (unified feed semua jenis) ----------
        // Menampilkan semua laporan aktif yang perlu monitoring BK,
        // diurutkan dari yang paling baru. Maks 5 per jenis = 15 item total.
        $feedPelanggaran = LaporanPelanggaran::with(['pelakuSantri.santriProfile'])
            ->whereIn('approval_status', ['pending_tenaga_pendidik', 'pending_bk'])
            ->latest()->take(5)->get()
            ->map(fn($l) => [
                'id'                    => $l->id,
                'jenis'                 => 'pelanggaran',
                'jenis_label'           => 'Pelanggaran',
                'kode'                  => $l->kode_pelanggaran,
                'santri_nama'           => $l->pelakuSantri?->santriProfile?->nama_panggilan
                                        ?? $l->pelakuSantri?->santriProfile?->nama_lengkap ?? '-',
                'approval_status'       => $l->approval_status,
                'approval_status_label' => $l->approval_status_label,
                'created_at'            => $l->created_at?->format('d M Y H:i'),
                'created_at_raw'        => $l->created_at?->toISOString(),
                'color'                 => 'red',
                'route_index'           => 'laporan-pelanggaran.index',
                'route_show'            => 'laporan-pelanggaran.show',
            ]);

        $feedApresiasi = LaporanApresiasi::with(['santri.santriProfile'])
            ->whereIn('approval_status', ['pending_tenaga_pendidik', 'pending_bk'])
            ->latest()->take(5)->get()
            ->map(fn($l) => [
                'id'                    => $l->id,
                'jenis'                 => 'apresiasi',
                'jenis_label'           => 'Apresiasi',
                'kode'                  => $l->kode_apresiasi,
                'santri_nama'           => $l->santri?->santriProfile?->nama_panggilan
                                        ?? $l->santri?->santriProfile?->nama_lengkap ?? '-',
                'approval_status'       => $l->approval_status,
                'approval_status_label' => $l->approval_status_label,
                'created_at'            => $l->created_at?->format('d M Y H:i'),
                'created_at_raw'        => $l->created_at?->toISOString(),
                'color'                 => 'emerald',
                'route_index'           => 'laporan-apresiasi.index',
                'route_show'            => 'laporan-apresiasi.show',
            ]);

        $feedKonselor = LaporanKonselor::with(['santri.santriProfile'])
            ->whereIn('approval_status', ['pending_tenaga_pendidik', 'pending_bk'])
            ->latest()->take(5)->get()
            ->map(fn($l) => [
                'id'                    => $l->id,
                'jenis'                 => 'konselor',
                'jenis_label'           => 'Konseling',
                'kode'                  => $l->kode_konselor,
                'santri_nama'           => $l->santri?->santriProfile?->nama_panggilan
                                        ?? $l->santri?->santriProfile?->nama_lengkap ?? '-',
                'approval_status'       => $l->approval_status,
                'approval_status_label' => $l->approval_status_label,
                'created_at'            => $l->created_at?->format('d M Y H:i'),
                'created_at_raw'        => $l->created_at?->toISOString(),
                'color'                 => 'blue',
                'route_index'           => 'laporan-konselor.index',
                'route_show'            => 'laporan-konselor.show',
            ]);

        $feedEsPoint = LaporanExpertSystemPoint::with(['santri.santriProfile'])
            ->where('status', 'pending')
            ->latest('tanggal_trigger')->take(5)->get()
            ->map(fn($l) => [
                'id'                    => $l->id,
                'jenis'                 => 'es_point',
                'jenis_label'           => 'Expert Point',
                'kode'                  => $l->kode,
                'santri_nama'           => $l->santri?->santriProfile?->nama_panggilan
                                        ?? $l->santri?->santriProfile?->nama_lengkap ?? '-',
                'approval_status'       => 'pending_bk',
                'approval_status_label' => 'Perlu Aksi BK',
                'created_at'            => $l->tanggal_trigger?->format('d M Y H:i'),
                'created_at_raw'        => $l->tanggal_trigger?->toISOString(),
                'color'                 => 'amber',
                'route_index'           => 'expert-system-point.index',
                'route_show'            => 'expert-system-point.show',
            ]);

        // Gabung, sort by created_at desc, ambil 15 terbaru
        $laporanBaru = $feedPelanggaran
            ->concat($feedApresiasi)
            ->concat($feedKonselor)
            ->concat($feedEsPoint)
            ->sortByDesc('created_at_raw')
            ->values()
            ->take(15)
            ->toArray();

        // ---- Statistik Pending per Jenis --------------------------
        $statistikPending = [
            [
                'label'  => 'Pelanggaran',
                'pending_wali' => LaporanPelanggaran::where('approval_status', 'pending_tenaga_pendidik')->count(),
                'pending_bk'   => LaporanPelanggaran::where('approval_status', 'pending_bk')->count(),
                'color'  => '#F87171',
                'route'  => 'laporan-pelanggaran.index',
            ],
            [
                'label'  => 'Apresiasi',
                'pending_wali' => LaporanApresiasi::where('approval_status', 'pending_tenaga_pendidik')->count(),
                'pending_bk'   => LaporanApresiasi::where('approval_status', 'pending_bk')->count(),
                'color'  => '#34D399',
                'route'  => 'laporan-apresiasi.index',
            ],
            [
                'label'  => 'Konseling',
                'pending_wali' => LaporanKonselor::where('approval_status', 'pending_tenaga_pendidik')->count(),
                'pending_bk'   => LaporanKonselor::where('approval_status', 'pending_bk')->count(),
                'color'  => '#60A5FA',
                'route'  => 'laporan-konselor.index',
            ],
            [
                'label'  => 'Expert Point',
                'pending_wali' => 0,
                'pending_bk'   => LaporanExpertSystemPoint::where('status', 'pending')->count(),
                'color'  => '#FBBF24',
                'route'  => 'expert-system-point.index',
            ],
            [
                'label'  => 'ES Konselor',
                'pending_wali' => 0,
                'pending_bk'   => LaporanExpertSystemKonselor::where('status', 'pending')->count(),
                'color'  => '#A78BFA',
                'route'  => 'expert-system-konselor.index',
            ],
        ];

        return [
            'role'    => 'guru_bk',
            'nama'    => $profile?->nama_lengkap ?? $user->username,
            'jabatan' => $profile?->jabatan ?? 'Guru BK',
            'foto'    => $profile?->foto ? "/storage/{$profile->foto}" : null,
            'stats'   => [
                ['label' => 'Total Santri Aktif',  'value' => $totalSantri,         'color' => 'blue',   'icon' => 'users'  ],
                ['label' => 'Total Kelas Aktif',   'value' => $totalKelas,           'color' => 'green',  'icon' => 'kelas'  ],
                ['label' => 'Tenaga Pendidik',     'value' => $totalTenagaPendidik,  'color' => 'purple', 'icon' => 'staff'  ],
                ['label' => 'Menunggu Persetujuan','value' => $userPending,          'color' => 'yellow', 'icon' => 'pending'],
                ['label' => 'Kelas Belum Ada Wali','value' => $kelasKosong,          'color' => 'red',    'icon' => 'warning'],
            ],
            'userPendingList'          => $userPendingList,
            'chartLaporan'             => $chartLaporan->toArray(),
            'chartPerkembanganSantri'  => $chartPerkembanganSantri,
            'chartExpertSystem'        => $chartExpertSystem,
            'topSantriBaik'            => $topSantriBaik->toArray(),
            'topSantriBermasalah'      => $topSantriBermasalah->toArray(),
            'bimbingan' => [
                'total_jadwal'            => $totalJadwal,
                'jadwal_aktif'            => $jadwalAktif,
                'jadwal_selesai'          => $jadwalSelesai,
                'total_sesi'              => $totalSesiSelesai,
                'konselor_pending_bk'     => $konselorPendingBk,
                'konselor_pending_tendik' => $konselorPendingTendik,
            ],
            'chartTindakLanjut' => $chartTindakLanjut,
            'chartBimbingan'    => $chartBimbingan->toArray(),
            'jadwalBerjalan'    => $jadwalBerjalan->toArray(),
            'laporanBaru'       => $laporanBaru,
            'statistikPending'  => $statistikPending,
        ];
    }

    // =========================================================
    // DATA TENAGA PENDIDIK
    // =========================================================
    private function dataTenagaPendidik($user): array
    {
        $profile = $user->tenagaPendidikProfile;

        $penugasanRaw = PenugasanKelas::where('user_id', $user->id)
            ->where('is_active', 1)->with(['kelas'])->get();

        $kelasIds = $penugasanRaw->pluck('kelas_id')->filter()->toArray();

        $penugasan = $penugasanRaw->map(function ($p) use ($user) {
            $kelas   = $p->kelas;
            $kelasId = $p->kelas_id;

            $jmlSantri = User::where('role', 'santri')->where('status', 'active')
                ->whereHas('santriProfile', fn($q) => $q->where('kelas_id', $kelasId))->count();

            $pelanggaranAktif = LaporanPelanggaran::whereHas('pelakuSantri.santriProfile', fn($q) => $q->where('kelas_id', $kelasId))
                ->whereIn('approval_status', ['pending_tenaga_pendidik', 'pending_bk'])->count();

            $konselingAktif = LaporanKonselor::whereHas('santri.santriProfile', fn($q) => $q->where('kelas_id', $kelasId))
                ->whereIn('approval_status', ['pending_tenaga_pendidik', 'pending_bk'])->count();

            $approvalPending = LaporanApproval::where('tenaga_pendidik_id', $user->id)
                ->whereNull('approved_at')->count();

            $jadwalBimbinganCount = BimbinganBerkalaJadwal::where('kelas_id', $kelasId)
                ->whereIn('status', ['aktif', 'berjalan', 'selesai'])->count();

            return [
                'kelas_id'          => $kelasId,
                'kelas_nama'        => $kelas?->nama_lengkap ?? '-',
                'kelas_kode'        => $kelas?->kode_kelas ?? '-',
                'jenis'             => $p->jenis_penugasan,
                'jenis_label'       => $p->jenis_penugasan === 'wali_kelas' ? 'Wali Kelas' : 'Wali Asrama',
                'jml_santri'        => $jmlSantri,
                'pelanggaran_aktif' => $pelanggaranAktif,
                'konseling_aktif'   => $konselingAktif,
                'approval_pending'  => $approvalPending,
                'jadwal_bimbingan'  => $jadwalBimbinganCount,
            ];
        });

        $totalApprovalPending = LaporanApproval::where('tenaga_pendidik_id', $user->id)
            ->whereNull('approved_at')->count();

        $totalApprovalOverdue = LaporanApproval::where('tenaga_pendidik_id', $user->id)
            ->whereNull('approved_at')->where('deadline_at', '<', now())->count();

        $approvalList = LaporanApproval::where('tenaga_pendidik_id', $user->id)
            ->whereNull('approved_at')->with('laporan')->latest()->take(5)->get()
            ->map(function ($a) {
                $laporan    = $a->laporan;
                $santriNama = '-';
                if ($laporan) {
                    $santri     = $laporan->santri ?? $laporan->pelakuSantri ?? null;
                    $santriNama = $santri?->santriProfile?->nama_panggilan
                               ?? $santri?->santriProfile?->nama_lengkap
                               ?? $santri?->username ?? '-';
                }
                return [
                    'id'          => $a->id,
                    'laporan_id'  => $a->laporan_id,
                    'jenis'       => $a->jenis_laporan_label,
                    'santri_nama' => $santriNama,
                    'is_overdue'  => $a->isOverdue(),
                    'deadline'    => $a->deadline_at?->format('d/m/Y'),
                    'created_at'  => $a->created_at?->format('d/m/Y'),
                ];
            });

        $chartSantriPerKelas = $penugasan->map(fn($p) => [
            'kelas'  => $p['kelas_kode'],
            'santri' => $p['jml_santri'],
        ])->values()->toArray();

        // Jadwal bimbingan di kelas yang diampu (5 terbaru)
        $jadwalBimbinganList = !empty($kelasIds)
            ? BimbinganBerkalaJadwal::whereIn('kelas_id', $kelasIds)
                ->with(['kelas:id,kode_kelas,nama'])
                ->withCount(['antrian', 'antrian as antrian_selesai_count' => fn($q) => $q->where('status', 'selesai')])
                ->orderByDesc('tanggal_jadwal')->take(5)->get()
                ->map(fn($j) => [
                    'id'          => $j->id,
                    'judul'       => $j->judul,
                    'kelas'       => $j->kelas?->kode_kelas ?? '-',
                    'tanggal'     => $j->tanggal_jadwal?->format('d/m/Y'),
                    'status'      => $j->status,
                    'status_label'=> $j->status_label,
                    'total'       => $j->antrian_count,
                    'selesai'     => $j->antrian_selesai_count,
                    'persen'      => $j->antrian_count > 0
                        ? round(($j->antrian_selesai_count / $j->antrian_count) * 100) : 0,
                ])->toArray()
            : [];

        // Chart tindak lanjut bimbingan di kelas yang diampu
        $chartTindakLanjutKelas = [];
        if (!empty($kelasIds)) {
            $dist = BimbinganBerkalaSesi::where('status', 'selesai')
                ->whereHas('jadwal', fn($q) => $q->whereIn('kelas_id', $kelasIds))
                ->select('tindak_lanjut', DB::raw('count(*) as total'))
                ->groupBy('tindak_lanjut')
                ->pluck('total', 'tindak_lanjut')->toArray();

            $chartTindakLanjutKelas = [
                ['name' => 'Aman',    'value' => $dist['tidak_perlu']    ?? 0, 'color' => '#10B981'],
                ['name' => 'Pantau',  'value' => $dist['pantau']          ?? 0, 'color' => '#F59E0B'],
                ['name' => 'Dirujuk', 'value' => $dist['rujuk_konseling'] ?? 0, 'color' => '#EF4444'],
            ];
        }

        $totalJadwalBimbingan = !empty($kelasIds)
            ? BimbinganBerkalaJadwal::whereIn('kelas_id', $kelasIds)->count()
            : 0;

        return [
            'role'          => 'tenaga_pendidik',
            'nama'          => $profile?->nama_lengkap ?? $user->username,
            'jabatan'       => $profile?->jabatan ?? 'Tenaga Pendidik',
            'foto'          => $profile?->foto ? "/storage/{$profile->foto}" : null,
            'penugasan'     => $penugasan->values()->toArray(),
            'approval_list' => $approvalList->toArray(),
            'jadwal_bimbingan'       => $jadwalBimbinganList,
            'chart_santri_per_kelas' => $chartSantriPerKelas,
            'chart_tindak_lanjut'    => $chartTindakLanjutKelas,
            'stats' => [
                ['label' => 'Kelas Ditugaskan',  'value' => $penugasan->count(),          'color' => 'blue',   'icon' => 'kelas'  ],
                ['label' => 'Total Santri',       'value' => $penugasan->sum('jml_santri'), 'color' => 'green',  'icon' => 'users'  ],
                ['label' => 'Approval Pending',   'value' => $totalApprovalPending,         'color' => 'yellow', 'icon' => 'pending'],
                ['label' => 'Overdue',            'value' => $totalApprovalOverdue,          'color' => 'red',    'icon' => 'warning'],
                ['label' => 'Jadwal Bimbingan',   'value' => $totalJadwalBimbingan,          'color' => 'indigo', 'icon' => 'book'   ],
            ],
        ];
    }

    // =========================================================
    // DATA SANTRI  FULL OVERVIEW
    // Props yang dikirim ke Dashboard/Santri.jsx:
    //   santriInfo: nama, nisn, foto, is_pending, kelas, wali_kelas, wali_asrama
    //   net_poin, stats (5 item), chart_laporan (bar chart)
    //   expert_point_aktif, konseling_aktif, laporan_konselor_pending
    //   laporan_terbaru (timeline ringkas 5 item)
    //   ringkasan: pelanggaran, apresiasi, konseling, es_konselor, konsekuensi, reward
    // =========================================================
    private function dataSantri($user): array
    {
        $santriId = $user->id;

        $profile = $user->santriProfile?->load([
            'kelas.penugasanAktif.user.guruBkProfile',
            'kelas.penugasanAktif.user.tenagaPendidikProfile',
        ]);

        $kelas     = $profile?->kelas;
        $isPending = $kelas?->kode_kelas === 'PENDING';

        // ---- Kelas & Wali ----------------------------------------
        $kelasData  = null;
        $waliKelas  = null;
        $waliAsrama = [];

        if ($kelas && !$isPending) {
            $kelasData = [
                'nama'         => $kelas->nama_lengkap,
                'kode'         => $kelas->kode_kelas,
                'tahun_ajaran' => $kelas->tahun_ajaran,
            ];

            $wk = $kelas->penugasanAktif->where('jenis_penugasan', 'wali_kelas')->first();
            if ($wk) {
                $foto = $wk->user->guruBkProfile?->foto ?? $wk->user->tenagaPendidikProfile?->foto;
                $waliKelas = [
                    'nama' => $wk->user->guruBkProfile?->nama_lengkap
                           ?? $wk->user->tenagaPendidikProfile?->nama_lengkap ?? '-',
                    'foto' => $foto ? "/storage/{$foto}" : null,
                ];
            }

            $waliAsrama = $kelas->penugasanAktif
                ->where('jenis_penugasan', 'wali_asrama')
                ->map(function ($w) {
                    $foto = $w->user->guruBkProfile?->foto ?? $w->user->tenagaPendidikProfile?->foto;
                    return [
                        'nama' => $w->user->guruBkProfile?->nama_lengkap
                               ?? $w->user->tenagaPendidikProfile?->nama_lengkap ?? '-',
                        'foto' => $foto ? "/storage/{$foto}" : null,
                    ];
                })->values()->toArray();
        }

        // ---- Poin akumulasi --------------------------------------
        $poinPelanggaran = (int) RiwayatSantri::where('santri_id', $santriId)
            ->where('jenis_laporan', 'pelanggaran')->whereNotNull('bobot_poin')->sum('bobot_poin');
        $poinApresiasi   = (int) RiwayatSantri::where('santri_id', $santriId)
            ->where('jenis_laporan', 'apresiasi')->sum('bobot_poin');

        // ---- Count semua laporan ---------------------------------
        $cntPelanggaran  = LaporanPelanggaran::where('pelaku_santri_id', $santriId)->count();
        $cntApresiasi    = LaporanApresiasi::where('santri_id', $santriId)->count();
        $cntKonseling    = LaporanKonselor::where('santri_id', $santriId)->count();
        $cntEsKonselor   = LaporanExpertSystemKonselor::where('santri_id', $santriId)->count();
        $cntKonsekuensi  = LaporanExpertSystemPoint::where('santri_id', $santriId)->where('jenis', 'konsekuensi')->count();
        $cntReward       = LaporanExpertSystemPoint::where('santri_id', $santriId)->where('jenis', 'reward')->count();
        $cntKonselingAktif    = LaporanExpertSystemKonselor::where('santri_id', $santriId)->where('status', 'in_progress')->count();
        $cntKonsekuensiAktif  = LaporanExpertSystemPoint::where('santri_id', $santriId)->where('jenis', 'konsekuensi')->whereIn('status', ['pending', 'in_progress'])->count();

        // ---- Stats cards (5 item) --------------------------------
        $stats = [
            ['label' => 'Poin Pelanggaran',  'value' => $poinPelanggaran,       'icon' => 'warning', 'color' => 'red'   ],
            ['label' => 'Poin Apresiasi',    'value' => $poinApresiasi,          'icon' => 'star',    'color' => 'green' ],
            ['label' => 'Konseling Aktif',   'value' => $cntKonselingAktif,      'icon' => 'heart',   'color' => 'blue'  ],
            ['label' => 'Konsekuensi Aktif', 'value' => $cntKonsekuensiAktif,    'icon' => 'zap',     'color' => 'yellow'],
            ['label' => 'Total Konseling',   'value' => $cntKonseling,           'icon' => 'report',  'color' => 'purple'],
        ];

        // ---- Chart laporan (bar chart 6 kategori) ---------------
        $cntBimbingan = BimbinganBerkalaSesi::where('santri_id', $santriId)
            ->where('status', 'selesai')->count();

        $chartLaporan = [
            ['jenis' => 'Pelanggaran', 'total' => $cntPelanggaran,              'color' => '#F87171'],
            ['jenis' => 'Apresiasi',   'total' => $cntApresiasi,                'color' => '#34D399'],
            ['jenis' => 'Konseling',   'total' => $cntKonseling,                'color' => '#818CF8'],
            ['jenis' => 'ES Point',    'total' => $cntKonsekuensi + $cntReward, 'color' => '#F59E0B'],
            ['jenis' => 'ES Konselor', 'total' => $cntEsKonselor,               'color' => '#60A5FA'],
            ['jenis' => 'Bimbingan',   'total' => $cntBimbingan,                'color' => '#2DD4BF'],
        ];

        // ---- Expert System Point aktif (perlu tindakan) ----------
        $expertPointAktif = LaporanExpertSystemPoint::where('santri_id', $santriId)
            ->whereIn('status', ['pending', 'in_progress'])
            ->orderByDesc('tanggal_trigger')->take(5)->get()
            ->map(function ($item) {
                $item->updateOverdueStatus();
                return [
                    'id'                 => $item->id,
                    'jenis'              => $item->jenis,
                    'jenis_label'        => $item->jenis === 'konsekuensi' ? 'Konsekuensi' : 'Reward',
                    'kode'               => $item->kode,
                    'konsekuensi_reward' => $item->konsekuensi_atau_reward,
                    'total_poin'         => $item->total_poin_saat_trigger,
                    'tanggal_trigger'    => $item->tanggal_trigger?->format('d M Y'),
                    'status'             => $item->status,
                    'status_label'       => $item->status_label ?? $item->status,
                    'final_status'       => $item->final_status,
                    'sisa_hari'          => $item->sisa_hari_deadline,
                    'is_terlambat'       => (bool) ($item->is_terlambat ?? false),
                    'has_bukti'          => (bool) ($item->has_bukti ?? false),
                ];
            })->toArray();

        // ---- Konseling ES aktif ----------------------------------
        $konselingAktif = LaporanExpertSystemKonselor::where('santri_id', $santriId)
            ->where('status', 'in_progress')
            ->with('sesiList')
            ->orderByDesc('tanggal_trigger')->take(3)->get()
            ->map(fn($item) => [
                'id'              => $item->id,
                'diagnosis_nama'  => $item->diagnosis_nama,
                'rule_kode'       => $item->rule_kode,
                'status'          => $item->status,
                'status_label'    => $item->status_label,
                'sesi_terakhir'   => $item->sesi_bimbingan_terakhir,
                'progress'        => $item->progress_percentage ?? 0,
                'tanggal_trigger' => $item->tanggal_trigger?->format('d M Y'),
            ])->toArray();

        // ---- Laporan Konselor pending approval -------------------
        $laporanKonselorPending = LaporanKonselor::where('santri_id', $santriId)
            ->whereIn('approval_status', ['pending_tenaga_pendidik', 'pending_bk'])
            ->orderByDesc('created_at')->take(3)->get()
            ->map(fn($item) => [
                'id'                    => $item->id,
                'kode'                  => $item->kode_konselor,
                'diagnosis'             => $item->diagnosis_default,
                'approval_status'       => $item->approval_status,
                'approval_status_label' => $item->approval_status_label,
                'approval_progress'     => $item->approval_progress,
                'tanggal'               => $item->tanggal_kejadian?->format('d M Y'),
            ])->toArray();

        // ---- Laporan terbaru (timeline ringkas) ------------------
        $laporanTerbaru = RiwayatSantri::where('santri_id', $santriId)
            ->orderByDesc('tanggal_kejadian')->orderByDesc('created_at')->take(5)->get()
            ->map(fn($r) => [
                'type'         => $r->jenis_laporan,
                'kode'         => $r->kode,
                'title'        => $r->ringkasan,
                'poin'         => $r->bobot_poin,
                'date_display' => $r->tanggal_kejadian?->format('d M Y'),
                'color'        => match($r->jenis_laporan) {
                    'pelanggaran' => 'red',
                    'apresiasi'   => 'green',
                    'konselor'    => 'blue',
                    default       => 'gray',
                },
            ])->toArray();

        return [
            // Identitas
            'role'       => 'santri',
            'nama'       => $profile?->nama_lengkap ?? $user->username,
            'nisn'       => $profile?->nisn ?? '-',
            'foto'       => $profile?->foto ? "/storage/{$profile->foto}" : null,
            'is_pending' => $isPending,
            'kelas'      => $kelasData,
            'wali_kelas' => $waliKelas,
            'wali_asrama'=> $waliAsrama,

            // Poin & stats
            'net_poin'   => $poinApresiasi - $poinPelanggaran,
            'stats'      => $stats,

            // Chart (6 kategori termasuk Bimbingan)
            'chart_laporan' => $chartLaporan,

            // Laporan aktif
            'expert_point_aktif'       => $expertPointAktif,
            'konseling_aktif'          => $konselingAktif,
            'laporan_konselor_pending' => $laporanKonselorPending,

            // Timeline 5 terbaru
            'laporan_terbaru' => $laporanTerbaru,

            // Ringkasan count -- sinkron dengan Dashboard/Santri.jsx
            // JSX: ring.pelanggaran, ring.apresiasi, ring.konseling,
            //      ring.es_konselor, ring.konsekuensi, ring.reward
            'ringkasan' => [
                'pelanggaran' => $cntPelanggaran,
                'apresiasi'   => $cntApresiasi,
                'konseling'   => $cntKonseling,
                'es_konselor' => $cntEsKonselor,
                'konsekuensi' => $cntKonsekuensi,
                'reward'      => $cntReward,
            ],
        ];
    }
}