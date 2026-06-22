# AUDIT — Kegagalan Preprocessing (NLP) & Perbaikannya

> **Status:** ✅ **SELESAI & TERVERIFIKASI DI PRODUCTION** (2026-06-22).

---

## 1. Gejala
Saat submit laporan teks bebas, tahap preprocessing **gagal**. Log server:
```
production.ERROR: Preprocessing job failed {"laporan_id":12,"error":"Preprocessing tidak
mengembalikan hasil yang valid","attempt":1,"mode":"exec"}
```

## 2. Investigasi (fakta terkumpul)
| Cek | Hasil |
|-----|-------|
| Endpoint PythonAnywhere `https://ramahanakid.pythonanywhere.com/` | **HIDUP** (HTTP 200) |
| `POST /preprocess` (payload valid) | **SUKSES** → `{"status":"success","kode_matched":["P001"],...}` |
| `python3` di Hostinger | **TIDAK ADA** (`command not found`) |
| PHP `disable_functions` Hostinger | memuat **`exec, shell_exec, system, passthru, popen`** (diblokir) |
| venv Linux di server | tidak ada |
| `.env` server | `NLP_API_URL` & `NLP_API_TOKEN` **ada** |
| Log `mode` | tertulis **`exec`** (padahal `.env` punya URL) |

## 3. Akar Masalah (root cause)
`ProcessLaporanJob::isApiMode()` membaca **`env('NLP_API_URL')` langsung saat runtime**.
`deploy.sh` menjalankan **`php artisan config:cache`**. Setelah config di-cache, **`env()`
mengembalikan `null`** untuk key yang tidak diakses lewat file config (perilaku standar
Laravel). Akibat berantai:

```
env('NLP_API_URL') = null  →  isApiMode() = false  →  mode = exec()
exec() di Hostinger = diblokir (disable_functions) + tidak ada python  →  GAGAL
```

> **Catatan jujur:** kegagalan ini ter-trigger tepat setelah menjalankan `deploy.sh`
> (yang ada `config:cache`) pada 2026-06-22. Sebelum config ter-cache, `env()` masih
> bekerja sehingga mode Flask terpilih. Jadi bukan PythonAnywhere yang rusak — murni
> bug konfigurasi sisi Laravel.

## 4. Perbaikan
1. Tambah blok config di [`config/services.php`](../config/services.php):
   ```php
   'nlp' => [
       'url'   => env('NLP_API_URL'),
       'token' => env('NLP_API_TOKEN', ''),
   ],
   ```
2. Ganti `env()` → `config()` di [`app/Jobs/ProcessLaporanJob.php`](../app/Jobs/ProcessLaporanJob.php):
   - `isApiMode()` → `!empty(config('services.nlp.url'))`
   - `runViaFlaskApi()` → `config('services.nlp.url')` & `config('services.nlp.token')`

Commit `7cedf1e`, ter-deploy otomatis via GitHub Actions.

## 5. Verifikasi
```
# config terbaca meski sudah config:cache:
nlp.url=https://ramahanakid.pythonanywhere.com
nlp.token=«REDACTED — lihat .env server»

# re-run laporan 12 (yang tadi gagal):
URL=https://ramahanakid.pythonanywhere.com
JOB_OK
HASIL=13|pending_validasi|["P001"]   ← berhasil via Flask, siap divalidasi BK
```

## 6. Arsitektur Preprocessing yang Benar (untuk diingat)
```
Laravel (Hostinger)                         PythonAnywhere (Flask)
  ProcessLaporanJob
   ├─ kumpulkan: teks_laporan, kamus_words,
   │  santri_map, variabel_data (dari DB)
   ├─ POST /preprocess  ───────────────────►  jalankan NLP (Sastrawi, NER, matching)
   │                                          (NO DB — stateless, free tier safe)
   ◄─────────────── JSON hasil ──────────────┘
   └─ Laravel SIMPAN ke hasil_preprocessing (saveHasilPreprocessing)
```
- **Flask tidak akses DB** (penting: PythonAnywhere free tier tak bisa connect MySQL eksternal).
  Laravel kirim semua data yang dibutuhkan & menyimpan hasilnya. Mode ini disebut "no-db".

## 7. Sisa / Catatan
- ⚠️ Route diagnostik **`laporan.test-preprocessing`** (`LaporanAwalController::testPreprocessing`)
  masih memakai `PreprocessingService` (exec-only) → akan tetap gagal di Hostinger. Bukan alur
  utama; perbaiki dengan mengarahkan ke jalur Flask bila ingin dipakai.
- ⚠️ PythonAnywhere free tier menampilkan *"This site will be disabled on Wednesday 22 July
  2026"* — perlu **klik perpanjang** berkala di dashboard PythonAnywhere agar tidak mati.
  Pertimbangkan akun berbayar bila layanan ini kritikal.
- Laporan 10 & 11 (uji sebelumnya) masih punya `hasil_preprocessing` status `failed` —
  bisa disubmit/diproses ulang oleh user kapan saja.
