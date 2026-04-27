<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * VariabelApresiasiSeeder
 *
 * Menyeed 3 variabel apresiasi (A001–A003) sesuai dokumen:
 * "Isi_Semua_Variable.docx" + "Kamus_Kata_Knowladge.docx"
 *
 * ════════════════════════════════════════════════════════════
 * KONTEKS SISTEM (PENTING UNTUK DIPAHAMI)
 * ════════════════════════════════════════════════════════════
 *
 * Apresiasi berfungsi sebagai DUA hal sekaligus:
 *
 * (1) DETEKSI LANGSUNG — kamus kata A match teks positif,
 *     langsung menghasilkan kode apresiasi.
 *
 * (2) COUNTERPART NEGATION — saat variabel Pelanggaran yang
 *     negatable (P002, P004, P006, P013, P014) di-negasi dalam
 *     teks laporan ("tidak telat", "tidak kasar", dst),
 *     Python akan FLIP kode P → kode A (counterpart).
 *     Artinya, A001 dan A003 akan menerima flip dari P.
 *
 * ════════════════════════════════════════════════════════════
 * RELASI NEGATION (SUDAH DIDEFINISIKAN DI VariabelPelanggaranSeeder)
 * ════════════════════════════════════════════════════════════
 *
 * P002 (disiplin_waktu)  negatable=true → counterpart A001
 * P004 (kerapian)        negatable=true → counterpart A001
 * P006 (etika_sikap)     negatable=true → counterpart A001
 * P013 (kesehatan)       negatable=true → counterpart A001
 * P014 (bahasa)          negatable=true → counterpart A003
 *
 * ════════════════════════════════════════════════════════════
 * KEPUTUSAN NEGATION UNTUK APRESIASI
 * ════════════════════════════════════════════════════════════
 *
 * A001 → negatable=true, counterpart P001
 *   "tidak membantu", "tidak bertindak baik", "tidak disiplin"
 *   Tetapi kita menggunakan P001 (perundungan_fisik) BUKAN —
 *   Justru TIDAK tepat. Maka A001 tidak ada counterpart spesifik
 *   karena kata-katanya terlalu beragam (ibadah, disiplin, sosial).
 *   → negatable=FALSE untuk A001.
 *
 *   ALASAN: Python flip A001 → P apa? Terlalu ambigu. Konteks
 *   "tidak bantu" bisa jadi P007 (aturan umum) atau tidak ada
 *   pelanggaran sama sekali. Lebih aman biarkan BK yang nilai.
 *
 * A002 → negatable=false
 *   "tidak juara", "tidak menang lomba" = bukan pelanggaran.
 *   Kondisi normal, tidak ada flip yang masuk akal.
 *
 * A003 → negatable=true, counterpart=P014
 *   "tidak santun", "tidak sopan bicara", "tidak salam"
 *   = masuk ke P014 (bahasa/etika berbicara).
 *   Ini adalah SIMETRI dari P014 → A003 di seeder pelanggaran.
 *
 * ════════════════════════════════════════════════════════════
 * STRATEGI KAMUS KATA
 * ════════════════════════════════════════════════════════════
 *
 * Sama dengan VariabelPelanggaranSeeder:
 * - Minimal 4 karakter (filter is_valid_kata Python)
 * - Bentuk dasar (stem) + variasi morfologis penting
 * - Kata slang/gaul santri yang relevan
 * - Frasa pendek yang sering muncul di laporan positif
 * - Hindari kata terlalu generik yang bisa false positive
 *
 * A001 KHUSUS: Kamus kata sangat luas (perilaku, ibadah, sosial,
 * kedisiplinan). Perlu selektif — prioritaskan kata yang SPESIFIK
 * menunjukkan tindakan positif, bukan kata umum yang bisa muncul
 * di konteks apapun (misal: "bantu" lebih spesifik dari "baik").
 */
class VariabelApresiasiSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('');
        $this->command->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        $this->command->info('  SEEDER: Variabel Apresiasi A001–A003');
        $this->command->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        $this->command->info('');
        $this->command->info('  Relasi Negation (dari VariabelPelanggaranSeeder):');
        $this->command->info('  P002 → A001  P004 → A001  P006 → A001');
        $this->command->info('  P013 → A001  P014 → A003');
        $this->command->info('');

        $data = $this->getData();

        $inserted = 0;
        $updated  = 0;

        foreach ($data as $item) {
            $exists = DB::table('variabel_apresiasi')
                ->where('kode', $item['kode'])
                ->exists();

            DB::table('variabel_apresiasi')->updateOrInsert(
                ['kode' => $item['kode']],
                array_merge($item, [
                    'updated_at' => now(),
                    'created_at' => $exists ? DB::raw('created_at') : now(),
                ])
            );

            if ($exists) {
                $this->command->line("  ✎  Updated  {$item['kode']} — {$item['kategori']}");
                $updated++;
            } else {
                $this->command->line("  ✚  Inserted {$item['kode']} — {$item['kategori']}");
                $inserted++;
            }
        }

        $this->command->info('');
        $this->command->info("  ✅ Selesai: {$inserted} inserted, {$updated} updated");
        $this->command->info('');

        // Ringkasan negation
        $this->command->info('  Negation mapping summary (Apresiasi → Pelanggaran):');
        foreach ($data as $item) {
            if ($item['negatable']) {
                $this->command->line(
                    "     {$item['kode']} ↔ {$item['counterpart_kode']} : {$item['negation_notes']}"
                );
            } else {
                $this->command->line(
                    "     {$item['kode']} : tidak negatable (kondisi normal bukan pelanggaran)"
                );
            }
        }

        $this->command->info('');
        $this->command->info('  Simetri negation yang terbangun (P ↔ A):');
        $this->command->info('     P002 ↔ A001  (disiplin waktu ↔ tindakan positif)');
        $this->command->info('     P004 ↔ A001  (kerapian ↔ tindakan positif)');
        $this->command->info('     P006 ↔ A001  (etika sikap ↔ tindakan positif)');
        $this->command->info('     P013 ↔ A001  (kesehatan ↔ tindakan positif)');
        $this->command->info('     P014 ↔ A003  (bahasa kasar ↔ bahasa santun)');
        $this->command->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }

    // ──────────────────────────────────────────────────────
    // DATA
    // ──────────────────────────────────────────────────────

    private function getData(): array
    {
        return [

            // ══════════════════════════════════════════════════
            // A001 — Tindakan / Perilaku | 2 Poin
            // Reward: Apresiasi Ucapan
            //
            // Cakupan: Perilaku positif sehari-hari santri yang luas,
            // mencakup: tolong-menolong, ibadah, kedisiplinan,
            // kebersihan, adab, ketaatan aturan.
            //
            // A001 adalah COUNTERPART dari 4 pelanggaran:
            //   P002 → A001 (tidak terlambat = disiplin waktu)
            //   P004 → A001 (tidak tidak rapi = berpenampilan rapi)
            //   P006 → A001 (tidak membantah = beradab)
            //   P013 → A001 (tidak jorok = menjaga diri)
            //
            // NEGATION: TIDAK negatable
            //   A001 mencakup terlalu banyak ranah perilaku.
            //   "Tidak membantu" bisa ke P007 (aturan umum) atau tidak
            //   ada pelanggaran. "Tidak disiplin" sudah ada P002.
            //   Terlalu ambigu untuk di-flip ke satu P tertentu.
            //   BK yang menilai konteks negatif dari tindakan.
            //
            // KAMUS KATA — 5 KLASTER:
            //   [1] Tolong-menolong & Sosial
            //   [2] Ibadah & Spiritualitas
            //   [3] Kedisiplinan & Ketaatan
            //   [4] Kebersihan & Kerapian (menerima flip P004 & P013)
            //   [5] Adab & Sopan Santun (menerima flip P006)
            // ══════════════════════════════════════════════════
            [
                'kode'      => 'A001',
                'kategori'  => 'Tindakan / Perilaku',
                'poin'      => 2,
                'apresiasi' => 'Apresiasi Ucapan',

                'kamus_kata' =>

                    // ── Klaster 1: Tolong-menolong & Sosial ──────────────
                    // Kata kerja aktif yang menunjukkan inisiatif sosial.
                    // Diprioritaskan bentuk stem + me- karena laporan BK
                    // cenderung ditulis dengan kata aktif ("si A membantu").
                    'bantu,membantu,menolong,tolong,pertolongan,' .
                    'inisiatif,sukarela,rela,merelakan,' .
                    'papah,memapah,tuntun,menuntun,' .            // bantu fisik orang tua/teman
                    'angkat,mengangkat,bawakan,membawakan,' .     // bantu angkat barang
                    'gotong,royong,gotong royong,' .              // kerja bareng
                    'bagi,berbagi,membagikan,sedekah,' .          // berbagi makanan/barang
                    'infaq,bersedekah,wakaf,' .                   // infaq/sedekah
                    'rawat,merawat,menjaga teman,' .              // rawat teman sakit
                    'jenguk,menjenguk,besuk,' .                   // jenguk teman sakit
                    'dampingi,mendampingi,temani,' .              // mendampingi teman
                    'peduli,kepedulian,perhatian kepada,' .       // kepedulian sosial
                    'solidaritas,kompak,kekompakan,' .            // solidaritas kelompok

                    // ── Klaster 2: Ibadah & Spiritualitas ────────────────
                    // Kata ibadah yang muncul di laporan positif santri.
                    // Sertakan kata Arab yang sudah umum di konteks pesantren.
                    'shalat,solat,mengerjakan shalat,' .
                    'puasa,berpuasa,puasa sunnah,' .
                    'jamaah,berjamaah,sholat jamaah,' .
                    'masjid,mushola,surau,' .                     // ke masjid
                    'wudhu,berwudhu,wudu,' .                      // bersuci
                    'tahajud,shalat tahajud,' .                   // tahajud
                    'dhuha,shalat dhuha,' .                       // shalat dhuha
                    'rawatib,sunnah rawatib,' .                   // shalat sunnah rawatib
                    'hafalan,menghafal,tahfidz,' .                // menghafal Quran/doa
                    'tilawah,membaca quran,ngaji,' .              // baca Quran (A003 juga)
                    'dzikir,berdzikir,wirid,' .                   // dzikir setelah shalat
                    'istighfar,beristighfar,' .                   // istighfar

                    // ── Klaster 3: Kedisiplinan & Ketaatan ───────────────
                    // Kata yang menunjukkan ketertiban dan ketaatan aturan.
                    // Ini adalah klaster yang menerima flip dari P002 dan P004.
                    'piket,jadwal piket,melaksanakan piket,' .    // piket kebersihan
                    'tepat waktu,ontime,tidak telat,' .           // from P002 flip
                    'disiplin,kedisiplinan,tertib,' .
                    'hadir,kehadiran,masuk tepat,' .              // hadir di kelas/apel
                    'antri,mengantri,tertib antri,' .             // antri dengan tertib
                    'baris,berbaris,apel pagi,' .                 // apel/baris
                    'seragam lengkap,berseragam,' .               // from P004 flip
                    'patuh,mematuhi,taat,' .
                    'amanah,menjalankan amanah,' .                // amanah tugas
                    'tanggung jawab,bertanggung jawab,' .         // tanggung jawab
                    'tepat,waktu,kerjakan tugas,' .
                    'catat,mencatat,simak,menyimak,' .            // aktif di kelas
                    'dengar,mendengarkan,perhatian,' .            // perhatian di kelas

                    // ── Klaster 4: Kebersihan & Kerapian ─────────────────
                    // Menerima flip dari P004 (kerapian) dan P013 (kesehatan).
                    // "tidak tidak rapi" dan "tidak jorok" → A001.
                    'bersih,membersihkan,menjaga kebersihan,' .
                    'rapi,merapikan,kerapian,' .
                    'sapu,menyapu,menyapu lantai,' .
                    'mengepel,ngepel,' .                          // pel lantai
                    'buang sampah,membuang sampah pada tempatnya,' .
                    'merawat diri,mandi,cuci tangan,' .
                    'bersih kamar,kamar rapi,' .                  // kamar bersih
                    'menjaga lingkungan,' .                       // lingkungan bersih

                    // ── Klaster 5: Adab & Sopan Santun ───────────────────
                    // Menerima flip dari P006 (etika sikap).
                    // "tidak membantah/melawan" → A001.
                    'senyum,tersenyum,' .
                    'salam,mengucapkan salam,' .
                    'cium tangan,mencium tangan,' .               // cium tangan guru
                    'bungkuk,membungkuk,' .                       // bungkuk hormat
                    'tunduk,menunduk,' .                          // tunduk hormat
                    'hormat,menghormati,' .
                    'sopan,bersikap sopan,' .
                    'santun,kesantunan,' .
                    'duduk tenang,tenang di kelas,' .
                    'jabat tangan,berjabat tangan',               // jabat tangan

                'negatable'        => false,
                'counterpart_kode' => null,
                'negation_notes'   => null,
                // A001 tidak negatable — terlalu luas untuk di-flip ke
                // satu kode P. Konteks negatifnya ditangani oleh P2,P4,P6,P13.
            ],

            // ══════════════════════════════════════════════════
            // A002 — Prestasi | 10 Poin
            // Reward: Apresiasi Ucapan
            //
            // Cakupan: Pencapaian/prestasi santri baik akademik,
            // non-akademik, olahraga, seni, agama.
            //
            // NEGATION: TIDAK negatable
            //   "Tidak juara" = kondisi normal bukan pelanggaran.
            //   "Tidak menang lomba" tidak ada kode P yang tepat.
            //   Prestasi adalah hal luar biasa, absennya bukan
            //   pelanggaran sehingga tidak perlu flip.
            //
            // KAMUS KATA — 4 KLASTER:
            //   [1] Prestasi Kompetisi & Akademik
            //   [2] Pengakuan & Penghargaan
            //   [3] Prestasi Agama & Pesantren (khas pesantren)
            //   [4] Inovasi & Kreativitas
            // ══════════════════════════════════════════════════
            [
                'kode'      => 'A002',
                'kategori'  => 'Prestasi',
                'poin'      => 10,
                'apresiasi' => 'Apresiasi Ucapan',

                'kamus_kata' =>

                    // ── Klaster 1: Prestasi Kompetisi & Akademik ─────────
                    'juara,menjadi juara,meraih juara,' .
                    'menang,memenangkan,kemenangan,' .
                    'lomba,perlombaan,ikut lomba,' .
                    'kompetisi,berkompetisi,' .
                    'olimpiade,ikut olimpiade,' .
                    'tanding,bertanding,pertandingan,' .
                    'delegasi,mewakili,wakil sekolah,' .         // mewakili sekolah/pondok
                    'nilai bagus,nilai tinggi,nilai sempurna,' .
                    'rangking,peringkat,masuk peringkat,' .
                    'tuntas,lulus ujian,lulus tes,' .
                    'sempurna,hasil sempurna,' .
                    'terbaik,siswa terbaik,santri terbaik,' .
                    'unggul,keunggulan,' .
                    'naik kelas,promosi kelas,' .
                    'tidak remedial,tidak mengulang,' .

                    // ── Klaster 2: Pengakuan & Penghargaan ───────────────
                    'piala,mendapat piala,' .
                    'medali,mendapat medali,meraih medali,' .
                    'sertifikat,mendapat sertifikat,' .
                    'piagam,mendapat piagam,piagam penghargaan,' .
                    'penghargaan,mendapat penghargaan,' .
                    'teladan,siswa teladan,santri teladan,' .
                    'dipilih,terpilih,dipilih mewakili,' .

                    // ── Klaster 3: Prestasi Agama & Pesantren ────────────
                    // Konteks khusus pesantren — prestasi keagamaan
                    // adalah pencapaian penting yang perlu diapresiasi.
                    'hafal quran,hafalan quran,khatam,' .         // hafal Quran
                    'setor hafalan,menyetorkan hafalan,' .        // setor hafalan ke guru
                    'lancar hafalan,hafalan lancar,' .
                    'tahfidz,program tahfidz,' .
                    'qiroat,lomba qiroat,' .                      // lomba baca Quran
                    'adzan terbaik,lomba adzan,' .                // lomba adzan
                    'cerdas cermat,lomba cerdas cermat,' .        // cerdas cermat agama
                    'ceramah,lomba ceramah,' .                    // lomba ceramah

                    // ── Klaster 4: Inovasi & Kreativitas ─────────────────
                    'karya,membuat karya,hasil karya,' .
                    'cipta,menciptakan,kreasi,' .
                    'inovasi,berinovasi,' .
                    'mahir,kemahiran,menguasai,' .
                    'kreatif,kreativitas,ide kreatif,' .
                    'proyek,membuat proyek,' .
                    'presentasi bagus,presentasi terbaik,' .
                    'riset,penelitian kecil,' .
                    'pameran,ikut pameran',                       // pameran karya

                'negatable'        => false,
                'counterpart_kode' => null,
                'negation_notes'   => null,
            ],

            // ══════════════════════════════════════════════════
            // A003 — Linguistik / Ucapan | 2 Poin
            // Reward: Apresiasi dan Validasi
            //
            // Cakupan: Perilaku positif dalam berbahasa, berucap,
            // berkomunikasi, berdoa, dan berinteraksi verbal santri.
            //
            // A003 adalah COUNTERPART dari P014 (bahasa):
            //   P014 → A003 (tidak berkata kasar = santun berbahasa)
            //
            // NEGATION: YA → counterpart P014
            //   "tidak santun", "tidak sopan bicara", "tidak salam",
            //   "tidak berkata baik" = berpotensi P014 (bahasa kasar).
            //   Simetri sempurna:
            //     P014 negatable=true → counterpart A003
            //     A003 negatable=true → counterpart P014
            //
            // KAMUS KATA — 4 KLASTER:
            //   [1] Komunikasi Santun & Verbal Positif
            //   [2] Kejujuran & Integritas
            //   [3] Ibadah Verbal (doa, dzikir, bacaan) — OVERLAP A001
            //       A003 fokus pada UCAPAN ibadah (tilawah, adzan)
            //       A001 fokus pada TINDAKAN ibadah (shalat, puasa)
            //   [4] Kepemimpinan Verbal & Sosial
            // ══════════════════════════════════════════════════
            [
                'kode'      => 'A003',
                'kategori'  => 'Linguistik / Ucapan',
                'poin'      => 2,
                'apresiasi' => 'Apresiasi dan Validasi',

                'kamus_kata' =>

                    // ── Klaster 1: Komunikasi Santun & Verbal Positif ────
                    // Ini adalah inti A003. Kata yang menunjukkan cara
                    // berkomunikasi yang baik. Menerima flip dari P014.
                    'santun,kesantunan,bertutur santun,' .
                    'sopan,berbicara sopan,' .
                    'sapa,menyapa,menyapa duluan,' .
                    'salam,mengucapkan salam,' .
                    'permisi,minta izin,izin berbicara,' .
                    'maaf,meminta maaf,minta maaf,' .
                    'terima kasih,mengucapkan terima kasih,' .
                    'tolong,meminta tolong dengan sopan,' .
                    'lembut,berbicara lembut,suara lembut,' .
                    'halus,perkataan halus,' .
                    'jawab dengan baik,menjawab sopan,' .
                    'berbicara baik,berkata baik,' .
                    'tidak memotong,mendengarkan dulu,' .
                    'bicara dengan tenang,' .

                    // ── Klaster 2: Kejujuran & Integritas Verbal ─────────
                    // Ucapan yang mencerminkan integritas dan kejujuran.
                    'jujur,berkata jujur,kejujuran,' .
                    'benar,berkata benar,perkataan benar,' .
                    'amanah,memegang amanah,' .
                    'janji,menepati janji,tidak ingkar,' .
                    'tepat janji,menepati,' .
                    'fakta,berbicara fakta,' .
                    'terang,terus terang,berbicara terus terang,' .
                    'aku salah,mengakui kesalahan,' .             // mengakui kesalahan
                    'lapor,melapor,melaporkan,' .                 // lapor yang benar
                    'sumpah,bersumpah dengan benar,' .
                    'bersaksi,kesaksian,' .

                    // ── Klaster 3: Ibadah Verbal (Ucapan Islami) ─────────
                    // Fokus pada UCAPAN ibadah (beda dari A001 = tindakan).
                    // A001: shalat (tindakan) → A003: adzan (ucapan).
                    'adzan,mengumandangkan adzan,muadzin,' .      // adzan
                    'iqamah,mengumandangkan iqamah,' .
                    'tilawah,membaca tilawah,' .
                    'ngaji,mengaji,tadarus,' .                    // baca Quran (ucapan)
                    'doa,berdoa,memimpin doa,' .                  // doa bersama
                    'dzikir,berdzikir,wirid,' .
                    'shalawat,bershalawat,' .
                    'hamdalah,mengucapkan hamdalah,' .
                    'istighfar,mengucapkan istighfar,' .
                    'takbir,mengucapkan takbir,' .
                    'amin,mengucapkan amin,' .
                    'basmallah,mengucapkan basmallah,' .

                    // ── Klaster 4: Kepemimpinan Verbal & Sosial ──────────
                    // Komunikasi yang memimpin, menghibur, menasehati.
                    'hibur,menghibur,menghibur teman,' .          // hibur teman sedih
                    'nasehat,menasehati,memberi nasehat,' .       // nasehat positif
                    'damai,mendamaikan,mendamaikan teman,' .      // mendamaikan konflik
                    'ajak,mengajak,mengajak kebaikan,' .          // mengajak hal positif
                    'pimpin,memimpin,menjadi pemimpin,' .         // memimpin diskusi/doa
                    'presentasi,mempresentasikan,' .              // presentasi di kelas
                    'diskusi,berdiskusi,aktif diskusi,' .         // aktif berdiskusi
                    'tanya,bertanya,mengajukan pertanyaan,' .     // bertanya dengan baik
                    'usul,mengusulkan,memberi usul,' .            // usul yang baik
                    'saran,memberi saran,masukan positif',        // saran konstruktif

                'negatable'        => true,
                'counterpart_kode' => 'P014',
                // Simetri lengkap: P014 → A003 dan A003 → P014
                // "tidak santun", "tidak sopan bicara", "tidak salam"
                // = berpotensi masuk P014 (bahasa kasar/tidak santun)
                'negation_notes'   => '"tidak santun/sopan berbicara/tidak salam/tidak berkata baik" = bahasa tidak baik → flip ke P014 (pelanggaran bahasa)',
            ],

        ];
    }
}