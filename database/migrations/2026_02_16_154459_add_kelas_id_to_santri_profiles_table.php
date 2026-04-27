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
        Schema::table('santri_profiles', function (Blueprint $table) {
            // Hapus kolom 'kelas' yang lama (varchar)
            $table->dropColumn('kelas');

            // Tambah kolom 'kelas_id' (foreign key ke tabel kelas)
            // NOT NULL karena kita pakai SOLUSI A (Kelas PENDING)
            $table->foreignId('kelas_id')->after('nama_wali')->constrained('kelas')->onDelete('restrict');
            
            // Index untuk performa query
            $table->index('kelas_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('santri_profiles', function (Blueprint $table) {
            // Hapus foreign key dan kolom kelas_id
            $table->dropForeign(['kelas_id']);
            $table->dropColumn('kelas_id');

            // Kembalikan kolom 'kelas' yang lama
            $table->string('kelas', 50)->nullable()->after('nama_wali');
        });
    }
};