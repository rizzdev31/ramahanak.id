<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Kelas;
use App\Models\RiwayatKelasSantri;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class UserController extends Controller
{
    /**
     * Display a listing of users
     */
    public function index(Request $request)
    {
        try {
            $query = User::query()->with([
                'santriProfile.kelas',
                'guruBkProfile',
                'tenagaPendidikProfile',
                'penugasanKelasAktif.kelas',
            ]);

            // Filter by role
            if ($request->filled('role')) {
                $query->where('role', $request->role);
            }

            // Filter by status
            if ($request->filled('status')) {
                $query->where('status', $request->status);
            }

            // Search
            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('username', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%")
                      ->orWhereHas('santriProfile', fn($q) =>
                          $q->where('nama_lengkap', 'like', "%{$search}%")
                            ->orWhere('nisn', 'like', "%{$search}%")
                      )
                      ->orWhereHas('guruBkProfile', fn($q) =>
                          $q->where('nama_lengkap', 'like', "%{$search}%")
                            ->orWhere('nip', 'like', "%{$search}%")
                      )
                      ->orWhereHas('tenagaPendidikProfile', fn($q) =>
                          $q->where('nama_lengkap', 'like', "%{$search}%")
                            ->orWhere('nip', 'like', "%{$search}%")
                      );
                });
            }

            $users = $query->orderBy('status', 'asc')
                           ->latest()
                           ->paginate(10)
                           ->withQueryString();

            $kelas = Kelas::where('status', 'active')
                ->orderBy('tingkat')
                ->orderBy('kode_kelas')
                ->get(['id', 'kode_kelas', 'nama', 'tingkat']);

            return Inertia::render('Admin/ManageUser', [
                'users'   => $users,
                'kelas'   => $kelas,
                'filters' => $request->only(['role', 'status', 'search']),
            ]);

        } catch (\Exception $e) {
            Log::error('UserController@index', ['error' => $e->getMessage()]);
            return back()->withErrors(['error' => 'Gagal memuat data: ' . $e->getMessage()]);
        }
    }

    /**
     * Approve user (activate pending user)
     */
    public function approve($id)
    {
        try {
            $user = User::findOrFail($id);

            if ($user->status === 'active') {
                return back()->withErrors(['approve' => 'User sudah aktif!']);
            }

            DB::transaction(function () use ($user) {
                $user->update(['status' => 'active']);

                // For santri: ensure riwayat kelas aktif exists
                if ($user->role === 'santri' && $user->santriProfile) {
                    $kelas = Kelas::find($user->santriProfile->kelas_id);

                    if ($kelas) {
                        $sudahAda = RiwayatKelasSantri::where('user_id', $user->id)
                            ->where('is_active', 1)
                            ->exists();

                        if (!$sudahAda) {
                            RiwayatKelasSantri::create([
                                'user_id'       => $user->id,
                                'kelas_id'      => $kelas->id,
                                'tahun_ajaran'  => $kelas->tahun_ajaran,
                                'is_active'     => true,
                                'tanggal_masuk' => now(),
                                'keterangan'    => 'Santri baru di-approve oleh Guru BK.',
                            ]);
                        }
                    }
                }
            });

            return back()->with('message', 'User berhasil diaktifkan!');

        } catch (\Exception $e) {
            Log::error('UserController@approve', ['user_id' => $id, 'error' => $e->getMessage()]);
            return back()->withErrors(['approve' => 'Gagal approve: ' . $e->getMessage()]);
        }
    }

    /**
     * Toggle user status (active <-> unactive)
     */
    public function toggleStatus($id)
    {
        try {
            $user = User::findOrFail($id);

            if ($user->role === 'guru_bk') {
                return back()->withErrors(['toggle' => 'Status Guru BK tidak dapat diubah!']);
            }

            $newStatus = $user->status === 'active' ? 'unactive' : 'active';
            $user->update(['status' => $newStatus]);

            $pesan = $newStatus === 'active'
                ? 'User berhasil diaktifkan!'
                : 'User berhasil dinonaktifkan!';

            return back()->with('message', $pesan);

        } catch (\Exception $e) {
            Log::error('UserController@toggleStatus', ['user_id' => $id, 'error' => $e->getMessage()]);
            return back()->withErrors(['toggle' => 'Gagal ubah status: ' . $e->getMessage()]);
        }
    }

    /**
     * Update user profile
     */
    public function update(Request $request, $id)
    {
        try {
            $user = User::findOrFail($id);

            // 1. Validasi Akun Utama
            $request->validate([
                'email'        => 'required|email|unique:users,email,' . $user->id,
                'nama_lengkap' => 'required|string|max:255',
                'password'     => 'nullable|min:8|confirmed',
                'foto'         => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
            ]);

            // Update Akun Utama
            $user->email = $request->email;
            if ($request->filled('password')) {
                $user->password = bcrypt($request->password);
            }
            $user->save();

            // 2. Persiapkan Data Profil Berdasarkan Role
            $profileData = [];
            $relation    = null;

            if ($user->role === 'guru_bk') {
                // Validasi khusus Guru BK
                $request->validate([
                    'nip' => 'nullable|string|max:50',
                ]);

                $profileData = $request->only([
                    'nip', 'nama_lengkap', 'nama_panggilan', 'tempat_lahir',
                    'tanggal_lahir', 'jenis_kelamin', 'jabatan', 'no_whatsapp',
                ]);
                $relation = $user->guruBkProfile();

            } elseif ($user->role === 'santri') {
                // ✅ FIX: Validasi khusus Santri - kelas_id REQUIRED
                $request->validate([
                    'nisn'     => 'nullable|string|max:50',
                    'kelas_id' => 'required|exists:kelas,id', // ✅ WAJIB ADA
                ]);

                // ✅ FIX: Include kelas_id di profileData
                $profileData = $request->only([
                    'nisn', 'nama_lengkap', 'nama_panggilan', 'nama_wali',
                    'kelas_id', 'tempat_lahir', 'tanggal_lahir', 'alamat',
                    'jenis_kelamin', 'no_whatsapp',
                ]);
                $relation = $user->santriProfile();

            } elseif ($user->role === 'tenaga_pendidik') {
                // Validasi khusus Tenaga Pendidik
                $request->validate([
                    'nip' => 'nullable|string|max:50',
                ]);

                $profileData = $request->only([
                    'nip', 'nama_lengkap', 'nama_panggilan', 'tempat_lahir',
                    'tanggal_lahir', 'jenis_kelamin', 'jabatan', 'no_whatsapp',
                ]);
                $relation = $user->tenagaPendidikProfile();
            }

            // 3. Logika Upload Foto
            if ($request->hasFile('foto')) {
                $existing = $relation?->first();
                if ($existing?->foto) {
                    Storage::disk('public')->delete($existing->foto);
                }
                $profileData['foto'] = $request->file('foto')
                    ->store('uploads/profile', 'public');
            }

            // 4. Handle Perpindahan Kelas untuk Santri
            if ($user->role === 'santri' && $relation) {
                $existingProfile = $relation->first();
                $newKelasId      = $profileData['kelas_id'] ?? null;

                if ($existingProfile && $newKelasId && $existingProfile->kelas_id != $newKelasId) {
                    DB::transaction(function () use ($user, $existingProfile, $newKelasId) {
                        $kelasBaru = Kelas::findOrFail($newKelasId);
                        $kelasLama = Kelas::find($existingProfile->kelas_id);

                        // Non-aktifkan riwayat lama
                        RiwayatKelasSantri::where('user_id', $user->id)
                            ->where('is_active', 1)
                            ->update([
                                'is_active'      => false,
                                'tanggal_keluar' => now(),
                                'keterangan'     => 'Pindah ke ' . $kelasBaru->kode_kelas
                                    . ($kelasLama ? ' dari ' . $kelasLama->kode_kelas : ''),
                            ]);

                        // Buat riwayat baru
                        $riwayat = RiwayatKelasSantri::firstOrNew([
                            'user_id'      => $user->id,
                            'tahun_ajaran' => $kelasBaru->tahun_ajaran,
                        ]);
                        $riwayat->kelas_id       = $kelasBaru->id;
                        $riwayat->is_active      = true;
                        $riwayat->tanggal_masuk  = now();
                        $riwayat->tanggal_keluar = null;
                        $riwayat->keterangan     = 'Pindah ke kelas ' . $kelasBaru->kode_kelas;
                        $riwayat->save();
                    });
                }
            }

            // 5. Eksekusi Simpan ke Tabel Profil
            if ($relation) {
                $relation->updateOrCreate(['user_id' => $user->id], $profileData);
            }

            return back()->with('message', 'Profil ' . str_replace('_', ' ', $user->role) . ' berhasil diperbarui!');

        } catch (\Illuminate\Validation\ValidationException $e) {
            return back()->withErrors($e->errors());
        } catch (\Exception $e) {
            Log::error('UserController@update', ['user_id' => $id, 'error' => $e->getMessage()]);
            return back()->withErrors(['update' => 'Gagal update: ' . $e->getMessage()]);
        }
    }

    /**
     * Delete user
     */
    public function destroy($id)
    {
        try {
            $user = User::withTrashed()->findOrFail($id);

            // Guard: tidak boleh hapus diri sendiri
            if ($user->id === auth()->id()) {
                return back()->withErrors(['delete' => 'Tidak dapat menghapus akun Anda sendiri!']);
            }

            // Guard: Guru BK tidak boleh dihapus
            if ($user->role === 'guru_bk') {
                return back()->withErrors(['delete' => 'Akun Guru BK tidak dapat dihapus!']);
            }

            DB::transaction(function () use ($user) {
                // 1. Hapus foto dari storage
                $foto = match ($user->role) {
                    'santri'          => $user->santriProfile?->foto,
                    'guru_bk'         => $user->guruBkProfile?->foto,
                    'tenaga_pendidik' => $user->tenagaPendidikProfile?->foto,
                    default           => null,
                };

                if ($foto && Storage::disk('public')->exists($foto)) {
                    Storage::disk('public')->delete($foto);
                }

                // 2. Hapus riwayat kelas
                RiwayatKelasSantri::where('user_id', $user->id)->delete();

                // 3. Hapus profil sesuai role
                $user->santriProfile?->delete();
                $user->guruBkProfile?->delete();
                $user->tenagaPendidikProfile?->delete();

                // 4. Hard delete user
                $user->forceDelete();

                Log::info('User deleted', [
                    'user_id'  => $user->id,
                    'username' => $user->username,
                    'role'     => $user->role,
                ]);
            });

            return back()->with('message', 'User berhasil dihapus permanen beserta seluruh data terkait.');

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return back()->withErrors(['delete' => 'User tidak ditemukan!']);
        } catch (\Exception $e) {
            Log::error('UserController@destroy', ['user_id' => $id, 'error' => $e->getMessage()]);
            return back()->withErrors(['delete' => 'Gagal menghapus: ' . $e->getMessage()]);
        }
    }
}