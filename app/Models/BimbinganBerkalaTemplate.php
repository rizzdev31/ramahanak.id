<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BimbinganBerkalaTemplate extends Model
{
    use HasFactory;

    protected $table = 'bimbingan_berkala_template';

    protected $fillable = [
        'judul',
        'deskripsi',
        'tujuan',
        'is_active',
        'is_locked',
        'created_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_locked' => 'boolean',
    ];

    // ═══════════════════════════════════════════════════════════
    // RELATIONSHIPS
    // ═══════════════════════════════════════════════════════════

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function pertanyaan(): HasMany
    {
        return $this->hasMany(BimbinganBerkalaPertanyaan::class, 'template_id')
                    ->orderBy('urutan', 'asc');
    }

    public function jadwal(): HasMany
    {
        return $this->hasMany(BimbinganBerkalaJadwal::class, 'template_id');
    }

    // ═══════════════════════════════════════════════════════════
    // ACCESSORS
    // ═══════════════════════════════════════════════════════════

    public function getJumlahSoalAttribute(): int
    {
        return $this->pertanyaan()->count();
    }

    public function getJumlahPemakaiAttribute(): int
    {
        return $this->jadwal()->count();
    }

    // ═══════════════════════════════════════════════════════════
    // SCOPES
    // ═══════════════════════════════════════════════════════════

    public function scopeAktif($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeEditable($query)
    {
        return $query->where('is_locked', false);
    }
}