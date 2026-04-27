import AppLayout from '@/Layouts/AppLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';

export default function Create({ auth }) {
    const { data, setData, post, processing, errors } = useForm({
        kode_kelas: '',
        nama: '',
        tingkat: '',
        tahun_ajaran: new Date().getFullYear() + '/' + (new Date().getFullYear() + 1),
        kapasitas: 30,
        status: 'active',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('kelas.store'));
    };

    return (
        <AppLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Tambah Kelas Baru</h2>}
        >
            <Head title="Tambah Kelas" />

            <div className="py-12">
                <div className="max-w-3xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Kode Kelas */}
                                    <div>
                                        <InputLabel htmlFor="kode_kelas" value="Kode Kelas *" />
                                        <TextInput
                                            id="kode_kelas"
                                            className="mt-1 block w-full"
                                            value={data.kode_kelas}
                                            onChange={(e) => setData('kode_kelas', e.target.value)}
                                            placeholder="Contoh: 7A, 8B, 9C"
                                            required
                                        />
                                        <InputError message={errors.kode_kelas} className="mt-2" />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Format: [Tingkat][Kode] (misal: 7A, 8B)
                                        </p>
                                    </div>

                                    {/* Nama Kelas */}
                                    <div>
                                        <InputLabel htmlFor="nama" value="Nama Kelas *" />
                                        <TextInput
                                            id="nama"
                                            className="mt-1 block w-full"
                                            value={data.nama}
                                            onChange={(e) => setData('nama', e.target.value)}
                                            placeholder="Contoh: Al Farabi, Al Kindi"
                                            required
                                        />
                                        <InputError message={errors.nama} className="mt-2" />
                                    </div>

                                    {/* Tingkat */}
                                    <div>
                                        <InputLabel htmlFor="tingkat" value="Tingkat *" />
                                        <select
                                            id="tingkat"
                                            className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                            value={data.tingkat}
                                            onChange={(e) => setData('tingkat', e.target.value)}
                                            required
                                        >
                                            <option value="">Pilih Tingkat</option>
                                            <option value="7">Tingkat 7</option>
                                            <option value="8">Tingkat 8</option>
                                            <option value="9">Tingkat 9</option>
                                            <option value="10">Tingkat 10</option>
                                            <option value="11">Tingkat 11</option>
                                            <option value="12">Tingkat 12</option>
                                        </select>
                                        <InputError message={errors.tingkat} className="mt-2" />
                                    </div>

                                    {/* Tahun Ajaran */}
                                    <div>
                                        <InputLabel htmlFor="tahun_ajaran" value="Tahun Ajaran *" />
                                        <TextInput
                                            id="tahun_ajaran"
                                            className="mt-1 block w-full"
                                            value={data.tahun_ajaran}
                                            onChange={(e) => setData('tahun_ajaran', e.target.value)}
                                            placeholder="Contoh: 2024/2025"
                                            required
                                        />
                                        <InputError message={errors.tahun_ajaran} className="mt-2" />
                                    </div>

                                    {/* Kapasitas */}
                                    <div>
                                        <InputLabel htmlFor="kapasitas" value="Kapasitas (Opsional)" />
                                        <TextInput
                                            id="kapasitas"
                                            type="number"
                                            className="mt-1 block w-full"
                                            value={data.kapasitas}
                                            onChange={(e) => setData('kapasitas', e.target.value)}
                                            placeholder="Contoh: 30"
                                            min="1"
                                            max="100"
                                        />
                                        <InputError message={errors.kapasitas} className="mt-2" />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Kosongkan jika tidak ada batasan
                                        </p>
                                    </div>

                                    {/* Status */}
                                    <div>
                                        <InputLabel htmlFor="status" value="Status *" />
                                        <select
                                            id="status"
                                            className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                            value={data.status}
                                            onChange={(e) => setData('status', e.target.value)}
                                            required
                                        >
                                            <option value="active">Aktif</option>
                                            <option value="inactive">Tidak Aktif</option>
                                        </select>
                                        <InputError message={errors.status} className="mt-2" />
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-4 pt-4 border-t">
                                    <Link href={route('kelas.index')}>
                                        <SecondaryButton>Batal</SecondaryButton>
                                    </Link>
                                    <PrimaryButton disabled={processing}>
                                        {processing ? 'Menyimpan...' : 'Simpan'}
                                    </PrimaryButton>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}