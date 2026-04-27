<?php

namespace App\Http\Controllers;

use App\Models\VariabelPelanggaran;
use App\Models\VariabelApresiasi;
use App\Models\VariabelKonselor;
use Illuminate\Http\Request;
use Inertia\Inertia;

class VariabelPelanggaranController extends Controller
{
    public function index()
    {
        $data = VariabelPelanggaran::with('counterpartApresiasi')
            ->orderBy('kode')
            ->get();

        // ✅ Hitung konflik antar kamus untuk semua variabel
        $allWords = $this->buildAllWordsMap();

        $dataWithConflicts = $data->map(function ($v) use ($allWords) {
            $words     = array_filter(array_map('trim', explode(',', $v->kamus_kata ?? '')));
            $conflicts = [];

            foreach ($words as $word) {
                $word_lower = strtolower($word);
                if (isset($allWords[$word_lower])) {
                    foreach ($allWords[$word_lower] as $entry) {
                        // Tampilkan konflik dengan variabel LAIN (bukan diri sendiri)
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
                'conflicts'      => $conflicts,
                'has_conflicts'  => !empty($conflicts),
            ]);
        });

        return Inertia::render('VariabelPelanggaran/Index', [
            'data'                  => $dataWithConflicts,
            'availableCounterparts' => VariabelApresiasi::orderBy('kode')->get(['kode', 'kategori']),
        ]);
    }

    /**
     * ✅ AJAX: Cek konflik kata saat user mengetik kamus_kata
     * Dipanggil secara real-time dari frontend saat input berubah
     */
    public function checkKataConflict(Request $request)
    {
        $request->validate([
            'kamus_kata'    => 'required|string',
            'exclude_kode'  => 'nullable|string', // kode variabel yang sedang diedit (agar tidak konflik dgn diri sendiri)
        ]);

        $words      = array_filter(array_map('trim', explode(',', $request->kamus_kata)));
        $allWords   = $this->buildAllWordsMap();
        $excludeKode = $request->exclude_kode;

        $conflicts = [];

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
                        'bisa_negation' => $this->canBeNegationPair($entry['tipe'], 'pelanggaran'),
                        'saran_negation'=> $this->getNegationSuggestion($entry['tipe'], 'pelanggaran', $entry['kode']),
                    ];
                }
            }
        }

        return response()->json([
            'conflicts' => $conflicts,
            'has_conflicts' => !empty($conflicts),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'kode'             => 'required|string|max:10|unique:variabel_pelanggaran,kode',
            'kategori'         => 'required|string|max:100',
            'poin'             => 'required|integer|min:1',
            'tindakan'         => 'required|string',
            'kamus_kata'       => 'required|string',
            'negatable'        => 'nullable|boolean',
            'counterpart_kode' => 'nullable|string|max:10|exists:variabel_apresiasi,kode',
            'negation_notes'   => 'nullable|string',
        ], [
            'kode.required'    => 'Kode wajib diisi.',
            'kode.unique'      => 'Kode sudah digunakan.',
            'kategori.required'=> 'Kategori wajib diisi.',
            'poin.required'    => 'Poin wajib diisi.',
            'poin.min'         => 'Poin minimal 1.',
            'tindakan.required'=> 'Tindakan wajib diisi.',
            'kamus_kata.required'=> 'Kamus kata wajib diisi.',
        ]);

        VariabelPelanggaran::create($request->all());

        return back()->with('message', 'Variabel pelanggaran berhasil ditambahkan!');
    }

    public function update(Request $request, VariabelPelanggaran $variabelPelanggaran)
    {
        $request->validate([
            'kode'             => 'required|string|max:10|unique:variabel_pelanggaran,kode,' . $variabelPelanggaran->id,
            'kategori'         => 'required|string|max:100',
            'poin'             => 'required|integer|min:1',
            'tindakan'         => 'required|string',
            'kamus_kata'       => 'required|string',
            'negatable'        => 'nullable|boolean',
            'counterpart_kode' => 'nullable|string|max:10|exists:variabel_apresiasi,kode',
            'negation_notes'   => 'nullable|string',
        ]);

        $variabelPelanggaran->update($request->all());

        return back()->with('message', 'Variabel pelanggaran berhasil diperbarui!');
    }

    public function destroy(VariabelPelanggaran $variabelPelanggaran)
    {
        $variabelPelanggaran->delete();
        return back()->with('message', 'Variabel pelanggaran berhasil dihapus!');
    }

    // ════════════════════════════════════════════════════════
    // PRIVATE HELPERS
    // ════════════════════════════════════════════════════════

    /**
     * Bangun map: kata_lowercase → [{ kode, tipe, label }]
     * dari SEMUA variabel (pelanggaran + apresiasi + konselor)
     */
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
            $addToMap(
                array_filter(explode(',', $v->kamus_kata ?? '')),
                $v->kode, 'pelanggaran', "{$v->kode} - {$v->kategori}"
            );
        }

        foreach (VariabelApresiasi::all(['kode', 'kategori', 'kamus_kata']) as $v) {
            $addToMap(
                array_filter(explode(',', $v->kamus_kata ?? '')),
                $v->kode, 'apresiasi', "{$v->kode} - {$v->kategori}"
            );
        }

        foreach (VariabelKonselor::all(['kode', 'gangguan_mental', 'kamus_kata']) as $v) {
            $addToMap(
                array_filter(explode(',', $v->kamus_kata ?? '')),
                $v->kode, 'konselor', "{$v->kode} - {$v->gangguan_mental}"
            );
        }

        return $map;
    }

    private function canBeNegationPair(string $tipe1, string $tipe2): bool
    {
        // Negation pair yang masuk akal: pelanggaran ↔ apresiasi
        $validPairs = [
            ['pelanggaran', 'apresiasi'],
            ['apresiasi', 'pelanggaran'],
        ];
        return in_array([$tipe1, $tipe2], $validPairs);
    }

    private function getNegationSuggestion(string $konflikTipe, string $currentTipe, string $konflikKode): ?string
    {
        if ($konflikTipe === 'apresiasi' && $currentTipe === 'pelanggaran') {
            return "Kata ini juga ada di {$konflikKode} (Apresiasi). Bisa dijadikan negation: 'tidak [kata]' → sistem akan flip ke {$konflikKode}";
        }
        if ($konflikTipe === 'pelanggaran' && $currentTipe === 'apresiasi') {
            return "Kata ini juga ada di {$konflikKode} (Pelanggaran). Pertimbangkan untuk menghapus dari salah satu kamus.";
        }
        return "Kata duplikat di {$konflikKode} ({$konflikTipe}). Pertimbangkan untuk menghapus dari salah satu kamus.";
    }
}