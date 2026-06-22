<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

/**
 * Integrasi API (PRD-04): tambah penanda sumber & idempotency untuk laporan
 * yang masuk dari aplikasi pengirim (Smart Eksekusi & Absensi), TANPA preprocessing.
 *
 * - hasil_preprocessing_id dibuat NULLABLE (laporan non-NLP tidak punya hasil preprocessing).
 * - sumber_input  : 'nlp' (default, existing) | 'smart_eksekusi' | 'absensi'
 * - external_app  : identitas aplikasi pengirim (mis. 'annur-eksekusi')
 * - external_ref_id : id unik dari pengirim → kunci idempotensi (cegah dobel)
 * - external_actor : siapa yang mengirim (nama/NIP tendik) untuk jejak audit
 */
return new class extends Migration
{
    private array $tables = [
        'laporan_pelanggaran',
        'laporan_apresiasi',
        'laporan_konselor',
    ];

    public function up(): void
    {
        foreach ($this->tables as $t) {
            // 1) hasil_preprocessing_id → NULLABLE (pakai raw SQL agar tidak butuh doctrine/dbal).
            //    FK tetap ada; MySQL/MariaDB mengizinkan MODIFY ke NULL dengan FK terpasang.
            DB::statement("ALTER TABLE `{$t}` MODIFY `hasil_preprocessing_id` BIGINT UNSIGNED NULL");

            // 2) Kolom sumber & integrasi
            Schema::table($t, function (Blueprint $table) {
                if (!Schema::hasColumn($table->getTable(), 'sumber_input')) {
                    $table->string('sumber_input', 30)->default('nlp')->after('id');
                }
                if (!Schema::hasColumn($table->getTable(), 'external_app')) {
                    $table->string('external_app', 50)->nullable()->after('sumber_input');
                }
                if (!Schema::hasColumn($table->getTable(), 'external_ref_id')) {
                    $table->string('external_ref_id', 191)->nullable()->after('external_app');
                    $table->unique('external_ref_id', "{$table->getTable()}_external_ref_unique");
                }
                if (!Schema::hasColumn($table->getTable(), 'external_actor')) {
                    $table->string('external_actor', 191)->nullable()->after('external_ref_id');
                }
            });
        }
    }

    public function down(): void
    {
        foreach ($this->tables as $t) {
            Schema::table($t, function (Blueprint $table) {
                $tbl = $table->getTable();
                if (Schema::hasColumn($tbl, 'external_ref_id')) {
                    $table->dropUnique("{$tbl}_external_ref_unique");
                }
                foreach (['external_actor', 'external_ref_id', 'external_app', 'sumber_input'] as $col) {
                    if (Schema::hasColumn($tbl, $col)) {
                        $table->dropColumn($col);
                    }
                }
            });
            // kembalikan NOT NULL (opsional; biarkan nullable agar aman)
        }
    }
};
