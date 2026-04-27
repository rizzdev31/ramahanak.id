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
    const [showDetail, setShowDetail] = useState(null);

    const { data: formData, setData, post, put, processing, errors, reset } = useForm({
        kode: '',
        diagnosis: '',
        penjelasan: '',
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
            diagnosis: item.diagnosis,
            penjelasan: item.penjelasan,
            rekomendasi: item.rekomendasi,
        });
        setEditMode(true);
        setShowModal(true);
    };

    // Submit form
    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (editMode) {
            put(route('variabel.diagnosis.update', selectedItem.id), {
                onSuccess: () => {
                    setShowModal(false);
                    reset();
                },
            });
        } else {
            post(route('variabel.diagnosis.store'), {
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
            router.delete(route('variabel.diagnosis.destroy', id));
        }
    };

    return (
        <AppLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800">Kelola Variabel Diagnosis</h2>}
        >
            <Head title="Variabel Diagnosis" />

            <div className="py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    {/* Header + Button Tambah */}
                    <div className="mb-6 flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Daftar Variabel Diagnosis</h3>
                            <p className="text-sm text-gray-500 mt-1">
                                Kelola variabel diagnosis untuk sistem expert forward chaining
                            </p>
                        </div>
                        <PrimaryButton onClick={openCreateModal}>
                            + Tambah Variabel
                        </PrimaryButton>
                    </div>

                    {/* Info Box */}
                    <div className="mb-6 bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="text-sm text-indigo-800">
                                <p className="font-semibold mb-1">Tentang Variabel Diagnosis:</p>
                                <p>Variabel ini akan terhubung ke rule expert system. Format kode menggunakan <strong>D001, D002, D003</strong>, dst untuk menghindari bentrok dengan variabel lain.</p>
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
                                        Diagnosis
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Penjelasan
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
                                                <span className="px-2 py-1 text-xs font-mono font-semibold bg-indigo-100 text-indigo-800 rounded">
                                                    {item.kode}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {item.diagnosis}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-xs text-gray-600">
                                                    {showDetail === item.id ? (
                                                        <div>
                                                            {item.penjelasan}
                                                            <button
                                                                onClick={() => setShowDetail(null)}
                                                                className="ml-2 text-indigo-600 hover:text-indigo-900 font-medium"
                                                            >
                                                                Sembunyikan
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2">
                                                            <span className="line-clamp-2">{item.penjelasan}</span>
                                                            <button
                                                                onClick={() => setShowDetail(item.id)}
                                                                className="shrink-0 text-indigo-600 hover:text-indigo-900 font-medium"
                                                            >
                                                                Lihat
                                                            </button>
                                                        </div>
                                                    )}
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
                        {editMode ? 'Edit Variabel Diagnosis' : 'Tambah Variabel Diagnosis'}
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
                                placeholder="D001, D002, D003, dst"
                                required
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                Gunakan format D001, D002, dst untuk menghindari bentrok dengan variabel lain
                            </p>
                            <InputError message={errors.kode} className="mt-1" />
                        </div>

                        {/* Diagnosis */}
                        <div>
                            <InputLabel htmlFor="diagnosis" value="Nama Diagnosis *" />
                            <TextInput
                                id="diagnosis"
                                value={formData.diagnosis}
                                onChange={(e) => setData('diagnosis', e.target.value)}
                                className="mt-1 block w-full"
                                placeholder="Reactive Aggression, ADHD Inattentive, dst"
                                required
                            />
                            <InputError message={errors.diagnosis} className="mt-1" />
                        </div>

                        {/* Penjelasan */}
                        <div>
                            <InputLabel htmlFor="penjelasan" value="Penjelasan Diagnosis *" />
                            <textarea
                                id="penjelasan"
                                value={formData.penjelasan}
                                onChange={(e) => setData('penjelasan', e.target.value)}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                rows="5"
                                placeholder="Penjelasan lengkap tentang diagnosis ini, termasuk ciri-ciri, penyebab, dan dampaknya..."
                                required
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                Masukkan penjelasan lengkap diagnosis untuk membantu proses expert system
                            </p>
                            <InputError message={errors.penjelasan} className="mt-1" />
                        </div>

                        {/* Rekomendasi */}
                        <div>
                            <InputLabel htmlFor="rekomendasi" value="Rekomendasi Tindakan *" />
                            <textarea
                                id="rekomendasi"
                                value={formData.rekomendasi}
                                onChange={(e) => setData('rekomendasi', e.target.value)}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                rows="5"
                                placeholder="Rekomendasi tindakan BK saat diagnosis ini terdeteksi. Contoh: Lakukan konseling empati, rujuk ke psikolog jika berlanjut lebih dari 2 minggu..."
                                required
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                Masukkan rekomendasi tindakan yang harus dilakukan BK saat diagnosis ini muncul
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