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
        Schema::create('laporan_pelanggaran', function (Blueprint $table) {
            $table->id();
            
            // ═══ LINK KE HASIL PREPROCESSING ═══
            $table->foreignId('hasil_preprocessing_id')
                  ->constrained('hasil_preprocessing')
                  ->onDelete('cascade');
            
            // ═══ SANTRI TERKAIT ═══
            $table->foreignId('pelaku_santri_id')
                  ->nullable()  // ✅ Bisa null (pelaku tidak diketahui)
                  ->constrained('users')
                  ->onDelete('cascade');
            
            $table->foreignId('korban_santri_id')
                  ->nullable()  // ✅ Bisa null (individual case)
                  ->constrained('users')
                  ->onDelete('cascade');
            
            // ═══ VARIABEL PELANGGARAN ═══
            $table->string('kode_pelanggaran', 10);  // P001, P002, dll
            $table->integer('bobot_poin')->unsigned();  // ✅ POIN POSITIF (10, 15, 20, dst) - semakin tinggi = semakin buruk
            $table->text('tindakan_default');        // ✅ Tindakan dari variabel (auto-fill)
            
            // ═══ INPUT BK ═══
            $table->text('catatan_bk')->nullable();  // BK tambah catatan
            
            // ═══ TANGGAL ═══
            $table->date('tanggal_kejadian');        // ✅ Dari laporan_awal
            $table->date('tanggal_tindakan')->nullable();  // Tanggal BK approve
            
            // ═══ STATUS TRACKING ═══
            $table->enum('status', [
                'pending',           // Belum di-handle BK
                'dalam_proses',      // BK sedang proses
                'selesai',           // BK sudah approve
                'diabaikan'          // BK skip (jarang)
            ])->default('pending');
            
            // ═══ APPROVAL ═══
            $table->foreignId('validated_by')
                  ->nullable()
                  ->constrained('users')
                  ->onDelete('set null');
            $table->timestamp('validated_at')->nullable();
            
            $table->timestamps();
            
            // ═══ INDEX ═══
            $table->index('status');
            $table->index(['pelaku_santri_id', 'status']);
            $table->index(['korban_santri_id', 'status']);
            $table->index('tanggal_kejadian');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('laporan_pelanggaran');
    }
};