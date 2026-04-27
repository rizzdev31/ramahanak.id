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
        Schema::table('variabel_diagnosis', function (Blueprint $table) {
            $table->text('rekomendasi')->after('penjelasan');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('variabel_diagnosis', function (Blueprint $table) {
            $table->dropColumn('rekomendasi');
        });
    }
};