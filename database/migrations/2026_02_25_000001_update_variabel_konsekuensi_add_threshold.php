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
        // Table sudah ada, hanya tambah field 'is_active'
        // TIDAK perlu field 'aksi' karena akan ada di laporan (aksi_bk)
        
        Schema::table('variabel_konsekuensi', function (Blueprint $table) {
            // Tambah field 'is_active' jika belum ada
            if (!Schema::hasColumn('variabel_konsekuensi', 'is_active')) {
                $table->boolean('is_active')->default(true)->after('rekomendasi');
                $table->index('is_active');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('variabel_konsekuensi', function (Blueprint $table) {
            if (Schema::hasColumn('variabel_konsekuensi', 'is_active')) {
                $table->dropIndex(['is_active']);
                $table->dropColumn('is_active');
            }
        });
    }
};