<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LaporanPelanggaran extends Model
{
    use HasFactory;

    protected $table = 'laporan_pelanggaran';

    protected $fillable = [
        'hasil_preprocessing_id',
        'pelaku_santri_id',
        'korban_santri_id',
        'kode_pelanggaran',
        'bobot_poin',
        'tindakan_default',
        'catatan_bk',
        'tanggal_kejadian',
        'tanggal_tindakan',
        'status',
        'approval_status',
        'validated_by',
        'validated_at',
    ];

    protected $casts = [
        'tanggal_kejadian' => 'date',
        'tanggal_tindakan' => 'date',
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
     * Santri pelaku
     */
    public function pelakuSantri()
    {
        return $this->belongsTo(User::class, 'pelaku_santri_id');
    }

    /**
     * Santri korban
     */
    public function korbanSantri()
    {
        return $this->belongsTo(User::class, 'korban_santri_id');
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
        return $this->hasMany(RiwayatSantri::class, 'laporan_pelanggaran_id');
    }

    /**
     * Variabel pelanggaran terkait
     */
    public function variabelPelanggaran()
    {
        return $this->hasOne(VariabelPelanggaran::class, 'kode', 'kode_pelanggaran');
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
     * Scope untuk pending (belum di-handle)
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope untuk selesai
     */
    public function scopeSelesai($query)
    {
        return $query->where('status', 'selesai');
    }

    /**
     * Scope untuk santri tertentu (pelaku atau korban)
     */
    public function scopeBySantri($query, $santriId)
    {
        return $query->where('pelaku_santri_id', $santriId)
                     ->orWhere('korban_santri_id', $santriId);
    }

    // ═══════════════════════════════════════════════════════════
    // ACCESSORS & MUTATORS
    // ═══════════════════════════════════════════════════════════

    /**
     * Get status badge color
     */
    public function getStatusBadgeAttribute()
    {
        return match($this->status) {
            'pending' => 'yellow',
            'dalam_proses' => 'blue',
            'selesai' => 'green',
            'diabaikan' => 'gray',
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
            'dalam_proses' => 'Dalam Proses',
            'selesai' => 'Selesai',
            'diabaikan' => 'Diabaikan',
            default => $this->status,
        };
    }
    
    /**
     * ═══════════════════════════════════════════════════════════
     * TAMBAHKAN KE MODEL: LaporanPelanggaran.php
     * ═══════════════════════════════════════════════════════════
     */

    // Di dalam class LaporanPelanggaran, tambahkan:

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
            'App\Models\LaporanPelanggaran',
            $this->id
        );
    }

    /**
     * Get approval progress percentage
     */
    public function getApprovalProgressAttribute()
    {
        return LaporanApproval::getProgressPercentage(
            'App\Models\LaporanPelanggaran',
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
            'diabaikan' => 'Diabaikan',
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
            'diabaikan' => 'gray',
            default => 'gray',
        };
    }
}