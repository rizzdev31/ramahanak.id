<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('variabel_apresiasi', function (Blueprint $table) {
            $table->id();
            $table->string('kode', 10)->unique();           // A001, A002, dst
            $table->string('kategori', 100);                // Tindakan/Perilaku, Prestasi, dst
            $table->integer('poin');                        // 2, 10, dst
            $table->text('apresiasi');                      // Apresiasi Ucapan, Apresiasi dan Validasi
            $table->text('kamus_kata');                     // Kata kunci untuk preprocessing (comma separated)
            $table->timestamps();

            // Index untuk performa search
            $table->index('kode');
            $table->index('kategori');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('variabel_apresiasi');
    }
};