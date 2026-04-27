<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('laporan_konselor', function (Blueprint $table) {
            // ═══════════════════════════════════════════════════════
            // 1. Ubah hasil_preprocessing_id menjadi nullable
            //    Data lama tetap aman (sudah ada nilainya)
            //    Laporan dari bimbingan berkala: NULL
            // ═══════════════════════════════════════════════════════
            // Perlu drop FK dulu lalu tambah ulang yang nullable
            $table->dropForeign(['hasil_preprocessing_id']);
        });

        DB::statement("
            ALTER TABLE laporan_konselor
            MODIFY COLUMN hasil_preprocessing_id
            BIGINT UNSIGNED NULL
        ");

        Schema::table('laporan_konselor', function (Blueprint $table) {
            // Tambah kembali FK constraint dengan nullable
            $table->foreign('hasil_preprocessing_id')
                  ->references('id')
                  ->on('hasil_preprocessing')
                  ->onDelete('cascade');

            // ═══════════════════════════════════════════════════════
            // 2. Tambah kolom sumber untuk tracking asal laporan
            //    preprocessing   → dari pipeline NLP biasa
            //    bimbingan_berkala → dari fitur My Bimbingan
            // ═══════════════════════════════════════════════════════
            $table->enum('sumber', ['preprocessing', 'bimbingan_berkala'])
                  ->default('preprocessing')
                  ->after('approval_status');

            // ═══════════════════════════════════════════════════════
            // 3. Tambah FK ke bimbingan_sesi (nullable)
            //    Untuk tracking: laporan ini dari sesi bimbingan mana
            // ═══════════════════════════════════════════════════════
            $table->foreignId('bimbingan_sesi_id')
                  ->nullable()
                  ->after('sumber')
                  ->constrained('bimbingan_berkala_sesi')
                  ->onDelete('set null');
        });

        // Update data lama: set sumber = 'preprocessing' (default sudah handle ini)
        // tapi eksplisit untuk keamanan
        DB::table('laporan_konselor')
            ->whereNull('sumber')
            ->update(['sumber' => 'preprocessing']);
    }

    public function down(): void
    {
        Schema::table('laporan_konselor', function (Blueprint $table) {
            $table->dropForeign(['bimbingan_sesi_id']);
            $table->dropColumn(['sumber', 'bimbingan_sesi_id']);

            // Kembalikan hasil_preprocessing_id ke NOT NULL
            $table->dropForeign(['hasil_preprocessing_id']);
        });

        DB::statement("
            ALTER TABLE laporan_konselor
            MODIFY COLUMN hasil_preprocessing_id
            BIGINT UNSIGNED NOT NULL
        ");

        Schema::table('laporan_konselor', function (Blueprint $table) {
            $table->foreign('hasil_preprocessing_id')
                  ->references('id')
                  ->on('hasil_preprocessing')
                  ->onDelete('cascade');
        });
    }
};