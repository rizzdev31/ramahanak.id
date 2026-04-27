<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Rekam Medis Lengkap - {{ $santri->nama_lengkap }}</title>
    
    <style>
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
            font-family: 'DejaVu Sans', 'Arial', sans-serif;
            font-size: 8pt;
            line-height: 1.3;
            color: #1a1a1a;
        }
        
        /* HEADER */
        .header {
            text-align: center;
            padding-bottom: 6pt;
            margin-bottom: 8pt;
            border-bottom: 2pt double #2d3748;
        }
        
        .logo {
            width: 40pt;
            height: 40pt;
            margin: 0 auto 4pt;
            display: block;
        }
        
        .header-yayasan {
            font-size: 7pt;
            font-weight: 600;
            color: #2d3748;
            text-transform: uppercase;
            margin-bottom: 2pt;
        }
        
        .header-lembaga {
            font-size: 9pt;
            font-weight: 700;
            color: #1a202c;
            margin-bottom: 4pt;
        }
        
        .header-divider {
            width: 50pt;
            height: 1pt;
            background: #4a5568;
            margin: 3pt auto;
        }
        
        .header-contact {
            font-size: 6pt;
            color: #4a5568;
        }
        
        /* TITLE */
        .doc-title {
            text-align: center;
            margin: 8pt 0 2pt;
        }
        
        .doc-title h1 {
            font-size: 10pt;
            font-weight: 700;
            text-transform: uppercase;
            color: #1a202c;
        }
        
        .doc-number {
            text-align: center;
            font-size: 7pt;
            color: #4a5568;
            margin-bottom: 8pt;
        }
        
        /* SECTION */
        .section {
            margin-bottom: 6pt;
            page-break-inside: avoid;
        }
        
        .section-header {
            background: #2d3748;
            color: #fff;
            padding: 3pt 6pt;
            font-size: 8pt;
            font-weight: 600;
            margin-bottom: 4pt;
        }
        
        .section-body {
            border: 1pt solid #e2e8f0;
            padding: 5pt;
            background: #fff;
        }
        
        /* INFO TABLE */
        .info-table {
            width: 100%;
            border-collapse: collapse;
        }
        
        .info-table td {
            padding: 2pt 4pt;
            font-size: 7pt;
        }
        
        .info-table .label {
            width: 30%;
            font-weight: 500;
            color: #4a5568;
        }
        
        .info-table .separator {
            width: 2%;
            text-align: center;
        }
        
        .info-table .value {
            width: 68%;
            color: #1a202c;
        }
        
        /* ALERT */
        .alert {
            border: 1pt solid;
            padding: 4pt;
            margin: 5pt 0;
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
            font-size: 8pt;
            font-weight: 700;
            margin-bottom: 2pt;
        }
        
        .alert-danger .alert-title { color: #c53030; }
        .alert-success .alert-title { color: #38a169; }
        
        .alert-content {
            font-size: 7pt;
            color: #2d3748;
        }
        
        /* DEADLINE */
        .deadline-section {
            border: 1pt solid #d69e2e;
            background: #fffff0;
            padding: 4pt;
            margin: 5pt 0;
            page-break-inside: avoid;
        }
        
        .deadline-header {
            font-size: 8pt;
            font-weight: 700;
            color: #744210;
            border-bottom: 0.5pt solid #d69e2e;
            padding-bottom: 2pt;
            margin-bottom: 3pt;
        }
        
        .deadline-table {
            width: 100%;
            margin-bottom: 3pt;
        }
        
        .deadline-table td {
            padding: 1pt 0;
            font-size: 7pt;
        }
        
        .deadline-label {
            width: 35%;
            font-weight: 600;
            color: #744210;
        }
        
        .deadline-value {
            width: 65%;
            color: #1a202c;
        }
        
        .kesepakatan-box {
            background: #fff;
            border: 0.5pt solid #d69e2e;
            border-left: 2pt solid #d69e2e;
            padding: 3pt;
            margin-top: 3pt;
            font-size: 7pt;
        }
        
        .kesepakatan-title {
            font-weight: 600;
            color: #744210;
            margin-bottom: 2pt;
        }
        
        .kesepakatan-text {
            color: #2d3748;
            font-style: italic;
        }
        
        /* CONTENT */
        .content-box {
            background: #f7fafc;
            border: 0.5pt solid #cbd5e0;
            padding: 4pt;
            font-size: 7pt;
            color: #2d3748;
        }
        
        /* STATS */
        .stats-grid {
            display: table;
            width: 100%;
            margin: 5pt 0;
            border: 0.5pt solid #e2e8f0;
        }
        
        .stat-cell {
            display: table-cell;
            width: 33.33%;
            text-align: center;
            padding: 4pt;
            border-right: 0.5pt solid #e2e8f0;
        }
        
        .stat-cell:last-child {
            border-right: none;
        }
        
        .stat-label {
            font-size: 6pt;
            color: #718096;
            margin-bottom: 1pt;
            text-transform: uppercase;
        }
        
        .stat-value {
            font-size: 14pt;
            font-weight: 700;
            line-height: 1;
            margin: 1pt 0;
        }
        
        .stat-unit {
            font-size: 6pt;
            color: #a0aec0;
        }
        
        .stat-danger { color: #c53030; }
        .stat-success { color: #38a169; }
        .stat-info { color: #3182ce; }
        
        /* TABLE */
        table.data {
            width: 100%;
            border-collapse: collapse;
            margin: 3pt 0;
            font-size: 6pt;
        }
        
        table.data thead {
            background: #2d3748;
            color: #fff;
        }
        
        table.data th {
            padding: 2pt;
            text-align: left;
            font-weight: 600;
        }
        
        table.data td {
            padding: 2pt;
            border: 0.5pt solid #e2e8f0;
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
            padding: 1pt 2pt;
            border-radius: 1pt;
            font-size: 5pt;
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
        
        /* ✅ BUKTI - COMPACT 2 COLUMN */
        .bukti-section {
            margin: 6pt 0;
        }
        
        .bukti-header {
            background: #38a169;
            color: #fff;
            padding: 3pt 6pt;
            font-size: 8pt;
            font-weight: 600;
            margin-bottom: 4pt;
        }
        
        .bukti-container {
            width: 100%;
        }
        
        .bukti-item {
            display: inline-block;
            width: 48.5%;
            margin-right: 2%;
            margin-bottom: 4pt;
            border: 0.5pt solid #cbd5e0;
            padding: 3pt;
            background: #fff;
            vertical-align: top;
            page-break-inside: avoid;
        }
        
        .bukti-item:nth-child(2n) {
            margin-right: 0;
        }
        
        .bukti-title {
            font-size: 7pt;
            font-weight: 600;
            color: #2d3748;
            margin-bottom: 2pt;
            text-align: center;
        }
        
        .bukti-image {
            width: 100%;
            height: 100pt;
            object-fit: contain;
            border: 0.5pt solid #cbd5e0;
            margin-bottom: 2pt;
            display: block;
            background: #f9fafb;
        }
        
        .bukti-pdf-box {
            width: 100%;
            height: 100pt;
            background: #fff5f5;
            border: 0.5pt dashed #fc8181;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            margin-bottom: 2pt;
        }
        
        .bukti-info {
            background: #f7fafc;
            padding: 2pt;
            border-left: 1.5pt solid #38a169;
            font-size: 6pt;
        }
        
        .bukti-filename {
            font-weight: 600;
            color: #2d3748;
            margin-bottom: 1pt;
            word-wrap: break-word;
        }
        
        .bukti-meta {
            color: #718096;
        }
        
        .bukti-keterangan {
            font-size: 6pt;
            color: #4a5568;
            font-style: italic;
            margin-top: 2pt;
            padding: 2pt;
            background: #fff;
        }
        
        /* SIGNATURE */
        .signature-section {
            margin-top: 10pt;
            page-break-inside: avoid;
        }
        
        .signature-note {
            text-align: center;
            font-size: 6pt;
            font-style: italic;
            color: #4a5568;
            margin-bottom: 5pt;
        }
        
        .signature-grid {
            display: table;
            width: 100%;
        }
        
        .signature-box {
            display: table-cell;
            width: 33.33%;
            text-align: center;
            padding: 0 3pt;
        }
        
        .sign-title {
            font-size: 6pt;
            color: #718096;
        }
        
        .sign-role {
            font-size: 7pt;
            font-weight: 600;
            color: #2d3748;
            margin: 2pt 0;
        }
        
        .sign-space {
            height: 25pt;
            margin: 3pt 0;
        }
        
        .sign-name {
            font-size: 7pt;
            font-weight: 600;
            color: #1a202c;
            border-bottom: 0.5pt solid #1a202c;
            display: inline-block;
            padding: 0 8pt 1pt;
        }
        
        /* FOOTER */
        .footer {
            margin-top: 8pt;
            padding-top: 4pt;
            border-top: 0.5pt solid #cbd5e0;
            text-align: center;
            font-size: 6pt;
            color: #718096;
        }
        
        .no-break {
            page-break-inside: avoid;
        }
    </style>
</head>
<body>
    {{-- HEADER --}}
    <div class="header">
        <img src="{{ public_path('storage/defaultavatar.png') }}" alt="Logo" class="logo">
        <div class="header-yayasan">Yayasan Pondok Pesantren Muhammadiyah An Nur Sidoarjo</div>
        <div class="header-lembaga">{{ $lembaga }}</div>
        <div class="header-divider"></div>
        <div class="header-contact">Jl. Raya Pendidikan No. 123, Sidoarjo • (031) 1234567</div>
    </div>

    {{-- TITLE --}}
    <div class="doc-title">
        <h1>Rekam Medis BK (Lengkap)</h1>
    </div>
    <div class="doc-number">{{ $laporan->kode }}/BK/{{ \Carbon\Carbon::parse($laporan->tanggal_trigger)->format('m/Y') }}</div>

    {{-- I. DATA SANTRI --}}
    <div class="section">
        <div class="section-header">I. DATA SANTRI</div>
        <div class="section-body">
            <table class="info-table">
                <tr>
                    <td class="label">Nama</td>
                    <td class="separator">:</td>
                    <td class="value">{{ $santri->nama_lengkap }}</td>
                </tr>
                <tr>
                    <td class="label">NISN</td>
                    <td class="separator">:</td>
                    <td class="value">{{ $santri->nisn }}</td>
                </tr>
                <tr>
                    <td class="label">TTL</td>
                    <td class="separator">:</td>
                    <td class="value">{{ $santri->tempat_lahir }}, {{ \Carbon\Carbon::parse($santri->tanggal_lahir)->format('d M Y') }}</td>
                </tr>
                <tr>
                    <td class="label">Wali</td>
                    <td class="separator">:</td>
                    <td class="value">{{ $santri->nama_wali }}</td>
                </tr>
            </table>
        </div>
    </div>

    {{-- KONSEKUENSI/REWARD --}}
    @if($laporan->jenis === 'konsekuensi')
    <div class="alert alert-danger no-break">
        <div class="alert-title">⚠️ {{ $laporan->kode }}</div>
        <div class="alert-content">{{ $laporan->konsekuensi_atau_reward }} — {{ $laporan->total_poin_saat_trigger }} poin (threshold {{ $laporan->threshold_poin_triggered }})</div>
    </div>
    @else
    <div class="alert alert-success no-break">
        <div class="alert-title">⭐ {{ $laporan->kode }}</div>
        <div class="alert-content">{{ $laporan->konsekuensi_atau_reward }} — {{ $laporan->total_poin_saat_trigger }} poin (threshold {{ $laporan->threshold_poin_triggered }})</div>
    </div>
    @endif

    {{-- DEADLINE --}}
    @if($laporan->tanggal_batas_pelaksanaan)
    <div class="deadline-section no-break">
        <div class="deadline-header">⏰ DEADLINE</div>
        <table class="deadline-table">
            <tr>
                <td class="deadline-label">Batas Upload</td>
                <td class="deadline-value">{{ \Carbon\Carbon::parse($laporan->tanggal_batas_pelaksanaan)->format('d M Y') }}</td>
            </tr>
        </table>
        @if($laporan->kesepakatan_keterlambatan)
        <div class="kesepakatan-box">
            <div class="kesepakatan-title">Kesepakatan:</div>
            <div class="kesepakatan-text">{{ $laporan->kesepakatan_keterlambatan }}</div>
        </div>
        @endif
    </div>
    @endif

    {{-- REKOMENDASI --}}
    <div class="section">
        <div class="section-header">II. REKOMENDASI</div>
        <div class="section-body">
            <div class="content-box">{{ $laporan->rekomendasi }}</div>
        </div>
    </div>

    {{-- CATATAN BK --}}
    @if($laporan->catatan_bk)
    <div class="section">
        <div class="section-header">III. CATATAN BK</div>
        <div class="section-body">
            <div class="content-box">{{ $laporan->catatan_bk }}</div>
        </div>
    </div>
    @endif

    {{-- STATS --}}
    <div class="stats-grid no-break">
        <div class="stat-cell">
            <div class="stat-label">Pelanggaran</div>
            <div class="stat-value stat-danger">{{ $total_poin_pelanggaran }}</div>
            <div class="stat-unit">poin</div>
        </div>
        <div class="stat-cell">
            <div class="stat-label">Apresiasi</div>
            <div class="stat-value stat-success">{{ $total_poin_apresiasi }}</div>
            <div class="stat-unit">poin</div>
        </div>
        <div class="stat-cell">
            <div class="stat-label">Kasus</div>
            <div class="stat-value stat-info">{{ $riwayat_pelanggaran->count() + $riwayat_apresiasi->count() }}</div>
            <div class="stat-unit">total</div>
        </div>
    </div>

    {{-- RIWAYAT (COMPACT) --}}
    @if($riwayat_pelanggaran->count() > 0)
    <div class="section">
        <div class="section-header">IV. RIWAYAT PELANGGARAN</div>
        <div class="section-body" style="padding: 0;">
            <table class="data">
                <thead>
                    <tr>
                        <th width="5%">No</th>
                        <th width="12%">Tanggal</th>
                        <th width="63%">Keterangan</th>
                        <th width="20%" class="text-center">Poin</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($riwayat_pelanggaran->take(5) as $index => $item)
                    <tr>
                        <td class="text-center">{{ $index + 1 }}</td>
                        <td>{{ \Carbon\Carbon::parse($item->tanggal_kejadian)->format('d/m/y') }}</td>
                        <td>{{ $item->ringkasan }}</td>
                        <td class="text-center" style="font-weight: 700;">{{ $item->bobot_poin }}</td>
                    </tr>
                    @endforeach
                    @if($riwayat_pelanggaran->count() > 5)
                    <tr>
                        <td colspan="4" class="text-center" style="font-style: italic; color: #718096;">... dan {{ $riwayat_pelanggaran->count() - 5 }} kasus lainnya</td>
                    </tr>
                    @endif
                    <tr class="total-row">
                        <td colspan="3" class="text-right">TOTAL:</td>
                        <td class="text-center" style="font-weight: 700;">{{ $total_poin_pelanggaran }}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
    @endif

    @if($riwayat_apresiasi->count() > 0)
    <div class="section">
        <div class="section-header">V. RIWAYAT APRESIASI</div>
        <div class="section-body" style="padding: 0;">
            <table class="data">
                <thead>
                    <tr>
                        <th width="5%">No</th>
                        <th width="12%">Tanggal</th>
                        <th width="63%">Keterangan</th>
                        <th width="20%" class="text-center">Poin</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($riwayat_apresiasi->take(5) as $index => $item)
                    <tr>
                        <td class="text-center">{{ $index + 1 }}</td>
                        <td>{{ \Carbon\Carbon::parse($item->tanggal_kejadian)->format('d/m/y') }}</td>
                        <td>{{ $item->ringkasan }}</td>
                        <td class="text-center" style="font-weight: 700;">+{{ $item->bobot_poin }}</td>
                    </tr>
                    @endforeach
                    @if($riwayat_apresiasi->count() > 5)
                    <tr>
                        <td colspan="4" class="text-center" style="font-style: italic; color: #718096;">... dan {{ $riwayat_apresiasi->count() - 5 }} kasus lainnya</td>
                    </tr>
                    @endif
                    <tr class="total-row">
                        <td colspan="3" class="text-right">TOTAL:</td>
                        <td class="text-center" style="font-weight: 700;">{{ $total_poin_apresiasi }}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
    @endif

    {{-- ✅ VI. BUKTI - RESPONSIVE 2 COLUMN --}}
    @if($buktis && $buktis->count() > 0)
    <div class="bukti-section">
        <div class="bukti-header">VI. BUKTI PELAKSANAAN</div>
        <div class="bukti-container">
            @foreach($buktis as $index => $bukti)
            <div class="bukti-item">
                <div class="bukti-title">Bukti #{{ $index + 1 }}</div>
                
                @if($bukti->is_image)
                    <img src="{{ public_path('storage/' . $bukti->file_path) }}" alt="Bukti" class="bukti-image">
                @else
                    <div class="bukti-pdf-box">
                        <div>
                            <div style="font-size: 20pt;">📄</div>
                            <div style="font-size: 6pt; margin-top: 2pt;">PDF</div>
                        </div>
                    </div>
                @endif
                
                <div class="bukti-info">
                    <div class="bukti-filename">{{ $bukti->file_name }}</div>
                    <div class="bukti-meta">{{ $bukti->file_size_human }} • {{ $bukti->uploaded_at->format('d/m/y') }}</div>
                    @if($bukti->keterangan)
                    <div class="bukti-keterangan">{{ $bukti->keterangan }}</div>
                    @endif
                </div>
            </div>
            @endforeach
        </div>
    </div>
    @endif

    {{-- SIGNATURE --}}
    <div class="signature-section">
        <div class="signature-note">Dokumen resmi ditandatangani oleh pihak terkait</div>
        <div class="signature-grid">
            <div class="signature-box">
                <div class="sign-title">Kepala BK</div>
                <div class="sign-space"></div>
                <div class="sign-name">@if($validator){{ $validator->nama_lengkap }}@else(...)@endif</div>
            </div>
            <div class="signature-box">
                <div class="sign-title">Wali</div>
                <div class="sign-space"></div>
                <div class="sign-name">{{ $santri->nama_wali }}</div>
            </div>
            <div class="signature-box">
                <div class="sign-title">Santri</div>
                <div class="sign-space"></div>
                <div class="sign-name">{{ $santri->nama_panggilan }}</div>
            </div>
        </div>
    </div>

    {{-- FOOTER --}}
    <div class="footer">
        <p>{{ $tanggal_cetak }} • {{ $lembaga }}</p>
    </div>
</body>
</html>