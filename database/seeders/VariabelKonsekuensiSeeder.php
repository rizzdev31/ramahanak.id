<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * VariabelKonsekuensiSeeder
 *
 * Menyeed 10 variabel konsekuensi (K001–K010) sesuai dokumen:
 * "Isi_Semua_Variable.docx"
 *
 * ════════════════════════════════════════════════════════════
 * STRUKTUR TABEL variabel_konsekuensi
 * ════════════════════════════════════════════════════════════
 *
 * id           — auto increment
 * kode         — K001..K010 (unique, max 10 char)
 * konsekuensi  — nama konsekuensi (max 200 char)
 * poin         — THRESHOLD poin pelanggaran (integer, indexed)
 * rekomendasi  — panduan tindakan BK (text)
 * is_active    — boolean, default true
 * created_at, updated_at
 *
 * ════════════════════════════════════════════════════════════
 * MEKANISME THRESHOLD DALAM SISTEM
 * ════════════════════════════════════════════════════════════
 *
 * ExpertSystemPointService::checkThreshold($santriId):
 *   1. Hitung total_poin_pelanggaran dari riwayat_santri
 *   2. Panggil SantriExpertSystemTracking::getNewKonsekuensi()
 *      → Query: WHERE poin <= total_poin AND is_active = true
 *      → Exclude kode yang sudah ada di konsekuensi_diberikan[]
 *   3. Tiap K baru → LaporanExpertSystemPoint.create()
 *      (field yg diisi: kode, konsekuensi, poin, rekomendasi)
 *
 * PERILAKU PENTING: jika santri melompat threshold (misal P009=200p),
 * SEMUA K yang thresholdnya ≤ 200 akan trigger sekaligus.
 * Ini berarti rekomendasi tiap K harus SPESIFIK sesuai levelnya,
 * bukan hanya mengulang yang sebelumnya.
 *
 * ════════════════════════════════════════════════════════════
 * THRESHOLD DARI DOKUMEN (FIXED — TIDAK DIUBAH)
 * ════════════════════════════════════════════════════════════
 *
 *  K001:  10p  (+10)  Bimbingan 1 — Sanksi Ringan
 *  K002:  30p  (+20)  Bimbingan 2 — Sanksi Ringan
 *  K003:  50p  (+20)  Bimbingan 3 — Sanksi Ringan
 *  K004:  70p  (+20)  Surat Pernyataan 1 — Teguran Keras
 *  K005:  90p  (+20)  Bimbingan 4 — Sanksi Sedang
 *  K006: 110p  (+20)  Surat Pernyataan 2 — Ancaman Skorsing
 *  K007: 130p  (+20)  Bimbingan 5 — Sanksi Berat
 *  K008: 160p  (+30)  Bimbingan 6 — Sanksi Berat
 *  K009: 190p  (+30)  Skorsing
 *  K010: 200p  (+10)  Surat Pernyataan 3 — Drop Out
 *
 * Interval konsisten 20p (K002-K007), membesar di K008-K010
 * menandakan eskalasi cepat di zona kritis.
 *
 * ════════════════════════════════════════════════════════════
 * KONTEKS POIN PELANGGARAN (untuk memahami threshold)
 * ════════════════════════════════════════════════════════════
 *
 * Ringan (2p): P002,P003,P004,P005,P006,P007,P013,P014
 * Sedang (5p): P001 (perundungan fisik)
 * Sedang (10p): P010 (kabur), P012 (senjata tajam)
 * Berat  (20p): P008 (rokok), P011 (pacaran)
 * Fatal (200p): P009 (napza) → trigger K001-K010 sekaligus
 *
 * ════════════════════════════════════════════════════════════
 * STRATEGI REKOMENDASI (untuk field 'rekomendasi')
 * ════════════════════════════════════════════════════════════
 *
 * Rekomendasi diisi ke LaporanExpertSystemPoint.rekomendasi
 * dan ditampilkan ke BK sebagai panduan tindakan.
 * Prinsip:
 * - SPESIFIK dan ACTIONABLE (apa yang harus dilakukan BK)
 * - Eskalasi bertahap sesuai tingkat keparahan
 * - Sesuai konteks pesantren Islam
 * - Melibatkan pihak yang tepat di tiap level
 *
 * ════════════════════════════════════════════════════════════
 * STRATEGI SEEDER: TRUNCATE + INSERT
 * ════════════════════════════════════════════════════════════
 *
 * Karena threshold berubah drastis dari seeder lama
 * (6 level, threshold berbeda), gunakan updateOrInsert
 * agar aman dijalankan ulang tanpa duplikasi.
 */
class VariabelKonsekuensiSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('');
        $this->command->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        $this->command->info('  SEEDER: Variabel Konsekuensi K001–K010');
        $this->command->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        $this->command->info('');
        $this->command->warn('  ⚠ Perhatian: Threshold berubah dari seeder lama.');
        $this->command->warn('    Jika ada santri dengan konsekuensi_diberikan sudah');
        $this->command->warn('    tercatat di santri_expert_system_tracking,');
        $this->command->warn('    threshold lama masih berlaku untuk data historis.');
        $this->command->info('');

        $data = $this->getData();

        $inserted = 0;
        $updated  = 0;

        foreach ($data as $item) {
            $exists = DB::table('variabel_konsekuensi')
                ->where('kode', $item['kode'])
                ->exists();

            DB::table('variabel_konsekuensi')->updateOrInsert(
                ['kode' => $item['kode']],
                array_merge($item, [
                    'updated_at' => now(),
                    'created_at' => $exists ? DB::raw('created_at') : now(),
                ])
            );

            $status = $exists ? '✎  Updated ' : '✚  Inserted';
            $this->command->line(
                "  {$status}  {$item['kode']} — {$item['konsekuensi']} " .
                "[ threshold: {$item['poin']} poin ]"
            );

            if ($exists) $updated++;
            else $inserted++;
        }

        $this->command->info('');
        $this->command->info("  ✅ Selesai: {$inserted} inserted, {$updated} updated");
        $this->command->info('');
        $this->command->info('  Ringkasan Threshold:');
        foreach ($data as $item) {
            $bar = str_repeat('█', (int) round($item['poin'] / 10));
            $this->command->line(
                sprintf("    %s: %3dp  %s", $item['kode'], $item['poin'], $bar)
            );
        }
        $this->command->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }

    // ──────────────────────────────────────────────────────────
    // DATA
    // ──────────────────────────────────────────────────────────

    private function getData(): array
    {
        return [

            // ══════════════════════════════════════════════════════
            // K001 — Bimbingan 1 Dan Pemberian Sanksi Ringan
            // Threshold: 10 poin
            //
            // Konteks trigger:
            //   • 1x kabur (P010=10p) → langsung K001
            //   • 2x perundungan fisik (P001=5p×2) → K001
            //   • 5x pelanggaran ringan (2p×5) → K001
            //
            // Ini adalah PERINGATAN PERTAMA — intervensi dini.
            // Tujuan: menghentikan pola sebelum eskalasi.
            // ══════════════════════════════════════════════════════
            [
                'kode'        => 'K001',
                'konsekuensi' => 'Bimbingan 1 Dan Pemberian Sanksi Ringan',
                'poin'        => 10,
                'is_active'   => true,
                'rekomendasi' =>
                    'LANGKAH TINDAK LANJUT GURU BK — K001 (Bimbingan 1, Sanksi Ringan):' . "\n\n" .
                    '1. PANGGIL SANTRI: Undang santri ke ruang BK dalam 1×24 jam sejak laporan muncul. Sampaikan dengan pendekatan empatik, bukan konfrontatif.' . "\n" .
                    '2. SESI BIMBINGAN INDIVIDUAL: Lakukan sesi 30–45 menit. Gali latar belakang pelanggaran, dengarkan perspektif santri, identifikasi faktor pemicu.' . "\n" .
                    '3. SANKSI RINGAN: Berikan sanksi edukatif sesuai jenis pelanggaran (contoh: menulis refleksi 1 halaman, piket tambahan, hafalan doa tertentu).' . "\n" .
                    '4. KOMITMEN TERTULIS: Minta santri menandatangani surat komitmen perbaikan singkat yang disaksikan BK.' . "\n" .
                    '5. INFORMASI KE WALI KELAS: Beritahu wali kelas/asrama secara informal agar ikut memantau.' . "\n" .
                    '6. FOLLOW-UP: Pantau perkembangan santri selama 2 minggu ke depan. Catat dalam buku pembinaan.',
            ],

            // ══════════════════════════════════════════════════════
            // K002 — Bimbingan 2 Dan Pemberian Sanksi Ringan
            // Threshold: 30 poin
            //
            // Konteks trigger:
            //   • 1x rokok (P008=20p) + 1x kabur (P010=10p) → K002
            //   • 1x rokok + 5× pelanggaran ringan → K002
            //   • Akumulasi pelanggaran ringan berkelanjutan (15× 2p)
            //
            // Santri sudah dapat K001 sebelumnya tapi masih berlanjut.
            // Peringatan kedua — intervensi lebih serius.
            // ══════════════════════════════════════════════════════
            [
                'kode'        => 'K002',
                'konsekuensi' => 'Bimbingan 2 Dan Pemberian Sanksi Ringan',
                'poin'        => 30,
                'is_active'   => true,
                'rekomendasi' =>
                    'LANGKAH TINDAK LANJUT GURU BK — K002 (Bimbingan 2, Sanksi Ringan):' . "\n\n" .
                    '1. EVALUASI K001: Review apakah komitmen dari bimbingan pertama (K001) dijalankan. Identifikasi mengapa pelanggaran masih berlanjut.' . "\n" .
                    '2. SESI BIMBINGAN MENDALAM: Sesi 45–60 menit. Eksplorasi lebih dalam faktor sosial/keluarga/psikologis yang mendasari pola pelanggaran.' . "\n" .
                    '3. SANKSI RINGAN TERTULIS: Berikan sanksi yang sedikit lebih signifikan (contoh: tugas refleksi 2 halaman, kerja bakti, membacakan tata tertib di depan teman sekelas).' . "\n" .
                    '4. LIBATKAN WALI KELAS/ASRAMA: Lakukan koordinasi resmi dengan wali kelas dan wali asrama. Sampaikan perkembangan kasus dan minta bantuan pemantauan.' . "\n" .
                    '5. KONTRAK PERILAKU: Buat kontrak perilaku formal 2 minggu dengan target harian yang terukur dan ditandatangani santri + BK.' . "\n" .
                    '6. NOTIFIKASI ORANG TUA (informal): Hubungi orang tua via telepon, sampaikan perkembangan situasi tanpa menghakimi, minta dukungan dari rumah.' . "\n" .
                    '7. MONITORING KETAT: Pantau progres setiap 3 hari. Catat dan dokumentasikan setiap perubahan perilaku.',
            ],

            // ══════════════════════════════════════════════════════
            // K003 — Bimbingan 3 Dan Pemberian Sanksi Ringan
            // Threshold: 50 poin
            //
            // Konteks trigger:
            //   • 2x rokok (20+20=40p) + beberapa pelanggaran ringan
            //   • 1x pacaran (20p) + 1x kabur (10p) + beberapa ringan
            //   • Akumulasi konsisten pelanggaran sedang-ringan
            //
            // Sudah bimbingan 2 kali tanpa perubahan signifikan.
            // Eskalasi ke tahap SURAT PERNYATAAN segera (K004 di 70p).
            // ══════════════════════════════════════════════════════
            [
                'kode'        => 'K003',
                'konsekuensi' => 'Bimbingan 3 Dan Pemberian Sanksi Ringan',
                'poin'        => 50,
                'is_active'   => true,
                'rekomendasi' =>
                    'LANGKAH TINDAK LANJUT GURU BK — K003 (Bimbingan 3, Sanksi Ringan):' . "\n\n" .
                    '1. ASESMEN KOMPREHENSIF: Lakukan asesmen mendalam terhadap kondisi psikologis, sosial, dan keluarga santri. Gunakan instrumen sederhana (checklist observasi BK).' . "\n" .
                    '2. SESI BIMBINGAN INTENSIF: Sesi 60 menit. Fokus pada akar masalah — apakah ada tekanan teman sebaya, masalah keluarga, gangguan psikologis, atau kurang motivasi.' . "\n" .
                    '3. SANKSI EDUKASI: Berikan sanksi yang lebih bermakna (contoh: membuat makalah tentang dampak pelanggaran, presentasi di depan kelas, menjadi petugas kebersihan selama 1 minggu).' . "\n" .
                    '4. RAPAT KOORDINASI: Adakan rapat mini dengan wali kelas, wali asrama, dan kepala pembinaan santri untuk membahas strategi bersama.' . "\n" .
                    '5. PANGGIL ORANG TUA (RESMI): Undang orang tua/wali ke pondok secara resmi. Sampaikan rekap pelanggaran dan rencana perbaikan. Minta komitmen orang tua.' . "\n" .
                    '6. PERINGATAN ESKALASI: Sampaikan kepada santri dan orang tua bahwa jika poin terus bertambah, konsekuensi berikutnya adalah Surat Pernyataan resmi (K004).' . "\n" .
                    '7. MONITORING HARIAN: Wali asrama wajib lapor setiap hari tentang perilaku santri selama 2 minggu.',
            ],

            // ══════════════════════════════════════════════════════
            // K004 — Surat Pernyataan 1 dan Pemberian Teguran Keras
            // Threshold: 70 poin
            //
            // Konteks trigger:
            //   • Akumulasi pelanggaran sedang-berat berkepanjangan
            //   • 3x rokok (60p) + beberapa ringan → K004
            //   • 1x pacaran + 1x kabur + beberapa rokok/kekerasan
            //
            // TITIK KRITIS: Pertama kali dokumen formal dikeluarkan.
            // Surat Pernyataan adalah dokumen hukum pondok.
            // ══════════════════════════════════════════════════════
            [
                'kode'        => 'K004',
                'konsekuensi' => 'Surat Pernyataan 1 Dan Pemberian Teguran Keras',
                'poin'        => 70,
                'is_active'   => true,
                'rekomendasi' =>
                    'LANGKAH TINDAK LANJUT GURU BK — K004 (Surat Pernyataan 1, Teguran Keras):' . "\n\n" .
                    '1. SUSUN SURAT PERNYATAAN 1: Buat dokumen Surat Pernyataan resmi yang memuat: rekap pelanggaran, total poin, komitmen perbaikan konkret, konsekuensi jika melanggar lagi (skorsing). Ditandatangani santri, orang tua, dan Kepala Pondok/Wadir.' . "\n" .
                    '2. PERTEMUAN RESMI TRIPARTIT: Adakan pertemuan formal antara BK, orang tua, dan santri. Sampaikan rekap lengkap pelanggaran. Bacakan isi surat pernyataan bersama.' . "\n" .
                    '3. TEGURAN KERAS: Sampaikan teguran keras secara langsung dan tegas (bukan kasar) kepada santri di hadapan orang tua. Gunakan bahasa yang jelas tentang konsekuensi jika berlanjut.' . "\n" .
                    '4. PROGRAM PEMBINAAN KHUSUS: Masukkan santri ke program pembinaan intensif (kajian tambahan, pendampingan ustadz/pembina khusus, kegiatan positif terstruktur).' . "\n" .
                    '5. CABUT HAK TERTENTU: Pertimbangkan mencabut sementara hak/privilege tertentu (izin pulang, kegiatan ekskul, akses tertentu) sesuai peraturan pondok.' . "\n" .
                    '6. ARSIPKAN DOKUMEN: Simpan salinan surat pernyataan di file santri BK, berikan salinan ke orang tua dan kepala pondok.' . "\n" .
                    '7. EVALUASI BULANAN: Jadwalkan evaluasi formal setiap bulan selama 3 bulan ke depan.',
            ],

            // ══════════════════════════════════════════════════════
            // K005 — Bimbingan 4 Dan Pemberian Sanksi Sedang
            // Threshold: 90 poin
            //
            // Konteks trigger:
            //   • Setelah Surat Pernyataan 1 (K004) tapi masih berlanjut
            //   • Akumulasi pelanggaran berat + sedang terus bertambah
            //
            // Santri telah menandatangani surat pernyataan tapi
            // masih melanggar. Ini sinyal serius — sanksi meningkat
            // ke level SEDANG.
            // ══════════════════════════════════════════════════════
            [
                'kode'        => 'K005',
                'konsekuensi' => 'Bimbingan 4 Dan Pemberian Sanksi Sedang',
                'poin'        => 90,
                'is_active'   => true,
                'rekomendasi' =>
                    'LANGKAH TINDAK LANJUT GURU BK — K005 (Bimbingan 4, Sanksi Sedang):' . "\n\n" .
                    '1. EVALUASI SURAT PERNYATAAN 1: Tinjau apakah komitmen dalam Surat Pernyataan 1 (K004) dilanggar. Dokumentasikan pelanggaran komitmen sebagai dasar eskalasi.' . "\n" .
                    '2. SESI BIMBINGAN KRISIS: Lakukan sesi bimbingan mendalam 60–90 menit dengan fokus intervensi krisis. Pertimbangkan apakah ada gangguan psikologis (depresi, kecanduan, trauma) yang perlu penanganan khusus.' . "\n" .
                    '3. SANKSI SEDANG: Terapkan sanksi yang signifikan secara pendidikan (contoh: isolasi kegiatan sosial selama 1 minggu, tugas pelayanan komunitas, mengganti kerugian jika ada, pemanggilan khusus ke kepala pondok).' . "\n" .
                    '4. KONSELING PSIKOLOGIS: Jika tersedia, rujuk santri ke konselor psikologis atau ustadz pembina senior untuk pendampingan spiritual-psikologis intensif.' . "\n" .
                    '5. PANTAU 24 JAM: Koordinasikan dengan wali asrama untuk pemantauan 24 jam selama 2 minggu. Buat laporan harian.' . "\n" .
                    '6. PERSIAPAN SURAT PERNYATAAN 2: Sampaikan kepada santri dan orang tua bahwa Surat Pernyataan 2 (K006) dengan ancaman skorsing sudah menunggu jika poin terus bertambah.' . "\n" .
                    '7. KONSULTASI PIMPINAN: Laporkan kasus ini ke pimpinan pondok/direktur untuk mendapat arahan dan dukungan penanganan.',
            ],

            // ══════════════════════════════════════════════════════
            // K006 — Surat Pernyataan 2 dan Pemberian Ancaman Skorsing
            // Threshold: 110 poin
            //
            // Konteks trigger:
            //   • Pelanggaran masih berlanjut pasca Surat Pernyataan 1
            //   • Akumulasi poin berat dan berat
            //
            // TITIK KRITIS KEDUA: Dokumen formal kedua dengan
            // ancaman nyata skorsing. Orang tua wajib hadir.
            // ══════════════════════════════════════════════════════
            [
                'kode'        => 'K006',
                'konsekuensi' => 'Surat Pernyataan 2 Dan Pemberian Ancaman Skorsing',
                'poin'        => 110,
                'is_active'   => true,
                'rekomendasi' =>
                    'LANGKAH TINDAK LANJUT GURU BK — K006 (Surat Pernyataan 2, Ancaman Skorsing):' . "\n\n" .
                    '1. SUSUN SURAT PERNYATAAN 2: Buat Surat Pernyataan 2 yang lebih tegas, memuat: rekap seluruh pelanggaran sejak masuk, total poin akumulatif, pernyataan bahwa SKORSING akan dijatuhkan jika ada pelanggaran berikutnya. Ditandatangani semua pihak termasuk kepala pondok.' . "\n" .
                    '2. SIDANG KASUS: Adakan sidang kasus formal dengan mengundang: santri, kedua orang tua, wali kelas, wali asrama, BK, dan perwakilan pimpinan pondok.' . "\n" .
                    '3. ANCAMAN SKORSING KONKRET: Sampaikan secara eksplisit bahwa skorsing SUDAH DISIAPKAN dan akan dilaksanakan jika poin bertambah. Tunjukkan dokumen persiapan skorsing.' . "\n" .
                    '4. PERJANJIAN TRIPARTIT: Buat perjanjian tertulis antara pondok, orang tua, dan santri tentang target perilaku yang harus dicapai dalam 1 bulan ke depan.' . "\n" .
                    '5. PEMBATASAN KEGIATAN: Terapkan pembatasan kegiatan yang signifikan (tidak boleh keluar area tertentu, diawasi ketat, tidak diizinkan pulang sampai ada perbaikan).' . "\n" .
                    '6. RUJUKAN PROFESIONAL: Wajibkan santri mengikuti sesi konseling dengan psikolog/konselor profesional jika tersedia, atau dengan pembina senior pondok.' . "\n" .
                    '7. LAPORAN MINGGUAN: BK wajib membuat laporan tertulis mingguan perkembangan santri kepada pimpinan pondok dan orang tua.',
            ],

            // ══════════════════════════════════════════════════════
            // K007 — Bimbingan 5 Dan Pemberian Sanksi Berat
            // Threshold: 130 poin
            //
            // Konteks trigger:
            //   • Pasca Surat Pernyataan 2, pelanggaran masih berlanjut
            //   • Zona BERAT — eskalasi cepat menuju skorsing nyata
            //
            // Santri telah melewati 2 surat pernyataan.
            // Sanksi sudah di level BERAT. Skorsing hampir pasti.
            // ══════════════════════════════════════════════════════
            [
                'kode'        => 'K007',
                'konsekuensi' => 'Bimbingan 5 Dan Pemberian Sanksi Berat',
                'poin'        => 130,
                'is_active'   => true,
                'rekomendasi' =>
                    'LANGKAH TINDAK LANJUT GURU BK — K007 (Bimbingan 5, Sanksi Berat):' . "\n\n" .
                    '1. INTERVENSI KRISIS MENDESAK: Santri kini berada di zona kritis. Lakukan sesi bimbingan darurat. Asesmen risiko: apakah ada ancaman terhadap diri sendiri atau orang lain.' . "\n" .
                    '2. SANKSI BERAT SEGERA: Terapkan sanksi berat yang langsung (contoh: isolasi sosial penuh selama 2 minggu, penugasan di bagian kebersihan pondok, dicabut semua hak privilege, wajib melapor ke BK setiap hari).' . "\n" .
                    '3. HADIRKAN ORANG TUA SEGERA: Hubungi orang tua dan minta hadir dalam 48 jam. Jika tidak bisa hadir, lakukan video call resmi dengan pimpinan pondok.' . "\n" .
                    '4. PERSIAPAN SKORSING: Mulai siapkan dokumen administrasi skorsing. Konsultasikan prosedur skorsing dengan pimpinan pondok dan bagian administrasi.' . "\n" .
                    '5. PROGRAM PEMBINAAN DARURAT: Masukkan santri ke program pembinaan intensif harian (kajian khusus, tugas-tugas pembinaan, pendampingan ustadz senior secara individual).' . "\n" .
                    '6. REKAM SEMUA INTERAKSI: Dokumentasikan seluruh interaksi, komitmen, dan pelanggaran dengan detail untuk keperluan proses administratif selanjutnya.' . "\n" .
                    '7. NOTIFIKASI PIMPINAN: Laporkan status kasus secara lengkap kepada pimpinan pondok dengan rekomendasi tertulis dari BK.',
            ],

            // ══════════════════════════════════════════════════════
            // K008 — Bimbingan 6 Dan Pemberian Sanksi Berat
            // Threshold: 160 poin
            //
            // Konteks trigger:
            //   • Eskalasi lanjutan dari K007
            //   • Santri telah melewati semua tahap bimbingan awal
            //
            // BIMBINGAN TERAKHIR sebelum skorsing nyata (K009).
            // Kesempatan terakhir untuk intervensi intensif.
            // ══════════════════════════════════════════════════════
            [
                'kode'        => 'K008',
                'konsekuensi' => 'Bimbingan 6 Dan Pemberian Sanksi Berat',
                'poin'        => 160,
                'is_active'   => true,
                'rekomendasi' =>
                    'LANGKAH TINDAK LANJUT GURU BK — K008 (Bimbingan 6 — TERAKHIR, Sanksi Berat):' . "\n\n" .
                    '1. BIMBINGAN AKHIR SEBELUM SKORSING: Ini adalah bimbingan ke-6 dan TERAKHIR sebelum skorsing. Sampaikan dengan tegas bahwa ini kesempatan terakhir. Lakukan sesi mendalam 90 menit.' . "\n" .
                    '2. TAWARAN PILIHAN: Berikan santri dua pilihan yang jelas: (a) Berkomitmen total dengan program rehabilitasi intensif pondok, atau (b) Skorsing akan dilaksanakan. Berikan waktu 24 jam untuk memutuskan.' . "\n" .
                    '3. SANKSI BERAT MAKSIMAL: Terapkan sanksi berat terberat sebelum skorsing (contoh: isolasi total dari kegiatan ekstrakurikuler, dibatasi hanya di area kamar-kelas-masjid, wajib lapor 3x sehari, tugas mengajar adik kelas sebagai tanggung jawab).' . "\n" .
                    '4. RAPAT PLENO KASUS: Adakan rapat pleno dengan seluruh pihak (BK, wali kelas, wali asrama, pimpinan pondok, orang tua). Putuskan bersama langkah terbaik.' . "\n" .
                    '5. DOKUMEN LENGKAP: Pastikan semua dokumen (surat pernyataan 1 & 2, rekap pelanggaran, laporan bimbingan 1–5) telah lengkap dan terarsip dengan baik sebelum proses skorsing.' . "\n" .
                    '6. DUKUNGAN ORANG TUA INTENSIF: Orang tua/wali wajib hadir dan tinggal di pondok selama proses ini berlangsung jika memungkinkan.' . "\n" .
                    '7. PERSIAPAN PSIKOLOGIS SANTRI: Pastikan kondisi psikologis santri stabil sebelum proses skorsing agar tidak memicu krisis.',
            ],

            // ══════════════════════════════════════════════════════
            // K009 — Skorsing
            // Threshold: 190 poin
            //
            // Konteks trigger:
            //   • Semua tahap bimbingan 1–6 telah dilalui tanpa
            //     perubahan signifikan
            //   • Poin terus bertambah hingga 190
            //
            // SKORSING NYATA — santri dipulangkan sementara.
            // Proses administratif resmi harus dijalankan.
            // ══════════════════════════════════════════════════════
            [
                'kode'        => 'K009',
                'konsekuensi' => 'Skorsing',
                'poin'        => 190,
                'is_active'   => true,
                'rekomendasi' =>
                    'LANGKAH TINDAK LANJUT GURU BK — K009 (SKORSING):' . "\n\n" .
                    '1. PROSES SKORSING RESMI: Terbitkan Surat Keputusan Skorsing resmi yang ditandatangani Kepala Pondok/Direktur. Serahkan kepada santri dan orang tua secara langsung.' . "\n" .
                    '2. DURASI & SYARAT SKORSING: Tentukan durasi skorsing (biasanya 3–14 hari) dan syarat untuk kembali (orang tua menemani, ada surat pernyataan baru, laporan psikolog). Dokumentasikan dalam SK Skorsing.' . "\n" .
                    '3. PENDAMPINGAN ORANG TUA: Orang tua/wali WAJIB hadir untuk menjemput dan mendampingi santri selama skorsing. Berikan panduan tertulis kepada orang tua tentang yang perlu dilakukan selama skorsing di rumah.' . "\n" .
                    '4. PROGRAM SELAMA SKORSING: Berikan santri tugas pembinaan di rumah (membuat jurnal refleksi harian, membaca buku tertentu, tugas ibadah terdokumentasi) yang wajib dikumpulkan saat kembali.' . "\n" .
                    '5. KONDISI KEMBALI: Tetapkan dengan jelas kondisi yang harus dipenuhi agar santri boleh kembali: kehadiran orang tua, penandatanganan Surat Pernyataan 3, laporan dokter/psikolog jika ada indikasi gangguan.' . "\n" .
                    '6. KOORDINASI INTERNAL: Beritahu seluruh tenaga pendidik dan staf tentang status skorsing santri untuk mencegah santri masuk tanpa izin.' . "\n" .
                    '7. MONITORING SELAMA SKORSING: Hubungi orang tua minimal 2 hari sekali untuk memantau kondisi santri di rumah. Catat perkembangan.' . "\n" .
                    '8. PERSIAPAN REINTEGRASI: Siapkan program reintegrasi (bimbingan pertama saat kembali, pendampingan teman sebaya positif, pemantauan ketat 1 bulan pertama setelah skorsing).',
            ],

            // ══════════════════════════════════════════════════════
            // K010 — Surat Pernyataan 3 Dan Drop Out
            // Threshold: 200 poin
            //
            // Konteks trigger:
            //   • Setelah skorsing tapi masih melanggar (poin terus naik)
            //   • P009 (napza=200p) langsung trigger K001–K010 semua
            //
            // KONSEKUENSI TERTINGGI — ancaman Drop Out.
            // Keputusan melibatkan seluruh pimpinan pondok.
            // ══════════════════════════════════════════════════════
            [
                'kode'        => 'K010',
                'konsekuensi' => 'Surat Pernyataan 3 Dan Drop Out',
                'poin'        => 200,
                'is_active'   => true,
                'rekomendasi' =>
                    'LANGKAH TINDAK LANJUT GURU BK — K010 (Surat Pernyataan 3, DROP OUT):' . "\n\n" .
                    '1. RAPAT PLENO PIMPINAN: Segera adakan rapat pleno darurat dengan seluruh pimpinan pondok (Kepala Pondok, Direktur, Wadir, BK, Kepala Pendidikan). Keputusan Drop Out adalah keputusan kolektif, BUKAN individual BK.' . "\n" .
                    '2. SUSUN SURAT PERNYATAAN 3: Buat dokumen Surat Pernyataan 3 yang mencantumkan: seluruh rekap pelanggaran sejak awal, status Drop Out, opsi banding dalam 7 hari, serta dampak administratif (nilai, ijazah parsial, dll). Ditandatangani Kepala Pondok.' . "\n" .
                    '3. PERTEMUAN FORMAL ORANG TUA: Undang orang tua secara resmi (bukan telepon). Sampaikan keputusan dengan empat mata terlebih dahulu sebelum disampaikan ke santri. Berikan penjelasan lengkap dan empatis.' . "\n" .
                    '4. HAK BANDING: Berikan informasi tentang hak banding santri/orang tua. Tentukan mekanisme banding yang adil dan transparan sesuai aturan pondok.' . "\n" .
                    '5. PERTIMBANGAN KHUSUS: Jika trigger K010 karena P009 (napza) yang langsung 200 poin, pertimbangkan apakah prosedur Drop Out langsung atau ada tahap rehabilitasi terlebih dahulu. Konsultasikan dengan ahli atau instansi terkait.' . "\n" .
                    '6. DUKUNGAN PSIKOLOGIS: Pastikan kondisi psikologis santri terjaga selama proses ini. BK tetap mendampingi secara manusiawi meski keputusan sudah diambil.' . "\n" .
                    '7. DOKUMENTASI LENGKAP: Arsipkan seluruh dokumentasi kasus secara lengkap dan rapi untuk keperluan administratif dan jika ada proses hukum.' . "\n" .
                    '8. PROGRAM TRANSISI: Jika Drop Out dilaksanakan, bantu santri dan orang tua merencanakan langkah selanjutnya (sekolah lain, kursus, rehabilitasi) agar masa depan santri tetap terjaga.',
            ],

        ];
    }
}