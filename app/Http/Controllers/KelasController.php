<?php

namespace App\Http\Controllers;

use App\Models\Kelas;
use App\Models\User;
use App\Models\PenugasanKelas;
use App\Models\RiwayatKelasSantri;
use App\Models\SantriProfile;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class KelasController extends Controller
{
    // =============================================
    // INDEX
    // =============================================
    public function index(Request $request)
    {
        $query = Kelas::query()
            ->withCount('santri')
            ->with(['penugasanAktif.user']);

        if ($request->filled('tingkat'))      $query->where('tingkat', $request->tingkat);
        if ($request->filled('tahun_ajaran')) $query->where('tahun_ajaran', $request->tahun_ajaran);
        if ($request->filled('status'))       $query->where('status', $request->status);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(fn($q) =>
                $q->where('kode_kelas', 'like', "%{$search}%")
                  ->orWhere('nama', 'like', "%{$search}%")
            );
        }

        $query->orderBy('tingkat')->orderBy('kode_kelas');
        $kelas = $query->paginate(10)->withQueryString();

        $kelas->getCollection()->transform(function ($item) {
            return [
                'id'            => $item->id,
                'kode_kelas'    => $item->kode_kelas,
                'nama'          => $item->nama,
                'nama_lengkap'  => $item->nama_lengkap,
                'tingkat'       => $item->tingkat,
                'tahun_ajaran'  => $item->tahun_ajaran,
                'kapasitas'     => $item->kapasitas,
                'jumlah_santri' => $item->santri_count,
                'sisa_kapasitas'=> $item->sisa_kapasitas,
                'status'        => $item->status,
                'is_penuh'      => $item->isPenuh(),
                'is_pending'    => $item->isPending(),
                'wali_kelas'    => $item->penugasanAktif
                    ->where('jenis_penugasan', 'wali_kelas')
                    ->map(fn($p) => [
                        'id'           => $p->user->id,
                        'nama'         => $p->user->guruBkProfile->nama_lengkap
                                       ?? $p->user->tenagaPendidikProfile->nama_lengkap
                                       ?? 'N/A',
                        'role'         => $p->user->role,
                        'penugasan_id' => $p->id,
                    ])->first(),
                'wali_asrama'   => $item->penugasanAktif
                    ->where('jenis_penugasan', 'wali_asrama')
                    ->map(fn($p) => [
                        'id'           => $p->user->id,
                        'nama'         => $p->user->guruBkProfile->nama_lengkap
                                       ?? $p->user->tenagaPendidikProfile->nama_lengkap
                                       ?? 'N/A',
                        'role'         => $p->user->role,
                        'penugasan_id' => $p->id,
                    ])->values(),
            ];
        });

        return Inertia::render('Kelas/Index', [
            'kelas'   => $kelas,
            'filters' => $request->only(['tingkat', 'tahun_ajaran', 'status', 'search']),
        ]);
    }

    // =============================================
    // CREATE
    // =============================================
    public function create()
    {
        return Inertia::render('Kelas/Create');
    }

    // =============================================
    // STORE
    // =============================================
    public function store(Request $request)
    {
        $validated = $request->validate([
            'kode_kelas'    => 'required|string|max:10',
            'nama'          => 'required|string|max:100',
            'tingkat'       => 'required|integer|min:0|max:12',
            'tahun_ajaran'  => 'required|string|max:20',
            'kapasitas'     => 'nullable|integer|min:1|max:100',
            'status'        => 'required|in:active,inactive',
        ]);

        $exists = Kelas::where('kode_kelas', $validated['kode_kelas'])
            ->where('tahun_ajaran', $validated['tahun_ajaran'])
            ->exists();

        if ($exists) {
            return back()->withErrors(['kode_kelas' => 'Kelas dengan kode dan tahun ajaran yang sama sudah ada!']);
        }

        Kelas::create($validated);

        return redirect()->route('kelas.index')->with('success', 'Kelas berhasil ditambahkan!');
    }

    // =============================================
    // SHOW — ✅ Kirim santriTersedia & semuaKelas
    // =============================================
    public function show(Kelas $kelas)
    {
        $kelas->load([
            'santri',
            'penugasanAktif.user.guruBkProfile',
            'penugasanAktif.user.tenagaPendidikProfile',
        ]);

        // Wali Kelas
        $waliKelas = $kelas->penugasanAktif
            ->where('jenis_penugasan', 'wali_kelas')
            ->map(fn($p) => [
                'id'   => $p->id,
                'nama' => $p->user->guruBkProfile?->nama_lengkap ?? $p->user->tenagaPendidikProfile?->nama_lengkap,
                'nip'  => $p->user->guruBkProfile?->nip          ?? $p->user->tenagaPendidikProfile?->nip,
                'foto' => $p->user->guruBkProfile?->foto         ?? $p->user->tenagaPendidikProfile?->foto,
                'role' => $p->user->role,
            ])->values();

        // Wali Asrama
        $waliAsrama = $kelas->penugasanAktif
            ->where('jenis_penugasan', 'wali_asrama')
            ->map(fn($p) => [
                'id'   => $p->id,
                'nama' => $p->user->guruBkProfile?->nama_lengkap ?? $p->user->tenagaPendidikProfile?->nama_lengkap,
                'nip'  => $p->user->guruBkProfile?->nip          ?? $p->user->tenagaPendidikProfile?->nip,
                'foto' => $p->user->guruBkProfile?->foto         ?? $p->user->tenagaPendidikProfile?->foto,
                'role' => $p->user->role,
            ])->values();

        // Santri di kelas ini
        $santri = $kelas->santri->map(fn($s) => [
            'id'            => $s->id,
            'nisn'          => $s->nisn,
            'nama_lengkap'  => $s->nama_lengkap,
            'jenis_kelamin' => $s->jenis_kelamin,
            'foto'          => $s->foto ? "/storage/{$s->foto}" : '/storage/defaultavatar.png',
            'status'        => $s->user?->status ?? 'pending',
        ])->values();

        // ✅ Santri tersedia: aktif + bukan di kelas ini
        $santriTersedia = SantriProfile::with(['kelas', 'user'])
            ->where('kelas_id', '!=', $kelas->id)
            ->whereHas('user', fn($q) => $q->where('status', 'active'))
            ->get()
            ->map(fn($s) => [
                'id'           => $s->id,
                'nisn'         => $s->nisn,
                'nama_lengkap' => $s->nama_lengkap,
                'foto'         => $s->foto ? "/storage/{$s->foto}" : '/storage/defaultavatar.png',
                'kelas_asal'   => $s->kelas?->kode_kelas ?? 'PENDING',
            ])->values();

        // ✅ Semua kelas aktif untuk dropdown pindah
        $semuaKelas = Kelas::where('status', 'active')
            ->withCount('santri')
            ->orderBy('tingkat')
            ->orderBy('kode_kelas')
            ->get()
            ->map(fn($k) => [
                'id'            => $k->id,
                'kode_kelas'    => $k->kode_kelas,
                'nama'          => $k->nama,
                'kapasitas'     => $k->kapasitas,
                'jumlah_santri' => $k->santri_count,
                'is_penuh'      => $k->kapasitas ? $k->santri_count >= $k->kapasitas : false,
                'is_pending'    => $k->kode_kelas === 'PENDING',
            ])->values();

        return Inertia::render('Kelas/Show', [
            'kelas' => [
                'id'            => $kelas->id,
                'kode_kelas'    => $kelas->kode_kelas,
                'nama'          => $kelas->nama,
                'nama_lengkap'  => $kelas->kode_kelas . ' - ' . $kelas->nama,
                'tingkat'       => $kelas->tingkat,
                'tahun_ajaran'  => $kelas->tahun_ajaran,
                'kapasitas'     => $kelas->kapasitas,
                'status'        => $kelas->status,
                'jumlah_santri' => $santri->count(),
                'is_penuh'      => $kelas->kapasitas && $santri->count() >= $kelas->kapasitas,
                'is_pending'    => $kelas->kode_kelas === 'PENDING',
                'sisa_kapasitas'=> $kelas->kapasitas ? $kelas->kapasitas - $santri->count() : null,
            ],
            'santri'         => $santri,
            'wali_kelas'     => $waliKelas,
            'wali_asrama'    => $waliAsrama,
            'santriTersedia' => $santriTersedia, // ✅ untuk modal tambah
            'semuaKelas'     => $semuaKelas,     // ✅ untuk dropdown pindah
        ]);
    }

    // =============================================
    // EDIT
    // =============================================
    public function edit(Kelas $kelas)
    {
        return Inertia::render('Kelas/Edit', ['kelas' => $kelas]);
    }

    // =============================================
    // UPDATE
    // =============================================
    public function update(Request $request, Kelas $kelas)
    {
        $validated = $request->validate([
            'kode_kelas'   => 'required|string|max:10',
            'nama'         => 'required|string|max:100',
            'tingkat'      => 'required|integer|min:0|max:12',
            'tahun_ajaran' => 'required|string|max:20',
            'kapasitas'    => 'nullable|integer|min:1|max:100',
            'status'       => 'required|in:active,inactive',
        ]);

        $exists = Kelas::where('kode_kelas', $validated['kode_kelas'])
            ->where('tahun_ajaran', $validated['tahun_ajaran'])
            ->where('id', '!=', $kelas->id)
            ->exists();

        if ($exists) {
            return back()->withErrors(['kode_kelas' => 'Kelas dengan kode dan tahun ajaran yang sama sudah ada!']);
        }

        $kelas->update($validated);

        return redirect()->route('kelas.index')->with('success', 'Kelas berhasil diperbarui!');
    }

    // =============================================
    // DESTROY
    // =============================================
    public function destroy(Kelas $kelas)
    {
        if ($kelas->santri()->count() > 0) {
            return back()->withErrors(['delete' => 'Tidak dapat menghapus kelas yang masih memiliki santri!']);
        }
        if ($kelas->isPending()) {
            return back()->withErrors(['delete' => 'Kelas PENDING tidak dapat dihapus!']);
        }

        $kelas->delete();

        return redirect()->route('kelas.index')->with('success', 'Kelas berhasil dihapus!');
    }

    // =============================================
    // PRIVATE HELPER — Inti logika pindah kelas
    // Dipakai oleh tambahSantri, pindahSantri, keluarkanSantri
    // =============================================

    /**
     * Pindahkan 1 santri dari kelas lama ke kelas baru.
     * Menangani riwayat kelas dengan benar tanpa duplicate entry.
     *
     * KENAPA TIDAK PAKAI updateOrCreate dengan 3 kolom?
     * Karena unique key = (user_id, tahun_ajaran) — hanya 2 kolom.
     * Jika kelas berbeda tapi tahun_ajaran sama → updateOrCreate
     * tidak ketemu record lama → INSERT → DUPLICATE ERROR.
     *
     * SOLUSI: firstOrNew berdasarkan (user_id, tahun_ajaran),
     * lalu update kelas_id secara eksplisit.
     */
    private function pindahkanSantriKeKelas(SantriProfile $profile, Kelas $kelasBaru, string $keterangan): void
    {
        // 1. Non-aktifkan semua riwayat aktif santri ini
        RiwayatKelasSantri::where('user_id', $profile->user_id)
            ->where('is_active', 1)
            ->update([
                'is_active'      => false,
                'tanggal_keluar' => now(),
                'keterangan'     => $keterangan,
            ]);

        // 2. Update kelas_id di santri_profiles
        $profile->update(['kelas_id' => $kelasBaru->id]);

        // 3. ✅ FIX DUPLICATE: Cari riwayat berdasarkan user_id + tahun_ajaran saja
        //    (sesuai unique constraint), lalu update kelas_id-nya
        $riwayat = RiwayatKelasSantri::firstOrNew([
            'user_id'      => $profile->user_id,
            'tahun_ajaran' => $kelasBaru->tahun_ajaran,
        ]);

        $riwayat->kelas_id      = $kelasBaru->id;
        $riwayat->is_active     = true;
        $riwayat->tanggal_masuk = now();
        $riwayat->tanggal_keluar= null;
        $riwayat->keterangan    = $keterangan;
        $riwayat->save();
    }

    // =============================================
    // TAMBAH SANTRI KE KELAS
    // POST /kelas/{kelas}/tambah-santri
    // =============================================
    public function tambahSantri(Request $request, Kelas $kelas)
    {
        $request->validate([
            'santri_ids'   => 'required|array|min:1',
            'santri_ids.*' => 'exists:santri_profiles,id',
        ], [
            'santri_ids.required' => 'Pilih minimal 1 santri.',
        ]);

        // Guard: cek kapasitas
        if ($kelas->kapasitas) {
            $sisa = $kelas->kapasitas - $kelas->santri()->count();
            if (count($request->santri_ids) > $sisa) {
                return back()->withErrors([
                    'santri_ids' => "Kelas hanya muat {$sisa} santri lagi, Anda memilih " . count($request->santri_ids) . ".",
                ]);
            }
        }

        DB::transaction(function () use ($request, $kelas) {
            foreach ($request->santri_ids as $profileId) {
                $profile = SantriProfile::findOrFail($profileId);
                // ✅ Pakai helper — tidak ada duplicate lagi
                $this->pindahkanSantriKeKelas(
                    $profile,
                    $kelas,
                    'Masuk ke kelas ' . $kelas->kode_kelas
                );
            }
        });

        $jumlah = count($request->santri_ids);
        return back()->with('message', "{$jumlah} santri berhasil ditambahkan ke kelas {$kelas->kode_kelas}.");
    }

    // =============================================
    // PINDAH SANTRI KE KELAS LAIN
    // POST /kelas/{kelas}/pindah-santri
    // =============================================
    public function pindahSantri(Request $request, Kelas $kelas)
    {
        $request->validate([
            'santri_id' => 'required|exists:santri_profiles,id',
            'kelas_id'  => 'required|exists:kelas,id',
        ]);

        if ($request->kelas_id == $kelas->id) {
            return back()->withErrors(['kelas_id' => 'Kelas tujuan harus berbeda dengan kelas saat ini.']);
        }

        $profile     = SantriProfile::findOrFail($request->santri_id);
        $kelasTujuan = Kelas::findOrFail($request->kelas_id);

        if ($kelasTujuan->kapasitas && $kelasTujuan->santri()->count() >= $kelasTujuan->kapasitas) {
            return back()->withErrors(['kelas_id' => "Kelas {$kelasTujuan->kode_kelas} sudah penuh!"]);
        }

        DB::transaction(function () use ($profile, $kelas, $kelasTujuan) {
            // ✅ Pakai helper — tidak ada duplicate lagi
            $this->pindahkanSantriKeKelas(
                $profile,
                $kelasTujuan,
                'Pindah dari kelas ' . $kelas->kode_kelas . ' ke ' . $kelasTujuan->kode_kelas
            );
        });

        return back()->with('message', "{$profile->nama_lengkap} berhasil dipindah ke kelas {$kelasTujuan->kode_kelas}.");
    }

    // =============================================
    // KELUARKAN SANTRI → PENDING
    // POST /kelas/{kelas}/keluarkan-santri
    // =============================================
    public function keluarkanSantri(Request $request, Kelas $kelas)
    {
        $request->validate([
            'santri_id' => 'required|exists:santri_profiles,id',
        ]);

        // Guard: tidak bisa keluarkan dari kelas PENDING
        if ($kelas->isPending()) {
            return back()->withErrors([
                'message' => 'Santri sudah di kelas PENDING. Gunakan fitur Tambah untuk memindahkan ke kelas aktif.',
            ]);
        }

        $profile      = SantriProfile::findOrFail($request->santri_id);
        $pendingKelas = Kelas::where('kode_kelas', 'PENDING')->first();

        if (!$pendingKelas) {
            return back()->withErrors([
                'message' => 'Kelas PENDING tidak ditemukan di database!',
            ]);
        }

        DB::transaction(function () use ($profile, $kelas, $pendingKelas) {
            // ✅ Pakai helper — tidak ada duplicate lagi
            $this->pindahkanSantriKeKelas(
                $profile,
                $pendingKelas,
                'Dikeluarkan dari kelas ' . $kelas->kode_kelas . ', menunggu penempatan baru.'
            );
        });

        return back()->with('message', "{$profile->nama_lengkap} berhasil dikeluarkan dari kelas {$kelas->kode_kelas}.");
    }
}