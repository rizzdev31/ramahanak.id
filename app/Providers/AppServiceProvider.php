<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

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
         * 
         * Singleton pattern ensures hanya 1 instance dibuat per request
         * untuk efficiency dan consistency
         */
        $this->app->singleton(\App\Services\ForwardChainingService::class, function ($app) {
            return new \App\Services\ForwardChainingService();
        });

        /**
         * Register PdfRekamMedisService as singleton (if exists)
         * 
         * Service untuk generate PDF rekam medis
         */
        if (class_exists(\App\Services\PdfRekamMedisService::class)) {
            $this->app->singleton(\App\Services\PdfRekamMedisService::class, function ($app) {
                return new \App\Services\PdfRekamMedisService();
            });
        }

        // ============================================
        // OTHER SERVICE REGISTRATIONS
        // ============================================

        // Add your other service registrations here
        // Example:
        // $this->app->singleton(SomeService::class, function ($app) {
        //     return new SomeService();
        // });
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

        // Set default timezone
        date_default_timezone_set('Asia/Jakarta');

        // Set locale
        config(['app.locale' => 'id']);
        
        // ============================================
        // MODEL OBSERVERS (Optional)
        // ============================================
        
        // Register model observers if needed
        // Example:
        // \App\Models\LaporanExpertSystemKonselor::observe(\App\Observers\LaporanKonselorObserver::class);
    }
}