<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class HasilPreprocessing extends Model
{
    use HasFactory;

    protected $table = 'hasil_preprocessing';

    protected $fillable = [
        'laporan_awal_id',
        'kode_matched',
        'pelaku_nama',
        'pelaku_santri_id',
        'korban_nama',
        'korban_santri_id',
        'kata_kerja_dasar',
        'preprocessing_data',
        'status',
        'is_corrected',
        'correction_notes',
        'validated_by',
        'validated_at',
        'error_message',
        'processed_at',
        // ✅ VERIFIKASI KORBAN (BARU!)
        'requires_korban_verification',
        'korban_verified',
        'korban_verified_at',
        'korban_verified_by',
        'verified_kode_konselor',
    ];

    protected $casts = [
        'kode_matched' => 'array',
        'preprocessing_data' => 'array',
        'verified_kode_konselor' => 'array',  // ✅ BARU
        'is_corrected' => 'boolean',
        'requires_korban_verification' => 'boolean',  // ✅ BARU
        'korban_verified' => 'boolean',  // ✅ BARU
        'validated_at' => 'datetime',
        'processed_at' => 'datetime',
        'korban_verified_at' => 'datetime',  // ✅ BARU
    ];

    protected $appends = [
        'kode_pelanggaran',
        'kode_apresiasi',
        'kode_konselor',
    ];

    // ── Relasi ──────────────────────────────────────────────

    /**
     * Relasi ke Laporan Awal
     */
    public function laporanAwal()
    {
        return $this->belongsTo(LaporanAwal::class, 'laporan_awal_id');
    }

    /**
     * Relasi ke Santri Pelaku
     */
    public function pelakuSantri()
    {
        return $this->belongsTo(User::class, 'pelaku_santri_id')
            ->with('santriProfile');
    }

    /**
     * Alias untuk pelakuSantri (backward compatibility)
     */
    public function pelaku()
    {
        return $this->pelakuSantri();
    }

    /**
     * Relasi ke Santri Korban
     */
    public function korbanSantri()
    {
        return $this->belongsTo(User::class, 'korban_santri_id')
            ->with('santriProfile');
    }

    /**
     * Alias untuk korbanSantri (backward compatibility)
     */
    public function korban()
    {
        return $this->korbanSantri();
    }

    /**
     * Relasi ke Validator BK
     */
    public function validator()
    {
        return $this->belongsTo(User::class, 'validated_by');
    }

    /**
     * ✅ BARU: Relasi ke BK yang verifikasi korban
     */
    public function korbanVerifier()
    {
        return $this->belongsTo(User::class, 'korban_verified_by');
    }

    // ── Scopes ──────────────────────────────────────────────

    /**
     * Scope untuk filter status
     */
    public function scopePendingValidasi($query)
    {
        return $query->where('status', 'pending_validasi');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopeRejected($query)
    {
        return $query->where('status', 'rejected');
    }

    public function scopeFailed($query)
    {
        return $query->where('status', 'failed');
    }

    /**
     * ✅ BARU: Scope untuk filter verifikasi korban
     */
    public function scopeNeedsKorbanVerification($query)
    {
        return $query->where('requires_korban_verification', true)
                    ->where('korban_verified', false);
    }

    public function scopeKorbanVerified($query)
    {
        return $query->where('korban_verified', true);
    }

    // ── Accessors ───────────────────────────────────────────

    /**
     * Get status badge color
     */
    public function getStatusBadgeColorAttribute()
    {
        return match($this->status) {
            'pending_validasi' => 'yellow',
            'approved' => 'green',
            'rejected' => 'red',
            'failed' => 'gray',
            default => 'gray',
        };
    }

    /**
     * Get status label
     */
    public function getStatusLabelAttribute()
    {
        return match($this->status) {
            'pending_validasi' => 'Menunggu Validasi',
            'approved' => 'Disetujui',
            'rejected' => 'Ditolak',
            'failed' => 'Gagal',
            default => 'Unknown',
        };
    }

    /**
     * Get kode by type (P, A, G)
     */
    public function getKodePelanggaranAttribute()
    {
        return array_values(array_filter($this->kode_matched ?? [], fn($k) => str_starts_with($k, 'P')));
    }

    public function getKodeApresiasiAttribute()
    {
        return array_values(array_filter($this->kode_matched ?? [], fn($k) => str_starts_with($k, 'A')));
    }

    public function getKodeKonselorAttribute()
    {
        return array_values(array_filter($this->kode_matched ?? [], fn($k) => str_starts_with($k, 'G')));
    }

    /**
     * Check if has certain type of kode
     */
    public function hasPelanggaran()
    {
        return !empty($this->kode_pelanggaran);
    }

    public function hasApresiasi()
    {
        return !empty($this->kode_apresiasi);
    }

    public function hasKonselor()
    {
        return !empty($this->kode_konselor);
    }

    /**
     * Get display name untuk pelaku
     */
    public function getPelakuDisplayNameAttribute()
    {
        if ($this->pelaku_nama) {
            return $this->pelaku_nama;
        }
        
        if ($this->pelakuSantri && $this->pelakuSantri->santriProfile) {
            return $this->pelakuSantri->santriProfile->nama_panggilan 
                ?? $this->pelakuSantri->santriProfile->nama_lengkap;
        }
        
        return 'Tidak terdeteksi';
    }

    /**
     * Get display name untuk korban
     */
    public function getKorbanDisplayNameAttribute()
    {
        if ($this->korban_nama) {
            return $this->korban_nama;
        }
        
        if ($this->korbanSantri && $this->korbanSantri->santriProfile) {
            return $this->korbanSantri->santriProfile->nama_panggilan 
                ?? $this->korbanSantri->santriProfile->nama_lengkap;
        }
        
        return 'Tidak terdeteksi';
    }

    /**
     * ✅ BARU: Check if needs korban verification
     */
    public function needsKorbanVerification()
    {
        return $this->requires_korban_verification && !$this->korban_verified;
    }

    /**
     * ✅ BARU: Get verification status label
     */
    public function getVerificationStatusLabelAttribute()
    {
        if (!$this->requires_korban_verification) {
            return 'Tidak Perlu Verifikasi';
        }

        if ($this->korban_verified) {
            return 'Sudah Diverifikasi';
        }

        return 'Menunggu Verifikasi Korban';
    }
}