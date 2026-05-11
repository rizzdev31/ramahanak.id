import { useState } from 'react';
import GuruBkLayout from '@/Layouts/GuruBk/GuruBkLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import DangerButton from '@/Components/DangerButton';
import SecondaryButton from '@/Components/SecondaryButton';

//  Badge helpers 
const STATUS_CFG = {
    yellow: { bg: 'bg-amber-100',   text: 'text-amber-800',   border: 'border-amber-200'   },
    blue:   { bg: 'bg-blue-100',    text: 'text-blue-800',    border: 'border-blue-200'    },
    green:  { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200' },
    purple: { bg: 'bg-violet-100',  text: 'text-violet-800',  border: 'border-violet-200'  },
    red:    { bg: 'bg-red-100',     text: 'text-red-800',     border: 'border-red-200'     },
    gray:   { bg: 'bg-gray-100',    text: 'text-gray-600',    border: 'border-gray-200'    },
};
const getBadgeCls = (color) => {
    const c = STATUS_CFG[color] ?? STATUS_CFG.gray;
    return `${c.bg} ${c.text} ${c.border}`;
};

//  Section card 
const Section = ({ title, accent = 'indigo', iconPath, children }) => {
    const bars = { indigo:'bg-indigo-500', emerald:'bg-emerald-500', amber:'bg-amber-500', red:'bg-red-500', violet:'bg-violet-500' };
    const icons = { indigo:'bg-indigo-100 text-indigo-600', emerald:'bg-emerald-100 text-emerald-600', amber:'bg-amber-100 text-amber-600', red:'bg-red-100 text-red-600', violet:'bg-violet-100 text-violet-600' };
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className={`h-0.5 ${bars[accent] ?? bars.indigo}`} />
            <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-3">
                {iconPath && (
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${icons[accent] ?? icons.indigo}`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPath} />
                        </svg>
                    </div>
                )}
                <h3 className="font-semibold text-gray-800 text-sm">{title}</h3>
            </div>
            <div className="p-5">{children}</div>
        </div>
    );
};

const InfoRow = ({ label, value, idx = 0 }) => (
    <div className={`flex items-start justify-between gap-4 px-3 py-2.5 rounded-lg ${idx % 2 === 0 ? 'bg-gray-50/60' : 'bg-white'}`}>
        <span className="text-xs font-medium text-gray-500 shrink-0 mt-0.5">{label}</span>
        <span className="text-sm font-medium text-gray-800 text-right">{value ?? '-'}</span>
    </div>
);

// 
export default function ExpertSystemPointShow({ auth, laporan, statistics, nextThreshold }) {
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [showApproveModal,  setShowApproveModal]  = useState(false);
    const [showRejectModal,   setShowRejectModal]   = useState(false);
    const [lightboxImage,     setLightboxImage]     = useState(null);

    //  Form complete (semua field termasuk catatan_bk) 
    const completeForm = useForm({
        catatan_bk:                 laporan.catatan_bk ?? '',
        aksi_bk:                    laporan.aksi_bk    ?? '',
        tanggal_batas_pelaksanaan:  '',
        kesepakatan_keterlambatan:  '',
    });

    const approveForm = useForm({ catatan_review: '' });
    const rejectForm  = useForm({ catatan_review: '' });

    const handleComplete = (e) => {
        e.preventDefault();
        completeForm.post(route('expert-system-point.complete', laporan.id), {
            onSuccess: () => { setShowCompleteModal(false); completeForm.reset(); },
        });
    };

    const handleApproveBukti = (e) => {
        e.preventDefault();
        approveForm.post(route('expert-system-point.approve-bukti', laporan.id), {
            onSuccess: () => { setShowApproveModal(false); approveForm.reset(); },
        });
    };

    const handleRejectBukti = (e) => {
        e.preventDefault();
        rejectForm.post(route('expert-system-point.reject-bukti', laporan.id), {
            onSuccess: () => { setShowRejectModal(false); rejectForm.reset(); },
        });
    };

    const isKonsekuensi = laporan.jenis === 'konsekuensi';
    const isPending     = laporan.status === 'pending';

    return (
        <GuruBkLayout user={auth.user} header={`ES Point  ${laporan.kode}`}>
            <Head title={`Detail ES Point ${laporan.kode}`} />

            <div className="py-6 px-4 sm:px-6 max-w-5xl mx-auto space-y-5">

                {/* Breadcrumb */}
                <nav className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Link href={route('expert-system-point.index')} className="hover:text-indigo-600 font-medium transition">
                        Expert System Point
                    </Link>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="text-gray-700 font-semibold">{laporan.kode}</span>
                </nav>

                {/* Header Card */}
                <div className={`rounded-2xl border-2 p-5 ${isKonsekuensi ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${isKonsekuensi ? 'bg-red-100' : 'bg-emerald-100'}`}>
                                    {isKonsekuensi ? '!' : '*'}
                                </span>
                                <div>
                                    <h1 className="text-lg font-bold text-gray-900">{laporan.kode}  {laporan.konsekuensi_atau_reward}</h1>
                                    <p className="text-sm text-gray-600">{laporan.santri?.nama_lengkap}  {laporan.santri?.nisn}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getBadgeCls(laporan.status_badge_color)}`}>
                                {laporan.status_label}
                            </span>
                            {laporan.final_status && (
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getBadgeCls(laporan.final_status_badge_color)}`}>
                                    {laporan.final_status_label}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                        {[
                            ['Trigger', laporan.tanggal_trigger],
                            ['Total Poin', `${laporan.total_poin_saat_trigger} poin`],
                            ['Threshold', `${laporan.threshold_poin_triggered} poin`],
                            ['Selesai', laporan.tanggal_selesai ?? 'Belum'],
                        ].map(([label, val]) => (
                            <div key={label} className="bg-white/60 rounded-xl px-3 py-2.5">
                                <p className="text-xs text-gray-500">{label}</p>
                                <p className="text-sm font-bold text-gray-900 mt-0.5">{val}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Deadline info (jika sudah selesai) */}
                {laporan.tanggal_batas_pelaksanaan && (
                    <div className={`rounded-2xl border-2 p-5 ${laporan.is_terlambat ? 'bg-red-50 border-red-300' : 'bg-amber-50 border-amber-300'}`}>
                        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-sm">
                            Deadline Pelaksanaan
                            {laporan.is_terlambat && <span className="text-red-600 font-bold">TERLAMBAT!</span>}
                        </h3>
                        <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
                            <InfoRow label="Deadline" value={laporan.tanggal_batas_pelaksanaan} idx={0} />
                            <InfoRow label="Sisa Waktu" value={
                                laporan.sisa_hari_deadline < 0
                                    ? `Terlambat ${Math.abs(laporan.sisa_hari_deadline)} hari`
                                    : `${laporan.sisa_hari_deadline} hari lagi`
                            } idx={1} />
                            <InfoRow label="Status Bukti" value={
                                laporan.bukti_approved ? 'Approved' :
                                laporan.has_bukti ? 'Pending Review' : 'Belum Upload'
                            } idx={0} />
                        </div>
                        {laporan.kesepakatan_keterlambatan && (
                            <div className="bg-white/70 border border-amber-200 rounded-xl p-3 text-sm">
                                <p className="text-xs font-semibold text-gray-600 mb-1">Kesepakatan:</p>
                                <p className="text-gray-800 italic">{laporan.kesepakatan_keterlambatan}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Rekomendasi Sistem */}
                <Section title="Rekomendasi Sistem" accent="indigo"
                    iconPath="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z">
                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                        {laporan.rekomendasi}
                    </div>
                </Section>

                {/* Catatan & Tindakan BK (jika sudah ada) */}
                {(laporan.catatan_bk || laporan.aksi_bk) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {laporan.catatan_bk && (
                            <Section title="Catatan BK" accent="violet"
                                iconPath="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z">
                                <p className="text-sm text-gray-800 whitespace-pre-line leading-relaxed">{laporan.catatan_bk}</p>
                            </Section>
                        )}
                        {laporan.aksi_bk && (
                            <Section title="Tindakan BK" accent="emerald"
                                iconPath="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4">
                                <p className="text-sm text-gray-800 whitespace-pre-line leading-relaxed">{laporan.aksi_bk}</p>
                            </Section>
                        )}
                    </div>
                )}

                {/* Review Bukti Pelaksanaan */}
                {laporan.has_bukti && laporan.buktis?.length > 0 && (
                    <Section title="Review Bukti Pelaksanaan" accent="indigo"
                        iconPath="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z">
                        <div className="flex justify-between items-center mb-4">
                            <p className="text-xs text-gray-500">{laporan.buktis.length} file diupload</p>
                            {!laporan.bukti_approved && laporan.buktis.some(b => b.status === 'pending') && (
                                <div className="flex gap-2">
                                    <button onClick={() => setShowApproveModal(true)}
                                        className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 transition">
                                        Approve
                                    </button>
                                    <button onClick={() => setShowRejectModal(true)}
                                        className="px-3 py-1.5 bg-red-600 text-white rounded-xl text-xs font-semibold hover:bg-red-700 transition">
                                        Reject
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {laporan.buktis.map(bukti => (
                                <div key={bukti.id} className="border border-gray-100 rounded-xl overflow-hidden">
                                    <div className="relative bg-gray-50 cursor-pointer" onClick={() => bukti.is_image && setLightboxImage(bukti.file_url)}>
                                        {bukti.is_image ? (
                                            <img src={bukti.file_url} alt={bukti.file_name} className="w-full h-40 object-cover hover:opacity-90 transition" />
                                        ) : (
                                            <div className="h-40 flex flex-col items-center justify-center bg-gray-100 gap-2">
                                                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                <a href={bukti.file_url} target="_blank" rel="noopener noreferrer"
                                                    className="text-xs text-indigo-600 hover:underline font-medium">Buka File</a>
                                            </div>
                                        )}
                                        <div className="absolute top-2 right-2">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${getBadgeCls(bukti.status_badge_color)}`}>
                                                {bukti.status_label}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-3">
                                        <p className="font-semibold text-xs text-gray-900 truncate">{bukti.file_name}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">{bukti.file_size_human}  {bukti.uploaded_at}</p>
                                        {bukti.keterangan && (
                                            <p className="text-xs text-gray-600 mt-1.5 italic line-clamp-2">"{bukti.keterangan}"</p>
                                        )}
                                        {bukti.catatan_review && (
                                            <div className={`text-xs mt-2 p-2 rounded-lg border ${bukti.status === 'approved' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                                                <p className="font-semibold">Review: {bukti.catatan_review}</p>
                                                <p className="text-gray-400 mt-0.5">{bukti.reviewer?.nama}  {bukti.reviewed_at}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Section>
                )}

                {/* PDF */}
                {laporan.has_pdf && (
                    <Section title="PDF Rekam Medis" accent="emerald"
                        iconPath="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z">
                        <div className="flex gap-3 flex-wrap">
                            <a href={route('expert-system-point.download-pdf', laporan.id)}
                                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition">
                                Download PDF
                            </a>
                            <a href={laporan.pdf_url} target="_blank" rel="noopener noreferrer"
                                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition">
                                Lihat PDF
                            </a>
                            {laporan.bukti_approved && (
                                <a href={route('expert-system-point.download-pdf-lengkap', laporan.id)}
                                    className="px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 transition">
                                    Download PDF Lengkap + Bukti
                                </a>
                            )}
                        </div>
                        {!laporan.bukti_approved && laporan.has_bukti && (
                            <p className="text-xs text-amber-600 mt-2 italic">PDF Lengkap tersedia setelah bukti diapprove.</p>
                        )}
                    </Section>
                )}

                {/* Tombol Selesaikan */}
                {isPending && (
                    <div className="flex justify-end">
                        <button onClick={() => setShowCompleteModal(true)}
                            className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 active:scale-95 transition-all shadow-sm shadow-indigo-200">
                            Selesaikan & Set Deadline
                        </button>
                    </div>
                )}

                {/* Back */}
                <div>
                    <Link href={route('expert-system-point.index')}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 font-medium hover:bg-gray-50 transition">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Kembali ke Daftar
                    </Link>
                </div>
            </div>

            {/* Lightbox */}
            {lightboxImage && (
                <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setLightboxImage(null)}>
                    <img src={lightboxImage} alt="Preview" className="max-w-full max-h-full object-contain" />
                    <button onClick={() => setLightboxImage(null)}
                        className="absolute top-4 right-4 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )}

            {/*  Modal Complete  */}
            {/* PENTING: Form ini mengirim catatan_bk + aksi_bk + deadline + kesepakatan */}
            {/* Controller.complete() HARUS menerima dan simpan catatan_bk sebelum canComplete() */}
            <Modal show={showCompleteModal} onClose={() => setShowCompleteModal(false)} maxWidth="2xl">
                <form onSubmit={handleComplete} className="flex flex-col max-h-[90vh]">
                    <div className="px-6 py-4 border-b border-gray-100 shrink-0">
                        <h3 className="text-base font-bold text-gray-900">Selesaikan Laporan & Set Deadline</h3>
                        <p className="text-xs text-gray-500 mt-1">
                            Isi catatan BK, tindakan yang dilakukan, deadline upload bukti, dan kesepakatan.
                        </p>
                    </div>

                    <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

                        {/* Error global */}
                        {completeForm.errors.complete && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700">
                                {completeForm.errors.complete}
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                Catatan BK <span className="text-red-500">*</span>
                                <span className="font-normal text-gray-400 ml-1">(analisis kondisi santri)</span>
                            </label>
                            <textarea value={completeForm.data.catatan_bk}
                                onChange={e => completeForm.setData('catatan_bk', e.target.value)}
                                rows={3} required
                                placeholder="Tuliskan catatan dan analisis kondisi santri..."
                                className="w-full text-sm border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none shadow-sm" />
                            {completeForm.errors.catatan_bk && (
                                <p className="text-red-500 text-xs mt-1">{completeForm.errors.catatan_bk}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                Tindakan yang Dilakukan
                                <span className="font-normal text-gray-400 ml-1">(opsional)</span>
                            </label>
                            <textarea value={completeForm.data.aksi_bk}
                                onChange={e => completeForm.setData('aksi_bk', e.target.value)}
                                rows={2}
                                placeholder="Tindakan konkret yang sudah atau akan dilakukan BK..."
                                className="w-full text-sm border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none shadow-sm" />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                Deadline Upload Bukti <span className="text-red-500">*</span>
                            </label>
                            <input type="date" value={completeForm.data.tanggal_batas_pelaksanaan}
                                onChange={e => completeForm.setData('tanggal_batas_pelaksanaan', e.target.value)}
                                min={new Date().toISOString().split('T')[0]} required
                                className="w-full text-sm border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition shadow-sm" />
                            {completeForm.errors.tanggal_batas_pelaksanaan && (
                                <p className="text-red-500 text-xs mt-1">{completeForm.errors.tanggal_batas_pelaksanaan}</p>
                            )}
                            <p className="text-xs text-gray-400 mt-1">
                                Santri harus upload bukti pelaksanaan sebelum tanggal ini.
                            </p>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                Kesepakatan Jika Terlambat <span className="text-red-500">*</span>
                            </label>
                            <textarea value={completeForm.data.kesepakatan_keterlambatan}
                                onChange={e => completeForm.setData('kesepakatan_keterlambatan', e.target.value)}
                                rows={2} required
                                placeholder="Contoh: Menambah 5 poin pelanggaran jika tidak upload tepat waktu."
                                className="w-full text-sm border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none shadow-sm" />
                            {completeForm.errors.kesepakatan_keterlambatan && (
                                <p className="text-red-500 text-xs mt-1">{completeForm.errors.kesepakatan_keterlambatan}</p>
                            )}
                        </div>
                    </div>

                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 shrink-0 flex justify-end gap-2">
                        <SecondaryButton type="button" onClick={() => setShowCompleteModal(false)}>Batal</SecondaryButton>
                        <PrimaryButton disabled={completeForm.processing}>
                            {completeForm.processing ? 'Menyimpan...' : 'Selesaikan & Set Deadline'}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* Modal Approve Bukti */}
            <Modal show={showApproveModal} onClose={() => setShowApproveModal(false)} maxWidth="md">
                <form onSubmit={handleApproveBukti} className="p-6">
                    <h3 className="text-base font-bold text-emerald-700 mb-3">Approve Bukti Pelaksanaan</h3>
                    <p className="text-sm text-gray-600 mb-4">
                        Menyetujui <strong>{laporan.buktis?.filter(b => b.status === 'pending').length ?? 0} bukti</strong>.
                        Status laporan akan menjadi <strong>Verified</strong>.
                    </p>
                    <div className="mb-4">
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Catatan Review (opsional)</label>
                        <textarea value={approveForm.data.catatan_review}
                            onChange={e => approveForm.setData('catatan_review', e.target.value)} rows={3}
                            placeholder="Tambahkan catatan jika diperlukan..."
                            className="w-full text-sm border-gray-200 rounded-xl shadow-sm" />
                    </div>
                    <div className="flex justify-end gap-2">
                        <SecondaryButton type="button" onClick={() => setShowApproveModal(false)}>Batal</SecondaryButton>
                        <PrimaryButton disabled={approveForm.processing}>
                            {approveForm.processing ? 'Memproses...' : 'Approve Bukti'}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* Modal Reject Bukti */}
            <Modal show={showRejectModal} onClose={() => setShowRejectModal(false)} maxWidth="md">
                <form onSubmit={handleRejectBukti} className="p-6">
                    <h3 className="text-base font-bold text-red-700 mb-3">Reject Bukti Pelaksanaan</h3>
                    <p className="text-sm text-gray-600 mb-4">
                        Bukti ditolak  santri harus upload ulang sebelum deadline.
                    </p>
                    <div className="mb-4">
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                            Alasan Penolakan <span className="text-red-500">*</span>
                        </label>
                        <textarea value={rejectForm.data.catatan_review}
                            onChange={e => rejectForm.setData('catatan_review', e.target.value)} rows={3} required
                            placeholder="Jelaskan kenapa bukti ditolak..."
                            className="w-full text-sm border-gray-200 rounded-xl shadow-sm" />
                        {rejectForm.errors.catatan_review && (
                            <p className="text-red-500 text-xs mt-1">{rejectForm.errors.catatan_review}</p>
                        )}
                    </div>
                    <div className="flex justify-end gap-2">
                        <SecondaryButton type="button" onClick={() => setShowRejectModal(false)}>Batal</SecondaryButton>
                        <DangerButton disabled={rejectForm.processing}>
                            {rejectForm.processing ? 'Memproses...' : 'Reject Bukti'}
                        </DangerButton>
                    </div>
                </form>
            </Modal>
        </GuruBkLayout>
    );
}