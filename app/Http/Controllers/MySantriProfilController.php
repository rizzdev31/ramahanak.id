<?php

namespace App\Http\Controllers;

use App\Models\LaporanApresiasi;
use App\Models\LaporanExpertSystemKonselor;
use App\Models\LaporanExpertSystemPoint;
use App\Models\LaporanKonselor;
use App\Models\LaporanPelanggaran;
use App\Models\RiwayatSantri;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

/**
 * MySantriProfilController
 *
 * Halaman monitoring diri sendiri untuk role santri.
 * Santri dapat melihat seluruh rekam jejak mereka: laporan
 * pelanggaran, apresiasi, konseling, expert system point,
 * bimbingan konselor, dan timeline aktivitas.
 *
 * Prinsip: read-only, hanya data milik auth()->id().
 * Render: MySantriProfil/Index (Inertia).
 */
class MySantriProfilController extends Controller
{
    public function index(Request $request)
    {
        $santriId = auth()->id();
        $user     = auth()->user();

        try {
            $user->load([
                'santriProfile.kelas.penugasanAktif.user.tenagaPendidikProfile',
                'santriProfile.kelas.penugasanAktif.user.guruBkProfile',
            ]);

            $profile = $user->santriProfile;
            $kelas   = $profile?->kelas;

            // -- 1. Info Santri ----------------------------------------
            $santriInfo = [
                'id'             => $user->id,
                'nama_lengkap'   => $profile?->nama_lengkap   ?? $user->username,
                'nama_panggilan' => $profile?->nama_panggilan ?? '-',
                'nisn'           => $profile?->nisn            ?? '-',
                'foto'           => $profile?->foto ? "/storage/{$profile->foto}" : null,
                'status'         => $user->status,
                'jenis_kelamin'  => $profile?->jenis_kelamin  ?? '-',
                'tempat_lahir'   => $profile?->tempat_lahir   ?? '-',
                'tanggal_lahir'  => $profile?->tanggal_lahir  ?? '-',
                'nama_wali'      => $profile?->nama_wali      ?? '-',
                'no_whatsapp'    => $profile?->no_whatsapp    ?? '-',
            ];

            // -- 2. Info Kelas & Wali Kelas ----------------------------
            $kelasInfo  = null;
            $waliKelas  = null;

            if ($kelas && $kelas->kode_kelas !== 'PENDING') {
                $kelasInfo = [
                    'id'           => $kelas->id,
                    'nama'         => $kelas->nama_lengkap,
                    'kode'         => $kelas->kode_kelas,
                    'tingkat'      => $kelas->tingkat,
                    'tahun_ajaran' => $kelas->tahun_ajaran,
                ];

                $wk = $kelas->penugasanAktif
                    ->where('jenis_penugasan', 'wali_kelas')
                    ->first();

                if ($wk) {
                    $foto = $wk->user->tenagaPendidikProfile?->foto
                         ?? $wk->user->guruBkProfile?->foto;
                    $waliKelas = [
                        'nama' => $wk->user->tenagaPendidikProfile?->nama_lengkap
                               ?? $wk->user->guruBkProfile?->nama_lengkap
                               ?? '-',
                        'foto' => $foto ? "/storage/{$foto}" : null,
                    ];
                }
            }

            // -- 3. Poin Akumulasi -------------------------------------
            $poinPelanggaran = (int) RiwayatSantri::where('santri_id', $santriId)
                ->where('jenis_laporan', 'pelanggaran')
                ->whereNotNull('bobot_poin')
                ->sum('bobot_poin');

            $poinApresiasi = (int) RiwayatSantri::where('santri_id', $santriId)
                ->where('jenis_laporan', 'apresiasi')
                ->sum('bobot_poin');

            // -- 4. Count laporan --------------------------------------
            $cntPelanggaran        = LaporanPelanggaran::where('pelaku_santri_id', $santriId)->count();
            $cntPelanggaranSelesai = LaporanPelanggaran::where('pelaku_santri_id', $santriId)
                ->where('status', 'selesai')->count();
            $cntApresiasi          = LaporanApresiasi::where('santri_id', $santriId)->count();
            $cntApresiasiSelesai   = LaporanApresiasi::where('santri_id', $santriId)
                ->where('status', 'diberikan')->count();
            $cntKonseling          = LaporanKonselor::where('santri_id', $santriId)->count();
            $cntEsKonselor         = LaporanExpertSystemKonselor::where('santri_id', $santriId)->count();
            $cntKonsekuensi        = LaporanExpertSystemPoint::where('santri_id', $santriId)
                ->where('jenis', 'konsekuensi')->count();
            $cntReward             = LaporanExpertSystemPoint::where('santri_id', $santriId)
                ->where('jenis', 'reward')->count();

            // -- 5. Statistics (array untuk StatCard di JSX) -----------
            $statistics = [
                [
                    'label'  => 'Poin Pelanggaran',
                    'value'  => $poinPelanggaran,
                    'sub'    => "{$cntPelanggaran} laporan - {$cntPelanggaranSelesai} selesai",
                    'color'  => 'red',
                    'icon'   => 'warning',
                ],
                [
                    'label'  => 'Poin Apresiasi',
                    'value'  => $poinApresiasi,
                    'sub'    => "{$cntApresiasi} apresiasi - {$cntApresiasiSelesai} diberikan",
                    'color'  => 'emerald',
                    'icon'   => 'star',
                ],
                [
                    'label'  => 'Sesi Konseling',
                    'value'  => $cntKonseling + $cntEsKonselor,
                    'sub'    => "{$cntKonseling} manual - {$cntEsKonselor} expert system",
                    'color'  => 'blue',
                    'icon'   => 'heart',
                ],
                [
                    'label'  => 'Konsekuensi & Reward',
                    'value'  => $cntKonsekuensi + $cntReward,
                    'sub'    => "{$cntKonsekuensi} konsekuensi - {$cntReward} reward",
                    'color'  => 'amber',
                    'icon'   => 'zap',
                ],
            ];

            // -- 6. Poin Ringkas (untuk PoinBar) -----------------------
            $poinRingkas = [
                'pelanggaran' => $poinPelanggaran,
                'apresiasi'   => $poinApresiasi,
                'selisih'     => $poinApresiasi - $poinPelanggaran,
            ];

            // -- 7. Laporan Pelanggaran --------------------------------
            // KEY: tanggal_kejadian, bobot_poin, tindakan,
            //      status, status_label, approval_status, approval_status_label
            $laporanPelanggaran = LaporanPelanggaran::where('pelaku_santri_id', $santriId)
                ->with('variabelPelanggaran')
                ->orderBy('tanggal_kejadian', 'desc')
                ->get()
                ->map(fn($i) => [
                    'id'                    => $i->id,
                    'kode'                  => $i->kode_pelanggaran,
                    'kategori'              => $i->variabelPelanggaran?->kategori ?? '-',
                    'tanggal_kejadian'      => $i->tanggal_kejadian?->format('d M Y'),
                    'bobot_poin'            => $i->bobot_poin,
                    'tindakan'              => $i->tindakan_default,
                    'catatan_bk'            => $i->catatan_bk,
                    'status'                => $i->status,
                    'status_label'          => $i->status_label,
                    'approval_status'       => $i->approval_status,
                    'approval_status_label' => $i->approval_status_label,
                    'tanggal_tindakan'      => $i->tanggal_tindakan?->format('d M Y'),
                ]);

            // -- 8. Laporan Apresiasi ----------------------------------
            $laporanApresiasi = LaporanApresiasi::where('santri_id', $santriId)
                ->with('variabelApresiasi')
                ->orderBy('tanggal_kejadian', 'desc')
                ->get()
                ->map(fn($i) => [
                    'id'                    => $i->id,
                    'kode'                  => $i->kode_apresiasi,
                    'kategori'              => $i->variabelApresiasi?->kategori ?? '-',
                    'tanggal_kejadian'      => $i->tanggal_kejadian?->format('d M Y'),
                    'bobot_poin'            => $i->bobot_poin,
                    'reward'                => $i->reward_default,
                    'catatan_bk'            => $i->catatan_bk,
                    'status'                => $i->status,
                    'status_label'          => $i->status_label,
                    'approval_status'       => $i->approval_status,
                    'approval_status_label' => $i->approval_status_label,
                    'tanggal_reward'        => $i->tanggal_reward?->format('d M Y'),
                ]);

            // -- 9. Laporan Konseling ----------------------------------
            $laporanKonseling = LaporanKonselor::where('santri_id', $santriId)
                ->orderBy('tanggal_kejadian', 'desc')
                ->get()
                ->map(fn($i) => [
                    'id'                    => $i->id,
                    'kode'                  => $i->kode_konselor,
                    'diagnosis'             => $i->diagnosis_default,
                    'tanggal_kejadian'      => $i->tanggal_kejadian?->format('d M Y'),
                    'status'                => $i->status,
                    'status_label'          => $i->status_label,
                    'approval_status'       => $i->approval_status,
                    'approval_status_label' => $i->approval_status_label,
                    'tanggal_selesai'       => $i->tanggal_konseling_selesai?->format('d M Y'),
                ]);

            // -- 10. Expert System Point (Konsekuensi & Reward) --------
            // KEY: jenis, jenis_label, kode, konsekuensi_reward, rekomendasi,
            //      total_poin, threshold_poin, tanggal_trigger, status, status_label,
            //      final_status, has_bukti, bukti_approved
            $expertSystemPoint = LaporanExpertSystemPoint::where('santri_id', $santriId)
                ->orderBy('tanggal_trigger', 'desc')
                ->get()
                ->map(fn($i) => [
                    'id'                 => $i->id,
                    'jenis'              => $i->jenis,
                    'jenis_label'        => $i->jenis === 'konsekuensi' ? 'Konsekuensi' : 'Reward',
                    'kode'               => $i->kode,
                    'konsekuensi_reward' => $i->konsekuensi_atau_reward,
                    'rekomendasi'        => $i->rekomendasi,
                    'total_poin'         => $i->total_poin_saat_trigger,
                    'threshold_poin'     => $i->threshold_poin_triggered,
                    'tanggal_trigger'    => $i->tanggal_trigger?->format('d M Y'),
                    'status'             => $i->status,
                    'status_label'       => $i->status_label ?? $i->status,
                    'final_status'       => $i->final_status,
                    'has_bukti'          => $i->has_bukti,
                    'bukti_approved'     => $i->bukti_approved,
                ]);

            // -- 11. Expert System Konselor (Bimbingan) ----------------
            // KEY: rule_kode, rule_kategori, diagnosis_kode, diagnosis_nama,
            //      diagnosis_penjelasan, kode_terpenuhi, sesi_terakhir, sesi_count,
            //      progress, status, status_label, validator_nama
            $expertSystemKonselor = LaporanExpertSystemKonselor::where('santri_id', $santriId)
                ->with(['sesiList', 'validator.guruBkProfile'])
                ->orderBy('tanggal_trigger', 'desc')
                ->get()
                ->map(fn($i) => [
                    'id'                   => $i->id,
                    'rule_kode'            => $i->rule_kode,
                    'rule_kategori'        => $i->rule_kategori,
                    'diagnosis_kode'       => $i->diagnosis_kode,
                    'diagnosis_nama'       => $i->diagnosis_nama,
                    'diagnosis_penjelasan' => $i->diagnosis_penjelasan,
                    'kode_terpenuhi'       => $i->kode_terpenuhi ?? [],
                    'sesi_terakhir'        => $i->sesi_bimbingan_terakhir,
                    'sesi_count'           => $i->sesiList->count(),
                    'progress'             => $i->progress_percentage,
                    'tanggal_trigger'      => $i->tanggal_trigger?->format('d M Y'),
                    'tanggal_selesai'      => $i->tanggal_selesai?->format('d M Y'),
                    'status'               => $i->status,
                    'status_label'         => $i->status_label,
                    'status_badge_color'   => $i->status_badge_color,
                    'validator_nama'       => $i->validator?->guruBkProfile?->nama_lengkap,
                ]);

            // -- 12. Timeline (riwayat_santri, maks 50) ----------------
            // KEY: date, date_display, type, title, poin, kode, color
            $timeline = RiwayatSantri::where('santri_id', $santriId)
                ->orderBy('tanggal_kejadian', 'desc')
                ->orderBy('created_at', 'desc')
                ->limit(50)
                ->get()
                ->map(fn($r) => [
                    'date'         => $r->tanggal_kejadian?->format('Y-m-d'),
                    'date_display' => $r->tanggal_kejadian?->format('d M Y'),
                    'type'         => $r->jenis_laporan,
                    'title'        => $r->ringkasan,
                    'poin'         => $r->bobot_poin,
                    'kode'         => $r->kode,
                    'color'        => match($r->jenis_laporan) {
                        'pelanggaran' => 'red',
                        'apresiasi'   => 'emerald',
                        'konselor'    => 'blue',
                        default       => 'gray',
                    },
                ])
                ->values()
                ->toArray();

            // -- Return ke Inertia -------------------------------------
            return Inertia::render('MySantriProfil/Index', [
                // Profil
                'santriInfo'           => $santriInfo,
                'kelasInfo'            => $kelasInfo,
                'waliKelas'            => $waliKelas,
                // Stats
                'statistics'           => $statistics,
                'poinRingkas'          => $poinRingkas,
                // Laporan
                'laporanPelanggaran'   => $laporanPelanggaran,
                'laporanApresiasi'     => $laporanApresiasi,
                'laporanKonseling'     => $laporanKonseling,
                // Expert System
                'expertSystemPoint'    => $expertSystemPoint,
                'expertSystemKonselor' => $expertSystemKonselor,
                // Timeline
                'timeline'             => $timeline,
            ]);

        } catch (\Exception $e) {
            Log::error('MySantriProfilController@index', [
                'santri_id' => $santriId,
                'error'     => $e->getMessage(),
                'trace'     => $e->getTraceAsString(),
            ]);

            return back()->withErrors([
                'error' => 'Gagal memuat data rekam jejak: ' . $e->getMessage(),
            ]);
        }
    }
}