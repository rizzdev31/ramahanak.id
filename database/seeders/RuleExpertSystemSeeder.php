<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * RuleExpertSystemSeeder
 *
 * Menyeed 43 rules expert system (RA-01..RC-19) sesuai dokumen:
 * "Rule_Sistem_Pakar.docx"
 *
 * ════════════════════════════════════════════════════════════
 * STRUKTUR TABEL rules_expert_system
 * ════════════════════════════════════════════════════════════
 *
 * id           — auto increment
 * kode_rule    — RA-01..RC-19 (unique, max 20 char)
 * kategori     — 'Korban Dampak' / 'Pelaku' / 'Internal' (max 100 char)
 * premise      — JSON array ["G010","P001","G001"] = logika IF (AND semua)
 * conclusion   — string kode DX FK → variabel_diagnosis.kode
 * created_at, updated_at
 *
 * ════════════════════════════════════════════════════════════
 * PIPELINE SISTEM: BAGAIMANA RULES DIEKSEKUSI
 * ════════════════════════════════════════════════════════════
 *
 * ForwardChainingService::findMatchingSantris(array $requiredCodes):
 *   DB::table('riwayat_santri')
 *     ->select('santri_id')
 *     ->whereIn('kode', $requiredCodes)       ← kode P/G dari premise
 *     ->groupBy('santri_id')
 *     ->havingRaw('COUNT(DISTINCT kode) = ?', [count($requiredCodes)])
 *
 * Logic: santri yang riwayatnya mengandung SEMUA kode di premise (AND)
 * → Jika terpenuhi → buat LaporanExpertSystemKonselor dengan data dari
 *   variabel_diagnosis yang sesuai conclusion
 *
 * ════════════════════════════════════════════════════════════
 * KOREKSI KODE DARI DOKUMEN
 * ════════════════════════════════════════════════════════════
 *
 * Tabel 3.12 (Internal) di dokumen salah tulis kode:
 *   Dokumen: RB-01..RB-12 untuk internal → TYPO
 *   Seeder:  RC-01..RC-12 (dikoreksi konsisten dengan kategori RC)
 *   RC-13..RC-19 sudah benar di dokumen
 *
 * ════════════════════════════════════════════════════════════
 * PREREQUISITE: P015 DAN P016 HARUS ADA
 * ════════════════════════════════════════════════════════════
 *
 * Rules menggunakan P015 dan P016 yang belum ada di variabel_pelanggaran.
 * Seeder ini OTOMATIS insert P015 dan P016 di method seedMissingVariabel()
 * sebelum rules di-insert, untuk menjaga integritas premise.
 *
 * P015: Perundungan Verbal / Siber (5 poin)
 *   Dipakai: RA-02, RB-02, RB-07
 * P016: Pencurian / Mengambil Barang Tanpa Izin (10 poin)
 *   Dipakai: RB-08, RC-12
 *
 * ════════════════════════════════════════════════════════════
 * VALIDASI SEBELUM INSERT
 * ════════════════════════════════════════════════════════════
 *
 * Seeder melakukan validasi:
 * 1. Semua kode dalam premise harus ada di riwayat (P/G valid)
 * 2. conclusion harus ada di variabel_diagnosis
 * 3. kode_rule harus unik
 * 4. Tidak ada duplikasi kombinasi premise
 */
class RuleExpertSystemSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('');
        $this->command->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        $this->command->info('  SEEDER: Rule Expert System RA-01 – RC-19');
        $this->command->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        // ── STEP 1: Pastikan P015 dan P016 ada ─────────────────
        $this->seedMissingVariabel();

        // ── STEP 2: Validasi semua conclusion DX ada ───────────
        $this->validateConclusions();

        // ── STEP 3: Seed rules per kategori ────────────────────
        $groups = [
            'Korban Dampak' => $this->dataKorban(),
            'Pelaku'        => $this->dataPelaku(),
            'Internal'      => $this->dataInternal(),
        ];

        $totalInserted = 0;
        $totalUpdated  = 0;
        $totalSkipped  = 0;

        foreach ($groups as $label => $rules) {
            $this->command->info('');
            $this->command->info("  ── Kategori: {$label} ──");

            foreach ($rules as $rule) {
                $exists = DB::table('rules_expert_system')
                    ->where('kode_rule', $rule['kode_rule'])
                    ->exists();

                DB::table('rules_expert_system')->updateOrInsert(
                    ['kode_rule' => $rule['kode_rule']],
                    [
                        'kode_rule'  => $rule['kode_rule'],
                        'kategori'   => $rule['kategori'],
                        'premise'    => json_encode($rule['premise']),
                        'conclusion' => $rule['conclusion'],
                        'updated_at' => now(),
                        'created_at' => $exists ? DB::raw('created_at') : now(),
                    ]
                );

                $premiseStr = implode(' AND ', $rule['premise']);
                $status     = $exists ? '✎ Updated ' : '✚ Inserted';
                $this->command->line(
                    "    {$status}  {$rule['kode_rule']}  " .
                    "IF [{$premiseStr}]  →  {$rule['conclusion']}"
                );

                if ($exists) $totalUpdated++;
                else $totalInserted++;
            }
        }

        $this->command->info('');
        $this->command->info("  ✅ Selesai: {$totalInserted} inserted, {$totalUpdated} updated");
        $this->command->info('     RA (Korban): 12  |  RB (Pelaku): 12  |  RC (Internal): 19');
        $this->command->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }

    // ──────────────────────────────────────────────────────────
    // STEP 1: Seed P015 dan P016 yang belum ada
    // ──────────────────────────────────────────────────────────

    private function seedMissingVariabel(): void
    {
        $this->command->info('');
        $this->command->info('  ── Prerequisite: Cek P015 dan P016 ──');

        $missing = [
            [
                'kode'             => 'P015',
                'kategori'         => 'perundungan_verbal_siber',
                'poin'             => 5,
                'tindakan'         => 'Mediasi Korban-Pelaku, Edukasi Komunikasi Sehat',
                'negatable'        => false,
                'counterpart_kode' => null,
                'negation_notes'   => null,
                // Kamus kata: kata yang spesifik bullying verbal & siber
                // (minimal 4 char, sesuai filter is_valid_kata Python)
                'kamus_kata'       =>
                    // Verbal bullying
                    'ejek,mengejek,ejekan,' .
                    'olok,mengolok,olok-olok,' .
                    'ledek,meledek,ledekan,' .
                    'hina,menghina,penghinaan,' .
                    'cela,mencela,celaan,' .
                    'fitnah,memfitnah,difitnah,' .
                    'ghibah,menggunjing,' .
                    'gosip,menyebarkan gosip,' .
                    'julukan buruk,panggil nama jelek,' .
                    'dihina kata-kata,diejek teman,' .
                    'bicara buruk,kata-kata menyakitkan,' .
                    // Siber bullying
                    'bully online,buli online,' .
                    'hina sosmed,hina di grup,' .
                    'screenshoot dipermalukan,' .
                    'sebar aib,sebar foto tanpa izin,' .
                    'caption jahat,komentar jahat,' .
                    'diblokir semua,dikucilkan online,' .
                    'ancam lewat chat,minta uang chat,' .
                    'pesan mengancam,diteror pesan',
            ],
            [
                'kode'             => 'P016',
                'kategori'         => 'pencurian',
                'poin'             => 10,
                'tindakan'         => 'Restitusi Barang, Teguran Keras, Laporan ke Orang Tua',
                'negatable'        => false,
                'counterpart_kode' => null,
                'negation_notes'   => null,
                // Kamus kata: kata yang spesifik pencurian/mengambil barang
                'kamus_kata'       =>
                    // Pencurian langsung
                    'curi,mencuri,kecurian,' .
                    'nyolong,maling,kemalingan,' .
                    'ambil tanpa izin,mengambil barang,' .
                    'diambil barang,barang hilang,' .
                    'barang raib,kehilangan barang,' .
                    // Pemalakan / paksa
                    'palak,memalak,dipalak,' .
                    'minta paksa,minta uang paksa,' .
                    'rampas,merampas,dirampas,' .
                    'rebut,merebut barang,' .
                    // Konteks
                    'uang hilang,dompet hilang,' .
                    'hp hilang,barang teman hilang,' .
                    'tangan panjang,kleptomaniak,' .
                    'bawa barang orang,pinjam tanpa izin,' .
                    'tidak kembalikan,tidak mau kembalikan',
            ],
        ];

        foreach ($missing as $item) {
            $exists = DB::table('variabel_pelanggaran')
                ->where('kode', $item['kode'])
                ->exists();

            if (!$exists) {
                DB::table('variabel_pelanggaran')->insert(
                    array_merge($item, [
                        'created_at' => now(),
                        'updated_at' => now(),
                    ])
                );
                $this->command->line("    ✚ Inserted  {$item['kode']} — {$item['kategori']} ({$item['poin']}p)");
            } else {
                $this->command->line("    ✓ Exists    {$item['kode']} — sudah ada, dilewati");
            }
        }
    }

    // ──────────────────────────────────────────────────────────
    // STEP 2: Validasi conclusion codes ada di variabel_diagnosis
    // ──────────────────────────────────────────────────────────

    private function validateConclusions(): void
    {
        $this->command->info('');
        $this->command->info('  ── Validasi Conclusion DX ──');

        $allConclusions = array_map(
            fn($r) => $r['conclusion'],
            array_merge($this->dataKorban(), $this->dataPelaku(), $this->dataInternal())
        );

        $uniqueConclusions = array_unique($allConclusions);
        $existingDx = DB::table('variabel_diagnosis')
            ->whereIn('kode', $uniqueConclusions)
            ->pluck('kode')
            ->toArray();

        $missing = array_diff($uniqueConclusions, $existingDx);

        if (!empty($missing)) {
            $this->command->error('  ❌ GAGAL: Conclusion DX tidak ada di variabel_diagnosis:');
            foreach ($missing as $kode) {
                $this->command->error("     {$kode}");
            }
            $this->command->error('  Jalankan VariabelDiagnosisSeeder terlebih dahulu!');
            throw new \RuntimeException(
                'Rule seeder gagal: conclusion tidak valid — ' . implode(', ', $missing)
            );
        }

        $this->command->line('    ✅ Semua ' . count($uniqueConclusions) . ' conclusion DX valid');
    }

    // ══════════════════════════════════════════════════════════
    // DATA: KATEGORI KORBAN DAMPAK (RA-01..RA-12)
    // Tabel 3.10 dokumen
    // ══════════════════════════════════════════════════════════

    private function dataKorban(): array
    {
        return [
            [
                // Santri yang DIRUNDUNG (G010) + mengalami kekerasan fisik (P001)
                // + kecemasan (G001) + gangguan tidur (G012)
                // → PTSD Akut akibat trauma kekerasan fisik berkelanjutan
                'kode_rule'  => 'RA-01',
                'kategori'   => 'Korban Dampak',
                'premise'    => ['G010', 'P001', 'G001', 'G012'],
                'conclusion' => 'DX-A01',
            ],
            [
                // Santri yang DIRUNDUNG (G010) + mengalami perundungan verbal/siber (P015)
                // + rendah diri (G007) + kesepian (G009)
                // → Menarik diri dari sosial akibat bullying verbal
                'kode_rule'  => 'RA-02',
                'kategori'   => 'Korban Dampak',
                'premise'    => ['G010', 'P015', 'G007', 'G009'],
                'conclusion' => 'DX-A02',
            ],
            [
                // Santri yang DIRUNDUNG (G010) + kabur dari pondok (P010)
                // + kecemasan umum (G001)
                // → Respons kabur/lari sebagai mekanisme pertahanan dari ancaman
                'kode_rule'  => 'RA-03',
                'kategori'   => 'Korban Dampak',
                'premise'    => ['G010', 'P010', 'G001'],
                'conclusion' => 'DX-A03',
            ],
            [
                // Santri yang DIRUNDUNG (G010) + gangguan belajar mengajar (P005)
                // + stres akademik (G004) + masalah kesehatan/kebersihan (P013)
                // → Menolak sekolah karena lingkungan bullying
                'kode_rule'  => 'RA-04',
                'kategori'   => 'Korban Dampak',
                'premise'    => ['G010', 'G004', 'P005', 'P013'],
                'conclusion' => 'DX-A04',
            ],
            [
                // Santri yang DIRUNDUNG (G010) + masalah konsentrasi (G006)
                // + stres akademik (G004)
                // → Penurunan fungsi kognitif akibat tekanan bullying
                'kode_rule'  => 'RA-05',
                'kategori'   => 'Korban Dampak',
                'premise'    => ['G010', 'G006', 'G004'],
                'conclusion' => 'DX-A05',
            ],
            [
                // Santri yang DIRUNDUNG (G010) + membawa senjata tajam (P012)
                // + kecemasan umum (G001)
                // → Paranoid membawa senjata untuk perlindungan diri
                'kode_rule'  => 'RA-06',
                'kategori'   => 'Korban Dampak',
                'premise'    => ['G010', 'P012', 'G001'],
                'conclusion' => 'DX-A06',
            ],
            [
                // Santri yang DIRUNDUNG (G010) + gangguan makan (G019)
                // + depresi (G003)
                // → Gangguan makan akibat depresi dari bullying
                'kode_rule'  => 'RA-07',
                'kategori'   => 'Korban Dampak',
                'premise'    => ['G010', 'G019', 'G003'],
                'conclusion' => 'DX-A07',
            ],
            [
                // Santri yang DIRUNDUNG (G010) + pacaran berlebihan (P011)
                // + kesepian (G009)
                // → Ketergantungan trauma pada pasangan/figur lain
                'kode_rule'  => 'RA-08',
                'kategori'   => 'Korban Dampak',
                'premise'    => ['G010', 'P011', 'G009'],
                'conclusion' => 'DX-A08',
            ],
            [
                // Santri yang DIRUNDUNG (G010) + gangguan emosi (G017)
                // + vandalisme/kotor (P003)
                // → Agresi reaktif: membalas dengan merusak atau marah-marah
                'kode_rule'  => 'RA-09',
                'kategori'   => 'Korban Dampak',
                'premise'    => ['G010', 'G017', 'P003'],
                'conclusion' => 'DX-A09',
            ],
            [
                // Santri yang DIRUNDUNG (G010) + menggunakan napza (P009)
                // + depresi (G003)
                // → Pemakaian zat untuk mematikan rasa sakit (numbing)
                'kode_rule'  => 'RA-10',
                'kategori'   => 'Korban Dampak',
                'premise'    => ['G010', 'P009', 'G003'],
                'conclusion' => 'DX-A10',
            ],
            [
                // Santri yang DIRUNDUNG (G010) + masalah kesehatan/diri (P013)
                // + kelelahan (G005)
                // → Ketidakberdayaan yang dipelajari: menyerah merawat diri
                'kode_rule'  => 'RA-11',
                'kategori'   => 'Korban Dampak',
                'premise'    => ['G010', 'P013', 'G005'],
                'conclusion' => 'DX-A11',
            ],
            [
                // Santri yang DIRUNDUNG (G010) + gangguan identitas (G015)
                // + melanggar etika/membantah (P006)
                // → Krisis identitas akibat julukan/label negatif dari bullying
                'kode_rule'  => 'RA-12',
                'kategori'   => 'Korban Dampak',
                'premise'    => ['G010', 'G015', 'P006'],
                'conclusion' => 'DX-A12',
            ],
        ];
    }

    // ══════════════════════════════════════════════════════════
    // DATA: KATEGORI PELAKU (RB-01..RB-12)
    // Tabel 3.11 dokumen
    // ══════════════════════════════════════════════════════════

    private function dataPelaku(): array
    {
        return [
            [
                // Santri melakukan kekerasan fisik (P001) + gangguan emosi (G017)
                // + pelanggaran etika (P006)
                // → Ledakan amarah yang impulsif dan tidak terkontrol (IED)
                'kode_rule'  => 'RB-01',
                'kategori'   => 'Pelaku',
                'premise'    => ['P001', 'G017', 'P006'],
                'conclusion' => 'DX-B01',
            ],
            [
                // Santri melakukan perundungan verbal/siber (P015)
                // + rendah diri (G007) + kesepian (G009)
                // → Bullying sebagai kompensasi insecurity/rendah diri
                'kode_rule'  => 'RB-02',
                'kategori'   => 'Pelaku',
                'premise'    => ['P015', 'G007', 'G009'],
                'conclusion' => 'DX-B02',
            ],
            [
                // Santri melakukan kekerasan fisik (P001) + masalah keluarga (G018)
                // + gangguan emosi (G017)
                // → Agresi yang dipindahkan dari masalah keluarga ke teman
                'kode_rule'  => 'RB-03',
                'kategori'   => 'Pelaku',
                'premise'    => ['P001', 'G018', 'G017'],
                'conclusion' => 'DX-B03',
            ],
            [
                // Santri melakukan kekerasan fisik (P001) + menggunakan napza (P009)
                // + melanggar aturan umum (P007)
                // → Kekerasan yang dipicu atau dipengaruhi zat
                'kode_rule'  => 'RB-04',
                'kategori'   => 'Pelaku',
                'premise'    => ['P001', 'P009', 'P007'],
                'conclusion' => 'DX-B04',
            ],
            [
                // Santri melakukan vandalisme/kotor (P003) + demotivasi belajar (G013)
                // + bolos/gangguan belajar (P005)
                // → Mencari sensasi/stimulasi karena bosan dan tidak termotivasi
                'kode_rule'  => 'RB-05',
                'kategori'   => 'Pelaku',
                'premise'    => ['P003', 'G013', 'P005'],
                'conclusion' => 'DX-B05',
            ],
            [
                // Santri melakukan kekerasan fisik (P001) sekaligus MENGALAMI bullying (G010)
                // → Siklus korban-pelaku: pernah jadi korban, kini jadi pelaku
                'kode_rule'  => 'RB-06',
                'kategori'   => 'Pelaku',
                'premise'    => ['P001', 'G010'],
                'conclusion' => 'DX-B06',
            ],
            [
                // Santri melakukan perundungan verbal/siber (P015)
                // + gangguan identitas (G015) + membawa/merokok (P008)
                // → Agresi akibat tekanan teman sebaya / ikut-ikutan geng
                'kode_rule'  => 'RB-07',
                'kategori'   => 'Pelaku',
                'premise'    => ['P015', 'G015', 'P008'],
                'conclusion' => 'DX-B07',
            ],
            [
                // Santri melakukan kekerasan fisik (P001) + overthinking (G008)
                // + mencuri/mengambil barang (P016)
                // → Kekerasan instrumental: digunakan sebagai alat untuk tujuan material
                'kode_rule'  => 'RB-08',
                'kategori'   => 'Pelaku',
                'premise'    => ['P001', 'G008', 'P016'],
                'conclusion' => 'DX-B08',
            ],
            [
                // Santri menggunakan bahasa kasar (P014) + gangguan emosi (G017)
                // + masalah konsentrasi (G006)
                // → Impulsivitas verbal: bicara kotor tanpa filter
                'kode_rule'  => 'RB-09',
                'kategori'   => 'Pelaku',
                'premise'    => ['P014', 'G017', 'G006'],
                'conclusion' => 'DX-B09',
            ],
            [
                // Santri melakukan kekerasan fisik (P001) + vandalisme (P003)
                // + kabur dari pondok (P010) + etika buruk (P006)
                // → Gangguan perilaku (Conduct Disorder): pola melanggar banyak norma
                'kode_rule'  => 'RB-10',
                'kategori'   => 'Pelaku',
                'premise'    => ['P001', 'P003', 'P010', 'P006'],
                'conclusion' => 'DX-B10',
            ],
            [
                // Santri membawa senjata tajam (P012) + kekerasan fisik (P001)
                // + gangguan identitas (G015)
                // → Keterlibatan atau risiko kekerasan geng
                'kode_rule'  => 'RB-11',
                'kategori'   => 'Pelaku',
                'premise'    => ['P012', 'P001', 'G015'],
                'conclusion' => 'DX-B11',
            ],
            [
                // Santri melanggar etika/membantah (P006)
                // + gangguan perfeksionisme/otoritas (G014)
                // → Konflik dengan otoritas: menolak aturan secara sistematis
                'kode_rule'  => 'RB-12',
                'kategori'   => 'Pelaku',
                'premise'    => ['P006', 'G014'],
                'conclusion' => 'DX-B12',
            ],
        ];
    }

    // ══════════════════════════════════════════════════════════
    // DATA: KATEGORI INTERNAL (RC-01..RC-19)
    // Tabel 3.12 dokumen (kode dikoreksi dari RB-01..RB-12 → RC-01..RC-12)
    // ══════════════════════════════════════════════════════════

    private function dataInternal(): array
    {
        return [
            [
                // Santri bermasalah di kegiatan belajar (P005) + sulit konsentrasi (G006)
                // + masalah kerapian (P004)
                // → Gejala ADHD Inatensi: tidak fokus, tidak rapi, tidak selesai tugas
                'kode_rule'  => 'RC-01',
                'kategori'   => 'Internal',
                'premise'    => ['P005', 'G006', 'P004'],
                'conclusion' => 'DX-C01',
            ],
            [
                // Santri bermasalah di belajar (P005) + stres akademik (G004)
                // + perfeksionisme (G014)
                // → Burnout akademik: kelelahan total akibat standar terlalu tinggi
                'kode_rule'  => 'RC-02',
                'kategori'   => 'Internal',
                'premise'    => ['P005', 'G004', 'G014'],
                'conclusion' => 'DX-C02',
            ],
            [
                // Santri masalah disiplin waktu/bolos (P002) + demotivasi belajar (G013)
                // + kecanduan (G011)
                // → Motivasi belajar hilang karena kecanduan gadget/game
                'kode_rule'  => 'RC-03',
                'kategori'   => 'Internal',
                'premise'    => ['P002', 'G013', 'G011'],
                'conclusion' => 'DX-C03',
            ],
            [
                // Santri bermasalah di belajar (P005) + rendah diri (G007)
                // + demotivasi belajar (G013)
                // → Ketidakberdayaan akademik: sudah menyerah sebelum mencoba
                'kode_rule'  => 'RC-04',
                'kategori'   => 'Internal',
                'premise'    => ['P005', 'G007', 'G013'],
                'conclusion' => 'DX-C04',
            ],
            [
                // Santri bermasalah di belajar (P005) + overthinking (G008)
                // → Paralisis analisis: tidak bisa memulai karena terlalu banyak pikir
                'kode_rule'  => 'RC-05',
                'kategori'   => 'Internal',
                'premise'    => ['P005', 'G008'],
                'conclusion' => 'DX-C05',
            ],
            [
                // Santri masalah kesehatan/tidak merawat diri (P013) + depresi (G003)
                // + kelelahan (G005)
                // → Depresi Mayor dengan manifestasi fisik: tidak mau mandi/makan/tidur
                'kode_rule'  => 'RC-06',
                'kategori'   => 'Internal',
                'premise'    => ['P013', 'G003', 'G005'],
                'conclusion' => 'DX-C06',
            ],
            [
                // Santri kecemasan umum (G001) + masalah kesehatan/diri (P013)
                // + gangguan tidur (G012)
                // → Kecemasan umum yang pervasif disertai insomnia
                'kode_rule'  => 'RC-07',
                'kategori'   => 'Internal',
                'premise'    => ['G001', 'P013', 'G012'],
                'conclusion' => 'DX-C07',
            ],
            [
                // Santri kabur dari pondok (P010) + depresi (G003) + kesepian (G009)
                // → Isolasi aktif: kabur dan menyendiri karena depresi + tidak ada teman
                'kode_rule'  => 'RC-08',
                'kategori'   => 'Internal',
                'premise'    => ['P010', 'G003', 'G009'],
                'conclusion' => 'DX-C08',
            ],
            [
                // Santri membawa senjata tajam (P012) + depresi (G003) + masalah kerapian (P004)
                // → Risiko menyakiti diri sendiri (NSSI): tanda-tanda self harm
                'kode_rule'  => 'RC-09',
                'kategori'   => 'Internal',
                'premise'    => ['P012', 'G003', 'P004'],
                'conclusion' => 'DX-C09',
            ],
            [
                // Santri depresi (G003) + gangguan emosi (G017) + gangguan identitas (G015)
                // → Disregulasi mood: mood tidak stabil kombinasi depresi+emosi+identitas
                'kode_rule'  => 'RC-10',
                'kategori'   => 'Internal',
                'premise'    => ['G003', 'G017', 'G015'],
                'conclusion' => 'DX-C10',
            ],
            [
                // Santri merokok (P008) + kecanduan (G011) + masalah belajar (P005)
                // → Ketergantungan nikotin yang mengganggu akademik
                'kode_rule'  => 'RC-11',
                'kategori'   => 'Internal',
                'premise'    => ['P008', 'G011', 'P005'],
                'conclusion' => 'DX-C11',
            ],
            [
                // Santri menggunakan napza (P009) + mencuri/ambil barang (P016)
                // + kecanduan (G011)
                // → Kriminalitas akibat kecanduan: mencuri untuk membiayai kebutuhan zat
                'kode_rule'  => 'RC-12',
                'kategori'   => 'Internal',
                'premise'    => ['P009', 'P016', 'G011'],
                'conclusion' => 'DX-C12',
            ],
            [
                // Santri masalah disiplin waktu (P002) + gangguan tidur (G012)
                // + kecanduan (G011)
                // → Gaming disorder: begadang karena game, tidak disiplin waktu
                'kode_rule'  => 'RC-13',
                'kategori'   => 'Internal',
                'premise'    => ['P002', 'G012', 'G011'],
                'conclusion' => 'DX-C13',
            ],
            [
                // Santri pacaran berlebihan (P011) + kabur (P010)
                // + gangguan identitas (G015)
                // → Perilaku seksual berisiko tinggi: pacaran serius + krisis identitas
                'kode_rule'  => 'RC-14',
                'kategori'   => 'Internal',
                'premise'    => ['P011', 'P010', 'G015'],
                'conclusion' => 'DX-C14',
            ],
            [
                // Santri merokok (P008) + stres akademik (G004)
                // → Coping maladaptif: merokok sebagai strategi pelarian dari stres
                'kode_rule'  => 'RC-15',
                'kategori'   => 'Internal',
                'premise'    => ['P008', 'G004'],
                'conclusion' => 'DX-C15',
            ],
            [
                // Santri kabur dari pondok (P010) + masalah keluarga (G018)
                // → Kabur sebagai pelarian dari masalah keluarga (broken home)
                'kode_rule'  => 'RC-16',
                'kategori'   => 'Internal',
                'premise'    => ['P010', 'G018'],
                'conclusion' => 'DX-C16',
            ],
            [
                // Santri masalah belajar (P005) + masalah keluarga (G018)
                // + stres akademik (G004)
                // → Dampak stres keluarga pada prestasi akademik
                'kode_rule'  => 'RC-17',
                'kategori'   => 'Internal',
                'premise'    => ['P005', 'G018', 'G004'],
                'conclusion' => 'DX-C17',
            ],
            [
                // Santri bahasa kasar (P014) + masalah keluarga (G018)
                // → Perilaku kasar dipelajari dari lingkungan/keluarga (modeling)
                'kode_rule'  => 'RC-18',
                'kategori'   => 'Internal',
                'premise'    => ['P014', 'G018'],
                'conclusion' => 'DX-C18',
            ],
            [
                // Santri masalah disiplin waktu (P002) + masalah keluarga (G018)
                // → Keterikatan rumah berlebihan: tidak disiplin karena ingin pulang terus
                'kode_rule'  => 'RC-19',
                'kategori'   => 'Internal',
                'premise'    => ['P002', 'G018'],
                'conclusion' => 'DX-C19',
            ],
        ];
    }
}