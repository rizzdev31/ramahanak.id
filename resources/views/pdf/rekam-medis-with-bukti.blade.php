<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Rekam Medis Lengkap - {{ $santri->nama_lengkap }}</title>

    <style>
        /* ═══════════════════════════════════════════════════
           PAGE SETUP
           Margin lebih ramping (15mm) karena dokumen ini lebih
           padat (ada bukti). Font dasar 9pt agar fit lebih banyak.
           ═══════════════════════════════════════════════════ */
        @page {
            size: A4;
            margin: 15mm;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'DejaVu Sans', 'Helvetica', sans-serif;
            font-size: 9pt;
            line-height: 1.5;
            color: #1a202c;
            background: #ffffff;
        }

        /* ═══════════════════════════════════════════════════
           HEADER — CENTERED MODERN (compact)
           ═══════════════════════════════════════════════════ */
        .header {
            text-align: center;
            padding-bottom: 10pt;
            margin-bottom: 4pt;
            border-bottom: 1pt solid #1e3a5f;
        }

        .header-double-line {
            height: 2pt;
            border-top: 0.5pt solid #1e3a5f;
            margin-bottom: 16pt;
        }

        .logo {
            width: 50pt;
            height: 50pt;
            margin: 0 auto 7pt auto;
            display: block;
        }

        .header-yayasan {
            font-size: 7.5pt;
            font-weight: 600;
            color: #5a6b7c;
            text-transform: uppercase;
            letter-spacing: 1pt;
            margin-bottom: 3pt;
        }

        .header-lembaga {
            font-size: 12pt;
            font-weight: 700;
            color: #1e3a5f;
            margin-bottom: 3pt;
            line-height: 1.2;
        }

        .header-tagline {
            font-size: 7pt;
            font-style: italic;
            color: #5a6b7c;
            margin-bottom: 5pt;
        }

        .header-contact {
            font-size: 7.5pt;
            color: #5a6b7c;
        }

        .header-contact strong {
            color: #1a202c;
            font-weight: 600;
        }

        /* ═══════════════════════════════════════════════════
           DOC TITLE
           ═══════════════════════════════════════════════════ */
        .doc-title-wrap {
            text-align: center;
            margin-bottom: 12pt;
        }

        .doc-title-eyebrow {
            display: inline-block;
            font-size: 6.5pt;
            font-weight: 600;
            color: #5a6b7c;
            text-transform: uppercase;
            letter-spacing: 2pt;
            padding: 2pt 8pt;
            border: 0.5pt solid #d8dee5;
            border-radius: 10pt;
            margin-bottom: 7pt;
        }

        .doc-title h1 {
            font-size: 13pt;
            font-weight: 700;
            color: #1e3a5f;
            letter-spacing: 0.4pt;
            margin-bottom: 4pt;
        }

        .doc-number {
            font-size: 8pt;
            color: #5a6b7c;
            font-family: 'DejaVu Sans Mono', 'Courier New', monospace;
        }

        /* ═══════════════════════════════════════════════════
           SECTION — NUMBERED PILL HEADER
           ═══════════════════════════════════════════════════ */
        .section {
            margin-bottom: 10pt;
            page-break-inside: avoid;
        }

        .section-header {
            margin-bottom: 6pt;
            padding-bottom: 3pt;
            border-bottom: 0.5pt solid #d8dee5;
        }

        .section-pill {
            display: inline-block;
            background: #1e3a5f;
            color: #ffffff;
            font-size: 7.5pt;
            font-weight: 700;
            padding: 2pt 6pt;
            border-radius: 2.5pt;
            letter-spacing: 0.4pt;
            margin-right: 6pt;
            vertical-align: middle;
            min-width: 18pt;
            text-align: center;
        }

        .section-title {
            display: inline-block;
            font-size: 9pt;
            font-weight: 700;
            color: #1a202c;
            letter-spacing: 0.3pt;
            text-transform: uppercase;
            vertical-align: middle;
        }

        .section-body {
            padding: 2pt;
        }

        /* ═══════════════════════════════════════════════════
           INFO TABLE
           ═══════════════════════════════════════════════════ */
        .info-table {
            width: 100%;
            border-collapse: collapse;
        }

        .info-table td {
            padding: 3pt 6pt;
            font-size: 8pt;
            vertical-align: top;
        }

        .info-table tr:nth-child(even) {
            background: #f7f9fb;
        }

        .info-table .label {
            width: 28%;
            font-weight: 500;
            color: #5a6b7c;
        }

        .info-table .separator {
            width: 2%;
            text-align: center;
            color: #5a6b7c;
        }

        .info-table .value {
            width: 70%;
            color: #1a202c;
            font-weight: 500;
        }

        /* ═══════════════════════════════════════════════════
           STAMP — KONSEKUENSI / REWARD (compact)
           ═══════════════════════════════════════════════════ */
        .stamp {
            margin: 8pt 0 10pt 0;
            padding: 3pt;
            border: 1.25pt solid;
            page-break-inside: avoid;
        }

        .stamp-inner {
            border: 0.5pt solid;
            padding: 7pt 9pt;
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
            width: 85pt;
            padding-right: 10pt !important;
            border-right: 0.6pt solid;
        }

        .stamp-danger .stamp-label-cell { border-right-color: #b91c1c; }
        .stamp-success .stamp-label-cell { border-right-color: #15803d; }

        .stamp-eyebrow {
            font-size: 6pt;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1.2pt;
            color: #5a6b7c;
            margin-bottom: 2pt;
        }

        .stamp-label {
            font-size: 12pt;
            font-weight: 700;
            letter-spacing: 0.7pt;
            text-transform: uppercase;
            line-height: 1.05;
        }

        .stamp-danger .stamp-label { color: #b91c1c; }
        .stamp-success .stamp-label { color: #15803d; }

        .stamp-content-cell {
            padding-left: 10pt !important;
        }

        .stamp-code {
            font-size: 8pt;
            font-weight: 700;
            font-family: 'DejaVu Sans Mono', monospace;
            color: #1a202c;
            margin-bottom: 2pt;
            letter-spacing: 0.4pt;
        }

        .stamp-title {
            font-size: 9pt;
            font-weight: 700;
            color: #1a202c;
            margin-bottom: 3pt;
            line-height: 1.3;
        }

        .stamp-description {
            font-size: 7.5pt;
            color: #2d3748;
            line-height: 1.5;
        }

        .stamp-description strong {
            color: #1a202c;
            font-weight: 700;
        }

        /* ═══════════════════════════════════════════════════
           DEADLINE
           ═══════════════════════════════════════════════════ */
        .deadline-section {
            border: 0.5pt solid #d8dee5;
            border-left: 2.5pt solid #a16207;
            background: #fffdf5;
            padding: 7pt 9pt;
            margin: 8pt 0;
            page-break-inside: avoid;
        }

        .deadline-header {
            font-size: 8pt;
            font-weight: 700;
            color: #a16207;
            text-transform: uppercase;
            letter-spacing: 0.8pt;
            margin-bottom: 5pt;
            padding-bottom: 3pt;
            border-bottom: 0.5pt solid #e5d9b8;
        }

        .deadline-table {
            width: 100%;
        }

        .deadline-table td {
            padding: 2pt 0;
            font-size: 8pt;
        }

        .deadline-label {
            width: 35%;
            font-weight: 500;
            color: #5a6b7c;
        }

        .deadline-value {
            width: 65%;
            color: #1a202c;
            font-weight: 600;
        }

        .kesepakatan-box {
            background: #ffffff;
            border: 0.5pt solid #e5d9b8;
            padding: 5pt 7pt;
            margin-top: 5pt;
        }

        .kesepakatan-title {
            font-size: 7pt;
            font-weight: 700;
            color: #a16207;
            text-transform: uppercase;
            letter-spacing: 0.6pt;
            margin-bottom: 2pt;
        }

        .kesepakatan-text {
            font-size: 8pt;
            line-height: 1.5;
            color: #2d3748;
        }

        /* ═══════════════════════════════════════════════════
           CONTENT BOX
           ═══════════════════════════════════════════════════ */
        .content-box {
            background: #f7f9fb;
            border-left: 2.5pt solid #1e3a5f;
            padding: 6pt 9pt;
            line-height: 1.55;
            font-size: 8.5pt;
            color: #2d3748;
            text-align: justify;
        }

        /* ═══════════════════════════════════════════════════
           STATS GRID
           ═══════════════════════════════════════════════════ */
        .stats-grid {
            display: table;
            width: 100%;
            margin: 8pt 0;
            border-collapse: collapse;
        }

        .stat-cell {
            display: table-cell;
            width: 33.33%;
            text-align: center;
            padding: 7pt 5pt;
            border: 0.5pt solid #d8dee5;
            background: #ffffff;
        }

        .stat-label {
            font-size: 6.5pt;
            font-weight: 600;
            color: #5a6b7c;
            margin-bottom: 3pt;
            text-transform: uppercase;
            letter-spacing: 1pt;
        }

        .stat-value {
            font-size: 16pt;
            font-weight: 700;
            line-height: 1;
            margin: 2pt 0;
        }

        .stat-unit {
            font-size: 6.5pt;
            color: #8a98a8;
            text-transform: uppercase;
            letter-spacing: 0.7pt;
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
            font-size: 7.5pt;
        }

        table.data thead {
            background: #1e3a5f;
            color: #ffffff;
        }

        table.data th {
            padding: 4pt 5pt;
            text-align: left;
            font-weight: 600;
            font-size: 7pt;
            letter-spacing: 0.4pt;
            text-transform: uppercase;
            border: 0.5pt solid #1e3a5f;
        }

        table.data td {
            padding: 4pt 5pt;
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
            padding: 1.5pt 4pt;
            border-radius: 1.5pt;
            font-size: 6pt;
            font-weight: 700;
            color: #ffffff;
            font-family: 'DejaVu Sans Mono', monospace;
            letter-spacing: 0.3pt;
        }

        .badge-danger { background: #b91c1c; }
        .badge-success { background: #15803d; }
        .badge-info { background: #1e3a5f; }

        .total-row {
            background: #edf2f7 !important;
            font-weight: 700;
        }

        .total-row td {
            border-top: 1pt solid #1e3a5f !important;
            font-size: 7.5pt;
        }

        /* ═══════════════════════════════════════════════════
           BUKTI PELAKSANAAN — GRID 2 KOLOM via <table>
           Memakai <table> bukan inline-block karena lebih reliable
           di DomPDF. Setiap pasangan bukti dibungkus dalam <tr>
           dengan 2 <td>, plus <td colspan="2"> kalau ganjil.
           ═══════════════════════════════════════════════════ */
        .bukti-section {
            margin: 10pt 0 6pt 0;
        }

        .bukti-header {
            margin-bottom: 6pt;
            padding-bottom: 3pt;
            border-bottom: 0.5pt solid #d8dee5;
        }

        .bukti-pill {
            display: inline-block;
            background: #15803d;
            color: #ffffff;
            font-size: 7.5pt;
            font-weight: 700;
            padding: 2pt 6pt;
            border-radius: 2.5pt;
            letter-spacing: 0.4pt;
            margin-right: 6pt;
            vertical-align: middle;
            min-width: 18pt;
            text-align: center;
        }

        .bukti-title-text {
            display: inline-block;
            font-size: 9pt;
            font-weight: 700;
            color: #1a202c;
            letter-spacing: 0.3pt;
            text-transform: uppercase;
            vertical-align: middle;
        }

        .bukti-grid {
            width: 100%;
            border-collapse: separate;
            border-spacing: 5pt 5pt;
        }

        .bukti-grid > tbody > tr > td {
            width: 50%;
            vertical-align: top;
            padding: 0;
        }

        .bukti-card {
            border: 0.5pt solid #d8dee5;
            background: #ffffff;
            padding: 5pt;
            page-break-inside: avoid;
        }

        .bukti-card-header {
            display: table;
            width: 100%;
            margin-bottom: 4pt;
            padding-bottom: 3pt;
            border-bottom: 0.5pt solid #ebeef2;
        }

        .bukti-num {
            display: table-cell;
            font-size: 6.5pt;
            font-weight: 700;
            color: #15803d;
            text-transform: uppercase;
            letter-spacing: 0.8pt;
            vertical-align: middle;
        }

        .bukti-date {
            display: table-cell;
            font-size: 6.5pt;
            color: #5a6b7c;
            text-align: right;
            vertical-align: middle;
        }

        .bukti-image-wrap {
            width: 100%;
            text-align: center;
            background: #f7f9fb;
            border: 0.5pt solid #ebeef2;
            margin-bottom: 4pt;
        }

        .bukti-image {
            max-width: 100%;
            max-height: 110pt;
            display: block;
            margin: 0 auto;
        }

        .bukti-pdf-box {
            width: 100%;
            height: 110pt;
            background: #fef5f5;
            border: 0.5pt dashed #fc8181;
            text-align: center;
            margin-bottom: 4pt;
            /* Pakai padding-top untuk centering vertikal sederhana
               karena flexbox tidak reliable di DomPDF */
            padding-top: 32pt;
        }

        .bukti-pdf-icon {
            font-size: 22pt;
            font-weight: 700;
            color: #b91c1c;
            font-family: 'DejaVu Sans Mono', monospace;
        }

        .bukti-pdf-label {
            font-size: 7pt;
            color: #b91c1c;
            margin-top: 2pt;
            font-weight: 600;
            letter-spacing: 0.5pt;
        }

        .bukti-meta {
            font-size: 6.5pt;
            color: #5a6b7c;
            line-height: 1.4;
        }

        .bukti-filename {
            font-weight: 600;
            color: #1a202c;
            margin-bottom: 1pt;
            word-wrap: break-word;
            font-size: 7pt;
        }

        .bukti-meta-row {
            color: #8a98a8;
            font-size: 6pt;
        }

        .bukti-keterangan {
            font-size: 6.5pt;
            color: #2d3748;
            font-style: italic;
            margin-top: 3pt;
            padding: 3pt 5pt;
            background: #f7f9fb;
            border-left: 1.5pt solid #15803d;
        }

        /* ═══════════════════════════════════════════════════
           SIGNATURE
           ═══════════════════════════════════════════════════ */
        .signature-section {
            margin-top: 14pt;
            page-break-inside: avoid;
        }

        .signature-place {
            text-align: right;
            font-size: 8pt;
            color: #2d3748;
            margin-bottom: 4pt;
        }

        .signature-note {
            text-align: center;
            font-size: 7pt;
            font-style: italic;
            color: #5a6b7c;
            margin-bottom: 10pt;
        }

        .signature-grid {
            display: table;
            width: 100%;
        }

        .signature-box {
            display: table-cell;
            width: 33.33%;
            text-align: center;
            padding: 0 5pt;
            vertical-align: top;
        }

        .sign-title {
            font-size: 7.5pt;
            color: #5a6b7c;
            margin-bottom: 1pt;
        }

        .sign-role {
            font-size: 8pt;
            font-weight: 700;
            color: #1e3a5f;
            margin-bottom: 4pt;
            text-transform: uppercase;
            letter-spacing: 0.3pt;
        }

        .sign-space {
            height: 35pt;
        }

        .sign-name {
            font-size: 8pt;
            font-weight: 700;
            color: #1a202c;
            border-top: 0.5pt solid #1a202c;
            display: inline-block;
            padding: 2pt 12pt 0 12pt;
            min-width: 100pt;
        }

        /* ═══════════════════════════════════════════════════
           FOOTER
           ═══════════════════════════════════════════════════ */
        .footer {
            margin-top: 12pt;
            padding-top: 5pt;
            border-top: 0.5pt solid #d8dee5;
            text-align: center;
            font-size: 6.5pt;
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
    </style>
</head>
<body>
    {{-- ═══════════════════════════════════════════════════
         HEADER
         ═══════════════════════════════════════════════════ --}}
    <div class="header">
        <img src="{{ public_path('storage/defaultavatar.png') }}" alt="Logo" class="logo">
        <div class="header-yayasan">Yayasan Pondok Pesantren Muhammadiyah An Nur Sidoarjo</div>
        <div class="header-lembaga">{{ $lembaga }}</div>
        <div class="header-tagline">Unit Bimbingan dan Konseling</div>
        <div class="header-contact">
            Jl. Raya Pendidikan No. 123, Sidoarjo &middot;
            <strong>Telp.</strong> (031) 1234567
        </div>
    </div>
    <div class="header-double-line"></div>

    {{-- ═══════════════════════════════════════════════════
         DOC TITLE
         ═══════════════════════════════════════════════════ --}}
    <div class="doc-title-wrap">
        <div class="doc-title-eyebrow">Dokumen Lengkap dengan Bukti</div>
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
                    <td class="label">Nama Wali</td>
                    <td class="separator">:</td>
                    <td class="value">{{ $santri->nama_wali }}</td>
                </tr>
            </table>
        </div>
    </div>

    {{-- ═══════════════════════════════════════════════════
         STAMP
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
                            <strong>{{ $laporan->total_poin_saat_trigger }} poin pelanggaran</strong>
                            (threshold {{ $laporan->threshold_poin_triggered }} poin).
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
                            <strong>{{ $laporan->total_poin_saat_trigger }} poin apresiasi</strong>
                            (threshold {{ $laporan->threshold_poin_triggered }} poin).
                        </div>
                    </td>
                </tr>
            </table>
        </div>
    </div>
    @endif

    {{-- ═══════════════════════════════════════════════════
         DEADLINE
         ═══════════════════════════════════════════════════ --}}
    @if($laporan->tanggal_batas_pelaksanaan)
    <div class="deadline-section no-break">
        <div class="deadline-header">Batas Waktu Pelaksanaan</div>
        <table class="deadline-table">
            <tr>
                <td class="deadline-label">Batas Upload Bukti</td>
                <td class="deadline-value">{{ \Carbon\Carbon::parse($laporan->tanggal_batas_pelaksanaan)->format('d F Y') }}</td>
            </tr>
        </table>
        @if($laporan->kesepakatan_keterlambatan)
        <div class="kesepakatan-box">
            <div class="kesepakatan-title">Kesepakatan Apabila Terlambat</div>
            <div class="kesepakatan-text">{{ $laporan->kesepakatan_keterlambatan }}</div>
        </div>
        @endif
    </div>
    @endif

    {{-- ═══════════════════════════════════════════════════
         II. REKOMENDASI
         ═══════════════════════════════════════════════════ --}}
    <div class="section">
        <div class="section-header">
            <span class="section-pill">II</span>
            <span class="section-title">Rekomendasi</span>
        </div>
        <div class="section-body">
            <div class="content-box">{{ $laporan->rekomendasi }}</div>
        </div>
    </div>

    {{-- ═══════════════════════════════════════════════════
         III. CATATAN BK
         ═══════════════════════════════════════════════════ --}}
    @if($laporan->catatan_bk)
    <div class="section">
        <div class="section-header">
            <span class="section-pill">III</span>
            <span class="section-title">Catatan Pembimbing (BK)</span>
        </div>
        <div class="section-body">
            <div class="content-box">{{ $laporan->catatan_bk }}</div>
        </div>
    </div>
    @endif

    {{-- ═══════════════════════════════════════════════════
         STATS
         ═══════════════════════════════════════════════════ --}}
    <div class="stats-grid no-break">
        <div class="stat-cell">
            <div class="stat-label">Pelanggaran</div>
            <div class="stat-value stat-danger">{{ $total_poin_pelanggaran }}</div>
            <div class="stat-unit">Poin</div>
        </div>
        <div class="stat-cell">
            <div class="stat-label">Apresiasi</div>
            <div class="stat-value stat-success">{{ $total_poin_apresiasi }}</div>
            <div class="stat-unit">Poin</div>
        </div>
        <div class="stat-cell">
            <div class="stat-label">Total Kasus</div>
            <div class="stat-value stat-info">{{ $riwayat_pelanggaran->count() + $riwayat_apresiasi->count() }}</div>
            <div class="stat-unit">Kasus</div>
        </div>
    </div>

    {{-- ═══════════════════════════════════════════════════
         IV. RIWAYAT PELANGGARAN (top 5)
         ═══════════════════════════════════════════════════ --}}
    @if($riwayat_pelanggaran->count() > 0)
    <div class="section">
        <div class="section-header">
            <span class="section-pill">IV</span>
            <span class="section-title">Riwayat Pelanggaran</span>
        </div>
        <div class="section-body" style="padding: 0;">
            <table class="data">
                <thead>
                    <tr>
                        <th width="5%" class="text-center">No</th>
                        <th width="13%">Tanggal</th>
                        <th width="62%">Keterangan</th>
                        <th width="20%" class="text-center">Poin</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($riwayat_pelanggaran->take(5) as $index => $item)
                    <tr>
                        <td class="text-center">{{ $index + 1 }}</td>
                        <td>{{ \Carbon\Carbon::parse($item->tanggal_kejadian)->format('d/m/y') }}</td>
                        <td>{{ $item->ringkasan }}</td>
                        <td class="text-center" style="font-weight: 700; color: #b91c1c;">{{ $item->bobot_poin }}</td>
                    </tr>
                    @endforeach
                    @if($riwayat_pelanggaran->count() > 5)
                    <tr>
                        <td colspan="4" class="text-center" style="font-style: italic; color: #5a6b7c;">
                            &middot;&middot;&middot; dan {{ $riwayat_pelanggaran->count() - 5 }} kasus lainnya
                        </td>
                    </tr>
                    @endif
                    <tr class="total-row">
                        <td colspan="3" class="text-right">TOTAL</td>
                        <td class="text-center" style="font-weight: 700; color: #b91c1c;">{{ $total_poin_pelanggaran }}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
    @endif

    {{-- ═══════════════════════════════════════════════════
         V. RIWAYAT APRESIASI (top 5)
         ═══════════════════════════════════════════════════ --}}
    @if($riwayat_apresiasi->count() > 0)
    <div class="section">
        <div class="section-header">
            <span class="section-pill">V</span>
            <span class="section-title">Riwayat Apresiasi</span>
        </div>
        <div class="section-body" style="padding: 0;">
            <table class="data">
                <thead>
                    <tr>
                        <th width="5%" class="text-center">No</th>
                        <th width="13%">Tanggal</th>
                        <th width="62%">Keterangan</th>
                        <th width="20%" class="text-center">Poin</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($riwayat_apresiasi->take(5) as $index => $item)
                    <tr>
                        <td class="text-center">{{ $index + 1 }}</td>
                        <td>{{ \Carbon\Carbon::parse($item->tanggal_kejadian)->format('d/m/y') }}</td>
                        <td>{{ $item->ringkasan }}</td>
                        <td class="text-center" style="font-weight: 700; color: #15803d;">+{{ $item->bobot_poin }}</td>
                    </tr>
                    @endforeach
                    @if($riwayat_apresiasi->count() > 5)
                    <tr>
                        <td colspan="4" class="text-center" style="font-style: italic; color: #5a6b7c;">
                            &middot;&middot;&middot; dan {{ $riwayat_apresiasi->count() - 5 }} kasus lainnya
                        </td>
                    </tr>
                    @endif
                    <tr class="total-row">
                        <td colspan="3" class="text-right">TOTAL</td>
                        <td class="text-center" style="font-weight: 700; color: #15803d;">{{ $total_poin_apresiasi }}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
    @endif

    {{-- ═══════════════════════════════════════════════════
         VI. BUKTI PELAKSANAAN (Grid 2 kolom via <table>)

         CARA KERJA:
         - $buktis di-chunk per 2 item, masing-masing chunk jadi <tr>
         - Kalau jumlah ganjil, slot terakhir kosong (<td>&nbsp;</td>)
         - Setiap card pakai page-break-inside: avoid agar tidak
           terpotong di tengah saat ganti halaman
         ═══════════════════════════════════════════════════ --}}
    @if($buktis && $buktis->count() > 0)
    <div class="bukti-section">
        <div class="bukti-header">
            <span class="bukti-pill">VI</span>
            <span class="bukti-title-text">Bukti Pelaksanaan</span>
        </div>

        <table class="bukti-grid">
            <tbody>
                @foreach($buktis->chunk(2) as $row)
                <tr>
                    @foreach($row as $bukti)
                    @php
                        // Hitung index global (untuk label "Bukti #N")
                        $globalIndex = $loop->parent->index * 2 + $loop->index + 1;
                    @endphp
                    <td>
                        <div class="bukti-card">
                            <div class="bukti-card-header">
                                <span class="bukti-num">Bukti #{{ $globalIndex }}</span>
                                <span class="bukti-date">{{ $bukti->uploaded_at->format('d/m/Y') }}</span>
                            </div>

                            @if($bukti->is_image)
                                <div class="bukti-image-wrap">
                                    <img src="{{ public_path('storage/' . $bukti->file_path) }}" alt="Bukti" class="bukti-image">
                                </div>
                            @else
                                <div class="bukti-pdf-box">
                                    <div class="bukti-pdf-icon">PDF</div>
                                    <div class="bukti-pdf-label">Dokumen</div>
                                </div>
                            @endif

                            <div class="bukti-meta">
                                <div class="bukti-filename">{{ $bukti->file_name }}</div>
                                <div class="bukti-meta-row">{{ $bukti->file_size_human }}</div>
                            </div>

                            @if($bukti->keterangan)
                            <div class="bukti-keterangan">{{ $bukti->keterangan }}</div>
                            @endif
                        </div>
                    </td>
                    @endforeach

                    {{-- Slot kosong jika baris terakhir hanya 1 bukti --}}
                    @if($row->count() === 1)
                        <td>&nbsp;</td>
                    @endif
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>
    @endif

    {{-- ═══════════════════════════════════════════════════
         SIGNATURE
         ═══════════════════════════════════════════════════ --}}
    <div class="signature-section">
        <div class="signature-place">Sidoarjo, {{ $tanggal_cetak }}</div>
        <div class="signature-note">Dokumen resmi yang ditandatangani oleh pihak terkait</div>

        <div class="signature-grid">
            <div class="signature-box">
                <div class="sign-title">Mengetahui,</div>
                <div class="sign-role">Kepala BK</div>
                <div class="sign-space"></div>
                <div class="sign-name">
                    @if($validator)
                        {{ $validator->nama_lengkap }}
                    @else
                        ( ........................ )
                    @endif
                </div>
            </div>
            <div class="signature-box">
                <div class="sign-title">Menyetujui,</div>
                <div class="sign-role">Wali Santri</div>
                <div class="sign-space"></div>
                <div class="sign-name">{{ $santri->nama_wali }}</div>
            </div>
            <div class="signature-box">
                <div class="sign-title">Yang Bersangkutan,</div>
                <div class="sign-role">Santri</div>
                <div class="sign-space"></div>
                <div class="sign-name">{{ $santri->nama_panggilan }}</div>
            </div>
        </div>
    </div>

    {{-- ═══════════════════════════════════════════════════
         FOOTER
         ═══════════════════════════════════════════════════ --}}
    <div class="footer">
        <p>Dicetak pada: <span class="footer-strong">{{ $tanggal_cetak }}</span></p>
        <p>Dokumen Resmi Bimbingan Konseling &mdash; <span class="footer-strong">{{ $lembaga }}</span></p>
    </div>
</body>
</html>