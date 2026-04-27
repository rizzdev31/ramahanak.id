<?php

namespace App\Http\Controllers;

use App\Models\LaporanAwal;
use App\Models\Kelas;
use App\Jobs\ProcessLaporanJob;
use App\Services\PreprocessingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class LaporanAwalController extends Controller
{
    /**
     * Display form untuk buat laporan (Santri, Tendik, BK)
     */
    public function create()
    {
        return Inertia::render('Laporan/Create', [
            'tahunAjaranAktif' => $this->getTahunAjaranAktif(),
        ]);
    }

    /**
     * Store laporan baru
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'text_laporan' => 'required|string|min:20',
            'jenis_laporan' => 'required|in:pelanggaran,apresiasi,kondisi_mental,lainnya',
            'tanggal_kejadian' => 'required|date|before_or_equal:today',
            'waktu_kejadian' => 'nullable|date_format:H:i',
            'lokasi_kejadian' => 'nullable|string|max:255',
        ], [
            'text_laporan.required' => 'Isi laporan wajib diisi.',
            'text_laporan.min' => 'Laporan minimal 20 karakter.',
            'jenis_laporan.required' => 'Jenis laporan wajib dipilih.',
            'tanggal_kejadian.required' => 'Tanggal kejadian wajib diisi.',
            'tanggal_kejadian.before_or_equal' => 'Tanggal kejadian tidak boleh di masa depan.',
        ]);

        $laporan = LaporanAwal::create([
            'pelapor_id' => auth()->id(),
            'text_laporan' => $validated['text_laporan'],
            'jenis_laporan' => $validated['jenis_laporan'],
            'tahun_ajaran' => $this->getTahunAjaranAktif(),
            'tanggal_kejadian' => $validated['tanggal_kejadian'],
            'waktu_kejadian' => $validated['waktu_kejadian'] ?? null,
            'lokasi_kejadian' => $validated['lokasi_kejadian'] ?? null,
            'status' => 'pending',
        ]);

        return redirect()->back()->with('success', 'Laporan berhasil dibuat dan menunggu validasi Guru BK.');
    }

    /**
     * Display list laporan untuk BK (Gerbang 1 - Validasi)
     */
    public function index(Request $request)
    {
        $query = LaporanAwal::with(['pelapor', 'validator'])
            ->orderBy('created_at', 'desc');

        // Filter status
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Filter jenis
        if ($request->has('jenis') && $request->jenis !== 'all') {
            $query->where('jenis_laporan', $request->jenis);
        }

        // Filter tahun ajaran
        $tahunAjaran = $request->get('tahun_ajaran', $this->getTahunAjaranAktif());
        $query->tahunAjaran($tahunAjaran);

        // Search
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('text_laporan', 'like', "%{$search}%")
                  ->orWhereHas('pelapor', function($q) use ($search) {
                      $q->whereHas('santriProfile', function($q) use ($search) {
                          $q->where('nama_lengkap', 'like', "%{$search}%");
                      })
                      ->orWhereHas('guruBkProfile', function($q) use ($search) {
                          $q->where('nama_lengkap', 'like', "%{$search}%");
                      })
                      ->orWhereHas('tenagaPendidikProfile', function($q) use ($search) {
                          $q->where('nama_lengkap', 'like', "%{$search}%");
                      });
                  });
            });
        }

        $laporan = $query->paginate(15)->through(function ($item) {
            return [
                'id' => $item->id,
                'text_laporan' => $item->text_laporan,
                'jenis_laporan' => $item->jenis_laporan,
                'jenis_laporan_label' => $item->jenis_laporan_label,
                'jenis_badge_color' => $item->jenis_badge_color,
                'status' => $item->status,
                'status_label' => $item->status_label,
                'status_badge_color' => $item->status_badge_color,
                'tanggal_kejadian' => $item->tanggal_kejadian->format('d/m/Y'),
                'waktu_kejadian' => $item->waktu_kejadian,
                'lokasi_kejadian' => $item->lokasi_kejadian,
                'created_at' => $item->created_at->format('d/m/Y H:i'),
                'pelapor' => [
                    'id' => $item->pelapor->id,
                    'nama' => $this->getNamaLengkap($item->pelapor),
                    'role' => $item->pelapor->role,
                ],
                'validator' => $item->validator ? [
                    'nama' => $this->getNamaLengkap($item->validator),
                ] : null,
                'validated_at' => $item->validated_at?->format('d/m/Y H:i'),
                'catatan_validasi' => $item->catatan_validasi,
            ];
        });

        return Inertia::render('Laporan/Index', [
            'laporan' => $laporan,
            'filters' => [
                'status' => $request->get('status', 'all'),
                'jenis' => $request->get('jenis', 'all'),
                'search' => $request->get('search', ''),
                'tahun_ajaran' => $tahunAjaran,
            ],
            'tahunAjaranList' => $this->getTahunAjaranList(),
        ]);
    }

    /**
     * Approve laporan (BK only) - Gerbang 1
     */
    public function approve(Request $request, LaporanAwal $laporan)
    {
        try {
            $validated = $request->validate([
                'catatan_validasi' => 'nullable|string|max:500',
            ]);

            // Update laporan status
            $laporan->update([
                'status' => 'approved',
                'validated_by' => auth()->id(),
                'validated_at' => now(),
                'catatan_validasi' => $validated['catatan_validasi'] ?? null,
            ]);

            // ✅ FIX: Dispatch job dengan INTEGER ID, bukan object
            try {
                ProcessLaporanJob::dispatch($laporan->id);  // ✅ Pass ID!
                
                Log::info('Preprocessing job dispatched', [
                    'laporan_id' => $laporan->id,
                    'dispatched_by' => auth()->id(),
                ]);
                
                return redirect()->back()->with('success', 'Laporan disetujui dan sedang diproses!');
                
            } catch (\Exception $e) {
                Log::error('Failed to dispatch preprocessing job', [
                    'laporan_id' => $laporan->id,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);
                
                // Laporan tetap approved, tapi preprocessing gagal
                return redirect()->back()->with('warning', 
                    'Laporan disetujui, tapi preprocessing gagal dimulai. Silakan coba manual atau hubungi admin.'
                );
            }

        } catch (\Exception $e) {
            Log::error('LaporanAwalController@approve failed', [
                'laporan_id' => $laporan->id,
                'error' => $e->getMessage(),
            ]);
            
            return redirect()->back()->withErrors([
                'approve' => 'Gagal approve laporan: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Test preprocessing manually (for debugging)
     */
    public function testPreprocessing(LaporanAwal $laporan, PreprocessingService $service)
    {
        try {
            // ✅ FIX: Pass integer ID ke service
            $result = $service->runPreprocessing($laporan->id);
            
            if ($result && $result['status'] === 'success') {
                return response()->json([
                    'success' => true,
                    'message' => 'Preprocessing berhasil',
                    'result' => $result,
                    'hasil_id' => $result['hasil_preprocessing_id'] ?? null,
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Preprocessing gagal',
                    'error' => $result['error'] ?? 'Unknown error',
                ], 500);
            }
            
        } catch (\Exception $e) {
            Log::error('LaporanAwalController@testPreprocessing failed', [
                'laporan_id' => $laporan->id,
                'error' => $e->getMessage(),
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Preprocessing error',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Reject laporan (BK only)
     */
    public function reject(Request $request, LaporanAwal $laporan)
    {
        try {
            $validated = $request->validate([
                'catatan_validasi' => 'required|string|max:500',
            ], [
                'catatan_validasi.required' => 'Alasan penolakan wajib diisi.',
            ]);

            $laporan->update([
                'status' => 'rejected',
                'validated_by' => auth()->id(),
                'validated_at' => now(),
                'catatan_validasi' => $validated['catatan_validasi'],
            ]);

            Log::info('Laporan rejected', [
                'laporan_id' => $laporan->id,
                'rejected_by' => auth()->id(),
            ]);

            return redirect()->back()->with('success', 'Laporan ditolak.');

        } catch (\Exception $e) {
            Log::error('LaporanAwalController@reject failed', [
                'laporan_id' => $laporan->id,
                'error' => $e->getMessage(),
            ]);
            
            return redirect()->back()->withErrors([
                'reject' => 'Gagal reject laporan: ' . $e->getMessage()
            ]);
        }
    }

    // ══════════════════════════════════════════════════════════
    // HELPER METHODS
    // ══════════════════════════════════════════════════════════

    /**
     * Helper: Get tahun ajaran aktif dari kelas
     */
    private function getTahunAjaranAktif()
    {
        $kelas = Kelas::where('status', 'active')
            ->orderBy('tahun_ajaran', 'desc')
            ->first();

        return $kelas?->tahun_ajaran ?? now()->year . '/' . (now()->year + 1);
    }

    /**
     * Helper: Get list tahun ajaran untuk filter
     */
    private function getTahunAjaranList()
    {
        return Kelas::select('tahun_ajaran')
            ->distinct()
            ->orderBy('tahun_ajaran', 'desc')
            ->pluck('tahun_ajaran')
            ->toArray();
    }

    /**
     * Helper: Get nama lengkap berdasarkan role
     */
    private function getNamaLengkap($user)
    {
        if (!$user) return 'Unknown';
        
        return match($user->role) {
            'santri' => $user->santriProfile?->nama_lengkap ?? 'Unknown',
            'guru_bk' => $user->guruBkProfile?->nama_lengkap ?? 'Unknown',
            'tenaga_pendidik' => $user->tenagaPendidikProfile?->nama_lengkap ?? 'Unknown',
            default => 'Unknown',
        };
    }
}