<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('riwayat_santri', function (Blueprint $table) {
            $table->id();
            
            // ═══ SANTRI ═══
            $table->foreignId('santri_id')
                  ->constrained('users')
                  ->onDelete('cascade');
            
            // ═══ LINK KE LAPORAN SPESIFIK (POLYMORPHIC-LIKE) ═══
            // Hanya salah satu yang terisi
            $table->foreignId('laporan_pelanggaran_id')
                  ->nullable()
                  ->constrained('laporan_pelanggaran')
                  ->onDelete('cascade');
            
            $table->foreignId('laporan_apresiasi_id')
                  ->nullable()
                  ->constrained('laporan_apresiasi')
                  ->onDelete('cascade');
            
            $table->foreignId('laporan_konselor_id')
                  ->nullable()
                  ->constrained('laporan_konselor')
                  ->onDelete('cascade');
            
            // ═══ DATA SUMMARY (Denormalized for Expert System) ═══
            $table->enum('jenis_laporan', ['pelanggaran', 'apresiasi', 'konselor']);
            $table->string('kode', 10);              // P001, A001, K001
            $table->integer('bobot_poin')->nullable();  // ✅ Poin (null untuk konselor)
            
            // ═══ TANGGAL ═══
            $table->date('tanggal_kejadian');
            
            // ═══ STATUS ═══
            $table->string('status', 50);            // selesai, dalam_proses, dll
            
            // ═══ METADATA ═══
            $table->text('ringkasan')->nullable();   // Summary singkat
            
            $table->timestamps();
            
            // ═══ INDEX (CRITICAL FOR EXPERT SYSTEM!) ═══
            $table->index('santri_id');
            $table->index(['santri_id', 'jenis_laporan']);
            $table->index(['santri_id', 'bobot_poin']);  // For poin calculation
            $table->index('tanggal_kejadian');
            
            // ✅ CONSTRAINT: Pastikan hanya 1 foreign key yang terisi
            // (Handled di application layer)
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('riwayat_santri');
    }
};