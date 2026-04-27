<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Menambah opsi 'processed' ke dalam ENUM status
        // Kita menggunakan DB::statement karena Laravel Blueprint standar 
        // tidak mendukung modifikasi ENUM secara native tanpa library tambahan
        DB::statement("ALTER TABLE laporan_awal MODIFY COLUMN status ENUM('pending', 'approved', 'rejected', 'processed') NOT NULL DEFAULT 'pending'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        /** * PERINGATAN: Sebelum rollback, pastikan tidak ada data yang memiliki status 'processed'.
         * Jika ada, kita ubah dulu kembali ke 'approved' agar tidak error saat tipe data diubah.
         */
        DB::table('laporan_awal')
            ->where('status', 'processed')
            ->update(['status' => 'approved']);

        // Mengembalikan ENUM status ke kondisi awal
        DB::statement("ALTER TABLE laporan_awal MODIFY COLUMN status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending'");
    }
};