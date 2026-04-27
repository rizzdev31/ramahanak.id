<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bimbingan_berkala_template', function (Blueprint $table) {
            $table->id();

            // ═══ IDENTITAS TEMPLATE ═══
            $table->string('judul', 200);
            $table->text('deskripsi')->nullable();
            $table->text('tujuan')->nullable();          // Tujuan bimbingan ini

            // ═══ PENGATURAN ═══
            $table->boolean('is_active')->default(true);
            $table->boolean('is_locked')->default(false); // Template resmi, tidak bisa diedit

            // ═══ PEMBUAT ═══
            $table->foreignId('created_by')
                  ->constrained('users')
                  ->onDelete('cascade');

            $table->timestamps();

            // Index
            $table->index('is_active');
            $table->index('created_by');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bimbingan_berkala_template');
    }
};