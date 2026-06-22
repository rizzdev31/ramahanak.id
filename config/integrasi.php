<?php

/**
 * Konfigurasi integrasi API dengan aplikasi pengirim (Smart Eksekusi & Absensi).
 * PENTING: selalu baca via config('integrasi.*'), JANGAN env() langsung di runtime
 * (env() = null setelah `php artisan config:cache`). Lihat docs/AUDIT-Preprocessing.md.
 */
return [

    // Token bersama untuk autentikasi antar-app (header: Authorization: Bearer <token>)
    'token' => env('INTEGRASI_API_TOKEN'),

    // Identitas default aplikasi pengirim (boleh dikirim juga via field 'app' di request)
    'default_app' => env('INTEGRASI_DEFAULT_APP', 'aplikasi-pengirim'),

    // Pemetaan jenis kejadian absensi → kode variabel pelanggaran (disiplin waktu).
    // Pastikan kode ini ADA di tabel variabel_pelanggaran.
    'absensi_mapping' => [
        'telat' => env('ABSENSI_KODE_TELAT', 'P002'),
    ],
];
