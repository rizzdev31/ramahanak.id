/**
 * Dashboard/Santri.jsx
 * Overview lengkap semua laporan, expert point, konseling, dan timeline.
 * Data dari DashboardController::dataSantri()
 */
import { Head, Link } from '@inertiajs/react';
import SantriLayout from '@/Layouts/Santri/SantriLayout';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

// ---- Icon -----------------------------------------------------------
const P = {
    warning:  'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
    star:     'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
    heart:    'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
    zap:      'M13 10V3L4 14h7v7l9-11h-7z',
    report:   'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    chart:    'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    check:    'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    arrow:    'M13 7l5 5m0 0l-5 5m5-5H6',
    upload:   'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12',
    user:     'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    clock:    'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    shield:   'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    book:     'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
    calendar: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
};
const Ic = ({ n, cls = 'w-4 h-4' }) => (
    <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={P[n] || P.user} />
    </svg>
);

// ---- Avatar ---------------------------------------------------------
function Av({ foto, nama, cls = 'w-14 h-14' }) {
    if (foto) return (
        <img src={foto} alt={nama}
            className={`${cls} rounded-2xl object-cover ring-4 ring-white/40 shadow-lg shrink-0`}
            onError={e => { e.target.onerror = null; e.target.src = '/storage/defaultavatar.png'; }} />
    );
    return (
        <div className={`${cls} rounded-2xl bg-white/20 text-white font-bold
            flex items-center justify-center uppercase ring-4 ring-white/30 text-xl shrink-0`}>
            {(nama || '?')[0]}
        </div>
    );
}

// ---- Mini stat card -------------------------------------------------
const STAT_THEME = {
    red:    ['ring-rose-200',    'bg-rose-100',    'text-rose-600'   ],
    green:  ['ring-emerald-200', 'bg-emerald-100', 'text-emerald-600'],
    blue:   ['ring-blue-200',    'bg-blue-100',    'text-blue-600'   ],
    purple: ['ring-violet-200',  'bg-violet-100',  'text-violet-600' ],
    yellow: ['ring-amber-200',   'bg-amber-100',   'text-amber-600'  ],
};
function MiniStat({ label, value, icon, color = 'purple', href }) {
    const [ring, bg, tc] = STAT_THEME[color] || STAT_THEME.purple;
    const inner = (
        <div className={`bg-white rounded-xl p-3.5 ring-1 ${ring} hover:shadow-md transition-all`}>
            <div className={`w-8 h-8 rounded-lg ${bg} ${tc} flex items-center justify-center mb-2`}>
                <Ic n={icon} cls="w-3.5 h-3.5" />
            </div>
            <p className="text-xl font-bold text-gray-900 leading-none">{value}</p>
            <p className="text-xs text-gray-500 mt-1 leading-tight">{label}</p>
        </div>
    );
    return href
        ? <Link href={href}>{inner}</Link>
        : inner;
}

// ---- Progress bar ---------------------------------------------------
const PBar = ({ v, c = 'bg-violet-500' }) => (
    <div className="w-full bg-gray-100 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full ${c} transition-all`}
             style={{ width: `${Math.min(v ?? 0, 100)}%` }} />
    </div>
);

// ---- Recharts tooltip -----------------------------------------------
const TTip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-xs">
            <p className="font-semibold text-gray-700 mb-0.5">{label}</p>
            <p style={{ color: payload[0]?.payload?.color }} className="font-bold text-sm">
                {payload[0]?.value} laporan
            </p>
        </div>
    );
};

// ---- Card wrapper ---------------------------------------------------
const Card = ({ children, cls = '' }) => (
    <div className={`bg-white rounded-2xl border border-gray-200 shadow-sm ${cls}`}>{children}</div>
);
const CardHead = ({ title, sub, action }) => (
    <div className="flex items-end justify-between px-5 pt-4 pb-3 border-b border-gray-100">
        <div>
            <p className="text-sm font-bold text-gray-900">{title}</p>
            {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
        {action}
    </div>
);

// ---- Status badge ---------------------------------------------------
const STATUS_CLS = {
    selesai:                 'bg-emerald-100 text-emerald-700',
    diberikan:               'bg-emerald-100 text-emerald-700',
    completed:               'bg-emerald-100 text-emerald-700',
    in_progress:             'bg-blue-100 text-blue-700',
    pending:                 'bg-amber-100 text-amber-700',
    pending_bk:              'bg-amber-100 text-amber-700',
    pending_tenaga_pendidik: 'bg-yellow-100 text-yellow-700',
};
const Pill = ({ status, label }) => (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium
        ${STATUS_CLS[status] ?? 'bg-gray-100 text-gray-600'}`}>
        {label ?? status}
    </span>
);

// ---- Poin balance mini ----------------------------------------------
function PoinBalance({ pelanggaran, apresiasi }) {
    const total = Math.max(pelanggaran + apresiasi, 1);
    const pPct  = Math.round((pelanggaran / total) * 100);
    const aPct  = 100 - pPct;
    return (
        <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 h-2 rounded-full overflow-hidden bg-gray-100 flex">
                {apresiasi > 0 && (
                    <div className="h-full bg-emerald-400 transition-all duration-700"
                         style={{ width: `${aPct}%` }} />
                )}
                {pelanggaran > 0 && (
                    <div className="h-full bg-red-400 transition-all duration-700"
                         style={{ width: `${pPct}%` }} />
                )}
            </div>
        </div>
    );
}

// =====================================================================
// MAIN
// =====================================================================
export default function DashboardSantri({ auth, dashboardData }) {
    const d = dashboardData || {};

    const netPoin    = d.net_poin ?? 0;
    const epAktif    = d.expert_point_aktif     ?? [];
    const konseling  = d.konseling_aktif         ?? [];
    const konselorP  = d.laporan_konselor_pending ?? [];
    const chart      = d.chart_laporan           ?? [];
    const ring       = d.ringkasan               ?? {};
    const terbaru    = d.laporan_terbaru         ?? [];

    const now  = new Date();
    const gr   = now.getHours() < 11 ? 'Selamat Pagi'
               : now.getHours() < 15 ? 'Selamat Siang'
               : now.getHours() < 18 ? 'Selamat Sore' : 'Selamat Malam';

    const adaKonsekuensi = epAktif.filter(e => e.jenis === 'konsekuensi').length;
    const adaAksi        = epAktif.length > 0 || konselorP.length > 0 || konseling.length > 0;

    return (
        <SantriLayout user={auth.user} header="Dashboard">
            <Head title="Dashboard -- Santri" />

            <div className="py-5 px-4 sm:px-6 lg:px-8 space-y-4">

                {/* ---- ALERT: Akun pending -------------------------- */}
                {d.is_pending && (
                    <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 flex items-start gap-3">
                        <div className="w-7 h-7 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
                            <Ic n="warning" cls="w-3.5 h-3.5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-amber-800">Akun Menunggu Verifikasi Guru BK</p>
                            <p className="text-xs text-amber-700 mt-0.5">Beberapa fitur mungkin terbatas sementara akun diverifikasi.</p>
                        </div>
                    </div>
                )}

                {/* ---- HERO + NET POIN ------------------------------ */}
                <div className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 rounded-2xl p-5 text-white shadow-lg">
                    <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/5 rounded-full pointer-events-none" />
                    <div className="absolute -bottom-4 left-1/3 w-16 h-16 bg-white/5 rounded-full pointer-events-none" />

                    <div className="relative flex items-center gap-4">
                        <Av foto={d.foto} nama={d.nama} cls="w-14 h-14 text-lg" />
                        <div className="flex-1 min-w-0">
                            <p className="text-violet-200 text-xs">{gr}</p>
                            <h1 className="text-base font-bold truncate mt-0.5">{d.nama}</h1>
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                                <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full">NISN: {d.nisn}</span>
                                {d.kelas && (
                                    <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full">{d.kelas.kode}</span>
                                )}
                            </div>
                        </div>
                        {/* Net poin */}
                        <div className="shrink-0 text-right">
                            <p className="text-violet-200 text-xs">Net Poin</p>
                            <p className={`text-2xl font-bold ${netPoin >= 0 ? 'text-white' : 'text-rose-300'}`}>
                                {netPoin >= 0 ? '+' : ''}{netPoin}
                            </p>
                            {adaKonsekuensi > 0 && (
                                <Link href={route('my-expert-system-point.index')}
                                    className="mt-1 inline-flex items-center gap-1 bg-rose-400/30
                                        hover:bg-rose-400/50 px-2 py-0.5 rounded-full text-xs font-medium transition">
                                    <span className="w-1.5 h-1.5 bg-rose-300 rounded-full animate-pulse" />
                                    {adaKonsekuensi} konsekuensi aktif
                                </Link>
                            )}
                        </div>
                    </div>
                </div>

                {/* ---- 6 STAT MINI ---------------------------------- */}
                <div className="grid grid-cols-3 lg:grid-cols-6 gap-2.5">
                    {(d.stats || []).map((s, i) => (
                        <MiniStat key={i} {...s}
                            href={
                                s.label === 'Konseling Aktif'   ? route('my-konseling.index') :
                                s.label === 'Konsekuensi'       ? route('my-expert-system-point.index') :
                                s.label === 'Poin Pelanggaran'  ? route('my-profil.index') :
                                s.label === 'Poin Apresiasi'    ? route('my-profil.index') :
                                undefined
                            }
                        />
                    ))}
                </div>

                {/* ---- ZONE B: 2 KOLOM ------------------------------ */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

                    {/* ==== KIRI 3/5 ==== */}
                    <div className="lg:col-span-3 space-y-4">

                        {/* Chart laporan */}
                        <Card>
                            <CardHead
                                title="Rekap Semua Laporan"
                                sub="Seluruh jenis aktivitas yang pernah tercatat"
                                action={
                                    <Link href={route('my-profil.index')}
                                        className="text-xs text-violet-600 hover:text-violet-800 font-medium flex items-center gap-0.5">
                                        Detail <Ic n="arrow" cls="w-3 h-3" />
                                    </Link>
                                }
                            />
                            <div className="px-4 py-4">
                                {chart.some(c => c.total > 0) ? (
                                    <ResponsiveContainer width="100%" height={160}>
                                        <BarChart data={chart} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}
                                            barCategoryGap="30%">
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                                            <XAxis dataKey="jenis"
                                                tick={{ fontSize: 10, fill: '#9CA3AF' }}
                                                axisLine={false} tickLine={false} />
                                            <YAxis allowDecimals={false}
                                                tick={{ fontSize: 10, fill: '#9CA3AF' }}
                                                axisLine={false} tickLine={false} />
                                            <Tooltip content={<TTip />} cursor={{ fill: '#f3f4f6' }} />
                                            <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                                                {chart.map((c, i) => <Cell key={i} fill={c.color} />)}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-40 flex items-center justify-center text-gray-400 text-sm">
                                        Belum ada data laporan
                                    </div>
                                )}
                                {/* Legend */}
                                <div className="grid grid-cols-3 gap-1.5 mt-2">
                                    {chart.map((c, i) => (
                                        <div key={i} className="flex items-center gap-1.5 text-xs text-gray-600">
                                            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: c.color }} />
                                            <span className="truncate">{c.jenis}</span>
                                            <span className="font-bold text-gray-800 ml-auto">{c.total}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Card>

                        {/* Laporan terbaru masuk -- OVERVIEW */}
                        {terbaru.length > 0 && (
                            <Card>
                                <CardHead
                                    title="Laporan Terbaru Masuk"
                                    sub="Aktivitas terkini yang sudah divalidasi"
                                    action={
                                        <Link href={route('my-profil.index')}
                                            className="text-xs text-violet-600 hover:text-violet-800 font-medium flex items-center gap-0.5">
                                            Lihat Semua <Ic n="arrow" cls="w-3 h-3" />
                                        </Link>
                                    }
                                />
                                <div className="px-4 py-3 space-y-2">
                                    {terbaru.map((t, i) => (
                                        <div key={i} className="flex items-start gap-3 py-2
                                            border-b border-gray-50 last:border-0">
                                            {/* Type dot */}
                                            <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                                                t.color === 'red'   ? 'bg-red-400' :
                                                t.color === 'green' ? 'bg-emerald-400' :
                                                t.color === 'blue'  ? 'bg-blue-400' : 'bg-gray-300'
                                            }`} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-gray-700 truncate">{t.title}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                                                        t.color === 'red'   ? 'bg-red-100 text-red-700' :
                                                        t.color === 'green' ? 'bg-emerald-100 text-emerald-700' :
                                                        t.color === 'blue'  ? 'bg-blue-100 text-blue-700' :
                                                        'bg-gray-100 text-gray-600'
                                                    }`}>{t.type}</span>
                                                    {t.kode && (
                                                        <span className="font-mono text-xs text-gray-500">{t.kode}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="shrink-0 text-right">
                                                {t.poin != null && (
                                                    <p className={`text-xs font-bold ${
                                                        t.color === 'red'   ? 'text-red-500' :
                                                        t.color === 'green' ? 'text-emerald-600' : 'text-gray-500'
                                                    }`}>
                                                        {t.color === 'red' ? '-' : t.poin > 0 ? '+' : ''}{t.poin}p
                                                    </p>
                                                )}
                                                <p className="text-xs text-gray-400 mt-0.5">{t.date_display}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}

                        {/* Expert Point aktif */}
                        {epAktif.length > 0 && (
                            <Card>
                                <CardHead
                                    title="Expert Point -- Perlu Tindakan"
                                    sub="Konsekuensi dan reward yang masih aktif"
                                    action={
                                        <Link href={route('my-expert-system-point.index')}
                                            className="text-xs text-violet-600 hover:text-violet-800 font-medium flex items-center gap-0.5">
                                            Semua <Ic n="arrow" cls="w-3 h-3" />
                                        </Link>
                                    }
                                />
                                <div className="px-4 py-3 space-y-2.5">
                                    {epAktif.map((item, i) => (
                                        <Link key={i} href={route('my-expert-system-point.show', item.id)}
                                            className={`flex items-start gap-3 p-3 rounded-xl border
                                                transition hover:shadow-sm ${
                                                item.jenis === 'konsekuensi'
                                                    ? 'border-rose-200 bg-rose-50/60'
                                                    : 'border-emerald-200 bg-emerald-50/60'
                                            }`}>
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 font-bold ${
                                                item.jenis === 'konsekuensi'
                                                    ? 'bg-rose-100 text-rose-600'
                                                    : 'bg-emerald-100 text-emerald-600'
                                            }`}>
                                                <Ic n="zap" cls="w-4 h-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                                                    <span className="font-mono text-xs font-bold text-gray-600">{item.kode}</span>
                                                    <Pill status={item.jenis === 'konsekuensi' ? 'pending' : 'completed'}
                                                        label={item.jenis_label} />
                                                    {item.is_terlambat && (
                                                        <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-medium">
                                                            Terlambat
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs font-medium text-gray-800 truncate">{item.konsekuensi_reward}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-xs text-gray-400">{item.tanggal_trigger}</span>
                                                    {item.sisa_hari != null && (
                                                        <span className={`text-xs font-medium ${
                                                            item.sisa_hari <= 3 ? 'text-red-600' : 'text-gray-500'
                                                        }`}>
                                                            {item.sisa_hari > 0 ? `${item.sisa_hari}h lagi` : 'Deadline hari ini'}
                                                        </span>
                                                    )}
                                                    {!item.has_bukti && item.jenis === 'konsekuensi' && (
                                                        <span className="text-xs text-amber-600 font-medium flex items-center gap-0.5">
                                                            <Ic n="upload" cls="w-3 h-3" /> Belum ada bukti
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <p className={`text-xs font-bold shrink-0 ${
                                                item.jenis === 'konsekuensi' ? 'text-rose-600' : 'text-emerald-600'
                                            }`}>{item.total_poin}p</p>
                                        </Link>
                                    ))}
                                </div>
                            </Card>
                        )}

                        {/* Laporan Konselor pending approval */}
                        {konselorP.length > 0 && (
                            <Card>
                                <CardHead
                                    title="Laporan Konseling"
                                    sub="Menunggu persetujuan wali / Guru BK"
                                />
                                <div className="px-4 py-3 space-y-2">
                                    {konselorP.map((item, i) => (
                                        <div key={i} className="p-3 rounded-xl bg-violet-50 border border-violet-100">
                                            <div className="flex items-center justify-between mb-1.5">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span className="font-mono text-xs font-bold text-gray-500 bg-white border rounded px-1.5 py-0.5 shrink-0">
                                                        {item.kode}
                                                    </span>
                                                    <p className="text-xs font-medium text-gray-800 truncate">{item.diagnosis}</p>
                                                </div>
                                                <Pill status={item.approval_status} label={item.approval_status_label} />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <PBar v={item.approval_progress} c="bg-violet-500" />
                                                <span className="text-xs text-gray-400 shrink-0">{item.approval_progress}%</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}

                        {/* All clear */}
                        {!adaAksi && (
                            <Card cls="p-5">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center shrink-0">
                                        <Ic n="check" cls="w-5 h-5 text-violet-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-800">Semua Berjalan Baik</p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            Tidak ada konsekuensi atau laporan aktif yang perlu ditindaklanjuti.
                                        </p>
                                    </div>
                                    <Link href={route('my-profil.index')}
                                        className="ml-auto shrink-0 text-xs text-violet-600 hover:text-violet-800 font-medium flex items-center gap-0.5">
                                        Rekam Jejak <Ic n="arrow" cls="w-3 h-3" />
                                    </Link>
                                </div>
                            </Card>
                        )}
                    </div>

                    {/* ==== KANAN 2/5 ==== */}
                    <div className="lg:col-span-2 space-y-4">

                        {/* Ringkasan angka */}
                        <Card>
                            <CardHead title="Ringkasan Saya" />
                            <div className="px-4 py-3 space-y-2.5">
                                {[
                                    { label: 'Pelanggaran',   val: ring.pelanggaran  ?? 0, c: 'bg-red-500',     lc: 'text-red-700',     href: route('my-profil.index') },
                                    { label: 'Apresiasi',     val: ring.apresiasi    ?? 0, c: 'bg-emerald-500', lc: 'text-emerald-700', href: route('my-profil.index') },
                                    { label: 'Konseling BK',  val: ring.konseling    ?? 0, c: 'bg-blue-500',    lc: 'text-blue-700',    href: route('my-profil.index') },
                                    { label: 'Bimbingan ES',  val: ring.es_konselor  ?? 0, c: 'bg-violet-500',  lc: 'text-violet-700',  href: route('my-konseling.index') },
                                    { label: 'Konsekuensi',   val: ring.konsekuensi  ?? 0, c: 'bg-rose-500',    lc: 'text-rose-700',    href: route('my-expert-system-point.index') },
                                    { label: 'Reward',        val: ring.reward       ?? 0, c: 'bg-teal-500',    lc: 'text-teal-700',    href: route('my-expert-system-point.index') },
                                ].map((item, i) => (
                                    <Link key={i} href={item.href}
                                        className="flex items-center justify-between hover:bg-gray-50 rounded-lg px-1 py-1 transition group">
                                        <span className="text-xs text-gray-600 group-hover:text-gray-900">{item.label}</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div className={`h-full ${item.c} rounded-full transition-all`}
                                                     style={{ width: `${Math.min((item.val / Math.max(ring.pelanggaran + ring.apresiasi, 1)) * 200, 100)}%` }} />
                                            </div>
                                            <span className={`text-sm font-bold ${item.lc} w-6 text-right`}>{item.val}</span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                            <div className="px-4 pb-3">
                                <PoinBalance
                                    pelanggaran={ring.pelanggaran ?? 0}
                                    apresiasi={ring.apresiasi ?? 0}
                                />
                                <div className="flex justify-between text-xs text-gray-400 mt-1">
                                    <span>Apresiasi {ring.apresiasi ?? 0}p</span>
                                    <span>Pelanggaran {ring.pelanggaran ?? 0}p</span>
                                </div>
                            </div>
                        </Card>

                        {/* Info Kelas + Wali */}
                        {d.kelas && (
                            <Card>
                                <CardHead title="Kelas Saya" />
                                <div className="px-4 py-3 space-y-3">
                                    <div className="bg-violet-50 border border-violet-200 rounded-xl p-3">
                                        <p className="text-base font-bold text-violet-900">{d.kelas.kode}</p>
                                        <p className="text-xs text-violet-600 truncate">{d.kelas.nama}</p>
                                        {d.kelas.tahun_ajaran && (
                                            <p className="text-xs text-violet-400 mt-0.5">TA {d.kelas.tahun_ajaran}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        {d.wali_kelas && (
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 bg-emerald-100 text-emerald-700 font-bold text-xs rounded-full flex items-center justify-center shrink-0">
                                                    {d.wali_kelas.nama?.[0]?.toUpperCase() ?? '?'}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-medium text-gray-800 truncate">{d.wali_kelas.nama}</p>
                                                    <p className="text-xs text-gray-400">Wali Kelas</p>
                                                </div>
                                            </div>
                                        )}
                                        {(d.wali_asrama || []).map((w, i) => (
                                            <div key={i} className="flex items-center gap-2">
                                                <div className="w-7 h-7 bg-blue-100 text-blue-700 font-bold text-xs rounded-full flex items-center justify-center shrink-0">
                                                    {w.nama?.[0]?.toUpperCase() ?? '?'}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-medium text-gray-800 truncate">{w.nama}</p>
                                                    <p className="text-xs text-gray-400">Wali Asrama</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </Card>
                        )}

                        {/* Konseling ES aktif */}
                        {konseling.length > 0 && (
                            <Card>
                                <CardHead
                                    title="Bimbingan Aktif"
                                    action={
                                        <Link href={route('my-konseling.index')}
                                            className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                                            Semua
                                        </Link>
                                    }
                                />
                                <div className="px-4 py-3 space-y-2.5">
                                    {konseling.map((item, i) => (
                                        <div key={i} className="p-2.5 bg-blue-50 rounded-xl border border-blue-100">
                                            <div className="flex items-start justify-between gap-2 mb-1">
                                                <p className="text-xs font-semibold text-blue-900 truncate">{item.diagnosis_nama}</p>
                                                <Pill status={item.status} label={item.status_label} />
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs text-blue-500 mb-1.5">
                                                <span className="font-mono">{item.rule_kode}</span>
                                                <span>Sesi {item.sesi_terakhir}/5</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <PBar v={item.progress} c="bg-blue-500" />
                                                <span className="text-xs text-blue-500 shrink-0">{item.progress}%</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}

                        {/* Menu Cepat */}
                        <Card>
                            <CardHead title="Menu Cepat" />
                            <div className="px-4 py-3 grid grid-cols-2 gap-2">
                                {[
                                    { href: route('my-profil.index'),                    n: 'chart',   label: 'Rekam Jejak',  bg: 'bg-violet-100', tc: 'text-violet-600', hv: 'hover:bg-violet-50' },
                                    { href: route('my-expert-system-point.index'),        n: 'zap',     label: 'Expert Point', bg: 'bg-rose-100',   tc: 'text-rose-600',   hv: 'hover:bg-rose-50'   },
                                    { href: route('my-konseling.index'),                  n: 'heart',   label: 'Konseling',    bg: 'bg-blue-100',   tc: 'text-blue-600',   hv: 'hover:bg-blue-50'   },
                                    { href: route('laporan.create'),                      n: 'report',  label: 'Buat Laporan', bg: 'bg-pink-100',   tc: 'text-pink-600',   hv: 'hover:bg-pink-50'   },
                                ].map((item, i) => (
                                    <Link key={i} href={item.href}
                                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl
                                            border border-gray-100 ${item.hv} transition group`}>
                                        <div className={`w-8 h-8 rounded-lg ${item.bg} ${item.tc}
                                            flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                            <Ic n={item.n} cls="w-4 h-4" />
                                        </div>
                                        <span className="text-xs font-semibold text-gray-700 text-center">{item.label}</span>
                                    </Link>
                                ))}
                            </div>
                        </Card>

                    </div>
                </div>
            </div>
        </SantriLayout>
    );
}