<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VariabelDiagnosis extends Model
{
    protected $table = 'variabel_diagnosis';

    protected $fillable = [
        'kode',
        'diagnosis',
        'penjelasan',
        'rekomendasi',
    ];
}