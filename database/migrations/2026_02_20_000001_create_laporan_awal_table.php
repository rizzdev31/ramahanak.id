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
        Schema::create('laporan_awal', function (Blueprint $table) {
            $table->id();
            
            // Pelapor
            $table->foreignId('pelapor_id')
                ->constrained('users')
                ->cascadeOnDelete();
            
            // Isi Laporan
            $table->text('text_laporan');
            $table->enum('jenis_laporan', [
                'pelanggaran',      // Laporan negatif
                'apresiasi',        // Laporan positif
                'kondisi_mental',   // Laporan kondisi psikologis
                'lainnya'           // Laporan umum
            ])->default('pelanggaran');
            
            // Metadata
            $table->string('tahun_ajaran', 9); // 2025/2026
            $table->date('tanggal_kejadian');
            $table->time('waktu_kejadian')->nullable();
            $table->string('lokasi_kejadian')->nullable();
            
            // Status Validasi (Gerbang 1)
            $table->enum('status', [
                'pending',      // Menunggu validasi BK
                'approved',     // Disetujui BK → lanjut preprocessing
                'rejected'      // Ditolak BK
            ])->default('pending');
            
            // Validasi BK
            $table->foreignId('validated_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->timestamp('validated_at')->nullable();
            $table->text('catatan_validasi')->nullable(); // Alasan reject/note dari BK
            
            $table->timestamps();
            
            // Indexes
            $table->index('pelapor_id');
            $table->index('status');
            $table->index('tahun_ajaran');
            $table->index('tanggal_kejadian');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('laporan_awal');
    }
};