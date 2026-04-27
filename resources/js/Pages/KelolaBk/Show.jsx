import { useState } from 'react';
import { Head, Link, router, usePage, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';

// ── Badge ─────────────────────────────────────────────────────────────────────
const COLOR = {
    red:    { bg: 'bg-red-100',    text: 'text-red-700'    },
    green:  { bg: 'bg-green-100',  text: 'text-green-700'  },
    purple: { bg: 'bg-purple-100', text: 'text-purple-700' },
    yellow: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
    blue:   { bg: 'bg-blue-100',   text: 'text-blue-700'   },
    gray:   { bg: 'bg-gray-100',   text: 'text-gray-600'   },
};

const Badge = ({ color = 'gray', children }) => {
    const c = COLOR[color] ?? COLOR.gray;
    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
            {children}
        </span>
    );
};

// ── Section card ──────────────────────────────────────────────────────────────
const Section = ({ title, children, icon }) => (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-5 py-4 border-b bg-gray-50 flex items-center gap-2">
            {icon && <span className="text-gray-500">{icon}</span>}
            <h3 className="font-semibold text-gray-700 text-sm">{title}</h3>
        </div>
        <div className="p-5">{children}</div>
    </div>
);

// ── Info row ──────────────────────────────────────────────────────────────────
const InfoRow = ({ label, value, mono = false }) => (
    <div className="flex justify-between py-2 border-b last:border-0 border-gray-100">
        <span className="text-sm text-gray-500">{label}</span>
        <span className={`text-sm font-medium text-gray-800 text-right max-w-[60%] ${mono ? 'font-mono' : ''}`}>
            {value ?? '-'}
        </span>
    </div>
);

// ─────────────────────────────────────────────────────────────────────────────
export default function KelolaBkShow({ laporan, jenis }) {
    const { auth } = usePage().props;
    const [showAbaikanModal, setShowAbaikanModal] = useState(false);

    // Form approve
    const approveForm = useForm({ catatan_bk: laporan?.catatan_bk ?? '' });
    // Form abaikan
    const abaikanForm = useForm({ alasan: '' });

    if (!laporan) {
        return (
            <AppLayout user={auth.user} header="Detail Laporan">
                <div className="max-w-4xl mx-auto px-4 py-12 text-center text-gray-500">
                    Data laporan tidak ditemukan.
                </div>
            </AppLayout>
        );
    }

    const isPendingBk   = laporan.approval_status === 'pending_bk';
    const isSelesai     = ['selesai', 'diberikan', 'dirujuk'].includes(laporan.approval_status);
    const isAbaikan     = ['diabaikan', 'ditunda'].includes(laporan.approval_status);
    const allApproved   = (laporan.approvals ?? []).filter(a => a.is_approved).length === (laporan.approvals ?? []).length
                          && (laporan.approvals ?? []).length > 0;

    // Label final approve sesuai jenis
    const labelApprove = {
        pelanggaran: 'Selesaikan & Simpan ke Riwayat',
        apresiasi:   'Berikan Reward & Simpan ke Riwayat',
        konselor:    'Selesaikan Konseling & Simpan ke Riwayat',
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
        <AppLayout user={auth.user} header="Detail Laporan — Final Approval BK">
            <Head title={`Approval BK — ${laporan.kode}`} />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">

                {/* ── Breadcrumb ── */}
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Link href={route('kelola-approval.index')} className="hover:text-indigo-600 transition">
                        Kelola Approval
                    </Link>
                    <span>/</span>
                    <span className="text-gray-800 font-medium">{laporan.kode}</span>
                </div>

                {/* ── Status banner ── */}
                {isSelesai && (
                    <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg flex items-start gap-3">
                        <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <div>
                            <p className="font-medium text-green-800">Laporan Sudah Diselesaikan</p>
                            <p className="text-sm text-green-700 mt-0.5">Data sudah tersimpan di riwayat santri.</p>
                        </div>
                    </div>
                )}

                {isAbaikan && (
                    <div className="bg-gray-50 border-l-4 border-gray-400 p-4 rounded-lg">
                        <p className="font-medium text-gray-700">Laporan Diabaikan</p>
                        <p className="text-sm text-gray-500 mt-0.5">Alasan: {laporan.catatan_bk ?? '-'}</p>
                    </div>
                )}

                {isPendingBk && !allApproved && (
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg flex items-start gap-3">
                        <svg className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <p className="text-sm text-yellow-800">Belum semua wali memberikan approval. Periksa timeline di bawah.</p>
                    </div>
                )}

                {/* ── Grid 2 kolom ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                    {/* Info Santri */}
                    <Section title="Informasi Santri" icon="👤">
                        <InfoRow label="Nama" value={laporan.santri?.nama} />
                        <InfoRow label="NISN" value={laporan.santri?.nisn} mono />
                        {laporan.korban && (
                            <>
                                <div className="mt-3 pt-3 border-t text-xs font-semibold text-gray-400 uppercase tracking-wide">Korban</div>
                                <InfoRow label="Nama Korban" value={laporan.korban.nama} />
                                <InfoRow label="NISN Korban" value={laporan.korban.nisn} mono />
                            </>
                        )}
                    </Section>

                    {/* Info Laporan */}
                    <Section title="Detail Laporan" icon="📋">
                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                            <span className="text-sm text-gray-500">Jenis</span>
                            <Badge color={laporan.jenis_color}>{laporan.jenis_label}</Badge>
                        </div>
                        <InfoRow label="Kode" value={laporan.kode} mono />
                        <InfoRow label="Keterangan" value={laporan.keterangan} />
                        {laporan.bobot_poin !== null && laporan.bobot_poin !== undefined && (
                            <InfoRow
                                label="Poin"
                                value={`${laporan.jenis === 'pelanggaran' ? '-' : '+'}${laporan.bobot_poin} poin`}
                            />
                        )}
                        <InfoRow label="Tanggal Kejadian" value={laporan.tanggal_kejadian} />
                        <InfoRow label="Status Approval" value={laporan.approval_status_label} />
                    </Section>
                </div>

                {/* Teks laporan awal */}
                {laporan.laporan_awal?.isi_laporan && (
                    <Section title="Isi Laporan Awal" icon="📝">
                        <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-lg p-4 border italic">
                            "{laporan.laporan_awal.isi_laporan}"
                        </p>
                    </Section>
                )}

                {/* Timeline approval wali */}
                <Section title="Timeline Approval Wali" icon="✅">
                    {(laporan.approvals ?? []).length === 0 ? (
                        <p className="text-sm text-gray-400 italic">Belum ada data approval wali.</p>
                    ) : (
                        <div className="space-y-3">
                            {laporan.approvals.map((a, i) => (
                                <div
                                    key={i}
                                    className={`flex items-start gap-3 p-3 rounded-lg border ${
                                        a.is_approved
                                            ? 'bg-green-50 border-green-200'
                                            : a.is_overdue
                                            ? 'bg-red-50 border-red-200'
                                            : 'bg-yellow-50 border-yellow-200'
                                    }`}
                                >
                                    {/* Icon */}
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold ${
                                        a.is_approved ? 'bg-green-500' : a.is_overdue ? 'bg-red-500' : 'bg-yellow-400'
                                    }`}>
                                        {a.is_approved ? '✓' : a.is_overdue ? '!' : '⏳'}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-800 text-sm">{a.tenaga_pendidik_nama}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {a.is_approved
                                                ? `Disetujui: ${a.approved_at}`
                                                : a.is_overdue
                                                ? `Overdue sejak: ${a.deadline_at}`
                                                : `Deadline: ${a.deadline_at}`}
                                        </p>
                                        {a.catatan && (
                                            <p className="text-xs text-gray-600 mt-1 italic">"{a.catatan}"</p>
                                        )}
                                    </div>

                                    <Badge color={a.is_approved ? 'green' : a.is_overdue ? 'red' : 'yellow'}>
                                        {a.status_label}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Progress bar total */}
                    {(laporan.approvals ?? []).length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                                <span>Progress Total</span>
                                <span>{laporan.approval_progress ?? 0}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="h-2 rounded-full bg-blue-500 transition-all"
                                    style={{ width: `${laporan.approval_progress ?? 0}%` }}
                                />
                            </div>
                        </div>
                    )}
                </Section>

                {/* ── FORM FINAL APPROVE ── */}
                {isPendingBk && (
                    <Section title="Final Approval Guru BK" icon="🔐">
                        {/* Warning jika belum semua approve */}
                        {!allApproved && (
                            <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                                ⚠️ Belum semua wali memberikan approval. Anda masih bisa melanjutkan, namun pastikan sudah memverifikasi manual.
                            </div>
                        )}

                        <form onSubmit={handleApprove} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Catatan BK <span className="text-gray-400 font-normal">(opsional)</span>
                                </label>
                                <textarea
                                    rows={3}
                                    value={approveForm.data.catatan_bk}
                                    onChange={e => approveForm.setData('catatan_bk', e.target.value)}
                                    placeholder="Tambahkan catatan dari Guru BK..."
                                    className="w-full rounded-lg border-gray-300 text-sm shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                />
                                {approveForm.errors.catatan_bk && (
                                    <p className="text-red-500 text-xs mt-1">{approveForm.errors.catatan_bk}</p>
                                )}
                            </div>

                            {approveForm.errors.approve && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                                    {approveForm.errors.approve}
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                {/* Tombol Final Approve */}
                                <button
                                    type="submit"
                                    disabled={approveForm.processing}
                                    className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 transition disabled:opacity-60"
                                >
                                    {approveForm.processing ? (
                                        <span>Menyimpan...</span>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            {labelApprove}
                                        </>
                                    )}
                                </button>

                                {/* Tombol Abaikan */}
                                <button
                                    type="button"
                                    onClick={() => setShowAbaikanModal(true)}
                                    className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-200 transition"
                                >
                                    Abaikan
                                </button>
                            </div>
                        </form>
                    </Section>
                )}

                {/* Tombol kembali */}
                <div className="flex justify-start">
                    <Link
                        href={route('kelola-approval.index')}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white border rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Kembali ke Daftar
                    </Link>
                </div>

            </div>

            {/* ── Modal Abaikan ── */}
            {showAbaikanModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
                        <h3 className="font-semibold text-gray-800 text-lg mb-1">Abaikan Laporan</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Laporan akan ditandai diabaikan dan <strong>tidak</strong> masuk ke riwayat santri.
                        </p>

                        <form onSubmit={handleAbaikan} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Alasan <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    rows={3}
                                    value={abaikanForm.data.alasan}
                                    onChange={e => abaikanForm.setData('alasan', e.target.value)}
                                    placeholder="Jelaskan alasan laporan diabaikan..."
                                    className="w-full rounded-lg border-gray-300 text-sm shadow-sm focus:ring-red-500 focus:border-red-500"
                                    required
                                />
                                {abaikanForm.errors.alasan && (
                                    <p className="text-red-500 text-xs mt-1">{abaikanForm.errors.alasan}</p>
                                )}
                            </div>

                            <div className="flex gap-3 pt-1">
                                <button
                                    type="button"
                                    onClick={() => setShowAbaikanModal(false)}
                                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={abaikanForm.processing || !abaikanForm.data.alasan}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition disabled:opacity-60"
                                >
                                    {abaikanForm.processing ? 'Menyimpan...' : 'Ya, Abaikan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </AppLayout>
    );
}