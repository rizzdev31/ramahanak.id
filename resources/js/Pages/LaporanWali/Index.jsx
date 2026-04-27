import React, { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';

export default function Index({ auth, approvals, statistics, filter }) {
    const [activeFilter, setActiveFilter] = useState(filter || 'pending');

    const handleFilterChange = (newFilter) => {
        setActiveFilter(newFilter);
        router.get(route('laporan-wali.index'), { filter: newFilter }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const getJenisBadgeColor = (jenis) => {
        const colors = {
            'Pelanggaran': 'bg-red-100 text-red-800 border-red-300',
            'Apresiasi': 'bg-green-100 text-green-800 border-green-300',
            'Konselor': 'bg-blue-100 text-blue-800 border-blue-300',
        };
        return colors[jenis] || 'bg-gray-100 text-gray-800 border-gray-300';
    };

    const getStatusBadgeColor = (color) => {
        const colors = {
            'green': 'bg-green-100 text-green-800 border-green-300',
            'yellow': 'bg-yellow-100 text-yellow-800 border-yellow-300',
            'red': 'bg-red-100 text-red-800 border-red-300',
            'gray': 'bg-gray-100 text-gray-800 border-gray-300',
        };
        return colors[color] || 'bg-gray-100 text-gray-800 border-gray-300';
    };

    return (
        <AppLayout
            user={auth.user}
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    📋 Laporan Saya (Approval Wali)
                </h2>
            }
        >
            <Head title="Laporan Saya" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    
                    {/* Statistics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white rounded-lg shadow p-4">
                            <div className="text-sm text-gray-600">Total Laporan</div>
                            <div className="text-2xl font-bold text-gray-900">{statistics.total}</div>
                        </div>
                        <div className="bg-yellow-50 rounded-lg shadow p-4 border-l-4 border-yellow-500">
                            <div className="text-sm text-yellow-700">Pending</div>
                            <div className="text-2xl font-bold text-yellow-900">{statistics.pending}</div>
                        </div>
                        <div className="bg-green-50 rounded-lg shadow p-4 border-l-4 border-green-500">
                            <div className="text-sm text-green-700">Sudah Approve</div>
                            <div className="text-2xl font-bold text-green-900">{statistics.approved}</div>
                        </div>
                        <div className="bg-red-50 rounded-lg shadow p-4 border-l-4 border-red-500">
                            <div className="text-sm text-red-700">Overdue</div>
                            <div className="text-2xl font-bold text-red-900">{statistics.overdue}</div>
                        </div>
                    </div>

                    {/* Filter Buttons */}
                    <div className="bg-white rounded-lg shadow mb-6 p-4">
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => handleFilterChange('all')}
                                className={`px-4 py-2 rounded-md font-medium transition ${
                                    activeFilter === 'all'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                Semua ({statistics.total})
                            </button>
                            <button
                                onClick={() => handleFilterChange('pending')}
                                className={`px-4 py-2 rounded-md font-medium transition ${
                                    activeFilter === 'pending'
                                        ? 'bg-yellow-600 text-white'
                                        : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                                }`}
                            >
                                Pending ({statistics.pending})
                            </button>
                            <button
                                onClick={() => handleFilterChange('approved')}
                                className={`px-4 py-2 rounded-md font-medium transition ${
                                    activeFilter === 'approved'
                                        ? 'bg-green-600 text-white'
                                        : 'bg-green-50 text-green-700 hover:bg-green-100'
                                }`}
                            >
                                Sudah Approve ({statistics.approved})
                            </button>
                            <button
                                onClick={() => handleFilterChange('overdue')}
                                className={`px-4 py-2 rounded-md font-medium transition ${
                                    activeFilter === 'overdue'
                                        ? 'bg-red-600 text-white'
                                        : 'bg-red-50 text-red-700 hover:bg-red-100'
                                }`}
                            >
                                Overdue ({statistics.overdue})
                            </button>
                        </div>
                    </div>

                    {/* Approvals List */}
                    <div className="bg-white rounded-lg shadow">
                        {approvals.data.length === 0 ? (
                            <div className="px-6 py-12 text-center">
                                <div className="text-gray-400 mb-4">
                                    <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    Tidak Ada Laporan
                                </h3>
                                <p className="text-gray-500">
                                    {activeFilter === 'pending' 
                                        ? 'Tidak ada laporan yang perlu di-approve saat ini.'
                                        : 'Tidak ada laporan dengan filter ini.'}
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-200">
                                {approvals.data.map((approval) => (
                                    <div key={approval.id} className="px-6 py-5 hover:bg-gray-50 transition">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                {/* Header */}
                                                <div className="flex items-center gap-3 mb-3">
                                                    <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getJenisBadgeColor(approval.jenis_laporan_label)}`}>
                                                        {approval.jenis_laporan_label}
                                                    </span>
                                                    <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusBadgeColor(approval.status_badge_color)}`}>
                                                        {approval.status_label}
                                                    </span>
                                                    {approval.is_overdue && (
                                                        <span className="px-3 py-1 text-xs font-medium rounded-full border bg-red-100 text-red-800 border-red-300">
                                                            ⚠️ Overdue
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Kode & Santri */}
                                                <div className="mb-3">
                                                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                                        {approval.laporan.kode}
                                                    </h3>
                                                    {approval.santri && (
                                                        <div className="text-sm text-gray-600">
                                                            <span className="font-medium">Santri:</span> {approval.santri.nama} ({approval.santri.nisn})
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Info Grid */}
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm mb-3">
                                                    <div>
                                                        <span className="text-gray-600">Tanggal Kejadian:</span>
                                                        <span className="ml-2 font-medium text-gray-900">{approval.laporan.tanggal_kejadian}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-600">Deadline:</span>
                                                        <span className={`ml-2 font-medium ${approval.is_overdue ? 'text-red-600' : 'text-gray-900'}`}>
                                                            {approval.deadline_at}
                                                        </span>
                                                    </div>
                                                    {approval.remaining_hours !== null && !approval.is_approved && (
                                                        <div>
                                                            <span className="text-gray-600">Sisa Waktu:</span>
                                                            <span className={`ml-2 font-medium ${
                                                                approval.remaining_hours < 6 ? 'text-red-600' : 
                                                                approval.remaining_hours < 12 ? 'text-yellow-600' : 
                                                                'text-gray-900'
                                                            }`}>
                                                                {Math.floor(approval.remaining_hours)} jam
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Approval Progress */}
                                                {approval.laporan.approval_progress !== undefined && (
                                                    <div className="bg-gray-50 rounded-md p-3">
                                                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                                                            <span>Progress Approval</span>
                                                            <span>{approval.laporan.approval_progress}%</span>
                                                        </div>
                                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                                            <div 
                                                                className="h-2 rounded-full bg-blue-600 transition-all"
                                                                style={{ width: `${approval.laporan.approval_progress}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Catatan (jika sudah approve) */}
                                                {approval.is_approved && approval.catatan && (
                                                    <div className="mt-3 bg-green-50 border-l-4 border-green-500 p-3 rounded">
                                                        <div className="text-xs font-medium text-green-800 mb-1">
                                                            Catatan Anda:
                                                        </div>
                                                        <div className="text-sm text-green-700">
                                                            {approval.catatan}
                                                        </div>
                                                        <div className="text-xs text-green-600 mt-1">
                                                            Disetujui pada: {approval.approved_at}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Action Button */}
                                            <div className="ml-6">
                                                <Link
                                                    href={route('laporan-wali.show', approval.id)}
                                                    className={`inline-flex items-center px-4 py-2 rounded-md font-medium text-sm transition ${
                                                        approval.is_approved
                                                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                            : 'bg-blue-600 text-white hover:bg-blue-700'
                                                    }`}
                                                >
                                                    {approval.is_approved ? 'Lihat Detail' : 'Approve Sekarang'}
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Pagination */}
                        {approvals.links && approvals.links.length > 3 && (
                            <div className="px-6 py-4 border-t border-gray-200">
                                <div className="flex gap-2 justify-center">
                                    {approvals.links.map((link, index) => (
                                        <Link
                                            key={index}
                                            href={link.url || '#'}
                                            preserveState
                                            preserveScroll
                                            className={`px-3 py-1 rounded ${
                                                link.active
                                                    ? 'bg-blue-600 text-white'
                                                    : link.url
                                                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
            </div>
        </AppLayout>
    );
}