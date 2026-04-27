import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Head, useForm, router } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';

export default function Index({ auth, data }) {
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    const { data: formData, setData, post, put, processing, errors, reset } = useForm({
        kode: '',
        gangguan_mental: '',
        kamus_kata: '',
        rekomendasi: '',
    });

    // Buka modal untuk create
    const openCreateModal = () => {
        reset();
        setEditMode(false);
        setShowModal(true);
    };

    // Buka modal untuk edit
    const openEditModal = (item) => {
        setSelectedItem(item);
        setData({
            kode: item.kode,
            gangguan_mental: item.gangguan_mental,
            kamus_kata: item.kamus_kata,
            rekomendasi: item.rekomendasi,
        });
        setEditMode(true);
        setShowModal(true);
    };

    // Submit form
    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (editMode) {
            put(route('variabel.konselor.update', selectedItem.id), {
                onSuccess: () => {
                    setShowModal(false);
                    reset();
                },
            });
        } else {
            post(route('variabel.konselor.store'), {
                onSuccess: () => {
                    setShowModal(false);
                    reset();
                },
            });
        }
    };

    // Delete
    const handleDelete = (id) => {
        if (confirm('Yakin ingin menghapus variabel ini?')) {
            router.delete(route('variabel.konselor.destroy', id));
        }
    };

    return (
        <AppLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800">Kelola Variabel Konselor</h2>}
        >
            <Head title="Variabel Konselor" />

            <div className="py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    {/* Header + Button Tambah */}
                    <div className="mb-6 flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Daftar Variabel Konselor</h3>
                            <p className="text-sm text-gray-500 mt-1">
                                Kelola variabel gangguan mental untuk deteksi dini dan rekomendasi konseling
                            </p>
                        </div>
                        <PrimaryButton onClick={openCreateModal}>
                            + Tambah Variabel
                        </PrimaryButton>
                    </div>

                    {/* Tabel */}
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Kode
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Gangguan Mental
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Kamus Kata
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Rekomendasi
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {data.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-8 text-center text-sm text-gray-500">
                                            Belum ada data. Klik "Tambah Variabel" untuk menambahkan.
                                        </td>
                                    </tr>
                                ) : (
                                    data.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-2 py-1 text-xs font-mono font-semibold bg-purple-100 text-purple-800 rounded">
                                                    {item.kode}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {item.gangguan_mental}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-xs text-gray-500 line-clamp-2">
                                                    {item.kamus_kata.split(',').slice(0, 5).join(', ')}
                                                    {item.kamus_kata.split(',').length > 5 && '...'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-xs text-gray-600 line-clamp-2">
                                                    {item.rekomendasi}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                                <button
                                                    onClick={() => openEditModal(item)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    Hapus
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal Form */}
            <Modal show={showModal} onClose={() => setShowModal(false)} maxWidth="3xl">
                <form onSubmit={handleSubmit} className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        {editMode ? 'Edit Variabel Konselor' : 'Tambah Variabel Konselor'}
                    </h2>

                    <div className="space-y-4">
                        {/* Kode */}
                        <div>
                            <InputLabel htmlFor="kode" value="Kode *" />
                            <TextInput
                                id="kode"
                                value={formData.kode}
                                onChange={(e) => setData('kode', e.target.value)}
                                className="mt-1 block w-full"
                                placeholder="G001, G002, dst"
                                required
                            />
                            <InputError message={errors.kode} className="mt-1" />
                        </div>

                        {/* Gangguan Mental */}
                        <div>
                            <InputLabel htmlFor="gangguan_mental" value="Gangguan Mental *" />
                            <TextInput
                                id="gangguan_mental"
                                value={formData.gangguan_mental}
                                onChange={(e) => setData('gangguan_mental', e.target.value)}
                                className="mt-1 block w-full"
                                placeholder="Gangguan Kecemasan Umum, Gangguan Depresi, dst"
                                required
                            />
                            <InputError message={errors.gangguan_mental} className="mt-1" />
                        </div>

                        {/* Kamus Kata */}
                        <div>
                            <InputLabel htmlFor="kamus_kata" value="Kamus Kata (pisahkan dengan koma) *" />
                            <textarea
                                id="kamus_kata"
                                value={formData.kamus_kata}
                                onChange={(e) => setData('kamus_kata', e.target.value)}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                rows="4"
                                placeholder="cemas, gelisah, gugup, khawatir, takut, panik, dst"
                                required
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                Masukkan kata kunci gejala yang akan digunakan untuk preprocessing (pisahkan dengan koma)
                            </p>
                            <InputError message={errors.kamus_kata} className="mt-1" />
                        </div>

                        {/* Rekomendasi */}
                        <div>
                            <InputLabel htmlFor="rekomendasi" value="Rekomendasi Tindakan BK *" />
                            <textarea
                                id="rekomendasi"
                                value={formData.rekomendasi}
                                onChange={(e) => setData('rekomendasi', e.target.value)}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                rows="5"
                                placeholder="Lakukan konseling empati, dengarkan keluh kesahnya. Rujuk ke psikolog jika berlanjut lebih dari 2 minggu."
                                required
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                Masukkan tindakan awal yang harus dilakukan BK saat menangani kasus ini
                            </p>
                            <InputError message={errors.rekomendasi} className="mt-1" />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton type="button" onClick={() => setShowModal(false)}>
                            Batal
                        </SecondaryButton>
                        <PrimaryButton disabled={processing}>
                            {processing ? 'Menyimpan...' : editMode ? 'Perbarui' : 'Simpan'}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>
        </AppLayout>
    );
}