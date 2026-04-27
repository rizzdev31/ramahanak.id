<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

/**
 * Migration: Perbaiki constraint logika penugasan_kelas
 *
 * SEBELUM (SALAH):
 *   unique_penugasan = (user_id, kelas_id, jenis_penugasan)
 *   → Logika di controller blokir user untuk ditugaskan di kelas berbeda
 *   → User tidak bisa jadi WK di kelas A sekaligus WA di kelas B
 *
 * SESUDAH (BENAR):
 *   unique_user_kelas_jenis = (user_id, kelas_id, jenis_penugasan) [nama baru, sama strukturnya]
 *   → Constraint DB tetap mencegah duplikat EXACT SAMA
 *   → Logika "1 user hanya 1 WK" sekarang di-handle di APPLICATION LAYER (controller)
 *   → User BISA jadi WA di banyak kelas (ditangani controller, bukan DB constraint)
 *
 * CATATAN:
 *   Constraint DB (user_id, kelas_id, jenis_penugasan) sudah BENAR secara struktur.
 *   Yang salah adalah LOGIKA di Controller & JSX yang terlalu ketat.
 *   Migration ini hanya rename constraint agar konsisten + tambah index performa.
 */
return new class extends Migration
{
    public function up(): void
    {
        // ── Cek apakah tabel penugasan_kelas sudah ada ──────────
        if (!Schema::hasTable('penugasan_kelas')) {
            // Jika belum ada, buat dari scratch (fresh install)
            Schema::create('penugasan_kelas', function (Blueprint $table) {
                $table->id();
                $table->foreignId('kelas_id')
                      ->constrained('kelas')
                      ->onDelete('cascade');
                $table->foreignId('user_id')
                      ->constrained('users')
                      ->onDelete('cascade');
                $table->enum('jenis_penugasan', ['wali_kelas', 'wali_asrama']);
                $table->boolean('is_active')->default(true);
                $table->timestamps();

                // ✅ Constraint: cegah duplikat exact (user+kelas+jenis sama)
                // Logika "1 user hanya 1 WK" ditangani di application layer
                $table->unique(
                    ['user_id', 'kelas_id', 'jenis_penugasan'],
                    'unique_user_kelas_jenis'
                );

                // Index performa
                $table->index('is_active');
                $table->index(['kelas_id', 'jenis_penugasan', 'is_active'], 'idx_kelas_jenis_aktif');
                $table->index(['user_id', 'is_active'], 'idx_user_aktif');
            });

            return; // Selesai jika tabel baru dibuat
        }

        // ── Tabel sudah ada — lakukan ALTER ─────────────────────

        Schema::table('penugasan_kelas', function (Blueprint $table) {

            // 1. Hapus constraint lama jika ada (cek nama yang mungkin berbeda)
            $constraintLama = [
                'unique_penugasan',        // nama di migration lama Anda
                'unique_user_kelas_jenis', // jika sudah pernah rename
                'penugasan_kelas_user_id_kelas_id_jenis_penugasan_unique', // nama default Laravel
            ];

            foreach ($constraintLama as $constraintName) {
                try {
                    $table->dropUnique($constraintName);
                    break; // Berhasil drop, stop loop
                } catch (\Exception $e) {
                    // Constraint tidak ditemukan dengan nama ini, coba nama berikutnya
                    continue;
                }
            }

            // 2. Tambah constraint baru dengan nama yang jelas
            $table->unique(
                ['user_id', 'kelas_id', 'jenis_penugasan'],
                'unique_user_kelas_jenis'
            );

            // 3. Tambah index untuk performa query yang sering dipakai
            // (cek dulu apakah sudah ada untuk menghindari error duplikat index)
        });

        // Tambah index secara terpisah dengan pengecekan
        $indexes = DB::select("
            SELECT INDEX_NAME
            FROM INFORMATION_SCHEMA.STATISTICS
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'penugasan_kelas'
        ");
        $existingIndexNames = array_column($indexes, 'INDEX_NAME');

        Schema::table('penugasan_kelas', function (Blueprint $table) use ($existingIndexNames) {
            if (!in_array('idx_kelas_jenis_aktif', $existingIndexNames)) {
                $table->index(
                    ['kelas_id', 'jenis_penugasan', 'is_active'],
                    'idx_kelas_jenis_aktif'
                );
            }
            if (!in_array('idx_user_aktif', $existingIndexNames)) {
                $table->index(
                    ['user_id', 'is_active'],
                    'idx_user_aktif'
                );
            }
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('penugasan_kelas')) return;

        Schema::table('penugasan_kelas', function (Blueprint $table) {
            // Kembalikan ke nama constraint lama
            try { $table->dropUnique('unique_user_kelas_jenis'); } catch (\Exception $e) {}
            try { $table->dropIndex('idx_kelas_jenis_aktif'); }   catch (\Exception $e) {}
            try { $table->dropIndex('idx_user_aktif'); }           catch (\Exception $e) {}

            $table->unique(
                ['user_id', 'kelas_id', 'jenis_penugasan'],
                'unique_penugasan'
            );
        });
    }
};