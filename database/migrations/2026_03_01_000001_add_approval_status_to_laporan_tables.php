<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // ═══════════════════════════════════════════════════════════
        // 1. LAPORAN PELANGGARAN
        // ═══════════════════════════════════════════════════════════
        Schema::table('laporan_pelanggaran', function (Blueprint $table) {
            // Add new approval_status column
            $table->enum('approval_status', [
                'pending_tenaga_pendidik',
                'pending_bk',
                'selesai',
                'diabaikan'
            ])->default('pending_tenaga_pendidik')->after('status');
            
            // Keep old status column for backward compatibility
            // We'll migrate data: status → approval_status
        });

        // Migrate existing data
        DB::table('laporan_pelanggaran')->update([
            'approval_status' => DB::raw("CASE 
                WHEN status = 'selesai' THEN 'selesai'
                WHEN status = 'diabaikan' THEN 'diabaikan'
                ELSE 'pending_tenaga_pendidik'
            END")
        ]);

        // ═══════════════════════════════════════════════════════════
        // 2. LAPORAN APRESIASI
        // ═══════════════════════════════════════════════════════════
        Schema::table('laporan_apresiasi', function (Blueprint $table) {
            $table->enum('approval_status', [
                'pending_tenaga_pendidik',
                'pending_bk',
                'diberikan',
                'ditunda'
            ])->default('pending_tenaga_pendidik')->after('status');
        });

        // Migrate existing data
        DB::table('laporan_apresiasi')->update([
            'approval_status' => DB::raw("CASE 
                WHEN status = 'diberikan' THEN 'diberikan'
                WHEN status = 'ditunda' THEN 'ditunda'
                ELSE 'pending_tenaga_pendidik'
            END")
        ]);

        // ═══════════════════════════════════════════════════════════
        // 3. LAPORAN KONSELOR
        // ═══════════════════════════════════════════════════════════
        Schema::table('laporan_konselor', function (Blueprint $table) {
            $table->enum('approval_status', [
                'pending_tenaga_pendidik',
                'pending_bk',
                'selesai',
                'dirujuk'
            ])->default('pending_tenaga_pendidik')->after('status');
        });

        // Migrate existing data
        DB::table('laporan_konselor')->update([
            'approval_status' => DB::raw("CASE 
                WHEN status = 'selesai' THEN 'selesai'
                WHEN status = 'dirujuk' THEN 'dirujuk'
                ELSE 'pending_tenaga_pendidik'
            END")
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('laporan_pelanggaran', function (Blueprint $table) {
            $table->dropColumn('approval_status');
        });

        Schema::table('laporan_apresiasi', function (Blueprint $table) {
            $table->dropColumn('approval_status');
        });

        Schema::table('laporan_konselor', function (Blueprint $table) {
            $table->dropColumn('approval_status');
        });
    }
};