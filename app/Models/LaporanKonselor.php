<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LaporanKonselor extends Model
{
    use HasFactory;

    protected $table = 'laporan_konselor';

    protected $fillable = [
        'sumber_input',
        'external_app',
        'external_ref_id',
        'external_actor',
        'hasil_preprocessing_id',
        'santri_id',
        'kode_konselor',
        'diagnosis_default',
        'tindakan_default',
        'catatan_bk',
        'tanggal_kejadian',
        'tanggal_konseling_mulai',
        'tanggal_konseling_selesai',
        'status',
        'approval_status',
        'validated_by',
        'validated_at',
        // ✅ Kolom baru dari migration 8 (bimbingan berkala)
        'sumber',            // 'preprocessing' | 'bimbingan_berkala'
        'bimbingan_sesi_id', // FK ke bimbingan_berkala_sesi (nullable)
    ];

    protected $casts = [
        'tanggal_kejadian' => 'date',
        'tanggal_konseling_mulai' => 'date',
        'tanggal_konseling_selesai' => 'date',
        'validated_at' => 'datetime',
    ];

    // ═══════════════════════════════════════════════════════════
    // RELATIONSHIPS
    // ═══════════════════════════════════════════════════════════

    /**
     * Hasil preprocessing yang memicu laporan ini
     */
    public function hasilPreprocessing()
    {
        return $this->belongsTo(HasilPreprocessing::class, 'hasil_preprocessing_id');
    }

    /**
     * Santri yang dikonseling
     */
    public function santri()
    {
        return $this->belongsTo(User::class, 'santri_id');
    }

    /**
     * BK yang approve
     */
    public function validator()
    {
        return $this->belongsTo(User::class, 'validated_by');
    }

    /**
     * Riwayat santri terkait
     */
    public function riwayatSantri()
    {
        return $this->hasMany(RiwayatSantri::class, 'laporan_konselor_id');
    }

    /**
     * Variabel konselor terkait
     */
    public function variabelKonselor()
    {
        return $this->hasOne(VariabelKonselor::class, 'kode', 'kode_konselor');
    }

    /**
     * ✅ Sesi bimbingan berkala yang memicu laporan ini (nullable)
     * Hanya terisi jika sumber = 'bimbingan_berkala'
     */
    public function bimbinganSesi()
    {
        return $this->belongsTo(\App\Models\BimbinganBerkalaSesi::class, 'bimbingan_sesi_id');
    }

    /**
     * Scope: laporan dari bimbingan berkala
     */
    public function scopeFromBimbingan($query)
    {
        return $query->where('sumber', 'bimbingan_berkala');
    }

    /**
     * Scope: laporan dari preprocessing
     */
    public function scopeFromPreprocessing($query)
    {
        return $query->where(function ($q) {
            $q->where('sumber', 'preprocessing')->orWhereNull('sumber');
        });
    }

    // ═══════════════════════════════════════════════════════════
    // SCOPES
    // ═══════════════════════════════════════════════════════════

    /**
     * Scope untuk filter by status
     */
    public function scopeStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope untuk pending
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope untuk dalam konseling
     */
    public function scopeDalamKonseling($query)
    {
        return $query->where('status', 'dalam_konseling');
    }

    /**
     * Scope untuk selesai
     */
    public function scopeSelesai($query)
    {
        return $query->where('status', 'selesai');
    }

    /**
     * Scope untuk santri tertentu
     */
    public function scopeBySantri($query, $santriId)
    {
        return $query->where('santri_id', $santriId);
    }

    // ═══════════════════════════════════════════════════════════
    // ACCESSORS
    // ═══════════════════════════════════════════════════════════

    /**
     * Get status badge color
     */
    public function getStatusBadgeAttribute()
    {
        return match($this->status) {
            'pending' => 'yellow',
            'dalam_konseling' => 'blue',
            'selesai' => 'green',
            'dirujuk' => 'purple',
            default => 'gray',
        };
    }

    /**
     * Get status label
     */
    public function getStatusLabelAttribute()
    {
        return match($this->status) {
            'pending' => 'Pending',
            'dalam_konseling' => 'Dalam Konseling',
            'selesai' => 'Selesai',
            'dirujuk' => 'Dirujuk',
            default => $this->status,
        };
    }
    // Di dalam class LaporanKonselor, tambahkan:

    /**
     * Approval records untuk laporan ini (polymorphic)
     */
    public function approvals()
    {
        return $this->morphMany(LaporanApproval::class, 'laporan');
    }

    /**
     * Pending approvals
     */
    public function pendingApprovals()
    {
        return $this->morphMany(LaporanApproval::class, 'laporan')
                    ->whereNull('approved_at');
    }

    /**
     * Approved approvals
     */
    public function approvedApprovals()
    {
        return $this->morphMany(LaporanApproval::class, 'laporan')
                    ->whereNotNull('approved_at');
    }

    /**
     * Check if all tenaga pendidik sudah approve
     */
    public function isAllTenagaPendidikApproved()
    {
        return LaporanApproval::isAllApproved(
            'App\Models\LaporanKonselor',
            $this->id
        );
    }

    /**
     * Get approval progress percentage
     */
    public function getApprovalProgressAttribute()
    {
        return LaporanApproval::getProgressPercentage(
            'App\Models\LaporanKonselor',
            $this->id
        );
    }

    /**
     * Check if has overdue approvals
     */
    public function hasOverdueApprovals()
    {
        return $this->approvals()->overdue()->exists();
    }

    /**
     * Get approval status label
     */
    public function getApprovalStatusLabelAttribute()
    {
        return match($this->approval_status) {
            'pending_tenaga_pendidik' => 'Menunggu Approval Wali',
            'pending_bk' => 'Menunggu Approval BK',
            'selesai' => 'Selesai',
            'dirujuk' => 'Dirujuk',
            default => 'Unknown',
        };
    }

    /**
     * Get approval status badge color
     */
    public function getApprovalStatusBadgeAttribute()
    {
        return match($this->approval_status) {
            'pending_tenaga_pendidik' => 'yellow',
            'pending_bk' => 'blue',
            'selesai' => 'green',
            'dirujuk' => 'purple',
            default => 'gray',
        };
    }
}