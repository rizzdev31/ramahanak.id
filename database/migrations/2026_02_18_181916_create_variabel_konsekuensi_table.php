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
        Schema::create('variabel_konsekuensi', function (Blueprint $table) {
            $table->id();
            $table->string('kode', 10)->unique();           // K001, K002, dst
            $table->string('konsekuensi', 200);             // Bimbingan 1 Dan Pemberian Sanksi Ringan, dst
            $table->integer('poin');                        // Threshold poin: 10, 30, 50, 70, dst
            $table->text('rekomendasi');                    // Tindakan BK saat konsekuensi tercapai
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
        Schema::dropIfExists('variabel_konsekuensi');
    }
};