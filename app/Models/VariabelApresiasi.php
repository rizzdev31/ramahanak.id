<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VariabelApresiasi extends Model
{
    protected $table = 'variabel_apresiasi';

    protected $fillable = [
        'kode',
        'kategori',
        'poin',
        'apresiasi',
        'kamus_kata',
        // ✅ NEW: Negation support
        'negatable',
        'counterpart_kode',
        'negation_notes',
    ];

    protected $casts = [
        'poin' => 'integer',
        'negatable' => 'boolean',  // ✅ NEW
    ];

    // ══════════════════════════════════════════════════════════
    // ACCESSORS
    // ══════════════════════════════════════════════════════════

    /**
     * Helper: ambil kamus kata sebagai array
     */
    public function getKamusKataArrayAttribute()
    {
        return array_map('trim', explode(',', $this->kamus_kata));
    }

    // ══════════════════════════════════════════════════════════
    // ✅ NEW: NEGATION RELATIONSHIPS
    // ══════════════════════════════════════════════════════════

    /**
     * Get counterpart Pelanggaran (when negated)
     * 
     * Example: A001 (Membantu) → P101 (Tidak Membantu)
     */
    public function counterpartPelanggaran()
    {
        return $this->belongsTo(VariabelPelanggaran::class, 'counterpart_kode', 'kode');
    }

    /**
     * Check if this variabel can be negated
     */
    public function isNegatable()
    {
        return $this->negatable === true;
    }

    /**
     * Get counterpart kode
     */
    public function getCounterpartKode()
    {
        return $this->counterpart_kode;
    }

    /**
     * Check if has counterpart
     */
    public function hasCounterpart()
    {
        return !empty($this->counterpart_kode);
    }

    // ══════════════════════════════════════════════════════════
    // SCOPES
    // ══════════════════════════════════════════════════════════

    /**
     * Scope: Only negatable variabel
     */
    public function scopeNegatable($query)
    {
        return $query->where('negatable', true);
    }

    /**
     * Scope: With counterpart
     */
    public function scopeWithCounterpart($query)
    {
        return $query->whereNotNull('counterpart_kode');
    }
}