<?php

namespace App\Http\Controllers;

use App\Models\LaporanExpertSystemKonselor;
use App\Models\SesiBimbinganKonselor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class SesiBimbinganController extends Controller
{
    /**
     * Store sesi bimbingan baru
     */
    public function store(Request $request, LaporanExpertSystemKonselor $laporan)
    {
        // Validate laporan status
        if ($laporan->status !== 'in_progress') {
            return back()->withErrors([
                'sesi' => 'Laporan harus di-approve dulu sebelum menambah sesi.'
            ]);
        }

        // Validate max sesi
        if ($laporan->sesi_bimbingan_terakhir >= 5) {
            return back()->withErrors([
                'sesi' => 'Maksimal 5 sesi. Laporan sudah mencapai batas.'
            ]);
        }

        // Validate input
        $validated = $request->validate([
            'tanggal_sesi' => 'required|date|before_or_equal:today',
            'catatan_bk' => 'required|string|max:2000',
            'proses_bimbingan' => 'nullable|string|max:2000',
            'rencana_tindak_lanjut' => 'nullable|string|max:2000',
            'status_santri' => [
                'required',
                Rule::in(['membaik', 'stabil', 'masih_bermasalah', 'memburuk'])
            ],
            'lanjut_sesi_berikutnya' => 'required|boolean',
        ]);

        try {
            DB::transaction(function () use ($laporan, $validated) {
                $nextSesi = $laporan->getNextSesiNumber();

                // Create sesi
                $sesi = SesiBimbinganKonselor::create([
                    'laporan_konselor_id' => $laporan->id,
                    'sesi_ke' => $nextSesi,
                    'tanggal_sesi' => $validated['tanggal_sesi'],
                    'catatan_bk' => $validated['catatan_bk'],
                    'proses_bimbingan' => $validated['proses_bimbingan'],
                    'rencana_tindak_lanjut' => $validated['rencana_tindak_lanjut'],
                    'status_santri' => $validated['status_santri'],
                    'lanjut_sesi_berikutnya' => $validated['lanjut_sesi_berikutnya'],
                ]);

                // Update laporan
                $laporan->update([
                    'sesi_bimbingan_terakhir' => $nextSesi
                ]);

                // Auto-close jika sudah sesi 5 atau tidak lanjut
                if ($nextSesi >= 5 || !$validated['lanjut_sesi_berikutnya']) {
                    $laporan->update([
                        'status' => 'completed',
                        'tanggal_selesai' => now(),
                    ]);
                }

                Log::info('SesiBimbingan: Created', [
                    'laporan_id' => $laporan->id,
                    'sesi_ke' => $nextSesi,
                    'status_santri' => $validated['status_santri'],
                    'lanjut' => $validated['lanjut_sesi_berikutnya']
                ]);
            });

            return redirect()->route('expert-system-konselor.show', $laporan)
                ->with('success', 'Sesi bimbingan berhasil disimpan.');

        } catch (\Exception $e) {
            Log::error('SesiBimbingan: Create failed', [
                'laporan_id' => $laporan->id,
                'error' => $e->getMessage()
            ]);

            return back()->withErrors([
                'sesi' => 'Gagal menyimpan sesi: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Update sesi bimbingan (edit)
     */
    public function update(Request $request, LaporanExpertSystemKonselor $laporan, SesiBimbinganKonselor $sesi)
    {
        // Validate ownership
        if ($sesi->laporan_konselor_id !== $laporan->id) {
            abort(403, 'Sesi tidak belong ke laporan ini.');
        }

        // Validate input
        $validated = $request->validate([
            'tanggal_sesi' => 'required|date|before_or_equal:today',
            'catatan_bk' => 'required|string|max:2000',
            'proses_bimbingan' => 'nullable|string|max:2000',
            'rencana_tindak_lanjut' => 'nullable|string|max:2000',
            'status_santri' => [
                'required',
                Rule::in(['membaik', 'stabil', 'masih_bermasalah', 'memburuk'])
            ],
            'lanjut_sesi_berikutnya' => 'required|boolean',
        ]);

        try {
            $sesi->update($validated);

            Log::info('SesiBimbingan: Updated', [
                'sesi_id' => $sesi->id,
                'laporan_id' => $laporan->id,
                'sesi_ke' => $sesi->sesi_ke
            ]);

            return redirect()->route('expert-system-konselor.show', $laporan)
                ->with('success', 'Sesi bimbingan berhasil diupdate.');

        } catch (\Exception $e) {
            Log::error('SesiBimbingan: Update failed', [
                'sesi_id' => $sesi->id,
                'error' => $e->getMessage()
            ]);

            return back()->withErrors([
                'sesi' => 'Gagal update sesi: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Delete sesi (hanya sesi terakhir yang bisa dihapus)
     */
    public function destroy(LaporanExpertSystemKonselor $laporan, SesiBimbinganKonselor $sesi)
    {
        // Validate ownership
        if ($sesi->laporan_konselor_id !== $laporan->id) {
            abort(403, 'Sesi tidak belong ke laporan ini.');
        }

        // Validate: hanya sesi terakhir yang bisa dihapus
        if ($sesi->sesi_ke !== $laporan->sesi_bimbingan_terakhir) {
            return back()->withErrors([
                'delete' => 'Hanya sesi terakhir yang bisa dihapus.'
            ]);
        }

        try {
            DB::transaction(function () use ($laporan, $sesi) {
                $sesiKe = $sesi->sesi_ke;
                
                // Delete sesi
                $sesi->delete();

                // Update laporan counter
                $laporan->update([
                    'sesi_bimbingan_terakhir' => $sesiKe - 1,
                    'status' => 'in_progress', // Revert to in_progress
                    'tanggal_selesai' => null,
                ]);

                Log::info('SesiBimbingan: Deleted', [
                    'laporan_id' => $laporan->id,
                    'sesi_ke' => $sesiKe
                ]);
            });

            return redirect()->route('expert-system-konselor.show', $laporan)
                ->with('success', 'Sesi berhasil dihapus.');

        } catch (\Exception $e) {
            Log::error('SesiBimbingan: Delete failed', [
                'sesi_id' => $sesi->id,
                'error' => $e->getMessage()
            ]);

            return back()->withErrors([
                'delete' => 'Gagal menghapus sesi: ' . $e->getMessage()
            ]);
        }
    }
}