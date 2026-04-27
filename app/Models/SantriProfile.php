<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SantriProfile extends Model
{
    protected $fillable = [
        'user_id',
        'nisn',
        'nama_lengkap',
        'nama_panggilan',
        'nama_wali',
        'kelas_id',    // ✅ FK ke tabel kelas (wajib ada)
        'kelas',       // kolom lama (string) — biarkan untuk backward compat
        'tempat_lahir',
        'tanggal_lahir',
        'alamat',
        'jenis_kelamin',
        'foto',
        'no_whatsapp',
    ];

    // ── Relasi ke User ───────────────────────────────────────
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // ✅ Relasi ke Kelas (dipakai di dashboard, KelasController, DashboardController)
    public function kelas()
    {
        return $this->belongsTo(Kelas::class);
    }
}