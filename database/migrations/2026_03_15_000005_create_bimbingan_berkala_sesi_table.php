<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bimbingan_berkala_sesi', function (Blueprint $table) {
            $table->id();

            // ═══ RELASI UTAMA ═══
            $table->foreignId('jadwal_id')
                  ->constrained('bimbingan_berkala_jadwal')
                  ->onDelete('cascade');

            $table->foreignId('antrian_id')
                  ->constrained('bimbingan_berkala_antrian')
                  ->onDelete('cascade');

            $table->foreignId('santri_id')
                  ->constrained('users')
                  ->onDelete('cascade');

            // ═══ SIAPA YANG MENGISI ═══
            // bk      → BK yang isi (mode wawancara)
            // santri  → Santri isi mandiri
            $table->enum('diisi_oleh', ['bk', 'santri'])->default('bk');

            $table->foreignId('diisi_oleh_user_id')
                  ->constrained('users')
                  ->onDelete('cascade');

            // ═══ CATATAN UMUM BK ═══
            $table->text('catatan_bk_umum')->nullable();

            // ═══ HASIL ANALISIS SISTEM (JSON) ═══
            // Array gejala yang terdeteksi oleh sistem:
            // [{kode: 'G001', sumber: 'skala', confidence: 'tinggi', detail: '...'}]
            $table->json('gejala_terdeteksi')->nullable();

            // ═══ HASIL SETELAH REVIEW BK (JSON) ═══
            // Array gejala yang DIKONFIRMASI BK (bisa beda dari terdeteksi):
            // ['G001', 'G002']
            $table->json('gejala_dikonfirmasi')->nullable();

            // ═══ KEPUTUSAN FINAL BK ═══
            // tidak_perlu    → tidak perlu tindak lanjut
            // pantau         → pantau di bimbingan berikutnya
            // rujuk_konseling→ buat laporan konselor individual
            $table->enum('tindak_lanjut', [
                'tidak_perlu',
                'pantau',
                'rujuk_konseling',
            ])->nullable();

            $table->text('catatan_keputusan')->nullable();

            // ═══ LINK KE LAPORAN KONSELOR (jika rujuk) ═══
            $table->foreignId('laporan_konselor_id')
                  ->nullable()
                  ->constrained('laporan_konselor')
                  ->onDelete('set null');

            // ═══ STATUS SESI ═══
            // draft          → jawaban belum lengkap
            // menunggu_review→ jawaban sudah masuk, belum direview BK
            // selesai        → BK sudah review dan ambil keputusan
            $table->enum('status', [
                'draft',
                'menunggu_review',
                'selesai',
            ])->default('draft');

            // BK yang review
            $table->foreignId('reviewed_by')
                  ->nullable()
                  ->constrained('users')
                  ->onDelete('set null');

            $table->datetime('reviewed_at')->nullable();

            $table->timestamps();

            // Constraint: 1 santri per jadwal hanya 1 sesi
            $table->unique(['jadwal_id', 'santri_id'], 'unique_jadwal_santri_sesi');

            // Index
            $table->index(['jadwal_id', 'status']);
            $table->index('santri_id');
            $table->index('tindak_lanjut');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bimbingan_berkala_sesi');
    }
};