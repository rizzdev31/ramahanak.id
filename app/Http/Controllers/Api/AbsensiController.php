<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\IntegrasiLaporanService;
use App\Exceptions\SantriNotFoundException;
use App\Exceptions\KodeNotFoundException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Absensi (PRD-04): hanya keterlambatan ("telat") yang dikirim otomatis dari
 * aplikasi pengirim → laporan_pelanggaran (disiplin waktu), pending_bk.
 */
class AbsensiController extends Controller
{
    public function __construct(private IntegrasiLaporanService $service) {}

    public function telat(Request $request)
    {
        $d = $request->validate([
            'nisn'     => ['required', 'string'],
            'tanggal'  => ['required', 'date'],
            'waktu'    => ['nullable', 'string', 'max:20'],
            'kegiatan' => ['nullable', 'string', 'max:191'],
            'ref_id'   => ['nullable', 'string', 'max:191'],
            'actor'    => ['nullable', 'string', 'max:191'],
            'app'      => ['nullable', 'string', 'max:50'],
        ]);

        try {
            $r = $this->service->buatTelat($d);
            $payload = [
                'status'                 => empty($r['duplicate']) ? 'ok' : 'duplicate',
                'laporan_pelanggaran_id' => $r['laporan']->id,
                'kode'                   => $r['laporan']->kode_pelanggaran,
                'approval_status'        => $r['laporan']->approval_status,
            ];
            if (isset($r['poin'])) $payload['poin'] = $r['poin'];

            return response()->json($payload, empty($r['duplicate']) ? 201 : 200);

        } catch (SantriNotFoundException $e) {
            return response()->json(['status' => 'santri_not_found', 'message' => $e->getMessage()], 404);
        } catch (KodeNotFoundException $e) {
            return response()->json(['status' => 'kode_not_found', 'message' => $e->getMessage()], 404);
        } catch (\Throwable $e) {
            Log::error('Absensi API error', ['error' => $e->getMessage()]);
            return response()->json(['status' => 'error', 'message' => 'Terjadi kesalahan server.'], 500);
        }
    }
}
