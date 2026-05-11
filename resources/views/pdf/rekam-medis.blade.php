<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Rekam Medis - {{ $santri->nama_lengkap }}</title>

    <style>
        /* ═══════════════════════════════════════════════════
           PAGE SETUP & RESET
           ═══════════════════════════════════════════════════ */
        @page {
            size: A4;
            margin: 18mm 18mm 18mm 18mm;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        /* DejaVu Sans = bundled di DomPDF, garansi render.
           Plus Jakarta Sans / Inter tidak akan ter-load tanpa register manual. */
        body {
            font-family: 'DejaVu Sans', 'Helvetica', sans-serif;
            font-size: 10pt;
            line-height: 1.55;
            color: #1a202c;
            background: #ffffff;
        }

        /* ═══════════════════════════════════════════════════
           DESIGN TOKENS (sebagai panduan, dipakai langsung di rules)
           ═══════════════════════════════════════════════════
           Primary navy : #1e3a5f
           Ink (body)   : #1a202c
           Muted        : #5a6b7c
           Border light : #d8dee5
           Border soft  : #ebeef2
           Bg subtle    : #f7f9fb
           Danger       : #b91c1c
           Success      : #15803d
           Warning      : #a16207
           ═══════════════════════════════════════════════════ */

        /* ═══════════════════════════════════════════════════
           HEADER — CENTERED MODERN
           Logo di atas, judul lembaga tengah, info kontak bawah,
           garis ganda tipis sebagai penutup formal.
           ═══════════════════════════════════════════════════ */
        .header {
            text-align: center;
            padding-bottom: 14pt;
            margin-bottom: 6pt;
            border-bottom: 1pt solid #1e3a5f;
        }

        /* Garis ganda dibuat dengan pseudo: pakai padding + border bawah body
           lalu div tambahan di bawah header untuk efek "double line" */
        .header-double-line {
            height: 2pt;
            border-top: 0.5pt solid #1e3a5f;
            margin-bottom: 22pt;
        }

        .logo {
            width: 64pt;
            height: 64pt;
            margin: 0 auto 10pt auto;
            display: block;
        }

        .header-yayasan {
            font-size: 8.5pt;
            font-weight: 600;
            color: #5a6b7c;
            text-transform: uppercase;
            letter-spacing: 1.2pt;
            margin-bottom: 4pt;
        }

        .header-lembaga {
            font-size: 15pt;
            font-weight: 700;
            color: #1e3a5f;
            margin-bottom: 4pt;
            line-height: 1.25;
            letter-spacing: 0.3pt;
        }

        .header-tagline {
            font-size: 8pt;
            font-style: italic;
            color: #5a6b7c;
            margin-bottom: 8pt;
        }

        .header-contact {
            font-size: 8.5pt;
            color: #5a6b7c;
            line-height: 1.5;
        }

        .header-contact strong {
            color: #1a202c;
            font-weight: 600;
        }

        /* ═══════════════════════════════════════════════════
           DOC TITLE — pusat, dengan ornament
           ═══════════════════════════════════════════════════ */
        .doc-title-wrap {
            text-align: center;
            margin: 0 0 16pt 0;
        }

        .doc-title-eyebrow {
            display: inline-block;
            font-size: 7.5pt;
            font-weight: 600;
            color: #5a6b7c;
            text-transform: uppercase;
            letter-spacing: 2.5pt;
            padding: 3pt 10pt;
            border: 0.5pt solid #d8dee5;
            border-radius: 12pt;
            margin-bottom: 10pt;
        }

        .doc-title h1 {
            font-size: 17pt;
            font-weight: 700;
            color: #1e3a5f;
            letter-spacing: 0.5pt;
            margin-bottom: 6pt;
        }

        .doc-number {
            font-size: 9pt;
            color: #5a6b7c;
            font-family: 'DejaVu Sans Mono', 'Courier New', monospace;
        }

        /* ═══════════════════════════════════════════════════
           SECTION — NUMBERED PILL HEADER
           Angka romawi dalam kotak rounded + judul section.
           Kunci: pakai inline-block, vertical-align middle,
           border-radius kecil agar reliable di DomPDF.
           ═══════════════════════════════════════════════════ */
        .section {
            margin-bottom: 14pt;
            page-break-inside: avoid;
        }

        .section-header {
            margin-bottom: 8pt;
            padding-bottom: 5pt;
            border-bottom: 0.75pt solid #d8dee5;
        }

        .section-pill {
            display: inline-block;
            background: #1e3a5f;
            color: #ffffff;
            font-size: 8.5pt;
            font-weight: 700;
            padding: 3pt 8pt;
            border-radius: 3pt;
            letter-spacing: 0.5pt;
            margin-right: 8pt;
            vertical-align: middle;
            min-width: 22pt;
            text-align: center;
        }

        .section-title {
            display: inline-block;
            font-size: 10.5pt;
            font-weight: 700;
            color: #1a202c;
            letter-spacing: 0.4pt;
            text-transform: uppercase;
            vertical-align: middle;
        }

        .section-body {
            padding: 4pt 2pt 4pt 2pt;
        }

        /* ═══════════════════════════════════════════════════
           INFO TABLE — 2 kolom rapi, zebra ringan
           ═══════════════════════════════════════════════════ */
        .info-table {
            width: 100%;
            border-collapse: collapse;
        }

        .info-table td {
            padding: 5pt 8pt;
            vertical-align: top;
        }

        .info-table tr:nth-child(even) {
            background: #f7f9fb;
        }

        .info-table .label {
            width: 35%;
            font-weight: 500;
            color: #5a6b7c;
            font-size: 9.5pt;
        }

        .info-table .separator {
            width: 2%;
            color: #5a6b7c;
            text-align: center;
        }

        .info-table .value {
            width: 63%;
            color: #1a202c;
            font-weight: 500;
            font-size: 9.5pt;
        }

        /* ═══════════════════════════════════════════════════
           STAMP — KONSEKUENSI / REWARD
           Frame dobel (outer + inner) untuk efek "stempel resmi".
           Layout: tabel 1-baris 2-kolom (kiri label vertikal stack,
           kanan deskripsi).
           ═══════════════════════════════════════════════════ */
        .stamp {
            margin: 14pt 0 16pt 0;
            page-break-inside: avoid;
            padding: 4pt;
            border: 1.5pt solid;
        }

        .stamp-inner {
            border: 0.5pt solid;
            padding: 10pt 12pt;
        }

        .stamp.stamp-danger { border-color: #b91c1c; background: #fef5f5; }
        .stamp.stamp-danger .stamp-inner { border-color: #b91c1c; }
        .stamp.stamp-success { border-color: #15803d; background: #f4faf6; }
        .stamp.stamp-success .stamp-inner { border-color: #15803d; }

        .stamp-table {
            width: 100%;
            border-collapse: collapse;
        }

        .stamp-table td {
            vertical-align: middle;
            padding: 0;
        }

        .stamp-label-cell {
            width: 110pt;
            padding-right: 14pt !important;
            border-right: 0.75pt solid;
        }

        .stamp-danger .stamp-label-cell { border-right-color: #b91c1c; }
        .stamp-success .stamp-label-cell { border-right-color: #15803d; }

        .stamp-eyebrow {
            font-size: 7pt;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1.5pt;
            color: #5a6b7c;
            margin-bottom: 3pt;
        }

        .stamp-label {
            font-size: 16pt;
            font-weight: 700;
            letter-spacing: 1pt;
            text-transform: uppercase;
            line-height: 1.1;
        }

        .stamp-danger .stamp-label { color: #b91c1c; }
        .stamp-success .stamp-label { color: #15803d; }

        .stamp-content-cell {
            padding-left: 14pt !important;
        }

        .stamp-code {
            font-size: 9pt;
            font-weight: 700;
            font-family: 'DejaVu Sans Mono', monospace;
            color: #1a202c;
            margin-bottom: 3pt;
            letter-spacing: 0.5pt;
        }

        .stamp-title {
            font-size: 11pt;
            font-weight: 700;
            color: #1a202c;
            margin-bottom: 5pt;
            line-height: 1.3;
        }

        .stamp-description {
            font-size: 9pt;
            color: #2d3748;
            line-height: 1.55;
        }

        .stamp-description strong {
            color: #1a202c;
            font-weight: 700;
        }

        /* ═══════════════════════════════════════════════════
           DEADLINE BOX
           ═══════════════════════════════════════════════════ */
        .deadline-section {
            border: 0.75pt solid #d8dee5;
            border-left: 3pt solid #a16207;
            background: #fffdf5;
            padding: 10pt 12pt;
            margin: 14pt 0;
            page-break-inside: avoid;
        }

        .deadline-header {
            font-size: 9pt;
            font-weight: 700;
            color: #a16207;
            text-transform: uppercase;
            letter-spacing: 1pt;
            margin-bottom: 7pt;
            padding-bottom: 4pt;
            border-bottom: 0.5pt solid #e5d9b8;
        }

        .deadline-table {
            width: 100%;
            margin-bottom: 4pt;
        }

        .deadline-table td {
            padding: 3pt 0;
            font-size: 9.5pt;
        }

        .deadline-label {
            width: 40%;
            font-weight: 500;
            color: #5a6b7c;
        }

        .deadline-value {
            width: 60%;
            color: #1a202c;
            font-weight: 600;
        }

        .kesepakatan-box {
            background: #ffffff;
            border: 0.5pt solid #e5d9b8;
            padding: 8pt 10pt;
            margin-top: 8pt;
        }

        .kesepakatan-title {
            font-size: 8.5pt;
            font-weight: 700;
            color: #a16207;
            text-transform: uppercase;
            letter-spacing: 0.8pt;
            margin-bottom: 4pt;
        }

        .kesepakatan-text {
            font-size: 9.5pt;
            line-height: 1.6;
            color: #2d3748;
        }

        /* ═══════════════════════════════════════════════════
           CONTENT BOX — paragraf bebas
           ═══════════════════════════════════════════════════ */
        .content-box {
            background: #f7f9fb;
            border-left: 3pt solid #1e3a5f;
            padding: 9pt 12pt;
            line-height: 1.65;
            font-size: 10pt;
            color: #2d3748;
            text-align: justify;
        }

        /* ═══════════════════════════════════════════════════
           STATISTICS GRID
           ═══════════════════════════════════════════════════ */
        .stats-grid {
            display: table;
            width: 100%;
            margin: 14pt 0;
            border-collapse: collapse;
        }

        .stat-cell {
            display: table-cell;
            width: 33.33%;
            text-align: center;
            padding: 12pt 8pt;
            border: 0.75pt solid #d8dee5;
            background: #ffffff;
        }

        .stat-label {
            font-size: 7.5pt;
            font-weight: 600;
            color: #5a6b7c;
            margin-bottom: 5pt;
            text-transform: uppercase;
            letter-spacing: 1.2pt;
        }

        .stat-value {
            font-size: 22pt;
            font-weight: 700;
            line-height: 1;
            margin: 4pt 0;
        }

        .stat-unit {
            font-size: 8pt;
            color: #8a98a8;
            text-transform: uppercase;
            letter-spacing: 0.8pt;
        }

        .stat-danger { color: #b91c1c; }
        .stat-success { color: #15803d; }
        .stat-info { color: #1e3a5f; }

        /* ═══════════════════════════════════════════════════
           DATA TABLE
           ═══════════════════════════════════════════════════ */
        table.data {
            width: 100%;
            border-collapse: collapse;
            margin: 4pt 0;
            font-size: 9pt;
        }

        table.data thead {
            background: #1e3a5f;
            color: #ffffff;
        }

        table.data th {
            padding: 7pt 6pt;
            text-align: left;
            font-weight: 600;
            font-size: 8.5pt;
            letter-spacing: 0.5pt;
            text-transform: uppercase;
            border: 0.5pt solid #1e3a5f;
        }

        table.data td {
            padding: 6pt;
            border: 0.5pt solid #e2e8f0;
            vertical-align: top;
        }

        table.data tbody tr:nth-child(odd) {
            background: #f7f9fb;
        }

        table.data .text-center { text-align: center; }
        table.data .text-right { text-align: right; }

        .badge {
            display: inline-block;
            padding: 2pt 6pt;
            border-radius: 2pt;
            font-size: 7.5pt;
            font-weight: 700;
            color: #ffffff;
            font-family: 'DejaVu Sans Mono', monospace;
            letter-spacing: 0.5pt;
        }

        .badge-danger { background: #b91c1c; }
        .badge-success { background: #15803d; }
        .badge-info { background: #1e3a5f; }

        .total-row {
            background: #edf2f7 !important;
            font-weight: 700;
        }

        .total-row td {
            border-top: 1.5pt solid #1e3a5f !important;
            padding: 7pt 6pt !important;
            font-size: 9.5pt;
        }

        /* ═══════════════════════════════════════════════════
           SIGNATURE
           ═══════════════════════════════════════════════════ */
        .signature-section {
            margin-top: 24pt;
            page-break-inside: avoid;
        }

        .signature-place {
            text-align: right;
            font-size: 9.5pt;
            color: #2d3748;
            margin-bottom: 6pt;
        }

        .signature-note {
            text-align: center;
            font-size: 8.5pt;
            font-style: italic;
            color: #5a6b7c;
            margin-bottom: 16pt;
        }

        .signature-grid {
            display: table;
            width: 100%;
            border-collapse: collapse;
        }

        .signature-box {
            display: table-cell;
            width: 33.33%;
            text-align: center;
            padding: 0 6pt;
            vertical-align: top;
        }

        .sign-title {
            font-size: 9pt;
            color: #5a6b7c;
            margin-bottom: 2pt;
        }

        .sign-role {
            font-size: 9.5pt;
            font-weight: 700;
            color: #1e3a5f;
            margin-bottom: 6pt;
            text-transform: uppercase;
            letter-spacing: 0.5pt;
        }

        .sign-space {
            height: 55pt;
        }

        .sign-name {
            font-size: 9.5pt;
            font-weight: 700;
            color: #1a202c;
            border-top: 0.75pt solid #1a202c;
            display: inline-block;
            padding: 3pt 18pt 0 18pt;
            min-width: 130pt;
        }

        /* ═══════════════════════════════════════════════════
           FOOTER
           ═══════════════════════════════════════════════════ */
        .footer {
            margin-top: 22pt;
            padding-top: 8pt;
            border-top: 0.5pt solid #d8dee5;
            text-align: center;
            font-size: 7.5pt;
            color: #8a98a8;
            line-height: 1.5;
        }

        .footer .footer-strong {
            color: #1e3a5f;
            font-weight: 600;
        }

        /* ═══════════════════════════════════════════════════
           UTILITIES
           ═══════════════════════════════════════════════════ */
        .no-break {
            page-break-inside: avoid;
        }

        .mt-section {
            margin-top: 14pt;
        }
    </style>
</head>
<body>
    {{-- ═══════════════════════════════════════════════════
         HEADER — CENTERED MODERN
         ═══════════════════════════════════════════════════ --}}
    <div class="header">
        <img src="{{ public_path('storage/defaultavatar.png') }}" alt="Logo" class="logo">

        <div class="header-yayasan">
            Yayasan Pondok Pesantren Muhammadiyah An Nur Sidoarjo
        </div>

        <div class="header-lembaga">
            {{ $lembaga }}
        </div>

        <div class="header-tagline">
            Unit Bimbingan dan Konseling
        </div>

        <div class="header-contact">
            Jl. Raya Pendidikan No. 123, Sidoarjo, Jawa Timur 61234<br>
            <strong>Telp.</strong> (031) 1234567 &nbsp;&middot;&nbsp;
            <strong>Email</strong> bk@annur-sidoarjo.sch.id
        </div>
    </div>
    <div class="header-double-line"></div>

    {{-- ═══════════════════════════════════════════════════
         DOC TITLE
         ═══════════════════════════════════════════════════ --}}
    <div class="doc-title-wrap">
        <div class="doc-title-eyebrow">Dokumen Resmi</div>
        <div class="doc-title">
            <h1>Rekam Medis Bimbingan Konseling</h1>
        </div>
        <div class="doc-number">
            No. {{ $laporan->kode }}/BK/{{ \Carbon\Carbon::parse($laporan->tanggal_trigger)->format('m/Y') }}
        </div>
    </div>

    {{-- ═══════════════════════════════════════════════════
         I. DATA SANTRI
         ═══════════════════════════════════════════════════ --}}
    <div class="section">
        <div class="section-header">
            <span class="section-pill">I</span>
            <span class="section-title">Data Santri</span>
        </div>
        <div class="section-body">
            <table class="info-table">
                <tr>
                    <td class="label">Nama Lengkap</td>
                    <td class="separator">:</td>
                    <td class="value">{{ $santri->nama_lengkap }}</td>
                </tr>
                <tr>
                    <td class="label">Nama Panggilan</td>
                    <td class="separator">:</td>
                    <td class="value">{{ $santri->nama_panggilan }}</td>
                </tr>
                <tr>
                    <td class="label">NISN</td>
                    <td class="separator">:</td>
                    <td class="value">{{ $santri->nisn }}</td>
                </tr>
                <tr>
                    <td class="label">Tempat, Tanggal Lahir</td>
                    <td class="separator">:</td>
                    <td class="value">{{ $santri->tempat_lahir }}, {{ \Carbon\Carbon::parse($santri->tanggal_lahir)->format('d F Y') }}</td>
                </tr>
                <tr>
                    <td class="label">Jenis Kelamin</td>
                    <td class="separator">:</td>
                    <td class="value">{{ $santri->jenis_kelamin }}</td>
                </tr>
                <tr>
                    <td class="label">Nama Wali</td>
                    <td class="separator">:</td>
                    <td class="value">{{ $santri->nama_wali }}</td>
                </tr>
                <tr>
                    <td class="label">Tanggal Pencatatan</td>
                    <td class="separator">:</td>
                    <td class="value">{{ \Carbon\Carbon::parse($laporan->tanggal_trigger)->format('d F Y, H:i') }} WIB</td>
                </tr>
            </table>
        </div>
    </div>

    {{-- ═══════════════════════════════════════════════════
         STAMP — KONSEKUENSI / REWARD
         ═══════════════════════════════════════════════════ --}}
    @if($laporan->jenis === 'konsekuensi')
    <div class="stamp stamp-danger no-break">
        <div class="stamp-inner">
            <table class="stamp-table">
                <tr>
                    <td class="stamp-label-cell">
                        <div class="stamp-eyebrow">Status</div>
                        <div class="stamp-label">Konse-<br>kuensi</div>
                    </td>
                    <td class="stamp-content-cell">
                        <div class="stamp-code">Kode: {{ $laporan->kode }}</div>
                        <div class="stamp-title">{{ $laporan->konsekuensi_atau_reward }}</div>
                        <div class="stamp-description">
                            Santri telah mengakumulasi <strong>{{ $laporan->total_poin_saat_trigger }} poin pelanggaran</strong>,
                            melampaui ambang batas <strong>{{ $laporan->threshold_poin_triggered }} poin</strong>
                            untuk konsekuensi kategori <strong>{{ $laporan->kode }}</strong>.
                        </div>
                    </td>
                </tr>
            </table>
        </div>
    </div>
    @else
    <div class="stamp stamp-success no-break">
        <div class="stamp-inner">
            <table class="stamp-table">
                <tr>
                    <td class="stamp-label-cell">
                        <div class="stamp-eyebrow">Status</div>
                        <div class="stamp-label">Penghar-<br>gaan</div>
                    </td>
                    <td class="stamp-content-cell">
                        <div class="stamp-code">Kode: {{ $laporan->kode }}</div>
                        <div class="stamp-title">{{ $laporan->konsekuensi_atau_reward }}</div>
                        <div class="stamp-description">
                            Santri telah mengakumulasi <strong>{{ $laporan->total_poin_saat_trigger }} poin apresiasi</strong>,
                            melampaui ambang batas <strong>{{ $laporan->threshold_poin_triggered }} poin</strong>
                            untuk penghargaan kategori <strong>{{ $laporan->kode }}</strong>.
                        </div>
                    </td>
                </tr>
            </table>
        </div>
    </div>
    @endif

    {{-- ═══════════════════════════════════════════════════
         DEADLINE & KESEPAKATAN
         ═══════════════════════════════════════════════════ --}}
    @if($laporan->tanggal_batas_pelaksanaan)
    <div class="deadline-section no-break">
        <div class="deadline-header">Batas Waktu Pelaksanaan &amp; Kesepakatan</div>

        <table class="deadline-table">
            <tr>
                <td class="deadline-label">Deadline Pelaksanaan</td>
                <td class="deadline-value">{{ \Carbon\Carbon::parse($laporan->tanggal_batas_pelaksanaan)->format('d F Y') }}</td>
            </tr>
            <tr>
                <td class="deadline-label">Tanggal Penetapan</td>
                <td class="deadline-value">{{ \Carbon\Carbon::parse($laporan->tanggal_selesai)->format('d F Y') }}</td>
            </tr>
            <tr>
                <td class="deadline-label">Durasi Pelaksanaan</td>
                <td class="deadline-value">{{ \Carbon\Carbon::parse($laporan->tanggal_selesai)->diffInDays(\Carbon\Carbon::parse($laporan->tanggal_batas_pelaksanaan)) }} hari</td>
            </tr>
        </table>

        @if($laporan->kesepakatan_keterlambatan)
        <div class="kesepakatan-box">
            <div class="kesepakatan-title">Kesepakatan Apabila Terlambat Upload Bukti</div>
            <div class="kesepakatan-text">{{ $laporan->kesepakatan_keterlambatan }}</div>
        </div>
        @endif
    </div>
    @endif

    {{-- ═══════════════════════════════════════════════════
         II. REKOMENDASI SISTEM
         ═══════════════════════════════════════════════════ --}}
    <div class="section">
        <div class="section-header">
            <span class="section-pill">II</span>
            <span class="section-title">Rekomendasi Sistem</span>
        </div>
        <div class="section-body">
            <div class="content-box">{{ $laporan->rekomendasi }}</div>
        </div>
    </div>

    {{-- ═══════════════════════════════════════════════════
         III. ANALISIS PEMBIMBING
         ═══════════════════════════════════════════════════ --}}
    @if($laporan->catatan_bk)
    <div class="section">
        <div class="section-header">
            <span class="section-pill">III</span>
            <span class="section-title">Analisis &amp; Catatan Pembimbing (BK)</span>
        </div>
        <div class="section-body">
            <div class="content-box">{{ $laporan->catatan_bk }}</div>
        </div>
    </div>
    @endif

    {{-- ═══════════════════════════════════════════════════
         IV. TINDAKAN
         ═══════════════════════════════════════════════════ --}}
    @if($laporan->aksi_bk)
    <div class="section">
        <div class="section-header">
            <span class="section-pill">IV</span>
            <span class="section-title">Tindakan yang Dilakukan</span>
        </div>
        <div class="section-body">
            <div class="content-box" style="white-space: pre-line;">{{ $laporan->aksi_bk }}</div>
        </div>
    </div>
    @endif

    {{-- ═══════════════════════════════════════════════════
         RINGKASAN STATISTIK
         ═══════════════════════════════════════════════════ --}}
    <div class="stats-grid no-break">
        <div class="stat-cell">
            <div class="stat-label">Total Pelanggaran</div>
            <div class="stat-value stat-danger">{{ $total_poin_pelanggaran }}</div>
            <div class="stat-unit">Poin</div>
        </div>
        <div class="stat-cell">
            <div class="stat-label">Total Apresiasi</div>
            <div class="stat-value stat-success">{{ $total_poin_apresiasi }}</div>
            <div class="stat-unit">Poin</div>
        </div>
        <div class="stat-cell">
            <div class="stat-label">Jumlah Kasus</div>
            <div class="stat-value stat-info">{{ $riwayat_pelanggaran->count() + $riwayat_apresiasi->count() }}</div>
            <div class="stat-unit">Kasus</div>
        </div>
    </div>

    {{-- ═══════════════════════════════════════════════════
         V. RIWAYAT PELANGGARAN
         ═══════════════════════════════════════════════════ --}}
    @if($riwayat_pelanggaran->count() > 0)
    <div class="section">
        <div class="section-header">
            <span class="section-pill">V</span>
            <span class="section-title">Riwayat Pelanggaran Lengkap</span>
        </div>
        <div class="section-body" style="padding: 0;">
            <table class="data">
                <thead>
                    <tr>
                        <th width="5%" class="text-center">No</th>
                        <th width="13%">Tanggal</th>
                        <th width="11%">Kode</th>
                        <th width="56%">Keterangan</th>
                        <th width="15%" class="text-center">Poin</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($riwayat_pelanggaran as $index => $item)
                    <tr>
                        <td class="text-center">{{ $index + 1 }}</td>
                        <td>{{ \Carbon\Carbon::parse($item->tanggal_kejadian)->format('d/m/Y') }}</td>
                        <td><span class="badge badge-danger">{{ $item->kode }}</span></td>
                        <td>{{ $item->ringkasan }}</td>
                        <td class="text-center" style="font-weight: 700; color: #b91c1c;">{{ $item->bobot_poin }}</td>
                    </tr>
                    @endforeach
                    <tr class="total-row">
                        <td colspan="4" class="text-right">TOTAL POIN PELANGGARAN</td>
                        <td class="text-center" style="font-weight: 700; color: #b91c1c;">{{ $total_poin_pelanggaran }}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
    @endif

    {{-- ═══════════════════════════════════════════════════
         VI. RIWAYAT APRESIASI
         ═══════════════════════════════════════════════════ --}}
    @if($riwayat_apresiasi->count() > 0)
    <div class="section">
        <div class="section-header">
            <span class="section-pill">VI</span>
            <span class="section-title">Riwayat Apresiasi Lengkap</span>
        </div>
        <div class="section-body" style="padding: 0;">
            <table class="data">
                <thead>
                    <tr>
                        <th width="5%" class="text-center">No</th>
                        <th width="13%">Tanggal</th>
                        <th width="11%">Kode</th>
                        <th width="56%">Keterangan</th>
                        <th width="15%" class="text-center">Poin</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($riwayat_apresiasi as $index => $item)
                    <tr>
                        <td class="text-center">{{ $index + 1 }}</td>
                        <td>{{ \Carbon\Carbon::parse($item->tanggal_kejadian)->format('d/m/Y') }}</td>
                        <td><span class="badge badge-success">{{ $item->kode }}</span></td>
                        <td>{{ $item->ringkasan }}</td>
                        <td class="text-center" style="font-weight: 700; color: #15803d;">+{{ $item->bobot_poin }}</td>
                    </tr>
                    @endforeach
                    <tr class="total-row">
                        <td colspan="4" class="text-right">TOTAL POIN APRESIASI</td>
                        <td class="text-center" style="font-weight: 700; color: #15803d;">{{ $total_poin_apresiasi }}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
    @endif

    {{-- ═══════════════════════════════════════════════════
         VII. RIWAYAT KONSELING
         ═══════════════════════════════════════════════════ --}}
    @if($riwayat_konseling->count() > 0)
    <div class="section">
        <div class="section-header">
            <span class="section-pill">VII</span>
            <span class="section-title">Riwayat Konseling</span>
        </div>
        <div class="section-body" style="padding: 0;">
            <table class="data">
                <thead>
                    <tr>
                        <th width="5%" class="text-center">No</th>
                        <th width="13%">Tanggal</th>
                        <th width="11%">Kode</th>
                        <th width="71%">Keterangan</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($riwayat_konseling as $index => $item)
                    <tr>
                        <td class="text-center">{{ $index + 1 }}</td>
                        <td>{{ \Carbon\Carbon::parse($item->tanggal_kejadian)->format('d/m/Y') }}</td>
                        <td><span class="badge badge-info">{{ $item->kode }}</span></td>
                        <td>{{ $item->ringkasan }}</td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    </div>
    @endif

    {{-- ═══════════════════════════════════════════════════
         TANDA TANGAN
         ═══════════════════════════════════════════════════ --}}
    <div class="signature-section">
        <div class="signature-place">
            Sidoarjo, {{ $tanggal_cetak }}
        </div>

        <div class="signature-note">
            Dokumen ini merupakan rekam medis resmi yang ditandatangani oleh pihak-pihak terkait
        </div>

        <div class="signature-grid">
            <div class="signature-box">
                <div class="sign-title">Mengetahui,</div>
                <div class="sign-role">Kepala Bimbingan Konseling</div>
                <div class="sign-space"></div>
                <div class="sign-name">
                    @if($validator)
                        {{ $validator->nama_lengkap }}
                    @else
                        ( ........................... )
                    @endif
                </div>
            </div>

            <div class="signature-box">
                <div class="sign-title">Menyetujui,</div>
                <div class="sign-role">Orang Tua / Wali Santri</div>
                <div class="sign-space"></div>
                <div class="sign-name">{{ $santri->nama_wali }}</div>
            </div>

            <div class="signature-box">
                <div class="sign-title">Yang Bersangkutan,</div>
                <div class="sign-role">Santri</div>
                <div class="sign-space"></div>
                <div class="sign-name">{{ $santri->nama_lengkap }}</div>
            </div>
        </div>
    </div>

    {{-- ═══════════════════════════════════════════════════
         FOOTER
         ═══════════════════════════════════════════════════ --}}
    <div class="footer">
        <p>Dicetak pada: <span class="footer-strong">{{ $tanggal_cetak }}</span></p>
        <p>Dokumen Resmi Bimbingan Konseling &mdash; <span class="footer-strong">{{ $lembaga }}</span></p>
        <p style="margin-top: 3pt; font-size: 7pt;">Yayasan Pondok Pesantren Muhammadiyah An Nur Sidoarjo</p>
    </div>
</body>
</html>