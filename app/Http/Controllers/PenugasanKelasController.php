<?php

namespace App\Http\Controllers;

use App\Models\Kelas;
use App\Models\User;
use App\Models\PenugasanKelas;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class PenugasanKelasController extends Controller
{
    /**
     * Halaman assign wali kelas & wali asrama
     */
    public function index(Request $request)
    {
        // Semua kelas aktif kecuali PENDING
        $kelas = Kelas::where('kode_kelas', '!=', 'PENDING')
            ->where('status', 'active')
            ->with(['penugasanAktif.user.guruBkProfile', 'penugasanAktif.user.tenagaPendidikProfile'])
            ->orderBy('tingkat')
            ->orderBy('kode_kelas')
            ->get();

        // Semua guru & tendik aktif
        $availableUsers = User::whereIn('role', ['guru_bk', 'tenaga_pendidik'])
            ->where('status', 'active')
            ->with([
                'guruBkProfile',
                'tenagaPendidikProfile',
                'penugasanKelasAktif.kelas',
            ])
            ->get()
            ->map(function ($user) {
                $profile   = $user->guruBkProfile ?? $user->tenagaPendidikProfile;
                $penugasan = $user->penugasanKelasAktif;

                // ✅ Pisahkan: apakah user sudah jadi wali_kelas di kelas manapun
                $waliKelasPenugasan = $penugasan->where('jenis_penugasan', 'wali_kelas')->first();
                $waliAsramaPenugasan = $penugasan->where('jenis_penugasan', 'wali_asrama');

                return [
                    'id'         => $user->id,
                    'nama'       => $profile->nama_lengkap ?? 'N/A',
                    'nip'        => $profile->nip ?? '-',
                    'role'       => $user->role,
                    'role_label' => $user->role === 'guru_bk' ? 'Guru BK' : 'Tenaga Pendidik',

                    // ✅ BARU: sudah jadi wali_kelas di mana?
                    'sudah_wali_kelas'       => $waliKelasPenugasan !== null,
                    'wali_kelas_di_kelas'    => $waliKelasPenugasan?->kelas?->nama_lengkap,
                    'wali_kelas_di_kelas_id' => $waliKelasPenugasan?->kelas_id,

                    // ✅ BARU: daftar kelas yang sudah jadi wali_asrama
                    'wali_asrama_di_kelas' => $waliAsramaPenugasan->map(fn($p) => [
                        'kelas_id'    => $p->kelas_id,
                        'kelas_nama'  => $p->kelas?->nama_lengkap,
                    ])->values()->toArray(),

                    // Detail semua penugasan (untuk display)
                    'penugasan_detail' => $penugasan->map(fn($p) => [
                        'kelas_id'   => $p->kelas_id,
                        'kelas_nama' => $p->kelas?->nama_lengkap,
                        'jenis'      => $p->jenis_penugasan,
                    ])->values()->toArray(),
                ];
            });

        // Format data kelas
        $kelasFormatted = $kelas->map(function ($k) {
            $waliKelas  = $k->penugasanAktif->where('jenis_penugasan', 'wali_kelas')->first();
            $waliAsrama = $k->penugasanAktif->where('jenis_penugasan', 'wali_asrama');

            return [
                'id'           => $k->id,
                'nama_lengkap' => $k->nama_lengkap,
                'kode_kelas'   => $k->kode_kelas,
                'tingkat'      => $k->tingkat,
                'tahun_ajaran' => $k->tahun_ajaran,
                'wali_kelas'   => $waliKelas ? [
                    'penugasan_id' => $waliKelas->id,
                    'user_id'      => $waliKelas->user->id,
                    'nama'         => $waliKelas->user->guruBkProfile->nama_lengkap
                                   ?? $waliKelas->user->tenagaPendidikProfile->nama_lengkap,
                    'role'         => $waliKelas->user->role,
                    'role_label'   => $waliKelas->user->role === 'guru_bk' ? 'Guru BK' : 'Tenaga Pendidik',
                ] : null,
                'wali_asrama'  => $waliAsrama->map(fn($w) => [
                    'penugasan_id' => $w->id,
                    'user_id'      => $w->user->id,
                    'nama'         => $w->user->guruBkProfile->nama_lengkap
                                   ?? $w->user->tenagaPendidikProfile->nama_lengkap,
                    'role'         => $w->user->role,
                    'role_label'   => $w->user->role === 'guru_bk' ? 'Guru BK' : 'Tenaga Pendidik',
                ])->values(),
            ];
        });

        return Inertia::render('Penugasan/Index', [
            'kelas'          => $kelasFormatted,
            'availableUsers' => $availableUsers,
        ]);
    }

    /**
     * Assign wali kelas atau wali asrama
     *
     * LOGIKA GUARD (BARU):
     * - wali_kelas: user hanya boleh jadi wali_kelas di 1 kelas saja (seluruh sistem)
     * - wali_asrama: user boleh jadi wali_asrama di kelas manapun tanpa batas
     * - 1 kelas hanya boleh punya 1 wali_kelas aktif
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'kelas_id'        => 'required|exists:kelas,id',
            'user_id'         => 'required|exists:users,id',
            'jenis_penugasan' => 'required|in:wali_kelas,wali_asrama',
        ]);

        $user  = User::findOrFail($validated['user_id']);
        $kelas = Kelas::findOrFail($validated['kelas_id']);

        // Guard 1: Hanya guru_bk atau tenaga_pendidik
        if (!in_array($user->role, ['guru_bk', 'tenaga_pendidik'])) {
            return back()->withErrors([
                'user_id' => 'Hanya Guru BK dan Tenaga Pendidik yang bisa ditugaskan sebagai wali!',
            ]);
        }

        if ($validated['jenis_penugasan'] === 'wali_kelas') {

            // ✅ Guard 2a: Cek apakah USER sudah jadi wali_kelas di kelas manapun
            $sudahWaliKelas = PenugasanKelas::where('user_id', $validated['user_id'])
                ->where('jenis_penugasan', 'wali_kelas')
                ->where('is_active', 1)
                ->first();

            if ($sudahWaliKelas) {
                $namaKelasLama = $sudahWaliKelas->kelas->nama_lengkap;
                return back()->withErrors([
                    'user_id' => "User ini sudah menjadi Wali Kelas di {$namaKelasLama}! "
                               . "Hapus penugasan lama terlebih dahulu sebelum assign ke kelas lain.",
                ]);
            }

            // ✅ Guard 2b: Cek apakah KELAS sudah punya wali_kelas
            $kelasHasWaliKelas = PenugasanKelas::where('kelas_id', $validated['kelas_id'])
                ->where('jenis_penugasan', 'wali_kelas')
                ->where('is_active', 1)
                ->exists();

            if ($kelasHasWaliKelas) {
                return back()->withErrors([
                    'jenis_penugasan' => "Kelas {$kelas->nama_lengkap} sudah memiliki Wali Kelas! "
                                      . "Hapus wali kelas yang lama terlebih dahulu.",
                ]);
            }

        } else {
            // jenis_penugasan = wali_asrama

            // ✅ Guard 3: Cek duplikat exact — user sudah jadi wali_asrama di kelas INI
            $sudahWaliAsramaDisini = PenugasanKelas::where('user_id', $validated['user_id'])
                ->where('kelas_id', $validated['kelas_id'])
                ->where('jenis_penugasan', 'wali_asrama')
                ->where('is_active', 1)
                ->exists();

            if ($sudahWaliAsramaDisini) {
                return back()->withErrors([
                    'user_id' => 'User ini sudah menjadi Wali Asrama di kelas ini!',
                ]);
            }

            // ✅ TIDAK ada guard "user sudah di kelas lain" untuk wali_asrama
            // User BOLEH jadi wali_asrama di banyak kelas sekaligus
        }

        // Cek duplikat umum (safety net)
        $duplicate = PenugasanKelas::where('user_id', $validated['user_id'])
            ->where('kelas_id', $validated['kelas_id'])
            ->where('jenis_penugasan', $validated['jenis_penugasan'])
            ->where('is_active', 1)
            ->exists();

        if ($duplicate) {
            return back()->withErrors(['user_id' => 'Penugasan ini sudah ada!']);
        }

        PenugasanKelas::create([
            'kelas_id'        => $validated['kelas_id'],
            'user_id'         => $validated['user_id'],
            'jenis_penugasan' => $validated['jenis_penugasan'],
            'is_active'       => true,
        ]);

        $jenisLabel = $validated['jenis_penugasan'] === 'wali_kelas' ? 'Wali Kelas' : 'Wali Asrama';
        return back()->with('success', "{$jenisLabel} berhasil ditugaskan ke kelas {$kelas->nama_lengkap}!");
    }

    /**
     * Hapus penugasan (soft delete: is_active = false)
     */
    public function destroy(PenugasanKelas $penugasan)
    {
        $jenisLabel = $penugasan->jenis_penugasan === 'wali_kelas' ? 'Wali Kelas' : 'Wali Asrama';
        $penugasan->update(['is_active' => false]);
        return back()->with('success', "{$jenisLabel} berhasil dihapus dari penugasan!");
    }

    /**
     * Transfer wali kelas ke kelas lain
     * Khusus wali_kelas — wali_asrama tidak perlu transfer karena bisa di banyak kelas
     */
    public function transfer(Request $request, PenugasanKelas $penugasan)
    {
        $validated = $request->validate([
            'kelas_id_baru' => 'required|exists:kelas,id',
        ]);

        if ($validated['kelas_id_baru'] == $penugasan->kelas_id) {
            return back()->withErrors(['kelas_id_baru' => 'Kelas tujuan harus berbeda dengan kelas saat ini.']);
        }

        $kelasBaru = Kelas::findOrFail($validated['kelas_id_baru']);

        // Guard: hanya wali_kelas yang bisa di-transfer via endpoint ini
        // wali_asrama bisa assign manual karena boleh multi-kelas
        if ($penugasan->jenis_penugasan === 'wali_kelas') {
            $hasWaliKelas = PenugasanKelas::where('kelas_id', $validated['kelas_id_baru'])
                ->where('jenis_penugasan', 'wali_kelas')
                ->where('is_active', 1)
                ->exists();

            if ($hasWaliKelas) {
                return back()->withErrors([
                    'kelas_id_baru' => "Kelas {$kelasBaru->nama_lengkap} sudah memiliki Wali Kelas!",
                ]);
            }
        }

        DB::transaction(function () use ($penugasan, $validated) {
            $penugasan->update(['is_active' => false]);
            PenugasanKelas::create([
                'kelas_id'        => $validated['kelas_id_baru'],
                'user_id'         => $penugasan->user_id,
                'jenis_penugasan' => $penugasan->jenis_penugasan,
                'is_active'       => true,
            ]);
        });

        return back()->with('success', 'Penugasan berhasil dipindahkan!');
    }
}