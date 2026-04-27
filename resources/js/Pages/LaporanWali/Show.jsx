import React, { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Show({ auth, approval }) {
    const [showApprovalForm, setShowApprovalForm] = useState(!approval.is_approved);

    const { data, setData, post, processing, errors } = useForm({
        catatan: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('laporan-wali.approve', approval.id), {
            preserveScroll: true,
            onSuccess: () => {
                setShowApprovalForm(false);
            },
        });
    };

    const laporan = approval.laporan;

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
            'blue': 'bg-blue-100 text-blue-800 border-blue-300',
            'gray': 'bg-gray-100 text-gray-800 border-gray-300',
        };
        return colors[color] || 'bg-gray-100 text-gray-800 border-gray-300';
    };

    return (
        <AppLayout
            user={auth.user}
            header={
                <div>
                    <Link 
                        href={route('laporan-wali.index')} 
                        className="text-blue-600 hover:text-blue-800 text-sm mb-2 inline-block"
                    >
                        ← Kembali ke List
                    </Link>
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Detail Laporan - Approval Wali
                    </h2>
                </div>
            }
        >
            <Head title={`Approval - ${laporan.kode_pelanggaran || laporan.kode_apresiasi || laporan.kode_konselor}`} />

            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">

                    {/* Status Badges */}
                    <div className="flex flex-wrap gap-3">
                        <span className={`px-4 py-2 text-sm font-medium rounded-full border ${getJenisBadgeColor(approval.jenis_laporan_label)}`}>
                            {approval.jenis_laporan_label}
                        </span>
                        <span className={`px-4 py-2 text-sm font-medium rounded-full border ${getStatusBadgeColor(approval.status_badge_color)}`}>
                            {approval.status_label}
                        </span>
                        {approval.is_overdue && (
                            <span className="px-4 py-2 text-sm font-medium rounded-full border bg-red-100 text-red-800 border-red-300">
                                ⚠️ Overdue
                            </span>
                        )}
                    </div>

                    {/* Warning - Overdue */}
                    {approval.is_overdue && !approval.is_approved && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-red-700">
                                        <strong>Laporan Overdue!</strong> Deadline approval sudah terlewat ({approval.deadline_at}). 
                                        Segera berikan approval dan catatan Anda.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Info - Already Approved */}
                    {approval.is_approved && (
                        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-green-700">
                                        <strong>Sudah Di-Approve</strong> pada {approval.approved_at}. 
                                        Laporan ini sudah mendapat persetujuan Anda.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Approval Form (if not approved) */}
                    {showApprovalForm && !approval.is_approved && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                📝 Form Approval
                            </h3>

                            <form onSubmit={handleSubmit}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Catatan Wali <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        value={data.catatan}
                                        onChange={(e) => setData('catatan', e.target.value)}
                                        rows="6"
                                        className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        placeholder="Tuliskan catatan atau komentar Anda terkait laporan ini..."
                                        required
                                    />
                                    {errors.catatan && (
                                        <div className="text-red-600 text-sm mt-1">{errors.catatan}</div>
                                    )}
                                    <div className="text-xs text-gray-500 mt-1">
                                        Catatan wajib diisi. Berikan informasi yang relevan untuk BK.
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
                                    >
                                        {processing ? 'Menyimpan...' : '✓ Approve Laporan'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowApprovalForm(false)}
                                        className="px-6 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 font-medium"
                                    >
                                        Batal
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Catatan (if already approved) */}
                    {approval.is_approved && approval.catatan && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                📝 Catatan Anda
                            </h3>
                            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                                <div className="text-sm text-green-700 whitespace-pre-wrap">
                                    {approval.catatan}
                                </div>
                                <div className="text-xs text-green-600 mt-2">
                                    Disetujui pada: {approval.approved_at}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Laporan Detail */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Detail Laporan
                        </h3>

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <div className="text-sm text-gray-600">Kode Laporan</div>
                                    <div className="font-semibold text-gray-900">
                                        {laporan.kode_pelanggaran || laporan.kode_apresiasi || laporan.kode_konselor}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-600">Tanggal Kejadian</div>
                                    <div className="font-semibold text-gray-900">{laporan.tanggal_kejadian}</div>
                                </div>
                            </div>

                            {/* Santri Info */}
                            {approval.santri && (
                                <div>
                                    <div className="text-sm text-gray-600 mb-1">Santri</div>
                                    <div className="bg-gray-50 rounded-md p-3">
                                        <div className="font-semibold text-gray-900">{approval.santri.nama}</div>
                                        <div className="text-sm text-gray-600">NISN: {approval.santri.nisn}</div>
                                    </div>
                                </div>
                            )}

                            {/* Tindakan/Reward/Diagnosis */}
                            {laporan.tindakan_default && (
                                <div>
                                    <div className="text-sm text-gray-600 mb-1">Tindakan</div>
                                    <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded">
                                        <div className="text-sm text-red-700">{laporan.tindakan_default}</div>
                                    </div>
                                </div>
                            )}

                            {laporan.reward_default && (
                                <div>
                                    <div className="text-sm text-gray-600 mb-1">Reward</div>
                                    <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded">
                                        <div className="text-sm text-green-700">{laporan.reward_default}</div>
                                    </div>
                                </div>
                            )}

                            {laporan.diagnosis_default && (
                                <div>
                                    <div className="text-sm text-gray-600 mb-1">Diagnosis</div>
                                    <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
                                        <div className="text-sm text-blue-700">{laporan.diagnosis_default}</div>
                                    </div>
                                </div>
                            )}

                            {/* Bobot Poin */}
                            {laporan.bobot_poin !== undefined && laporan.bobot_poin !== null && (
                                <div>
                                    <div className="text-sm text-gray-600 mb-1">Bobot Poin</div>
                                    <div className={`inline-block px-3 py-1 rounded-md font-semibold ${
                                        laporan.bobot_poin > 0 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-red-100 text-red-800'
                                    }`}>
                                        {laporan.bobot_poin > 0 ? '+' : ''}{laporan.bobot_poin} poin
                                    </div>
                                </div>
                            )}

                            {/* Status Approval */}
                            <div>
                                <div className="text-sm text-gray-600 mb-1">Status Approval</div>
                                <div className="flex items-center gap-2">
                                    <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getStatusBadgeColor(laporan.approval_status_badge)}`}>
                                        {laporan.approval_status_label}
                                    </span>
                                    {laporan.approval_progress !== undefined && (
                                        <span className="text-sm text-gray-600">
                                            ({laporan.approval_progress}% complete)
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Timeline Approval (All Approvals) */}
                    {laporan.approvals && laporan.approvals.length > 0 && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                Timeline Approval
                            </h3>

                            <div className="space-y-4">
                                {laporan.approvals.map((appr, index) => (
                                    <div key={appr.id} className="flex gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                                appr.is_approved ? 'bg-green-500' : 
                                                appr.is_overdue ? 'bg-red-500' : 
                                                'bg-yellow-500'
                                            }`}>
                                                {appr.is_approved ? (
                                                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                ) : (
                                                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                                    </svg>
                                                )}
                                            </div>
                                            {index < laporan.approvals.length - 1 && (
                                                <div className="w-0.5 h-full bg-gray-300 mt-2"></div>
                                            )}
                                        </div>

                                        <div className="flex-1 pb-4">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-semibold text-gray-900">{appr.tenaga_pendidik_nama}</span>
                                                <span className="text-xs text-gray-500">({appr.tenaga_pendidik_role})</span>
                                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getStatusBadgeColor(appr.status_badge_color)}`}>
                                                    {appr.status_label}
                                                </span>
                                            </div>

                                            {appr.catatan && (
                                                <div className="bg-gray-50 rounded-md p-3 mt-2">
                                                    <div className="text-sm text-gray-700 whitespace-pre-wrap">
                                                        {appr.catatan}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="text-xs text-gray-500 mt-2">
                                                {appr.is_approved ? (
                                                    <>Disetujui pada: {appr.approved_at}</>
                                                ) : (
                                                    <>Deadline: {appr.deadline_at}</>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Laporan Awal Text */}
                    {laporan.laporan_awal && laporan.laporan_awal.text_laporan && (
                        <div className="bg-white rounded-lg shadow p-6">
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