import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import DangerButton from '@/Components/DangerButton';

export default function Show({ auth, laporan }) {
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [lightboxImage, setLightboxImage] = useState(null);

    const completeForm = useForm({
        catatan_bk: '',
        aksi_bk: '',
        tanggal_batas_pelaksanaan: '',
        kesepakatan_keterlambatan: '',
    });

    const approveForm = useForm({
        catatan_review: '',
    });

    const rejectForm = useForm({
        catatan_review: '',
    });

    const handleComplete = (e) => {
        e.preventDefault();
        completeForm.post(route('expert-system-point.complete', laporan.id), {
            onSuccess: () => {
                setShowCompleteModal(false);
                completeForm.reset();
            },
        });
    };

    const handleApproveBukti = (e) => {
        e.preventDefault();
        approveForm.post(route('expert-system-point.approve-bukti', laporan.id), {
            onSuccess: () => {
                setShowApproveModal(false);
                approveForm.reset();
            },
        });
    };

    const handleRejectBukti = (e) => {
        e.preventDefault();
        rejectForm.post(route('expert-system-point.reject-bukti', laporan.id), {
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
            blue: 'bg-blue-100 text-blue-800',
            gray: 'bg-gray-100 text-gray-800',
        };
        return colors[color] || colors.gray;
    };

    return (
        <AppLayout
            user={auth.user}
            header={
                <div className="flex justify-between items-center">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Detail Expert System Point
                    </h2>
                    <Link
                        href={route('expert-system-point.index')}
                        className="text-sm text-indigo-600 hover:text-indigo-900"
                    >
                        ← Kembali ke List
                    </Link>
                </div>
            }
        >
            <Head title={`Detail ${laporan.kode}`} />

            <div className="py-8">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

                    {/* Header Card */}
                    <div className="bg-white shadow-sm rounded-lg p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-3xl">
                                        {laporan.jenis === 'konsekuensi' ? '⚠️' : '⭐'}
                                    </span>
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900">
                                            {laporan.kode} - {laporan.konsekuensi_atau_reward}
                                        </h2>
                                        <p className="text-sm text-gray-600">
                                            {laporan.santri.nama_lengkap} • {laporan.santri.nisn}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getBadgeClass(laporan.status_badge_color)}`}>
                                    {laporan.status_label}
                                </span>
                                {laporan.final_status && (
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getBadgeClass(laporan.final_status_badge_color)}`}>
                                        {laporan.final_status_label}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                                <span className="text-gray-600">Trigger:</span>
                                <p className="font-semibold">{laporan.tanggal_trigger}</p>
                            </div>
                            <div>
                                <span className="text-gray-600">Total Poin:</span>
                                <p className="font-semibold">{laporan.total_poin_saat_trigger} poin</p>
                            </div>
                            <div>
                                <span className="text-gray-600">Threshold:</span>
                                <p className="font-semibold">{laporan.threshold_poin_triggered} poin</p>
                            </div>
                            <div>
                                <span className="text-gray-600">Selesai:</span>
                                <p className="font-semibold">{laporan.tanggal_selesai || '-'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Deadline Info (jika sudah complete) */}
                    {laporan.tanggal_batas_pelaksanaan && (
                        <div className={`shadow-sm rounded-lg p-6 border-2 ${
                            laporan.is_terlambat ? 'bg-red-50 border-red-300' : 'bg-orange-50 border-orange-300'
                        }`}>
                            <h3 className="text-lg font-semibold mb-3 flex items-center">
                                ⏰ Deadline & Kesepakatan
                                {laporan.is_terlambat && <span className="ml-2 text-red-600 text-sm">🔴 TERLAMBAT!</span>}
                            </h3>
                            <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
                                <div>
                                    <span className="text-gray-600">Deadline:</span>
                                    <p className="font-semibold">{laporan.tanggal_batas_pelaksanaan}</p>
                                </div>
                                <div>
                                    <span className="text-gray-600">Sisa Waktu:</span>
                                    <p className={`font-semibold ${laporan.sisa_hari_deadline < 0 ? 'text-red-600' : laporan.sisa_hari_deadline <= 3 ? 'text-orange-600' : 'text-green-600'}`}>
                                        {laporan.sisa_hari_deadline < 0 
                                            ? `Terlambat ${Math.abs(laporan.sisa_hari_deadline)} hari` 
                                            : `${laporan.sisa_hari_deadline} hari lagi`}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-gray-600">Status Bukti:</span>
                                    <p className="font-semibold">
                                        {laporan.bukti_approved ? '✅ Approved' : laporan.has_bukti ? '⏳ Pending Review' : '❌ Belum Upload'}
                                    </p>
                                </div>
                            </div>
                            {laporan.kesepakatan_keterlambatan && (
                                <div className="bg-white border border-orange-200 rounded p-3 text-sm">
                                    <p className="font-semibold text-gray-700 mb-1">Kesepakatan:</p>
                                    <p className="text-gray-800 italic">{laporan.kesepakatan_keterlambatan}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Rekomendasi Sistem */}
                    <div className="bg-blue-50 border border-blue-200 shadow-sm rounded-lg p-6">
                        <h3 className="text-lg font-semibold mb-2">💡 Rekomendasi Sistem</h3>
                        <p className="text-gray-700 whitespace-pre-line">{laporan.rekomendasi}</p>
                    </div>

                    {/* Catatan & Tindakan BK */}
                    {(laporan.catatan_bk || laporan.aksi_bk) && (
                        <div className="grid md:grid-cols-2 gap-6">
                            {laporan.catatan_bk && (
                                <div className="bg-gray-50 shadow-sm rounded-lg p-6">
                                    <h3 className="text-lg font-semibold mb-2">📝 Catatan BK</h3>
                                    <p className="text-gray-800 whitespace-pre-line">{laporan.catatan_bk}</p>
                                </div>
                            )}
                            {laporan.aksi_bk && (
                                <div className="bg-gray-50 shadow-sm rounded-lg p-6">
                                    <h3 className="text-lg font-semibold mb-2">🎯 Tindakan</h3>
                                    <p className="text-gray-800 whitespace-pre-line">{laporan.aksi_bk}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ═══════════════════════════════════════════════════════════
                         ✅ SECTION BARU: REVIEW BUKTI PELAKSANAAN (BK)
                         ═══════════════════════════════════════════════════════════ */}
                    {laporan.has_bukti && laporan.buktis && laporan.buktis.length > 0 && (
                        <div className="bg-white shadow-sm rounded-lg p-6 border-2 border-indigo-500">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-indigo-700">
                                    📁 Review Bukti Pelaksanaan
                                </h3>
                                {!laporan.bukti_approved && laporan.buktis.some(b => b.status === 'pending') && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setShowApproveModal(true)}
                                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
                                        >
                                            ✓ Approve Semua
                                        </button>
                                        <button
                                            onClick={() => setShowRejectModal(true)}
                                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium"
                                        >
                                            ✕ Reject Semua
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Gallery Bukti */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {laporan.buktis.map((bukti) => (
                                    <div key={bukti.id} className="border rounded-lg overflow-hidden">
                                        {/* Preview */}
                                        <div 
                                            className="relative bg-gray-100 cursor-pointer"
                                            onClick={() => bukti.is_image && setLightboxImage(bukti.file_url)}
                                        >
                                            {bukti.is_image ? (
                                                <img
                                                    src={bukti.file_url}
                                                    alt={bukti.file_name}
                                                    className="w-full h-48 object-cover hover:opacity-90 transition"
                                                />
                                            ) : bukti.is_pdf ? (
                                                <div className="h-48 flex flex-col items-center justify-center bg-red-100">
                                                    <span className="text-6xl mb-2">📄</span>
                                                    <a
                                                        href={bukti.file_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-sm text-indigo-600 hover:underline"
                                                    >
                                                        Buka PDF
                                                    </a>
                                                </div>
                                            ) : (
                                                <div className="h-48 flex items-center justify-center bg-gray-100">
                                                    <span className="text-6xl">📎</span>
                                                </div>
                                            )}
                                            
                                            {/* Status Badge */}
                                            <div className="absolute top-2 right-2">
                                                <span className={`px-2 py-1 rounded text-xs font-semibold ${getBadgeClass(bukti.status_badge_color)}`}>
                                                    {bukti.status_label}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Info */}
                                        <div className="p-3">
                                            <h4 className="font-semibold text-sm text-gray-900 truncate" title={bukti.file_name}>
                                                {bukti.file_name}
                                            </h4>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {bukti.file_size_human} • {bukti.uploaded_at}
                                            </p>

                                            {bukti.keterangan && (
                                                <p className="text-xs text-gray-700 mt-2 italic line-clamp-2">
                                                    "{bukti.keterangan}"
                                                </p>
                                            )}

                                            {bukti.catatan_review && (
                                                <div className={`text-xs mt-2 p-2 rounded border ${
                                                    bukti.status === 'approved' 
                                                        ? 'bg-green-50 border-green-200' 
                                                        : 'bg-red-50 border-red-200'
                                                }`}>
                                                    <p className="font-semibold">Review:</p>
                                                    <p>{bukti.catatan_review}</p>
                                                    <p className="text-gray-500 mt-1">
                                                        {bukti.reviewer?.nama} • {bukti.reviewed_at}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Summary Info */}
                            <div className="mt-4 p-4 bg-gray-50 rounded-lg text-sm">
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <span className="text-gray-600">Total Bukti:</span>
                                        <p className="font-semibold">{laporan.buktis.length} file</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Status:</span>
                                        <p className="font-semibold">
                                            {laporan.bukti_approved 
                                                ? '✅ Semua Approved' 
                                                : `⏳ ${laporan.buktis.filter(b => b.status === 'pending').length} Pending Review`
                                            }
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Diupload:</span>
                                        <p className="font-semibold">{laporan.santri.nama_lengkap}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PDF Download */}
                    {laporan.has_pdf && (
                        <div className="bg-green-50 border border-green-200 shadow-sm rounded-lg p-6">
                            <h3 className="text-lg font-semibold mb-3">📄 PDF Rekam Medis</h3>
                            <div className="flex gap-3 flex-wrap">
                                <a
                                    href={route('expert-system-point.download-pdf', laporan.id)}
                                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 inline-flex items-center gap-2"
                                >
                                    <span>📥</span> Download PDF Basic
                                </a>
                                <a
                                    href={laporan.pdf_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 inline-flex items-center gap-2"
                                >
                                    <span>👁️</span> Lihat PDF
                                </a>
                                {/* ✅ NEW: Download PDF Lengkap (dengan bukti) */}
                                {laporan.bukti_approved && (
                                    <a
                                        href={route('expert-system-point.download-pdf-lengkap', laporan.id)}
                                        className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 inline-flex items-center gap-2 font-semibold"
                                    >
                                        <span>📦</span> Download PDF Lengkap (+ Bukti)
                                    </a>
                                )}
                            </div>
                            {!laporan.bukti_approved && laporan.has_bukti && (
                                <p className="text-sm text-amber-600 mt-2 italic">
                                    ⚠️ PDF Lengkap akan tersedia setelah bukti diapprove
                                </p>
                            )}
                        </div>
                    )}

                    {/* Complete Button */}
                    {laporan.status === 'pending' && (
                        <div className="flex justify-end">
                            <button
                                onClick={() => setShowCompleteModal(true)}
                                className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium"
                            >
                                ✓ Selesaikan Laporan & Set Deadline
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Lightbox Modal */}
            {lightboxImage && (
                <div 
                    className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4"
                    onClick={() => setLightboxImage(null)}
                >
                    <img 
                        src={lightboxImage} 
                        alt="Preview" 
                        className="max-w-full max-h-full object-contain"
                    />
                    <button
                        onClick={() => setLightboxImage(null)}
                        className="absolute top-4 right-4 text-white text-4xl hover:text-gray-300"
                    >
                        ×
                    </button>
                </div>
            )}

            {/* Complete Modal */}
            <Modal show={showCompleteModal} onClose={() => setShowCompleteModal(false)} maxWidth="2xl">
                <form onSubmit={handleComplete} className="p-6">
                    <h3 className="text-xl font-semibold mb-4">Selesaikan & Set Deadline</h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Catatan BK *
                            </label>
                            <textarea
                                value={completeForm.data.catatan_bk}
                                onChange={(e) => completeForm.setData('catatan_bk', e.target.value)}
                                rows={3}
                                required
                                className="w-full border-gray-300 rounded-md shadow-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tindakan yang Dilakukan *
                            </label>
                            <textarea
                                value={completeForm.data.aksi_bk}
                                onChange={(e) => completeForm.setData('aksi_bk', e.target.value)}
                                rows={3}
                                required
                                className="w-full border-gray-300 rounded-md shadow-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Deadline Upload Bukti *
                            </label>
                            <input
                                type="date"
                                value={completeForm.data.tanggal_batas_pelaksanaan}
                                onChange={(e) => completeForm.setData('tanggal_batas_pelaksanaan', e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                required
                                className="w-full border-gray-300 rounded-md shadow-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Kesepakatan Jika Terlambat *
                            </label>
                            <textarea
                                value={completeForm.data.kesepakatan_keterlambatan}
                                onChange={(e) => completeForm.setData('kesepakatan_keterlambatan', e.target.value)}
                                rows={2}
                                required
                                placeholder="Contoh: Menambah 5 poin pelanggaran"
                                className="w-full border-gray-300 rounded-md shadow-sm"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            type="button"
                            onClick={() => setShowCompleteModal(false)}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                        >
                            Batal
                        </button>
                        <PrimaryButton disabled={completeForm.processing}>
                            {completeForm.processing ? 'Memproses...' : 'Selesaikan'}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* Approve Bukti Modal */}
            <Modal show={showApproveModal} onClose={() => setShowApproveModal(false)} maxWidth="md">
                <form onSubmit={handleApproveBukti} className="p-6">
                    <h3 className="text-lg font-semibold text-green-700 mb-4">✓ Approve Bukti Pelaksanaan</h3>
                    
                    <p className="text-sm text-gray-600 mb-4">
                        Anda akan menyetujui <strong>{laporan.buktis?.filter(b => b.status === 'pending').length || 0} bukti</strong> yang diupload santri.
                        Status laporan akan menjadi <strong>Verified</strong>.
                    </p>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Catatan Review (Opsional)
                        </label>
                        <textarea
                            value={approveForm.data.catatan_review}
                            onChange={(e) => approveForm.setData('catatan_review', e.target.value)}
                            rows={3}
                            placeholder="Tambahkan catatan jika diperlukan..."
                            className="w-full border-gray-300 rounded-md shadow-sm"
                        />
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => setShowApproveModal(false)}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                        >
                            Batal
                        </button>
                        <PrimaryButton disabled={approveForm.processing}>
                            {approveForm.processing ? 'Memproses...' : 'Approve Bukti'}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* Reject Bukti Modal */}
            <Modal show={showRejectModal} onClose={() => setShowRejectModal(false)} maxWidth="md">
                <form onSubmit={handleRejectBukti} className="p-6">
                    <h3 className="text-lg font-semibold text-red-700 mb-4">✕ Reject Bukti Pelaksanaan</h3>
                    
                    <p className="text-sm text-gray-600 mb-4">
                        Bukti akan ditolak dan santri harus <strong>upload ulang</strong> sebelum deadline.
                    </p>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Alasan Penolakan *
                        </label>
                        <textarea
                            value={rejectForm.data.catatan_review}
                            onChange={(e) => rejectForm.setData('catatan_review', e.target.value)}
                            rows={3}
                            required
                            placeholder="Jelaskan kenapa bukti ditolak..."
                            className="w-full border-gray-300 rounded-md shadow-sm"
                        />
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => setShowRejectModal(false)}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                        >
                            Batal
                        </button>
                        <DangerButton disabled={rejectForm.processing}>
                            {rejectForm.processing ? 'Memproses...' : 'Reject Bukti'}
                        </DangerButton>
                    </div>
                </form>
            </Modal>
        </AppLayout>
    );
}