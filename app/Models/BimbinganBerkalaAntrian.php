<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class BimbinganBerkalaAntrian extends Model
{
    use HasFactory;

    protected $table = 'bimbingan_berkala_antrian';

    protected $fillable = [
        'jadwal_id',
        'santri_id',
        'nomor_urut',
        'status',
        'waktu_dipanggil',
        'waktu_selesai',
    ];

    protected $casts = [
        'waktu_dipanggil' => 'datetime',
        'waktu_selesai'   => 'datetime',
    ];

    // ═══════════════════════════════════════════════════════════
    // RELATIONSHIPS
    // ═══════════════════════════════════════════════════════════

    public function jadwal(): BelongsTo
    {
        return $this->belongsTo(BimbinganBerkalaJadwal::class, 'jadwal_id');
    }

    public function santri(): BelongsTo
    {
        return $this->belongsTo(User::class, 'santri_id');
    }

    public function sesi(): HasOne
    {
        return $this->hasOne(BimbinganBerkalaSesi::class, 'antrian_id');
    }

    // ═══════════════════════════════════════════════════════════
    // ACCESSORS
    // ═══════════════════════════════════════════════════════════

    public function getStatusLabelAttribute(): string
    {
        return match($this->status) {
            'menunggu'    => 'Menunggu',
            'dipanggil'   => 'Dipanggil',
            'selesai'     => 'Selesai',
            'tidak_hadir' => 'Tidak Hadir',
            default       => 'Unknown',
        };
    }

    public function getStatusBadgeAttribute(): string
    {
        return match($this->status) {
            'menunggu'    => 'gray',
            'dipanggil'   => 'yellow',
            'selesai'     => 'green',
            'tidak_hadir' => 'red',
            default       => 'gray',
        };
    }

    // ═══════════════════════════════════════════════════════════
    // SCOPES
    // ═══════════════════════════════════════════════════════════

    public function scopeMenunggu($query)
    {
        return $query->where('status', 'menunggu');
    }

    public function scopeSelesai($query)
    {
        return $query->where('status', 'selesai');
    }
}