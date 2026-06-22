# PRD-01 — Workflow Deployment: Folder Lokal ↔ GitHub ↔ Hostinger

> **Tujuan:** Menjadikan folder lokal `RA/` sebagai satu-satunya jalur untuk mengedit kode
> aplikasi yang sudah ter-deploy di Hostinger. Setiap perubahan cukup diedit di lokal →
> commit → push ke GitHub → **otomatis ter-deploy** ke server melalui SSH.

---

## 1. Latar Belakang & Kondisi Saat Ini

Aplikasi **sudah live** di `https://ramahanak.ppmannursidoarjo.com`. Saat ini sudah ada:

- **Repo GitHub:** `https://github.com/rizzdev31/ramahanak.id.git` (branch `main`).
- **GitHub Actions** di [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml):
  trigger `push` ke `main` → SSH ke Hostinger (`appleboy/ssh-action`) → menjalankan
  `bash .../ramahanak.id/deploy.sh`.
- Secrets yang dipakai workflow: `HOST`, `USERNAME`, `SSH_PASSWORD`.
- File sensitif diabaikan git: `.env`, `.env.production`, `/vendor`, `/node_modules`
  (lihat [`.gitignore`](../.gitignore)).

**Artinya: jalur deploy sudah ada.** PRD ini merapikan & mendokumentasikan agar prompt/edit
lokal menjadi jalur resmi perubahan kode.

---

## 2. Arsitektur Alur Kerja

```
┌─────────────────────────┐   git push origin main   ┌────────────────────┐
│  FOLDER LOKAL (RA/)      │ ───────────────────────► │   GitHub Repo      │
│  Edit kode via prompt    │                          │   rizzdev31/...    │
│  Claude Code / VS Code   │ ◄─────────────────────── │   branch: main     │
└─────────────────────────┘   git pull (sinkron)      └─────────┬──────────┘
                                                                │ trigger: push main
                                                                ▼
                                                  ┌──────────────────────────┐
                                                  │  GitHub Actions           │
                                                  │  deploy.yml (ssh-action)  │
                                                  └─────────────┬─────────────┘
                                                                │ SSH (HOST/USERNAME/PASS)
                                                                ▼
                                ┌─────────────────────────────────────────────────────┐
                                │  HOSTINGER  .../ramahanak.id/                         │
                                │  deploy.sh: git pull → composer → migrate → build     │
                                │  Laravel 12 + MySQL db_ra (live)                      │
                                └─────────────────────────────────────────────────────┘
```

---

## 3. Konfigurasi yang Harus Dipastikan

### 3.1 SSH Access ke Hostinger
Hostinger Shared menyediakan SSH (hPanel → **Advanced → SSH Access**). Catat:

| Item | Keterangan |
|------|-----------|
| **Host / IP** | dari hPanel SSH Access (mis. `82.x.x.x`) → simpan ke GitHub Secret `HOST` |
| **Username** | mis. `u8796145510` → GitHub Secret `USERNAME` |
| **Port** | default `65002` (Hostinger umumnya bukan 22) — tambahkan ke workflow bila perlu |
| **Password / SSH Key** | → GitHub Secret `SSH_PASSWORD` (atau ganti ke `key` lebih aman) |

> **Rekomendasi keamanan:** Ganti `password` dengan **SSH key pair**. Generate key,
> tambahkan public key ke `~/.ssh/authorized_keys` di Hostinger, simpan private key di
> GitHub Secret `SSH_KEY`, lalu ubah `appleboy/ssh-action` memakai `key:` bukan `password:`.

### 3.2 Cek/Lengkapi `deploy.yml` (port + key opsional)
File saat ini hanya memakai `password`. Versi yang disarankan:

```yaml
name: Deploy to Hostinger
on:
  push:
    branches: [ main ]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          port: ${{ secrets.SSH_PORT }}        # mis. 65002
          password: ${{ secrets.SSH_PASSWORD }} # atau: key: ${{ secrets.SSH_KEY }}
          script: bash /home/u8796145510/domains/ramahanak.ppmannursidoarjo.com/ramahanak.id/deploy.sh
```

### 3.3 `deploy.sh` di Server (referensi)
Script ini **berada di server**, bukan di repo. Ia harus melakukan langkah berikut.
Simpan/verifikasi isinya seperti di bawah (sesuaikan path PHP/Composer Hostinger):

```bash
#!/bin/bash
set -e
cd /home/u8796145510/domains/ramahanak.ppmannursidoarjo.com/ramahanak.id/

echo ">> Pull kode terbaru"
git fetch origin main
git reset --hard origin/main          # pastikan server == GitHub (hindari konflik lokal)

echo ">> Composer (production)"
composer install --no-dev --optimize-autoloader --no-interaction

echo ">> Migrasi DB (aman, tanpa hapus data)"
php artisan migrate --force

echo ">> Build frontend"
# Jika Node tersedia di server:
# npm ci && npm run build
# Jika TIDAK ada Node di shared hosting → build di lokal/CI lalu commit folder public/build

echo ">> Cache & optimize"
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan storage:link || true

echo ">> Selesai deploy $(date)"
```

> **Catatan penting build frontend:** Shared hosting Hostinger sering **tidak punya Node.js**.
> Dua opsi:
> 1. **Build di GitHub Actions** (tambah step `npm ci && npm run build` lalu rsync/scp hasil
>    `public/build` ke server), **atau**
> 2. **Build di lokal**, lalu **commit folder `public/build`** ke git (saat ini `.gitignore`
>    meng-comment `#/public/build` sehingga build BISA di-commit). Pastikan baris itu tetap
>    ter-comment agar hasil build ikut ter-push.

### 3.4 File `.env` di Server
`.env` **tidak ikut git** (sengaja, demi keamanan). Maka:
- `.env` production **diatur manual sekali** di server (sudah ada, lihat acuan di
  [`env.production`](../env.production)).
- `deploy.sh` **tidak menimpa** `.env`. Jika ada variabel baru, tambahkan manual via SSH/hPanel
  File Manager.
- Jangan pernah commit kredensial DB (`DB_PASSWORD`) ke repo.

---

## 4. Standar Operasional Prosedur (SOP) Perubahan Kode

Inilah **jalur resmi**: prompt/edit di folder lokal → push → live.

### 4.1 Setup Awal (sekali saja)
```bash
# Pastikan folder lokal terhubung ke remote yang benar
cd "C:/Users/Rifqi/Documents/HKI Tugas Akhir/RA"
git remote -v                      # harus origin = rizzdev31/ramahanak.id.git
git pull origin main               # sinkronkan dulu sebelum kerja
```

### 4.2 Siklus Harian Pengembangan
```bash
# 1. Selalu mulai dari kondisi terbaru
git pull origin main

# 2. (Disarankan) buat branch fitur, jangan langsung di main
git checkout -b fitur/input-list-pelanggaran

# 3. Edit kode (lewat prompt Claude / editor) ...

# 4. Uji lokal
php artisan migrate          # jika ada migration baru (DB lokal)
npm run dev                  # cek UI
php artisan test             # jika ada test

# 5. Commit
git add .
git commit -m "feat: input list pelanggaran oleh tenaga pendidik"

# 6. Build frontend untuk production (jika opsi commit build dipakai)
npm run build
git add public/build && git commit -m "build: assets"

# 7. Merge ke main → memicu deploy
git checkout main
git merge fitur/input-list-pelanggaran
git push origin main         # ⬅️ GitHub Actions jalan → deploy ke Hostinger
```

### 4.3 Verifikasi Pasca-Deploy
1. Buka tab **Actions** di GitHub → pastikan job **hijau (success)**.
2. Buka `https://ramahanak.ppmannursidoarjo.com` → uji fitur.
3. Jika error 500 → cek `storage/logs/laravel.log` via SSH/File Manager.

---

## 5. Aturan Keamanan Data (WAJIB)

- **Database production tidak boleh di-reset.** `deploy.sh` hanya `migrate --force`,
  **tidak** `migrate:fresh` / `migrate:refresh` (akan menghapus data santri).
- Backup DB sebelum migration besar: `mysqldump` via SSH atau export di hPanel → phpMyAdmin.
  (File [`u879614510_db_ra.sql`](../u879614510_db_ra.sql) adalah dump terbaru sebagai acuan.)
- Migration baru harus **aditif & nullable** untuk kolom baru, agar data lama tidak rusak.
- Jangan commit `.env`, `auth.json`, atau key apa pun.

---

## 6. Checklist Implementasi PRD-01

- [ ] Verifikasi GitHub Secrets: `HOST`, `USERNAME`, `SSH_PASSWORD` (+ `SSH_PORT`, opsional `SSH_KEY`).
- [ ] Pastikan `deploy.sh` di server sesuai referензi §3.3 (terutama `git reset --hard` + `migrate --force`).
- [ ] Putuskan strategi build frontend (CI build **atau** commit `public/build`).
- [ ] Test 1 perubahan kecil (mis. ubah teks footer) → push → konfirmasi live.
- [ ] Dokumentasikan host/port SSH final di catatan privat (jangan di repo).

---

## 7. Risiko & Mitigasi

| Risiko | Mitigasi |
|--------|----------|
| Konflik git di server | `git reset --hard origin/main` di `deploy.sh` (server selalu ikut GitHub) |
| Node tidak ada di Hostinger | Build di CI atau commit `public/build` |
| Password SSH bocor | Pindah ke SSH key; rotasi secret berkala |
| Migration merusak data | Kolom aditif/nullable + backup sebelum deploy |
| Deploy gagal separuh jalan | `set -e` di `deploy.sh` → berhenti di error; cek log Actions |
