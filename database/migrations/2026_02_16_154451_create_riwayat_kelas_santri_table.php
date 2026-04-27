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
        Schema::create('riwayat_kelas_santri', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('kelas_id')->constrained('kelas')->onDelete('cascade');
            $table->string('tahun_ajaran', 20); // Dari tabel kelas
            $table->boolean('is_active')->default(true); // Kelas sekarang atau history
            $table->date('tanggal_masuk')->nullable(); // Kapan santri masuk kelas ini
            $table->date('tanggal_keluar')->nullable(); // Kapan santri keluar/naik kelas
            $table->text('keterangan')->nullable(); // Catatan tambahan
            $table->timestamps();

            // Constraint: Santri hanya bisa di 1 kelas per tahun ajaran
            $table->unique(['user_id', 'tahun_ajaran'], 'unique_santri_tahun');

            // Index untuk performa query
            $table->index('is_active');
            $table->index(['user_id', 'is_active']);
            $table->index('kelas_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('riwayat_kelas_santri');
    }
};