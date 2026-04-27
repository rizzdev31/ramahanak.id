<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VariabelAutoUpdateLog extends Model
{
    protected $table = 'variabel_auto_update_log';

    protected $fillable = [
        'variabel_type',
        'variabel_kode',
        'field_updated',
        'old_value',
        'new_value',
        'update_reason',
        'source_knowledge_id',
        'triggered_by_hasil_id',
        'requires_approval',
        'approval_status',
        'approved_by',
        'approved_at',
        'can_rollback',
        'rolled_back',
        'rollback_by',
        'rollback_at',
        'rollback_reason',
    ];

    protected $casts = [
        'requires_approval' => 'boolean',
        'can_rollback' => 'boolean',
        'rolled_back' => 'boolean',
        'approved_at' => 'datetime',
        'rollback_at' => 'datetime',
    ];

    // ══════════════════════════════════════════════════════════
    // RELATIONSHIPS
    // ══════════════════════════════════════════════════════════

    public function sourceKnowledge()
    {
        return $this->belongsTo(LearningKnowledgeBase::class, 'source_knowledge_id');
    }

    public function triggeredByHasil()
    {
        return $this->belongsTo(HasilPreprocessing::class, 'triggered_by_hasil_id');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function rollbackUser()
    {
        return $this->belongsTo(User::class, 'rollback_by');
    }

    // ══════════════════════════════════════════════════════════
    // SCOPES
    // ══════════════════════════════════════════════════════════

    public function scopeForVariabel($query, $type, $kode)
    {
        return $query->where('variabel_type', $type)
                    ->where('variabel_kode', $kode);
    }

    public function scopeNotRolledBack($query)
    {
        return $query->where('rolled_back', false);
    }

    public function scopeCanBeRolledBack($query)
    {
        return $query->where('can_rollback', true)
                    ->where('rolled_back', false);
    }

    // ══════════════════════════════════════════════════════════
    // ROLLBACK FUNCTIONALITY
    // ══════════════════════════════════════════════════════════

    public function performRollback($userId, $reason = null)
    {
        if (!$this->can_rollback || $this->rolled_back) {
            return false;
        }

        // Rollback to old value
        $model = $this->getVariabelModel();
        
        if ($model) {
            $model->update([
                $this->field_updated => $this->old_value
            ]);
        }

        // Mark as rolled back
        $this->update([
            'rolled_back' => true,
            'rollback_by' => $userId,
            'rollback_at' => now(),
            'rollback_reason' => $reason,
        ]);

        return true;
    }

    private function getVariabelModel()
    {
        $modelClass = match($this->variabel_type) {
            'pelanggaran' => VariabelPelanggaran::class,
            'apresiasi' => VariabelApresiasi::class,
            'konselor' => VariabelKonselor::class,
            default => null,
        };

        if (!$modelClass) {
            return null;
        }

        return $modelClass::where('kode', $this->variabel_kode)->first();
    }
}