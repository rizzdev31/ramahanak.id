<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule): void
    {
        // ============================================
        // EXPERT SYSTEM KONSELOR - AUTO TRIGGER
        // ============================================

        /**
         * Check semua rule expert system konselor (SAFETY NET - tiap 30 menit)
         *
         * FIX: Sebelumnya hanya jalan jam 23:00 (sekali sehari).
         * Sekarang:
         * - Trigger utama: langsung dipanggil dari controller saat
         *   laporan diselesaikan (real-time, via checkForSantri)
         * - Safety net: tiap 30 menit untuk menangkap data yang
         *   mungkin terlewat dari trigger controller
         *
         * Output: storage/logs/konselor-triggers.log
         */
        $schedule->command('konselor:check-triggers')
            ->everyThirtyMinutes()
            ->timezone('Asia/Jakarta')
            ->appendOutputTo(storage_path('logs/konselor-triggers.log'))
            ->onSuccess(function () {
                \Log::info('Konselor triggers: Scheduled task completed successfully');
            })
            ->onFailure(function () {
                \Log::error('Konselor triggers: Scheduled task failed');
            })
            ->withoutOverlapping();   // Cegah overlap jika task sebelumnya masih jalan

        // ============================================
        // OTHER SCHEDULES (Add your other tasks here)
        // ============================================

        // Example: Clear expired sessions daily
        // $schedule->command('session:clear')
        //     ->daily()
        //     ->timezone('Asia/Jakarta');

        // Example: Database backup weekly
        // $schedule->command('backup:run')
        //     ->weekly()
        //     ->sundays()
        //     ->at('02:00')
        //     ->timezone('Asia/Jakarta');

        // Example: Send reminder notifications
        // $schedule->command('reminders:send')
        //     ->dailyAt('08:00')
        //     ->timezone('Asia/Jakarta');
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }

    /**
     * Get the timezone that should be used by default for scheduled events.
     */
    protected function scheduleTimezone(): string
    {
        return 'Asia/Jakarta';
    }
}