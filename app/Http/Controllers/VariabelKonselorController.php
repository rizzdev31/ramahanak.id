<?php

namespace App\Http\Controllers;

use App\Models\VariabelKonselor;
use Illuminate\Http\Request;
use Inertia\Inertia;

class VariabelKonselorController extends Controller
{
    /**
     * Display a listing of variabel konselor
     */
    public function index()
    {
        $data = VariabelKonselor::orderBy('kode')->get();

        return Inertia::render('VariabelKonselor/Index', [
            'data' => $data,
        ]);
    }

    /**
     * Store a newly created variabel
     */
    public function store(Request $request)
    {
        $request->validate([
            'kode'            => 'required|string|max:10|unique:variabel_konselor,kode',
            'gangguan_mental' => 'required|string|max:150',
            'kamus_kata'      => 'required|string',
            'rekomendasi'     => 'required|string',
        ], [
            'kode.required'            => 'Kode wajib diisi.',
            'kode.unique'              => 'Kode sudah digunakan.',
            'gangguan_mental.required' => 'Gangguan mental wajib diisi.',
            'kamus_kata.required'      => 'Kamus kata wajib diisi.',
            'rekomendasi.required'     => 'Rekomendasi wajib diisi.',
        ]);

        VariabelKonselor::create($request->all());

        return back()->with('message', 'Variabel konselor berhasil ditambahkan!');
    }

    /**
     * Update the specified variabel
     */
    public function update(Request $request, VariabelKonselor $variabelKonselor)
    {
        $request->validate([
            'kode'            => 'required|string|max:10|unique:variabel_konselor,kode,' . $variabelKonselor->id,
            'gangguan_mental' => 'required|string|max:150',
            'kamus_kata'      => 'required|string',
            'rekomendasi'     => 'required|string',
        ]);

        $variabelKonselor->update($request->all());

        return back()->with('message', 'Variabel konselor berhasil diperbarui!');
    }

    /**
     * Remove the specified variabel
     */
    public function destroy(VariabelKonselor $variabelKonselor)
    {
        $variabelKonselor->delete();

        return back()->with('message', 'Variabel konselor berhasil dihapus!');
    }
}