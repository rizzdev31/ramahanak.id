<?php

namespace App\Http\Controllers;

use App\Models\VariabelReward;
use Illuminate\Http\Request;
use Inertia\Inertia;

class VariabelRewardController extends Controller
{
    /**
     * Display a listing of variabel reward
     */
    public function index()
    {
        $data = VariabelReward::orderBy('poin')->get();

        return Inertia::render('VariabelReward/Index', [
            'data' => $data,
        ]);
    }

    /**
     * Store a newly created variabel
     */
    public function store(Request $request)
    {
        $request->validate([
            'kode'        => 'required|string|max:10|unique:variabel_reward,kode',
            'reward'      => 'required|string|max:250',
            'poin'        => 'required|integer|min:1',
            'rekomendasi' => 'required|string',
        ], [
            'kode.required'        => 'Kode wajib diisi.',
            'kode.unique'          => 'Kode sudah digunakan.',
            'reward.required'      => 'Reward wajib diisi.',
            'poin.required'        => 'Poin threshold wajib diisi.',
            'poin.min'             => 'Poin minimal 1.',
            'rekomendasi.required' => 'Rekomendasi wajib diisi.',
        ]);

        VariabelReward::create($request->all());

        return back()->with('message', 'Variabel reward berhasil ditambahkan!');
    }

    /**
     * Update the specified variabel
     */
    public function update(Request $request, VariabelReward $variabelReward)
    {
        $request->validate([
            'kode'        => 'required|string|max:10|unique:variabel_reward,kode,' . $variabelReward->id,
            'reward'      => 'required|string|max:250',
            'poin'        => 'required|integer|min:1',
            'rekomendasi' => 'required|string',
        ]);

        $variabelReward->update($request->all());

        return back()->with('message', 'Variabel reward berhasil diperbarui!');
    }

    /**
     * Remove the specified variabel
     */
    public function destroy(VariabelReward $variabelReward)
    {
        $variabelReward->delete();

        return back()->with('message', 'Variabel reward berhasil dihapus!');
    }
}