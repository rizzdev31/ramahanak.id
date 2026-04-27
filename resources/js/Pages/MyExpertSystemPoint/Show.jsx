import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import BuktiUploadForm from '@/Components/BuktiUploadForm';

export default function Show({ auth, laporan }) {
    const [showUploadForm, setShowUploadForm] = useState(false);

    const { delete: destroy, processing: deleting } = useForm();

    const handleDeleteBukti = (buktiId) => {
        if (!confirm('Yakin ingin menghapus bukti ini?')) return;

        destroy(route('my-expert-system-point.delete-bukti', buktiId), {
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
        if (sisaHari < 0) return 'text-red-600';
        if (sisaHari <= 3) return 'text-orange-600';
        return 'text-green-600';
    };

    return (
        <AppLayout
            user={auth.user}
            header={
                <div className="flex justify-between items-center">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Detail {laporan.jenis === 'konsekuensi' ? 'Konsekuensi' : 'Reward'}
                    </h2>
                    <Link
                        href={route('my-expert-system-point.index')}
                        className="text-sm text-indigo-600 hover:text-indigo-900"
                    >
                        ← Kembali ke List
                    </Link>
                </div>
            }
        >
            <Head title={`Detail ${laporan.kode}`} />

            <div className="py-8">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

                    {/* Header Info */}
                    <div className="bg-white shadow-sm rounded-lg p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-3xl">
                                        {laporan.jenis === 'konsekuensi' ? '⚠️' : '⭐'}
                                    </span>
                                    <div>
                                        <h2 className="text-2xl font-semibold text-gray-800">
                                            {laporan.kode} - {laporan.konsekuensi_atau_reward}
                                        </h2>
                                        <p className="text-sm text-gray-600">
                                            Triggered: {laporan.tanggal_trigger}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getBadgeClass(laporan.final_status_badge_color)}`}>
                                {laporan.final_status_label}
                            </span>
                        </div>
                    </div>

                    {/* Deadline & Kesepakatan */}
                    {laporan.tanggal_batas_pelaksanaan && (
                        <div className={`shadow-sm rounded-lg p-6 border-2 ${
                            laporan.is_terlambat ? 'bg-red-50 border-red-300' : 'bg-orange-50 border-orange-300'
                        }`}>
                            <h3 className="text-lg font-semibold mb-4 flex items-center">
                                <span className="mr-2">⏰</span> Deadline & Kesepakatan
                                {laporan.is_terlambat && <span className="ml-2 text-red-600 text-sm">🔴 TERLAMBAT!</span>}
                            </h3>
                            
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <p className="text-sm text-gray-600">Deadline Pelaksanaan</p>
                                    <p className="font-semibold text-lg">{laporan.tanggal_batas_pelaksanaan}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Sisa Waktu</p>
                                    <p className={`font-semibold text-lg ${getDeadlineClass(laporan.sisa_hari_deadline)}`}>
                                        {laporan.sisa_hari_deadline < 0 
                                            ? `Terlambat ${Math.abs(laporan.sisa_hari_deadline)} hari` 
                                            : `${laporan.sisa_hari_deadline} hari lagi`}
                                    </p>
                                </div>
                            </div>

                            {laporan.kesepakatan_keterlambatan && (
                                <div className="bg-white border border-orange-200 rounded-lg p-4">
                                    <p className="text-sm font-semibold text-gray-700 mb-2">Kesepakatan Jika Terlambat:</p>
                                    <p className="text-gray-800 italic whitespace-pre-line">{laporan.kesepakatan_keterlambatan}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* PDF Download */}
                    {laporan.has_pdf && (
                        <div className="bg-green-50 border border-green-200 shadow-sm rounded-lg p-6">
                            <h3 className="text-lg font-semibold mb-3">📄 PDF Rekam Medis</h3>
                            <div className="flex gap-3">
                                <a
                                    href={route('expert-system-point.download-pdf', laporan.id)}
                                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                                >
                                    📥 Download PDF
                                </a>
                                <a
                                    href={laporan.pdf_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                >
                                    👁️ Lihat PDF
                                </a>
                            </div>
                        </div>
                    )}

                    {/* Rekomendasi Sistem */}
                    <div className="bg-blue-50 border border-blue-200 shadow-sm rounded-lg p-6">
                        <h3 className="text-lg font-semibold mb-2">💡 Rekomendasi Sistem</h3>
                        <p className="text-gray-700 whitespace-pre-line">{laporan.rekomendasi}</p>
                    </div>

                    {/* Catatan BK */}
                    {laporan.catatan_bk && (
                        <div className="bg-gray-50 shadow-sm rounded-lg p-6">
                            <h3 className="text-lg font-semibold mb-2">📝 Catatan Pembimbing (BK)</h3>
                            <p className="text-gray-800 whitespace-pre-line">{laporan.catatan_bk}</p>
                        </div>
                    )}

                    {/* Tindakan BK */}
                    {laporan.aksi_bk && (
                        <div className="bg-gray-50 shadow-sm rounded-lg p-6">
                            <h3 className="text-lg font-semibold mb-2">🎯 Tindakan yang Dilakukan</h3>
                            <p className="text-gray-800 whitespace-pre-line">{laporan.aksi_bk}</p>
                        </div>
                    )}

                    {/* Upload Bukti Section */}
                    {laporan.can_upload_bukti && (
                        <div className="bg-white shadow-sm rounded-lg p-6 border-2 border-indigo-500">
                            <h3 className="text-lg font-semibold mb-4 text-indigo-700">
                                📤 Upload Bukti Pelaksanaan
                            </h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Upload foto atau dokumen bukti bahwa Anda sudah melaksanakan konsekuensi/reward. 
                                Maksimal 3 file (PNG, JPEG, PDF), masing-masing maksimal 2MB.
                            </p>

                            {!showUploadForm ? (
                                <button
                                    onClick={() => setShowUploadForm(true)}
                                    className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium"
                                >
                                    📤 Upload Bukti Sekarang
                                </button>
                            ) : (
                                <div>
                                    <BuktiUploadForm 
                                        laporanId={laporan.id}
                                        onCancel={() => setShowUploadForm(false)}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Bukti yang Sudah Diupload */}
                    {laporan.buktis.length > 0 && (
                        <div className="bg-white shadow-sm rounded-lg p-6">
                            <h3 className="text-lg font-semibold mb-4">📁 Bukti yang Sudah Diupload</h3>
                            
                            <div className="space-y-4">
                                {laporan.buktis.map((bukti) => (
                                    <div key={bukti.id} className="border rounded-lg p-4">
                                        <div className="flex items-start gap-4">
                                            {/* Preview */}
                                            <div className="flex-shrink-0">
                                                {bukti.is_image ? (
                                                    <img
                                                        src={bukti.file_url}
                                                        alt={bukti.file_name}
                                                        className="w-24 h-24 object-cover rounded-lg border"
                                                    />
                                                ) : bukti.is_pdf ? (
                                                    <div className="w-24 h-24 bg-red-100 rounded-lg border flex items-center justify-center">
                                                        <span className="text-3xl">📄</span>
                                                    </div>
                                                ) : (
                                                    <div className="w-24 h-24 bg-gray-100 rounded-lg border flex items-center justify-center">
                                                        <span className="text-3xl">📎</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <h4 className="font-semibold text-gray-900">{bukti.file_name}</h4>
                                                        <p className="text-sm text-gray-500">
                                                            {bukti.file_size_human} • Diupload: {bukti.uploaded_at}
                                                        </p>
                                                    </div>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getBadgeClass(bukti.status_badge_color)}`}>
                                                        {bukti.status_label}
                                                    </span>
                                                </div>

                                                {bukti.keterangan && (
                                                    <p className="text-sm text-gray-700 mb-2 italic">
                                                        "{bukti.keterangan}"
                                                    </p>
                                                )}

                                                {bukti.catatan_review && (
                                                    <div className={`text-sm p-2 rounded border ${
                                                        bukti.status === 'approved' 
                                                            ? 'bg-green-50 border-green-200' 
                                                            : 'bg-red-50 border-red-200'
                                                    }`}>
                                                        <p className="font-semibold text-gray-700">Review BK:</p>
                                                        <p className="text-gray-800">{bukti.catatan_review}</p>
                                                        {bukti.reviewer && (
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                oleh {bukti.reviewer.nama} • {bukti.reviewed_at}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Actions */}
                                                <div className="flex gap-2 mt-3">
                                                    <a
                                                        href={bukti.file_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-sm text-indigo-600 hover:text-indigo-900"
                                                    >
                                                        👁️ Lihat
                                                    </a>

                                                    {bukti.can_delete && (
                                                        <button
                                                            onClick={() => handleDeleteBukti(bukti.id)}
                                                            disabled={deleting}
                                                            className="text-sm text-red-600 hover:text-red-900 disabled:opacity-50"
                                                        >
                                                            🗑️ Hapus
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Info Card */}
                    <div className="bg-gray-50 shadow-sm rounded-lg p-6">
                        <h3 className="text-lg font-semibold mb-4">ℹ️ Informasi</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-gray-600">Total Poin Saat Trigger:</span>
                                <p className="font-semibold">{laporan.total_poin_saat_trigger} poin</p>
                            </div>
                            <div>
                                <span className="text-gray-600">Threshold:</span>
                                <p className="font-semibold">{laporan.threshold_poin_triggered} poin</p>
                            </div>
                            <div>
                                <span className="text-gray-600">Tanggal Selesai:</span>
                                <p className="font-semibold">{laporan.tanggal_selesai || '-'}</p>
                            </div>
                            <div>
                                <span className="text-gray-600">Validator (BK):</span>
                                <p className="font-semibold">{laporan.validator?.nama || '-'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}