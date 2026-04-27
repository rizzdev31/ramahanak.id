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
        konsekuensi: '',
        poin: '',
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
            konsekuensi: item.konsekuensi,
            poin: item.poin,
            rekomendasi: item.rekomendasi,
        });
        setEditMode(true);
        setShowModal(true);
    };

    // Submit form
    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (editMode) {
            put(route('variabel.konsekuensi.update', selectedItem.id), {
                onSuccess: () => {
                    setShowModal(false);
                    reset();
                },
            });
        } else {
            post(route('variabel.konsekuensi.store'), {
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
            router.delete(route('variabel.konsekuensi.destroy', id));
        }
    };

    return (
        <AppLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800">Kelola Variabel Konsekuensi</h2>}
        >
            <Head title="Variabel Konsekuensi" />

            <div className="py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    {/* Header + Button Tambah */}
                    <div className="mb-6 flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Daftar Variabel Konsekuensi</h3>
                            <p className="text-sm text-gray-500 mt-1">
                                Kelola tingkatan konsekuensi berdasarkan akumulasi poin pelanggaran santri
                            </p>
                        </div>
                        <PrimaryButton onClick={openCreateModal}>
                            + Tambah Variabel
                        </PrimaryButton>
                    </div>

                    {/* Info Box */}
                    <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="text-sm text-blue-800">
                                <p className="font-semibold mb-1">Tentang Poin Threshold:</p>
                                <p>Poin di sini adalah <strong>patokan akumulasi</strong> poin pelanggaran santri. Contoh: jika santri mengumpulkan 35 poin pelanggaran, maka ia masuk konsekuensi dengan threshold 30 poin (K002).</p>
                            </div>
                        </div>
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
                                        Threshold Poin
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Konsekuensi
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
                                    data.map((item, index) => {
                                        // Tentukan warna badge berdasarkan severity
                                        let badgeColor = 'bg-gray-100 text-gray-800';
                                        if (item.poin >= 190) badgeColor = 'bg-red-100 text-red-800';
                                        else if (item.poin >= 130) badgeColor = 'bg-orange-100 text-orange-800';
                                        else if (item.poin >= 70) badgeColor = 'bg-yellow-100 text-yellow-800';
                                        else if (item.poin >= 30) badgeColor = 'bg-blue-100 text-blue-800';

                                        return (
                                            <tr key={item.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="px-2 py-1 text-xs font-mono font-semibold bg-indigo-100 text-indigo-800 rounded">
                                                        {item.kode}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-3 py-1 text-sm font-bold rounded ${badgeColor}`}>
                                                        ≥ {item.poin} Poin
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {item.konsekuensi}
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
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal Form */}
            <Modal show={showModal} onClose={() => setShowModal(false)} maxWidth="2xl">
                <form onSubmit={handleSubmit} className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        {editMode ? 'Edit Variabel Konsekuensi' : 'Tambah Variabel Konsekuensi'}
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
                                placeholder="K001, K002, dst"
                                required
                            />
                            <InputError message={errors.kode} className="mt-1" />
                        </div>

                        {/* Poin Threshold */}
                        <div>
                            <InputLabel htmlFor="poin" value="Poin Threshold *" />
                            <TextInput
                                id="poin"
                                type="number"
                                value={formData.poin}
                                onChange={(e) => setData('poin', e.target.value)}
                                className="mt-1 block w-full"
                                placeholder="10, 30, 50, 70, dst"
                                required
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                Patokan akumulasi poin pelanggaran santri untuk masuk konsekuensi ini
                            </p>
                            <InputError message={errors.poin} className="mt-1" />
                        </div>

                        {/* Konsekuensi */}
                        <div>
                            <InputLabel htmlFor="konsekuensi" value="Konsekuensi *" />
                            <textarea
                                id="konsekuensi"
                                value={formData.konsekuensi}
                                onChange={(e) => setData('konsekuensi', e.target.value)}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                rows="3"
                                placeholder="Bimbingan 1 Dan Pemberian Sanksi Ringan"
                                required
                            />
                            <InputError message={errors.konsekuensi} className="mt-1" />
                        </div>

                        {/* Rekomendasi */}
                        <div>
                            <InputLabel htmlFor="rekomendasi" value="Rekomendasi Tindakan BK *" />
                            <textarea
                                id="rekomendasi"
                                value={formData.rekomendasi}
                                onChange={(e) => setData('rekomendasi', e.target.value)}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                rows="4"
                                placeholder="Panggil santri untuk sesi bimbingan pertama, catat di jurnal BK, berikan teguran lisan."
                                required
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                Masukkan tindakan yang harus dilakukan BK saat santri mencapai threshold poin ini
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