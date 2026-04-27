<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BimbinganBerkalaPertanyaan extends Model
{
    use HasFactory;

    protected $table = 'bimbingan_berkala_pertanyaan';

    protected $fillable = [
        'template_id',
        'urutan',
        'teks_pertanyaan',
        'is_required',
        'tipe',
        'kode_gejala_terkait',
        'threshold_flag',
        'flag_jika_jawaban',
        'pilihan_json',
        'analisis_nlp_aktif',
    ];

    protected $casts = [
        'is_required'        => 'boolean',
        'analisis_nlp_aktif' => 'boolean',
        'pilihan_json'       => 'array',
        'threshold_flag'     => 'integer',
    ];

    // ═══════════════════════════════════════════════════════════
    // RELATIONSHIPS
    // ═══════════════════════════════════════════════════════════

    public function template(): BelongsTo
    {
        return $this->belongsTo(BimbinganBerkalaTemplate::class, 'template_id');
    }

    public function variabelKonselor(): BelongsTo
    {
        return $this->belongsTo(VariabelKonselor::class, 'kode_gejala_terkait', 'kode');
    }

    public function jawaban(): HasMany
    {
        return $this->hasMany(BimbinganBerkalaJawaban::class, 'pertanyaan_id');
    }

    // ═══════════════════════════════════════════════════════════
    // ACCESSORS
    // ═══════════════════════════════════════════════════════════

    public function getTipeLabelAttribute(): string
    {
        return match($this->tipe) {
            'skala_1_5'   => 'Skala 1-5',
            'ya_tidak'    => 'Ya / Tidak',
            'pilihan'     => 'Pilihan Ganda',
            'teks_bebas'  => 'Teks Bebas (Analisis)',
            'teks_curhat' => 'Teks Bebas (Curhat)',
            default       => 'Unknown',
        };
    }

    public function getTipeIconAttribute(): string
    {
        return match($this->tipe) {
            'skala_1_5'   => '🔢',
            'ya_tidak'    => '✓✗',
            'pilihan'     => '☑',
            'teks_bebas'  => '🔍',
            'teks_curhat' => '💬',
            default       => '?',
        };
    }

    /**
     * Apakah soal ini perlu dianalisis untuk flag gejala?
     */
    public function getIsAnalyzableAttribute(): bool
    {
        return in_array($this->tipe, ['skala_1_5', 'ya_tidak', 'pilihan', 'teks_bebas']);
    }

    /**
     * Apakah soal ini pakai NLP Python?
     */
    public function getIsNlpAttribute(): bool
    {
        return $this->tipe === 'teks_bebas' && $this->analisis_nlp_aktif;
    }
}