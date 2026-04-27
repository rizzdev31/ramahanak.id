<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * VariabelRewardSeeder
 *
 * Menyeed 5 variabel reward (R001–R005) sesuai dokumen:
 * "Isi_Semua_Variable.docx"
 *
 * ════════════════════════════════════════════════════════════
 * STRUKTUR TABEL variabel_reward
 * ════════════════════════════════════════════════════════════
 *
 * id           — auto increment
 * kode         — R001..R005 (unique, max 10 char)
 * reward       — nama reward lengkap (max 250 char)
 * poin         — THRESHOLD poin apresiasi (integer, indexed)
 * rekomendasi  — panduan BK memberikan reward (text)
 * is_active    — boolean, default true
 * created_at, updated_at
 *
 * ════════════════════════════════════════════════════════════
 * MEKANISME THRESHOLD DALAM SISTEM
 * ════════════════════════════════════════════════════════════
 *
 * ExpertSystemPointService::checkThreshold($santriId):
 *   1. Hitung total_poin_APRESIASI dari riwayat_santri
 *      (berbeda dari konsekuensi yang pakai poin PELANGGARAN)
 *   2. SantriExpertSystemTracking::getNewReward()
 *      → Query: WHERE poin <= total_poin_apresiasi AND is_active = true
 *      → Exclude kode yang sudah ada di reward_diberikan[]
 *   3. Tiap R baru → LaporanExpertSystemPoint.create() dengan jenis='reward'
 *      (field: kode, reward→konsekuensi_atau_reward, poin, rekomendasi)
 *
 * ════════════════════════════════════════════════════════════
 * SUMBER POIN APRESIASI
 * ════════════════════════════════════════════════════════════
 *
 * A001 (Tindakan/Perilaku)  = 2 poin per kejadian
 * A002 (Prestasi)           = 10 poin per kejadian
 * A003 (Linguistik/Ucapan)  = 2 poin per kejadian
 *
 * Konteks pencapaian tiap threshold:
 *  R001 (30p): 3× prestasi (A002) ATAU 15× perilaku (A001) ATAU kombinasi
 *  R002 (60p): 6× prestasi ATAU 30× perilaku ATAU kombinasi (+30 dari R001)
 *  R003 (90p): 9× prestasi ATAU 45× perilaku ATAU kombinasi (+30 dari R002)
 *  R004 (130p): ~13× prestasi (tidak bulat = pasti kombinasi A001+A002+A003)
 *  R005 (150p): ~15× prestasi ATAU santri yang sangat konsisten (+20 dari R004)
 *
 * ════════════════════════════════════════════════════════════
 * THRESHOLD DARI DOKUMEN (FIXED — SESUAI DOKUMEN)
 * ════════════════════════════════════════════════════════════
 *
 *  R001:  30p (+30) — Voucher An Nur Corner 5.000 + Apresiasi
 *  R002:  60p (+30) — Voucher An Nur Corner 5.000 + Apresiasi
 *  R003:  90p (+30) — Voucher An Nur Cafe 10.000 + Apresiasi
 *  R004: 130p (+40) — Piagam + Voucher An Nur Cafe 10.000 + Apresiasi
 *  R005: 150p (+20) — Piagam + Voucher An Nur Cafe 20.000 + Apresiasi
 *
 * Pola eskalasi reward (analisis):
 *  Interval konsisten 30p (R001-R003), lompat ke 40p (R003→R004),
 *  kemudian mengecil ke 20p (R004→R005) menandakan "puncak" di R005
 *  lebih cepat dicapai sebagai motivasi akhir.
 *
 * ════════════════════════════════════════════════════════════
 * FILOSOFI REWARD vs KONSEKUENSI
 * ════════════════════════════════════════════════════════════
 *
 * KONSEKUENSI: Rekomendasi = tindakan DISIPLIN/PEMBINAAN BK
 *   → Tone: tegas, terstruktur, eskalasi
 *
 * REWARD: Rekomendasi = cara BK MEMBERIKAN PENGHARGAAN yang bermakna
 *   → Tone: hangat, apresiatif, memotivasi, merayakan
 *   → Tujuan: memperkuat perilaku positif santri secara berkelanjutan
 *   → Konteks: spesifik ke Pondok Pesantren Muhammadiyah An Nur Sidoarjo
 *      ('An Nur Corner' dan 'An Nur Cafe' adalah fasilitas internal pondok)
 *
 * ════════════════════════════════════════════════════════════
 * STRATEGI REKOMENDASI REWARD
 * ════════════════════════════════════════════════════════════
 *
 * Setiap rekomendasi reward mencakup:
 * 1. VALIDASI POIN — BK memverifikasi pencapaian sebelum memberikan reward
 * 2. MOMEN PEMBERIAN — kapan dan bagaimana reward diserahkan
 * 3. APRESIASI VERBAL — kata-kata penguatan yang bermakna
 * 4. DOKUMENTASI — untuk arsip prestasi dan rekam medis BK
 * 5. MOTIVASI LANJUTAN — dorong santri untuk terus berprestasi
 * 6. PELIBATAN ORANG TUA — kabarkan pencapaian ke keluarga
 */
class VariabelRewardSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('');
        $this->command->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        $this->command->info('  SEEDER: Variabel Reward R001–R005');
        $this->command->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        $this->command->info('');
        $this->command->info('  Sumber poin: total_poin_APRESIASI dari riwayat_santri');
        $this->command->info('  A001=2p, A002=10p, A003=2p per kejadian');
        $this->command->info('');

        $data = $this->getData();

        $inserted = 0;
        $updated  = 0;

        foreach ($data as $item) {
            $exists = DB::table('variabel_reward')
                ->where('kode', $item['kode'])
                ->exists();

            DB::table('variabel_reward')->updateOrInsert(
                ['kode' => $item['kode']],
                array_merge($item, [
                    'updated_at' => now(),
                    'created_at' => $exists ? DB::raw('created_at') : now(),
                ])
            );

            $status = $exists ? '✎  Updated ' : '✚  Inserted';
            $this->command->line(
                "  {$status}  {$item['kode']} — {$item['reward']}" .
                " [ threshold: {$item['poin']} poin apresiasi ]"
            );

            if ($exists) $updated++;
            else $inserted++;
        }

        $this->command->info('');
        $this->command->info("  ✅ Selesai: {$inserted} inserted, {$updated} updated");
        $this->command->info('');
        $this->command->info('  Tangga Reward (poin apresiasi):');
        foreach ($data as $item) {
            $star = str_repeat('⭐', (int) round($item['poin'] / 30));
            $this->command->line(
                sprintf("    %s: %3dp  %s", $item['kode'], $item['poin'], $star)
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
            // R001 — Pemberian Voucher An Nur Corner 5.000 + Apresiasi
            // Threshold: 30 poin apresiasi
            //
            // Konteks pencapaian:
            //   • 3× A002 (prestasi 10p) = 30p → R001
            //   • 15× A001 (perilaku 2p) = 30p → R001
            //   • Kombinasi: 1× prestasi + 10× perilaku = 30p
            //
            // Level AWAL — perilaku dan prestasi mulai konsisten.
            // Reward sederhana tapi bermakna: voucher An Nur Corner.
            // An Nur Corner adalah kantin/toko kecil dalam pondok.
            // ══════════════════════════════════════════════════════
            [
                'kode'        => 'R001',
                'reward'      => 'Pemberian Voucher An Nur Corner 5.000 + Apresiasi',
                'poin'        => 30,
                'is_active'   => true,
                'rekomendasi' =>
                    'PANDUAN PEMBERIAN REWARD R001 — Voucher An Nur Corner 5.000 + Apresiasi:' . "\n\n" .

                    '1. VERIFIKASI POIN: Konfirmasi total poin apresiasi santri di sistem sudah mencapai 30 poin. Tinjau jenis apresiasi yang telah tercatat (A001, A002, A003) untuk mengenali pola kebaikan santri.' . "\n" .

                    '2. SIAPKAN VOUCHER: Ambil voucher An Nur Corner senilai Rp 5.000 dari bendahara/admin pondok. Catat nomor voucher dalam berkas reward santri.' . "\n" .

                    '3. MOMEN PEMBERIAN: Berikan reward secara langsung kepada santri — bisa di ruang BK (privat) atau saat apel/upacara jika santri bersedia tampil. Pilih momen yang paling nyaman bagi santri.' . "\n" .

                    '4. APRESIASI VERBAL: Sampaikan kata-kata penghargaan yang tulus dan spesifik. Sebutkan jenis kebaikan yang paling menonjol (contoh: "Kamu sudah sangat rajin membantu teman dan disiplin selama ini — ini luar biasa!"). Hindari apresiasi yang generik dan basa-basi.' . "\n" .

                    '5. MOTIVASI LANJUTAN: Sampaikan bahwa ini baru awal — masih ada level reward yang lebih besar menanti jika santri terus konsisten. Tunjukkan tangga reward berikutnya (R002 di 60p) sebagai motivasi.' . "\n" .

                    '6. KABARKAN KE WALI KELAS: Informasikan kepada wali kelas agar turut memberikan apresiasi tambahan di kelas. Dukungan dari berbagai pihak memperkuat efek reward.' . "\n" .

                    '7. DOKUMENTASI: Catat tanggal pemberian, total poin saat trigger, jenis apresiasi utama, dan respons santri dalam berkas BK. Ini berguna untuk evaluasi program dan laporan akhir semester.',
            ],

            // ══════════════════════════════════════════════════════
            // R002 — Pemberian Voucher An Nur Corner 5.000 + Apresiasi
            // Threshold: 60 poin apresiasi
            //
            // Konteks pencapaian:
            //   • +30 poin dari R001 (santri konsisten)
            //   • 6× A002 (prestasi) = 60p total
            //   • Kombinasi disiplin + prestasi
            //
            // Level KEDUA — voucher sama tapi poin naik.
            // Pesan: konsistensi adalah kunci, bukan hanya sekali.
            // Reward sama mendorong santri fokus pada proses, bukan hadiah.
            // ══════════════════════════════════════════════════════
            [
                'kode'        => 'R002',
                'reward'      => 'Pemberian Voucher An Nur Corner 5.000 + Apresiasi',
                'poin'        => 60,
                'is_active'   => true,
                'rekomendasi' =>
                    'PANDUAN PEMBERIAN REWARD R002 — Voucher An Nur Corner 5.000 + Apresiasi (Konsistensi):' . "\n\n" .

                    '1. VERIFIKASI POIN: Pastikan total poin apresiasi sudah mencapai 60 poin. Bandingkan dengan catatan R001 untuk memahami progres sejak reward pertama.' . "\n" .

                    '2. SIAPKAN VOUCHER: Ambil voucher An Nur Corner Rp 5.000 dari admin. Voucher sama dengan R001 — ini disengaja untuk menekankan PROSES bukan hanya hadiah.' . "\n" .

                    '3. MOMEN PEMBERIAN: Usahakan diberikan di depan teman-teman terdekat santri (misalnya di kelas atau saat makan bersama) untuk efek motivasi sosial yang positif. Minta izin santri terlebih dahulu.' . "\n" .

                    '4. APRESIASI KONSISTENSI: Tekankan KONSISTENSI sebagai pesan utama. Contoh: "Yang paling membanggakan dari kamu bukan hanya satu kebaikan — tapi kamu sudah terus-menerus konsisten. Itu yang paling sulit dan paling berharga." Ini mendidik bahwa ketekunan lebih penting dari ledakan prestasi sesaat.' . "\n" .

                    '5. REFLEKSI BERSAMA: Ajak santri melakukan refleksi singkat 5 menit: "Apa yang paling membuatmu bangga dari dirimu sendiri belakangan ini?" Biarkan santri mengidentifikasi kebaikannya sendiri — efek lebih kuat dari pengakuan eksternal.' . "\n" .

                    '6. TARGET BERIKUTNYA: Tunjukkan bahwa R003 (90p) menawarkan voucher yang lebih besar (An Nur Cafe 10.000). Berikan gambaran berapa poin lagi yang dibutuhkan dan bagaimana mencapainya.' . "\n" .

                    '7. KABARKAN ORANG TUA: Hubungi orang tua via telepon atau WhatsApp. Sampaikan kabar baik ini dengan antusias. Keterlibatan orang tua dalam perayaan prestasi anak terbukti memperkuat motivasi.' . "\n" .

                    '8. DOKUMENTASI: Catat tanggal, total poin, durasi dari R001 ke R002 (berapa hari/minggu). Ini data berharga untuk memahami ritme perkembangan santri.',
            ],

            // ══════════════════════════════════════════════════════
            // R003 — Pemberian Voucher An Nur Cafe 10.000 + Apresiasi
            // Threshold: 90 poin apresiasi
            //
            // Konteks pencapaian:
            //   • +30 poin dari R002 (konsisten di level ketiga)
            //   • 9× A002 atau kombinasi intensif A001+A002+A003
            //
            // Level KETIGA — upgrade signifikan: dari An Nur CORNER
            // ke An Nur CAFE, dan nilai voucher naik 2× (10K).
            // Ini adalah "milestone" pertama yang terasa berbeda.
            // ══════════════════════════════════════════════════════
            [
                'kode'        => 'R003',
                'reward'      => 'Pemberian Voucher An Nur Cafe 10.000 + Apresiasi',
                'poin'        => 90,
                'is_active'   => true,
                'rekomendasi' =>
                    'PANDUAN PEMBERIAN REWARD R003 — Voucher An Nur Cafe 10.000 + Apresiasi (Milestone):' . "\n\n" .

                    '1. VERIFIKASI POIN: Konfirmasi total poin apresiasi sudah 90 poin. Tinjau rekap lengkap: berapa A001, A002, A003 yang berkontribusi. Identifikasi kekuatan karakter dominan santri.' . "\n" .

                    '2. SIAPKAN VOUCHER UPGRADE: Ambil voucher An Nur CAFE senilai Rp 10.000 (bukan Corner). Ini adalah upgrade pertama — penting untuk ditandai secara spesial.' . "\n" .

                    '3. MOMEN SPESIAL: Buat momen pemberian yang lebih berkesan. Bisa dilakukan di ruang BK dengan minuman/camilan kecil, atau diumumkan secara positif di kelas. Buat santri merasa pencapaiannya istimewa.' . "\n" .

                    '4. APRESIASI UPGRADE: Tekankan bahwa ini bukan sekadar reward — ini adalah bukti karakter. Contoh: "Kamu baru saja membuktikan bahwa kamu bukan hanya santri yang baik sekali-dua kali. Kamu adalah santri yang secara konsisten membawa kebaikan ke pondok ini. Voucher ini adalah dari pondok untuk merayakan karakter hebatmu." Gunakan kata "karakter" bukan hanya "perilaku".' . "\n" .

                    '5. FOTO/DOKUMENTASI VISUAL: Dengan izin santri, ambil foto penyerahan reward. Ini bisa dipajang di papan apresiasi BK atau dikirim ke grup wali kelas. Visibilitas sosial memperkuat pengaruh reward.' . "\n" .

                    '6. CERITA KE TEMAN SEBAYA: Minta santri untuk bercerita ke teman dekatnya tentang pencapaian ini. Efek peer influence positif: teman yang mendengar akan termotivasi untuk ikut berprestasi.' . "\n" .

                    '7. LAPORAN KE ORANG TUA (TERTULIS): Kirimkan pesan tertulis (WhatsApp) kepada orang tua dengan narasi yang hangat. Sertakan rekap singkat kebaikan santri. Orang tua yang tahu anaknya dihargai akan semakin mendukung.' . "\n" .

                    '8. EVALUASI PROGRAM: Catat dalam laporan BK. Analisis berapa lama rata-rata santri mencapai 90p. Data ini berguna untuk evaluasi efektivitas program apresiasi pondok.',
            ],

            // ══════════════════════════════════════════════════════
            // R004 — Pemberian Piagam Penghargaan + Voucher An Nur Cafe 10.000 + Apresiasi
            // Threshold: 130 poin apresiasi
            //
            // Konteks pencapaian:
            //   • +40 poin dari R003 (interval terbesar di antara R)
            //   • ~13× A002 (tidak genap = pasti kombinasi A001+A002+A003)
            //   • Santri yang mencapai ini adalah yang benar-benar KONSISTEN
            //
            // Level KEEMPAT — penambahan PIAGAM PENGHARGAAN.
            // Ini dokumen fisik pertama yang bisa dibawa santri.
            // Nilai simbolis tinggi: keluarga bisa melihatnya.
            // ══════════════════════════════════════════════════════
            [
                'kode'        => 'R004',
                'reward'      => 'Pemberian Piagam Penghargaan + Voucher An Nur Cafe 10.000 + Apresiasi',
                'poin'        => 130,
                'is_active'   => true,
                'rekomendasi' =>
                    'PANDUAN PEMBERIAN REWARD R004 — Piagam + Voucher An Nur Cafe 10.000 + Apresiasi (Penghargaan Formal):' . "\n\n" .

                    '1. VERIFIKASI DAN ANALISIS MENDALAM: Pastikan total poin apresiasi 130p. Buat rekap lengkap karakter positif santri (dari semua catatan BK sejak awal). Ini akan menjadi bahan narasi piagam.' . "\n" .

                    '2. CETAK PIAGAM PENGHARGAAN: Siapkan Piagam Penghargaan resmi pondok. Konten piagam harus mencantumkan: nama santri, kelas, jenis-jenis apresiasi yang dominan, total poin, dan tanda tangan BK + Kepala Pondok. Buat piagam yang estetis dan bermartabat.' . "\n" .

                    '3. SIAPKAN VOUCHER: Ambil voucher An Nur Cafe Rp 10.000. Masukkan dalam amplop bersama piagam untuk penyerahan yang berkesan.' . "\n" .

                    '4. ACARA PENYERAHAN FORMAL: Lakukan penyerahan di momen yang lebih formal — saat upacara mingguan, apel pagi, atau acara pembinaan santri. Undang wali kelas dan pembina asrama hadir. Ini penghargaan yang layak dirayakan secara kolektif.' . "\n" .

                    '5. APRESIASI MENDALAM DAN PERSONAL: Sampaikan apresiasi mendalam di depan teman-teman. Bacakan satu-dua prestasi/kebaikan konkret yang paling berkesan. Contoh: "Di balik piagam ini, ada puluhan momen kamu membantu teman, hadir tepat waktu, berbicara dengan santun — semua itu nyata dan bermakna. Pondok ini lebih baik karena ada kamu."' . "\n" .

                    '6. HUBUNGI ORANG TUA DAN UNDANG KE PONDOK: Hubungi orang tua segera. Jika memungkinkan, undang orang tua hadir saat penyerahan atau adakan penyerahan piagam khusus saat orang tua berkunjung. Momen penyerahan piagam di hadapan orang tua memiliki dampak psikologis sangat besar.' . "\n" .

                    '7. PAJANG DI PAPAN APRESIASI: Tempelkan foto/salinan kecil piagam di papan apresiasi BK atau papan pengumuman kelas (dengan izin santri). Visibilitas sosial yang positif mendorong budaya apresiasi di pondok.' . "\n" .

                    '8. RENCANA PENGEMBANGAN: Diskusikan bersama santri: "Dengan karakter seperti ini, kamu bisa berkontribusi lebih besar lagi. Apakah ada peran kepemimpinan atau tanggung jawab yang ingin kamu emban?" Reward ini adalah batu loncatan, bukan puncak.',
            ],

            // ══════════════════════════════════════════════════════
            // R005 — Pemberian Piagam Penghargaan + Voucher An Nur Cafe 20.000 + Apresiasi
            // Threshold: 150 poin apresiasi
            //
            // Konteks pencapaian:
            //   • +20 poin dari R004 (interval terpendek di seluruh R)
            //   • ~15× A002 atau santri yang sangat aktif di semua A
            //   • Interval kecil (20p) menandakan "puncak" yang relatif cepat dicapai
            //     setelah R004 — reward tertinggi tidak terlalu jauh untuk menghindari
            //     demotivasi setelah level sebelumnya
            //
            // Level TERTINGGI — PIAGAM + VOUCHER TERBESAR (20K).
            // Santri teladan pondok. Pencapaian puncak program apresiasi.
            // ══════════════════════════════════════════════════════
            [
                'kode'        => 'R005',
                'reward'      => 'Pemberian Piagam Penghargaan + Voucher An Nur Cafe 20.000 + Apresiasi',
                'poin'        => 150,
                'is_active'   => true,
                'rekomendasi' =>
                    'PANDUAN PEMBERIAN REWARD R005 — Piagam + Voucher An Nur Cafe 20.000 + Apresiasi (PENGHARGAAN TERTINGGI):' . "\n\n" .

                    '1. VERIFIKASI FINAL DAN REKAP LENGKAP: Konfirmasi total poin apresiasi 150p. Buat rekap menyeluruh perjalanan apresiasi santri dari R001 hingga R005. Dokumentasikan berapa lama santri menempuh perjalanan ini — ini narasi yang kuat.' . "\n" .

                    '2. CETAK PIAGAM ISTIMEWA: Cetak Piagam Penghargaan dengan desain yang lebih istimewa — gunakan kertas tebal/laminasi, tambahkan cap/stempel resmi pondok, tanda tangan Kepala Pondok. Piagam R005 harus terasa berbeda dari R004.' . "\n" .

                    '3. SIAPKAN VOUCHER TERBESAR: Ambil voucher An Nur Cafe senilai Rp 20.000 (dua kali lipat dari R003 dan R004). Masukkan dalam amplop premium atau bingkai kecil jika memungkinkan.' . "\n" .

                    '4. ACARA PENGHARGAAN KHUSUS: Adakan acara penghargaan yang paling berkesan. Idealnya: saat upacara besar pondok, dalam acara kelulusan/kenaikan kelas, atau acara akhir semester. Undang: seluruh dewan guru, wali kelas, wali asrama, dan ORANG TUA. Pimpinan pondok yang menyerahkan langsung.' . "\n" .

                    '5. DEKLARASI SANTRI TELADAN: Deklarasikan santri sebagai "Santri Teladan Apresiasi" periode ini. Buat pengumuman resmi yang bisa dibacakan di upacara. Ini bukan sekadar reward — ini rekognisi resmi dari institusi.' . "\n" .

                    '6. APRESIASI PUNCAK YANG BERKESAN: Berikan sambutan yang tulus dan mendalam. Ceritakan perjalanan santri dari awal (termasuk tantangan yang dihadapi jika ada) hingga pencapaian ini. Gunakan cerita konkret yang akan diingat seumur hidup: "Saya masih ingat ketika kamu pertama kali [sebutkan momen spesifik]. Dan hari ini kamu membuktikan bahwa karakter baik itu bukan keberuntungan — itu pilihan yang kamu buat setiap hari."' . "\n" .

                    '7. LIBATKAN ORANG TUA SECARA PENUH: Orang tua WAJIB diundang atau dihubungi secara khusus. Jika hadir, berikan mereka kesempatan untuk memberikan pesan singkat kepada anak. Momen ini memperkuat ikatan santri-keluarga-pondok secara bersamaan.' . "\n" .

                    '8. PUBLIKASI POSITIF (OPSIONAL): Dengan izin santri dan orang tua, bagikan foto penyerahan reward di media komunikasi pondok (grup wali murid, papan pengumuman digital). Ini membangun budaya apresiasi di seluruh komunitas pondok.' . "\n" .

                    '9. RENCANA KONTRIBUSI LEBIH BESAR: Ajak santri berdiskusi tentang peran lebih besar yang bisa diemban ke depan (mentor teman sebaya, pengurus OSIS/organisasi santri, duta perilaku positif pondok). Pencapaian ini adalah titik awal kepemimpinan.' . "\n" .

                    '10. DOKUMENTASI LENGKAP SEBAGAI WARISAN: Arsipkan seluruh perjalanan apresiasi santri (dari R001 s.d. R005) dalam satu folder/berkas khusus. Ini menjadi rekam jejak positif yang bisa menjadi referensi untuk surat rekomendasi, penilaian karakter, atau keperluan masa depan santri.',
            ],

        ];
    }
}