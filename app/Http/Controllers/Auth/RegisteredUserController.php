<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Kelas;
use App\Models\GuruBkProfile;
use App\Models\TenagaPendidikProfile;
use App\Models\SantriProfile;
use App\Models\RiwayatKelasSantri;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    public function store(Request $request): RedirectResponse
    {
        // ✅ Validasi dengan nip_nisn terpisah dari username
        $validated = $request->validate([
            'username'       => 'required|string|max:255|unique:users',
            'email'          => 'required|string|email|max:255|unique:users',
            'password'       => ['required', 'confirmed', \Illuminate\Validation\Rules\Password::defaults()],
            'role'           => 'required|in:guru_bk,tenaga_pendidik,santri',
            'nip_nisn'       => 'required|string|max:50',  // ✅ Field terpisah untuk NIP/NISN
            'nama_lengkap'   => 'required|string|max:255',
            'nama_panggilan' => 'required|string|max:100',
        ], [
            'username.unique'       => 'Username sudah digunakan.',
            'email.unique'          => 'Email sudah terdaftar.',
            'nip_nisn.required'     => 'NIP/NISN wajib diisi.',
            'nama_panggilan.required' => 'Nama panggilan wajib diisi.',
        ]);

        $status = ($request->role === 'guru_bk') ? 'active' : 'pending';

        DB::transaction(function () use ($request, $status, $validated) {
            // ✅ Buat user dengan username dari input (auto-generated di frontend)
            $user = User::create([
                'username' => $validated['username'],  // ✅ Username dari frontend
                'email'    => $validated['email'],
                'password' => Hash::make($validated['password']),
                'role'     => $request->role,
                'status'   => $status,
            ]);

            // ✅ Buat profil dengan NIP/NISN yang benar
            if ($request->role === 'santri') {
                $pendingKelas = Kelas::firstOrCreate(
                    ['kode_kelas' => 'PENDING'],
                    [
                        'nama'         => 'Santri Baru',
                        'tingkat'      => 0,
                        'tahun_ajaran' => date('Y') . '/' . (date('Y') + 1),
                        'status'       => 'active',
                        'kapasitas'    => 999,
                    ]
                );

                $user->santriProfile()->create([
                    'nisn'           => $validated['nip_nisn'],  // ✅ NISN dari input field
                    'nama_lengkap'   => $validated['nama_lengkap'],
                    'nama_panggilan' => $validated['nama_panggilan'],
                    'kelas_id'       => $pendingKelas->id,
                ]);

                RiwayatKelasSantri::create([
                    'user_id'       => $user->id,
                    'kelas_id'      => $pendingKelas->id,
                    'tahun_ajaran'  => $pendingKelas->tahun_ajaran,
                    'is_active'     => true,
                    'tanggal_masuk' => now(),
                    'keterangan'    => 'Registrasi baru, menunggu penempatan kelas.',
                ]);

            } elseif ($request->role === 'tenaga_pendidik') {
                $user->tenagaPendidikProfile()->create([
                    'nip'            => $validated['nip_nisn'],  // ✅ NIP dari input field
                    'nama_lengkap'   => $validated['nama_lengkap'],
                    'nama_panggilan' => $validated['nama_panggilan'],
                ]);

            } elseif ($request->role === 'guru_bk') {
                $user->guruBkProfile()->create([
                    'nip'            => $validated['nip_nisn'],  // ✅ NIP dari input field
                    'nama_lengkap'   => $validated['nama_lengkap'],
                    'nama_panggilan' => $validated['nama_panggilan'],
                    'jabatan'        => 'Guru BK',
                ]);
            }

            $this->registeredUser = $user;
            event(new Registered($user));
        });

        if ($status === 'pending') {
            return redirect()->route('login')
                ->with('status', 'Pendaftaran berhasil! Akun menunggu verifikasi Guru BK.');
        }

        Auth::login($this->registeredUser);
        return redirect(route('dashboard'));
    }

    private ?User $registeredUser = null;
}