<?php

namespace App\Http\Controllers;

use App\Models\VariabelKonsekuensi;
use Illuminate\Http\Request;
use Inertia\Inertia;

class VariabelKonsekuensiController extends Controller
{
    /**
     * Display a listing of variabel konsekuensi
     */
    public function index()
    {
        $data = VariabelKonsekuensi::orderBy('poin')->get();

        return Inertia::render('VariabelKonsekuensi/Index', [
            'data' => $data,
        ]);
    }

    /**
     * Store a newly created variabel
     */
    public function store(Request $request)
    {
        $request->validate([
            'kode'        => 'required|string|max:10|unique:variabel_konsekuensi,kode',
            'konsekuensi' => 'required|string|max:200',
            'poin'        => 'required|integer|min:1',
            'rekomendasi' => 'required|string',
        ], [
            'kode.required'        => 'Kode wajib diisi.',
            'kode.unique'          => 'Kode sudah digunakan.',
            'konsekuensi.required' => 'Konsekuensi wajib diisi.',
            'poin.required'        => 'Poin threshold wajib diisi.',
            'poin.min'             => 'Poin minimal 1.',
            'rekomendasi.required' => 'Rekomendasi wajib diisi.',
        ]);

        VariabelKonsekuensi::create($request->all());

        return back()->with('message', 'Variabel konsekuensi berhasil ditambahkan!');
    }

    /**
     * Update the specified variabel
     */
    public function update(Request $request, VariabelKonsekuensi $variabelKonsekuensi)
    {
        $request->validate([
            'kode'        => 'required|string|max:10|unique:variabel_konsekuensi,kode,' . $variabelKonsekuensi->id,
            'konsekuensi' => 'required|string|max:200',
            'poin'        => 'required|integer|min:1',
            'rekomendasi' => 'required|string',
        ]);

        $variabelKonsekuensi->update($request->all());

        return back()->with('message', 'Variabel konsekuensi berhasil diperbarui!');
    }

    /**
     * Remove the specified variabel
     */
    public function destroy(VariabelKonsekuensi $variabelKonsekuensi)
    {
        $variabelKonsekuensi->delete();

        return back()->with('message', 'Variabel konsekuensi berhasil dihapus!');
    }
}