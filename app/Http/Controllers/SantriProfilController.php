<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Kelas;
use App\Models\LaporanPelanggaran;
use App\Models\LaporanApresiasi;
use App\Models\LaporanKonselor;
use App\Models\LaporanExpertSystemPoint;
use App\Models\LaporanExpertSystemKonselor;
use App\Models\RiwayatSantri;
use App\Models\RiwayatKelasSantri;
use App\Models\PenugasanKelas;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class SantriProfilController extends Controller
{
    /**
     * Display list of all santri
     * With search, filter by kelas, and status
     */
    public function index(Request $request)
    {
        try {
            $query = User::query()
                ->where('role', 'santri')
                ->with([
                    'santriProfile.kelas',
                    'riwayatKelas' => fn($q) => $q->where('is_active', 1)
                ]);

            // Filter by status
            if ($request->filled('status')) {
                $query->where('status', $request->status);
            }

            // Filter by kelas
            if ($request->filled('kelas_id')) {
                $query->whereHas('santriProfile', fn($q) =>
                    $q->where('kelas_id', $request->kelas_id)
                );
            }

            // Search by nama or NISN
            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->whereHas('santriProfile', fn($q2) =>
                        $q2->where('nama_lengkap', 'like', "%{$search}%")
                           ->orWhere('nama_panggilan', 'like', "%{$search}%")
                           ->orWhere('nisn', 'like', "%{$search}%")
                    );
                });
            }

            $santriList = $query->orderBy('status', 'asc')
                ->latest()
                ->paginate(12)
                ->withQueryString();

            // Transform data untuk frontend
            $santriList->through(function ($santri) {
                $profile = $santri->santriProfile;
                
                return [
                    'id' => $santri->id,
                    'nama' => $profile?->nama_lengkap ?? $santri->username,
                    'nisn' => $profile?->nisn ?? '-',
                    'foto' => $profile?->foto ? "/storage/{$profile->foto}" : null,
                    'status' => $santri->status,
                    'kelas' => $profile?->kelas ? [
                        'id' => $profile->kelas->id,
                        'nama' => $profile->kelas->nama_lengkap,
                        'kode' => $profile->kelas->kode_kelas,
                    ] : null,
                    // Quick stats
                    'total_pelanggaran' => LaporanPelanggaran::where('pelaku_santri_id', $santri->id)->count(),
                    'total_apresiasi' => LaporanApresiasi::where('santri_id', $santri->id)->count(),
                ];
            });

            // Get all kelas for filter dropdown
            $kelasList = Kelas::where('status', 'active')
                ->where('kode_kelas', '!=', 'PENDING')
                ->orderBy('tingkat')
                ->orderBy('kode_kelas')
                ->get(['id', 'kode_kelas', 'nama', 'tingkat']);

            return Inertia::render('SantriProfil/Index', [
                'santriList' => $santriList,
                'kelasList' => $kelasList,
                'filters' => $request->only(['status', 'kelas_id', 'search']),
            ]);

        } catch (\Exception $e) {
            Log::error('SantriProfilController@index error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return back()->withErrors([
                'error' => 'Gagal memuat data santri: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Display profil detail santri with all aggregated data
     * This is the MAIN dashboard for BK to analyze santri
     */
    public function show(Request $request, User $santri)
    {
        try {
            // Ensure user is santri
            if ($santri->role !== 'santri') {
                abort(404, 'Data not found');
            }

            // Load all relationships
            $santri->load([
                'santriProfile.kelas.penugasanAktif.user.tenagaPendidikProfile',
                'santriProfile.kelas.penugasanAktif.user.guruBkProfile',
            ]);

            $profile = $santri->santriProfile;
            $kelas = $profile?->kelas;

            // ═══════════════════════════════════════════════════════════
            // 1. INFORMASI SANTRI
            // ═══════════════════════════════════════════════════════════
            $santriInfo = [
                'id' => $santri->id,
                'nama_lengkap' => $profile?->nama_lengkap ?? $santri->username,
                'nama_panggilan' => $profile?->nama_panggilan ?? '-',
                'nisn' => $profile?->nisn ?? '-',
                'foto' => $profile?->foto ? "/storage/{$profile->foto}" : null,
                'status' => $santri->status,
                'jenis_kelamin' => $profile?->jenis_kelamin ?? '-',
                'tempat_lahir' => $profile?->tempat_lahir ?? '-',
                'tanggal_lahir' => $profile?->tanggal_lahir ?? '-',
                'alamat' => $profile?->alamat ?? '-',
                'nama_wali' => $profile?->nama_wali ?? '-',
                'no_whatsapp' => $profile?->no_whatsapp ?? '-',
            ];

            // Kelas info
            $kelasInfo = null;
            $waliKelas = null;
            $waliAsrama = [];

            if ($kelas && $kelas->kode_kelas !== 'PENDING') {
                $kelasInfo = [
                    'id' => $kelas->id,
                    'nama' => $kelas->nama_lengkap,
                    'kode' => $kelas->kode_kelas,
                    'tingkat' => $kelas->tingkat,
                    'tahun_ajaran' => $kelas->tahun_ajaran,
                ];

                // Wali Kelas
                $wk = $kelas->penugasanAktif->where('jenis_penugasan', 'wali_kelas')->first();
                if ($wk) {
                    $waliKelas = [
                        'nama' => $wk->user->tenagaPendidikProfile?->nama_lengkap
                               ?? $wk->user->guruBkProfile?->nama_lengkap
                               ?? '-',
                        'foto' => $wk->user->tenagaPendidikProfile?->foto
                               ?? $wk->user->guruBkProfile?->foto,
                    ];
                    if ($waliKelas['foto']) {
                        $waliKelas['foto'] = "/storage/{$waliKelas['foto']}";
                    }
                }

                // Wali Asrama
                $waliAsrama = $kelas->penugasanAktif
                    ->where('jenis_penugasan', 'wali_asrama')
                    ->map(fn($w) => [
                        'nama' => $w->user->tenagaPendidikProfile?->nama_lengkap
                               ?? $w->user->guruBkProfile?->nama_lengkap
                               ?? '-',
                        'foto' => $w->user->tenagaPendidikProfile?->foto
                               ?? $w->user->guruBkProfile?->foto
                               ? "/storage/".($w->user->tenagaPendidikProfile?->foto ?? $w->user->guruBkProfile?->foto)
                               : null,
                    ])->values()->toArray();
            }

            // ═══════════════════════════════════════════════════════════
            // 2. STATISTIK RINGKAS
            // ═══════════════════════════════════════════════════════════
            $totalPelanggaran = LaporanPelanggaran::where('pelaku_santri_id', $santri->id)->count();
            $totalApresiasi = LaporanApresiasi::where('santri_id', $santri->id)->count();
            $totalKonseling = LaporanKonselor::where('santri_id', $santri->id)->count();
            $totalExpertPoint = LaporanExpertSystemPoint::where('santri_id', $santri->id)->count();
            $totalExpertKonselor = LaporanExpertSystemKonselor::where('santri_id', $santri->id)->count();

            // Poin
            $totalPoinPelanggaran = RiwayatSantri::where('santri_id', $santri->id)
                ->where('jenis_laporan', 'pelanggaran')
                ->sum('bobot_poin');
            
            $totalPoinApresiasi = RiwayatSantri::where('santri_id', $santri->id)
                ->where('jenis_laporan', 'apresiasi')
                ->sum('bobot_poin');

            // Approval stats
            $approvalPendingWali = DB::table('laporan_approvals')
                ->whereNull('approved_at')
                ->where(function($q) use ($santri) {
                    $q->whereIn('laporan_id', function($q2) use ($santri) {
                        $q2->select('id')
                           ->from('laporan_pelanggaran')
                           ->where('pelaku_santri_id', $santri->id);
                    })
                    ->where('laporan_type', 'App\Models\LaporanPelanggaran')
                    ->orWhereIn('laporan_id', function($q2) use ($santri) {
                        $q2->select('id')
                           ->from('laporan_apresiasi')
                           ->where('santri_id', $santri->id);
                    })
                    ->where('laporan_type', 'App\Models\LaporanApresiasi')
                    ->orWhereIn('laporan_id', function($q2) use ($santri) {
                        $q2->select('id')
                           ->from('laporan_konselor')
                           ->where('santri_id', $santri->id);
                    })
                    ->where('laporan_type', 'App\Models\LaporanKonselor');
                })
                ->count();

            $statistics = [
                [
                    'label' => 'Total Pelanggaran',
                    'value' => $totalPelanggaran,
                    'poin' => $totalPoinPelanggaran,
                    'color' => 'red',
                    'icon' => 'warning',
                ],
                [
                    'label' => 'Total Apresiasi',
                    'value' => $totalApresiasi,
                    'poin' => $totalPoinApresiasi,
                    'color' => 'green',
                    'icon' => 'star',
                ],
                [
                    'label' => 'Total Konseling',
                    'value' => $totalKonseling,
                    'poin' => null,
                    'color' => 'blue',
                    'icon' => 'heart',
                ],
                [
                    'label' => 'Expert System Triggered',
                    'value' => $totalExpertPoint,
                    'poin' => null,
                    'color' => 'purple',
                    'icon' => 'zap',
                ],
                [
                    'label' => 'Pending Approval',
                    'value' => $approvalPendingWali,
                    'poin' => null,
                    'color' => 'yellow',
                    'icon' => 'clock',
                ],
            ];

            // ═══════════════════════════════════════════════════════════
            // 3. LAPORAN PELANGGARAN
            // ═══════════════════════════════════════════════════════════
            $laporanPelanggaran = LaporanPelanggaran::where('pelaku_santri_id', $santri->id)
                ->with(['variabelPelanggaran', 'approvals'])
                ->orderBy('tanggal_kejadian', 'desc')
                ->get()
                ->map(fn($item) => [
                    'id' => $item->id,
                    'kode' => $item->kode_pelanggaran,
                    'keterangan' => $item->variabelPelanggaran?->keterangan ?? '-',
                    'tanggal_kejadian' => $item->tanggal_kejadian?->format('d M Y'),
                    'bobot_poin' => $item->bobot_poin,
                    'tindakan' => $item->tindakan_default,
                    'approval_status' => $item->approval_status,
                    'approval_status_label' => $item->approval_status_label,
                    'approval_progress' => $item->approval_progress,
                    'status' => $item->status,
                    'status_label' => $item->status_label,
                    'tanggal_tindakan' => $item->tanggal_tindakan?->format('d M Y'),
                ]);

            // ═══════════════════════════════════════════════════════════
            // 4. LAPORAN APRESIASI
            // ═══════════════════════════════════════════════════════════
            $laporanApresiasi = LaporanApresiasi::where('santri_id', $santri->id)
                ->with(['variabelApresiasi', 'approvals'])
                ->orderBy('tanggal_kejadian', 'desc')
                ->get()
                ->map(fn($item) => [
                    'id' => $item->id,
                    'kode' => $item->kode_apresiasi,
                    'keterangan' => $item->variabelApresiasi?->keterangan ?? '-',
                    'tanggal_kejadian' => $item->tanggal_kejadian?->format('d M Y'),
                    'bobot_poin' => $item->bobot_poin,
                    'reward' => $item->reward_default,
                    'approval_status' => $item->approval_status,
                    'approval_status_label' => $item->approval_status_label,
                    'approval_progress' => $item->approval_progress,
                    'status' => $item->status,
                    'status_label' => $item->status_label,
                    'tanggal_reward' => $item->tanggal_reward?->format('d M Y'),
                ]);

            // ═══════════════════════════════════════════════════════════
            // 5. LAPORAN KONSELING
            // ═══════════════════════════════════════════════════════════
            $laporanKonseling = LaporanKonselor::where('santri_id', $santri->id)
                ->with('approvals')
                ->orderBy('tanggal_kejadian', 'desc')
                ->get()
                ->map(fn($item) => [
                    'id' => $item->id,
                    'kode' => $item->kode_konselor,
                    'diagnosis' => $item->diagnosis_default,
                    'tanggal_kejadian' => $item->tanggal_kejadian?->format('d M Y'),
                    'tindakan' => $item->tindakan_default,
                    'approval_status' => $item->approval_status,
                    'approval_status_label' => $item->approval_status_label,
                    'approval_progress' => $item->approval_progress,
                    'status' => $item->status,
                    'status_label' => $item->status_label,
                    'tanggal_selesai' => $item->tanggal_konseling_selesai?->format('d M Y'),
                ]);

            // ═══════════════════════════════════════════════════════════
            // 6. EXPERT SYSTEM POINT
            // ═══════════════════════════════════════════════════════════
            $expertSystemPoint = LaporanExpertSystemPoint::where('santri_id', $santri->id)
                ->orderBy('tanggal_trigger', 'desc')
                ->get()
                ->map(fn($item) => [
                    'id' => $item->id,
                    'jenis' => $item->jenis,
                    'jenis_label' => $item->jenis_label,
                    'kode' => $item->kode,
                    'konsekuensi_reward' => $item->konsekuensi_atau_reward,
                    'total_poin' => $item->total_poin_saat_trigger,
                    'tanggal_trigger' => $item->tanggal_trigger?->format('d M Y'),
                    'status' => $item->status,
                    'status_label' => $item->status_label,
                    'final_status' => $item->final_status,
                    'final_status_label' => $item->final_status_label,
                    'has_bukti' => $item->has_bukti,
                    'bukti_approved' => $item->bukti_approved,
                ]);

            // ═══════════════════════════════════════════════════════════
            // 7. EXPERT SYSTEM KONSELOR
            // ═══════════════════════════════════════════════════════════
            $expertSystemKonselor = LaporanExpertSystemKonselor::where('santri_id', $santri->id)
                ->with('sesiList')
                ->orderBy('tanggal_trigger', 'desc')
                ->get()
                ->map(fn($item) => [
                    'id' => $item->id,
                    'diagnosis_kode' => $item->diagnosis_kode,
                    'diagnosis_nama' => $item->diagnosis_nama,
                    'sesi_terakhir' => $item->sesi_bimbingan_terakhir,
                    'sesi_count' => $item->sesiList->count(),
                    'progress' => $item->progress_percentage,
                    'tanggal_trigger' => $item->tanggal_trigger?->format('d M Y'),
                    'tanggal_selesai' => $item->tanggal_selesai?->format('d M Y'),
                    'status' => $item->status,
                    'status_label' => $item->status_label,
                ]);

            // ═══════════════════════════════════════════════════════════
            // 8. TIMELINE HISTORY (Chronological)
            // ═══════════════════════════════════════════════════════════
            $timeline = [];

            // Dari riwayat santri
            $riwayatList = RiwayatSantri::where('santri_id', $santri->id)
                ->orderBy('tanggal_kejadian', 'desc')
                ->get();

            foreach ($riwayatList as $r) {
                $timeline[] = [
                    'date' => $r->tanggal_kejadian?->format('Y-m-d'),
                    'date_display' => $r->tanggal_kejadian?->format('d M Y'),
                    'type' => $r->jenis_laporan,
                    'title' => $r->ringkasan,
                    'description' => "Poin: " . ($r->bobot_poin ?? 0),
                    'icon' => match($r->jenis_laporan) {
                        'pelanggaran' => 'alert-circle',
                        'apresiasi' => 'star',
                        'konselor' => 'heart',
                        default => 'circle',
                    },
                    'color' => match($r->jenis_laporan) {
                        'pelanggaran' => 'red',
                        'apresiasi' => 'green',
                        'konselor' => 'blue',
                        default => 'gray',
                    },
                ];
            }

            // Sort timeline by date
            usort($timeline, fn($a, $b) => strtotime($b['date']) - strtotime($a['date']));

            // ═══════════════════════════════════════════════════════════
            // 9. RIWAYAT KELAS
            // ═══════════════════════════════════════════════════════════
            $riwayatKelas = RiwayatKelasSantri::where('user_id', $santri->id)
                ->with('kelas')
                ->orderBy('tanggal_masuk', 'desc')
                ->get()
                ->map(fn($r) => [
                    'kelas_nama' => $r->kelas?->nama_lengkap ?? '-',
                    'kelas_kode' => $r->kelas?->kode_kelas ?? '-',
                    'tahun_ajaran' => $r->tahun_ajaran,
                    'tanggal_masuk' => $r->tanggal_masuk?->format('d M Y'),
                    'tanggal_keluar' => $r->tanggal_keluar?->format('d M Y'),
                    'is_active' => $r->is_active,
                    'keterangan' => $r->keterangan,
                ]);

            // ═══════════════════════════════════════════════════════════
            // RETURN TO FRONTEND
            // ═══════════════════════════════════════════════════════════
            return Inertia::render('SantriProfil/Show', [
                'santriInfo' => $santriInfo,
                'kelasInfo' => $kelasInfo,
                'waliKelas' => $waliKelas,
                'waliAsrama' => $waliAsrama,
                'statistics' => $statistics,
                'laporanPelanggaran' => $laporanPelanggaran,
                'laporanApresiasi' => $laporanApresiasi,
                'laporanKonseling' => $laporanKonseling,
                'expertSystemPoint' => $expertSystemPoint,
                'expertSystemKonselor' => $expertSystemKonselor,
                'timeline' => $timeline,
                'riwayatKelas' => $riwayatKelas,
            ]);

        } catch (\Exception $e) {
            Log::error('SantriProfilController@show error', [
                'santri_id' => $santri->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return back()->withErrors([
                'error' => 'Gagal memuat profil santri: ' . $e->getMessage()
            ]);
        }
    }
}