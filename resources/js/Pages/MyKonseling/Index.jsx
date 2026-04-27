import React from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';

export default function Index({ auth, laporans }) {
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
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    🧠 Konseling Saya
                </h2>
            }
        >
            <Head title="Konseling Saya" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    
                    {/* Info Box */}
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-blue-700">
                                    Halaman ini menampilkan riwayat konseling yang Anda jalani. 
                                    Anda dapat melihat progress dan catatan dari setiap sesi bimbingan.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Konseling List */}
                    <div className="bg-white rounded-lg shadow">
                        {laporans.data.length === 0 ? (
                            <div className="px-6 py-12 text-center">
                                <div className="text-gray-400 mb-4">
                                    <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    Belum Ada Konseling
                                </h3>
                                <p className="text-gray-500">
                                    Saat ini belum ada catatan konseling untuk Anda.
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-200">
                                {laporans.data.map((laporan) => (
                                    <div key={laporan.id} className="px-6 py-5 hover:bg-gray-50 transition">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                {/* Header */}
                                                <div className="flex items-center gap-3 mb-3">
                                                    <h3 className="text-lg font-semibold text-gray-900">
                                                        {laporan.diagnosis_nama}
                                                    </h3>
                                                    <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusBadgeClass(laporan.status)}`}>
                                                        {laporan.status_label}
                                                    </span>
                                                </div>

                                                {/* Info Grid */}
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-3">
                                                    <div>
                                                        <span className="text-gray-600">Rule:</span>
                                                        <span className="ml-2 font-medium text-gray-900">{laporan.rule_kode}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-600">Kategori:</span>
                                                        <span className="ml-2 font-medium text-gray-900 capitalize">{laporan.rule_kategori}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-600">Tanggal Mulai:</span>
                                                        <span className="ml-2 font-medium text-gray-900">
                                                            {new Date(laporan.tanggal_trigger).toLocaleDateString('id-ID')}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Progress */}
                                                {laporan.status !== 'pending' && (
                                                    <div className="mb-3">
                                                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                                                            <span>Progress Konseling</span>
                                                            <span>Sesi {laporan.sesi_bimbingan_terakhir}/5</span>
                                                        </div>
                                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                                            <div 
                                                                className={`h-2 rounded-full transition-all ${
                                                                    laporan.is_completed ? 'bg-green-600' : 'bg-blue-600'
                                                                }`}
                                                                style={{ width: `${laporan.progress_percentage}%` }}
                                                            />
                                                        </div>
                                                        <div className="flex gap-1 mt-2">
                                                            {[1, 2, 3, 4, 5].map((num) => (
                                                                <div
                                                                    key={num}
                                                                    className={`flex-1 h-1.5 rounded ${
                                                                        num <= laporan.sesi_bimbingan_terakhir
                                                                            ? 'bg-green-500'
                                                                            : 'bg-gray-200'
                                                                    }`}
                                                                    title={`Sesi ${num}`}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Rekomendasi Preview */}
                                                <div className="bg-gray-50 rounded-md p-3">
                                                    <div className="text-xs font-medium text-gray-700 mb-1">
                                                        Rekomendasi Sistem
                                                    </div>
                                                    <div className="text-sm text-gray-600 line-clamp-2">
                                                        {laporan.rekomendasi_sistem}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action Button */}
                                            <div className="ml-6">
                                                <Link
                                                    href={route('my-konseling.show', laporan.id)}
                                                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-sm font-medium"
                                                >
                                                    Lihat Detail
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Pagination */}
                        {laporans.links && laporans.links.length > 3 && (
                            <div className="px-6 py-4 border-t border-gray-200">
                                <div className="flex gap-2 justify-center">
                                    {laporans.links.map((link, index) => (
                                        <Link
                                            key={index}
                                            href={link.url || '#'}
                                            disabled={!link.url}
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