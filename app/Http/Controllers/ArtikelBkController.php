<?php

namespace App\Http\Controllers;

use App\Models\ArtikelBk;
use App\Models\ArtikelGambar;
use App\Models\ArtikelMediaLink;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class ArtikelBkController extends Controller
{
    // FIX: Helper parse media_links_json (dikirim sebagai JSON string dari JSX)
    private function parseMediaLinks(string|null $json): array
    {
        if (!$json) return [];
        $decoded = json_decode($json, true);
        return is_array($decoded) ? $decoded : [];
    }

    // FIX: Helper parse hapus_gambar (JSON string of IDs)
    private function parseHapusGambar(string|null $json): array
    {
        if (!$json) return [];
        $decoded = json_decode($json, true);
        return is_array($decoded) ? array_filter($decoded, fn($v) => is_numeric($v)) : [];
    }

    // INDEX
    public function index(Request $request)
    {
        $query = ArtikelBk::with('penulis')
            ->withCount(['gambar', 'mediaLinks'])
            ->latest('updated_at');

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }
        if ($request->filled('kategori') && $request->kategori !== 'all') {
            $query->where('kategori', $request->kategori);
        }
        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(fn($q) => $q->where('judul', 'like', "%{$s}%")
                                       ->orWhere('ringkasan', 'like', "%{$s}%"));
        }

        $artikels = $query->paginate(12)->through(fn($a) => [
            'id'                => $a->id,
            'judul'             => $a->judul,
            'slug'              => $a->slug,
            'kategori'          => $a->kategori,
            'status'            => $a->status,
            'view_count'        => $a->view_count,
            'estimasi_baca'     => $a->estimasi_baca_label,
            'gambar_utama_url'  => $a->gambar_utama_url,
            'gambar_count'      => $a->gambar_count,
            'media_links_count' => $a->media_links_count,
            'published_at'      => $a->published_at?->format('d M Y'),
            'updated_at'        => $a->updated_at->format('d M Y'),
        ]);

        return Inertia::render('ArtikelBk/Index', [
            'artikels'  => $artikels,
            'kategoris' => ['Kesehatan Mental', 'Panduan BK', 'Kasus Khusus', 'Manajemen Santri', 'Umum'],
            'filters'   => [
                'status'   => $request->get('status', 'all'),
                'kategori' => $request->get('kategori', 'all'),
                'search'   => $request->get('search', ''),
            ],
        ]);
    }

    // CREATE
    public function create()
    {
        return Inertia::render('ArtikelBk/Form', [
            'mode'      => 'create',
            'kategoris' => ['Kesehatan Mental', 'Panduan BK', 'Kasus Khusus', 'Manajemen Santri', 'Umum'],
        ]);
    }

    // STORE
    public function store(Request $request)
    {
        $request->validate([
            'judul'            => 'required|string|max:200',
            'kategori'         => 'required|string',
            'ringkasan'        => 'nullable|string|max:500',
            'konten'           => 'nullable|string',
            'tags'             => 'nullable|string',
            'meta_description' => 'nullable|string|max:160',
            'meta_keywords'    => 'nullable|string|max:255',
            'gambar_utama_alt' => 'nullable|string|max:120',
            'status'           => 'required|in:draft,published',
            'gambar_utama'     => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
            // FIX: gallery adalah files terindeks, bukan array biasa
            'gallery.*'        => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        try {
            DB::transaction(function () use ($request) {
                $gambarUtamaPath = null;
                if ($request->hasFile('gambar_utama')) {
                    $gambarUtamaPath = $request->file('gambar_utama')
                        ->store('artikel/thumbnail', 'public');
                }

                $tags = $request->tags
                    ? collect(explode(',', $request->tags))
                        ->map(fn($t) => trim($t))->filter()->values()->toArray()
                    : [];

                $artikel = ArtikelBk::create([
                    'user_id'           => auth()->id(),
                    'judul'             => $request->judul,
                    'slug'              => ArtikelBk::generateSlug($request->judul),
                    'kategori'          => $request->kategori,
                    'ringkasan'         => $request->ringkasan,
                    'konten'            => $request->konten,
                    'tags'              => $tags,
                    'meta_description'  => $request->meta_description,
                    'meta_keywords'     => $request->meta_keywords,
                    'gambar_utama_path' => $gambarUtamaPath,
                    'gambar_utama_alt'  => $request->gambar_utama_alt,
                    'estimasi_baca'     => $request->konten
                        ? ArtikelBk::hitungEstimasiBaca($request->konten) : 5,
                    'status'            => $request->status,
                    'published_at'      => $request->status === 'published' ? now() : null,
                ]);

                // FIX: Upload gallery dengan key terindeks gallery[0], gallery[1], dst
                $this->uploadGallery($request, $artikel);

                // FIX: Parse media_links dari JSON string
                $this->saveMediaLinks($request, $artikel);

                Log::info('ArtikelBk created', ['id' => $artikel->id, 'by' => auth()->id()]);
            });

            return redirect()->route('artikel-bk.index')
                ->with('success', 'Artikel berhasil disimpan!');

        } catch (\Exception $e) {
            Log::error('ArtikelBk@store', ['error' => $e->getMessage()]);
            return back()->withErrors(['store' => 'Gagal menyimpan: ' . $e->getMessage()])->withInput();
        }
    }

    // EDIT
    public function edit(ArtikelBk $artikelBk)
    {
        $artikelBk->load('gambar', 'mediaLinks');

        return Inertia::render('ArtikelBk/Form', [
            'mode'    => 'edit',
            'artikel' => [
                'id'               => $artikelBk->id,
                'judul'            => $artikelBk->judul,
                'slug'             => $artikelBk->slug,
                'kategori'         => $artikelBk->kategori,
                'ringkasan'        => $artikelBk->ringkasan,
                'konten'           => $artikelBk->konten,
                'tags'             => $artikelBk->tags ? implode(', ', $artikelBk->tags) : '',
                'meta_description' => $artikelBk->meta_description,
                'meta_keywords'    => $artikelBk->meta_keywords,
                'gambar_utama_url' => $artikelBk->gambar_utama_url,
                'gambar_utama_alt' => $artikelBk->gambar_utama_alt,
                'status'           => $artikelBk->status,
                'gambar'           => $artikelBk->gambar->map(fn($g) => [
                    'id'          => $g->id,
                    'file_url'    => $g->file_url,
                    'keterangan'  => $g->keterangan,
                    'urutan'      => $g->urutan,
                ]),
                'media_links' => $artikelBk->mediaLinks->map(fn($m) => [
                    'id'    => $m->id,
                    'tipe'  => $m->tipe,
                    'url'   => $m->url,
                    'judul' => $m->judul,
                ]),
            ],
            'kategoris' => ['Kesehatan Mental', 'Panduan BK', 'Kasus Khusus', 'Manajemen Santri', 'Umum'],
        ]);
    }

    // FIX: UPDATE  route POST bukan PUT, parse semua input dari JSON string
    public function update(Request $request, ArtikelBk $artikelBk)
    {
        $request->validate([
            'judul'            => 'required|string|max:200',
            'kategori'         => 'required|string',
            'ringkasan'        => 'nullable|string|max:500',
            'konten'           => 'nullable|string',
            'tags'             => 'nullable|string',
            'meta_description' => 'nullable|string|max:160',
            'meta_keywords'    => 'nullable|string|max:255',
            'gambar_utama_alt' => 'nullable|string|max:120',
            'status'           => 'required|in:draft,published,archived',
            'gambar_utama'     => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
            'gallery.*'        => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        try {
            DB::transaction(function () use ($request, $artikelBk) {

                $data = [
                    'judul'            => $request->judul,
                    'slug'             => ArtikelBk::generateSlug($request->judul, $artikelBk->id),
                    'kategori'         => $request->kategori,
                    'ringkasan'        => $request->ringkasan,
                    'konten'           => $request->konten,
                    'tags'             => $request->tags
                        ? collect(explode(',', $request->tags))
                            ->map(fn($t) => trim($t))->filter()->values()->toArray()
                        : [],
                    'meta_description' => $request->meta_description,
                    'meta_keywords'    => $request->meta_keywords,
                    'gambar_utama_alt' => $request->gambar_utama_alt,
                    'estimasi_baca'    => $request->konten
                        ? ArtikelBk::hitungEstimasiBaca($request->konten)
                        : $artikelBk->estimasi_baca,
                    'status'           => $request->status,
                ];

                if ($request->status === 'published' && !$artikelBk->published_at) {
                    $data['published_at'] = now();
                }

                // Update gambar utama jika ada file baru
                if ($request->hasFile('gambar_utama')) {
                    if ($artikelBk->gambar_utama_path) {
                        Storage::disk('public')->delete($artikelBk->gambar_utama_path);
                    }
                    $data['gambar_utama_path'] = $request->file('gambar_utama')
                        ->store('artikel/thumbnail', 'public');
                }

                $artikelBk->update($data);

                // FIX: Hapus gambar yang dipilih (dari JSON string)
                $hapusIds = $this->parseHapusGambar($request->hapus_gambar);
                if (!empty($hapusIds)) {
                    $toDelete = ArtikelGambar::whereIn('id', $hapusIds)
                        ->where('artikel_bk_id', $artikelBk->id)->get();
                    foreach ($toDelete as $g) {
                        Storage::disk('public')->delete($g->file_path);
                        $g->delete();
                    }
                }

                // FIX: Upload gallery baru
                $this->uploadGallery($request, $artikelBk);

                // FIX: Update media links dari JSON string
                $artikelBk->mediaLinks()->delete();
                $this->saveMediaLinks($request, $artikelBk);

                Log::info('ArtikelBk updated', ['id' => $artikelBk->id, 'by' => auth()->id()]);
            });

            return redirect()->route('artikel-bk.index')
                ->with('success', 'Artikel berhasil diperbarui!');

        } catch (\Exception $e) {
            Log::error('ArtikelBk@update', ['error' => $e->getMessage()]);
            return back()->withErrors(['update' => 'Gagal: ' . $e->getMessage()])->withInput();
        }
    }

    // DESTROY
    public function destroy(ArtikelBk $artikelBk)
    {
        try {
            DB::transaction(function () use ($artikelBk) {
                if ($artikelBk->gambar_utama_path) {
                    Storage::disk('public')->delete($artikelBk->gambar_utama_path);
                }
                foreach ($artikelBk->gambar as $g) {
                    Storage::disk('public')->delete($g->file_path);
                }
                $artikelBk->delete();
            });
            return back()->with('success', 'Artikel berhasil dihapus!');
        } catch (\Exception $e) {
            return back()->withErrors(['delete' => 'Gagal: ' . $e->getMessage()]);
        }
    }

    // TOGGLE PUBLISH
    public function togglePublish(ArtikelBk $artikelBk)
    {
        if ($artikelBk->status === 'published') {
            $artikelBk->update(['status' => 'draft']);
            $msg = 'Artikel dikembalikan ke draft.';
        } else {
            $artikelBk->update([
                'status'       => 'published',
                'published_at' => $artikelBk->published_at ?? now(),
            ]);
            $msg = 'Artikel berhasil dipublish!';
        }
        return back()->with('success', $msg);
    }

    //  Private helpers 

    // FIX: Upload gallery terindeks gallery[0]..gallery[3] + keterangan
    private function uploadGallery(Request $request, ArtikelBk $artikel): void
    {
        $existingCount = $artikel->gambar()->count();

        // Files dikirim dengan key gallery[0], gallery[1], dll
        $files = $request->file('gallery') ?? [];

        foreach ($files as $idxStr => $file) {
            if ($existingCount >= 4) break;
            if (!($file instanceof \Illuminate\Http\UploadedFile)) continue;

            $idx     = (int) $idxStr;
            $ketKey  = "gallery_keterangan.{$idx}";
            $ket     = $request->input($ketKey);

            $path = $file->store('artikel/gallery', 'public');

            ArtikelGambar::create([
                'artikel_bk_id' => $artikel->id,
                'file_path'     => $path,
                'file_name'     => $file->getClientOriginalName(),
                'file_type'     => $file->getMimeType(),
                'file_size'     => $file->getSize(),
                'keterangan'    => $ket,
                'urutan'        => $existingCount,
            ]);

            $existingCount++;
        }
    }

    // FIX: Parse media_links dari JSON string lalu insert
    private function saveMediaLinks(Request $request, ArtikelBk $artikel): void
    {
        $links = $this->parseMediaLinks($request->input('media_links_json'));

        foreach ($links as $i => $ml) {
            $url   = trim($ml['url'] ?? '');
            $tipe  = $ml['tipe'] ?? 'website';
            if (!$url) continue;

            $embedId = match($tipe) {
                'youtube'   => \App\Models\ArtikelMediaLink::extractYoutubeId($url),
                'instagram' => \App\Models\ArtikelMediaLink::extractInstagramId($url),
                default     => null,
            };

            ArtikelMediaLink::create([
                'artikel_bk_id' => $artikel->id,
                'tipe'          => $tipe,
                'url'           => $url,
                'judul'         => $ml['judul'] ?? null,
                'embed_id'      => $embedId,
                'urutan'        => $i,
            ]);
        }
    }
}