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
        Schema::create('sesi_bimbingan_konselor', function (Blueprint $table) {
            $table->id();
            
            // Reference ke laporan
            $table->foreignId('laporan_konselor_id')
                  ->constrained('laporan_expert_system_konselor')
                  ->onDelete('cascade');
            
            // Sesi ke berapa (1-5)
            $table->unsignedTinyInteger('sesi_ke');
            
            // Tanggal sesi dilakukan
            $table->date('tanggal_sesi');
            
            // Catatan BK
            $table->text('catatan_bk'); // Catatan utama dari BK
            $table->text('proses_bimbingan')->nullable(); // Proses yang dilakukan
            $table->text('rencana_tindak_lanjut')->nullable(); // Rencana next step
            
            // Status Santri setelah sesi ini
            $table->enum('status_santri', [
                'membaik',
                'stabil', 
                'masih_bermasalah',
                'memburuk'
            ])->nullable();
            
            // Keputusan: lanjut ke sesi berikutnya atau tidak
            $table->boolean('lanjut_sesi_berikutnya')->default(false);
            
            $table->timestamps();
            
            // Unique: 1 laporan hanya punya 1 sesi per nomor
            $table->unique(['laporan_konselor_id', 'sesi_ke'], 'unique_laporan_sesi');
            
            // Index
            $table->index('tanggal_sesi');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sesi_bimbingan_konselor');
    }
};