<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Tabel Profil Guru BK
        Schema::create('guru_bk_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->onDelete('cascade');
            $table->string('nip')->unique();
            $table->string('nama_lengkap');
            $table->string('nama_panggilan')->nullable();
            $table->string('tempat_lahir')->nullable();
            $table->date('tanggal_lahir')->nullable();
            $table->enum('jenis_kelamin', ['Laki-laki', 'Perempuan']);
            $table->string('jabatan')->nullable();
            $table->string('foto')->nullable();
            $table->string('no_whatsapp')->nullable();
            $table->timestamps();
        });

        // 2. Tabel Profil Tenaga Pendidik
        Schema::create('tenaga_pendidik_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->onDelete('cascade');
            $table->string('nip')->unique();
            $table->string('nama_lengkap');
            $table->string('nama_panggilan')->nullable();
            $table->string('tempat_lahir')->nullable();
            $table->date('tanggal_lahir')->nullable();
            $table->enum('jenis_kelamin', ['Laki-laki', 'Perempuan']);
            $table->string('jabatan')->nullable();
            $table->string('foto')->nullable();
            $table->string('no_whatsapp')->nullable();
            $table->timestamps();
        });

        // 3. Tabel Profil Santri
        Schema::create('santri_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->onDelete('cascade');
            $table->string('nisn')->unique();
            $table->string('nama_lengkap');
            $table->string('nama_panggilan')->nullable();
            $table->string('nama_wali')->nullable();
            $table->string('kelas')->nullable();
            $table->string('tempat_lahir')->nullable();
            $table->date('tanggal_lahir')->nullable();
            $table->text('alamat')->nullable(); // Diubah ke text agar bisa menampung alamat panjang
            $table->enum('jenis_kelamin', ['Laki-laki', 'Perempuan']);
            $table->string('foto')->nullable();
            $table->string('no_whatsapp')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        // Menghapus tabel secara spesifik
        Schema::dropIfExists('santri_profiles');
        Schema::dropIfExists('tenaga_pendidik_profiles');
        Schema::dropIfExists('guru_bk_profiles');
    }
};