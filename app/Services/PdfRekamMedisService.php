<?php

namespace App\Services;

use App\Models\LaporanExpertSystemPoint;
use App\Models\RiwayatSantri;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;

class PdfRekamMedisService
{
    /**
     * Generate PDF Rekam Medis
     * 
     * @param LaporanExpertSystemPoint $laporan
     * @return string Path to PDF file
     */
    public function generate(LaporanExpertSystemPoint $laporan)
    {
        // Load relasi (termasuk kelas untuk auto-detect lembaga)
        $laporan->load([
            'santri.santriProfile.kelas',  // ✅ Load kelas untuk detect lembaga
            'validator.guruBkProfile'
        ]);

        // ✅ Auto-detect lembaga berdasarkan tingkat kelas santri
        $lembagaNama = $laporan->santri->lembaga;

        // Get riwayat pelanggaran lengkap
        $riwayatPelanggaran = RiwayatSantri::where('santri_id', $laporan->santri_id)
            ->where('jenis_laporan', 'pelanggaran')
            ->whereNotNull('bobot_poin') // Exclude korban (poin null)
            ->orderBy('tanggal_kejadian', 'desc')
            ->get();

        // Get riwayat apresiasi lengkap
        $riwayatApresiasi = RiwayatSantri::where('santri_id', $laporan->santri_id)
            ->where('jenis_laporan', 'apresiasi')
            ->orderBy('tanggal_kejadian', 'desc')
            ->get();

        // Get riwayat konseling
        $riwayatKonseling = RiwayatSantri::where('santri_id', $laporan->santri_id)
            ->where('jenis_laporan', 'konselor')
            ->orderBy('tanggal_kejadian', 'desc')
            ->get();

        // Calculate totals
        $totalPoinPelanggaran = $riwayatPelanggaran->sum('bobot_poin');
        $totalPoinApresiasi = $riwayatApresiasi->sum('bobot_poin');

        // Data untuk PDF
        $data = [
            'laporan' => $laporan,
            'santri' => $laporan->santri->santriProfile,
            'validator' => $laporan->validator?->guruBkProfile,
            'lembaga' => $lembagaNama,  // ✅ BARU: Auto-detect dari tingkat kelas
            'riwayat_pelanggaran' => $riwayatPelanggaran,
            'riwayat_apresiasi' => $riwayatApresiasi,
            'riwayat_konseling' => $riwayatKonseling,
            'total_poin_pelanggaran' => $totalPoinPelanggaran,
            'total_poin_apresiasi' => $totalPoinApresiasi,
            'tanggal_cetak' => now()->format('d F Y'),
        ];

        // Generate PDF
        $pdf = Pdf::loadView('pdf.rekam-medis', $data)
            ->setPaper('a4', 'portrait')
            ->setOption('margin-top', 10)
            ->setOption('margin-bottom', 10)
            ->setOption('margin-left', 10)
            ->setOption('margin-right', 10);

        // Generate filename
        $filename = 'rekam-medis-' . $laporan->santri_id . '-' . $laporan->kode . '-' . now()->format('YmdHis') . '.pdf';
        
        // Save to storage/app/public/rekam-medis/ (EXPLICIT disk public)
        $path = 'rekam-medis/' . $filename;
        \Storage::disk('public')->put($path, $pdf->output());

        // Return path (sudah tanpa prefix 'public/')
        return $path;
    }

    /**
     * Download PDF
     */
    public function download(LaporanExpertSystemPoint $laporan)
    {
        if (!$laporan->pdf_path || !\Storage::disk('public')->exists($laporan->pdf_path)) {
            throw new \Exception('PDF tidak ditemukan. Silakan generate ulang.');
        }

        $filename = 'Rekam-Medis-' . $laporan->santri->santriProfile->nama_panggilan . '-' . $laporan->kode . '.pdf';
        
        return \Storage::disk('public')->download($laporan->pdf_path, $filename);
    }

    /**
     * ✅ NEW: Generate PDF Rekam Medis WITH Bukti Pelaksanaan
     * 
     * @param LaporanExpertSystemPoint $laporan
     * @return \Illuminate\Http\Response
     */
    public function generateWithBukti(LaporanExpertSystemPoint $laporan)
    {
        // Load relasi lengkap (include buktis)
        $laporan->load([
            'santri.santriProfile.kelas',
            'validator.guruBkProfile',
            'buktis' => function($query) {
                $query->where('status', 'approved')
                      ->orderBy('created_at', 'desc');
            }
        ]);

        // Auto-detect lembaga
        $lembagaNama = $laporan->santri->lembaga;

        // Get riwayat lengkap (sama seperti generate() biasa)
        $riwayatPelanggaran = RiwayatSantri::where('santri_id', $laporan->santri_id)
            ->where('jenis_laporan', 'pelanggaran')
            ->whereNotNull('bobot_poin')
            ->orderBy('tanggal_kejadian', 'desc')
            ->get();

        $riwayatApresiasi = RiwayatSantri::where('santri_id', $laporan->santri_id)
            ->where('jenis_laporan', 'apresiasi')
            ->orderBy('tanggal_kejadian', 'desc')
            ->get();

        $riwayatKonseling = RiwayatSantri::where('santri_id', $laporan->santri_id)
            ->where('jenis_laporan', 'konselor')
            ->orderBy('tanggal_kejadian', 'desc')
            ->get();

        $totalPoinPelanggaran = $riwayatPelanggaran->sum('bobot_poin');
        $totalPoinApresiasi = $riwayatApresiasi->sum('bobot_poin');

        // Prepare data untuk PDF
        $data = [
            'laporan' => $laporan,
            'santri' => $laporan->santri->santriProfile,
            'validator' => $laporan->validator,
            'lembaga' => $lembagaNama,
            'riwayat_pelanggaran' => $riwayatPelanggaran,
            'riwayat_apresiasi' => $riwayatApresiasi,
            'riwayat_konseling' => $riwayatKonseling,
            'total_poin_pelanggaran' => $totalPoinPelanggaran,
            'total_poin_apresiasi' => $totalPoinApresiasi,
            'tanggal_cetak' => now()->format('d F Y, H:i') . ' WIB',
            // ✅ NEW: Include buktis
            'buktis' => $laporan->buktis,
        ];

        // Generate PDF with bukti template
        $pdf = Pdf::loadView('pdf.rekam-medis-with-bukti', $data)
            ->setPaper('a4', 'portrait')
            ->setOption('isHtml5ParserEnabled', true)
            ->setOption('isRemoteEnabled', true)
            ->setOption('margin-top', 10)
            ->setOption('margin-bottom', 10)
            ->setOption('margin-left', 10)
            ->setOption('margin-right', 10);

        // Download dengan nama file yang jelas
        $filename = 'Rekam-Medis-Lengkap-' . $laporan->santri->santriProfile->nama_panggilan . '-' . $laporan->kode . '.pdf';
        
        return $pdf->download($filename);
    }
}