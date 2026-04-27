<?php

namespace App\Http\Controllers;

use App\Models\LaporanPelanggaran;
use App\Models\RiwayatSantri;
use App\Models\VariabelPelanggaran;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class LaporanPelanggaranController extends Controller
{
    /**
     * Display laporan pelanggaran (index)
     * ✅ UPDATED: Add approvals eager load & approval_status filter
     */
    public function index(Request $request)
    {
        try {
            $query = LaporanPelanggaran::query()
                ->with([
                    'hasilPreprocessing.laporanAwal',
                    'pelakuSantri.santriProfile',
                    'korbanSantri.santriProfile',
                    'validator',
                    'variabelPelanggaran',
                    // ✅ NEW: Eager load approvals
                    'approvals.tenagaPendidik.tenagaPendidikProfile',
                    'approvals.tenagaPendidik.guruBkProfile',
                ])
                ->orderBy('created_at', 'desc');

            // ✅ UPDATED: Filter by approval_status (instead of just status)
            $approvalStatus = $request->get('approval_status', 'all');
            if ($approvalStatus && $approvalStatus !== 'all') {
                $query->where('approval_status', $approvalStatus);
            }

            // Keep old status filter for backward compatibility
            $status = $request->get('status', 'all');
            if ($status && $status !== 'all') {
                $query->where('status', $status);
            }

            // Search
            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('kode_pelanggaran', 'like', "%{$search}%")
                      ->orWhereHas('pelakuSantri.santriProfile', function($q) use ($search) {
                          $q->where('nama_panggilan', 'like', "%{$search}%")
                            ->orWhere('nama_lengkap', 'like', "%{$search}%");
                      })
                      ->orWhereHas('korbanSantri.santriProfile', function($q) use ($search) {
                          $q->where('nama_panggilan', 'like', "%{$search}%")
                            ->orWhere('nama_lengkap', 'like', "%{$search}%");
                      });
                });
            }

            $laporanList = $query->paginate(15);

            // Transform data
            $laporanList->through(function ($item) {
                if (!$item->hasilPreprocessing) {
                    return null;
                }

                return [
                    'id' => $item->id,
                    'kode_pelanggaran' => $item->kode_pelanggaran,
                    'bobot_poin' => $item->bobot_poin,
                    'tindakan_default' => $item->tindakan_default,
                    'catatan_bk' => $item->catatan_bk,
                    'tanggal_kejadian' => $item->tanggal_kejadian?->format('d/m/Y'),
                    'tanggal_tindakan' => $item->tanggal_tindakan?->format('d/m/Y'),
                    'status' => $item->status,
                    'status_badge' => $item->status_badge,
                    'status_label' => $item->status_label,
                    
                    // ✅ NEW: Approval info
                    'approval_status' => $item->approval_status,
                    'approval_status_label' => $item->approval_status_label,
                    'approval_status_badge' => $item->approval_status_badge,
                    'approval_progress' => $item->approval_progress,
                    'has_overdue_approvals' => $item->hasOverdueApprovals(),
                    
                    // ✅ NEW: Approvals list
                    'approvals' => $item->approvals->map(function ($approval) {
                        return [
                            'id' => $approval->id,
                            'tenaga_pendidik_nama' => $approval->tenagaPendidik->tenagaPendidikProfile->nama_lengkap
                                ?? $approval->tenagaPendidik->guruBkProfile->nama_lengkap
                                ?? 'Unknown',
                            'catatan' => $approval->catatan,
                            'approved_at' => $approval->approved_at?->format('d/m/Y H:i'),
                            'is_overdue' => $approval->isOverdue(),
                            'status_label' => $approval->status_label,
                        ];
                    }),
                    
                    // Pelaku
                    'pelaku' => $item->pelakuSantri && $item->pelakuSantri->santriProfile ? [
                        'id' => $item->pelakuSantri->id,
                        'nama' => $item->pelakuSantri->santriProfile->nama_panggilan 
                            ?? $item->pelakuSantri->santriProfile->nama_lengkap,
                        'nisn' => $item->pelakuSantri->santriProfile->nisn,
                    ] : null,
                    
                    // Korban
                    'korban' => $item->korbanSantri && $item->korbanSantri->santriProfile ? [
                        'id' => $item->korbanSantri->id,
                        'nama' => $item->korbanSantri->santriProfile->nama_panggilan 
                            ?? $item->korbanSantri->santriProfile->nama_lengkap,
                        'nisn' => $item->korbanSantri->santriProfile->nisn,
                    ] : null,
                    
                    // Variabel
                    'variabel' => $item->variabelPelanggaran ? [
                        'kategori' => $item->variabelPelanggaran->kategori,
                        'keterangan' => $item->variabelPelanggaran->keterangan,
                    ] : null,
                    
                    // Laporan awal
                    'laporan_awal' => [
                        'id' => $item->hasilPreprocessing->laporan_awal_id,
                        'text_laporan' => $item->hasilPreprocessing->laporanAwal->text_laporan ?? '',
                    ],
                    
                    'validated_at' => $item->validated_at?->format('d/m/Y H:i'),
                    'created_at' => $item->created_at?->format('d/m/Y H:i'),
                ];
            });

            // Filter null
            $laporanList->setCollection(
                $laporanList->getCollection()->filter()
            );

            return Inertia::render('LaporanPelanggaran/Index', [
                'laporanList' => $laporanList,
                'filters' => [
                    'status' => $status,
                    'approval_status' => $approvalStatus, // ✅ NEW
                    'search' => $request->search,
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('LaporanPelanggaranController@index error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return Inertia::render('LaporanPelanggaran/Index', [
                'laporanList' => ['data' => [], 'links' => [], 'total' => 0],
                'filters' => ['status' => 'all', 'approval_status' => 'all', 'search' => ''],
                'error' => 'Gagal memuat data laporan pelanggaran'
            ]);
        }
    }

    /**
     * Show detail laporan pelanggaran
     * ✅ UPDATED: Add approvals eager load
     */
    public function show(LaporanPelanggaran $laporan)
    {
        $laporan->load([
            'hasilPreprocessing.laporanAwal.pelapor',
            'pelakuSantri.santriProfile',
            'korbanSantri.santriProfile',
            'validator',
            'variabelPelanggaran',
            // ✅ NEW: Load approvals
            'approvals.tenagaPendidik.tenagaPendidikProfile',
            'approvals.tenagaPendidik.guruBkProfile',
        ]);

        return Inertia::render('LaporanPelanggaran/Show', [
            'laporan' => [
                'id' => $laporan->id,
                'kode_pelanggaran' => $laporan->kode_pelanggaran,
                'bobot_poin' => $laporan->bobot_poin,
                'tindakan_default' => $laporan->tindakan_default,
                'catatan_bk' => $laporan->catatan_bk,
                'tanggal_kejadian' => $laporan->tanggal_kejadian?->format('d/m/Y'),
                'tanggal_tindakan' => $laporan->tanggal_tindakan?->format('d/m/Y'),
                'status' => $laporan->status,
                
                // ✅ NEW: Approval info
                'approval_status' => $laporan->approval_status,
                'approval_status_label' => $laporan->approval_status_label,
                'approval_progress' => $laporan->approval_progress,
                'has_overdue_approvals' => $laporan->hasOverdueApprovals(),
                
                // ✅ NEW: Approvals timeline
                'approvals' => $laporan->approvals->map(function ($approval) {
                    return [
                        'id' => $approval->id,
                        'tenaga_pendidik_nama' => $approval->tenagaPendidik->tenagaPendidikProfile->nama_lengkap
                            ?? $approval->tenagaPendidik->guruBkProfile->nama_lengkap
                            ?? 'Unknown',
                        'tenaga_pendidik_role' => $approval->tenagaPendidik->role === 'guru_bk' ? 'Guru BK' : 'Tenaga Pendidik',
                        'catatan' => $approval->catatan,
                        'approved_at' => $approval->approved_at?->format('d/m/Y H:i'),
                        'deadline_at' => $approval->deadline_at?->format('d/m/Y H:i'),
                        'is_overdue' => $approval->isOverdue(),
                        'is_approved' => $approval->isApproved(),
                        'status_label' => $approval->status_label,
                        'status_badge_color' => $approval->status_badge_color,
                    ];
                }),
                
                'pelaku' => $laporan->pelakuSantri && $laporan->pelakuSantri->santriProfile ? [
                    'id' => $laporan->pelakuSantri->id,
                    'nama' => $laporan->pelakuSantri->santriProfile->nama_panggilan,
                    'nisn' => $laporan->pelakuSantri->santriProfile->nisn,
                ] : null,
                'korban' => $laporan->korbanSantri && $laporan->korbanSantri->santriProfile ? [
                    'id' => $laporan->korbanSantri->id,
                    'nama' => $laporan->korbanSantri->santriProfile->nama_panggilan,
                    'nisn' => $laporan->korbanSantri->santriProfile->nisn,
                ] : null,
                'variabel' => $laporan->variabelPelanggaran,
                'laporan_awal' => $laporan->hasilPreprocessing->laporanAwal,
            ],
        ]);
    }

    /**
     * Update catatan BK
     */
    public function update(Request $request, LaporanPelanggaran $laporan)
    {
        $validated = $request->validate([
            'catatan_bk' => 'nullable|string|max:1000',
            'status' => 'nullable|in:pending,dalam_proses,selesai,diabaikan',
        ]);

        try {
            DB::transaction(function () use ($laporan, $validated) {
                $laporan->update($validated);

                Log::info('Laporan pelanggaran updated', [
                    'laporan_id' => $laporan->id,
                    'updated_by' => auth()->id(),
                ]);
            });

            return back()->with('success', 'Laporan pelanggaran berhasil diupdate');

        } catch (\Exception $e) {
            Log::error('Failed to update laporan pelanggaran', [
                'laporan_id' => $laporan->id,
                'error' => $e->getMessage()
            ]);

            return back()->with('error', 'Gagal update laporan: ' . $e->getMessage());
        }
    }

    /**
     * Complete/Approve laporan & save to riwayat santri
     * ✅ UPDATED: Add approval status check
     */
    public function complete(Request $request, LaporanPelanggaran $laporan)
    {
        $validated = $request->validate([
            'catatan_bk' => 'nullable|string|max:1000',
        ]);

        try {
            // ✅ NEW: Check approval_status
            if ($laporan->approval_status !== 'pending_bk') {
                return back()->withErrors([
                    'complete' => 'Laporan belum mendapat approval dari semua Wali Kelas/Asrama. Status saat ini: ' . $laporan->approval_status_label
                ]);
            }

            if ($laporan->status === 'selesai' || $laporan->approval_status === 'selesai') {
                return back()->withErrors([
                    'complete' => 'Laporan sudah diselesaikan sebelumnya'
                ]);
            }

            DB::transaction(function () use ($laporan, $validated) {
                // ═══════════════════════════════════════════════════════════
                // 1. Update laporan status
                // ═══════════════════════════════════════════════════════════
                $laporan->update([
                    'catatan_bk' => $validated['catatan_bk'] ?? $laporan->catatan_bk,
                    'status' => 'selesai',
                    'approval_status' => 'selesai', // ✅ NEW
                    'tanggal_tindakan' => now(),
                    'validated_by' => auth()->id(),
                    'validated_at' => now(),
                ]);

                // ═══════════════════════════════════════════════════════════
                // 2. Save to riwayat_santri (untuk pelaku & korban)
                // ═══════════════════════════════════════════════════════════
                $ringkasan = "Pelanggaran {$laporan->kode_pelanggaran}: {$laporan->tindakan_default}";

                // Save untuk pelaku
                if ($laporan->pelaku_santri_id) {
                    RiwayatSantri::create([
                        'santri_id' => $laporan->pelaku_santri_id,
                        'laporan_pelanggaran_id' => $laporan->id,
                        'jenis_laporan' => 'pelanggaran',
                        'kode' => $laporan->kode_pelanggaran,
                        'bobot_poin' => $laporan->bobot_poin,
                        'tanggal_kejadian' => $laporan->tanggal_kejadian,
                        'status' => 'selesai',
                        'ringkasan' => $ringkasan . ' (sebagai pelaku)',
                    ]);
                }

                // Save untuk korban (tanpa poin)
                if ($laporan->korban_santri_id) {
                    RiwayatSantri::create([
                        'santri_id' => $laporan->korban_santri_id,
                        'laporan_pelanggaran_id' => $laporan->id,
                        'jenis_laporan' => 'pelanggaran',
                        'kode' => $laporan->kode_pelanggaran,
                        'bobot_poin' => null,  // Korban tidak dapat poin
                        'tanggal_kejadian' => $laporan->tanggal_kejadian,
                        'status' => 'selesai',
                        'ringkasan' => $ringkasan . ' (sebagai korban)',
                    ]);
                }

                Log::info('Laporan pelanggaran completed & saved to riwayat', [
                    'laporan_id' => $laporan->id,
                    'pelaku_id' => $laporan->pelaku_santri_id,
                    'korban_id' => $laporan->korban_santri_id,
                    'completed_by' => auth()->id(),
                ]);
            });

            // ═══════════════════════════════════════════════════════════
            // 3. ✅ TRIGGER: Check threshold expert system point (K/R)
            // ═══════════════════════════════════════════════════════════
            if ($laporan->pelaku_santri_id) {
                try {
                    $expertSystemService = app(\App\Services\ExpertSystemPointService::class);
                    $triggered = $expertSystemService->checkThreshold($laporan->pelaku_santri_id);

                    $totalTriggered = count($triggered['konsekuensi']) + count($triggered['reward']);
                    if ($totalTriggered > 0) {
                        Log::info('Expert system point triggered from pelanggaran', [
                            'santri_id' => $laporan->pelaku_santri_id,
                            'triggered_count' => $totalTriggered,
                            'konsekuensi' => count($triggered['konsekuensi']),
                            'reward' => count($triggered['reward']),
                        ]);
                    }
                } catch (\Exception $e) {
                    // Don't fail complete if expert system check fails
                    Log::error('Expert system check failed (non-critical)', [
                        'santri_id' => $laporan->pelaku_santri_id,
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            // ═══════════════════════════════════════════════════════════
            // 4. ✅ TRIGGER: Forward Chaining — cek rule expert konselor
            //    FIX: Sebelumnya tidak ada trigger ini sehingga laporan
            //    expert system konselor tidak pernah dibuat otomatis.
            //    Cek untuk pelaku DAN korban karena keduanya bisa match
            //    rule kategori Pelaku (RB) maupun Korban (RA).
            // ═══════════════════════════════════════════════════════════
            try {
                $forwardChaining = app(\App\Services\ForwardChainingService::class);

                // Kumpulkan santri yang perlu dicek
                $santriToCheck = array_filter([
                    $laporan->pelaku_santri_id,
                    $laporan->korban_santri_id,
                ]);

                foreach ($santriToCheck as $santriId) {
                    $fcResult = $forwardChaining->checkForSantri($santriId);

                    if ($fcResult['laporan_created'] > 0) {
                        Log::info('ForwardChaining triggered from pelanggaran complete', [
                            'santri_id'       => $santriId,
                            'laporan_created' => $fcResult['laporan_created'],
                            'laporan_id'      => $laporan->id,
                        ]);
                    }
                }
            } catch (\Exception $e) {
                // Non-blocking: jangan gagalkan proses utama
                Log::error('ForwardChaining check failed (non-critical)', [
                    'laporan_id' => $laporan->id,
                    'error'      => $e->getMessage(),
                ]);
            }

            return back()->with('success', 'Laporan pelanggaran diselesaikan dan tersimpan ke riwayat santri!');

        } catch (\Exception $e) {
            Log::error('Failed to complete laporan pelanggaran', [
                'laporan_id' => $laporan->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return back()->withErrors([
                'complete' => 'Gagal menyelesaikan laporan: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Delete laporan (optional, jika diperlukan)
     */
    public function destroy(LaporanPelanggaran $laporan)
    {
        try {
            if ($laporan->status === 'selesai' || $laporan->approval_status === 'selesai') {
                return back()->withErrors([
                    'delete' => 'Tidak dapat menghapus laporan yang sudah selesai'
                ]);
            }

            $laporan->delete();

            Log::info('Laporan pelanggaran deleted', [
                'laporan_id' => $laporan->id,
                'deleted_by' => auth()->id(),
            ]);

            return back()->with('success', 'Laporan pelanggaran berhasil dihapus');

        } catch (\Exception $e) {
            Log::error('Failed to delete laporan pelanggaran', [
                'laporan_id' => $laporan->id,
                'error' => $e->getMessage()
            ]);

            return back()->withErrors([
                'delete' => 'Gagal menghapus laporan: ' . $e->getMessage()
            ]);
        }
    }
}