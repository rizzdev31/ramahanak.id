/**
 * Dashboard/TenagaPendidik.jsx — compact 2-column layout
 */
import { Head, Link } from '@inertiajs/react';
import TenagaPendidikLayout from '@/Layouts/TenagaPendidik/TenagaPendidikLayout';
import {
    BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

// ── Icon ──────────────────────────────────────────────────────
const P = {
    kelas:    'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    users:    'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
    users:    'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
    pending:  'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    warning:  'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-1.964-1.333-2.732 0L3.072 16c-.77 1.333.192 3 1.732 3z',
    book:     'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
    report:   'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    arrow:    'M13 7l5 5m0 0l-5 5m5-5H6',
    check:    'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    create:   'M12 4v16m8-8H4',
    calendar: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
};
const Icon = ({ name, className = 'w-4 h-4' }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={P[name] || P.report} />
    </svg>
);

// ── Helpers ───────────────────────────────────────────────────
const THEME = {
    blue:   'ring-blue-200 bg-blue-50 text-blue-600',
    green:  'ring-emerald-200 bg-emerald-50 text-emerald-600',
    yellow: 'ring-amber-200 bg-amber-50 text-amber-600',
    red:    'ring-rose-200 bg-rose-50 text-rose-600',
    indigo: 'ring-indigo-200 bg-indigo-50 text-indigo-600',
};

function MiniStat({ label, value, color = 'blue', icon }) {
    const t = THEME[color] || THEME.blue;
    return (
        <div className={`bg-white rounded-xl p-4 ring-1 ${t.split(' ')[0]} flex items-center gap-3`}>
            <div className={`w-9 h-9 rounded-lg ${t.split(' ')[1]} ${t.split(' ')[2]} flex items-center justify-center shrink-0`}>
                <Icon name={icon} className="w-4 h-4" />
            </div>
            <div className="min-w-0">
                <p className="text-xl font-bold text-gray-900 leading-none">{value}</p>
                <p className="text-xs text-gray-500 mt-0.5 truncate">{label}</p>
            </div>
        </div>
    );
}

function ProgressBar({ value, color = 'bg-emerald-500' }) {
    return (
        <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div className={`h-1.5 rounded-full ${color} transition-all`} style={{ width: `${Math.min(value, 100)}%` }} />
        </div>
    );
}

const TTip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-gray-200 rounded-lg shadow px-3 py-2 text-xs">
            <p className="font-semibold text-gray-700 mb-1">{label}</p>
            {payload.map((p, i) => <p key={i} style={{ color: p.color || p.fill }}>{p.name}: {p.value}</p>)}
        </div>
    );
};

const TL_COLOR = { Aman: '#10B981', Pantau: '#F59E0B', Dirujuk: '#EF4444' };

// ── Main ──────────────────────────────────────────────────────
export default function DashboardTenagaPendidik({ auth, dashboardData }) {
    const d = dashboardData || {};
    const now = new Date();
    const greeting = now.getHours() < 11 ? 'Selamat Pagi'
        : now.getHours() < 15 ? 'Selamat Siang'
        : now.getHours() < 18 ? 'Selamat Sore' : 'Selamat Malam';

    const pendingCount  = d.stats?.find(s => s.label === 'Approval Pending')?.value ?? 0;
    const overdueCount  = d.stats?.find(s => s.label === 'Overdue')?.value ?? 0;
    const jadwalCount   = d.stats?.find(s => s.label === 'Jadwal Bimbingan')?.value ?? 0;
    const hasTlData     = (d.chart_tindak_lanjut || []).some(x => x.value > 0);

    return (
        <TenagaPendidikLayout user={auth.user} header="Dashboard">
            <Head title="Dashboard — Tenaga Pendidik" />

            <div className="py-5 px-4 sm:px-6 lg:px-8 space-y-5">

                {/* ── HERO ─────────────────────────────────── */}
                <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 rounded-2xl p-5 text-white shadow-lg">
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/5 rounded-full" />
                        <div className="absolute -bottom-6 left-1/3 w-20 h-20 bg-white/5 rounded-full" />
                    </div>
                    <div className="relative flex items-center gap-4">
                        {/* Avatar */}
                        <div className="w-12 h-12 rounded-xl bg-white/20 text-white font-bold text-lg flex items-center justify-center uppercase shrink-0">
                            {(d.nama || '?')[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-emerald-200 text-xs font-medium">{greeting} 👋</p>
                            <h1 className="text-lg font-bold truncate">{d.nama}</h1>
                            <p className="text-emerald-200 text-xs mt-0.5">{d.jabatan}</p>
                        </div>
                        {/* Alert chips — kanan */}
                        <div className="hidden sm:flex flex-col gap-1.5 items-end shrink-0">
                            {pendingCount > 0 && (
                                <Link href={route('laporan-wali.index')}
                                    className="inline-flex items-center gap-1 bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded-full text-xs font-medium transition">
                                    <span className="w-1.5 h-1.5 bg-amber-300 rounded-full animate-pulse" />
                                    {pendingCount} Pending
                                </Link>
                            )}
                            {overdueCount > 0 && (
                                <span className="inline-flex items-center gap-1 bg-rose-400/30 px-2.5 py-1 rounded-full text-xs font-medium">
                                    <span className="w-1.5 h-1.5 bg-rose-300 rounded-full" />
                                    {overdueCount} Overdue
                                </span>
                            )}
                            {jadwalCount > 0 && (
                                <Link href={route('bimbingan-kelas.index')}
                                    className="inline-flex items-center gap-1 bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded-full text-xs font-medium transition">
                                    <span className="w-1.5 h-1.5 bg-cyan-300 rounded-full" />
                                    {jadwalCount} Bimbingan
                                </Link>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── STATS ROW ────────────────────────────── */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {(d.stats || []).map((s, i) => (
                        <MiniStat key={i} label={s.label} value={s.value} color={s.color} icon={s.icon} />
                    ))}
                </div>

                {/* ── MAIN CONTENT: 2 KOLOM ────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                    {/* ── KIRI (2/3): Kelas + Approval ──────── */}
                    <div className="lg:col-span-2 space-y-5">

                        {/* Kelas Card — compact grid */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                            <h2 className="text-sm font-bold text-gray-900 mb-3">
                                Kelas yang Anda Ampu
                            </h2>
                            {(d.penugasan || []).length === 0 ? (
                                <div className="py-8 text-center text-gray-400 text-sm">
                                    <Icon name="kelas" className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                    Belum ada penugasan kelas
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {(d.penugasan || []).map((kelas, i) => {
                                        const hasAlert = kelas.pelanggaran_aktif > 0 || kelas.konseling_aktif > 0 || kelas.approval_pending > 0;
                                        return (
                                            <div key={i} className={`rounded-xl border p-4 transition ${
                                                hasAlert ? 'border-amber-200 bg-amber-50/40' : 'border-gray-200 bg-gray-50/40'
                                            }`}>
                                                {/* Kelas header */}
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className={`w-9 h-9 rounded-xl text-white text-xs font-bold flex items-center justify-center shrink-0 ${
                                                        kelas.jenis === 'wali_kelas' ? 'bg-emerald-500' : 'bg-teal-500'
                                                    }`}>
                                                        {kelas.kelas_kode.replace(/[^A-Z0-9]/gi, '').slice(0, 3)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-bold text-gray-900 truncate">{kelas.kelas_nama}</p>
                                                        <p className="text-xs text-gray-500">{kelas.jenis_label} · {kelas.jml_santri} santri</p>
                                                    </div>
                                                    {hasAlert && <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse shrink-0" />}
                                                </div>
                                                {/* Stats row */}
                                                <div className="grid grid-cols-3 gap-2 text-center mb-3">
                                                    <div>
                                                        <p className={`text-base font-bold ${kelas.pelanggaran_aktif > 0 ? 'text-rose-600' : 'text-gray-300'}`}>
                                                            {kelas.pelanggaran_aktif}
                                                        </p>
                                                        <p className="text-xs text-gray-400">Pelanggar</p>
                                                    </div>
                                                    <div>
                                                        <p className={`text-base font-bold ${kelas.konseling_aktif > 0 ? 'text-violet-600' : 'text-gray-300'}`}>
                                                            {kelas.konseling_aktif}
                                                        </p>
                                                        <p className="text-xs text-gray-400">Konseling</p>
                                                    </div>
                                                    <div>
                                                        <p className={`text-base font-bold ${kelas.approval_pending > 0 ? 'text-amber-600' : 'text-gray-300'}`}>
                                                            {kelas.approval_pending}
                                                        </p>
                                                        <p className="text-xs text-gray-400">Approve</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-100">
                                                    <span>📚 {kelas.jadwal_bimbingan} jadwal</span>
                                                    <div className="flex gap-2">
                                                        <Link href={route('santri-kelas.index') + '?kelas_id=' + kelas.kelas_id}
                                                            className="text-teal-600 hover:text-teal-800 font-medium flex items-center gap-0.5">
                                                            Santri <Icon name="arrow" className="w-3 h-3" />
                                                        </Link>
                                                        <Link href={route('laporan-wali.index')}
                                                            className="text-emerald-600 hover:text-emerald-800 font-medium flex items-center gap-0.5">
                                                            Laporan <Icon name="arrow" className="w-3 h-3" />
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Jadwal Bimbingan */}
                        {(d.jadwal_bimbingan || []).length > 0 && (
                            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                                <div className="flex items-center justify-between mb-3">
                                    <h2 className="text-sm font-bold text-gray-900">Jadwal Bimbingan di Kelas Anda</h2>
                                    <Link href={route('bimbingan-kelas.index')}
                                        className="text-xs text-teal-600 hover:text-teal-800 font-medium flex items-center gap-0.5">
                                        Semua <Icon name="arrow" className="w-3 h-3" />
                                    </Link>
                                </div>
                                <div className="space-y-2.5">
                                    {d.jadwal_bimbingan.map((j, i) => (
                                        <Link key={i} href={route('bimbingan-kelas.show', j.id)}
                                            className="flex items-center gap-3 p-2.5 rounded-xl border border-gray-100 hover:bg-gray-50 transition group">
                                            <div className={`w-8 h-8 rounded-lg text-white text-xs font-bold flex items-center justify-center shrink-0 ${
                                                j.status === 'selesai' ? 'bg-emerald-500' : j.status === 'berjalan' ? 'bg-amber-500' : 'bg-teal-500'
                                            }`}>
                                                {j.kelas}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-semibold text-gray-800 truncate group-hover:text-teal-700">{j.judul}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <ProgressBar value={j.persen} color={j.persen === 100 ? 'bg-emerald-500' : 'bg-teal-400'} />
                                                    <span className="text-xs text-gray-400 shrink-0">{j.selesai}/{j.total}</span>
                                                </div>
                                            </div>
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                                                j.status === 'selesai' ? 'bg-emerald-100 text-emerald-700' :
                                                j.status === 'berjalan' ? 'bg-amber-100 text-amber-700' :
                                                'bg-teal-100 text-teal-700'
                                            }`}>{j.status_label}</span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Approval pending */}
                        {(d.approval_list || []).length > 0 && (
                            <div className={`bg-white rounded-2xl border p-4 shadow-sm ${
                                overdueCount > 0 ? 'border-rose-200' : 'border-gray-200'
                            }`}>
                                <div className="flex items-center justify-between mb-3">
                                    <h2 className="text-sm font-bold text-gray-900">Laporan Perlu Disetujui</h2>
                                    <Link href={route('laporan-wali.index')}
                                        className="text-xs text-emerald-600 hover:text-emerald-800 font-medium flex items-center gap-0.5">
                                        Approve <Icon name="arrow" className="w-3 h-3" />
                                    </Link>
                                </div>
                                <div className="divide-y divide-gray-100">
                                    {d.approval_list.map((item, i) => (
                                        <Link key={i} href={route('laporan-wali.show', item.id)}
                                            className="py-2.5 flex items-center gap-3 hover:bg-gray-50 -mx-1 px-1 rounded-xl transition group">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                                item.is_overdue ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
                                            }`}>
                                                <Icon name={item.is_overdue ? 'warning' : 'pending'} className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-medium text-gray-900 truncate">{item.santri_nama}</p>
                                                <p className="text-xs text-gray-400">
                                                    {item.jenis}{item.deadline && ` · Deadline: ${item.deadline}`}
                                                </p>
                                            </div>
                                            {item.is_overdue && (
                                                <span className="text-xs bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-medium shrink-0">
                                                    Overdue
                                                </span>
                                            )}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── KANAN (1/3): Chart + Quick Actions ── */}
                    <div className="space-y-5">

                        {/* Chart tindak lanjut */}
                        {hasTlData ? (
                            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                                <h2 className="text-sm font-bold text-gray-900 mb-1">Hasil Bimbingan Berkala</h2>
                                <p className="text-xs text-gray-400 mb-3">Distribusi tindak lanjut di kelas Anda</p>
                                <ResponsiveContainer width="100%" height={140}>
                                    <PieChart>
                                        <Pie data={d.chart_tindak_lanjut} cx="50%" cy="50%"
                                            innerRadius={35} outerRadius={58}
                                            paddingAngle={3} dataKey="value">
                                            {d.chart_tindak_lanjut.map((e, i) => (
                                                <Cell key={i} fill={TL_COLOR[e.name] || '#9CA3AF'} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<TTip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="space-y-2 mt-1">
                                    {d.chart_tindak_lanjut.map((item, i) => {
                                        const total = d.chart_tindak_lanjut.reduce((s, x) => s + x.value, 0) || 1;
                                        const pct = Math.round((item.value / total) * 100);
                                        return (
                                            <div key={i}>
                                                <div className="flex justify-between text-xs mb-0.5">
                                                    <span className="text-gray-600 flex items-center gap-1.5">
                                                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: TL_COLOR[item.name] }} />
                                                        {item.name}
                                                    </span>
                                                    <span className="font-bold text-gray-800">{item.value}</span>
                                                </div>
                                                <ProgressBar value={pct}
                                                    color={item.name === 'Aman' ? 'bg-emerald-500' : item.name === 'Pantau' ? 'bg-amber-500' : 'bg-rose-500'} />
                                            </div>
                                        );
                                    })}
                                </div>
                                <Link href={route('bimbingan-kelas.index')}
                                    className="mt-3 flex items-center justify-center gap-1 text-xs text-teal-600 hover:text-teal-800 font-medium">
                                    Lihat Detail <Icon name="arrow" className="w-3 h-3" />
                                </Link>
                            </div>
                        ) : (
                            /* Jika belum ada bimbingan, tampilkan info */
                            <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4">
                                <Icon name="book" className="w-8 h-8 text-teal-400 mb-2" />
                                <p className="text-sm font-semibold text-teal-800">Belum Ada Data Bimbingan</p>
                                <p className="text-xs text-teal-600 mt-1">Data hasil bimbingan berkala di kelas Anda akan muncul di sini.</p>
                                <Link href={route('bimbingan-kelas.index')}
                                    className="mt-2 inline-flex items-center gap-1 text-xs text-teal-700 hover:text-teal-900 font-medium">
                                    Cek Jadwal <Icon name="arrow" className="w-3 h-3" />
                                </Link>
                            </div>
                        )}

                        {/* Chart santri per kelas (jika > 1 kelas) */}
                        {(d.chart_santri_per_kelas || []).length > 1 && (
                            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                                <h2 className="text-sm font-bold text-gray-900 mb-1">Santri per Kelas</h2>
                                <ResponsiveContainer width="100%" height={100}>
                                    <BarChart data={d.chart_santri_per_kelas} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                                        <XAxis dataKey="kelas" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                                        <Tooltip content={<TTip />} />
                                        <Bar dataKey="santri" name="Santri" fill="#10B981" radius={[3,3,0,0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}

                        {/* Quick Actions */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                            <h2 className="text-sm font-bold text-gray-900 mb-3">Aksi Cepat</h2>
                            <div className="space-y-2">
                                {[
                                    { href: route('santri-kelas.index'),    icon: 'users',   label: 'Santri Kelas',    sub: 'Pantau kondisi santri',     color: 'hover:border-emerald-300 hover:bg-emerald-50', ic: 'bg-emerald-100 text-emerald-600' },
                                    { href: route('laporan-wali.index'),    icon: 'report',  label: 'Laporan Wali',    sub: 'Review & approve laporan',  color: 'hover:border-green-300 hover:bg-green-50',    ic: 'bg-green-100 text-green-600'    },
                                    { href: route('bimbingan-kelas.index'), icon: 'book',    label: 'Jadwal Bimbingan',sub: 'Pantau progress bimbingan', color: 'hover:border-teal-300 hover:bg-teal-50',      ic: 'bg-teal-100 text-teal-600'      },
                                    { href: route('laporan.create'),        icon: 'create',  label: 'Buat Laporan',    sub: 'Buat laporan santri baru',  color: 'hover:border-indigo-300 hover:bg-indigo-50',  ic: 'bg-indigo-100 text-indigo-600'  },
                                ].map((item, i) => (
                                    <Link key={i} href={item.href}
                                        className={`flex items-center gap-3 p-3 rounded-xl border-2 border-gray-100 transition group ${item.color}`}>
                                        <div className={`w-9 h-9 rounded-lg ${item.ic} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                                            <Icon name={item.icon} className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                                            <p className="text-xs text-gray-400">{item.sub}</p>
                                        </div>
                                        <Icon name="arrow" className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-600 shrink-0" />
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </TenagaPendidikLayout>
    );
}