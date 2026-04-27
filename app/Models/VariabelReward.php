<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VariabelReward extends Model
{
    use HasFactory;

    protected $table = 'variabel_reward';

    protected $fillable = [
        'kode',
        'reward',
        'poin',
        'rekomendasi',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    // ══════════════════════════════════════════════════════════
    // SCOPES
    // ══════════════════════════════════════════════════════════

    /**
     * Scope untuk variabel yang aktif
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope untuk sort by poin (threshold)
     */
    public function scopeOrderByThreshold($query, $direction = 'asc')
    {
        return $query->orderBy('poin', $direction);
    }

    // ══════════════════════════════════════════════════════════
    // ACCESSORS
    // ══════════════════════════════════════════════════════════

    /**
     * Get display label
     */
    public function getLabelAttribute()
    {
        return "{$this->kode} - {$this->reward} (Threshold: {$this->poin} poin)";
    }

    /**
     * Get status badge
     */
    public function getStatusBadgeAttribute()
    {
        return $this->is_active ? 'Aktif' : 'Nonaktif';
    }
}