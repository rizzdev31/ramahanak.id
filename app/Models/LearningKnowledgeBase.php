<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LearningKnowledgeBase extends Model
{
    protected $table = 'learning_knowledge_base';

    protected $fillable = [
        'hasil_preprocessing_id',
        'laporan_text',
        'extracted_keywords',
        'learned_for_kode',
        'learned_for_type',
        'learning_type',
        'original_kode_matched',
        'corrected_kode_matched',
        'confidence_score',
        'validation_status',
        'applied_to_variabel',
        'application_timestamp',
        'application_notes',
        'success_count',
        'fail_count',
        'accuracy',
        'created_by',
        'validated_by',
        'validated_at',
    ];

    protected $casts = [
        'extracted_keywords' => 'array',
        'original_kode_matched' => 'array',
        'corrected_kode_matched' => 'array',
        'confidence_score' => 'decimal:2',
        'applied_to_variabel' => 'boolean',
        'application_timestamp' => 'datetime',
        'success_count' => 'integer',
        'fail_count' => 'integer',
        'accuracy' => 'decimal:2',
        'validated_at' => 'datetime',
    ];

    // ══════════════════════════════════════════════════════════
    // RELATIONSHIPS
    // ══════════════════════════════════════════════════════════

    public function hasilPreprocessing()
    {
        return $this->belongsTo(HasilPreprocessing::class, 'hasil_preprocessing_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function validator()
    {
        return $this->belongsTo(User::class, 'validated_by');
    }

    public function autoUpdateLogs()
    {
        return $this->hasMany(VariabelAutoUpdateLog::class, 'source_knowledge_id');
    }

    // ══════════════════════════════════════════════════════════
    // SCOPES
    // ══════════════════════════════════════════════════════════

    public function scopeForKode($query, $kode)
    {
        return $query->where('learned_for_kode', $kode);
    }

    public function scopeForType($query, $type)
    {
        return $query->where('learned_for_type', $type);
    }

    public function scopeValidated($query)
    {
        return $query->where('validation_status', 'validated');
    }

    public function scopeApplied($query)
    {
        return $query->where('applied_to_variabel', true);
    }

    // ══════════════════════════════════════════════════════════
    // HELPERS
    // ══════════════════════════════════════════════════════════

    public function isApplied()
    {
        return $this->applied_to_variabel === true;
    }

    public function calculateAccuracy()
    {
        $total = $this->success_count + $this->fail_count;
        
        if ($total === 0) {
            return 0.00;
        }
        
        return round(($this->success_count / $total) * 100, 2);
    }

    public function incrementSuccess()
    {
        $this->increment('success_count');
        $this->update(['accuracy' => $this->calculateAccuracy()]);
    }

    public function incrementFail()
    {
        $this->increment('fail_count');
        $this->update(['accuracy' => $this->calculateAccuracy()]);
    }
}