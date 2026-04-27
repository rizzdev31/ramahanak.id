<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Kelas extends Model
{
    use HasFactory;

    protected $table = 'kelas';

    protected $fillable = [
        'kode_kelas',
        'nama',
        'tingkat',
        'tahun_ajaran',
        'kapasitas',
        'status',
    ];

    protected $casts = [
        'tingkat' => 'integer',
        'kapasitas' => 'integer',
    ];

    // =============================================
    // RELASI
    // =============================================

    /**
     * Santri yang ada di kelas ini saat ini
     * Relasi: One-to-Many (1 kelas punya banyak santri)
     */
    public function santri()
    {
        return $this->hasMany(SantriProfile::class, 'kelas_id');
    }

    /**
     * Wali Kelas (hanya 1 user per kelas)
     * Relasi: Many-to-Many dengan filter jenis_penugasan
     */
    public function waliKelas()
    {
        return $this->belongsToMany(User::class, 'penugasan_kelas')
                    ->wherePivot('jenis_penugasan', 'wali_kelas')
                    ->wherePivot('is_active', 1)
                    ->withPivot('jenis_penugasan', 'is_active', 'created_at');
    }

    /**
     * Wali Asrama (bisa banyak user per kelas)
     * Relasi: Many-to-Many dengan filter jenis_penugasan
     */
    public function waliAsrama()
    {
        return $this->belongsToMany(User::class, 'penugasan_kelas')
                    ->wherePivot('jenis_penugasan', 'wali_asrama')
                    ->wherePivot('is_active', 1)
                    ->withPivot('jenis_penugasan', 'is_active', 'created_at');
    }

    /**
     * Semua penugasan (wali kelas + wali asrama)
     */
    public function penugasan()
    {
        return $this->hasMany(PenugasanKelas::class);
    }

    /**
     * Penugasan aktif saja
     */
    public function penugasanAktif()
    {
        return $this->hasMany(PenugasanKelas::class)->where('is_active', 1);
    }

    /**
     * Riwayat santri yang pernah di kelas ini
     */
    public function riwayatSantri()
    {
        return $this->hasMany(RiwayatKelasSantri::class);
    }

    // =============================================
    // ACCESSOR & HELPER METHODS
    // =============================================

    /**
     * Nama lengkap kelas (contoh: "7A - Al Farabi")
     */
    public function getNamaLengkapAttribute()
    {
        return "{$this->kode_kelas} - {$this->nama}";
    }

    /**
     * Jumlah santri di kelas ini
     */
    public function getJumlahSantriAttribute()
    {
        return $this->santri()->count();
    }

    /**
     * Sisa kapasitas kelas
     */
    public function getSisaKapasitasAttribute()
    {
        if (!$this->kapasitas) {
            return null;
        }
        return $this->kapasitas - $this->jumlah_santri;
    }

    /**
     * Apakah kelas sudah penuh?
     */
    public function isPenuh()
    {
        if (!$this->kapasitas) {
            return false;
        }
        return $this->jumlah_santri >= $this->kapasitas;
    }

    /**
     * Apakah kelas ini adalah kelas PENDING?
     */
    public function isPending()
    {
        return $this->kode_kelas === 'PENDING';
    }

    // =============================================
    // SCOPE QUERIES
    // =============================================

    /**
     * Scope: Hanya kelas aktif
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope: Filter by tingkat
     */
    public function scopeTingkat($query, $tingkat)
    {
        return $query->where('tingkat', $tingkat);
    }

    /**
     * Scope: Filter by tahun ajaran
     */
    public function scopeTahunAjaran($query, $tahunAjaran)
    {
        return $query->where('tahun_ajaran', $tahunAjaran);
    }
}