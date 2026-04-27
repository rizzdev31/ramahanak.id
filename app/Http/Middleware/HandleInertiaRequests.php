<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;
use App\Models\PenugasanKelas;
use App\Models\LaporanAwal;
use App\Models\LaporanPelanggaran;
use App\Models\LaporanApresiasi;
use App\Models\LaporanKonselor;
use App\Models\LaporanExpertSystemPoint;
use App\Models\LaporanExpertSystemKonselor;
use App\Models\LaporanApproval;
use App\Models\HasilPreprocessing;
use App\Models\User;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        $user = $request->user();

        $hasClassAssignment = false;
        if ($user) {
            $hasClassAssignment = PenugasanKelas::where('user_id', $user->id)
                ->where('is_active', 1)
                ->exists();
        }

        // ---- Badge notifikasi untuk Guru BK ----------------------
        // Dihitung hanya saat user login sebagai guru_bk,
        // agar tidak membebani query untuk role lain.
        $badges = null;
        if ($user && $user->role === 'guru_bk') {
            $badges = $this->computeBadges();
        }

        return [
            ...parent::share($request),

            'auth' => [
                'user' => $user ? [
                    'id'                   => $user->id,
                    'username'             => $user->username,
                    'email'                => $user->email,
                    'role'                 => $user->role,
                    'has_class_assignment' => $hasClassAssignment,
                ] : null,
            ],

            // Badge counts - hanya tersedia untuk guru_bk, null untuk role lain
            'badges' => $badges,

            'ziggy' => fn () => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],
        ];
    }

    /**
     * Hitung semua badge count untuk sidebar Guru BK.
     * Setiap key di sini sinkron dengan badge_key di MENU_ITEMS SidebarNavigation.jsx.
     *
     * @return array<string, int>
     */
    private function computeBadges(): array
    {
        try {
            return [
                // Laporan masuk menunggu validasi awal BK
                'laporan_awal' => LaporanAwal::where('status', 'pending')->count(),

                // Hasil preprocessing NLP menunggu validasi BK
                'hasil_preprocessing' => HasilPreprocessing::where('status', 'pending_validasi')->count(),

                // Laporan pelanggaran menunggu approval BK
                'pelanggaran_pending' => LaporanPelanggaran::where('approval_status', 'pending_bk')->count(),

                // Laporan apresiasi menunggu approval BK
                'apresiasi_pending' => LaporanApresiasi::where('approval_status', 'pending_bk')->count(),

                // Laporan konselor menunggu approval BK
                'konselor_pending' => LaporanKonselor::where('approval_status', 'pending_bk')->count(),

                // Expert System Point menunggu tindak lanjut BK
                'es_point_pending' => LaporanExpertSystemPoint::where('status', 'pending')->count(),

                // Expert System Konselor menunggu diproses BK
                'es_konselor_pending' => LaporanExpertSystemKonselor::where('status', 'pending')->count(),

                // Approval yang OVERDUE = wali telat approve, BK perlu reassign
                // Bukan semua whereNull(approved_at) karena itu tugasnya wali, bukan BK
                'kelola_approval' => LaporanApproval::whereNull('approved_at')
                    ->where('deadline_at', '<', now())
                    ->count(),

                // User menunggu persetujuan akun
                'user_pending' => User::where('status', 'pending')->count(),
            ];
        } catch (\Exception $e) {
            // Jika ada table yang belum ada (misal BimbinganBerkala belum migrate),
            // kembalikan array kosong agar tidak crash
            return [];
        }
    }
}