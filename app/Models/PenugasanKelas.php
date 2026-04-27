<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PenugasanKelas extends Model
{
    protected $table = 'penugasan_kelas';

    protected $fillable = [
        'user_id',
        'kelas_id',
        'jenis_penugasan',
        'is_active', // ✅ boolean
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // ✅ SCOPES - Aligned with existing PenugasanKelasController
    
    /**
     * Scope to get only active assignments
     * ✅ ALIGNED: Use is_active = 1 (same as controller)
     */
    public function scopeAktif($query)
    {
        return $query->where('is_active', 1);
    }

    /**
     * Scope to get inactive assignments
     */
    public function scopeNonAktif($query)
    {
        return $query->where('is_active', 0);
    }

    /**
     * Scope to get assignments for specific user
     */
    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope to get assignments for specific kelas
     */
    public function scopeForKelas($query, $kelasId)
    {
        return $query->where('kelas_id', $kelasId);
    }

    /**
     * Scope for wali_kelas only
     */
    public function scopeWaliKelas($query)
    {
        return $query->where('jenis_penugasan', 'wali_kelas');
    }

    /**
     * Scope for wali_asrama only
     */
    public function scopeWaliAsrama($query)
    {
        return $query->where('jenis_penugasan', 'wali_asrama');
    }

    // ✅ RELATIONSHIPS

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function kelas(): BelongsTo
    {
        return $this->belongsTo(Kelas::class);
    }

    // ✅ HELPER METHODS

    /**
     * Check if assignment is active
     */
    public function isAktif(): bool
    {
        return $this->is_active == 1;
    }

    /**
     * Activate this assignment
     */
    public function activate(): void
    {
        $this->update(['is_active' => 1]);
    }

    /**
     * Deactivate this assignment
     */
    public function deactivate(): void
    {
        $this->update(['is_active' => 0]);
    }

    /**
     * Deactivate other assignments for same kelas & jenis
     * Use when replacing wali
     */
    public function deactivateOthersForKelas(): void
    {
        self::where('kelas_id', $this->kelas_id)
            ->where('jenis_penugasan', $this->jenis_penugasan)
            ->where('id', '!=', $this->id)
            ->where('is_active', 1)
            ->update(['is_active' => 0]);
    }

    // ✅ STATIC METHODS

    /**
     * Get active wali for a kelas
     */
    public static function getActiveWaliForKelas($kelasId, $jenis = null)
    {
        $query = self::aktif()->forKelas($kelasId)->with('user');
        
        if ($jenis) {
            $query->where('jenis_penugasan', $jenis);
        }
        
        return $query->get();
    }

    /**
     * Check if user has active assignment
     */
    public static function userHasActiveAssignment($userId): bool
    {
        return self::aktif()
            ->forUser($userId)
            ->exists();
    }

    /**
     * Check if user is wali_kelas (anywhere)
     */
    public static function userIsWaliKelas($userId): bool
    {
        return self::aktif()
            ->forUser($userId)
            ->waliKelas()
            ->exists();
    }
}