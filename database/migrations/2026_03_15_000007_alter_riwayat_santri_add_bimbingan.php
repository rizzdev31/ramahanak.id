<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // ═══════════════════════════════════════════════════════════
        // 1. Tambah FK ke bimbingan_berkala_sesi
        // ═══════════════════════════════════════════════════════════
        Schema::table('riwayat_santri', function (Blueprint $table) {
            // FK ke sesi bimbingan berkala (nullable, hanya terisi jika jenis=bimbingan)
            $table->foreignId('bimbingan_sesi_id')
                  ->nullable()
                  ->after('laporan_konselor_id')
                  ->constrained('bimbingan_berkala_sesi')
                  ->onDelete('set null');
        });

        // ═══════════════════════════════════════════════════════════
        // 2. Update enum jenis_laporan untuk tambah 'bimbingan'
        // MariaDB tidak support ALTER ENUM langsung,
        // pakai MODIFY COLUMN dengan tipe baru
        // ═══════════════════════════════════════════════════════════
        DB::statement("
            ALTER TABLE riwayat_santri
            MODIFY COLUMN jenis_laporan
            ENUM('pelanggaran', 'apresiasi', 'konselor', 'bimbingan')
            NOT NULL
        ");
    }

    public function down(): void
    {
        // Hapus FK dulu
        Schema::table('riwayat_santri', function (Blueprint $table) {
            $table->dropForeign(['bimbingan_sesi_id']);
            $table->dropColumn('bimbingan_sesi_id');
        });

        // Kembalikan enum ke semula
        DB::statement("
            ALTER TABLE riwayat_santri
            MODIFY COLUMN jenis_laporan
            ENUM('pelanggaran', 'apresiasi', 'konselor')
            NOT NULL
        ");
    }
};