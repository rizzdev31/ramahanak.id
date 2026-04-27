<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Storage; // Pastikan ini di-import
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        $user = $request->user()->load(['santriProfile', 'guruBkProfile', 'tenagaPendidikProfile']);

        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => session('status'),
            'userProfile' => $user,
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $user = $request->user();
        
        // 1. Validasi & Update data akun utama (Tabel Users)
        $user->fill($request->validated());
        if ($user->isDirty('username')) {
            $user->email_verified_at = null;
        }
        $user->save();

        // ✅ LANGKAH 2: Tentukan relasi profil berdasarkan role (DIPINDAHKAN KE AWAL)
        $profileRelation = match($user->role) {
            'guru_bk' => $user->guruBkProfile(),
            'santri' => $user->santriProfile(),
            'tenaga_pendidik' => $user->tenagaPendidikProfile(),
            default => null,
        };

        // ✅ LANGKAH 3: Hanya proses profil jika relasi ditemukan
        if ($profileRelation) {
            // Ambil data input yang sesuai dengan kolom di tabel profil
            $profileData = $request->only([
                'nama_lengkap', 'nama_panggilan', 'tempat_lahir', 'tanggal_lahir', 
                'jenis_kelamin', 'no_whatsapp', 'jabatan', 'nama_wali', 'kelas', 'alamat'
            ]);


         // ✅ LANGKAH 4: Upload foto (jika ada file)
            if ($request->hasFile('foto')) {
                // Ambil profil yang sudah ada untuk cek foto lama
                $existingProfile = $profileRelation->first();
                
                // Hapus foto lama jika ada
                if ($existingProfile && $existingProfile->foto) {
                    Storage::disk('public')->delete($existingProfile->foto);
                }

                // Upload foto baru
                $path = $request->file('foto')->store('uploads/profile', 'public');
                $profileData['foto'] = $path;
            }

            // ✅ LANGKAH 5: Simpan/Update ke tabel profil terkait
            $profileRelation->updateOrCreate(
                ['user_id' => $user->id], 
                $profileData
            );
        }

        return Redirect::route('profile.edit')->with('status', 'profile-updated');
    }

    
    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }
}