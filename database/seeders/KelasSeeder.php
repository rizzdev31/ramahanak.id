<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Kelas;

class KelasSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $tahunAjaran = '2024/2025';
        
        $kelasData = [
            // Kelas PENDING untuk santri baru
            [
                'kode_kelas' => 'PENDING',
                'nama' => 'Santri Baru',
                'tingkat' => 0,
                'kapasitas' => null,
            ],

            // Tingkat 7
            [
                'kode_kelas' => '7A',
                'nama' => 'Al Farabi',
                'tingkat' => 7,
                'kapasitas' => 30,
            ],
            [
                'kode_kelas' => '7B',
                'nama' => 'Al Kindi',
                'tingkat' => 7,
                'kapasitas' => 30,
            ],
            [
                'kode_kelas' => '7C',
                'nama' => 'Ibnu Sina',
                'tingkat' => 7,
                'kapasitas' => 30,
            ],

            // Tingkat 8
            [
                'kode_kelas' => '8A',
                'nama' => 'Al Ghazali',
                'tingkat' => 8,
                'kapasitas' => 28,
            ],
            [
                'kode_kelas' => '8B',
                'nama' => 'Ar Razi',
                'tingkat' => 8,
                'kapasitas' => 28,
            ],
            [
                'kode_kelas' => '8C',
                'nama' => 'Al Biruni',
                'tingkat' => 8,
                'kapasitas' => 28,
            ],

            // Tingkat 9
            [
                'kode_kelas' => '9A',
                'nama' => 'Ibnu Khaldun',
                'tingkat' => 9,
                'kapasitas' => 25,
            ],
            [
                'kode_kelas' => '9B',
                'nama' => 'Al Khawarizmi',
                'tingkat' => 9,
                'kapasitas' => 25,
            ],
            [
                'kode_kelas' => '9C',
                'nama' => 'Jabir Ibn Hayyan',
                'tingkat' => 9,
                'kapasitas' => 25,
            ],
        ];

        foreach ($kelasData as $kelas) {
            Kelas::create([
                'kode_kelas' => $kelas['kode_kelas'],
                'nama' => $kelas['nama'],
                'tingkat' => $kelas['tingkat'],
                'tahun_ajaran' => $tahunAjaran,
                'kapasitas' => $kelas['kapasitas'],
                'status' => 'active',
            ]);
        }

        $this->command->info('✅ Data kelas berhasil di-seed!');
    }
}