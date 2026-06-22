# PRD-03 — Generate Barcode & Integrasi API Absensi Dua Aplikasi

> **Tujuan:** Setiap user (terutama santri) memiliki **barcode unik** yang di-*generate* oleh
> RamahAnak.id. Barcode dipakai di **aplikasi absensi terpisah**. Ketika di aplikasi absensi
> seorang santri tercatat **telat / tidak hadir / pelanggaran kehadiran lain**, kejadian itu
> **dikirim balik (push) ke database RamahAnak** untuk ditindaklanjuti lewat alur Expert System
> yang sudah ada.

> **Ruang lingkup RamahAnak:** (1) **generate & sajikan** barcode, (2) **menyediakan API**
> agar aplikasi absensi bisa memverifikasi barcode dan mengirim balik kejadian pelanggaran.
> Logika absensi (scan, jadwal kegiatan) **berada di aplikasi absensi**, bukan di sini.

---

## 1. Arsitektur Integrasi Dua Aplikasi

```
┌────────────────────────────┐                         ┌──────────────────────────────┐
│  RAMAHANAK.ID (app ini)    │                         │  APLIKASI ABSENSI (app lain) │
│                            │                         │                              │
│  • Generate barcode/QR     │  ① GET barcode/identitas│  • Scan barcode santri       │
│    per user (token unik)   │ ◄───────────────────────│  • Tentukan: hadir/telat/    │
│  • API verifikasi barcode  │                         │    tidak hadir               │
│  • API terima kejadian     │  ② POST kejadian        │                              │
│    pelanggaran kehadiran   │ ◄───────────────────────│  • Kirim pelanggaran ke RA   │
│  • Buat laporan_pelanggaran│                         │                              │
│    (sumber_input=absensi)  │                         │                              │
│  → Expert System Point     │                         │                              │
└────────────────────────────┘                         └──────────────────────────────┘
        Auth antar-app: API token (Laravel Sanctum / token statis di header)
```

> **Catatan teknis penting:** Saat ini repo **belum punya `routes/api.php`** (hanya `web.php`,
> `auth.php`, `console.php`). Integrasi ini **mewajibkan pembuatan `routes/api.php`** +
> registrasi di `bootstrap/app.php` (`->withRouting(api: ...)`). Sanctum (`laravel/sanctum`)
> sudah terpasang (lihat README) sehingga bisa dipakai untuk token API.

---

## 2. Bagian A — Generate Barcode per User

### 2.1 Data Barcode
Barcode **tidak** menyimpan data sensitif. Ia hanya membawa **token acak unik** yang
di-resolve via API. Pemetaan token → santri disimpan di server.

| Pilihan format | Rekomendasi |
|----------------|-------------|
| **QR Code** | ✅ Disarankan — kapasitas besar, mudah dipindai kamera HP |
| Code128 / Barcode 1D | Opsional jika aplikasi absensi pakai scanner laser |

Isi payload barcode (disarankan): **token opaque** saja, contoh
`RA-9f1c8a3e7b2d4f60` (prefix `RA-` + 16 hex acak). Resolusi identitas dilakukan via API,
bukan dari isi barcode → aman bila barcode terfoto orang lain (masih perlu token API app).

### 2.2 Skema Database (Migration baru)
`2026_06_03_000002_add_barcode_to_users.php` — simpan di tabel `users` (berlaku semua role)
atau buat tabel khusus `user_barcodes`. Disarankan kolom di `users`:

```php
Schema::table('users', function (Blueprint $table) {
    $table->string('barcode_token', 32)->nullable()->unique()->after('status');
    $table->timestamp('barcode_generated_at')->nullable()->after('barcode_token');
});
```

> Alternatif tabel terpisah `user_barcodes(user_id, token, is_active, generated_at)` bila
> ingin mendukung **regenerate/riwayat** token (mis. barcode hilang → terbitkan ulang,
> nonaktifkan yang lama). **Disarankan tabel terpisah** untuk audit & revoke.

```php
// Opsi tabel terpisah (disarankan)
Schema::create('user_barcodes', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
    $table->string('token', 32)->unique();
    $table->boolean('is_active')->default(true);
    $table->timestamp('generated_at')->useCurrent();
    $table->timestamps();
    $table->index(['token','is_active']);
});
```

### 2.3 Generate & Tampilkan
- **Generate token:** `Str::upper('RA-'.bin2hex(random_bytes(8)))` saat user dibuat/approve,
  atau tombol "Generate Barcode" di halaman santri/manage-user.
- **Render gambar:** gunakan library QR, mis. `simplesoftwareio/simple-qrcode` atau
  `endroid/qr-code`. Endpoint:
  ```php
  Route::get('/santri/{user}/barcode', [BarcodeController::class, 'show'])->name('barcode.show');
  // mengembalikan PNG/SVG QR dari $user->barcode_token (atau user_barcodes aktif)
  ```
- **Halaman santri** (`my-profil`) & **Guru BK** dapat melihat/cetak barcode (untuk kartu santri).
- **Cetak massal**: opsi generate PDF kartu barcode per kelas (pakai DomPDF yang sudah ada).

---

## 3. Bagian B — API untuk Aplikasi Absensi

### 3.1 Setup `routes/api.php`
Buat file baru `routes/api.php` dan daftarkan di `bootstrap/app.php`:
```php
->withRouting(
    web: __DIR__.'/../routes/web.php',
    api: __DIR__.'/../routes/api.php',   // ← tambah ini
    commands: __DIR__.'/../routes/console.php',
    health: '/up',
)
```

### 3.2 Autentikasi Antar-App
Aplikasi absensi adalah **service tepercaya**, bukan user manusia. Pakai **API token statis**
(disimpan di `.env` kedua app) atau Sanctum personal access token untuk akun service:

```php
// .env RamahAnak
ABSENSI_API_TOKEN=tok_xxxxxxxxxxxxxxxxx
```
Middleware sederhana memeriksa header `Authorization: Bearer <token>` == `ABSENSI_API_TOKEN`.
(Untuk produksi lebih ketat: Sanctum + IP allowlist + rate limit.)

### 3.3 Endpoint API

#### ① Verifikasi Barcode → identitas santri
```
GET /api/v1/barcode/{token}
Header: Authorization: Bearer <ABSENSI_API_TOKEN>

200 OK
{
  "valid": true,
  "user_id": 123,
  "nisn": "0098765432",
  "nama": "Adel",
  "kelas": "8A",
  "role": "santri"
}
404 { "valid": false }
```
Dipakai aplikasi absensi untuk menampilkan nama saat scan & memvalidasi kartu.

#### ② Push Kejadian Kehadiran (pelanggaran)
```
POST /api/v1/absensi/kejadian
Header: Authorization: Bearer <ABSENSI_API_TOKEN>
Body:
{
  "barcode_token": "RA-9f1c8a3e7b2d4f60",   // atau "user_id": 123
  "jenis": "telat",                          // telat | tidak_hadir | alpha | izin_telat ...
  "kegiatan": "Sholat Subuh Berjamaah",
  "tanggal": "2026-06-03",
  "waktu": "04:35",
  "keterangan": "Telat 15 menit",
  "ref_id": "ABS-2026-0001"                  // id unik dari app absensi (idempotency)
}

201 Created
{ "status": "ok", "laporan_pelanggaran_id": 555 }
```

### 3.4 Pemetaan Kejadian → Variabel Pelanggaran
Aplikasi absensi mengirim **`jenis`** generik. RamahAnak memetakannya ke **kode
`variabel_pelanggaran`** (mis. disiplin waktu) agar poin & tindakan konsisten dengan engine:

| `jenis` dari absensi | Kode `variabel_pelanggaran` (contoh) | Catatan |
|----------------------|--------------------------------------|---------|
| `telat` | `P0xx` (disiplin_waktu) | poin dari master variabel |
| `tidak_hadir` / `alpha` | `P0yy` (kehadiran) | poin lebih besar |
| `izin` | — (tidak dicatat sebagai pelanggaran) | abaikan |

> **Wajib:** pastikan kode-kode pelanggaran kehadiran sudah ada di `variabel_pelanggaran`.
> Jika belum, tambahkan via menu **Variabel Pelanggaran** (Guru BK) sebelum go-live.
> Pemetaan `jenis → kode` disimpan di config (`config/absensi.php`) agar mudah diubah.

### 3.5 Controller — buat `laporan_pelanggaran` dari API
```php
public function kejadian(Request $r)
{
    $data = $r->validate([
        'barcode_token' => ['required_without:user_id','string'],
        'user_id'       => ['required_without:barcode_token','integer'],
        'jenis'         => ['required','string'],
        'kegiatan'      => ['nullable','string'],
        'tanggal'       => ['required','date'],
        'keterangan'    => ['nullable','string'],
        'ref_id'        => ['nullable','string'],   // idempotency
    ]);

    // resolve santri
    $user = isset($data['user_id'])
        ? User::findOrFail($data['user_id'])
        : User::where('barcode_token', $data['barcode_token'])->firstOrFail();
        // (atau lewat tabel user_barcodes is_active=1)

    // map jenis → kode pelanggaran (config)
    $kode = config('absensi.mapping.'.$data['jenis']);
    if (!$kode) return response()->json(['status'=>'ignored'], 200); // izin, dll

    // idempotency: cegah duplikat dari ref_id
    if ($data['ref_id'] ?? null) {
        $dup = LaporanPelanggaran::where('absensi_ref_id', $data['ref_id'])->first();
        if ($dup) return response()->json(['status'=>'ok','laporan_pelanggaran_id'=>$dup->id], 200);
    }

    $v = VariabelPelanggaran::where('kode', $kode)->firstOrFail();

    $lap = LaporanPelanggaran::create([
        'sumber_input'           => 'absensi_api',
        'hasil_preprocessing_id' => null,
        'pelaku_santri_id'       => $user->id,
        'korban_santri_id'       => null,
        'kode_pelanggaran'       => $v->kode,
        'bobot_poin'             => $v->poin,
        'tindakan_default'       => $v->tindakan,
        'catatan_bk'             => trim(($data['kegiatan']??'').' — '.($data['keterangan']??'')),
        'tanggal_kejadian'       => $data['tanggal'],
        'status'                 => 'pending',
        'absensi_ref_id'         => $data['ref_id'] ?? null,
    ]);

    return response()->json(['status'=>'ok','laporan_pelanggaran_id'=>$lap->id], 201);
}
```

### 3.6 Penyesuaian Skema untuk Sumber Absensi
Tambahkan ke migration penanda sumber (lanjutan PRD-02 §3) agar `laporan_pelanggaran`
mengenali asal absensi + idempotency:
```php
Schema::table('laporan_pelanggaran', function (Blueprint $table) {
    // perluas enum sumber_input → tambah 'absensi_api'
    // (di MySQL ubah enum via statement ALTER, atau pakai string biasa)
    $table->string('absensi_ref_id')->nullable()->unique()->after('input_at');
});
```
> **Saran:** ubah `sumber_input` dari `enum` menjadi `string` agar fleksibel menampung
> `'nlp' | 'list_manual' | 'absensi_api'` tanpa migration enum yang rumit.

---

## 4. Alur End-to-End (Flow)

```
1. Guru BK approve santri → sistem generate barcode_token → tersimpan di users/user_barcodes
2. Santri terima kartu barcode (cetak dari RamahAnak)
3. Saat kegiatan (mis. Sholat Subuh) → santri scan di APLIKASI ABSENSI
4. Aplikasi absensi:
   a. GET /api/v1/barcode/{token} → verifikasi & tampilkan nama
   b. Tentukan status: hadir / telat / tidak hadir
5. Jika telat/tidak hadir:
   POST /api/v1/absensi/kejadian → RamahAnak buat laporan_pelanggaran
   (sumber_input='absensi_api', poin dari variabel_pelanggaran)
6. RamahAnak: poin terakumulasi → Expert System Point cek threshold →
   trigger konsekuensi otomatis → tampil di dashboard Guru BK & santri
7. Guru BK menindaklanjuti (validasi/konsekuensi) seperti pelanggaran lain
```

> **Hasil:** kejadian absensi dari aplikasi lain **menyatu** ke dalam rekam jejak & Expert
> System RamahAnak tanpa input manual, karena menulis ke `laporan_pelanggaran` yang sama.

---

## 5. Keamanan & Keandalan

| Aspek | Tindakan |
|-------|----------|
| **Auth API** | Bearer token rahasia (`ABSENSI_API_TOKEN`), simpan di `.env` (tidak di git) |
| **HTTPS** | Wajib — kedua app komunikasi via TLS |
| **Rate limit** | `throttle` middleware pada route API |
| **Idempotency** | `absensi_ref_id` unik → cegah dobel poin saat retry |
| **Barcode hilang** | Revoke token lama (`is_active=false`) + generate baru |
| **Privasi barcode** | Token opaque tanpa data pribadi; identitas hanya via API ber-token |
| **IP allowlist** (opsional) | Batasi IP server aplikasi absensi |
| **Audit** | Log setiap kejadian masuk (siapa, kapan, ref_id) |

---

## 6. Rencana Implementasi (Bertahap)

1. **Barcode:**
   - Migration `barcode_token` / tabel `user_barcodes`.
   - Service generate token + library QR (`simplesoftwareio/simple-qrcode`).
   - Endpoint tampil/cetak barcode + tombol generate (manage-user / my-profil).
2. **API foundation:**
   - Buat `routes/api.php` + daftarkan di `bootstrap/app.php`.
   - Middleware token (`ABSENSI_API_TOKEN`), `config/absensi.php` (mapping jenis→kode).
3. **Endpoint:**
   - `GET /api/v1/barcode/{token}` (verifikasi).
   - `POST /api/v1/absensi/kejadian` (push pelanggaran + idempotency).
4. **Skema laporan:** kolom `absensi_ref_id`, perluas `sumber_input` → `'absensi_api'`.
5. **Data master:** pastikan kode pelanggaran kehadiran (telat/alpha) ada di `variabel_pelanggaran`.
6. **Uji integrasi** dengan aplikasi absensi (atau Postman): scan → push → cek laporan & poin.
7. **Deploy** via PRD-01.

---

## 7. Keputusan yang Perlu Dikonfirmasi (Open Questions)

1. **Cakupan barcode:** hanya santri, atau semua user (tendik/BK juga absen)?
2. **Stack aplikasi absensi:** apa (Flutter/web/Laravel lain)? Menentukan format barcode &
   detail kontrak API.
3. **Daftar `jenis` kejadian** final dari aplikasi absensi (telat/alpha/izin/sakit…) dan
   pemetaan poin masing-masing.
4. **Approval kejadian absensi:** auto-masuk sebagai `pending` untuk divalidasi BK, atau
   langsung dihitung poin tanpa approval?
5. **Arah data lain:** apakah aplikasi absensi juga perlu **menarik** data (mis. daftar santri
   aktif per kelas) dari RamahAnak? Jika ya, tambah endpoint `GET /api/v1/santri`.

---

## 8. Checklist

- [ ] Migration barcode (`users.barcode_token` atau tabel `user_barcodes`).
- [ ] Library QR + `BarcodeController` (generate, show, cetak).
- [ ] `routes/api.php` dibuat & didaftarkan di `bootstrap/app.php`.
- [ ] Middleware token API + `config/absensi.php` (mapping `jenis → kode`).
- [ ] Endpoint `GET /barcode/{token}` & `POST /absensi/kejadian`.
- [ ] Kolom `absensi_ref_id` + `sumber_input='absensi_api'`.
- [ ] Variabel pelanggaran kehadiran tersedia di master.
- [ ] Uji idempotency, rate limit, HTTPS.
- [ ] Konfirmasi Open Questions §7.
