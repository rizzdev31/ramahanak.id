<?php

namespace App\Console\Commands;

use App\Services\ForwardChainingService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class CheckKonselorTriggers extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'konselor:check-triggers';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check semua rule expert system konselor dan generate laporan untuk santri yang match';

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
        $this->info('🔍 Starting Expert System Konselor trigger check...');
        $this->newLine();

        $startTime = microtime(true);

        try {
            // Run forward chaining
            $stats = $this->forwardChainingService->checkAllRules();

            // Display results
            $this->displayResults($stats);

            // Log execution time
            $executionTime = round(microtime(true) - $startTime, 2);
            $this->info("⏱️  Execution time: {$executionTime} seconds");
            $this->newLine();

            // Log to file
            Log::info('CheckKonselorTriggers: Completed', [
                'stats' => $stats,
                'execution_time' => $executionTime
            ]);

            // Return success if no errors
            if (empty($stats['errors'])) {
                $this->info('✅ Process completed successfully!');
                return Command::SUCCESS;
            } else {
                $this->warn('⚠️  Process completed with errors. Check logs for details.');
                return Command::FAILURE;
            }

        } catch (\Exception $e) {
            $this->error('❌ Fatal error occurred!');
            $this->error($e->getMessage());
            $this->newLine();

            Log::error('CheckKonselorTriggers: Fatal error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return Command::FAILURE;
        }
    }

    /**
     * Display results in formatted table
     */
    protected function displayResults(array $stats): void
    {
        $this->table(
            ['Metric', 'Count'],
            [
                ['Rules Checked', $stats['rules_checked']],
                ['Santri Matched', $stats['santri_matched']],
                ['Laporan Created', $stats['laporan_created']],
                ['Laporan Skipped (already exists)', $stats['laporan_skipped']],
                ['Errors', count($stats['errors'])],
            ]
        );

        // Display errors if any
        if (!empty($stats['errors'])) {
            $this->newLine();
            $this->error('Errors encountered:');
            
            foreach ($stats['errors'] as $error) {
                $ruleKode = $error['rule_kode'] ?? 'Unknown';
                $errorMsg = $error['error'] ?? 'Unknown error';
                
                $this->error("  - [{$ruleKode}] {$errorMsg}");
            }
        }

        $this->newLine();
    }
}