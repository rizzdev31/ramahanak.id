<?php

namespace App\Http\Controllers;

use App\Models\LaporanApproval;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class LaporanWaliController extends Controller
{
    /**
     * Display pending approvals for current tenaga_pendidik
     */
    public function index(Request $request)
    {
        try {
            $tenagaPendidikId = auth()->id();
            $filter = $request->get('filter', 'pending');

            $query = LaporanApproval::query()
                ->where('tenaga_pendidik_id', $tenagaPendidikId)
                ->with([
                    'laporan' => function ($morphTo) {
                        $morphTo->morphWith([
                            \App\Models\LaporanPelanggaran::class => ['pelakuSantri.santriProfile', 'korbanSantri.santriProfile', 'variabelPelanggaran'],
                            \App\Models\LaporanApresiasi::class => ['santri.santriProfile', 'variabelApresiasi'],
                            \App\Models\LaporanKonselor::class => ['santri.santriProfile'],
                        ]);
                    },
                    'tenagaPendidik.tenagaPendidikProfile',
                    'tenagaPendidik.guruBkProfile',
                ]);

            // Apply filter
            if ($filter === 'pending') {
                $query->whereNull('approved_at');
            } elseif ($filter === 'approved') {
                $query->whereNotNull('approved_at');
            } elseif ($filter === 'overdue') {
                $query->whereNull('approved_at')
                      ->where('deadline_at', '<', now());
            }

            $approvals = $query->orderBy('created_at', 'desc')->paginate(15);

            // Calculate statistics
            $statistics = [
                'total' => LaporanApproval::where('tenaga_pendidik_id', $tenagaPendidikId)->count(),
                'pending' => LaporanApproval::where('tenaga_pendidik_id', $tenagaPendidikId)
                    ->whereNull('approved_at')->count(),
                'approved' => LaporanApproval::where('tenaga_pendidik_id', $tenagaPendidikId)
                    ->whereNotNull('approved_at')->count(),
                'overdue' => LaporanApproval::where('tenaga_pendidik_id', $tenagaPendidikId)
                    ->whereNull('approved_at')
                    ->where('deadline_at', '<', now())
                    ->count(),
            ];

            // Transform data
            $approvals->through(function ($approval) {
                $laporan = $approval->laporan;
                if (!$laporan) {
                    return null;
                }

                // Get santri based on laporan type
                $santri = null;
                $jenis = '';
                $kode = '';
                
                if ($laporan instanceof \App\Models\LaporanPelanggaran) {
                    $santri = $laporan->pelakuSantri;
                    $jenis = 'Pelanggaran';
                    $kode = $laporan->kode_pelanggaran;
                } elseif ($laporan instanceof \App\Models\LaporanApresiasi) {
                    $santri = $laporan->santri;
                    $jenis = 'Apresiasi';
                    $kode = $laporan->kode_apresiasi;
                } elseif ($laporan instanceof \App\Models\LaporanKonselor) {
                    $santri = $laporan->santri;
                    $jenis = 'Konselor';
                    $kode = $laporan->kode_konselor;
                }

                return [
                    'id' => $approval->id,
                    'laporan_type' => class_basename($laporan),
                    'laporan_id' => $laporan->id,
                    'jenis_laporan_label' => $jenis,
                    'catatan' => $approval->catatan,
                    'approved_at' => $approval->approved_at?->format('d/m/Y H:i'),
                    'deadline_at' => $approval->deadline_at?->format('d/m/Y H:i'),
                    'is_approved' => $approval->isApproved(),
                    'is_overdue' => $approval->isOverdue(),
                    'status_label' => $approval->status_label,
                    'status_badge_color' => $approval->status_badge_color,
                    'remaining_hours' => $approval->approved_at 
                        ? null 
                        : max(0, $approval->deadline_at->diffInHours(now(), false)),
                    
                    'santri' => $santri && $santri->santriProfile ? [
                        'id' => $santri->id,
                        'nama' => $santri->santriProfile->nama_panggilan 
                            ?? $santri->santriProfile->nama_lengkap,
                        'nisn' => $santri->santriProfile->nisn,
                    ] : null,
                    
                    'laporan' => [
                        'id' => $laporan->id,
                        'kode' => $kode,
                        'tanggal_kejadian' => $laporan->tanggal_kejadian?->format('d/m/Y'),
                        'approval_status' => $laporan->approval_status ?? null,
                        'approval_status_label' => $laporan->approval_status_label ?? null,
                        'approval_progress' => $laporan->approval_progress ?? 0,
                    ],
                ];
            });

            $approvals->setCollection(
                $approvals->getCollection()->filter()->values()
            );

            return Inertia::render('LaporanWali/Index', [
                'approvals' => $approvals,
                'statistics' => $statistics,
                'filter' => $filter,
            ]);

        } catch (\Exception $e) {
            Log::error('LaporanWaliController@index error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return Inertia::render('LaporanWali/Index', [
                'approvals' => ['data' => [], 'links' => [], 'total' => 0],
                'statistics' => ['total' => 0, 'pending' => 0, 'approved' => 0, 'overdue' => 0],
                'filter' => 'pending',
                'error' => 'Gagal memuat data approval'
            ]);
        }
    }

    /**
     * Show approval detail
     */
    public function show(LaporanApproval $approval)
    {
        try {
            // Verify access
            if ($approval->tenaga_pendidik_id !== auth()->id()) {
                abort(403, 'Unauthorized access');
            }

            $approval->load([
                'laporan' => function ($morphTo) {
                    $morphTo->morphWith([
                        \App\Models\LaporanPelanggaran::class => [
                            'pelakuSantri.santriProfile', 
                            'korbanSantri.santriProfile', 
                            'variabelPelanggaran',
                            'approvals.tenagaPendidik.tenagaPendidikProfile',
                            'approvals.tenagaPendidik.guruBkProfile',
                            'hasilPreprocessing.laporanAwal'
                        ],
                        \App\Models\LaporanApresiasi::class => [
                            'santri.santriProfile', 
                            'variabelApresiasi',
                            'approvals.tenagaPendidik.tenagaPendidikProfile',
                            'approvals.tenagaPendidik.guruBkProfile',
                            'hasilPreprocessing.laporanAwal'
                        ],
                        \App\Models\LaporanKonselor::class => [
                            'santri.santriProfile',
                            'approvals.tenagaPendidik.tenagaPendidikProfile',
                            'approvals.tenagaPendidik.guruBkProfile',
                            'hasilPreprocessing.laporanAwal'
                        ],
                    ]);
                },
                'tenagaPendidik.tenagaPendidikProfile',
            ]);

            $laporan = $approval->laporan;
            
            // Get santri based on type
            $santri = null;
            $jenis = '';
            $kode = '';
            $detail = [];
            
            if ($laporan instanceof \App\Models\LaporanPelanggaran) {
                $santri = $laporan->pelakuSantri;
                $jenis = 'Pelanggaran';
                $kode = $laporan->kode_pelanggaran;
                $detail = [
                    'kode_pelanggaran' => $laporan->kode_pelanggaran,
                    'bobot_poin' => $laporan->bobot_poin,
                    'tindakan_default' => $laporan->tindakan_default,
                    'pelaku' => $laporan->pelakuSantri && $laporan->pelakuSantri->santriProfile ? [
                        'nama' => $laporan->pelakuSantri->santriProfile->nama_panggilan,
                        'nisn' => $laporan->pelakuSantri->santriProfile->nisn,
                    ] : null,
                    'korban' => $laporan->korbanSantri && $laporan->korbanSantri->santriProfile ? [
                        'nama' => $laporan->korbanSantri->santriProfile->nama_panggilan,
                        'nisn' => $laporan->korbanSantri->santriProfile->nisn,
                    ] : null,
                ];
            } elseif ($laporan instanceof \App\Models\LaporanApresiasi) {
                $santri = $laporan->santri;
                $jenis = 'Apresiasi';
                $kode = $laporan->kode_apresiasi;
                $detail = [
                    'kode_apresiasi' => $laporan->kode_apresiasi,
                    'bobot_poin' => $laporan->bobot_poin,
                    'reward_default' => $laporan->reward_default,
                ];
            } elseif ($laporan instanceof \App\Models\LaporanKonselor) {
                $santri = $laporan->santri;
                $jenis = 'Konselor';
                $kode = $laporan->kode_konselor;
                $detail = [
                    'kode_konselor' => $laporan->kode_konselor,
                    'diagnosis_default' => $laporan->diagnosis_default,
                    'tindakan_default' => $laporan->tindakan_default,
                ];
            }

            return Inertia::render('LaporanWali/Show', [
                'approval' => [
                    'id' => $approval->id,
                    'jenis_laporan_label' => $jenis,
                    'catatan' => $approval->catatan,
                    'approved_at' => $approval->approved_at?->format('d/m/Y H:i'),
                    'deadline_at' => $approval->deadline_at?->format('d/m/Y H:i'),
                    'is_approved' => $approval->isApproved(),
                    'is_overdue' => $approval->isOverdue(),
                    'status_label' => $approval->status_label,
                    'status_badge_color' => $approval->status_badge_color,
                    
                    'santri' => $santri && $santri->santriProfile ? [
                        'nama' => $santri->santriProfile->nama_panggilan ?? $santri->santriProfile->nama_lengkap,
                        'nisn' => $santri->santriProfile->nisn,
                    ] : null,
                    
                    'laporan' => array_merge($detail, [
                        'tanggal_kejadian' => $laporan->tanggal_kejadian?->format('d/m/Y'),
                        'approval_status' => $laporan->approval_status,
                        'approval_status_label' => $laporan->approval_status_label,
                        'approval_progress' => $laporan->approval_progress,
                        'approvals' => $laporan->approvals->map(function ($a) {
                            return [
                                'id' => $a->id,
                                'tenaga_pendidik_nama' => $a->tenagaPendidik->tenagaPendidikProfile->nama_lengkap
                                    ?? $a->tenagaPendidik->guruBkProfile->nama_lengkap
                                    ?? $a->tenagaPendidik->name,
                                'tenaga_pendidik_role' => $a->tenagaPendidik->role === 'guru_bk' ? 'Guru BK' : 'Tenaga Pendidik',
                                'catatan' => $a->catatan,
                                'approved_at' => $a->approved_at?->format('d/m/Y H:i'),
                                'deadline_at' => $a->deadline_at?->format('d/m/Y H:i'),
                                'is_approved' => $a->isApproved(),
                                'is_overdue' => $a->isOverdue(),
                                'status_label' => $a->status_label,
                                'status_badge_color' => $a->status_badge_color,
                            ];
                        }),
                        'laporan_awal' => $laporan->hasilPreprocessing->laporanAwal ?? null,
                    ]),
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('LaporanWaliController@show error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return back()->with('error', 'Gagal memuat detail approval');
        }
    }

    /**
     * Submit approval
     * ✅ ENHANCED: Add more logging
     */
    public function approve(Request $request, LaporanApproval $approval)
    {
        $validated = $request->validate([
            'catatan' => 'required|string|max:1000',
        ]);

        try {
            // Verify access
            if ($approval->tenaga_pendidik_id !== auth()->id()) {
                abort(403, 'Unauthorized access');
            }

            // Check if already approved
            if ($approval->isApproved()) {
                return back()->withErrors(['approve' => 'Approval sudah disubmit sebelumnya']);
            }

            DB::transaction(function () use ($approval, $validated) {
                // ✅ ENHANCED: Log before update
                Log::info('Starting approval process', [
                    'approval_id' => $approval->id,
                    'laporan_id' => $approval->laporan_id,
                    'laporan_type' => $approval->laporan_type,
                    'tenaga_pendidik_id' => auth()->id(),
                ]);

                // Update approval
                $approval->update([
                    'catatan' => $validated['catatan'],
                    'approved_at' => now(),
                ]);

                // ✅ ENHANCED: Log after approval update
                Log::info('Approval updated', [
                    'approval_id' => $approval->id,
                    'approved_at' => $approval->approved_at,
                ]);

                // Check if all approvals complete
                $laporan = $approval->laporan;
                
                // ✅ ENHANCED: Log laporan info
                Log::info('Checking laporan status', [
                    'laporan_id' => $laporan->id,
                    'laporan_type' => get_class($laporan),
                    'current_approval_status' => $laporan->approval_status,
                ]);

                $this->checkAndUpdateLaporanStatus($laporan);

                // ✅ ENHANCED: Log after check
                $laporan->refresh();
                Log::info('After checkAndUpdateLaporanStatus', [
                    'laporan_id' => $laporan->id,
                    'new_approval_status' => $laporan->approval_status,
                ]);
            });

            return redirect()->route('laporan-wali.index')->with('success', 'Approval berhasil disubmit!');

        } catch (\Exception $e) {
            Log::error('LaporanWaliController@approve error', [
                'approval_id' => $approval->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return back()->withErrors(['approve' => 'Gagal submit approval: ' . $e->getMessage()]);
        }
    }

    /**
     * Check and update laporan status if all approvals complete
     * ✅ ENHANCED: Add extensive logging
     */
    private function checkAndUpdateLaporanStatus($laporan)
    {
        if (!$laporan) {
            Log::warning('checkAndUpdateLaporanStatus: Laporan is null');
            return;
        }

        // Get laporan type and id
        $laporanType = get_class($laporan);
        $laporanId = $laporan->id;

        Log::info('checkAndUpdateLaporanStatus called', [
            'laporan_type' => $laporanType,
            'laporan_id' => $laporanId,
            'current_status' => $laporan->approval_status,
        ]);

        // Check if all approved
        $isAllApproved = LaporanApproval::isAllApproved($laporanType, $laporanId);
        
        Log::info('isAllApproved result', [
            'laporan_id' => $laporanId,
            'is_all_approved' => $isAllApproved,
        ]);

        if ($isAllApproved) {
            // Update status
            $updated = $laporan->update([
                'approval_status' => 'pending_bk'
            ]);

            Log::info('Laporan status update attempted', [
                'laporan_type' => $laporanType,
                'laporan_id' => $laporanId,
                'update_result' => $updated,
                'new_status' => $laporan->fresh()->approval_status,
            ]);
        } else {
            Log::info('Not all approved yet', [
                'laporan_id' => $laporanId,
                'total_approvals' => LaporanApproval::getTotalForLaporan($laporanType, $laporanId),
                'approved_count' => LaporanApproval::getApprovedCountForLaporan($laporanType, $laporanId),
            ]);
        }
    }
}