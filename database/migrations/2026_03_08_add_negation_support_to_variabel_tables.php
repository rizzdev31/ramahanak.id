<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * ✅ NEGATION SUPPORT MIGRATION
     * Menambahkan kolom untuk mendukung negation prefix logic
     */
    public function up(): void
    {
        // ══════════════════════════════════════════════════════════
        // VARIABEL PELANGGARAN - Add negation support
        // ══════════════════════════════════════════════════════════
        Schema::table('variabel_pelanggaran', function (Blueprint $table) {
            // Apakah kata ini bisa di-negasi dengan "tidak"?
            $table->boolean('negatable')->default(false)->after('kamus_kata');
            
            // Kode apresiasi counterpart (when negated)
            // Contoh: P002 (telat) → counterpart_kode = 'A101' (disiplin waktu)
            $table->string('counterpart_kode', 10)->nullable()->after('negatable');
            
            // Catatan untuk BK
            $table->text('negation_notes')->nullable()->after('counterpart_kode');
        });

        // ══════════════════════════════════════════════════════════
        // VARIABEL APRESIASI - Add negation support
        // ══════════════════════════════════════════════════════════
        Schema::table('variabel_apresiasi', function (Blueprint $table) {
            // Apakah kata ini bisa di-negasi dengan "tidak"?
            $table->boolean('negatable')->default(false)->after('kamus_kata');
            
            // Kode pelanggaran counterpart (when negated)
            // Contoh: A001 (membantu) → counterpart_kode = 'P101' (tidak membantu)
            $table->string('counterpart_kode', 10)->nullable()->after('negatable');
            
            // Catatan untuk BK
            $table->text('negation_notes')->nullable()->after('counterpart_kode');
        });

        // ══════════════════════════════════════════════════════════
        // VARIABEL KONSELOR - No negation (different logic)
        // ══════════════════════════════════════════════════════════
        // Konselor (G-codes) tidak menggunakan flip logic
        // Tetap detect as-is, BK yang decide context
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('variabel_pelanggaran', function (Blueprint $table) {
            $table->dropColumn(['negatable', 'counterpart_kode', 'negation_notes']);
        });

        Schema::table('variabel_apresiasi', function (Blueprint $table) {
            $table->dropColumn(['negatable', 'counterpart_kode', 'negation_notes']);
        });
    }
};