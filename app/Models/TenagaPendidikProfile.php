<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TenagaPendidikProfile extends Model
{
    protected $fillable = [
        'user_id', 'nip', 'nama_lengkap', 'nama_panggilan', 
        'tempat_lahir', 'tanggal_lahir', 'jenis_kelamin', 
        'jabatan', 'foto', 'no_whatsapp'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}