<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BimbinganBerkalaJadwal extends Model
{
    use HasFactory;

    protected $table = 'bimbingan_berkala_jadwal';

    protected $fillable = [
        'template_id',
        'kelas_id',
        'created_by',
        'judul',
        'tanggal_jadwal',
        'waktu_mulai',
        'waktu_selesai',
        'catatan_untuk_tendik',
        'mode_pengisian',
        'deadline_mandiri',
        'status',
    ];

    protected $casts = [
        'tanggal_jadwal'   => 'date',
        'deadline_mandiri' => 'datetime',
    ];

    // ═══════════════════════════════════════════════════════════
    // RELATIONSHIPS
    // ═══════════════════════════════════════════════════════════

    public function template(): BelongsTo
    {
        return $this->belongsTo(BimbinganBerkalaTemplate::class, 'template_id');
    }

    public function kelas(): BelongsTo
    {
        return $this->belongsTo(Kelas::class, 'kelas_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function antrian(): HasMany
    {
        return $this->hasMany(BimbinganBerkalaAntrian::class, 'jadwal_id')
                    ->orderBy('nomor_urut', 'asc');
    }

    public function sesi(): HasMany
    {
        return $this->hasMany(BimbinganBerkalaSesi::class, 'jadwal_id');
    }

    // ═══════════════════════════════════════════════════════════
    // ACCESSORS
    // ═══════════════════════════════════════════════════════════

    public function getStatusLabelAttribute(): string
    {
        return match($this->status) {
            'draft'      => 'Draft',
            'aktif'      => 'Aktif',
            'berjalan'   => 'Sedang Berjalan',
            'selesai'    => 'Selesai',
            'dibatalkan' => 'Dibatalkan',
            default      => 'Unknown',
        };
    }

    public function getStatusBadgeAttribute(): string
    {
        return match($this->status) {
            'draft'      => 'gray',
            'aktif'      => 'blue',
            'berjalan'   => 'yellow',
            'selesai'    => 'green',
            'dibatalkan' => 'red',
            default      => 'gray',
        };
    }

    public function getModeLabelAttribute(): string
    {
        return match($this->mode_pengisian) {
            'bk_langsung'    => 'BK Wawancara Langsung',
            'santri_mandiri' => 'Santri Isi Mandiri',
            default          => 'Unknown',
        };
    }

    public function getProgressAttribute(): array
    {
        $total   = $this->antrian()->count();
        $selesai = $this->antrian()->where('status', 'selesai')->count();
        $pct     = $total > 0 ? round(($selesai / $total) * 100) : 0;

        return [
            'total'   => $total,
            'selesai' => $selesai,
            'persen'  => $pct,
        ];
    }

    // ═══════════════════════════════════════════════════════════
    // SCOPES
    // ═══════════════════════════════════════════════════════════

    public function scopeAktif($query)
    {
        return $query->where('status', 'aktif');
    }

    public function scopeBerjalan($query)
    {
        return $query->where('status', 'berjalan');
    }

    public function scopeForKelas($query, $kelasId)
    {
        return $query->where('kelas_id', $kelasId);
    }

    // ═══════════════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════════════

    public function getAntrianBerikutnya(): ?BimbinganBerkalaAntrian
    {
        return $this->antrian()
                    ->where('status', 'menunggu')
                    ->orderBy('nomor_urut')
                    ->first();
    }

    public function isDeadlineExpired(): bool
    {
        if ($this->mode_pengisian !== 'santri_mandiri') return false;
        if (!$this->deadline_mandiri) return false;
        return now()->isAfter($this->deadline_mandiri);
    }
}