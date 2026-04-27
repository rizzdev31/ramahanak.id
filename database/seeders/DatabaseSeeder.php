<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            KelasSeeder::class, // ← TAMBAHKAN INI DI URUTAN PERTAMA
            UserSeeder::class,
            VariabelPelanggaranSeeder::class,
            VariabelApresiasiSeeder::class,
            VariabelKonselorSeeder::class,
            VariabelKosekuensiSeeder::class,
            VariabelRewardSeeder::class, 
            VariabelDiagnosisSeeder::class,
            RuleExpertSystemSeeder::class,
            //VariabelKamusKataSeeder::class,
            //ExpertSystemVariabelSeeder::class,
            //negationCounterpartSeeder::class, // ← TAMBAHKAN INI SETELAH VARIABEL SEEDER
            // Tambahkan seeder lain di sini jika diperlukan    
        ]);
    }
}