<?php

namespace App\Console\Commands;

use App\Services\ForwardChainingService;
use App\Models\RuleExpertSystem;
use App\Models\VariabelDiagnosis;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class TriggerKonselorManual extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'konselor:trigger-manual 
                            {--rule= : Spesifik rule kode (opsional, e.g., RA-01)}
                            {--santri= : Spesifik santri ID (opsional)}
                            {--force : Force create meskipun sudah ada}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Manual trigger untuk testing Expert System Konselor';

    protected ForwardChainingService $forwardChainingService;

    /**
     * Create a new command instance.
     */
    public function __construct(ForwardChainingService $forwardChainingService)
    {
        parent::__construct();
        $this->forwardChainingService = $forwardChainingService;
    }

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('🧪 MANUAL TRIGGER - Expert System Konselor');
        $this->newLine();

        $ruleKode = $this->option('rule');
        $santriId = $this->option('santri');
        $force = $this->option('force');

        try {
            if ($ruleKode && $santriId) {
                // Test spesifik rule + santri
                $this->testSpecificRuleSantri($ruleKode, $santriId, $force);
            } elseif ($ruleKode) {
                // Test spesifik rule untuk semua santri
                $this->testSpecificRule($ruleKode, $force);
            } else {
                // Test semua rule (normal flow)
                $this->testAllRules();
            }

            $this->newLine();
            $this->info('✅ Testing selesai!');
            return Command::SUCCESS;

        } catch (\Exception $e) {
            $this->error('❌ Error: ' . $e->getMessage());
            $this->newLine();
            Log::error('TriggerKonselorManual: Error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return Command::FAILURE;
        }
    }

    /**
     * Test semua rule
     */
    protected function testAllRules(): void
    {
        $this->info('Mode: Test SEMUA rule');
        $this->newLine();

        $stats = $this->forwardChainingService->checkAllRules();

        $this->displayResults($stats);
    }

    /**
     * Test spesifik rule untuk semua santri yang match
     */
    protected function testSpecificRule(string $ruleKode, bool $force): void
    {
        $this->info("Mode: Test rule {$ruleKode}");
        if ($force) {
            $this->warn('Force mode: ON (akan create meskipun sudah ada)');
        }
        $this->newLine();

        // ✅ FIX: Get rule dengan kode_rule
        $rule = RuleExpertSystem::where('kode_rule', $ruleKode)->first();

        if (!$rule) {
            $this->error("Rule {$ruleKode} tidak ditemukan!");
            return;
        }

        $this->info("Rule: {$rule->kode_rule} - {$rule->kategori}");
        $this->info("Premise: " . implode(' AND ', $rule->premise)); // ✅ FIX: array
        $this->info("Conclusion: {$rule->conclusion}");
        $this->newLine();

        // Process rule
        $reflection = new \ReflectionClass($this->forwardChainingService);
        $method = $reflection->getMethod('processRule');
        $method->setAccessible(true);

        $result = $method->invoke($this->forwardChainingService, $rule);

        $this->table(
            ['Metric', 'Count'],
            [
                ['Santri Matched', $result['matched_count']],
                ['Laporan Created', $result['created_count']],
                ['Laporan Skipped', $result['skipped_count']],
            ]
        );

        // Show created laporan
        if ($result['created_count'] > 0) {
            $this->newLine();
            $this->info('Laporan yang dibuat:');
            $laporans = \App\Models\LaporanExpertSystemKonselor::where('rule_kode', $ruleKode)
                ->latest()
                ->take($result['created_count'])
                ->get();

            foreach ($laporans as $laporan) {
                $this->line("  - ID: {$laporan->id} | Santri: {$laporan->santri->name} | Status: {$laporan->status}");
            }
        }
    }

    /**
     * Test spesifik rule + santri
     */
    protected function testSpecificRuleSantri(string $ruleKode, int $santriId, bool $force): void
    {
        $this->info("Mode: Test rule {$ruleKode} untuk santri ID {$santriId}");
        if ($force) {
            $this->warn('Force mode: ON');
        }
        $this->newLine();

        // ✅ FIX: Get rule dengan kode_rule
        $rule = RuleExpertSystem::where('kode_rule', $ruleKode)->first();

        if (!$rule) {
            $this->error("Rule {$ruleKode} tidak ditemukan!");
            return;
        }

        // Get santri
        $santri = \App\Models\User::find($santriId);
        if (!$santri) {
            $this->error("Santri ID {$santriId} tidak ditemukan!");
            return;
        }

        $this->info("Rule: {$rule->kode_rule}");
        $this->info("Santri: {$santri->name}");
        $this->newLine();

        // ✅ FIX: premise sudah array
        $requiredCodes = $rule->premise;

        $this->info("Kode yang dibutuhkan: " . implode(', ', $requiredCodes));
        $this->newLine();

        // Check riwayat santri
        $riwayat = \DB::table('riwayat_santri')
            ->where('santri_id', $santriId)
            ->whereIn('kode', $requiredCodes)
            ->select('kode', 'jenis_laporan', 'ringkasan', 'tanggal_kejadian')
            ->get();

        $this->info("Riwayat santri yang match:");
        if ($riwayat->count() > 0) {
            foreach ($riwayat as $r) {
                $this->line("  ✓ {$r->kode} - {$r->ringkasan} ({$r->tanggal_kejadian})");
            }
        } else {
            $this->warn("  Tidak ada riwayat yang match");
        }
        $this->newLine();

        // Check if match
        $distinctCodes = $riwayat->pluck('kode')->unique()->count();
        $totalRequired = count($requiredCodes);

        if ($distinctCodes === $totalRequired) {
            $this->info("✅ MATCH! Santri memiliki semua kode yang dibutuhkan ({$distinctCodes}/{$totalRequired})");
            $this->newLine();

            // Check existing laporan
            $existing = \App\Models\LaporanExpertSystemKonselor::where([
                'santri_id' => $santriId,
                'rule_kode' => $ruleKode
            ])->first();

            if ($existing && !$force) {
                $this->warn("⚠️  Laporan sudah ada! (ID: {$existing->id}, Status: {$existing->status})");
                $this->info("Gunakan --force untuk create ulang");
            } else {
                if ($existing && $force) {
                    $this->warn("Force mode: Hapus laporan existing...");
                    $existing->delete();
                }

                // Create laporan
                $reflection = new \ReflectionClass($this->forwardChainingService);
                $createMethod = $reflection->getMethod('createLaporan');
                $createMethod->setAccessible(true);
                $laporan = $createMethod->invoke($this->forwardChainingService, $santriId, $rule, $requiredCodes);

                $this->info("✅ Laporan berhasil dibuat!");
                $this->newLine();
                $this->table(
                    ['Field', 'Value'],
                    [
                        ['ID', $laporan->id],
                        ['Santri', $santri->name],
                        ['Rule', $laporan->rule_kode],
                        ['Diagnosis', $laporan->diagnosis_nama],
                        ['Status', $laporan->status],
                        ['Tanggal Trigger', $laporan->tanggal_trigger->format('Y-m-d H:i:s')],
                    ]
                );
            }
        } else {
            $this->error("❌ TIDAK MATCH! Santri hanya punya {$distinctCodes} dari {$totalRequired} kode yang dibutuhkan");
            
            $missing = array_diff($requiredCodes, $riwayat->pluck('kode')->toArray());
            if (!empty($missing)) {
                $this->warn("Kode yang kurang: " . implode(', ', $missing));
            }
        }
    }

    /**
     * Display results
     */
    protected function displayResults(array $stats): void
    {
        $this->table(
            ['Metric', 'Count'],
            [
                ['Rules Checked', $stats['rules_checked']],
                ['Santri Matched', $stats['santri_matched']],
                ['Laporan Created', $stats['laporan_created']],
                ['Laporan Skipped', $stats['laporan_skipped']],
                ['Errors', count($stats['errors'])],
            ]
        );

        if (!empty($stats['errors'])) {
            $this->newLine();
            $this->error('Errors:');
            foreach ($stats['errors'] as $error) {
                $ruleKode = $error['rule_kode'] ?? 'Unknown';
                $errorMsg = $error['error'] ?? 'Unknown error';
                $this->error("  - [{$ruleKode}] {$errorMsg}");
            }
        }
    }
}