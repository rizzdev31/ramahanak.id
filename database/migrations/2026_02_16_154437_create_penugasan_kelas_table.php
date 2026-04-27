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
        Schema::create('penugasan_kelas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kelas_id')->constrained('kelas')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->enum('jenis_penugasan', ['wali_kelas', 'wali_asrama']);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            // Constraint: User tidak bisa jadi wali_kelas 2x di kelas yang sama
            // Tapi bisa jadi wali_kelas dan wali_asrama di kelas yang sama
            $table->unique(['user_id', 'kelas_id', 'jenis_penugasan'], 'unique_penugasan');

            // Index untuk performa query
            $table->index('is_active');
            $table->index(['kelas_id', 'jenis_penugasan']);
            $table->index(['user_id', 'is_active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('penugasan_kelas');
    }
};