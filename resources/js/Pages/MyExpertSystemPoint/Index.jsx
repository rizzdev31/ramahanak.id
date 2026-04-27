import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';

export default function Index({ auth, laporans, filters }) {
    const handleFilter = (key, value) => {
        router.get(route('my-expert-system-point.index'), {
            ...filters,
            [key]: value,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const getBadgeClass = (color) => {
        const colors = {
            yellow: 'bg-yellow-100 text-yellow-800',
            green: 'bg-green-100 text-green-800',
            red: 'bg-red-100 text-red-800',
            purple: 'bg-purple-100 text-purple-800',
            blue: 'bg-blue-100 text-blue-800',
            gray: 'bg-gray-100 text-gray-800',
        };
        return colors[color] || colors.gray;
    };

    const getDeadlineClass = (sisaHari) => {
        if (sisaHari === null) return 'text-gray-500';
        if (sisaHari < 0) return 'text-red-600 font-bold';
        if (sisaHari <= 3) return 'text-orange-600 font-semibold';
        return 'text-green-600';
    };

    return (
        <AppLayout
            user={auth.user}
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    🎯 Konsekuensi & Reward Saya
                </h2>
            }
        >
            <Head title="Konsekuensi & Reward Saya" />

            <div className="py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    {/* Filter Section */}
                    <div className="bg-white shadow-sm rounded-lg p-4 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            
                            {/* Filter Status */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select
                                    value={filters.status || 'all'}
                                    onChange={(e) => handleFilter('status', e.target.value)}
                                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                >
                                    <option value="all">Semua Status</option>
                                    <option value="in_progress">Perlu Upload Bukti</option>
                                    <option value="completed">Menunggu Review BK</option>
                                    <option value="verified">Verified ✅</option>
                                    <option value="overdue">Terlambat</option>
                                </select>
                            </div>

                            {/* Filter Jenis */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Jenis</label>
                                <select
                                    value={filters.jenis || 'all'}
                                    onChange={(e) => handleFilter('jenis', e.target.value)}
                                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                >
                                    <option value="all">Semua Jenis</option>
                                    <option value="konsekuensi">Konsekuensi ⚠️</option>
                                    <option value="reward">Reward ⭐</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* List Laporan */}
                    <div className="space-y-4">
                        {laporans.data.length > 0 ? (
                            laporans.data.map((laporan) => (
                                <div key={laporan.id} className="bg-white shadow-sm rounded-lg p-6 hover:shadow-md transition">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-2xl">
                                                    {laporan.jenis === 'konsekuensi' ? '⚠️' : '⭐'}
                                                </span>
                                                <div>
                                                    <h3 className="text-lg font-semibold text-gray-900">
                                                        {laporan.kode} - {laporan.konsekuensi_atau_reward}
                                                    </h3>
                                                    <p className="text-sm text-gray-500">
                                                        Trigger: {laporan.tanggal_trigger}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end gap-2">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getBadgeClass(laporan.final_status_badge_color)}`}>
                                                {laporan.final_status_label}
                                            </span>
                                            
                                            {laporan.tanggal_batas_pelaksanaan && (
                                                <div className="text-right">
                                                    <div className="text-xs text-gray-500">Deadline:</div>
                                                    <div className={`text-sm font-semibold ${getDeadlineClass(laporan.sisa_hari_deadline)}`}>
                                                        {laporan.sisa_hari_deadline < 0 
                                                            ? `Terlambat ${Math.abs(laporan.sisa_hari_deadline)} hari` 
                                                            : laporan.sisa_hari_deadline === 0
                                                            ? 'Hari ini!'
                                                            : `${laporan.sisa_hari_deadline} hari lagi`
                                                        }
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Info Grid */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-sm">
                                        <div>
                                            <span className="text-gray-500">Selesai:</span>
                                            <p className="font-medium">{laporan.tanggal_selesai || '-'}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Bukti:</span>
                                            <p className="font-medium">
                                                {laporan.buktis_count > 0 
                                                    ? `${laporan.buktis_count} file` 
                                                    : 'Belum upload'
                                                }
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Review:</span>
                                            <p className="font-medium">
                                                {laporan.bukti_approved 
                                                    ? '✅ Approved' 
                                                    : laporan.has_bukti 
                                                    ? '⏳ Pending' 
                                                    : '-'
                                                }
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">BK:</span>
                                            <p className="font-medium text-xs">{laporan.validator?.nama || '-'}</p>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        <Link
                                            href={route('my-expert-system-point.show', laporan.id)}
                                            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium"
                                        >
                                            👁️ Lihat Detail
                                        </Link>

                                        {laporan.can_upload_bukti && (
                                            <Link
                                                href={route('my-expert-system-point.show', laporan.id)}
                                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
                                            >
                                                📤 Upload Bukti
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="bg-white shadow-sm rounded-lg p-12 text-center">
                                <svg className="mx-auto h-16 w-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <p className="text-gray-500 text-lg font-medium">Belum ada konsekuensi atau reward</p>
                                <p className="text-gray-400 text-sm mt-2">Pertahankan perilaku baik Anda! 💪</p>
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {laporans.links && (
                        <div className="mt-6 flex justify-between items-center">
                            <div className="text-sm text-gray-500">
                                Menampilkan {laporans.from || 0} - {laporans.to || 0} dari {laporans.total} laporan
                            </div>
                            <div className="flex gap-1">
                                {laporans.links.map((link, index) => (
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
                    )}
                </div>
            </div>
        </AppLayout>
    );
}