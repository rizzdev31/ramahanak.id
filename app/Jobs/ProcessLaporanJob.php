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
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

class ProcessLaporanJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries   = 3;
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
            'attempt'    => $attempt,
            'mode'       => $this->isApiMode() ? 'flask_api' : 'exec',
        ]);

        try {
            $laporan = LaporanAwal::find($this->laporanId);
            if (!$laporan) {
                throw new \Exception("Laporan {$this->laporanId} not found");
            }

            //  Skip jika hasil sudah ada 
            $existingHasil = HasilPreprocessing::where('laporan_awal_id', $this->laporanId)
                ->whereIn('status', ['pending_validasi', 'approved'])
                ->first();

            if ($existingHasil) {
                Log::info('Preprocessing result already exists, skipping', [
                    'laporan_id' => $this->laporanId,
                    'hasil_id'   => $existingHasil->id,
                    'status'     => $existingHasil->status,
                ]);
                if ($laporan->status !== 'processed') {
                    $laporan->status = 'processed';
                    $laporan->save();
                }
                return;
            }

            //  Pilih mode: Flask API atau exec() 
            if ($this->isApiMode()) {
                $result = $this->runViaFlaskApi($laporan);
            } else {
                $result = $this->runViaExec();
            }

            //  Proses hasil 
            if (!$result) {
                // Fallback: cek apakah Python sudah simpan ke DB langsung
                $hasil = HasilPreprocessing::where('laporan_awal_id', $this->laporanId)
                    ->latest('id')
                    ->first();

                if ($hasil) {
                    Log::warning('No result returned, but hasil exists in DB', [
                        'laporan_id' => $this->laporanId,
                        'hasil_id'   => $hasil->id,
                        'status'     => $hasil->status,
                    ]);
                    $laporan->status = 'processed';
                    $laporan->save();
                    return;
                }

                throw new \Exception('Preprocessing tidak mengembalikan hasil yang valid');
            }

            if (($result['status'] ?? '') !== 'success') {
                throw new \Exception($result['error'] ?? $result['message'] ?? 'Preprocessing failed');
            }

            // Flask API no-db mode: simpan hasil ke DB dari Laravel
            $hasilId = $result['hasil_preprocessing_id'] ?? null;

            if (!$hasilId) {
                // Flask tidak simpan ke DB  Laravel yang simpan
                $hasilId = $this->saveHasilPreprocessing($result, $laporan);
                Log::info('HasilPreprocessing saved by Laravel', [
                    'laporan_id' => $this->laporanId,
                    'hasil_id'   => $hasilId,
                ]);
            }

            $hasil = HasilPreprocessing::find($hasilId);
            if (!$hasil) {
                throw new \Exception("HasilPreprocessing {$hasilId} tidak ditemukan di database");
            }

            $laporan->status = 'processed';
            $laporan->save();

            Log::info('Preprocessing completed successfully', [
                'laporan_id'   => $this->laporanId,
                'hasil_id'     => $hasilId,
                'kode_matched' => $hasil->kode_matched,
                'pelaku_nama'  => $hasil->pelaku_nama,
                'korban_nama'  => $hasil->korban_nama,
                'mode'         => $this->isApiMode() ? 'flask_api' : 'exec',
            ]);

        } catch (\Exception $e) {
            Log::error('Preprocessing job failed', [
                'laporan_id' => $this->laporanId,
                'error'      => $e->getMessage(),
                'attempt'    => $attempt,
                'mode'       => $this->isApiMode() ? 'flask_api' : 'exec',
            ]);

            // Simpan/update record failed
            $existingHasil = HasilPreprocessing::where('laporan_awal_id', $this->laporanId)->first();

            if (!$existingHasil) {
                HasilPreprocessing::create([
                    'laporan_awal_id' => $this->laporanId,
                    'kode_matched'    => [],
                    'status'          => 'failed',
                    'error_message'   => $e->getMessage(),
                    'processed_at'    => now(),
                ]);
                Log::info('Created failed hasil_preprocessing record', [
                    'laporan_id' => $this->laporanId,
                ]);
            } else {
                $existingHasil->update([
                    'status'        => 'failed',
                    'error_message' => $e->getMessage(),
                ]);
                Log::info('Updated existing hasil to failed', [
                    'laporan_id' => $this->laporanId,
                    'hasil_id'   => $existingHasil->id,
                ]);
            }

            if ($attempt >= $this->tries) {
                Log::error('Preprocessing job failed permanently', [
                    'laporan_id' => $this->laporanId,
                    'error'      => $e->getMessage(),
                ]);
                $laporan = LaporanAwal::find($this->laporanId);
                if ($laporan) {
                    $laporan->status = 'processed';
                    $laporan->save();
                }
            }

            throw $e;
        }
    }

    // 
    // MODE CHECK
    // 

    /**
     * Cek apakah harus pakai Flask API (PythonAnywhere) atau exec() lokal.
     * Otomatis berdasarkan NLP_API_URL di .env.
     * - Shared Hosting / tidak ada Python: set NLP_API_URL di .env
     * - Lokal / VPS dengan Python: biarkan NLP_API_URL kosong
     */
    private function isApiMode(): bool
    {
        return !empty(env('NLP_API_URL'));
    }

    // 
    // MODE 1: FLASK API (PythonAnywhere)  untuk Shared Hosting
    // 

    private function runViaFlaskApi(LaporanAwal $laporan): ?array
    {
        $apiUrl   = rtrim(env('NLP_API_URL'), '/');
        $apiToken = env('NLP_API_TOKEN', '');

        if (!$apiUrl) {
            throw new \Exception('NLP_API_URL tidak dikonfigurasi di .env');
        }

        // Ambil kamus words dari DB Laravel untuk dikirim ke Flask
        // Flask tidak akses DB sendiri - Laravel yang sediakan data
        $kamusWords = $this->getKamusWords();
        $santriMap  = $this->getSantriMap();

        Log::info('Calling Flask NLP API (no-db mode)', [
            'laporan_id'   => $this->laporanId,
            'api_url'      => $apiUrl . '/preprocess',
            'kamus_count'  => count($kamusWords),
            'santri_count' => count($santriMap),
        ]);

        $variabelData = $this->getVariabelData();

        $response = Http::timeout(90)
            ->withHeaders(['X-API-Token' => $apiToken])
            ->post($apiUrl . '/preprocess', [
                'laporan_id'   => $this->laporanId,
                'teks_laporan' => $laporan->text_laporan,
                'kamus_words'  => $kamusWords,
                'santri_map'   => $santriMap,
                'variabel_data'=> $variabelData,
            ]);

        if ($response->status() === 401) {
            throw new \Exception('Flask API: Unauthorized  periksa NLP_API_TOKEN di .env');
        }

        if (!$response->successful()) {
            throw new \Exception(
                'Flask API error: HTTP ' . $response->status() .
                '  ' . substr($response->body(), 0, 200)
            );
        }

        $result = $response->json();

        Log::info('Flask API response received', [
            'laporan_id'      => $this->laporanId,
            'status'          => $result['status'] ?? 'unknown',
            'kode_matched'    => $result['kode_matched'] ?? [],
            'pelaku_nama'     => $result['pelaku_nama'] ?? null,
            'korban_nama'     => $result['korban_nama'] ?? null,
            'kata_kerja_dasar'=> $result['kata_kerja_dasar'] ?? null,
        ]);

        return $result;
    }

    // 
    // MODE 2: EXEC()  untuk lokal / VPS dengan Python tersedia
    // 

    private function runViaExec(): ?array
    {
        $pythonPath = $this->getPythonPath();
        $scriptPath = $this->getScriptPath();

        $command = sprintf(
            '"%s" "%s" --laporan_id=%d --save-to-db 2>&1',
            $pythonPath,
            $scriptPath,
            $this->laporanId
        );

        Log::info('Executing preprocessing via exec()', [
            'laporan_id'  => $this->laporanId,
            'command'     => $command,
            'python_path' => $pythonPath,
            'script_path' => $scriptPath,
        ]);

        $output     = [];
        $returnCode = 0;
        exec($command, $output, $returnCode);
        $outputString = implode("\n", $output);

        Log::info('Python exec() output received', [
            'output_length'  => strlen($outputString),
            'output_preview' => substr($outputString, 0, 200),
            'return_code'    => $returnCode,
        ]);

        return $this->extractJsonFromOutput($outputString);
    }

    // 
    // HELPERS (sama persis dengan file lama yang sudah berjalan)
    // 

    /**
     * Extract JSON dari output Python.
     * Dipertahankan persis dari file original karena sudah terbukti bekerja.
     */
    private function extractJsonFromOutput($output): ?array
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
        $end   = strrpos($output, '}');

        if ($start !== false && $end !== false) {
            $jsonString = substr($output, $start, $end - $start + 1);
            $result     = json_decode($jsonString, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                return $result;
            }
        }

        return null;
    }

    /**
     * Detect Python path  Windows, Linux/VPS, fallback.
     * Dipertahankan persis dari file original.
     */
    private function getPythonPath(): string
    {
        $basePath = base_path('python');

        // Windows: cek venv dulu
        if (DIRECTORY_SEPARATOR === '\\') {
            $path = $basePath . '\\venv\\Scripts\\python.exe';
            if (file_exists($path)) return $path;
        } else {
            // Linux/Mac: cek venv dulu
            $path = $basePath . '/venv/bin/python';
            if (file_exists($path)) return $path;

            // Fallback: python3 system (VPS Ubuntu)
            $python3 = trim(shell_exec('which python3 2>/dev/null') ?? '');
            if ($python3) return $python3;
        }

        // Last resort
        return 'python';
    }

    private function getScriptPath(): string
    {
        return base_path('python/preprocessing.py');
    }

    //  Helpers untuk Flask API no-db mode 

    /**
     * Ambil semua kamus kata dari variabel basis pengetahuan.
     * Dikirim ke Flask agar NER bisa filter kata kamus dari nama orang.
     */
    private function getKamusWords(): array
    {
        try {
            $words = [];
            $tables = [
                'variabel_pelanggaran',
                'variabel_apresiasi',
                'variabel_konselor',
            ];
            foreach ($tables as $table) {
                $rows = \DB::table($table)->select('kamus_kata')->whereNotNull('kamus_kata')->get();
                foreach ($rows as $row) {
                    $kata = array_map('trim', explode(',', $row->kamus_kata));
                    $words = array_merge($words, array_filter($kata));
                }
            }
            return array_values(array_unique($words));
        } catch (\Exception $e) {
            Log::warning('getKamusWords failed', ['error' => $e->getMessage()]);
            return [];
        }
    }

    /**
     * Ambil map nama_panggilan -> id santri aktif.
     * Dikirim ke Flask untuk validasi entitas tanpa akses DB langsung.
     */
    private function getSantriMap(): array
    {
        try {
            $santris = \DB::table('users')
                ->join('santri_profiles', 'users.id', '=', 'santri_profiles.user_id')
                ->where('users.role', 'santri')
                ->where('users.status', 'active')
                ->select('santri_profiles.nama_panggilan',
                         'santri_profiles.nama_lengkap',
                         'users.id')
                ->get();

            $map = [];
            foreach ($santris as $s) {
                // Tambahkan berbagai variasi case agar NER bisa cocokkan
                if ($s->nama_panggilan) {
                    $np = trim($s->nama_panggilan);
                    $map[strtolower($np)]  = $s->id;  // lowercase
                    $map[ucfirst($np)]     = $s->id;  // Kapital awal
                    $map[$np]              = $s->id;  // Original
                }
                if ($s->nama_lengkap) {
                    $nl = trim($s->nama_lengkap);
                    $map[strtolower($nl)]  = $s->id;
                    $map[ucfirst($nl)]     = $s->id;
                    // Nama depan saja
                    $parts = explode(' ', $nl);
                    if (count($parts) > 1) {
                        $map[strtolower($parts[0])] = $s->id;
                        $map[ucfirst($parts[0])]    = $s->id;
                    }
                }
            }
            Log::info('getSantriMap', ['count' => count($map)]);
            return $map;
        } catch (\Exception $e) {
            Log::warning('getSantriMap failed', ['error' => $e->getMessage()]);
            return [];
        }
    }

    /**
     * Ambil data variabel basis pengetahuan dari DB Laravel.
     * Format sesuai yang dibutuhkan kode_matching.py:
     * [{kode, kategori, kamus_kata, negatable, counterpart_kode}, ...]
     */
    private function getVariabelData(): array
    {
        try {
            $all = [];

            // 1. Pelanggaran
            $rows = \DB::table('variabel_pelanggaran')
                ->select('kode', 'kamus_kata', 'negatable', 'counterpart_kode')
                ->whereNotNull('kamus_kata')->get();
            foreach ($rows as $r) {
                $all[] = [
                    'kode'            => $r->kode,
                    'kategori'        => 'pelanggaran',
                    'kamus_kata'      => $r->kamus_kata ?? '',
                    'negatable'       => (bool)($r->negatable ?? false),
                    'counterpart_kode'=> $r->counterpart_kode ?? null,
                ];
            }

            // 2. Apresiasi
            $rows = \DB::table('variabel_apresiasi')
                ->select('kode', 'kamus_kata', 'negatable', 'counterpart_kode')
                ->whereNotNull('kamus_kata')->get();
            foreach ($rows as $r) {
                $all[] = [
                    'kode'            => $r->kode,
                    'kategori'        => 'apresiasi',
                    'kamus_kata'      => $r->kamus_kata ?? '',
                    'negatable'       => (bool)($r->negatable ?? false),
                    'counterpart_kode'=> $r->counterpart_kode ?? null,
                ];
            }

            // 3. Konselor
            $rows = \DB::table('variabel_konselor')
                ->select('kode', 'kamus_kata')
                ->whereNotNull('kamus_kata')->get();
            foreach ($rows as $r) {
                $all[] = [
                    'kode'            => $r->kode,
                    'kategori'        => 'konselor',
                    'kamus_kata'      => $r->kamus_kata ?? '',
                    'negatable'       => false,
                    'counterpart_kode'=> null,
                ];
            }

            Log::info('getVariabelData loaded', ['count' => count($all)]);
            return $all;

        } catch (\Exception $e) {
            Log::warning('getVariabelData failed', ['error' => $e->getMessage()]);
            return [];
        }
    }

    /**
     * Simpan hasil preprocessing dari Flask ke database.
     * Dipanggil setelah Flask return JSON hasil NLP.
     */
    private function saveHasilPreprocessing(array $result, LaporanAwal $laporan): int
    {
        $hasil = HasilPreprocessing::create([
            'laporan_awal_id'   => $this->laporanId,
            'kode_matched'      => $result['kode_matched']       ?? [],
            'pelaku_nama'       => $result['pelaku_nama']        ?? null,
            'pelaku_santri_id'  => $result['pelaku_santri_id']   ?? null,
            'korban_nama'       => $result['korban_nama']        ?? null,
            'korban_santri_id'  => $result['korban_santri_id']   ?? null,
            'kata_kerja_dasar'  => $result['kata_kerja_dasar']   ?? null,
            'preprocessing_data'=> $result['preprocessing_data'] ?? [],
            'status'            => 'pending_validasi',
            'processed_at'      => now(),
        ]);

        return $hasil->id;
    }

    public function failed(\Exception $exception)
    {
        Log::error('ProcessLaporanJob permanently failed', [
            'laporan_id' => $this->laporanId,
            'error'      => $exception->getMessage(),
            'trace'      => $exception->getTraceAsString(),
        ]);
    }
}