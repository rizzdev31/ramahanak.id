<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bimbingan_berkala_pertanyaan', function (Blueprint $table) {
            $table->id();

            // ═══ RELASI KE TEMPLATE ═══
            $table->foreignId('template_id')
                  ->constrained('bimbingan_berkala_template')
                  ->onDelete('cascade');

            // ═══ URUTAN & KONTEN ═══
            $table->unsignedSmallInteger('urutan')->default(1); // Urutan tampil
            $table->text('teks_pertanyaan');
            $table->boolean('is_required')->default(true);

            // ═══ TIPE SOAL ═══
            // skala_1_5  → slider 1-5, ada threshold flag
            // ya_tidak   → boolean, ada flag_jika_ya
            // pilihan    → multiple choice, pilihan disimpan di pilihan_json
            // teks_bebas → textarea, dianalisis NLP ringan (hanya G)
            // teks_curhat→ textarea, TIDAK dianalisis, disimpan apa adanya
            $table->enum('tipe', [
                'skala_1_5',
                'ya_tidak',
                'pilihan',
                'teks_bebas',
                'teks_curhat',
            ])->default('teks_bebas');

            // ═══ KONFIGURASI ANALISIS (nullable, hanya untuk tipe tertentu) ═══

            // Untuk skala_1_5 dan ya_tidak dan pilihan:
            // Kode gejala konselor yang di-flag (G001-G019)
            $table->string('kode_gejala_terkait', 10)->nullable();

            // Untuk skala_1_5: skor minimum untuk trigger flag
            // Contoh: 3 berarti jika jawaban ≥ 3 maka flag G
            $table->unsignedTinyInteger('threshold_flag')->nullable();

            // Untuk ya_tidak: 'ya' atau 'tidak' yang menjadi flag
            $table->enum('flag_jika_jawaban', ['ya', 'tidak'])->nullable()->default('ya');

            // Untuk pilihan: JSON array of {label, nilai, kode_gejala}
            // Contoh: [{"label":"Senang","nilai":1,"kode_gejala":null},
            //          {"label":"Sedih","nilai":3,"kode_gejala":"G003"}]
            $table->json('pilihan_json')->nullable();

            // Untuk teks_bebas: apakah analisis NLP diaktifkan
            $table->boolean('analisis_nlp_aktif')->default(true);

            $table->timestamps();

            // Index
            $table->index(['template_id', 'urutan']);
            $table->index('tipe');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bimbingan_berkala_pertanyaan');
    }
};