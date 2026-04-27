<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bimbingan_berkala_jadwal', function (Blueprint $table) {
            $table->id();

            // ═══ RELASI ═══
            $table->foreignId('template_id')
                  ->constrained('bimbingan_berkala_template')
                  ->onDelete('restrict'); // Jangan hapus template yang punya jadwal

            $table->foreignId('kelas_id')
                  ->constrained('kelas')
                  ->onDelete('restrict');

            $table->foreignId('created_by')
                  ->constrained('users')
                  ->onDelete('cascade');

            // ═══ INFORMASI JADWAL ═══
            $table->string('judul', 200);
            $table->date('tanggal_jadwal');
            $table->time('waktu_mulai')->nullable();
            $table->time('waktu_selesai')->nullable();
            $table->text('catatan_untuk_tendik')->nullable(); // Notif ke tenaga pendidik

            // ═══ MODE PENGISIAN ═══
            // bk_langsung  → BK isi saat wawancara tatap muka
            // santri_mandiri → Santri isi sendiri via akun mereka
            $table->enum('mode_pengisian', ['bk_langsung', 'santri_mandiri'])
                  ->default('bk_langsung');

            // Deadline jika mode santri_mandiri
            $table->datetime('deadline_mandiri')->nullable();

            // ═══ STATUS JADWAL ═══
            // draft      → belum dipublikasi, santri belum bisa lihat
            // aktif      → antrian sudah generate, siap dijalankan
            // berjalan   → sedang dalam proses (ada santri dipanggil)
            // selesai    → semua antrian selesai
            // dibatalkan → dibatalkan BK
            $table->enum('status', [
                'draft',
                'aktif',
                'berjalan',
                'selesai',
                'dibatalkan',
            ])->default('draft');

            $table->timestamps();

            // Index
            $table->index('status');
            $table->index('tanggal_jadwal');
            $table->index(['kelas_id', 'status']);
            $table->index('created_by');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bimbingan_berkala_jadwal');
    }
};