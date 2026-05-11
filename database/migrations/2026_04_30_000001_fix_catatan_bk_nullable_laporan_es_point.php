<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Fix: catatan_bk NOT NULL menyebabkan error saat auto-create dari ExpertSystemPointService.
 * Kolom ini diisi BK saat approve, bukan saat auto-create — jadi harus nullable.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('laporan_expert_system_point', function (Blueprint $table) {
            $table->text('catatan_bk')
                  ->nullable()
                  ->default(null)
                  ->comment('Catatan BK — diisi saat approve, bukan saat auto-create')
                  ->change();
        });
    }

    public function down(): void
    {
        Schema::table('laporan_expert_system_point', function (Blueprint $table) {
            $table->text('catatan_bk')
                  ->nullable(false)
                  ->comment('Catatan/analisis BK tentang santri (WAJIB untuk PDF)')
                  ->change();
        });
    }
};