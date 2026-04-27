<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable, SoftDeletes;

    protected $fillable = ['username', 'email', 'password', 'role', 'status'];

    protected $hidden = ['password', 'remember_token'];

    protected $appends = ['profile'];

    // ── Profil per role ──────────────────────────────────────
    public function guruBkProfile()
    {
        return $this->hasOne(GuruBkProfile::class);
    }

    public function tenagaPendidikProfile()
    {
        return $this->hasOne(TenagaPendidikProfile::class);
    }

    public function santriProfile()
    {
        return $this->hasOne(SantriProfile::class);
    }

    // ── Accessor: ambil profil sesuai role ───────────────────
    public function getProfileAttribute()
    {
        return $this->guruBkProfile
            ?? $this->santriProfile
            ?? $this->tenagaPendidikProfile;
    }

    // ── Penugasan kelas (untuk tendik & guru_bk) ─────────────
    public function penugasanKelas()
    {
        return $this->hasMany(PenugasanKelas::class);
    }

    // ✅ Relasi hanya yang aktif — dipakai di controller & dashboard
    public function penugasanKelasAktif()
    {
        return $this->hasMany(PenugasanKelas::class)->where('is_active', 1);
    }

    // ── Riwayat kelas (untuk santri) ─────────────────────────
    public function riwayatKelas()
    {
        return $this->hasMany(RiwayatKelasSantri::class);
    }

    // ═══════════════════════════════════════════════════════════
    // ✅ BARU: AUTO-DETECT LEMBAGA BERDASARKAN TINGKAT KELAS
    // ═══════════════════════════════════════════════════════════
    
    /**
     * Get lembaga name based on kelas tingkat
     * Tingkat 7-9 = SMP, Tingkat 10-12 = MA
     */
    public function getLembagaAttribute()
    {
        // Jika bukan santri, return default
        if ($this->role !== 'santri' || !$this->santriProfile) {
            return 'SMP Muhammadiyah 9 Boarding School Tanggulangan';
        }

        // Ambil kelas dari santri profile
        $kelas = $this->santriProfile->kelas;
        
        // Jika tidak ada kelas, return default
        if (!$kelas) {
            return 'SMP Muhammadiyah 9 Boarding School Tanggulangan';
        }

        // Auto-detect berdasarkan tingkat
        $tingkat = $kelas->tingkat;
        
        if (in_array($tingkat, [7, 8, 9])) {
            return 'SMP Muhammadiyah 9 Boarding School Tanggulangan';
        }
        
        return 'MA Entrepreneur Muhammadiyah An Nur Sidoarjo';
    }

    // ═══════════════════════════════════════════════════════════
    // ✅ BARU: RELASI KE BUKTI PELAKSANAAN
    // ═══════════════════════════════════════════════════════════

    /**
     * Bukti yang diupload oleh user ini (sebagai uploader)
     */
    public function buktiUploads()
    {
        return $this->hasMany(BuktiPelaksanaan::class, 'uploaded_by');
    }

    /**
     * Bukti yang direview oleh user ini (sebagai reviewer/BK)
     */
    public function buktiReviews()
    {
        return $this->hasMany(BuktiPelaksanaan::class, 'reviewed_by');
    }
}