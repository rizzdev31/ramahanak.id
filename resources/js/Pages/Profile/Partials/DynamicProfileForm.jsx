import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { useForm, usePage } from '@inertiajs/react';
import { Transition } from '@headlessui/react';

export default function DynamicProfileForm({ userProfile, className = '' }) {
    const user = usePage().props.auth.user;

    // ✅ PERBAIKAN: Gunakan accessor 'profile' dari User.php
    const profile = userProfile.profile || {};

    const { data, setData, post, errors, processing, recentlySuccessful } = useForm({
        // Data Akun Utama
        username: userProfile.username || '', 
        email: userProfile.email || '',

        // Data Tambahan Profil
        nama_lengkap: profile.nama_lengkap || '',
        nama_panggilan: profile.nama_panggilan || '',
        tempat_lahir: profile.tempat_lahir || '',
        tanggal_lahir: profile.tanggal_lahir || '',
        jenis_kelamin: profile.jenis_kelamin || 'Laki-laki',
        no_whatsapp: profile.no_whatsapp || '',
        nip: profile.nip || '',
        jabatan: profile.jabatan || '',
        nisn: profile.nisn || '',
        nama_wali: profile.nama_wali || '',
        kelas: profile.kelas || '',
        alamat: profile.alamat || '',
        foto: null, 
        _method: 'patch', 
    });
    
    const submit = (e) => {
        e.preventDefault();
        post(route('profile.update'), {
            forceFormData: true,
            onSuccess: () => console.log('Update Berhasil!'),
            onError: (err) => console.log('Error Validasi:', err),
        });
    };

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-medium text-gray-900">Detail Informasi Profil</h2>
                <p className="mt-1 text-sm text-gray-600">
                    Lengkapi data diri Anda sesuai dengan identitas resmi.
                </p>
            </header>

            <form onSubmit={submit} className="mt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* INPUT UMUM (SEMUA ROLE) */}
                    <div>
                        <InputLabel htmlFor="nama_lengkap" value="Nama Lengkap" />
                        <TextInput 
                            id="nama_lengkap" 
                            className="mt-1 block w-full" 
                            value={data.nama_lengkap} 
                            onChange={(e) => setData('nama_lengkap', e.target.value)} 
                            required 
                        />
                        <InputError className="mt-2" message={errors.nama_lengkap} />
                    </div>

                    <div>
                        <InputLabel htmlFor="nama_panggilan" value="Nama Panggilan" />
                        <TextInput 
                            id="nama_panggilan" 
                            className="mt-1 block w-full" 
                            value={data.nama_panggilan} 
                            onChange={(e) => setData('nama_panggilan', e.target.value)} 
                        />
                    </div>

                    {/* ✅ PERBAIKAN: Tampilkan preview foto dengan fallback ke default */}
                    <div className="md:col-span-2 flex items-center gap-4 border-b pb-6 mb-4">
                        <div className="shrink-0">
                            <img 
                                className="h-20 w-20 object-cover rounded-full"
                                src={profile.foto 
                                    ? `/storage/${profile.foto}?t=${new Date().getTime()}` 
                                    : `/default-avatar.png`} 
                                alt="Profile" 
                            />
                        </div>
                        <div className="grow">
                            <InputLabel htmlFor="foto" value="Foto Profil" />
                            <input 
                                type="file" 
                                id="foto"
                                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                onChange={(e) => setData('foto', e.target.files[0])}
                            />
                            <InputError className="mt-2" message={errors.foto} />
                        </div>
                    </div>

                    {/* INPUT SPESIFIK: GURU BK & TENAGA PENDIDIK */}
                    {(user.role === 'guru_bk' || user.role === 'tenaga_pendidik') && (
                        <>
                            <div>
                                <InputLabel htmlFor="nip" value="NIP (Identitas Utama)" />
                                <TextInput 
                                    id="nip" 
                                    className="mt-1 block w-full bg-gray-100" 
                                    value={data.nip} 
                                    readOnly 
                                    title="NIP tidak dapat diubah" 
                                />
                            </div>
                            <div>
                                <InputLabel htmlFor="jabatan" value="Jabatan" />
                                <TextInput 
                                    id="jabatan" 
                                    className="mt-1 block w-full" 
                                    value={data.jabatan} 
                                    onChange={(e) => setData('jabatan', e.target.value)} 
                                />
                            </div>
                        </>
                    )}

                    {/* INPUT SPESIFIK: SANTRI */}
                    {user.role === 'santri' && (
                        <>
                            <div>
                                <InputLabel htmlFor="nisn" value="NISN (Identitas Utama)" />
                                <TextInput 
                                    id="nisn" 
                                    className="mt-1 block w-full bg-gray-100" 
                                    value={data.nisn} 
                                    readOnly 
                                    title="NISN tidak dapat diubah" 
                                />
                            </div>
                            <div>
                                <InputLabel htmlFor="kelas" value="Kelas" />
                                <TextInput 
                                    id="kelas" 
                                    className="mt-1 block w-full" 
                                    value={data.kelas} 
                                    onChange={(e) => setData('kelas', e.target.value)} 
                                />
                            </div>
                            <div className="md:col-span-2">
                                <InputLabel htmlFor="nama_wali" value="Nama Wali" />
                                <TextInput 
                                    id="nama_wali" 
                                    className="mt-1 block w-full" 
                                    value={data.nama_wali} 
                                    onChange={(e) => setData('nama_wali', e.target.value)} 
                                />
                            </div>
                        </>
                    )}

                    {/* DATA FISIK & KONTAK (UMUM) */}
                    <div>
                        <InputLabel htmlFor="tempat_lahir" value="Tempat Lahir" />
                        <TextInput 
                            id="tempat_lahir" 
                            className="mt-1 block w-full" 
                            value={data.tempat_lahir} 
                            onChange={(e) => setData('tempat_lahir', e.target.value)} 
                        />
                    </div>

                    <div>
                        <InputLabel htmlFor="tanggal_lahir" value="Tanggal Lahir" />
                        <TextInput 
                            id="tanggal_lahir" 
                            type="date" 
                            className="mt-1 block w-full" 
                            value={data.tanggal_lahir} 
                            onChange={(e) => setData('tanggal_lahir', e.target.value)} 
                        />
                    </div>

                    <div>
                        <InputLabel htmlFor="jenis_kelamin" value="Jenis Kelamin" />
                        <select 
                            id="jenis_kelamin"
                            className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                            value={data.jenis_kelamin}
                            onChange={(e) => setData('jenis_kelamin', e.target.value)}
                        >
                            <option value="Laki-laki">Laki-laki</option>
                            <option value="Perempuan">Perempuan</option>
                        </select>
                    </div>

                    <div>
                        <InputLabel htmlFor="no_whatsapp" value="Nomor WhatsApp" />
                        <TextInput 
                            id="no_whatsapp" 
                            className="mt-1 block w-full" 
                            value={data.no_whatsapp} 
                            onChange={(e) => setData('no_whatsapp', e.target.value)} 
                        />
                    </div>

                    {user.role === 'santri' && (
                        <div className="md:col-span-2">
                            <InputLabel htmlFor="alamat" value="Alamat Lengkap" />
                            <textarea 
                                id="alamat"
                                className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                value={data.alamat}
                                onChange={(e) => setData('alamat', e.target.value)}
                                rows="3"
                            ></textarea>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    <PrimaryButton disabled={processing}>Simpan Perubahan</PrimaryButton>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm text-gray-600">Berhasil disimpan.</p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}