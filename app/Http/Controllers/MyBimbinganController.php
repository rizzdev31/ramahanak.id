<?php

namespace App\Http\Controllers;

use App\Models\BimbinganBerkalaJadwal;
use App\Models\BimbinganBerkalaAntrian;
use App\Models\BimbinganBerkalaSesi;
use App\Models\BimbinganBerkalaJawaban;
use App\Services\BimbinganBerkalaService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class MyBimbinganController extends Controller
{
    public function __construct(protected BimbinganBerkalaService $service) {}

    /**
     * Daftar jadwal bimbingan yang relevan untuk santri ini.
     * Menampilkan: aktif (bisa isi), selesai (riwayat)
     */
    public function index()
    {
        $santriId = auth()->id();

        // Jadwal di mana santri ada di antrian
        $antrianList = BimbinganBerkalaAntrian::where('santri_id', $santriId)
            ->with([
                'jadwal' => fn($q) => $q->with([
                    'kelas:id,kode_kelas,nama',
                    'template:id,judul',
                ]),
                // ✅ FIX: Jangan include accessor (tindak_lanjut_label) di select partial
                // Accessor dihitung otomatis oleh model, bukan kolom DB
                'sesi:id,antrian_id,status,tindak_lanjut',
            ])
            ->orderByDesc('created_at')
            ->get()
            ->map(fn($a) => [
                'antrian_id'    => $a->id,
                'jadwal_id'     => $a->jadwal_id,
                'jadwal_judul'  => $a->jadwal?->judul ?? '-',
                'kelas'         => $a->jadwal?->kelas
                    ? "{$a->jadwal->kelas->kode_kelas} — {$a->jadwal->kelas->nama}"
                    : '-',
                'tanggal'       => $a->jadwal?->tanggal_jadwal?->format('d/m/Y') ?? '-',
                'mode'          => $a->jadwal?->mode_pengisian,
                'jadwal_status' => $a->jadwal?->status,
                'antrian_status'=> $a->status,
                'antrian_label' => $a->status_label,
                'sesi_status'   => $a->sesi?->status,
                'tindak_lanjut' => $a->sesi?->tindak_lanjut,
                'tl_label'      => $a->sesi?->tindak_lanjut_label ?? '-',
                // Apakah santri bisa isi mandiri?
                'bisa_isi'      => $this->bisaIsi($a),
                // Apakah sudah selesai?
                'sudah_selesai' => $a->sesi?->status === 'selesai',
            ]);

        return Inertia::render('MyBimbingan/Index', [
            'antrianList' => $antrianList,
        ]);
    }

    /**
     * Form isi soal mandiri oleh santri.
     * Hanya bisa jika: mode = santri_mandiri, status = aktif/berjalan,
     * deadline belum lewat, belum pernah submit.
     */
    public function isiForm(BimbinganBerkalaAntrian $antrian)
    {
        $santriId = auth()->id();

        // Pastikan antrian ini milik santri yang login
        if ($antrian->santri_id !== $santriId) {
            abort(403, 'Anda tidak bisa mengakses form ini.');
        }

        // Validasi boleh isi
        if (!$this->bisaIsi($antrian)) {
            return redirect()->route('my-bimbingan.index')
                ->with('error', 'Form ini tidak tersedia untuk diisi saat ini.');
        }

        // Pastikan belum pernah submit
        $sesiAda = BimbinganBerkalaSesi::where('jadwal_id', $antrian->jadwal_id)
            ->where('santri_id', $santriId)
            ->whereIn('status', ['menunggu_review', 'selesai'])
            ->exists();

        if ($sesiAda) {
            return redirect()->route('my-bimbingan.index')
                ->with('info', 'Anda sudah mengisi form ini sebelumnya.');
        }

        $antrian->load([
            'jadwal.template.pertanyaan',
            'jadwal.kelas:id,kode_kelas,nama',
        ]);

        $jadwal   = $antrian->jadwal;
        $template = $jadwal?->template;

        if (!$template) {
            return back()->with('error', 'Template soal tidak ditemukan.');
        }

        $pertanyaan = $template->pertanyaan->map(fn($p) => [
            'id'                => $p->id,
            'urutan'            => $p->urutan,
            'teks_pertanyaan'   => $p->teks_pertanyaan,
            'tipe'              => $p->tipe,
            'tipe_label'        => $p->tipe_label,
            'is_required'       => $p->is_required,
            // Santri tidak perlu tahu kode gejala atau threshold
            // Hanya tampilkan soal dan konfigurasi tampilan
            'pilihan_json'      => $p->pilihan_json,
            // Untuk skala: label 1-5 default
        ]);

        return Inertia::render('MyBimbingan/IsiForm', [
            'antrian' => [
                'id'        => $antrian->id,
                'jadwal_id' => $jadwal->id,
            ],
            'jadwal' => [
                'judul'    => $jadwal->judul,
                'tanggal'  => $jadwal->tanggal_jadwal?->format('d/m/Y'),
                'kelas'    => $jadwal->kelas
                    ? "{$jadwal->kelas->kode_kelas} — {$jadwal->kelas->nama}"
                    : '-',
                'deadline' => $jadwal->deadline_mandiri?->format('d/m/Y H:i'),
            ],
            'pertanyaan' => $pertanyaan,
        ]);
    }

    /**
     * Submit jawaban dari santri (1x, tidak bisa edit ulang).
     */
    public function isiSubmit(Request $request, BimbinganBerkalaAntrian $antrian)
    {
        $santriId = auth()->id();

        if ($antrian->santri_id !== $santriId) {
            abort(403);
        }

        if (!$this->bisaIsi($antrian)) {
            return back()->withErrors(['submit' => 'Form tidak bisa disubmit saat ini.']);
        }

        // Cek belum pernah submit
        $sesiAda = BimbinganBerkalaSesi::where('jadwal_id', $antrian->jadwal_id)
            ->where('santri_id', $santriId)
            ->whereIn('status', ['menunggu_review', 'selesai'])
            ->exists();

        if ($sesiAda) {
            return back()->withErrors(['submit' => 'Anda sudah mengisi form ini.']);
        }

        $validated = $request->validate([
            'jawaban'                        => 'required|array',
            'jawaban.*.pertanyaan_id'        => 'required|integer',
            'jawaban.*.jawaban_teks'         => 'nullable|string|max:2000',
            'jawaban.*.jawaban_skor'         => 'nullable|integer|min:1|max:5',
            'jawaban.*.jawaban_pilihan'      => 'nullable|string|max:100',
            'jawaban.*.jawaban_ya_tidak'     => 'nullable|boolean',
        ]);

        try {
            DB::transaction(function () use ($antrian, $santriId, $validated) {
                // Buat sesi baru (diisi oleh santri)
                $sesi = BimbinganBerkalaSesi::create([
                    'jadwal_id'          => $antrian->jadwal_id,
                    'antrian_id'         => $antrian->id,
                    'santri_id'          => $santriId,
                    'diisi_oleh'         => 'santri',
                    'diisi_oleh_user_id' => $santriId,
                    'status'             => 'draft',
                ]);

                // Simpan semua jawaban
                foreach ($validated['jawaban'] as $j) {
                    BimbinganBerkalaJawaban::create([
                        'sesi_id'          => $sesi->id,
                        'pertanyaan_id'    => $j['pertanyaan_id'],
                        'jawaban_teks'     => $j['jawaban_teks'] ?? null,
                        'jawaban_skor'     => $j['jawaban_skor'] ?? null,
                        'jawaban_pilihan'  => $j['jawaban_pilihan'] ?? null,
                        'jawaban_ya_tidak' => $j['jawaban_ya_tidak'] ?? null,
                    ]);
                }

                // Update status antrian
                $antrian->update(['status' => 'selesai', 'waktu_selesai' => now()]);

                // Jalankan analisis otomatis
                $this->service->analisisSesi($sesi);
            });

            return redirect()->route('my-bimbingan.index')
                ->with('success', 'Terima kasih! Jawaban kamu sudah terkirim ke Guru BK.');

        } catch (\Exception $e) {
            Log::error('MyBimbinganController: Submit error', [
                'antrian_id' => $antrian->id,
                'santri_id'  => $santriId,
                'error'      => $e->getMessage(),
            ]);
            return back()->withErrors(['submit' => 'Gagal menyimpan jawaban: ' . $e->getMessage()]);
        }
    }

    /**
     * Lihat riwayat hasil bimbingan santri (setelah BK review).
     * Santri hanya lihat ringkasan, tidak lihat detail gejala.
     */
    public function riwayat()
    {
        $santriId = auth()->id();

        $riwayat = BimbinganBerkalaSesi::where('santri_id', $santriId)
            ->where('status', 'selesai')
            ->with('jadwal:id,judul,tanggal_jadwal,kelas_id')
            ->with('jadwal.kelas:id,kode_kelas,nama')
            ->orderByDesc('reviewed_at')
            ->get()
            ->map(fn($s) => [
                'id'            => $s->id,
                'judul'         => $s->jadwal?->judul ?? '-',
                'tanggal'       => $s->jadwal?->tanggal_jadwal?->format('d/m/Y') ?? '-',
                'kelas'         => $s->jadwal?->kelas
                    ? "{$s->jadwal->kelas->kode_kelas} — {$s->jadwal->kelas->nama}"
                    : '-',
                'tindak_lanjut' => $s->tindak_lanjut,
                'tl_label'      => $s->tindak_lanjut_label,
                'tl_badge'      => $s->tindak_lanjut_badge,
                'reviewed_at'   => $s->reviewed_at?->format('d/m/Y'),
            ]);

        return Inertia::render('MyBimbingan/Riwayat', [
            'riwayat' => $riwayat,
        ]);
    }

    /**
     * Santri melihat logbook bimbingan berkala miliknya sendiri.
     * Hanya sesi yang statusnya 'selesai' dan milik santri ini.
     */
    public function logbook()
    {
        $santriId    = auth()->id();
        $bkController = app(\App\Http\Controllers\BimbinganBerkalaController::class);
        $logbookData  = $bkController->getLogbookData($santriId);

        $santri = auth()->user();

        return Inertia::render('MyBimbingan/Logbook', [
            'santriList'       => [],          // santri tidak perlu dropdown
            'selectedSantriId' => $santriId,
            'selectedSantri'   => [
                'id'   => $santri->id,
                'nama' => $santri->santriProfile?->nama_panggilan ?? $santri->username,
                'nisn' => $santri->santriProfile?->nisn ?? '-',
            ],
            'logbookData' => $logbookData,
            'mode'        => 'santri', // santri hanya lihat diri sendiri
        ]);
    }

    private function bisaIsi(BimbinganBerkalaAntrian $antrian): bool
    {
        $jadwal = $antrian->jadwal;
        if (!$jadwal) return false;

        // Mode harus santri_mandiri
        if ($jadwal->mode_pengisian !== 'santri_mandiri') return false;

        // Status jadwal harus aktif atau berjalan
        if (!in_array($jadwal->status, ['aktif', 'berjalan'])) return false;

        // Deadline belum lewat
        if ($jadwal->isDeadlineExpired()) return false;

        // Antrian belum selesai
        if ($antrian->status === 'selesai') return false;

        return true;
    }
}