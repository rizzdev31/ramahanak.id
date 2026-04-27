<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LaporanExpertSystemKonselor extends Model
{
    use HasFactory;

    protected $table = 'laporan_expert_system_konselor';

    protected $fillable = [
        'santri_id',
        'rule_kode',
        'rule_kategori',
        'diagnosis_kode',
        'diagnosis_nama',
        'diagnosis_penjelasan',
        'rekomendasi_sistem',
        'kode_terpenuhi',
        'status',
        'sesi_bimbingan_terakhir',
        'validated_by',
        'tanggal_trigger',
        'tanggal_selesai',
    ];

    protected $casts = [
        'kode_terpenuhi' => 'array',
        'tanggal_trigger' => 'datetime',
        'tanggal_selesai' => 'datetime',
        'sesi_bimbingan_terakhir' => 'integer',
    ];

    protected $appends = [
        'status_label',
        'status_badge_color',
        'progress_percentage',
        'is_completed',
        'is_max_sesi',
    ];

    /**
     * Relationships
     */
    public function santri(): BelongsTo
    {
        return $this->belongsTo(User::class, 'santri_id');
    }

    public function validator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'validated_by');
    }

    public function sesiList(): HasMany
    {
        return $this->hasMany(SesiBimbinganKonselor::class, 'laporan_konselor_id')
                    ->orderBy('sesi_ke', 'asc');
    }

    public function catatanKolaboratif(): HasMany
    {
        return $this->hasMany(CatatanKolaboratifKonseling::class, 'laporan_konselor_id')
                    ->orderBy('created_at', 'desc');
    }

    /**
     * Accessors
     */
    public function getStatusLabelAttribute(): string
    {
        return match($this->status) {
            'pending' => 'Menunggu Approve BK',
            'in_progress' => 'Sedang Bimbingan (Sesi ' . $this->sesi_bimbingan_terakhir . '/5)',
            'completed' => 'Selesai',
            'discontinued' => 'Dihentikan',
            default => 'Unknown'
        };
    }

    public function getStatusBadgeColorAttribute(): string
    {
        return match($this->status) {
            'pending' => 'yellow',
            'in_progress' => 'blue',
            'completed' => 'green',
            'discontinued' => 'red',
            default => 'gray'
        };
    }

    public function getProgressPercentageAttribute(): int
    {
        return (int) (($this->sesi_bimbingan_terakhir / 5) * 100);
    }

    public function getIsCompletedAttribute(): bool
    {
        return $this->status === 'completed';
    }

    public function getIsMaxSesiAttribute(): bool
    {
        return $this->sesi_bimbingan_terakhir >= 5;
    }

    /**
     * Scopes
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeInProgress($query)
    {
        return $query->where('status', 'in_progress');
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopeForSantri($query, $santriId)
    {
        return $query->where('santri_id', $santriId);
    }

    /**
     * Helper Methods
     */
    public function canAddSesi(): bool
    {
        // Bisa tambah sesi jika:
        // 1. Status in_progress
        // 2. Belum sampai sesi 5
        return $this->status === 'in_progress' 
            && $this->sesi_bimbingan_terakhir < 5;
    }

    public function shouldAutoClose(): bool
    {
        // Auto-close jika sudah sesi 5
        return $this->sesi_bimbingan_terakhir >= 5;
    }

    public function getNextSesiNumber(): int
    {
        return $this->sesi_bimbingan_terakhir + 1;
    }
}