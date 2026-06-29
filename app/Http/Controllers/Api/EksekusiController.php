<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\IntegrasiLaporanService;
use App\Exceptions\SantriNotFoundException;
use App\Exceptions\KodeNotFoundException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Smart Eksekusi (PRD-04): terima laporan dari aplikasi pengirim TANPA preprocessing.
 * Semua laporan masuk sebagai pending_bk → diputuskan Guru BK di layar KelolaBk.
 */
class EksekusiController extends Controller
{
    public function __construct(private IntegrasiLaporanService $service) {}

    public function pelanggaran(Request $request)
    {
        $d = $request->validate([
            'nisn_pelaku' => ['required', 'string'],
            'nisn_korban' => ['nullable', 'string'],
            'kode'        => ['required', 'string'],
            'tanggal'     => ['required', 'date'],
            'catatan'     => ['nullable', 'string', 'max:1000'],
            'ref_id'      => ['nullable', 'string', 'max:191'],
            'actor'       => ['nullable', 'string', 'max:191'],
            'app'         => ['nullable', 'string', 'max:50'],
        ]);

        return $this->handle(fn () => $this->service->buatPelanggaran($d), 'laporan_pelanggaran_id', true);
    }

    public function apresiasi(Request $request)
    {
        $d = $request->validate([
            'nisn_pelaku' => ['required', 'string'],
            'kode'        => ['required', 'string'],
            'tanggal'     => ['required', 'date'],
            'catatan'     => ['nullable', 'string', 'max:1000'],
            'ref_id'      => ['nullable', 'string', 'max:191'],
            'actor'       => ['nullable', 'string', 'max:191'],
            'app'         => ['nullable', 'string', 'max:50'],
        ]);

        return $this->handle(fn () => $this->service->buatApresiasi($d), 'laporan_apresiasi_id', true);
    }

    public function konselor(Request $request)
    {
        $d = $request->validate([
            'nisn_korban' => ['required', 'string'],
            'kode'        => ['required', 'string'],
            'tanggal'     => ['required', 'date'],
            'catatan'     => ['nullable', 'string', 'max:1000'],
            'ref_id'      => ['nullable', 'string', 'max:191'],
            'actor'       => ['nullable', 'string', 'max:191'],
            'app'         => ['nullable', 'string', 'max:50'],
        ]);

        return $this->handle(fn () => $this->service->buatKonselor($d), 'laporan_konselor_id', false);
    }

    /** Bungkus eksekusi + mapping error standar. */
    private function handle(\Closure $fn, string $idKey, bool $withPoin)
    {
        try {
            $r = $fn();
            $payload = [
                'status' => 'ok',
                $idKey   => $r['laporan']->id,
                'approval_status' => $r['laporan']->approval_status,
            ];
            if ($withPoin && isset($r['poin'])) $payload['poin'] = $r['poin'];

            if (!empty($r['duplicate'])) {
                $payload['status'] = 'duplicate';
                return response()->json($payload, 200);
            }
            return response()->json($payload, 201);

        } catch (SantriNotFoundException $e) {
            return response()->json(['status' => 'santri_not_found', 'message' => $e->getMessage()], 404);
        } catch (KodeNotFoundException $e) {
            return response()->json(['status' => 'kode_not_found', 'message' => $e->getMessage()], 404);
        } catch (\Throwable $e) {
            Log::error('Eksekusi API error', ['error' => $e->getMessage()]);
            return response()->json(['status' => 'error', 'message' => 'Terjadi kesalahan server.'], 500);
        }
    }
}
