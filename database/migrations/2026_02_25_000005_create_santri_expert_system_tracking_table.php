<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('santri_expert_system_tracking', function (Blueprint $table) {
            $table->id();

            // Relasi ke santri (user)
            $table->unsignedBigInteger('santri_id')->unique()
                  ->comment('1 santri = 1 tracking record');
            $table->foreign('santri_id')
                  ->references('id')->on('users')
                  ->cascadeOnDelete();

            // Akumulasi poin
            $table->integer('total_poin_pelanggaran')->default(0)
                  ->comment('Total poin pelanggaran santri saat ini');
            $table->integer('total_poin_apresiasi')->default(0)
                  ->comment('Total poin apresiasi santri saat ini');

            // Tracking kode yang sudah di-trigger (JSON array)
            $table->json('konsekuensi_diberikan')->nullable()
                  ->comment('Array kode konsekuensi yang sudah diberikan, cth: ["K001","K002"]');
            $table->json('reward_diberikan')->nullable()
                  ->comment('Array kode reward yang sudah diberikan, cth: ["R001"]');

            // Timestamp cek terakhir
            $table->timestamp('last_check_konsekuensi')->nullable()
                  ->comment('Kapan terakhir threshold konsekuensi dicek');
            $table->timestamp('last_check_reward')->nullable()
                  ->comment('Kapan terakhir threshold reward dicek');

            $table->timestamps();

            // Index
            $table->index('santri_id');
            $table->index('total_poin_pelanggaran');
            $table->index('total_poin_apresiasi');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('santri_expert_system_tracking');
    }
};