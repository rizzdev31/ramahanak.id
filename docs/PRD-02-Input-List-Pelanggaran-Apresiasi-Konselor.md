# PRD-02 — Input Langsung Berbentuk List: Pelanggaran, Apresiasi, Konselor

> **Tujuan:** Menambah jalur input **langsung berbentuk list** (pilih dari daftar variabel
> yang sudah sesuai database) untuk **tenaga pendidik**, agar pendataan perilaku & tindakan
> santri sehari-hari lebih **optimal dan cepat** — tanpa harus menulis laporan teks bebas
> yang melewati NLP.

---

## 1. Latar Belakang

### Kondisi saat ini (existing flow)
Pendataan dilakukan lewat **laporan teks bebas**:
```
laporan_awal (text_laporan) → NLP Pipeline (Python) → hasil_preprocessing → laporan_*
```
Kelemahan untuk kegiatan harian: lambat, butuh validasi NLP, dan tidak praktis untuk
mencatat **banyak kejadian rutin** (telat, piket, prestasi kecil, gejala awal).

### Kondisi yang diinginkan (fitur baru)
Tenaga pendidik memilih **santri + item dari list variabel** yang sudah ada di DB:
```
Form List → pilih santri → pilih kode (P/A/K) → langsung tersimpan ke laporan_*
            (sumber_input = 'list_manual', tanpa NLP)
```
Karena ini untuk **keseluruhan kegiatan**, input harus secepat checklist.

> **Penting:** Fitur lama (teks bebas + NLP) **TETAP ADA**. Fitur baru berjalan paralel.
> Pembeda di database adalah kolom **`sumber_input`**.

---

## 2. Pemetaan Database (acuan tabel yang sudah ada)

### 2.1 Tabel Master Variabel (sumber list — sudah ada)
| Fitur | Tabel | Kolom kunci |
|-------|-------|-------------|
| Pelanggaran | `variabel_pelanggaran` | `kode` (P001…), `kategori`, `poin`, `tindakan`, `kamus_kata` |
| Apresiasi | `variabel_apresiasi` | `kode` (A001…), `kategori`, `poin`, `apresiasi`, `kamus_kata` |
| Konselor | `variabel_konselor` | `kode` (G001…), `gangguan_mental`, `kamus_kata`, `rekomendasi` |

> List yang dipilih tenaga pendidik = baris-baris dari ketiga tabel ini.

### 2.2 Tabel Laporan Tujuan (sudah ada — perlu sedikit penyesuaian)
| Tabel | Kolom utama | Kendala saat ini |
|-------|-------------|------------------|
| `laporan_pelanggaran` | `hasil_preprocessing_id` (FK), `pelaku_santri_id`, `korban_santri_id`, `kode_pelanggaran`, `bobot_poin`, `tindakan_default`, `tanggal_kejadian`, `status` | `hasil_preprocessing_id` **NOT NULL** |
| `laporan_apresiasi` | `hasil_preprocessing_id` (FK), `santri_id`, `kode_apresiasi`, `bobot_poin`, `reward_default`, `tanggal_kejadian`, `status` | `hasil_preprocessing_id` **NOT NULL** |
| `laporan_konselor` | `hasil_preprocessing_id` (FK), `santri_id`, `kode_konselor`, `diagnosis_default`, `tindakan_default`, `tanggal_kejadian`, `status` | `hasil_preprocessing_id` **NOT NULL** |

**Masalah:** Ketiga `laporan_*` saat ini **wajib** terhubung ke `hasil_preprocessing`
(hasil NLP). Input list **tidak melewati NLP**, jadi FK ini harus dibuat **nullable**, dan
ditambah kolom penanda sumber.

---

## 3. Perubahan Skema (Migration Baru — Aditif & Aman)

Buat **satu migration baru** (jangan edit migration lama). Contoh:
`2026_06_03_000001_add_input_list_support_to_laporan_tables.php`

```php
public function up(): void
{
    foreach (['laporan_pelanggaran','laporan_apresiasi','laporan_konselor'] as $t) {
        Schema::table($t, function (Blueprint $table) {
            // 1) FK NLP jadi opsional (input list tidak punya hasil_preprocessing)
            $table->foreignId('hasil_preprocessing_id')->nullable()->change();

            // 2) Penanda sumber input
            $table->enum('sumber_input', ['nlp','list_manual'])
                  ->default('nlp')->after('id');

            // 3) Siapa tenaga pendidik yang menginput (jejak audit)
            $table->foreignId('input_by')->nullable()
                  ->after('sumber_input')
                  ->constrained('users')->nullOnDelete();
            $table->timestamp('input_at')->nullable()->after('input_by');
        });
    }
}
```

> Memerlukan `doctrine/dbal` untuk `->change()`. Jika tidak terpasang:
> `composer require doctrine/dbal`.
> Alternatif tanpa dbal: drop FK lama lalu re-create sebagai nullable (lebih panjang).

**Data lama tetap valid** karena `sumber_input` default `'nlp'` dan FK lama tetap terisi.

---

## 4. Alur Logika (Flow) Fitur Baru

```
┌──────────────────────────────────────────────────────────────────┐
│ TENAGA PENDIDIK login → menu "Pendataan Harian"                    │
└───────────────┬──────────────────────────────────────────────────┘
                ▼
   Pilih jenis: [ Pelanggaran ] [ Apresiasi ] [ Konselor ]
                ▼
   ┌────────────────────────────────────────────────────────┐
   │ FORM LIST (mode cepat / batch)                          │
   │  • Pilih Santri (dari kelas yang diampu)   ← santri_id  │
   │  • Pilih item dari LIST variabel (P/A/G)   ← kode       │
   │  • (pelanggaran) opsional pilih korban     ← korban_id  │
   │  • Tanggal kejadian (default hari ini)                  │
   │  • Catatan singkat (opsional)                           │
   │  • [+ Tambah baris] → bisa banyak sekaligus (batch)     │
   └───────────────┬────────────────────────────────────────┘
                   ▼  Submit
   ┌────────────────────────────────────────────────────────┐
   │ SERVER (Controller store):                              │
   │  for each baris:                                        │
   │   - ambil variabel by kode → poin, tindakan/apresiasi  │
   │   - buat row laporan_* dengan:                         │
   │       sumber_input = 'list_manual'                      │
   │       hasil_preprocessing_id = NULL                     │
   │       bobot_poin = variabel.poin                        │
   │       *_default = variabel.tindakan/apresiasi/rekom     │
   │       input_by = auth()->id(), input_at = now()         │
   │       status = 'pending'  (atau langsung masuk approval)│
   └───────────────┬────────────────────────────────────────┘
                   ▼
   ┌────────────────────────────────────────────────────────┐
   │ LANJUT KE ALUR EXISTING (tidak berubah):               │
   │  • Pelanggaran/Apresiasi → akumulasi poin →            │
   │    Expert System Point (threshold konsekuensi/reward)  │
   │  • Konselor → masuk antrian diagnosis / Forward Chain  │
   │  • Approval berjenjang via laporan_approvals (opsional)│
   └────────────────────────────────────────────────────────┘
```

> **Kunci sinkronisasi:** karena `laporan_*` adalah pintu masuk Expert System, input list
> yang menulis ke tabel yang sama **otomatis ikut** perhitungan poin & Forward Chaining
> yang sudah berjalan — tanpa mengubah engine.

---

## 5. Routing & Controller

Tambahkan route untuk **tenaga_pendidik** (grup shared / khusus tendik). Saran nama prefix
`pendataan` agar tidak bentrok dengan route guru_bk `laporan-pelanggaran.*`.

```php
// routes/web.php — dalam grup role:tenaga_pendidik,guru_bk
Route::prefix('pendataan')->name('pendataan.')->group(function () {
    Route::get('/pelanggaran',  [PendataanController::class, 'pelanggaranForm'])->name('pelanggaran');
    Route::post('/pelanggaran', [PendataanController::class, 'pelanggaranStore'])->name('pelanggaran.store');

    Route::get('/apresiasi',  [PendataanController::class, 'apresiasiForm'])->name('apresiasi');
    Route::post('/apresiasi', [PendataanController::class, 'apresiasiStore'])->name('apresiasi.store');

    Route::get('/konselor',  [PendataanController::class, 'konselorForm'])->name('konselor');
    Route::post('/konselor', [PendataanController::class, 'konselorStore'])->name('konselor.store');

    // riwayat input milik tendik sendiri
    Route::get('/riwayat', [PendataanController::class, 'riwayat'])->name('riwayat');
});
```

### Contoh `PendataanController@pelanggaranStore` (inti logic)
```php
public function pelanggaranStore(Request $request)
{
    $data = $request->validate([
        'items'                   => ['required','array','min:1'],
        'items.*.pelaku_santri_id'=> ['required','exists:users,id'],
        'items.*.korban_santri_id'=> ['nullable','exists:users,id'],
        'items.*.kode'            => ['required','exists:variabel_pelanggaran,kode'],
        'items.*.tanggal'         => ['required','date'],
        'items.*.catatan'         => ['nullable','string'],
    ]);

    DB::transaction(function () use ($data) {
        foreach ($data['items'] as $row) {
            $v = VariabelPelanggaran::where('kode', $row['kode'])->firstOrFail();
            LaporanPelanggaran::create([
                'sumber_input'          => 'list_manual',
                'hasil_preprocessing_id'=> null,
                'pelaku_santri_id'      => $row['pelaku_santri_id'],
                'korban_santri_id'      => $row['korban_santri_id'] ?? null,
                'kode_pelanggaran'      => $v->kode,
                'bobot_poin'            => $v->poin,
                'tindakan_default'      => $v->tindakan,
                'catatan_bk'            => $row['catatan'] ?? null,
                'tanggal_kejadian'      => $row['tanggal'],
                'status'                => 'pending',
                'input_by'              => auth()->id(),
                'input_at'              => now(),
            ]);
        }
    });

    return back()->with('success', 'Pendataan pelanggaran tersimpan.');
}
```
Pola serupa untuk **apresiasi** (`santri_id`, `kode_apresiasi`, `reward_default` ← `apresiasi`)
dan **konselor** (`santri_id`, `kode_konselor`, `diagnosis_default`/`tindakan_default` ←
`gangguan_mental`/`rekomendasi`).

---

## 6. UI (React + Inertia)

Halaman baru (mis. `resources/js/Pages/Pendataan/Pelanggaran.jsx`):

- **Tabel input dinamis** (baris bisa ditambah `[+]`), tiap baris:
  - Dropdown/Combobox **Santri** — di-feed dari santri kelas yang diampu tendik
    (`TenagaPendidikSantriController` sudah punya datanya).
  - Dropdown/Combobox **Variabel** menampilkan `kode — kategori — poin` agar jelas
    bobotnya. (Untuk konselor: `kode — gangguan_mental`.)
  - (Pelanggaran) field **Korban** opsional.
  - **Tanggal** (default hari ini), **Catatan** opsional.
- Tombol **Simpan Semua** → kirim array `items` ke endpoint store.
- Tampilkan **ringkasan poin** per santri sebelum submit (mis. "+15 poin pelanggaran").
- Empty state + validasi inline.

Props dari controller (form): daftar santri (kelas diampu) + daftar variabel aktif
(`VariabelPelanggaran::all(['kode','kategori','poin'])`, dst).

---

## 7. Dampak ke Expert System & Approval

- **Poin** otomatis ikut karena masuk `laporan_pelanggaran/apresiasi` → engine ES Point
  membaca akumulasi `bobot_poin` per `pelaku_santri_id`/`santri_id` seperti biasa.
- **Konselor** → `laporan_konselor` masuk antrian; Forward Chaining nightly job tetap
  memproses (lihat `konselor:check-triggers`).
- **Approval berjenjang** (`laporan_approvals`): putuskan kebijakan untuk input list:
  - **Opsi A (disarankan):** input list tendik **tetap** butuh approve Guru BK
    (status `pending` → BK validasi). Konsisten dengan tata kelola.
  - **Opsi B:** auto-approve untuk pelanggaran ringan (poin ≤ threshold), sisanya pending.
  → **Keputusan ini perlu konfirmasi pemilik produk** (lihat §9).

---

## 8. Rencana Implementasi (Bertahap)

1. **Migration** `add_input_list_support_to_laporan_tables` (§3) + `composer require doctrine/dbal`.
2. Update **Model** `LaporanPelanggaran/Apresiasi/Konselor`: tambah `sumber_input`,
   `input_by`, `input_at` ke `$fillable`; relasi `inputBy()`.
3. Buat **`PendataanController`** + routes (§5).
4. Buat **halaman React** form list batch (§6) + menu sidebar untuk tendik.
5. Tambah **filter `sumber_input`** di halaman Guru BK `laporan-*` agar BK bisa membedakan
   input NLP vs list manual.
6. **Uji**: input batch → cek row di DB → cek poin ES → cek approval.
7. **Deploy** via alur PRD-01.

---

## 9. Keputusan yang Perlu Dikonfirmasi (Open Questions)

1. **Approval input list:** wajib approve BK (Opsi A) atau auto-approve sebagian (Opsi B)?
2. **Batasan kelas:** tendik hanya boleh input santri di kelas yang diampu, atau semua santri?
3. **Korban pada pelanggaran list:** wajib atau opsional?
4. **Konselor oleh tendik:** apakah tendik boleh menandai gejala (G-code) langsung, atau hanya
   BK? (Berdampak pada role yang punya akses menu konselor.)

---

## 10. Checklist

- [ ] Migration nullable `hasil_preprocessing_id` + kolom `sumber_input`/`input_by`/`input_at`.
- [ ] Model di-update (`$fillable` + relasi).
- [ ] `PendataanController` (pelanggaran/apresiasi/konselor) + validasi batch.
- [ ] Routes `pendataan.*` untuk tenaga pendidik.
- [ ] Halaman React form list batch + menu.
- [ ] Filter `sumber_input` di dashboard Guru BK.
- [ ] Uji integrasi poin & Forward Chaining.
- [ ] Konfirmasi Open Questions §9.
