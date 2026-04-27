<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RiwayatKelasSantri extends Model
{
    use HasFactory;

    protected $table = 'riwayat_kelas_santri';

    protected $fillable = [
        'user_id',
        'kelas_id',
        'tahun_ajaran',
        'is_active',
        'tanggal_masuk',
        'tanggal_keluar',
        'keterangan',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'tanggal_masuk' => 'date',
        'tanggal_keluar' => 'date',
    ];

    // =============================================
    // RELASI
    // =============================================

    /**
     * User (Santri) yang punya riwayat ini
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Santri profile
     */
    public function santri()
    {
        return $this->belongsTo(SantriProfile::class, 'user_id', 'user_id');
    }

    /**
     * Kelas dari riwayat ini
     */
    public function kelas()
    {
        return $this->belongsTo(Kelas::class);
    }

    // =============================================
    // SCOPE QUERIES
    // =============================================

    /**
     * Scope: Hanya riwayat aktif (kelas sekarang)
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', 1);
    }

    /**
     * Scope: Hanya riwayat history (kelas lama)
     */
    public function scopeHistory($query)
    {
        return $query->where('is_active', 0);
    }

    /**
     * Scope: Filter by tahun ajaran
     */
    public function scopeTahunAjaran($query, $tahunAjaran)
    {
        return $query->where('tahun_ajaran', $tahunAjaran);
    }
}