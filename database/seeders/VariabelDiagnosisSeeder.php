<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * VariabelDiagnosisSeeder
 *
 * Menyeed 43 variabel diagnosis (DX-A01–DX-C19) sesuai dokumen:
 * "Isi_Semua_Variable.docx"
 *
 * ════════════════════════════════════════════════════════════
 * STRUKTUR TABEL variabel_diagnosis
 * ════════════════════════════════════════════════════════════
 *
 * id           — auto increment
 * kode         — DX-A01..DX-C19 (unique, max 10 char)
 * diagnosis    — nama klinis diagnosis (max 150 char)
 * penjelasan   — penjelasan kondisi santri (text) ← dari dokumen
 * rekomendasi  — panduan tindakan BK (text)       ← dikembangkan mendalam
 * created_at, updated_at
 *
 * ════════════════════════════════════════════════════════════
 * POSISI DALAM PIPELINE SISTEM
 * ════════════════════════════════════════════════════════════
 *
 * ForwardChainingService::createLaporan():
 *   $diagnosis = VariabelDiagnosis::where('kode', $diagnosisKode)->first();
 *   LaporanExpertSystemKonselor::create([
 *     'diagnosis_kode'       => $diagnosis->kode,
 *     'diagnosis_nama'       => $diagnosis->diagnosis,
 *     'diagnosis_penjelasan' => $diagnosis->penjelasan,
 *     'rekomendasi_sistem'   => $diagnosis->rekomendasi,   ← tampil ke BK
 *   ]);
 *
 * CRITICAL: kode diagnosis harus SAMA PERSIS dengan nilai
 * 'conclusion' di tabel rules_expert_system (FK reference).
 *
 * ════════════════════════════════════════════════════════════
 * KATEGORI DIAGNOSIS
 * ════════════════════════════════════════════════════════════
 *
 * DX-A01..DX-A12 (12): Kategori Korban Dampak (korban bullying)
 * DX-B01..DX-B12 (12): Kategori Pelaku (perilaku agresif/antisosial)
 * DX-C01..DX-C19 (19): Kategori Internal (masalah psikologis individual)
 *
 * ════════════════════════════════════════════════════════════
 * KOREKSI KODE DARI DOKUMEN
 * ════════════════════════════════════════════════════════════
 *
 * Dokumen menggunakan DX-C010..DX-C019 (3 digit angka).
 * Seeder menggunakan DX-C10..DX-C19 (2 digit, konsisten dengan
 * DX-C01..DX-C09). Rules expert system juga menggunakan 2 digit.
 * Kode max 10 char di kolom DB: DX-C10 = 6 char ✅
 *
 * ════════════════════════════════════════════════════════════
 * STRATEGI REKOMENDASI
 * ════════════════════════════════════════════════════════════
 *
 * Penjelasan (dari dokumen) = deskripsi kondisi psikologis santri.
 * Rekomendasi (dikembangkan) = panduan tindakan konkret BK,
 * mencakup:
 *   1. Tindakan SEGERA (first response dalam 24 jam)
 *   2. Pendekatan KONSELING yang sesuai
 *   3. Siapa saja yang perlu DILIBATKAN
 *   4. Langkah MONITORING dan follow-up
 *   5. Kapan perlu RUJUKAN ke profesional
 */
class VariabelDiagnosisSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('');
        $this->command->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        $this->command->info('  SEEDER: Variabel Diagnosis DX-A01–DX-C19');
        $this->command->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        $groups = [
            'DX-A (Korban Dampak)' => $this->dataKorban(),
            'DX-B (Pelaku)'        => $this->dataPelaku(),
            'DX-C (Internal)'      => $this->dataInternal(),
        ];

        $totalInserted = 0;
        $totalUpdated  = 0;

        foreach ($groups as $label => $data) {
            $this->command->info('');
            $this->command->info("  ── {$label} ──");

            foreach ($data as $item) {
                $exists = DB::table('variabel_diagnosis')
                    ->where('kode', $item['kode'])
                    ->exists();

                DB::table('variabel_diagnosis')->updateOrInsert(
                    ['kode' => $item['kode']],
                    array_merge($item, [
                        'updated_at' => now(),
                        'created_at' => $exists ? DB::raw('created_at') : now(),
                    ])
                );

                $status = $exists ? '✎ Updated ' : '✚ Inserted';
                $this->command->line("    {$status}  {$item['kode']} — {$item['diagnosis']}");

                if ($exists) $totalUpdated++;
                else $totalInserted++;
            }
        }

        $total = $totalInserted + $totalUpdated;
        $this->command->info('');
        $this->command->info("  ✅ Selesai: {$total} records ({$totalInserted} inserted, {$totalUpdated} updated)");
        $this->command->info('     DX-A: 12  |  DX-B: 12  |  DX-C: 19');
        $this->command->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }

    // ══════════════════════════════════════════════════════════
    // DX-A: KATEGORI KORBAN DAMPAK (12 diagnosis)
    // Santri sebagai KORBAN bullying dengan dampak psikologis
    // ══════════════════════════════════════════════════════════

    private function dataKorban(): array
    {
        return [
            [
                'kode'       => 'DX-A01',
                'diagnosis'  => 'PTSD Akut (Fisik)',
                'penjelasan' => 'Santri mengalami gejala Gangguan Stres Pasca Trauma (PTSD) akibat kekerasan fisik yang dialami. Ditandai dengan kilas balik kejadian, kecemasan intens saat teringat peristiwa, gangguan tidur, dan respons terkejut berlebihan. Santri merasa tidak aman secara fisik di lingkungan asrama.',
                'rekomendasi' =>
                    "TINDAKAN SEGERA (24 jam pertama):\n" .
                    "• Lakukan Psychological First Aid (PFA): pastikan santri merasa aman, dengarkan tanpa menghakimi, stabilkan emosi sebelum menggali cerita.\n" .
                    "• Jauhkan santri dari pelaku — ubah posisi kamar atau pengaturan kelas jika diperlukan.\n" .
                    "• Laporkan insiden ke pimpinan pondok dan dokumentasikan dengan lengkap.\n\n" .
                    "PENDEKATAN KONSELING:\n" .
                    "• Ajarkan teknik grounding (5 indra: sebutkan 5 benda yang dilihat, 4 yang disentuh, dst) untuk meredakan respons trauma.\n" .
                    "• Latih pernapasan dalam (tarik 4 hitungan, tahan 4, buang 4) sebagai teknik regulasi mandiri.\n" .
                    "• Jangan paksa santri menceritakan detail trauma — biarkan ia bercerita sesuai kesiapannya.\n\n" .
                    "PIHAK YANG DILIBATKAN:\n" .
                    "• Orang tua: hubungi segera, informasikan kondisi santri, minta persetujuan untuk penanganan.\n" .
                    "• Wali asrama: pantau kondisi santri setiap malam, laporkan gejala (mimpi buruk, terbangun malam).\n" .
                    "• Tim medis UKS: cek kondisi fisik dan dokumentasikan cedera.\n\n" .
                    "MONITORING:\n" .
                    "• Sesi konseling 2× seminggu selama minimal 4 minggu.\n" .
                    "• Catat perkembangan gejala: frekuensi kilas balik, kualitas tidur, nafsu makan.\n\n" .
                    "RUJUKAN: Wajib rujuk ke psikolog klinis jika gejala berlanjut lebih dari 1 bulan atau intensitas tinggi.",
            ],
            [
                'kode'       => 'DX-A02',
                'diagnosis'  => 'Social Withdrawal',
                'penjelasan' => 'Santri menarik diri dari lingkungan sosial sebagai dampak bullying yang dialami. Menghindari interaksi dengan teman, menolak bergabung kegiatan bersama, lebih memilih menyendiri, dan kehilangan kepercayaan pada orang-orang di sekitarnya. Harga diri menurun signifikan.',
                'rekomendasi' =>
                    "TINDAKAN SEGERA:\n" .
                    "• Lakukan pendekatan satu-satu di ruang yang nyaman — jangan panggil di depan umum.\n" .
                    "• Tunjukkan empati dulu, baru ajukan pertanyaan: 'Saya perhatikan kamu sepertinya sedang berat — boleh saya menemani?'\n\n" .
                    "PENDEKATAN KONSELING:\n" .
                    "• Bangun kembali kepercayaan diri dengan teknik afirmasi positif spesifik (sebutkan kelebihan nyata santri).\n" .
                    "• Desensitisasi bertahap: mulai dari interaksi 1-1 dengan teman tepercaya, lalu kelompok 2-3 orang, kemudian kelompok lebih besar.\n" .
                    "• Identifikasi satu 'teman aman' yang bisa jadi pendamping (Buddy System).\n\n" .
                    "PIHAK YANG DILIBATKAN:\n" .
                    "• Wali kelas: minta untuk tidak mempermalukan santri saat tidak aktif di kelas, berikan tugas yang bisa dikerjakan mandiri dulu.\n" .
                    "• Teman yang dipercaya: libatkan sebagai Buddy secara informal.\n" .
                    "• Orang tua: informasikan dan minta dukungan emosional dari rumah.\n\n" .
                    "MONITORING:\n" .
                    "• Pantau frekuensi interaksi sosial setiap minggu. Target: dalam 4 minggu santri bisa bergabung kegiatan kelompok kecil.\n" .
                    "• Sesi konseling 1× seminggu dengan laporan perkembangan tertulis.\n\n" .
                    "RUJUKAN: Jika penarikan diri semakin parah (tidak mau makan bersama, tidak bicara sama sekali) > 2 minggu, rujuk ke psikolog.",
            ],
            [
                'kode'       => 'DX-A03',
                'diagnosis'  => 'Flight Response',
                'penjelasan' => 'Santri menunjukkan respons kabur (flight) sebagai mekanisme pertahanan dari ancaman. Kecenderungan melarikan diri dari asrama, tidak mau masuk kelas, atau menghindari situasi yang membuatnya merasa tidak aman. Ini adalah respons naluriah terhadap rasa terancam, bukan kenakalan semata.',
                'rekomendasi' =>
                    "TINDAKAN SEGERA:\n" .
                    "• Validasi perasaan santri terlebih dahulu: 'Wajar kamu merasa tidak aman. Ayo kita cari tahu bersama apa yang membuatmu seperti ini.'\n" .
                    "• Jangan langsung sanksi atas perilaku kabur — gali dulu akar masalahnya.\n" .
                    "• Evaluasi keamanan fisik: area kamar, perjalanan ke kelas, jam istirahat.\n\n" .
                    "PENDEKATAN KONSELING:\n" .
                    "• Peta ancaman: minta santri gambar/sebutkan situasi mana yang paling membuatnya ingin kabur.\n" .
                    "• Buat 'rencana keamanan': jika merasa terancam, santri tahu harus ke mana dan kepada siapa.\n" .
                    "• Latih respons alternatif: alih-alih kabur, santri bisa menghubungi BK atau wali asrama.\n\n" .
                    "PIHAK YANG DILIBATKAN:\n" .
                    "• Orang tua: mediasi untuk memberikan dukungan emosional agar santri tidak merasa sendirian.\n" .
                    "• Keamanan pondok: koordinasikan pengamanan ekstra di titik-titik yang rawan.\n" .
                    "• Wali asrama: briefing tentang kondisi santri agar respons dengan tepat jika santri menghilang.\n\n" .
                    "MONITORING:\n" .
                    "• Check-in harian: BK atau wali asrama konfirmasi keberadaan santri setiap pagi dan malam.\n" .
                    "• Catat frekuensi flight response. Target: 0 kejadian dalam 2 minggu.\n\n" .
                    "RUJUKAN: Jika flight response berulang lebih dari 3× dalam 2 minggu, eskalasikan ke kepala pondok dan pertimbangkan bantuan orang tua untuk tinggal bersama sementara.",
            ],
            [
                'kode'       => 'DX-A04',
                'diagnosis'  => 'School Refusal',
                'penjelasan' => 'Santri secara konsisten menolak atau menghindari menghadiri kegiatan belajar mengajar di pondok. Bisa disertai gejala fisik (sakit perut, mual, pusing) yang muncul saat hari sekolah namun menghilang di akhir pekan. Menunjukkan hubungan kuat antara lingkungan sekolah dengan rasa cemas/takut.',
                'rekomendasi' =>
                    "TINDAKAN SEGERA:\n" .
                    "• Kunjungi UKS/dokter untuk menyingkirkan penyakit fisik organik.\n" .
                    "• Identifikasi pemicu spesifik: apakah guru tertentu, mata pelajaran, teman, atau situasi sosial.\n\n" .
                    "PENDEKATAN KONSELING:\n" .
                    "• Desensitisasi sistematis: mulai dari hadir 30 menit, lalu 1 jam, bertambah secara bertahap.\n" .
                    "• Buat 'peta aman': identifikasi ruang/waktu yang paling nyaman bagi santri di pondok.\n" .
                    "• Teknik relaksasi sebelum masuk kelas: pernapasan, visualisasi positif.\n\n" .
                    "PIHAK YANG DILIBATKAN:\n" .
                    "• Wali kelas: minta untuk tidak menyoroti ketidakhadiran di depan kelas, sambut santri dengan ramah.\n" .
                    "• Guru mata pelajaran terkait: koordinasikan penyesuaian sementara jika pemicu ada di mapel tertentu.\n" .
                    "• Orang tua: jangan justifikasi penghindaran, namun dukung upaya bertahap.\n\n" .
                    "MONITORING:\n" .
                    "• Catat rekam kehadiran harian. Target bertahap: 50% kehadiran di minggu pertama, 75% di minggu kedua, 100% di minggu ketiga.\n\n" .
                    "RUJUKAN: Jika penolakan bertahan > 2 minggu tanpa kemajuan, rujuk ke psikolog untuk terapi CBT.",
            ],
            [
                'kode'       => 'DX-A05',
                'diagnosis'  => 'Cognitive Decline',
                'penjelasan' => 'Penurunan fungsi kognitif santri akibat tekanan mental dari pengalaman bullying sebagai korban. Ditandai dengan kesulitan konsentrasi, penurunan nilai akademik, mudah lupa, dan respons yang lebih lambat dari biasanya. Merupakan dampak neurobiologis dari stres kronis.',
                'rekomendasi' =>
                    "TINDAKAN SEGERA:\n" .
                    "• Kurangi beban akademik sementara: koordinasikan dengan wali kelas untuk penundaan tugas besar.\n" .
                    "• Pastikan santri mendapat istirahat yang cukup — cek jadwal kegiatan pondok apakah terlalu padat.\n\n" .
                    "PENDEKATAN KONSELING:\n" .
                    "• Atasi dahulu akar masalah psikologis (bullying/trauma) yang menjadi penyebab decline.\n" .
                    "• Latih teknik manajemen perhatian: belajar dengan timer Pomodoro (25 menit fokus, 5 menit istirahat).\n" .
                    "• Berikan validasi bahwa penurunan ini sementara dan akan pulih seiring kondisi membaik.\n\n" .
                    "PIHAK YANG DILIBATKAN:\n" .
                    "• Wali kelas dan guru: berikan pendampingan remedial individual, hindari mempermalukan di depan kelas.\n" .
                    "• Orang tua: jelaskan bahwa ini dampak psikologis bukan kemalasan, minta dukungan di rumah.\n\n" .
                    "MONITORING:\n" .
                    "• Pantau nilai akademik setiap 2 minggu sebagai indikator pemulihan.\n" .
                    "• Sesi konseling 1× seminggu fokus pada pemulihan psikologis.\n\n" .
                    "RUJUKAN: Jika decline tidak membaik dalam 1 bulan setelah masalah bullying teratasi, rujuk untuk evaluasi neuropsikologis.",
            ],
            [
                'kode'       => 'DX-A06',
                'diagnosis'  => 'Paranoid Defense',
                'penjelasan' => 'Santri mengembangkan sikap paranoid dan defensif ekstrem akibat merasa terus-menerus terancam oleh lingkungannya. Membawa benda berbahaya untuk perlindungan diri, curiga berlebihan pada orang lain, sulit mempercayai siapapun termasuk guru. Merupakan respons survival terhadap ancaman nyata yang berkepanjangan.',
                'rekomendasi' =>
                    "TINDAKAN SEGERA (PRIORITAS KEAMANAN):\n" .
                    "• Amankan benda berbahaya yang dibawa santri dengan pendekatan persuasif: 'Saya mengerti kamu merasa perlu melindungi diri. Mari kita bicarakan ini dan cari cara yang lebih aman.'\n" .
                    "• JANGAN mempermalukan atau mengkonfrontasi di depan umum — ini bisa memicu krisis.\n" .
                    "• Laporkan segera ke kepala pondok dan aktifkan protokol keamanan.\n\n" .
                    "PENDEKATAN KONSELING:\n" .
                    "• Bangun kepercayaan secara perlahan — jangan paksakan disclosure cepat.\n" .
                    "• Berikan jaminan konkret keamanan: tunjukkan langkah-langkah nyata yang pondok ambil untuk melindunginya.\n" .
                    "• Gali sumber ancaman utama: siapa, kapan, di mana, seberapa sering.\n\n" .
                    "PIHAK YANG DILIBATKAN:\n" .
                    "• Keamanan pondok: tingkatkan patroli di area yang santri anggap berbahaya.\n" .
                    "• Seluruh staf: briefing tentang kondisi santri agar respons dengan tepat.\n" .
                    "• Orang tua: libatkan untuk memberi rasa aman dari sisi keluarga.\n\n" .
                    "MONITORING:\n" .
                    "• Razia barang bawaan secara rutin namun tidak diskriminatif.\n" .
                    "• Check-in harian untuk membangun kepercayaan.\n\n" .
                    "RUJUKAN: Wajib rujuk ke psikolog klinis — paranoia yang disertai benda berbahaya adalah kasus serius.",
            ],
            [
                'kode'       => 'DX-A07',
                'diagnosis'  => 'Depressive Eating',
                'penjelasan' => 'Gangguan pola makan sebagai dampak depresi akibat pengalaman bullying. Santri kehilangan nafsu makan, makan sangat sedikit, atau sebaliknya makan berlebihan sebagai pelarian emosional. Berat badan bisa turun atau naik drastis. Pola makan terkait langsung dengan kondisi emosional.',
                'rekomendasi' =>
                    "TINDAKAN SEGERA:\n" .
                    "• Pantau pola makan santri secara diam-diam — koordinasikan dengan pengurus kantin/dapur pondok.\n" .
                    "• Cek berat badan di UKS sebagai baseline, catat untuk monitoring.\n\n" .
                    "PENDEKATAN KONSELING:\n" .
                    "• Atasi depresi yang mendasari (lihat DX-A) — gangguan makan adalah gejala, bukan akar masalah.\n" .
                    "• Edukasi koneksi emosi-makan: 'Ketika kamu sedih, tubuhmu juga terpengaruh — ini normal, tapi kita perlu menjaga nutrisi.'\n" .
                    "• Buat rutinitas makan bersama teman tepercaya — makan tidak sendirian.\n\n" .
                    "PIHAK YANG DILIBATKAN:\n" .
                    "• Wali asrama: pantau jam makan, pastikan santri hadir dan makan.\n" .
                    "• Pengurus dapur: sediakan makanan yang disukai santri jika memungkinkan.\n" .
                    "• Orang tua: informasikan kondisi dan minta kiriman makanan favorit dari rumah jika perlu.\n\n" .
                    "MONITORING:\n" .
                    "• Timbang berat badan setiap minggu. Target: tidak ada penurunan > 2 kg dalam sebulan.\n" .
                    "• Catat frekuensi makan harian selama 2 minggu.\n\n" .
                    "RUJUKAN: Jika berat badan turun > 5 kg atau ada tanda-tanda muntah sengaja, rujuk ke dokter dan psikolog segera.",
            ],
            [
                'kode'       => 'DX-A08',
                'diagnosis'  => 'Trauma Dependency',
                'penjelasan' => 'Santri mengembangkan ketergantungan berlebihan pada figur tertentu (teman, pacar, atau orang dewasa) sebagai dampak trauma bullying. Ketidakmampuan berfungsi mandiri, kecemasan ekstrem saat sendirian, dan kebutuhan validasi terus-menerus dari figur ketergantungan.',
                'rekomendasi' =>
                    "TINDAKAN SEGERA:\n" .
                    "• Identifikasi figur ketergantungan: siapa yang paling diandalkan santri secara berlebihan?\n" .
                    "• Jangan langsung putuskan akses ke figur tersebut — ini bisa memicu krisis.\n\n" .
                    "PENDEKATAN KONSELING:\n" .
                    "• Latih kemandirian bertahap: mulai dari keputusan-keputusan kecil (memilih menu makan, memilih pakaian).\n" .
                    "• Teknik validasi diri: 'Sebelum bertanya ke orang lain, coba kamu putuskan dulu sendiri — apa yang kamu pikirkan?'\n" .
                    "• Batasi secara bertahap akses ke figur ketergantungan: dari setiap jam, ke setiap beberapa jam, ke sekali sehari.\n\n" .
                    "PIHAK YANG DILIBATKAN:\n" .
                    "• Figur ketergantungan (jika teman): briefing agar tidak terus-menerus available, bantu secara sehat.\n" .
                    "• Wali asrama: dorong santri untuk mencoba hal mandiri sebelum meminta bantuan.\n\n" .
                    "MONITORING:\n" .
                    "• Catat frekuensi meminta bantuan orang lain per hari. Target: berkurang 50% dalam 1 bulan.\n" .
                    "• Sesi konseling mingguan fokus pada penguatan otonomi diri.\n\n" .
                    "RUJUKAN: Jika ketergantungan mengarah ke hubungan yang tidak sehat (khalwat, isolasi), eskalasikan ke kepala pondok.",
            ],
            [
                'kode'       => 'DX-A09',
                'diagnosis'  => 'Reaktif Agresif',
                'penjelasan' => 'Santri korban bullying yang merespons dengan agresi reaktif — membalas kekerasan dengan kekerasan atau menunjukkan ledakan amarah terhadap orang lain. Agresi ini dipicu oleh rasa frustrasi dan ketidakberdayaan akumulatif, bukan karena naluri agresif. Berbeda dengan pelaku primer.',
                'rekomendasi' =>
                    "TINDAKAN SEGERA:\n" .
                    "• Bedakan agresi reaktif (respons terhadap provokasi) dari agresi primer (inisiatif kekerasan).\n" .
                    "• Jangan hukum sama dengan pelaku primer — konteks sangat berbeda.\n\n" .
                    "PENDEKATAN KONSELING:\n" .
                    "• Ajarkan teknik de-eskalasi diri: menghitung mundur 10 detik, menjauh dari situasi, bernapas.\n" .
                    "• Saluran amarah yang sehat: olahraga (futsal, lari), menulis jurnal kemarahan, seni.\n" .
                    "• Edukasi: 'Amarahmu valid — tapi cara menyalurkannya bisa kita ubah bersama.'\n" .
                    "• Tangani trauma underlying yang menjadi sumber frustrasi.\n\n" .
                    "PIHAK YANG DILIBATKAN:\n" .
                    "• Pembina olahraga: libatkan santri dalam kegiatan fisik terstruktur sebagai outlet.\n" .
                    "• Mediasi dengan pihak yang diprovokasi — jika diperlukan dan aman.\n\n" .
                    "MONITORING:\n" .
                    "• Catat insiden agresi reaktif. Target: 0 insiden dalam 3 minggu.\n" .
                    "• Sesi konseling 2× seminggu dengan fokus manajemen amarah.\n\n" .
                    "RUJUKAN: Jika agresi menyebabkan cedera fisik orang lain, proses sesuai aturan pondok namun tetap dengan pendekatan trauma-informed.",
            ],
            [
                'kode'       => 'DX-A10',
                'diagnosis'  => 'Numbing (Zat)',
                'penjelasan' => 'Santri korban bullying yang menggunakan zat (napza, alkohol, rokok berlebihan) sebagai mekanisme pematian rasa (numbing) untuk menghindari rasa sakit emosional. Penggunaan zat adalah pelarian dari trauma, bukan sebagai tujuan utama.',
                'rekomendasi' =>
                    "TINDAKAN SEGERA (PRIORITAS MEDIS):\n" .
                    "• Lakukan tes urine/medis untuk memastikan jenis dan tingkat ketergantungan.\n" .
                    "• Isolasi dari akses zat terlarang segera — periksa kamar dan barang bawaan.\n" .
                    "• Hubungi orang tua segera dan informasikan kondisi.\n\n" .
                    "PENDEKATAN KONSELING:\n" .
                    "• Pahami: zat adalah 'solusi' santri untuk rasa sakit — gali trauma yang melatarbelakangi.\n" .
                    "• Berikan alternatif coping yang sehat untuk mengganti fungsi zat.\n" .
                    "• Jangan hanya fokus pada penghentian zat — atasi trauma underlying-nya.\n\n" .
                    "PIHAK YANG DILIBATKAN:\n" .
                    "• Tim medis: evaluasi kondisi fisik dan kemungkinan gejala putus zat.\n" .
                    "• Orang tua: wajib hadir dan mendukung proses pemulihan.\n" .
                    "• Pimpinan pondok: proses sesuai aturan NAPZA namun dengan pendekatan rehabilitatif.\n\n" .
                    "MONITORING:\n" .
                    "• Pemantauan ketat 24 jam di fase awal.\n" .
                    "• Tes urine berkala setiap 2 minggu selama 3 bulan.\n\n" .
                    "RUJUKAN: WAJIB rujuk ke rehabilitasi atau konselor adiksi profesional — kasus ini butuh penanganan medis di luar kapasitas BK.",
            ],
            [
                'kode'       => 'DX-A11',
                'diagnosis'  => 'Learned Helplessness',
                'penjelasan' => 'Santri telah mengembangkan keyakinan bahwa apapun yang ia lakukan tidak akan mengubah situasinya (ketidakberdayaan yang dipelajari). Menyerah sebelum mencoba, tidak mau merawat diri, apatis terhadap masa depan. Akibat paparan bullying berkepanjangan yang tidak bisa ia hentikan.',
                'rekomendasi' =>
                    "TINDAKAN SEGERA:\n" .
                    "• Pastikan kebutuhan dasar terpenuhi: makan, mandi, tidur — wali asrama pantau dan bantu jika perlu.\n" .
                    "• Jangan harapkan motivasi dulu — mulai dari tindakan kecil yang bisa dilakukan.\n\n" .
                    "PENDEKATAN KONSELING:\n" .
                    "• Teknik 'Langkah Terkecil': berikan tugas sangat kecil yang pasti bisa diselesaikan (rapikan 1 buku, sikat gigi, cuci muka).\n" .
                    "• Rayakan setiap keberhasilan kecil dengan pujian spesifik: 'Kamu tadi bisa rapikan meja — itu nyata dan itu pencapaianmu.'\n" .
                    "• Bangun bukti nyata bahwa tindakan santri bisa mengubah sesuatu — pilih situasi yang controllable.\n\n" .
                    "PIHAK YANG DILIBATKAN:\n" .
                    "• Wali asrama: jadwalkan hygiene routine bersama (mandi, makan, bersih kamar) secara terpimpin.\n" .
                    "• Teman dekat: libatkan untuk menemani aktivitas sehari-hari.\n\n" .
                    "MONITORING:\n" .
                    "• Checklist harian: berhasil mandi, makan 3×, keluar kamar. Target: 80% terpenuhi dalam 1 minggu.\n" .
                    "• Sesi konseling harian singkat (15 menit) di fase awal.\n\n" .
                    "RUJUKAN: Jika kondisi tidak membaik dalam 2 minggu, rujuk ke psikolog — learned helplessness berat memerlukan terapi khusus.",
            ],
            [
                'kode'       => 'DX-A12',
                'diagnosis'  => 'Identity Crisis',
                'penjelasan' => 'Santri korban bullying mengalami krisis identitas — mempertanyakan siapa dirinya, merasa tidak punya jati diri, mudah terpengaruh dan berubah-ubah. Bullying yang menyerang identitas (julukan negatif, label buruk) merusak konsep diri santri secara fundamental.',
                'rekomendasi' =>
                    "TINDAKAN SEGERA:\n" .
                    "• Hentikan pelabelan negatif di lingkungan — briefing seluruh staf untuk tidak menggunakan julukan buruk.\n" .
                    "• Panggil santri selalu dengan nama yang baik dan santun.\n\n" .
                    "PENDEKATAN KONSELING:\n" .
                    "• Eksplorasi minat dan bakat asli: 'Apa yang membuat kamu merasa paling hidup? Apa yang kamu suka lakukan sendiri?'\n" .
                    "• Bantu santri membuat 'kartu identitas positif': 3-5 kalimat tentang dirinya yang autentik.\n" .
                    "• Diskusi nilai-nilai Islam sebagai pondasi identitas yang stabil dan tidak tergantung opini orang lain.\n\n" .
                    "PIHAK YANG DILIBATKAN:\n" .
                    "• Pembina ekskul: libatkan santri dalam kegiatan yang sesuai minatnya untuk menemukan jati diri.\n" .
                    "• Ustadz/Pembina: kajian tentang konsep diri dalam Islam.\n\n" .
                    "MONITORING:\n" .
                    "• Pantau konsistensi perilaku dan pengambilan keputusan — apakah lebih stabil tiap minggunya.\n" .
                    "• Sesi konseling 1× seminggu selama 2 bulan.\n\n" .
                    "RUJUKAN: Jika disertai gejala disosiasi atau perubahan kepribadian ekstrem, rujuk ke psikolog klinis.",
            ],
        ];
    }

    // ══════════════════════════════════════════════════════════
    // DX-B: KATEGORI PELAKU (12 diagnosis)
    // Santri sebagai PELAKU perilaku agresif/antisosial
    // ══════════════════════════════════════════════════════════

    private function dataPelaku(): array
    {
        return [
            [
                'kode'       => 'DX-B01',
                'diagnosis'  => 'IED (Ledakan Amarah)',
                'penjelasan' => 'Intermittent Explosive Disorder: santri mengalami ledakan amarah yang tidak proporsional terhadap pemicunya. Kekerasan fisik atau verbal yang meledak tiba-tiba, diikuti penyesalan. Tidak mampu mengendalikan impuls agresif saat diprovokasi.',
                'rekomendasi' =>
                    "TINDAKAN SEGERA:\n" .
                    "• Jika sedang ledakan: jauhkan dari situasi, beri ruang, jangan konfrontasi langsung saat ia sedang memuncak.\n" .
                    "• Setelah tenang (jeda minimal 30 menit): baru lakukan percakapan.\n\n" .
                    "PENDEKATAN KONSELING:\n" .
                    "• Latih teknik Stop-Think-Act: (1) STOP — diam saat merasa amarah naik, (2) THINK — apa konsekuensinya, (3) ACT — pilih respons yang tepat.\n" .
                    "• Peta pemicu: identifikasi situasi, orang, dan kata-kata yang paling sering memicu ledakan.\n" .
                    "• Teknik fisik: keluar ruangan, cuci muka dengan air dingin, lari 5 menit.\n\n" .
                    "PIHAK YANG DILIBATKAN:\n" .
                    "• Seluruh guru dan staf: briefing tentang cara merespons santri saat ledakan — jangan tantang balik.\n" .
                    "• Orang tua: eksplorasi apakah ada pola amarah serupa di rumah.\n\n" .
                    "MONITORING:\n" .
                    "• Catat frekuensi dan intensitas ledakan. Target: berkurang 50% dalam 1 bulan.\n" .
                    "• Sesi konseling 2× seminggu dengan fokus manajemen amarah.\n\n" .
                    "RUJUKAN: IED adalah kondisi klinis — rujuk ke psikolog/psikiater untuk evaluasi apakah perlu intervensi farmakologis.",
            ],
            [
                'kode'       => 'DX-B02',
                'diagnosis'  => 'Compensatory Bullying',
                'penjelasan' => 'Santri mem-bully orang lain sebagai kompensasi atas rasa rendah diri atau masalah yang tidak bisa ia selesaikan. Membully untuk merasa kuat, dihargai, atau berkuasa saat di aspek lain hidupnya ia merasa kecil. Seringkali ada masalah keluarga atau rasa insecure yang tersembunyi.',
                'rekomendasi' =>
                    "TINDAKAN SEGERA:\n" .
                    "• Pisahkan dari korban — ubah posisi kelas atau kamar jika perlu.\n" .
                    "• Wajibkan permintaan maaf yang tulus kepada korban (tertulis dan lisan).\n\n" .
                    "PENDEKATAN KONSELING:\n" .
                    "• Gali insecurity: 'Di mana kamu merasa paling tidak aman atau tidak dihargai dalam hidupmu?'\n" .
                    "• Bantu menemukan cara mendapatkan rasa berharga yang sehat: prestasi, tanggung jawab, kepemimpinan positif.\n" .
                    "• Berikan tanggung jawab kepemimpinan kecil yang bisa memberinya rasa berkuasa secara sehat.\n\n" .
                    "PIHAK YANG DILIBATKAN:\n" .
                    "• Orang tua: eksplorasi dinamika keluarga — apakah ada penelantaran emosional atau perbandingan berlebihan.\n" .
                    "• Wali kelas: cari momen untuk mengapresiasi santri secara positif di depan teman.\n\n" .
                    "MONITORING:\n" .
                    "• Pantau interaksinya dengan teman — apakah masih ada perilaku bullying.\n" .
                    "• Sesi konseling 1× seminggu dengan fokus penguatan harga diri yang sehat.\n\n" .
                    "RUJUKAN: Jika ada trauma keluarga yang dalam, pertimbangkan family counseling.",
            ],
            [
                'kode'       => 'DX-B03',
                'diagnosis'  => 'Displaced Aggression',
                'penjelasan' => 'Santri melampiaskan agresi kepada teman atau lingkungan pondok, padahal sumber frustrasinya berasal dari masalah di rumah atau keluarga. Teman-teman menjadi sasaran agresi yang sebenarnya ditujukan kepada orang tua atau situasi rumah yang tidak bisa ia kontrol.',
                'rekomendasi' =>
                    "TINDAKAN SEGERA:\n" .
                    "• Tangani insiden agresi sesuai aturan pondok, namun dengan pendekatan yang memahami konteks.\n" .
                    "• Gali: 'Ceritakan, ada yang sedang berat di luar pondok?'\n\n" .
                    "PENDEKATAN KONSELING:\n" .
                    "• Bantu santri memetakan sumber masalah sesungguhnya: keluarga, bukan teman.\n" .
                    "• Edukasi: 'Teman-temanmu tidak bersalah atas apa yang terjadi di rumahmu — bagaimana kalau kita cari cara lain untuk melampiaskan perasaan itu?'\n" .
                    "• Latih empati: minta santri membayangkan posisi teman yang jadi korban agresivitasnya.\n\n" .
                    "PIHAK YANG DILIBATKAN:\n" .
                    "• Orang tua: adakan sesi konseling keluarga — sampaikan dampak konflik rumah pada perilaku anak di pondok.\n" .
                    "• Wali asrama: pantau perilaku santri pasca kontak dengan keluarga (misal setelah telepon rumah).\n\n" .
                    "MONITORING:\n" .
                    "• Catat pola agresi — apakah terjadi setelah interaksi dengan keluarga?\n" .
                    "• Sesi konseling 1× seminggu, fokus pada pemrosesan masalah keluarga.\n\n" .
                    "RUJUKAN: Family counseling sangat direkomendasikan — sumber masalah ada di sistem keluarga.",
            ],
            [
                'kode'       => 'DX-B04',
                'diagnosis'  => 'Substance Violence',
                'penjelasan' => 'Santri melakukan kekerasan dalam kondisi dipengaruhi zat (napza/alkohol) atau menggunakan kekerasan untuk mendapatkan uang membeli zat. Kombinasi kecanduan zat dan perilaku kekerasan yang saling memperkuat, menciptakan siklus berbahaya.',
                'rekomendasi' =>
                    "TINDAKAN SEGERA (DARURAT):\n" .
                    "• Amankan situasi — pisahkan santri dari situasi kekerasan segera.\n" .
                    "• Jika masih dalam pengaruh zat: jangan konfrontasi, tunggu hingga efek zat berkurang.\n" .
                    "• Laporkan ke kepala pondok dan hubungi orang tua segera.\n\n" .
                    "PENDEKATAN KONSELING:\n" .
                    "• Tangani kecanduan sebagai prioritas utama — kekerasan tidak akan berhenti selama zat masih dikonsumsi.\n" .
                    "• Terapkan disiplin tegas sesuai aturan NAPZA pondok, namun dengan pendekatan rehabilitatif bukan semata punitif.\n" .
                    "• Wajibkan sesi konseling harian.\n\n" .
                    "PIHAK YANG DILIBATKAN:\n" .
                    "• Tim medis: evaluasi tingkat ketergantungan dan gejala putus zat.\n" .
                    "• Pimpinan pondok: keputusan tentang kelanjutan santri di pondok.\n" .
                    "• Orang tua: wajib hadir dan terlibat penuh.\n\n" .
                    "MONITORING:\n" .
                    "• Pemantauan 24 jam di fase awal.\n" .
                    "• Tes urine berkala.\n\n" .
                    "RUJUKAN: WAJIB rujuk ke rehabilitasi napza — kasus ini melampaui kapasitas penanganan pondok standar.",
            ],
            [
                'kode'       => 'DX-B05',
                'diagnosis'  => 'Sensation Seeking',
                'penjelasan' => 'Santri dengan kebutuhan sensasi tinggi yang melakukan pelanggaran (vandalisme, bolos, keributan) untuk mencari stimulus dan menghindari rasa bosan. Bukan karena niat jahat, tetapi karena ambang batas toleransi kebosanan yang sangat rendah. Energi berlebih yang tidak tersalurkan.',
                'rekomendasi' =>
                    "TINDAKAN SEGERA:\n" .
                    "• Identifikasi kapan dan di mana pelanggaran paling sering terjadi — biasanya saat waktu luang tidak terstruktur.\n\n" .
                    "PENDEKATAN KONSELING:\n" .
                    "• Jadikan santri sebagai 'mitra': 'Kamu punya energi luar biasa — bagaimana kalau energi itu kita arahkan ke hal yang seru sekaligus positif?'\n" .
                    "• Berikan tantangan fisik intensitas tinggi: futsal, basket, bela diri, panjat tebing (jika ada).\n" .
                    "• Berikan tanggung jawab kepanitiaan acara yang membutuhkan energi dan kreativitas.\n\n" .
                    "PIHAK YANG DILIBATKAN:\n" .
                    "• Pembina ekskul: libatkan dalam kegiatan yang sesuai kebutuhan stimulasi santri.\n" .
                    "• Wali asrama: isi waktu luang dengan kegiatan terstruktur.\n\n" .
                    "MONITORING:\n" .
                    "• Pantau frekuensi pelanggaran. Target: berkurang signifikan dalam 3 minggu setelah kegiatan positif dimulai.\n" .
                    "• Evaluasi efektivitas kegiatan fisik setiap 2 minggu.\n\n" .
                    "RUJUKAN: Jika tetap bermasalah meski sudah ada penyaluran, pertimbangkan evaluasi ADHD.",
            ],
            [
                'kode'       => 'DX-B06',
                'diagnosis'  => 'Bully-Victim Cycle',
                'penjelasan' => 'Santri yang dulunya menjadi korban bullying, kini berbalik menjadi pelaku bullying terhadap orang lain yang lebih lemah. Siklus korban-pelaku yang berputar — rasa sakit yang tidak diproses menjadi kekerasan terhadap orang lain.',
                'rekomendasi' =>
                    "TINDAKAN SEGERA:\n" .
                    "• Tangani insiden bullying yang dilakukan — jangan abaikan dengan alasan 'dia dulu juga korban'.\n" .
                    "• Namun bedakan pendekatannya: lebih banyak terapi, lebih sedikit hukuman.\n\n" .
                    "PENDEKATAN KONSELING:\n" .
                    "• Proses trauma sebagai korban dahulu — ini adalah akar siklus.\n" .
                    "• Bangun kesadaran siklus: 'Kamu tahu bagaimana sakitnya dibully — bagaimana perasaan temanmu yang kamu bully sekarang?'\n" .
                    "• Mediasi restoratif: pertemuan korban-pelaku yang difasilitasi BK untuk pemaafan dan pertanggungjawaban.\n\n" .
                    "PIHAK YANG DILIBATKAN:\n" .
                    "• Orang tua: informasikan siklus ini dan minta dukungan penanganan di rumah.\n" .
                    "• Korban saat ini: pastikan perlindungan korban tetap menjadi prioritas.\n\n" .
                    "MONITORING:\n" .
                    "• Pantau perilaku terhadap teman yang lebih junior/lemah.\n" .
                    "• Sesi konseling 2× seminggu — separuh untuk trauma, separuh untuk manajemen agresi.\n\n" .
                    "RUJUKAN: Pertimbangkan terapi trauma khusus (EMDR/CPT) jika tersedia.",
            ],
            [
                'kode'       => 'DX-B07',
                'diagnosis'  => 'Peer Pressure Aggression',
                'penjelasan' => 'Santri melakukan tindakan agresif karena tekanan dari kelompok teman (geng). Tidak memiliki inisiatif agresi sendiri, namun mengikuti untuk diterima atau menghindari dikucilkan dari kelompok. Identitas diri terlalu melebur ke dalam kelompok.',
                'rekomendasi' =>
                    "TINDAKAN SEGERA:\n" .
                    "• Identifikasi anggota kelompok yang paling berpengaruh (pemimpin geng).\n" .
                    "• Pisahkan santri dari kelompok negatif sementara — ubah jadwal atau penempatan.\n\n" .
                    "PENDEKATAN KONSELING:\n" .
                    "• Latih asertivitas: 'Beraninya bilang tidak itu bukan pengecut — justru itu keberanian yang sesungguhnya.'\n" .
                    "• Role play: latih menolak ajakan dengan kalimat yang cool namun tegas.\n" .
                    "• Bantu menemukan kelompok pertemanan baru yang positif.\n\n" .
                    "PIHAK YANG DILIBATKAN:\n" .
                    "• Seluruh anggota kelompok: panggil satu per satu untuk konseling individual.\n" .
                    "• Pembina ekskul positif: dekatkan santri ke komunitas positif.\n\n" .
                    "MONITORING:\n" .
                    "• Pantau dengan siapa santri bergaul sehari-hari.\n" .
                    "• Sesi konseling 1× seminggu fokus pada penguatan identitas diri.\n\n" .
                    "RUJUKAN: Jika kelompok mengarah ke organisasi berbahaya, libatkan aparat keamanan sesuai prosedur.",
            ],
            [
                'kode'       => 'DX-B08',
                'diagnosis'  => 'Instrumental Aggression',
                'penjelasan' => 'Santri menggunakan kekerasan sebagai alat (instrumen) untuk mencapai tujuan material — mengambil uang, barang, atau memperoleh keuntungan tertentu. Agresi yang terencana dan terkontrol, bukan impulsif. Menunjukkan pola pikir kriminal yang perlu segera ditangani.',
                'rekomendasi' =>
                    "TINDAKAN SEGERA:\n" .
                    "• Terapkan restitusi: santri wajib mengembalikan/mengganti semua yang diambil atau dirusak.\n" .
                    "• Laporkan ke kepala pondok — ini berpotensi masalah hukum.\n\n" .
                    "PENDEKATAN KONSELING:\n" .
                    "• Edukasi nilai kejujuran dan konsekuensi hukum kriminal dengan bahasa yang jelas.\n" .
                    "• Gali motivasi di balik perilaku: apakah kebutuhan uang, ingin berkuasa, atau ada masalah lain?\n" .
                    "• Pantau uang saku dan kebutuhan material santri — pastikan kebutuhan dasarnya terpenuhi.\n\n" .
                    "PIHAK YANG DILIBATKAN:\n" .
                    "• Orang tua: cek apakah santri kekurangan uang saku atau ada tekanan ekonomi.\n" .
                    "• Pimpinan pondok: pertimbangkan proses disipliner yang sesuai.\n\n" .
                    "MONITORING:\n" .
                    "• Pantau kepemilikan barang santri secara berkala.\n" .
                    "• Cek rekam jejak laporan kehilangan barang dari teman-teman.\n\n" .
                    "RUJUKAN: Jika ada pola kriminal berulang, koordinasikan dengan pihak kepolisian sesuai hukum yang berlaku.",
            ],
            [
                'kode'       => 'DX-B09',
                'diagnosis'  => 'Verbal Impulsivity',
                'penjelasan' => 'Santri tidak mampu mengendalikan ucapan — berbicara kasar, memaki, melontarkan kata-kata menyakitkan secara impulsif tanpa filter. Bukan karena niat jahat, melainkan karena lemahnya kontrol impuls verbal. Bisa jadi pola yang diperoleh dari lingkungan rumah.',
                'rekomendasi' =>
                    "TINDAKAN SEGERA:\n" .
                    "• Tetapkan konsekuensi langsung yang jelas: setiap kata kotor = istighfar sekian kali (sesuai aturan pondok).\n" .
                    "• Konsistensi: semua staf dan guru terapkan konsekuensi yang sama.\n\n" .
                    "PENDEKATAN KONSELING:\n" .
                    "• Teknik 5-detik: latih santri untuk berhenti 5 detik sebelum menjawab/bereaksi verbal.\n" .
                    "• 'Puasa Bicara' terpimpin: 30 menit sehari di mana santri hanya bicara jika sangat perlu.\n" .
                    "• Berikan contoh komunikasi santun yang konkret dan roleplay.\n" .
                    "• Eksplorasi apakah bahasa kasar adalah pola di rumah — jika ya, ini butuh penyesuaian lingkungan.\n\n" .
                    "PIHAK YANG DILIBATKAN:\n" .
                    "• Seluruh guru dan staf: konsistensi dalam penerapan konsekuensi verbal.\n" .
                    "• Orang tua: diskusikan pola bahasa di rumah.\n\n" .
                    "MONITORING:\n" .
                    "• Catat frekuensi pelanggaran verbal per hari. Target: berkurang 70% dalam 1 bulan.\n\n" .
                    "RUJUKAN: Jika pola ini sangat kuat dan tidak responsif, evaluasi kemungkinan ADHD atau gangguan impuls kontrol.",
            ],
            [
                'kode'       => 'DX-B10',
                'diagnosis'  => 'Conduct Disorder',
                'penjelasan' => 'Gangguan perilaku serius dengan pola berulang melanggar norma sosial, hak orang lain, dan aturan. Mencakup kekerasan, vandalisme, kabur, dan berbagai pelanggaran secara konsisten. Pola yang sudah mengakar dan membutuhkan intervensi intensif.',
                'rekomendasi' =>
                    "TINDAKAN SEGERA:\n" .
                    "• Rapat koordinasi segera dengan seluruh pihak (BK, wali kelas, wali asrama, pimpinan).\n" .
                    "• Buat kontrak perilaku ketat dengan target harian yang terukur.\n\n" .
                    "PENDEKATAN KONSELING:\n" .
                    "• Terapi perilaku kognitif (CBT): identifikasi pola pikir yang mendorong pelanggaran.\n" .
                    "• Struktur dan konsistensi: jadwal sangat ketat, sedikit pilihan, konsekuensi yang dapat diprediksi.\n" .
                    "• Kolaborasi intensif: BK, wali kelas, wali asrama, dan orang tua bekerja dengan satu strategi.\n\n" .
                    "PIHAK YANG DILIBATKAN:\n" .
                    "• Semua pihak harus selaras: satu orang saja yang berbeda pendekatan akan merusak konsistensi.\n" .
                    "• Orang tua: wajib terlibat intensif — tanpa keterlibatan orang tua, penanganan tidak akan efektif.\n\n" .
                    "MONITORING:\n" .
                    "• Laporan harian dari wali asrama dan wali kelas.\n" .
                    "• Evaluasi 2 mingguan — apakah kelayakan tinggal di asrama perlu dievaluasi.\n\n" .
                    "RUJUKAN: Conduct Disorder adalah kondisi klinis — wajib rujuk ke psikolog klinis atau psikiater anak.",
            ],
            [
                'kode'       => 'DX-B11',
                'diagnosis'  => 'Gang Violence Risk',
                'penjelasan' => 'Santri berisiko tinggi terlibat dalam kekerasan geng atau sudah menjadi bagian dari kelompok kekerasan terorganisir di dalam atau di luar pondok. Membawa senjata, melakukan kekerasan berkelompok, dan memiliki loyalitas kuat pada kelompok negatif.',
                'rekomendasi' =>
                    "TINDAKAN SEGERA (KEAMANAN PERTAMA):\n" .
                    "• Laporkan ke kepala pondok dan pertimbangkan melibatkan aparat jika ada ancaman keselamatan.\n" .
                    "• Identifikasi jaringan geng — siapa anggotanya, apa kegiatan, dari mana asalnya.\n" .
                    "• Razia barang bawaan secara rutin dan menyeluruh.\n\n" .
                    "PENDEKATAN KONSELING:\n" .
                    "• Pahami daya tarik geng: kebersamaan, perlindungan, identitas — cari alternatif positif untuk memenuhi kebutuhan ini.\n" .
                    "• Program deradikalisasi melalui kegiatan pesantren yang bermakna.\n" .
                    "• Bangun koneksi dengan figur otoritas yang santri hormati (ustadz, pembina senior).\n\n" .
                    "PIHAK YANG DILIBATKAN:\n" .
                    "• Bagian kesiswaan: laporan dan koordinasi formal.\n" .
                    "• Pimpinan pondok: keputusan tentang kelanjutan santri.\n" .
                    "• Orang tua: briefing tentang risiko dan rencana penanganan.\n\n" .
                    "MONITORING:\n" .
                    "• Pantau ketat seluruh anggota kelompok.\n" .
                    "• Evaluasi setiap minggu apakah ada perkembangan positif.\n\n" .
                    "RUJUKAN: Koordinasikan dengan pihak berwajib jika ada indikasi kegiatan kriminal.",
            ],
            [
                'kode'       => 'DX-B12',
                'diagnosis'  => 'Authority Conflict',
                'penjelasan' => 'Santri secara konsisten menentang dan menolak otoritas guru, ustadz, atau aturan pondok. Bukan hanya kenakalan biasa, melainkan pola resistensi yang sistematis terhadap figur berwenang. Seringkali berakar dari pengalaman figur otoritas yang mengecewakan atau tidak adil di masa lalu.',
                'rekomendasi' =>
                    "TINDAKAN SEGERA:\n" .
                    "• JANGAN beradu argumen frontal di depan umum — ini akan memperkuat resistensi.\n" .
                    "• Beri 'jalan keluar yang terhormat': berikan pilihan terbatas, bukan perintah mutlak.\n\n" .
                    "PENDEKATAN KONSELING:\n" .
                    "• Pendekatan Socratic: jelaskan alasan rasional di balik setiap aturan yang ia tentang.\n" .
                    "• Berikan otonomi terbatas yang nyata — beberapa hal yang bisa ia putuskan sendiri.\n" .
                    "• Gali pengalaman masa lalu dengan figur otoritas: 'Apakah ada guru atau orang tua yang pernah tidak adil kepadamu?'\n\n" .
                    "PIHAK YANG DILIBATKAN:\n" .
                    "• Seluruh guru: konsisten menggunakan pendekatan 'diskusi logis', bukan konfrontasi.\n" .
                    "• Orang tua: eksplorasi dinamika otoritas di rumah.\n\n" .
                    "MONITORING:\n" .
                    "• Catat insiden konflik dengan otoritas. Target: tidak ada insiden terbuka dalam 2 minggu.\n\n" .
                    "RUJUKAN: Jika ada indikasi Oppositional Defiant Disorder (ODD), rujuk ke psikolog klinis.",
            ],
        ];
    }

    // ══════════════════════════════════════════════════════════
    // DX-C: KATEGORI INTERNAL (19 diagnosis)
    // Masalah psikologis individual (tanpa konteks bullying spesifik)
    // ══════════════════════════════════════════════════════════

    private function dataInternal(): array
    {
        return [
            [
                'kode'       => 'DX-C01',
                'diagnosis'  => 'ADHD Inattentive',
                'penjelasan' => 'Santri menunjukkan gejala ADHD tipe inatensi: sulit mempertahankan perhatian, mudah terdistraksi, sering melamun, tidak bisa menyelesaikan tugas, dan tampak "tidak hadir" meskipun fisiknya ada. Bukan karena malas, melainkan karena perbedaan fungsi neurologis.',
                'rekomendasi' =>
                    "TINDAKAN SEGERA:\n" .
                    "• Minta santri duduk di baris paling depan — jauh dari sumber distraksi.\n" .
                    "• Berikan instruksi satu per satu, tidak majemuk sekaligus.\n\n" .
                    "PENDEKATAN KONSELING:\n" .
                    "• Buat jadwal harian yang sangat terstruktur dengan tugas-tugas kecil dan deadline pendek.\n" .
                    "• Metode belajar visual dan kinestetik: mind map, tabel warna, belajar sambil bergerak.\n" .
                    "• Timer Pomodoro: 15-20 menit fokus, 5 menit istirahat.\n\n" .
                    "PIHAK YANG DILIBATKAN:\n" .
                    "• Seluruh guru: kurangi instruksi panjang, gunakan kontak mata saat memberikan tugas.\n" .
                    "• Orang tua: informasikan dan minta evaluasi medis.\n\n" .
                    "MONITORING:\n" .
                    "• Pantau penyelesaian tugas harian. Catat progres setiap 2 minggu.\n\n" .
                    "RUJUKAN: ADHD adalah kondisi neurologis — rujuk ke dokter/psikiater untuk evaluasi dan kemungkinan terapi.",
            ],
            [
                'kode'       => 'DX-C02',
                'diagnosis'  => 'Academic Burnout',
                'penjelasan' => 'Kelelahan total akibat tekanan akademik berkepanjangan. Santri merasa terkuras habis secara emosional, mulai sinis terhadap pendidikan, dan merasa prestasinya tidak bermakna apapun yang ia lakukan. Bukan kemalasan — ini kondisi kelelahan yang serius.',
                'rekomendasi' =>
                    "TINDAKAN SEGERA:\n" .
                    "• Kurangi beban akademik sementara — koordinasikan dengan wali kelas untuk perpanjangan deadline.\n" .
                    "• Berikan izin 'recovery time' yang terstruktur.\n\n" .
                    "PENDEKATAN KONSELING:\n" .
                    "• Validasi: 'Kelelahan ini nyata dan wajar — kamu tidak lemah, kamu hanya perlu istirahat yang sesungguhnya.'\n" .
                    "• Evaluasi target nilai: bantu santri menetapkan target yang realistis dan tidak menyiksa.\n" .
                    "• Ajarkan manajemen waktu dan pentingnya rekreasi terencana.\n\n" .
                    "PIHAK YANG DILIBATKAN:\n" .
                    "• Wali kelas dan guru: fleksibilitas sementara dalam penilaian.\n" .
                    "• Orang tua: kurangi tekanan nilai dan ekspektasi yang tidak realistis.\n\n" .
                    "MONITORING:\n" .
                    "• Pantau mood dan energi santri mingguan. Target: ada peningkatan dalam 3 minggu.\n\n" .
                    "RUJUKAN: Jika burnout disertai gejala depresi, rujuk ke psikolog.",
            ],
            [
                'kode'       => 'DX-C03',
                'diagnosis'  => 'Addiction Motivation',
                'penjelasan' => 'Motivasi belajar santri terkikis akibat kecanduan (game, gadget, atau zat). Otak yang terbiasa dengan stimulasi instan dari kecanduan merasa kegiatan belajar terlalu membosankan. Dopamin dari kecanduan menggantikan motivasi akademik alami.',
                'rekomendasi' =>
                    "TINDAKAN SEGERA:\n" .
                    "• Lakukan detoksifikasi gadget/game: ambil sementara, buat jadwal ketat.\n" .
                    "• Ganti sumber dopamin: olahraga teratur (menghasilkan endorfin alami).\n\n" .
                    "PENDEKATAN KONSELING:\n" .
                    "• Edukasi tentang neurologi kecanduan: 'Otakmu sedang dalam mode mencari kepuasan instan — kita perlu latih ulang untuk menikmati hal-hal yang butuh usaha.'\n" .
                    "• Buat jadwal harian sangat ketat dengan aktivitas pengganti yang menarik.\n" .
                    "• Temukan satu hal dalam belajar yang masih menarik — mulai dari situ.\n\n" .
                    "PIHAK YANG DILIBATKAN:\n" .
                    "• Wali asrama: pantau ketat akses gadget.\n" .
                    "• Pembina ekskul: sediakan kegiatan fisik/kreatif sebagai pengganti.\n\n" .
                    "MONITORING:\n" .
                    "• Pantau waktu layar dan progres akademik setiap minggu.\n\n" .
                    "RUJUKAN: Jika kecanduan berat tidak responsif, rujuk ke konselor adiksi.",
            ],
            [
                'kode'       => 'DX-C04',
                'diagnosis'  => 'Academic Helplessness',
                'penjelasan' => 'Santri yang telah menyerah secara akademis — percaya bahwa ia tidak bisa belajar, tidak pintar, dan tidak akan pernah berhasil apapun yang ia lakukan. Keyakinan ini menghambat semua upaya belajar sebelum dimulai. Sering berakar dari pengalaman gagal berulang yang tidak tertangani.',
                'rekomendasi' =>
                    "TINDAKAN SEGERA:\n" .
                    "• Temukan SATU hal yang bisa ia lakukan dengan baik — fokus di sana dulu.\n" .
                    "• Hindari perbandingan dengan teman yang lebih pintar.\n\n" .
                    "PENDEKATAN KONSELING:\n" .
                    "• Identifikasi gaya belajar yang paling cocok (visual/auditori/kinestetik).\n" .
                    "• Berikan tutor teman sebaya yang sabar dan tidak menghakimi.\n" .
                    "• Fokus apresiasi pada USAHA, bukan hasil: 'Kamu tadi mencoba — itu yang penting.'\n" .
                    "• Teknik 'Bukti Kompetensi': kumpulkan momen-momen kecil santri berhasil untuk menantang keyakinan negatifnya.\n\n" .
                    "PIHAK YANG DILIBATKAN:\n" .
                    "• Guru: jadikan santri asisten kecil di bidang yang ia bisa — bangun rasa kompeten.\n" .
                    "• Orang tua: stop membandingkan dengan saudara atau teman.\n\n" .
                    "MONITORING:\n" .
                    "• Pantau penyelesaian tugas dan keberanian mencoba. Catat setiap kemajuan kecil.\n\n" .
                    "RUJUKAN: Jika ada dugaan learning disability, rujuk ke psikolog pendidikan.",
            ],
            [
                'kode'       => 'DX-C05',
                'diagnosis'  => 'Analysis Paralysis',
                'penjelasan' => 'Santri tidak mampu mengambil keputusan atau memulai tindakan karena terlalu banyak menganalisis, memikirkan konsekuensi, dan khawatir membuat kesalahan. Berpikir berlebihan yang membekukan tindakan. Seringkali disertai perfeksionisme.',
                'rekomendasi' =>
                    "TINDAKAN SEGERA:\n" .
                    "• Kurangi jumlah pilihan yang diberikan — berikan hanya 2 opsi, bukan 5.\n" .
                    "• Tetapkan deadline pendek untuk setiap keputusan kecil.\n\n" .
                    "PENDEKATAN KONSELING:\n" .
                    "• Teknik 'Cukup Baik': latih santri menerima bahwa 'cukup baik' lebih baik dari 'sempurna yang tidak pernah selesai'.\n" .
                    "• Pecah tugas besar menjadi langkah-langkah sangat kecil: 'Apa satu hal yang bisa kamu lakukan dalam 5 menit sekarang?'\n" .
                    "• Latihan pengambilan keputusan cepat pada hal-hal rendah risiko.\n\n" .
                    "PIHAK YANG DILIBATKAN:\n" .
                    "• Guru: berikan deadline yang jelas dan tegas — kejelasan membantu santri memulai.\n\n" .
                    "MONITORING:\n" .
                    "• Pantau penyelesaian tugas. Target: semua tugas dikumpulkan meski tidak sempurna.\n\n" .
                    "RUJUKAN: Jika disertai kecemasan berat, rujuk ke psikolog.",
            ],
            [
                'kode'       => 'DX-C06',
                'diagnosis'  => 'Depresi Mayor Fisik',
                'penjelasan' => 'Depresi mayor yang sudah memanifestasikan gejala fisik signifikan: tidak mau makan, tidak mau mandi, tidak mau keluar kamar, tubuh terasa berat, dan mengabaikan semua kebutuhan dasar diri. Level depresi yang serius dan membutuhkan penanganan segera.',
                'rekomendasi' =>
                    "TINDAKAN SEGERA (PRIORITAS TINGGI):\n" .
                    "• Lakukan asesmen risiko segera: 'Apakah kamu pernah berpikir untuk menyakiti dirimu atau tidak mau hidup lagi?'\n" .
                    "• Pastikan santri tidak sendirian di kamar dalam kondisi ini.\n" .
                    "• Hubungi orang tua segera.\n\n" .
                    "PENDEKATAN KONSELING:\n" .
                    "• Aktivasi perilaku: mulai dari hal terkecil (duduk di pintu kamar, cuci muka, makan sedikit).\n" .
                    "• Pendampingan 24 jam: tunjuk teman kamar yang bisa membantu memantau.\n" .
                    "• Jaga rutinitas dasar: makan 3×, mandi, tidur malam.\n\n" .
                    "PIHAK YANG DILIBATKAN:\n" .
                    "• Tim medis UKS: evaluasi kondisi fisik segera.\n" .
                    "• Wali asrama: pemantauan ketat setiap jam.\n" .
                    "• Orang tua: wajib hadir.\n\n" .
                    "MONITORING:\n" .
                    "• Checklist harian: makan, mandi, keluar kamar.\n\n" .
                    "RUJUKAN: WAJIB rujuk ke psikiater untuk evaluasi medis — depresi mayor memerlukan penanganan klinis.",
            ],
            [
                'kode'       => 'DX-C07',
                'diagnosis'  => 'Generalized Anxiety',
                'penjelasan' => 'Kecemasan umum yang pervasif tentang berbagai hal dalam kehidupan sehari-hari. Santri sulit mengendalikan kekhawatiran, merasa cemas hampir terus-menerus tentang tugas, nilai, hubungan, masa depan, dan banyak hal lainnya. Disertai gejala fisik (sakit kepala, ketegangan otot, sulit tidur).',
                'rekomendasi' =>
                    "TINDAKAN SEGERA:\n" .
                    "• Ajarkan teknik relaksasi otot progresif (kencangkan-lepaskan tiap kelompok otot).\n" .
                    "• Batasi kafein (kopi, teh kental) yang memperburuk kecemasan.\n\n" .
                    "PENDEKATAN KONSELING:\n" .
                    "• Teknik Jurnal Kekhawatiran: tulis semua kekhawatiran, lalu evaluasi mana yang bisa dikontrol dan mana yang tidak.\n" .
                    "• Latih pernapasan diafragma: 4 hitungan masuk, 4 tahan, 6 keluar.\n" .
                    "• CBT sederhana: tantang pikiran otomatis negatif dengan bukti nyata.\n\n" .
                    "PIHAK YANG DILIBATKAN:\n" .
                    "• Guru: kurangi tekanan nilai yang tidak perlu.\n" .
                    "• Wali asrama: pastikan jadwal tidak terlalu padat.\n\n" .
                    "MONITORING:\n" .
                    "• Skala kecemasan harian (1-10). Target: rata-rata < 5 dalam 3 minggu.\n\n" .
                    "RUJUKAN: Jika kecemasan sangat mengganggu fungsi sehari-hari > 6 bulan, rujuk ke psikolog.",
            ],
            [
                'kode'       => 'DX-C08',
                'diagnosis'  => 'Isolation Flight',
                'penjelasan' => 'Santri secara aktif melarikan diri dari lingkungan sosial dan mencari tempat persembunyian. Bukan sekadar introver, melainkan penarikan aktif dari kehidupan pondok — bersembunyi di sudut-sudut tertentu, tidak hadir kegiatan, menghilang dari radar.',
                'rekomendasi' =>
                    "TINDAKAN SEGERA:\n" .
                    "• Cek lokasi persembunyian favorit santri — pantau keamanannya.\n" .
                    "• Jangan langsung 'serang' dengan pertanyaan — duduk berdampingan diam dulu.\n\n" .
                    "PENDEKATAN KONSELING:\n" .
                    "• Bangun rapport dulu: temui di tempat nyaman santri, tanpa agenda, hanya menemani.\n" .
                    "• Pertanyaan ringan: 'Apa yang kamu suka dari tempat ini?' sebelum ke topik lebih dalam.\n" .
                    "• Buddy System: cari satu teman dekat yang bisa menemani tanpa memaksa bersosialisasi.\n\n" .
                    "PIHAK YANG DILIBATKAN:\n" .
                    "• Wali asrama: check-in harian yang tidak invasif.\n" .
                    "• Teman kamar: briefing untuk tidak mengucilkan dan tetap mengajak meski ditolak.\n\n" .
                    "MONITORING:\n" .
                    "• Pantau kehadiran di kegiatan wajib. Target: hadir semua kegiatan wajib dalam 2 minggu.\n\n" .
                    "RUJUKAN: Jika isolasi disertai penolakan makan atau tanda depresi berat, rujuk segera.",
            ],
            [
                'kode'       => 'DX-C09',
                'diagnosis'  => 'NSSI Risk - Self Harm',
                'penjelasan' => 'Risiko Non-Suicidal Self-Injury: santri menunjukkan tanda-tanda atau perilaku menyakiti diri sendiri (memotong, memukul diri, membakar) bukan dengan niat bunuh diri, tetapi sebagai mekanisme koping dari rasa sakit emosional yang luar biasa.',
                'rekomendasi' =>
                    "TINDAKAN SEGERA (DARURAT PSIKOLOGIS):\n" .
                    "• Cek fisik segera: apakah ada luka? Obati dan dokumentasikan.\n" .
                    "• Amankan semua benda tajam di sekitar santri.\n" .
                    "• JANGAN tinggalkan santri sendirian.\n" .
                    "• Hubungi orang tua segera.\n\n" .
                    "PENDEKATAN KONSELING:\n" .
                    "• Dengarkan tanpa menghakimi: 'Saya tidak marah. Saya ingin memahami rasa sakit apa yang membuat kamu melakukan ini.'\n" .
                    "• Berikan coping pengganti yang aman: menulis, mencoret kertas, olahraga intens, memegang es batu sebentar.\n" .
                    "• TIDAK pernah bernegosiasi atau mengancam — ini memperburuk kondisi.\n\n" .
                    "PIHAK YANG DILIBATKAN:\n" .
                    "• Tim medis UKS: perawatan luka dan evaluasi.\n" .
                    "• Orang tua: wajib hadir SEGERA.\n" .
                    "• Pimpinan pondok: eskalasikan kasus ini.\n\n" .
                    "MONITORING:\n" .
                    "• Pemantauan 24 jam oleh wali asrama.\n\n" .
                    "RUJUKAN: WAJIB rujuk ke psikolog klinis — NSSI adalah kasus darurat psikologis yang melampaui kapasitas BK.",
            ],
            [
                'kode'       => 'DX-C10',
                'diagnosis'  => 'Mood Dysregulation',
                'penjelasan' => 'Santri mengalami ketidakstabilan suasana hati (mood) yang signifikan — naik-turun drastis dalam waktu singkat, sulit mengendalikan emosi, dan perubahan perilaku yang tidak dapat diprediksi. Bukan sekadar moodiness biasa remaja.',
                'rekomendasi' =>
                    "TINDAKAN SEGERA:\n" .
                    "• Catat pola mood: kapan naik, kapan turun, apa pemicunya?\n" .
                    "• Saat mood turun: jangan konfrontasi — tunggu fase lebih stabil.\n\n" .
                    "PENDEKATAN KONSELING:\n" .
                    "• Ajarkan Mood Tracker: santri mencatat mood harian (skala 1-10) untuk mengenali pola.\n" .
                    "• Identifikasi tanda-tanda awal perubahan mood sebelum sampai ekstrem.\n" .
                    "• Teknik regulasi emosi: breathing, grounding, distraksi sehat.\n\n" .
                    "PIHAK YANG DILIBATKAN:\n" .
                    "• Seluruh staf: briefing tentang cara merespons saat santri dalam fase down.\n\n" .
                    "MONITORING:\n" .
                    "• Review Mood Tracker setiap minggu bersama santri.\n\n" .
                    "RUJUKAN: Jika pola ekstrem dan berulang, rujuk ke psikiater untuk evaluasi bipolar atau kondisi terkait.",
            ],
            [
                'kode'       => 'DX-C11',
                'diagnosis'  => 'Nicotine Dependence',
                'penjelasan' => 'Ketergantungan pada nikotin (rokok) yang sudah melampaui sekadar perilaku — santri mengalami dorongan fisik dan psikologis untuk merokok, gejala withdrawal saat tidak merokok, dan kesulitan berhenti meski tahu dampak negatifnya.',
                'rekomendasi' =>
                    "TINDAKAN SEGERA:\n" .
                    "• Proses disipliner sesuai aturan pondok untuk pelanggaran merokok.\n" .
                    "• Jangan hanya hukum — berikan alternatif pengganti.\n\n" .
                    "PENDEKATAN KONSELING:\n" .
                    "• Edukasi bahaya rokok dengan visual yang kuat (gambar kesehatan, bukan ceramah).\n" .
                    "• Substitusi oral: permen karet, camilan sehat, minum air dingin saat ingin merokok.\n" .
                    "• Kurangi uang saku yang bisa digunakan membeli rokok — koordinasikan dengan orang tua.\n" .
                    "• Identifikasi pemicu merokok: stres, bosan, pengaruh teman — atasi pemicunya.\n\n" .
                    "PIHAK YANG DILIBATKAN:\n" .
                    "• Orang tua: stop kiriman uang berlebih, pantau dari rumah.\n" .
                    "• Teman: jika pengaruh teman kuat, pertimbangkan perubahan lingkungan pergaulan.\n\n" .
                    "MONITORING:\n" .
                    "• Pantau dengan razia tak terduga secara konsisten.\n" .
                    "• Catat frekuensi pelanggaran. Target: 0 dalam 1 bulan.\n\n" .
                    "RUJUKAN: Untuk ketergantungan berat, koordinasikan dengan dokter untuk program berhenti merokok.",
            ],
            [
                'kode'       => 'DX-C12',
                'diagnosis'  => 'Addiction Criminality',
                'penjelasan' => 'Santri melakukan tindakan kriminal (mencuri, menipu) yang dimotivasi oleh kebutuhan untuk membiayai kecanduan. Kecanduan telah mendorong santri melampaui batas moral dan hukum. Siklus berbahaya: kecanduan → butuh uang → kriminal → uang untuk kecanduan.',
                'rekomendasi' =>
                    "TINDAKAN SEGERA:\n" .
                    "• Tangani kecanduan sebagai akar masalah — kriminalitas adalah gejala.\n" .
                    "• Terapkan restitusi segera: santri wajib mengembalikan/mengganti barang yang dicuri.\n" .
                    "• Proses disipliner sesuai aturan pondok; pertimbangkan implikasi hukum.\n\n" .
                    "PENDEKATAN KONSELING:\n" .
                    "• Pengawasan ketat 24 jam — batasi akses ke uang dan situasi yang memungkinkan kriminal.\n" .
                    "• Atasi kecanduan dengan program detoksifikasi yang terstruktur.\n" .
                    "• Edukasi nilai kejujuran dan konsekuensi hukum dengan bahasa konkret.\n\n" .
                    "PIHAK YANG DILIBATKAN:\n" .
                    "• Pimpinan pondok: keputusan tentang kelanjutan santri.\n" .
                    "• Orang tua: wajib hadir dan terlibat penuh — termasuk mengganti kerugian.\n\n" .
                    "MONITORING:\n" .
                    "• Pantau kepemilikan barang dan uang santri.\n\n" .
                    "RUJUKAN: WAJIB rujuk ke rehabilitasi napza dan konsultan hukum jika diperlukan.",
            ],
            [
                'kode'       => 'DX-C13',
                'diagnosis'  => 'Gaming Disorder',
                'penjelasan' => 'Gangguan bermain game yang sudah mempengaruhi kehidupan nyata: nilai turun, tidur terganggu, mengabaikan kewajiban pondok, dan kehilangan kendali atas waktu bermain. WHO mengakui Gaming Disorder sebagai kondisi kesehatan yang perlu penanganan.',
                'rekomendasi' =>
                    "TINDAKAN SEGERA:\n" .
                    "• Batasi atau hentikan akses wifi dan internet secara tegas.\n" .
                    "• Sita perangkat gaming sementara.\n\n" .
                    "PENDEKATAN KONSELING:\n" .
                    "• Tidak ada cara berhenti mendadak yang efektif — buat rencana pengurangan bertahap.\n" .
                    "• Ganti waktu gaming dengan kegiatan fisik di sore hari — olahraga menghasilkan endorfin yang mirip dopamin game.\n" .
                    "• CBT dasar: identifikasi pikiran ('Saya tidak bisa berhenti') dan tantang dengan bukti ('Kemarin saya bisa tidur tanpa game').\n\n" .
                    "PIHAK YANG DILIBATKAN:\n" .
                    "• Wali asrama: pantau ketat akses internet.\n" .
                    "• Orang tua: jangan berikan HP baru atau akses internet tak terbatas saat pulang.\n\n" .
                    "MONITORING:\n" .
                    "• Pantau waktu layar dan progres akademik setiap minggu.\n\n" .
                    "RUJUKAN: Untuk kecanduan berat, rujuk ke konselor adiksi teknologi.",
            ],
            [
                'kode'       => 'DX-C14',
                'diagnosis'  => 'High Risk Sexual',
                'penjelasan' => 'Santri menunjukkan perilaku seksual berisiko tinggi: pacaran intens, khalwat berulang, atau tanda-tanda hubungan yang melampaui batas syariat. Risiko terhadap moral, hukum agama, dan kesehatan reproduksi.',
                'rekomendasi' =>
                    "TINDAKAN SEGERA:\n" .
                    "• Pisahkan santri dari situasi berisiko — evaluasi pengaturan kamar dan waktu interaksi.\n" .
                    "• Proses disipliner sesuai aturan pondok.\n\n" .
                    "PENDEKATAN KONSELING:\n" .
                    "• Edukasi kesehatan reproduksi yang benar dan tinjauan agama yang bijaksana.\n" .
                    "• Bangun penghargaan terhadap diri sendiri: 'Tubuh dan masa depanmu terlalu berharga untuk dipertaruhkan.'\n" .
                    "• Batasi interaksi berisiko: atur waktu dan tempat pertemuan antar santri.\n" .
                    "• Gali motivasi di balik perilaku: apakah kebutuhan afeksi, cinta, atau tekanan teman?\n\n" .
                    "PIHAK YANG DILIBATKAN:\n" .
                    "• Orang tua: informasikan kondisi — minta keterlibatan dalam edukasi nilai.\n" .
                    "• Ustadz/Pembina: kajian tentang nilai-nilai Islam dalam hubungan.\n\n" .
                    "MONITORING:\n" .
                    "• Pantau interaksi dan keberadaan santri. Razia berkala.\n\n" .
                    "RUJUKAN: Jika ada indikasi pelecehan seksual atau kehamilan, libatkan pihak berwajib dan konselor khusus.",
            ],
            [
                'kode'       => 'DX-C15',
                'diagnosis'  => 'Maladaptive Coping',
                'penjelasan' => 'Santri menggunakan strategi koping yang tidak sehat untuk mengatasi stres: merokok berlebihan, tidur terus, menyendiri, atau perilaku destruktif lainnya. Koping maladaptif memberikan kelegaan sesaat tapi memperburuk masalah jangka panjang.',
                'rekomendasi' =>
                    "TINDAKAN SEGERA:\n" .
                    "• Identifikasi stres utama: apa yang paling membebani santri saat ini?\n" .
                    "• Hentikan perilaku koping buruk secara tegas namun edukatif — berikan alasan yang logis.\n\n" .
                    "PENDEKATAN KONSELING:\n" .
                    "• Peta koping: gambarkan situasi → perasaan → perilaku koping saat ini → dampak.\n" .
                    "• Ajarkan koping sehat: olahraga, menulis jurnal, curhat ke teman tepercaya, berdoa/dzikir.\n" .
                    "• Latih satu koping sehat spesifik yang cocok untuk santri ini.\n\n" .
                    "PIHAK YANG DILIBATKAN:\n" .
                    "• Wali asrama: pantau perilaku koping dan dorong yang positif.\n" .
                    "• Teman dekat: libatkan sebagai sumber dukungan sosial.\n\n" .
                    "MONITORING:\n" .
                    "• Pantau penggunaan koping maladaptif. Target: berkurang 50% dalam 3 minggu.\n\n" .
                    "RUJUKAN: Jika ada indikasi penyalahgunaan zat, rujuk ke konselor adiksi.",
            ],
            [
                'kode'       => 'DX-C16',
                'diagnosis'  => 'Broken Home Escape',
                'penjelasan' => 'Santri kabur dari pondok atau menolak kembali sebagai pelarian dari situasi keluarga yang tidak harmonis (perceraian, KDRT, konflik). Pondok bukan tempat yang nyaman justru karena mengingatkan pada keluarga yang bermasalah. Kabur adalah mencari "jalan tengah" yang tidak ada.',
                'rekomendasi' =>
                    "TINDAKAN SEGERA:\n" .
                    "• Tangani insiden kabur sesuai aturan, namun dengan pemahaman konteks keluarga.\n" .
                    "• Gali situasi rumah: apa yang membuat ia tidak mau pulang dan tidak mau di pondok?\n\n" .
                    "PENDEKATAN KONSELING:\n" .
                    "• Jadilah pendengar aktif tanpa menghakimi situasi orang tua.\n" .
                    "• Bangun pondok sebagai 'Rumah Kedua' yang aman: 'Di sini kamu aman. Di sini ada orang-orang yang peduli padamu.'\n" .
                    "• JANGAN paksa rekonsiliasi dengan orang tua di tengah konflik panas.\n" .
                    "• Ajarkan cara mengelola perasaan tentang situasi keluarga yang tidak bisa ia kontrol.\n\n" .
                    "PIHAK YANG DILIBATKAN:\n" .
                    "• Orang tua: komunikasikan dampak konflik rumah pada anak — minta gencatan senjata sementara.\n" .
                    "• Wali asrama: pastikan santri merasa diterima dan aman di asrama.\n\n" .
                    "MONITORING:\n" .
                    "• Pantau keberadaan santri ketat. Check-in harian.\n\n" .
                    "RUJUKAN: Family counseling atau mediasi perlu dilakukan untuk mengatasi akar masalah.",
            ],
            [
                'kode'       => 'DX-C17',
                'diagnosis'  => 'Family Stress Impact',
                'penjelasan' => 'Konflik atau tekanan dalam keluarga yang berdampak langsung pada perilaku dan prestasi santri di pondok. Akademik menurun, perilaku berubah, sulit konsentrasi — semua sebagai cerminan situasi rumah yang tidak stabil.',
                'rekomendasi' =>
                    "TINDAKAN SEGERA:\n" .
                    "• Berikan dispensasi sementara dalam akademik — perpanjang deadline tugas.\n" .
                    "• Sampaikan kepada santri: 'Kamu tidak harus sempurna saat sedang berat di rumah.'\n\n" .
                    "PENDEKATAN KONSELING:\n" .
                    "• Validasi perasaan: 'Sedih karena orang tua bertengkar itu sangat wajar. Kamu tidak salah.'\n" .
                    "• Bantu memisahkan tanggung jawab: konflik orang tua bukan tanggung jawab anak.\n" .
                    "• Ajarkan teknik menjaga diri di tengah kekacauan keluarga.\n\n" .
                    "PIHAK YANG DILIBATKAN:\n" .
                    "• Orang tua: komunikasikan dampak konflik mereka pada anak secara empatis, bukan menyalahkan.\n" .
                    "• Wali kelas: fleksibilitas akademik sementara.\n\n" .
                    "MONITORING:\n" .
                    "• Pantau mood dan prestasi akademik setiap minggu.\n\n" .
                    "RUJUKAN: Family counseling untuk mengatasi konflik keluarga dari akarnya.",
            ],
            [
                'kode'       => 'DX-C18',
                'diagnosis'  => 'Behavioral Modeling',
                'penjelasan' => 'Santri meniru perilaku negatif dari lingkungan (teman, sosial media, atau pengalaman keluarga) — berbicara kasar, bersikap tidak sopan, atau berperilaku tidak sesuai norma pondok. Bukan karena karakter buruk, melainkan karena belum ada model perilaku positif yang cukup kuat.',
                'rekomendasi' =>
                    "TINDAKAN SEGERA:\n" .
                    "• Koreksi perilaku dengan penjelasan: 'Bukan karena kamu salah, tapi perilaku itu tidak sesuai nilai kita di sini. Yuk kita pelajari yang lebih baik.'\n" .
                    "• Hindari labeling negatif — fokus pada perilaku, bukan karakter.\n\n" .
                    "PENDEKATAN KONSELING:\n" .
                    "• Tunjukkan Role Model positif secara konkret: ustadz, pembina senior, atau alumni berprestasi.\n" .
                    "• Edukasi tentang pengaruh lingkungan pada perilaku: 'Kamu adalah rata-rata dari 5 orang yang paling sering kamu temani.'\n" .
                    "• Berikan apresiasi setiap kali santri meniru perilaku baik — perkuat dengan pujian spesifik.\n\n" .
                    "PIHAK YANG DILIBATKAN:\n" .
                    "• Seluruh staf: jadilah role model yang konsisten — santri mengamati segalanya.\n" .
                    "• Orang tua: diskusikan tentang peran orang tua sebagai model perilaku utama.\n\n" .
                    "MONITORING:\n" .
                    "• Pantau perubahan perilaku: apakah ada peniruan positif yang meningkat?\n\n" .
                    "RUJUKAN: Tidak diperlukan kecuali ada kondisi tambahan yang menyertai.",
            ],
            [
                'kode'       => 'DX-C19',
                'diagnosis'  => 'Home Attachment',
                'penjelasan' => 'Santri mengalami kesulitan adaptasi di pondok karena keterikatan yang sangat kuat dengan rumah dan keluarga. Homesick berat yang mengganggu fungsi sehari-hari: menangis terus-menerus, tidak mau beraktivitas, meminta pulang berulang kali. Keterikatan yang belum berkembang menjadi kemandirian.',
                'rekomendasi' =>
                    "TINDAKAN SEGERA:\n" .
                    "• Jadwalkan waktu komunikasi dengan keluarga yang teratur (bukan setiap saat) — ini membantu prediktabilitas.\n" .
                    "• Berikan objek transisi: foto keluarga yang bisa dilihat di kamar.\n\n" .
                    "PENDEKATAN KONSELING:\n" .
                    "• Normalkan perasaan: 'Rasa rindu itu tanda kamu punya keluarga yang baik — itu tidak salah.'\n" .
                    "• Batasi frekuensi telepon secara bertahap: dari setiap hari ke tiap 2 hari, ke 3 hari.\n" .
                    "• Sibukkan dengan kegiatan pondok yang menyenangkan — bangun kenangan positif di pondok.\n" .
                    "• Bantu menemukan 'keluarga pondok': teman dekat, wali asrama yang perhatian.\n\n" .
                    "PIHAK YANG DILIBATKAN:\n" .
                    "• Orang tua: briefing untuk tidak memperparah rindu dengan terlalu sering dihubungi — ini mempersulit adaptasi.\n" .
                    "• Wali asrama: berikan perhatian ekstra dan hangat di minggu-minggu pertama.\n\n" .
                    "MONITORING:\n" .
                    "• Pantau frekuensi tangisan dan permintaan pulang. Target: berkurang signifikan dalam 3 minggu.\n\n" .
                    "RUJUKAN: Tidak diperlukan kecuali disertai gejala depresi atau kecemasan berat.",
            ],
        ];
    }
}
