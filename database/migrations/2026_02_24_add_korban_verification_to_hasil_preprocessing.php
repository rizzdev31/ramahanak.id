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
        Schema::table('hasil_preprocessing', function (Blueprint $table) {
            // ✅ Field untuk tracking verifikasi korban
            $table->boolean('requires_korban_verification')->default(false)->after('status');
            $table->boolean('korban_verified')->default(false)->after('requires_korban_verification');
            $table->timestamp('korban_verified_at')->nullable()->after('korban_verified');
            $table->unsignedBigInteger('korban_verified_by')->nullable()->after('korban_verified_at');
            $table->json('verified_kode_konselor')->nullable()->after('korban_verified_by')
                ->comment('Kode konselor yang diverifikasi oleh BK untuk korban');
            
            // Foreign key untuk verifier
            $table->foreign('korban_verified_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('hasil_preprocessing', function (Blueprint $table) {
            $table->dropForeign(['korban_verified_by']);
            $table->dropColumn([
                'requires_korban_verification',
                'korban_verified',
                'korban_verified_at',
                'korban_verified_by',
                'verified_kode_konselor',
            ]);
        });
    }
};