import React from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';

export default function Show({ auth, laporan }) {
    const getStatusBadgeClass = (status) => {
        const classes = {
            'pending': 'bg-yellow-100 text-yellow-800 border-yellow-300',
            'in_progress': 'bg-blue-100 text-blue-800 border-blue-300',
            'completed': 'bg-green-100 text-green-800 border-green-300',
            'discontinued': 'bg-red-100 text-red-800 border-red-300'
        };
        return classes[status] || 'bg-gray-100 text-gray-800 border-gray-300';
    };

    const getStatusSantriBadge = (status) => {
        const badges = {
            'membaik': { class: 'bg-green-100 text-green-800 border-green-300', icon: '✅' },
            'stabil': { class: 'bg-blue-100 text-blue-800 border-blue-300', icon: '➡️' },
            'masih_bermasalah': { class: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: '⚠️' },
            'memburuk': { class: 'bg-red-100 text-red-800 border-red-300', icon: '❌' }
        };
        return badges[status] || { class: 'bg-gray-100 text-gray-800 border-gray-300', icon: '•' };
    };

    return (
        <AppLayout
            user={auth.user}
            header={
                <div className="flex justify-between items-center">
                    <div>
                        <Link 
                            href={route('my-konseling.index')} 
                            className="text-blue-600 hover:text-blue-800 text-sm mb-2 inline-block"
                        >
                            ← Kembali ke List
                        </Link>
                        <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                            Detail Konseling Saya
                        </h2>
                    </div>
                    <span className={`px-4 py-2 text-sm font-medium rounded-full border ${getStatusBadgeClass(laporan.status)}`}>
                        {laporan.status_label}
                    </span>
                </div>
            }
        >
            <Head title={`Konseling - ${laporan.diagnosis_nama}`} />

            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">

                    {/* Info Box - Status Konseling */}
                    {laporan.status === 'pending' && (
                        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-yellow-700">
                                        Konseling Anda sedang menunggu persetujuan dari Guru BK. 
                                        Anda akan dihubungi segera untuk memulai sesi bimbingan.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {laporan.status === 'in_progress' && (
                        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-blue-700">
                                        Konseling sedang berlangsung. 
                                        Ikuti arahan dari Guru BK dan patuhi rencana tindak lanjut yang telah disepakati.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {laporan.status === 'completed' && (
                        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-green-700">
                                        Konseling telah selesai. 
                                        Terus pertahankan perkembangan positif yang telah dicapai!
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Progress Bar */}
                    {laporan.status !== 'pending' && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Progress Konseling</h3>
                            <div className="mb-3">
                                <div className="flex justify-between text-sm text-gray-600 mb-2">
                                    <span>Sesi {laporan.sesi_bimbingan_terakhir} dari 5</span>
                                    <span>{laporan.progress_percentage}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-4">
                                    <div 
                                        className={`h-4 rounded-full transition-all ${
                                            laporan.is_completed ? 'bg-green-600' : 'bg-blue-600'
                                        }`}
                                        style={{ width: `${laporan.progress_percentage}%` }}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2 mt-4">
                                {[1, 2, 3, 4, 5].map((num) => (
                                    <div key={num} className="flex-1 text-center">
                                        <div
                                            className={`h-3 rounded mb-1 ${
                                                num <= laporan.sesi_bimbingan_terakhir
                                                    ? 'bg-green-500'
                                                    : 'bg-gray-200'
                                            }`}
                                        />
                                        <div className="text-xs text-gray-600">Sesi {num}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Diagnosis & Rekomendasi */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Diagnosis & Rekomendasi</h3>
                        
                        <div className="space-y-4">
                            <div>
                                <div className="text-sm text-gray-600 mb-1">Diagnosis</div>
                                <div className="font-semibold text-gray-900 text-lg">
                                    {laporan.diagnosis_kode} - {laporan.diagnosis_nama}
                                </div>
                            </div>

                            {laporan.diagnosis_penjelasan && (
                                <div>
                                    <div className="text-sm text-gray-600 mb-1">Penjelasan</div>
                                    <div className="text-gray-700">
                                        {laporan.diagnosis_penjelasan}
                                    </div>
                                </div>
                            )}

                            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                                <div className="text-sm font-medium text-blue-800 mb-1">
                                    Rekomendasi untuk Anda
                                </div>
                                <div className="text-blue-700">
                                    {laporan.rekomendasi_sistem}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Riwayat Sesi Bimbingan */}
                    {laporan.sesi_list && laporan.sesi_list.length > 0 && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Riwayat Sesi Bimbingan</h3>
                            
                            <div className="space-y-4">
                                {laporan.sesi_list.map((sesi) => {
                                    const statusBadge = getStatusSantriBadge(sesi.status_santri);
                                    return (
                                        <div key={sesi.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <h4 className="font-semibold text-gray-900 text-lg">
                                                        Sesi {sesi.sesi_ke}
                                                    </h4>
                                                    <div className="text-sm text-gray-600">
                                                        {new Date(sesi.tanggal_sesi).toLocaleDateString('id-ID', {
                                                            weekday: 'long',
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric'
                                                        })}
                                                    </div>
                                                </div>
                                                {sesi.status_santri && (
                                                    <span className={`px-3 py-1 text-sm font-medium rounded-full border ${statusBadge.class}`}>
                                                        {statusBadge.icon} {sesi.status_santri_label}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="space-y-3">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-700 mb-1">
                                                        Catatan Guru BK
                                                    </div>
                                                    <div className="text-gray-900 bg-white p-3 rounded border border-gray-200">
                                                        {sesi.catatan_bk}
                                                    </div>
                                                </div>

                                                {sesi.proses_bimbingan && (
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-700 mb-1">
                                                            Proses Bimbingan
                                                        </div>
                                                        <div className="text-gray-700">
                                                            {sesi.proses_bimbingan}
                                                        </div>
                                                    </div>
                                                )}

                                                {sesi.rencana_tindak_lanjut && (
                                                    <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded">
                                                        <div className="text-sm font-medium text-yellow-800 mb-1">
                                                            📋 Yang Perlu Anda Lakukan
                                                        </div>
                                                        <div className="text-yellow-700">
                                                            {sesi.rencana_tindak_lanjut}
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex items-center gap-2 text-sm pt-2 border-t border-gray-200">
                                                    {sesi.lanjut_sesi_berikutnya ? (
                                                        <span className="text-blue-600 flex items-center gap-1">
                                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                                            </svg>
                                                            Dilanjutkan ke sesi berikutnya
                                                        </span>
                                                    ) : (
                                                        <span className="text-green-600 flex items-center gap-1">
                                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                            </svg>
                                                            Selesai di sesi ini
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Catatan Kolaboratif (Optional - jika ada yang public) */}
                    {laporan.catatan_kolaboratif && laporan.catatan_kolaboratif.length > 0 && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                Catatan Tambahan
                            </h3>
                            
                            <div className="space-y-4">
                                {laporan.catatan_kolaboratif.map((catatan) => (
                                    <div key={catatan.id} className="border-l-4 border-indigo-500 pl-4 py-2">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <div className="font-medium text-gray-900">{catatan.judul}</div>
                                                <div className="text-sm text-gray-600">
                                                    {catatan.author_role_label}
                                                    <span className="mx-1">•</span>
                                                    {new Date(catatan.created_at).toLocaleDateString('id-ID')}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-gray-700">
                                            {catatan.isi_catatan}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Info Footer */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600">
                        <p className="mb-2">
                            <strong>Catatan:</strong> Halaman ini menampilkan informasi konseling Anda. 
                            Ikuti setiap arahan dan rencana tindak lanjut yang diberikan oleh Guru BK.
                        </p>
                        <p>
                            Jika ada pertanyaan atau masalah, silakan hubungi Guru BK Anda.
                        </p>
                    </div>

                </div>
            </div>
        </AppLayout>
    );
}