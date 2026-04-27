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
        Schema::create('kelas', function (Blueprint $table) {
            $table->id();
            $table->string('kode_kelas', 10); // Contoh: "7A", "8B"
            $table->string('nama', 100); // Contoh: "Al Farabi", "Al Kindi"
            $table->integer('tingkat'); // Contoh: 7, 8, 9 (0 untuk PENDING)
            $table->string('tahun_ajaran', 20); // Contoh: "2024/2025"
            $table->integer('kapasitas')->nullable(); // Kapasitas maksimal santri
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();

            // Index untuk performa query
            $table->index(['kode_kelas', 'tahun_ajaran'], 'idx_kelas_tahun');
            $table->index('status');
            $table->index('tingkat');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('kelas');
    }
};