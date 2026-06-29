<?php

namespace App\Http\Controllers;

use App\Models\LaporanApresiasi;
use App\Models\RiwayatSantri;
use App\Models\VariabelApresiasi;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class LaporanApresiasiController extends Controller
{
    /**
     * Display list laporan apresiasi
     *  UPDATED: Add approvals eager load & approval_status filter
     */
    public function index(Request $request)
    {
        try {
            $query = LaporanApresiasi::query()
                ->with([
                    'hasilPreprocessing.laporanAwal',
                    'santri.santriProfile',
                    'validator',
                    'variabelApresiasi',
                    //  NEW: Eager load approvals
                    'approvals.tenagaPendidik.tenagaPendidikProfile',
                    'approvals.tenagaPendidik.guruBkProfile',
                ])
                ->orderBy('created_at', 'desc');

            //  UPDATED: Filter by approval_status (instead of just status)
            $approvalStatus = $request->get('approval_status', 'all');
            if ($approvalStatus && $approvalStatus !== 'all') {
                $query->where('approval_status', $approvalStatus);
            }

            // Keep old status filter for backward compatibility
            $status = $request->get('status', 'all');
            if ($status && $status !== 'all') {
                $query->where('status', $status);
            }

            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('kode_apresiasi', 'like', "%{$search}%")
                      ->orWhereHas('santri.santriProfile', function($q) use ($search) {
                          $q->where('nama_panggilan', 'like', "%{$search}%")
                            ->orWhere('nama_lengkap', 'like', "%{$search}%");
                      });
                });
            }

            $laporanList = $query->paginate(15);
            $laporanList->through(function ($item) {
                // Laporan dari API integrasi (Smart Eksekusi) tidak punya hasilPreprocessing.
                return [
                    'id' => $item->id,
                    'sumber_input' => $item->sumber_input,
                    'kode_apresiasi' => $item->kode_apresiasi,
                    'bobot_poin' => $item->bobot_poin,
                    'reward_default' => $item->reward_default,
                    'catatan_bk' => $item->catatan_bk,
                    'tanggal_kejadian' => $item->tanggal_kejadian?->format('d/m/Y'),
                    'tanggal_reward' => $item->tanggal_reward?->format('d/m/Y'),
                    'status' => $item->status,
                    'status_badge' => $item->status_badge,
                    'status_label' => $item->status_label,
                    
                    //  NEW: Approval info
                    'approval_status' => $item->approval_status,
                    'approval_status_label' => $item->approval_status_label,
                    'approval_status_badge' => $item->approval_status_badge,
                    'approval_progress' => $item->approval_progress,
                    'has_overdue_approvals' => $item->hasOverdueApprovals(),
                    
                    //  NEW: Approvals list
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
                    
                    'santri' => $item->santri && $item->santri->santriProfile ? [
                        'id' => $item->santri->id,
                        'nama' => $item->santri->santriProfile->nama_panggilan 
                            ?? $item->santri->santriProfile->nama_lengkap,
                        'nisn' => $item->santri->santriProfile->nisn,
                    ] : null,
                    
                    'variabel' => $item->variabelApresiasi ? [
                        'kategori' => $item->variabelApresiasi->kategori,
                        'keterangan' => $item->variabelApresiasi->keterangan,
                    ] : null,
                    
                    'laporan_awal' => $item->hasilPreprocessing ? [
                        'id' => $item->hasilPreprocessing->laporan_awal_id,
                        'text_laporan' => $item->hasilPreprocessing->laporanAwal->text_laporan ?? '',
                    ] : null,

                    'validated_at' => $item->validated_at?->format('d/m/Y H:i'),
                    'created_at' => $item->created_at?->format('d/m/Y H:i'),
                ];
            });

            $laporanList->setCollection($laporanList->getCollection()->filter()->values());

            return Inertia::render('LaporanApresiasi/Index', [
                'laporanList' => $laporanList,
                'filters' => [
                    'status' => $status,
                    'approval_status' => $approvalStatus, //  NEW
                    'search' => $request->search,
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('LaporanApresiasiController@index error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return Inertia::render('LaporanApresiasi/Index', [
                'laporanList' => ['data' => [], 'links' => [], 'total' => 0],
                'filters' => ['status' => 'all', 'approval_status' => 'all', 'search' => ''],
                'error' => 'Gagal memuat data laporan apresiasi'
            ]);
        }
    }


    /**
     * Show detail laporan apresiasi
     */
    public function show(LaporanApresiasi $laporan)
    {
        $laporan->load([
            'hasilPreprocessing.laporanAwal.pelapor',
            'santri.santriProfile',
            'validator',
            'variabelApresiasi',
            'approvals.tenagaPendidik.tenagaPendidikProfile',
            'approvals.tenagaPendidik.guruBkProfile',
        ]);

        return Inertia::render('LaporanApresiasi/Show', [
            'laporan' => [
                'id'                    => $laporan->id,
                'kode_apresiasi'        => $laporan->kode_apresiasi,
                'bobot_poin'            => $laporan->bobot_poin,
                'reward_default'        => $laporan->reward_default,
                'catatan_bk'            => $laporan->catatan_bk,
                'tanggal_kejadian'      => $laporan->tanggal_kejadian?->format('d/m/Y'),
                'tanggal_reward'        => $laporan->tanggal_reward?->format('d/m/Y'),
                'status'                => $laporan->status,
                'status_label'          => $laporan->status_label,
                'approval_status'       => $laporan->approval_status,
                'approval_status_label' => $laporan->approval_status_label,
                'approval_progress'     => $laporan->approval_progress,
                'has_overdue_approvals' => $laporan->hasOverdueApprovals(),
                'validated_at'          => $laporan->validated_at?->format('d/m/Y H:i'),
                'created_at'            => $laporan->created_at?->format('d/m/Y H:i'),
                'approvals' => $laporan->approvals->map(fn($a) => [
                    'id'                   => $a->id,
                    'tenaga_pendidik_nama' => $a->tenagaPendidik->tenagaPendidikProfile->nama_lengkap
                                          ?? $a->tenagaPendidik->guruBkProfile->nama_lengkap
                                          ?? 'Unknown',
                    'catatan'              => $a->catatan,
                    'approved_at'          => $a->approved_at?->format('d/m/Y H:i'),
                    'is_overdue'           => $a->isOverdue(),
                    'status_label'         => $a->status_label,
                ]),
                'santri' => $laporan->santri?->santriProfile ? [
                    'id'   => $laporan->santri->id,
                    'nama' => $laporan->santri->santriProfile->nama_panggilan
                           ?? $laporan->santri->santriProfile->nama_lengkap,
                    'nisn' => $laporan->santri->santriProfile->nisn,
                    'foto' => $laporan->santri->santriProfile->foto
                           ? "/storage/{$laporan->santri->santriProfile->foto}" : null,
                ] : null,
                'variabel' => $laporan->variabelApresiasi ? [
                    'kode'       => $laporan->variabelApresiasi->kode_apresiasi,
                    'kategori'   => $laporan->variabelApresiasi->kategori,
                    'keterangan' => $laporan->variabelApresiasi->keterangan,
                ] : null,
                'laporan_awal' => $laporan->hasilPreprocessing?->laporanAwal ? [
                    'id'           => $laporan->hasilPreprocessing->laporan_awal_id,
                    'text_laporan' => $laporan->hasilPreprocessing->laporanAwal->text_laporan ?? '',
                ] : null,
                'validator' => $laporan->validator ? [
                    'nama' => $laporan->validator->guruBkProfile?->nama_lengkap
                           ?? $laporan->validator->username,
                ] : null,
            ],
        ]);
    }

    /**
     * Update catatan BK
     */
    public function update(Request $request, LaporanApresiasi $laporan)
    {
        $validated = $request->validate([
            'catatan_bk' => 'nullable|string|max:1000',
            'status' => 'nullable|in:pending,diberikan,ditunda',
        ]);

        try {
            DB::transaction(function () use ($laporan, $validated) {
                $laporan->update($validated);

                Log::info('Laporan apresiasi updated', [
                    'laporan_id' => $laporan->id,
                    'updated_by' => auth()->id(),
                ]);
            });

            return back()->with('success', 'Laporan apresiasi berhasil diupdate');

        } catch (\Exception $e) {
            Log::error('Failed to update laporan apresiasi', [
                'laporan_id' => $laporan->id,
                'error' => $e->getMessage()
            ]);

            return back()->with('error', 'Gagal update laporan: ' . $e->getMessage());
        }
    }

    /**
     * Complete laporan apresiasi dan berikan reward
     *  UPDATED: Add approval status check
     */
    public function complete(Request $request, LaporanApresiasi $laporan)
    {
        $validated = $request->validate([
            'catatan_bk' => 'nullable|string|max:1000',
        ]);

        try {
            //  NEW: Check approval_status
            if ($laporan->approval_status !== 'pending_bk') {
                return back()->withErrors([
                    'complete' => 'Laporan belum mendapat approval dari semua Wali Kelas/Asrama. Status saat ini: ' . $laporan->approval_status_label
                ]);
            }

            if ($laporan->status === 'diberikan' || $laporan->approval_status === 'diberikan') {
                return back()->withErrors([
                    'complete' => 'Reward sudah diberikan sebelumnya'
                ]);
            }

            DB::transaction(function () use ($laporan, $validated) {
                $laporan->update([
                    'catatan_bk' => $validated['catatan_bk'] ?? $laporan->catatan_bk,
                    'status' => 'diberikan',
                    'approval_status' => 'diberikan', //  NEW
                    'tanggal_reward' => now(),
                    'validated_by' => auth()->id(),
                    'validated_at' => now(),
                ]);

                $ringkasan = "Apresiasi {$laporan->kode_apresiasi}: {$laporan->reward_default}";

                RiwayatSantri::create([
                    'santri_id' => $laporan->santri_id,
                    'laporan_apresiasi_id' => $laporan->id,
                    'jenis_laporan' => 'apresiasi',
                    'kode' => $laporan->kode_apresiasi,
                    'bobot_poin' => $laporan->bobot_poin,
                    'tanggal_kejadian' => $laporan->tanggal_kejadian,
                    'status' => 'diberikan',
                    'ringkasan' => $ringkasan,
                ]);

                Log::info('Laporan apresiasi completed & saved to riwayat', [
                    'laporan_id' => $laporan->id,
                    'santri_id' => $laporan->santri_id,
                    'completed_by' => auth()->id(),
                ]);
            });

            //  TRIGGER: Check threshold expert system point
            if ($laporan->santri_id) {
                try {
                    $expertSystemService = app(\App\Services\ExpertSystemPointService::class);
                    $triggered = $expertSystemService->checkThreshold($laporan->santri_id);

                    $totalTriggered = count($triggered['konsekuensi']) + count($triggered['reward']);
                    if ($totalTriggered > 0) {
                        Log::info('Expert system point triggered from apresiasi', [
                            'santri_id' => $laporan->santri_id,
                            'triggered_count' => $totalTriggered,
                            'konsekuensi' => count($triggered['konsekuensi']),
                            'reward' => count($triggered['reward']),
                        ]);
                    }
                } catch (\Exception $e) {
                    Log::error('Expert system check failed (non-critical)', [
                        'santri_id' => $laporan->santri_id,
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            return back()->with('success', 'Reward diberikan dan tersimpan ke riwayat santri!');

        } catch (\Exception $e) {
            Log::error('Failed to complete laporan apresiasi', [
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
     * Delete laporan apresiasi
     */
    public function destroy(LaporanApresiasi $laporan)
    {
        try {
            if ($laporan->status === 'diberikan' || $laporan->approval_status === 'diberikan') {
                return back()->withErrors([
                    'delete' => 'Tidak dapat menghapus laporan yang sudah diberikan'
                ]);
            }

            $laporan->delete();

            Log::info('Laporan apresiasi deleted', [
                'laporan_id' => $laporan->id,
                'deleted_by' => auth()->id(),
            ]);

            return back()->with('success', 'Laporan apresiasi berhasil dihapus');

        } catch (\Exception $e) {
            Log::error('Failed to delete laporan apresiasi', [
                'laporan_id' => $laporan->id,
                'error' => $e->getMessage()
            ]);

            return back()->withErrors([
                'delete' => 'Gagal menghapus laporan: ' . $e->getMessage()
            ]);
        }
    }
}