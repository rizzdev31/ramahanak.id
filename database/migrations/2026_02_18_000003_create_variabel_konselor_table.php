<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('variabel_konselor', function (Blueprint $table) {
            $table->id();
            $table->string('kode', 10)->unique();           // G001, G002, dst
            $table->string('gangguan_mental', 150);         // Gangguan Kecemasan Umum, dst
            $table->text('kamus_kata');                     // Kata kunci untuk preprocessing (comma separated)
            $table->text('rekomendasi');                    // Tindakan awal yang harus dilakukan BK
            $table->timestamps();

            // Index untuk performa search
            $table->index('kode');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('variabel_konselor');
    }
};