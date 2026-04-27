<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * UPDATE santri_profiles:
     * - Populate nama_panggilan yang kosong (otomatis dari nama_lengkap)
     * - Handle duplicate nama_panggilan (append number)
     */
    public function up(): void
    {
        // 1. Populate nama_panggilan yang kosong dengan kata pertama dari nama_lengkap
        DB::statement("
            UPDATE santri_profiles 
            SET nama_panggilan = SUBSTRING_INDEX(nama_lengkap, ' ', 1)
            WHERE nama_panggilan IS NULL OR nama_panggilan = ''
        ");

        // 2. Handle duplicate nama_panggilan (append number)
        // ✅ FIX: Gunakan subquery untuk avoid ONLY_FULL_GROUP_BY error
        $duplicates = DB::select("
            SELECT LOWER(nama_panggilan) as nama_lower, COUNT(*) as count
            FROM santri_profiles
            WHERE nama_panggilan IS NOT NULL AND nama_panggilan != ''
            GROUP BY LOWER(nama_panggilan)
            HAVING COUNT(*) > 1
        ");

        // For each duplicate, append sequential number
        foreach ($duplicates as $dup) {
            // Get all profiles with this nama_panggilan (case-insensitive)
            $profiles = DB::table('santri_profiles')
                ->whereRaw('LOWER(nama_panggilan) = ?', [$dup->nama_lower])
                ->orderBy('id')
                ->get();

            // Append number starting from 2
            $counter = 1;
            foreach ($profiles as $profile) {
                if ($counter > 1) {
                    // Update with original case + number
                    DB::table('santri_profiles')
                        ->where('id', $profile->id)
                        ->update([
                            'nama_panggilan' => $profile->nama_panggilan . $counter
                        ]);
                }
                $counter++;
            }
        }

        // 3. Log hasil untuk informasi
        $total = DB::table('santri_profiles')->count();
        $filled = DB::table('santri_profiles')
            ->whereNotNull('nama_panggilan')
            ->where('nama_panggilan', '!=', '')
            ->count();
        
        echo "\n✓ Updated nama_panggilan: {$filled}/{$total} santri\n";

        // 4. OPTIONAL: Tambah note di console jika ada duplicate yang di-handle
        if (count($duplicates) > 0) {
            echo "✓ Handled " . count($duplicates) . " duplicate nama_panggilan\n";
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Note: Tidak revert perubahan nama_panggilan karena:
        // 1. Data sudah berubah (sulit rollback ke state kosong)
        // 2. Perubahan ini adalah data cleanup, bukan struktur
        
        echo "\n⚠ Rollback skipped: nama_panggilan data sudah diubah\n";
    }
};