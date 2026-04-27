<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RiwayatSantri extends Model
{
    use HasFactory;

    protected $table = 'riwayat_santri';

    protected $fillable = [
        'santri_id',
        'laporan_pelanggaran_id',
        'laporan_apresiasi_id',
        'laporan_konselor_id',
        'jenis_laporan',
        'kode',
        'bobot_poin',
        'tanggal_kejadian',
        'status',
        'ringkasan',
    ];

    protected $casts = [
        'tanggal_kejadian' => 'date',
        'bobot_poin' => 'integer',
    ];

    // ═══════════════════════════════════════════════════════════
    // RELATIONSHIPS
    // ═══════════════════════════════════════════════════════════

    /**
     * Santri pemilik riwayat
     */
    public function santri()
    {
        return $this->belongsTo(User::class, 'santri_id');
    }

    /**
     * Laporan pelanggaran (jika ada)
     */
    public function laporanPelanggaran()
    {
        return $this->belongsTo(LaporanPelanggaran::class, 'laporan_pelanggaran_id');
    }

    /**
     * Laporan apresiasi (jika ada)
     */
    public function laporanApresiasi()
    {
        return $this->belongsTo(LaporanApresiasi::class, 'laporan_apresiasi_id');
    }

    /**
     * Laporan konselor (jika ada)
     */
    public function laporanKonselor()
    {
        return $this->belongsTo(LaporanKonselor::class, 'laporan_konselor_id');
    }

    /**
     * Get laporan terkait (polymorphic-like)
     */
    public function getLaporanAttribute()
    {
        return match($this->jenis_laporan) {
            'pelanggaran' => $this->laporanPelanggaran,
            'apresiasi' => $this->laporanApresiasi,
            'konselor' => $this->laporanKonselor,
            default => null,
        };
    }

    // ═══════════════════════════════════════════════════════════
    // SCOPES
    // ═══════════════════════════════════════════════════════════

    /**
     * Scope untuk santri tertentu
     */
    public function scopeBySantri($query, $santriId)
    {
        return $query->where('santri_id', $santriId);
    }

    /**
     * Scope untuk jenis laporan
     */
    public function scopeByJenis($query, $jenis)
    {
        return $query->where('jenis_laporan', $jenis);
    }

    /**
     * Scope untuk pelanggaran saja
     */
    public function scopePelanggaran($query)
    {
        return $query->where('jenis_laporan', 'pelanggaran');
    }

    /**
     * Scope untuk apresiasi saja
     */
    public function scopeApresiasi($query)
    {
        return $query->where('jenis_laporan', 'apresiasi');
    }

    /**
     * Scope untuk konselor saja
     */
    public function scopeKonselor($query)
    {
        return $query->where('jenis_laporan', 'konselor');
    }

    // ═══════════════════════════════════════════════════════════
    // STATIC METHODS (For Expert System)
    // ═══════════════════════════════════════════════════════════

    /**
     * Hitung total poin pelanggaran santri
     */
    public static function getTotalPoinPelanggaran($santriId)
    {
        return self::where('santri_id', $santriId)
                   ->where('jenis_laporan', 'pelanggaran')
                   ->sum('bobot_poin');
    }

    /**
     * Hitung total poin apresiasi santri
     */
    public static function getTotalPoinApresiasi($santriId)
    {
        return self::where('santri_id', $santriId)
                   ->where('jenis_laporan', 'apresiasi')
                   ->sum('bobot_poin');
    }

    /**
     * Get riwayat santri dengan filter
     */
    public static function getRiwayatSantri($santriId, $jenis = null, $limit = null)
    {
        $query = self::where('santri_id', $santriId)
                     ->orderBy('tanggal_kejadian', 'desc');

        if ($jenis) {
            $query->where('jenis_laporan', $jenis);
        }

        if ($limit) {
            $query->limit($limit);
        }

        return $query->get();
    }

    // ═══════════════════════════════════════════════════════════
    // ACCESSORS
    // ═══════════════════════════════════════════════════════════

    /**
     * Get badge color by jenis
     */
    public function getJenisBadgeAttribute()
    {
        return match($this->jenis_laporan) {
            'pelanggaran' => 'red',
            'apresiasi' => 'green',
            'konselor' => 'blue',
            default => 'gray',
        };
    }

    /**
     * Get jenis label
     */
    public function getJenisLabelAttribute()
    {
        return match($this->jenis_laporan) {
            'pelanggaran' => 'Pelanggaran',
            'apresiasi' => 'Apresiasi',
            'konselor' => 'Konselor',
            default => $this->jenis_laporan,
        };
    }
}