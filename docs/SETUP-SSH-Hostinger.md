# SETUP — Menghubungkan Chat/Claude Code ke Server Hostinger via SSH

> **Tujuan:** Agar perbaikan & pengelolaan server RamahAnak.id bisa dilakukan **langsung
> dari chat (Claude Code)** lewat SSH passwordless (pakai key), tanpa harus login manual
> tiap kali.

> **Status:** ✅ **SUDAH TERHUBUNG** (terverifikasi). Repo sudah terhubung ke GitHub
> (`rizzdev31/ramahanak.id`), SSH key sudah terpasang di server, dan alias `ssh ramahanak`
> sudah dibuat. Chat/Claude Code bisa eksekusi perintah di server secara passwordless.

---

## 0. Data Koneksi (TERKONFIRMASI)

| Item | Nilai |
|------|-------|
| **Host / IP** | `153.92.11.119` |
| **Port** | `65002` |
| **Username** | ✅ `u879614510` |
| **Home** | `/home/u879614510` · PHP `8.2.30` |
| **Path aplikasi di server** | `/home/u879614510/domains/ramahanak.ppmannursidoarjo.com/ramahanak.id/` |
| **Private key (lokal)** | `~/.ssh/ramahanak_deploy` |
| **Public key (lokal)** | `~/.ssh/ramahanak_deploy.pub` (sudah ada di `authorized_keys` server) |
| **Alias lokal** | `ssh ramahanak` (via `~/.ssh/config`) |

> ⚠️ **TEMUAN — bug path di [`deploy.yml`](../.github/workflows/deploy.yml):** script menunjuk
> `/home/u8796145510/...` (10 digit), padahal username/home asli `u879614510` (9 digit).
> Path ini **salah** dan perlu diperbaiki agar auto-deploy menjalankan `deploy.sh` yang benar:
> `/home/u879614510/domains/ramahanak.ppmannursidoarjo.com/ramahanak.id/deploy.sh`.

**Public key yang akan didaftarkan:**
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGQY3IzTlzO19d01fMj8v47g2padvEeSLZa7hG2JGg1N amc2k22yfr@gmail.com
```

> Key pair sudah ada di komputer, jadi **tidak perlu generate baru**. Cukup didaftarkan ke server.

---

## TAHAP 1 — Daftarkan Public Key di hPanel (sekali saja)

1. Login **hPanel Hostinger**.
2. Buka **Advanced → SSH Access**.
3. Di bagian **SSH Keys**, klik **Add/Import SSH Key** (atau **Manage SSH Keys**).
4. Tempel public key di atas (baris `ssh-ed25519 ...`), beri nama mis. `claude-code`, **Save**.
5. Pastikan **SSH Access = ON / Enabled** di halaman yang sama.
6. **Catat 3 hal** dari halaman SSH Access untuk konfirmasi:
   - **SSH Username** (yang benar: `u8796145510` atau `u879614510`)
   - **Host/IP** (harusnya `153.92.11.119`)
   - **Port** (harusnya `65002`)

> Alternatif tanpa hPanel (jika sudah bisa login dengan password):
> `ssh-copy-id -i ~/.ssh/ramahanak_deploy.pub -p 65002 <username>@153.92.11.119`

---

## TAHAP 2 — Tes Koneksi dari Chat

Setelah key terpasang, jalankan (ganti `<username>` dengan yang benar):

```bash
ssh -i ~/.ssh/ramahanak_deploy -p 65002 \
    -o BatchMode=yes -o StrictHostKeyChecking=accept-new -o ConnectTimeout=15 \
    <username>@153.92.11.119 'echo CONNECTED; whoami; pwd; php -v | head -1'
```

✅ Berhasil jika muncul `CONNECTED`, nama user, path home, dan versi PHP.
❌ Jika `Permission denied (publickey)` → key belum tersimpan / username salah → ulang Tahap 1.

---

## TAHAP 3 — Buat Alias `~/.ssh/config` (biar ringkas)

Agar cukup `ssh ramahanak`, tambahkan ke `~/.ssh/config`:

```
Host ramahanak
    HostName 153.92.11.119
    Port 65002
    User <username>
    IdentityFile ~/.ssh/ramahanak_deploy
    ServerAliveInterval 60
```

Setelah itu cukup:
```bash
ssh ramahanak 'cd ~/domains/ramahanak.ppmannursidoarjo.com/ramahanak.id && git log -1 --oneline'
```

---

## TAHAP 4 — Perintah Server yang Sering Dipakai (referensi)

Set variabel path dulu agar ringkas:
```bash
APP="~/domains/ramahanak.ppmannursidoarjo.com/ramahanak.id"

# Lihat status & versi yang live
ssh ramahanak "cd $APP && git log -1 --oneline && git status -s"

# Tarik update terbaru dari GitHub (manual, jika perlu)
ssh ramahanak "cd $APP && git pull origin main"

# Cek log error Laravel (50 baris terakhir)
ssh ramahanak "tail -n 50 $APP/storage/logs/laravel.log"

# Bersihkan & cache ulang konfigurasi
ssh ramahanak "cd $APP && php artisan optimize:clear && php artisan config:cache && php artisan route:cache"

# Jalankan migrasi (AMAN, tanpa hapus data)
ssh ramahanak "cd $APP && php artisan migrate --force"

# Backup database sebelum perubahan besar
ssh ramahanak "cd $APP && mysqldump -u <db_user> -p'<db_pass>' <db_name> > backup_\$(date +%F).sql"
```

> ⚠️ **JANGAN** `migrate:fresh` / `migrate:refresh` / `db:wipe` di server — akan menghapus
> data santri. Selalu backup dulu sebelum migrasi besar.

---

## Alur Kerja Setelah Terhubung

- **Perubahan kode** → tetap lewat alur PRD-01: edit lokal → commit → `git push origin main`
  → GitHub Actions auto-deploy. (SSH dipakai untuk **inspeksi & perbaikan**, bukan edit kode di server.)
- **Debug/perbaikan server** (cek log, clear cache, cek `.env`, migrasi, restart queue) →
  lakukan via `ssh ramahanak ...` langsung dari chat.

---

## Deploy dari Chat (dengan persetujuan)

✅ **Aktif & teruji.** Dua jalur deploy:

### Jalur A — Deploy via chat/SSH (UTAMA, andal)
Claude menjalankan `deploy.sh` di server lewat SSH. **Setiap deploy minta persetujuan Anda**
(prompt tool Bash) sebelum dieksekusi:
```bash
ssh ramahanak "bash /home/u879614510/domains/ramahanak.ppmannursidoarjo.com/ramahanak.id/deploy.sh"
```
`deploy.sh` di server (sudah diperbaiki, path benar) menjalankan:
`git pull origin main` → `composer install --no-dev` → `migrate --force` →
`config/route/view:cache` → `storage:link`.

> ⚠️ **Build frontend:** server **tidak punya Node/npm**. Jadi jika ada perubahan UI, jalankan
> `npm run build` di lokal lalu **commit `public/build`** sebelum deploy (`.gitignore` sudah
> mengizinkan `public/build`). `deploy.sh` tidak mem-build.

### Jalur B — Auto-deploy saat `git push` (GitHub Actions) ✅ AKTIF
`.github/workflows/deploy.yml` memicu deploy via SSH otomatis saat push ke `main`.
**Teruji sukses** (run `abadd23` → success, server auto-update). Konfigurasi final:
- Secrets: `HOST` = `153.92.11.119`, `USERNAME` = `u879614510`, `SSH_PASSWORD` = password SSH.
- **`port: 65002`** di workflow (WAJIB — tanpa ini action default ke port 22 → gagal).
- `script:` menunjuk `deploy.sh` dengan path `u879614510` yang benar.

> **Penyebab kegagalan sebelumnya:** (1) path `deploy.sh` salah di server, (2) tidak ada
> `port` di workflow (default 22, padahal Hostinger 65002). Keduanya sudah diperbaiki.

Cek hasil run kapan saja di tab **Actions** repo, atau via API:
`curl -s "https://api.github.com/repos/rizzdev31/ramahanak.id/actions/runs?per_page=1"`.

---

## Keamanan

- Private key `~/.ssh/ramahanak_deploy` **jangan** di-commit / dibagikan (sudah di luar repo).
- Jika key bocor → hapus entry-nya di hPanel SSH Keys, generate key baru, daftarkan ulang.
- `.env` server berisi `DB_PASSWORD` — jangan tampilkan/commit.

---

## Checklist

- [x] Public key terpasang di `authorized_keys` server.
- [x] SSH Access aktif.
- [x] Username dikonfirmasi: `u879614510`.
- [x] Tes koneksi → `CONNECTED` (PHP 8.2.30).
- [x] Alias `~/.ssh/config` dibuat (`ssh ramahanak`).
- [x] Tes perintah: `ssh ramahanak "... git log -1 --oneline"` → `969c02c fix: remove .env from git tracking`.
- [ ] **TODO:** perbaiki path di `deploy.yml` (`u8796145510` → `u879614510`).
