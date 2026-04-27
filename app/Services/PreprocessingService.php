<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

class PreprocessingService
{
    public function runPreprocessing($laporanId)
    {
        try {
            $pythonPath = $this->getPythonPath();
            $scriptPath = $this->getScriptPath();
            
            // ✅ ALWAYS include --save-to-db
            $command = sprintf(
                '"%s" "%s" --laporan_id=%d --save-to-db 2>&1',
                $pythonPath,
                $scriptPath,
                $laporanId
            );

            Log::info('PreprocessingService: Executing', [
                'laporan_id' => $laporanId,
                'command' => $command,
            ]);

            exec($command, $output, $returnCode);
            $outputString = implode("\n", $output);

            $result = $this->extractJsonFromOutput($outputString);

            if (!$result || $result['status'] !== 'success') {
                throw new \Exception($result['error'] ?? 'Preprocessing failed');
            }

            if (!isset($result['hasil_preprocessing_id'])) {
                throw new \Exception('Python did not save to database');
            }

            return $result;

        } catch (\Exception $e) {
            Log::error('PreprocessingService: Failed', [
                'laporan_id' => $laporanId,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    private function extractJsonFromOutput($output)
    {
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
        
        if (DIRECTORY_SEPARATOR === '\\') {
            $path = $basePath . '\\venv\\Scripts\\python.exe';
            if (file_exists($path)) return $path;
        } else {
            $path = $basePath . '/venv/bin/python';
            if (file_exists($path)) return $path;
        }
        
        return 'python';
    }

    private function getScriptPath()
    {
        return base_path('python/preprocessing.py');
    }
}