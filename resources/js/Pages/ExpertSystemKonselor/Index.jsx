import React, { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';

export default function Index({ auth, laporans, statistics, filter }) {
    const [activeFilter, setActiveFilter] = useState(filter || 'all');

    const handleFilterChange = (newFilter) => {
        setActiveFilter(newFilter);
        router.get(route('expert-system-konselor.index'), { filter: newFilter }, {
            preserveState: true,
            preserveScroll: true
        });
    };

    const getStatusBadgeClass = (status) => {
        const classes = {
            'pending': 'bg-yellow-100 text-yellow-800 border-yellow-300',
            'in_progress': 'bg-blue-100 text-blue-800 border-blue-300',
            'completed': 'bg-green-100 text-green-800 border-green-300',
            'discontinued': 'bg-red-100 text-red-800 border-red-300'
        };
        return classes[status] || 'bg-gray-100 text-gray-800 border-gray-300';
    };

    return (
        <AppLayout
            user={auth.user}
            header={
                <div className="flex justify-between items-center">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Expert System Konselor
                    </h2>
                </div>
            }
        >
            <Head title="Expert System Konselor" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    
                    {/* Statistics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="text-sm text-gray-600 mb-1">Total Laporan</div>
                            <div className="text-2xl font-bold text-gray-900">{statistics.total}</div>
                        </div>
                        <div className="bg-yellow-50 rounded-lg shadow p-6 border border-yellow-200">
                            <div className="text-sm text-yellow-700 mb-1">Pending</div>
                            <div className="text-2xl font-bold text-yellow-800">{statistics.pending}</div>
                        </div>
                        <div className="bg-blue-50 rounded-lg shadow p-6 border border-blue-200">
                            <div className="text-sm text-blue-700 mb-1">In Progress</div>
                            <div className="text-2xl font-bold text-blue-800">{statistics.in_progress}</div>
                        </div>
                        <div className="bg-green-50 rounded-lg shadow p-6 border border-green-200">
                            <div className="text-sm text-green-700 mb-1">Completed</div>
                            <div className="text-2xl font-bold text-green-800">{statistics.completed}</div>
                        </div>
                    </div>

                    {/* Filter Buttons */}
                    <div className="bg-white rounded-lg shadow mb-6">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <div className="flex gap-2">
                                {['all', 'pending', 'in_progress', 'completed'].map((filterOption) => (
                                    <button
                                        key={filterOption}
                                        onClick={() => handleFilterChange(filterOption)}
                                        className={`px-4 py-2 rounded-md font-medium transition ${
                                            activeFilter === filterOption
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        {filterOption === 'all' && 'Semua'}
                                        {filterOption === 'pending' && 'Pending'}
                                        {filterOption === 'in_progress' && 'In Progress'}
                                        {filterOption === 'completed' && 'Completed'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Laporan List */}
                        <div className="divide-y divide-gray-200">
                            {laporans.data.length === 0 ? (
                                <div className="px-6 py-12 text-center text-gray-500">
                                    Tidak ada laporan dengan filter ini.
                                </div>
                            ) : (
                                laporans.data.map((laporan) => (
                                    <div key={laporan.id} className="px-6 py-4 hover:bg-gray-50 transition">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-lg font-semibold text-gray-900">
                                                        {laporan.santri?.santri_profile?.nama_lengkap || 'Unknown'}
                                                    </h3>
                                                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusBadgeClass(laporan.status)}`}>
                                                        {laporan.status_label}
                                                    </span>
                                                </div>
                                                
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                                                    <div>
                                                        <span className="text-gray-600">Rule:</span>
                                                        <span className="ml-2 font-medium text-gray-900">{laporan.rule_kode}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-600">Kategori:</span>
                                                        <span className="ml-2 font-medium text-gray-900 capitalize">{laporan.rule_kategori}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-600">Sesi:</span>
                                                        <span className="ml-2 font-medium text-gray-900">{laporan.sesi_bimbingan_terakhir}/5</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-600">Tanggal Trigger:</span>
                                                        <span className="ml-2 font-medium text-gray-900">
                                                            {new Date(laporan.tanggal_trigger).toLocaleDateString('id-ID')}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="bg-gray-50 rounded-md p-3 mb-3">
                                                    <div className="text-sm font-medium text-gray-700 mb-1">
                                                        Diagnosis: {laporan.diagnosis_nama}
                                                    </div>
                                                    <div className="text-sm text-gray-600 line-clamp-2">
                                                        {laporan.rekomendasi_sistem}
                                                    </div>
                                                </div>

                                                {/* Progress Bar */}
                                                {laporan.status !== 'pending' && (
                                                    <div className="mb-2">
                                                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                                                            <span>Progress</span>
                                                            <span>{laporan.progress_percentage}%</span>
                                                        </div>
                                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                                            <div 
                                                                className={`h-2 rounded-full transition-all ${
                                                                    laporan.is_completed ? 'bg-green-600' : 'bg-blue-600'
                                                                }`}
                                                                style={{ width: `${laporan.progress_percentage}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="ml-6">
                                                <Link
                                                    href={route('expert-system-konselor.show', laporan.id)}
                                                    className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
                                                >
                                                    Detail
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Pagination */}
                        {laporans.links && laporans.links.length > 3 && (
                            <div className="px-6 py-4 border-t border-gray-200">
                                <div className="flex gap-2 justify-center">
                                    {laporans.links.map((link, index) => (
                                        <button
                                            key={index}
                                            onClick={() => link.url && router.get(link.url)}
                                            disabled={!link.url}
                                            className={`px-3 py-1 rounded ${
                                                link.active
                                                    ? 'bg-indigo-600 text-white'
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