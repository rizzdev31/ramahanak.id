<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * ✨ AUTO-UPDATE LOG TABLE
     * Tracking semua perubahan otomatis ke variabel tables
     */
    public function up(): void
    {
        Schema::create('variabel_auto_update_log', function (Blueprint $table) {
            $table->id();
            
            // ══════════════════════════════════════════════════════════
            // TARGET VARIABEL
            // ══════════════════════════════════════════════════════════
            $table->enum('variabel_type', ['pelanggaran', 'apresiasi', 'konselor']);
            $table->string('variabel_kode', 10);
            
            // ══════════════════════════════════════════════════════════
            // CHANGES TRACKING
            // ══════════════════════════════════════════════════════════
            $table->string('field_updated', 50)
                ->comment('Field yang di-update (e.g., kamus_kata)');
            
            $table->text('old_value')
                ->nullable()
                ->comment('Value sebelum update');
            
            $table->text('new_value')
                ->comment('Value setelah update');
            
            $table->text('update_reason')
                ->comment('Alasan update (e.g., Auto-learned from correction)');
            
            // ══════════════════════════════════════════════════════════
            // SOURCE TRACKING
            // ══════════════════════════════════════════════════════════
            $table->foreignId('source_knowledge_id')
                ->nullable()
                ->comment('Reference ke learning_knowledge_base')
                ->constrained('learning_knowledge_base')
                ->nullOnDelete();
            
            $table->foreignId('triggered_by_hasil_id')
                ->nullable()
                ->comment('Hasil preprocessing yang trigger update')
                ->constrained('hasil_preprocessing')
                ->nullOnDelete();
            
            // ══════════════════════════════════════════════════════════
            // APPROVAL (Optional - untuk review)
            // ══════════════════════════════════════════════════════════
            $table->boolean('requires_approval')
                ->default(false)
                ->comment('Apakah perlu approval manual (false = auto-approved)');
            
            $table->enum('approval_status', ['pending', 'approved', 'rejected'])
                ->default('approved')
                ->comment('Status approval (default approved untuk Option A)');
            
            $table->foreignId('approved_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            
            $table->timestamp('approved_at')->nullable();
            
            // ══════════════════════════════════════════════════════════
            // ROLLBACK SUPPORT
            // ══════════════════════════════════════════════════════════
            $table->boolean('can_rollback')
                ->default(true)
                ->comment('Apakah bisa di-rollback');
            
            $table->boolean('rolled_back')
                ->default(false)
                ->comment('Apakah sudah di-rollback');
            
            $table->foreignId('rollback_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            
            $table->timestamp('rollback_at')->nullable();
            
            $table->text('rollback_reason')->nullable();
            
            // ══════════════════════════════════════════════════════════
            // TIMESTAMPS
            // ══════════════════════════════════════════════════════════
            $table->timestamps();
            
            // ══════════════════════════════════════════════════════════
            // INDEXES
            // ══════════════════════════════════════════════════════════
            $table->index(['variabel_type', 'variabel_kode']);
            $table->index('field_updated');
            $table->index('approval_status');
            $table->index('rolled_back');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('variabel_auto_update_log');
    }
};