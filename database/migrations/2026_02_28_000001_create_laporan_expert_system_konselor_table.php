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
        Schema::create('laporan_expert_system_konselor', function (Blueprint $table) {
            $table->id();
            
            // Santri & Rule Reference
            $table->foreignId('santri_id')->constrained('users')->onDelete('cascade');
            $table->string('rule_kode', 10); // RA-01, RA-02, dll
            $table->string('rule_kategori', 50); // pelaku, korban, saksi
            
            // Diagnosis Reference (from variabel_diagnosis)
            $table->string('diagnosis_kode', 10);
            $table->string('diagnosis_nama');
            $table->text('diagnosis_penjelasan')->nullable();
            $table->text('rekomendasi_sistem'); // Core rekomendasi dari variabel diagnosis
            
            // Kode yang memenuhi rule (JSON array)
            // Contoh: ["R001", "R003", "K002"]
            $table->json('kode_terpenuhi');
            
            // Status & Progress
            $table->enum('status', ['pending', 'in_progress', 'completed', 'discontinued'])
                  ->default('pending');
            $table->unsignedTinyInteger('sesi_bimbingan_terakhir')->default(0); // 0-5
            
            // BK yang handle
            $table->foreignId('validated_by')->nullable()->constrained('users')->onDelete('set null');
            
            // Timestamps
            $table->timestamp('tanggal_trigger'); // Kapan rule trigger
            $table->timestamp('tanggal_selesai')->nullable(); // Kapan complete
            
            $table->timestamps();
            
            // Constraint: 1 rule hanya 1x per santri
            $table->unique(['santri_id', 'rule_kode'], 'unique_santri_rule');
            
            // Indexes untuk performance
            $table->index('status');
            $table->index('tanggal_trigger');
            $table->index(['santri_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('laporan_expert_system_konselor');
    }
};