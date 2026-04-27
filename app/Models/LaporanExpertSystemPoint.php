<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LaporanExpertSystemPoint extends Model
{
    use HasFactory;

    protected $table = 'laporan_expert_system_point';

    protected $fillable = [
        'santri_id',
        'jenis',
        'kode',
        'total_poin_saat_trigger',
        'threshold_poin_triggered',
        'konsekuensi_atau_reward',
        'rekomendasi',
        'aksi_bk',
        'catatan_bk',
        'status',
        'tanggal_trigger',
        'tanggal_selesai',
        'validated_by',
        'pdf_path',
        'tanggal_batas_pelaksanaan',
        'kesepakatan_keterlambatan',
        'is_terlambat',
        'has_bukti',
        'bukti_approved',
        'final_status',
    ];

    protected $casts = [
        'tanggal_trigger' => 'datetime',
        'tanggal_selesai' => 'datetime',
        'tanggal_batas_pelaksanaan' => 'date',
        'is_terlambat' => 'boolean',
        'has_bukti' => 'boolean',
        'bukti_approved' => 'boolean',
    ];

    protected $appends = [
        'status_label',
        'status_badge_color',
        'jenis_label',
        'final_status_label',
        'final_status_badge_color',
        'sisa_hari_deadline',
        'pdf_url', // ✅ NEW: Add pdf_url to appends
        
    ];

    // ══════════════════════════════════════════════════════════
    // RELASI
    // ══════════════════════════════════════════════════════════

    /**
     * Relasi ke Santri
     */
    public function santri()
    {
        return $this->belongsTo(User::class, 'santri_id')->with('santriProfile');
    }

    /**
     * Relasi ke Validator (BK yang complete)
     */
    public function validator()
    {
        return $this->belongsTo(User::class, 'validated_by');
    }

    /**
     * ✅ BARU: Relasi polymorphic ke Bukti Pelaksanaan
     */
    public function buktis()
    {
        return $this->morphMany(BuktiPelaksanaan::class, 'bukti_able')
            ->orderBy('created_at', 'desc');
    }

    /**
     * ✅ BARU: Get bukti yang sudah approved saja
     */
    public function buktisApproved()
    {
        return $this->morphMany(BuktiPelaksanaan::class, 'bukti_able')
            ->where('status', 'approved')
            ->orderBy('created_at', 'desc');
    }

    /**
     * ✅ BARU: Get bukti yang pending review
     */
    public function buktisPending()
    {
        return $this->morphMany(BuktiPelaksanaan::class, 'bukti_able')
            ->where('status', 'pending')
            ->orderBy('created_at', 'desc');
    }

    // ══════════════════════════════════════════════════════════
    // SCOPES
    // ══════════════════════════════════════════════════════════

    /**
     * Scope by jenis
     */
    public function scopeKonsekuensi($query)
    {
        return $query->where('jenis', 'konsekuensi');
    }

    public function scopeReward($query)
    {
        return $query->where('jenis', 'reward');
    }

    /**
     * Scope by status
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeDiproses($query)
    {
        return $query->where('status', 'diproses');
    }

    public function scopeSelesai($query)
    {
        return $query->where('status', 'selesai');
    }

    /**
     * Scope by santri
     */
    public function scopeBySantri($query, $santriId)
    {
        return $query->where('santri_id', $santriId);
    }

    // ══════════════════════════════════════════════════════════
    // ACCESSORS
    // ══════════════════════════════════════════════════════════

    /**
     * Get status label
     */
    public function getStatusLabelAttribute()
    {
        return match($this->status) {
            'pending' => 'Menunggu Verifikasi BK',
            'diproses' => 'Sedang Diproses',
            'selesai' => 'Selesai',
            default => 'Unknown',
        };
    }

    /**
     * Get status badge color
     */
    public function getStatusBadgeColorAttribute()
    {
        return match($this->status) {
            'pending' => 'yellow',
            'diproses' => 'blue',
            'selesai' => 'green',
            default => 'gray',
        };
    }

    /**
     * Get jenis label
     */
    public function getJenisLabelAttribute()
    {
        return match($this->jenis) {
            'konsekuensi' => 'Konsekuensi',
            'reward' => 'Reward',
            default => 'Unknown',
        };
    }

    /**
     * Get nama santri
     */
    public function getNamaSantriAttribute()
    {
        if ($this->santri && $this->santri->santriProfile) {
            return $this->santri->santriProfile->nama_lengkap;
        }
        return 'Unknown';
    }

    /**
     * Check if has PDF
     */
    public function hasPdf()
    {
        return !empty($this->pdf_path) && \Storage::disk('public')->exists($this->pdf_path);
    }

    /**
     * Get PDF URL accessor
     */
    public function getPdfUrlAttribute()
    {
        if (!$this->hasPdf()) {
            return null;
        }
        
        return \Storage::disk('public')->url($this->pdf_path);
    }

    /**
     * Get final status label
     */
    public function getFinalStatusLabelAttribute()
    {
        return match($this->final_status) {
            'pending' => 'Menunggu Verifikasi BK',
            'in_progress' => 'Menunggu Upload Bukti',
            'completed' => 'Bukti Sedang Direview',
            'verified' => 'Selesai & Terverifikasi',
            'overdue' => 'Terlambat!',
            default => 'Unknown',
        };
    }

    /**
     * Get final status badge color
     */
    public function getFinalStatusBadgeColorAttribute()
    {
        return match($this->final_status) {
            'pending' => 'yellow',
            'in_progress' => 'blue',
            'completed' => 'purple',
            'verified' => 'green',
            'overdue' => 'red',
            default => 'gray',
        };
    }

    /**
     * Get sisa hari deadline
     */
    public function getSisaHariDeadlineAttribute()
    {
        if (!$this->tanggal_batas_pelaksanaan) {
            return null;
        }

        $now = \Carbon\Carbon::now()->startOfDay();
        $deadline = \Carbon\Carbon::parse($this->tanggal_batas_pelaksanaan)->startOfDay();
        
        return $now->diffInDays($deadline, false); // false = bisa negatif
    }

    /**
     * Check apakah sudah melewati deadline
     */
    public function checkOverdue()
    {
        if (!$this->tanggal_batas_pelaksanaan) {
            return false;
        }

        $now = \Carbon\Carbon::now()->startOfDay();
        $deadline = \Carbon\Carbon::parse($this->tanggal_batas_pelaksanaan)->startOfDay();
        
        return $now->gt($deadline) && !$this->has_bukti;
    }

    /**
     * Update status terlambat (auto-check)
     */
    public function updateOverdueStatus()
    {
        $isOverdue = $this->checkOverdue();
        
        if ($isOverdue && !$this->is_terlambat) {
            $this->update([
                'is_terlambat' => true,
                'final_status' => 'overdue',
            ]);
        }
    }

    // ══════════════════════════════════════════════════════════
    // METHODS
    // ══════════════════════════════════════════════════════════

    /**
     * Check if can be edited
     */
    public function canEdit()
    {
        return in_array($this->status, ['pending', 'diproses']);
    }

    /**
     * Check if can be completed
     */
    public function canComplete()
    {
        return in_array($this->status, ['pending', 'diproses']) 
            && !empty($this->catatan_bk);
    }

    /**
     * Mark as diproses
     */
    public function markAsProcessing()
    {
        $this->update(['status' => 'diproses']);
    }

    /**
     * Mark as selesai (dengan deadline & kesepakatan)
     */
    public function markAsCompleted($validatorId, $pdfPath = null, $deadline = null, $kesepakatan = null)
    {
        $this->update([
            'status' => 'selesai',
            'tanggal_selesai' => now(),
            'validated_by' => $validatorId,
            'pdf_path' => $pdfPath,
            'tanggal_batas_pelaksanaan' => $deadline,
            'kesepakatan_keterlambatan' => $kesepakatan,
            'final_status' => 'in_progress', // Menunggu upload bukti dari santri
        ]);
    }
}