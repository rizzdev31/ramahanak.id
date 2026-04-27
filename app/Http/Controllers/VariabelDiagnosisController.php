<?php

namespace App\Http\Controllers;

use App\Models\VariabelDiagnosis;
use Illuminate\Http\Request;
use Inertia\Inertia;

class VariabelDiagnosisController extends Controller
{
    /**
     * Display a listing of variabel diagnosis
     */
    public function index()
    {
        $data = VariabelDiagnosis::orderBy('kode')->get();

        return Inertia::render('VariabelDiagnosis/Index', [
            'data' => $data,
        ]);
    }

    /**
     * Store a newly created variabel
     */
    public function store(Request $request)
    {
        $request->validate([
            'kode'        => 'required|string|max:10|unique:variabel_diagnosis,kode',
            'diagnosis'   => 'required|string|max:150',
            'penjelasan'  => 'required|string',
            'rekomendasi' => 'required|string',
        ], [
            'kode.required'        => 'Kode wajib diisi.',
            'kode.unique'          => 'Kode sudah digunakan.',
            'diagnosis.required'   => 'Diagnosis wajib diisi.',
            'penjelasan.required'  => 'Penjelasan wajib diisi.',
            'rekomendasi.required' => 'Rekomendasi wajib diisi.',
        ]);

        VariabelDiagnosis::create($request->all());

        return back()->with('message', 'Variabel diagnosis berhasil ditambahkan!');
    }

    /**
     * Update the specified variabel
     */
    public function update(Request $request, VariabelDiagnosis $variabelDiagnosis)
    {
        $request->validate([
            'kode'        => 'required|string|max:10|unique:variabel_diagnosis,kode,' . $variabelDiagnosis->id,
            'diagnosis'   => 'required|string|max:150',
            'penjelasan'  => 'required|string',
            'rekomendasi' => 'required|string',
        ]);

        $variabelDiagnosis->update($request->all());

        return back()->with('message', 'Variabel diagnosis berhasil diperbarui!');
    }

    /**
     * Remove the specified variabel
     */
    public function destroy(VariabelDiagnosis $variabelDiagnosis)
    {
        $variabelDiagnosis->delete();

        return back()->with('message', 'Variabel diagnosis berhasil dihapus!');
    }
}