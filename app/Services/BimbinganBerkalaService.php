<?php

namespace App\Services;

use App\Models\BimbinganBerkalaJadwal;
use App\Models\BimbinganBerkalaAntrian;
use App\Models\BimbinganBerkalaSesi;
use App\Models\BimbinganBerkalaJawaban;
use App\Models\BimbinganBerkalaPertanyaan;
use App\Models\LaporanKonselor;
use App\Models\LaporanApproval;
use App\Models\RiwayatSantri;
use App\Models\SantriProfile;
use App\Models\PenugasanKelas;
use App\Models\VariabelKonselor;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class BimbinganBerkalaService
{
    // ═══════════════════════════════════════════════════════════
    // GENERATE ANTRIAN dari kelas
    // ═══════════════════════════════════════════════════════════

    /**
     * Generate antrian santri berdasarkan kelas jadwal.
     * Urutan: berdasarkan urutan di SantriProfile (kelas_id + id santri)
     */
    public function generateAntrian(BimbinganBerkalaJadwal $jadwal): int
    {
        $kelasId = $jadwal->kelas_id;

        // Ambil semua santri aktif di kelas ini
        $santriList = SantriProfile::where('kelas_id', $kelasId)
            ->whereHas('user', fn($q) => $q->where('status', 'active')->where('role', 'santri'))
            ->with('user')
            ->orderBy('user_id')
            ->get();

        if ($santriList->isEmpty()) {
            Log::warning('BimbinganBerkalaService: Kelas tidak punya santri', [
                'jadwal_id' => $jadwal->id,
                'kelas_id'  => $kelasId,
            ]);
            return 0;
        }

        $count = 0;
        foreach ($santriList as $idx => $profile) {
            // Skip jika sudah ada antrian untuk santri ini di jadwal yang sama
            $exists = BimbinganBerkalaAntrian::where('jadwal_id', $jadwal->id)
                ->where('santri_id', $profile->user_id)
                ->exists();

            if ($exists) continue;

            BimbinganBerkalaAntrian::create([
                'jadwal_id'   => $jadwal->id,
                'santri_id'   => $profile->user_id,
                'nomor_urut'  => $idx + 1,
                'status'      => 'menunggu',
            ]);
            $count++;
        }

        Log::info('BimbinganBerkalaService: Antrian generated', [
            'jadwal_id' => $jadwal->id,
            'count'     => $count,
        ]);

        return $count;
    }

    // ═══════════════════════════════════════════════════════════
    // ANALISIS JAWABAN
    // ═══════════════════════════════════════════════════════════

    /**
     * Analisis semua jawaban dalam sesi dan generate gejala_terdeteksi.
     * Dipanggil setelah semua jawaban tersimpan.
     */
    public function analisisSesi(BimbinganBerkalaSesi $sesi): array
    {
        $jawaban = BimbinganBerkalaJawaban::where('sesi_id', $sesi->id)
            ->with('pertanyaan')
            ->get();

        $gejalaTerdeteksi = [];

        foreach ($jawaban as $j) {
            $pertanyaan = $j->pertanyaan;
            if (!$pertanyaan) continue;

            $result = $this->analisisJawaban($j, $pertanyaan);

            if ($result) {
                $gejalaTerdeteksi[] = $result;

                // Update jawaban dengan hasil analisis
                $j->update([
                    'flag_triggered'        => true,
                    'kode_gejala_triggered' => $result['kode'],
                    'gejala_terdeteksi'     => [$result],
                ]);
            }
        }

        // Deduplicate dan merge gejala dari berbagai soal
        $merged = $this->mergeGejala($gejalaTerdeteksi);

        // Simpan ke sesi
        $sesi->update([
            'gejala_terdeteksi' => $merged,
            'status'            => 'menunggu_review',
        ]);

        Log::info('BimbinganBerkalaService: Analisis selesai', [
            'sesi_id'           => $sesi->id,
            'gejala_terdeteksi' => count($merged),
        ]);

        return $merged;
    }

    /**
     * Analisis 1 jawaban berdasarkan tipe pertanyaan.
     * Return array gejala atau null jika tidak ada flag.
     */
    private function analisisJawaban(
        BimbinganBerkalaJawaban $jawaban,
        BimbinganBerkalaPertanyaan $pertanyaan
    ): ?array {
        $kode = $pertanyaan->kode_gejala_terkait;

        switch ($pertanyaan->tipe) {
            // ── Skala 1-5 ─────────────────────────────────────────
            case 'skala_1_5':
                if (!$kode || is_null($jawaban->jawaban_skor)) return null;
                $threshold = $pertanyaan->threshold_flag ?? 3;

                if ($jawaban->jawaban_skor >= $threshold) {
                    return [
                        'kode'       => $kode,
                        'sumber'     => 'skala',
                        'confidence' => 'tinggi',
                        'detail'     => "Skor {$jawaban->jawaban_skor}/5 ≥ threshold {$threshold}",
                        'soal_id'    => $pertanyaan->id,
                    ];
                }
                return null;

            // ── Ya / Tidak ────────────────────────────────────────
            case 'ya_tidak':
                if (!$kode || is_null($jawaban->jawaban_ya_tidak)) return null;
                $flagJika = $pertanyaan->flag_jika_jawaban ?? 'ya';

                $jawabStr = $jawaban->jawaban_ya_tidak ? 'ya' : 'tidak';
                if ($jawabStr === $flagJika) {
                    return [
                        'kode'       => $kode,
                        'sumber'     => 'pilihan',
                        'confidence' => 'tinggi',
                        'detail'     => "Jawaban '{$jawabStr}' sesuai kondisi flag",
                        'soal_id'    => $pertanyaan->id,
                    ];
                }
                return null;

            // ── Pilihan Ganda ─────────────────────────────────────
            case 'pilihan':
                if (empty($jawaban->jawaban_pilihan) || empty($pertanyaan->pilihan_json)) return null;

                foreach ($pertanyaan->pilihan_json as $pilihan) {
                    if (
                        isset($pilihan['label'], $pilihan['kode_gejala']) &&
                        $pilihan['label'] === $jawaban->jawaban_pilihan &&
                        !empty($pilihan['kode_gejala'])
                    ) {
                        return [
                            'kode'       => $pilihan['kode_gejala'],
                            'sumber'     => 'pilihan',
                            'confidence' => 'tinggi',
                            'detail'     => "Pilih '{$jawaban->jawaban_pilihan}'",
                            'soal_id'    => $pertanyaan->id,
                        ];
                    }
                }
                return null;

            // ── Teks Bebas (NLP) ──────────────────────────────────
            case 'teks_bebas':
                if (empty($jawaban->jawaban_teks) || !$pertanyaan->analisis_nlp_aktif) return null;

                $nlpResult = $this->analyzeJawabanTeksBebas($jawaban->jawaban_teks);

                if (!empty($nlpResult['kode_terdeteksi'])) {
                    // Update jawaban dengan detail NLP
                    $jawaban->update([
                        'gejala_terdeteksi' => $nlpResult['kode_terdeteksi'],
                    ]);

                    // Ambil gejala pertama dengan confidence tertinggi sebagai primary
                    $top = collect($nlpResult['kode_terdeteksi'])
                        ->sortByDesc('confidence')
                        ->first();

                    if ($top) {
                        return [
                            'kode'        => $top['kode'],
                            'sumber'      => 'nlp',
                            'confidence'  => 'sedang',  // NLP selalu 'sedang' - BK harus konfirmasi
                            'detail'      => "Kata pemicu: " . implode(', ', $top['kata_pemicu'] ?? []),
                            'soal_id'     => $pertanyaan->id,
                            'nlp_detail'  => $nlpResult['kode_terdeteksi'],
                        ];
                    }
                }
                return null;

            // ── Teks Curhat (tidak dianalisis) ────────────────────
            case 'teks_curhat':
                return null; // Sengaja tidak dianalisis

            default:
                return null;
        }
    }

    /**
     * Merge dan deduplicate gejala dari berbagai soal.
     * Jika kode sama dari beberapa soal, simpan semua sumber.
     */
    private function mergeGejala(array $gejalaTerdeteksi): array
    {
        $merged = [];

        foreach ($gejalaTerdeteksi as $gejala) {
            $kode = $gejala['kode'];

            if (!isset($merged[$kode])) {
                // Ambil info dari variabel_konselor
                $variabel = VariabelKonselor::where('kode', $kode)->first();
                $merged[$kode] = [
                    'kode'         => $kode,
                    'gangguan'     => $variabel?->gangguan_mental ?? $kode,
                    'rekomendasi'  => $variabel?->rekomendasi ?? '',
                    'confidence'   => $gejala['confidence'],
                    'sumber'       => $gejala['sumber'],
                    'detail'       => [$gejala['detail'] ?? ''],
                    'soal_ids'     => [$gejala['soal_id'] ?? null],
                    'nlp_detail'   => $gejala['nlp_detail'] ?? null,
                ];
            } else {
                // Merge sumber (upgrade confidence jika ada dari skala/pilihan)
                if ($gejala['confidence'] === 'tinggi') {
                    $merged[$kode]['confidence'] = 'tinggi';
                }
                $merged[$kode]['detail'][]   = $gejala['detail'] ?? '';
                $merged[$kode]['soal_ids'][] = $gejala['soal_id'] ?? null;
            }
        }

        return array_values($merged);
    }

    // ═══════════════════════════════════════════════════════════
    // PYTHON NLP UNTUK TEKS BEBAS
    // ═══════════════════════════════════════════════════════════

    /**
     * Panggil analyze_bimbingan.py untuk teks bebas.
     * Terpisah dari preprocessing.py, hanya cari kode G.
     */
    private function analyzeJawabanTeksBebas(string $teks): array
    {
        try {
            $pythonPath = $this->getPythonPath();
            $scriptPath = base_path('python/analyze_bimbingan.py');

            if (!file_exists($scriptPath)) {
                Log::warning('analyze_bimbingan.py tidak ditemukan', ['path' => $scriptPath]);
                return ['kode_terdeteksi' => []];
            }

            $teksEscaped = escapeshellarg($teks);
            $command     = sprintf('"%s" "%s" --text=%s 2>&1', $pythonPath, $scriptPath, $teksEscaped);

            $output     = [];
            $returnCode = 0;
            exec($command, $output, $returnCode);
            $outputString = implode("\n", $output);

            $result = $this->extractJsonFromOutput($outputString);

            if ($result && ($result['status'] ?? '') === 'success') {
                return $result;
            }

            return ['kode_terdeteksi' => []];

        } catch (\Exception $e) {
            Log::error('BimbinganBerkalaService: Python NLP error', [
                'error' => $e->getMessage(),
            ]);
            return ['kode_terdeteksi' => []];
        }
    }

    // ═══════════════════════════════════════════════════════════
    // PREVIEW — Data laporan yang AKAN dibuat (tanpa save ke DB)
    // Untuk halaman konfirmasi sebelum eksekusi opsi rujuk konseling
    // ═══════════════════════════════════════════════════════════

    /**
     * Preview laporan konselor yang akan dibuat per kode gejala.
     * TIDAK menyimpan apapun ke database — murni read-only.
     *
     * @param  BimbinganBerkalaSesi  $sesi
     * @param  array                 $kodeGejala   kode yang sudah dikonfirmasi BK
     * @return array  [ [kode, gangguan, rekomendasi, siapa_approve, ...], ... ]
     */
    public function previewLaporanKonselor(BimbinganBerkalaSesi $sesi, array $kodeGejala): array
    {
        $preview = [];

        // Ambil daftar tenaga pendidik yang akan approve (dari penugasan kelas santri)
        $approverList = $this->getApproverList($sesi->santri_id);

        foreach ($kodeGejala as $kode) {
            $variabel = VariabelKonselor::where('kode', $kode)->first();
            if (!$variabel) continue;

            // Cek apakah laporan dengan kode ini sudah pernah dibuat dari sesi ini
            $sudahAda = LaporanKonselor::where('bimbingan_sesi_id', $sesi->id)
                ->where('kode_konselor', $kode)
                ->exists();

            $preview[] = [
                'kode'          => $kode,
                'gangguan'      => $variabel->gangguan_mental ?? '-',
                'rekomendasi'   => $variabel->rekomendasi ?? '-',
                'kategori'      => $variabel->kategori ?? '-',
                // Siapa saja yang akan menerima approval request
                'approver_list' => $approverList,
                // Flag: laporan sudah pernah dibuat (BK perlu tahu)
                'sudah_ada'     => $sudahAda,
                // Sertakan atau tidak (default true, kecuali sudah ada)
                'sertakan'      => !$sudahAda,
            ];
        }

        return $preview;
    }

    /**
     * Ambil daftar tenaga pendidik yang akan approve laporan santri ini.
     * Read-only — hanya untuk ditampilkan di preview.
     */
    private function getApproverList(int $santriId): array
    {
        try {
            $santri  = User::with('santriProfile')->find($santriId);
            $kelasId = $santri?->santriProfile?->kelas_id;
            if (!$kelasId) return [];

            return PenugasanKelas::where('kelas_id', $kelasId)
                ->where('is_active', 1)
                ->with('user.tenagaPendidikProfile', 'user.guruBkProfile')
                ->get()
                ->map(fn($p) => [
                    'nama' => $p->user?->tenagaPendidikProfile?->nama_lengkap
                           ?? $p->user?->guruBkProfile?->nama_lengkap
                           ?? $p->user?->username
                           ?? '-',
                    'peran' => $p->peran ?? 'wali_kelas',
                ])
                ->toArray();
        } catch (\Exception $e) {
            return [];
        }
    }

    // ═══════════════════════════════════════════════════════════
    // SIMPAN KEPUTUSAN BK & INTEGRASI
    // ═══════════════════════════════════════════════════════════

    /**
     * Simpan keputusan final BK.
     *
     * PERUBAHAN:
     *   Opsi 'rujuk_konseling' TIDAK lagi langsung buat LaporanKonselor di sini.
     *   Simpan dulu status sesi + gejala dikonfirmasi, lalu controller redirect ke
     *   halaman preview. Eksekusi buat laporan dilakukan via konfirmasiLaporanKonselor().
     */
    public function simpanKeputusan(
        BimbinganBerkalaSesi $sesi,
        array $gejalaDikonfirmasi,
        string $tindakLanjut,
        ?string $catatanKeputusan,
        int $reviewedBy
    ): void {
        DB::transaction(function () use ($sesi, $gejalaDikonfirmasi, $tindakLanjut, $catatanKeputusan, $reviewedBy) {

            // ── 1. Update sesi ───────────────────────────────────
            $sesi->update([
                'gejala_dikonfirmasi' => $gejalaDikonfirmasi,
                'tindak_lanjut'       => $tindakLanjut,
                'catatan_keputusan'   => $catatanKeputusan,
                // Status 'selesai' hanya di-set jika BUKAN rujuk_konseling
                // Jika rujuk, status tetap 'menunggu_review' sampai BK konfirmasi di preview
                'status'              => $tindakLanjut === 'rujuk_konseling'
                                         ? 'menunggu_review'
                                         : 'selesai',
                'reviewed_by'         => $reviewedBy,
                'reviewed_at'         => now(),
            ]);

            // ── 2. Update antrian ────────────────────────────────
            // Tandai selesai hanya jika bukan rujuk (rujuk masih butuh 1 langkah lagi)
            if ($tindakLanjut !== 'rujuk_konseling') {
                $sesi->antrian?->update([
                    'status'        => 'selesai',
                    'waktu_selesai' => now(),
                ]);

                // ── 3. Simpan ke riwayat_santri ──────────────────
                RiwayatSantri::create([
                    'santri_id'         => $sesi->santri_id,
                    'bimbingan_sesi_id' => $sesi->id,
                    'jenis_laporan'     => 'bimbingan',
                    'kode'              => 'BB-' . $sesi->jadwal_id,
                    'bobot_poin'        => null,
                    'tanggal_kejadian'  => $sesi->jadwal?->tanggal_jadwal ?? today(),
                    'status'            => 'selesai',
                    'ringkasan'         => 'Bimbingan Berkala: ' . ($sesi->jadwal?->judul ?? ''),
                ]);

                // ── 4. Update status jadwal ──────────────────────
                $this->checkAndUpdateJadwalStatus($sesi->jadwal_id);
            }
            // Jika rujuk_konseling: riwayat_santri dan jadwal status
            // akan di-update setelah BK konfirmasi di halaman preview
        });
    }

    /**
     * Eksekusi pembuatan LaporanKonselor setelah BK konfirmasi di halaman preview.
     * Dipanggil oleh controller setelah user klik "Konfirmasi & Buat Laporan".
     *
     * @param  BimbinganBerkalaSesi  $sesi
     * @param  array                 $kodeDisertakan  kode yang BK pilih untuk disertakan
     */
    public function konfirmasiLaporanKonselor(BimbinganBerkalaSesi $sesi, array $kodeDisertakan): array
    {
        $created = [];

        DB::transaction(function () use ($sesi, $kodeDisertakan, &$created) {
            // 1. Buat LaporanKonselor hanya untuk kode yang disertakan
            if (!empty($kodeDisertakan)) {
                $this->buatLaporanKonselor($sesi, $kodeDisertakan);
                $created = LaporanKonselor::where('bimbingan_sesi_id', $sesi->id)
                    ->pluck('id')
                    ->toArray();
            }

            // 2. Tandai sesi selesai
            $sesi->update(['status' => 'selesai']);

            // 3. Update antrian
            $sesi->antrian?->update([
                'status'        => 'selesai',
                'waktu_selesai' => now(),
            ]);

            // 4. Simpan ke riwayat_santri
            RiwayatSantri::create([
                'santri_id'         => $sesi->santri_id,
                'bimbingan_sesi_id' => $sesi->id,
                'jenis_laporan'     => 'bimbingan',
                'kode'              => 'BB-' . $sesi->jadwal_id,
                'bobot_poin'        => null,
                'tanggal_kejadian'  => $sesi->jadwal?->tanggal_jadwal ?? today(),
                'status'            => 'selesai',
                'ringkasan'         => 'Bimbingan Berkala (Rujuk): ' . ($sesi->jadwal?->judul ?? ''),
            ]);

            // 5. Update status jadwal
            $this->checkAndUpdateJadwalStatus($sesi->jadwal_id);
        });

        return $created;
    }

    /**
     * Buat LaporanKonselor dari bimbingan berkala (TANPA preprocessing).
     * Untuk setiap kode gejala yang dikonfirmasi BK.
     */
    private function buatLaporanKonselor(BimbinganBerkalaSesi $sesi, array $kodeGejala): void
    {
        foreach ($kodeGejala as $kode) {
            $variabel = VariabelKonselor::where('kode', $kode)->first();
            if (!$variabel) {
                Log::warning('BimbinganBerkalaService: Variabel konselor tidak ditemukan', ['kode' => $kode]);
                continue;
            }

            // Buat laporan konselor (hasil_preprocessing_id = NULL)
            $laporan = LaporanKonselor::create([
                'hasil_preprocessing_id' => null,        // dari bimbingan, bukan preprocessing
                'santri_id'              => $sesi->santri_id,
                'kode_konselor'          => $kode,
                'diagnosis_default'      => $variabel->gangguan_mental,
                'tindakan_default'       => $variabel->rekomendasi,
                'catatan_bk'             => $sesi->catatan_keputusan,
                'tanggal_kejadian'       => $sesi->jadwal?->tanggal_jadwal ?? today(),
                'status'                 => 'pending',
                'approval_status'        => 'pending_tenaga_pendidik',
                'sumber'                 => 'bimbingan_berkala',
                'bimbingan_sesi_id'      => $sesi->id,
            ]);

            // Auto-create approval records (pakai LaporanService yang sudah ada)
            $this->createApprovalRecords($laporan, 'App\Models\LaporanKonselor');

            Log::info('BimbinganBerkalaService: LaporanKonselor dibuat', [
                'laporan_id' => $laporan->id,
                'kode'       => $kode,
                'santri_id'  => $sesi->santri_id,
                'sumber'     => 'bimbingan_berkala',
            ]);
        }

        // Update sesi dengan laporan_konselor_id pertama
        $firstLaporan = LaporanKonselor::where('bimbingan_sesi_id', $sesi->id)->first();
        if ($firstLaporan) {
            $sesi->update(['laporan_konselor_id' => $firstLaporan->id]);
        }
    }

    /**
     * Auto-create approval records untuk laporan konselor.
     * Mengikuti pola yang sama dengan LaporanService::createApprovalRecords.
     */
    private function createApprovalRecords(LaporanKonselor $laporan, string $laporanType): void
    {
        try {
            $santri = User::with('santriProfile')->find($laporan->santri_id);

            if (!$santri?->santriProfile?->kelas_id) {
                Log::warning('BimbinganBerkalaService: Santri tidak punya kelas', [
                    'santri_id' => $laporan->santri_id,
                ]);
                return;
            }

            $kelasId = $santri->santriProfile->kelas_id;

            $penugasanList = PenugasanKelas::where('kelas_id', $kelasId)
                ->where('is_active', 1)
                ->get();

            foreach ($penugasanList as $penugasan) {
                LaporanApproval::create([
                    'laporan_type'       => $laporanType,
                    'laporan_id'         => $laporan->id,
                    'tenaga_pendidik_id' => $penugasan->user_id,
                    'deadline_at'        => now()->addDay(),
                ]);
            }

        } catch (\Exception $e) {
            Log::error('BimbinganBerkalaService: createApprovalRecords gagal', [
                'laporan_id' => $laporan->id,
                'error'      => $e->getMessage(),
            ]);
        }
    }

    /**
     * Cek dan update status jadwal jika semua antrian sudah selesai.
     */
    private function checkAndUpdateJadwalStatus(int $jadwalId): void
    {
        $jadwal  = BimbinganBerkalaJadwal::find($jadwalId);
        if (!$jadwal) return;

        $total   = BimbinganBerkalaAntrian::where('jadwal_id', $jadwalId)->count();
        $done    = BimbinganBerkalaAntrian::where('jadwal_id', $jadwalId)
            ->whereIn('status', ['selesai', 'tidak_hadir'])
            ->count();

        if ($total > 0 && $done >= $total) {
            $jadwal->update(['status' => 'selesai']);
            Log::info('BimbinganBerkalaService: Jadwal selesai', ['jadwal_id' => $jadwalId]);
        }
    }

    // ═══════════════════════════════════════════════════════════
    // DATA TERINTEGRASI SANTRI untuk halaman Review
    // ═══════════════════════════════════════════════════════════

    /**
     * Ambil semua data santri yang terintegrasi untuk halaman review BK.
     * Read-only dari sistem yang sudah ada.
     */
    public function getDataTerintegrasi(int $santriId): array
    {
        // Poin dari riwayat_santri
        $totalPoinPelanggaran = \App\Models\RiwayatSantri::where('santri_id', $santriId)
            ->where('jenis_laporan', 'pelanggaran')
            ->whereNotNull('bobot_poin')
            ->sum('bobot_poin');

        $totalPoinApresiasi = \App\Models\RiwayatSantri::where('santri_id', $santriId)
            ->where('jenis_laporan', 'apresiasi')
            ->sum('bobot_poin');

        // Expert System Point aktif
        $expertSystemPoint = \App\Models\LaporanExpertSystemPoint::where('santri_id', $santriId)
            ->whereIn('status', ['pending', 'in_progress'])
            ->get(['id', 'jenis', 'kode', 'konsekuensi_atau_reward', 'status'])
            ->map(fn($e) => [
                'kode'   => $e->kode,
                'jenis'  => $e->jenis,
                'status' => $e->status,
                'label'  => $e->konsekuensi_atau_reward,
            ])
            ->toArray();

        // Konseling aktif
        $konselingAktif = \App\Models\LaporanExpertSystemKonselor::where('santri_id', $santriId)
            ->where('status', 'in_progress')
            ->get(['id', 'diagnosis_nama', 'sesi_bimbingan_terakhir', 'status'])
            ->map(fn($k) => [
                'id'      => $k->id,
                'nama'    => $k->diagnosis_nama,
                'sesi'    => $k->sesi_bimbingan_terakhir,
                'status'  => $k->status,
            ])
            ->toArray();

        // Riwayat bimbingan berkala (3 sesi terakhir)
        $riwayatBimbingan = BimbinganBerkalaSesi::where('santri_id', $santriId)
            ->where('status', 'selesai')
            ->with('jadwal:id,judul,tanggal_jadwal')
            ->latest()
            ->take(3)
            ->get()
            ->map(fn($s) => [
                'id'             => $s->id,
                'judul'          => $s->jadwal?->judul ?? '-',
                'tanggal'        => $s->jadwal?->tanggal_jadwal?->format('d/m/Y') ?? '-',
                'tindak_lanjut'  => $s->tindak_lanjut,
                'tl_label'       => $s->tindak_lanjut_label,
            ])
            ->toArray();

        return [
            'total_poin_pelanggaran' => $totalPoinPelanggaran,
            'total_poin_apresiasi'   => $totalPoinApresiasi,
            'net_poin'               => $totalPoinApresiasi - $totalPoinPelanggaran,
            'expert_system_aktif'    => $expertSystemPoint,
            'konseling_aktif'        => $konselingAktif,
            'riwayat_bimbingan'      => $riwayatBimbingan,
        ];
    }

    // ═══════════════════════════════════════════════════════════
    // PRIVATE HELPERS
    // ═══════════════════════════════════════════════════════════

    private function extractJsonFromOutput(string $output): ?array
    {
        // Sama persis dengan ProcessLaporanJob
        $lines = explode("\n", trim($output));
        for ($i = count($lines) - 1; $i >= 0; $i--) {
            $line = trim($lines[$i]);
            if ($line && isset($line[0]) && $line[0] === '{') {
                $result = json_decode($line, true);
                if (json_last_error() === JSON_ERROR_NONE) return $result;
            }
        }
        $start = strpos($output, '{');
        $end   = strrpos($output, '}');
        if ($start !== false && $end !== false) {
            $result = json_decode(substr($output, $start, $end - $start + 1), true);
            if (json_last_error() === JSON_ERROR_NONE) return $result;
        }
        return null;
    }

    private function getPythonPath(): string
    {
        $basePath = base_path('python');
        $path     = DIRECTORY_SEPARATOR === '\\'
            ? $basePath . '\\venv\\Scripts\\python.exe'
            : $basePath . '/venv/bin/python';

        return file_exists($path) ? $path : 'python';
    }
}