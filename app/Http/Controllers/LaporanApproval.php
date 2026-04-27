<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LaporanApproval extends Model
{
    use HasFactory;

    protected $table = 'laporan_approvals';

    protected $fillable = [
        'laporan_type',
        'laporan_id',
        'tenaga_pendidik_id',
        'catatan',
        'approved_at',
        'deadline_at',
    ];

    protected $casts = [
        'approved_at' => 'datetime',
        'deadline_at' => 'datetime',
    ];

    // ═══════════════════════════════════════════════════════════
    // RELATIONSHIPS
    // ═══════════════════════════════════════════════════════════

    /**
     * Polymorphic relation ke laporan
     * Bisa: LaporanPelanggaran, LaporanApresiasi, LaporanKonselor
     */
    public function laporan()
    {
        return $this->morphTo();
    }

    /**
     * Tenaga Pendidik yang approve
     */
    public function tenagaPendidik()
    {
        return $this->belongsTo(User::class, 'tenaga_pendidik_id');
    }

    // ═══════════════════════════════════════════════════════════
    // SCOPES
    // ═══════════════════════════════════════════════════════════

    /**
     * Scope: Belum di-approve
     */
    public function scopePending($query)
    {
        return $query->whereNull('approved_at');
    }

    /**
     * Scope: Sudah di-approve
     */
    public function scopeApproved($query)
    {
        return $query->whereNotNull('approved_at');
    }

    /**
     * Scope: Overdue (melewati deadline dan belum approve)
     */
    public function scopeOverdue($query)
    {
        return $query->whereNull('approved_at')
                     ->where('deadline_at', '<', now());
    }

    /**
     * Scope: Filter by tenaga pendidik
     */
    public function scopeByTenagaPendidik($query, $userId)
    {
        return $query->where('tenaga_pendidik_id', $userId);
    }

    /**
     * Scope: Filter by laporan type
     */
    public function scopeByLaporanType($query, $type)
    {
        return $query->where('laporan_type', $type);
    }

    // ═══════════════════════════════════════════════════════════
    // HELPER METHODS
    // ═══════════════════════════════════════════════════════════

    /**
     * Check apakah approval ini overdue
     */
    public function isOverdue(): bool
    {
        return !$this->approved_at && $this->deadline_at && now() > $this->deadline_at;
    }

    /**
     * Check apakah sudah di-approve
     */
    public function isApproved(): bool
    {
        return !is_null($this->approved_at);
    }

    /**
     * Get sisa waktu deadline (in hours)
     */
    public function getRemainingHoursAttribute(): ?float
    {
        if (!$this->deadline_at || $this->approved_at) {
            return null;
        }

        $diff = now()->diffInHours($this->deadline_at, false);
        return $diff > 0 ? $diff : 0;
    }

    /**
     * Get jenis laporan label
     */
    public function getJenisLaporanLabelAttribute(): string
    {
        return match($this->laporan_type) {
            'App\Models\LaporanPelanggaran' => 'Pelanggaran',
            'App\Models\LaporanApresiasi' => 'Apresiasi',
            'App\Models\LaporanKonselor' => 'Konselor',
            default => 'Unknown',
        };
    }

    /**
     * Get status badge color
     */
    public function getStatusBadgeColorAttribute(): string
    {
        if ($this->approved_at) {
            return 'green'; // Sudah approve
        }
        
        if ($this->isOverdue()) {
            return 'red'; // Overdue
        }
        
        return 'yellow'; // Pending
    }

    /**
     * Get status label
     */
    public function getStatusLabelAttribute(): string
    {
        if ($this->approved_at) {
            return 'Sudah Approve';
        }
        
        if ($this->isOverdue()) {
            return 'Overdue';
        }
        
        return 'Pending';
    }

    // ═══════════════════════════════════════════════════════════
    // STATIC HELPERS
    // ═══════════════════════════════════════════════════════════

    /**
     * Get total approvals untuk laporan tertentu
     */
    public static function getTotalForLaporan($laporanType, $laporanId): int
    {
        return self::where('laporan_type', $laporanType)
                   ->where('laporan_id', $laporanId)
                   ->count();
    }

    /**
     * Get approved count untuk laporan tertentu
     */
    public static function getApprovedCountForLaporan($laporanType, $laporanId): int
    {
        return self::where('laporan_type', $laporanType)
                   ->where('laporan_id', $laporanId)
                   ->whereNotNull('approved_at')
                   ->count();
    }

    /**
     * Check apakah semua approval sudah complete
     */
    public static function isAllApproved($laporanType, $laporanId): bool
    {
        $total = self::getTotalForLaporan($laporanType, $laporanId);
        $approved = self::getApprovedCountForLaporan($laporanType, $laporanId);
        
        return $total > 0 && $total === $approved;
    }

    /**
     * Get progress percentage
     */
    public static function getProgressPercentage($laporanType, $laporanId): int
    {
        $total = self::getTotalForLaporan($laporanType, $laporanId);
        
        if ($total === 0) {
            return 0;
        }
        
        $approved = self::getApprovedCountForLaporan($laporanType, $laporanId);
        
        return (int) round(($approved / $total) * 100);
    }
}