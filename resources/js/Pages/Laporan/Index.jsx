import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Head, router, useForm } from '@inertiajs/react';
import PrimaryButton from '@/Components/PrimaryButton';
import DangerButton from '@/Components/DangerButton';
import Modal from '@/Components/Modal';

export default function Index({ auth, laporan, filters, tahunAjaranList }) {
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedLaporan, setSelectedLaporan] = useState(null);

    const approveForm = useForm({ catatan_validasi: '' });
    const rejectForm = useForm({ catatan_validasi: '' });

    const handleFilter = (key, value) => {
        router.get(route('laporan.index'), {
            ...filters,
            [key]: value,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const openApproveModal = (item) => {
        setSelectedLaporan(item);
        setShowApproveModal(true);
    };

    const openRejectModal = (item) => {
        setSelectedLaporan(item);
        setShowRejectModal(true);
    };

    const handleApprove = (e) => {
        e.preventDefault();
        approveForm.post(route('laporan.approve', selectedLaporan.id), {
            onSuccess: () => {
                setShowApproveModal(false);
                approveForm.reset();
            },
        });
    };

    const handleReject = (e) => {
        e.preventDefault();
        rejectForm.post(route('laporan.reject', selectedLaporan.id), {
            onSuccess: () => {
                setShowRejectModal(false);
                rejectForm.reset();
            },
        });
    };

    const getBadgeClass = (color) => {
        const colors = {
            yellow: 'bg-yellow-100 text-yellow-800',
            green: 'bg-green-100 text-green-800',
            red: 'bg-red-100 text-red-800',
            purple: 'bg-purple-100 text-purple-800',
            gray: 'bg-gray-100 text-gray-800',
        };
        return colors[color] || colors.gray;
    };

    return (
        <AppLayout
            user={auth.user}
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Validasi Laporan Awal (Gerbang 1)
                </h2>
            }
        >
            <Head title="Validasi Laporan" />

            <div className="py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    {/* Filter Section */}
                    <div className="bg-white shadow-sm rounded-lg p-4 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            
                            {/* Filter Status */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select
                                    value={filters.status || 'all'}
                                    onChange={(e) => handleFilter('status', e.target.value)}
                                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                >
                                    <option value="all">Semua Status</option>
                                    <option value="pending">Menunggu Validasi</option>
                                    <option value="approved">Disetujui</option>
                                    <option value="rejected">Ditolak</option> 
                                </select>
                            </div>

                            {/* Filter Jenis */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Laporan</label>
                                <select
                                    value={filters.jenis}
                                    onChange={(e) => handleFilter('jenis', e.target.value)}
                                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                >
                                    <option value="all">Semua Jenis</option>
                                    <option value="pelanggaran">Pelanggaran</option>
                                    <option value="apresiasi">Apresiasi</option>
                                    <option value="kondisi_mental">Kondisi Mental</option>
                                    <option value="lainnya">Lainnya</option>
                                </select>
                            </div>

                            {/* Filter Tahun Ajaran */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tahun Ajaran</label>
                                <select
                                    value={filters.tahun_ajaran || (tahunAjaranList[0] || '2026/2027')}
                                    onChange={(e) => handleFilter('tahun_ajaran', e.target.value)}
                                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                >
                                    {tahunAjaranList.map(tahun => (
                                        <option key={tahun} value={tahun}>{tahun}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Search */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cari</label>
                                <input
                                    type="text"
                                    value={filters.search || ''}
                                    onChange={(e) => handleFilter('search', e.target.value)}
                                    placeholder="Cari laporan atau nama..."
                                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        {['Tanggal', 'Pelapor', 'Jenis', 'Laporan', 'Status', 'Aksi'].map(header => (
                                            <th key={header} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                {header}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {laporan.data.length > 0 ? (
                                        laporan.data.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-4 whitespace-nowrap text-sm">
                                                    <div className="font-medium text-gray-900">{item.tanggal_kejadian}</div>
                                                    {item.waktu_kejadian && (
                                                        <div className="text-xs text-gray-500">{item.waktu_kejadian}</div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm">
                                                    <div className="font-medium text-gray-900">{item.pelapor.nama}</div>
                                                    <div className="text-xs text-gray-500 capitalize">{item.pelapor.role.replace('_', ' ')}</div>
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getBadgeClass(item.jenis_badge_color)}`}>
                                                        {item.jenis_laporan_label}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-sm text-gray-700 max-w-md">
                                                    <div className="line-clamp-2">{item.text_laporan}</div>
                                                    {item.lokasi_kejadian && (
                                                        <div className="text-xs text-gray-500 mt-1">📍 {item.lokasi_kejadian}</div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getBadgeClass(item.status_badge_color)}`}>
                                                        {item.status_label}
                                                    </span>
                                                    {item.validated_at && (
                                                        <div className="text-xs text-gray-500 mt-1">{item.validated_at}</div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm">
                                                    {item.status === 'pending' ? (
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => openApproveModal(item)}
                                                                className="text-green-600 hover:text-green-900 font-medium"
                                                            >
                                                                ✓ Setuju
                                                            </button>
                                                            <button
                                                                onClick={() => openRejectModal(item)}
                                                                className="text-red-600 hover:text-red-900 font-medium"
                                                            >
                                                                ✕ Tolak
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400 text-xs">
                                                            {item.validator ? `oleh ${item.validator.nama}` : '-'}
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="px-4 py-12 text-center text-gray-400">
                                                <svg className="mx-auto h-12 w-12 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                <p className="text-sm font-medium">Tidak ada laporan</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {laporan.links && (
                            <div className="px-4 py-3 border-t border-gray-200">
                                <div className="flex justify-between items-center">
                                    <div className="text-sm text-gray-500">
                                        Menampilkan {laporan.from || 0} - {laporan.to || 0} dari {laporan.total} laporan
                                    </div>
                                    <div className="flex gap-1">
                                        {laporan.links.map((link, index) => (
                                            <button
                                                key={index}
                                                onClick={() => link.url && router.visit(link.url)}
                                                disabled={!link.url}
                                                className={`px-3 py-1 text-sm rounded ${
                                                    link.active
                                                        ? 'bg-indigo-600 text-white'
                                                        : link.url
                                                        ? 'bg-white text-gray-700 hover:bg-gray-50 border'
                                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                }`}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Approve Modal */}
            <Modal show={showApproveModal} onClose={() => setShowApproveModal(false)} maxWidth="md">
                <form onSubmit={handleApprove} className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Setujui Laporan</h3>
                    
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                        <p className="text-sm text-gray-700 line-clamp-3">{selectedLaporan?.text_laporan}</p>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Catatan (Opsional)
                        </label>
                        <textarea
                            value={approveForm.data.catatan_validasi}
                            onChange={(e) => approveForm.setData('catatan_validasi', e.target.value)}
                            rows={3}
                            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Tambahkan catatan jika diperlukan..."
                        />
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => setShowApproveModal(false)}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                        >
                            Batal
                        </button>
                        <PrimaryButton disabled={approveForm.processing}>
                            {approveForm.processing ? 'Memproses...' : 'Setujui Laporan'}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* Reject Modal */}
            <Modal show={showRejectModal} onClose={() => setShowRejectModal(false)} maxWidth="md">
                <form onSubmit={handleReject} className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Tolak Laporan</h3>
                    
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                        <p className="text-sm text-gray-700 line-clamp-3">{selectedLaporan?.text_laporan}</p>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Alasan Penolakan *
                        </label>
                        <textarea
                            value={rejectForm.data.catatan_validasi}
                            onChange={(e) => rejectForm.setData('catatan_validasi', e.target.value)}
                            rows={3}
                            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Jelaskan alasan penolakan..."
                            required
                        />
                        {rejectForm.errors.catatan_validasi && (
                            <p className="mt-1 text-sm text-red-600">{rejectForm.errors.catatan_validasi}</p>
                        )}
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => setShowRejectModal(false)}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                        >
                            Batal
                        </button>
                        <DangerButton disabled={rejectForm.processing}>
                            {rejectForm.processing ? 'Memproses...' : 'Tolak Laporan'}
                        </DangerButton>
                    </div>
                </form>
            </Modal>
        </AppLayout>
    );
}