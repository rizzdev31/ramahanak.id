<?php

namespace App\Http\Controllers;

use App\Models\LaporanExpertSystemKonselor;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MyKonselingController extends Controller
{
    /**
     * Display list of konseling untuk santri yang login
     */
    public function index(Request $request)
    {
        $santriId = auth()->id();

        $laporans = LaporanExpertSystemKonselor::with([
            'validator.guruBkProfile',
            'sesiList'
        ])
        ->where('santri_id', $santriId)
        ->latest('tanggal_trigger')
        ->paginate(10);

        return Inertia::render('MyKonseling/Index', [
            'laporans' => $laporans
        ]);
    }

    /**
     * Display detail konseling untuk santri yang login
     */
    public function show(LaporanExpertSystemKonselor $laporan)
    {
        // Validate: santri hanya bisa lihat konseling sendiri
        if ($laporan->santri_id !== auth()->id()) {
            abort(403, 'Anda tidak memiliki akses ke konseling ini.');
        }

        $laporan->load([
            'validator.guruBkProfile',
            'sesiList',
            'catatanKolaboratif.author.guruBkProfile',
            'catatanKolaboratif.author.tenagaPendidikProfile'
        ]);

        return Inertia::render('MyKonseling/Show', [
            'laporan' => $laporan
        ]);
    }
}