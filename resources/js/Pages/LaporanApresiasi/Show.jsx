/**
 * LaporanApresiasi/Show.jsx
 * Detail laporan apresiasi - BK bisa selesaikan & berikan reward
 */
import { Head, Link, useForm } from '@inertiajs/react';
import GuruBkLayout from '@/Layouts/GuruBk/GuruBkLayout';

const Ic = ({ d, cls = 'w-4 h-4' }) => (
    <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
    </svg>
);
const P = {
    back:    'M10 19l-7-7m0 0l7-7m-7 7h18',
    check:   'M5 13l4 4L19 7',
    warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
    clock:   'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    user:    'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    star:    'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
    doc:     'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
};

const APPROVAL_CFG = {
    pending_tenaga_pendidik: { cls: 'bg-yellow-100 text-yellow-800 ring-yellow-300', dot: 'bg-yellow-500 animate-pulse', label: 'Menunggu Wali' },
    pending_bk:              { cls: 'bg-red-100 text-red-800 ring-red-300',          dot: 'bg-red-500 animate-pulse',    label: 'Perlu Aksi BK' },
    selesai:                 { cls: 'bg-emerald-100 text-emerald-800 ring-emerald-200', dot: 'bg-emerald-500',           label: 'Selesai' },
    diberikan:               { cls: 'bg-emerald-100 text-emerald-800 ring-emerald-200', dot: 'bg-emerald-500',           label: 'Diberikan' },
};
function Chip({ status, label }) {
    const c = APPROVAL_CFG[status] ?? { cls: 'bg-gray-100 text-gray-600 ring-gray-200', dot: 'bg-gray-400', label: label ?? status };
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ring-1 ${c.cls}`}>
            <span className={`w-2 h-2 rounded-full ${c.dot}`} />
            {c.label}
        </span>
    );
}

function Section({ title, children }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50">
                <p className="text-sm font-bold text-gray-800">{title}</p>
            </div>
            <div className="px-5 py-4">{children}</div>
        </div>
    );
}
function Row({ label, value }) {
    return (
        <div className="flex items-start py-2 border-b border-gray-50 last:border-0">
            <span className="w-40 text-xs text-gray-500 shrink-0 pt-0.5">{label}</span>
            <span className="flex-1 text-sm text-gray-800 font-medium">{value ?? '-'}</span>
        </div>
    );
}

export default function LaporanApresiasiShow({ auth, laporan }) {
    const form = useForm({ catatan_bk: laporan.catatan_bk ?? '' });

    const canComplete = laporan.approval_status === 'pending_bk'
        && laporan.status !== 'diberikan';

    function handleComplete(e) {
        e.preventDefault();
        if (!confirm('Konfirmasi berikan reward untuk apresiasi ini?')) return;
        form.post(route('laporan-apresiasi.complete', laporan.id));
    }

    return (
        <GuruBkLayout user={auth.user} header="Detail Laporan Apresiasi">
            <Head title={`Apresiasi ${laporan.kode_apresiasi}`} />

            <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-4xl mx-auto space-y-5">

                {/* Back + header */}
                <div className="flex items-center justify-between">
                    <Link href={route('laporan-apresiasi.index')}
                        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition">
                        <Ic d={P.back} cls="w-4 h-4" />
                        Kembali ke Daftar
                    </Link>
                    <Chip status={laporan.approval_status} label={laporan.approval_status_label} />
                </div>

                {/* Banner pending_bk */}
                {laporan.approval_status === 'pending_bk' && laporan.status !== 'diberikan' && (
                    <div className="flex items-start gap-3 bg-red-50 border border-red-300 rounded-xl px-4 py-3.5">
                        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
                            <Ic d={P.warning} cls="w-4 h-4 text-red-600" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-red-800">Laporan ini memerlukan tindakan Anda</p>
                            <p className="text-xs text-red-600 mt-0.5">
                                Semua wali sudah menyetujui. Silakan berikan reward kepada santri.
                            </p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Info Santri */}
                    <Section title="Informasi Santri">
                        {laporan.santri ? (
                            <div className="flex items-center gap-3 mb-4 p-3 bg-emerald-50 rounded-xl">
                                <div className="w-10 h-10 rounded-full bg-emerald-200 text-emerald-700
                                    font-bold text-sm flex items-center justify-center shrink-0 uppercase">
                                    {laporan.santri.nama?.[0] ?? '?'}
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900">{laporan.santri.nama}</p>
                                    <p className="text-xs text-gray-500">NISN: {laporan.santri.nisn}</p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-400 text-sm">Data santri tidak tersedia</p>
                        )}
                        <Row label="Tanggal Kejadian" value={laporan.tanggal_kejadian} />
                        <Row label="Tanggal Reward" value={laporan.tanggal_reward} />
                        <Row label="Dibuat" value={laporan.created_at} />
                    </Section>

                    {/* Info Apresiasi */}
                    <Section title="Detail Apresiasi">
                        <Row label="Kode" value={
                            <span className="font-mono text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">
                                {laporan.kode_apresiasi}
                            </span>
                        } />
                        <Row label="Reward" value={laporan.reward_default} />
                        <Row label="Bobot Poin" value={laporan.bobot_poin != null ? `+${laporan.bobot_poin}p` : '-'} />
                        <Row label="Status" value={laporan.status_label} />
                        {laporan.variabel && (
                            <>
                                <Row label="Kategori" value={laporan.variabel.kategori} />
                                <Row label="Keterangan" value={laporan.variabel.keterangan} />
                            </>
                        )}
                        {laporan.validator && (
                            <Row label="Divalidasi oleh" value={laporan.validator.nama} />
                        )}
                    </Section>
                </div>

                {/* Isi Laporan */}
                {laporan.laporan_awal?.text_laporan && (
                    <Section title="Isi Laporan Awal">
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {laporan.laporan_awal.text_laporan}
                        </p>
                    </Section>
                )}

                {/* Timeline Approval */}
                {laporan.approvals?.length > 0 && (
                    <Section title="Riwayat Approval Wali">
                        <div className="space-y-2">
                            {laporan.approvals.map((a, i) => (
                                <div key={i} className={`flex items-center gap-3 p-3 rounded-xl ${
                                    a.approved_at ? 'bg-emerald-50 border border-emerald-100' : 'bg-amber-50 border border-amber-100'
                                }`}>
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                                        a.approved_at ? 'bg-emerald-500' : 'bg-amber-400'
                                    }`}>
                                        <Ic d={a.approved_at ? P.check : P.clock} cls="w-3.5 h-3.5 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-800">{a.tenaga_pendidik_nama}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {a.approved_at ? `Disetujui: ${a.approved_at}` : a.is_overdue ? 'Terlambat menyetujui' : 'Menunggu persetujuan'}
                                        </p>
                                        {a.catatan && <p className="text-xs text-gray-600 mt-1 italic">{a.catatan}</p>}
                                    </div>
                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                        a.approved_at ? 'bg-emerald-100 text-emerald-700' :
                                        a.is_overdue  ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                                    }`}>
                                        {a.approved_at ? 'Disetujui' : a.is_overdue ? 'Terlambat' : 'Pending'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </Section>
                )}

                {/* Form Aksi BK */}
                {canComplete && (
                    <Section title="Aksi Guru BK">
                        <form onSubmit={handleComplete} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Catatan BK (opsional)
                                </label>
                                <textarea
                                    value={form.data.catatan_bk}
                                    onChange={e => form.setData('catatan_bk', e.target.value)}
                                    rows={3}
                                    placeholder="Catatan tambahan dari Guru BK..."
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm
                                        focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                                />
                                {form.errors.catatan_bk && (
                                    <p className="text-xs text-red-500 mt-1">{form.errors.catatan_bk}</p>
                                )}
                            </div>
                            {form.errors.complete && (
                                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
                                    {form.errors.complete}
                                </div>
                            )}
                            <button type="submit" disabled={form.processing}
                                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white
                                    rounded-xl font-semibold text-sm hover:bg-emerald-700 disabled:opacity-60 transition">
                                <Ic d={P.star} cls="w-4 h-4" />
                                {form.processing ? 'Memproses...' : 'Berikan Reward & Selesaikan'}
                            </button>
                        </form>
                    </Section>
                )}

                {/* Status sudah selesai */}
                {laporan.status === 'diberikan' && (
                    <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3.5">
                        <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
                            <Ic d={P.check} cls="w-4 h-4 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-emerald-800">Reward telah diberikan</p>
                            {laporan.tanggal_reward && (
                                <p className="text-xs text-emerald-600 mt-0.5">Tanggal: {laporan.tanggal_reward}</p>
                            )}
                            {laporan.catatan_bk && (
                                <p className="text-xs text-emerald-700 mt-1">{laporan.catatan_bk}</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </GuruBkLayout>
    );
}