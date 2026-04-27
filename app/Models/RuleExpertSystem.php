<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RuleExpertSystem extends Model
{
    protected $table = 'rules_expert_system';

    protected $fillable = [
        'kode_rule',
        'kategori',
        'premise',
        'conclusion',
    ];

    protected $casts = [
        'premise' => 'array',  // Otomatis convert JSON <-> Array
    ];

    // Relasi ke VariabelDiagnosis
    public function diagnosis()
    {
        return $this->belongsTo(VariabelDiagnosis::class, 'conclusion', 'kode');
    }

    // Helper: Get premise sebagai string untuk display
    public function getPremiseStringAttribute()
    {
        return implode(' AND ', $this->premise);
    }

    // Helper: Get premise yang sudah disort (untuk validasi duplikasi)
    public function getSortedPremiseAttribute()
    {
        $sorted = $this->premise;
        sort($sorted);
        return $sorted;
    }
}