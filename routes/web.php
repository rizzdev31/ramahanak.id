<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\KelasController;
use App\Http\Controllers\PenugasanKelasController;
use App\Http\Controllers\LaporanAwalController;
use App\Http\Controllers\HasilPreprocessingController;
use App\Http\Controllers\LaporanPelanggaranController;
use App\Http\Controllers\LaporanApresiasiController;
use App\Http\Controllers\LaporanKonselorController;
use App\Http\Controllers\ExpertSystemPointController;
use App\Http\Controllers\BuktiPelaksanaanController;
use App\Http\Controllers\MyExpertSystemPointController;
use App\Http\Controllers\VariabelPelanggaranController;
use App\Http\Controllers\VariabelApresiasiController;
use App\Http\Controllers\VariabelKonselorController;
use App\Http\Controllers\VariabelKonsekuensiController;
use App\Http\Controllers\VariabelRewardController;
use App\Http\Controllers\VariabelDiagnosisController;
use App\Http\Controllers\RuleExpertSystemController;
use App\Http\Controllers\ApprovalManagementController;
use App\Http\Controllers\SantriProfilController;
use App\Http\Controllers\LaporanWaliController;
use App\Http\Controllers\ExpertSystemKonselorController;
use App\Http\Controllers\SesiBimbinganController;
use App\Http\Controllers\MyKonselingController;
use App\Http\Controllers\BimbinganBerkalaController;
use App\Http\Controllers\BimbinganKelasController;
use App\Http\Controllers\MyBimbinganController;
use App\Http\Controllers\TenagaPendidikSantriController;
use App\Http\Controllers\MySantriProfilController;

use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin'       => Route::has('login'),
        'canRegister'    => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion'     => PHP_VERSION,
    ]);
});

Route::middleware(['auth', 'verified', 'checkStatus'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::prefix('profile')->name('profile.')->group(function () {
        Route::get('/',    [ProfileController::class, 'edit'])->name('edit');
        Route::patch('/',  [ProfileController::class, 'update'])->name('update');
        Route::delete('/', [ProfileController::class, 'destroy'])->name('destroy');
    });
    Route::get('/laporan/create', [LaporanAwalController::class, 'create'])->name('laporan.create');
    Route::post('/laporan',       [LaporanAwalController::class, 'store'])->name('laporan.store');
});

Route::middleware(['auth', 'verified', 'checkStatus', 'role:guru_bk'])->group(function () {

    Route::prefix('manage-user')->name('manage-user.')->group(function () {
        Route::get('/', [UserController::class, 'index'])->name('index');
        Route::match(['PUT', 'POST'], '/{user}', [UserController::class, 'update'])->name('update');
        Route::delete('/{user}', [UserController::class, 'destroy'])->name('destroy');
        Route::post('/{user}/approve', [UserController::class, 'approve'])->name('approve');
        Route::post('/{user}/toggle-status', [UserController::class, 'toggleStatus'])->name('toggle-status');
    });

    Route::prefix('santri')->name('santri.')->group(function () {
        Route::get('/', [SantriProfilController::class, 'index'])->name('index');
        Route::get('/{santri}/profil', [SantriProfilController::class, 'show'])->name('profil');
    });

    Route::resource('kelas', KelasController::class)->parameters(['kelas' => 'kelas']);
    Route::prefix('kelas/{kelas}')->name('kelas.')->group(function () {
        Route::post('/tambah-santri',    [KelasController::class, 'tambahSantri'])->name('tambah-santri');
        Route::post('/pindah-santri',    [KelasController::class, 'pindahSantri'])->name('pindah-santri');
        Route::post('/keluarkan-santri', [KelasController::class, 'keluarkanSantri'])->name('keluarkan-santri');
    });

    Route::prefix('penugasan')->name('penugasan.')->group(function () {
        Route::get('/', [PenugasanKelasController::class, 'index'])->name('index');
        Route::post('/', [PenugasanKelasController::class, 'store'])->name('store');
        Route::delete('/{penugasan}', [PenugasanKelasController::class, 'destroy'])->name('destroy');
        Route::post('/{penugasan}/transfer', [PenugasanKelasController::class, 'transfer'])->name('transfer');
    });

    Route::prefix('laporan')->name('laporan.')->group(function () {
        Route::get('/', [LaporanAwalController::class, 'index'])->name('index');
        Route::post('/{laporan}/approve', [LaporanAwalController::class, 'approve'])->name('approve');
        Route::post('/{laporan}/reject',  [LaporanAwalController::class, 'reject'])->name('reject');
        Route::get('/{laporan}/test-preprocessing', [LaporanAwalController::class, 'testPreprocessing'])->name('test-preprocessing');
    });

    Route::prefix('hasil-preprocessing')->name('hasil-preprocessing.')->group(function () {
        Route::get('/', [HasilPreprocessingController::class, 'index'])->name('index');
        Route::get('/{hasil}/edit', [HasilPreprocessingController::class, 'edit'])->name('edit');
        Route::put('/{hasil}', [HasilPreprocessingController::class, 'update'])->name('update');
        Route::post('/{hasil}/approve', [HasilPreprocessingController::class, 'approve'])->name('approve');
        Route::post('/{hasil}/reject',  [HasilPreprocessingController::class, 'reject'])->name('reject');
        Route::delete('/{hasil}', [HasilPreprocessingController::class, 'destroy'])->name('destroy');
        Route::get('/{hasil}/verify-korban',  [HasilPreprocessingController::class, 'verifyKorban'])->name('verify-korban');
        Route::post('/{hasil}/verify-korban', [HasilPreprocessingController::class, 'storeVerifyKorban'])->name('store-verify-korban');
    });

    Route::prefix('laporan-pelanggaran')->name('laporan-pelanggaran.')->group(function () {
        Route::get('/', [LaporanPelanggaranController::class, 'index'])->name('index');
        Route::get('/{laporan}', [LaporanPelanggaranController::class, 'show'])->name('show');
        Route::put('/{laporan}', [LaporanPelanggaranController::class, 'update'])->name('update');
        Route::post('/{laporan}/complete', [LaporanPelanggaranController::class, 'complete'])->name('complete');
        Route::delete('/{laporan}', [LaporanPelanggaranController::class, 'destroy'])->name('destroy');
    });

    Route::prefix('laporan-apresiasi')->name('laporan-apresiasi.')->group(function () {
        Route::get('/', [LaporanApresiasiController::class, 'index'])->name('index');
        Route::get('/{laporan}', [LaporanApresiasiController::class, 'show'])->name('show');
        Route::put('/{laporan}', [LaporanApresiasiController::class, 'update'])->name('update');
        Route::post('/{laporan}/complete', [LaporanApresiasiController::class, 'complete'])->name('complete');
        Route::delete('/{laporan}', [LaporanApresiasiController::class, 'destroy'])->name('destroy');
    });

    Route::prefix('laporan-konselor')->name('laporan-konselor.')->group(function () {
        Route::get('/', [LaporanKonselorController::class, 'index'])->name('index');
        Route::get('/{laporan}', [LaporanKonselorController::class, 'show'])->name('show');
        Route::put('/{laporan}', [LaporanKonselorController::class, 'update'])->name('update');
        Route::post('/{laporan}/complete', [LaporanKonselorController::class, 'complete'])->name('complete');
        Route::delete('/{laporan}', [LaporanKonselorController::class, 'destroy'])->name('destroy');
    });

    Route::prefix('expert-system-point')->name('expert-system-point.')->group(function () {
        Route::get('/', [ExpertSystemPointController::class, 'index'])->name('index');
        Route::get('/{laporan}', [ExpertSystemPointController::class, 'show'])->name('show');
        Route::put('/{laporan}', [ExpertSystemPointController::class, 'update'])->name('update');
        Route::post('/{laporan}/complete', [ExpertSystemPointController::class, 'complete'])->name('complete');
        Route::delete('/{laporan}', [ExpertSystemPointController::class, 'destroy'])->name('destroy');
        Route::get('/{laporan}/view-pdf',             [ExpertSystemPointController::class, 'viewPdf'])->name('view-pdf');
        Route::get('/{laporan}/download-pdf',         [ExpertSystemPointController::class, 'downloadPdf'])->name('download-pdf');
        Route::get('/{laporan}/download-pdf-lengkap', [ExpertSystemPointController::class, 'downloadPdfWithBukti'])->name('download-pdf-lengkap');
        Route::post('/{laporan}/approve-bukti', [BuktiPelaksanaanController::class, 'approve'])->name('approve-bukti');
        Route::post('/{laporan}/reject-bukti',  [BuktiPelaksanaanController::class, 'reject'])->name('reject-bukti');
    });

    Route::prefix('expert-system-konselor')->name('expert-system-konselor.')->group(function () {
        Route::get('/', [ExpertSystemKonselorController::class, 'index'])->name('index');

        // - FIX: Scan manual - trigger laporan dari data riwayat yang sudah ada
        // Berguna untuk: data historis, testing, dan backup trigger
        Route::post('/scan-now', [ExpertSystemKonselorController::class, 'scanNow'])->name('scan-now');
        Route::post('/scan-santri/{santriId}', [ExpertSystemKonselorController::class, 'scanForSantri'])->name('scan-santri');

        Route::get('/{laporan}', [ExpertSystemKonselorController::class, 'show'])->name('show');
        Route::post('/{laporan}/approve',  [ExpertSystemKonselorController::class, 'approve'])->name('approve');
        Route::post('/{laporan}/complete', [ExpertSystemKonselorController::class, 'complete'])->name('complete');
        Route::delete('/{laporan}', [ExpertSystemKonselorController::class, 'destroy'])->name('destroy');
        Route::prefix('{laporan}/sesi')->name('sesi.')->group(function () {
            Route::post('/',         [SesiBimbinganController::class, 'store'])->name('store');
            Route::put('/{sesi}',    [SesiBimbinganController::class, 'update'])->name('update');
            Route::delete('/{sesi}', [SesiBimbinganController::class, 'destroy'])->name('destroy');
        });
    });

    Route::prefix('variabel')->name('variabel.')->group(function () {
        Route::prefix('pelanggaran')->name('pelanggaran.')->group(function () {
            Route::get('/', [VariabelPelanggaranController::class, 'index'])->name('index');
            Route::post('/', [VariabelPelanggaranController::class, 'store'])->name('store');
            Route::put('/{variabelPelanggaran}', [VariabelPelanggaranController::class, 'update'])->name('update');
            Route::delete('/{variabelPelanggaran}', [VariabelPelanggaranController::class, 'destroy'])->name('destroy');
        });
        Route::prefix('apresiasi')->name('apresiasi.')->group(function () {
            Route::get('/', [VariabelApresiasiController::class, 'index'])->name('index');
            Route::post('/', [VariabelApresiasiController::class, 'store'])->name('store');
            Route::put('/{variabelApresiasi}', [VariabelApresiasiController::class, 'update'])->name('update');
            Route::delete('/{variabelApresiasi}', [VariabelApresiasiController::class, 'destroy'])->name('destroy');
        });
        Route::prefix('konselor')->name('konselor.')->group(function () {
            Route::get('/', [VariabelKonselorController::class, 'index'])->name('index');
            Route::post('/', [VariabelKonselorController::class, 'store'])->name('store');
            Route::put('/{variabelKonselor}', [VariabelKonselorController::class, 'update'])->name('update');
            Route::delete('/{variabelKonselor}', [VariabelKonselorController::class, 'destroy'])->name('destroy');
        });
        Route::prefix('konsekuensi')->name('konsekuensi.')->group(function () {
            Route::get('/', [VariabelKonsekuensiController::class, 'index'])->name('index');
            Route::post('/', [VariabelKonsekuensiController::class, 'store'])->name('store');
            Route::put('/{variabelKonsekuensi}', [VariabelKonsekuensiController::class, 'update'])->name('update');
            Route::delete('/{variabelKonsekuensi}', [VariabelKonsekuensiController::class, 'destroy'])->name('destroy');
        });
        Route::prefix('reward')->name('reward.')->group(function () {
            Route::get('/', [VariabelRewardController::class, 'index'])->name('index');
            Route::post('/', [VariabelRewardController::class, 'store'])->name('store');
            Route::put('/{variabelReward}', [VariabelRewardController::class, 'update'])->name('update');
            Route::delete('/{variabelReward}', [VariabelRewardController::class, 'destroy'])->name('destroy');
        });
        Route::prefix('diagnosis')->name('diagnosis.')->group(function () {
            Route::get('/', [VariabelDiagnosisController::class, 'index'])->name('index');
            Route::post('/', [VariabelDiagnosisController::class, 'store'])->name('store');
            Route::put('/{variabelDiagnosis}', [VariabelDiagnosisController::class, 'update'])->name('update');
            Route::delete('/{variabelDiagnosis}', [VariabelDiagnosisController::class, 'destroy'])->name('destroy');
        });
    });

    Route::resource('rules', RuleExpertSystemController::class)->except(['show']);

    Route::prefix('kelola-approval')->name('kelola-approval.')->group(function () {
        Route::get('/', [ApprovalManagementController::class, 'index'])->name('index');
        Route::get('/{jenis}/{id}', [ApprovalManagementController::class, 'show'])
            ->name('show')->where('jenis', 'pelanggaran|apresiasi|konselor')->where('id', '[0-9]+');
        Route::post('/{jenis}/{id}/approve', [ApprovalManagementController::class, 'finalApprove'])
            ->name('approve')->where('jenis', 'pelanggaran|apresiasi|konselor')->where('id', '[0-9]+');
        Route::post('/{jenis}/{id}/abaikan', [ApprovalManagementController::class, 'abaikan'])
            ->name('abaikan')->where('jenis', 'pelanggaran|apresiasi|konselor')->where('id', '[0-9]+');
        Route::post('/reassign/{approval}', [ApprovalManagementController::class, 'reassign'])->name('reassign');
        Route::post('/sync', [ApprovalManagementController::class, 'syncLaporanApprovals'])->name('sync');
    });

    Route::prefix('my-bimbingan')->name('my-bimbingan.')->group(function () {
        Route::prefix('template')->name('template.')->group(function () {
            Route::get('/', [BimbinganBerkalaController::class, 'templateIndex'])->name('index');
            Route::post('/', [BimbinganBerkalaController::class, 'templateStore'])->name('store');
            Route::get('/{template}/builder', [BimbinganBerkalaController::class, 'templateBuilder'])->name('builder');
            Route::put('/{template}', [BimbinganBerkalaController::class, 'templateUpdate'])->name('update');
            Route::delete('/{template}', [BimbinganBerkalaController::class, 'templateDestroy'])->name('destroy');
        });
        Route::prefix('soal')->name('soal.')->group(function () {
            Route::post('/template/{template}', [BimbinganBerkalaController::class, 'soalStore'])->name('store');
            Route::put('/{soal}', [BimbinganBerkalaController::class, 'soalUpdate'])->name('update');
            Route::delete('/{soal}', [BimbinganBerkalaController::class, 'soalDestroy'])->name('destroy');
            Route::post('/template/{template}/reorder', [BimbinganBerkalaController::class, 'soalReorder'])->name('reorder');
        });
        Route::prefix('jadwal')->name('jadwal.')->group(function () {
            Route::get('/', [BimbinganBerkalaController::class, 'jadwalIndex'])->name('index');
            Route::get('/create', [BimbinganBerkalaController::class, 'jadwalCreate'])->name('create');
            Route::post('/', [BimbinganBerkalaController::class, 'jadwalStore'])->name('store');
            Route::get('/{jadwal}', [BimbinganBerkalaController::class, 'jadwalShow'])->name('show');
            Route::delete('/{jadwal}', [BimbinganBerkalaController::class, 'jadwalDestroy'])->name('destroy');
            Route::post('/{jadwal}/panggil', [BimbinganBerkalaController::class, 'panggilBerikutnya'])->name('panggil');
        });
        Route::post('/antrian/{antrian}/tidak-hadir',
            [BimbinganBerkalaController::class, 'antrianTidakHadir'])->name('antrian.tidak-hadir');
        Route::prefix('sesi')->name('sesi.')->group(function () {
            Route::get('/form/{antrian}', [BimbinganBerkalaController::class, 'sesiForm'])->name('form');
            Route::get('/form-santri/{jadwal}/{antrian}', [BimbinganBerkalaController::class, 'sesiFormBySantri'])->name('form-santri');
            Route::post('/store/{sesi}', [BimbinganBerkalaController::class, 'sesiStore'])->name('store');
            Route::get('/review/{sesi}', [BimbinganBerkalaController::class, 'sesiReview'])->name('review');
            Route::post('/keputusan/{sesi}', [BimbinganBerkalaController::class, 'sesiSimpanKeputusan'])->name('keputusan');
            Route::get('/preview-laporan/{sesi}', [BimbinganBerkalaController::class, 'sesiPreviewLaporan'])->name('preview-laporan');
            Route::post('/konfirmasi-laporan/{sesi}', [BimbinganBerkalaController::class, 'sesiKonfirmasiLaporan'])->name('konfirmasi-laporan');
        });
        // Logbook BK: /my-bimbingan/logbook-santri
        // URL berbeda dari santri /my-bimbingan/logbook untuk hindari konflik middleware group
        Route::get('/logbook-santri', [BimbinganBerkalaController::class, 'logbook'])->name('logbook');
    });

}); // end guru_bk

Route::middleware(['auth', 'verified', 'checkStatus', 'role:tenaga_pendidik,guru_bk'])->group(function () {

    Route::prefix('laporan-wali')->name('laporan-wali.')->group(function () {
        Route::get('/', [LaporanWaliController::class, 'index'])->name('index');
        Route::get('/{approval}', [LaporanWaliController::class, 'show'])->name('show');
        Route::post('/{approval}/approve', [LaporanWaliController::class, 'approve'])->name('approve');
    });

    Route::prefix('bimbingan-kelas')->name('bimbingan-kelas.')->group(function () {
        Route::get('/', [BimbinganKelasController::class, 'index'])->name('index');
        Route::get('/{jadwal}', [BimbinganKelasController::class, 'show'])->name('show');
    });

    // Tenaga Pendidik pantau santri di kelas yang diampu (read-only)
    Route::prefix('santri-kelas')->name('santri-kelas.')->group(function () {
        Route::get('/',         [TenagaPendidikSantriController::class, 'index'])->name('index');
        Route::get('/{santri}', [TenagaPendidikSantriController::class, 'show'])->name('show');
    });

}); // end shared

Route::middleware(['auth', 'verified', 'checkStatus', 'role:santri'])->group(function () {

    // ===========================================================
    // MY PROFIL - Monitoring rekam jejak diri sendiri
    // Santri melihat semua laporan mereka sendiri (read-only)
    // ===========================================================
    Route::get('/my-profil', [MySantriProfilController::class, 'index'])
        ->name('my-profil.index');

    Route::prefix('my-expert-system-point')->name('my-expert-system-point.')->group(function () {
        Route::get('/', [MyExpertSystemPointController::class, 'index'])->name('index');
        Route::get('/{laporan}', [MyExpertSystemPointController::class, 'show'])->name('show');
        Route::post('/{laporan}/upload-bukti', [BuktiPelaksanaanController::class, 'store'])->name('upload-bukti');
        Route::delete('/bukti/{bukti}', [BuktiPelaksanaanController::class, 'destroy'])->name('delete-bukti');
    });

    Route::prefix('my-konseling')->name('my-konseling.')->group(function () {
        Route::get('/', [MyKonselingController::class, 'index'])->name('index');
        Route::get('/{laporan}', [MyKonselingController::class, 'show'])->name('show');
    });

    Route::prefix('my-bimbingan')->name('my-bimbingan.santri.')->group(function () {
        Route::get('/', [MyBimbinganController::class, 'index'])->name('index');
        Route::get('/riwayat', [MyBimbinganController::class, 'riwayat'])->name('riwayat');
        Route::get('/logbook', [MyBimbinganController::class, 'logbook'])->name('logbook');
        Route::get('/{antrian}/isi', [MyBimbinganController::class, 'isiForm'])->name('isi');
        Route::post('/{antrian}/submit', [MyBimbinganController::class, 'isiSubmit'])->name('submit');
    });

}); // end santri

require __DIR__.'/auth.php';