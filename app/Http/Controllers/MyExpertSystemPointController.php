<?php

namespace App\Http\Controllers;

use App\Models\LaporanExpertSystemPoint;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MyExpertSystemPointController extends Controller
{
    /**
     * Display list of expert system point laporan for authenticated santri
     * 
     * GET /my-expert-system-point
     */
    public function index(Request $request)
    {
        $query = LaporanExpertSystemPoint::where('santri_id', auth()->id())
            ->with(['validator.guruBkProfile', 'buktis'])
            ->orderBy('tanggal_trigger', 'desc');

        // Filter by final_status
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('final_status', $request->status);
        }

        // Filter by jenis
        if ($request->has('jenis') && $request->jenis !== 'all') {
            $query->where('jenis', $request->jenis);
        }

        $laporans = $query->paginate(15)->through(function ($laporan) {
            // Update overdue status jika perlu
            $laporan->updateOverdueStatus();
            
            return [
                'id' => $laporan->id,
                'kode' => $laporan->kode,
                'jenis' => $laporan->jenis,
                'jenis_label' => $laporan->jenis_label,
                'konsekuensi_atau_reward' => $laporan->konsekuensi_atau_reward,
                'status' => $laporan->status,
                'status_label' => $laporan->status_label,
                'final_status' => $laporan->final_status,
                'final_status_label' => $laporan->final_status_label,
                'final_status_badge_color' => $laporan->final_status_badge_color,
                'tanggal_trigger' => $laporan->tanggal_trigger->format('d M Y'),
                'tanggal_selesai' => $laporan->tanggal_selesai?->format('d M Y'),
                'tanggal_batas_pelaksanaan' => $laporan->tanggal_batas_pelaksanaan?->format('d M Y'),
                'sisa_hari_deadline' => $laporan->sisa_hari_deadline,
                'is_terlambat' => $laporan->is_terlambat,
                'has_bukti' => $laporan->has_bukti,
                'bukti_approved' => $laporan->bukti_approved,
                'buktis_count' => $laporan->buktis->count(),
                'can_upload_bukti' => $this->canUploadBukti($laporan),
                'validator' => $laporan->validator ? [
                    'nama' => $laporan->validator->guruBkProfile->nama_lengkap ?? 'Unknown',
                ] : null,
            ];
        });

        return Inertia::render('MyExpertSystemPoint/Index', [
            'laporans' => $laporans,
            'filters' => [
                'status' => $request->get('status', 'all'),
                'jenis' => $request->get('jenis', 'all'),
            ],
        ]);
    }

    /**
     * Display detail laporan & upload bukti form
     * 
     * GET /my-expert-system-point/{laporan}
     */
    public function show(LaporanExpertSystemPoint $laporan)
    {
        // Authorization check
        if ($laporan->santri_id !== auth()->id()) {
            abort(403, 'Anda tidak memiliki akses untuk melihat laporan ini.');
        }

        // Update overdue status
        $laporan->updateOverdueStatus();

        // Load relationships
        $laporan->load([
            'validator.guruBkProfile',
            'buktis' => function($query) {
                $query->orderBy('created_at', 'desc');
            },
            'buktis.reviewer.guruBkProfile',
        ]);

        return Inertia::render('MyExpertSystemPoint/Show', [
            'laporan' => [
                'id' => $laporan->id,
                'kode' => $laporan->kode,
                'jenis' => $laporan->jenis,
                'jenis_label' => $laporan->jenis_label,
                'konsekuensi_atau_reward' => $laporan->konsekuensi_atau_reward,
                'rekomendasi' => $laporan->rekomendasi,
                'catatan_bk' => $laporan->catatan_bk,
                'aksi_bk' => $laporan->aksi_bk,
                'status' => $laporan->status,
                'status_label' => $laporan->status_label,
                'final_status' => $laporan->final_status,
                'final_status_label' => $laporan->final_status_label,
                'final_status_badge_color' => $laporan->final_status_badge_color,
                'tanggal_trigger' => $laporan->tanggal_trigger->format('d F Y, H:i'),
                'tanggal_selesai' => $laporan->tanggal_selesai?->format('d F Y, H:i'),
                'tanggal_batas_pelaksanaan' => $laporan->tanggal_batas_pelaksanaan?->format('d F Y'),
                'kesepakatan_keterlambatan' => $laporan->kesepakatan_keterlambatan,
                'sisa_hari_deadline' => $laporan->sisa_hari_deadline,
                'is_terlambat' => $laporan->is_terlambat,
                'has_bukti' => $laporan->has_bukti,
                'bukti_approved' => $laporan->bukti_approved,
                'total_poin_saat_trigger' => $laporan->total_poin_saat_trigger,
                'threshold_poin_triggered' => $laporan->threshold_poin_triggered,
                'has_pdf' => $laporan->hasPdf(),
                'pdf_url' => $laporan->pdf_url,
                'can_upload_bukti' => $this->canUploadBukti($laporan),
                'validator' => $laporan->validator ? [
                    'nama' => $laporan->validator->guruBkProfile->nama_lengkap ?? 'Unknown',
                ] : null,
                'buktis' => $laporan->buktis->map(function($bukti) {
                    return [
                        'id' => $bukti->id,
                        'file_name' => $bukti->file_name,
                        'file_type' => $bukti->file_type,
                        'file_size' => $bukti->file_size,
                        'file_size_human' => $bukti->file_size_human,
                        'file_url' => $bukti->file_url,
                        'is_image' => $bukti->is_image,
                        'is_pdf' => $bukti->is_pdf,
                        'keterangan' => $bukti->keterangan,
                        'status' => $bukti->status,
                        'status_label' => $bukti->status_label,
                        'status_badge_color' => $bukti->status_badge_color,
                        'catatan_review' => $bukti->catatan_review,
                        'uploaded_at' => $bukti->uploaded_at->format('d M Y, H:i'),
                        'reviewed_at' => $bukti->reviewed_at?->format('d M Y, H:i'),
                        'can_delete' => $bukti->canBeDeletedByUploader(),
                        'reviewer' => $bukti->reviewer ? [
                            'nama' => $bukti->reviewer->guruBkProfile->nama_lengkap ?? 'Unknown',
                        ] : null,
                    ];
                }),
            ],
        ]);
    }

    /**
     * Helper: Check if santri can upload bukti
     */
    private function canUploadBukti($laporan)
    {
        return $laporan->status === 'selesai' 
            && !$laporan->is_terlambat 
            && !$laporan->bukti_approved
            && $laporan->buktis()->count() < 3;
    }
}