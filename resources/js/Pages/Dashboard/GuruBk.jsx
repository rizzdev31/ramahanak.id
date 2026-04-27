/**
 * Dashboard/GuruBk.jsx
 * Dashboard Guru BK - modern, data-rich, professional
 * Mengintegrasikan data bimbingan berkala dengan pipeline yang sudah ada.
 */
import { Head, Link } from '@inertiajs/react';
import GuruBkLayout from '@/Layouts/GuruBk/GuruBkLayout';
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    LineChart, Line,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

//  Icon SVG helper 
const PATHS = {
    users:    'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
    kelas:    'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    staff:    'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
    pending:  'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    warning:  'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-1.964-1.333-2.732 0L3.072 16c-.77 1.333.192 3 1.732 3z',
    arrow:    'M13 7l5 5m0 0l-5 5m5-5H6',
    chart:    'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    book:     'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
    check:    'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    approve:  'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z',
    eye:      'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
    calendar: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    play:     'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
};

const Icon = ({ name, className = 'w-5 h-5' }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={PATHS[name] || PATHS.chart} />
    </svg>
);

//  Stat Card 
const CARD_THEME = {
    blue:   { grad: 'from-blue-500 to-blue-600',     light: 'bg-blue-50 text-blue-600',   ring: 'ring-blue-200'   },
    green:  { grad: 'from-emerald-500 to-emerald-600', light: 'bg-emerald-50 text-emerald-600', ring: 'ring-emerald-200' },
    purple: { grad: 'from-violet-500 to-violet-600', light: 'bg-violet-50 text-violet-600', ring: 'ring-violet-200' },
    yellow: { grad: 'from-amber-400 to-amber-500',   light: 'bg-amber-50 text-amber-600',  ring: 'ring-amber-200'  },
    red:    { grad: 'from-rose-500 to-rose-600',     light: 'bg-rose-50 text-rose-600',    ring: 'ring-rose-200'   },
    indigo: { grad: 'from-indigo-500 to-indigo-600', light: 'bg-indigo-50 text-indigo-600', ring: 'ring-indigo-200' },
    teal:   { grad: 'from-teal-500 to-teal-600',     light: 'bg-teal-50 text-teal-600',    ring: 'ring-teal-200'   },
};

function StatCard({ label, value, color = 'blue', icon = 'chart', href, delta }) {
    const t = CARD_THEME[color] || CARD_THEME.blue;
    const Inner = (
        <div className={`bg-white rounded-2xl p-5 border ring-1 ${t.ring} hover:shadow-lg transition-all duration-200 group`}>
            <div className="flex items-start justify-between mb-4">
                <div className={`w-11 h-11 rounded-xl ${t.light} flex items-center justify-center`}>
                    <Icon name={icon} className="w-5 h-5" />
                </div>
                {href && (
                    <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                )}
            </div>
            <p className="text-3xl font-bold text-gray-900 leading-none">{value}</p>
            <p className="text-sm text-gray-500 mt-1.5 font-medium">{label}</p>
            {delta !== undefined && (
                <p className={`text-xs mt-2 font-medium ${delta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {delta >= 0 ? '' : ''} {Math.abs(delta)} bulan ini
                </p>
            )}
        </div>
    );
    return href ? <Link href={href}>{Inner}</Link> : Inner;
}

//  Section header 
function SectionTitle({ title, subtitle, action }) {
    return (
        <div className="flex items-end justify-between mb-4">
            <div>
                <h2 className="text-base font-bold text-gray-900">{title}</h2>
                {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
            </div>
            {action}
        </div>
    );
}

//  Chart card wrapper 
function ChartCard({ title, subtitle, icon, iconColor, children }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
                <div className={`w-9 h-9 rounded-xl ${iconColor ?? 'bg-indigo-100 text-indigo-600'} flex items-center justify-center`}>
                    <Icon name={icon} className="w-4 h-4" />
                </div>
                <div>
                    <p className="text-sm font-bold text-gray-900">{title}</p>
                    {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
                </div>
            </div>
            {children}
        </div>
    );
}

//  Custom tooltip 
const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-sm">
            <p className="font-semibold text-gray-700 mb-1">{label}</p>
            {payload.map((p, i) => (
                <p key={i} style={{ color: p.color }} className="font-medium">
                    {p.name}: {p.value}
                </p>
            ))}
        </div>
    );
};

//  Progress bar 
function ProgressBar({ value, color = 'bg-indigo-500' }) {
    return (
        <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div className={`h-1.5 rounded-full ${color} transition-all duration-500`} style={{ width: `${Math.min(value, 100)}%` }} />
        </div>
    );
}

//  Avatar 
function Avatar({ foto, nama, size = 'sm' }) {
    const sz = size === 'lg' ? 'w-12 h-12 text-base' : 'w-9 h-9 text-xs';
    if (foto) {
        return <img src={foto} alt={nama} className={`${sz} rounded-full object-cover ring-2 ring-white`}
            onError={e => { e.target.onerror = null; e.target.src = '/storage/defaultavatar.png'; }} />;
    }
    return (
        <div className={`${sz} rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-white flex items-center justify-center font-bold uppercase ring-2 ring-white`}>
            {(nama || '?')[0]}
        </div>
    );
}

// 
// MAIN COMPONENT
// 
export default function DashboardGuruBk({ auth, dashboardData }) {
    const d = dashboardData || {};
    const bimbingan = d.bimbingan || {};
    const laporanBaru = d.laporanBaru || [];
    const statistikPending = d.statistikPending || [];
    const now = new Date();
    const greeting = now.getHours() < 11 ? 'Selamat Pagi' : now.getHours() < 15 ? 'Selamat Siang' : now.getHours() < 18 ? 'Selamat Sore' : 'Selamat Malam';

    // Total laporan pending semua jenis
    const totalPendingBk = statistikPending.reduce((s, x) => s + (x.pending_bk || 0), 0);
    const totalPendingWali = statistikPending.reduce((s, x) => s + (x.pending_wali || 0), 0);

    const TL_COLOR = { 'Tidak Perlu': '#10B981', 'Dipantau': '#F59E0B', 'Rujuk Konseling': '#EF4444' };

    return (
        <GuruBkLayout user={auth.user}>
            <Head title="Dashboard - Guru BK" />

            <div className="min-h-screen bg-gray-50/60 py-6 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto space-y-6">

                    {/* 
                        HERO HEADER
                     */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-indigo-200">
                        {/* Background decoration */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                        <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-white/5 rounded-full translate-y-1/2" />

                        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <p className="text-indigo-200 text-sm font-medium mb-1">{greeting} </p>
                                <h1 className="text-2xl md:text-3xl font-bold">{d.nama}</h1>
                                <p className="text-indigo-200 mt-1">{d.jabatan} &bull; Sistem Pakar BK</p>

                                {/* Quick alert badges */}
                                <div className="flex flex-wrap gap-2 mt-4">
                                    {(d.stats?.find(s => s.label === 'Menunggu Persetujuan')?.value ?? 0) > 0 && (
                                        <Link href={route('manage-user.index')}
                                            className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 transition px-3 py-1.5 rounded-full text-xs font-medium">
                                            <span className="w-2 h-2 bg-amber-300 rounded-full animate-pulse" />
                                            {d.stats.find(s => s.label === 'Menunggu Persetujuan').value} User Pending
                                        </Link>
                                    )}
                                    {bimbingan.jadwal_aktif > 0 && (
                                        <Link href={route('my-bimbingan.jadwal.index')}
                                            className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 transition px-3 py-1.5 rounded-full text-xs font-medium">
                                            <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse" />
                                            {bimbingan.jadwal_aktif} Jadwal Aktif
                                        </Link>
                                    )}
                                    {bimbingan.konselor_pending_bk > 0 && (
                                        <Link href={route('kelola-approval.index')}
                                            className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 transition px-3 py-1.5 rounded-full text-xs font-medium">
                                            <span className="w-2 h-2 bg-red-300 rounded-full animate-pulse" />
                                            {bimbingan.konselor_pending_bk} Laporan Butuh Approve BK
                                        </Link>
                                    )}
                                </div>
                            </div>

                            {/* Date */}
                            <div className="text-right shrink-0">
                                <p className="text-3xl font-bold">{now.getDate()}</p>
                                <p className="text-indigo-200 text-sm">
                                    {now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 
                        STAT CARDS - Baris 1: Institusi
                     */}
                    <div>
                        <SectionTitle title="Ringkasan Institusi" />
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                            {(d.stats || []).map((stat, i) => (
                                <StatCard key={i} label={stat.label} value={stat.value} color={stat.color} icon={stat.icon}
                                    href={stat.label === 'Total Santri Aktif' ? route('santri.index') :
                                          stat.label === 'Total Kelas Aktif'  ? route('kelas.index')  :
                                          stat.label === 'Menunggu Persetujuan' ? route('manage-user.index') : undefined}
                                />
                            ))}
                        </div>
                    </div>

                    {/* 
                        STAT CARDS - Baris 2: Bimbingan Berkala
                     */}
                    <div>
                        <SectionTitle
                            title="Bimbingan Berkala"
                            subtitle="Fitur bimbingan proaktif per kelas"
                            action={
                                <Link href={route('my-bimbingan.jadwal.index')}
                                    className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1">
                                    Kelola Jadwal <Icon name="arrow" className="w-4 h-4" />
                                </Link>
                            }
                        />
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                            <StatCard label="Total Jadwal"   value={bimbingan.total_jadwal ?? 0}   color="indigo" icon="calendar" href={route('my-bimbingan.jadwal.index')} />
                            <StatCard label="Jadwal Aktif"   value={bimbingan.jadwal_aktif ?? 0}   color="green"  icon="play"    href={route('my-bimbingan.jadwal.index')} />
                            <StatCard label="Jadwal Selesai" value={bimbingan.jadwal_selesai ?? 0} color="teal"   icon="check"   />
                            <StatCard label="Sesi Selesai"   value={bimbingan.total_sesi ?? 0}     color="blue"   icon="book"    href={route('my-bimbingan.logbook')} />
                            <StatCard label="Laporan Pending Wali" value={bimbingan.konselor_pending_tendik ?? 0} color="yellow" icon="pending" href={route('laporan-konselor.index')} />
                            <StatCard label="Approve BK"    value={bimbingan.konselor_pending_bk ?? 0}  color="red"    icon="approve" href={route('kelola-approval.index')} />
                        </div>
                    </div>

                    {/* 
                        CHARTS - Baris 1
                     */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                        {/* Chart: Trend Laporan 6 Bulan */}
                        <div className="lg:col-span-2">
                            <ChartCard title="Trend Laporan 6 Bulan" subtitle="Pelanggaran vs Apresiasi"
                                icon="chart" iconColor="bg-indigo-100 text-indigo-600">
                                <ResponsiveContainer width="100%" height={220}>
                                    <AreaChart data={d.chartLaporan || []} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="gradPelanggaran" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%"  stopColor="#EF4444" stopOpacity={0.15} />
                                                <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="gradApresiasi" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%"  stopColor="#10B981" stopOpacity={0.15} />
                                                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="bulan" tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                                        <Area type="monotone" dataKey="pelanggaran" name="Pelanggaran" stroke="#EF4444" strokeWidth={2} fill="url(#gradPelanggaran)" />
                                        <Area type="monotone" dataKey="apresiasi"   name="Apresiasi"   stroke="#10B981" strokeWidth={2} fill="url(#gradApresiasi)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </ChartCard>
                        </div>

                        {/* Chart: Tindak Lanjut Bimbingan */}
                        <div>
                            <ChartCard title="Tindak Lanjut Bimbingan" subtitle="Distribusi keputusan BK"
                                icon="book" iconColor="bg-teal-100 text-teal-600">
                                <ResponsiveContainer width="100%" height={150}>
                                    <PieChart>
                                        <Pie data={d.chartTindakLanjut || []} cx="50%" cy="50%"
                                            innerRadius={40} outerRadius={65}
                                            paddingAngle={3} dataKey="value">
                                            {(d.chartTindakLanjut || []).map((entry, i) => (
                                                <Cell key={i} fill={TL_COLOR[entry.name] || '#6B7280'} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                                {/* Legend manual lebih rapi */}
                                <div className="space-y-2 mt-2">
                                    {(d.chartTindakLanjut || []).map((item, i) => (
                                        <div key={i} className="flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-2">
                                                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: TL_COLOR[item.name] }} />
                                                <span className="text-gray-600">{item.name}</span>
                                            </div>
                                            <span className="font-semibold text-gray-800">{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </ChartCard>
                        </div>
                    </div>

                    {/* 
                        CHARTS - Baris 2
                     */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                        {/* Chart: Trend Sesi Bimbingan */}
                        <div className="lg:col-span-2">
                            <ChartCard title="Trend Sesi Bimbingan Berkala" subtitle="Selesai, Pantau, Rujuk per bulan"
                                icon="book" iconColor="bg-teal-100 text-teal-600">
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={d.chartBimbingan || []} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                                        <XAxis dataKey="bulan" tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                                        <Bar dataKey="selesai" name="Selesai"  fill="#6366F1" radius={[3,3,0,0]} />
                                        <Bar dataKey="pantau"  name="Dipantau" fill="#F59E0B" radius={[3,3,0,0]} />
                                        <Bar dataKey="rujuk"   name="Dirujuk"  fill="#EF4444" radius={[3,3,0,0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </ChartCard>
                        </div>

                        {/* Chart: Perkembangan Santri */}
                        <div>
                            <ChartCard title="Kategori Santri" subtitle="Berdasarkan saldo poin"
                                icon="users" iconColor="bg-blue-100 text-blue-600">
                                <div className="space-y-3">
                                    {(d.chartPerkembanganSantri || []).map((item, i) => {
                                        const total = (d.chartPerkembanganSantri || []).reduce((s, x) => s + x.jumlah, 0) || 1;
                                        const pct   = Math.round((item.jumlah / total) * 100);
                                        return (
                                            <div key={i}>
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span className="text-gray-600 font-medium">{item.kategori}</span>
                                                    <span className="font-bold text-gray-800">{item.jumlah} <span className="text-gray-400 font-normal">({pct}%)</span></span>
                                                </div>
                                                <div className="w-full bg-gray-100 rounded-full h-2">
                                                    <div className="h-2 rounded-full transition-all duration-700"
                                                        style={{ width: `${pct}%`, background: item.color }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Expert system quick stats */}
                                <div className="mt-5 pt-4 border-t border-gray-100">
                                    <p className="text-xs font-semibold text-gray-500 mb-2">Expert System Konselor</p>
                                    <div className="grid grid-cols-3 gap-2">
                                        {(d.chartExpertSystem || []).map((item, i) => (
                                            <div key={i} className="text-center">
                                                <p className="text-lg font-bold text-gray-800">{item.value}</p>
                                                <p className="text-xs text-gray-400">{item.status}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </ChartCard>
                        </div>
                    </div>

                    {/* 
                        TABEL + SANTRI PERLU PERHATIAN
                     */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                        {/* Jadwal Bimbingan Berjalan */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                            <SectionTitle
                                title="Jadwal Berjalan"
                                subtitle="Bimbingan aktif saat ini"
                                action={
                                    <Link href={route('my-bimbingan.jadwal.index')}
                                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                                        Lihat Semua
                                    </Link>
                                }
                            />
                            {(d.jadwalBerjalan || []).length === 0 ? (
                                <div className="py-8 text-center text-gray-400">
                                    <Icon name="calendar" className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                    <p className="text-sm">Tidak ada jadwal berjalan</p>
                                    <Link href={route('my-bimbingan.jadwal.create')}
                                        className="mt-3 inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                                        Buat Jadwal Baru <Icon name="arrow" className="w-3.5 h-3.5" />
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {d.jadwalBerjalan.map((j, i) => (
                                        <Link key={i} href={route('my-bimbingan.jadwal.show', j.id)}
                                            className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition group">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white text-xs font-bold ${
                                                j.status === 'berjalan' ? 'bg-green-500' : 'bg-indigo-500'
                                            }`}>
                                                {j.kelas}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-indigo-700">{j.judul}</p>
                                                <ProgressBar value={j.persen} color={j.persen === 100 ? 'bg-green-500' : 'bg-indigo-500'} />
                                                <p className="text-xs text-gray-400 mt-1">{j.selesai}/{j.total} santri &bull; {j.persen}%</p>
                                            </div>
                                            <Icon name="arrow" className="w-4 h-4 text-gray-300 group-hover:text-indigo-500 shrink-0" />
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Santri Perlu Perhatian */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                            <SectionTitle title="Santri Perlu Perhatian" subtitle="Poin pelanggaran tertinggi" />
                            <div className="space-y-2">
                                {(d.topSantriBermasalah || []).slice(0, 5).map((santri, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 bg-rose-50 rounded-xl">
                                        <div className="w-6 h-6 rounded-full bg-rose-200 text-rose-700 text-xs font-bold flex items-center justify-center shrink-0">
                                            {i + 1}
                                        </div>
                                        <Avatar foto={santri.foto} nama={santri.nama} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">{santri.nama}</p>
                                        </div>
                                        <span className="text-sm font-bold text-rose-600 shrink-0">{santri.poin}</span>
                                    </div>
                                ))}
                                {(d.topSantriBaik || []).length > 0 && (
                                    <>
                                        <div className="pt-2">
                                            <p className="text-xs font-semibold text-emerald-600 mb-2"> Santri Berprestasi</p>
                                            {d.topSantriBaik.slice(0, 3).map((santri, i) => (
                                                <div key={i} className="flex items-center gap-3 p-2 bg-emerald-50 rounded-xl mb-1.5">
                                                    <Avatar foto={santri.foto} nama={santri.nama} />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-900 truncate">{santri.nama}</p>
                                                    </div>
                                                    <span className="text-sm font-bold text-emerald-600 shrink-0">+{santri.poin}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 
                        MONITORING LAPORAN MASUK
                     */}
                    <div className="space-y-4">
                        <SectionTitle
                            title="Monitoring Laporan Masuk"
                            subtitle="Laporan aktif yang memerlukan perhatian BK"
                            action={
                                totalPendingBk > 0 && (
                                    <span className="inline-flex items-center gap-1.5 bg-red-100
                                        text-red-700 text-xs font-bold px-3 py-1 rounded-full ring-1 ring-red-200">
                                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                        {totalPendingBk} perlu aksi BK
                                    </span>
                                )
                            }
                        />

                        {/* Statistik bar per jenis */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                            {statistikPending.map((item, i) => {
                                const total = (item.pending_wali || 0) + (item.pending_bk || 0);
                                return (
                                    <Link key={i} href={route(item.route)}
                                        className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md
                                            transition group relative overflow-hidden">
                                        {/* Accent bar di atas */}
                                        <div className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
                                            style={{ background: item.color }} />
                                        <div className="mt-1">
                                            <p className="text-xs font-semibold text-gray-500 mb-2">{item.label}</p>
                                            <p className="text-2xl font-black text-gray-900 leading-none">{total}</p>
                                            <p className="text-xs text-gray-400 mt-1">laporan aktif</p>
                                            {/* Mini breakdown */}
                                            <div className="mt-3 space-y-1">
                                                {item.pending_wali > 0 && (
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs text-amber-600 flex items-center gap-1">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                                            Menunggu Wali
                                                        </span>
                                                        <span className="text-xs font-bold text-amber-700">{item.pending_wali}</span>
                                                    </div>
                                                )}
                                                {item.pending_bk > 0 && (
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs text-red-600 flex items-center gap-1">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                                            Perlu Aksi BK
                                                        </span>
                                                        <span className="text-xs font-bold text-red-700">{item.pending_bk}</span>
                                                    </div>
                                                )}
                                                {total === 0 && (
                                                    <p className="text-xs text-emerald-600 flex items-center gap-1">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                        Semua selesai
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Feed laporan terbaru */}
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
                                <div>
                                    <p className="text-sm font-bold text-gray-900">Feed Laporan Terbaru</p>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        {laporanBaru.length} laporan aktif dari semua kategori
                                    </p>
                                </div>
                                {totalPendingWali > 0 && (
                                    <span className="text-xs text-amber-700 bg-amber-50 px-2.5 py-1
                                        rounded-full ring-1 ring-amber-200 font-medium">
                                        {totalPendingWali} menunggu wali
                                    </span>
                                )}
                            </div>

                            {laporanBaru.length === 0 ? (
                                <div className="py-14 text-center">
                                    <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center
                                        justify-center mx-auto mb-3">
                                        <Icon name="check" className="w-6 h-6 text-emerald-500" />
                                    </div>
                                    <p className="text-sm font-semibold text-gray-700">Tidak ada laporan aktif</p>
                                    <p className="text-xs text-gray-400 mt-1">Semua laporan sudah ditangani</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-50">
                                    {laporanBaru.map((item, i) => {
                                        const COLOR = {
                                            red:     { bg: 'bg-red-100',     text: 'text-red-700',     dot: 'bg-red-400',     badge: 'bg-red-50 text-red-700 ring-red-200'     },
                                            emerald: { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-400', badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
                                            blue:    { bg: 'bg-blue-100',    text: 'text-blue-700',    dot: 'bg-blue-400',    badge: 'bg-blue-50 text-blue-700 ring-blue-200'    },
                                            amber:   { bg: 'bg-amber-100',   text: 'text-amber-700',   dot: 'bg-amber-400',   badge: 'bg-amber-50 text-amber-700 ring-amber-200'  },
                                        };
                                        const c = COLOR[item.color] || COLOR.blue;
                                        const isPendingBk = item.approval_status === 'pending_bk';

                                        return (
                                            <Link key={i}
                                                href={route(item.route_show, item.id)}
                                                className={`flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/70
                                                    transition group ${isPendingBk ? 'border-l-2 border-red-400' : ''}`}>

                                                {/* Jenis icon */}
                                                <div className={`w-9 h-9 rounded-xl ${c.bg} ${c.text}
                                                    flex items-center justify-center shrink-0 text-xs font-bold`}>
                                                    {item.jenis_label.substring(0, 2)}
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <span className={`text-xs font-semibold px-1.5 py-0.5
                                                            rounded ring-1 ${c.badge}`}>
                                                            {item.jenis_label}
                                                        </span>
                                                        <span className="font-mono text-xs text-gray-500 font-semibold">
                                                            {item.kode}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm font-medium text-gray-800 truncate">
                                                        {item.santri_nama}
                                                    </p>
                                                    <p className="text-xs text-gray-400 mt-0.5">{item.created_at}</p>
                                                </div>

                                                {/* Status badge */}
                                                <div className="shrink-0 flex flex-col items-end gap-1.5">
                                                    {isPendingBk ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1
                                                            bg-red-100 text-red-700 text-xs font-bold rounded-full
                                                            ring-1 ring-red-200">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                                            Aksi BK
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1
                                                            bg-amber-100 text-amber-700 text-xs font-medium rounded-full
                                                            ring-1 ring-amber-200">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                                            Menunggu Wali
                                                        </span>
                                                    )}
                                                    <svg className="w-3.5 h-3.5 text-gray-300 group-hover:text-indigo-400
                                                        transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                            d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                                    </svg>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Footer link ke semua laporan */}
                            {laporanBaru.length > 0 && (
                                <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/30 flex gap-3 flex-wrap">
                                    {[
                                        { label: 'Pelanggaran', route: 'laporan-pelanggaran.index', color: 'text-red-600 hover:text-red-800' },
                                        { label: 'Apresiasi',   route: 'laporan-apresiasi.index',   color: 'text-emerald-600 hover:text-emerald-800' },
                                        { label: 'Konseling',   route: 'laporan-konselor.index',    color: 'text-blue-600 hover:text-blue-800' },
                                        { label: 'Expert Point',route: 'expert-system-point.index', color: 'text-amber-600 hover:text-amber-800' },
                                    ].map((link, i) => (
                                        <Link key={i} href={route(link.route)}
                                            className={`text-xs font-semibold ${link.color} transition`}>
                                            Lihat semua {link.label}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 
                        QUICK ACTIONS
                     */}
                    <div>
                        <SectionTitle title="Aksi Cepat" />
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                            {[
                                { href: route('manage-user.index'),            icon: 'users',    label: 'Kelola User',       color: 'hover:border-blue-400 hover:bg-blue-50',   ic: 'bg-blue-100 text-blue-600'   },
                                { href: route('my-bimbingan.jadwal.create'),   icon: 'calendar', label: 'Buat Jadwal',        color: 'hover:border-indigo-400 hover:bg-indigo-50', ic: 'bg-indigo-100 text-indigo-600' },
                                { href: route('my-bimbingan.logbook'),         icon: 'book',     label: 'Logbook Santri',     color: 'hover:border-teal-400 hover:bg-teal-50',   ic: 'bg-teal-100 text-teal-600'   },
                                { href: route('santri.index'),                 icon: 'eye',      label: 'Monitoring Santri',  color: 'hover:border-purple-400 hover:bg-purple-50', ic: 'bg-purple-100 text-purple-600' },
                                { href: route('kelola-approval.index'),        icon: 'approve',  label: 'Kelola Approval',    color: 'hover:border-amber-400 hover:bg-amber-50',   ic: 'bg-amber-100 text-amber-600'  },
                                { href: route('laporan.create'),               icon: 'chart',    label: 'Buat Laporan',       color: 'hover:border-rose-400 hover:bg-rose-50',    ic: 'bg-rose-100 text-rose-600'   },
                            ].map((item, i) => (
                                <Link key={i} href={item.href}
                                    className={`group bg-white border-2 border-gray-200 rounded-xl p-4 transition-all duration-200 hover:shadow-md ${item.color}`}>
                                    <div className={`w-10 h-10 rounded-xl ${item.ic} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                                        <Icon name={item.icon} className="w-5 h-5" />
                                    </div>
                                    <p className="text-sm font-semibold text-gray-800 leading-tight">{item.label}</p>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* 
                        USER PENDING
                     */}
                    {(d.userPendingList || []).length > 0 && (
                        <div className="bg-white rounded-2xl border border-amber-200 p-5 shadow-sm">
                            <SectionTitle
                                title="User Menunggu Persetujuan"
                                action={
                                    <Link href={route('manage-user.index')}
                                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1">
                                        Kelola <Icon name="arrow" className="w-3.5 h-3.5" />
                                    </Link>
                                }
                            />
                            <div className="divide-y divide-gray-100">
                                {d.userPendingList.map((user, i) => (
                                    <div key={i} className="py-3 flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm uppercase shrink-0">
                                            {(user.nama || user.username || '?')[0]}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">{user.nama}</p>
                                            <p className="text-xs text-gray-400">{user.username} &bull; {user.role}</p>
                                        </div>
                                        <span className="text-xs bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full font-medium shrink-0">
                                            Pending
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </GuruBkLayout>
    );
}