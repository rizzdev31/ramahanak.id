<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('variabel_pelanggaran', function (Blueprint $table) {
            $table->id();
            $table->string('kode', 10)->unique();           // P001, P002, dst
            $table->string('kategori', 100);                // perundungan_fisik, disiplin_waktu, dst
            $table->integer('poin');                        // 2, 5, 20, dst
            $table->text('tindakan');                       // Konsekuensi/tindakan yang diberikan
            $table->text('kamus_kata');                     // Kata kunci untuk preprocessing (comma separated)
            $table->timestamps();

            // Index untuk performa search
            $table->index('kode');
            $table->index('kategori');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('variabel_pelanggaran');
    }
};