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
        Schema::create('variabel_reward', function (Blueprint $table) {
            $table->id();
            $table->string('kode', 10)->unique();           // R001, R002, dst
            $table->string('reward', 250);                  // Pemberian Voucher + Apresiasi, dst
            $table->integer('poin');                        // Threshold poin: 30, 60, 90, 130, 150
            $table->text('rekomendasi');                    // Tindakan BK saat memberikan reward
            $table->timestamps();

            // Index untuk performa search
            $table->index('kode');
            $table->index('poin');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('variabel_reward');
    }
};