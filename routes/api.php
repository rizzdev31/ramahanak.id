<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\EksekusiController;
use App\Http\Controllers\Api\AbsensiController;
use App\Http\Controllers\Api\VariabelSyncController;

/*
|--------------------------------------------------------------------------
| API Integrasi (PRD-04) — Smart Eksekusi & Absensi
|--------------------------------------------------------------------------
| Semua endpoint butuh header: Authorization: Bearer <INTEGRASI_API_TOKEN>
| Prefix global '/api' otomatis dari bootstrap/app.php. Di sini tambah '/v1'.
*/

Route::prefix('v1')->middleware(['integrasi.token', 'throttle:120,1'])->group(function () {

    // ── Smart Eksekusi (input manual tendik di aplikasi pengirim) ──
    Route::post('/eksekusi/pelanggaran', [EksekusiController::class, 'pelanggaran']);
    Route::post('/eksekusi/apresiasi',   [EksekusiController::class, 'apresiasi']);
    Route::post('/eksekusi/konselor',    [EksekusiController::class, 'konselor']);

    // ── Absensi (otomatis: hanya telat) ──
    Route::post('/absensi/telat', [AbsensiController::class, 'telat']);

    // ── Sinkronisasi kode variabel (pengirim auto-tarik) ──
    Route::get('/variabel/pelanggaran', [VariabelSyncController::class, 'pelanggaran']);
    Route::get('/variabel/apresiasi',   [VariabelSyncController::class, 'apresiasi']);
    Route::get('/variabel/konselor',    [VariabelSyncController::class, 'konselor']);

    // ── Verifikasi santri (opsional) ──
    Route::get('/santri/{nisn}', [VariabelSyncController::class, 'santri']);

    // ── Health check integrasi ──
    Route::get('/ping', fn () => response()->json(['status' => 'ok', 'service' => 'ramahanak-integrasi', 'time' => now()]));
});
