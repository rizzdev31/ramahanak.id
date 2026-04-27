import AppLayout from '@/Layouts/AppLayout';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

export default function Index({ auth, laporanList, santriList, filters }) {
    const [search, setSearch] = useState(filters.search || '');
    const [jenis, setJenis] = useState(filters.jenis || 'all');
    const [status, setStatus] = useState(filters.status || 'all');
    const [santriId, setSantriId] = useState(filters.santri_id || '');

    const handleFilter = () => {
        router.get(route('expert-system-point.index'), {
            search,
            jenis,
            status,
            santri_id: santriId,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const getJenisBadgeClass = (jenis) => {
        return jenis === 'konsekuensi' 
            ? 'bg-red-100 text-red-800' 
            : 'bg-green-100 text-green-800';
    };

    const getStatusBadgeClass = (color) => {
        const colors = {
            yellow: 'bg-yellow-100 text-yellow-800',
            blue: 'bg-blue-100 text-blue-800',
            green: 'bg-green-100 text-green-800',
            gray: 'bg-gray-100 text-gray-800',
        };
        return colors[color] || colors.gray;
    };

    return (
        <AppLayout user={auth.user}>
            <Head title="Expert System Point" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-6">
                        <div className="p-6">
                            <h2 className="text-2xl font-semibold text-gray-800">
                                📊 Expert System Point
                            </h2>
                            <p className="mt-1 text-sm text-gray-600">
                                Sistem otomatis konsekuensi & reward berdasarkan akumulasi poin santri
                            </p>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-6">
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                {/* Search */}
                                <div>
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleFilter()}
                                        placeholder="Cari kode atau santri..."
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    />
                                </div>

                                {/* Jenis */}
                                <div>
                                    <select
                                        value={jenis}
                                        onChange={(e) => setJenis(e.target.value)}
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    >
                                        <option value="all">Semua Jenis</option>
                                        <option value="konsekuensi">Konsekuensi</option>
                                        <option value="reward">Reward</option>
                                    </select>
                                </div>

                                {/* Status */}
                                <div>
                                    <select
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    >
                                        <option value="all">Semua Status</option>
                                        <option value="pending">Pending</option>
                                        <option value="diproses">Diproses</option>
                                        <option value="selesai">Selesai</option>
                                    </select>
                                </div>

                                {/* Santri */}
                                <div>
                                    <select
                                        value={santriId}
                                        onChange={(e) => setSantriId(e.target.value)}
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    >
                                        <option value="">Semua Santri</option>
                                        {santriList.map((santri) => (
                                            <option key={santri.id} value={santri.id}>
                                                {santri.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="mt-4">
                                <button
                                    onClick={handleFilter}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                                >
                                    🔍 Filter
                                </button>
                                <button
                                    onClick={() => {
                                        setSearch('');
                                        setJenis('all');
                                        setStatus('all');
                                        setSantriId('');
                                        router.get(route('expert-system-point.index'));
                                    }}
                                    className="ml-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                                >
                                    Reset
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Tanggal
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Santri
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Jenis
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Kode
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Konsekuensi/Reward
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Poin
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
                                    {laporanList.data.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                                                Tidak ada data
                                            </td>
                                        </tr>
                                    ) : (
                                        laporanList.data.map((laporan) => (
                                            <tr key={laporan.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {laporan.tanggal_trigger}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {laporan.santri?.nama_panggilan || '-'}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {laporan.santri?.nisn || '-'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getJenisBadgeClass(laporan.jenis)}`}>
                                                        {laporan.jenis_label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                                                    {laporan.kode}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-900">
                                                    {laporan.konsekuensi_atau_reward}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        Total: {laporan.total_poin_saat_trigger}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        Threshold: {laporan.threshold_poin_triggered}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(laporan.status_badge_color)}`}>
                                                        {laporan.status_label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <a
                                                        href={route('expert-system-point.show', laporan.id)}
                                                        className="text-indigo-600 hover:text-indigo-900 inline-flex items-center"
                                                    >
                                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                        Detail
                                                    </a>
                                                    {laporan.has_pdf && (
                                                        <>
                                                            <a
                                                                href={route('expert-system-point.download-pdf', laporan.id)}
                                                                className="ml-3 text-green-600 hover:text-green-900 inline-flex items-center"
                                                                title="Download PDF Rekam Medis"
                                                            >
                                                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                </svg>
                                                                PDF
                                                            </a>
                                                            <a
                                                                href={laporan.pdf_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="ml-2 text-blue-600 hover:text-blue-900 inline-flex items-center"
                                                                title="Lihat PDF di tab baru"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                                </svg>
                                                            </a>
                                                        </>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {laporanList.links && laporanList.links.length > 3 && (
                            <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                                <div className="flex justify-between items-center">
                                    <div className="text-sm text-gray-700">
                                        Showing {laporanList.from} to {laporanList.to} of {laporanList.total} results
                                    </div>
                                    <div className="flex gap-1">
                                        {laporanList.links.map((link, index) => (
                                            <button
                                                key={index}
                                                onClick={() => link.url && router.get(link.url)}
                                                disabled={!link.url}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                                className={`px-3 py-1 text-sm rounded ${
                                                    link.active
                                                        ? 'bg-indigo-600 text-white'
                                                        : link.url
                                                        ? 'bg-white text-gray-700 hover:bg-gray-100'
                                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                }`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}