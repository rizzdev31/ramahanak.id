<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bimbingan_berkala_jawaban', function (Blueprint $table) {
            $table->id();

            // ═══ RELASI ═══
            $table->foreignId('sesi_id')
                  ->constrained('bimbingan_berkala_sesi')
                  ->onDelete('cascade');

            $table->foreignId('pertanyaan_id')
                  ->constrained('bimbingan_berkala_pertanyaan')
                  ->onDelete('cascade');

            // ═══ ISI JAWABAN (hanya salah satu yang terisi sesuai tipe) ═══
            $table->text('jawaban_teks')->nullable();          // teks_bebas, teks_curhat
            $table->unsignedTinyInteger('jawaban_skor')->nullable(); // skala_1_5 (1-5)
            $table->string('jawaban_pilihan', 100)->nullable(); // pilihan (label pilihan)
            $table->boolean('jawaban_ya_tidak')->nullable();   // ya_tidak (true=ya, false=tidak)

            // ═══ HASIL ANALISIS PER JAWABAN ═══
            // Diisi otomatis oleh sistem:
            // [{kode: 'G001', kata_pemicu: ['cemas'], confidence: 0.8, ada_negasi: false}]
            $table->json('gejala_terdeteksi')->nullable();

            // Apakah jawaban ini men-trigger flag?
            $table->boolean('flag_triggered')->default(false);

            // Kode gejala yang di-trigger (jika flag_triggered = true)
            $table->string('kode_gejala_triggered', 10)->nullable();

            $table->timestamps();

            // Constraint: 1 pertanyaan hanya 1 jawaban per sesi
            $table->unique(['sesi_id', 'pertanyaan_id'], 'unique_sesi_pertanyaan');

            // Index
            $table->index('sesi_id');
            $table->index('flag_triggered');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bimbingan_berkala_jawaban');
    }
};