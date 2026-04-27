<?php

namespace App\Http\Controllers;

use App\Models\LaporanApproval;
use App\Models\LaporanPelanggaran;
use App\Models\LaporanApresiasi;
use App\Models\LaporanKonselor;
use App\Models\RiwayatSantri;
use App\Models\PenugasanKelas;
use App\Services\ExpertSystemPointService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class ApprovalManagementController extends Controller
{
    // ═══════════════════════════════════════════════════════════
    // INDEX - Dashboard semua laporan yang menunggu final BK
    // ═══════════════════════════════════════════════════════════

    /**
     * Tampilkan semua laporan dengan approval_status = pending_bk
     * Ini adalah antrian final untuk Guru BK
     */
    public function index(Request $request)
    {
        try {
            $filter     = $request->get('filter', 'pending_bk');
            $jenis      = $request->get('jenis', 'all');
            $search     = $request->get('search', '');

            // ── Pelanggaran ──────────────────────────────────────────
            $pelanggaranQuery = LaporanPelanggaran::query()
                ->with([
                    'pelakuSantri.santriProfile',
                    'korbanSantri.santriProfile',
                    'variabelPelanggaran',
                    'approvals.tenagaPendidik.tenagaPendidikProfile',
                    'approvals.tenagaPendidik.guruBkProfile',
                    'hasilPreprocessing.laporanAwal',
                ]);

            // ── Apresiasi ─────────────────────────────────────────────
            $apresiasiQuery = LaporanApresiasi::query()
                ->with([
                    'santri.santriProfile',
                    'variabelApresiasi',
                    'approvals.tenagaPendidik.tenagaPendidikProfile',
                    'approvals.tenagaPendidik.guruBkProfile',
                    'hasilPreprocessing.laporanAwal',
                ]);

            // ── Konselor ──────────────────────────────────────────────
            $konselorQuery = LaporanKonselor::query()
                ->with([
                    'santri.santriProfile',
                    'variabelKonselor',
                    'approvals.tenagaPendidik.tenagaPendidikProfile',
                    'approvals.tenagaPendidik.guruBkProfile',
                    'hasilPreprocessing.laporanAwal',
                ]);

            // ── Apply filter status ───────────────────────────────────
            if ($filter === 'pending_bk') {
                $pelanggaranQuery->where('approval_status', 'pending_bk');
                $apresiasiQuery->where('approval_status', 'pending_bk');
                $konselorQuery->where('approval_status', 'pending_bk');
            } elseif ($filter === 'selesai') {
                $pelanggaranQuery->where('approval_status', 'selesai');
                $apresiasiQuery->whereIn('approval_status', ['diberikan', 'ditunda']);
                $konselorQuery->whereIn('approval_status', ['selesai', 'dirujuk']);
            } elseif ($filter === 'semua') {
                // no filter — semua laporan variabel
            }

            // ── Apply search ──────────────────────────────────────────
            if ($search) {
                $pelanggaranQuery->whereHas('pelakuSantri.santriProfile', function ($q) use ($search) {
                    $q->where('nama_panggilan', 'like', "%{$search}%")
                      ->orWhere('nama_lengkap', 'like', "%{$search}%");
                });
                $apresiasiQuery->whereHas('santri.santriProfile', function ($q) use ($search) {
                    $q->where('nama_panggilan', 'like', "%{$search}%")
                      ->orWhere('nama_lengkap', 'like', "%{$search}%");
                });
                $konselorQuery->whereHas('santri.santriProfile', function ($q) use ($search) {
                    $q->where('nama_panggilan', 'like', "%{$search}%")
                      ->orWhere('nama_lengkap', 'like', "%{$search}%");
                });
            }

            // ── Ambil data sesuai filter jenis ────────────────────────
            $pelanggaran = ($jenis === 'all' || $jenis === 'pelanggaran')
                ? $pelanggaranQuery->orderBy('created_at', 'asc')->get()
                : collect();

            $apresiasi = ($jenis === 'all' || $jenis === 'apresiasi')
                ? $apresiasiQuery->orderBy('created_at', 'asc')->get()
                : collect();

            $konselor = ($jenis === 'all' || $jenis === 'konselor')
                ? $konselorQuery->orderBy('created_at', 'asc')->get()
                : collect();

            // ── Transform ke format seragam ───────────────────────────
            $items = collect();

            foreach ($pelanggaran as $lap) {
                $items->push($this->transformPelanggaran($lap));
            }
            foreach ($apresiasi as $lap) {
                $items->push($this->transformApresiasi($lap));
            }
            foreach ($konselor as $lap) {
                $items->push($this->transformKonselor($lap));
            }

            // Sort: paling lama pending duluan
            $items = $items->sortBy('created_at')->values();

            // ── Statistik ringkasan ───────────────────────────────────
            $statistik = [
                'pending_bk' => [
                    'pelanggaran' => LaporanPelanggaran::where('approval_status', 'pending_bk')->count(),
                    'apresiasi'   => LaporanApresiasi::where('approval_status', 'pending_bk')->count(),
                    'konselor'    => LaporanKonselor::where('approval_status', 'pending_bk')->count(),
                ],
                'total_pending_bk' =>
                    LaporanPelanggaran::where('approval_status', 'pending_bk')->count() +
                    LaporanApresiasi::where('approval_status', 'pending_bk')->count() +
                    LaporanKonselor::where('approval_status', 'pending_bk')->count(),
            ];

            return Inertia::render('KelolaBk/Index', [
                'items'      => $items,
                'statistik'  => $statistik,
                'filter'     => $filter,
                'jenis'      => $jenis,
                'search'     => $search,
            ]);

        } catch (\Exception $e) {
            Log::error('ApprovalManagementController@index error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return Inertia::render('KelolaBk/Index', [
                'items'      => [],
                'statistik'  => ['pending_bk' => ['pelanggaran' => 0, 'apresiasi' => 0, 'konselor' => 0], 'total_pending_bk' => 0],
                'filter'     => 'pending_bk',
                'jenis'      => 'all',
                'search'     => '',
                'error'      => 'Gagal memuat data: ' . $e->getMessage(),
            ]);
        }
    }

    // ═══════════════════════════════════════════════════════════
    // SHOW - Detail laporan sebelum final approve
    // ═══════════════════════════════════════════════════════════

    /**
     * Tampilkan detail laporan berdasarkan jenis & id
     * Route: /kelola-approval/{jenis}/{id}
     * Jenis: pelanggaran | apresiasi | konselor
     */
    public function show(string $jenis, int $id)
    {
        try {
            $laporan = null;
            $detail  = [];

            if ($jenis === 'pelanggaran') {
                $laporan = LaporanPelanggaran::with([
                    'pelakuSantri.santriProfile',
                    'korbanSantri.santriProfile',
                    'variabelPelanggaran',
                    'approvals.tenagaPendidik.tenagaPendidikProfile',
                    'approvals.tenagaPendidik.guruBkProfile',
                    'hasilPreprocessing.laporanAwal',
                    'validator',
                ])->findOrFail($id);

                $detail = $this->transformPelanggaran($laporan);

            } elseif ($jenis === 'apresiasi') {
                $laporan = LaporanApresiasi::with([
                    'santri.santriProfile',
                    'variabelApresiasi',
                    'approvals.tenagaPendidik.tenagaPendidikProfile',
                    'approvals.tenagaPendidik.guruBkProfile',
                    'hasilPreprocessing.laporanAwal',
                    'validator',
                ])->findOrFail($id);

                $detail = $this->transformApresiasi($laporan);

            } elseif ($jenis === 'konselor') {
                $laporan = LaporanKonselor::with([
                    'santri.santriProfile',
                    'variabelKonselor',
                    'approvals.tenagaPendidik.tenagaPendidikProfile',
                    'approvals.tenagaPendidik.guruBkProfile',
                    'hasilPreprocessing.laporanAwal',
                    'validator',
                ])->findOrFail($id);

                $detail = $this->transformKonselor($laporan);

            } else {
                abort(404, 'Jenis laporan tidak dikenal');
            }

            return Inertia::render('KelolaBk/Show', [
                'laporan' => $detail,
                'jenis'   => $jenis,
            ]);

        } catch (\Exception $e) {
            Log::error('ApprovalManagementController@show error', [
                'jenis' => $jenis,
                'id'    => $id,
                'error' => $e->getMessage(),
            ]);

            return redirect()->route('kelola-approval.index')
                ->with('error', 'Gagal memuat detail laporan: ' . $e->getMessage());
        }
    }

    // ═══════════════════════════════════════════════════════════
    // FINAL APPROVE - BK selesaikan laporan & simpan ke riwayat
    // ═══════════════════════════════════════════════════════════

    /**
     * BK final-approve laporan → simpan ke riwayat_santri
     * Route: POST /kelola-approval/{jenis}/{id}/approve
     */
    public function finalApprove(Request $request, string $jenis, int $id)
    {
        $validated = $request->validate([
            'catatan_bk' => 'nullable|string|max:1000',
        ]);

        try {
            if ($jenis === 'pelanggaran') {
                return $this->finalizePelanggaran($id, $validated['catatan_bk'] ?? null);
            } elseif ($jenis === 'apresiasi') {
                return $this->finalizeApresiasi($id, $validated['catatan_bk'] ?? null);
            } elseif ($jenis === 'konselor') {
                return $this->finalizeKonselor($id, $validated['catatan_bk'] ?? null);
            }

            abort(404, 'Jenis laporan tidak dikenal');

        } catch (\Exception $e) {
            Log::error('ApprovalManagementController@finalApprove error', [
                'jenis' => $jenis,
                'id'    => $id,
                'error' => $e->getMessage(),
            ]);

            return back()->withErrors([
                'approve' => 'Gagal menyelesaikan laporan: ' . $e->getMessage(),
            ]);
        }
    }

    // ═══════════════════════════════════════════════════════════
    // ABAIKAN - BK abaikan laporan (tidak diproses)
    // ═══════════════════════════════════════════════════════════

    /**
     * BK mengabaikan laporan
     * Route: POST /kelola-approval/{jenis}/{id}/abaikan
     */
    public function abaikan(Request $request, string $jenis, int $id)
    {
        $validated = $request->validate([
            'alasan' => 'required|string|max:500',
        ]);

        try {
            $laporan = $this->getLaporan($jenis, $id);

            if (!$laporan) {
                return back()->withErrors(['abaikan' => 'Laporan tidak ditemukan']);
            }

            if (!in_array($laporan->approval_status, ['pending_bk', 'pending_tenaga_pendidik'])) {
                return back()->withErrors(['abaikan' => 'Laporan sudah diproses sebelumnya']);
            }

            DB::transaction(function () use ($laporan, $validated, $jenis) {
                $statusAbaikan = $jenis === 'apresiasi' ? 'ditunda' : 'diabaikan';

                $laporan->update([
                    'approval_status' => $statusAbaikan,
                    'status'          => $statusAbaikan,
                    'catatan_bk'      => $validated['alasan'],
                    'validated_by'    => auth()->id(),
                    'validated_at'    => now(),
                ]);

                Log::info('Laporan diabaikan oleh BK', [
                    'jenis'      => $jenis,
                    'laporan_id' => $laporan->id,
                    'by_user'    => auth()->id(),
                    'alasan'     => $validated['alasan'],
                ]);
            });

            return redirect()->route('kelola-approval.index')
                ->with('success', 'Laporan berhasil diabaikan.');

        } catch (\Exception $e) {
            Log::error('ApprovalManagementController@abaikan error', [
                'error' => $e->getMessage(),
            ]);
            return back()->withErrors(['abaikan' => 'Gagal mengabaikan laporan: ' . $e->getMessage()]);
        }
    }

    // ═══════════════════════════════════════════════════════════
    // REASSIGN & SYNC (sudah ada, tetap dipertahankan)
    // ═══════════════════════════════════════════════════════════

    /**
     * Reassign approval ke tenaga pendidik lain
     */
    public function reassign(Request $request, LaporanApproval $approval)
    {
        if (auth()->user()->role !== 'guru_bk') {
            abort(403, 'Only BK can reassign approvals');
        }

        $validated = $request->validate([
            'new_tenaga_pendidik_id' => 'required|exists:users,id',
        ]);

        try {
            if ($approval->isApproved()) {
                return back()->withErrors(['reassign' => 'Cannot reassign approved approval']);
            }

            DB::transaction(function () use ($approval, $validated) {
                $approval->update([
                    'tenaga_pendidik_id' => $validated['new_tenaga_pendidik_id'],
                    'deadline_at'        => now()->addHours(24),
                ]);

                Log::info('Approval reassigned', [
                    'approval_id' => $approval->id,
                    'to_user'     => $validated['new_tenaga_pendidik_id'],
                    'by_user'     => auth()->id(),
                ]);
            });

            return back()->with('success', 'Approval berhasil di-reassign!');

        } catch (\Exception $e) {
            return back()->withErrors(['reassign' => 'Gagal reassign approval']);
        }
    }

    /**
     * Sync approvals laporan
     */
    public function syncLaporanApprovals(Request $request)
    {
        if (auth()->user()->role !== 'guru_bk') {
            abort(403, 'Only BK can sync approvals');
        }

        $validated = $request->validate([
            'laporan_type' => 'required|string',
            'laporan_id'   => 'required|integer',
        ]);

        try {
            $laporan = $validated['laporan_type']::find($validated['laporan_id']);

            if (!$laporan) {
                return back()->withErrors(['sync' => 'Laporan not found']);
            }

            $santriId = $laporan instanceof LaporanPelanggaran
                ? $laporan->pelaku_santri_id
                : $laporan->santri_id;

            DB::transaction(function () use ($laporan, $santriId, $validated) {
                $currentAssignments = PenugasanKelas::query()
                    ->whereHas('kelas.riwayatKelasSantri', function ($q) use ($santriId) {
                        $q->where('santri_id', $santriId)->where('status', 'aktif');
                    })
                    ->where('is_active', 1)
                    ->pluck('user_id')
                    ->toArray();

                $existingApprovals = $laporan->approvals->pluck('tenaga_pendidik_id')->toArray();

                foreach (array_diff($currentAssignments, $existingApprovals) as $userId) {
                    LaporanApproval::create([
                        'laporan_type'        => $validated['laporan_type'],
                        'laporan_id'          => $validated['laporan_id'],
                        'tenaga_pendidik_id'  => $userId,
                        'deadline_at'         => now()->addHours(24),
                    ]);
                }

                LaporanApproval::where('laporan_type', $validated['laporan_type'])
                    ->where('laporan_id', $validated['laporan_id'])
                    ->whereIn('tenaga_pendidik_id', array_diff($existingApprovals, $currentAssignments))
                    ->whereNull('approved_at')
                    ->delete();
            });

            return back()->with('success', 'Approvals synced successfully!');

        } catch (\Exception $e) {
            return back()->withErrors(['sync' => 'Failed to sync approvals']);
        }
    }

    // ═══════════════════════════════════════════════════════════
    // PRIVATE: Finalize per jenis laporan
    // ═══════════════════════════════════════════════════════════

    private function finalizePelanggaran(int $id, ?string $catatan)
    {
        $laporan = LaporanPelanggaran::findOrFail($id);

        // Guard: harus pending_bk dulu
        if ($laporan->approval_status !== 'pending_bk') {
            return back()->withErrors([
                'approve' => 'Laporan belum selesai di-approve oleh semua Wali. Status: ' . $laporan->approval_status_label,
            ]);
        }

        if ($laporan->status === 'selesai') {
            return back()->withErrors(['approve' => 'Laporan sudah diselesaikan sebelumnya']);
        }

        DB::transaction(function () use ($laporan, $catatan) {
            // 1. Update status laporan
            $laporan->update([
                'catatan_bk'      => $catatan ?? $laporan->catatan_bk,
                'status'          => 'selesai',
                'approval_status' => 'selesai',
                'tanggal_tindakan'=> now(),
                'validated_by'    => auth()->id(),
                'validated_at'    => now(),
            ]);

            // 2. Simpan ke riwayat_santri (pelaku)
            if ($laporan->pelaku_santri_id) {
                RiwayatSantri::create([
                    'santri_id'              => $laporan->pelaku_santri_id,
                    'laporan_pelanggaran_id' => $laporan->id,
                    'jenis_laporan'          => 'pelanggaran',
                    'kode'                   => $laporan->kode_pelanggaran,
                    'bobot_poin'             => $laporan->bobot_poin,
                    'tanggal_kejadian'       => $laporan->tanggal_kejadian,
                    'status'                 => 'selesai',
                    'ringkasan'              => "Pelanggaran {$laporan->kode_pelanggaran}: {$laporan->tindakan_default} (sebagai pelaku)",
                ]);
            }

            // 3. Simpan ke riwayat_santri (korban, tanpa poin)
            if ($laporan->korban_santri_id) {
                RiwayatSantri::create([
                    'santri_id'              => $laporan->korban_santri_id,
                    'laporan_pelanggaran_id' => $laporan->id,
                    'jenis_laporan'          => 'pelanggaran',
                    'kode'                   => $laporan->kode_pelanggaran,
                    'bobot_poin'             => null,
                    'tanggal_kejadian'       => $laporan->tanggal_kejadian,
                    'status'                 => 'selesai',
                    'ringkasan'              => "Pelanggaran {$laporan->kode_pelanggaran}: {$laporan->tindakan_default} (sebagai korban)",
                ]);
            }

            Log::info('Pelanggaran finalized by BK', [
                'laporan_id'  => $laporan->id,
                'finalized_by'=> auth()->id(),
            ]);
        });

        // 4. Trigger expert system point check
        if ($laporan->pelaku_santri_id) {
            $this->triggerExpertSystemCheck($laporan->pelaku_santri_id);
        }

        return redirect()->route('kelola-approval.index')
            ->with('success', 'Laporan pelanggaran diselesaikan dan tersimpan ke riwayat santri!');
    }

    private function finalizeApresiasi(int $id, ?string $catatan)
    {
        $laporan = LaporanApresiasi::findOrFail($id);

        if ($laporan->approval_status !== 'pending_bk') {
            return back()->withErrors([
                'approve' => 'Laporan belum selesai di-approve oleh semua Wali. Status: ' . $laporan->approval_status_label,
            ]);
        }

        if ($laporan->status === 'diberikan') {
            return back()->withErrors(['approve' => 'Reward sudah diberikan sebelumnya']);
        }

        DB::transaction(function () use ($laporan, $catatan) {
            $laporan->update([
                'catatan_bk'      => $catatan ?? $laporan->catatan_bk,
                'status'          => 'diberikan',
                'approval_status' => 'diberikan',
                'tanggal_reward'  => now(),
                'validated_by'    => auth()->id(),
                'validated_at'    => now(),
            ]);

            RiwayatSantri::create([
                'santri_id'            => $laporan->santri_id,
                'laporan_apresiasi_id' => $laporan->id,
                'jenis_laporan'        => 'apresiasi',
                'kode'                 => $laporan->kode_apresiasi,
                'bobot_poin'           => $laporan->bobot_poin,
                'tanggal_kejadian'     => $laporan->tanggal_kejadian,
                'status'               => 'diberikan',
                'ringkasan'            => "Apresiasi {$laporan->kode_apresiasi}: {$laporan->reward_default}",
            ]);

            Log::info('Apresiasi finalized by BK', [
                'laporan_id'  => $laporan->id,
                'finalized_by'=> auth()->id(),
            ]);
        });

        if ($laporan->santri_id) {
            $this->triggerExpertSystemCheck($laporan->santri_id);
        }

        return redirect()->route('kelola-approval.index')
            ->with('success', 'Apresiasi diberikan dan tersimpan ke riwayat santri!');
    }

    private function finalizeKonselor(int $id, ?string $catatan)
    {
        $laporan = LaporanKonselor::findOrFail($id);

        if ($laporan->approval_status !== 'pending_bk') {
            return back()->withErrors([
                'approve' => 'Laporan belum selesai di-approve oleh semua Wali. Status: ' . $laporan->approval_status_label,
            ]);
        }

        DB::transaction(function () use ($laporan, $catatan) {
            $laporan->update([
                'catatan_bk'              => $catatan ?? $laporan->catatan_bk,
                'status'                  => 'selesai',
                'approval_status'         => 'selesai',
                'tanggal_konseling_mulai' => $laporan->tanggal_konseling_mulai ?? now(),
                'validated_by'            => auth()->id(),
                'validated_at'            => now(),
            ]);

            RiwayatSantri::create([
                'santri_id'          => $laporan->santri_id,
                'laporan_konselor_id'=> $laporan->id,
                'jenis_laporan'      => 'konselor',
                'kode'               => $laporan->kode_konselor,
                'bobot_poin'         => null,
                'tanggal_kejadian'   => $laporan->tanggal_kejadian,
                'status'             => 'selesai',
                'ringkasan'          => "Konseling {$laporan->kode_konselor}: {$laporan->diagnosis_default}",
            ]);

            Log::info('Konselor finalized by BK', [
                'laporan_id'  => $laporan->id,
                'finalized_by'=> auth()->id(),
            ]);
        });

        return redirect()->route('kelola-approval.index')
            ->with('success', 'Laporan konseling diselesaikan dan tersimpan ke riwayat santri!');
    }

    // ═══════════════════════════════════════════════════════════
    // PRIVATE: Helpers
    // ═══════════════════════════════════════════════════════════

    private function getLaporan(string $jenis, int $id)
    {
        return match ($jenis) {
            'pelanggaran' => LaporanPelanggaran::find($id),
            'apresiasi'   => LaporanApresiasi::find($id),
            'konselor'    => LaporanKonselor::find($id),
            default       => null,
        };
    }

    private function triggerExpertSystemCheck(int $santriId): void
    {
        try {
            $service   = app(ExpertSystemPointService::class);
            $triggered = $service->checkThreshold($santriId);
            $total     = count($triggered['konsekuensi']) + count($triggered['reward']);

            if ($total > 0) {
                Log::info('Expert system triggered from KelolaBk', [
                    'santri_id' => $santriId,
                    'total'     => $total,
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Expert system check failed (non-critical)', [
                'santri_id' => $santriId,
                'error'     => $e->getMessage(),
            ]);
        }
    }

    // ── Transform helpers ─────────────────────────────────────

    private function transformPelanggaran(LaporanPelanggaran $lap): array
    {
        $santriNama = $lap->pelakuSantri?->santriProfile?->nama_panggilan
            ?? $lap->pelakuSantri?->santriProfile?->nama_lengkap
            ?? '-';

        return [
            'id'                   => $lap->id,
            'jenis'                => 'pelanggaran',
            'jenis_label'          => 'Pelanggaran',
            'jenis_color'          => 'red',
            'kode'                 => $lap->kode_pelanggaran,
            'bobot_poin'           => $lap->bobot_poin,
            'keterangan'           => $lap->tindakan_default,
            'catatan_bk'           => $lap->catatan_bk,
            'tanggal_kejadian'     => $lap->tanggal_kejadian?->format('d/m/Y'),
            'status'               => $lap->status,
            'approval_status'      => $lap->approval_status,
            'approval_status_label'=> $lap->approval_status_label,
            'approval_progress'    => $lap->approval_progress,
            'created_at'           => $lap->created_at?->format('Y-m-d H:i:s'),
            'created_at_label'     => $lap->created_at?->format('d/m/Y H:i'),
            'santri' => [
                'nama'  => $santriNama,
                'nisn'  => $lap->pelakuSantri?->santriProfile?->nisn ?? '-',
            ],
            'korban' => $lap->korbanSantri ? [
                'nama' => $lap->korbanSantri?->santriProfile?->nama_panggilan ?? '-',
                'nisn' => $lap->korbanSantri?->santriProfile?->nisn ?? '-',
            ] : null,
            'variabel'  => $lap->variabelPelanggaran ? [
                'nama'    => $lap->variabelPelanggaran->nama_pelanggaran ?? '-',
                'tindakan'=> $lap->variabelPelanggaran->tindakan ?? '-',
            ] : null,
            'laporan_awal' => $lap->hasilPreprocessing?->laporanAwal ? [
                'isi_laporan' => $lap->hasilPreprocessing->laporanAwal->isi_laporan,
            ] : null,
            'approvals' => $this->transformApprovals($lap->approvals),
        ];
    }

    private function transformApresiasi(LaporanApresiasi $lap): array
    {
        $santriNama = $lap->santri?->santriProfile?->nama_panggilan
            ?? $lap->santri?->santriProfile?->nama_lengkap
            ?? '-';

        return [
            'id'                   => $lap->id,
            'jenis'                => 'apresiasi',
            'jenis_label'          => 'Apresiasi',
            'jenis_color'          => 'green',
            'kode'                 => $lap->kode_apresiasi,
            'bobot_poin'           => $lap->bobot_poin,
            'keterangan'           => $lap->reward_default,
            'catatan_bk'           => $lap->catatan_bk,
            'tanggal_kejadian'     => $lap->tanggal_kejadian?->format('d/m/Y'),
            'status'               => $lap->status,
            'approval_status'      => $lap->approval_status,
            'approval_status_label'=> $lap->approval_status_label,
            'approval_progress'    => $lap->approval_progress,
            'created_at'           => $lap->created_at?->format('Y-m-d H:i:s'),
            'created_at_label'     => $lap->created_at?->format('d/m/Y H:i'),
            'santri' => [
                'nama' => $santriNama,
                'nisn' => $lap->santri?->santriProfile?->nisn ?? '-',
            ],
            'korban'    => null,
            'variabel'  => $lap->variabelApresiasi ? [
                'nama'    => $lap->variabelApresiasi->nama_apresiasi ?? '-',
                'tindakan'=> $lap->variabelApresiasi->apresiasi ?? '-',
            ] : null,
            'laporan_awal' => $lap->hasilPreprocessing?->laporanAwal ? [
                'isi_laporan' => $lap->hasilPreprocessing->laporanAwal->isi_laporan,
            ] : null,
            'approvals' => $this->transformApprovals($lap->approvals),
        ];
    }

    private function transformKonselor(LaporanKonselor $lap): array
    {
        $santriNama = $lap->santri?->santriProfile?->nama_panggilan
            ?? $lap->santri?->santriProfile?->nama_lengkap
            ?? '-';

        return [
            'id'                   => $lap->id,
            'jenis'                => 'konselor',
            'jenis_label'          => 'Konselor',
            'jenis_color'          => 'purple',
            'kode'                 => $lap->kode_konselor,
            'bobot_poin'           => null,
            'keterangan'           => $lap->diagnosis_default,
            'catatan_bk'           => $lap->catatan_bk,
            'tanggal_kejadian'     => $lap->tanggal_kejadian?->format('d/m/Y'),
            'status'               => $lap->status,
            'approval_status'      => $lap->approval_status,
            'approval_status_label'=> $lap->approval_status_label,
            'approval_progress'    => $lap->approval_progress,
            'created_at'           => $lap->created_at?->format('Y-m-d H:i:s'),
            'created_at_label'     => $lap->created_at?->format('d/m/Y H:i'),
            'santri' => [
                'nama' => $santriNama,
                'nisn' => $lap->santri?->santriProfile?->nisn ?? '-',
            ],
            'korban'   => null,
            'variabel' => $lap->variabelKonselor ? [
                'nama'    => $lap->variabelKonselor->gangguan_mental ?? '-',
                'tindakan'=> $lap->variabelKonselor->rekomendasi ?? '-',
            ] : null,
            'laporan_awal' => $lap->hasilPreprocessing?->laporanAwal ? [
                'isi_laporan' => $lap->hasilPreprocessing->laporanAwal->isi_laporan,
            ] : null,
            'approvals' => $this->transformApprovals($lap->approvals),
        ];
    }

    private function transformApprovals($approvals): array
    {
        return $approvals->map(function ($a) {
            return [
                'id'                   => $a->id,
                'tenaga_pendidik_nama' => $a->tenagaPendidik?->tenagaPendidikProfile?->nama_lengkap
                    ?? $a->tenagaPendidik?->guruBkProfile?->nama_lengkap
                    ?? $a->tenagaPendidik?->name
                    ?? 'Unknown',
                'catatan'              => $a->catatan,
                'approved_at'          => $a->approved_at?->format('d/m/Y H:i'),
                'deadline_at'          => $a->deadline_at?->format('d/m/Y H:i'),
                'is_approved'          => $a->isApproved(),
                'is_overdue'           => $a->isOverdue(),
                'status_label'         => $a->status_label,
                'status_badge_color'   => $a->status_badge_color,
            ];
        })->toArray();
    }
}