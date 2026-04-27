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
        Schema::create('bukti_pelaksanaan', function (Blueprint $table) {
            $table->id();
            
            // ═══════════════════════════════════════════════════════
            // POLYMORPHIC RELATION
            // Bisa untuk: LaporanExpertSystemPoint, LaporanKonselor, dll
            // ═══════════════════════════════════════════════════════
            $table->string('bukti_able_type');  // Model class name
            $table->unsignedBigInteger('bukti_able_id');  // Model ID
            $table->index(['bukti_able_type', 'bukti_able_id'], 'bukti_able_index');
            
            // ═══════════════════════════════════════════════════════
            // FILE INFORMATION
            // ═══════════════════════════════════════════════════════
            $table->string('file_path');        // storage/app/public/bukti/xxx.jpg
            $table->string('file_name');        // Original filename
            $table->string('file_type', 50);    // image/jpeg, image/png, application/pdf
            $table->integer('file_size');       // File size in bytes
            
            // ═══════════════════════════════════════════════════════
            // UPLOAD INFORMATION
            // ═══════════════════════════════════════════════════════
            $table->text('keterangan')->nullable();  // Optional note from santri
            $table->foreignId('uploaded_by')
                ->constrained('users')
                ->cascadeOnDelete();
            $table->timestamp('uploaded_at');
            
            // ═══════════════════════════════════════════════════════
            // REVIEW INFORMATION (by BK)
            // ═══════════════════════════════════════════════════════
            $table->enum('status', ['pending', 'approved', 'rejected'])
                ->default('pending');
            $table->text('catatan_review')->nullable();  // Review note from BK
            $table->foreignId('reviewed_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            
            // ═══════════════════════════════════════════════════════
            // TIMESTAMPS
            // ═══════════════════════════════════════════════════════
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bukti_pelaksanaan');
    }
};