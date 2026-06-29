<?php

namespace App\Http\Controllers;

use App\Models\HasilPreprocessing;
use App\Models\User;
use App\Models\VariabelPelanggaran;
use App\Models\VariabelApresiasi;
use App\Models\VariabelKonselor;
use App\Services\LaporanService;
use App\Services\LearningService; //  NEW
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class HasilPreprocessingController extends Controller
{
    protected $laporanService;
    protected $learningService; //  NEW

    public function __construct(LaporanService $laporanService, LearningService $learningService) //  UPDATED
    {
        $this->laporanService = $laporanService;
        $this->learningService = $learningService; //  NEW
    }

    /**
     * Display hasil preprocessing (Gerbang 2)
     */
    public function index(Request $request)
    {
        try {
            $query = HasilPreprocessing::query()
                ->with([
                    'laporanAwal.pelapor',
                    'pelakuSantri.santriProfile.kelas',
                    'korbanSantri.santriProfile.kelas',
                    'validator'
                ])
                ->latest()
                ->orderBy('id', 'desc');

            // Filter by status
            $status = $request->get('status', 'all');
            if ($status && $status !== 'all') {
                $query->where('status', $status);
            }

            // Search
            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('pelaku_nama', 'like', "%{$search}%")
                      ->orWhere('korban_nama', 'like', "%{$search}%")
                      ->orWhere('kata_kerja_dasar', 'like', "%{$search}%")
                      ->orWhereJsonContains('kode_matched', $search)
                      ->orWhereHas('laporanAwal', function($q) use ($search) {
                          $q->where('text_laporan', 'like', "%{$search}%");
                      });
                });
            }

            $hasilList = $query->paginate(15);
            
            // Transform data safely
            $hasilList->through(function ($item) {
                if (!$item->laporanAwal) {
                    return null;
                }
                
                return [
                    'id' => $item->id,
                    'laporan_awal_id' => $item->laporan_awal_id,
                    'laporan_awal' => [
                        'id' => $item->laporanAwal->id,
                        'text_laporan' => $item->laporanAwal->text_laporan ?? '',
                        'jenis_laporan' => $item->laporanAwal->jenis_laporan ?? 'unknown',
                        'jenis_laporan_label' => $item->laporanAwal->jenis_laporan_label ?? ucfirst($item->laporanAwal->jenis_laporan ?? 'Unknown'),
                        'tanggal_kejadian' => $item->laporanAwal->tanggal_kejadian?->format('d/m/Y'),
                        'pelapor' => [
                            'nama' => $this->getNamaLengkap($item->laporanAwal->pelapor),
                            'role' => $item->laporanAwal->pelapor?->role ?? 'unknown',
                        ],
                    ],
                    'kode_matched' => $item->kode_matched ?? [],
                    'kode_pelanggaran' => $item->kode_pelanggaran ?? [],
                    'kode_apresiasi' => $item->kode_apresiasi ?? [],
                    'kode_konselor' => $item->kode_konselor ?? [],
                    
                    'pelaku_nama' => $item->pelaku_nama,
                    'pelaku_santri_id' => $item->pelaku_santri_id,
                    'pelaku_santri' => $item->pelakuSantri && $item->pelakuSantri->santriProfile ? [
                        'id'             => $item->pelakuSantri->id,
                        'nama_lengkap'   => $item->pelakuSantri->santriProfile->nama_lengkap,
                        'nama_panggilan' => $item->pelakuSantri->santriProfile->nama_panggilan,
                        'nisn'           => $item->pelakuSantri->santriProfile->nisn,
                        'kelas_kode'     => $item->pelakuSantri->santriProfile->kelas?->kode_kelas ?? '-',
                    ] : null,
                    
                    'korban_nama' => $item->korban_nama,
                    'korban_santri_id' => $item->korban_santri_id,
                    'korban_santri' => $item->korbanSantri && $item->korbanSantri->santriProfile ? [
                        'id'             => $item->korbanSantri->id,
                        'nama_lengkap'   => $item->korbanSantri->santriProfile->nama_lengkap,
                        'nama_panggilan' => $item->korbanSantri->santriProfile->nama_panggilan,
                        'nisn'           => $item->korbanSantri->santriProfile->nisn,
                        'kelas_kode'     => $item->korbanSantri->santriProfile->kelas?->kode_kelas ?? '-',
                    ] : null,
                    
                    'kata_kerja_dasar' => $item->kata_kerja_dasar,
                    'format_laporan'   => $item->format_laporan ?? null,
                    'verb_info'        => $item->verb_info ?? null,
                    'pelaku_kode'      => $item->pelaku_kode ?? [],
                    'korban_kode'      => $item->korban_kode ?? [],
                    'kode_konsekuensi' => $item->kode_konsekuensi ?? [],
                    'kode_diagnosis'   => $item->kode_diagnosis ?? [],
                    'kode_reward'      => $item->kode_reward ?? [],
                    
                    'status' => $item->status,
                    'status_label' => $item->status_label,
                    'status_badge_color' => $item->status_badge_color,
                    'is_corrected' => $item->is_corrected,
                    'correction_notes' => $item->correction_notes,
                    'error_message' => $item->error_message,
                    
                    'validated_at' => $item->validated_at?->format('d/m/Y H:i'),
                    'validator' => $item->validator ? [
                        'nama' => $this->getNamaLengkap($item->validator),
                    ] : null,
                    
                    'preprocessing_data' => $item->preprocessing_data,
                    //  NEW: Negation log for BK review
                    'negation_log' => $item->preprocessing_data['negation_log'] ?? [],
                    'has_negation' => !empty($item->preprocessing_data['negation_log'] ?? []),
                    
                    'processed_at' => $item->processed_at?->format('d/m/Y H:i'),
                    'created_at' => $item->created_at?->format('d/m/Y H:i') ?? 'Unknown',
                ];
            });
            
            $hasilList->setCollection($hasilList->getCollection()->filter()->values());

            return Inertia::render('HasilPreprocessing/Index', [
                'hasilList' => $hasilList,
                'santriList' => $this->getSantriList(),
                'filters' => [
                    'status' => $status,
                    'search' => $request->get('search', ''),
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('HasilPreprocessingController@index', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return back()->withErrors([
                'error' => 'Gagal memuat data hasil preprocessing: ' . $e->getMessage()
            ]);
        }
    }

    public function edit(HasilPreprocessing $hasil)
    {
        try {
            $hasil->load([
                'laporanAwal',
                'pelakuSantri.santriProfile',
                'korbanSantri.santriProfile'
            ]);

            return Inertia::render('HasilPreprocessing/Edit', [
                'hasil' => [
                    'id' => $hasil->id,
                    'laporan_awal' => [
                        'id' => $hasil->laporanAwal->id,
                        'text_laporan' => $hasil->laporanAwal->text_laporan,
                        'jenis_laporan' => $hasil->laporanAwal->jenis_laporan,
                    ],
                    'kode_matched' => $hasil->kode_matched ?? [],
                    'kode_pelanggaran' => $hasil->kode_pelanggaran ?? [],
                    'kode_apresiasi' => $hasil->kode_apresiasi ?? [],
                    'kode_konselor' => $hasil->kode_konselor ?? [],
                    
                    'pelaku_nama' => $hasil->pelaku_nama,
                    'pelaku_santri_id' => $hasil->pelaku_santri_id,
                    'pelaku_santri' => $hasil->pelakuSantri && $hasil->pelakuSantri->santriProfile ? [
                        'id' => $hasil->pelakuSantri->id,
                        'nama_lengkap' => $hasil->pelakuSantri->santriProfile->nama_lengkap,
                        'nama_panggilan' => $hasil->pelakuSantri->santriProfile->nama_panggilan,
                        'nisn' => $hasil->pelakuSantri->santriProfile->nisn,
                    ] : null,
                    
                    'korban_nama' => $hasil->korban_nama,
                    'korban_santri_id' => $hasil->korban_santri_id,
                    'korban_santri' => $hasil->korbanSantri && $hasil->korbanSantri->santriProfile ? [
                        'id' => $hasil->korbanSantri->id,
                        'nama_lengkap' => $hasil->korbanSantri->santriProfile->nama_lengkap,
                        'nama_panggilan' => $hasil->korbanSantri->santriProfile->nama_panggilan,
                        'nisn' => $hasil->korbanSantri->santriProfile->nisn,
                    ] : null,
                    
                    'kata_kerja_dasar' => $hasil->kata_kerja_dasar,
                    'correction_notes' => $hasil->correction_notes,
                    'error_message' => $hasil->error_message,
                ],
                'santriList' => $this->getSantriList(),
                'variabelList' => $this->getVariabelList(),
            ]);

        } catch (\Exception $e) {
            Log::error('HasilPreprocessingController@edit', [
                'hasil_id' => $hasil->id,
                'error' => $e->getMessage()
            ]);
            
            return back()->withErrors([
                'error' => 'Gagal memuat form edit: ' . $e->getMessage()
            ]);
        }
    }

    public function update(Request $request, HasilPreprocessing $hasil)
    {
        try {
            $validated = $request->validate([
                'kode_matched' => 'required|array|min:1',
                'kode_matched.*' => 'required|string',
                'pelaku_santri_id' => 'nullable|exists:users,id',
                'korban_santri_id' => 'nullable|exists:users,id',
                'kata_kerja_dasar' => 'nullable|string|max:100',
                'correction_notes' => 'nullable|string|max:500',
            ]);

            // Get nama from database when santri_id provided
            $pelakuNama = null;
            if (!empty($validated['pelaku_santri_id'])) {
                $pelaku = User::with('santriProfile')->find($validated['pelaku_santri_id']);
                if ($pelaku && $pelaku->santriProfile) {
                    $pelakuNama = $pelaku->santriProfile->nama_panggilan 
                        ?? $pelaku->santriProfile->nama_lengkap;
                }
            }

            $korbanNama = null;
            if (!empty($validated['korban_santri_id'])) {
                $korban = User::with('santriProfile')->find($validated['korban_santri_id']);
                if ($korban && $korban->santriProfile) {
                    $korbanNama = $korban->santriProfile->nama_panggilan 
                        ?? $korban->santriProfile->nama_lengkap;
                }
            }

            // Check if data changed
            $isChanged = 
                json_encode($hasil->kode_matched) !== json_encode($validated['kode_matched']) ||
                $hasil->pelaku_santri_id !== ($validated['pelaku_santri_id'] ?? null) ||
                $hasil->korban_santri_id !== ($validated['korban_santri_id'] ?? null) ||
                $hasil->kata_kerja_dasar !== ($validated['kata_kerja_dasar'] ?? null);

            //  Store original kode_matched for learning
            $originalKodeMatched = $hasil->kode_matched ?? [];

            DB::transaction(function () use ($hasil, $validated, $isChanged, $pelakuNama, $korbanNama) {
                $hasil->update([
                    'kode_matched' => $validated['kode_matched'],
                    'pelaku_nama' => $pelakuNama,
                    'pelaku_santri_id' => $validated['pelaku_santri_id'] ?? null,
                    'korban_nama' => $korbanNama,
                    'korban_santri_id' => $validated['korban_santri_id'] ?? null,
                    'kata_kerja_dasar' => $validated['kata_kerja_dasar'] ?? null,
                    'is_corrected' => $isChanged ? true : $hasil->is_corrected,
                    'correction_notes' => $validated['correction_notes'] ?? null,
                    'status' => $hasil->status === 'failed' ? 'pending_validasi' : $hasil->status,
                    'error_message' => null,
                ]);

                Log::info('HasilPreprocessing updated (manual correction)', [
                    'hasil_id' => $hasil->id,
                    'is_corrected' => $isChanged,
                    'corrected_by' => auth()->id(),
                    'pelaku_nama' => $pelakuNama,
                    'korban_nama' => $korbanNama,
                ]);
            });

            //  NEW: TRIGGER AUTO-LEARNING
            $learningResult = null;
            
            if ($isChanged) {
                try {
                    $learningResult = $this->learningService->processLearningFromCorrection(
                        $hasil->fresh(), // Refresh to get updated data
                        $originalKodeMatched,
                        $validated['kode_matched'],
                        auth()->id()
                    );

                    Log::info('LearningService triggered', [
                        'hasil_id' => $hasil->id,
                        'learned' => $learningResult['learned'] ?? false,
                        'details' => $learningResult,
                    ]);

                } catch (\Exception $e) {
                    Log::error('LearningService failed', [
                        'hasil_id' => $hasil->id,
                        'error' => $e->getMessage(),
                    ]);
                    // Don't fail the whole update if learning fails
                }
            }

            //  Return with learning result
            $message = 'Hasil preprocessing berhasil dikoreksi.';
            
            if ($learningResult && $learningResult['learned']) {
                $count = $learningResult['count'] ?? 0;
                $message .= " Sistem telah belajar dari {$count} koreksi.";
            }

            return redirect()->route('hasil-preprocessing.index')
                ->with('success', $message)
                ->with('learning_result', $learningResult); //  Pass to frontend

        } catch (\Illuminate\Validation\ValidationException $e) {
            return back()->withErrors($e->errors())->withInput();
        } catch (\Exception $e) {
            Log::error('HasilPreprocessingController@update', [
                'hasil_id' => $hasil->id,
                'error' => $e->getMessage()
            ]);
            
            return back()->withErrors([
                'update' => 'Gagal update: ' . $e->getMessage()
            ])->withInput();
        }
    }

    /**
     *  APPROVE dengan SMART CHECK verifikasi korban
     */
    public function approve(Request $request, HasilPreprocessing $hasil)
    {
        try {
            if (!in_array($hasil->status, ['pending_validasi', 'failed'])) {
                return back()->withErrors([
                    'approve' => 'Hasil preprocessing sudah divalidasi sebelumnya.'
                ]);
            }

            if ($this->laporanService->laporanExists($hasil->id)) {
                return back()->withErrors([
                    'approve' => 'Laporan variabel sudah dibuat untuk hasil ini.'
                ]);
            }

            // 
            //  SMART CHECK: Apakah perlu verifikasi korban?
            // 
            $needsKorbanVerification = $this->checkNeedsKorbanVerification($hasil);

            if ($needsKorbanVerification) {
                DB::transaction(function () use ($hasil) {
                    $hasil->update([
                        'status' => 'approved',
                        'validated_by' => auth()->id(),
                        'validated_at' => now(),
                        'requires_korban_verification' => true,
                        'korban_verified' => false,
                        'error_message' => null,
                    ]);

                    Log::info('HasilPreprocessing approved - requires korban verification', [
                        'hasil_id' => $hasil->id,
                        'approved_by' => auth()->id(),
                        'korban_santri_id' => $hasil->korban_santri_id,
                    ]);
                });

                return redirect()->route('hasil-preprocessing.verify-korban', $hasil->id)
                    ->with('info', 'Hasil preprocessing di-approve. Silakan verifikasi kondisi korban terlebih dahulu.');
            }

            // 
            // Standard approve
            // 
            DB::transaction(function () use ($hasil) {
                $hasil->update([
                    'status' => 'approved',
                    'validated_by' => auth()->id(),
                    'validated_at' => now(),
                    'error_message' => null,
                ]);

                Log::info('HasilPreprocessing approved', [
                    'hasil_id' => $hasil->id,
                    'approved_by' => auth()->id(),
                    'kode_matched' => $hasil->kode_matched,
                ]);
            });

            try {
                $created = $this->laporanService->createLaporanFromHasil($hasil);
                $totalCreated = count($created['pelanggaran']) + 
                               count($created['apresiasi']) + 
                               count($created['konselor']);

                Log::info('Laporan variabel created', [
                    'hasil_id' => $hasil->id,
                    'total_laporan' => $totalCreated,
                    'pelanggaran' => count($created['pelanggaran']),
                    'apresiasi' => count($created['apresiasi']),
                    'konselor' => count($created['konselor']),
                ]);

                $message = "Hasil preprocessing di-approve! Berhasil membuat {$totalCreated} laporan variabel.";

                if (count($created['pelanggaran']) > 0) {
                    return redirect()->route('laporan-pelanggaran.index')
                        ->with('success', $message . ' Silakan proses laporan pelanggaran.');
                } elseif (count($created['apresiasi']) > 0) {
                    return redirect()->route('laporan-apresiasi.index')
                        ->with('success', $message . ' Silakan proses laporan apresiasi.');
                } elseif (count($created['konselor']) > 0) {
                    return redirect()->route('laporan-konselor.index')
                        ->with('success', $message . ' Silakan proses laporan konseling.');
                } else {
                    return back()->with('warning', 'Hasil preprocessing di-approve, tapi tidak ada laporan variabel yang dibuat.');
                }

            } catch (\Exception $e) {
                Log::error('Failed to create laporan after approve', [
                    'hasil_id' => $hasil->id,
                    'error' => $e->getMessage()
                ]);

                return back()->with('warning', 'Hasil preprocessing di-approve, tapi gagal membuat laporan variabel: ' . $e->getMessage());
            }

        } catch (\Exception $e) {
            Log::error('HasilPreprocessingController@approve', [
                'hasil_id' => $hasil->id,
                'error' => $e->getMessage()
            ]);
            
            return back()->withErrors([
                'approve' => 'Gagal approve: ' . $e->getMessage()
            ]);
        }
    }

    /**
     *  HELPER: Check if needs korban verification
     */
    private function checkNeedsKorbanVerification(HasilPreprocessing $hasil)
    {
        $hasKodePelanggaran = !empty(array_filter($hasil->kode_matched ?? [], fn($kode) => str_starts_with($kode, 'P')));
        $hasKorban = !empty($hasil->korban_santri_id);
        return $hasKodePelanggaran && $hasKorban;
    }

    /**
     *  SHOW: Form verifikasi kondisi korban
     */
    public function verifyKorban(HasilPreprocessing $hasil)
    {
        if ($hasil->status !== 'approved' || !$hasil->requires_korban_verification) {
            return redirect()->route('hasil-preprocessing.index')
                ->with('error', 'Hasil preprocessing ini tidak memerlukan verifikasi korban.');
        }

        if ($hasil->korban_verified) {
            return redirect()->route('hasil-preprocessing.index')
                ->with('info', 'Korban sudah diverifikasi sebelumnya.');
        }

        $hasil->load(['laporanAwal', 'korbanSantri.santriProfile', 'pelakuSantri.santriProfile']);

        $kodePelanggaran = array_filter($hasil->kode_matched ?? [], fn($kode) => str_starts_with($kode, 'P'));
        $kodeKonselorFromNER = array_filter($hasil->kode_matched ?? [], fn($kode) => str_starts_with($kode, 'G'));

        $variabelKonselorList = VariabelKonselor::orderBy('kode')->get()->map(fn($v) => [
            'kode' => $v->kode,
            'gangguan_mental' => $v->gangguan_mental,
            'gejala' => $v->gejala,
            'rekomendasi' => $v->rekomendasi,
            'label' => "{$v->kode} - {$v->gangguan_mental}",
        ]);

        $variabelPelanggaranList = VariabelPelanggaran::whereIn('kode', $kodePelanggaran)->get()->map(fn($v) => [
            'kode' => $v->kode,
            'kategori' => $v->kategori,
            'poin' => $v->poin,
            'tindakan' => $v->tindakan,
        ]);

        return Inertia::render('HasilPreprocessing/VerifyKorban', [
            'hasil' => [
                'id' => $hasil->id,
                'laporan_awal' => [
                    'id' => $hasil->laporan_awal_id,
                    'text_laporan' => $hasil->laporanAwal->text_laporan,
                    'tanggal_kejadian' => $hasil->laporanAwal->tanggal_kejadian?->format('d/m/Y'),
                ],
                'kode_pelanggaran' => array_values($kodePelanggaran),
                'kode_konselor_from_ner' => array_values($kodeKonselorFromNER),
                'pelaku' => $hasil->pelakuSantri && $hasil->pelakuSantri->santriProfile ? [
                    'id' => $hasil->pelakuSantri->id,
                    'nama_lengkap' => $hasil->pelakuSantri->santriProfile->nama_lengkap,
                    'nama_panggilan' => $hasil->pelakuSantri->santriProfile->nama_panggilan,
                    'nisn' => $hasil->pelakuSantri->santriProfile->nisn,
                ] : null,
                'korban' => $hasil->korbanSantri && $hasil->korbanSantri->santriProfile ? [
                    'id' => $hasil->korbanSantri->id,
                    'nama_lengkap' => $hasil->korbanSantri->santriProfile->nama_lengkap,
                    'nama_panggilan' => $hasil->korbanSantri->santriProfile->nama_panggilan,
                    'nisn' => $hasil->korbanSantri->santriProfile->nisn,
                ] : null,
            ],
            'variabelPelanggaranList' => $variabelPelanggaranList,
            'variabelKonselorList' => $variabelKonselorList,
        ]);
    }

    /**
     *  STORE: Submit verifikasi korban
     */
    public function storeVerifyKorban(Request $request, HasilPreprocessing $hasil)
    {
        $validated = $request->validate([
            'has_kondisi_mental' => 'required|boolean',
            'verified_kode_konselor' => 'nullable|array',
            'verified_kode_konselor.*' => 'string|exists:variabel_konselor,kode',
            'catatan_verifikasi' => 'nullable|string|max:1000',
        ]);

        try {
            DB::beginTransaction();

            $hasil->update([
                'korban_verified' => true,
                'korban_verified_at' => now(),
                'korban_verified_by' => auth()->id(),
                'verified_kode_konselor' => $validated['has_kondisi_mental'] ? ($validated['verified_kode_konselor'] ?? []) : [],
                'correction_notes' => $validated['catatan_verifikasi'] ?? $hasil->correction_notes,
            ]);

            Log::info('Korban verification completed', [
                'hasil_id' => $hasil->id,
                'verified_by' => auth()->id(),
                'has_kondisi_mental' => $validated['has_kondisi_mental'],
                'kode_konselor' => $validated['has_kondisi_mental'] ? ($validated['verified_kode_konselor'] ?? []) : [],
            ]);

            DB::commit();

            try {
                $created = $this->laporanService->createLaporanWithKorbanVerification($hasil, $validated['verified_kode_konselor'] ?? []);
                $totalCreated = count($created['pelanggaran']) + count($created['apresiasi']) + count($created['konselor']);

                Log::info('Laporan variabel created after korban verification', [
                    'hasil_id' => $hasil->id,
                    'total_laporan' => $totalCreated,
                    'pelanggaran' => count($created['pelanggaran']),
                    'apresiasi' => count($created['apresiasi']),
                    'konselor' => count($created['konselor']),
                ]);

                $message = "Verifikasi korban selesai! Berhasil membuat {$totalCreated} laporan variabel.";

                if (count($created['pelanggaran']) > 0) {
                    return redirect()->route('laporan-pelanggaran.index')->with('success', $message);
                } else {
                    return redirect()->route('hasil-preprocessing.index')->with('success', $message);
                }

            } catch (\Exception $e) {
                Log::error('Failed to create laporan after verification', ['hasil_id' => $hasil->id, 'error' => $e->getMessage()]);
                return back()->with('error', 'Verifikasi berhasil, tapi gagal membuat laporan: ' . $e->getMessage());
            }

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to verify korban', ['hasil_id' => $hasil->id, 'error' => $e->getMessage()]);
            return back()->with('error', 'Gagal menyimpan verifikasi: ' . $e->getMessage());
        }
    }

    public function reject(Request $request, HasilPreprocessing $hasil)
    {
        try {
            $validated = $request->validate([
                'reason' => 'required|string|max:500',
            ], [
                'reason.required' => 'Alasan penolakan wajib diisi.',
            ]);

            if (!in_array($hasil->status, ['pending_validasi', 'failed'])) {
                return back()->withErrors([
                    'reject' => 'Hasil preprocessing sudah divalidasi sebelumnya.'
                ]);
            }

            DB::transaction(function () use ($hasil, $validated) {
                $hasil->update([
                    'status' => 'rejected',
                    'validated_by' => auth()->id(),
                    'validated_at' => now(),
                    'correction_notes' => $validated['reason'],
                ]);

                $hasil->laporanAwal->update(['status' => 'approved']);

                Log::info('HasilPreprocessing rejected', [
                    'hasil_id' => $hasil->id,
                    'rejected_by' => auth()->id(),
                    'reason' => $validated['reason'],
                ]);
            });

            return redirect()->back()->with('success', 'Hasil preprocessing ditolak. Laporan bisa diproses ulang.');

        } catch (\Illuminate\Validation\ValidationException $e) {
            return back()->withErrors($e->errors());
        } catch (\Exception $e) {
            Log::error('HasilPreprocessingController@reject', [
                'hasil_id' => $hasil->id,
                'error' => $e->getMessage()
            ]);
            
            return back()->withErrors([
                'reject' => 'Gagal reject: ' . $e->getMessage()
            ]);
        }
    }

    public function destroy(HasilPreprocessing $hasil)
    {
        try {
            DB::transaction(function () use ($hasil) {
                $hasil->laporanAwal->update(['status' => 'approved']);
                $hasil->delete();

                Log::info('HasilPreprocessing deleted', [
                    'hasil_id' => $hasil->id,
                    'deleted_by' => auth()->id(),
                ]);
            });

            return back()->with('success', 'Hasil preprocessing dihapus. Laporan bisa diproses ulang.');

        } catch (\Exception $e) {
            Log::error('HasilPreprocessingController@destroy', [
                'hasil_id' => $hasil->id,
                'error' => $e->getMessage()
            ]);
            
            return back()->withErrors([
                'delete' => 'Gagal hapus: ' . $e->getMessage()
            ]);
        }
    }

    // 
    // HELPER METHODS
    // 

    private function getSantriList()
    {
        return User::where('role', 'santri')
            ->where('status', 'active')
            ->with('santriProfile')
            ->get()
            ->filter(fn($u) => $u->santriProfile)
            ->map(function($u) {
                $profile = $u->santriProfile;
                return [
                    'id' => $u->id,
                    'nama_lengkap' => $profile->nama_lengkap,
                    'nama_panggilan' => $profile->nama_panggilan,
                    'nisn' => $profile->nisn,
                    'label' => sprintf(
                        '%s (%s)',
                        $profile->nama_panggilan ?? $profile->nama_lengkap,
                        $profile->nisn ?? '-'
                    ),
                ];
            })
            ->sortBy('nama_panggilan')
            ->values();
    }

    private function getVariabelList()
    {
        try {
            return [
                'pelanggaran' => VariabelPelanggaran::all(['kode', 'kategori'])
                    ->map(fn($v) => [
                        'kode' => $v->kode, 
                        'label' => "{$v->kode} - {$v->kategori}"
                    ])
                    ->values(),
                    
                'apresiasi' => VariabelApresiasi::all(['kode', 'kategori'])
                    ->map(fn($v) => [
                        'kode' => $v->kode, 
                        'label' => "{$v->kode} - {$v->kategori}"
                    ])
                    ->values(),
                    
                'konselor' => VariabelKonselor::all(['kode', 'gangguan_mental'])
                    ->map(fn($v) => [
                        'kode' => $v->kode, 
                        'label' => "{$v->kode} - {$v->gangguan_mental}"
                    ])
                    ->values(),
            ];
        } catch (\Exception $e) {
            Log::error('Error getting variabel list', ['error' => $e->getMessage()]);
            return [
                'pelanggaran' => collect([]),
                'apresiasi' => collect([]),
                'konselor' => collect([]),
            ];
        }
    }

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