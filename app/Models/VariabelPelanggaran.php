<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VariabelPelanggaran extends Model
{
    protected $table = 'variabel_pelanggaran';

    protected $fillable = [
        'kode',
        'kategori',
        'poin',
        'tindakan',
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
     * Get counterpart Apresiasi (when negated)
     * 
     * Example: P002 (Telat) → A101 (Disiplin Waktu)
     */
    public function counterpartApresiasi()
    {
        return $this->belongsTo(VariabelApresiasi::class, 'counterpart_kode', 'kode');
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