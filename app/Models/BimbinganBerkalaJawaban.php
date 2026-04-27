<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BimbinganBerkalaJawaban extends Model
{
    use HasFactory;

    protected $table = 'bimbingan_berkala_jawaban';

    protected $fillable = [
        'sesi_id',
        'pertanyaan_id',
        'jawaban_teks',
        'jawaban_skor',
        'jawaban_pilihan',
        'jawaban_ya_tidak',
        'gejala_terdeteksi',
        'flag_triggered',
        'kode_gejala_triggered',
    ];

    protected $casts = [
        'gejala_terdeteksi' => 'array',
        'flag_triggered'    => 'boolean',
        'jawaban_ya_tidak'  => 'boolean',
        'jawaban_skor'      => 'integer',
    ];

    // ═══════════════════════════════════════════════════════════
    // RELATIONSHIPS
    // ═══════════════════════════════════════════════════════════

    public function sesi(): BelongsTo
    {
        return $this->belongsTo(BimbinganBerkalaSesi::class, 'sesi_id');
    }

    public function pertanyaan(): BelongsTo
    {
        return $this->belongsTo(BimbinganBerkalaPertanyaan::class, 'pertanyaan_id');
    }

    // ═══════════════════════════════════════════════════════════
    // ACCESSORS
    // ═══════════════════════════════════════════════════════════

    /**
     * Ambil nilai jawaban sebagai string yang bisa ditampilkan
     */
    public function getJawabanDisplayAttribute(): string
    {
        $tipe = $this->pertanyaan?->tipe ?? '';

        return match($tipe) {
            'skala_1_5'   => $this->jawaban_skor ? "{$this->jawaban_skor}/5" : '-',
            'ya_tidak'    => $this->jawaban_ya_tidak === true ? 'Ya'
                           : ($this->jawaban_ya_tidak === false ? 'Tidak' : '-'),
            'pilihan'     => $this->jawaban_pilihan ?? '-',
            'teks_bebas',
            'teks_curhat' => $this->jawaban_teks ?? '-',
            default       => '-',
        };
    }

    /**
     * Apakah jawaban ini valid / sudah diisi?
     */
    public function getIsFilledAttribute(): bool
    {
        $tipe = $this->pertanyaan?->tipe ?? '';

        return match($tipe) {
            'skala_1_5'   => !is_null($this->jawaban_skor),
            'ya_tidak'    => !is_null($this->jawaban_ya_tidak),
            'pilihan'     => !is_null($this->jawaban_pilihan),
            'teks_bebas',
            'teks_curhat' => !empty($this->jawaban_teks),
            default       => false,
        };
    }
}