import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import Modal from '@/Components/Modal';

export default function Index({ auth, kelas, filters }) {
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [kelasToDelete, setKelasToDelete] = useState(null);
    const [filterTingkat, setFilterTingkat] = useState(filters?.tingkat || '');
    const [filterStatus, setFilterStatus] = useState(filters?.status || 'active');
    const [search, setSearch] = useState(filters?.search || '');

    // Fungsi untuk apply filter
    const handleFilter = () => {
        router.get(route('kelas.index'), {
            tingkat: filterTingkat,
            status: filterStatus,
            search: search,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    // Fungsi untuk reset filter
    const handleResetFilter = () => {
        setFilterTingkat('');
        setFilterStatus('active');
        setSearch('');
        router.get(route('kelas.index'));
    };

    // Fungsi untuk membuka modal delete
    const openDeleteModal = (kelasItem) => {
        setKelasToDelete(kelasItem);
        setShowDeleteModal(true);
    };

    // Fungsi untuk confirm delete
    const handleDelete = () => {
        router.delete(route('kelas.destroy', kelasToDelete.id), {
            onSuccess: () => {
                setShowDeleteModal(false);
                setKelasToDelete(null);
            },
            onError: (errors) => {
                alert('Error: ' + (errors.delete || 'Terjadi kesalahan'));
            }
        });
    };

    return (
        <AppLayout
            user={auth.user}
            header={
                <div className="flex justify-between items-center">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">Kelola Kelas</h2>
                    <Link href={route('kelas.create')}>
                        <PrimaryButton>+ Tambah Kelas</PrimaryButton>
                    </Link>
                </div>
            }
        >
            <Head title="Kelola Kelas" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            {/* Filter Section */}
                            <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                                <h3 className="text-lg font-semibold mb-4">Filter Kelas</h3>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    {/* Filter Tingkat */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Tingkat
                                        </label>
                                        <select
                                            className="w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                            value={filterTingkat}
                                            onChange={(e) => setFilterTingkat(e.target.value)}
                                        >
                                            <option value="">Semua Tingkat</option>
                                            <option value="7">Tingkat 7</option>
                                            <option value="8">Tingkat 8</option>
                                            <option value="9">Tingkat 9</option>
                                        </select>
                                    </div>

                                    {/* Filter Status */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Status
                                        </label>
                                        <select
                                            className="w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                            value={filterStatus}
                                            onChange={(e) => setFilterStatus(e.target.value)}
                                        >
                                            <option value="active">Aktif</option>
                                            <option value="inactive">Tidak Aktif</option>
                                        </select>
                                    </div>

                                    {/* Search */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Cari
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                            placeholder="Kode atau nama kelas..."
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleFilter()}
                                        />
                                    </div>

                                    {/* Button Filter */}
                                    <div className="flex items-end gap-2">
                                        <PrimaryButton onClick={handleFilter}>
                                            Filter
                                        </PrimaryButton>
                                        <SecondaryButton onClick={handleResetFilter}>
                                            Reset
                                        </SecondaryButton>
                                    </div>
                                </div>
                            </div>

                            {/* Tabel Kelas */}
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Kelas
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Tingkat
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Tahun Ajaran
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Kapasitas
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Santri
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Wali Kelas
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Aksi
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {kelas.data && kelas.data.length > 0 ? (
                                            kelas.data.map((item) => (
                                                <tr key={item.id} className={item.is_pending ? 'bg-yellow-50' : ''}>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {item.kode_kelas}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {item.nama}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {item.tingkat === 0 ? 'Pending' : `Tingkat ${item.tingkat}`}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {item.tahun_ajaran}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {item.kapasitas || '-'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">
                                                            {item.jumlah_santri} / {item.kapasitas || '∞'}
                                                        </div>
                                                        {item.is_penuh && (
                                                            <span className="text-xs text-red-600 font-semibold">
                                                                Penuh!
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {item.wali_kelas ? (
                                                            <div>
                                                                <div className="font-medium text-gray-900">
                                                                    {item.wali_kelas.nama}
                                                                </div>
                                                                <div className="text-xs text-gray-500">
                                                                    {item.wali_kelas.role === 'guru_bk' ? 'Guru BK' : 'Tenaga Pendidik'}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-yellow-600">Belum ada</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                            ${item.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                                                        `}>
                                                            {item.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <div className="flex gap-2">
                                                            <Link
                                                                href={route('kelas.show', item.id)}
                                                                className="text-blue-600 hover:text-blue-900"
                                                            >
                                                                Detail
                                                            </Link>
                                                            {!item.is_pending && (
                                                                <>
                                                                    <Link
                                                                        href={route('kelas.edit', item.id)}
                                                                        className="text-indigo-600 hover:text-indigo-900"
                                                                    >
                                                                        Edit
                                                                    </Link>
                                                                    <button
                                                                        onClick={() => openDeleteModal(item)}
                                                                        className="text-red-600 hover:text-red-900"
                                                                    >
                                                                        Hapus
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                                                    Tidak ada data kelas
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {kelas.links && kelas.links.length > 3 && (
                                <div className="mt-4 flex justify-center gap-2">
                                    {kelas.links.map((link, index) => (
                                        <button
                                            key={index}
                                            onClick={() => router.get(link.url)}
                                            disabled={!link.url}
                                            className={`px-3 py-1 rounded ${
                                                link.active 
                                                    ? 'bg-indigo-600 text-white' 
                                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                            } ${!link.url && 'opacity-50 cursor-not-allowed'}`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Delete Confirmation */}
            <Modal show={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
                <div className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">
                        Konfirmasi Hapus Kelas
                    </h2>
                    <p className="text-gray-600 mb-6">
                        Apakah Anda yakin ingin menghapus kelas <strong>{kelasToDelete?.nama_lengkap}</strong>? 
                        {kelasToDelete?.jumlah_santri > 0 && (
                            <span className="text-red-600 font-semibold block mt-2">
                                ⚠️ Kelas ini masih memiliki {kelasToDelete.jumlah_santri} santri!
                            </span>
                        )}
                    </p>
                    <div className="flex justify-end gap-3">
                        <SecondaryButton onClick={() => setShowDeleteModal(false)}>
                            Batal
                        </SecondaryButton>
                        <DangerButton onClick={handleDelete}>
                            Hapus
                        </DangerButton>
                    </div>
                </div>
            </Modal>
        </AppLayout>
    );
}