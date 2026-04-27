import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';

export default function Show({ auth, laporan }) {
    const { data, setData, post, processing, errors } = useForm({
        catatan_bk: laporan.catatan_bk || '',
    });

    const handleComplete = (e) => {
        e.preventDefault();
        if (confirm('Yakin ingin menyelesaikan laporan ini? Data akan tersimpan ke riwayat santri.')) {
            post(route('laporan-pelanggaran.complete', laporan.id));
        }
    };

    const canComplete = laporan.approval_status === 'pending_bk';
    const isCompleted = laporan.approval_status === 'selesai' || laporan.status === 'selesai';

    const getStatusBadgeColor = (status) => {
        const colors = {
            'pending': 'bg-yellow-100 text-yellow-800',
            'dalam_proses': 'bg-blue-100 text-blue-800',
            'selesai': 'bg-green-100 text-green-800',
            'diabaikan': 'bg-gray-100 text-gray-800',
            'pending_tenaga_pendidik': 'bg-yellow-100 text-yellow-800',
            'pending_bk': 'bg-blue-100 text-blue-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    return (
        <AppLayout
            user={auth.user}
            header={
                <div>
                    <Link 
                        href={route('laporan-pelanggaran.index')} 
                        className="text-blue-600 hover:text-blue-800 text-sm mb-2 inline-block"
                    >
                        ← Kembali ke List
                    </Link>
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Detail Laporan Pelanggaran
                    </h2>
                </div>
            }
        >
            <Head title={`Laporan ${laporan.kode_pelanggaran}`} />

            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">

                    {/* Status Badges */}
                    <div className="flex flex-wrap gap-3">
                        <span className={`px-4 py-2 text-sm font-medium rounded-full ${getStatusBadgeColor(laporan.approval_status || laporan.status)}`}>
                            {laporan.approval_status_label || laporan.status_label || laporan.status}
                        </span>
                        {laporan.has_overdue_approvals && (
                            <span className="px-4 py-2 text-sm font-medium rounded-full bg-red-100 text-red-800">
                                ⚠️ Ada Approval Overdue
                            </span>
                        )}
                    </div>

                    {/* Warning - Cannot Complete Yet */}
                    {!canComplete && !isCompleted && (
                        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-yellow-700">
                                        <strong>Belum Bisa Diselesaikan!</strong> Laporan masih menunggu approval dari Wali Kelas/Asrama. 
                                        Progress saat ini: <strong>{laporan.approval_progress || 0}%</strong>. Silakan tunggu hingga semua approval selesai.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Success - Already Completed */}
                    {isCompleted && (
                        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-green-700">
                                        <strong>Laporan Selesai!</strong> Laporan ini sudah diselesaikan dan tersimpan ke riwayat santri.
                                        {laporan.validated_at && ` (${laporan.validated_at})`}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Timeline Approval */}
                    {laporan.approvals && laporan.approvals.length > 0 && (
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Timeline Approval Wali Kelas/Asrama
                            </h3>

                            <div className="mb-4 bg-blue-50 rounded-md p-3">
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="font-medium text-blue-900">Progress Approval:</span>
                                    <span className="font-bold text-blue-900">{laporan.approval_progress || 0}%</span>
                                </div>
                                <div className="w-full bg-blue-200 rounded-full h-3">
                                    <div 
                                        className="h-3 rounded-full bg-blue-600 transition-all duration-500"
                                        style={{ width: `${laporan.approval_progress || 0}%` }}
                                    />
                                </div>
                                <div className="text-xs text-blue-700 mt-2">
                                    {laporan.approvals.filter(a => a.approved_at).length} dari {laporan.approvals.length} wali sudah approve
                                </div>
                            </div>

                            <div className="space-y-4">
                                {laporan.approvals.map((approval, index) => (
                                    <div key={approval.id} className="flex gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                                approval.is_approved ? 'bg-green-500' : 
                                                approval.is_overdue ? 'bg-red-500' : 
                                                'bg-yellow-500'
                                            }`}>
                                                {approval.is_approved ? (
                                                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                ) : (
                                                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                                    </svg>
                                                )}
                                            </div>
                                            {index < laporan.approvals.length - 1 && (
                                                <div className="w-0.5 h-full bg-gray-300 mt-2 flex-1"></div>
                                            )}
                                        </div>

                                        <div className="flex-1 pb-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="font-semibold text-gray-900">{approval.tenaga_pendidik_nama}</span>
                                                <span className="text-xs text-gray-500">({approval.tenaga_pendidik_role || 'Tenaga Pendidik'})</span>
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                    approval.is_approved ? 'bg-green-100 text-green-800' :
                                                    approval.is_overdue ? 'bg-red-100 text-red-800' :
                                                    'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                    {approval.status_label}
                                                </span>
                                            </div>

                                            {approval.catatan && (
                                                <div className={`rounded-md p-3 mt-2 border-l-4 ${
                                                    approval.is_approved 
                                                        ? 'bg-green-50 border-green-500' 
                                                        : 'bg-gray-50 border-gray-300'
                                                }`}>
                                                    <div className="text-xs font-medium text-gray-700 mb-1">
                                                        Catatan Wali:
                                                    </div>
                                                    <div className="text-sm text-gray-800 whitespace-pre-wrap">
                                                        {approval.catatan}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="text-xs text-gray-500 mt-2">
                                                {approval.is_approved ? (
                                                    <>✓ Disetujui pada: {approval.approved_at}</>
                                                ) : approval.is_overdue ? (
                                                    <>⚠️ Overdue - Deadline: {approval.deadline_at}</>
                                                ) : (
                                                    <>⏳ Deadline: {approval.deadline_at}</>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Laporan Detail */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Detail Laporan Pelanggaran
                        </h3>

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <div className="text-sm text-gray-600">Kode Pelanggaran</div>
                                    <div className="font-semibold text-gray-900 text-lg">{laporan.kode_pelanggaran}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-600">Tanggal Kejadian</div>
                                    <div className="font-semibold text-gray-900">{laporan.tanggal_kejadian}</div>
                                </div>
                            </div>

                            {/* Pelaku & Korban */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {laporan.pelaku && (
                                    <div>
                                        <div className="text-sm text-gray-600 mb-1">Pelaku</div>
                                        <div className="bg-red-50 rounded-md p-3 border-l-4 border-red-500">
                                            <div className="font-semibold text-gray-900">{laporan.pelaku.nama}</div>
                                            <div className="text-sm text-gray-600">NISN: {laporan.pelaku.nisn}</div>
                                        </div>
                                    </div>
                                )}
                                {laporan.korban && (
                                    <div>
                                        <div className="text-sm text-gray-600 mb-1">Korban</div>
                                        <div className="bg-blue-50 rounded-md p-3 border-l-4 border-blue-500">
                                            <div className="font-semibold text-gray-900">{laporan.korban.nama}</div>
                                            <div className="text-sm text-gray-600">NISN: {laporan.korban.nisn}</div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div>
                                <div className="text-sm text-gray-600 mb-1">Bobot Poin</div>
                                <div className="inline-block px-4 py-2 rounded-md font-bold bg-red-100 text-red-800">
                                    {laporan.bobot_poin} poin
                                </div>
                            </div>

                            <div>
                                <div className="text-sm text-gray-600 mb-1">Tindakan</div>
                                <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded">
                                    <div className="text-sm text-red-700">{laporan.tindakan_default}</div>
                                </div>
                            </div>

                            {laporan.variabel && (
                                <div>
                                    <div className="text-sm text-gray-600 mb-1">Kategori Pelanggaran</div>
                                    <div className="text-sm text-gray-900">
                                        <strong>{laporan.variabel.kategori}</strong>: {laporan.variabel.keterangan}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Catatan BK & Complete Form */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Catatan BK & Tindakan
                        </h3>

                        <form onSubmit={handleComplete}>
                            <div className="mb-4">
                                <InputLabel htmlFor="catatan_bk" value="Catatan BK" />
                                <textarea
                                    id="catatan_bk"
                                    value={data.catatan_bk}
                                    onChange={(e) => setData('catatan_bk', e.target.value)}
                                    rows="4"
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    placeholder="Tambahkan catatan untuk laporan ini..."
                                    disabled={isCompleted}
                                />
                                <InputError message={errors.catatan_bk} className="mt-2" />
                            </div>

                            <div className="flex gap-3">
                                {!isCompleted && (
                                    <>
                                        <PrimaryButton
                                            type="submit"
                                            disabled={processing || !canComplete}
                                            className={!canComplete ? 'opacity-50 cursor-not-allowed' : ''}
                                        >
                                            {processing ? 'Menyimpan...' : '✓ Selesaikan Laporan'}
                                        </PrimaryButton>
                                        {!canComplete && (
                                            <div className="flex items-center text-sm text-yellow-700 bg-yellow-50 px-3 py-2 rounded-md">
                                                ⚠️ Tunggu approval dari semua wali ({laporan.approval_progress || 0}%)
                                            </div>
                                        )}
                                    </>
                                )}

                                {isCompleted && (
                                    <div className="flex items-center text-sm text-green-700 bg-green-50 px-3 py-2 rounded-md">
                                        ✓ Laporan sudah diselesaikan
                                    </div>
                                )}

                                <SecondaryButton type="button" onClick={() => window.history.back()}>
                                    Kembali
                                </SecondaryButton>
                            </div>
                        </form>
                    </div>

                    {/* Laporan Awal */}
                    {laporan.laporan_awal && laporan.laporan_awal.text_laporan && (
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                Laporan Awal
                            </h3>
                            <div className="bg-gray-50 rounded-md p-4">
                                <div className="text-sm text-gray-700 whitespace-pre-wrap">
                                    {laporan.laporan_awal.text_laporan}
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </AppLayout>
    );
}