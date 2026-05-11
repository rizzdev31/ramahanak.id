<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;

class ArtikelBk extends Model
{
    use HasFactory;

    protected $table = 'artikel_bk';

    protected $fillable = [
        'user_id', 'judul', 'slug', 'kategori', 'ringkasan',
        'konten', 'tags', 'meta_description', 'meta_keywords',
        'gambar_utama_path', 'gambar_utama_alt',
        'estimasi_baca', 'status', 'published_at', 'view_count',
    ];

    protected $casts = [
        'tags'         => 'array',
        'published_at' => 'datetime',
        'view_count'   => 'integer',
    ];

    protected $appends = ['gambar_utama_url', 'estimasi_baca_label'];

    //  Relasi 
    public function penulis()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function gambar()
    {
        return $this->hasMany(ArtikelGambar::class, 'artikel_bk_id')->orderBy('urutan');
    }

    public function mediaLinks()
    {
        return $this->hasMany(ArtikelMediaLink::class, 'artikel_bk_id')->orderBy('urutan');
    }

    //  Accessors 
    public function getGambarUtamaUrlAttribute(): ?string
    {
        if (!$this->gambar_utama_path) return null;
        return Storage::disk('public')->url($this->gambar_utama_path);
    }

    public function getEstimasiBacaLabelAttribute(): string
    {
        return $this->estimasi_baca . ' menit';
    }

    //  Scopes 
    public function scopePublished($query)
    {
        return $query->where('status', 'published')
                     ->whereNotNull('published_at')
                     ->orderBy('published_at', 'desc');
    }

    //  Helper: generate slug unik 
    public static function generateSlug(string $judul, ?int $excludeId = null): string
    {
        $base = Str::slug($judul);
        $slug = $base;
        $i    = 1;

        while (
            static::where('slug', $slug)
                  ->when($excludeId, fn($q) => $q->where('id', '!=', $excludeId))
                  ->exists()
        ) {
            $slug = "{$base}-{$i}";
            $i++;
        }

        return $slug;
    }

    //  Helper: hitung estimasi baca dari konten 
    public static function hitungEstimasiBaca(string $konten): int
    {
        $words = str_word_count(strip_tags($konten));
        return max(1, (int) ceil($words / 200)); // rata2 200 kata/menit
    }
}

// 
class ArtikelGambar extends Model
{
    protected $table    = 'artikel_gambar';
    protected $fillable = ['artikel_bk_id', 'file_path', 'file_name', 'file_type', 'file_size', 'keterangan', 'urutan'];
    protected $appends  = ['file_url', 'file_size_human'];

    public function artikel()
    {
        return $this->belongsTo(ArtikelBk::class, 'artikel_bk_id');
    }

    public function getFileUrlAttribute(): string
    {
        return Storage::disk('public')->url($this->file_path);
    }

    public function getFileSizeHumanAttribute(): string
    {
        $bytes = $this->file_size;
        if ($bytes >= 1048576) return round($bytes / 1048576, 1) . ' MB';
        if ($bytes >= 1024)    return round($bytes / 1024, 1) . ' KB';
        return $bytes . ' B';
    }
}

// 
class ArtikelMediaLink extends Model
{
    protected $table    = 'artikel_media_link';
    protected $fillable = ['artikel_bk_id', 'tipe', 'url', 'judul', 'embed_id', 'urutan'];
    protected $appends  = ['embed_url', 'tipe_label', 'tipe_icon'];

    public function artikel()
    {
        return $this->belongsTo(ArtikelBk::class, 'artikel_bk_id');
    }

    // Extract embed ID dari URL YouTube
    public static function extractYoutubeId(string $url): ?string
    {
        preg_match('/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/', $url, $m);
        return $m[1] ?? null;
    }

    // Extract shortcode dari URL Instagram
    public static function extractInstagramId(string $url): ?string
    {
        preg_match('/instagram\.com\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/', $url, $m);
        return $m[1] ?? null;
    }

    public function getEmbedUrlAttribute(): ?string
    {
        return match($this->tipe) {
            'youtube'   => $this->embed_id ? "https://www.youtube.com/embed/{$this->embed_id}" : null,
            'instagram' => $this->embed_id ? "https://www.instagram.com/p/{$this->embed_id}/embed" : null,
            default     => $this->url,
        };
    }

    public function getTipeLabelAttribute(): string
    {
        return match($this->tipe) {
            'youtube'   => 'YouTube',
            'instagram' => 'Instagram',
            'tiktok'    => 'TikTok',
            'facebook'  => 'Facebook',
            'twitter'   => 'Twitter / X',
            'website'   => 'Website',
            default     => 'Link',
        };
    }

    public function getTipeIconAttribute(): string
    {
        return match($this->tipe) {
            'youtube'   => 'youtube',
            'instagram' => 'instagram',
            'tiktok'    => 'tiktok',
            'facebook'  => 'facebook',
            'twitter'   => 'twitter',
            default     => 'link',
        };
    }
}