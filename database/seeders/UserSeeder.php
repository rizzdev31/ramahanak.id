<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\GuruBkProfile;
use App\Models\TenagaPendidikProfile;
use App\Models\SantriProfile;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('🚀 Starting User Seeder...');

        // ══════════════════════════════════════════════════════════
        // 0. GET DEFAULT KELAS (PENDING)
        // ══════════════════════════════════════════════════════════
        
        // Cari kelas dengan kode PENDING atau kode terendah
        $defaultKelas = DB::table('kelas')
            ->where('kode_kelas', 'PENDING')
            ->orWhere('kode_kelas', 'LIKE', '%')
            ->orderBy('id', 'asc')
            ->first();
        
        if (!$defaultKelas) {
            // Jika belum ada kelas, buat kelas default PENDING
            $this->command->warn('⚠️  No kelas found, creating default PENDING kelas...');
            
            $kelasId = DB::table('kelas')->insertGetId([
                'kode_kelas' => 'PENDING',
                'nama_kelas' => 'Pending Assignment',
                'tingkat' => 0,
                'tahun_ajaran' => date('Y') . '/' . (date('Y') + 1),
                'kapasitas' => 999,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            
            $this->command->info("✅ Default kelas created: PENDING (id={$kelasId})");
        } else {
            $kelasId = $defaultKelas->id;
            $this->command->info("✅ Using kelas: {$defaultKelas->kode_kelas} (id={$kelasId})");
        }

        // ══════════════════════════════════════════════════════════
        // 1. GURU BK (Auto Active - Full Access)
        // ══════════════════════════════════════════════════════════
        $this->command->info('👨‍🏫 Creating Guru BK...');
        
        $guruBk = User::create([
            'username' => 'gurubk',
            'email' => 'gurubk@ramahaanak.id',
            'password' => Hash::make('password'),
            'role' => 'guru_bk',
            'status' => 'active',
        ]);

        GuruBkProfile::create([
            'user_id' => $guruBk->id,
            'nip' => '198501012010011001',
            'nama_lengkap' => 'Dr. Ahmad Dahlan, M.Pd',
            'nama_panggilan' => 'Pak Ahmad',
            'tempat_lahir' => 'Yogyakarta',
            'tanggal_lahir' => '1985-01-01',
            'jenis_kelamin' => 'Laki-laki',
            'jabatan' => 'Kepala Bimbingan Konseling',
            'no_whatsapp' => '081234567890',
        ]);

        $this->command->info('✅ Guru BK created: gurubk@ramahaanak.id (password: password)');

        // ══════════════════════════════════════════════════════════
        // 2. TENAGA PENDIDIK (Active - Can Report)
        // ══════════════════════════════════════════════════════════
        $this->command->info('👩‍🏫 Creating Tenaga Pendidik...');

        $tenagaPendidik1 = User::create([
            'username' => 'tenagapendidik',
            'email' => 'tenagapendidik@ramahaanak.id',
            'password' => Hash::make('password'),
            'role' => 'tenaga_pendidik',
            'status' => 'active',
        ]);

        TenagaPendidikProfile::create([
            'user_id' => $tenagaPendidik1->id,
            'nip' => '199201052015012002',
            'nama_lengkap' => 'Siti Nurhaliza, S.Pd',
            'nama_panggilan' => 'Bu Siti',
            'tempat_lahir' => 'Surabaya',
            'tanggal_lahir' => '1992-01-05',
            'jenis_kelamin' => 'Perempuan',
            'jabatan' => 'Guru Matematika',
            'no_whatsapp' => '081234567891',
        ]);

        $this->command->info('✅ Tenaga Pendidik created: tenagapendidik@ramahaanak.id');

        // ══════════════════════════════════════════════════════════
        // 3. SANTRI - MULTIPLE FOR TESTING
        // ══════════════════════════════════════════════════════════
        $this->command->info('👨‍🎓 Creating Santri (Multiple for NER testing)...');

        $santriData = [
            // Santri untuk testing NER
            [
                'username' => 'faris',
                'email' => 'faris@student.ramahaanak.id',
                'nisn' => '0012345678',
                'nama_lengkap' => 'Muhammad Faris Al-Hakim',
                'nama_panggilan' => 'faris',
                'nama_wali' => 'Abdullah Al-Hakim',
                'tempat_lahir' => 'Jakarta',
                'tanggal_lahir' => '2010-03-15',
                'jenis_kelamin' => 'Laki-laki',
                'alamat' => 'Jl. Sudirman No. 123, Jakarta Pusat',
            ],
            [
                'username' => 'ilyas',
                'email' => 'ilyas@student.ramahaanak.id',
                'nisn' => '15251677',
                'nama_lengkap' => 'Muhammad Ilyas',
                'nama_panggilan' => 'ilyas',
                'nama_wali' => 'Ahmad Yusuf',
                'tempat_lahir' => 'Bandung',
                'tanggal_lahir' => '2010-05-20',
                'jenis_kelamin' => 'Laki-laki',
                'alamat' => 'Jl. Asia Afrika No. 456, Bandung',
            ],
            [
                'username' => 'ulil',
                'email' => 'ulil@student.ramahaanak.id',
                'nisn' => '0098765432',
                'nama_lengkap' => 'Ulil Amri Nurdin',
                'nama_panggilan' => 'ulil',
                'nama_wali' => 'Nurdin Hasan',
                'tempat_lahir' => 'Surabaya',
                'tanggal_lahir' => '2010-07-10',
                'jenis_kelamin' => 'Laki-laki',
                'alamat' => 'Jl. Tunjungan No. 789, Surabaya',
            ],
            [
                'username' => 'ahmad',
                'email' => 'ahmad@student.ramahaanak.id',
                'nisn' => '0011223344',
                'nama_lengkap' => 'Ahmad Zaki Mubarak',
                'nama_panggilan' => 'ahmad',
                'nama_wali' => 'Mubarak Ibrahim',
                'tempat_lahir' => 'Yogyakarta',
                'tanggal_lahir' => '2010-09-25',
                'jenis_kelamin' => 'Laki-laki',
                'alamat' => 'Jl. Malioboro No. 321, Yogyakarta',
            ],
            [
                'username' => 'rizki',
                'email' => 'rizki@student.ramahaanak.id',
                'nisn' => '0055667788',
                'nama_lengkap' => 'Rizki Ramadhan Putra',
                'nama_panggilan' => 'rizki',
                'nama_wali' => 'Ramadhan Saputra',
                'tempat_lahir' => 'Semarang',
                'tanggal_lahir' => '2010-11-12',
                'jenis_kelamin' => 'Laki-laki',
                'alamat' => 'Jl. Pemuda No. 654, Semarang',
            ],
            [
                'username' => 'fadhil',
                'email' => 'fadhil@student.ramahaanak.id',
                'nisn' => '0099887766',
                'nama_lengkap' => 'Fadhil Habibi Rahman',
                'nama_panggilan' => 'fadhil',
                'nama_wali' => 'Habibi Syarif',
                'tempat_lahir' => 'Malang',
                'tanggal_lahir' => '2010-12-30',
                'jenis_kelamin' => 'Laki-laki',
                'alamat' => 'Jl. Ijen No. 987, Malang',
            ],
            [
                'username' => 'nabil',
                'email' => 'nabil@student.ramahaanak.id',
                'nisn' => '0022334455',
                'nama_lengkap' => 'Nabil Akbar Fauzi',
                'nama_panggilan' => 'nabil',
                'nama_wali' => 'Akbar Firdaus',
                'tempat_lahir' => 'Solo',
                'tanggal_lahir' => '2011-02-14',
                'jenis_kelamin' => 'Laki-laki',
                'alamat' => 'Jl. Slamet Riyadi No. 234, Solo',
            ],
            [
                'username' => 'hafiz',
                'email' => 'hafiz@student.ramahaanak.id',
                'nisn' => '0033445566',
                'nama_lengkap' => 'Hafiz Mustofa Kamal',
                'nama_panggilan' => 'hafiz',
                'nama_wali' => 'Mustofa Ali',
                'tempat_lahir' => 'Depok',
                'tanggal_lahir' => '2011-04-18',
                'jenis_kelamin' => 'Laki-laki',
                'alamat' => 'Jl. Margonda No. 567, Depok',
            ],
            // Santri Perempuan
            [
                'username' => 'aisyah',
                'email' => 'aisyah@student.ramahaanak.id',
                'nisn' => '0044556677',
                'nama_lengkap' => 'Aisyah Nur Azizah',
                'nama_panggilan' => 'aisyah',
                'nama_wali' => 'Nur Hadi Wijaya',
                'tempat_lahir' => 'Bekasi',
                'tanggal_lahir' => '2010-06-22',
                'jenis_kelamin' => 'Perempuan',
                'alamat' => 'Jl. Ahmad Yani No. 890, Bekasi',
            ],
            [
                'username' => 'fatimah',
                'email' => 'fatimah@student.ramahaanak.id',
                'nisn' => '0066778899',
                'nama_lengkap' => 'Fatimah Az-Zahra',
                'nama_panggilan' => 'fatimah',
                'nama_wali' => 'Zainal Arifin',
                'tempat_lahir' => 'Tangerang',
                'tanggal_lahir' => '2010-08-05',
                'jenis_kelamin' => 'Perempuan',
                'alamat' => 'Jl. Diponegoro No. 345, Tangerang',
            ],
        ];

        foreach ($santriData as $index => $data) {
            $user = User::create([
                'username' => $data['username'],
                'email' => $data['email'],
                'password' => Hash::make('password'),
                'role' => 'santri',
                'status' => 'active',
            ]);

            SantriProfile::create([
                'user_id' => $user->id,
                'nisn' => $data['nisn'],
                'nama_lengkap' => $data['nama_lengkap'],
                'nama_panggilan' => $data['nama_panggilan'],
                'nama_wali' => $data['nama_wali'],
                'kelas_id' => $kelasId,  // ✅ FIX: Tambah kelas_id!
                'tempat_lahir' => $data['tempat_lahir'],
                'tanggal_lahir' => $data['tanggal_lahir'],
                'jenis_kelamin' => $data['jenis_kelamin'],
                'alamat' => $data['alamat'],
                'no_whatsapp' => '0812' . str_pad($index + 1, 8, '0', STR_PAD_LEFT),
            ]);

            $this->command->info("✅ Santri created: {$data['nama_panggilan']} ({$data['email']})");
        }

        // ══════════════════════════════════════════════════════════
        // SUMMARY
        // ══════════════════════════════════════════════════════════
        $this->command->newLine();
        $this->command->info('═══════════════════════════════════════════════════════');
        $this->command->info('✅ USER SEEDER COMPLETED!');
        $this->command->info('═══════════════════════════════════════════════════════');
        $this->command->info('📊 Summary:');
        $this->command->info('   - Guru BK: 1');
        $this->command->info('   - Tenaga Pendidik: 1');
        $this->command->info('   - Santri: ' . count($santriData) . ' (all in kelas_id=' . $kelasId . ')');
        $this->command->newLine();
        $this->command->info('🔑 Login Credentials:');
        $this->command->info('   Guru BK:          gurubk@ramahaanak.id / password');
        $this->command->info('   Tenaga Pendidik:  tenagapendidik@ramahaanak.id / password');
        $this->command->info('   Santri (Faris):   faris@student.ramahaanak.id / password');
        $this->command->info('   Santri (Ilyas):   ilyas@student.ramahaanak.id / password');
        $this->command->info('   Santri (Ulil):    ulil@student.ramahaanak.id / password');
        $this->command->newLine();
        $this->command->info('📝 Testing NER Examples:');
        $this->command->info('   - "ilyas memukul faris sampai menangis"');
        $this->command->info('   - "faris dipukul oleh ilyas"');
        $this->command->info('   - "ahmad mengejek rizki di kelas"');
        $this->command->info('   - "ulil terlihat gelisah dan menyendiri"');
        $this->command->info('═══════════════════════════════════════════════════════');
    }
}