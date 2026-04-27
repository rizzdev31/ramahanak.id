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
        Schema::create('laporan_approvals', function (Blueprint $table) {
            $table->id();
            
            // ═══════════════════════════════════════════════════════════
            // POLYMORPHIC RELATION
            // ═══════════════════════════════════════════════════════════
            // Bisa untuk: LaporanPelanggaran, LaporanApresiasi, LaporanKonselor
            $table->string('laporan_type'); // App\Models\LaporanPelanggaran
            $table->unsignedBigInteger('laporan_id');
            
            // Index untuk polymorphic
            $table->index(['laporan_type', 'laporan_id'], 'laporan_approvals_polymorphic_index');
            
            // ═══════════════════════════════════════════════════════════
            // TENAGA PENDIDIK (Approver)
            // ═══════════════════════════════════════════════════════════
            $table->foreignId('tenaga_pendidik_id')
                ->constrained('users')
                ->onDelete('cascade');
            
            // ═══════════════════════════════════════════════════════════
            // APPROVAL DATA
            // ═══════════════════════════════════════════════════════════
            $table->text('catatan')->nullable(); // Catatan saat approve
            $table->timestamp('approved_at')->nullable(); // Null = belum approve
            
            // ═══════════════════════════════════════════════════════════
            // DEADLINE & TRACKING
            // ═══════════════════════════════════════════════════════════
            $table->timestamp('deadline_at')->nullable(); // 24 jam dari created_at
            
            $table->timestamps();
            
            // ═══════════════════════════════════════════════════════════
            // CONSTRAINTS
            // ═══════════════════════════════════════════════════════════
            // 1 tenaga pendidik hanya approve 1x per laporan
            $table->unique(
                ['laporan_type', 'laporan_id', 'tenaga_pendidik_id'],
                'unique_approval_per_tenaga_pendidik'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('laporan_approvals');
    }
};