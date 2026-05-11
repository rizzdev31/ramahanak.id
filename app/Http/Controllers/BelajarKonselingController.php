<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Illuminate\Support\Facades\Schema;

class BelajarKonselingController extends Controller
{
    /**
     * INDEX  Halaman daftar artikel publik.
     * Baca dari tabel artikel_bk (status=published).
     * Fallback ke data dummy jika tabel belum ada.
     */
    public function index()
    {
        $artikels  = [];
        $kategoris = ['Kesehatan Mental', 'Panduan BK', 'Kasus Khusus', 'Manajemen Santri', 'Umum'];

        if (Schema::hasTable('artikel_bk')) {
            $artikels = \App\Models\ArtikelBk::published()
                ->select(['id','slug','judul','kategori','ringkasan',
                          'gambar_utama_path','estimasi_baca','published_at'])
                ->get()->map(fn($a) => [
                    'slug'          => $a->slug,
                    'judul'         => $a->judul,
                    'kategori'      => $a->kategori,
                    'ringkasan'     => $a->ringkasan,
                    'gambar_utama'  => $a->gambar_utama_url,
                    'tanggal'       => $a->published_at?->format('d F Y') ?? '-',
                    'estimasi_baca' => $a->estimasi_baca_label,
                    'penulis'       => 'Tim RamahAnak',
                ])->toArray();

            $kategoris = \App\Models\ArtikelBk::published()
                ->distinct()->pluck('kategori')->toArray();
        } else {
            $artikels = $this->dummyList();
        }

        return Inertia::render('BelajarKonseling/Index', [
            'artikels'  => $artikels,
            'kategoris' => $kategoris,
        ]);
    }

    /**
     * SHOW  Halaman detail artikel publik.
     * Sinkron: data konten, gambar gallery, dan media link dari DB.
     */
    public function show(string $slug)
    {
        if (Schema::hasTable('artikel_bk')) {
            $artikel = \App\Models\ArtikelBk::published()
                ->where('slug', $slug)
                ->with(['gambar', 'mediaLinks'])
                ->firstOrFail();

            $artikel->increment('view_count');

            $related = \App\Models\ArtikelBk::published()
                ->where('id', '!=', $artikel->id)
                ->orderByRaw('kategori = ? DESC', [$artikel->kategori])
                ->limit(3)->get()
                ->map(fn($a) => [
                    'slug'          => $a->slug,
                    'judul'         => $a->judul,
                    'kategori'      => $a->kategori,
                    'gambar_utama'  => $a->gambar_utama_url,
                    'estimasi_baca' => $a->estimasi_baca_label,
                ]);

            return Inertia::render('BelajarKonseling/Show', [
                'artikel' => [
                    'slug'          => $artikel->slug,
                    'judul'         => $artikel->judul,
                    'kategori'      => $artikel->kategori,
                    'penulis'       => 'Tim RamahAnak',
                    'tanggal'       => $artikel->published_at?->format('d F Y') ?? '-',
                    'estimasi_baca' => $artikel->estimasi_baca_label,
                    'ringkasan'     => $artikel->ringkasan,
                    'konten'        => $artikel->konten,
                    'tags'          => $artikel->tags ?? [],
                    'gambar'        => $artikel->gambar->map(fn($g) => [
                        'url'        => $g->file_url,
                        'keterangan' => $g->keterangan,
                    ])->take(4)->toArray(),
                    'media_links'   => $artikel->mediaLinks->map(fn($m) => [
                        'tipe'      => $m->tipe,
                        'tipe_label'=> $m->tipe_label,
                        'url'       => $m->url,
                        'judul'     => $m->judul,
                        'embed_url' => $m->embed_url,
                        'embed_id'  => $m->embed_id,
                    ])->toArray(),
                ],
                'related' => $related,
            ]);

        } else {
            $all     = $this->dummyFull();
            $artikel = collect($all)->firstWhere('slug', $slug);
            if (!$artikel) abort(404);

            $related = collect($all)
                ->filter(fn($a) => $a['slug'] !== $slug)
                ->sortBy(fn($a) => $a['kategori'] === $artikel['kategori'] ? 0 : 1)
                ->take(3)->values()->toArray();

            return Inertia::render('BelajarKonseling/Show', [
                'artikel' => $artikel,
                'related' => $related,
            ]);
        }
    }

    //  Dummy data (fallback sebelum migrasi) 
    private function dummyList(): array
    {
        return array_map(fn($a) => array_diff_key($a, array_flip(['konten','tags','gambar','media_links'])),
            $this->dummyFull());
    }
}