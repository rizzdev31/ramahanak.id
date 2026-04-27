<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * VariabelKonselorSeeder
 *
 * Menyeed 19 variabel konselor (G001–G019) sesuai dokumen:
 * "Isi_Semua_Variable.docx" + "Kamus_Kata_Knowladge.docx"
 *
 * ════════════════════════════════════════════════════════════
 * STRUKTUR TABEL variabel_konselor
 * ════════════════════════════════════════════════════════════
 *
 * id                    — auto increment
 * kode                  — G001..G019 (unique, max 10 char)
 * gangguan_mental       — nama gangguan (max 150 char)
 * kamus_kata            — comma-separated, diproses Python
 * rekomendasi           — tindakan awal BK (text)
 * manual_correction_count — default 0 (dari migration learning)
 * last_corrected_at     — nullable timestamp
 * created_at, updated_at
 *
 * ════════════════════════════════════════════════════════════
 * POSISI G-CODE DALAM PIPELINE SISTEM
 * ════════════════════════════════════════════════════════════
 *
 * Python NLP: teks laporan → kamus_kata matching → G-code terdeteksi
 *   ↓
 * Hasil preprocessing: kode_konselor[] disimpan ke riwayat_santri
 *   ↓
 * ForwardChainingService: query riwayat_santri
 *   WHERE kode IN (premise[]) GROUP BY santri_id
 *   HAVING COUNT(DISTINCT kode) = jumlah_premise
 *   ↓
 * Jika semua premise terpenuhi → LaporanExpertSystemKonselor dibuat
 *
 * ════════════════════════════════════════════════════════════
 * NEGATION: TIDAK ADA (by design)
 * ════════════════════════════════════════════════════════════
 *
 * Konselor (G-codes) tidak menggunakan negation flip.
 * - Model tidak memiliki field negatable/counterpart_kode
 * - Python query: SELECT kode, kamus_kata FROM variabel_konselor
 *   (tanpa negatable, counterpart_kode)
 * - Alasan: konteks psikologis/emosional tidak bisa di-negasi
 *   secara simpel. "Tidak cemas" bukan apresiasi.
 *   BK yang menginterpretasi context.
 *
 * ════════════════════════════════════════════════════════════
 * FREKUENSI G-CODE DALAM RULES (PRIORITAS KAMUS KATA)
 * ════════════════════════════════════════════════════════════
 *
 * G010: 13 rules ← PALING KRITIS (hampir semua rule korban)
 * G003:  6 rules ← Depresi (banyak overlap rule)
 * G004:  5 rules ← Stress akademik
 * G015:  5 rules ← Identitas
 * G017:  5 rules ← Emosi
 * G018:  5 rules ← Keluarga
 * G001:  4 rules ← Kecemasan umum
 * G009:  4 rules ← Kesepian
 * G011:  4 rules ← Kecanduan
 * G006:  3 rules ← Konsentrasi
 * G007:  3 rules ← Rendah diri
 * G012:  3 rules ← Tidur
 * G013:  3 rules ← Demotivasi
 * G005:  2 rules ← Kelelahan
 * G008:  2 rules ← Overthinking
 * G014:  2 rules ← Perfeksionisme
 * G019:  1 rule  ← Makan
 * G002:  0 rules (hanya deteksi langsung)
 * G016:  0 rules (hanya deteksi langsung)
 *
 * ════════════════════════════════════════════════════════════
 * STRATEGI KAMUS KATA
 * ════════════════════════════════════════════════════════════
 *
 * 1. Filter Python: min 4 karakter, skip SKIP_WORDS
 *    SKIP_WORDS = ['tidak','bukan','yang','dan','atau','ada',
 *                  'itu','ini','apa','siapa','di','ke','dari',
 *                  'untuk','pada','sangat','sekali','lebih','kurang']
 *
 * 2. Confidence scoring: panjang kata ≥7 char mendapat boost 0.3
 *    → Prioritaskan kata panjang, spesifik, kontekstual
 *
 * 3. Stemmer Sastrawi: kata dasar + variasi prefiks penting
 *    karena stemmer tidak selalu sempurna
 *
 * 4. Per G-code: sertakan SEMUA kata dokumen + ekspansi mendalam
 *    dengan sinonim psikologis, slang santri, frasa yang sering
 *    muncul di laporan BK pesantren
 *
 * 5. G-code dengan frekuensi tinggi di rules mendapat lebih banyak
 *    kata agar deteksi lebih sensitif (coverage lebih luas)
 */
class VariabelKonselorSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('');
        $this->command->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        $this->command->info('  SEEDER: Variabel Konselor G001–G019');
        $this->command->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        $this->command->info('');
        $this->command->info('  Catatan: G-codes TIDAK menggunakan negation logic.');
        $this->command->info('  Kolom manual_correction_count otomatis default 0.');
        $this->command->info('');

        $data = $this->getData();

        $inserted = 0;
        $updated  = 0;

        foreach ($data as $item) {
            $exists = DB::table('variabel_konselor')
                ->where('kode', $item['kode'])
                ->exists();

            DB::table('variabel_konselor')->updateOrInsert(
                ['kode' => $item['kode']],
                array_merge($item, [
                    'updated_at' => now(),
                    'created_at' => $exists ? DB::raw('created_at') : now(),
                ])
            );

            $freq = $this->ruleFrequency()[$item['kode']] ?? 0;
            $star = $freq >= 10 ? ' ★★★' : ($freq >= 5 ? ' ★★' : ($freq >= 2 ? ' ★' : ''));
            $label = $exists ? 'Updated ' : 'Inserted';
            $this->command->line(
                "  {$label}  {$item['kode']} — {$item['gangguan_mental']} ({$freq} rules){$star}"
            );

            if ($exists) $updated++;
            else $inserted++;
        }

        $this->command->info('');
        $this->command->info("  ✅ Selesai: {$inserted} inserted, {$updated} updated");
        $this->command->info('  ★★★ = G010 (13 rules), ★★ = 5+ rules, ★ = 2+ rules');
        $this->command->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }

    private function ruleFrequency(): array
    {
        return [
            'G001' => 4,  'G002' => 0,  'G003' => 6,  'G004' => 5,
            'G005' => 2,  'G006' => 3,  'G007' => 3,  'G008' => 2,
            'G009' => 4,  'G010' => 13, 'G011' => 4,  'G012' => 3,
            'G013' => 3,  'G014' => 2,  'G015' => 5,  'G016' => 0,
            'G017' => 5,  'G018' => 5,  'G019' => 1,
        ];
    }

    // ──────────────────────────────────────────────────────────
    // DATA
    // ──────────────────────────────────────────────────────────

    private function getData(): array
    {
        return [

            // ══════════════════════════════════════════════════════
            // G001 — Gangguan Kecemasan Umum | 4 rules
            // Rules: RA-01, RA-03, RA-06, RC-07
            // Context: Dipakai bersama G012 (tidur), P010 (kabur), P012 (senjata)
            // → Santri yang cemas sekaligus sulit tidur / kabur / bawa senjata
            // ══════════════════════════════════════════════════════
            [
                'kode'           => 'G001',
                'gangguan_mental' => 'Gangguan Kecemasan Umum',
                'rekomendasi'    =>
                    'Lakukan pendekatan empatik dan bangun rasa aman terlebih dahulu. ' .
                    'Latihkan teknik pernapasan dalam (4-7-8) dan grounding (5 indra). ' .
                    'Pantau gejala fisik (keringat dingin, jantung berdebar). ' .
                    'Jadwalkan sesi konseling rutin mingguan. ' .
                    'Jika gejala berlangsung >2 minggu, pertimbangkan rujukan ke psikolog.',

                // Dari dokumen + ekspansi mendalam
                // Fokus: kata yang SPESIFIK menunjukkan kecemasan umum
                // (bukan fobia spesifik = G002)
                'kamus_kata'     =>
                    // Kata dasar dari dokumen
                    'cemas,kecemasan,mencemasi,' .
                    'gelisah,kegelisahan,digelisahkan,' .
                    'gugup,kegugupan,' .
                    'khawatir,kekhawatiran,mengkhawatirkan,' .
                    'waswas,penuh waswas,' .
                    'takut,ketakutan,' .                        // umum (beda dengan G002=fobia spesifik)
                    'tegang,ketegangan,' .
                    'panik,kepanikan,' .
                    'keringat dingin,' .
                    'gemetar,bergemetar,' .
                    'degdegan,jantung berdebar,berdebar,' .
                    'resah,keresahan,' .
                    // Ekspansi slang santri dan variasi
                    'nervous,grogi,' .
                    'overthinking,' .                           // overlap G008 tapi juga G001
                    'was-was,rasa takut,' .
                    'tidak tenang,tidak nyaman,' .
                    'pikiran negatif,bayangan buruk,' .
                    'mual karena cemas,perut mulas,' .
                    'sakit kepala cemas,pusing gelisah,' .
                    'tidak bisa santai,sulit rileks,' .
                    'selalu waspada,siaga berlebihan,' .
                    'tidak berani,takut mencoba,' .
                    'demam panggung,takut tampil,' .
                    'susah tidur karena cemas,' .               // berbeda G012 (insomnia murni)
                    'jantung berdetak kencang,' .
                    'napas sesak,sesak napas cemas,' .
                    'tangan gemetar,kaki gemetar,' .
                    'gelisah terus,tidak bisa diam,' .
                    'rasa bahaya,ancaman tidak nyata,' .
                    'firasat buruk,perasaan tidak enak',

            ],

            // ══════════════════════════════════════════════════════
            // G002 — Gangguan Kecemasan Khusus (Fobia) | 0 rules
            // Context: Deteksi langsung, belum ada rule yang menggunakannya.
            // Tetap penting untuk dideteksi BK agar terpantau.
            // ══════════════════════════════════════════════════════
            [
                'kode'           => 'G002',
                'gangguan_mental' => 'Gangguan Kecemasan Khusus',
                'rekomendasi'    =>
                    'Identifikasi pemicu fobia spesifik (objek/situasi) yang membuat santri takut. ' .
                    'Jangan paksa santri menghadapi ketakutannya sekaligus. ' .
                    'Gunakan teknik desensitisasi bertahap (exposure gradual). ' .
                    'Catat situasi/objek apa yang memicu reaksi panik fisik. ' .
                    'Rujuk ke psikolog jika mengganggu aktivitas keseharian.',

                // Fokus: FOBIA SPESIFIK (benda/situasi tertentu)
                // Beda G001 = kecemasan umum tanpa objek spesifik
                'kamus_kata'     =>
                    // Kata dasar dari dokumen
                    'fobia,fobik,' .
                    'takut ketinggian,takut tinggi,' .
                    'takut gelap,takut kegelapan,' .
                    'takut sempit,claustrophobia,' .
                    'takut darah,takut lihat darah,' .
                    'takut jarum,takut suntikan,takut disuntik,' .
                    'takut hewan,takut serangga,' .
                    'takut keramaian,takut kerumunan,' .
                    'menghindar,menghindari,' .
                    'menggigil melihat,gemetar karena,' .
                    'pucat ketakutan,pucat melihat,' .
                    'histeris,kehisterisan,' .
                    'menjerit,berteriak ketakutan,' .
                    'lemas ketakutan,pingsan ketakutan,' .
                    // Ekspansi konteks pesantren
                    'takut tempat tertentu,phobia,' .
                    'panik mendadak,serangan panik,' .
                    'panic attack,napas pendek mendadak,' .
                    'takut tampil depan,takut public speaking,' .
                    'takut gelap kamar,tidak mau lampu mati,' .
                    'tidak berani masuk,menolak masuk,' .
                    'trauma tempat,trauma kejadian,' .
                    'reaksi berlebihan,takut berlebihan,' .
                    'menangis karena takut,menolak karena takut,' .
                    'hindari situasi,menghindari tempat,' .
                    'tidak mau sendirian,takut sendiri,' .
                    'tidak berani tidur gelap',

            ],

            // ══════════════════════════════════════════════════════
            // G003 — Gangguan Depresi | 6 rules (PRIORITAS TINGGI)
            // Rules: RA-07, RA-10, RC-06, RC-08, RC-09, RC-10
            // Context: Sering muncul bersama G005 (lelah), G009 (kesepian),
            // G015 (identitas), G017 (emosi), P009 (napza), P010 (kabur)
            // ══════════════════════════════════════════════════════
            [
                'kode'           => 'G003',
                'gangguan_mental' => 'Gangguan Depresi',
                'rekomendasi'    =>
                    'Segera lakukan asesmen risiko (apakah ada pikiran bunuh diri / menyakiti diri). ' .
                    'Pastikan santri tidak sendirian — tunjuk satu teman pendamping (buddy system). ' .
                    'Pastikan kebutuhan dasar terpenuhi (makan, mandi, tidur). ' .
                    'Hubungi orang tua/wali segera untuk dukungan keluarga. ' .
                    'Rujuk ke psikolog/psikiater untuk evaluasi klinis. ' .
                    'Catat dan pantau perubahan mood harian.',

                // Fokus: emosi negatif dalam, kehilangan minat, putus asa
                // SANGAT PENTING: G003 ada di 6 rules → kamus harus luas dan akurat
                'kamus_kata'     =>
                    // Kata dasar dari dokumen
                    'sedih,kesedihan,bersedih,' .
                    'murung,kemuraman,' .
                    'nangis,menangis,menangis sendiri,' .
                    'diam,pendiam,lebih pendiam,' .
                    'putus asa,keputusasaan,tidak ada harapan,' .
                    'hampa,kehampaaan,merasa hampa,' .
                    'kosong,merasa kosong,kekosongan,' .
                    'duka,berduka,' .
                    'kecewa,kekecewaan,mengecewakan,' .
                    'suram,pesimis,pesimisme,' .
                    // Ekspansi mendalam
                    'depresi,terdepresi,' .
                    'tidak semangat,hilang semangat,' .
                    'tidak bergairah,hilang gairah,' .
                    'tidak ada tujuan,tidak mau apa-apa,' .
                    'tidak peduli,apatis,apatisme,' .
                    'menarik diri,mengurung diri,' .
                    'tidak keluar kamar,diam di kamar,' .
                    'tidak mau makan,tidak nafsu makan,' .      // overlap G019 tapi juga G003
                    'tidak mau bicara,membisu,' .
                    'menangis tanpa sebab,tiba-tiba menangis,' .
                    'merasa tidak berharga,merasa tidak berguna,' .
                    'menyalahkan diri,salahkan diri sendiri,' .
                    'tidak mau bangun,malas bangun pagi,' .
                    'hidup tidak berarti,tidak mau hidup,' .
                    'berpikir mati,pikir bunuh diri,' .         // PENTING deteksi dini
                    'ingin menghilang,ingin pergi jauh,' .
                    'badan berat,terasa berat semua,' .
                    'lesu,terpuruk,' .
                    'tidak ada harapan,harapan hilang,' .
                    'dunia kelam,gelap,suram sekali,' .
                    'merasa sendirian,tidak ada yang peduli,' .
                    'tertekan,terbebani,' .
                    'galau,begitu galau,' .                     // slang
                    'down,bad mood terus,moody terus,' .        // slang
                    'patah hati dalam,hancur hati',

            ],

            // ══════════════════════════════════════════════════════
            // G004 — Gangguan Stress Akademik | 5 rules
            // Rules: RA-04, RA-05, RC-02, RC-15, RC-17
            // Context: Sering bersama G006 (konsentrasi), G014 (perfeksionisme)
            // ══════════════════════════════════════════════════════
            [
                'kode'           => 'G004',
                'gangguan_mental' => 'Gangguan Stress Akademik',
                'rekomendasi'    =>
                    'Identifikasi sumber tekanan spesifik (mapel, guru, target nilai, ekspektasi orang tua). ' .
                    'Bantu santri membuat jadwal belajar yang realistis dan terstruktur. ' .
                    'Ajarkan teknik manajemen waktu dan prioritisasi tugas. ' .
                    'Berkoordinasi dengan wali kelas untuk pengurangan beban sementara. ' .
                    'Validasi bahwa hasil usaha lebih penting dari nilai sempurna.',

                // Fokus: tekanan akademik, nilai, tugas, ujian
                'kamus_kata'     =>
                    // Kata dasar dari dokumen
                    'pusing,kepusing,pusing tujuh keliling,' .
                    'sakit kepala karena tugas,kepala berat,' .
                    'tugas banyak,tugas menumpuk,banyak tugas,' .
                    'nilai turun,nilai anjlok,nilai jelek,' .
                    'susah paham,sulit memahami,' .
                    'sulit belajar,tidak bisa belajar,' .
                    'beban belajar,beban tugas,' .
                    'tekanan nilai,tekanan ujian,' .
                    'tuntutan orang tua,target orang tua,' .
                    'ujian besok,ujian tidak siap,' .
                    'gagal ujian,tidak lulus ujian,' .
                    // Ekspansi konteks akademik pesantren
                    'stres sekolah,stres belajar,stress akademik,' .
                    'tidak mengerti pelajaran,tidak paham materi,' .
                    'remedial terus,tidak naik kelas,' .
                    'deadline tugas,tugas belum selesai,' .
                    'pr banyak,pr belum dikerjakan,' .
                    'hafalan tidak masuk,hafalan susah,' .      // khas pesantren
                    'ujian hafalan,setoran hafalan banyak,' .
                    'takut nilai,takut rapot,' .
                    'orang tua marah nilai,dikomplain nilai,' .
                    'peringkat turun,ranking turun,' .
                    'tidak sanggup,tidak mampu akademik,' .
                    'overwhelmed tugas,kewalahan tugas,' .
                    'tidak bisa tidur karena tugas,' .
                    'belajar sampai larut,bergadang belajar,' .
                    'jenuh belajar,bosan belajar terus,' .
                    'pesimis ujian,yakin tidak lulus,' .
                    'frustasi belajar,putus asa belajar',

            ],

            // ══════════════════════════════════════════════════════
            // G005 — Gangguan Kelelahan | 2 rules
            // Rules: RA-11, RC-06
            // Context: Bersama G003 (depresi), P013 (kesehatan)
            // ══════════════════════════════════════════════════════
            [
                'kode'           => 'G005',
                'gangguan_mental' => 'Gangguan Kelelahan',
                'rekomendasi'    =>
                    'Evaluasi jadwal kegiatan harian — apakah terlalu padat. ' .
                    'Pastikan santri mendapat tidur cukup (7-9 jam/malam). ' .
                    'Cek kondisi fisik ke UKS — apakah ada penyakit yang melemahkan. ' .
                    'Berikan izin istirahat sementara dari kegiatan ekstrakurikuler. ' .
                    'Perhatikan pola makan dan hidrasi santri.',

                // Fokus: kelelahan fisik dan mental kronis
                'kamus_kata'     =>
                    // Kata dasar dari dokumen
                    'lelah,kelelahan,sangat lelah,' .
                    'capek,kecapekan,capek sekali,' .
                    'letih,kepenatan,' .
                    'lesu,kelesuan,' .
                    'lunglai,lemas,kelemasan,' .
                    'kantuk,mengantuk,ngantuk,' .
                    'energi habis,kehabisan energi,' .
                    'stamina loyo,stamina habis,' .
                    'tidak bertenaga,tidak ada tenaga,' .
                    // Ekspansi
                    'burnout,kelelahan total,' .
                    'exhausted,kecapaian,' .                    // slang
                    'tidak kuat,tidak sanggup lagi,' .
                    'badan pegal,pegal semua,' .
                    'badan berat,rasanya berat,' .
                    'tidur tidak cukup,tidur kurang,' .
                    'selalu ngantuk,ngantuk terus,' .
                    'mudah lelah,cepat capek,' .
                    'tidak semangat fisik,malas gerak,' .
                    'loyo,loyo banget,' .
                    'tidak ada gairah fisik,badan tidak mau,' .
                    'kelelahan mental,mental fatigue,' .
                    'terlalu banyak kegiatan,kegiatan padat,' .
                    'jadwal padat,tidak ada waktu istirahat,' .
                    'kerja sampai malam,piket sampai malam,' .   // khas pesantren
                    'sering sakit,sering tidak enak badan',

            ],

            // ══════════════════════════════════════════════════════
            // G006 — Gangguan Konsentrasi dan Fokus | 3 rules
            // Rules: RA-05, RB-09, RC-01
            // Context: Bersama G004 (stres akademik), G017 (emosi), P014 (bahasa), P005
            // ══════════════════════════════════════════════════════
            [
                'kode'           => 'G006',
                'gangguan_mental' => 'Gangguan Konsentrasi dan Fokus',
                'rekomendasi'    =>
                    'Minta santri duduk di barisan paling depan di kelas. ' .
                    'Berikan instruksi satu per satu, tidak sekaligus banyak. ' .
                    'Identifikasi penyebab (stres, kurang tidur, kecanduan gadget, ADHD). ' .
                    'Sarankan metode belajar visual dan kinestetik. ' .
                    'Batasi distraksi di jam belajar (HP, kebisingan).',

                // Fokus: kesulitan fokus, melamun, pikiran melantur
                'kamus_kata'     =>
                    // Kata dasar dari dokumen
                    'melamun,lamunan,sering melamun,' .
                    'bengong,sering bengong,' .
                    'tatapan kosong,pandangan kosong,' .
                    'lupa,pelupa,mudah lupa,' .
                    'fokus terpecah,tidak fokus,' .
                    'bingung,kebingungan,' .
                    'lambat respon,respons lambat,' .
                    'telat mikir,lambat berpikir,' .
                    // Ekspansi
                    'susah konsentrasi,tidak bisa konsentrasi,' .
                    'pikiran kemana-mana,pikiran melantur,' .
                    'tidak bisa fokus,susah fokus,' .
                    'distraksi,mudah terdistraksi,' .
                    'tidak nyambung,tidak connect,' .           // slang
                    'pikirannya jauh,pikirannya di tempat lain,' .
                    'tidak memperhatikan,tidak mendengarkan,' .
                    'tidak ingat pelajaran,lupa materi,' .
                    'sering salah dengar,salah tangkap,' .
                    'tidak bisa diam,selalu bergerak,' .
                    'impulsif,bertindak tanpa pikir,' .
                    'hiperaktif,tidak bisa duduk tenang,' .
                    'pikiran berantakan,tidak teratur,' .
                    'sulit mengerjakan,tidak selesai tugas,' .
                    'mengabaikan,tidak merespons,' .
                    'terlihat tidak ada,seperti tidak hadir,' .
                    'sering mengalihkan,sulit tetap pada topik',

            ],

            // ══════════════════════════════════════════════════════
            // G007 — Gangguan Rendah Diri | 3 rules
            // Rules: RA-02, RB-02, RC-04
            // Context: Bersama G009 (kesepian), G013 (demotivasi), P015
            // ══════════════════════════════════════════════════════
            [
                'kode'           => 'G007',
                'gangguan_mental' => 'Gangguan Rendah Diri',
                'rekomendasi'    =>
                    'Berikan apresiasi dan afirmasi positif secara konsisten. ' .
                    'Identifikasi kelebihan dan bakat tersembunyi santri. ' .
                    'Hindari membandingkan dengan teman di depan umum. ' .
                    'Libatkan dalam kegiatan yang sesuai minat agar merasakan keberhasilan. ' .
                    'Bangun kepercayaan diri melalui tugas-tugas kecil yang dapat dicapai.',

                // Fokus: minder, tidak percaya diri, rendah diri
                'kamus_kata'     =>
                    // Kata dasar dari dokumen
                    'malu,pemalu,sangat malu,' .
                    'minder,keminder,' .
                    'merasa bodoh,bodoh banget,' .
                    'merasa jelek,jelek,tidak menarik,' .
                    'tidak mampu,merasa tidak mampu,' .
                    'ragu,keraguan,selalu ragu,' .
                    'menunduk,sering menunduk,' .
                    'sembunyi,bersembunyi,menghindar,' .
                    'insecure,rasa insecure,' .
                    'membandingkan diri,dibanding-bandingkan,' .
                    // Ekspansi
                    'tidak percaya diri,kurang percaya diri,' .
                    'self esteem rendah,harga diri rendah,' .
                    'merasa tidak berguna,tidak berharga,' .
                    'tidak ada kelebihan,tidak punya bakat,' .
                    'selalu kalah,selalu gagal,' .
                    'tidak pantas,tidak layak,' .
                    'orang lain lebih baik,lebih bagus dari saya,' .
                    'takut ditolak,takut tidak diterima,' .
                    'takut dinilai,takut dikritik,' .
                    'tidak berani bicara,takut salah bicara,' .
                    'tidak berani berpendapat,' .
                    'merasa tidak disukai,tidak ada yang suka,' .
                    'menarik diri karena malu,' .
                    'rendah hati berlebihan,terlalu merendah,' .
                    'tidak punya teman dekat karena malu,' .
                    'selalu mengalah,tidak pernah menang,' .
                    'sering minta maaf tanpa alasan,' .
                    'takut jadi pusat perhatian',

            ],

            // ══════════════════════════════════════════════════════
            // G008 — Gangguan Overthinking | 2 rules
            // Rules: RB-08, RC-05
            // Context: Bersama P001, P016 (instrumental aggression) dan P005
            // ══════════════════════════════════════════════════════
            [
                'kode'           => 'G008',
                'gangguan_mental' => 'Gangguan Overthinking',
                'rekomendasi'    =>
                    'Bantu santri mengenali pola pikir berlebihan dan tidak produktif. ' .
                    'Ajarkan teknik journaling (tulis kekhawatiran untuk dikeluarkan dari pikiran). ' .
                    'Latih teknik "stop thought" (hentikan pikiran dengan kata perintah). ' .
                    'Ajarkan perbedaan antara khawatir produktif dan tidak produktif. ' .
                    'Kurangi waktu luang tidak terstruktur yang memicu overthinking.',

                // Fokus: pikiran berputar terus, terlalu analitis, khawatir berlebihan
                'kamus_kata'     =>
                    // Kata dasar dari dokumen
                    'memikirkan terus,pikir terus,' .
                    'terbayang terus,bayang-bayang,' .
                    'takut salah,takut berbuat salah,' .
                    'analisis berlebih,over analisis,' .
                    'rumit dipikirkan,jelimet,' .
                    'khawatir masa depan,khawatir berlebihan,' .
                    // Ekspansi
                    'overthinking,terlalu memikirkan,' .
                    'tidak bisa berhenti pikir,pikiran tidak berhenti,' .
                    'berputar dalam pikiran,pikiran berputar,' .
                    'susah lupakan,tidak bisa melupakan,' .
                    'terobsesi,tidak bisa move on,' .
                    'what if,bagaimana kalau,' .                // pola overthinking
                    'terlalu banyak pertimbangan,pertimbang terus,' .
                    'tidak bisa ambil keputusan,ragu terus,' .
                    'takut konsekuensi,takut akibat,' .
                    'bayangkan hal buruk,pikiran hal terburuk,' .
                    'skenario buruk,skenario negatif,' .
                    'dipikirkan malam,pikir sebelum tidur,' .
                    'tidak produktif berpikir,pikiran muter,' .  // slang
                    'replay kejadian,ulangi kejadian di pikiran,' .
                    'khawatir berulang,cemas berulang,' .
                    'memikirkan pendapat orang,takut dihakimi,' .
                    'tidak bisa istirahat pikiran,pikiran tidak tenang,' .
                    'analisis paralysis,bingung karena terlalu mikir',

            ],

            // ══════════════════════════════════════════════════════
            // G009 — Gangguan Kesepian | 4 rules
            // Rules: RA-02, RA-08, RB-02, RC-08
            // Context: Bersama G007 (rendah diri), P011 (pacaran), P010 (kabur)
            // ══════════════════════════════════════════════════════
            [
                'kode'           => 'G009',
                'gangguan_mental' => 'Gangguan Kesepian',
                'rekomendasi'    =>
                    'Cari satu teman dekat yang bisa jadi pendamping (buddy system). ' .
                    'Libatkan santri dalam kegiatan kelompok kecil yang suportif. ' .
                    'Pantau agar tidak terlalu lama menyendiri di kamar. ' .
                    'Bangun kembali koneksi sosial secara bertahap. ' .
                    'Cari tahu alasan isolasi: dikucilkan teman atau memilih sendiri.',

                // Fokus: terisolasi, tidak punya teman, diasingkan
                'kamus_kata'     =>
                    // Kata dasar dari dokumen
                    'menyendiri,suka sendiri,selalu sendiri,' .
                    'kesepian,rasa sepi,sangat sepi,' .
                    'sunyi,kesunyian,' .
                    'terisolasi,isolasi diri,' .
                    'dikucilkan,terkucilkan,' .
                    'dijauhi,dijauhi teman,' .
                    'dijauhkan,diasingkan,' .
                    // Ekspansi
                    'tidak punya teman,tidak ada teman,' .
                    'tidak ada yang peduli,tidak diperhatikan,' .
                    'sendiri terus,selalu sendirian,' .
                    'tidak diajak,tidak dilibatkan,' .
                    'tidak masuk grup,dikeluarkan grup,' .      // konteks digital
                    'tidak ada yang mau teman,tidak laku,' .
                    'ditinggalkan,teman pergi semua,' .
                    'orang asing,merasa asing,' .
                    'tidak nyambung dengan teman,beda sendiri,' .
                    'tidak ada yang mengerti,tidak dipahami,' .
                    'tidak ada teman bicara,tidak bisa curhat,' .
                    'rindu teman lama,tidak punya teman baru,' .
                    'introvert ekstrem,terlalu tertutup,' .
                    'tidak betah di asrama,ingin sendiri,' .
                    'merasa tidak diterima,tidak dianggap,' .
                    'teman tidak mau dekat,dijauhi semua,' .
                    'makan sendirian,duduk sendiri terus,' .
                    'tidak ada yang telepon,tidak diingat teman',

            ],

            // ══════════════════════════════════════════════════════
            // G010 — Gangguan Bullying | 13 rules (PALING KRITIS ★★★)
            // Rules: RA-01 s.d. RA-12 (semua!), RB-06
            // Context: G010 adalah gerbang utama deteksi korban bullying
            // WAJIB sangat sensitif — kamus kata seluas mungkin
            // ══════════════════════════════════════════════════════
            [
                'kode'           => 'G010',
                'gangguan_mental' => 'Gangguan Bullying',
                'rekomendasi'    =>
                    'PRIORITAS UTAMA: Pastikan keamanan fisik santri segera. ' .
                    'Lakukan asesmen apakah perundungan masih berlangsung. ' .
                    'Dokumentasikan semua kejadian dengan detail (waktu, tempat, pelaku, saksi). ' .
                    'Jangan tinggalkan santri sendirian dengan pelaku. ' .
                    'Hubungi orang tua korban dan pelaku segera. ' .
                    'Aktifkan protokol anti-bullying pondok. ' .
                    'Berikan Psychological First Aid kepada korban.',

                // G010 ADA DI 13 RULES — kamus kata harus PALING LUAS
                // Fokus: semua bentuk perundungan (fisik, verbal, relasional, siber)
                'kamus_kata'     =>
                    // Kata dasar dari dokumen
                    'korban bully,jadi korban,' .
                    'dirundung,perundungan,' .
                    'diejek,ejekan,diolok-olok,' .
                    'dihina,hinaan,dilecehkan,' .
                    'disakiti,disakitin,' .
                    'diancam,ancaman,' .
                    'dipalak,palakan,minta uang paksa,' .
                    'takut teman,takut ke teman,' .
                    // Bully fisik
                    'dipukul teman,ditonjok teman,' .
                    'ditendang teman,didorong teman,' .
                    'dikeroyok,keroyokan,' .
                    'dipukuli,disiksa teman,' .
                    'dijambak,ditampar teman,' .
                    // Bully verbal/psikologis
                    'diolok,diolok-olok,' .
                    'dikata-katain,dihina kata-kata,' .
                    'dipanggil nama jelek,diledek nama,' .
                    'dikomentar jelek,dicela terus,' .
                    'difitnah,disebarkan gosip,' .
                    'dipermalukan,dipermalukan di depan umum,' .
                    // Bully relasional/sosial
                    'dikucilkan sengaja,sengaja dijauhi,' .
                    'tidak diajak bicara,dimusuhi bersama,' .
                    'digosipkan,dibicarakan jelek,' .
                    'dikompori teman lain,diprovokasi,' .
                    'diintimidasi,intimidasi teman,' .
                    // Bully siber (relevan santri zaman sekarang)
                    'dihina online,dihina medsos,' .
                    'dibully chat,dikatain lewat chat,' .
                    'disebarkan foto,foto disebar tanpa izin,' .
                    // Gejala korban
                    'takut berangkat,tidak mau ke kelas,' .
                    'tidak berani melapor,takut melapor,' .
                    'tidak berani bicara ke guru,' .
                    'menangis tidak jelas,menangis karena teman,' .
                    'tidak mau cerita tapi kelihatan sedih,' .
                    'tanda-tanda dipukul,memar,' .
                    'barang hilang,uang diminta paksa,' .
                    'sembunyi dari teman,menghindar teman tertentu,' .
                    'takut istirahat,tidak mau ke kantin,' .
                    'bullying,buli,mem-buli,' .
                    'perundungan verbal,perundungan fisik',

            ],

            // ══════════════════════════════════════════════════════
            // G011 — Gangguan Kecanduan | 4 rules
            // Rules: RC-03, RC-11, RC-12, RC-13
            // Context: Bersama P002 (disiplin), P008 (rokok), P009 (napza)
            // ══════════════════════════════════════════════════════
            [
                'kode'           => 'G011',
                'gangguan_mental' => 'Gangguan Kecanduan',
                'rekomendasi'    =>
                    'Identifikasi jenis kecanduan (gadget/game, rokok, napza). ' .
                    'Untuk napza: lakukan tes urine, hubungi orang tua, dan pertimbangkan rujukan rehabilitasi. ' .
                    'Untuk gadget/game: buat jadwal detoksifikasi bertahap. ' .
                    'Ganti sumber kepuasan dengan aktivitas fisik/hobi positif. ' .
                    'Pantau gejala putus zat (withdrawal) jika kecanduan berat.',

                // Fokus: berbagai jenis kecanduan (gadget, game, rokok, napza)
                'kamus_kata'     =>
                    // Kata dasar dari dokumen
                    'kecanduan,ketagihan,adiksi,' .
                    'ketergantungan,bergantung pada,' .
                    'tidak bisa berhenti,sulit berhenti,' .
                    'terus-menerus,tidak bisa lepas,' .
                    'main game terus,game addict,' .
                    'main hp terus,pegang hp terus,' .
                    'gadget,kecanduan gadget,' .
                    'ponsel,kecanduan ponsel,' .
                    // Kecanduan rokok (overlap P008)
                    'kecanduan rokok,tidak bisa tidak merokok,' .
                    'rokok terus,harus merokok,' .
                    // Kecanduan napza (overlap P009)
                    'kecanduan obat,ketergantungan zat,' .
                    'kecanduan alkohol,harus minum,' .
                    // Ekspansi umum
                    'tidak bisa jauh dari handphone,' .
                    'panik tanpa hp,cemas tanpa gadget,' .
                    'lupa waktu karena game,main game lupa waktu,' .
                    'tidak bisa tidur tanpa hp,' .
                    'gaming disorder,game berlebihan,' .
                    'online terus,internetan terus,' .
                    'medsos terus,scrolling terus,' .
                    'tidak bisa puasa gadget,' .
                    'withdrawal,sakau,' .                       // gejala putus zat
                    'ketagihan judi,judi online,' .
                    'tidak bisa kontrol diri,impulsif konsumsi,' .
                    'mencuri untuk beli,curang untuk dapat,' .
                    'sembunyi merokok,sembunyi main hp',

            ],

            // ══════════════════════════════════════════════════════
            // G012 — Gangguan Tidur | 3 rules
            // Rules: RA-01, RC-07, RC-13
            // Context: Bersama G001 (kecemasan), P013 (kesehatan), P002 (disiplin)
            // ══════════════════════════════════════════════════════
            [
                'kode'           => 'G012',
                'gangguan_mental' => 'Gangguan Tidur',
                'rekomendasi'    =>
                    'Cek jadwal kegiatan — apakah terlalu padat hingga malam. ' .
                    'Terapkan sleep hygiene: matikan lampu, kurangi kebisingan, konsisten jam tidur. ' .
                    'Batasi penggunaan gadget 1 jam sebelum tidur. ' .
                    'Cek apakah ada kecemasan/pikiran yang mengganggu saat ingin tidur. ' .
                    'Jika mimpi buruk berulang, segera konseling mendalam.',

                // Fokus: insomnia, sulit tidur, kualitas tidur buruk
                'kamus_kata'     =>
                    // Kata dasar dari dokumen
                    'sulit tidur,susah tidur,' .
                    'begadang,sering begadang,' .
                    'melek terus,tidak bisa menutup mata,' .
                    'terjaga terus,terjaga di malam,' .
                    'bangun siang,kesiangan karena tidur lambat,' .
                    'tidak lelap,tidur tidak nyenyak,' .
                    'mimpi buruk,sering mimpi buruk,' .
                    'mengigau,igau,ngigau,' .                   // mengigau saat tidur
                    // Ekspansi
                    'insomnia,gangguan tidur,' .
                    'tidak bisa tidur malam,terjaga sepanjang malam,' .
                    'tidur siang terus,malam tidak tidur,' .
                    'pola tidur kacau,jam tidur tidak teratur,' .
                    'ngantuk di kelas karena malam tidak tidur,' .
                    'mata cekung,tampak tidak tidur,' .
                    'tidur sebentar saja,tidur hanya sedikit,' .
                    'sering terbangun,bangun berkali-kali,' .
                    'tidak nyenyak,gelisah saat tidur,' .
                    'berbicara saat tidur,jalan saat tidur,' .  // sleepwalking/sleeptalking
                    'ketindihan,sleep paralysis,' .             // fenomena tidur
                    'takut gelap saat mau tidur,' .
                    'tidak mau tidur cepat,tahan tidur,' .
                    'kepikiran sebelum tidur,pikir banyak waktu mau tidur,' .
                    'bangun terlalu awal,subuh tidak bisa tidur lagi',

            ],

            // ══════════════════════════════════════════════════════
            // G013 — Gangguan Demotivasi Belajar | 3 rules
            // Rules: RB-05, RC-03, RC-04
            // Context: Bersama G011 (kecanduan), G007 (rendah diri), P003, P005
            // ══════════════════════════════════════════════════════
            [
                'kode'           => 'G013',
                'gangguan_mental' => 'Gangguan Demotivasi Belajar',
                'rekomendasi'    =>
                    'Gali akar penyebab demotivasi (bosan, gagal terus, tidak relevan, masalah lain). ' .
                    'Temukan satu mata pelajaran atau aktivitas yang masih diminati. ' .
                    'Buat target belajar sangat kecil dan terukur untuk memulai. ' .
                    'Berikan apresiasi konsisten atas usaha, bukan hanya hasil. ' .
                    'Evaluasi apakah ada masalah di luar akademik yang menghambat motivasi.',

                // Fokus: malas belajar, bosan, kehilangan minat
                'kamus_kata'     =>
                    // Kata dasar dari dokumen
                    'malas,kemalasan,sangat malas,' .
                    'bosan,kebosanan,bosan sekali,' .
                    'jenuh,kejenuhan,' .
                    'enggan,tidak mau,' .
                    'gairah hilang,tidak bergairah,' .
                    'minat hilang,tidak berminat,' .
                    'apatis,sikap apatis,' .
                    'bodoh,merasa bodoh,' .
                    // Ekspansi
                    'tidak semangat belajar,malas belajar,' .
                    'tidak mau sekolah,tidak mau masuk,' .
                    'tidak ada motivasi,motivasi nol,' .
                    'untuk apa belajar,percuma belajar,' .
                    'tidak ada gunanya,sia-sia belajar,' .
                    'tidak mau mengerjakan tugas,abaikan tugas,' .
                    'tidak peduli nilai,nilai tidak penting,' .
                    'tidak mau membaca,tidak mau buka buku,' .
                    'tidak mau mengerjakan pr,' .
                    'tidak ingin ke pondok,tidak betah,' .
                    'ingin berhenti sekolah,ingin keluar,' .
                    'tidak ada cita-cita,tidak punya tujuan,' .
                    'hidup tidak terarah,tidak tahu mau apa,' .
                    'tidak mau apa-apa,pasif total,' .
                    'demotivasi,kehilangan semangat,' .
                    'tidak excited,tidak antusias,' .           // slang
                    'sekolah membosankan,pondok tidak menarik,' .
                    'belajar tidak ada hasilnya,usaha percuma',

            ],

            // ══════════════════════════════════════════════════════
            // G014 — Gangguan Perfeksionisme | 2 rules
            // Rules: RB-12, RC-02
            // Context: Bersama P006 (etika), G004 (stres akademik)
            // ══════════════════════════════════════════════════════
            [
                'kode'           => 'G014',
                'gangguan_mental' => 'Gangguan Perfeksionisme',
                'rekomendasi'    =>
                    'Bantu santri memahami bahwa tidak sempurna adalah normal dan manusiawi. ' .
                    'Ajarkan konsep "done is better than perfect" untuk memulai. ' .
                    'Evaluasi standar diri yang tidak realistis dan sesuaikan. ' .
                    'Berikan apresiasi pada usaha (bukan kesempurnaan hasil). ' .
                    'Pantau apakah perfeksionisme mengarah ke burnout atau kecemasan.',

                // Fokus: standar tidak realistis, takut salah, mengulang terus
                'kamus_kata'     =>
                    // Kata dasar dari dokumen
                    'sempurna,kesempurnaan,harus sempurna,' .
                    'perfect,perfectionist,' .
                    'takut salah,takut membuat kesalahan,' .
                    'mengulang terus,ulangi terus,' .
                    'detail berlebihan,terlalu detail,' .
                    'rinci berlebihan,rinci terus,' .
                    'tidak puas,tidak pernah puas,' .
                    'standar tinggi,standar terlalu tinggi,' .
                    'kritik diri,mengkritik diri terus,' .
                    // Ekspansi
                    'perfeksionis,sifat perfeksionis,' .
                    'tidak boleh salah,harus selalu benar,' .
                    'revisi terus,selalu diperbaiki,' .
                    'tidak selesai karena kurang sempurna,' .
                    'terlalu banyak hapus tulis,' .
                    'tidak percaya hasil sendiri,' .
                    'anxious kalau tidak rapi,' .
                    'malu kalau tidak sempurna,' .
                    'stres kalau ada yang salah kecil,' .
                    'takut dinilai buruk,takut dikritik,' .
                    'tidak kumpul tugas karena belum sempurna,' .
                    'menunda karena belum siap,prokrastinasi,' .
                    'terlalu lama persiapan,tidak pernah siap,' .
                    'sulit delegasi,harus dikerjakan sendiri,' .
                    'lelah karena standar sendiri,' .
                    'overachiever,kerja berlebihan untuk sempurna',

            ],

            // ══════════════════════════════════════════════════════
            // G015 — Gangguan Identitas | 5 rules
            // Rules: RA-12, RB-07, RB-11, RC-10, RC-14
            // Context: Bersama G003 (depresi), G017 (emosi), P008, P011, P012
            // ══════════════════════════════════════════════════════
            [
                'kode'           => 'G015',
                'gangguan_mental' => 'Gangguan Identitas',
                'rekomendasi'    =>
                    'Eksplorasi minat, nilai, dan bakat asli santri melalui dialog terbuka. ' .
                    'Hindari pelabelan negatif atau membandingkan dengan orang lain. ' .
                    'Libatkan dalam kegiatan positif yang membantu pembentukan jati diri. ' .
                    'Diskusikan nilai-nilai Islam sebagai pondasi identitas. ' .
                    'Pantau apakah ikut arus teman karena tekanan sosial.',

                // Fokus: bingung jati diri, ikut-ikutan, labil, tidak punya pendirian
                'kamus_kata'     =>
                    // Kata dasar dari dokumen
                    'bingung siapa diri,bingung identitas,' .
                    'tidak tahu tujuan,tidak punya arah,' .
                    'berubah-ubah,sering berubah,' .
                    'labil,kelabilan,' .
                    'bimbang,kebimbangan,' .
                    'ikut-ikutan,ikutan saja,' .
                    'mengikuti gaya teman,tiruan teman,' .
                    'mengikuti tren,tren berubah terus,' .
                    'meniru,peniru,' .
                    'jati diri,tidak punya jati diri,' .
                    // Ekspansi
                    'tidak punya pendirian,mudah terpengaruh,' .
                    'tidak konsisten,selalu gonta-ganti,' .
                    'identity crisis,krisis identitas,' .
                    'tidak tahu siapa diri sendiri,' .
                    'beda-beda setiap hari,plin-plan,' .        // slang
                    'terpengaruh lingkungan,ikut teman saja,' .
                    'tidak punya nilai diri,kosong,' .
                    'siapa saya,untuk apa saya,' .
                    'ingin jadi orang lain,iri identitas,' .
                    'tidak sesuai diri sendiri,tidak autentik,' .
                    'bingung agama,goyah iman,' .              // konteks pesantren
                    'coba-coba hal baru ekstrem,' .
                    'berganti kelompok terus,pindah geng,' .
                    'tidak loyal,tidak konsisten kesetiaan,' .
                    'mudah dibujuk,mudah diajak hal negatif,' .
                    'tidak punya prinsip,tidak teguh pendirian,' .
                    'gaya hidup berubah drastis,perubahan ekstrem perilaku',

            ],

            // ══════════════════════════════════════════════════════
            // G016 — Gangguan Phobia | 0 rules
            // Context: Deteksi langsung, belum ada rule spesifik.
            // Tetap penting untuk identifikasi dini BK.
            // ══════════════════════════════════════════════════════
            [
                'kode'           => 'G016',
                'gangguan_mental' => 'Gangguan Phobia',
                'rekomendasi'    =>
                    'Identifikasi objek/situasi fobia spesifik dengan cermat. ' .
                    'Jangan paksa atau ledekin santri karena fobianya. ' .
                    'Dokumentasikan reaksi fisik saat terpapar pemicu. ' .
                    'Lakukan desensitisasi sistematis secara bertahap. ' .
                    'Rujuk ke psikolog untuk terapi CBT atau exposure therapy.',

                // Fokus: fobia spesifik (berbeda G002 = kecemasan khusus)
                // G016 lebih ke reaksi fisik ekstrem terhadap pemicu spesifik
                'kamus_kata'     =>
                    // Kata dasar dari dokumen
                    'takut ketinggian,vertigo,phobia ketinggian,' .
                    'takut gelap,tidak mau gelap,' .
                    'takut tempat sempit,claustrophobia,' .
                    'takut darah,pingsan lihat darah,' .
                    'takut jarum,tidak mau suntik,' .
                    'takut hewan,takut binatang,' .
                    'takut tempat tertentu,phobia tempat,' .
                    'jerit ketakutan,menjerit,' .
                    'histeris ketakutan,tidak terkontrol,' .
                    'pingsan karena takut,' .
                    // Ekspansi reaksi fisik ekstrem
                    'lemas mendadak,tiba-tiba lemas,' .
                    'mual ekstrem karena takut,' .
                    'berkeringat banyak karena takut,' .
                    'jantung berdebar ekstrem,serangan jantung karena takut,' .
                    'tidak mau dekat,menjauh ekstrem,' .
                    'phobia,phobic,fobik,' .
                    'takut cermin,takut bayangan,' .
                    'takut makan,phobia makan,' .               // berbeda G019
                    'takut pergi,phobia sosial ekstrem,' .
                    'takut keramaian,panik di keramaian,' .
                    'takut tidur,nyctophobia,' .
                    'takut mati,thanatophobia,' .
                    'reaksi berlebihan pada sesuatu,respon tidak proporsional',

            ],

            // ══════════════════════════════════════════════════════
            // G017 — Gangguan Emosi | 5 rules
            // Rules: RA-09, RB-01, RB-03, RB-09, RC-10
            // Context: Bersama P001 (kekerasan), P003 (vandalisme),
            //          G015 (identitas), G003 (depresi), P014 (bahasa)
            // ══════════════════════════════════════════════════════
            [
                'kode'           => 'G017',
                'gangguan_mental' => 'Gangguan Emosi',
                'rekomendasi'    =>
                    'Ajarkan teknik regulasi emosi: STOP (Stop-Think-Observe-Proceed). ' .
                    'Bantu identifikasi pemicu emosi dan pola ledakan. ' .
                    'Berikan outlet sehat: olahraga, menulis, seni. ' .
                    'Jangan balas amarah dengan amarah — tetap tenang saat berhadapan. ' .
                    'Pantau apakah emosi mengarah ke kekerasan — jika ya, eskalasikan ke kepala.',

                // Fokus: emosi tidak stabil, mudah marah, meledak
                // G017 sering muncul BERSAMA P001 (kekerasan fisik)
                'kamus_kata'     =>
                    // Kata dasar dari dokumen
                    'marah,kemarahan,sangat marah,' .
                    'emosi,emosional,mudah emosi,' .
                    'meledak,meledak-ledak,meledak marah,' .
                    'teriak,berteriak,berteriak marah,' .
                    'banting,membanting,membanting barang,' .
                    'rusak,merusak saat marah,' .
                    'sensi,sensitif,hipersensitif,' .
                    'singgung,tersinggung,mudah tersinggung,' .
                    'mood swing,suasana hati berubah,' .
                    'kesal,kekesalan,' .
                    'benci,kebencian,' .
                    'dendam,memendam dendam,' .
                    // Ekspansi mendalam
                    'emosi tidak stabil,labil emosi,' .
                    'tidak bisa kontrol marah,amarah meledak,' .
                    'cepat marah,gampang marah,' .
                    'marah tanpa alasan jelas,tiba-tiba marah,' .
                    'temperamen,bertemperamen tinggi,' .
                    'frustrasi,frustrasi besar,' .
                    'impulsif,bertindak impulsif,' .
                    'reaktif,sangat reaktif,' .
                    'melempar barang,barang dilempar,' .
                    'membuat kerusakan karena marah,' .
                    'teriak-teriak,mengamuk,' .
                    'moodnya buruk terus,bad mood kronis,' .    // slang
                    'tidak bisa sabar,sabar habis,' .
                    'meluapkan amarah,luapkan marah,' .
                    'lepas kendali,hilang kendali,' .
                    'ngamuk,mengamuk,' .                        // slang Indonesia
                    'tantrum,tantrum dewasa,' .
                    'marah-marah tidak jelas,gampang tersulut,' .
                    'tiba-tiba menangis marah,campur aduk emosi',

            ],

            // ══════════════════════════════════════════════════════
            // G018 — Gangguan Keluarga | 5 rules
            // Rules: RB-03, RC-16, RC-17, RC-18, RC-19
            // Context: Bersama P010 (kabur), P014 (bahasa), P005 (belajar), P002 (waktu)
            // ══════════════════════════════════════════════════════
            [
                'kode'           => 'G018',
                'gangguan_mental' => 'Gangguan Keluarga',
                'rekomendasi'    =>
                    'Jadilah pendengar aktif — beri ruang bercerita tanpa menghakimi. ' .
                    'Jangan paksa santri untuk "mencintai" orang tua di tengah konflik. ' .
                    'Komunikasikan dampak konflik keluarga kepada orang tua secara bijak. ' .
                    'Fokuskan pondok sebagai "rumah kedua" yang aman dan nyaman. ' .
                    'Berikan keringanan akademis jika situasi rumah sedang krisis.',

                // Fokus: masalah keluarga, perceraian, konflik orang tua, rindu
                'kamus_kata'     =>
                    // Kata dasar dari dokumen
                    'rumah,rindu rumah,kangen rumah,' .
                    'orang tua,masalah orang tua,' .
                    'ayah kandung,masalah dengan ayah,' .
                    'bapak,masalah dengan bapak,' .
                    'ibu kandung,masalah dengan ibu,' .
                    'mama,masalah dengan mama,' .
                    'cerai,orang tua cerai,' .
                    'tengkar,bertengkar,orang tua bertengkar,' .
                    'pisah,orang tua pisah,' .
                    'konflik keluarga,masalah keluarga,' .
                    'kangen,sangat kangen,' .
                    'rindu,rindu keluarga,' .
                    'pulang,ingin pulang,' .
                    'kiriman,kiriman belum datang,' .
                    'uang,uang tidak dikirim,' .
                    // Ekspansi konteks pesantren
                    'broken home,keluarga tidak harmonis,' .
                    'tidak harmonis,keluarga bermasalah,' .
                    'tidak betah karena keluarga,' .
                    'kepikiran orang tua,khawatir orang tua,' .
                    'orang tua sakit,orang tua meninggal,' .    // kehilangan
                    'saudara bermasalah,konflik saudara,' .
                    'tidak dapat kiriman,kiriman terlambat,' .
                    'ditinggal orang tua,ditinggal keluarga,' .
                    'merindukan keluarga,kangen adik,' .
                    'ingin bertemu orang tua,minta pulang,' .
                    'komunikasi keluarga buruk,tidak dihubungi,' .
                    'dipindahkan karena masalah rumah,' .
                    'dititipkan terpaksa,tidak mau di pondok,' .
                    'menangis ingat keluarga,' .
                    'homesick,rindu berat rumah,' .
                    'tidak dapat perhatian keluarga,' .
                    'tekanan orang tua,ekspektasi orang tua berlebihan',

            ],

            // ══════════════════════════════════════════════════════
            // G019 — Gangguan Makan | 1 rule
            // Rules: RA-07
            // Context: Bersama G003 (depresi), G010 (bullying korban)
            // ══════════════════════════════════════════════════════
            [
                'kode'           => 'G019',
                'gangguan_mental' => 'Gangguan Makan',
                'rekomendasi'    =>
                    'Monitor berat badan dan pola makan secara diam-diam. ' .
                    'Dampingi santri saat jam makan — usahakan makan bersama teman dekat. ' .
                    'Berikan edukasi tentang hubungan emosi dan pola makan. ' .
                    'Identifikasi apakah gangguan makan karena emosional atau body image. ' .
                    'Rujuk ke dokter/ahli gizi jika berat badan turun drastis atau ada gejala muntah sengaja.',

                // Fokus: gangguan pola makan, tidak mau makan, diet ekstrem
                'kamus_kata'     =>
                    // Kata dasar dari dokumen
                    'makan,tidak mau makan,' .
                    'nafsu makan hilang,nafsu turun,' .
                    'selera makan,tidak selera makan,' .
                    'kurus,sangat kurus,kurus sekali,' .
                    'gemuk,merasa gemuk,gendut,' .
                    'muntah,sering muntah,' .
                    'lapar,tidak mau makan meski lapar,' .
                    'kenyang,pura-pura kenyang,' .
                    'menolak makan,tolak makanan,' .
                    'diet ketat,diet ekstrem,' .
                    'berat badan,berat badan turun,' .
                    // Ekspansi mendalam
                    'anoreksia,anorexia,' .
                    'bulimia,makan banyak lalu muntah,' .
                    'binge eating,makan berlebihan lalu menyesal,' .
                    'tidak makan seharian,skip makan,' .
                    'makan sangat sedikit,porsi makan kecil sekali,' .
                    'takut makan,fobia makan,' .
                    'obsesi berat badan,timbang terus,' .
                    'body dysmorphia,tidak puas dengan tubuh,' .
                    'merasa terlalu gemuk padahal kurus,' .
                    'mengurangi makan sendiri,puasa sendiri,' .
                    'tidak mau makan di depan orang,' .
                    'makan diam-diam,makan sembunyi,' .
                    'kalori berlebihan,hitung kalori terus,' .
                    'pusing karena tidak makan,lemas tidak makan,' .
                    'tidak mau makan di kantin,tidak mau makan bersama,' .
                    'emotional eating,makan karena stres,' .
                    'makan untuk melupakan masalah,' .
                    'mual setiap makan,tidak bisa menelan,' .
                    'makanan terasa tidak enak,semua makanan hambar',

            ],

        ]; // end return array
    }
}