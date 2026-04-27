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
        Schema::create('rules_expert_system', function (Blueprint $table) {
            $table->id();
            $table->string('kode_rule', 20)->unique();      // RA-01, RB-01, RC-01, dst
            $table->string('kategori', 100);                // Korban, Pelaku, Internal (input manual)
            $table->json('premise');                        // ["G010", "P001", "G001"] - kondisi IF
            $table->string('conclusion', 10);               // D001 - hasil THEN (kode diagnosis)
            $table->timestamps();

            // Index untuk performa
            $table->index('kode_rule');
            $table->index('conclusion');
            
            // Foreign key ke variabel_diagnosis
            $table->foreign('conclusion')
                  ->references('kode')
                  ->on('variabel_diagnosis')
                  ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rules_expert_system');
    }
};