import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';

// ── Badge helpers ─────────────────────────────────────────────────────────────
const COLOR = {
    red:    { bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-500'    },
    green:  { bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500'  },
    purple: { bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500' },
    yellow: { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500' },
    blue:   { bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-500'   },
    gray:   { bg: 'bg-gray-100',   text: 'text-gray-600',   dot: 'bg-gray-400'   },
};

const Badge = ({ color = 'gray', children }) => {
    const c = COLOR[color] ?? COLOR.gray;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
            {children}
        </span>
    );
};

// ── Progress bar ──────────────────────────────────────────────────────────────
const ProgressBar = ({ value = 0 }) => (
    <div className="flex items-center gap-2">
        <div className="flex-1 bg-gray-200 rounded-full h-1.5">
            <div
                className="h-1.5 rounded-full bg-blue-500 transition-all"
                style={{ width: `${value}%` }}
            />
        </div>
        <span className="text-xs text-gray-500 w-8 text-right">{value}%</span>
    </div>
);

// ── Stat card ──────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, color, icon }) => (
    <div className={`rounded-xl border p-4 flex items-center gap-3 bg-white shadow-sm`}>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
            <p className="text-xs text-gray-500">{label}</p>
        </div>
    </div>
);

// ─────────────────────────────────────────────────────────────────────────────
export default function KelolaBkIndex({ items = [], statistik = {}, filter, jenis, search, error }) {
    const { auth } = usePage().props;

    const [filterState, setFilterState]   = useState(filter   ?? 'pending_bk');
    const [jenisState,  setJenisState]    = useState(jenis    ?? 'all');
    const [searchState, setSearchState]   = useState(search   ?? '');
    const [searchInput, setSearchInput]   = useState(search   ?? '');

    // Navigasi dengan filter
    const applyFilter = (newFilter, newJenis, newSearch) => {
        router.get(route('kelola-approval.index'), {
            filter: newFilter ?? filterState,
            jenis:  newJenis  ?? jenisState,
            search: newSearch ?? searchState,
        }, { preserveState: true, replace: true });
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setSearchState(searchInput);
        applyFilter(filterState, jenisState, searchInput);
    };

    const total = statistik?.total_pending_bk ?? 0;
    const statP = statistik?.pending_bk?.pelanggaran ?? 0;
    const statA = statistik?.pending_bk?.apresiasi   ?? 0;
    const statK = statistik?.pending_bk?.konselor    ?? 0;

    return (
        <AppLayout user={auth.user} header="Kelola Approval - Final BK">
            <Head title="Kelola Approval" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

                {/* ── Error banner ── */}
                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg text-red-700 text-sm">
                        {error}
                    </div>
                )}

                {/* ── Header ── */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Kelola Approval</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Laporan yang sudah disetujui semua Wali dan menunggu pengesahan akhir Guru BK
                    </p>
                </div>

                {/* ── Statistik cards ── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <StatCard
                        label="Total Menunggu BK"
                        value={total}
                        color="bg-indigo-500"
                        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
                    />
                    <StatCard
                        label="Pelanggaran"
                        value={statP}
                        color="bg-red-500"
                        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
                    />
                    <StatCard
                        label="Apresiasi"
                        value={statA}
                        color="bg-green-500"
                        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>}
                    />
                    <StatCard
                        label="Konselor"
                        value={statK}
                        color="bg-purple-500"
                        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
                    />
                </div>

                {/* ── Filter bar ── */}
                <div className="bg-white rounded-xl shadow-sm border p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                    {/* Status filter */}
                    <div className="flex gap-2 flex-wrap">
                        {[
                            { key: 'pending_bk', label: '⏳ Menunggu BK',  color: 'bg-yellow-500' },
                            { key: 'selesai',    label: '✅ Selesai',       color: 'bg-green-500'  },
                            { key: 'semua',      label: '📋 Semua',         color: 'bg-gray-500'   },
                        ].map(f => (
                            <button
                                key={f.key}
                                onClick={() => { setFilterState(f.key); applyFilter(f.key, jenisState, searchState); }}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                                    filterState === f.key
                                        ? `${f.color} text-white`
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>

                    {/* Jenis filter */}
                    <div className="flex gap-2 flex-wrap">
                        {[
                            { key: 'all',          label: 'Semua Jenis' },
                            { key: 'pelanggaran',  label: 'Pelanggaran' },
                            { key: 'apresiasi',    label: 'Apresiasi'   },
                            { key: 'konselor',     label: 'Konselor'    },
                        ].map(j => (
                            <button
                                key={j.key}
                                onClick={() => { setJenisState(j.key); applyFilter(filterState, j.key, searchState); }}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                                    jenisState === j.key
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                {j.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Search ── */}
                <form onSubmit={handleSearch} className="flex gap-2">
                    <input
                        type="text"
                        value={searchInput}
                        onChange={e => setSearchInput(e.target.value)}
                        placeholder="Cari nama santri..."
                        className="flex-1 rounded-lg border-gray-300 shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition">
                        Cari
                    </button>
                </form>

                {/* ── Tabel ── */}
                {items.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border py-16 text-center">
                        <svg className="mx-auto w-12 h-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-gray-500 font-medium">Tidak ada laporan</p>
                        <p className="text-gray-400 text-sm mt-1">
                            {filterState === 'pending_bk'
                                ? 'Semua laporan sudah diselesaikan atau belum ada yang masuk.'
                                : 'Tidak ada laporan dengan filter ini.'}
                        </p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Santri</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Jenis</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Kode / Keterangan</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Progress Wali</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Tanggal</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {items.map(item => (
                                        <tr key={`${item.jenis}-${item.id}`} className="hover:bg-gray-50 transition">
                                            {/* Santri */}
                                            <td className="px-4 py-3">
                                                <p className="font-medium text-gray-900">{item.santri?.nama ?? '-'}</p>
                                                <p className="text-xs text-gray-400">{item.santri?.nisn ?? '-'}</p>
                                            </td>

                                            {/* Jenis */}
                                            <td className="px-4 py-3">
                                                <Badge color={item.jenis_color}>{item.jenis_label}</Badge>
                                            </td>

                                            {/* Kode & keterangan */}
                                            <td className="px-4 py-3">
                                                <p className="font-mono font-medium text-gray-800">{item.kode}</p>
                                                <p className="text-xs text-gray-400 truncate max-w-[180px]">{item.keterangan}</p>
                                                {item.bobot_poin !== null && item.bobot_poin !== undefined && (
                                                    <p className="text-xs text-indigo-600 font-medium mt-0.5">
                                                        {item.jenis === 'pelanggaran' ? '-' : '+'}{item.bobot_poin} poin
                                                    </p>
                                                )}
                                            </td>

                                            {/* Progress approval wali */}
                                            <td className="px-4 py-3 min-w-[140px]">
                                                <ProgressBar value={item.approval_progress ?? 0} />
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {item.approvals?.filter(a => a.is_approved).length ?? 0} / {item.approvals?.length ?? 0} wali
                                                </p>
                                            </td>

                                            {/* Tanggal */}
                                            <td className="px-4 py-3">
                                                <p className="text-gray-700">{item.tanggal_kejadian ?? '-'}</p>
                                                <p className="text-xs text-gray-400">{item.created_at_label}</p>
                                            </td>

                                            {/* Aksi */}
                                            <td className="px-4 py-3 text-center">
                                                <Link
                                                    href={route('kelola-approval.show', { jenis: item.jenis, id: item.id })}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 transition"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                    Detail
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer info */}
                        <div className="px-4 py-3 border-t bg-gray-50 text-xs text-gray-500">
                            Menampilkan {items.length} laporan
                        </div>
                    </div>
                )}

            </div>
        </AppLayout>
    );
}