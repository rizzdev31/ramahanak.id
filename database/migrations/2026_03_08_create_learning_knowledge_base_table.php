<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * ✨ CONTINUOUS LEARNING SYSTEM - KNOWLEDGE BASE
     * Menyimpan setiap pembelajaran dari koreksi manual Guru BK
     */
    public function up(): void
    {
        Schema::create('learning_knowledge_base', function (Blueprint $table) {
            $table->id();
            
            // ══════════════════════════════════════════════════════════
            // SOURCE TRACKING
            // ══════════════════════════════════════════════════════════
            $table->foreignId('hasil_preprocessing_id')
                ->constrained('hasil_preprocessing')
                ->cascadeOnDelete();
            
            $table->text('laporan_text')
                ->comment('Text laporan original');
            
            // ══════════════════════════════════════════════════════════
            // LEARNING DATA
            // ══════════════════════════════════════════════════════════
            $table->json('extracted_keywords')
                ->comment('Kata kunci yang di-extract dari text');
            
            $table->string('learned_for_kode', 10)
                ->comment('Kode variabel target (P002, A001, etc)');
            
            $table->enum('learned_for_type', ['pelanggaran', 'apresiasi'])
                ->comment('Tipe variabel (konselor excluded from auto-learning)');
            
            $table->enum('learning_type', [
                'keyword_addition',      // Menambah kata ke kamus_kata
                'keyword_validation',    // Validasi kata yang sudah ada
                'pattern_recognition',   // Mengenali pattern baru
                'negation_correction'    // Koreksi negation handling
            ])->default('keyword_addition');
            
            // ══════════════════════════════════════════════════════════
            // ORIGINAL vs CORRECTED
            // ══════════════════════════════════════════════════════════
            $table->json('original_kode_matched')
                ->nullable()
                ->comment('Kode yang dihasilkan preprocessing (before correction)');
            
            $table->json('corrected_kode_matched')
                ->comment('Kode setelah koreksi manual BK');
            
            // ══════════════════════════════════════════════════════════
            // CONFIDENCE & VALIDATION
            // ══════════════════════════════════════════════════════════
            $table->decimal('confidence_score', 3, 2)
                ->default(0.80)
                ->comment('Confidence score untuk learning ini (0.0 - 1.0)');
            
            $table->enum('validation_status', ['pending', 'validated', 'rejected'])
                ->default('validated')
                ->comment('Auto-validated karena dari koreksi BK');
            
            // ══════════════════════════════════════════════════════════
            // IMPACT TRACKING
            // ══════════════════════════════════════════════════════════
            $table->boolean('applied_to_variabel')
                ->default(false)
                ->comment('Apakah sudah di-apply ke variabel table');
            
            $table->timestamp('application_timestamp')
                ->nullable()
                ->comment('Kapan di-apply ke variabel');
            
            $table->text('application_notes')
                ->nullable()
                ->comment('Notes tentang aplikasi (kata ditambah, updated, dll)');
            
            // ══════════════════════════════════════════════════════════
            // PERFORMANCE TRACKING
            // ══════════════════════════════════════════════════════════
            $table->integer('success_count')
                ->default(0)
                ->comment('Berapa kali pattern ini berhasil detect correct');
            
            $table->integer('fail_count')
                ->default(0)
                ->comment('Berapa kali pattern ini salah/gagal');
            
            $table->decimal('accuracy', 5, 2)
                ->default(0.00)
                ->comment('Accuracy rate (success / total) dalam persen');
            
            // ══════════════════════════════════════════════════════════
            // AUDIT TRAIL
            // ══════════════════════════════════════════════════════════
            $table->foreignId('created_by')
                ->comment('BK yang melakukan koreksi')
                ->constrained('users')
                ->cascadeOnDelete();
            
            $table->foreignId('validated_by')
                ->nullable()
                ->comment('BK yang validate (optional for review)')
                ->constrained('users')
                ->nullOnDelete();
            
            $table->timestamp('validated_at')->nullable();
            
            $table->timestamps();
            
            // ══════════════════════════════════════════════════════════
            // INDEXES
            // ══════════════════════════════════════════════════════════
            $table->index('learned_for_kode');
            $table->index('learned_for_type');
            $table->index('learning_type');
            $table->index('validation_status');
            $table->index('applied_to_variabel');
            $table->index(['learned_for_kode', 'learned_for_type']);
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('learning_knowledge_base');
    }
};