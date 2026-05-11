import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import GuruBkLayout from '@/Layouts/GuruBk/GuruBkLayout';

//  Design tokens 
const JENIS_CFG = {
    pelanggaran: { bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200',    dot: 'bg-red-500'    },
    apresiasi:   { bg: 'bg-emerald-50',text: 'text-emerald-700',border: 'border-emerald-200',dot: 'bg-emerald-500'},
    konselor:    { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', dot: 'bg-violet-500' },
    yellow:      { bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200',  dot: 'bg-amber-500'  },
    gray:        { bg: 'bg-gray-100',  text: 'text-gray-600',   border: 'border-gray-200',   dot: 'bg-gray-400'   },
};
const jenisCfg = (color) => JENIS_CFG[color] ?? JENIS_CFG.gray;

//  Shared components 
const Badge = ({ color = 'gray', children }) => {
    const c = jenisCfg(color);
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${c.bg} ${c.text} ${c.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.dot}`} />
            {children}
        </span>
    );
};

const ProgressBar = ({ value = 0 }) => (
    <div className="flex items-center gap-2">
        <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
                className={`h-2 rounded-full transition-all duration-500 ${
                    value >= 100 ? 'bg-emerald-500' : value > 50 ? 'bg-blue-500' : 'bg-amber-400'
                }`}
                style={{ width: `${value}%` }}
            />
        </div>
        <span className="text-xs font-medium text-gray-500 w-8 text-right shrink-0">{value}%</span>
    </div>
);

//  Stat card 
const StatCard = ({ label, value, scheme, icon }) => {
    const schemes = {
        indigo: { card: 'border-indigo-100 bg-indigo-50/60', icon: 'bg-indigo-600', num: 'text-indigo-800', lbl: 'text-indigo-500' },
        red:    { card: 'border-red-100 bg-red-50/60',       icon: 'bg-red-500',    num: 'text-red-800',   lbl: 'text-red-400'   },
        emerald:{ card: 'border-emerald-100 bg-emerald-50/60',icon:'bg-emerald-500',num: 'text-emerald-800',lbl: 'text-emerald-500'},
        violet: { card: 'border-violet-100 bg-violet-50/60', icon: 'bg-violet-500', num: 'text-violet-800',lbl: 'text-violet-400' },
    };
    const s = schemes[scheme] ?? schemes.indigo;
    return (
        <div className={`rounded-2xl border p-4 flex items-center gap-3.5 ${s.card}`}>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0 ${s.icon}`}>
                {icon}
            </div>
            <div className="min-w-0">
                <p className={`text-2xl font-bold leading-none mb-1 ${s.num}`}>{value}</p>
                <p className={`text-xs font-medium truncate ${s.lbl}`}>{label}</p>
            </div>
        </div>
    );
};

//  Filter pill 
const Pill = ({ active, onClick, children, activeClass = 'bg-indigo-600 text-white shadow-sm' }) => (
    <button
        onClick={onClick}
        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
            active ? activeClass : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
        }`}
    >
        {children}
    </button>
);

//  Main export 
export default function KelolaBkIndex({ items = [], statistik = {}, filter, jenis, search, error }) {
    const { auth } = usePage().props;

    const [filterState, setFilterState] = useState(filter ?? 'pending_bk');
    const [jenisState,  setJenisState]  = useState(jenis  ?? 'all');
    const [searchState, setSearchState] = useState(search ?? '');
    const [searchInput, setSearchInput] = useState(search ?? '');

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

    // icon helpers
    const IconClip  = <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>;
    const IconWarn  = <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
    const IconStar  = <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>;
    const IconUser  = <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;

    return (
        <GuruBkLayout user={auth.user} header="Kelola Approval">
            <Head title="Kelola Approval" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">

                {/* Error banner */}
                {error && (
                    <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
                        <svg className="w-5 h-5 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                        <span>{error}</span>
                    </div>
                )}

                {/* Page header */}
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Kelola Approval</h1>
                        <p className="text-sm text-gray-500 mt-0.5">
                            Laporan menunggu pengesahan akhir Guru BK
                        </p>
                    </div>
                    {filterState === 'pending_bk' && total > 0 && (
                        <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-800 border border-amber-200 rounded-full text-xs font-bold">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                            {total} menunggu
                        </span>
                    )}
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <StatCard label="Total Menunggu BK" value={total} scheme="indigo" icon={IconClip} />
                    <StatCard label="Pelanggaran"        value={statP} scheme="red"    icon={IconWarn} />
                    <StatCard label="Apresiasi"          value={statA} scheme="emerald" icon={IconStar} />
                    <StatCard label="Konselor"           value={statK} scheme="violet"  icon={IconUser} />
                </div>

                {/* Filter + Search panel */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">

                    {/* Row 1: Status filter */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide mr-1 shrink-0">Status</span>
                        <Pill
                            active={filterState === 'pending_bk'}
                            onClick={() => { setFilterState('pending_bk'); applyFilter('pending_bk', jenisState, searchState); }}
                            activeClass="bg-amber-500 text-white shadow-sm"
                        >
                            Menunggu BK
                        </Pill>
                        <Pill
                            active={filterState === 'selesai'}
                            onClick={() => { setFilterState('selesai'); applyFilter('selesai', jenisState, searchState); }}
                            activeClass="bg-emerald-600 text-white shadow-sm"
                        >
                            Selesai
                        </Pill>
                        <Pill
                            active={filterState === 'semua'}
                            onClick={() => { setFilterState('semua'); applyFilter('semua', jenisState, searchState); }}
                        >
                            Semua
                        </Pill>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-gray-100" />

                    {/* Row 2: Jenis + Search */}
                    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                        <div className="flex items-center gap-2 flex-wrap flex-1">
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide mr-1 shrink-0">Jenis</span>
                            {[
                                { key: 'all',         label: 'Semua'       },
                                { key: 'pelanggaran', label: 'Pelanggaran' },
                                { key: 'apresiasi',   label: 'Apresiasi'   },
                                { key: 'konselor',    label: 'Konselor'    },
                            ].map(j => (
                                <Pill
                                    key={j.key}
                                    active={jenisState === j.key}
                                    onClick={() => { setJenisState(j.key); applyFilter(filterState, j.key, searchState); }}
                                >
                                    {j.label}
                                </Pill>
                            ))}
                        </div>

                        {/* Search */}
                        <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-64 shrink-0">
                            <div className="relative flex-1">
                                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    value={searchInput}
                                    onChange={e => setSearchInput(e.target.value)}
                                    placeholder="Cari santri..."
                                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                                />
                            </div>
                            <button
                                type="submit"
                                className="px-3.5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition shrink-0"
                            >
                                Cari
                            </button>
                        </form>
                    </div>
                </div>

                {/* Content */}
                {items.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-20 flex flex-col items-center justify-center gap-4 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center">
                            <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="font-semibold text-gray-800">Tidak ada laporan</p>
                            <p className="text-sm text-gray-400 mt-1 max-w-xs mx-auto">
                                {filterState === 'pending_bk'
                                    ? 'Semua laporan sudah diselesaikan atau belum ada yang masuk.'
                                    : 'Tidak ada laporan dengan filter ini.'}
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Desktop table */}
                        <div className="hidden lg:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-100 bg-gray-50/80">
                                            {['Santri', 'Jenis', 'Kode / Keterangan', 'Progress Wali', 'Tanggal', ''].map(h => (
                                                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map((item, idx) => (
                                            <tr
                                                key={`${item.jenis}-${item.id}`}
                                                className={`border-b border-gray-50 transition-colors hover:bg-indigo-50/40 ${
                                                    idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                                                }`}
                                            >
                                                <td className="px-4 py-3.5">
                                                    <p className="font-semibold text-gray-900 text-sm">{item.santri?.nama ?? '-'}</p>
                                                    <p className="text-xs text-gray-400 font-mono mt-0.5">{item.santri?.nisn ?? '-'}</p>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <Badge color={item.jenis_color}>{item.jenis_label}</Badge>
                                                </td>
                                                <td className="px-4 py-3.5 max-w-[200px]">
                                                    <p className="font-mono font-semibold text-gray-800 text-xs">{item.kode}</p>
                                                    <p className="text-xs text-gray-400 truncate mt-0.5">{item.keterangan}</p>
                                                    {item.bobot_poin != null && (
                                                        <span className={`inline-block text-xs font-bold mt-1 ${
                                                            item.jenis === 'pelanggaran' ? 'text-red-500' : 'text-emerald-600'
                                                        }`}>
                                                            {item.jenis === 'pelanggaran' ? '-' : '+'}{item.bobot_poin} poin
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3.5 min-w-[160px]">
                                                    <ProgressBar value={item.approval_progress ?? 0} />
                                                    <p className="text-xs text-gray-400 mt-1.5">
                                                        {item.approvals?.filter(a => a.is_approved).length ?? 0} / {item.approvals?.length ?? 0} wali menyetujui
                                                    </p>
                                                </td>
                                                <td className="px-4 py-3.5 whitespace-nowrap">
                                                    <p className="text-sm text-gray-700 font-medium">{item.tanggal_kejadian ?? '-'}</p>
                                                    <p className="text-xs text-gray-400 mt-0.5">{item.created_at_label}</p>
                                                </td>
                                                <td className="px-4 py-3.5 text-right">
                                                    <Link
                                                        href={route('kelola-approval.show', { jenis: item.jenis, id: item.id })}
                                                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 active:scale-95 transition-all"
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
                            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/60 flex items-center justify-between">
                                <p className="text-xs text-gray-400">Menampilkan <span className="font-semibold text-gray-700">{items.length}</span> laporan</p>
                            </div>
                        </div>

                        {/* Mobile cards */}
                        <div className="lg:hidden space-y-3">
                            {items.map((item) => (
                                <div
                                    key={`mobile-${item.jenis}-${item.id}`}
                                    className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                                >
                                    {/* Card header */}
                                    <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-gray-900 truncate">{item.santri?.nama ?? '-'}</p>
                                            <p className="text-xs text-gray-400 font-mono mt-0.5">{item.santri?.nisn ?? '-'}</p>
                                        </div>
                                        <Badge color={item.jenis_color}>{item.jenis_label}</Badge>
                                    </div>

                                    {/* Kode & keterangan */}
                                    <div className="px-4 pb-3 border-b border-gray-100">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <span className="font-mono text-xs font-bold text-gray-700">{item.kode}</span>
                                                {item.bobot_poin != null && (
                                                    <span className={`ml-2 text-xs font-bold ${item.jenis === 'pelanggaran' ? 'text-red-500' : 'text-emerald-600'}`}>
                                                        {item.jenis === 'pelanggaran' ? '-' : '+'}{item.bobot_poin} poin
                                                    </span>
                                                )}
                                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.keterangan}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Progress + Tanggal */}
                                    <div className="px-4 py-3 space-y-2.5">
                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs text-gray-500">Progress Wali</span>
                                                <span className="text-xs text-gray-500">
                                                    {item.approvals?.filter(a => a.is_approved).length ?? 0} / {item.approvals?.length ?? 0}
                                                </span>
                                            </div>
                                            <ProgressBar value={item.approval_progress ?? 0} />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-gray-400">{item.tanggal_kejadian ?? '-'}</span>
                                            <span className="text-xs text-gray-400">{item.created_at_label}</span>
                                        </div>
                                    </div>

                                    {/* Action */}
                                    <div className="px-4 pb-4">
                                        <Link
                                            href={route('kelola-approval.show', { jenis: item.jenis, id: item.id })}
                                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 active:scale-95 transition-all"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                            Lihat Detail
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

            </div>
        </GuruBkLayout>
    );
}