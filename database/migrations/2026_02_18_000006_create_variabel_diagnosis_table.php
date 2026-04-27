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
        Schema::create('variabel_diagnosis', function (Blueprint $table) {
            $table->id();
            $table->string('kode', 10)->unique();           // D001, D002, dst
            $table->string('diagnosis', 150);               // Nama diagnosis
            $table->text('penjelasan');                     // Penjelasan lengkap diagnosis
            $table->timestamps();

            // Index untuk performa search
            $table->index('kode');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('variabel_diagnosis');
    }
};