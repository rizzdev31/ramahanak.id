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
        Schema::create('laporan_konselor', function (Blueprint $table) {
            $table->id();
            
            // ═══ LINK KE HASIL PREPROCESSING ═══
            $table->foreignId('hasil_preprocessing_id')
                  ->constrained('hasil_preprocessing')
                  ->onDelete('cascade');
            
            // ═══ SANTRI TERKAIT ═══
            $table->foreignId('santri_id')
                  ->nullable()  // ✅ Bisa null jika santri tidak teridentifikasi
                  ->constrained('users')
                  ->onDelete('cascade');
            
            // ═══ VARIABEL KONSELOR ═══
            $table->string('kode_konselor', 10);     // K001, K002, dll
            $table->text('diagnosis_default');       // ✅ Diagnosis dari variabel (auto-fill)
            $table->text('tindakan_default');        // ✅ Tindakan dari variabel (auto-fill)
            
            // ═══ INPUT BK ═══
            $table->text('catatan_bk')->nullable();  // BK tambah catatan konseling
            
            // ═══ TANGGAL ═══
            $table->date('tanggal_kejadian');        // ✅ Dari laporan_awal
            $table->date('tanggal_konseling_mulai')->nullable();
            $table->date('tanggal_konseling_selesai')->nullable();
            
            // ═══ STATUS TRACKING ═══
            $table->enum('status', [
                'pending',           // Belum dikonseling
                'dalam_konseling',   // Sedang proses konseling
                'selesai',           // Konseling selesai
                'dirujuk'            // Dirujuk ke profesional
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
            $table->index(['santri_id', 'status']);
            $table->index('tanggal_kejadian');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('laporan_konselor');
    }
};