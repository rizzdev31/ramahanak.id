<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * VariabelPelanggaranSeeder
 *
 * Menyeed 14 variabel pelanggaran (P001–P014) sesuai dokumen:
 * "Isi_Semua_Variable.docx" + "Kamus_Kata_Knowladge.docx"
 *
 * STRATEGI NEGATION:
 * ─────────────────────────────────────────────────────────
 * Sistem mendukung negation flip (tidak/bukan/tak + kata → flip ke counterpart).
 * Konfigurasi per variabel:
 *
 *   negatable        = true  → kata dalam kamus_kata bisa di-negasi
 *   counterpart_kode = 'Axxx' → kode apresiasi yang dituju saat di-negasi
 *   negation_notes   = keterangan logika flip untuk BK
 *
 * KAMUS KATA:
 * ─────────────────────────────────────────────────────────
 * Format: comma-separated, lowercase, minimal 4 karakter.
 * Kata < 4 karakter difilter otomatis oleh Python (is_valid_kata).
 * Kata dalam kamus kata adalah BENTUK DASAR / stem dari variasi kata,
 * karena Sastrawi akan stem teks sebelum matching.
 * Juga disertakan variasi morfologis penting yang sering tidak di-stem
 * dengan sempurna agar coverage lebih luas.
 *
 * ATURAN KAMUS KATA YANG DITERAPKAN:
 * - Sertakan bentuk dasar (stem) + bentuk yang sering muncul di laporan
 * - Sertakan kata gaul / slang santri yang relevan
 * - Sertakan kata pasif (di-xxx) dan aktif (me-xxx) karena stemmer
 *   tidak selalu meng-handle prefiks dengan sempurna
 * - Hindari kata terlalu umum (anak, teman, pondok) yang bisa
 *   menyebabkan false positive
 * - Hindari kata < 4 karakter (akan difilter Python)
 *
 * STRATEGI updateOrInsert:
 * ─────────────────────────────────────────────────────────
 * Pakai updateOrInsert per kode agar aman dijalankan ulang
 * tanpa duplikasi dan tanpa kehilangan data lain.
 */
class VariabelPelanggaranSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('');
        $this->command->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        $this->command->info('  SEEDER: Variabel Pelanggaran P001–P014');
        $this->command->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        $data = $this->getData();

        $inserted = 0;
        $updated  = 0;

        foreach ($data as $item) {
            $exists = DB::table('variabel_pelanggaran')
                ->where('kode', $item['kode'])
                ->exists();

            DB::table('variabel_pelanggaran')->updateOrInsert(
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
        $this->command->info('  Negation mapping summary:');
        foreach ($data as $item) {
            if ($item['negatable']) {
                $this->command->line(
                    "     {$item['kode']} ↔ {$item['counterpart_kode']} : {$item['negation_notes']}"
                );
            }
        }
        $this->command->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }

    // ──────────────────────────────────────────────────────
    // DATA
    // ──────────────────────────────────────────────────────

    private function getData(): array
    {
        return [

            // ══════════════════════════════════════════════
            // P001 — Perundungan Fisik | 5 Poin
            // Tindakan: Tanggung Jawab, Berdiri Berhadapan 30 menit
            //
            // NEGATION: TIDAK — kekerasan fisik tidak memiliki
            // counterpart apresiasi yang logis. "Tidak memukul"
            // adalah kondisi normal, bukan apresiasi.
            // ══════════════════════════════════════════════
            [
                'kode'             => 'P001',
                'kategori'         => 'perundungan_fisik',
                'poin'             => 5,
                'tindakan'         => 'Tanggung Jawab, dan Berdiri Berhadapan selama 30 menit',

                // Sumber: dokumen kamus kata + variasi morfologis
                // Strategi: sertakan stem (pukul, tendang) dan
                // variasi penting (memukul, menendang, dipukul)
                // karena stemmer Sastrawi kadang tidak sempurna
                // pada kata dengan prefiks ganda.
                'kamus_kata'       =>
                    'pukul,memukul,dipukul,pemukulan,' .          // pukul
                    'tonjok,menonjok,nonjok,ditonjok,' .           // tonjok
                    'hantam,menghantam,dihantam,' .                // hantam
                    'tendang,menendang,ditendang,' .               // tendang
                    'tampar,menampar,ditampar,' .                  // tampar
                    'jambak,menjambak,dijambak,' .                 // jambak
                    'cekik,mencekik,dicekik,' .                    // cekik
                    'gigit,menggigit,digigit,' .                   // gigit
                    'hajar,menghajar,dihajar,' .                   // hajar (slang keras)
                    'keroyok,mengeroyok,dikeroyok,pengeroyokan,' . // keroyok
                    'serang,menyerang,diserang,penyerangan,' .     // serang
                    'aniaya,penganiayaan,' .                       // aniaya (formal)
                    'lukai,melukai,dilukai,' .                     // lukai
                    'bentur,membentur,dibentur,' .                 // bentur
                    'banting,membanting,dibanting,' .              // banting
                    'adu fisik,berkelahi,perkelahian,' .           // frasa umum
                    'kekerasan,pelaku,korban,' .                   // kata konteks
                    'bully,buli,membuli,dibuli',                   // bully fisik

                'negatable'        => false,
                'counterpart_kode' => null,
                'negation_notes'   => null,
            ],

            // ══════════════════════════════════════════════
            // P002 — Disiplin Waktu | 2 Poin
            // Tindakan: Memberikan Motivasi Belajar
            //
            // NEGATION: YA → flip ke A001 (Tindakan/Perilaku)
            // "Tidak telat", "tidak terlambat", "tidak molor"
            // adalah bentuk apresiasi kedisiplinan waktu yang
            // masuk dalam kategori A001 (Tindakan/Perilaku positif).
            // Counterpart menggunakan A001 karena dokumen tidak
            // mendefinisikan kode apresiasi terpisah untuk disiplin waktu.
            // ══════════════════════════════════════════════
            [
                'kode'             => 'P002',
                'kategori'         => 'disiplin_waktu',
                'poin'             => 2,
                'tindakan'         => 'Memberikan Motivasi Belajar',

                'kamus_kata'       =>
                    'telat,terlambat,keterlambatan,' .             // kata dasar
                    'ngaret,molor,mlolor,' .                       // slang
                    'kesiangan,lewat,melewati,' .                  // variasi
                    'bolos apel,tidak ontime,' .                   // frasa
                    'jam karet,mengulur waktu,' .                  // idiom
                    'lambat datang,datang siang,' .                // variasi deskriptif
                    'telat masuk,terlambat masuk,' .               // konteks masuk kelas
                    'absen apel,tidak tepat',                      // apel pagi/malam

                'negatable'        => true,
                'counterpart_kode' => 'A001',
                // Logika: "tidak telat" → santri hadir tepat waktu
                // → merupakan bentuk perilaku/tindakan positif (A001)
                'negation_notes'   => '"tidak telat/terlambat/molor" → flip ke A001 (Tindakan/Perilaku positif = disiplin waktu)',
            ],

            // ══════════════════════════════════════════════
            // P003 — Vandalisme | 2 Poin
            // Tindakan: Memperbaiki dan Membersihkan
            //
            // NEGATION: TIDAK — merusak fasilitas tidak punya
            // counterpart apresiasi yang terdefinisi. "Tidak merusak"
            // adalah kondisi normal.
            // ══════════════════════════════════════════════
            [
                'kode'             => 'P003',
                'kategori'         => 'vandalisme',
                'poin'             => 2,
                'tindakan'         => 'Memperbaiki dan Membersihkan',

                'kamus_kata'       =>
                    'rusak,merusak,dirusak,kerusakan,' .           // rusak
                    'coret,mencoret,coretan,dicoret,' .            // coret dinding
                    'gambar,menggambar,' .                         // gambar di dinding
                    'vandalisme,vandal,' .                         // kata formal
                    'pecah,memecahkan,dipecahkan,' .               // pecah kaca
                    'hancur,menghancurkan,' .                      // hancurkan
                    'banting,membanting,' .                        // banting barang
                    'robek,merobek,dirobek,' .                     // robek buku/poster
                    'bakar,membakar,' .                            // bakar fasilitas
                    'lempar,melempar,' .                           // lempar benda
                    'fasilitas,inventaris,sekolah',                // konteks fasilitas

                'negatable'        => false,
                'counterpart_kode' => null,
                'negation_notes'   => null,
            ],

            // ══════════════════════════════════════════════
            // P004 — Kerapian | 2 Poin
            // Tindakan: Merapikan dan Mencontohkan cara yang benar
            //
            // NEGATION: YA → flip ke A001 (Tindakan/Perilaku)
            // "Tidak tidak rapi" = rapi → masuk A001 (perilaku positif).
            // Kerapian berpakaian dan penampilan adalah bagian dari
            // tindakan/perilaku baik santri.
            // ══════════════════════════════════════════════
            [
                'kode'             => 'P004',
                'kategori'         => 'kerapian',
                'poin'             => 2,
                'tindakan'         => 'Merapikan dan Mencontohkan cara yang benar',

                'kamus_kata'       =>
                    'gondrong,rambut panjang,' .                   // rambut
                    'tidak rapi,berantakan,' .                     // penampilan
                    'celana ketat,baju ketat,' .                   // pakaian ketat
                    'baju dikeluarkan,baju luar,' .                // baju tidak dimasukkan
                    'kuku panjang,kuku kotor,' .                   // kuku
                    'atribut,seragam,tidak lengkap,' .             // kelengkapan seragam
                    'salah seragam,bukan seragam,' .               // seragam salah
                    'lusuh,kusut,lecek,' .                         // kondisi baju
                    'tidak berseragam,bebas seragam,' .            // tanpa seragam
                    'kaos,oblong,sandal,' .                        // pakaian tidak sesuai
                    'tindik,anting,gelang,' .                      // aksesori dilarang
                    'warna rambut,disemir,dicat rambut',           // rambut dicat

                'negatable'        => true,
                'counterpart_kode' => 'A001',
                // Logika: "tidak tidak rapi" = rapi → perilaku positif (A001)
                'negation_notes'   => '"tidak tidak rapi/berantakan" = berpenampilan rapi → flip ke A001 (Tindakan/Perilaku positif)',
            ],

            // ══════════════════════════════════════════════
            // P005 — Belajar Mengajar | 2 Poin
            // Tindakan: Menyampaikan Motivasi Belajar
            //
            // NEGATION: TIDAK — gangguan proses belajar mengajar
            // tidak memiliki counterpart apresiasi yang tepat.
            // Konteks "tidak tidur di kelas" terlalu ambigu karena
            // itu kondisi normal, bukan prestasi yang di-apresiasi.
            // ══════════════════════════════════════════════
            [
                'kode'             => 'P005',
                'kategori'         => 'belajar_mengajar',
                'poin'             => 2,
                'tindakan'         => 'Menyampaikan Motivasi Belajar',

                'kamus_kata'       =>
                    'tidur dikelas,tidur saat pelajaran,' .        // dari dokumen
                    'mengantuk,kantuk,ngantuk,' .                  // mengantuk
                    'gaduh,kegaduhan,rebut,keributan,' .           // gaduh
                    'berisik,berisik saat guru,' .                 // berisik
                    'main saat pelajaran,main waktu kelas,' .      // main-main
                    'tidak mengerjakan,tidak kerjakan,' .          // tidak kerjakan PR/tugas
                    'membolos pelajaran,bolos pelajaran,' .        // bolos mapel
                    'cabut pelajaran,cabut mapel,' .               // slang bolos
                    'ngobrol,bicara sendiri,' .                    // ngobrol saat pelajaran
                    'ganggu teman,mengganggu teman,' .             // ganggu teman belajar
                    'lempar kertas,buang kertas,' .                // tidak fokus
                    'mainan handphone,pegang handphone,' .         // HP saat pelajaran
                    'tidak perhatian,tidak memperhatikan,' .       // tidak perhatian
                    'tidak hadir pelajaran',                       // absen mapel

                'negatable'        => false,
                'counterpart_kode' => null,
                'negation_notes'   => null,
            ],

            // ══════════════════════════════════════════════
            // P006 — Etika Sikap | 2 Poin
            // Tindakan: Istighfar 50x dan Menyampaikan Motivasi Adab
            //
            // NEGATION: YA → flip ke A001 (Tindakan/Perilaku)
            // "Tidak membantah", "tidak melawan", "tidak bersikap
            // tidak sopan" = santun/beradab → A001 (perilaku positif).
            // ══════════════════════════════════════════════
            [
                'kode'             => 'P006',
                'kategori'         => 'etika_sikap',
                'poin'             => 2,
                'tindakan'         => 'Istighfar 50x dan Menyampaikan Motivasi Adab',

                'kamus_kata'       =>
                    'bantah,membantah,dibantah,' .                 // bantah guru
                    'melawan,memberontak,' .                       // melawan
                    'nyolot,menjawab,' .                           // slang kurang ajar
                    'buang muka,acuh tak acuh,' .                  // tidak hormat
                    'tidak salam,tidak hormat,' .                  // tidak salam
                    'tidak sopan,kurang sopan,' .                  // tidak sopan
                    'kurang ajar,tidak santun,' .                  // kurang ajar
                    'bentak,membentak,' .                          // membentak guru
                    'hardik,mengardik,' .                          // mengardik
                    'tidak patuh,tidak taat,' .                    // tidak patuh aturan
                    'membantah perintah,menolak perintah,' .       // menolak perintah guru
                    'tidak menghormati,tidak menghargai,' .        // tidak menghormati
                    'attitude,perilaku buruk,' .                   // attitude negatif
                    'diam saja saat ditegur',                      // diam acuh

                'negatable'        => true,
                'counterpart_kode' => 'A001',
                // Logika: "tidak membantah/melawan" = patuh/sopan → A001
                'negation_notes'   => '"tidak membantah/melawan/tidak sopan" = beradab/santun → flip ke A001 (Tindakan/Perilaku positif = adab baik)',
            ],

            // ══════════════════════════════════════════════
            // P007 — Aturan Umum | 2 Poin
            // Tindakan: Istighfar 50x, Menyampaikan Motivasi
            //
            // NEGATION: TIDAK — pelanggaran aturan umum terlalu luas
            // untuk di-flip ke apresiasi tertentu. Konteksnya sangat
            // beragam sehingga negasi tidak reliable.
            // ══════════════════════════════════════════════
            [
                'kode'             => 'P007',
                'kategori'         => 'aturan_umum',
                'poin'             => 2,
                'tindakan'         => 'Istighfar 50x, Menyampaikan Motivasi',

                'kamus_kata'       =>
                    'serobot,menyerobot,antrian,' .                // serobot antrian
                    'buang sampah sembarangan,' .                  // sampah sembarangan
                    'melanggar aturan,pelanggaran aturan,' .       // melanggar aturan
                    'tanpa izin,tidak izin,' .                     // tidak izin
                    'prosedur salah,prosedur tidak benar,' .       // prosedur
                    'menerobos,menerobos batas,' .                 // menerobos
                    'tidak tertib,tidak teratur,' .                // tidak tertib
                    'baris tidak rapi,berbaris,' .                 // tidak baris
                    'masuk tanpa izin,keluar tanpa izin,' .        // izin keluar masuk
                    'tidak mengikuti,tidak mematuhi,' .            // tidak mengikuti aturan
                    'gadget,handphone saat terlarang,' .           // HP tanpa izin
                    'bawa barang terlarang,' .                     // barang dilarang
                    'keluar area,meninggalkan pondok,' .           // keluar area tanpa izin
                    'tidak apel,tidak upacara',                    // tidak mengikuti apel

                'negatable'        => false,
                'counterpart_kode' => null,
                'negation_notes'   => null,
            ],

            // ══════════════════════════════════════════════
            // P008 — Rokok | 20 Poin
            // Tindakan: Menulis Alquran Juz 30, Motivasi 1 Minggu
            //
            // NEGATION: TIDAK — pelanggaran berat, tidak ada
            // counterpart apresiasi. "Tidak merokok" adalah
            // kewajiban, bukan prestasi yang di-apresiasi.
            // ══════════════════════════════════════════════
            [
                'kode'             => 'P008',
                'kategori'         => 'rokok',
                'poin'             => 20,
                'tindakan'         => 'Menulis Alquran Juz 30, Menyampaikan Motivasi Selama 1 Minggu',

                'kamus_kata'       =>
                    'rokok,merokok,ngrokok,ngerokok,' .            // kata dasar dan slang
                    'nyebat,nyebat rokok,' .                       // slang santri
                    'isap rokok,menghisap rokok,' .                // menghisap
                    'bakar rokok,membakar rokok,' .                // membakar rokok
                    'vape,ngevape,vaping,' .                       // rokok elektrik
                    'bau rokok,bau asap,' .                        // bau rokok
                    'korek,membawa korek,' .                       // membawa korek
                    'pegang rokok,bawa rokok,' .                   // membawa rokok
                    'asap rokok,asap tembakau,' .                  // asap
                    'tembakau,cerutu,cengkeh,' .                   // jenis rokok
                    'puntung rokok,bekas rokok,' .                 // bekas rokok
                    'sigaret,kretek',                              // jenis rokok formal

                'negatable'        => false,
                'counterpart_kode' => null,
                'negation_notes'   => null,
            ],

            // ══════════════════════════════════════════════
            // P009 — NAPZA | 200 Poin
            // Tindakan: Dikeluarkan
            //
            // NEGATION: TIDAK — pelanggaran paling berat, kasus
            // kriminal. Tidak ada counterpart apresiasi.
            // ══════════════════════════════════════════════
            [
                'kode'             => 'P009',
                'kategori'         => 'napza',
                'poin'             => 200,
                'tindakan'         => 'Dikeluarkan',

                'kamus_kata'       =>
                    'narkoba,memakai narkoba,' .                   // narkoba
                    'miras,minuman keras,' .                       // miras
                    'alkohol,minum alkohol,' .                     // alkohol
                    'mabuk,kemabukan,' .                           // mabuk
                    'teler,terkapar,' .                            // slang mabuk berat
                    'pil koplo,obat terlarang,' .                  // pil koplo
                    'sabu,sabu-sabu,kokain,' .                     // jenis narkoba
                    'ganja,mariyuana,' .                           // ganja
                    'obat keras,konsumsi zat,' .                   // zat berbahaya
                    'bawa narkoba,simpan narkoba,' .               // membawa
                    'pengedar,mengedarkan,' .                      // edar narkoba
                    'bau alkohol,napas alkohol,' .                 // bau alkohol
                    'zat adiktif,napza',                           // formal

                'negatable'        => false,
                'counterpart_kode' => null,
                'negation_notes'   => null,
            ],

            // ══════════════════════════════════════════════
            // P010 — Kabur | 10 Poin
            // Tindakan: Menulis Al Quran Surah Al Baqoroh, 2 Minggu
            //
            // NEGATION: TIDAK — kabur dari pondok adalah tindakan
            // serius. Tidak ada counterpart apresiasi.
            // ══════════════════════════════════════════════
            [
                'kode'             => 'P010',
                'kategori'         => 'kabur',
                'poin'             => 10,
                'tindakan'         => 'Menulis Al Quran Surah Al Baqoroh, Menyampaikan Motivasi Selama 2 Minggu',

                'kamus_kata'       =>
                    'kabur,kabur dari pondok,' .                   // kata dasar
                    'melarikan diri,melarikan,' .                  // melarikan diri
                    'minggat,lari dari asrama,' .                  // slang
                    'loncat pagar,melompat pagar,' .               // cara kabur
                    'pulang tanpa izin,' .                         // pulang tanpa izin
                    'pergi tanpa izin,keluar tanpa izin,' .        // keluar tanpa izin
                    'hilang dari asrama,tidak ada,' .              // tidak ditemukan
                    'mangkir dari pondok,' .                       // tidak kembali ke pondok
                    'bolos pondok,tidak kembali,' .                // tidak kembali
                    'sembunyi,bersembunyi di luar,' .              // sembunyi di luar
                    'lompat tembok,panjat tembok,' .               // cara kabur via tembok
                    'tidak ada kabar,menghilang',                  // tiba-tiba menghilang

                'negatable'        => false,
                'counterpart_kode' => null,
                'negation_notes'   => null,
            ],

            // ══════════════════════════════════════════════
            // P011 — Pacaran | 20 Poin
            // Tindakan: Menulis Al Quran Surah Al Baqoroh, 2 Minggu
            //
            // NEGATION: TIDAK — pelanggaran moral/agama. Tidak ada
            // counterpart apresiasi karena "tidak pacaran" adalah
            // kewajiban, bukan prestasi.
            // ══════════════════════════════════════════════
            [
                'kode'             => 'P011',
                'kategori'         => 'pacaran',
                'poin'             => 20,
                'tindakan'         => 'Menulis Al Quran Surah Al Baqoroh, Menyampaikan Motivasi Selama 2 Minggu',

                'kamus_kata'       =>
                    'pacaran,berpacaran,' .                        // kata dasar
                    'pacar,punya pacar,' .                         // pacar
                    'surat cinta,kirim surat cinta,' .             // surat cinta
                    'berduaan,berdua dua,' .                       // berduaan
                    'mojok,pergi mojok,' .                         // mojok
                    'pegangan tangan,pegang tangan,' .             // kontak fisik
                    'pelukan,berpelukan,' .                        // pelukan
                    'khalwat,berkhalwat,' .                        // istilah agama
                    'ketemuan pacar,ketemu pacar,' .               // bertemu pacar
                    'chat mesra,pesan mesra,' .                    // komunikasi mesra
                    'janjian pacar,kencan,' .                      // kencan
                    'gombal,rayuan,' .                             // rayuan
                    'jadian,putus,' .                              // status hubungan
                    'ngobrol mesra,bicara mesra,' .                // mesra
                    'foto berdua,selfie berdua',                   // foto berdua

                'negatable'        => false,
                'counterpart_kode' => null,
                'negation_notes'   => null,
            ],

            // ══════════════════════════════════════════════
            // P012 — Senjata Tajam | 10 Poin
            // Tindakan: Menulis Al Quran Juz 29, Motivasi 1 Minggu
            //
            // NEGATION: TIDAK — membawa senjata tajam adalah
            // tindakan berbahaya. Tidak ada counterpart apresiasi.
            // ══════════════════════════════════════════════
            [
                'kode'             => 'P012',
                'kategori'         => 'senjata_tajam',
                'poin'             => 10,
                'tindakan'         => 'Menulis Al Quran Juz 29, Menyampaikan Motivasi Selama 1 Minggu',

                'kamus_kata'       =>
                    'senjata,bawa senjata,' .                      // senjata
                    'pisau,bawa pisau,' .                          // pisau
                    'clurit,bawa clurit,' .                        // clurit
                    'silet,bawa silet,' .                          // silet
                    'cutter,bawa cutter,' .                        // cutter
                    'benda tajam,bawa benda tajam,' .              // benda tajam
                    'golok,bawa golok,' .                          // golok
                    'celurit,ganco,' .                             // variasi clurit
                    'tusuk,menusuk,ditusuk,' .                     // menusuk
                    'bacok,membacok,dibacok,' .                    // membacok
                    'melukai dengan benda,' .                      // melukai dengan benda
                    'ancam pisau,ancam senjata,' .                 // ancam pakai senjata
                    'simpan senjata,menyimpan pisau',              // menyimpan senjata

                'negatable'        => false,
                'counterpart_kode' => null,
                'negation_notes'   => null,
            ],

            // ══════════════════════════════════════════════
            // P013 — Kesehatan | 2 Poin
            // Tindakan: Merapikan UKS, Mengontrol Anak Sakit 1 Hari
            //
            // NEGATION: YA → flip ke A001 (Tindakan/Perilaku)
            // "Tidak pura-pura sakit", "kamar bersih", "tidak jorok" =
            // menjaga kebersihan dan kesehatan diri → perilaku positif (A001).
            // ══════════════════════════════════════════════
            [
                'kode'             => 'P013',
                'kategori'         => 'kesehatan',
                'poin'             => 2,
                'tindakan'         => 'Merapikan UKS, Mengontrol Anak Sakit Selama 1 Hari',

                'kamus_kata'       =>
                    'kamar jorok,kamar kotor,' .                   // dari dokumen
                    'kasur kotor,kasur tidak rapi,' .              // kasur
                    'lemari bau,lemari kotor,' .                   // lemari
                    'tidak piket,malas piket,' .                   // tidak piket kamar
                    'pura pura sakit,bohong sakit,' .              // pura-pura sakit
                    'alasan sakit,berpura sakit,' .                // alasan sakit
                    'kamar tidak bersih,tidak mandi,' .            // kebersihan diri
                    'bau badan,bau tidak sedap,' .                 // kebersihan diri
                    'baju kotor dipakai,tidak ganti baju,' .       // kebersihan baju
                    'tidak sikat gigi,gigi tidak bersih,' .        // kebersihan gigi
                    'tempat tidur berantakan,' .                   // tempat tidur
                    'jorok,kekotoran,najis,' .                     // jorok
                    'sampah dikamar,sampah tidak dibuang,' .       // sampah kamar
                    'tidak merawat diri,tidak menjaga diri',       // tidak merawat

                'negatable'        => true,
                'counterpart_kode' => 'A001',
                // Logika: "tidak jorok/pura-pura sakit" = menjaga diri → A001
                'negation_notes'   => '"tidak jorok/tidak kotor/tidak pura-pura sakit" = menjaga kebersihan diri → flip ke A001 (Tindakan/Perilaku positif = kebersihan diri)',
            ],

            // ══════════════════════════════════════════════
            // P014 — Bahasa | 2 Poin
            // Tindakan: Istighfar 50x, Menghafal 5 Mufradat Baru
            //
            // NEGATION: YA → flip ke A003 (Linguistik/Ucapan)
            // "Tidak berkata kasar", "tidak memaki" = santun dalam
            // berbahasa → langsung masuk A003 (Linguistik/Ucapan positif).
            // ══════════════════════════════════════════════
            [
                'kode'             => 'P014',
                'kategori'         => 'bahasa',
                'poin'             => 2,
                'tindakan'         => 'Istighfar 50x, Menghafal 5 Mufradat Baru Bahasa Arab',

                'kamus_kata'       =>
                    'kasar,berkata kasar,' .                       // berkata kasar
                    'makian,memaki,dimaki,' .                      // memaki
                    'kata kotor,bicara kotor,' .                   // kata kotor
                    'mengumpat,umpatan,' .                         // mengumpat
                    'teriak kasar,teriak marah,' .                 // teriak
                    'caci,mencaci,cacian,' .                       // cacian
                    'hinaan,menghina dengan kata,' .               // menghina via kata
                    'sumpah serapah,sumpah kotor,' .               // sumpah serapah
                    'kata anjing,kata babi,' .                     // dari dokumen
                    'kata tidak pantas,tidak pantas,' .            // tidak pantas
                    'bahasa tidak baik,bahasa buruk,' .            // bahasa buruk
                    'celaan,mencela,' .                            // celaan
                    'jotos verbal,menyindir,' .                    // sindiran kasar
                    'julukan buruk,panggilan kasar',               // panggilan buruk

                'negatable'        => true,
                'counterpart_kode' => 'A003',
                // Logika: "tidak berkata kasar/memaki" = sopan berbicara → A003
                'negation_notes'   => '"tidak berkata kasar/memaki/mengumpat" = santun berbahasa → flip ke A003 (Linguistik/Ucapan positif)',
            ],
        ];
    }
}