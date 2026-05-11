import { useState } from 'react';
import GuruBkLayout from '@/Layouts/GuruBk/GuruBkLayout';
import { Head, Link, router } from '@inertiajs/react';

//  Badge helpers 
const JENIS_CFG = {
    konsekuensi: { bg: 'bg-red-100',     text: 'text-red-800',     dot: 'bg-red-500'     },
    reward:      { bg: 'bg-emerald-100', text: 'text-emerald-800', dot: 'bg-emerald-500' },
};
const STATUS_CFG = {
    yellow: { bg: 'bg-amber-100',   text: 'text-amber-800'   },
    blue:   { bg: 'bg-blue-100',    text: 'text-blue-800'    },
    green:  { bg: 'bg-emerald-100', text: 'text-emerald-800' },
    gray:   { bg: 'bg-gray-100',    text: 'text-gray-600'    },
};

const Badge = ({ children, cfg }) => (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text} border-current/20`}>
        {children}
    </span>
);

const JenisBadge = ({ jenis, label }) => {
    const c = JENIS_CFG[jenis] ?? JENIS_CFG.konsekuensi;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
            {label}
        </span>
    );
};

const StatusBadge = ({ color, label }) => {
    const c = STATUS_CFG[color] ?? STATUS_CFG.gray;
    return (
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
            {label}
        </span>
    );
};

// 
export default function ExpertSystemPointIndex({ auth, laporanList, santriList, filters }) {
    const [search,    setSearch]    = useState(filters.search    || '');
    const [jenis,     setJenis]     = useState(filters.jenis     || 'all');
    const [status,    setStatus]    = useState(filters.status    || 'all');
    const [santriId,  setSantriId]  = useState(filters.santri_id || '');

    const handleFilter = () => {
        router.get(route('expert-system-point.index'), {
            search, jenis, status, santri_id: santriId,
        }, { preserveState: true, replace: true });
    };

    const handleReset = () => {
        setSearch(''); setJenis('all'); setStatus('all'); setSantriId('');
        router.get(route('expert-system-point.index'));
    };

    const selectCls = 'w-full text-sm border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition shadow-sm';

    return (
        <GuruBkLayout user={auth.user} header="Expert System Point">
            <Head title="Expert System Point" />

            <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-5">

                {/* Page intro */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
                    <p className="text-sm text-gray-500 leading-relaxed">
                        Sistem otomatis konsekuensi dan reward berdasarkan akumulasi poin santri.
                        Laporan muncul otomatis ketika threshold terpenuhi.
                    </p>
                </div>

                {/* Filter */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Cari</label>
                            <div className="relative">
                                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleFilter()}
                                    placeholder="Kode, santri..."
                                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Jenis</label>
                            <select value={jenis} onChange={e => setJenis(e.target.value)} className={selectCls}>
                                <option value="all">Semua Jenis</option>
                                <option value="konsekuensi">Konsekuensi</option>
                                <option value="reward">Reward</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Status</label>
                            <select value={status} onChange={e => setStatus(e.target.value)} className={selectCls}>
                                <option value="all">Semua Status</option>
                                <option value="pending">Pending</option>
                                <option value="diproses">Diproses</option>
                                <option value="selesai">Selesai</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Santri</label>
                            <select value={santriId} onChange={e => setSantriId(e.target.value)} className={selectCls}>
                                <option value="">Semua Santri</option>
                                {santriList.map(s => (
                                    <option key={s.id} value={s.id}>{s.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleFilter}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 active:scale-95 transition-all">
                            Terapkan Filter
                        </button>
                        <button onClick={handleReset}
                            className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 active:scale-95 transition-all">
                            Reset
                        </button>
                    </div>
                </div>

                {/* Tabel  desktop */}
                <div className="hidden lg:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50/80">
                                    {['Tanggal Trigger','Santri','Jenis','Kode','Konsekuensi / Reward','Poin','Status','Aksi'].map(h => (
                                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {laporanList.data.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="py-16 text-center">
                                            <div className="flex flex-col items-center gap-2 text-gray-400">
                                                <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                                </svg>
                                                <p className="font-medium text-sm">Tidak ada data</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : laporanList.data.map((lap, idx) => (
                                    <tr key={lap.id} className={`border-b border-gray-50 hover:bg-indigo-50/30 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{lap.tanggal_trigger}</td>
                                        <td className="px-4 py-3">
                                            <p className="font-semibold text-gray-900 text-sm">{lap.santri?.nama_panggilan ?? '-'}</p>
                                            {lap.santri?.kelas_kode && (
                                                <p className="text-xs text-indigo-600 font-medium">Kelas {lap.santri.kelas_kode}</p>
                                            )}
                                            <p className="text-xs text-gray-400 font-mono">{lap.santri?.nisn ?? '-'}</p>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <JenisBadge jenis={lap.jenis} label={lap.jenis_label} />
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className="font-mono font-bold text-gray-800 text-sm">{lap.kode}</span>
                                        </td>
                                        <td className="px-4 py-3 max-w-[200px]">
                                            <p className="text-sm text-gray-800 truncate">{lap.konsekuensi_atau_reward}</p>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <p className="text-sm font-bold text-gray-900">{lap.total_poin_saat_trigger}</p>
                                            <p className="text-xs text-gray-400">threshold: {lap.threshold_poin_triggered}</p>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <StatusBadge color={lap.status_badge_color} label={lap.status_label} />
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <Link href={route('expert-system-point.show', lap.id)}
                                                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline transition">
                                                    Proses
                                                </Link>
                                                {lap.has_pdf && (
                                                    <a href={lap.pdf_url} target="_blank" rel="noopener noreferrer"
                                                        className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 hover:underline transition">
                                                        PDF
                                                    </a>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {laporanList.links?.length > 3 && (
                        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/60 flex items-center justify-between gap-2 flex-wrap">
                            <p className="text-xs text-gray-400">
                                {laporanList.from}{laporanList.to} dari <span className="font-semibold text-gray-600">{laporanList.total}</span>
                            </p>
                            <div className="flex gap-1">
                                {laporanList.links.map((link, i) => (
                                    <button key={i} onClick={() => link.url && router.get(link.url)} disabled={!link.url}
                                        className={`px-3 py-1 rounded-lg text-xs font-medium transition ${link.active ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'} ${!link.url ? 'opacity-40 cursor-not-allowed' : ''}`}
                                        dangerouslySetInnerHTML={{ __html: link.label }} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Cards  mobile */}
                <div className="lg:hidden space-y-3">
                    {laporanList.data.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-14 text-center text-gray-400">
                            <p className="font-medium">Tidak ada data</p>
                        </div>
                    ) : laporanList.data.map(lap => (
                        <div key={lap.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-3">
                                <div>
                                    <p className="font-bold text-gray-900">{lap.santri?.nama_panggilan ?? '-'}</p>
                                    {lap.santri?.kelas_kode && (
                                        <p className="text-xs text-indigo-600 font-medium">Kelas {lap.santri.kelas_kode}</p>
                                    )}
                                    <p className="text-xs text-gray-400 mt-0.5">{lap.tanggal_trigger}</p>
                                </div>
                                <JenisBadge jenis={lap.jenis} label={lap.jenis_label} />
                            </div>
                            <div className="px-4 pb-3 flex items-center justify-between gap-3 border-t border-gray-100 pt-3">
                                <div>
                                    <span className="font-mono font-bold text-gray-800 text-sm">{lap.kode}</span>
                                    <p className="text-xs text-gray-500 mt-0.5 max-w-[180px] truncate">{lap.konsekuensi_atau_reward}</p>
                                </div>
                                <StatusBadge color={lap.status_badge_color} label={lap.status_label} />
                            </div>
                            <div className="px-4 pb-4">
                                <Link href={route('expert-system-point.show', lap.id)}
                                    className="w-full flex items-center justify-center py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 active:scale-95 transition-all">
                                    Proses Laporan
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </GuruBkLayout>
    );
}