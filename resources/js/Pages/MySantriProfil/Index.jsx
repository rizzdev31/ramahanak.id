import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import SantriLayout from '@/Layouts/Santri/SantriLayout';

// -------------------------------------------------------------
// ICON HELPER
// -------------------------------------------------------------
const Ic = ({ d, cls = 'w-4 h-4' }) => (
    <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
    </svg>
);

const PATH = {
    warning:  'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
    star:     'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
    heart:    'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
    zap:      'M13 10V3L4 14h7v7l9-11h-7z',
    user:     'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    school:   'M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z',
    chart:    'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    clock:    'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    check:    'M5 13l4 4L19 7',
    info:     'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    link:     'M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14',
    calendar: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    tag:      'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z',
    target:   'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    upload:   'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12',
};

// -------------------------------------------------------------
// STATUS COLOR RESOLVER
// -------------------------------------------------------------
const STATUS_MAP = {
    selesai:                 { ring: 'ring-emerald-200 bg-emerald-50 text-emerald-700',  dot: 'bg-emerald-500' },
    diberikan:               { ring: 'ring-emerald-200 bg-emerald-50 text-emerald-700',  dot: 'bg-emerald-500' },
    completed:               { ring: 'ring-emerald-200 bg-emerald-50 text-emerald-700',  dot: 'bg-emerald-500' },
    dalam_proses:            { ring: 'ring-blue-200 bg-blue-50 text-blue-700',           dot: 'bg-blue-500'    },
    in_progress:             { ring: 'ring-blue-200 bg-blue-50 text-blue-700',           dot: 'bg-blue-500'    },
    pending:                 { ring: 'ring-amber-200 bg-amber-50 text-amber-700',        dot: 'bg-amber-500'   },
    pending_bk:              { ring: 'ring-amber-200 bg-amber-50 text-amber-700',        dot: 'bg-amber-500'   },
    pending_tenaga_pendidik: { ring: 'ring-yellow-200 bg-yellow-50 text-yellow-700',     dot: 'bg-yellow-500'  },
    discontinued:            { ring: 'ring-gray-200 bg-gray-50 text-gray-500',           dot: 'bg-gray-400'    },
};

const Badge = ({ status, label }) => {
    const s = STATUS_MAP[status] ?? { ring: 'ring-gray-200 bg-gray-50 text-gray-600', dot: 'bg-gray-400' };
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ${s.ring}`}>
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
            {label ?? status ?? '-'}
        </span>
    );
};

// -------------------------------------------------------------
// STAT CARD
// -------------------------------------------------------------
const CARD = {
    red:    { wrap: 'bg-red-50 border-red-100',      icon: 'bg-red-100 text-red-600',       val: 'text-red-700',     sub: 'text-red-400'     },
    emerald:{ wrap: 'bg-emerald-50 border-emerald-100', icon: 'bg-emerald-100 text-emerald-600', val: 'text-emerald-700', sub: 'text-emerald-400'  },
    blue:   { wrap: 'bg-blue-50 border-blue-100',    icon: 'bg-blue-100 text-blue-600',     val: 'text-blue-700',    sub: 'text-blue-400'    },
    amber:  { wrap: 'bg-amber-50 border-amber-100',  icon: 'bg-amber-100 text-amber-600',   val: 'text-amber-700',   sub: 'text-amber-400'   },
};

function StatCard({ label, value, sub, color, icon }) {
    const t = CARD[color] ?? CARD.blue;
    return (
        <div className={`rounded-2xl border p-5 ${t.wrap}`}>
            <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${t.icon}`}>
                    <Ic d={PATH[icon]} cls="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide truncate">{label}</p>
                    <p className={`text-3xl font-black tabular-nums mt-0.5 ${t.val}`}>{value}</p>
                    <p className={`text-xs mt-1 ${t.sub}`}>{sub}</p>
                </div>
            </div>
        </div>
    );
}

// -------------------------------------------------------------
// POIN BALANCE BAR
// -------------------------------------------------------------
function PoinBar({ poinRingkas }) {
    const { pelanggaran = 0, apresiasi = 0, selisih = 0 } = poinRingkas ?? {};
    const total = Math.max(pelanggaran + apresiasi, 1);
    const aPct  = Math.round((apresiasi   / total) * 100);
    const pPct  = Math.round((pelanggaran / total) * 100);
    return (
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-gray-700">Neraca Poin</p>
                <span className={`text-sm font-bold ${selisih >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {selisih >= 0 ? '+' : ''}{selisih} net
                </span>
            </div>
            <div className="w-full h-2.5 rounded-full overflow-hidden bg-gray-100 flex">
                {apresiasi > 0 && (
                    <div className="h-full bg-emerald-400 transition-all duration-700"
                         style={{ width: `${aPct}%` }} />
                )}
                {pelanggaran > 0 && (
                    <div className="h-full bg-red-400 transition-all duration-700"
                         style={{ width: `${pPct}%` }} />
                )}
            </div>
            <div className="flex justify-between mt-1.5 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                    Apresiasi {apresiasi}p
                </span>
                <span className="flex items-center gap-1">
                    Pelanggaran {pelanggaran}p
                    <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
                </span>
            </div>
        </div>
    );
}

// -------------------------------------------------------------
// EMPTY STATE
// -------------------------------------------------------------
function Empty({ text }) {
    return (
        <div className="py-16 text-center">
            <Ic d={PATH.info} cls="w-10 h-10 mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-gray-400">{text}</p>
        </div>
    );
}

// -------------------------------------------------------------
// TABLE ATOMS
// -------------------------------------------------------------
const TH = ({ ch }) => (
    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
        {ch}
    </th>
);
const TD = ({ ch, cls = '' }) => (
    <td className={`px-4 py-3 text-sm text-gray-700 ${cls}`}>{ch}</td>
);

// -------------------------------------------------------------
// KODE CHIP
// -------------------------------------------------------------
function Kode({ label, color = 'gray' }) {
    const C = {
        red:    'bg-red-100 text-red-700',
        emerald:'bg-emerald-100 text-emerald-700',
        blue:   'bg-blue-100 text-blue-700',
        violet: 'bg-violet-100 text-violet-700',
        gray:   'bg-gray-100 text-gray-700',
    };
    return (
        <span className={`inline-block font-mono text-xs font-semibold px-2 py-0.5 rounded ${C[color] ?? C.gray}`}>
            {label}
        </span>
    );
}

// -------------------------------------------------------------
// TAB CONFIG
// -------------------------------------------------------------
const TABS = [
    { id: 'overview',    label: 'Overview',     icon: PATH.chart    },
    { id: 'pelanggaran', label: 'Pelanggaran',  icon: PATH.warning  },
    { id: 'apresiasi',   label: 'Apresiasi',    icon: PATH.star     },
    { id: 'konseling',   label: 'Konseling',    icon: PATH.heart    },
    { id: 'point',       label: 'Expert Point', icon: PATH.zap      },
    { id: 'bimbingan',   label: 'Bimbingan ES', icon: PATH.target   },
    { id: 'timeline',    label: 'Timeline',     icon: PATH.clock    },
];

// -------------------------------------------------------------
// MAIN PAGE
// -------------------------------------------------------------
export default function MySantriProfilIndex({
    auth,
    santriInfo,
    kelasInfo,
    waliKelas,
    statistics,
    laporanPelanggaran   = [],
    laporanApresiasi     = [],
    laporanKonseling     = [],
    expertSystemPoint    = [],
    expertSystemKonselor = [],
    timeline             = [],
    poinRingkas          = {},
}) {
    const [tab, setTab] = useState('overview');

    const count = {
        pelanggaran: laporanPelanggaran.length,
        apresiasi:   laporanApresiasi.length,
        konseling:   laporanKonseling.length,
        point:       expertSystemPoint.length,
        bimbingan:   expertSystemKonselor.length,
        timeline:    timeline.length,
    };

    return (
        <SantriLayout user={auth.user} header="Rekam Jejak Saya">
            <Head title="Rekam Jejak Saya" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

                {/* -- PROFIL HEADER ------------------------------- */}
                <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                    <div className="h-1.5 bg-gradient-to-r from-violet-500 via-blue-500 to-emerald-500" />
                    <div className="p-6 flex flex-col sm:flex-row gap-5 items-start">
                        {/* Avatar */}
                        <div className="shrink-0">
                            {santriInfo?.foto ? (
                                <img src={santriInfo.foto} alt={santriInfo.nama_lengkap}
                                     className="w-20 h-20 rounded-2xl object-cover ring-2 ring-gray-100" />
                            ) : (
                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-100 to-blue-100 flex items-center justify-center ring-2 ring-gray-100">
                                    <Ic d={PATH.user} cls="w-10 h-10 text-violet-400" />
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                <h1 className="text-xl font-bold text-gray-900 truncate">
                                    {santriInfo?.nama_lengkap ?? '-'}
                                </h1>
                                <Badge
                                    status={santriInfo?.status}
                                    label={santriInfo?.status === 'active' ? 'Aktif' : santriInfo?.status}
                                />
                            </div>
                            <p className="text-sm text-gray-400 mb-3">
                                NISN:&nbsp;
                                <span className="font-mono text-gray-600">{santriInfo?.nisn ?? '-'}</span>
                                {santriInfo?.nama_panggilan && santriInfo.nama_panggilan !== '-' && (
                                    <>&nbsp;-&nbsp;Panggilan:&nbsp;
                                        <span className="text-gray-600">{santriInfo.nama_panggilan}</span>
                                    </>
                                )}
                            </p>
                            <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-500">
                                {kelasInfo && (
                                    <span className="flex items-center gap-1">
                                        <Ic d={PATH.school} cls="w-3.5 h-3.5" />
                                        {kelasInfo.nama}&nbsp;-&nbsp;{kelasInfo.tahun_ajaran}
                                    </span>
                                )}
                                {waliKelas && (
                                    <span className="flex items-center gap-1">
                                        <Ic d={PATH.user} cls="w-3.5 h-3.5" />
                                        Wali Kelas:&nbsp;{waliKelas.nama}
                                    </span>
                                )}
                                {santriInfo?.nama_wali && santriInfo.nama_wali !== '-' && (
                                    <span className="flex items-center gap-1">
                                        <Ic d={PATH.heart} cls="w-3.5 h-3.5" />
                                        Wali:&nbsp;{santriInfo.nama_wali}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* -- STATISTIK ----------------------------------- */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {(statistics ?? []).map(s => (
                        <StatCard key={s.label} {...s} />
                    ))}
                </div>

                {/* -- NERACA POIN --------------------------------- */}
                <PoinBar poinRingkas={poinRingkas} />

                {/* -- TAB PANEL ---------------------------------- */}
                <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">

                    {/* Tab bar */}
                    <div className="border-b border-gray-100 overflow-x-auto">
                        <div className="flex min-w-max">
                            {TABS.map(t => {
                                const n       = count[t.id];
                                const active  = tab === t.id;
                                return (
                                    <button key={t.id} onClick={() => setTab(t.id)}
                                        className={`flex items-center gap-1.5 px-4 py-3.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                                            active
                                                ? 'border-violet-600 text-violet-700 bg-violet-50/50'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                        }`}>
                                        <Ic d={t.icon} cls="w-3.5 h-3.5" />
                                        {t.label}
                                        {n > 0 && (
                                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold leading-none ${
                                                active ? 'bg-violet-600 text-white' : 'bg-gray-200 text-gray-600'
                                            }`}>{n}</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="p-6">

                        {/* =========== OVERVIEW =========== */}
                        {tab === 'overview' && (
                            <div className="space-y-6">
                                <p className="text-sm text-gray-500">
                                    Ringkasan seluruh aktivitas yang tercatat dalam sistem sejak Anda terdaftar.
                                </p>

                                {/* Quick summary cards */}
                                <div className="grid sm:grid-cols-3 gap-4">
                                    {/* Pelanggaran */}
                                    <div className="rounded-xl border border-red-100 bg-red-50/40 p-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center">
                                                <Ic d={PATH.warning} cls="w-4 h-4 text-red-500" />
                                            </div>
                                            <span className="text-sm font-semibold text-gray-700">Pelanggaran</span>
                                        </div>
                                        <p className="text-2xl font-black text-red-700">{count.pelanggaran}</p>
                                        <p className="text-xs text-red-400 mt-0.5">
                                            Selesai: {laporanPelanggaran.filter(l => l.status === 'selesai').length}
                                        </p>
                                        {laporanPelanggaran.length > 0 && (
                                            <div className="mt-3 space-y-1.5 border-t border-red-100 pt-3">
                                                {laporanPelanggaran.slice(0, 3).map(l => (
                                                    <div key={l.id} className="flex items-center justify-between text-xs">
                                                        <Kode label={l.kode} color="red" />
                                                        <span className="text-red-600 font-semibold tabular-nums">
                                                            -{l.bobot_poin ?? 0}p
                                                        </span>
                                                    </div>
                                                ))}
                                                {count.pelanggaran > 3 && (
                                                    <button onClick={() => setTab('pelanggaran')}
                                                        className="text-xs text-red-500 hover:underline">
                                                        +{count.pelanggaran - 3} lainnya {'=>'}
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Apresiasi */}
                                    <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
                                                <Ic d={PATH.star} cls="w-4 h-4 text-emerald-600" />
                                            </div>
                                            <span className="text-sm font-semibold text-gray-700">Apresiasi</span>
                                        </div>
                                        <p className="text-2xl font-black text-emerald-700">{count.apresiasi}</p>
                                        <p className="text-xs text-emerald-400 mt-0.5">
                                            Diberikan: {laporanApresiasi.filter(l => l.status === 'diberikan').length}
                                        </p>
                                        {laporanApresiasi.length > 0 && (
                                            <div className="mt-3 space-y-1.5 border-t border-emerald-100 pt-3">
                                                {laporanApresiasi.slice(0, 3).map(l => (
                                                    <div key={l.id} className="flex items-center justify-between text-xs">
                                                        <Kode label={l.kode} color="emerald" />
                                                        <span className="text-emerald-600 font-semibold tabular-nums">
                                                            +{l.bobot_poin ?? 0}p
                                                        </span>
                                                    </div>
                                                ))}
                                                {count.apresiasi > 3 && (
                                                    <button onClick={() => setTab('apresiasi')}
                                                        className="text-xs text-emerald-600 hover:underline">
                                                        +{count.apresiasi - 3} lainnya {'=>'}
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Expert System */}
                                    <div className="rounded-xl border border-violet-100 bg-violet-50/40 p-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center">
                                                <Ic d={PATH.zap} cls="w-4 h-4 text-violet-600" />
                                            </div>
                                            <span className="text-sm font-semibold text-gray-700">Expert System</span>
                                        </div>
                                        <p className="text-2xl font-black text-violet-700">
                                            {count.point + count.bimbingan}
                                        </p>
                                        <p className="text-xs text-violet-400 mt-0.5">
                                            {expertSystemPoint.filter(e => e.jenis === 'konsekuensi').length} konsekuensi
                                            &nbsp;-&nbsp;
                                            {expertSystemPoint.filter(e => e.jenis === 'reward').length} reward
                                        </p>
                                        {count.bimbingan > 0 && (
                                            <div className="mt-3 space-y-1.5 border-t border-violet-100 pt-3">
                                                {expertSystemKonselor.slice(0, 2).map(e => (
                                                    <div key={e.id} className="text-xs">
                                                        <span className="font-medium text-violet-700 block truncate">
                                                            {e.diagnosis_nama}
                                                        </span>
                                                        <Badge status={e.status} label={e.status_label} />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Recent 5 timeline */}
                                {timeline.length > 0 && (
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                                                <Ic d={PATH.clock} cls="w-4 h-4 text-gray-400" />
                                                Aktivitas Terkini
                                            </h3>
                                            {timeline.length > 5 && (
                                                <button onClick={() => setTab('timeline')}
                                                    className="text-xs text-violet-600 hover:underline">
                                                    Lihat semua ({timeline.length}) {'=>'}
                                                </button>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            {timeline.slice(0, 5).map((t, i) => (
                                                <div key={i} className="flex items-center gap-3 py-2
                                                    border-b border-gray-50 last:border-0">
                                                    <span className={`w-2 h-2 rounded-full shrink-0 mt-0.5 ${
                                                        t.color === 'red'     ? 'bg-red-400' :
                                                        t.color === 'emerald' ? 'bg-emerald-400' :
                                                        t.color === 'blue'    ? 'bg-blue-400' : 'bg-gray-300'
                                                    }`} />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm text-gray-700 truncate">{t.title}</p>
                                                        <p className="text-xs text-gray-400">{t.date_display}</p>
                                                    </div>
                                                    {t.poin != null && (
                                                        <span className={`text-xs font-bold shrink-0 ${
                                                            t.color === 'red'     ? 'text-red-500' :
                                                            t.color === 'emerald' ? 'text-emerald-600' : 'text-gray-500'
                                                        }`}>
                                                            {t.color === 'red' ? '-' : t.poin > 0 ? '+' : ''}
                                                            {t.poin}p
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* =========== PELANGGARAN =========== */}
                        {tab === 'pelanggaran' && (
                            <div>
                                <div className="flex items-center gap-2 mb-5">
                                    <Ic d={PATH.warning} cls="w-4 h-4 text-red-500" />
                                    <h2 className="text-base font-semibold text-gray-800">Laporan Pelanggaran</h2>
                                    <span className="ml-1 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                                        {count.pelanggaran}
                                    </span>
                                </div>
                                {!count.pelanggaran ? <Empty text="Belum ada laporan pelanggaran." /> : (
                                    <div className="overflow-x-auto rounded-xl border border-gray-100">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 border-b border-gray-100">
                                                <tr>
                                                    <TH ch="Kode" />
                                                    <TH ch="Tanggal" />
                                                    <TH ch="Poin" />
                                                    <TH ch="Tindakan BK" />
                                                    <TH ch="Status Laporan" />
                                                    <TH ch="Proses Approval" />
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {laporanPelanggaran.map(l => (
                                                    <tr key={l.id} className="hover:bg-gray-50/60 transition-colors">
                                                        <TD ch={<Kode label={l.kode} color="red" />} />
                                                        <TD ch={
                                                            <span className="flex items-center gap-1 text-gray-500">
                                                                <Ic d={PATH.calendar} cls="w-3.5 h-3.5" />
                                                                {l.tanggal_kejadian ?? '-'}
                                                            </span>
                                                        } />
                                                        <TD ch={
                                                            l.bobot_poin != null
                                                                ? <span className="font-bold text-red-600">-{l.bobot_poin}p</span>
                                                                : <span className="text-gray-400">-</span>
                                                        } />
                                                        <TD ch={
                                                            <div>
                                                                <p className="text-xs text-gray-600">{l.tindakan ?? '-'}</p>
                                                                {l.tanggal_tindakan && (
                                                                    <p className="text-xs text-gray-400 mt-0.5">
                                                                        {l.tanggal_tindakan}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        } />
                                                        <TD ch={<Badge status={l.status} label={l.status_label} />} />
                                                        <TD ch={<Badge status={l.approval_status} label={l.approval_status_label} />} />
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* =========== APRESIASI =========== */}
                        {tab === 'apresiasi' && (
                            <div>
                                <div className="flex items-center gap-2 mb-5">
                                    <Ic d={PATH.star} cls="w-4 h-4 text-emerald-500" />
                                    <h2 className="text-base font-semibold text-gray-800">Laporan Apresiasi</h2>
                                    <span className="ml-1 text-xs bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full">
                                        {count.apresiasi}
                                    </span>
                                </div>
                                {!count.apresiasi ? <Empty text="Belum ada laporan apresiasi." /> : (
                                    <div className="overflow-x-auto rounded-xl border border-gray-100">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 border-b border-gray-100">
                                                <tr>
                                                    <TH ch="Kode" />
                                                    <TH ch="Tanggal" />
                                                    <TH ch="Poin" />
                                                    <TH ch="Reward" />
                                                    <TH ch="Status" />
                                                    <TH ch="Proses Approval" />
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {laporanApresiasi.map(l => (
                                                    <tr key={l.id} className="hover:bg-gray-50/60 transition-colors">
                                                        <TD ch={<Kode label={l.kode} color="emerald" />} />
                                                        <TD ch={
                                                            <span className="flex items-center gap-1 text-gray-500">
                                                                <Ic d={PATH.calendar} cls="w-3.5 h-3.5" />
                                                                {l.tanggal_kejadian ?? '-'}
                                                            </span>
                                                        } />
                                                        <TD ch={
                                                            <span className="font-bold text-emerald-600">
                                                                +{l.bobot_poin ?? 0}p
                                                            </span>
                                                        } />
                                                        <TD ch={
                                                            <div>
                                                                <p className="text-xs text-gray-600">{l.reward ?? '-'}</p>
                                                                {l.tanggal_reward && (
                                                                    <p className="text-xs text-gray-400 mt-0.5">
                                                                        Diberikan: {l.tanggal_reward}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        } />
                                                        <TD ch={<Badge status={l.status} label={l.status_label} />} />
                                                        <TD ch={<Badge status={l.approval_status} label={l.approval_status_label} />} />
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* =========== KONSELING =========== */}
                        {tab === 'konseling' && (
                            <div>
                                <div className="flex items-center gap-2 mb-5">
                                    <Ic d={PATH.heart} cls="w-4 h-4 text-blue-500" />
                                    <h2 className="text-base font-semibold text-gray-800">Laporan Konseling</h2>
                                    <span className="ml-1 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                                        {count.konseling}
                                    </span>
                                </div>
                                {!count.konseling ? <Empty text="Belum ada laporan konseling." /> : (
                                    <div className="overflow-x-auto rounded-xl border border-gray-100">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 border-b border-gray-100">
                                                <tr>
                                                    <TH ch="Kode" />
                                                    <TH ch="Tanggal" />
                                                    <TH ch="Diagnosis / Keterangan" />
                                                    <TH ch="Status" />
                                                    <TH ch="Proses Approval" />
                                                    <TH ch="Selesai" />
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {laporanKonseling.map(l => (
                                                    <tr key={l.id} className="hover:bg-gray-50/60 transition-colors">
                                                        <TD ch={<Kode label={l.kode} color="blue" />} />
                                                        <TD ch={
                                                            <span className="flex items-center gap-1 text-gray-500">
                                                                <Ic d={PATH.calendar} cls="w-3.5 h-3.5" />
                                                                {l.tanggal_kejadian ?? '-'}
                                                            </span>
                                                        } />
                                                        <TD ch={<p className="text-xs text-gray-600 max-w-xs">{l.diagnosis ?? '-'}</p>} />
                                                        <TD ch={<Badge status={l.status} label={l.status_label} />} />
                                                        <TD ch={<Badge status={l.approval_status} label={l.approval_status_label} />} />
                                                        <TD ch={<span className="text-xs text-gray-500">{l.tanggal_selesai ?? '-'}</span>} />
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* =========== EXPERT POINT =========== */}
                        {tab === 'point' && (
                            <div>
                                <div className="flex items-center gap-2 mb-5">
                                    <Ic d={PATH.zap} cls="w-4 h-4 text-amber-500" />
                                    <h2 className="text-base font-semibold text-gray-800">Expert System Point</h2>
                                    <span className="ml-1 text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">
                                        {count.point}
                                    </span>
                                </div>
                                {!count.point ? <Empty text="Belum ada data expert system point." /> : (
                                    <div className="space-y-3">
                                        {expertSystemPoint.map(e => (
                                            <div key={e.id} className={`rounded-xl border p-4 ${
                                                e.jenis === 'konsekuensi'
                                                    ? 'border-red-100 bg-red-50/30'
                                                    : 'border-emerald-100 bg-emerald-50/30'
                                            }`}>
                                                <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                                            e.jenis === 'konsekuensi'
                                                                ? 'bg-red-100 text-red-700'
                                                                : 'bg-emerald-100 text-emerald-700'
                                                        }`}>
                                                            {e.jenis_label}
                                                        </span>
                                                        <Kode label={e.kode} color={e.jenis === 'konsekuensi' ? 'red' : 'emerald'} />
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Badge status={e.status} label={e.status_label} />
                                                        <span className="text-xs text-gray-400">{e.tanggal_trigger}</span>
                                                    </div>
                                                </div>

                                                <p className="text-sm font-semibold text-gray-800 mb-1">
                                                    {e.konsekuensi_reward}
                                                </p>
                                                {e.rekomendasi && (
                                                    <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                                                        {e.rekomendasi}
                                                    </p>
                                                )}

                                                <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                                                    <span>
                                                        Poin saat trigger:&nbsp;
                                                        <strong className="text-gray-700">{e.total_poin}p</strong>
                                                    </span>
                                                    <span>
                                                        Threshold:&nbsp;
                                                        <strong className="text-gray-700">{e.threshold_poin}p</strong>
                                                    </span>
                                                    {e.has_bukti && (
                                                        <span className={`flex items-center gap-0.5 font-medium ${
                                                            e.bukti_approved ? 'text-emerald-600' : 'text-amber-600'
                                                        }`}>
                                                            <Ic d={e.bukti_approved ? PATH.check : PATH.clock} cls="w-3 h-3" />
                                                            {e.bukti_approved ? 'Bukti disetujui' : 'Bukti menunggu review'}
                                                        </span>
                                                    )}
                                                </div>

                                                {e.jenis === 'konsekuensi' && (
                                                    <div className="mt-2.5 pt-2.5 border-t border-red-100/60">
                                                        <Link href={route('my-expert-system-point.show', e.id)}
                                                            className="inline-flex items-center gap-1 text-xs text-violet-600 hover:underline">
                                                            <Ic d={PATH.upload} cls="w-3 h-3" />
                                                            Lihat detail &amp; unggah bukti pelaksanaan
                                                        </Link>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* =========== BIMBINGAN ES =========== */}
                        {tab === 'bimbingan' && (
                            <div>
                                <div className="flex items-center gap-2 mb-5">
                                    <Ic d={PATH.target} cls="w-4 h-4 text-violet-500" />
                                    <h2 className="text-base font-semibold text-gray-800">Bimbingan Expert System</h2>
                                    <span className="ml-1 text-xs bg-violet-100 text-violet-600 px-2 py-0.5 rounded-full">
                                        {count.bimbingan}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-400 mb-5">
                                    Sistem pakar mendeteksi kondisi Anda secara otomatis berdasarkan pola laporan yang masuk.
                                </p>
                                {!count.bimbingan ? <Empty text="Belum ada program bimbingan dari expert system." /> : (
                                    <div className="space-y-4">
                                        {expertSystemKonselor.map(e => (
                                            <div key={e.id} className="rounded-xl border border-violet-100 bg-violet-50/20 p-5">
                                                {/* Header */}
                                                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                                                    <div>
                                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                                            <Kode label={e.rule_kode} color="violet" />
                                                            <Badge status={e.status} label={e.status_label} />
                                                        </div>
                                                        <h3 className="font-semibold text-gray-900">{e.diagnosis_nama}</h3>
                                                        <p className="text-xs text-gray-500 mt-0.5">Kategori: {e.rule_kategori}</p>
                                                    </div>
                                                    <div className="text-right text-xs text-gray-400 space-y-0.5">
                                                        <p>Trigger: {e.tanggal_trigger}</p>
                                                        {e.tanggal_selesai && <p>Selesai: {e.tanggal_selesai}</p>}
                                                        {e.validator_nama && <p>BK: {e.validator_nama}</p>}
                                                    </div>
                                                </div>

                                                {/* Progress sesi */}
                                                <div className="mb-3">
                                                    <div className="flex justify-between text-xs text-gray-600 mb-1.5">
                                                        <span>Progress Sesi Bimbingan</span>
                                                        <span className="font-semibold">{e.sesi_terakhir} / 5</span>
                                                    </div>
                                                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                                        <div className="h-full bg-gradient-to-r from-violet-400 to-violet-600 transition-all duration-700 rounded-full"
                                                             style={{ width: `${e.progress}%` }} />
                                                    </div>
                                                    <div className="flex gap-1 mt-1.5">
                                                        {[1,2,3,4,5].map(n => (
                                                            <div key={n} className={`h-1 flex-1 rounded-full ${
                                                                n <= e.sesi_terakhir ? 'bg-violet-500' : 'bg-gray-200'
                                                            }`} />
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Penjelasan (collapsible) */}
                                                {e.diagnosis_penjelasan && (
                                                    <details className="mt-2 text-xs">
                                                        <summary className="cursor-pointer text-violet-600 hover:underline select-none">
                                                            Lihat penjelasan diagnosis
                                                        </summary>
                                                        <p className="mt-2 text-gray-600 leading-relaxed bg-white/70 rounded-lg p-3">
                                                            {e.diagnosis_penjelasan}
                                                        </p>
                                                    </details>
                                                )}

                                                {/* Kode terpenuhi */}
                                                {e.kode_terpenuhi?.length > 0 && (
                                                    <div className="mt-3 flex flex-wrap gap-1 items-center">
                                                        <span className="text-xs text-gray-400 mr-0.5">Kode terdeteksi:</span>
                                                        {e.kode_terpenuhi.map(k => (
                                                            <Kode key={k} label={k} color="violet" />
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Link detail */}
                                                <div className="mt-3 pt-3 border-t border-violet-100">
                                                    <Link href={route('my-konseling.show', e.id)}
                                                        className="inline-flex items-center gap-1 text-xs text-violet-600 hover:underline">
                                                        <Ic d={PATH.link} cls="w-3 h-3" />
                                                        Lihat detail sesi bimbingan
                                                    </Link>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* =========== TIMELINE =========== */}
                        {tab === 'timeline' && (
                            <div>
                                <div className="flex items-center gap-2 mb-5">
                                    <Ic d={PATH.clock} cls="w-4 h-4 text-gray-500" />
                                    <h2 className="text-base font-semibold text-gray-800">Timeline Aktivitas</h2>
                                    <span className="ml-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                        {count.timeline}
                                    </span>
                                </div>
                                {!count.timeline ? <Empty text="Belum ada aktivitas yang tercatat." /> : (
                                    <div className="relative pl-7">
                                        {/* Garis vertikal */}
                                        <div className="absolute left-3 top-2 bottom-2 w-px bg-gradient-to-b from-gray-300 via-gray-200 to-transparent" />

                                        <div className="space-y-3">
                                            {timeline.map((t, i) => (
                                                <div key={i} className="relative flex gap-3 items-start">
                                                    {/* Dot */}
                                                    <div className={`absolute -left-4 w-3 h-3 rounded-full border-2 border-white shadow-sm mt-1.5 shrink-0 ${
                                                        t.color === 'red'     ? 'bg-red-400' :
                                                        t.color === 'emerald' ? 'bg-emerald-400' :
                                                        t.color === 'blue'    ? 'bg-blue-400' : 'bg-gray-300'
                                                    }`} />

                                                    {/* Card */}
                                                    <div className="flex-1 min-w-0 bg-white rounded-xl border border-gray-100 px-4 py-3 shadow-sm">
                                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                                                    t.color === 'red'     ? 'bg-red-100 text-red-700' :
                                                                    t.color === 'emerald' ? 'bg-emerald-100 text-emerald-700' :
                                                                    t.color === 'blue'    ? 'bg-blue-100 text-blue-700' :
                                                                    'bg-gray-100 text-gray-600'
                                                                }`}>
                                                                    {t.type}
                                                                </span>
                                                                {t.kode && <Kode label={t.kode} color={
                                                                    t.color === 'red'     ? 'red' :
                                                                    t.color === 'emerald' ? 'emerald' :
                                                                    t.color === 'blue'    ? 'blue' : 'gray'
                                                                } />}
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                {t.poin != null && (
                                                                    <span className={`text-xs font-bold ${
                                                                        t.color === 'red'     ? 'text-red-500' :
                                                                        t.color === 'emerald' ? 'text-emerald-600' : 'text-gray-500'
                                                                    }`}>
                                                                        {t.color === 'red' ? '-' : t.poin > 0 ? '+' : ''}
                                                                        {t.poin}p
                                                                    </span>
                                                                )}
                                                                <span className="text-xs text-gray-400 whitespace-nowrap">
                                                                    {t.date_display}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <p className="mt-1.5 text-sm text-gray-700">{t.title}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                    </div>{/* /p-6 */}
                </div>{/* /tab panel */}
            </div>
        </SantriLayout>
    );
}