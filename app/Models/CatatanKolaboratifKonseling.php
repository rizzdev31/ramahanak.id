<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CatatanKolaboratifKonseling extends Model
{
    use HasFactory;

    protected $table = 'catatan_kolaboratif_konseling';

    protected $fillable = [
        'laporan_konselor_id',
        'sesi_bimbingan_id',
        'author_id',
        'author_role',
        'judul',
        'isi_catatan',
        'file_path',
    ];

    protected $appends = [
        'author_role_label',
        'file_url',
    ];

    /**
     * Relationships
     */
    public function laporanKonselor(): BelongsTo
    {
        return $this->belongsTo(LaporanExpertSystemKonselor::class, 'laporan_konselor_id');
    }

    public function sesiBimbingan(): BelongsTo
    {
        return $this->belongsTo(SesiBimbinganKonselor::class, 'sesi_bimbingan_id');
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    /**
     * Accessors
     */
    public function getAuthorRoleLabelAttribute(): string
    {
        return match($this->author_role) {
            'guru_bk' => 'Guru BK',
            'tenaga_pendidik' => 'Tenaga Pendidik',
            default => 'Unknown'
        };
    }

    public function getFileUrlAttribute(): ?string
    {
        if (!$this->file_path) {
            return null;
        }

        return \Storage::disk('public')->url($this->file_path);
    }

    /**
     * Scopes
     */
    public function scopeForLaporan($query, $laporanId)
    {
        return $query->where('laporan_konselor_id', $laporanId);
    }

    public function scopeForSesi($query, $sesiId)
    {
        return $query->where('sesi_bimbingan_id', $sesiId);
    }

    public function scopeByRole($query, $role)
    {
        return $query->where('author_role', $role);
    }

    public function scopeRecent($query)
    {
        return $query->orderBy('created_at', 'desc');
    }
}