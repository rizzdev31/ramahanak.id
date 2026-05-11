<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schema;

class PartialResetCommand extends Command
{
    protected $signature   = 'db:partial-reset
                                {--yes : Skip confirmation prompt}
                                {--seed : Run seeder after reset}';

    protected $description = 'Reset semua data KECUALI variabel, rules expert system, dan kelas. Aman untuk testing ulang.';

    // Tabel yang DIHAPUS datanya (urutan penting: child dulu sebelum parent)
    protected $truncateTables = [
        // Bimbingan berkala (child dulu)
        'bimbingan_berkala_antrian',
        'bimbingan_berkala_jawaban',
        'bimbingan_berkala_sesi',
        'bimbingan_berkala_jadwal',
        'bimbingan_berkala_pertanyaan',
        'bimbingan_berkala_template',

        // Laporan (child)
        'bukti_pelaksanaan',
        'catatan_kolaboratif_konseling',
        'sesi_bimbingan_konselor',
        'riwayat_santri',
        'laporan_approvals',
        'laporan_expert_system_konselor',
        'laporan_expert_system_point',
        'laporan_konselor',
        'laporan_apresiasi',
        'laporan_pelanggaran',
        'hasil_preprocessing',
        'laporan_awal',

        // Kelas assignment
        'riwayat_kelas_santri',
        'penugasan_kelas',

        // Profil dan user (parent terakhir)
        'santri_profiles',
        'tenaga_pendidik_profiles',
        'guru_bk_profiles',
        'users',
    ];

    // Tabel yang DIPERTAHANKAN (tidak disentuh)
    protected $keepTables = [
        'variabel_pelanggaran',
        'variabel_apresiasi',
        'variabel_konselor',
        'variabel_konsekuensi',
        'variabel_reward',
        'variabel_diagnosis',
        'variabel_auto_update_log',
        'rules_expert_system',
        'learning_knowledge_base',
        'kelas',
        'migrations',
        'sessions',
        'cache',
        'cache_locks',
        'failed_jobs',
        'jobs',
        'job_batches',
        'password_reset_tokens',
    ];

    public function handle()
    {
        $this->info('');
        $this->info('==========================================================');
        $this->info('  PARTIAL RESET - Sistem Ramah Anak');
        $this->info('==========================================================');
        $this->info('');
        $this->info('Yang akan DIHAPUS:');
        foreach ($this->truncateTables as $t) {
            $this->line("  - {$t}");
        }
        $this->info('');
        $this->info('Yang DIPERTAHANKAN:');
        foreach ($this->keepTables as $t) {
            $this->line("  + {$t}");
        }
        $this->info('');

        if (!$this->option('yes') && !$this->confirm('Lanjutkan reset?', false)) {
            $this->warn('Dibatalkan.');
            return Command::FAILURE;
        }

        $this->info('Memulai reset...');

        try {
            DB::statement('SET FOREIGN_KEY_CHECKS=0');

            $truncated = 0;
            foreach ($this->truncateTables as $table) {
                if (Schema::hasTable($table)) {
                    $count = DB::table($table)->count();
                    DB::table($table)->truncate();
                    $this->line("  TRUNCATE {$table} ({$count} baris dihapus)");
                    $truncated++;
                } else {
                    $this->warn("  SKIP {$table} (tabel tidak ditemukan)");
                }
            }

            DB::statement('SET FOREIGN_KEY_CHECKS=1');

            $this->info('');
            $this->info("Selesai! {$truncated} tabel berhasil direset.");
            $this->info('Variabel, rules, dan kelas tetap aman.');

            if ($this->option('seed')) {
                $this->info('');
                $this->info('Menjalankan UserSeeder...');
                Artisan::call('db:seed', ['--class' => 'UserSeeder'], $this->output);
                $this->info('Seeder selesai!');
            } else {
                $this->info('');
                $this->info('Jalankan seeder dengan:');
                $this->line('  php artisan db:seed --class=UserSeeder');
                $this->info('');
                $this->info('Atau sekaligus:');
                $this->line('  php artisan db:partial-reset --yes --seed');
            }

            $this->info('');
            $this->info('==========================================================');
            return Command::SUCCESS;

        } catch (\Exception $e) {
            DB::statement('SET FOREIGN_KEY_CHECKS=1');
            $this->error('ERROR: ' . $e->getMessage());
            return Command::FAILURE;
        }
    }
}