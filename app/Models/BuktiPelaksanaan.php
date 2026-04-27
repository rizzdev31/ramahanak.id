<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class BuktiPelaksanaan extends Model
{
    use HasFactory;

    protected $table = 'bukti_pelaksanaan';

    protected $fillable = [
        'bukti_able_type',
        'bukti_able_id',
        'file_path',
        'file_name',
        'file_type',
        'file_size',
        'keterangan',
        'uploaded_by',
        'uploaded_at',
        'status',
        'catatan_review',
        'reviewed_by',
        'reviewed_at',
    ];

    protected $casts = [
        'uploaded_at' => 'datetime',
        'reviewed_at' => 'datetime',
    ];

    // ═══════════════════════════════════════════════════════════
    // RELATIONSHIPS
    // ═══════════════════════════════════════════════════════════

    /**
     * Get the parent bukti_able model (polymorphic).
     * Bisa: LaporanExpertSystemPoint, LaporanKonselor, dll
     */
    public function buktiAble()
    {
        return $this->morphTo();
    }

    /**
     * User yang upload (santri)
     */
    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    /**
     * User yang review (BK)
     */
    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    // ═══════════════════════════════════════════════════════════
    // ACCESSORS
    // ═══════════════════════════════════════════════════════════

    /**
     * Get full URL of the file
     */
    public function getFileUrlAttribute()
    {
        return Storage::url($this->file_path);
    }

    /**
     * Get file size in human readable format
     */
    public function getFileSizeHumanAttribute()
    {
        $bytes = $this->file_size;
        
        if ($bytes >= 1073741824) {
            return number_format($bytes / 1073741824, 2) . ' GB';
        } elseif ($bytes >= 1048576) {
            return number_format($bytes / 1048576, 2) . ' MB';
        } elseif ($bytes >= 1024) {
            return number_format($bytes / 1024, 2) . ' KB';
        } else {
            return $bytes . ' bytes';
        }
    }

    /**
     * Check if file is an image
     */
    public function getIsImageAttribute()
    {
        return in_array($this->file_type, ['image/jpeg', 'image/jpg', 'image/png']);
    }

    /**
     * Check if file is a PDF
     */
    public function getIsPdfAttribute()
    {
        return $this->file_type === 'application/pdf';
    }

    /**
     * Get status label in Bahasa Indonesia
     */
    public function getStatusLabelAttribute()
    {
        return match($this->status) {
            'pending' => 'Menunggu Review BK',
            'approved' => 'Disetujui',
            'rejected' => 'Ditolak',
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
            'approved' => 'green',
            'rejected' => 'red',
            default => 'gray',
        };
    }

    // ═══════════════════════════════════════════════════════════
    // METHODS
    // ═══════════════════════════════════════════════════════════

    /**
     * Approve bukti
     */
    public function approve($reviewerId, $catatan = null)
    {
        $this->update([
            'status' => 'approved',
            'reviewed_by' => $reviewerId,
            'reviewed_at' => now(),
            'catatan_review' => $catatan,
        ]);

        return $this;
    }

    /**
     * Reject bukti
     */
    public function reject($reviewerId, $catatan)
    {
        $this->update([
            'status' => 'rejected',
            'reviewed_by' => $reviewerId,
            'reviewed_at' => now(),
            'catatan_review' => $catatan,
        ]);

        return $this;
    }

    /**
     * Check if bukti can be deleted by uploader
     * (Hanya bisa dihapus jika belum direview)
     */
    public function canBeDeletedByUploader()
    {
        return $this->status === 'pending';
    }

    /**
     * Delete file from storage and database
     */
    public function deleteFile()
    {
        // Delete from storage
        if (Storage::disk('public')->exists($this->file_path)) {
            Storage::disk('public')->delete($this->file_path);
        }

        // Delete from database
        return $this->delete();
    }

    // ═══════════════════════════════════════════════════════════
    // SCOPES
    // ═══════════════════════════════════════════════════════════

    /**
     * Scope: Only pending bukti
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope: Only approved bukti
     */
    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    /**
     * Scope: Only rejected bukti
     */
    public function scopeRejected($query)
    {
        return $query->where('status', 'rejected');
    }

    /**
     * Scope: For specific user (uploader)
     */
    public function scopeByUploader($query, $userId)
    {
        return $query->where('uploaded_by', $userId);
    }
}