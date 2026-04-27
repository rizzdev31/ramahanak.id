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
        Schema::create('hasil_preprocessing', function (Blueprint $table) {
            $table->id();
            
            // Relasi ke Laporan Awal
            $table->foreignId('laporan_awal_id')
                ->constrained('laporan_awal')
                ->cascadeOnDelete();
            
            // Hasil Matching (dari Python)
            $table->json('kode_matched'); // ["P001", "G011", "A002"]
            
            // Ekstraksi Entitas (dari Python)
            $table->string('pelaku_nama')->nullable();
            $table->foreignId('pelaku_santri_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            
            $table->string('korban_nama')->nullable();
            $table->foreignId('korban_santri_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            
            $table->string('kata_kerja_dasar')->nullable();
            
            // Data Lengkap Preprocessing (untuk audit/debug)
            $table->json('preprocessing_data')->nullable();
            
            // Status Validasi BK (Gerbang 2)
            $table->enum('status', [
                'pending_validasi',  // Menunggu BK cek
                'approved',          // BK approve, lanjut routing
                'rejected',          // BK reject
                'failed'             // Python error
            ])->default('pending_validasi');
            
            // Tracking Koreksi Manual
            $table->boolean('is_corrected')->default(false);
            $table->text('correction_notes')->nullable();
            
            // Validasi BK
            $table->foreignId('validated_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->timestamp('validated_at')->nullable();
            
            // Error Handling
            $table->text('error_message')->nullable();
            
            // Timestamps
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();
            
            // Indexes
            $table->index('laporan_awal_id');
            $table->index('status');
            $table->index('pelaku_santri_id');
            $table->index('korban_santri_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('hasil_preprocessing');
    }
};