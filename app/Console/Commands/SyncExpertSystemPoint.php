<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Services\ExpertSystemPointService;

class SyncExpertSystemPoint extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'expert-system:sync {--santri_id=}';

    /**
     * The console command description.
     */
    protected $description = 'Sync expert system point untuk semua santri atau santri tertentu';

    protected $expertSystemService;

    public function __construct(ExpertSystemPointService $expertSystemService)
    {
        parent::__construct();
        $this->expertSystemService = $expertSystemService;
    }

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $santriId = $this->option('santri_id');

        if ($santriId) {
            // Sync untuk 1 santri saja
            $santri = User::where('role', 'santri')->find($santriId);
            
            if (!$santri) {
                $this->error("Santri ID {$santriId} tidak ditemukan!");
                return 1;
            }

            $this->info("Syncing santri ID: {$santriId}...");
            $this->syncSantri($santri);
            
        } else {
            // Sync untuk semua santri
            $santriList = User::where('role', 'santri')
                ->where('status', 'active')
                ->get();

            $this->info("Found {$santriList->count()} active santri");
            $this->info("Starting sync...\n");

            $progressBar = $this->output->createProgressBar($santriList->count());
            $progressBar->start();

            foreach ($santriList as $santri) {
                $this->syncSantri($santri);
                $progressBar->advance();
            }

            $progressBar->finish();
            $this->newLine(2);
        }

        $this->info('✅ Sync completed!');
        return 0;
    }

    /**
     * Sync expert system point untuk 1 santri
     */
    private function syncSantri($santri)
    {
        try {
            $result = $this->expertSystemService->checkThreshold($santri->id);

            $totalKonsekuensi = count($result['konsekuensi']);
            $totalReward = count($result['reward']);

            if ($totalKonsekuensi > 0 || $totalReward > 0) {
                $nama = $santri->santriProfile?->nama_panggilan ?? 'Unknown';
                $this->newLine();
                $this->info("  📊 Santri: {$nama} (ID: {$santri->id})");
                
                if ($totalKonsekuensi > 0) {
                    $this->warn("    ⚠️  Konsekuensi triggered: {$totalKonsekuensi}");
                    foreach ($result['konsekuensi'] as $laporan) {
                        $this->warn("       - {$laporan->kode}: {$laporan->konsekuensi_atau_reward}");
                    }
                }
                
                if ($totalReward > 0) {
                    $this->info("    ⭐ Reward triggered: {$totalReward}");
                    foreach ($result['reward'] as $laporan) {
                        $this->info("       - {$laporan->kode}: {$laporan->konsekuensi_atau_reward}");
                    }
                }
            }

        } catch (\Exception $e) {
            $this->error("  ❌ Error santri ID {$santri->id}: {$e->getMessage()}");
        }
    }
}