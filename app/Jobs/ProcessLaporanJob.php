<?php

namespace App\Jobs;

use App\Models\LaporanAwal;
use App\Models\HasilPreprocessing;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessLaporanJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 3;
    public $timeout = 120;

    protected $laporanId;

    public function __construct($laporanIdOrObject)
    {
        // Handle both integer ID and object
        if (is_object($laporanIdOrObject)) {
            $this->laporanId = $laporanIdOrObject->id;
        } else {
            $this->laporanId = $laporanIdOrObject;
        }
    }

    public function handle()
    {
        $attempt = $this->attempts();
        Log::info('Starting preprocessing job', [
            'laporan_id' => $this->laporanId,
            'attempt' => $attempt
        ]);

        try {
            $laporan = LaporanAwal::find($this->laporanId);
            if (!$laporan) {
                throw new \Exception("Laporan {$this->laporanId} not found");
            }

            // ✅ CHECK: Jika sudah ada hasil, skip processing
            $existingHasil = HasilPreprocessing::where('laporan_awal_id', $this->laporanId)
                ->whereIn('status', ['pending_validasi', 'approved'])
                ->first();
            
            if ($existingHasil) {
                Log::info('Preprocessing result already exists', [
                    'laporan_id' => $this->laporanId,
                    'hasil_id' => $existingHasil->id,
                    'status' => $existingHasil->status
                ]);
                
                // Update laporan status jika belum 'processed'
                if ($laporan->status !== 'processed') {
                    $laporan->status = 'processed';
                    $laporan->save();
                }
                
                return; // ✅ Skip processing, hasil sudah ada
            }

            $pythonPath = $this->getPythonPath();
            $scriptPath = $this->getScriptPath();
            
            $command = sprintf(
                '"%s" "%s" --laporan_id=%d --save-to-db 2>&1',
                $pythonPath,
                $scriptPath,
                $this->laporanId
            );

            Log::info('Executing preprocessing', [
                'laporan_id' => $this->laporanId,
                'command' => $command,
                'python_path' => $pythonPath,
                'script_path' => $scriptPath,
            ]);

            $output = [];
            $returnCode = 0;
            exec($command, $output, $returnCode);
            $outputString = implode("\n", $output);

            Log::info('Python output received', [
                'output_length' => strlen($outputString),
                'output_preview' => substr($outputString, 0, 200),
                'return_code' => $returnCode,
            ]);

            // ✅ BETTER: Extract JSON from output
            $result = $this->extractJsonFromOutput($outputString);

            if (!$result) {
                // ✅ FIX: Check if Python already saved to DB
                $hasil = HasilPreprocessing::where('laporan_awal_id', $this->laporanId)
                    ->latest('id')
                    ->first();
                
                if ($hasil) {
                    Log::warning('No JSON in output, but hasil exists in DB', [
                        'laporan_id' => $this->laporanId,
                        'hasil_id' => $hasil->id,
                        'status' => $hasil->status
                    ]);
                    
                    // Update laporan status
                    $laporan->status = 'processed';
                    $laporan->save();
                    
                    return; // ✅ Success despite no JSON
                }
                
                throw new \Exception('No valid JSON found in Python output');
            }

            if ($result['status'] !== 'success') {
                throw new \Exception($result['error'] ?? 'Preprocessing failed');
            }

            $hasilId = $result['hasil_preprocessing_id'] ?? null;
            if (!$hasilId) {
                throw new \Exception('Python did not return hasil_preprocessing_id');
            }

            $hasil = HasilPreprocessing::find($hasilId);
            if (!$hasil) {
                throw new \Exception("HasilPreprocessing {$hasilId} not found in database");
            }

            // ✅ Update laporan status to 'processed'
            $laporan->status = 'processed';
            $laporan->save();

            Log::info('Preprocessing completed successfully', [
                'laporan_id' => $this->laporanId,
                'hasil_id' => $hasilId,
                'kode_matched' => $hasil->kode_matched,
                'pelaku_nama' => $hasil->pelaku_nama,
                'korban_nama' => $hasil->korban_nama,
            ]);

        } catch (\Exception $e) {
            Log::error('Preprocessing job failed', [
                'laporan_id' => $this->laporanId,
                'error' => $e->getMessage(),
                'attempt' => $attempt,
            ]);

            // ✅ FIX: Only create failed record if NO hasil exists yet
            $existingHasil = HasilPreprocessing::where('laporan_awal_id', $this->laporanId)->first();
            
            if (!$existingHasil) {
                HasilPreprocessing::create([
                    'laporan_awal_id' => $this->laporanId,
                    'kode_matched' => [],
                    'status' => 'failed',
                    'error_message' => $e->getMessage(),
                    'processed_at' => now(),
                ]);
                
                Log::info('Created failed hasil_preprocessing record', [
                    'laporan_id' => $this->laporanId,
                ]);
            } else {
                // ✅ Update existing record to failed
                $existingHasil->update([
                    'status' => 'failed',
                    'error_message' => $e->getMessage(),
                ]);
                
                Log::info('Updated existing hasil to failed', [
                    'laporan_id' => $this->laporanId,
                    'hasil_id' => $existingHasil->id,
                ]);
            }

            if ($attempt >= $this->tries) {
                Log::error('Preprocessing job failed permanently', [
                    'laporan_id' => $this->laporanId,
                    'error' => $e->getMessage(),
                ]);
                
                // ✅ Update laporan status even if failed
                $laporan = LaporanAwal::find($this->laporanId);
                if ($laporan) {
                    $laporan->status = 'processed';
                    $laporan->save();
                }
            }

            throw $e;
        }
    }

    private function extractJsonFromOutput($output)
    {
        // Strategy 1: Find last line starting with '{'
        $lines = explode("\n", trim($output));
        
        for ($i = count($lines) - 1; $i >= 0; $i--) {
            $line = trim($lines[$i]);
            if ($line && $line[0] === '{') {
                $result = json_decode($line, true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    return $result;
                }
            }
        }

        // Strategy 2: Find first '{' and last '}'
        $start = strpos($output, '{');
        $end = strrpos($output, '}');
        
        if ($start !== false && $end !== false) {
            $jsonString = substr($output, $start, $end - $start + 1);
            $result = json_decode($jsonString, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                return $result;
            }
        }

        return null;
    }

    private function getPythonPath()
    {
        $basePath = base_path('python');
        
        // Windows
        if (DIRECTORY_SEPARATOR === '\\') {
            $path = $basePath . '\\venv\\Scripts\\python.exe';
            if (file_exists($path)) return $path;
        } 
        // Linux/Mac
        else {
            $path = $basePath . '/venv/bin/python';
            if (file_exists($path)) return $path;
        }
        
        // Fallback to system python
        return 'python';
    }

    private function getScriptPath()
    {
        return base_path('python/preprocessing.py');
    }

    public function failed(\Exception $exception)
    {
        Log::error('Failed to dispatch preprocessing job', [
            'laporan_id' => $this->laporanId,
            'error' => $exception->getMessage(),
            'trace' => $exception->getTraceAsString()
        ]);
    }
}