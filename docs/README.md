# 🧠 Otak Aplikasi — RamahAnak.id

Folder ini adalah **pusat dokumentasi & "otak" aplikasi RamahAnak.id**. Semua keputusan
arsitektur, alur logika, dan rencana pembaharuan disimpan di sini agar setiap perubahan
kode tetap **sinkron dengan database dan logic aplikasi**.

> Gunakan dokumen ini sebagai konteks utama setiap kali Claude / developer akan mengedit
> kode, sehingga perubahan tidak melenceng dari arsitektur yang sudah berjalan.

---

## 📌 Ringkasan Sistem Saat Ini

| Aspek | Nilai |
|-------|-------|
| **Nama** | RamahAnak.id — Sistem Manajemen Cerdas Pembinaan Santri |
| **Repo GitHub** | `https://github.com/rizzdev31/ramahanak.id.git` (branch `main`) |
| **Hosting App** | Hostinger Shared — `ramahanak.ppmannursidoarjo.com` |
| **Path Server** | `/home/u8796145510/domains/ramahanak.ppmannursidoarjo.com/ramahanak.id/` |
| **Stack** | Laravel 12 · PHP 8.2 · React 18 + Inertia.js + Vite · Tailwind 3 |
| **NLP Engine** | Python Flask (Sastrawi) — di PythonAnywhere |
| **Database** | MariaDB/MySQL — `db_ra` (prefix Hostinger `u879614510_`) |
| **Deploy** | GitHub Actions (`appleboy/ssh-action`) → SSH → `deploy.sh` di server |

### Role Pengguna
- **guru_bk** — Administrator / pengelola Expert System & validasi akhir.
- **tenaga_pendidik** — Wali kelas, penginput kegiatan harian santri.
- **santri** — Pemilik rekam jejak, upload bukti, isi bimbingan.

### Alur Data Inti (existing)
```
laporan_awal (teks bebas)
   → NLP Pipeline (Python/Flask)
   → hasil_preprocessing (validasi BK)
   → routing → laporan_pelanggaran / laporan_apresiasi / laporan_konselor
   → Expert System Point / Expert System Konselor
   → tindak lanjut (konsekuensi, reward, sesi bimbingan)
```

---

## 📚 Daftar Dokumen

| No | Dokumen | Isi |
|----|---------|-----|
| 01 | [PRD-01 — Workflow Deployment](PRD-01-Deployment-Workflow.md) | Folder lokal ↔ GitHub ↔ Hostinger via SSH; edit → commit → push → auto-deploy. ✅ aktif |
| **04** | **[PRD-04 — Integrasi API: Smart Eksekusi & Absensi](PRD-04-Integrasi-API-Smart-Eksekusi-Absensi.md)** | ⭐ **LOGIC UTAMA.** RamahAnak menerima laporan dari aplikasi pengirim tanpa preprocessing → langsung eksekusi ke laporan + Expert System |
| **05** | **[PRD-05 — Aplikasi Pengirim](PRD-05-Aplikasi-Pengirim.md)** | ⭐ Yang harus disiapkan di aplikasi pengirim (Laravel + Vue + Flutter): outbox, client API, sinkron NISN/kode |
| 🔍 | [AUDIT — Preprocessing](AUDIT-Preprocessing.md) | Akar masalah preprocessing gagal (env vs config:cache) + perbaikan. ✅ selesai |
| 02 | [PRD-02 — Input List (pelengkap)](PRD-02-Input-List-Pelanggaran-Apresiasi-Konselor.md) | *Pelengkap.* Input list manual oleh tendik di dalam RamahAnak |
| 03 | [PRD-03 — Barcode (pelengkap)](PRD-03-Barcode-Absensi-Integrasi-API.md) | *Pelengkap.* Konsep barcode & versi awal integrasi (digantikan PRD-04 untuk logic API) |
| 🔧 | [SETUP — SSH ke Hostinger](SETUP-SSH-Hostinger.md) | SSH key ke server (`153.92.11.119:65002`), alias `ssh ramahanak`, deploy, perintah umum |

---

## 🔑 Prinsip Saat Mengembangkan

1. **Database dulu, baru logic.** Setiap fitur baru harus dipetakan ke tabel/kolom yang ada
   sebelum menulis controller/UI.
2. **Jaga alur Expert System.** `laporan_pelanggaran/apresiasi/konselor` adalah pintu masuk
   poin & Forward Chaining — apa pun sumber inputnya, struktur akhir harus tetap kompatibel.
3. **Backward compatible.** Fitur teks bebas + NLP TIDAK dihapus; fitur baru berjalan
   berdampingan (kolom `sumber_input` membedakannya).
4. **Setiap perubahan skema = 1 migration baru** (jangan edit migration lama yang sudah jalan di production).
5. **Update dokumen ini** setiap kali keputusan arsitektur berubah.
