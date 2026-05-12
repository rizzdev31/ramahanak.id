<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Illuminate\Console\Scheduling\Schedule;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // ============================================
        // EXPERT SYSTEM KONSELOR - SERVICES
        // ============================================

        /**
         * Register ForwardChainingService as singleton
         * Singleton pattern ensures hanya 1 instance dibuat per request
         */
        $this->app->singleton(\App\Services\ForwardChainingService::class, function ($app) {
            return new \App\Services\ForwardChainingService();
        });

        /**
         * Register PdfRekamMedisService as singleton (if exists)
         */
        if (class_exists(\App\Services\PdfRekamMedisService::class)) {
            $this->app->singleton(\App\Services\PdfRekamMedisService::class, function ($app) {
                return new \App\Services\PdfRekamMedisService();
            });
        }
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        // ============================================
        // GLOBAL CONFIGURATIONS
        // ============================================

        date_default_timezone_set('Asia/Jakarta');
        config(['app.locale' => 'id']);

        // ============================================
        // SCHEDULER
        // ============================================

        $this->callAfterResolving(Schedule::class, function (Schedule $schedule) {

            // 1. Forward Chaining  setiap malam 23:00 WIB
            //    Eksekusi 43 rule IF-THEN, generate laporan konselor otomatis
            $schedule->command('konselor:check-triggers')
                ->dailyAt('23:00')
                ->timezone('Asia/Jakarta')
                ->appendOutputTo(storage_path('logs/konselor-triggers.log'));

            // 2. Expert System Point Sync  setiap jam
            //    Cek threshold poin santri, trigger konsekuensi/reward otomatis
            $schedule->command('expert-system:sync')
                ->hourly()
                ->appendOutputTo(storage_path('logs/expert-system-sync.log'));

            // 3. Sync Laporan Approvals  setiap hari jam 01:00 WIB
            //    Sinkronisasi approval dengan penugasan kelas aktif
            $schedule->command('laporan:sync-approvals')
                ->dailyAt('01:00')
                ->timezone('Asia/Jakarta')
                ->appendOutputTo(storage_path('logs/laporan-sync.log'));
        });
    }
}