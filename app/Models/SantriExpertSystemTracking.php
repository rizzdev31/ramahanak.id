<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SantriExpertSystemTracking extends Model
{
    use HasFactory;

    protected $table = 'santri_expert_system_tracking';

    protected $fillable = [
        'santri_id',
        'total_poin_pelanggaran',
        'total_poin_apresiasi',
        'konsekuensi_diberikan',
        'reward_diberikan',
        'last_check_konsekuensi',
        'last_check_reward',
    ];

    protected $casts = [
        'konsekuensi_diberikan' => 'array',
        'reward_diberikan' => 'array',
        'last_check_konsekuensi' => 'datetime',
        'last_check_reward' => 'datetime',
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

    // ══════════════════════════════════════════════════════════
    // METHODS - POIN MANAGEMENT
    // ══════════════════════════════════════════════════════════

    /**
     * Update total poin pelanggaran
     */
    public function updatePoinPelanggaran($totalPoin)
    {
        $this->update([
            'total_poin_pelanggaran' => $totalPoin,
            'last_check_konsekuensi' => now(),
        ]);
    }

    /**
     * Update total poin apresiasi
     */
    public function updatePoinApresiasi($totalPoin)
    {
        $this->update([
            'total_poin_apresiasi' => $totalPoin,
            'last_check_reward' => now(),
        ]);
    }

    // ══════════════════════════════════════════════════════════
    // METHODS - KONSEKUENSI TRACKING
    // ══════════════════════════════════════════════════════════

    /**
     * Check if konsekuensi sudah diberikan
     */
    public function hasKonsekuensi($kode)
    {
        return in_array($kode, $this->konsekuensi_diberikan ?? []);
    }

    /**
     * Add konsekuensi yang sudah diberikan
     */
    public function addKonsekuensi($kode)
    {
        $konsekuensi = $this->konsekuensi_diberikan ?? [];
        
        if (!in_array($kode, $konsekuensi)) {
            $konsekuensi[] = $kode;
            $this->update(['konsekuensi_diberikan' => $konsekuensi]);
        }
    }

    /**
     * Get konsekuensi yang belum diberikan berdasarkan poin saat ini
     */
    public function getNewKonsekuensi()
    {
        $variabelKonsekuensi = \App\Models\VariabelKonsekuensi::where('is_active', true)
            ->where('poin', '<=', $this->total_poin_pelanggaran)
            ->orderBy('poin', 'asc')
            ->get();

        $newKonsekuensi = [];
        foreach ($variabelKonsekuensi as $variabel) {
            if (!$this->hasKonsekuensi($variabel->kode)) {
                $newKonsekuensi[] = $variabel;
            }
        }

        return collect($newKonsekuensi);
    }

    // ══════════════════════════════════════════════════════════
    // METHODS - REWARD TRACKING
    // ══════════════════════════════════════════════════════════

    /**
     * Check if reward sudah diberikan
     */
    public function hasReward($kode)
    {
        return in_array($kode, $this->reward_diberikan ?? []);
    }

    /**
     * Add reward yang sudah diberikan
     */
    public function addReward($kode)
    {
        $reward = $this->reward_diberikan ?? [];
        
        if (!in_array($kode, $reward)) {
            $reward[] = $kode;
            $this->update(['reward_diberikan' => $reward]);
        }
    }

    /**
     * Get reward yang belum diberikan berdasarkan poin saat ini
     */
    public function getNewReward()
    {
        $variabelReward = \App\Models\VariabelReward::where('is_active', true)
            ->where('poin', '<=', $this->total_poin_apresiasi)
            ->orderBy('poin', 'asc')
            ->get();

        $newReward = [];
        foreach ($variabelReward as $variabel) {
            if (!$this->hasReward($variabel->kode)) {
                $newReward[] = $variabel;
            }
        }

        return collect($newReward);
    }

    // ══════════════════════════════════════════════════════════
    // STATIC METHODS
    // ══════════════════════════════════════════════════════════

    /**
     * Get or create tracking for santri
     */
    public static function getOrCreate($santriId)
    {
        return static::firstOrCreate(
            ['santri_id' => $santriId],
            [
                'total_poin_pelanggaran' => 0,
                'total_poin_apresiasi' => 0,
                'konsekuensi_diberikan' => [],
                'reward_diberikan' => [],
            ]
        );
    }
}