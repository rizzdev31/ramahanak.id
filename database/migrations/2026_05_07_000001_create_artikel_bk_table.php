<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        //  TABEL UTAMA ARTIKEL 
        Schema::create('artikel_bk', function (Blueprint $table) {
            $table->id();

            // Relasi ke Guru BK pembuat
            $table->foreignId('user_id')
                  ->constrained('users')
                  ->cascadeOnDelete();

            //  Konten 
            $table->string('judul');
            $table->string('slug')->unique()->comment('URL-friendly, auto-generate dari judul');
            $table->string('kategori')->default('Umum')
                  ->comment('Kesehatan Mental | Panduan BK | Kasus Khusus | Manajemen Santri | Umum');
            $table->text('ringkasan')->nullable()->comment('Intro singkat, dipakai di card list');
            $table->longText('konten')->nullable()->comment('Body artikel, bisa HTML');
            $table->json('tags')->nullable()->comment('Array tag/keyword, cth: ["bullying","konseling"]');

            //  SEO 
            $table->string('meta_description', 160)->nullable()
                  ->comment('Deskripsi SEO maks 160 karakter');
            $table->string('meta_keywords', 255)->nullable()
                  ->comment('Keyword SEO dipisah koma');

            //  Gambar Utama (Thumbnail) 
            $table->string('gambar_utama_path')->nullable()
                  ->comment('Path storage gambar thumbnail');
            $table->string('gambar_utama_alt', 120)->nullable()
                  ->comment('Alt text gambar utama untuk SEO');

            //  Estimasi Baca 
            $table->unsignedTinyInteger('estimasi_baca')->default(5)
                  ->comment('Estimasi menit baca, dihitung otomatis');

            //  Status & Publish 
            $table->enum('status', ['draft', 'published', 'archived'])->default('draft');
            $table->timestamp('published_at')->nullable()
                  ->comment('Null = belum dipublish');

            //  Statistik 
            $table->unsignedInteger('view_count')->default(0);

            $table->timestamps();

            // Index untuk query cepat
            $table->index(['status', 'published_at']);
            $table->index('kategori');
            $table->index('user_id');
        });

        //  TABEL GALLERY FOTO 
        Schema::create('artikel_gambar', function (Blueprint $table) {
            $table->id();
            $table->foreignId('artikel_bk_id')
                  ->constrained('artikel_bk')
                  ->cascadeOnDelete();

            $table->string('file_path')->comment('Path storage foto');
            $table->string('file_name')->comment('Nama file asli');
            $table->string('file_type', 50)->comment('image/jpeg | image/png | image/webp');
            $table->unsignedInteger('file_size')->comment('Ukuran dalam bytes');
            $table->string('keterangan', 200)->nullable()->comment('Caption foto');
            $table->unsignedTinyInteger('urutan')->default(0)->comment('Urutan tampil di gallery');

            $table->timestamps();
            $table->index(['artikel_bk_id', 'urutan']);
        });

        //  TABEL MEDIA LINK (YouTube, IG, TikTok, dll) 
        Schema::create('artikel_media_link', function (Blueprint $table) {
            $table->id();
            $table->foreignId('artikel_bk_id')
                  ->constrained('artikel_bk')
                  ->cascadeOnDelete();

            $table->enum('tipe', ['youtube', 'instagram', 'tiktok', 'facebook', 'twitter', 'website'])
                  ->comment('Tipe platform media');
            $table->string('url')->comment('URL lengkap link media');
            $table->string('judul', 200)->nullable()->comment('Judul/deskripsi link opsional');
            $table->string('embed_id', 100)->nullable()
                  ->comment('ID video YouTube / post ID untuk embed otomatis');
            $table->unsignedTinyInteger('urutan')->default(0);

            $table->timestamps();
            $table->index(['artikel_bk_id', 'tipe']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('artikel_media_link');
        Schema::dropIfExists('artikel_gambar');
        Schema::dropIfExists('artikel_bk');
    }
};