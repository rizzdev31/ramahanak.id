<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SesiBimbinganKonselor extends Model
{
    use HasFactory;

    protected $table = 'sesi_bimbingan_konselor';

    protected $fillable = [
        'laporan_konselor_id',
        'sesi_ke',
        'tanggal_sesi',
        'catatan_bk',
        'proses_bimbingan',
        'rencana_tindak_lanjut',
        'status_santri',
        'lanjut_sesi_berikutnya',
    ];

    protected $casts = [
        'tanggal_sesi' => 'date',
        'lanjut_sesi_berikutnya' => 'boolean',
    ];

    protected $appends = [
        'status_santri_label',
        'status_santri_badge_color',
    ];

    /**
     * Relationships
     */
    public function laporanKonselor(): BelongsTo
    {
        return $this->belongsTo(LaporanExpertSystemKonselor::class, 'laporan_konselor_id');
    }

    public function catatanKolaboratif(): HasMany
    {
        return $this->hasMany(CatatanKolaboratifKonseling::class, 'sesi_bimbingan_id')
                    ->orderBy('created_at', 'desc');
    }

    /**
     * Accessors
     */
    public function getStatusSantriLabelAttribute(): ?string
    {
        return match($this->status_santri) {
            'membaik' => '✅ Membaik',
            'stabil' => '➡️ Stabil',
            'masih_bermasalah' => '⚠️ Masih Bermasalah',
            'memburuk' => '❌ Memburuk',
            default => null
        };
    }

    public function getStatusSantriBadgeColorAttribute(): string
    {
        return match($this->status_santri) {
            'membaik' => 'green',
            'stabil' => 'blue',
            'masih_bermasalah' => 'yellow',
            'memburuk' => 'red',
            default => 'gray'
        };
    }

    /**
     * Scopes
     */
    public function scopeForLaporan($query, $laporanId)
    {
        return $query->where('laporan_konselor_id', $laporanId);
    }

    public function scopeOrderBySesi($query)
    {
        return $query->orderBy('sesi_ke', 'asc');
    }
}