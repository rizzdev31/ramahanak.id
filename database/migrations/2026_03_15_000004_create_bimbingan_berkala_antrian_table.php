<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bimbingan_berkala_antrian', function (Blueprint $table) {
            $table->id();

            // ═══ RELASI ═══
            $table->foreignId('jadwal_id')
                  ->constrained('bimbingan_berkala_jadwal')
                  ->onDelete('cascade');

            $table->foreignId('santri_id')
                  ->constrained('users')
                  ->onDelete('cascade');

            // ═══ URUTAN ═══
            $table->unsignedSmallInteger('nomor_urut'); // 1, 2, 3, ...

            // ═══ STATUS ANTRIAN ═══
            // menunggu   → belum giliran
            // dipanggil  → sedang sesi dengan BK
            // selesai    → sesi sudah selesai dan diputuskan BK
            // tidak_hadir→ tidak hadir saat dipanggil
            $table->enum('status', [
                'menunggu',
                'dipanggil',
                'selesai',
                'tidak_hadir',
            ])->default('menunggu');

            // ═══ WAKTU ═══
            $table->datetime('waktu_dipanggil')->nullable();
            $table->datetime('waktu_selesai')->nullable();

            $table->timestamps();

            // Constraint: 1 santri hanya 1x per jadwal
            $table->unique(['jadwal_id', 'santri_id'], 'unique_jadwal_santri');

            // Index
            $table->index(['jadwal_id', 'status']);
            $table->index(['jadwal_id', 'nomor_urut']);
            $table->index('santri_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bimbingan_berkala_antrian');
    }
};