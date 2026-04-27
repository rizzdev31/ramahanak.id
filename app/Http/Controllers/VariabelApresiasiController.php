<?php

namespace App\Http\Controllers;

use App\Models\VariabelApresiasi;
use App\Models\VariabelPelanggaran;
use App\Models\VariabelKonselor;
use Illuminate\Http\Request;
use Inertia\Inertia;

class VariabelApresiasiController extends Controller
{
    public function index()
    {
        $data = VariabelApresiasi::with('counterpartPelanggaran')
            ->orderBy('kode')
            ->get();

        $allWords = $this->buildAllWordsMap();

        $dataWithConflicts = $data->map(function ($v) use ($allWords) {
            $words     = array_filter(array_map('trim', explode(',', $v->kamus_kata ?? '')));
            $conflicts = [];

            foreach ($words as $word) {
                $word_lower = strtolower($word);
                if (isset($allWords[$word_lower])) {
                    foreach ($allWords[$word_lower] as $entry) {
                        if ($entry['kode'] !== $v->kode) {
                            $conflicts[] = [
                                'kata'         => $word,
                                'konflik_kode' => $entry['kode'],
                                'konflik_tipe' => $entry['tipe'],
                                'konflik_label'=> $entry['label'],
                            ];
                        }
                    }
                }
            }

            return array_merge($v->toArray(), [
                'conflicts'     => $conflicts,
                'has_conflicts' => !empty($conflicts),
            ]);
        });

        return Inertia::render('VariabelApresiasi/Index', [
            'data'                  => $dataWithConflicts,
            'availableCounterparts' => VariabelPelanggaran::orderBy('kode')->get(['kode', 'kategori']),
        ]);
    }

    /**
     * ✅ AJAX: Cek konflik kata secara real-time
     */
    public function checkKataConflict(Request $request)
    {
        $request->validate([
            'kamus_kata'    => 'required|string',
            'exclude_kode'  => 'nullable|string',
        ]);

        $words       = array_filter(array_map('trim', explode(',', $request->kamus_kata)));
        $allWords    = $this->buildAllWordsMap();
        $excludeKode = $request->exclude_kode;
        $conflicts   = [];

        foreach ($words as $word) {
            $word_lower = strtolower(trim($word));
            if (empty($word_lower)) continue;

            if (isset($allWords[$word_lower])) {
                foreach ($allWords[$word_lower] as $entry) {
                    if ($excludeKode && $entry['kode'] === $excludeKode) continue;

                    $conflicts[] = [
                        'kata'          => $word,
                        'konflik_kode'  => $entry['kode'],
                        'konflik_tipe'  => $entry['tipe'],
                        'konflik_label' => $entry['label'],
                        'bisa_negation' => $this->canBeNegationPair($entry['tipe'], 'apresiasi'),
                        'saran_negation'=> $this->getNegationSuggestion($entry['tipe'], 'apresiasi', $entry['kode']),
                    ];
                }
            }
        }

        return response()->json([
            'conflicts'     => $conflicts,
            'has_conflicts' => !empty($conflicts),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'kode'             => 'required|string|max:10|unique:variabel_apresiasi,kode',
            'kategori'         => 'required|string|max:100',
            'poin'             => 'required|integer|min:1',
            'apresiasi'        => 'required|string',
            'kamus_kata'       => 'required|string',
            'negatable'        => 'nullable|boolean',
            'counterpart_kode' => 'nullable|string|max:10|exists:variabel_pelanggaran,kode',
            'negation_notes'   => 'nullable|string',
        ], [
            'kode.required'     => 'Kode wajib diisi.',
            'kode.unique'       => 'Kode sudah digunakan.',
            'kategori.required' => 'Kategori wajib diisi.',
            'poin.required'     => 'Poin wajib diisi.',
            'poin.min'          => 'Poin minimal 1.',
            'apresiasi.required'=> 'Apresiasi wajib diisi.',
            'kamus_kata.required'=> 'Kamus kata wajib diisi.',
        ]);

        VariabelApresiasi::create($request->all());
        return back()->with('message', 'Variabel apresiasi berhasil ditambahkan!');
    }

    public function update(Request $request, VariabelApresiasi $variabelApresiasi)
    {
        $request->validate([
            'kode'             => 'required|string|max:10|unique:variabel_apresiasi,kode,' . $variabelApresiasi->id,
            'kategori'         => 'required|string|max:100',
            'poin'             => 'required|integer|min:1',
            'apresiasi'        => 'required|string',
            'kamus_kata'       => 'required|string',
            'negatable'        => 'nullable|boolean',
            'counterpart_kode' => 'nullable|string|max:10|exists:variabel_pelanggaran,kode',
            'negation_notes'   => 'nullable|string',
        ]);

        $variabelApresiasi->update($request->all());
        return back()->with('message', 'Variabel apresiasi berhasil diperbarui!');
    }

    public function destroy(VariabelApresiasi $variabelApresiasi)
    {
        $variabelApresiasi->delete();
        return back()->with('message', 'Variabel apresiasi berhasil dihapus!');
    }

    private function buildAllWordsMap(): array
    {
        $map = [];

        $addToMap = function ($words, $kode, $tipe, $label) use (&$map) {
            foreach ($words as $w) {
                $w = strtolower(trim($w));
                if (empty($w)) continue;
                $map[$w][] = ['kode' => $kode, 'tipe' => $tipe, 'label' => $label];
            }
        };

        foreach (VariabelPelanggaran::all(['kode', 'kategori', 'kamus_kata']) as $v) {
            $addToMap(explode(',', $v->kamus_kata ?? ''), $v->kode, 'pelanggaran', "{$v->kode} - {$v->kategori}");
        }
        foreach (VariabelApresiasi::all(['kode', 'kategori', 'kamus_kata']) as $v) {
            $addToMap(explode(',', $v->kamus_kata ?? ''), $v->kode, 'apresiasi', "{$v->kode} - {$v->kategori}");
        }
        foreach (VariabelKonselor::all(['kode', 'gangguan_mental', 'kamus_kata']) as $v) {
            $addToMap(explode(',', $v->kamus_kata ?? ''), $v->kode, 'konselor', "{$v->kode} - {$v->gangguan_mental}");
        }

        return $map;
    }

    private function canBeNegationPair(string $tipe1, string $tipe2): bool
    {
        return in_array([$tipe1, $tipe2], [['pelanggaran', 'apresiasi'], ['apresiasi', 'pelanggaran']]);
    }

    private function getNegationSuggestion(string $konflikTipe, string $currentTipe, string $konflikKode): ?string
    {
        if ($konflikTipe === 'pelanggaran' && $currentTipe === 'apresiasi') {
            return "Kata ini juga ada di {$konflikKode} (Pelanggaran). Bisa dijadikan negation pair: sistem akan flip ke kode ini jika ada 'tidak [kata]'";
        }
        return "Kata duplikat di {$konflikKode} ({$konflikTipe}). Pertimbangkan untuk menghapus dari salah satu kamus.";
    }
}