# PRD-05 — Aplikasi Pengirim (Smart Eksekusi & Absensi) — SPEC IMPLEMENTASI LENGKAP

> **Dokumen ini self-contained.** Ditujukan agar developer / Claude Code di repo **aplikasi
> pengirim** bisa membangun integrasi penuh **tanpa perlu konteks lain**. Semua kontrak API
> RamahAnak yang relevan sudah ditanam di sini (kondisi: API RamahAnak **sudah LIVE & teruji**
> per 2026-06-22).

---

## 0. Konteks (baca dulu)

Ada **dua aplikasi terpisah**:

- **RamahAnak.id** (PENERIMA) — sistem pembinaan santri (Laravel 12 + Inertia/React) di
  Hostinger `https://ramahanak.ppmannursidoarjo.com`. Punya basis data santri, variabel
  pelanggaran/apresiasi/konselor, poin, Expert System, dan layar **Guru BK** untuk
  approve/tolak laporan. **Sudah menyediakan REST API** untuk menerima laporan dari luar.
- **Aplikasi Pengirim** (APP INI yang akan dibangun) — Laravel (backend) + **Vue.js**
  (frontend superadmin) + **Flutter** (frontend tenaga pendidik). Tugasnya **mengirim laporan**
  ke RamahAnak: (a) **Smart Eksekusi** (tendik input manual), (b) **Absensi** (otomatis kirim
  keterlambatan).

**Aturan emas integrasi:**
1. RamahAnak **tidak** memproses NLP untuk kiriman ini — kode sudah final dari pengirim.
2. Identitas santri = **NISN**. Di aplikasi pengirim field-nya mungkin bernama "NIP", tetapi
   **isinya HARUS NISN yang sama** dengan yang ada di RamahAnak.
3. Setiap laporan yang dikirim **TIDAK langsung final**. RamahAnak memprosesnya lewat
   **gerbang validasi wali kelas dulu** → `approval_status` biasanya **`pending_tenaga_pendidik`**
   (wali kelas validasi → lalu `pending_bk` → Guru BK approve). Bila santri tak punya wali,
   bisa langsung `pending_bk`. *(diperbarui 2026-06-28)* Klien cukup perlakukan **`201 ok`**
   (apa pun nilai `approval_status`) sebagai **sukses terkirim**; contoh respons di bawah yang
   menulis `"pending_bk"` hanyalah ilustrasi nilai yang mungkin.
4. Wajib kirim **`ref_id`** unik & stabil per kejadian (idempotency anti-dobel).

---

## 1. Glosarium

| Istilah | Arti |
|---------|------|
| **NISN** | Nomor induk santri — kunci kanonik lintas aplikasi. (Field "NIP" di pengirim = NISN.) |
| **Kode variabel** | `P###` pelanggaran, `A###` apresiasi, `G###` konselor. Ditarik dari RamahAnak. |
| **Smart Eksekusi** | Fitur pengirim: tendik/superadmin input laporan manual → kirim ke RamahAnak. |
| **ref_id** | ID unik milik pengirim per kejadian → dipakai RamahAnak untuk idempotency. |
| **pending_bk** | Status laporan di RamahAnak: menunggu keputusan Guru BK. |
| **Outbox** | Tabel antrian kiriman di pengirim (pola transactional outbox) untuk keandalan. |

---

## 2. KONTRAK API RamahAnak (LENGKAP — ini yang dipanggil pengirim)

### 2.1 Dasar
- **Base URL:** `https://ramahanak.ppmannursidoarjo.com/api/v1`
- **Header wajib semua request:**
  - `Authorization: Bearer <INTEGRASI_API_TOKEN>`
  - `Accept: application/json`
  - `Content-Type: application/json` (untuk POST)
- **Rate limit:** 120 request / menit / IP (HTTP 429 bila lewat).
- **Token:** ada di `.env` server RamahAnak sebagai `INTEGRASI_API_TOKEN`. **Jangan tulis nilai
  token di repo/dokumen** — taruh di `.env` aplikasi pengirim. (Pemilik aplikasi punya nilainya.)

### 2.2 Health check
```
GET /ping
200 → {"status":"ok","service":"ramahanak-integrasi","time":"2026-06-22T13:29:44Z"}
401 → {"status":"unauthorized","message":"Token integrasi tidak valid."}
```

### 2.3 Smart Eksekusi — Pelanggaran
```
POST /eksekusi/pelanggaran
```
| Field | Tipe | Wajib | Catatan |
|-------|------|-------|---------|
| `nisn_pelaku` | string | ✅ | NISN santri pelaku |
| `nisn_korban` | string | ➖ | NISN santri korban (boleh kosong/null) |
| `kode` | string | ✅ | kode `P###` (harus ada di RamahAnak) |
| `tanggal` | date `YYYY-MM-DD` | ✅ | tanggal kejadian |
| `catatan` | string ≤1000 | ➖ | catatan bebas |
| `ref_id` | string ≤191 | ➖* | **sangat disarankan** (idempotency) |
| `actor` | string ≤191 | ➖ | nama/NIP tendik pengirim (jejak audit) |
| `app` | string ≤50 | ➖ | identitas app pengirim |

Contoh request:
```json
{ "nisn_pelaku":"128781262", "nisn_korban":"0091112223", "kode":"P001",
  "tanggal":"2026-06-22", "catatan":"Berkelahi saat istirahat",
  "ref_id":"ANNUR-EKS-000123", "actor":"Ust. Budi", "app":"annur-eksekusi" }
```
Sukses:
```json
201 {"status":"ok","laporan_pelanggaran_id":3,"approval_status":"pending_bk","poin":5}
```

### 2.4 Smart Eksekusi — Apresiasi (hanya pelaku)
```
POST /eksekusi/apresiasi
```
Field: `nisn_pelaku`✅, `kode`✅ (`A###`), `tanggal`✅, `catatan`➖, `ref_id`➖, `actor`➖, `app`➖
```json
201 {"status":"ok","laporan_apresiasi_id":12,"approval_status":"pending_bk","poin":10}
```

### 2.5 Smart Eksekusi — Konselor (hanya korban)
```
POST /eksekusi/konselor
```
Field: `nisn_korban`✅, `kode`✅ (`G###`), `tanggal`✅, `catatan`➖, `ref_id`➖, `actor`➖, `app`➖
```json
201 {"status":"ok","laporan_konselor_id":7,"approval_status":"pending_bk"}
```
(catatan: konselor tidak mengembalikan `poin`.)

### 2.6 Absensi — Telat (otomatis)
```
POST /absensi/telat
```
| Field | Tipe | Wajib |
|-------|------|-------|
| `nisn` | string | ✅ |
| `tanggal` | date | ✅ |
| `waktu` | string ≤20 | ➖ (mis. "04:35") |
| `kegiatan` | string ≤191 | ➖ (mis. "Sholat Subuh") |
| `ref_id` | string ≤191 | ➖* (disarankan, komposit) |
| `actor`/`app` | string | ➖ |

```json
201 {"status":"ok","laporan_pelanggaran_id":4,"kode":"P002","approval_status":"pending_bk","poin":2}
```
> RamahAnak otomatis memetakan telat → kode disiplin waktu (`P002`). Pengirim **tidak** perlu
> tahu kodenya. Hanya keterlambatan yang dikirim (alpha/izin/sakit di luar ruang lingkup).

### 2.7 Sinkronisasi kode variabel (pengirim auto-tarik)
```
GET /variabel/pelanggaran
GET /variabel/apresiasi
GET /variabel/konselor
200 → {"status":"ok","jenis":"pelanggaran","data":[
        {"kode":"P001","kategori":"perundungan_fisik","poin":5,"label":"..."},
        {"kode":"P002","kategori":"disiplin_waktu","poin":2,"label":"..."}, ... ]}
```
> Untuk konselor, `poin` = null, `kategori` = nama gangguan mental. Panggil berkala → otomatis
> ikut bila variabel di RamahAnak bertambah/berkurang.

### 2.8 Verifikasi santri (opsional, untuk UX)
```
GET /santri/{nisn}
200 → {"status":"ok","nisn":"128781262","nama":"Abrima Dwi Pramuditiyo","kelas":"8A"}
404 → {"status":"santri_not_found"}
```

### 2.9 Tabel Respons & Error (semua endpoint)
| HTTP | body `status` | arti | tindakan pengirim |
|------|---------------|------|-------------------|
| 201 | `ok` | laporan dibuat (pending_bk) | tandai outbox `sent`, simpan `laporan_*_id` |
| 200 | `duplicate` | `ref_id` sudah pernah diproses | **perlakukan SUKSES**, jangan kirim ulang |
| 401 | `unauthorized` | token salah/kosong | henti, perbaiki token |
| 404 | `santri_not_found` | NISN tak ada di RamahAnak | tandai `failed`, beri tahu user/data master |
| 404 | `kode_not_found` | kode variabel tak ada | tandai `failed`, sinkronkan kode |
| 422 | (Laravel) `message`+`errors` | validasi gagal (field kurang/format) | tandai `failed`, perbaiki payload |
| 429 | — | rate limit | retry dengan backoff |
| 500 | `error` | error server RamahAnak | retry dengan backoff |

---

## 3. Yang harus dijamin pengirim (3 prasyarat)

1. **NISN konsisten.** Field santri (apa pun namanya: "NIP") **berisi NISN** identik dgn RamahAnak.
2. **Kode dari sinkron.** Jangan hardcode kode; tarik via `GET /variabel/*` dan tampilkan ke user.
3. **`ref_id` unik & stabil.** Contoh:
   - Smart Eksekusi: `EKS-{id_baris_outbox}` atau `EKS-{uuid}`.
   - Absensi: `ABS-{tanggal}-{nisn}-{slug_kegiatan}` (mis. `ABS-2026-06-22-128781262-subuh`).
   `ref_id` yang sama akan dianggap kiriman yang sama (idempotent).

---

## 4. Arsitektur Aplikasi Pengirim

```
┌──────────────┐      ┌──────────────┐
│  Vue (Super  │      │  Flutter     │
│  admin web)  │      │  (Tendik)    │
└──────┬───────┘      └──────┬───────┘
       │ auth user pengirim  │ auth user pengirim
       ▼                     ▼
┌────────────────────────────────────────┐
│  BACKEND LARAVEL (Aplikasi Pengirim)    │
│  • DB lokal (santri[nisn], absensi, ...)│
│  • outbox_laporan (antrian kiriman)     │
│  • kode_variabel_cache (hasil sinkron)  │
│  • RamahAnakClient (HTTP)               │
│  • KirimLaporanJob (queue + retry)      │
│  • SyncVariabelJob (terjadwal)          │
└───────────────┬─────────────────────────┘
                │ HTTPS Bearer token (config)
                ▼
   RamahAnak API  /api/v1/...  (pending_bk)
```
> **Token RamahAnak HANYA di backend pengirim.** Vue/Flutter → backend pengirim (auth sendiri)
> → backend pengirim → RamahAnak. Jangan pernah taruh token di klien.

---

## 5. Implementasi Backend Laravel (Pengirim)

### 5.1 Konfigurasi
`.env` (pengirim):
```
RAMAHANAK_API_URL=https://ramahanak.ppmannursidoarjo.com/api/v1
RAMAHANAK_API_TOKEN=__isi_dari_env_RamahAnak_INTEGRASI_API_TOKEN__
RAMAHANAK_APP_NAME=annur-eksekusi
```
`config/ramahanak.php` (selalu pakai `config()`, bukan `env()` langsung):
```php
<?php
return [
    'url'   => env('RAMAHANAK_API_URL'),
    'token' => env('RAMAHANAK_API_TOKEN'),
    'app'   => env('RAMAHANAK_APP_NAME', 'aplikasi-pengirim'),
];
```

### 5.2 Migration — outbox & cache kode
```php
// outbox_laporan
Schema::create('outbox_laporan', function (Blueprint $t) {
    $t->id();
    $t->enum('jenis', ['pelanggaran','apresiasi','konselor','telat']);
    $t->json('payload');                 // body yang dikirim ke RamahAnak
    $t->string('ref_id')->unique();      // idempotency
    $t->enum('status', ['pending','sent','failed','duplicate'])->default('pending');
    $t->unsignedInteger('attempts')->default(0);
    $t->json('response')->nullable();    // respons RamahAnak terakhir
    $t->string('error')->nullable();
    $t->unsignedBigInteger('ramahanak_laporan_id')->nullable();
    $t->timestamp('sent_at')->nullable();
    $t->timestamps();
    $t->index(['status','jenis']);
});

// kode_variabel_cache (hasil sinkron dari RamahAnak)
Schema::create('kode_variabel_cache', function (Blueprint $t) {
    $t->id();
    $t->enum('jenis', ['pelanggaran','apresiasi','konselor']);
    $t->string('kode');
    $t->string('kategori')->nullable();
    $t->integer('poin')->nullable();
    $t->string('label')->nullable();
    $t->timestamps();
    $t->unique(['jenis','kode']);
});
```
> **Master santri:** pastikan tabel santri pengirim punya kolom `nisn` (isi = NISN RamahAnak).
> Tidak perlu sinkron data santri dari RamahAnak (cukup NISN cocok).

### 5.3 `RamahAnakClient` (service HTTP)
```php
<?php
namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Http\Client\Response;

class RamahAnakClient
{
    private function http()
    {
        return Http::baseUrl(config('ramahanak.url'))
            ->withToken(config('ramahanak.token'))
            ->acceptJson()
            ->timeout(30)
            ->retry(2, 1000, throw: false); // retry ringan utk error jaringan
    }

    public function ping(): Response                 { return $this->http()->get('/ping'); }
    public function kirimPelanggaran(array $p): Response { return $this->http()->post('/eksekusi/pelanggaran', $p); }
    public function kirimApresiasi(array $p): Response   { return $this->http()->post('/eksekusi/apresiasi', $p); }
    public function kirimKonselor(array $p): Response    { return $this->http()->post('/eksekusi/konselor', $p); }
    public function kirimTelat(array $p): Response       { return $this->http()->post('/absensi/telat', $p); }

    public function tarikVariabel(string $jenis): Response { return $this->http()->get("/variabel/{$jenis}"); }
    public function cekSantri(string $nisn): Response      { return $this->http()->get("/santri/{$nisn}"); }
}
```

### 5.4 Model `OutboxLaporan`
```php
<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class OutboxLaporan extends Model
{
    protected $table = 'outbox_laporan';
    protected $fillable = ['jenis','payload','ref_id','status','attempts','response','error','ramahanak_laporan_id','sent_at'];
    protected $casts = ['payload'=>'array','response'=>'array','sent_at'=>'datetime'];
}
```

### 5.5 Enqueue (dipanggil controller saat user submit / absensi telat)
```php
<?php
namespace App\Services;
use App\Models\OutboxLaporan;
use App\Jobs\KirimLaporanJob;
use Illuminate\Support\Str;

class OutboxService
{
    /** $jenis: pelanggaran|apresiasi|konselor|telat ; $payload: body sesuai kontrak (tanpa ref_id/app) */
    public function enqueue(string $jenis, array $payload, ?string $refId = null): OutboxLaporan
    {
        $refId ??= strtoupper($jenis).'-'.Str::uuid();
        $payload['ref_id'] = $refId;
        $payload['app']    = config('ramahanak.app');

        $row = OutboxLaporan::firstOrCreate(
            ['ref_id' => $refId],
            ['jenis' => $jenis, 'payload' => $payload, 'status' => 'pending']
        );
        if ($row->wasRecentlyCreated) {
            KirimLaporanJob::dispatch($row->id);
        }
        return $row;
    }
}
```

### 5.6 `KirimLaporanJob` (queue + retry + duplicate=sukses)
```php
<?php
namespace App\Jobs;

use App\Models\OutboxLaporan;
use App\Services\RamahAnakClient;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class KirimLaporanJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 5;
    public $backoff = [10, 30, 60, 120]; // detik

    public function __construct(public int $outboxId) {}

    public function handle(RamahAnakClient $client): void
    {
        $row = OutboxLaporan::find($this->outboxId);
        if (!$row || in_array($row->status, ['sent','duplicate'])) return;

        $row->increment('attempts');

        $resp = match ($row->jenis) {
            'pelanggaran' => $client->kirimPelanggaran($row->payload),
            'apresiasi'   => $client->kirimApresiasi($row->payload),
            'konselor'    => $client->kirimKonselor($row->payload),
            'telat'       => $client->kirimTelat($row->payload),
        };

        $body = $resp->json() ?? [];
        $status = $body['status'] ?? null;

        // SUKSES: 201 ok ATAU 200 duplicate
        if ($resp->successful() && in_array($status, ['ok','duplicate'])) {
            $row->update([
                'status'   => $status === 'duplicate' ? 'duplicate' : 'sent',
                'response' => $body,
                'ramahanak_laporan_id' => $body['laporan_pelanggaran_id']
                    ?? $body['laporan_apresiasi_id'] ?? $body['laporan_konselor_id'] ?? null,
                'sent_at'  => now(),
                'error'    => null,
            ]);
            return;
        }

        // GAGAL PERMANEN (jangan retry): 404 / 422
        if (in_array($resp->status(), [404, 422])) {
            $row->update(['status'=>'failed','response'=>$body,'error'=>$body['message'] ?? 'client error']);
            return; // tidak throw → tidak retry
        }

        // GAGAL SEMENTARA (401/429/500/jaringan): throw → retry sesuai backoff
        $row->update(['response'=>$body,'error'=>'HTTP '.$resp->status()]);
        throw new \RuntimeException('RamahAnak API gagal sementara: HTTP '.$resp->status());
    }
}
```

### 5.7 `SyncVariabelJob` (tarik kode berkala) + scheduler
```php
// Job: untuk tiap jenis, tarik & upsert ke kode_variabel_cache
class SyncVariabelJob implements ShouldQueue {
    public function handle(RamahAnakClient $client): void {
        foreach (['pelanggaran','apresiasi','konselor'] as $jenis) {
            $resp = $client->tarikVariabel($jenis);
            if (!$resp->successful()) continue;
            foreach ($resp->json('data', []) as $v) {
                \App\Models\KodeVariabelCache::updateOrCreate(
                    ['jenis'=>$jenis,'kode'=>$v['kode']],
                    ['kategori'=>$v['kategori'] ?? null,'poin'=>$v['poin'] ?? null,'label'=>$v['label'] ?? null]
                );
            }
        }
    }
}
// routes/console.php (Laravel 11/12):
Schedule::job(new \App\Jobs\SyncVariabelJob)->hourly();
```

### 5.8 Hook Absensi (saat status = telat)
```php
// di dalam logic absensi pengirim, ketika santri tercatat telat:
$refId = 'ABS-'.$tanggal.'-'.$santri->nisn.'-'.\Illuminate\Support\Str::slug($kegiatan);
app(\App\Services\OutboxService::class)->enqueue('telat', [
    'nisn'     => $santri->nisn,
    'tanggal'  => $tanggal,            // YYYY-MM-DD
    'waktu'    => $waktu,              // opsional
    'kegiatan' => $kegiatan,          // opsional
    'actor'    => 'sistem-absensi',
], $refId);
```

### 5.9 Endpoint backend pengirim untuk Vue/Flutter (contoh)
```php
// routes/api.php (pengirim) — diproteksi auth user pengirim (Sanctum)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/kode/{jenis}', [KodeController::class, 'index']);          // dari cache
    Route::get('/santri', [SantriController::class, 'index']);              // master santri pengirim
    Route::post('/eksekusi', [EksekusiController::class, 'store']);         // {jenis, nisn_pelaku/korban, kode, tanggal, catatan}
    Route::get('/outbox', [OutboxController::class, 'index']);              // status kiriman
    Route::post('/outbox/{id}/retry', [OutboxController::class, 'retry']);  // retry manual
});
```
`EksekusiController@store` memvalidasi lalu memanggil `OutboxService::enqueue(...)`.

---

## 6. Frontend Vue.js (Superadmin)

Halaman:
1. **Smart Eksekusi** — form: pilih santri (master pengirih), pilih jenis (pelanggaran/
   apresiasi/konselor), pilih **kode dari cache** (`GET /kode/{jenis}`), tanggal, catatan,
   (pelanggaran) korban opsional → submit ke `POST /eksekusi`.
2. **Monitor Outbox** — tabel kiriman + status (`pending/sent/duplicate/failed`), tombol retry,
   tampilkan `ramahanak_laporan_id` & error. Ingat: status sukses = "Terkirim, menunggu BK".
3. **Sinkron Kode** — tombol "Tarik kode terbaru" (jalankan SyncVariabelJob) + tampil daftar.
4. **Pengaturan koneksi** — hanya tampil status `GET /ping` (token tetap di backend).

UX penting: setelah submit, tampilkan **"Terkirim — menunggu keputusan Guru BK"** (bukan
"selesai"), karena status RamahAnak = `pending_bk`.

---

## 7. Frontend Flutter (Tenaga Pendidik)

Layar:
1. **Login** (auth backend pengirim).
2. **Daftar Santri** (dari master pengirim; tampilkan NISN).
3. **Smart Eksekusi (list cepat)** — pilih santri → pilih jenis → pilih **kode** (dari endpoint
   kode pengirim) → kirim. Mode batch opsional (beberapa baris sekaligus).
4. **Riwayat Kiriman** — status outbox milik tendik (pending/terkirim/menunggu BK/gagal).

Offline-friendly: simpan input lokal (sqflite) → sinkron ke backend saat online; backend yang
meneruskan ke RamahAnak via outbox. `ref_id` dibuat di sisi backend pengirim agar konsisten.

---

## 8. Rencana Build Bertahap (urutan dikerjakan)

1. **Master santri**: pastikan kolom `nisn` ada & terisi (= NISN RamahAnak).
2. **Config + Client**: `config/ramahanak.php`, `.env`, `RamahAnakClient`. Uji `GET /ping`.
3. **Sinkron kode**: migration `kode_variabel_cache` + `SyncVariabelJob` + scheduler. Uji tarik.
4. **Outbox**: migration + model + `OutboxService` + `KirimLaporanJob` (queue). 
5. **Endpoint pengirim** untuk Vue/Flutter (eksekusi, kode, outbox).
6. **Vue**: halaman Smart Eksekusi + Monitor Outbox.
7. **Flutter**: layar Smart Eksekusi + Riwayat.
8. **Absensi hook**: panggil `OutboxService::enqueue('telat', ...)` saat telat.
9. **Uji end-to-end** ke API live (lihat §9).
10. **Switch env** lokal→produksi (hanya ganti `.env`).

---

## 9. Cara Uji ke API Live (curl)

Ganti `<TOKEN>` dengan `INTEGRASI_API_TOKEN` RamahAnak. NISN contoh harus ada di RamahAnak.
```bash
BASE=https://ramahanak.ppmannursidoarjo.com/api/v1
# 1. ping
curl -s "$BASE/ping" -H "Authorization: Bearer <TOKEN>"
# 2. tarik kode
curl -s "$BASE/variabel/pelanggaran" -H "Authorization: Bearer <TOKEN>"
# 3. kirim pelanggaran (uji)
curl -s -X POST "$BASE/eksekusi/pelanggaran" -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"nisn_pelaku":"<NISN>","kode":"P001","tanggal":"2026-06-22","ref_id":"UJI-1"}'
# 4. kirim ulang ref_id sama → harus "duplicate"
#    (ulangi perintah #3) → {"status":"duplicate",...}
# 5. absensi telat
curl -s -X POST "$BASE/absensi/telat" -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"nisn":"<NISN>","tanggal":"2026-06-22","kegiatan":"Sholat Subuh","ref_id":"UJI-ABS-1"}'
```
> Catatan: kiriman uji akan muncul di layar Guru BK RamahAnak sebagai `pending_bk`. Untuk uji
> bersih, koordinasikan agar BK menolaknya, atau gunakan data yang memang valid.

---

## 10. Aturan Keamanan

- `RAMAHANAK_API_TOKEN` hanya di `.env` backend pengirim. **Jangan** di Vue/Flutter/repo publik.
- Komunikasi via **HTTPS**.
- Klien (Vue/Flutter) berbicara ke backend pengirim (auth user pengirim), bukan langsung ke RamahAnak.
- Simpan `actor` (siapa tendik) di setiap kiriman untuk jejak audit.

---

## 11. Checklist Implementasi (Pengirim)

- [ ] Master santri punya `nisn` (= NISN RamahAnak).
- [ ] `config/ramahanak.php` + `.env` (URL, token, app). `GET /ping` 200.
- [ ] `RamahAnakClient` jalan.
- [ ] `kode_variabel_cache` + `SyncVariabelJob` + scheduler (hourly).
- [ ] `outbox_laporan` + `OutboxLaporan` + `OutboxService` + `KirimLaporanJob` (retry, duplicate=sukses).
- [ ] Endpoint backend pengirim untuk Vue/Flutter.
- [ ] Vue: Smart Eksekusi + Monitor Outbox (label "menunggu BK").
- [ ] Flutter: Smart Eksekusi list + Riwayat.
- [ ] Absensi: hook telat → enqueue.
- [ ] Uji end-to-end ke API live (ping, kode, eksekusi, duplicate, telat).
- [ ] `.env` produksi siap (switch URL/token).

---

## 12. Lampiran — Ringkasan Kontrak (1 layar)

```
Base: https://ramahanak.ppmannursidoarjo.com/api/v1   Header: Authorization: Bearer <TOKEN>
POST /eksekusi/pelanggaran {nisn_pelaku, [nisn_korban], kode, tanggal, [catatan], ref_id, [actor], [app]}
POST /eksekusi/apresiasi   {nisn_pelaku, kode, tanggal, [catatan], ref_id, [actor], [app]}
POST /eksekusi/konselor    {nisn_korban, kode, tanggal, [catatan], ref_id, [actor], [app]}
POST /absensi/telat        {nisn, tanggal, [waktu], [kegiatan], ref_id, [actor], [app]}
GET  /variabel/{pelanggaran|apresiasi|konselor}
GET  /santri/{nisn}        GET /ping
Sukses 201 {status:ok, laporan_*_id, approval_status:"pending_bk", [poin]}
Idempotent 200 {status:duplicate, ...}   Error 401/404(santri_not_found|kode_not_found)/422/429/500
ATURAN: NISN=field "NIP"; kode dari GET /variabel; ref_id unik; hasil = pending_bk (tunggu BK).
```
