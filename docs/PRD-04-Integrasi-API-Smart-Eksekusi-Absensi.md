# PRD-04 — Integrasi API: Smart Eksekusi & Absensi (LOGIC UTAMA)

> **Dokumen ini adalah LOGIC UTAMA integrasi.** PRD-02 & PRD-03 sebelumnya hanya **pelengkap**.
> Di sini didefinisikan bagaimana **RamahAnak.id (penerima)** menerima laporan dari
> **aplikasi pengirim** tanpa melewati preprocessing/NLP.

> **Sisi pengirim** dijelaskan terpisah di [PRD-05](PRD-05-Aplikasi-Pengirim.md).

---

## ✅ STATUS IMPLEMENTASI (2026-06-22) — LIVE & TERUJI

Sisi RamahAnak (penerima) **sudah diimplementasi & diuji di production**. Bagian di bawah
(§3–§10) adalah rancangan; ringkasan final yang BENAR-BENAR berjalan:

**Keputusan final (sesuai arahan):**
1. **NISN = nilai "NIP" pengirim** (isi sama). Match ke `santri_profiles.nisn`.
2. **Pelanggaran, Apresiasi, DAN Konselor → semua masuk `approval_status = 'pending_bk'`**
   (status `pending`). **Tidak auto-eksekusi.** Guru BK memutuskan **approve/abaikan** di
   layar **KelolaBk** yang sudah ada. Saat BK approve → `ApprovalManagementController`
   (existing) menyimpan ke `riwayat_santri` + trigger Expert System. (Jadi tidak perlu service
   eksekusi terpisah — cukup buat record `pending_bk` yang bersih.)
3. **Kode auto-tarik** oleh pengirim via `GET /variabel/*`.
4. **Tanpa sinkron master santri** (data santri sudah di RamahAnak).
5. **Kode telat = `P002`** (`disiplin_waktu`, poin 2).

**Yang sudah dibuat & teruji live:**
- `routes/api.php` (prefix `/api/v1`) + register di `bootstrap/app.php` + middleware
  `integrasi.token` (Bearer) + `throttle:120,1`.
- `config/integrasi.php` (token + mapping telat→P002) — via `config()`.
- Migration: `sumber_input`, `external_app`, `external_ref_id` (unique→idempotency),
  `external_actor`; `hasil_preprocessing_id` jadi **nullable**.
- `IntegrasiLaporanService` (resolve NISN, idempotency, buat laporan `pending_bk`).
- `EksekusiController`, `AbsensiController`, `VariabelSyncController`.

**Hasil uji (HTTPS publik):** ping 401/200 ✅ · sinkron variabel ✅ · NISN salah → 404 ✅ ·
buat pelanggaran → 201 `pending_bk` ✅ · ref_id sama → 200 `duplicate` ✅ · absensi telat →
201 kode P002 ✅. Data uji sudah dibersihkan.

**Base URL:** `https://ramahanak.ppmannursidoarjo.com/api/v1`
**Token:** ada di `.env` server (`INTEGRASI_API_TOKEN`) — diberikan ke tim pengirim via kanal
aman, **bukan** di dokumen ini (repo publik).

> Catatan: alur "langsung approved" pada draft di bawah **diganti** menjadi `pending_bk`
> sesuai keputusan #2. Endpoint mengembalikan `approval_status: pending_bk`.

---

## 1. Ringkasan Kebutuhan

RamahAnak **hanya menerima laporan** dari aplikasi pengirim, dalam 2 skenario:

### A. Smart Eksekusi (input manual oleh tenaga pendidik di aplikasi pengirim)
Pengirim mengirim **identitas santri + kode**, RamahAnak **langsung eksekusi** ke laporan
tujuan **tanpa preprocessing & tanpa approval berjenjang**:

| Jenis | Data dikirim | Masuk ke |
|-------|--------------|----------|
| **Pelanggaran** | NISN **Pelaku** + NISN **Korban** (opsional) + **Kode Pelanggaran** (P…) | `laporan_pelanggaran` |
| **Apresiasi** | NISN **Pelaku** saja + **Kode Apresiasi** (A…) | `laporan_apresiasi` |
| **Konselor** | NISN **Korban** saja + **Kode Konselor** (G…) | `laporan_konselor` |

### B. Absensi (otomatis dari modul absensi aplikasi pengirim)
- Hanya **keterlambatan ("telat")** yang dikirim otomatis.
- Hanya masuk ke **`laporan_pelanggaran`**, dipetakan ke variabel **disiplin waktu**.
- Data: **NISN santri** (sebagai pelaku) + tanggal. Tidak ada korban.

> **Tanpa preprocessing/NLP sama sekali.** Kode sudah final dari pengirim.

---

## 2. ⚠️ Prasyarat Kritis — Kunci Identitas Santri (NISN)

**Ini fondasi seluruh integrasi.** RamahAnak mengenali santri lewat **NISN**
(`santri_profiles.nisn`, dan `users.username` = NISN untuk santri). Aplikasi pengirim
menyebut "NIP Santri" — **harus berisi NISN yang sama** dengan yang ada di RamahAnak.

**Keputusan wajib:**
- Aplikasi pengirim **menggunakan NISN sebagai kunci santri** yang identik dengan RamahAnak, **atau**
- Sediakan endpoint sinkronisasi master santri (RamahAnak → pengirim) agar pengirim memakai
  NISN yang benar.

Jika NISN tidak cocok → laporan ditolak (`404 santri_not_found`). **Aplikasi pengirim wajib
menangani kasus ini.**

> Istilah di dokumen ini: **NISN** = kunci kanonik santri. (Yang Anda sebut "NIP Santri" =
> NISN ini.)

---

## 3. Perubahan Skema RamahAnak (Migration Baru, Aditif & Aman)

`2026_06_22_000001_add_external_source_to_laporan_tables.php`

```php
foreach (['laporan_pelanggaran','laporan_apresiasi','laporan_konselor'] as $t) {
    Schema::table($t, function (Blueprint $table) {
        // 1) FK NLP jadi opsional (input non-NLP)
        $table->foreignId('hasil_preprocessing_id')->nullable()->change();

        // 2) Sumber input (string, fleksibel)
        $table->string('sumber_input', 30)->default('nlp')->after('id');
        // nilai: 'nlp' | 'smart_eksekusi' | 'absensi'

        // 3) Asal & idempotency dari aplikasi pengirim
        $table->string('external_app', 50)->nullable()->after('sumber_input');   // mis. 'annur-eksekusi'
        $table->string('external_ref_id')->nullable()->unique()->after('external_app'); // id unik dari pengirim
        $table->string('external_actor')->nullable()->after('external_ref_id');   // siapa pengirim (nama/NIP tendik)
    });
}
```
> Butuh `composer require doctrine/dbal` untuk `->change()`.
> `sumber_input` sengaja **string**, bukan enum, agar mudah ditambah nilai baru.
> `external_ref_id` **unique** → kunci idempotency (cegah dobel kiriman).

---

## 4. Pondasi API (belum ada — wajib dibuat)

### 4.1 `routes/api.php` + registrasi
RamahAnak belum punya `routes/api.php`. Buat dan daftarkan di `bootstrap/app.php`:
```php
->withRouting(
    web:      __DIR__.'/../routes/web.php',
    api:      __DIR__.'/../routes/api.php',   // ← tambah
    commands: __DIR__.'/../routes/console.php',
    health:   '/up',
)
```

### 4.2 Autentikasi antar-app (token statis via config)
```php
// .env
INTEGRASI_API_TOKEN=isi-token-rahasia-panjang
```
```php
// config/integrasi.php
return [
    'token' => env('INTEGRASI_API_TOKEN'),
    // mapping kejadian absensi → kode variabel pelanggaran (disiplin waktu)
    'absensi_mapping' => [
        'telat' => env('ABSENSI_KODE_TELAT', 'P002'), // sesuaikan dgn kode disiplin_waktu di DB
    ],
];
```
> **PENTING:** pakai `config()` (bukan `env()`) di kode — pelajaran dari AUDIT preprocessing
> (env null setelah `config:cache`).

Middleware `VerifyIntegrasiToken` memeriksa header `Authorization: Bearer <token>` ==
`config('integrasi.token')`. Tambah juga `throttle` + wajib HTTPS.

---

## 5. Endpoint API (kontrak)

Base: `https://ramahanak.ppmannursidoarjo.com/api/v1` · Header: `Authorization: Bearer <token>`

### 5.1 Smart Eksekusi — Pelanggaran
```
POST /eksekusi/pelanggaran
{
  "nisn_pelaku": "0098765432",
  "nisn_korban": "0091112223",      // opsional
  "kode": "P001",
  "tanggal": "2026-06-22",
  "catatan": "Berkelahi saat istirahat",   // opsional
  "ref_id": "ANNUR-EKS-000123",     // unik (idempotency)
  "actor": "Ust. Budi (NIP 1987...)" // opsional, jejak
}
→ 201 { "status":"ok", "laporan_pelanggaran_id": 555, "poin": 20 }
```

### 5.2 Smart Eksekusi — Apresiasi
```
POST /eksekusi/apresiasi
{ "nisn_pelaku":"0098765432", "kode":"A002", "tanggal":"2026-06-22",
  "catatan":null, "ref_id":"ANNUR-EKS-000124", "actor":"..." }
→ 201 { "status":"ok", "laporan_apresiasi_id": 777, "poin": 10 }
```

### 5.3 Smart Eksekusi — Konselor
```
POST /eksekusi/konselor
{ "nisn_korban":"0091112223", "kode":"G010", "tanggal":"2026-06-22",
  "catatan":null, "ref_id":"ANNUR-EKS-000125", "actor":"..." }
→ 201 { "status":"ok", "laporan_konselor_id": 333 }
```

### 5.4 Absensi — Telat (otomatis)
```
POST /absensi/telat
{ "nisn":"0098765432", "tanggal":"2026-06-22", "waktu":"04:35",
  "kegiatan":"Sholat Subuh", "ref_id":"ANNUR-ABS-2026-06-22-0098765432-subuh" }
→ 201 { "status":"ok", "laporan_pelanggaran_id": 556, "kode":"P002", "poin": 5 }
```
> RamahAnak memetakan `telat` → kode disiplin waktu via `config('integrasi.absensi_mapping.telat')`.
> `ref_id` disarankan komposit (tanggal+nisn+kegiatan) agar 1 santri tak dobel telat/kegiatan.

### 5.5 Pendukung (opsional, untuk pengirim menyesuaikan diri)
```
GET /santri/{nisn}                 → verifikasi santri ada (nama, kelas)
GET /variabel/pelanggaran          → daftar kode P (kode, kategori, poin) utk sinkron pengirim
GET /variabel/apresiasi            → daftar kode A
GET /variabel/konselor             → daftar kode G
```

### Error standar
| HTTP | status | makna |
|------|--------|-------|
| 401 | `unauthorized` | token salah |
| 404 | `santri_not_found` | NISN tidak ada di RamahAnak |
| 404 | `kode_not_found` | kode variabel tidak ada |
| 409 | `duplicate` | `ref_id` sudah pernah diproses (kembalikan id lama) |
| 422 | `validation_error` | field kurang/format salah |

---

## 6. Logic Eksekusi (INTI) — replikasi alur `complete()`

Karena "langsung approved", API harus **menyamai** alur `complete()` yang sudah ada:
buat laporan **status `selesai`** → insert **`riwayat_santri`** → trigger **Expert System**.

> **Rekomendasi refactor:** ekstrak logika `complete()` ke service bersama
> **`LaporanExecutionService`** agar dipakai controller web (existing) **dan** API (baru) —
> hindari duplikasi & menjaga konsistensi.

### 6.1 Pelanggaran (dan Absensi telat memakai jalur yang sama)
```php
DB::transaction(function () use (...) {
    $v = VariabelPelanggaran::where('kode',$kode)->firstOrFail();

    $lap = LaporanPelanggaran::create([
        'sumber_input'           => $sumber,         // 'smart_eksekusi' | 'absensi'
        'hasil_preprocessing_id' => null,
        'external_app'           => $app,
        'external_ref_id'        => $refId,          // unique → idempotency
        'external_actor'         => $actor,
        'pelaku_santri_id'       => $pelaku->id,
        'korban_santri_id'       => $korban?->id,
        'kode_pelanggaran'       => $v->kode,
        'bobot_poin'             => $v->poin,
        'tindakan_default'       => $v->tindakan,
        'catatan_bk'             => $catatan,
        'tanggal_kejadian'       => $tanggal,
        'tanggal_tindakan'       => now(),
        'status'                 => 'selesai',
        'approval_status'        => 'selesai',       // bypass approval berjenjang
        'validated_at'           => now(),
    ]);

    // riwayat_santri — pelaku (berpoin) & korban (tanpa poin)
    RiwayatSantri::create([... 'santri_id'=>$pelaku->id, 'bobot_poin'=>$v->poin, 'jenis_laporan'=>'pelanggaran', ...]);
    if ($korban) RiwayatSantri::create([... 'santri_id'=>$korban->id, 'bobot_poin'=>null, ...]);
});

// trigger expert system (di luar transaksi, non-blocking)
app(ExpertSystemPointService::class)->checkThreshold($pelaku->id);
app(ForwardChainingService::class)->checkForSantri($pelaku->id);
if ($korban) app(ForwardChainingService::class)->checkForSantri($korban->id);
```

### 6.2 Apresiasi
`laporan_apresiasi` (santri = pelaku, `reward_default` = `variabel.apresiasi`, status selesai)
→ `riwayat_santri` (jenis `apresiasi`, berpoin) → `ExpertSystemPointService->checkThreshold`.

### 6.3 Konselor
`laporan_konselor` (santri = korban, `diagnosis_default`/`tindakan_default` dari variabel)
→ `riwayat_santri` (jenis `konselor`, poin null) → `ForwardChainingService->checkForSantri`.

### 6.4 Idempotency (wajib)
Sebelum membuat laporan: cek `external_ref_id`. Jika sudah ada → kembalikan id lama
(`409 duplicate` atau `200 ok`), **jangan** buat ganda (mencegah dobel poin saat retry).

---

## 7. Flow Diagram

### 7.1 Smart Eksekusi
```
[Aplikasi Pengirim]  tendik pilih santri + kode (P/A/G)
        │  POST /api/v1/eksekusi/{jenis}  (Bearer token)
        ▼
[RamahAnak API]
  1. verifikasi token
  2. cek idempotency (ref_id)
  3. resolve NISN → user santri  (404 jika tak ada)
  4. ambil variabel by kode      (404 jika tak ada)
  5. buat laporan_* (status selesai, sumber_input=smart_eksekusi)
  6. insert riwayat_santri
  7. trigger Expert System (poin / forward chaining)
        │
        ▼  201 { laporan_id, poin }
[Aplikasi Pengirim]  tandai terkirim (simpan laporan_id)
```

### 7.2 Absensi Telat
```
[Modul Absensi pengirim]  santri scan → status "telat"
        │  POST /api/v1/absensi/telat  (otomatis)
        ▼
[RamahAnak API]
  1..3 (token, idempotency, resolve NISN)
  4. map 'telat' → kode disiplin waktu (config)
  5. buat laporan_pelanggaran (sumber_input=absensi, pelaku=santri, tanpa korban)
  6. riwayat_santri + trigger Expert System Point
        │
        ▼  201 { laporan_id, kode, poin }
```

---

## 8. 🔎 Audit & Evaluasi Pendekatan (masukan untuk Anda)

Pendekatan Anda **solid & realistis**. Beberapa hal untuk dievaluasi:

1. **Identitas santri (NISN) — risiko #1.** Pastikan satu kunci yang sama di kedua app.
   Tanpa ini integrasi rapuh. → Sediakan endpoint sinkron master santri (§5.5) atau sepakati NISN.

2. **Konselor auto-approve itu sensitif.** Diagnosis kesehatan mental idealnya tetap melalui
   pertimbangan Guru BK. **Rekomendasi:** untuk jenis **konselor**, laporan dari API sebaiknya
   masuk sebagai **`pending` (bukan langsung selesai)** agar BK verifikasi dulu — beda dengan
   pelanggaran/apresiasi yang boleh langsung. (Pelanggaran & apresiasi aman auto-eksekusi.)
   → Perlu keputusan Anda (lihat §9).

3. **Poin bisa "meledak" dari absensi.** Telat tiap hari menambah poin → konsekuensi cepat
   ter-trigger. Pastikan threshold `variabel_konsekuensi` realistis untuk volume absensi.

4. **Idempotency wajib** (terutama absensi yang otomatis & bisa retry). Sudah ditangani via
   `external_ref_id` unik — pengirim **wajib** mengirim `ref_id` stabil.

5. **Jejak audit.** Karena bypass approval, simpan `external_app` + `external_actor` agar tetap
   ada pertanggungjawaban siapa yang mengirim.

6. **Bypass approval berjenjang** menghapus peran Wali Kelas pada data dari pengirim. Itu
   konsekuensi desain yang Anda pilih (kecepatan). Pastikan stakeholder paham approval hanya
   berlaku untuk input internal RamahAnak (teks bebas/NLP), bukan dari pengirim.

7. **Keamanan:** token rahasia + HTTPS + rate limit + (opsional) IP allowlist server pengirim.

8. **Konsistensi kode variabel.** Kode P/A/G di pengirim **harus** ada di RamahAnak. Gunakan
   endpoint `GET /variabel/*` (§5.5) agar pengirim selalu sinkron; jika kode tak ada → 404.

---

## 9. Keputusan yang Perlu Anda Tentukan

1. **Konselor dari API:** langsung `selesai` (auto) **atau** `pending` untuk verifikasi BK? *(rekomendasi: pending)*
2. **Pelanggaran/Apresiasi dari API:** konfirmasi langsung `selesai` (auto-eksekusi penuh)? *(rekomendasi: ya)*
3. **Kode telat absensi:** kode pelanggaran disiplin waktu yang dipakai (default `P002`)? Pastikan ada di DB.
4. **Korban pelanggaran:** apakah pengirim selalu mengirim korban bila ada, atau kadang kosong? (sudah didukung opsional)
5. **Sinkron master santri:** pakai endpoint sinkron dari RamahAnak, atau NISN sudah pasti sama?

---

## 10. Checklist Implementasi (RamahAnak / penerima)

- [ ] `composer require doctrine/dbal`.
- [ ] Migration: nullable `hasil_preprocessing_id` + `sumber_input` + `external_app/ref_id/actor`.
- [ ] Model `LaporanPelanggaran/Apresiasi/Konselor`: tambah field baru ke `$fillable`.
- [ ] `routes/api.php` + registrasi di `bootstrap/app.php`.
- [ ] `config/integrasi.php` (token + mapping telat→kode) — pakai `config()`.
- [ ] Middleware `VerifyIntegrasiToken` + `throttle`.
- [ ] Refactor `complete()` → `LaporanExecutionService` (dipakai web & API).
- [ ] Controller API: `EksekusiController` (pelanggaran/apresiasi/konselor) + `AbsensiController`.
- [ ] Idempotency via `external_ref_id`.
- [ ] Endpoint pendukung `GET /santri/{nisn}` & `GET /variabel/*`.
- [ ] Uji: token, NISN tak ada, kode tak ada, dobel ref_id, poin & forward chaining jalan.
- [ ] Konfirmasi Open Questions §9.
