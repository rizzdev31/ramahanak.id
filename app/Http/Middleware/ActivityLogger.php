<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

/**
 * ActivityLogger Middleware
 *
 * Mencatat SETIAP aksi user ke storage/logs/activity.log
 * secara otomatis tanpa perlu tambah Log:: di setiap controller.
 *
 * Yang dicatat:
 *  - Siapa yang melakukan (user_id, username, role)
 *  - Apa yang dilakukan (method + URL + route name)
 *  - Kapan (timestamp WIB)
 *  - Data input apa (field yang dikirim, tanpa password)
 *  - Hasil (response status HTTP)
 *
 * Format log mudah dibaca untuk tabel penelitian jurnal.
 *
 * CARA PASANG:
 *   1. Simpan di app/Http/Middleware/ActivityLogger.php
 *   2. Di bootstrap/app.php atau Kernel.php:
 *      $middleware->append(\App\Http\Middleware\ActivityLogger::class);
 *   3. Hasil log ada di storage/logs/activity.log
 *
 * CARA BACA LOG REAL-TIME (di terminal server):
 *   tail -f storage/logs/activity.log
 */
class ActivityLogger
{
    /**
     * Field yang TIDAK dicatat ke log (sensitif).
     */
    private const HIDDEN_FIELDS = [
        'password',
        'password_confirmation',
        'current_password',
        'new_password',
        '_token',
    ];

    /**
     * Route name prefix yang diabaikan (tidak terlalu penting dicatat).
     */
    private const SKIP_ROUTES = [
        'debugbar',
        'livewire',
        'sanctum',
        'horizon',
    ];

    /**
     * Label aksi yang mudah dibaca manusia, berdasarkan route name.
     */
    private const ACTION_LABELS = [
        // Auth
        'login'                         => 'Login ke sistem',
        'logout'                        => 'Logout dari sistem',

        // Dashboard
        'dashboard'                     => 'Buka Dashboard',

        // Laporan
        'laporan.store'                 => 'BUAT Laporan Baru',
        'laporan.approve'               => 'APPROVE Laporan Awal',
        'laporan.reject'                => 'REJECT Laporan Awal',

        // Preprocessing
        'hasil-preprocessing.approve'  => 'APPROVE Hasil Preprocessing (NLP)',
        'hasil-preprocessing.reject'   => 'REJECT Hasil Preprocessing',
        'hasil-preprocessing.update'   => 'KOREKSI MANUAL Preprocessing',

        // Laporan Kategori
        'laporan-pelanggaran.complete' => 'SELESAIKAN Laporan Pelanggaran',
        'laporan-apresiasi.complete'   => 'SELESAIKAN Laporan Apresiasi',
        'laporan-konselor.complete'    => 'SELESAIKAN Laporan Konselor',

        // Approval Wali
        'laporan-wali.approve'         => 'WALI APPROVE Laporan',

        // Kelola Approval (Final BK)
        'kelola-approval.approve'      => 'BK FINAL APPROVE Laporan -> Poin ke Riwayat',
        'kelola-approval.abaikan'      => 'BK ABAIKAN Laporan',

        // Expert System Point
        'expert-system-point.complete' => 'SELESAIKAN ES Point (Konsekuensi/Reward)',
        'expert-system-point.approve-bukti' => 'APPROVE Bukti Pelaksanaan ES Point',

        // Expert System Konselor
        'expert-system-konselor.approve'  => 'APPROVE ES Konselor -> Mulai Konseling',
        'expert-system-konselor.complete' => 'SELESAIKAN ES Konselor',

        // Bukti
        'my-expert-system-point.upload-bukti' => 'SANTRI Upload Bukti Pelaksanaan',

        // Manage User
        'manage-user.approve'           => 'APPROVE User Baru',
        'manage-user.toggle-status'     => 'UBAH Status User (Aktif/Nonaktif)',
        'manage-user.update'            => 'EDIT Data User',
        'manage-user.destroy'           => 'HAPUS User',

        // Kelas
        'kelas.store'                   => 'TAMBAH Kelas Baru',
        'kelas.update'                  => 'EDIT Kelas',
        'kelas.tambah-santri'           => 'TAMBAH Santri ke Kelas',
        'kelas.pindah-santri'           => 'PINDAH Santri Antar Kelas',
        'kelas.keluarkan-santri'        => 'KELUARKAN Santri dari Kelas',

        // Penugasan
        'penugasan.store'               => 'TAMBAH Penugasan Wali',
        'penugasan.destroy'             => 'HAPUS Penugasan Wali',

        // Variabel
        'variabel.pelanggaran.store'    => 'TAMBAH Variabel Pelanggaran',
        'variabel.pelanggaran.update'   => 'EDIT Variabel Pelanggaran',
        'variabel.pelanggaran.destroy'  => 'HAPUS Variabel Pelanggaran',
        'variabel.apresiasi.store'      => 'TAMBAH Variabel Apresiasi',
        'variabel.apresiasi.update'     => 'EDIT Variabel Apresiasi',
        'variabel.konselor.store'       => 'TAMBAH Variabel Konselor',
        'variabel.konselor.update'      => 'EDIT Variabel Konselor',
        'variabel.konsekuensi.store'    => 'TAMBAH Variabel Konsekuensi',
        'variabel.reward.store'         => 'TAMBAH Variabel Reward',
        'variabel.diagnosis.store'      => 'TAMBAH Variabel Diagnosis',

        // Rules
        'rules.store'                   => 'TAMBAH Rule Expert System',
        'rules.update'                  => 'EDIT Rule Expert System',
        'rules.destroy'                 => 'HAPUS Rule Expert System',
    ];

    public function handle(Request $request, Closure $next): mixed
    {
        // Eksekusi request dulu
        $response = $next($request);

        // Skip GET request biasa (terlalu banyak noise, kecuali yang penting)
        // Hanya catat: POST, PUT, PATCH, DELETE + GET yang penting
        $method = strtoupper($request->method());
        if ($method === 'GET') {
            // Untuk GET, hanya catat halaman penting
            $routeName = $request->route()?->getName() ?? '';
            $importantGet = ['dashboard', 'login', 'logout', 'santri.show'];
            if (!in_array($routeName, $importantGet)) {
                return $response;
            }
        }

        // Skip routes yang tidak relevan
        $routeName = $request->route()?->getName() ?? '';
        foreach (self::SKIP_ROUTES as $skip) {
            if (str_starts_with($routeName, $skip)) {
                return $response;
            }
        }

        // Skip jika bukan user yang login
        if (!Auth::check()) {
            // Catat percobaan login
            if (str_contains($request->path(), 'login') && $method === 'POST') {
                $this->writeLog('GUEST', null, null, $request, $response, 'Percobaan Login');
            }
            return $response;
        }

        $user = Auth::user();
        $this->writeLog(
            $user->role ?? 'unknown',
            $user->id,
            $user->username,
            $request,
            $response
        );

        return $response;
    }

    private function writeLog(
        string $role,
        ?int $userId,
        ?string $username,
        Request $request,
        $response,
        ?string $overrideLabel = null
    ): void {
        try {
            $routeName  = $request->route()?->getName() ?? '';
            $routeParams = $request->route()?->parameters() ?? [];
            $method     = strtoupper($request->method());
            $statusCode = $response->getStatusCode();

            // Label aksi yang mudah dibaca
            $actionLabel = $overrideLabel
                ?? self::ACTION_LABELS[$routeName]
                ?? $this->buildFallbackLabel($method, $routeName, $request->path());

            // Input data (bersihkan field sensitif)
            $inputData = $this->sanitizeInput($request->except(self::HIDDEN_FIELDS));

            // Status
            $statusEmoji = match(true) {
                $statusCode >= 500 => 'ERROR',
                $statusCode >= 400 => 'FAIL',
                $statusCode >= 300 => 'REDIRECT',
                default            => 'OK',
            };

            // Format pesan log
            $context = [
                'user_id'      => $userId,
                'username'     => $username,
                'role'         => strtoupper($role),
                'action'       => $actionLabel,
                'method'       => $method,
                'route'        => $routeName ?: $request->path(),
                'params'       => $routeParams,
                'status'       => "{$statusCode} {$statusEmoji}",
                'input'        => empty($inputData) ? null : $inputData,
                'ip'           => $request->ip(),
                'user_agent'   => substr($request->userAgent() ?? '', 0, 80),
            ];

            // Pilih level log berdasarkan status
            if ($statusCode >= 500) {
                Log::channel('activity')->error("[{$role}] {$actionLabel}", $context);
            } elseif ($statusCode >= 400) {
                Log::channel('activity')->warning("[{$role}] {$actionLabel}", $context);
            } else {
                Log::channel('activity')->info("[{$role}] {$actionLabel}", $context);
            }

        } catch (\Throwable $e) {
            // Jangan sampai logger mengganggu aplikasi
            Log::warning('ActivityLogger failed: ' . $e->getMessage());
        }
    }

    private function sanitizeInput(array $input): array
    {
        // Hapus field kosong dan yang terlalu panjang
        return collect($input)
            ->filter(fn($v) => $v !== null && $v !== '')
            ->map(function ($v) {
                if (is_string($v) && strlen($v) > 200) {
                    return substr($v, 0, 200) . '...[truncated]';
                }
                return $v;
            })
            ->toArray();
    }

    private function buildFallbackLabel(string $method, string $routeName, string $path): string
    {
        if (!$routeName) {
            return "{$method} {$path}";
        }

        $parts = explode('.', $routeName);
        $action = end($parts);
        $resource = implode('.', array_slice($parts, 0, -1));

        $actionMap = [
            'index'   => 'Lihat daftar',
            'show'    => 'Lihat detail',
            'store'   => 'Tambah data',
            'create'  => 'Buka form tambah',
            'update'  => 'Edit/update data',
            'edit'    => 'Buka form edit',
            'destroy' => 'Hapus data',
        ];

        $actionLabel = $actionMap[$action] ?? strtoupper($method);
        return "{$actionLabel} [{$resource}]";
    }
}