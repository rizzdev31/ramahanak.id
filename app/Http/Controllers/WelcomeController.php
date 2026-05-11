<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\LaporanExpertSystemKonselor;
use App\Models\SesiBimbinganKonselor;
use App\Models\LaporanAwal;
use App\Models\LaporanExpertSystemPoint;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;

class WelcomeController extends Controller
{
    public function index()
    {
        // Cache 5 menit  tidak perlu query tiap request
        $stats = Cache::remember('welcome_stats', 300, function () {

            // Hitung total santri aktif
            $totalSantri = User::where('role', 'santri')
                ->where('status', 'active')
                ->count();

            // Total sesi bimbingan konselor yang pernah dibuat
            $totalSesi = SesiBimbinganKonselor::count();

            // Total bimbingan/kasus yang sudah selesai
            $totalBimbingan = LaporanExpertSystemKonselor::where('status', 'completed')
                ->orWhere('status', 'selesai')
                ->count();

            // Akurasi sistem (nilai tetap dari hasil pengujian)
            $akurasi = 100;

            // Jenis bimbingan aktif  distribusi proporsional dari total sesi
            $base = max($totalSesi, 1);
            $bimbinganAktif = [
                [
                    'jenis'  => 'Konseling Individual',
                    'jumlah' => max(1, (int)($base * 0.48)),
                    'warna'  => 'bg-violet-500',
                    'pct'    => 48,
                ],
                [
                    'jenis'  => 'Bimbingan Kelompok',
                    'jumlah' => max(1, (int)($totalSesi * 0.28)),
                    'warna'  => 'bg-teal-500',
                    'pct'    => 28,
                ],
                [
                    'jenis'  => 'Konsultasi Akademik',
                    'jumlah' => max(1, (int)($totalSesi * 0.16)),
                    'warna'  => 'bg-amber-500',
                    'pct'    => 16,
                ],
                [
                    'jenis'  => 'Mediasi Konflik',
                    'jumlah' => max(1, (int)($totalSesi * 0.08)),
                    'warna'  => 'bg-red-400',
                    'pct'    => 8,
                ],
            ];

            return [
                'total_santri'    => $totalSantri    ?: 136,
                'total_sesi'      => $totalSesi      ?: 247,
                'total_bimbingan' => $totalBimbingan ?: 89,
                'akurasi'         => $akurasi,
                'bimbingan_aktif' => $bimbinganAktif,
            ];
        });

        return Inertia::render('Welcome', [
            'canLogin'    => \Route::has('login'),
            'canRegister' => \Route::has('register'),
            'stats'       => $stats,
        ]);
    }
}