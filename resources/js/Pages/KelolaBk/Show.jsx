import { useState } from 'react';
import { Head, Link, router, usePage, useForm } from '@inertiajs/react';
import GuruBkLayout from '@/Layouts/GuruBk/GuruBkLayout';

//  Design tokens 
const JENIS_CFG = {
    pelanggaran: { bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200',   dot: 'bg-red-500'    },
    apresiasi:   { bg: 'bg-emerald-50',text: 'text-emerald-700',border:'border-emerald-200', dot: 'bg-emerald-500'},
    konselor:    { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', dot: 'bg-violet-500' },
    yellow:      { bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200',  dot: 'bg-amber-500'  },
    green:       { bg: 'bg-emerald-50',text: 'text-emerald-700',border:'border-emerald-200', dot: 'bg-emerald-500'},
    red:         { bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200',    dot: 'bg-red-500'    },
    gray:        { bg: 'bg-gray-100',  text: 'text-gray-600',   border: 'border-gray-200',   dot: 'bg-gray-400'   },
};
const cfg = (color) => JENIS_CFG[color] ?? JENIS_CFG.gray;

//  Shared components 
const Badge = ({ color = 'gray', children }) => {
    const c = cfg(color);
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${c.bg} ${c.text} ${c.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.dot}`} />
            {children}
        </span>
    );
};

//  Section 
const Section = ({ title, children, iconPath, accent = 'indigo' }) => {
    const accents = {
        indigo: { icon: 'bg-indigo-100 text-indigo-600', bar: 'bg-indigo-600' },
        red:    { icon: 'bg-red-100 text-red-600',       bar: 'bg-red-500'    },
        green:  { icon: 'bg-emerald-100 text-emerald-600',bar: 'bg-emerald-500'},
        amber:  { icon: 'bg-amber-100 text-amber-600',   bar: 'bg-amber-500'  },
    };
    const a = accents[accent] ?? accents.indigo;
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className={`h-0.5 w-full ${a.bar}`} />
            <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-3">
                {iconPath && (
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${a.icon}`}>
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

//  Info row with zebra 
const InfoRow = ({ label, value, mono = false, idx = 0 }) => (
    <div className={`flex items-start justify-between gap-4 px-3 py-2.5 rounded-lg ${idx % 2 === 0 ? 'bg-gray-50/60' : 'bg-white'}`}>
        <span className="text-xs font-medium text-gray-500 shrink-0 mt-0.5">{label}</span>
        <span className={`text-sm text-gray-800 text-right max-w-[60%] leading-snug ${mono ? 'font-mono font-semibold text-xs' : 'font-medium'}`}>
            {value ?? '-'}
        </span>
    </div>
);

// 
export default function KelolaBkShow({ laporan, jenis }) {
    const { auth } = usePage().props;
    const [showAbaikanModal, setShowAbaikanModal] = useState(false);

    const approveForm = useForm({ catatan_bk: laporan?.catatan_bk ?? '' });
    const abaikanForm = useForm({ alasan: '' });

    if (!laporan) {
        return (
            <GuruBkLayout user={auth.user} header="Detail Laporan">
                <div className="max-w-4xl mx-auto px-4 py-20 flex flex-col items-center justify-center gap-4 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center">
                        <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <p className="font-semibold text-gray-600">Data laporan tidak ditemukan.</p>
                </div>
            </GuruBkLayout>
        );
    }

    const isPendingBk = laporan.approval_status === 'pending_bk';
    const isSelesai   = ['selesai', 'diberikan', 'dirujuk'].includes(laporan.approval_status);
    const isAbaikan   = ['diabaikan', 'ditunda'].includes(laporan.approval_status);
    const allApproved = (laporan.approvals ?? []).filter(a => a.is_approved).length === (laporan.approvals ?? []).length
                        && (laporan.approvals ?? []).length > 0;

    const labelApprove = {
        pelanggaran: 'Selesaikan & Simpan ke Riwayat',
        apresiasi:   'Berikan Reward & Simpan ke Riwayat',
        konselor:    'Selesaikan Konseling & Simpan',
    }[jenis] ?? 'Final Approve';

    const handleApprove = (e) => {
        e.preventDefault();
        approveForm.post(route('kelola-approval.approve', { jenis, id: laporan.id }), {
            preserveScroll: true,
        });
    };

    const handleAbaikan = (e) => {
        e.preventDefault();
        abaikanForm.post(route('kelola-approval.abaikan', { jenis, id: laporan.id }), {
            onSuccess: () => setShowAbaikanModal(false),
            preserveScroll: true,
        });
    };

    return (
        <GuruBkLayout user={auth.user} header={`Approval - ${laporan.kode}`}>
            <Head title={`Approval BK - ${laporan.kode}`} />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-4">

                {/* Breadcrumb */}
                <nav className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Link href={route('kelola-approval.index')} className="hover:text-indigo-600 transition font-medium">
                        Kelola Approval
                    </Link>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="text-gray-700 font-semibold truncate">{laporan.kode}</span>
                </nav>

                {/* Status banners */}
                {isSelesai && (
                    <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                        <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                            <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div>
                            <p className="font-semibold text-emerald-800 text-sm">Laporan Sudah Diselesaikan</p>
                            <p className="text-xs text-emerald-600 mt-0.5">Data sudah tersimpan di riwayat santri.</p>
                        </div>
                    </div>
                )}

                {isAbaikan && (
                    <div className="flex items-start gap-3 bg-gray-50 border border-gray-200 rounded-2xl p-4">
                        <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                        </div>
                        <div>
                            <p className="font-semibold text-gray-700 text-sm">Laporan Diabaikan</p>
                            <p className="text-xs text-gray-500 mt-0.5">Alasan: {laporan.catatan_bk ?? '-'}</p>
                        </div>
                    </div>
                )}

                {isPendingBk && !allApproved && (
                    <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
                        <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                            <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <p className="text-xs text-amber-800 font-medium leading-relaxed">
                            Belum semua wali memberikan approval. Periksa timeline di bawah.
                        </p>
                    </div>
                )}

                {/* Info grid: 1 col mobile, 2 col tablet+ */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* Santri */}
                    <Section
                        title="Informasi Santri"
                        iconPath="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    >
                        <div className="space-y-0.5">
                            <InfoRow label="Nama"  value={laporan.santri?.nama} idx={0} />
                            <InfoRow label="NISN"  value={laporan.santri?.nisn} mono idx={1} />
                        </div>
                        {laporan.korban && (
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Korban</p>
                                <div className="space-y-0.5">
                                    <InfoRow label="Nama Korban" value={laporan.korban.nama} idx={0} />
                                    <InfoRow label="NISN Korban" value={laporan.korban.nisn} mono idx={1} />
                                </div>
                            </div>
                        )}
                    </Section>

                    {/* Detail laporan */}
                    <Section
                        title="Detail Laporan"
                        iconPath="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    >
                        <div className="space-y-0.5">
                            <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-gray-50/60">
                                <span className="text-xs font-medium text-gray-500">Jenis</span>
                                <Badge color={laporan.jenis_color}>{laporan.jenis_label}</Badge>
                            </div>
                            <InfoRow label="Kode"            value={laporan.kode}               mono idx={1} />
                            <InfoRow label="Keterangan"      value={laporan.keterangan}               idx={0} />
                            {laporan.bobot_poin != null && (
                                <InfoRow
                                    label="Poin"
                                    value={`${laporan.jenis === 'pelanggaran' ? '-' : '+'}${laporan.bobot_poin} poin`}
                                    idx={1}
                                />
                            )}
                            <InfoRow label="Tanggal Kejadian" value={laporan.tanggal_kejadian}   idx={0} />
                            <InfoRow label="Status Approval"  value={laporan.approval_status_label} idx={1} />
                        </div>
                    </Section>
                </div>

                {/* Teks laporan awal */}
                {laporan.laporan_awal?.isi_laporan && (
                    <Section
                        title="Isi Laporan Awal"
                        iconPath="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        accent="amber"
                    >
                        <blockquote className="bg-amber-50/60 border-l-4 border-amber-300 rounded-r-xl px-4 py-3">
                            <p className="text-sm text-gray-700 leading-relaxed italic">
                                "{laporan.laporan_awal.isi_laporan}"
                            </p>
                        </blockquote>
                    </Section>
                )}

                {/* Timeline approval wali */}
                <Section
                    title="Timeline Approval Wali"
                    iconPath="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    accent="green"
                >
                    {(laporan.approvals ?? []).length === 0 ? (
                        <p className="text-sm text-gray-400 italic text-center py-4">Belum ada data approval wali.</p>
                    ) : (
                        <div className="space-y-2">
                            {laporan.approvals.map((a, i) => (
                                <div
                                    key={i}
                                    className={`flex items-start gap-3 p-3.5 rounded-xl border ${
                                        a.is_approved
                                            ? 'bg-emerald-50/60 border-emerald-100'
                                            : a.is_overdue
                                            ? 'bg-red-50/60 border-red-100'
                                            : 'bg-amber-50/60 border-amber-100'
                                    }`}
                                >
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white text-sm font-bold ${
                                        a.is_approved ? 'bg-emerald-500' : a.is_overdue ? 'bg-red-400' : 'bg-amber-400'
                                    }`}>
                                        {a.is_approved ? (
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                            </svg>
                                        ) : a.is_overdue ? '!' : (
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="font-semibold text-gray-800 text-sm truncate">{a.tenaga_pendidik_nama}</p>
                                            <Badge color={a.is_approved ? 'green' : a.is_overdue ? 'red' : 'yellow'}>
                                                {a.status_label}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {a.is_approved
                                                ? `Disetujui: ${a.approved_at}`
                                                : a.is_overdue
                                                ? `Overdue: ${a.deadline_at}`
                                                : `Deadline: ${a.deadline_at}`}
                                        </p>
                                        {a.catatan && (
                                            <p className="text-xs text-gray-600 mt-1.5 bg-white/70 rounded-lg px-2.5 py-1.5 border italic">
                                                "{a.catatan}"
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Progress total */}
                    {(laporan.approvals ?? []).length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <div className="flex justify-between text-xs font-medium text-gray-500 mb-1.5">
                                <span>Progress Total</span>
                                <span className="font-bold text-gray-700">{laporan.approval_progress ?? 0}%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                <div
                                    className={`h-2.5 rounded-full transition-all duration-700 ${
                                        (laporan.approval_progress ?? 0) >= 100 ? 'bg-emerald-500' :
                                        (laporan.approval_progress ?? 0) > 50  ? 'bg-blue-500' : 'bg-amber-400'
                                    }`}
                                    style={{ width: `${laporan.approval_progress ?? 0}%` }}
                                />
                            </div>
                        </div>
                    )}
                </Section>

                {/* Form Final Approve */}
                {isPendingBk && (
                    <div className="bg-white rounded-2xl border-2 border-indigo-200 shadow-sm overflow-hidden">
                        <div className="h-1 w-full bg-gradient-to-r from-indigo-500 to-violet-500" />
                        <div className="px-5 py-4 border-b border-indigo-50 flex items-center gap-3">
                            <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center">
                                <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <h3 className="font-semibold text-indigo-800 text-sm">Final Approval Guru BK</h3>
                        </div>
                        <div className="p-5">
                            {!allApproved && (
                                <div className="mb-4 flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-800">
                                    <svg className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    <span>Belum semua wali memberikan approval. Anda masih bisa melanjutkan, namun pastikan sudah memverifikasi manual.</span>
                                </div>
                            )}

                            <form onSubmit={handleApprove} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-2">
                                        Catatan BK
                                        <span className="ml-1.5 font-normal text-gray-400">(opsional)</span>
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={approveForm.data.catatan_bk}
                                        onChange={e => approveForm.setData('catatan_bk', e.target.value)}
                                        placeholder="Tambahkan catatan dari Guru BK..."
                                        className="w-full rounded-xl border-gray-200 text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition shadow-sm resize-none"
                                    />
                                    {approveForm.errors.catatan_bk && (
                                        <p className="text-red-500 text-xs mt-1">{approveForm.errors.catatan_bk}</p>
                                    )}
                                </div>

                                {approveForm.errors.approve && (
                                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700">
                                        <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        {approveForm.errors.approve}
                                    </div>
                                )}

                                <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                                    <button
                                        type="submit"
                                        disabled={approveForm.processing}
                                        className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 text-white rounded-xl font-semibold text-sm hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-60 shadow-sm shadow-emerald-200"
                                    >
                                        {approveForm.processing ? (
                                            <>
                                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                                                </svg>
                                                Menyimpan...
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                                </svg>
                                                {labelApprove}
                                            </>
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowAbaikanModal(true)}
                                        className="sm:w-auto px-5 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl font-medium text-sm hover:bg-gray-50 hover:border-gray-300 active:scale-95 transition-all"
                                    >
                                        Abaikan
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Back button */}
                <div>
                    <Link
                        href={route('kelola-approval.index')}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 font-medium hover:bg-gray-50 hover:border-gray-300 active:scale-95 transition-all"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Kembali ke Daftar
                    </Link>
                </div>
            </div>

            {/* Modal Abaikan */}
            {showAbaikanModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{backdropFilter:'blur(4px)',background:'rgba(0,0,0,0.5)'}}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="h-1 w-full bg-red-500" />
                        <div className="px-6 py-5">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-base">Abaikan Laporan</h3>
                                    <p className="text-xs text-gray-500 mt-0.5">Laporan tidak akan masuk ke riwayat santri.</p>
                                </div>
                            </div>

                            <form onSubmit={handleAbaikan} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-2">
                                        Alasan <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={abaikanForm.data.alasan}
                                        onChange={e => abaikanForm.setData('alasan', e.target.value)}
                                        placeholder="Jelaskan alasan laporan diabaikan..."
                                        className="w-full rounded-xl border-gray-200 text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition shadow-sm resize-none"
                                        required
                                    />
                                    {abaikanForm.errors.alasan && (
                                        <p className="text-red-500 text-xs mt-1">{abaikanForm.errors.alasan}</p>
                                    )}
                                </div>

                                <div className="flex gap-2.5">
                                    <button
                                        type="button"
                                        onClick={() => setShowAbaikanModal(false)}
                                        className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 active:scale-95 transition-all"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={abaikanForm.processing || !abaikanForm.data.alasan}
                                        className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 active:scale-95 transition-all disabled:opacity-60"
                                    >
                                        {abaikanForm.processing ? 'Menyimpan...' : 'Ya, Abaikan'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

        </GuruBkLayout>
    );
}