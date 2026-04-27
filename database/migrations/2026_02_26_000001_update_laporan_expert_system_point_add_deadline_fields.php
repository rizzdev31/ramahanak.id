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
        Schema::table('laporan_expert_system_point', function (Blueprint $table) {
            // Deadline & Kesepakatan (diset oleh BK)
            $table->date('tanggal_batas_pelaksanaan')->nullable()->after('pdf_path')
                ->comment('Deadline pelaksanaan yang diset BK');
            
            $table->text('kesepakatan_keterlambatan')->nullable()->after('tanggal_batas_pelaksanaan')
                ->comment('Kesepakatan hukuman jika santri terlambat upload bukti');
            
            // Status tracking
            $table->boolean('is_terlambat')->default(false)->after('kesepakatan_keterlambatan')
                ->comment('Auto-check apakah sudah melewati deadline');
            
            $table->boolean('has_bukti')->default(false)->after('is_terlambat')
                ->comment('Apakah santri sudah upload bukti pelaksanaan');
            
            $table->boolean('bukti_approved')->default(false)->after('has_bukti')
                ->comment('Apakah bukti sudah di-approve oleh BK');
            
            // Final status (lebih detail dari status existing)
            $table->enum('final_status', [
                'pending',      // Belum di-review BK
                'in_progress',  // Sudah selesai, menunggu bukti santri
                'completed',    // Santri sudah upload bukti, menunggu review BK
                'verified',     // BK sudah approve bukti, SELESAI penuh
                'overdue'       // Deadline lewat, belum upload bukti
            ])->default('pending')->after('bukti_approved')
                ->comment('Status detail untuk tracking pelaksanaan');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('laporan_expert_system_point', function (Blueprint $table) {
            $table->dropColumn([
                'tanggal_batas_pelaksanaan',
                'kesepakatan_keterlambatan',
                'is_terlambat',
                'has_bukti',
                'bukti_approved',
                'final_status',
            ]);
        });
    }
};