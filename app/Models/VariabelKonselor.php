<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VariabelKonselor extends Model
{
    protected $table = 'variabel_konselor';

    protected $fillable = [
        'kode',
        'gangguan_mental',
        'kamus_kata',
        'rekomendasi',
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
    // NOTE: Konselor (G-codes) TIDAK menggunakan negation logic
    // Konselor tetap detect as-is, BK yang decide context
    // ══════════════════════════════════════════════════════════
}