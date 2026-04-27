<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LaporanAwal extends Model
{
    use HasFactory;

    protected $table = 'laporan_awal';

    protected $fillable = [
        'pelapor_id',
        'text_laporan',
        'jenis_laporan',
        'tahun_ajaran',
        'tanggal_kejadian',
        'waktu_kejadian',
        'lokasi_kejadian',
        'status',
        'validated_by',
        'validated_at',
        'catatan_validasi',
    ];

    protected $casts = [
        'tanggal_kejadian' => 'date',
        'validated_at' => 'datetime',
        'status' => 'string',
    ];

    /**
     * Relasi ke User (Pelapor)
     */
    public function pelapor()
    {
        return $this->belongsTo(User::class, 'pelapor_id');
    }

    /**
     * Relasi ke User (Validator BK)
     */
    public function validator()
    {
        return $this->belongsTo(User::class, 'validated_by');
    }

    /**
     * Scope untuk filter status
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopeRejected($query)
    {
        return $query->where('status', 'rejected');
    }

    /**
     * Scope untuk filter tahun ajaran
     */
    public function scopeTahunAjaran($query, $tahunAjaran)
    {
        return $query->where('tahun_ajaran', $tahunAjaran);
    }

    /**
     * Scope untuk filter jenis laporan
     */
    public function scopeJenis($query, $jenis)
    {
        return $query->where('jenis_laporan', $jenis);
    }

    /**
     * Get badge color based on status
     */
    public function getStatusBadgeColorAttribute()
    {
        return match($this->status) {
            'pending' => 'yellow',
            'approved' => 'green',
            'rejected' => 'red',
            'processed' => 'blue',  // ✅ TAMBAH INI!
            default => 'gray',
        };
    }

    /**
     * Get status label in Indonesian
     */
    public function getStatusLabelAttribute()
    {
        return match($this->status) {
            'pending' => 'Menunggu Validasi',
            'approved' => 'Disetujui',
            'rejected' => 'Ditolak',
            'processed' => 'Sudah Diproses',  // ✅ TAMBAH INI!
            default => 'Unknown',
        };
    }

    /**
     * Get jenis laporan label in Indonesian
     */
    public function getJenisLaporanLabelAttribute()
    {
        return match($this->jenis_laporan) {
            'pelanggaran' => 'Pelanggaran',
            'apresiasi' => 'Apresiasi',
            'kondisi_mental' => 'Kondisi Mental',
            'lainnya' => 'Lainnya',
            default => 'Unknown',
        };
    }

    /**
     * Get jenis badge color
     */
    public function getJenisBadgeColorAttribute()
    {
        return match($this->jenis_laporan) {
            'pelanggaran' => 'red',
            'apresiasi' => 'green',
            'kondisi_mental' => 'purple',
            'lainnya' => 'gray',
            default => 'gray',
        };
    }
}