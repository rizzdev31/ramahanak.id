<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Rekam Medis - {{ $santri->nama_lengkap }}</title>
    
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
    
    <style>
        @page {
            size: A4;
            margin: 20mm;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Plus Jakarta Sans', 'Arial', sans-serif;
            font-size: 10pt;
            line-height: 1.5;
            color: #1a1a1a;
        }
        
        /* ═══════════════════════════════════════
           HEADER - FORMAL DENGAN LOGO
           ═══════════════════════════════════════ */
        .header {
            text-align: center;
            padding-bottom: 12pt;
            margin-bottom: 15pt;
            border-bottom: 3pt double #2d3748;
        }
        
        .logo {
            width: 70pt;
            height: 70pt;
            margin: 0 auto 10pt;
            display: block;
        }
        
        .header-yayasan {
            font-size: 10pt;
            font-weight: 600;
            color: #2d3748;
            text-transform: uppercase;
            letter-spacing: 0.8pt;
            margin-bottom: 5pt;
        }
        
        .header-lembaga {
            font-size: 13pt;
            font-weight: 700;
            color: #1a202c;
            margin-bottom: 8pt;
            line-height: 1.3;
        }
        
        .header-divider {
            width: 80pt;
            height: 2pt;
            background: #4a5568;
            margin: 6pt auto;
        }
        
        .header-contact {
            font-size: 9pt;
            color: #4a5568;
            line-height: 1.4;
        }
        
        /* ═══════════════════════════════════════
           TITLE DOKUMEN
           ═══════════════════════════════════════ */
        .doc-title {
            text-align: center;
            margin: 20pt 0 5pt;
        }
        
        .doc-title h1 {
            font-size: 14pt;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1pt;
            color: #1a202c;
            text-decoration: underline;
            text-decoration-thickness: 1pt;
            text-underline-offset: 4pt;
        }
        
        .doc-number {
            text-align: center;
            font-size: 9pt;
            color: #4a5568;
            margin-bottom: 15pt;
        }
        
        /* ═══════════════════════════════════════
           SECTION
           ═══════════════════════════════════════ */
        .section {
            margin-bottom: 12pt;
            page-break-inside: avoid;
        }
        
        .section-header {
            background: #2d3748;
            color: #fff;
            padding: 6pt 10pt;
            font-size: 10pt;
            font-weight: 600;
            margin-bottom: 8pt;
        }
        
        .section-body {
            border: 1pt solid #e2e8f0;
            padding: 10pt;
            background: #fff;
        }
        
        /* ═══════════════════════════════════════
           INFO TABLE - 2 KOLOM RAPI
           ═══════════════════════════════════════ */
        .info-table {
            width: 100%;
            border-collapse: collapse;
        }
        
        .info-table td {
            padding: 4pt 8pt;
            vertical-align: top;
            border-bottom: 1pt solid #f7fafc;
        }
        
        .info-table .label {
            width: 38%;
            font-weight: 500;
            color: #4a5568;
        }
        
        .info-table .separator {
            width: 2%;
            text-align: center;
            color: #4a5568;
        }
        
        .info-table .value {
            width: 60%;
            color: #1a202c;
            font-weight: 400;
        }
        
        /* ═══════════════════════════════════════
           ALERT BOX - KONSEKUENSI/REWARD
           ═══════════════════════════════════════ */
        .alert {
            border: 2pt solid;
            padding: 10pt;
            margin: 12pt 0;
            page-break-inside: avoid;
        }
        
        .alert-danger {
            background: #fff5f5;
            border-color: #c53030;
        }
        
        .alert-success {
            background: #f0fff4;
            border-color: #38a169;
        }
        
        .alert-title {
            font-size: 11pt;
            font-weight: 700;
            margin-bottom: 5pt;
        }
        
        .alert-danger .alert-title { color: #c53030; }
        .alert-success .alert-title { color: #38a169; }
        
        .alert-content {
            font-size: 9pt;
            line-height: 1.5;
            color: #2d3748;
        }
        
        /* ═══════════════════════════════════════
           DEADLINE BOX
           ═══════════════════════════════════════ */
        .deadline-section {
            border: 2pt solid #d69e2e;
            background: #fffff0;
            padding: 10pt;
            margin: 12pt 0;
            page-break-inside: avoid;
        }
        
        .deadline-header {
            font-size: 11pt;
            font-weight: 700;
            color: #744210;
            border-bottom: 1pt solid #d69e2e;
            padding-bottom: 5pt;
            margin-bottom: 8pt;
        }
        
        .deadline-table {
            width: 100%;
            margin-bottom: 8pt;
        }
        
        .deadline-table td {
            padding: 3pt 0;
        }
        
        .deadline-label {
            width: 40%;
            font-weight: 600;
            color: #744210;
            font-size: 9pt;
        }
        
        .deadline-value {
            width: 60%;
            color: #1a202c;
            font-size: 9pt;
            font-weight: 600;
        }
        
        .kesepakatan-box {
            background: #fff;
            border: 1pt solid #d69e2e;
            border-left: 4pt solid #d69e2e;
            padding: 8pt;
            margin-top: 8pt;
        }
        
        .kesepakatan-title {
            font-size: 9pt;
            font-weight: 600;
            color: #744210;
            margin-bottom: 4pt;
        }
        
        .kesepakatan-text {
            font-size: 9pt;
            line-height: 1.6;
            color: #2d3748;
            font-style: italic;
        }
        
        /* ═══════════════════════════════════════
           CONTENT BOX
           ═══════════════════════════════════════ */
        .content-box {
            background: #f7fafc;
            border: 1pt solid #cbd5e0;
            padding: 10pt;
            margin: 8pt 0;
            line-height: 1.6;
            font-size: 9pt;
            color: #2d3748;
        }
        
        /* ═══════════════════════════════════════
           STATISTICS BOX
           ═══════════════════════════════════════ */
        .stats-grid {
            display: table;
            width: 100%;
            margin: 12pt 0;
            border: 1pt solid #e2e8f0;
        }
        
        .stat-cell {
            display: table-cell;
            width: 33.33%;
            text-align: center;
            padding: 10pt;
            border-right: 1pt solid #e2e8f0;
        }
        
        .stat-cell:last-child {
            border-right: none;
        }
        
        .stat-label {
            font-size: 8pt;
            color: #718096;
            margin-bottom: 4pt;
            text-transform: uppercase;
            letter-spacing: 0.5pt;
        }
        
        .stat-value {
            font-size: 20pt;
            font-weight: 700;
            line-height: 1;
            margin: 3pt 0;
        }
        
        .stat-unit {
            font-size: 8pt;
            color: #a0aec0;
        }
        
        .stat-danger { color: #c53030; }
        .stat-success { color: #38a169; }
        .stat-info { color: #3182ce; }
        
        /* ═══════════════════════════════════════
           TABLE DATA
           ═══════════════════════════════════════ */
        table.data {
            width: 100%;
            border-collapse: collapse;
            margin: 8pt 0;
            font-size: 9pt;
        }
        
        table.data thead {
            background: #2d3748;
            color: #fff;
        }
        
        table.data th {
            padding: 6pt;
            text-align: left;
            font-weight: 600;
            border: 1pt solid #1a202c;
        }
        
        table.data td {
            padding: 5pt;
            border: 1pt solid #e2e8f0;
            vertical-align: top;
        }
        
        table.data tbody tr:nth-child(odd) {
            background: #f7fafc;
        }
        
        table.data .text-center {
            text-align: center;
        }
        
        table.data .text-right {
            text-align: right;
        }
        
        .badge {
            display: inline-block;
            padding: 2pt 5pt;
            border-radius: 2pt;
            font-size: 8pt;
            font-weight: 600;
            color: #fff;
        }
        
        .badge-danger { background: #c53030; }
        .badge-success { background: #38a169; }
        .badge-info { background: #3182ce; }
        
        .total-row {
            background: #edf2f7 !important;
            font-weight: 700;
        }
        
        /* ═══════════════════════════════════════
           SIGNATURE
           ═══════════════════════════════════════ */
        .signature-section {
            margin-top: 25pt;
            page-break-inside: avoid;
        }
        
        .signature-note {
            text-align: center;
            font-size: 9pt;
            font-style: italic;
            color: #4a5568;
            margin-bottom: 12pt;
        }
        
        .signature-grid {
            display: table;
            width: 100%;
        }
        
        .signature-box {
            display: table-cell;
            width: 33.33%;
            text-align: center;
            padding: 0 8pt;
        }
        
        .sign-title {
            font-size: 9pt;
            color: #718096;
            margin-bottom: 2pt;
        }
        
        .sign-role {
            font-size: 10pt;
            font-weight: 600;
            color: #2d3748;
            margin-bottom: 6pt;
        }
        
        .sign-space {
            height: 50pt;
            margin: 8pt 0;
        }
        
        .sign-name {
            font-size: 9pt;
            font-weight: 600;
            color: #1a202c;
            border-bottom: 1pt solid #1a202c;
            display: inline-block;
            padding: 0 15pt 2pt;
        }
        
        /* ═══════════════════════════════════════
           FOOTER
           ═══════════════════════════════════════ */
        .footer {
            margin-top: 20pt;
            padding-top: 10pt;
            border-top: 1pt solid #cbd5e0;
            text-align: center;
            font-size: 8pt;
            color: #718096;
            line-height: 1.4;
        }
        
        /* ═══════════════════════════════════════
           PAGE BREAK
           ═══════════════════════════════════════ */
        .no-break {
            page-break-inside: avoid;
        }
    </style>
</head>
<body>
    <!-- ═══════════════════════════════════════
         HEADER KOP SURAT
         ═══════════════════════════════════════ -->
    <div class="header">
        <img src="{{ public_path('storage/defaultavatar.png') }}" alt="Logo" class="logo">
        
        <div class="header-yayasan">
            Yayasan Pondok Pesantren Muhammadiyah An Nur Sidoarjo
        </div>
        
        <div class="header-lembaga">
            {{ $lembaga }}
        </div>
        
        <div class="header-divider"></div>
        
        <div class="header-contact">
            Jl. Raya Pendidikan No. 123, Sidoarjo, Jawa Timur 61234<br>
            Telepon: (031) 1234567 • Email: <a href="/cdn-cgi/l/email-protection" class="__cf_email__" data-cfemail="e4868fa4858a8a9196c9978d808b85968e8bca97878cca8d80">[email&#160;protected]</a>
        </div>
    </div>

    <!-- ═══════════════════════════════════════
         TITLE
         ═══════════════════════════════════════ -->
    <div class="doc-title">
        <h1>Rekam Medis Bimbingan Konseling</h1>
    </div>
    
    <div class="doc-number">
        Nomor: {{ $laporan->kode }}/BK/{{ \Carbon\Carbon::parse($laporan->tanggal_trigger)->format('m/Y') }}
    </div>

    <!-- ═══════════════════════════════════════
         I. DATA SANTRI
         ═══════════════════════════════════════ -->
    <div class="section">
        <div class="section-header">I. DATA SANTRI</div>
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

    <!-- ═══════════════════════════════════════
         KONSEKUENSI/REWARD
         ═══════════════════════════════════════ -->
    @if($laporan->jenis === 'konsekuensi')
    <div class="alert alert-danger no-break">
        <div class="alert-title">⚠️ KONSEKUENSI: {{ $laporan->kode }} - {{ $laporan->konsekuensi_atau_reward }}</div>
        <div class="alert-content">
            Santri telah mengakumulasi <strong>{{ $laporan->total_poin_saat_trigger }} poin pelanggaran</strong>, 
            melampaui threshold <strong>{{ $laporan->threshold_poin_triggered }} poin</strong> 
            untuk konsekuensi {{ $laporan->kode }}.
        </div>
    </div>
    @else
    <div class="alert alert-success no-break">
        <div class="alert-title">⭐ REWARD: {{ $laporan->kode }} - {{ $laporan->konsekuensi_atau_reward }}</div>
        <div class="alert-content">
            Santri telah mengakumulasi <strong>{{ $laporan->total_poin_saat_trigger }} poin apresiasi</strong>, 
            melampaui threshold <strong>{{ $laporan->threshold_poin_triggered }} poin</strong> 
            untuk reward {{ $laporan->kode }}.
        </div>
    </div>
    @endif

    <!-- ═══════════════════════════════════════
         DEADLINE & KESEPAKATAN
         ═══════════════════════════════════════ -->
    @if($laporan->tanggal_batas_pelaksanaan)
    <div class="deadline-section no-break">
        <div class="deadline-header">⏰ BATAS WAKTU PELAKSANAAN & KESEPAKATAN</div>
        
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
            <div class="kesepakatan-title">Kesepakatan Apabila Terlambat Upload Bukti:</div>
            <div class="kesepakatan-text">{{ $laporan->kesepakatan_keterlambatan }}</div>
        </div>
        @endif
    </div>
    @endif

    <!-- ═══════════════════════════════════════
         II. REKOMENDASI SISTEM
         ═══════════════════════════════════════ -->
    <div class="section">
        <div class="section-header">II. REKOMENDASI SISTEM</div>
        <div class="section-body">
            <div class="content-box">{{ $laporan->rekomendasi }}</div>
        </div>
    </div>

    <!-- ═══════════════════════════════════════
         III. ANALISIS PEMBIMBING
         ═══════════════════════════════════════ -->
    @if($laporan->catatan_bk)
    <div class="section">
        <div class="section-header">III. ANALISIS & CATATAN PEMBIMBING (BK)</div>
        <div class="section-body">
            <div class="content-box">{{ $laporan->catatan_bk }}</div>
        </div>
    </div>
    @endif

    <!-- ═══════════════════════════════════════
         IV. TINDAKAN YANG DILAKUKAN
         ═══════════════════════════════════════ -->
    @if($laporan->aksi_bk)
    <div class="section">
        <div class="section-header">IV. TINDAKAN YANG DILAKUKAN</div>
        <div class="section-body">
            <div class="content-box" style="white-space: pre-line;">{{ $laporan->aksi_bk }}</div>
        </div>
    </div>
    @endif

    <!-- ═══════════════════════════════════════
         STATISTIK
         ═══════════════════════════════════════ -->
    <div class="stats-grid no-break">
        <div class="stat-cell">
            <div class="stat-label">Total Pelanggaran</div>
            <div class="stat-value stat-danger">{{ $total_poin_pelanggaran }}</div>
            <div class="stat-unit">poin</div>
        </div>
        <div class="stat-cell">
            <div class="stat-label">Total Apresiasi</div>
            <div class="stat-value stat-success">{{ $total_poin_apresiasi }}</div>
            <div class="stat-unit">poin</div>
        </div>
        <div class="stat-cell">
            <div class="stat-label">Jumlah Kasus</div>
            <div class="stat-value stat-info">{{ $riwayat_pelanggaran->count() + $riwayat_apresiasi->count() }}</div>
            <div class="stat-unit">kasus</div>
        </div>
    </div>

    <!-- ═══════════════════════════════════════
         V. RIWAYAT PELANGGARAN
         ═══════════════════════════════════════ -->
    @if($riwayat_pelanggaran->count() > 0)
    <div class="section">
        <div class="section-header">V. RIWAYAT PELANGGARAN LENGKAP</div>
        <div class="section-body" style="padding: 0;">
            <table class="data">
                <thead>
                    <tr>
                        <th width="5%">No</th>
                        <th width="12%">Tanggal</th>
                        <th width="10%">Kode</th>
                        <th width="58%">Keterangan</th>
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
                        <td class="text-center" style="font-weight: 700; color: #c53030;">{{ $item->bobot_poin }}</td>
                    </tr>
                    @endforeach
                    <tr class="total-row">
                        <td colspan="4" class="text-right">TOTAL POIN PELANGGARAN:</td>
                        <td class="text-center" style="font-weight: 700; color: #c53030;">{{ $total_poin_pelanggaran }}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
    @endif

    <!-- ═══════════════════════════════════════
         VI. RIWAYAT APRESIASI
         ═══════════════════════════════════════ -->
    @if($riwayat_apresiasi->count() > 0)
    <div class="section">
        <div class="section-header">VI. RIWAYAT APRESIASI LENGKAP</div>
        <div class="section-body" style="padding: 0;">
            <table class="data">
                <thead>
                    <tr>
                        <th width="5%">No</th>
                        <th width="12%">Tanggal</th>
                        <th width="10%">Kode</th>
                        <th width="58%">Keterangan</th>
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
                        <td class="text-center" style="font-weight: 700; color: #38a169;">+{{ $item->bobot_poin }}</td>
                    </tr>
                    @endforeach
                    <tr class="total-row">
                        <td colspan="4" class="text-right">TOTAL POIN APRESIASI:</td>
                        <td class="text-center" style="font-weight: 700; color: #38a169;">{{ $total_poin_apresiasi }}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
    @endif

    <!-- ═══════════════════════════════════════
         VII. RIWAYAT KONSELING
         ═══════════════════════════════════════ -->
    @if($riwayat_konseling->count() > 0)
    <div class="section">
        <div class="section-header">VII. RIWAYAT KONSELING</div>
        <div class="section-body" style="padding: 0;">
            <table class="data">
                <thead>
                    <tr>
                        <th width="5%">No</th>
                        <th width="12%">Tanggal</th>
                        <th width="10%">Kode</th>
                        <th width="73%">Keterangan</th>
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

    <!-- ═══════════════════════════════════════
         TANDA TANGAN
         ═══════════════════════════════════════ -->
    <div class="signature-section">
        <div class="signature-note">
            Dokumen ini merupakan rekam medis resmi dan ditandatangani oleh pihak-pihak terkait.
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
                        (________________)
                    @endif
                </div>
            </div>
            
            <div class="signature-box">
                <div class="sign-title">Orang Tua/Wali Santri</div>
                <div class="sign-role">&nbsp;</div>
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

    <!-- ═══════════════════════════════════════
         FOOTER
         ═══════════════════════════════════════ -->
    <div class="footer">
        <p>Dicetak pada: {{ $tanggal_cetak }}</p>
        <p>Dokumen resmi Bimbingan Kons