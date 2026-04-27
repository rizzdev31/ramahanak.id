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
        Schema::create('catatan_kolaboratif_konseling', function (Blueprint $table) {
            $table->id();
            
            // Reference ke laporan
            $table->foreignId('laporan_konselor_id')
                  ->constrained('laporan_expert_system_konselor')
                  ->onDelete('cascade');
            
            // Optional: Tied to specific sesi or general
            $table->foreignId('sesi_bimbingan_id')
                  ->nullable()
                  ->constrained('sesi_bimbingan_konselor')
                  ->onDelete('cascade');
            
            // Author (BK atau Tenaga Pendidik)
            $table->foreignId('author_id')->constrained('users')->onDelete('cascade');
            $table->enum('author_role', ['guru_bk', 'tenaga_pendidik']);
            
            // Content
            $table->string('judul');
            $table->text('isi_catatan');
            
            // Optional attachment
            $table->string('file_path')->nullable();
            
            $table->timestamps();
            
            // Indexes
            $table->index('laporan_konselor_id');
            $table->index('author_id');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('catatan_kolaboratif_konseling');
    }
};