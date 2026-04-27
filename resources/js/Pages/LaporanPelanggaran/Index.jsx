/**
 * LaporanPelanggaran/Index.jsx
 * Halaman daftar laporan pelanggaran untuk Guru BK.
 * Fitur notif: banner alert, badge status per baris, filter tab approval_status.
 */
import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import GuruBkLayout from '@/Layouts/GuruBk/GuruBkLayout';

// ---- Icon ---------------------------------------------------------------
const Ic = ({ d, cls = 'w-4 h-4' }) => (
    <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
    </svg>
);
const PATH = {
    warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
    check:   'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    clock:   'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    search:  'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
    eye:     'M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
    filter:  'M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z',
    user:    'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    arrow:   'M13 7l5 5m0 0l-5 5m5-5H6',
};

// ---- Status badge -------------------------------------------------------
const APPROVAL_CONFIG = {
    pending_tenaga_pendidik: {
        cls:   'bg-yellow-100 text-yellow-800 ring-yellow-300',
        dot:   'bg-yellow-500',
        label: 'Menunggu Wali',
    },
    pending_bk: {
        cls:   'bg-red-100 text-red-800 ring-red-300',
        dot:   'bg-red-500 animate-pulse',
        label: 'Perlu Aksi BK',
    },
    selesai: {
        cls:   'bg-emerald-100 text-emerald-800 ring-emerald-300',
        dot:   'bg-emerald-500',
        label: 'Selesai',
    },
    diabaikan: {
        cls:   'bg-gray-100 text-gray-600 ring-gray-300',
        dot:   'bg-gray-400',
        label: 'Diabaikan',
    },
};

function ApprovalBadge({ status, label }) {
    const cfg = APPROVAL_CONFIG[status] ?? { cls: 'bg-gray-100 text-gray-600 ring-gray-300', dot: 'bg-gray-400', label: label ?? status };
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ${cfg.cls}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
        </span>
    );
}

// ---- Status laporan badge -----------------------------------------------
const STATUS_CLS = {
    pending:  'bg-amber-100 text-amber-700',
    selesai:  'bg-emerald-100 text-emerald-700',
    ditolak:  'bg-red-100 text-red-700',
};

// ---- Filter tabs --------------------------------------------------------
const TABS = [
    { key: 'all',                    label: 'Semua',           icon: PATH.filter },
    { key: 'pending_bk',             label: 'Perlu Aksi BK',  icon: PATH.warning },
    { key: 'pending_tenaga_pendidik',label: 'Menunggu Wali',  icon: PATH.clock   },
    { key: 'selesai',                label: 'Selesai',         icon: PATH.check   },
];

// ---- Progress bar -------------------------------------------------------
function Progress({ value }) {
    const pct = Math.min(value ?? 0, 100);
    const color = pct === 100 ? 'bg-emerald-500' : pct > 0 ? 'bg-amber-400' : 'bg-gray-300';
    return (
        <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
            <div className={`h-1.5 rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
        </div>
    );
}

// ---- Main ---------------------------------------------------------------
export default function LaporanPelanggaranIndex({ auth, laporanList, filters }) {
    const [search, setSearch] = useState(filters?.search ?? '');

    const data       = laporanList?.data ?? [];
    const pagination = laporanList?.links ?? [];
    const total      = laporanList?.total ?? 0;

    // Hitung laporan yang perlu aksi BK (untuk banner)
    const pendingBk = data.filter(l => l.approval_status === 'pending_bk').length;
    const activeTab = filters?.approval_status ?? 'all';

    function applyFilter(approval_status) {
        router.get(route('laporan-pelanggaran.index'), {
            approval_status,
            search: filters?.search ?? '',
        }, { preserveState: true, preserveScroll: true });
    }

    function applySearch(e) {
        e.preventDefault();
        router.get(route('laporan-pelanggaran.index'), {
            approval_status: activeTab,
            search,
        }, { preserveState: true });
    }

    return (
        <GuruBkLayout user={auth.user} header="Laporan Pelanggaran">
            <Head title="Laporan Pelanggaran" />

            <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-5 max-w-7xl mx-auto">

                {/* ---- BANNER: ada laporan pending BK -------------------- */}
                {pendingBk > 0 && (
                    <div className="flex items-start gap-3 bg-red-50 border border-red-300 rounded-xl px-4 py-3.5">
                        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                            <Ic d={PATH.warning} cls="w-4 h-4 text-red-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-red-800">
                                {pendingBk} laporan memerlukan tindakan Anda
                            </p>
                            <p className="text-xs text-red-600 mt-0.5">
                                Laporan sudah disetujui wali kelas dan menunggu diproses oleh Guru BK.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => applyFilter('pending_bk')}
                            className="shrink-0 text-xs font-semibold text-red-700 bg-red-100
                                hover:bg-red-200 px-3 py-1.5 rounded-lg transition"
                        >
                            Tampilkan
                        </button>
                    </div>
                )}

                {/* ---- HEADER -------------------------------------------- */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Laporan Pelanggaran</h1>
                        <p className="text-sm text-gray-500 mt-0.5">Total {total} laporan</p>
                    </div>
                    {/* Search */}
                    <form onSubmit={applySearch} className="flex items-center gap-2">
                        <div className="relative">
                            <Ic d={PATH.search} cls="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Cari kode / nama santri..."
                                className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg
                                    focus:outline-none focus:ring-2 focus:ring-indigo-500 w-60"
                            />
                        </div>
                        <button type="submit"
                            className="px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700">
                            Cari
                        </button>
                    </form>
                </div>

                {/* ---- FILTER TABS --------------------------------------- */}
                <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit flex-wrap">
                    {TABS.map(tab => {
                        const isActive = activeTab === tab.key;
                        // Hitung count dari data yang dimuat
                        const cnt = tab.key === 'all'
                            ? total
                            : data.filter(l => l.approval_status === tab.key).length;
                        return (
                            <button key={tab.key} type="button"
                                onClick={() => applyFilter(tab.key)}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                    isActive
                                        ? 'bg-white text-indigo-700 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}>
                                <Ic d={tab.icon} cls="w-3.5 h-3.5" />
                                {tab.label}
                                {tab.key === 'pending_bk' && pendingBk > 0 && (
                                    <span className="bg-red-500 text-white text-xs font-bold
                                        rounded-full min-w-[1.1rem] h-[1.1rem] flex items-center justify-center px-1">
                                        {pendingBk}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* ---- TABEL -------------------------------------------- */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    {data.length === 0 ? (
                        <div className="py-20 text-center">
                            <Ic d={PATH.check} cls="w-12 h-12 mx-auto text-gray-300 mb-3" />
                            <p className="text-gray-500 font-medium">Tidak ada laporan</p>
                            <p className="text-sm text-gray-400 mt-1">
                                {activeTab === 'pending_bk'
                                    ? 'Semua laporan sudah ditangani.'
                                    : 'Belum ada laporan masuk.'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100">
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Kode</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Santri Pelaku</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tindakan</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Poin</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Approval</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Progress</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tanggal</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {data.map(laporan => (
                                        <tr key={laporan.id}
                                            className={`hover:bg-gray-50/60 transition-colors ${
                                                laporan.approval_status === 'pending_bk'
                                                    ? 'bg-red-50/30 border-l-2 border-red-400'
                                                    : ''
                                            }`}>
                                            {/* Kode */}
                                            <td className="px-4 py-3">
                                                <span className="font-mono text-xs font-bold bg-gray-100
                                                    text-gray-700 px-2 py-1 rounded">
                                                    {laporan.kode_pelanggaran}
                                                </span>
                                            </td>

                                            {/* Pelaku */}
                                            <td className="px-4 py-3">
                                                {laporan.pelaku ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-7 h-7 rounded-full bg-red-100 text-red-700
                                                            font-bold text-xs flex items-center justify-center shrink-0">
                                                            {laporan.pelaku.nama?.[0]?.toUpperCase() ?? '?'}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-800">{laporan.pelaku.nama}</p>
                                                            <p className="text-xs text-gray-400">{laporan.pelaku.nisn}</p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </td>

                                            {/* Tindakan */}
                                            <td className="px-4 py-3 max-w-[200px]">
                                                <p className="text-gray-700 truncate">
                                                    {laporan.tindakan_default ?? '-'}
                                                </p>
                                                {laporan.variabel?.kategori && (
                                                    <p className="text-xs text-gray-400 mt-0.5">{laporan.variabel.kategori}</p>
                                                )}
                                            </td>

                                            {/* Poin */}
                                            <td className="px-4 py-3">
                                                {laporan.bobot_poin != null ? (
                                                    <span className="font-bold text-red-600">
                                                        -{laporan.bobot_poin}p
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </td>

                                            {/* Approval badge */}
                                            <td className="px-4 py-3">
                                                <ApprovalBadge
                                                    status={laporan.approval_status}
                                                    label={laporan.approval_status_label}
                                                />
                                                {laporan.has_overdue_approvals && (
                                                    <p className="text-xs text-red-500 mt-1 flex items-center gap-0.5">
                                                        <Ic d={PATH.clock} cls="w-3 h-3" />
                                                        Wali terlambat
                                                    </p>
                                                )}
                                            </td>

                                            {/* Progress approval */}
                                            <td className="px-4 py-3 w-32">
                                                <div className="text-xs text-gray-500">
                                                    {laporan.approval_progress ?? 0}%
                                                </div>
                                                <Progress value={laporan.approval_progress} />
                                            </td>

                                            {/* Tanggal */}
                                            <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                                                <p>{laporan.tanggal_kejadian ?? '-'}</p>
                                                <p className="text-gray-400">{laporan.created_at}</p>
                                            </td>

                                            {/* Aksi */}
                                            <td className="px-4 py-3">
                                                <Link
                                                    href={route('laporan-pelanggaran.show', laporan.id)}
                                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5
                                                        rounded-lg text-xs font-medium transition ${
                                                        laporan.approval_status === 'pending_bk'
                                                            ? 'bg-red-600 text-white hover:bg-red-700'
                                                            : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                                                    }`}>
                                                    <Ic d={laporan.approval_status === 'pending_bk' ? PATH.warning : PATH.eye}
                                                        cls="w-3.5 h-3.5" />
                                                    {laporan.approval_status === 'pending_bk' ? 'Proses' : 'Detail'}
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* ---- PAGINATION --------------------------------------- */}
                {pagination.length > 3 && (
                    <div className="flex justify-center gap-1">
                        {pagination.map((link, i) => (
                            link.url ? (
                                <Link key={i} href={link.url}
                                    className={`px-3 py-1.5 text-sm rounded-lg transition ${
                                        link.active
                                            ? 'bg-indigo-600 text-white font-semibold'
                                            : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ) : (
                                <span key={i}
                                    className="px-3 py-1.5 text-sm rounded-lg bg-gray-50 text-gray-400"
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            )
                        ))}
                    </div>
                )}
            </div>
        </GuruBkLayout>
    );
}