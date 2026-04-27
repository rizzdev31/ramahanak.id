<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BimbinganBerkalaSesi extends Model
{
    use HasFactory;

    protected $table = 'bimbingan_berkala_sesi';

    protected $fillable = [
        'jadwal_id',
        'antrian_id',
        'santri_id',
        'diisi_oleh',
        'diisi_oleh_user_id',
        'catatan_bk_umum',
        'gejala_terdeteksi',
        'gejala_dikonfirmasi',
        'tindak_lanjut',
        'catatan_keputusan',
        'laporan_konselor_id',
        'status',
        'reviewed_by',
        'reviewed_at',
    ];

    protected $casts = [
        'gejala_terdeteksi'  => 'array',
        'gejala_dikonfirmasi'=> 'array',
        'reviewed_at'        => 'datetime',
    ];

    // ═══════════════════════════════════════════════════════════
    // RELATIONSHIPS
    // ═══════════════════════════════════════════════════════════

    public function jadwal(): BelongsTo
    {
        return $this->belongsTo(BimbinganBerkalaJadwal::class, 'jadwal_id');
    }

    public function antrian(): BelongsTo
    {
        return $this->belongsTo(BimbinganBerkalaAntrian::class, 'antrian_id');
    }

    public function santri(): BelongsTo
    {
        return $this->belongsTo(User::class, 'santri_id');
    }

    public function pengisi(): BelongsTo
    {
        return $this->belongsTo(User::class, 'diisi_oleh_user_id');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function laporanKonselor(): BelongsTo
    {
        return $this->belongsTo(LaporanKonselor::class, 'laporan_konselor_id');
    }

    public function jawaban(): HasMany
    {
        return $this->hasMany(BimbinganBerkalaJawaban::class, 'sesi_id')
                    ->orderBy('id');
    }

    public function riwayatSantri(): HasMany
    {
        return $this->hasMany(RiwayatSantri::class, 'bimbingan_sesi_id');
    }

    // ═══════════════════════════════════════════════════════════
    // ACCESSORS
    // ═══════════════════════════════════════════════════════════

    public function getStatusLabelAttribute(): string
    {
        return match($this->status) {
            'draft'            => 'Draft',
            'menunggu_review'  => 'Menunggu Review BK',
            'selesai'          => 'Selesai',
            default            => 'Unknown',
        };
    }

    public function getStatusBadgeAttribute(): string
    {
        return match($this->status) {
            'draft'            => 'gray',
            'menunggu_review'  => 'yellow',
            'selesai'          => 'green',
            default            => 'gray',
        };
    }

    public function getTindakLanjutLabelAttribute(): string
    {
        return match($this->tindak_lanjut) {
            'tidak_perlu'      => 'Tidak Perlu Tindak Lanjut',
            'pantau'           => 'Dipantau di Sesi Berikutnya',
            'rujuk_konseling'  => 'Dirujuk ke Konseling Individual',
            default            => '-',
        };
    }

    public function getTindakLanjutBadgeAttribute(): string
    {
        return match($this->tindak_lanjut) {
            'tidak_perlu'      => 'green',
            'pantau'           => 'yellow',
            'rujuk_konseling'  => 'red',
            default            => 'gray',
        };
    }

    /**
     * Ambil gejala yang punya confidence tinggi (dari skala/pilihan)
     */
    public function getGejalaHighConfidenceAttribute(): array
    {
        return collect($this->gejala_terdeteksi ?? [])
            ->filter(fn($g) => ($g['confidence'] ?? 'rendah') === 'tinggi')
            ->pluck('kode')
            ->unique()
            ->values()
            ->toArray();
    }

    /**
     * Ambil gejala saran dari NLP
     */
    public function getGejalaFromNlpAttribute(): array
    {
        return collect($this->gejala_terdeteksi ?? [])
            ->filter(fn($g) => ($g['sumber'] ?? '') === 'nlp')
            ->pluck('kode')
            ->unique()
            ->values()
            ->toArray();
    }
}