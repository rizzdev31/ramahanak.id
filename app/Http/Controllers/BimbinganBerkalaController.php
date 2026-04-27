<?php

namespace App\Http\Controllers;

use App\Models\BimbinganBerkalaTemplate;
use App\Models\BimbinganBerkalaPertanyaan;
use App\Models\BimbinganBerkalaJadwal;
use App\Models\BimbinganBerkalaAntrian;
use App\Models\BimbinganBerkalaSesi;
use App\Models\BimbinganBerkalaJawaban;
use App\Models\Kelas;
use App\Models\VariabelKonselor;
use App\Services\BimbinganBerkalaService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class BimbinganBerkalaController extends Controller
{
    public function __construct(protected BimbinganBerkalaService $service) {}

    // ═══════════════════════════════════════════════════════════
    // TEMPLATE — CRUD
    // ═══════════════════════════════════════════════════════════

    public function templateIndex()
    {
        $templates = BimbinganBerkalaTemplate::withCount('pertanyaan')
            ->withCount('jadwal')
            ->with('creator:id,username')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn($t) => [
                'id'              => $t->id,
                'judul'           => $t->judul,
                'deskripsi'       => $t->deskripsi,
                'tujuan'          => $t->tujuan,
                'is_active'       => $t->is_active,
                'is_locked'       => $t->is_locked,
                'jumlah_soal'     => $t->pertanyaan_count,
                'jumlah_pemakai'  => $t->jadwal_count,
                'created_by_name' => $t->creator?->username ?? '-',
                'created_at'      => $t->created_at?->format('d/m/Y'),
            ]);

        return Inertia::render('MyBimbingan/Template/Index', [
            'templates' => $templates,
        ]);
    }

    public function templateStore(Request $request)
    {
        $validated = $request->validate([
            'judul'    => 'required|string|max:200',
            'deskripsi'=> 'nullable|string',
            'tujuan'   => 'nullable|string',
        ]);

        $template = BimbinganBerkalaTemplate::create([
            ...$validated,
            'created_by' => auth()->id(),
            'is_active'  => true,
            'is_locked'  => false,
        ]);

        return redirect()
            ->route('my-bimbingan.template.builder', $template->id)
            ->with('success', 'Template berhasil dibuat! Sekarang tambahkan soal-soal.');
    }

    public function templateBuilder(BimbinganBerkalaTemplate $template)
    {
        if ($template->is_locked) {
            return back()->with('error', 'Template ini dikunci dan tidak bisa diedit.');
        }

        $template->load(['pertanyaan' => fn($q) => $q->orderBy('urutan')]);

        $variabelKonselor = VariabelKonselor::orderBy('kode')
            ->get(['kode', 'gangguan_mental'])
            ->map(fn($v) => ['kode' => $v->kode, 'label' => "{$v->kode} — {$v->gangguan_mental}"]);

        return Inertia::render('MyBimbingan/Template/Builder', [
            'template'         => [
                'id'          => $template->id,
                'judul'       => $template->judul,
                'deskripsi'   => $template->deskripsi,
                'tujuan'      => $template->tujuan,
                'is_locked'   => $template->is_locked,
                'pertanyaan'  => $template->pertanyaan->map(fn($p) => [
                    'id'                  => $p->id,
                    'urutan'              => $p->urutan,
                    'teks_pertanyaan'     => $p->teks_pertanyaan,
                    'tipe'                => $p->tipe,
                    'tipe_label'          => $p->tipe_label,
                    'is_required'         => $p->is_required,
                    'kode_gejala_terkait' => $p->kode_gejala_terkait,
                    'threshold_flag'      => $p->threshold_flag,
                    'flag_jika_jawaban'   => $p->flag_jika_jawaban,
                    'pilihan_json'        => $p->pilihan_json,
                    'analisis_nlp_aktif'  => $p->analisis_nlp_aktif,
                ]),
            ],
            'variabelKonselor' => $variabelKonselor,
            'tipeOptions'      => [
                ['value' => 'skala_1_5',   'label' => 'Skala 1-5',              'icon' => '🔢'],
                ['value' => 'ya_tidak',    'label' => 'Ya / Tidak',             'icon' => '✓✗'],
                ['value' => 'pilihan',     'label' => 'Pilihan Ganda',          'icon' => '☑'],
                ['value' => 'teks_bebas',  'label' => 'Teks Bebas (Analisis)',  'icon' => '🔍'],
                ['value' => 'teks_curhat', 'label' => 'Teks Bebas (Curhat)',    'icon' => '💬'],
            ],
        ]);
    }

    public function templateUpdate(Request $request, BimbinganBerkalaTemplate $template)
    {
        if ($template->is_locked) {
            return back()->withErrors(['update' => 'Template dikunci.']);
        }

        $validated = $request->validate([
            'judul'    => 'required|string|max:200',
            'deskripsi'=> 'nullable|string',
            'tujuan'   => 'nullable|string',
        ]);

        $template->update($validated);
        return back()->with('success', 'Template berhasil diperbarui.');
    }

    public function templateDestroy(BimbinganBerkalaTemplate $template)
    {
        if ($template->is_locked) {
            return back()->withErrors(['delete' => 'Template dikunci, tidak bisa dihapus.']);
        }
        if ($template->jadwal()->count() > 0) {
            return back()->withErrors(['delete' => 'Template sudah dipakai di jadwal, tidak bisa dihapus.']);
        }

        $template->delete();
        return redirect()->route('my-bimbingan.template.index')
            ->with('success', 'Template berhasil dihapus.');
    }

    // ─── Soal CRUD (dalam template builder) ───────────────────

    public function soalStore(Request $request, BimbinganBerkalaTemplate $template)
    {
        if ($template->is_locked) {
            return back()->withErrors(['soal' => 'Template dikunci.']);
        }

        $validated = $request->validate([
            'teks_pertanyaan'     => 'required|string',
            'tipe'                => 'required|in:skala_1_5,ya_tidak,pilihan,teks_bebas,teks_curhat',
            'is_required'         => 'boolean',
            'kode_gejala_terkait' => 'nullable|string|max:10',
            'threshold_flag'      => 'nullable|integer|min:1|max:5',
            'flag_jika_jawaban'   => 'nullable|in:ya,tidak',
            'pilihan_json'        => 'nullable|array',
            'analisis_nlp_aktif'  => 'boolean',
        ]);

        // Urutan: setelah soal terakhir
        $urutan = $template->pertanyaan()->max('urutan') + 1;

        $soal = BimbinganBerkalaPertanyaan::create([
            ...$validated,
            'template_id' => $template->id,
            'urutan'      => $urutan,
        ]);

        return back()->with('success', "Soal #{$urutan} berhasil ditambahkan.");
    }

    public function soalUpdate(Request $request, BimbinganBerkalaPertanyaan $soal)
    {
        if ($soal->template->is_locked) {
            return back()->withErrors(['soal' => 'Template dikunci.']);
        }

        $validated = $request->validate([
            'teks_pertanyaan'     => 'required|string',
            'tipe'                => 'required|in:skala_1_5,ya_tidak,pilihan,teks_bebas,teks_curhat',
            'is_required'         => 'boolean',
            'kode_gejala_terkait' => 'nullable|string|max:10',
            'threshold_flag'      => 'nullable|integer|min:1|max:5',
            'flag_jika_jawaban'   => 'nullable|in:ya,tidak',
            'pilihan_json'        => 'nullable|array',
            'analisis_nlp_aktif'  => 'boolean',
        ]);

        $soal->update($validated);
        return back()->with('success', 'Soal berhasil diperbarui.');
    }

    public function soalDestroy(BimbinganBerkalaPertanyaan $soal)
    {
        if ($soal->template->is_locked) {
            return back()->withErrors(['soal' => 'Template dikunci.']);
        }

        $templateId = $soal->template_id;
        $soal->delete();

        // Re-urut soal yang tersisa
        $remaining = BimbinganBerkalaPertanyaan::where('template_id', $templateId)
            ->orderBy('urutan')->get();
        foreach ($remaining as $i => $s) {
            $s->update(['urutan' => $i + 1]);
        }

        return back()->with('success', 'Soal berhasil dihapus.');
    }

    public function soalReorder(Request $request, BimbinganBerkalaTemplate $template)
    {
        $validated = $request->validate([
            'urutan' => 'required|array',          // [{id: 1, urutan: 1}, ...]
            'urutan.*.id'    => 'required|integer',
            'urutan.*.urutan'=> 'required|integer',
        ]);

        DB::transaction(function () use ($validated) {
            foreach ($validated['urutan'] as $item) {
                BimbinganBerkalaPertanyaan::where('id', $item['id'])
                    ->update(['urutan' => $item['urutan']]);
            }
        });

        return back()->with('success', 'Urutan soal berhasil disimpan.');
    }

    // ═══════════════════════════════════════════════════════════
    // JADWAL — CRUD & MONITORING
    // ═══════════════════════════════════════════════════════════

    public function jadwalIndex(Request $request)
    {
        $query = BimbinganBerkalaJadwal::with([
            'template:id,judul',
            'kelas:id,kode_kelas,nama',
            'creator:id,username',
        ])
        ->withCount('antrian')
        ->orderByDesc('tanggal_jadwal');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('kelas_id')) {
            $query->where('kelas_id', $request->kelas_id);
        }

        $jadwalList = $query->paginate(15)->through(fn($j) => [
            'id'             => $j->id,
            'judul'          => $j->judul,
            'template_judul' => $j->template?->judul ?? '-',
            'kelas'          => $j->kelas ? "{$j->kelas->kode_kelas} — {$j->kelas->nama}" : '-',
            'tanggal'        => $j->tanggal_jadwal?->format('d/m/Y'),
            'mode'           => $j->mode_label,
            'status'         => $j->status,
            'status_label'   => $j->status_label,
            'status_badge'   => $j->status_badge,
            'progress'       => $j->progress,
            'created_by'     => $j->creator?->username ?? '-',
        ]);

        $kelasList = Kelas::where('status', 'active')
            ->where('kode_kelas', '!=', 'PENDING')
            ->orderBy('tingkat')->orderBy('kode_kelas')
            ->get(['id', 'kode_kelas', 'nama']);

        return Inertia::render('MyBimbingan/Jadwal/Index', [
            'jadwalList' => $jadwalList,
            'kelasList'  => $kelasList,
            'filters'    => $request->only(['status', 'kelas_id']),
        ]);
    }

    public function jadwalCreate()
    {
        $templates = BimbinganBerkalaTemplate::where('is_active', true)
            ->withCount('pertanyaan')
            ->orderByDesc('created_at')
            ->get(['id', 'judul', 'deskripsi'])
            ->map(fn($t) => [
                'id'          => $t->id,
                'judul'       => $t->judul,
                'deskripsi'   => $t->deskripsi,
                'jumlah_soal' => $t->pertanyaan_count,
            ]);

        $kelasList = Kelas::where('status', 'active')
            ->where('kode_kelas', '!=', 'PENDING')
            ->orderBy('tingkat')->orderBy('kode_kelas')
            ->get(['id', 'kode_kelas', 'nama', 'tingkat'])
            ->map(fn($k) => [
                'id'    => $k->id,
                'label' => "{$k->kode_kelas} — {$k->nama}",
            ]);

        return Inertia::render('MyBimbingan/Jadwal/Create', [
            'templates' => $templates,
            'kelasList' => $kelasList,
        ]);
    }

    public function jadwalStore(Request $request)
    {
        $validated = $request->validate([
            'template_id'           => 'required|exists:bimbingan_berkala_template,id',
            'kelas_id'              => 'required|exists:kelas,id',
            'judul'                 => 'required|string|max:200',
            'tanggal_jadwal'        => 'required|date',
            'waktu_mulai'           => 'nullable|date_format:H:i',
            'waktu_selesai'         => 'nullable|date_format:H:i',
            'catatan_untuk_tendik'  => 'nullable|string',
            'mode_pengisian'        => 'required|in:bk_langsung,santri_mandiri',
            'deadline_mandiri'      => 'nullable|required_if:mode_pengisian,santri_mandiri|date',
        ]);

        DB::transaction(function () use ($validated) {
            $jadwal = BimbinganBerkalaJadwal::create([
                ...$validated,
                'created_by' => auth()->id(),
                'status'     => 'draft',
            ]);

            // Generate antrian otomatis
            $count = $this->service->generateAntrian($jadwal);

            // Langsung aktifkan jika sudah ada santri
            if ($count > 0) {
                $jadwal->update(['status' => 'aktif']);
            }

            Log::info('BimbinganBerkalaController: Jadwal dibuat', [
                'jadwal_id'     => $jadwal->id,
                'antrian_count' => $count,
            ]);
        });

        return redirect()->route('my-bimbingan.jadwal.index')
            ->with('success', 'Jadwal bimbingan berhasil dibuat dan antrian sudah digenerate!');
    }

    public function jadwalShow(BimbinganBerkalaJadwal $jadwal)
    {
        $jadwal->load([
            'template:id,judul,deskripsi',
            'kelas:id,kode_kelas,nama',
            'creator:id,username',
            'antrian' => fn($q) => $q->with([
                'santri:id,username',
                'santri.santriProfile:user_id,nama_panggilan,nama_lengkap,nisn',
                'sesi:id,antrian_id,status,tindak_lanjut,reviewed_at',
            ])->orderBy('nomor_urut'),
        ]);

        $progress = $jadwal->progress;

        return Inertia::render('MyBimbingan/Jadwal/Show', [
            'jadwal' => [
                'id'                   => $jadwal->id,
                'judul'                => $jadwal->judul,
                'template_judul'       => $jadwal->template?->judul,
                'kelas'                => $jadwal->kelas
                    ? "{$jadwal->kelas->kode_kelas} — {$jadwal->kelas->nama}"
                    : '-',
                'tanggal'              => $jadwal->tanggal_jadwal?->format('d/m/Y'),
                'waktu_mulai'          => $jadwal->waktu_mulai,
                'waktu_selesai'        => $jadwal->waktu_selesai,
                'mode'                 => $jadwal->mode_pengisian,
                'mode_label'           => $jadwal->mode_label,
                'status'               => $jadwal->status,
                'status_label'         => $jadwal->status_label,
                'status_badge'         => $jadwal->status_badge,
                'catatan_untuk_tendik' => $jadwal->catatan_untuk_tendik,
                'deadline_mandiri'     => $jadwal->deadline_mandiri?->format('d/m/Y H:i'),
                'progress'             => $progress,
                'antrian'              => $jadwal->antrian->map(fn($a) => [
                    'id'           => $a->id,
                    'nomor_urut'   => $a->nomor_urut,
                    'status'       => $a->status,
                    'status_label' => $a->status_label,
                    'status_badge' => $a->status_badge,
                    'santri'       => [
                        'id'   => $a->santri?->id,
                        'nama' => $a->santri?->santriProfile?->nama_panggilan
                               ?? $a->santri?->santriProfile?->nama_lengkap
                               ?? $a->santri?->username ?? '-',
                        'nisn' => $a->santri?->santriProfile?->nisn ?? '-',
                    ],
                    'sesi_status'         => $a->sesi?->status,
                    'sesi_tindak_lanjut'  => $a->sesi?->tindak_lanjut,
                    'sesi_id'             => $a->sesi?->id,
                    'waktu_dipanggil'     => $a->waktu_dipanggil?->format('H:i'),
                    'waktu_selesai'       => $a->waktu_selesai?->format('H:i'),
                ]),
            ],
        ]);
    }

    public function jadwalDestroy(BimbinganBerkalaJadwal $jadwal)
    {
        if (in_array($jadwal->status, ['berjalan', 'selesai'])) {
            return back()->withErrors(['delete' => 'Jadwal yang sedang berjalan atau selesai tidak bisa dihapus.']);
        }
        $jadwal->delete();
        return redirect()->route('my-bimbingan.jadwal.index')
            ->with('success', 'Jadwal berhasil dihapus.');
    }

    // ─── Panggil Berikutnya ────────────────────────────────────

    public function panggilBerikutnya(BimbinganBerkalaJadwal $jadwal)
    {
        if (!in_array($jadwal->status, ['aktif', 'berjalan'])) {
            return back()->withErrors(['panggil' => 'Jadwal tidak dalam status aktif.']);
        }

        $antrian = $jadwal->getAntrianBerikutnya();
        if (!$antrian) {
            return back()->with('info', 'Semua santri sudah dipanggil.');
        }

        DB::transaction(function () use ($antrian, $jadwal) {
            // Update antrian sebelumnya ke 'menunggu' jika masih 'dipanggil'
            BimbinganBerkalaAntrian::where('jadwal_id', $jadwal->id)
                ->where('status', 'dipanggil')
                ->update(['status' => 'menunggu']);

            $antrian->update([
                'status'          => 'dipanggil',
                'waktu_dipanggil' => now(),
            ]);

            if ($jadwal->status === 'aktif') {
                $jadwal->update(['status' => 'berjalan']);
            }
        });

        return redirect()->route('my-bimbingan.sesi.form', $antrian->id)
            ->with('success', "Santri #{$antrian->nomor_urut} dipanggil.");
    }

    public function antrianTidakHadir(BimbinganBerkalaAntrian $antrian)
    {
        $antrian->update(['status' => 'tidak_hadir', 'waktu_selesai' => now()]);
        $this->service->simpanKeputusan(
            // Buat sesi dummy untuk tidak hadir
            tap(BimbinganBerkalaSesi::firstOrCreate(
                ['jadwal_id' => $antrian->jadwal_id, 'santri_id' => $antrian->santri_id],
                [
                    'antrian_id'         => $antrian->id,
                    'diisi_oleh'         => 'bk',
                    'diisi_oleh_user_id' => auth()->id(),
                    'status'             => 'draft',
                ]
            ), fn($s) => null),
            [],
            'tidak_perlu',
            'Santri tidak hadir',
            auth()->id()
        );

        return back()->with('success', 'Santri ditandai tidak hadir.');
    }

    // ═══════════════════════════════════════════════════════════
    // SESI — BK langsung buka form untuk santri tertentu
    // Akses dari tombol "Isi" di daftar antrian jadwal
    // ═══════════════════════════════════════════════════════════

    /**
     * BK buka form sesi untuk santri tertentu langsung dari jadwal.
     * Berbeda dari sesiForm (yang butuh antrian di-panggil dulu),
     * ini langsung buka form tanpa ubah status antrian ke 'dipanggil'.
     * Berguna untuk mode BK yang ingin isi tanpa urutan ketat.
     */
    public function sesiFormBySantri(BimbinganBerkalaJadwal $jadwal, BimbinganBerkalaAntrian $antrian)
    {
        // Pastikan antrian memang milik jadwal ini
        if ($antrian->jadwal_id !== $jadwal->id) {
            abort(404, 'Antrian tidak ditemukan di jadwal ini.');
        }

        // Jika sesi sudah selesai, redirect ke review
        if ($antrian->sesi && $antrian->sesi->status === 'selesai') {
            return redirect()->route('my-bimbingan.sesi.review', $antrian->sesi->id)
                ->with('info', 'Sesi untuk santri ini sudah selesai.');
        }

        // Jika ada sesi draft/menunggu_review, langsung buka review
        if ($antrian->sesi && $antrian->sesi->status === 'menunggu_review') {
            return redirect()->route('my-bimbingan.sesi.review', $antrian->sesi->id)
                ->with('info', 'Jawaban sudah masuk, silakan review.');
        }

        // Update status antrian ke dipanggil jika belum
        if ($antrian->status === 'menunggu') {
            $antrian->update([
                'status'          => 'dipanggil',
                'waktu_dipanggil' => now(),
            ]);
            // Update jadwal ke berjalan jika masih aktif
            if ($jadwal->status === 'aktif') {
                $jadwal->update(['status' => 'berjalan']);
            }
        }

        // Delegate ke sesiForm yang sudah ada
        return $this->sesiForm($antrian);
    }

    // ═══════════════════════════════════════════════════════════
    // SESI — Form Isi Jawaban (mode BK)
    // ═══════════════════════════════════════════════════════════

    public function sesiForm(BimbinganBerkalaAntrian $antrian)
    {
        $antrian->load([
            'jadwal.template.pertanyaan',
            'santri:id,username',
            'santri.santriProfile:user_id,nama_panggilan,nama_lengkap,nisn',
            'sesi.jawaban',
        ]);

        $jadwal   = $antrian->jadwal;
        $template = $jadwal->template;

        if (!$template) {
            return back()->withErrors(['sesi' => 'Template tidak ditemukan.']);
        }

        // Buat sesi jika belum ada
        $sesi = $antrian->sesi ?? BimbinganBerkalaSesi::create([
            'jadwal_id'          => $jadwal->id,
            'antrian_id'         => $antrian->id,
            'santri_id'          => $antrian->santri_id,
            'diisi_oleh'         => 'bk',
            'diisi_oleh_user_id' => auth()->id(),
            'status'             => 'draft',
        ]);

        $pertanyaan = $template->pertanyaan->map(fn($p) => [
            'id'                  => $p->id,
            'urutan'              => $p->urutan,
            'teks_pertanyaan'     => $p->teks_pertanyaan,
            'tipe'                => $p->tipe,
            'tipe_label'          => $p->tipe_label,
            'is_required'         => $p->is_required,
            'kode_gejala_terkait' => $p->kode_gejala_terkait,
            'threshold_flag'      => $p->threshold_flag,
            'flag_jika_jawaban'   => $p->flag_jika_jawaban,
            'pilihan_json'        => $p->pilihan_json,
            'analisis_nlp_aktif'  => $p->analisis_nlp_aktif,
        ]);

        // Jawaban yang sudah ada (jika sesi pernah disimpan sebagian)
        $jawabanExisting = $sesi->jawaban->keyBy('pertanyaan_id')
            ->map(fn($j) => [
                'jawaban_teks'     => $j->jawaban_teks,
                'jawaban_skor'     => $j->jawaban_skor,
                'jawaban_pilihan'  => $j->jawaban_pilihan,
                'jawaban_ya_tidak' => $j->jawaban_ya_tidak,
            ]);

        return Inertia::render('MyBimbingan/Sesi/Form', [
            'antrian'          => [
                'id'         => $antrian->id,
                'nomor_urut' => $antrian->nomor_urut,
                'jadwal_id'  => $jadwal->id,
                'jadwal_judul' => $jadwal->judul,
            ],
            'sesi'             => ['id' => $sesi->id],
            'santri'           => [
                'id'   => $antrian->santri?->id,
                'nama' => $antrian->santri?->santriProfile?->nama_panggilan
                       ?? $antrian->santri?->username ?? '-',
                'nisn' => $antrian->santri?->santriProfile?->nisn ?? '-',
            ],
            'pertanyaan'       => $pertanyaan,
            'jawaban_existing' => $jawabanExisting,
        ]);
    }

    public function sesiStore(Request $request, BimbinganBerkalaSesi $sesi)
    {
        $validated = $request->validate([
            'jawaban'           => 'required|array',
            'jawaban.*.pertanyaan_id' => 'required|integer',
            'jawaban.*.jawaban_teks'  => 'nullable|string',
            'jawaban.*.jawaban_skor'  => 'nullable|integer|min:1|max:5',
            'jawaban.*.jawaban_pilihan'   => 'nullable|string',
            'jawaban.*.jawaban_ya_tidak'  => 'nullable|boolean',
            'catatan_bk_umum'   => 'nullable|string|max:2000',
        ]);

        DB::transaction(function () use ($sesi, $validated) {
            // Update catatan umum
            $sesi->update(['catatan_bk_umum' => $validated['catatan_bk_umum'] ?? null]);

            // Simpan / update jawaban
            foreach ($validated['jawaban'] as $j) {
                BimbinganBerkalaJawaban::updateOrCreate(
                    ['sesi_id' => $sesi->id, 'pertanyaan_id' => $j['pertanyaan_id']],
                    [
                        'jawaban_teks'     => $j['jawaban_teks'] ?? null,
                        'jawaban_skor'     => $j['jawaban_skor'] ?? null,
                        'jawaban_pilihan'  => $j['jawaban_pilihan'] ?? null,
                        'jawaban_ya_tidak' => $j['jawaban_ya_tidak'] ?? null,
                    ]
                );
            }
        });

        // Jalankan analisis
        $gejalaTerdeteksi = $this->service->analisisSesi($sesi);

        return redirect()->route('my-bimbingan.sesi.review', $sesi->id)
            ->with('success', 'Jawaban tersimpan. Silakan review hasil analisis.');
    }

    // ═══════════════════════════════════════════════════════════
    // SESI — Review & Keputusan BK
    // ═══════════════════════════════════════════════════════════

    public function sesiReview(BimbinganBerkalaSesi $sesi)
    {
        $sesi->load([
            'jadwal:id,judul,kelas_id,tanggal_jadwal',
            'santri:id,username',
            'santri.santriProfile:user_id,nama_panggilan,nama_lengkap,nisn',
            'jawaban.pertanyaan',
        ]);

        // Data terintegrasi dari sistem lain (READ ONLY)
        $dataTerintegrasi = $this->service->getDataTerintegrasi($sesi->santri_id);

        $variabelKonselor = VariabelKonselor::orderBy('kode')
            ->get(['kode', 'gangguan_mental', 'rekomendasi'])
            ->map(fn($v) => [
                'kode'     => $v->kode,
                'label'    => "{$v->kode} — {$v->gangguan_mental}",
                'rekomendasi' => $v->rekomendasi,
            ]);

        return Inertia::render('MyBimbingan/Sesi/Review', [
            'sesi' => [
                'id'              => $sesi->id,
                'jadwal_judul'    => $sesi->jadwal?->judul ?? '-',
                'tanggal'         => $sesi->jadwal?->tanggal_jadwal?->format('d/m/Y') ?? '-',
                'catatan_bk_umum' => $sesi->catatan_bk_umum,
                'status'          => $sesi->status,
                'gejala_terdeteksi' => $sesi->gejala_terdeteksi ?? [],
                'jawaban' => $sesi->jawaban->map(fn($j) => [
                    'id'              => $j->id,
                    'urutan'          => $j->pertanyaan?->urutan,
                    'teks_pertanyaan' => $j->pertanyaan?->teks_pertanyaan ?? '-',
                    'tipe'            => $j->pertanyaan?->tipe ?? '-',
                    'jawaban_display' => $j->jawaban_display,
                    'flag_triggered'  => $j->flag_triggered,
                    'kode_triggered'  => $j->kode_gejala_triggered,
                    'nlp_detail'      => $j->gejala_terdeteksi,
                ]),
            ],
            'santri' => [
                'id'   => $sesi->santri?->id,
                'nama' => $sesi->santri?->santriProfile?->nama_panggilan
                       ?? $sesi->santri?->username ?? '-',
                'nisn' => $sesi->santri?->santriProfile?->nisn ?? '-',
            ],
            'dataTerintegrasi'  => $dataTerintegrasi,
            'variabelKonselor'  => $variabelKonselor,
        ]);
    }

    public function sesiSimpanKeputusan(Request $request, BimbinganBerkalaSesi $sesi)
    {
        if ($sesi->status === 'selesai') {
            return back()->withErrors(['keputusan' => 'Sesi sudah selesai diputuskan.']);
        }

        $validated = $request->validate([
            'gejala_dikonfirmasi'   => 'nullable|array',
            'gejala_dikonfirmasi.*' => 'string|max:10',
            'tindak_lanjut'         => 'required|in:tidak_perlu,pantau,rujuk_konseling',
            'catatan_keputusan'     => 'nullable|string|max:2000',
        ]);

        try {
            $this->service->simpanKeputusan(
                $sesi,
                $validated['gejala_dikonfirmasi'] ?? [],
                $validated['tindak_lanjut'],
                $validated['catatan_keputusan'] ?? null,
                auth()->id()
            );

            // ── Opsi 3: redirect ke preview laporan sebelum eksekusi ──
            if ($validated['tindak_lanjut'] === 'rujuk_konseling') {
                return redirect()
                    ->route('my-bimbingan.sesi.preview-laporan', $sesi->id)
                    ->with('info', 'Silakan review laporan yang akan dibuat sebelum dikonfirmasi.');
            }

            return redirect()
                ->route('my-bimbingan.jadwal.show', $sesi->jadwal_id)
                ->with('success', 'Keputusan BK tersimpan.');

        } catch (\Exception $e) {
            Log::error('BimbinganBerkalaController: simpanKeputusan error', [
                'sesi_id' => $sesi->id,
                'error'   => $e->getMessage(),
            ]);
            return back()->withErrors(['keputusan' => 'Gagal menyimpan keputusan: ' . $e->getMessage()]);
        }
    }

    // ═══════════════════════════════════════════════════════════
    // OPSI 3 — Preview & Konfirmasi Laporan Variabel
    // ═══════════════════════════════════════════════════════════

    /**
     * GET: Halaman preview laporan konselor yang akan dibuat.
     * BK bisa lihat detail per kode gejala, siapa yang approve,
     * dan bisa uncheck kode yang tidak ingin disertakan.
     */
    public function sesiPreviewLaporan(BimbinganBerkalaSesi $sesi)
    {
        if ($sesi->tindak_lanjut !== 'rujuk_konseling') {
            return redirect()->route('my-bimbingan.jadwal.show', $sesi->jadwal_id)
                ->with('error', 'Sesi ini bukan rujukan konseling.');
        }
        if ($sesi->status === 'selesai') {
            return redirect()->route('my-bimbingan.jadwal.show', $sesi->jadwal_id)
                ->with('info', 'Laporan sudah dibuat sebelumnya.');
        }

        $sesi->load([
            'jadwal:id,judul,tanggal_jadwal',
            'santri:id,username',
            'santri.santriProfile:user_id,nama_panggilan,nama_lengkap,nisn',
        ]);

        $gejalaKonfirmasi = $sesi->gejala_dikonfirmasi ?? [];
        $preview          = $this->service->previewLaporanKonselor($sesi, $gejalaKonfirmasi);

        return Inertia::render('MyBimbingan/Sesi/PreviewLaporan', [
            'sesi' => [
                'id'           => $sesi->id,
                'jadwal_id'    => $sesi->jadwal_id,
                'jadwal_judul' => $sesi->jadwal?->judul ?? '-',
                'tanggal'      => $sesi->jadwal?->tanggal_jadwal?->format('d/m/Y') ?? '-',
                'catatan_keputusan' => $sesi->catatan_keputusan,
            ],
            'santri' => [
                'id'   => $sesi->santri?->id,
                'nama' => $sesi->santri?->santriProfile?->nama_panggilan
                       ?? $sesi->santri?->username ?? '-',
                'nisn' => $sesi->santri?->santriProfile?->nisn ?? '-',
            ],
            'preview_laporan' => $preview,
        ]);
    }

    /**
     * POST: Eksekusi pembuatan laporan konselor setelah BK konfirmasi.
     * Ini titik akhir opsi 3 — laporan benar-benar dibuat di sini.
     */
    public function sesiKonfirmasiLaporan(Request $request, BimbinganBerkalaSesi $sesi)
    {
        if ($sesi->status === 'selesai') {
            return back()->withErrors(['konfirmasi' => 'Laporan sudah dibuat sebelumnya.']);
        }

        $validated = $request->validate([
            'kode_disertakan'   => 'required|array|min:1',
            'kode_disertakan.*' => 'string|max:10',
        ], [
            'kode_disertakan.min' => 'Pilih minimal 1 kode gejala untuk dirujuk.',
        ]);

        try {
            $created = $this->service->konfirmasiLaporanKonselor(
                $sesi,
                $validated['kode_disertakan']
            );

            $jumlah = count($created);

            return redirect()
                ->route('laporan-konselor.index', ['sumber' => 'bimbingan_berkala'])
                ->with('success', "{$jumlah} laporan konseling berhasil dibuat dan menunggu approval Wali Kelas.");

        } catch (\Exception $e) {
            Log::error('BimbinganBerkalaController: konfirmasiLaporan error', [
                'sesi_id' => $sesi->id,
                'error'   => $e->getMessage(),
            ]);
            return back()->withErrors(['konfirmasi' => 'Gagal membuat laporan: ' . $e->getMessage()]);
        }
    }

    // ═══════════════════════════════════════════════════════════
    // LOGBOOK — Semua sesi bimbingan per santri
    // ═══════════════════════════════════════════════════════════

    /**
     * GET: Halaman logbook — BK lihat logbook semua santri,
     * bisa filter per santri. Santri hanya lihat logbook diri sendiri.
     *
     * Route BK:     GET /my-bimbingan/logbook
     * Route santri: GET /my-bimbingan/logbook (MyBimbinganController)
     */
    public function logbook(Request $request)
    {
        // Ambil data santri untuk dropdown filter (BK)
        $santriList = \App\Models\User::where('role', 'santri')
            ->where('status', 'active')
            ->with('santriProfile:user_id,nama_panggilan,nama_lengkap,nisn,kelas_id')
            ->with('santriProfile.kelas:id,kode_kelas,nama')
            ->orderBy('username')
            ->get()
            ->map(fn($u) => [
                'id'    => $u->id,
                'nama'  => $u->santriProfile?->nama_panggilan ?? $u->username,
                'nisn'  => $u->santriProfile?->nisn ?? '-',
                'kelas' => $u->santriProfile?->kelas
                    ? "{$u->santriProfile->kelas->kode_kelas}"
                    : '-',
            ]);

        $selectedSantriId = $request->integer('santri_id', 0);

        $logbookData = [];
        $selectedSantri = null;

        if ($selectedSantriId) {
            $logbookData    = $this->getLogbookData($selectedSantriId);
            $user           = \App\Models\User::with('santriProfile')->find($selectedSantriId);
            $selectedSantri = [
                'id'   => $user?->id,
                'nama' => $user?->santriProfile?->nama_panggilan ?? $user?->username ?? '-',
                'nisn' => $user?->santriProfile?->nisn ?? '-',
            ];
        }

        return Inertia::render('MyBimbingan/Logbook', [
            'santriList'      => $santriList,
            'selectedSantriId'=> $selectedSantriId,
            'selectedSantri'  => $selectedSantri,
            'logbookData'     => $logbookData,
            'mode'            => 'bk', // BK melihat semua santri
        ]);
    }

    /**
     * Ambil data logbook untuk satu santri.
     * Dipakai oleh logbook() (BK) maupun MyBimbinganController::logbook() (santri).
     */
    public function getLogbookData(int $santriId): array
    {
        $sesiList = \App\Models\BimbinganBerkalaSesi::where('santri_id', $santriId)
            ->where('status', 'selesai')
            ->with([
                'jadwal:id,judul,tanggal_jadwal,kelas_id',
                'jadwal.kelas:id,kode_kelas,nama',
                'laporanKonselor:id,bimbingan_sesi_id,kode_konselor,diagnosis_default,approval_status',
            ])
            ->orderByDesc('reviewed_at')
            ->get();

        return $sesiList->map(fn($s) => [
            'id'             => $s->id,   // ← sesi_id untuk link BK
            'sesi_id'        => $s->id,   // alias eksplisit untuk frontend
            'jadwal_id'      => $s->jadwal_id,
            'jadwal_judul'   => $s->jadwal?->judul ?? '-',
            'kelas'          => $s->jadwal?->kelas
                ? "{$s->jadwal->kelas->kode_kelas} — {$s->jadwal->kelas->nama}"
                : '-',
            'tanggal'        => $s->jadwal?->tanggal_jadwal?->format('d/m/Y') ?? '-',
            'reviewed_at'    => $s->reviewed_at?->format('d/m/Y') ?? '-',
            'tindak_lanjut'  => $s->tindak_lanjut,
            'tl_label'       => $s->tindak_lanjut_label,
            'tl_badge'       => $s->tindak_lanjut_badge,
            'catatan'        => $s->catatan_keputusan,
            // Laporan konselor yang dibuat (jika ada rujukan)
            'laporan_rujukan' => $s->laporanKonselor ? [
                'id'              => $s->laporanKonselor->id,
                'kode'            => $s->laporanKonselor->kode_konselor,
                'diagnosis'       => $s->laporanKonselor->diagnosis_default,
                'approval_status' => $s->laporanKonselor->approval_status,
                'approval_label'  => $s->laporanKonselor->approval_status_label,
            ] : null,
            'gejala_dikonfirmasi' => $s->gejala_dikonfirmasi ?? [],
        ])->toArray();
    }
}