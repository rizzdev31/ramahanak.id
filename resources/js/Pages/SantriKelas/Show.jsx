/**
 * SantriKelas/Show.jsx
 * Tenaga Pendidik - Profil lengkap santri di kelasnya.
 * Read-only: Pelanggaran, Apresiasi, Konseling, Expert Point,
 *            ES Konselor, Bimbingan Berkala.
 */
import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import TenagaPendidikLayout from '@/Layouts/TenagaPendidik/TenagaPendidikLayout';

// ---- Icon ---------------------------------------------------------------
const Icon = ({ d, className = 'w-4 h-4' }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
    </svg>
);
const IC = {
    back:    'M10 19l-7-7m0 0l7-7m-7 7h18',
    warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-1.964-1.333-2.732 0L3.072 16c-.77 1.333.192 3 1.732 3z',
    star:    'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
    heart:   'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
    chart:   'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    zap:     'M13 10V3L4 14h7v7l9-11h-7z',
    book:    'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
    check:   'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    clock:   'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    shield:  'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
};

// ---- Avatar -------------------------------------------------------------
function Avatar({ foto, nama, size = 'lg' }) {
    const sz = size === 'lg' ? 'w-16 h-16 text-2xl rounded-2xl' : 'w-9 h-9 text-sm rounded-full';
    if (foto) return (
        <img src={foto} alt={nama}
            className={`${sz} object-cover ring-4 ring-white/50`}
            onError={e => { e.target.onerror = null; e.target.src = '/storage/defaultavatar.png'; }} />
    );
    return (
        <div className={`${sz} bg-white/20 text-white font-bold flex items-center justify-center uppercase ring-4 ring-white/30`}>
            {(nama || '?')[0]}
        </div>
    );
}

// ---- Status badge -------------------------------------------------------
const BADGE_MAP = {
    red:    'bg-rose-100 text-rose-700 ring-rose-200',
    green:  'bg-emerald-100 text-emerald-700 ring-emerald-200',
    yellow: 'bg-amber-100 text-amber-700 ring-amber-200',
    blue:   'bg-blue-100 text-blue-700 ring-blue-200',
    purple: 'bg-violet-100 text-violet-700 ring-violet-200',
    gray:   'bg-gray-100 text-gray-600 ring-gray-200',
    indigo: 'bg-indigo-100 text-indigo-700 ring-indigo-200',
};
function Badge({ label, color = 'gray', dot = false }) {
    const cls = BADGE_MAP[color] ?? BADGE_MAP.gray;
    const DOT_COLOR = {
        red:'bg-rose-500', green:'bg-emerald-500', yellow:'bg-amber-400',
        blue:'bg-blue-500', purple:'bg-violet-500', gray:'bg-gray-400', indigo:'bg-indigo-500'
    };
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ${cls}`}>
            {dot && <span className={`w-1.5 h-1.5 rounded-full ${DOT_COLOR[color] ?? 'bg-gray-400'}`} />}
            {label}
        </span>
    );
}

// ---- Approval chip dengan dot animasi -----------------------------------
const APPROVAL_CFG = {
    pending_tenaga_pendidik: { color: 'yellow', label: 'Menunggu Wali', pulse: false },
    pending_bk:              { color: 'blue',   label: 'Menunggu BK',   pulse: true  },
    selesai:                 { color: 'green',  label: 'Selesai',       pulse: false },
    diberikan:               { color: 'green',  label: 'Diberikan',     pulse: false },
    diabaikan:               { color: 'gray',   label: 'Diabaikan',     pulse: false },
};
function ApprovalChip({ status, label }) {
    const cfg = APPROVAL_CFG[status] ?? { color: 'gray', label: label ?? status, pulse: false };
    return <Badge label={cfg.label} color={cfg.color} dot />;
}

// ---- Progress bar -------------------------------------------------------
function ProgressBar({ value, color = 'bg-emerald-500' }) {
    const pct = Math.min(value ?? 0, 100);
    return (
        <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div className={`h-1.5 rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
        </div>
    );
}

// ---- Empty state --------------------------------------------------------
function Empty({ icon, msg }) {
    return (
        <div className="py-14 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Icon d={IC[icon] ?? IC.check} className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500 font-medium">{msg}</p>
        </div>
    );
}

// ---- Card wrapper -------------------------------------------------------
function Card({ children, className = '' }) {
    return (
        <div className={`bg-white rounded-xl border border-gray-200 p-4 ${className}`}>
            {children}
        </div>
    );
}

// =========================================================================
// TAB: PELANGGARAN
// =========================================================================
function TabPelanggaran({ data }) {
    if (!data.length) return <Empty icon="warning" msg="Belum ada laporan pelanggaran" />;

    const APRV_COLOR = {
        pending_tenaga_pendidik: 'yellow', pending_bk: 'blue', selesai: 'green', diabaikan: 'gray',
    };

    return (
        <div className="space-y-3">
            {/* Ringkasan poin */}
            <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 flex items-center justify-between mb-1">
                <div>
                    <p className="text-xs text-rose-600 font-medium">Total Poin Pelanggaran</p>
                    <p className="text-2xl font-black text-rose-700">
                        -{data.reduce((s, l) => s + (l.bobot_poin ?? 0), 0)}p
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-rose-600">{data.length} laporan</p>
                    <p className="text-xs text-rose-500 mt-0.5">
                        {data.filter(l => l.approval_status !== 'selesai').length} belum selesai
                    </p>
                </div>
            </div>

            {data.map(item => (
                <Card key={item.id} className={
                    item.approval_status === 'pending_bk'
                        ? 'border-l-4 border-l-blue-400 border-blue-100'
                        : item.approval_status === 'selesai'
                        ? 'border-l-4 border-l-emerald-400 border-emerald-50'
                        : 'border-l-4 border-l-amber-400 border-amber-50'
                }>
                    {/* Row 1: kode + kategori + status */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-black bg-rose-100 text-rose-700 px-2 py-0.5 rounded">
                                {item.kode}
                            </span>
                            {item.kategori && item.kategori !== '-' && (
                                <Badge label={item.kategori} color="gray" />
                            )}
                        </div>
                        <ApprovalChip status={item.approval_status} label={item.approval_status_label} />
                    </div>

                    {/* Row 2: tindakan + poin */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                        <p className="text-sm text-gray-800 flex-1">{item.tindakan ?? '-'}</p>
                        <p className="text-sm font-bold text-rose-600 shrink-0">
                            -{item.bobot_poin ?? 0}p
                        </p>
                    </div>

                    {/* Row 3: progress approval + tanggal */}
                    <div className="space-y-1.5">
                        {item.approval_status !== 'selesai' && (
                            <>
                                <div className="flex justify-between text-xs text-gray-400">
                                    <span>Progress Approval</span>
                                    <span>{item.approval_progress ?? 0}%</span>
                                </div>
                                <ProgressBar
                                    value={item.approval_progress}
                                    color={item.approval_status === 'pending_bk' ? 'bg-blue-500' : 'bg-amber-400'}
                                />
                            </>
                        )}
                        <p className="text-xs text-gray-400 text-right">{item.tanggal_kejadian}</p>
                    </div>

                    {/* Catatan BK */}
                    {item.catatan_bk && (
                        <div className="mt-2.5 bg-gray-50 rounded-lg px-3 py-2 text-xs text-gray-600 border border-gray-100">
                            <span className="font-semibold text-gray-700">Catatan BK: </span>{item.catatan_bk}
                        </div>
                    )}
                </Card>
            ))}
        </div>
    );
}

// =========================================================================
// TAB: APRESIASI
// =========================================================================
function TabApresiasi({ data }) {
    if (!data.length) return <Empty icon="star" msg="Belum ada laporan apresiasi" />;

    return (
        <div className="space-y-3">
            {/* Ringkasan poin */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center justify-between mb-1">
                <div>
                    <p className="text-xs text-emerald-600 font-medium">Total Poin Apresiasi</p>
                    <p className="text-2xl font-black text-emerald-700">
                        +{data.reduce((s, l) => s + (l.bobot_poin ?? 0), 0)}p
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-emerald-600">{data.length} laporan</p>
                    <p className="text-xs text-emerald-500 mt-0.5">
                        {data.filter(l => l.approval_status === 'selesai' || l.status === 'diberikan').length} sudah diberikan
                    </p>
                </div>
            </div>

            {data.map(item => (
                <Card key={item.id} className={
                    item.status === 'diberikan' || item.approval_status === 'selesai'
                        ? 'border-l-4 border-l-emerald-400 border-emerald-50'
                        : item.approval_status === 'pending_bk'
                        ? 'border-l-4 border-l-blue-400 border-blue-50'
                        : 'border-l-4 border-l-amber-400 border-amber-50'
                }>
                    {/* Row 1: kode + kategori + status */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">
                                {item.kode}
                            </span>
                            {item.kategori && item.kategori !== '-' && (
                                <Badge label={item.kategori} color="gray" />
                            )}
                        </div>
                        <ApprovalChip status={item.approval_status} label={item.approval_status_label} />
                    </div>

                    {/* Row 2: reward + poin */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                        <p className="text-sm text-gray-800 flex-1">{item.reward ?? '-'}</p>
                        <p className="text-sm font-bold text-emerald-600 shrink-0">
                            +{item.bobot_poin ?? 0}p
                        </p>
                    </div>

                    {/* Tanggal */}
                    <div className="flex items-center justify-between text-xs text-gray-400 gap-2">
                        <span>Kejadian: {item.tanggal_kejadian}</span>
                        {item.tanggal_reward && (
                            <span className="text-emerald-600 font-medium">
                                Diberikan: {item.tanggal_reward}
                            </span>
                        )}
                    </div>

                    {/* Progress approval jika belum selesai */}
                    {item.approval_status !== 'selesai' && item.status !== 'diberikan' && (
                        <div className="mt-2 space-y-1">
                            <div className="flex justify-between text-xs text-gray-400">
                                <span>Progress Approval</span>
                                <span>{item.approval_progress ?? 0}%</span>
                            </div>
                            <ProgressBar
                                value={item.approval_progress}
                                color={item.approval_status === 'pending_bk' ? 'bg-blue-500' : 'bg-amber-400'}
                            />
                        </div>
                    )}

                    {/* Catatan BK */}
                    {item.catatan_bk && (
                        <div className="mt-2.5 bg-gray-50 rounded-lg px-3 py-2 text-xs text-gray-600 border border-gray-100">
                            <span className="font-semibold text-gray-700">Catatan BK: </span>{item.catatan_bk}
                        </div>
                    )}
                </Card>
            ))}
        </div>
    );
}

// =========================================================================
// TAB: KONSELING
// =========================================================================
function TabKonseling({ data }) {
    if (!data.length) return <Empty icon="heart" msg="Belum ada laporan konseling" />;
    return (
        <div className="space-y-3">
            {data.map(item => (
                <Card key={item.id}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-black bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                {item.kode}
                            </span>
                            {item.sumber === 'bimbingan_berkala' && (
                                <Badge label="Dari Bimbingan" color="indigo" />
                            )}
                        </div>
                        <ApprovalChip status={item.approval_status} label={item.approval_status_label} />
                    </div>
                    <p className="text-sm font-semibold text-gray-900 mb-0.5">{item.diagnosis}</p>
                    {item.tindakan && (
                        <p className="text-xs text-gray-500 mb-2">{item.tindakan}</p>
                    )}
                    {item.approval_status !== 'selesai' && (
                        <div className="space-y-1 mt-2">
                            <div className="flex justify-between text-xs text-gray-400">
                                <span>Progress Approval</span>
                                <span>{item.approval_progress ?? 0}%</span>
                            </div>
                            <ProgressBar value={item.approval_progress}
                                color={item.approval_status === 'pending_bk' ? 'bg-blue-500' : 'bg-amber-400'} />
                        </div>
                    )}
                    <p className="text-xs text-gray-400 mt-2 text-right">{item.tanggal_kejadian}</p>
                </Card>
            ))}
        </div>
    );
}

// =========================================================================
// TAB: EXPERT POINT
// =========================================================================
function TabExpertPoint({ data }) {
    if (!data.length) return <Empty icon="chart" msg="Belum ada expert system point" />;
    return (
        <div className="space-y-3">
            {data.map(item => (
                <Card key={item.id} className={
                    item.jenis === 'konsekuensi'
                        ? 'border-rose-200 bg-rose-50/30'
                        : 'border-emerald-200 bg-emerald-50/30'
                }>
                    <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-bold text-gray-700">{item.kode}</span>
                            <Badge label={item.jenis_label}
                                color={item.jenis === 'konsekuensi' ? 'red' : 'green'} />
                            <Badge
                                label={item.final_status_label ?? item.status_label}
                                color={item.final_status === 'completed' ? 'green' : item.final_status === 'failed' ? 'red' : 'yellow'}
                            />
                        </div>
                        <p className={`text-sm font-bold shrink-0 ${item.jenis === 'konsekuensi' ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {item.total_poin} poin
                        </p>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{item.konsekuensi_reward}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                        {item.has_bukti && <Badge label="Ada Bukti" color="blue" />}
                        {item.bukti_approved && <Badge label="Bukti Disetujui" color="green" />}
                        <p className="text-xs text-gray-400 ml-auto">{item.tanggal_trigger}</p>
                    </div>
                </Card>
            ))}
        </div>
    );
}

// =========================================================================
// TAB: ES KONSELOR
// =========================================================================
function TabESKonselor({ data }) {
    if (!data.length) return <Empty icon="zap" msg="Belum ada ES Konselor yang triggered" />;
    const SC = { pending:'yellow', in_progress:'blue', completed:'green', discontinued:'gray' };
    return (
        <div className="space-y-3">
            {data.map(item => (
                <Card key={item.id}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-bold bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                                {item.diagnosis_kode}
                            </span>
                            <Badge label={item.status_label} color={SC[item.status] ?? 'gray'} />
                        </div>
                        {item.tanggal_selesai && (
                            <p className="text-xs text-emerald-600 shrink-0">Selesai: {item.tanggal_selesai}</p>
                        )}
                    </div>
                    <p className="text-sm font-semibold text-gray-900 mb-3">{item.diagnosis_nama}</p>
                    <div className="space-y-1">
                        <div className="flex justify-between text-xs text-gray-400">
                            <span>{item.sesi_count} sesi</span>
                            <span>{item.progress ?? 0}%</span>
                        </div>
                        <ProgressBar value={item.progress ?? 0}
                            color={item.status === 'completed' ? 'bg-emerald-500' : 'bg-blue-500'} />
                    </div>
                    <p className="text-xs text-gray-400 mt-2 text-right">Trigger: {item.tanggal_trigger}</p>
                </Card>
            ))}
        </div>
    );
}

// =========================================================================
// TAB: BIMBINGAN BERKALA
// =========================================================================
function TabBimbingan({ data }) {
    if (!data.length) return <Empty icon="book" msg="Belum ada sesi bimbingan berkala" />;
    const TL = {
        tidak_perlu:     { label: 'Aman',      color: 'green',  icon: 'check'   },
        pantau:          { label: 'Dipantau',   color: 'yellow', icon: 'clock'   },
        rujuk_konseling: { label: 'Dirujuk',    color: 'red',    icon: 'warning' },
    };
    return (
        <div className="space-y-3">
            {data.map((item, i) => {
                const tl = TL[item.tindak_lanjut] ?? { label: '-', color: 'gray', icon: 'check' };
                return (
                    <Card key={i}>
                        <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                BADGE_MAP[tl.color]?.split(' ')[0] ?? 'bg-gray-100'
                            }`}>
                                <Icon d={IC[tl.icon]} className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">{item.jadwal_judul}</p>
                                <p className="text-xs text-gray-400">{item.tanggal}</p>
                            </div>
                            <Badge label={tl.label} color={tl.color} />
                        </div>
                        {item.catatan && (
                            <div className="mt-2.5 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                                <p className="text-xs text-amber-800">{item.catatan}</p>
                            </div>
                        )}
                    </Card>
                );
            })}
        </div>
    );
}

// =========================================================================
// MAIN
// =========================================================================
export default function SantriKelasShow({
    auth,
    santriInfo, kelasInfo, waliKelas, waliAsrama,
    statistics = [],
    laporanPelanggaran = [],
    laporanApresiasi   = [],
    laporanKonseling   = [],
    expertSystemPoint  = [],
    expertSystemKonselor = [],
    riwayatBimbingan   = [],
}) {
    const [activeTab, setActiveTab] = useState('overview');

    // Net poin dari statistik
    const statP = statistics.find(s => s.label === 'Total Pelanggaran');
    const statA = statistics.find(s => s.label === 'Total Apresiasi');
    const netPoin = (statA?.poin ?? 0) - (statP?.poin ?? 0);

    // Hitung badge per tab
    const TABS = [
        {
            id: 'overview',
            label: 'Overview',
            icon: IC.shield,
            count: 0,
        },
        {
            id: 'pelanggaran',
            label: 'Pelanggaran',
            icon: IC.warning,
            count: laporanPelanggaran.length,
            urgent: laporanPelanggaran.filter(l => l.approval_status !== 'selesai').length,
            color: 'red',
        },
        {
            id: 'apresiasi',
            label: 'Apresiasi',
            icon: IC.star,
            count: laporanApresiasi.length,
            color: 'green',
        },
        {
            id: 'konseling',
            label: 'Konseling',
            icon: IC.heart,
            count: laporanKonseling.length,
            urgent: laporanKonseling.filter(l => l.approval_status !== 'selesai').length,
            color: 'blue',
        },
        {
            id: 'expert_point',
            label: 'Expert Point',
            icon: IC.chart,
            count: expertSystemPoint.length,
            urgent: expertSystemPoint.filter(l => l.status === 'pending' || l.status === 'in_progress').length,
            color: 'purple',
        },
        {
            id: 'expert_konselor',
            label: 'ES Konselor',
            icon: IC.zap,
            count: expertSystemKonselor.length,
            color: 'indigo',
        },
        {
            id: 'bimbingan',
            label: 'Bimbingan',
            icon: IC.book,
            count: riwayatBimbingan.length,
            color: 'gray',
        },
    ];

    const tabData = {
        pelanggaran:     laporanPelanggaran,
        apresiasi:       laporanApresiasi,
        konseling:       laporanKonseling,
        expert_point:    expertSystemPoint,
        expert_konselor: expertSystemKonselor,
        bimbingan:       riwayatBimbingan,
    };

    // Warna tab aktif border
    const TAB_ACTIVE_CLS = {
        pelanggaran:     'border-rose-500 text-rose-700 bg-rose-50/50',
        apresiasi:       'border-emerald-500 text-emerald-700 bg-emerald-50/50',
        konseling:       'border-blue-500 text-blue-700 bg-blue-50/50',
        expert_point:    'border-violet-500 text-violet-700 bg-violet-50/50',
        expert_konselor: 'border-indigo-500 text-indigo-700 bg-indigo-50/50',
        bimbingan:       'border-teal-500 text-teal-700 bg-teal-50/50',
        overview:        'border-emerald-500 text-emerald-700 bg-emerald-50/50',
    };
    const BADGE_ACTIVE = {
        pelanggaran:'bg-rose-100 text-rose-700', apresiasi:'bg-emerald-100 text-emerald-700',
        konseling:'bg-blue-100 text-blue-700', expert_point:'bg-violet-100 text-violet-700',
        expert_konselor:'bg-indigo-100 text-indigo-700', bimbingan:'bg-teal-100 text-teal-700',
        overview:'bg-emerald-100 text-emerald-700',
    };

    return (
        <TenagaPendidikLayout user={auth.user} header="Profil Santri">
            <Head title={`${santriInfo.nama_panggilan} - Profil`} />

            <div className="py-5 px-4 sm:px-6 lg:px-8 space-y-5 max-w-5xl mx-auto">

                {/* Back */}
                <Link href={route('santri-kelas.index')}
                    className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-emerald-700 font-medium transition-colors">
                    <Icon d={IC.back} className="w-4 h-4" />
                    Kembali ke Daftar Santri
                </Link>

                {/* Hero */}
                <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 rounded-2xl p-6 text-white shadow-lg">
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/5 rounded-full" />
                        <div className="absolute -bottom-6 left-1/3 w-24 h-24 bg-white/5 rounded-full" />
                    </div>
                    <div className="relative flex items-center gap-5">
                        <Avatar foto={santriInfo.foto} nama={santriInfo.nama_panggilan} />
                        <div className="flex-1 min-w-0">
                            <p className="text-emerald-200 text-xs font-medium mb-0.5">Profil Santri</p>
                            <h1 className="text-xl font-bold truncate">{santriInfo.nama_lengkap}</h1>
                            <p className="text-emerald-200 text-sm">NISN: {santriInfo.nisn}</p>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {kelasInfo && (
                                    <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-xs font-medium">
                                        {kelasInfo.kode} - {kelasInfo.nama}
                                    </span>
                                )}
                                {waliKelas && (
                                    <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-xs font-medium">
                                        Wali: {waliKelas.nama}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="hidden sm:block text-right shrink-0">
                            <p className="text-emerald-200 text-xs mb-0.5">Net Poin</p>
                            <p className={`text-3xl font-bold ${netPoin >= 0 ? 'text-white' : 'text-rose-300'}`}>
                                {netPoin >= 0 ? '+' : ''}{netPoin}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Info + Statistik */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {/* Info pribadi */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                        <h2 className="text-sm font-bold text-gray-900 mb-4">Informasi Santri</h2>
                        <dl className="space-y-2.5">
                            {[
                                { label: 'Nama Panggilan', value: santriInfo.nama_panggilan },
                                { label: 'Jenis Kelamin',  value: santriInfo.jenis_kelamin  },
                                { label: 'Tempat Lahir',   value: santriInfo.tempat_lahir   },
                                { label: 'Tanggal Lahir',  value: santriInfo.tanggal_lahir  },
                                { label: 'Nama Wali',      value: santriInfo.nama_wali      },
                            ].map((row, i) => (
                                <div key={i} className="flex justify-between gap-2 border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                                    <dt className="text-xs text-gray-400 shrink-0">{row.label}</dt>
                                    <dd className="text-xs text-gray-800 font-medium text-right truncate">{row.value ?? '-'}</dd>
                                </div>
                            ))}
                        </dl>
                        {waliAsrama.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <p className="text-xs font-semibold text-gray-500 mb-1.5">Wali Asrama</p>
                                {waliAsrama.map((w, i) => (
                                    <p key={i} className="text-xs text-gray-700">{w.nama}</p>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Statistik */}
                    <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {statistics.map((stat, i) => {
                            const T = {
                                red:    'ring-rose-200 text-rose-600',
                                green:  'ring-emerald-200 text-emerald-600',
                                blue:   'ring-blue-200 text-blue-600',
                                purple: 'ring-violet-200 text-violet-600',
                            };
                            const t = T[stat.color] ?? T.blue;
                            return (
                                <div key={i} className={`bg-white rounded-xl p-4 ring-1 ${t.split(' ')[0]}`}>
                                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
                                    {stat.poin != null && (
                                        <p className={`text-xs font-bold mt-1 ${t.split(' ')[1]}`}>
                                            {stat.poin > 0 ? '+' : ''}{stat.poin}p
                                        </p>
                                    )}
                                </div>
                            );
                        })}

                        {/* Net poin */}
                        <div className={`bg-white rounded-xl p-4 ring-1 col-span-2 sm:col-span-4 ${
                            netPoin >= 0 ? 'ring-emerald-200' : 'ring-rose-200'
                        }`}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-gray-400 mb-1">Net Poin (Apresiasi - Pelanggaran)</p>
                                    <p className={`text-3xl font-bold ${netPoin >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {netPoin >= 0 ? '+' : ''}{netPoin}
                                    </p>
                                </div>
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                    netPoin >= 0 ? 'bg-emerald-100' : 'bg-rose-100'
                                }`}>
                                    <Icon d={netPoin >= 0 ? IC.check : IC.warning}
                                        className={`w-6 h-6 ${netPoin >= 0 ? 'text-emerald-600' : 'text-rose-600'}`} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tab panel */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    {/* Tab header - scrollable */}
                    <div className="flex overflow-x-auto border-b border-gray-200 scrollbar-hide">
                        {TABS.map(tab => {
                            const isActive = activeTab === tab.id;
                            const activeCls = TAB_ACTIVE_CLS[tab.id] ?? 'border-emerald-500 text-emerald-700';
                            const badgeCls  = BADGE_ACTIVE[tab.id] ?? 'bg-gray-100 text-gray-500';
                            return (
                                <button key={tab.id} type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium
                                        whitespace-nowrap border-b-2 transition-colors shrink-0 ${
                                        isActive
                                            ? activeCls
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    <Icon d={tab.icon} className="w-4 h-4 shrink-0" />
                                    <span>{tab.label}</span>
                                    {/* Badge count */}
                                    {tab.count > 0 && (
                                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                                            isActive ? badgeCls : 'bg-gray-100 text-gray-500'
                                        }`}>
                                            {tab.count}
                                        </span>
                                    )}
                                    {/* Dot urgent - laporan belum selesai */}
                                    {!isActive && (tab.urgent ?? 0) > 0 && (
                                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Tab content */}
                    <div className="p-5">
                        {/* Overview - ringkasan semua */}
                        {activeTab === 'overview' && (
                            <div className="space-y-4">
                                <p className="text-sm font-bold text-gray-800 mb-3">Ringkasan Semua Laporan</p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {[
                                        { label:'Pelanggaran',   count: laporanPelanggaran.length,  pending: laporanPelanggaran.filter(l=>l.approval_status!=='selesai').length, color:'rose',    tab:'pelanggaran',     poin: -(laporanPelanggaran.reduce((s,l)=>s+(l.bobot_poin??0),0)) },
                                        { label:'Apresiasi',     count: laporanApresiasi.length,    pending: laporanApresiasi.filter(l=>l.status!=='diberikan'&&l.approval_status!=='selesai').length, color:'emerald', tab:'apresiasi', poin: laporanApresiasi.reduce((s,l)=>s+(l.bobot_poin??0),0) },
                                        { label:'Konseling',     count: laporanKonseling.length,    pending: laporanKonseling.filter(l=>l.approval_status!=='selesai').length,   color:'blue',    tab:'konseling',       poin: null },
                                        { label:'Expert Point',  count: expertSystemPoint.length,   pending: expertSystemPoint.filter(l=>l.status==='pending'||l.status==='in_progress').length, color:'violet', tab:'expert_point', poin: null },
                                        { label:'ES Konselor',   count: expertSystemKonselor.length, pending: expertSystemKonselor.filter(l=>l.status!=='completed').length, color:'indigo', tab:'expert_konselor', poin: null },
                                        { label:'Bimbingan',     count: riwayatBimbingan.length,    pending: riwayatBimbingan.filter(l=>l.tindak_lanjut==='rujuk_konseling').length, color:'teal', tab:'bimbingan', poin: null },
                                    ].map((item, i) => (
                                        <button key={i} type="button"
                                            onClick={() => setActiveTab(item.tab)}
                                            className={`bg-${item.color}-50 border border-${item.color}-200 rounded-xl p-4 text-left hover:shadow-md transition group`}>
                                            <p className={`text-2xl font-bold text-${item.color}-700`}>{item.count}</p>
                                            <p className={`text-xs text-${item.color}-600 font-semibold mt-0.5`}>{item.label}</p>
                                            {item.poin !== null && (
                                                <p className={`text-xs font-bold mt-1 ${item.poin < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                    {item.poin > 0 ? '+' : ''}{item.poin}p
                                                </p>
                                            )}
                                            {item.pending > 0 && (
                                                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                                    {item.pending} belum selesai
                                                </p>
                                            )}
                                        </button>
                                    ))}
                                </div>

                                {/* Timeline 5 laporan terbaru lintas kategori */}
                                {(() => {
                                    const all = [
                                        ...laporanPelanggaran.slice(0,3).map(l=>({...l, _jenis:'Pelanggaran', _color:'red'})),
                                        ...laporanApresiasi.slice(0,3).map(l=>({...l, _jenis:'Apresiasi', _color:'green'})),
                                        ...laporanKonseling.slice(0,3).map(l=>({...l, _jenis:'Konseling', _color:'blue'})),
                                    ].slice(0, 6);
                                    if (!all.length) return null;
                                    return (
                                        <div className="mt-4">
                                            <p className="text-xs font-bold text-gray-600 mb-2">Laporan Terbaru (lintas kategori)</p>
                                            <div className="space-y-2">
                                                {all.map((item, i) => (
                                                    <div key={i} className={`flex items-center gap-3 p-3 rounded-xl ${
                                                        item._color === 'red' ? 'bg-rose-50 border border-rose-100' :
                                                        item._color === 'green' ? 'bg-emerald-50 border border-emerald-100' :
                                                        'bg-blue-50 border border-blue-100'
                                                    }`}>
                                                        <Badge label={item._jenis} color={item._color} />
                                                        <span className="font-mono text-xs font-bold text-gray-600">
                                                            {item.kode}
                                                        </span>
                                                        <ApprovalChip status={item.approval_status} label={item.approval_status_label} />
                                                        <span className="text-xs text-gray-400 ml-auto">{item.tanggal_kejadian}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        )}

                        {activeTab === 'pelanggaran'     && <TabPelanggaran  data={laporanPelanggaran} />}
                        {activeTab === 'apresiasi'       && <TabApresiasi    data={laporanApresiasi} />}
                        {activeTab === 'konseling'       && <TabKonseling    data={laporanKonseling} />}
                        {activeTab === 'expert_point'    && <TabExpertPoint  data={expertSystemPoint} />}
                        {activeTab === 'expert_konselor' && <TabESKonselor   data={expertSystemKonselor} />}
                        {activeTab === 'bimbingan'       && <TabBimbingan    data={riwayatBimbingan} />}
                    </div>
                </div>

                {/* Read-only notice */}
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-200 text-gray-500 flex items-center justify-center shrink-0">
                        <Icon d={IC.clock} className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-gray-700">Mode Pantau (Read-Only)</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Aksi approval dilakukan melalui
                            <Link href={route('laporan-wali.index')} className="text-emerald-600 hover:text-emerald-800 font-medium mx-1">
                                Laporan Wali
                            </Link>
                            dan bimbingan melalui
                            <Link href={route('bimbingan-kelas.index')} className="text-emerald-600 hover:text-emerald-800 font-medium ml-1">
                                Jadwal Bimbingan
                            </Link>.
                        </p>
                    </div>
                </div>
            </div>
        </TenagaPendidikLayout>
    );
}