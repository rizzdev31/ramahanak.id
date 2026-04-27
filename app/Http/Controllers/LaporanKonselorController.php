<?php

/**
 * 
 * FULL CONTROLLER: LaporanKonselorController.php
 * 
 * 
 * Create file baru atau replace existing controller
 */

namespace App\Http\Controllers;

use App\Models\LaporanKonselor;
use App\Models\RiwayatSantri;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class LaporanKonselorController extends Controller
{
    /**
     * Display list laporan konselor
     */
    public function index(Request $request)
    {
        try {
            $query = LaporanKonselor::query()
                ->with([
                    'hasilPreprocessing.laporanAwal',
                    'santri.santriProfile',
                    'validator',
                    'variabelKonselor',
                    'approvals.tenagaPendidik.tenagaPendidikProfile',
                    'approvals.tenagaPendidik.guruBkProfile',
                ])
                ->orderBy('created_at', 'desc');

            // Filter by approval_status
            $approvalStatus = $request->get('approval_status', 'all');
            if ($approvalStatus && $approvalStatus !== 'all') {
                $query->where('approval_status', $approvalStatus);
            }

            // Search
            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('kode_konselor', 'like', "%{$search}%")
                      ->orWhereHas('santri.santriProfile', function($q) use ($search) {
                          $q->where('nama_panggilan', 'like', "%{$search}%")
                            ->orWhere('nama_lengkap', 'like', "%{$search}%");
                      });
                });
            }

            $laporanList = $query->paginate(15);

            $laporanList->through(function ($item) {
                if (!$item->hasilPreprocessing) {
                    return null;
                }

                return [
                    'id' => $item->id,
                    'kode_konselor' => $item->kode_konselor,
                    'diagnosis_default' => $item->diagnosis_default,
                    'tindakan_default' => $item->tindakan_default,
                    'catatan_bk' => $item->catatan_bk,
                    'tanggal_kejadian' => $item->tanggal_kejadian?->format('d/m/Y'),
                    'tanggal_konseling_mulai' => $item->tanggal_konseling_mulai?->format('d/m/Y'),
                    'tanggal_konseling_selesai' => $item->tanggal_konseling_selesai?->format('d/m/Y'),
                    'status' => $item->status,
                    'status_badge' => $item->status_badge,
                    'status_label' => $item->status_label,
                    
                    // Approval info
                    'approval_status' => $item->approval_status,
                    'approval_status_label' => $item->approval_status_label,
                    'approval_status_badge' => $item->approval_status_badge,
                    'approval_progress' => $item->approval_progress,
                    'has_overdue_approvals' => $item->hasOverdueApprovals(),
                    
                    'approvals' => $item->approvals->map(function ($approval) {
                        return [
                            'id' => $approval->id,
                            'tenaga_pendidik_nama' => $approval->tenagaPendidik->tenagaPendidikProfile->nama_lengkap
                                ?? $approval->tenagaPendidik->guruBkProfile->nama_lengkap
                                ?? 'Unknown',
                            'catatan' => $approval->catatan,
                            'approved_at' => $approval->approved_at?->format('d/m/Y H:i'),
                            'is_overdue' => $approval->isOverdue(),
                        ];
                    }),
                    
                    'santri' => $item->santri && $item->santri->santriProfile ? [
                        'id' => $item->santri->id,
                        'nama' => $item->santri->santriProfile->nama_panggilan 
                            ?? $item->santri->santriProfile->nama_lengkap,
                        'nisn' => $item->santri->santriProfile->nisn,
                    ] : null,
                    
                    'variabel' => $item->variabelKonselor ? [
                        'kategori' => $item->variabelKonselor->kategori,
                        'gangguan_mental' => $item->variabelKonselor->gangguan_mental,
                    ] : null,
                    
                    'laporan_awal' => [
                        'id' => $item->hasilPreprocessing->laporan_awal_id,
                        'text_laporan' => $item->hasilPreprocessing->laporanAwal->text_laporan ?? '',
                    ],
                    
                    'validated_at' => $item->validated_at?->format('d/m/Y H:i'),
                    'created_at' => $item->created_at?->format('d/m/Y H:i'),
                ];
            });

            $laporanList->setCollection($laporanList->getCollection()->filter());

            return Inertia::render('LaporanKonselor/Index', [
                'laporanList' => $laporanList,
                'filters' => [
                    'approval_status' => $approvalStatus,
                    'search' => $request->search,
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('LaporanKonselorController@index error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return Inertia::render('LaporanKonselor/Index', [
                'laporanList' => ['data' => [], 'links' => [], 'total' => 0],
                'filters' => ['approval_status' => 'all', 'search' => ''],
                'error' => 'Gagal memuat data laporan konselor'
            ]);
        }
    }


    /**
     * Show detail laporan konselor
     */
    public function show(LaporanKonselor $laporan)
    {
        $laporan->load([
            'hasilPreprocessing.laporanAwal.pelapor',
            'santri.santriProfile',
            'validator',
            'variabelKonselor',
            'approvals.tenagaPendidik.tenagaPendidikProfile',
            'approvals.tenagaPendidik.guruBkProfile',
        ]);

        return Inertia::render('LaporanKonselor/Show', [
            'laporan' => [
                'id'                        => $laporan->id,
                'kode_konselor'             => $laporan->kode_konselor,
                'diagnosis_default'         => $laporan->diagnosis_default,
                'tindakan_default'          => $laporan->tindakan_default,
                'catatan_bk'                => $laporan->catatan_bk,
                'tanggal_kejadian'          => $laporan->tanggal_kejadian?->format('d/m/Y'),
                'tanggal_konseling_mulai'   => $laporan->tanggal_konseling_mulai?->format('d/m/Y'),
                'tanggal_konseling_selesai' => $laporan->tanggal_konseling_selesai?->format('d/m/Y'),
                'status'                    => $laporan->status,
                'status_label'              => $laporan->status_label,
                'approval_status'           => $laporan->approval_status,
                'approval_status_label'     => $laporan->approval_status_label,
                'approval_progress'         => $laporan->approval_progress,
                'has_overdue_approvals'     => $laporan->hasOverdueApprovals(),
                'validated_at'              => $laporan->validated_at?->format('d/m/Y H:i'),
                'created_at'               => $laporan->created_at?->format('d/m/Y H:i'),
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
                'variabel' => $laporan->variabelKonselor ? [
                    'kode'           => $laporan->variabelKonselor->kode_konselor,
                    'kategori'       => $laporan->variabelKonselor->kategori,
                    'gangguan_mental'=> $laporan->variabelKonselor->gangguan_mental,
                    'keterangan'     => $laporan->variabelKonselor->keterangan ?? null,
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
    public function update(Request $request, LaporanKonselor $laporan)
    {
        $validated = $request->validate([
            'catatan_bk' => 'nullable|string|max:1000',
            'status' => 'nullable|in:pending,dalam_konseling,selesai,dirujuk',
        ]);

        try {
            DB::transaction(function () use ($laporan, $validated) {
                $laporan->update($validated);

                Log::info('Laporan konselor updated', [
                    'laporan_id' => $laporan->id,
                    'updated_by' => auth()->id(),
                ]);
            });

            return back()->with('success', 'Laporan konselor berhasil diupdate');

        } catch (\Exception $e) {
            Log::error('Failed to update laporan konselor', [
                'laporan_id' => $laporan->id,
                'error' => $e->getMessage()
            ]);

            return back()->withErrors([
                'update' => 'Gagal update laporan: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Complete laporan konselor
     */
    public function complete(Request $request, LaporanKonselor $laporan)
    {
        $validated = $request->validate([
            'catatan_bk' => 'nullable|string|max:1000',
        ]);

        try {
            // Check approval_status
            if ($laporan->approval_status !== 'pending_bk') {
                return back()->withErrors([
                    'complete' => 'Laporan belum mendapat approval dari semua Wali Kelas/Asrama. Status: ' . $laporan->approval_status_label
                ]);
            }

            if ($laporan->status === 'selesai' || $laporan->approval_status === 'selesai') {
                return back()->withErrors([
                    'complete' => 'Laporan sudah diselesaikan sebelumnya'
                ]);
            }

            DB::transaction(function () use ($laporan, $validated) {
                $laporan->update([
                    'catatan_bk' => $validated['catatan_bk'] ?? $laporan->catatan_bk,
                    'status' => 'selesai',
                    'approval_status' => 'selesai',
                    'tanggal_konseling_selesai' => now(),
                    'validated_by' => auth()->id(),
                    'validated_at' => now(),
                ]);

                $ringkasan = "Konseling {$laporan->kode_konselor}: {$laporan->diagnosis_default}";

                RiwayatSantri::create([
                    'santri_id' => $laporan->santri_id,
                    'laporan_konselor_id' => $laporan->id,
                    'jenis_laporan' => 'konselor',
                    'kode' => $laporan->kode_konselor,
                    'bobot_poin' => null,
                    'tanggal_kejadian' => $laporan->tanggal_kejadian,
                    'status' => 'selesai',
                    'ringkasan' => $ringkasan,
                ]);

                Log::info('Laporan konselor completed (with approvals)', [
                    'laporan_id' => $laporan->id,
                    'santri_id' => $laporan->santri_id,
                    'completed_by' => auth()->id(),
                ]);
            });

            return back()->with('success', 'Konseling diselesaikan dan tersimpan ke riwayat santri!');

        } catch (\Exception $e) {
            Log::error('Failed to complete laporan konselor', [
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
     * Delete laporan konselor
     */
    public function destroy(LaporanKonselor $laporan)
    {
        try {
            if ($laporan->status === 'selesai' || $laporan->approval_status === 'selesai') {
                return back()->withErrors([
                    'delete' => 'Tidak dapat menghapus laporan yang sudah selesai'
                ]);
            }

            $laporan->delete();

            Log::info('Laporan konselor deleted', [
                'laporan_id' => $laporan->id,
                'deleted_by' => auth()->id(),
            ]);

            return back()->with('success', 'Laporan konselor berhasil dihapus');

        } catch (\Exception $e) {
            Log::error('Failed to delete laporan konselor', [
                'laporan_id' => $laporan->id,
                'error' => $e->getMessage()
            ]);

            return back()->withErrors([
                'delete' => 'Gagal menghapus laporan: ' . $e->getMessage()
            ]);
        }
    }
}