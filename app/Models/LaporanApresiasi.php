<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LaporanApresiasi extends Model
{
    use HasFactory;

    protected $table = 'laporan_apresiasi';

    protected $fillable = [
        'hasil_preprocessing_id',
        'santri_id',
        'kode_apresiasi',
        'bobot_poin',
        'reward_default',
        'catatan_bk',
        'tanggal_kejadian',
        'tanggal_reward',
        'approval_status',
        'status',
        'validated_by',
        'validated_at',
    ];

    protected $casts = [
        'tanggal_kejadian' => 'date',
        'tanggal_reward' => 'date',
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
     * Santri yang dapat apresiasi
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
        return $this->hasMany(RiwayatSantri::class, 'laporan_apresiasi_id');
    }

    /**
     * Variabel apresiasi terkait
     */
    public function variabelApresiasi()
    {
        return $this->hasOne(VariabelApresiasi::class, 'kode', 'kode_apresiasi');
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
     * Scope untuk sudah diberikan
     */
    public function scopeDiberikan($query)
    {
        return $query->where('status', 'diberikan');
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
            'diberikan' => 'green',
            'ditunda' => 'orange',
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
            'diberikan' => 'Sudah Diberikan',
            'ditunda' => 'Ditunda',
            default => $this->status,
        };
    }

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
            'App\Models\LaporanApresiasi',
            $this->id
        );
    }

    /**
     * Get approval progress percentage
     */
    public function getApprovalProgressAttribute()
    {
        return LaporanApproval::getProgressPercentage(
            'App\Models\LaporanApresiasi',
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
            'diberikan' => 'Sudah Diberikan',
            'ditunda' => 'Ditunda',
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
            'diberikan' => 'green',
            'ditunda' => 'orange',
            default => 'gray',
        };
    }
}