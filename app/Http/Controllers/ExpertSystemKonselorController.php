<?php

namespace App\Http\Controllers;

use App\Models\LaporanExpertSystemKonselor;
use App\Models\SesiBimbinganKonselor;
use App\Services\ForwardChainingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class ExpertSystemKonselorController extends Controller
{
    /**
     * Display list of laporan konselor
     * Filter: all, pending, in_progress, completed
     */
    public function index(Request $request)
    {
        $filter = $request->get('filter', 'all');

        $query = LaporanExpertSystemKonselor::with([
            'santri.santriProfile',
            'validator.guruBkProfile',
            'sesiList'
        ]);

        // Apply filter
        switch ($filter) {
            case 'pending':
                $query->pending();
                break;
            case 'in_progress':
                $query->inProgress();
                break;
            case 'completed':
                $query->completed();
                break;
            default:
                // all - no filter
                break;
        }

        $laporans = $query->latest('tanggal_trigger')
            ->paginate(10)
            ->withQueryString();

        // Statistics
        $statistics = [
            'total' => LaporanExpertSystemKonselor::count(),
            'pending' => LaporanExpertSystemKonselor::pending()->count(),
            'in_progress' => LaporanExpertSystemKonselor::inProgress()->count(),
            'completed' => LaporanExpertSystemKonselor::completed()->count(),
        ];

        return Inertia::render('ExpertSystemKonselor/Index', [
            'laporans' => $laporans,
            'statistics' => $statistics,
            'filter' => $filter,
        ]);
    }

    /**
     * Display detail laporan with all sesi
     */
    public function show(LaporanExpertSystemKonselor $laporan)
    {
        $laporan->load([
            'santri.santriProfile',
            'validator.guruBkProfile',
            'sesiList',
            'catatanKolaboratif.author.guruBkProfile',
            'catatanKolaboratif.author.tenagaPendidikProfile'
        ]);

        return Inertia::render('ExpertSystemKonselor/Show', [
            'laporan' => $laporan
        ]);
    }

    /**
     * Approve laporan (start sesi 1)
     * Change status: pending → in_progress
     */
    public function approve(Request $request, LaporanExpertSystemKonselor $laporan)
    {
        // Validate
        if ($laporan->status !== 'pending') {
            return back()->withErrors([
                'approve' => 'Laporan sudah di-approve atau diselesaikan.'
            ]);
        }

        try {
            DB::transaction(function () use ($laporan, $request) {
                // Update laporan
                $laporan->update([
                    'status' => 'in_progress',
                    'validated_by' => auth()->id(),
                ]);

                Log::info('ExpertSystemKonselor: Approved', [
                    'laporan_id' => $laporan->id,
                    'santri_id' => $laporan->santri_id,
                    'approved_by' => auth()->id()
                ]);
            });

            return redirect()->route('expert-system-konselor.show', $laporan)
                ->with('success', 'Laporan berhasil di-approve. Silakan mulai Sesi 1.');

        } catch (\Exception $e) {
            Log::error('ExpertSystemKonselor: Approve failed', [
                'laporan_id' => $laporan->id,
                'error' => $e->getMessage()
            ]);

            return back()->withErrors([
                'approve' => 'Gagal approve laporan: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Complete laporan (manual finish)
     * Change status: in_progress → completed
     */
    public function complete(Request $request, LaporanExpertSystemKonselor $laporan)
    {
        $request->validate([
            'catatan_penutup' => 'required|string|max:1000',
        ]);

        // Validate
        if ($laporan->status !== 'in_progress') {
            return back()->withErrors([
                'complete' => 'Hanya laporan in_progress yang bisa di-complete.'
            ]);
        }

        try {
            DB::transaction(function () use ($laporan, $request) {
                // Update laporan
                $laporan->update([
                    'status' => 'completed',
                    'tanggal_selesai' => now(),
                ]);

                // Add catatan penutup as last note
                $laporan->catatanKolaboratif()->create([
                    'author_id' => auth()->id(),
                    'author_role' => 'guru_bk',
                    'judul' => 'Catatan Penutup',
                    'isi_catatan' => $request->catatan_penutup,
                ]);

                Log::info('ExpertSystemKonselor: Completed manually', [
                    'laporan_id' => $laporan->id,
                    'sesi_terakhir' => $laporan->sesi_bimbingan_terakhir,
                    'completed_by' => auth()->id()
                ]);
            });

            return redirect()->route('expert-system-konselor.index')
                ->with('success', 'Laporan berhasil diselesaikan.');

        } catch (\Exception $e) {
            Log::error('ExpertSystemKonselor: Complete failed', [
                'laporan_id' => $laporan->id,
                'error' => $e->getMessage()
            ]);

            return back()->withErrors([
                'complete' => 'Gagal menyelesaikan laporan: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * ✅ FIX: Scan manual semua rule — trigger laporan yang belum ada.
     * Dipanggil dari halaman index expert system konselor (tombol "Scan Sekarang").
     * Berguna untuk memproses data historis yang masuk sebelum fix ini diterapkan.
     */
    public function scanNow(Request $request)
    {
        try {
            $forwardChaining = app(ForwardChainingService::class);
            $stats = $forwardChaining->checkAllRules();

            $message = "Scan selesai: {$stats['laporan_created']} laporan baru dibuat";
            if ($stats['laporan_skipped'] > 0) {
                $message .= ", {$stats['laporan_skipped']} sudah ada";
            }
            if (!empty($stats['errors'])) {
                $message .= ", " . count($stats['errors']) . " error";
            }

            Log::info('ExpertSystemKonselor: Manual scan completed', [
                'triggered_by' => auth()->id(),
                'stats'        => $stats,
            ]);

            return back()->with('success', $message);

        } catch (\Exception $e) {
            Log::error('ExpertSystemKonselor: Manual scan failed', [
                'error'        => $e->getMessage(),
                'triggered_by' => auth()->id(),
            ]);

            return back()->withErrors([
                'scan' => 'Gagal scan: ' . $e->getMessage(),
            ]);
        }
    }

    /**
     * ✅ FIX: Scan rule untuk SATU santri spesifik.
     * Dipanggil dari halaman profil santri atau detail laporan.
     */
    public function scanForSantri(Request $request, int $santriId)
    {
        try {
            $forwardChaining = app(ForwardChainingService::class);
            $result = $forwardChaining->checkForSantri($santriId);

            $message = "Scan santri ID {$santriId}: {$result['laporan_created']} laporan baru dibuat";
            if ($result['laporan_skipped'] > 0) {
                $message .= ", {$result['laporan_skipped']} sudah ada";
            }

            Log::info('ExpertSystemKonselor: Per-santri scan completed', [
                'santri_id'   => $santriId,
                'triggered_by' => auth()->id(),
                'result'      => $result,
            ]);

            return back()->with('success', $message);

        } catch (\Exception $e) {
            Log::error('ExpertSystemKonselor: Per-santri scan failed', [
                'santri_id' => $santriId,
                'error'     => $e->getMessage(),
            ]);

            return back()->withErrors([
                'scan' => 'Gagal scan santri: ' . $e->getMessage(),
            ]);
        }
    }

    /**
     * Delete laporan (soft delete / discontinue)
     */
    public function destroy(LaporanExpertSystemKonselor $laporan)
    {
        try {
            $laporan->update([
                'status' => 'discontinued'
            ]);

            Log::info('ExpertSystemKonselor: Discontinued', [
                'laporan_id' => $laporan->id,
                'discontinued_by' => auth()->id()
            ]);

            return redirect()->route('expert-system-konselor.index')
                ->with('success', 'Laporan berhasil dihentikan.');

        } catch (\Exception $e) {
            Log::error('ExpertSystemKonselor: Discontinue failed', [
                'laporan_id' => $laporan->id,
                'error' => $e->getMessage()
            ]);

            return back()->withErrors([
                'delete' => 'Gagal menghentikan laporan: ' . $e->getMessage()
            ]);
        }
    }
}