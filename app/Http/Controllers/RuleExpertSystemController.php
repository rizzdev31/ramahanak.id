<?php

namespace App\Http\Controllers;

use App\Models\RuleExpertSystem;
use App\Models\VariabelDiagnosis;
use App\Models\VariabelPelanggaran;
use App\Models\VariabelApresiasi;
use App\Models\VariabelKonselor;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RuleExpertSystemController extends Controller
{
    /**
     * Display a listing of rules
     */
    public function index()
    {
        $rules = RuleExpertSystem::with('diagnosis')->orderBy('kode_rule')->get();

        return Inertia::render('RuleExpertSystem/Index', [
            'rules' => $rules,
        ]);
    }

    /**
     * Show the form for creating a new rule
     */
    public function create()
    {
        // Ambil semua variabel untuk dropdown
        $variabelPelanggaran = VariabelPelanggaran::orderBy('kode')->get(['kode', 'kategori']);
        $variabelApresiasi = VariabelApresiasi::orderBy('kode')->get(['kode', 'kategori']);
        $variabelKonselor = VariabelKonselor::orderBy('kode')->get(['kode', 'gangguan_mental']);
        $variabelDiagnosis = VariabelDiagnosis::orderBy('kode')->get(['kode', 'diagnosis']);

        return Inertia::render('RuleExpertSystem/Create', [
            'variabelPelanggaran' => $variabelPelanggaran,
            'variabelApresiasi' => $variabelApresiasi,
            'variabelKonselor' => $variabelKonselor,
            'variabelDiagnosis' => $variabelDiagnosis,
        ]);
    }

    /**
     * Store a newly created rule
     */
    public function store(Request $request)
    {
        $request->validate([
            'kode_rule'  => 'required|string|max:20|unique:rules_expert_system,kode_rule',
            'kategori'   => 'required|string|max:100',
            'premise'    => 'required|array|min:1',
            'premise.*'  => 'required|string',
            'conclusion' => 'required|string|exists:variabel_diagnosis,kode',
        ], [
            'kode_rule.required'    => 'Kode rule wajib diisi.',
            'kode_rule.unique'      => 'Kode rule sudah digunakan.',
            'kategori.required'     => 'Kategori wajib diisi.',
            'premise.required'      => 'Logika IF wajib diisi.',
            'premise.min'           => 'Minimal 1 variabel untuk logika IF.',
            'conclusion.required'   => 'Logika THEN wajib diisi.',
            'conclusion.exists'     => 'Kode diagnosis tidak valid.',
        ]);

        // Sort premise untuk validasi duplikasi
        $sortedPremise = $request->premise;
        sort($sortedPremise);

        // Cek apakah kombinasi premise sudah ada
        $existingRules = RuleExpertSystem::all();
        foreach ($existingRules as $rule) {
            $existingSorted = $rule->premise;
            sort($existingSorted);
            
            if ($sortedPremise === $existingSorted) {
                return back()->withErrors([
                    'premise' => 'Kombinasi logika IF ini sudah ada pada rule ' . $rule->kode_rule . '. Setiap kombinasi premise harus unik.'
                ])->withInput();
            }
        }

        RuleExpertSystem::create($request->all());

        return redirect()->route('rules.index')->with('message', 'Rule berhasil ditambahkan!');
    }

    /**
     * Show the form for editing the specified rule
     */
    public function edit(RuleExpertSystem $rule)
    {
        // Ambil semua variabel untuk dropdown
        $variabelPelanggaran = VariabelPelanggaran::orderBy('kode')->get(['kode', 'kategori']);
        $variabelApresiasi = VariabelApresiasi::orderBy('kode')->get(['kode', 'kategori']);
        $variabelKonselor = VariabelKonselor::orderBy('kode')->get(['kode', 'gangguan_mental']);
        $variabelDiagnosis = VariabelDiagnosis::orderBy('kode')->get(['kode', 'diagnosis']);

        return Inertia::render('RuleExpertSystem/Edit', [
            'rule' => $rule,
            'variabelPelanggaran' => $variabelPelanggaran,
            'variabelApresiasi' => $variabelApresiasi,
            'variabelKonselor' => $variabelKonselor,
            'variabelDiagnosis' => $variabelDiagnosis,
        ]);
    }

    /**
     * Update the specified rule
     */
    public function update(Request $request, RuleExpertSystem $rule)
    {
        $request->validate([
            'kode_rule'  => 'required|string|max:20|unique:rules_expert_system,kode_rule,' . $rule->id,
            'kategori'   => 'required|string|max:100',
            'premise'    => 'required|array|min:1',
            'premise.*'  => 'required|string',
            'conclusion' => 'required|string|exists:variabel_diagnosis,kode',
        ]);

        // Sort premise untuk validasi duplikasi
        $sortedPremise = $request->premise;
        sort($sortedPremise);

        // Cek apakah kombinasi premise sudah ada (kecuali rule ini sendiri)
        $existingRules = RuleExpertSystem::where('id', '!=', $rule->id)->get();
        foreach ($existingRules as $existingRule) {
            $existingSorted = $existingRule->premise;
            sort($existingSorted);
            
            if ($sortedPremise === $existingSorted) {
                return back()->withErrors([
                    'premise' => 'Kombinasi logika IF ini sudah ada pada rule ' . $existingRule->kode_rule . '. Setiap kombinasi premise harus unik.'
                ])->withInput();
            }
        }

        $rule->update($request->all());

        return redirect()->route('rules.index')->with('message', 'Rule berhasil diperbarui!');
    }

    /**
     * Remove the specified rule
     */
    public function destroy(RuleExpertSystem $rule)
    {
        $rule->delete();

        return back()->with('message', 'Rule berhasil dihapus!');
    }
}