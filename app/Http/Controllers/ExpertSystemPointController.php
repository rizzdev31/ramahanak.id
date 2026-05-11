<?php

namespace App\Http\Controllers;

use App\Models\LaporanExpertSystemPoint;
use App\Models\User;
use App\Services\ExpertSystemPointService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class ExpertSystemPointController extends Controller
{
    protected $expertSystemService;

    public function __construct(ExpertSystemPointService $expertSystemService)
    {
        $this->expertSystemService = $expertSystemService;
    }

    /**
     * Display a listing of laporan expert system point
     */
    public function index(Request $request)
    {
        try {
            $query = LaporanExpertSystemPoint::query()
                ->with([
                    'santri.santriProfile.kelas',
                    'validator'
                ])
                ->latest('tanggal_trigger')
                ->orderBy('id', 'desc');

            // Filter by jenis
            if ($request->filled('jenis') && $request->jenis !== 'all') {
                $query->where('jenis', $request->jenis);
            }

            // Filter by status
            if ($request->filled('status') && $request->status !== 'all') {
                $query->where('status', $request->status);
            }

            // Filter by santri
            if ($request->filled('santri_id')) {
                $query->where('santri_id', $request->santri_id);
            }

            // Search
            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('kode', 'like', "%{$search}%")
                      ->orWhere('konsekuensi_atau_reward', 'like', "%{$search}%")
                      ->orWhereHas('santri.santriProfile', function($q) use ($search) {
                          $q->where('nama_lengkap', 'like', "%{$search}%")
                            ->orWhere('nama_panggilan', 'like', "%{$search}%");
                      });
                });
            }

            $laporanList = $query->paginate(15);

            // Transform data
            $laporanList->through(function ($item) {
                return [
                    'id' => $item->id,
                    'santri' => $item->santri && $item->santri->santriProfile ? [
                        'id'             => $item->santri->id,
                        'nama_lengkap'   => $item->santri->santriProfile->nama_lengkap,
                        'nama_panggilan' => $item->santri->santriProfile->nama_panggilan,
                        'nisn'           => $item->santri->santriProfile->nisn,
                        'kelas_kode'     => $item->santri->santriProfile->kelas?->kode_kelas ?? '-',
                    ] : null,
                    'jenis' => $item->jenis,
                    'jenis_label' => $item->jenis_label,
                    'kode' => $item->kode,
                    'konsekuensi_atau_reward' => $item->konsekuensi_atau_reward,
                    'total_poin_saat_trigger' => $item->total_poin_saat_trigger,
                    'threshold_poin_triggered' => $item->threshold_poin_triggered,
                    'status' => $item->status,
                    'status_label' => $item->status_label,
                    'status_badge_color' => $item->status_badge_color,
                    'tanggal_trigger' => $item->tanggal_trigger->format('d/m/Y H:i'),
                    'tanggal_selesai' => $item->tanggal_selesai?->format('d/m/Y H:i'),
                    'has_catatan_bk' => !empty($item->catatan_bk),
                    'has_pdf' => $item->hasPdf(),
                    'pdf_url' => $item->pdf_url,
                ];
            });

            // Get santri list untuk filter
            $santriList = User::where('role', 'santri')
                ->where('status', 'active')
                ->with('santriProfile')
                ->get()
                ->filter(fn($u) => $u->santriProfile)
                ->map(fn($u) => [
                    'id' => $u->id,
                    'label' => "{$u->santriProfile->nama_panggilan} ({$u->santriProfile->nisn})",
                ])
                ->values();

            return Inertia::render('ExpertSystemPoint/Index', [
                'laporanList' => $laporanList,
                'santriList' => $santriList,
                'filters' => [
                    'jenis' => $request->get('jenis', 'all'),
                    'status' => $request->get('status', 'all'),
                    'santri_id' => $request->get('santri_id'),
                    'search' => $request->get('search', ''),
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('ExpertSystemPointController@index', [
                'error' => $e->getMessage()
            ]);
            
            return back()->withErrors([
                'error' => 'Gagal memuat data: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Display the specified laporan (for BK to fill catatan & aksi)
     */
    public function show(LaporanExpertSystemPoint $laporan)
    {
        try {
            //  UPDATED: Load buktis relationship
            $laporan->load([
                'santri.santriProfile',
                'validator.guruBkProfile',
                'buktis' => function($query) {
                    $query->orderBy('created_at', 'desc');
                },
                'buktis.reviewer.guruBkProfile',
            ]);

            // Update overdue status
            $laporan->updateOverdueStatus();

            // Get statistics santri
            $statistics = $this->expertSystemService->getStatistics($laporan->santri_id);
            $nextThreshold = $this->expertSystemService->getNextThreshold($laporan->santri_id);

            return Inertia::render('ExpertSystemPoint/Show', [
                'laporan' => [
                    'id' => $laporan->id,
                    'santri' => $laporan->santri && $laporan->santri->santriProfile ? [
                        'id' => $laporan->santri->id,
                        'nama_lengkap' => $laporan->santri->santriProfile->nama_lengkap,
                        'nama_panggilan' => $laporan->santri->santriProfile->nama_panggilan,
                        'nisn' => $laporan->santri->santriProfile->nisn,
                    ] : null,
                    'jenis' => $laporan->jenis,
                    'jenis_label' => $laporan->jenis_label,
                    'kode' => $laporan->kode,
                    'konsekuensi_atau_reward' => $laporan->konsekuensi_atau_reward,
                    'total_poin_saat_trigger' => $laporan->total_poin_saat_trigger,
                    'threshold_poin_triggered' => $laporan->threshold_poin_triggered,
                    'rekomendasi' => $laporan->rekomendasi,
                    'catatan_bk' => $laporan->catatan_bk,
                    'aksi_bk' => $laporan->aksi_bk,
                    'status' => $laporan->status,
                    'status_label' => $laporan->status_label,
                    'status_badge_color' => $laporan->status_badge_color,
                    'tanggal_trigger' => $laporan->tanggal_trigger->format('d/m/Y H:i'),
                    'tanggal_selesai' => $laporan->tanggal_selesai?->format('d/m/Y H:i'),
                    'tanggal_batas_pelaksanaan' => $laporan->tanggal_batas_pelaksanaan?->format('Y-m-d'),
                    'kesepakatan_keterlambatan' => $laporan->kesepakatan_keterlambatan,
                    'sisa_hari_deadline' => $laporan->sisa_hari_deadline,
                    'is_terlambat' => $laporan->is_terlambat,
                    'has_bukti' => $laporan->has_bukti,
                    'bukti_approved' => $laporan->bukti_approved,
                    'final_status' => $laporan->final_status,
                    'final_status_label' => $laporan->final_status_label,
                    'final_status_badge_color' => $laporan->final_status_badge_color,
                    'has_pdf' => $laporan->hasPdf(),
                    'pdf_url' => $laporan->pdf_url,
                    //  NEW: Buktis data
                    'buktis' => $laporan->buktis->map(function($bukti) {
                        return [
                            'id' => $bukti->id,
                            'file_name' => $bukti->file_name,
                            'file_type' => $bukti->file_type,
                            'file_size' => $bukti->file_size,
                            'file_size_human' => $bukti->file_size_human,
                            'file_url' => $bukti->file_url,
                            'is_image' => $bukti->is_image,
                            'is_pdf' => $bukti->is_pdf,
                            'keterangan' => $bukti->keterangan,
                            'status' => $bukti->status,
                            'status_label' => $bukti->status_label,
                            'status_badge_color' => $bukti->status_badge_color,
                            'catatan_review' => $bukti->catatan_review,
                            'uploaded_at' => $bukti->uploaded_at->format('d M Y, H:i'),
                            'reviewed_at' => $bukti->reviewed_at?->format('d M Y, H:i'),
                            'reviewer' => $bukti->reviewer ? [
                                'nama' => $bukti->reviewer->guruBkProfile->nama_lengkap ?? 'Unknown',
                            ] : null,
                        ];
                    }),
                    'sisa_hari_deadline' => $laporan->sisa_hari_deadline,
                    'validator' => $laporan->validator && $laporan->validator->guruBkProfile ? [
                        'nama' => $laporan->validator->guruBkProfile->nama_lengkap,
                    ] : null,
                    'can_edit' => $laporan->canEdit(),
                    'can_complete' => $laporan->canComplete(),
                    'has_pdf' => $laporan->hasPdf(),
                    'pdf_url' => $laporan->pdf_url,
                ],
                'statistics' => $statistics,
                'nextThreshold' => $nextThreshold,
            ]);

        } catch (\Exception $e) {
            Log::error('ExpertSystemPointController@show', [
                'laporan_id' => $laporan->id,
                'error' => $e->getMessage()
            ]);
            
            return back()->withErrors([
                'error' => 'Gagal memuat detail: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Update catatan_bk dan aksi_bk
     */
    public function update(Request $request, LaporanExpertSystemPoint $laporan)
    {
        $validated = $request->validate([
            'catatan_bk' => 'required|string|max:5000',
            'aksi_bk' => 'nullable|string|max:5000',
        ], [
            'catatan_bk.required' => 'Catatan BK wajib diisi untuk melengkapi laporan.',
            'catatan_bk.max' => 'Catatan BK maksimal 5000 karakter.',
        ]);

        try {
            if (!$laporan->canEdit()) {
                return back()->withErrors([
                    'update' => 'Laporan ini tidak dapat diubah (status: ' . $laporan->status_label . ')'
                ]);
            }

            DB::transaction(function () use ($laporan, $validated) {
                $laporan->update([
                    'catatan_bk' => $validated['catatan_bk'],
                    'aksi_bk' => $validated['aksi_bk'] ?? null,
                    'status' => 'diproses',
                ]);

                Log::info('LaporanExpertSystemPoint updated', [
                    'laporan_id' => $laporan->id,
                    'updated_by' => auth()->id(),
                    'has_aksi_bk' => !empty($validated['aksi_bk']),
                ]);
            });

            return back()->with('success', 'Catatan BK berhasil disimpan!');

        } catch (\Exception $e) {
            Log::error('ExpertSystemPointController@update', [
                'laporan_id' => $laporan->id,
                'error' => $e->getMessage()
            ]);
            
            return back()->withErrors([
                'update' => 'Gagal menyimpan: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Complete laporan & generate PDF
     */
    public function complete(Request $request, LaporanExpertSystemPoint $laporan)
    {
        try {
            // Validasi semua field dari form complete modal
            $validated = $request->validate([
                'catatan_bk'                 => 'required|string|min:5|max:5000',
                'aksi_bk'                    => 'nullable|string|max:5000',
                'tanggal_batas_pelaksanaan'  => 'required|date|after:today',
                'kesepakatan_keterlambatan'  => 'required|string|min:10',
            ], [
                'catatan_bk.required'                => 'Catatan BK wajib diisi.',
                'catatan_bk.min'                     => 'Catatan BK minimal 5 karakter.',
                'tanggal_batas_pelaksanaan.required' => 'Deadline pelaksanaan wajib diisi.',
                'tanggal_batas_pelaksanaan.after'    => 'Deadline harus setelah hari ini.',
                'kesepakatan_keterlambatan.required' => 'Kesepakatan keterlambatan wajib diisi.',
                'kesepakatan_keterlambatan.min'      => 'Kesepakatan minimal 10 karakter.',
            ]);

            //  KRITIS: Simpan catatan_bk ke DB DULU sebelum canComplete() dicek.
            // canComplete() return false jika catatan_bk kosong, jadi harus update dulu.
            $laporan->update([
                'catatan_bk' => $validated['catatan_bk'],
                'aksi_bk'    => $validated['aksi_bk'] ?? null,
            ]);
            $laporan->refresh(); // reload dari DB agar canComplete() baca nilai terbaru

            if (!$laporan->canComplete()) {
                return back()->withErrors([
                    'complete' => 'Laporan tidak dapat diselesaikan (status: ' . $laporan->status_label . ')'
                ]);
            }

            DB::transaction(function () use ($laporan, $validated) {
                // Generate PDF rekam medis
                $pdfService = app(\App\Services\PdfRekamMedisService::class);
                $pdfPath = $pdfService->generate($laporan);
                
                // Mark as completed dengan deadline & kesepakatan
                $laporan->markAsCompleted(
                    auth()->id(), 
                    $pdfPath,
                    $validated['tanggal_batas_pelaksanaan'],
                    $validated['kesepakatan_keterlambatan']
                );

                Log::info('LaporanExpertSystemPoint completed with PDF and deadline', [
                    'laporan_id' => $laporan->id,
                    'completed_by' => auth()->id(),
                    'pdf_path' => $pdfPath,
                    'deadline' => $validated['tanggal_batas_pelaksanaan'],
                ]);
            });

            return redirect()->route('expert-system-point.index')
                ->with('success', 'Laporan berhasil diselesaikan! PDF rekam medis telah di-generate dan deadline ditetapkan.');

        } catch (\Illuminate\Validation\ValidationException $e) {
            return back()
                ->withErrors($e->errors())
                ->withInput();

        } catch (\Exception $e) {
            Log::error('ExpertSystemPointController@complete', [
                'laporan_id' => $laporan->id,
                'error' => $e->getMessage()
            ]);
            
            return back()->withErrors([
                'complete' => 'Gagal menyelesaikan laporan: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Download PDF rekam medis
     */
    public function downloadPdf(LaporanExpertSystemPoint $laporan)
    {
        try {
            $pdfService = app(\App\Services\PdfRekamMedisService::class);
            return $pdfService->download($laporan);

        } catch (\Exception $e) {
            Log::error('ExpertSystemPointController@downloadPdf', [
                'laporan_id' => $laporan->id,
                'error' => $e->getMessage()
            ]);
            
            return back()->withErrors([
                'download' => 'Gagal download PDF: ' . $e->getMessage()
            ]);
        }
    }

    /**
     *  NEW: View PDF in browser (inline)
     */
    public function viewPdf(LaporanExpertSystemPoint $laporan)
    {
        try {
            // Check if PDF exists
            if (!$laporan->pdf_path || !\Storage::disk('public')->exists($laporan->pdf_path)) {
                return back()->withErrors([
                    'view' => 'PDF tidak ditemukan. Silakan generate ulang.'
                ]);
            }

            // Get PDF path
            $pdfPath = storage_path('app/public/' . $laporan->pdf_path);

            // Check file exists
            if (!file_exists($pdfPath)) {
                return back()->withErrors([
                    'view' => 'File PDF tidak ditemukan di storage.'
                ]);
            }

            // Return PDF for inline view
            return response()->file($pdfPath, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'inline; filename="Rekam-Medis-' . $laporan->kode . '.pdf"'
            ]);

        } catch (\Exception $e) {
            Log::error('ExpertSystemPointController@viewPdf', [
                'laporan_id' => $laporan->id,
                'error' => $e->getMessage()
            ]);
            
            return back()->withErrors([
                'view' => 'Gagal membuka PDF: ' . $e->getMessage()
            ]);
        }
    }

    /**
     *  NEW: Download PDF Rekam Medis WITH Bukti Pelaksanaan (Approved)
     */
    public function downloadPdfWithBukti(LaporanExpertSystemPoint $laporan)
    {
        try {
            // Validate bukti approved
            if (!$laporan->bukti_approved) {
                return back()->withErrors([
                    'download' => 'Belum ada bukti yang diapprove. Export PDF lengkap tidak tersedia.'
                ]);
            }

            $pdfService = app(\App\Services\PdfRekamMedisService::class);
            return $pdfService->generateWithBukti($laporan);

        } catch (\Exception $e) {
            Log::error('ExpertSystemPointController@downloadPdfWithBukti', [
                'laporan_id' => $laporan->id,
                'error' => $e->getMessage()
            ]);
            
            return back()->withErrors([
                'download' => 'Gagal download PDF lengkap: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Delete laporan (only if pending)
     */
    public function destroy(LaporanExpertSystemPoint $laporan)
    {
        try {
            if ($laporan->status !== 'pending') {
                return back()->withErrors([
                    'delete' => 'Hanya laporan pending yang bisa dihapus.'
                ]);
            }

            DB::transaction(function () use ($laporan) {
                $laporan->delete();

                Log::info('LaporanExpertSystemPoint deleted', [
                    'laporan_id' => $laporan->id,
                    'deleted_by' => auth()->id(),
                ]);
            });

            return back()->with('success', 'Laporan berhasil dihapus!');

        } catch (\Exception $e) {
            Log::error('ExpertSystemPointController@destroy', [
                'laporan_id' => $laporan->id,
                'error' => $e->getMessage()
            ]);
            
            return back()->withErrors([
                'delete' => 'Gagal menghapus: ' . $e->getMessage()
            ]);
        }
    }

    // 
    // HELPER METHODS
    // 

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