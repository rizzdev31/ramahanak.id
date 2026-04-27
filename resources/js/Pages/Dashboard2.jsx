import AppLayout from '@/Layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';

// ── Icon SVG helper ─────────────────────────────────────────────
const Icon = ({ name, className = 'w-6 h-6' }) => {
    const paths = {
        users:   'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
        kelas:   'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
        staff:   'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
        pending: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
        warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.072 16.5c-.77.833.192 2.5 1.732 2.5z',
        task:    'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
        user:    'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
        book:    'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
        check:   'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
        history: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
        arrow:   'M13 7l5 5m0 0l-5 5m5-5H6',
    };
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={paths[name] || paths.user} />
        </svg>
    );
};

// ── Palet warna untuk stat card ─────────────────────────────────
const colorMap = {
    blue:   { bg: 'bg-blue-50',   icon: 'bg-blue-100 text-blue-600',   text: 'text-blue-700'   },
    green:  { bg: 'bg-green-50',  icon: 'bg-green-100 text-green-600', text: 'text-green-700'  },
    purple: { bg: 'bg-purple-50', icon: 'bg-purple-100 text-purple-600',text: 'text-purple-700' },
    yellow: { bg: 'bg-yellow-50', icon: 'bg-yellow-100 text-yellow-600',text: 'text-yellow-700' },
    red:    { bg: 'bg-red-50',    icon: 'bg-red-100 text-red-600',     text: 'text-red-700'    },
};

// ── Komponen kartu statistik ─────────────────────────────────────
function StatCard({ label, value, color = 'blue', icon = 'users' }) {
    const c = colorMap[color] ?? colorMap.blue;
    return (
        <div className={`${c.bg} rounded-xl p-5 flex items-center gap-4`}>
            <div className={`${c.icon} w-12 h-12 rounded-xl flex items-center justify-center shrink-0`}>
                <Icon name={icon} className="w-6 h-6" />
            </div>
            <div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className={`text-sm font-medium ${c.text}`}>{label}</p>
            </div>
        </div>
    );
}

// ── Avatar foto / inisial ─────────────────────────────────────────
function Avatar({ foto, nama, size = 'lg' }) {
    const sz = size === 'lg' ? 'w-16 h-16 text-xl' : 'w-10 h-10 text-sm';
    if (foto) {
        return (
            <img src={foto} alt={nama}
                className={`${sz} rounded-full object-cover border-2 border-white shadow`}
                onError={e => { e.target.onerror = null; e.target.src = '/storage/defaultavatar.png'; }}
            />
        );
    }
    return (
        <div className={`${sz} rounded-full bg-indigo-100 text-indigo-700
            flex items-center justify-center font-bold uppercase shrink-0`}>
            {(nama || '?')[0]}
        </div>
    );
}

// ════════════════════════════════════════════════════════════════
// DASHBOARD GURU BK
// ════════════════════════════════════════════════════════════════
function DashboardGuruBk({ data }) {
    return (
        <div className="space-y-6">
            {/* Header sambutan */}
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-2xl p-6 text-white shadow-md">
                <div className="flex items-center gap-4">
                    <Avatar foto={data.foto} nama={data.nama} size="lg" />
                    <div>
                        <p className="text-indigo-200 text-sm font-medium">Selamat datang,</p>
                        <h2 className="text-xl font-bold">{data.nama}</h2>
                        <p className="text-indigo-200 text-sm mt-0.5">{data.jabatan}</p>
                    </div>
                </div>
            </div>

            {/* Statistik */}
            <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Ringkasan Sistem
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
                    {data.stats.map((stat, i) => (
                        <StatCard key={i} {...stat} />
                    ))}
                </div>
            </div>

            {/* Aksi cepat */}
            <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Aksi Cepat
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                        { href: route('manage-user.index'), icon: 'users',    label: 'Kelola User',      desc: 'Lihat & validasi akun pengguna', color: 'blue'   },
                        { href: route('kelas.index'),       icon: 'kelas',    label: 'Kelola Kelas',     desc: 'Atur data kelas & santri',       color: 'green'  },
                        { href: route('penugasan.index'),   icon: 'task',     label: 'Kelola Penugasan', desc: 'Assign wali kelas & asrama',     color: 'purple' },
                    ].map((item, i) => {
                        const c = colorMap[item.color];
                        return (
                            <Link key={i} href={item.href}
                                className="group flex items-center gap-4 bg-white border border-gray-200
                                    rounded-xl p-4 hover:shadow-md hover:border-indigo-200 transition-all duration-150">
                                <div className={`${c.icon} w-11 h-11 rounded-xl flex items-center justify-center shrink-0
                                    group-hover:scale-110 transition-transform duration-150`}>
                                    <Icon name={item.icon} className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                                    <p className="text-xs text-gray-500 mt-0.5 truncate">{item.desc}</p>
                                </div>
                                <Icon name="arrow" className="w-4 h-4 text-gray-400 ml-auto shrink-0
                                    group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" />
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* User pending */}
            {data.userPendingList?.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                            Menunggu Persetujuan ({data.userPendingList.length})
                        </h3>
                        <Link href={route('manage-user.index')}
                            className="text-xs text-indigo-600 hover:underline font-medium">
                            Lihat semua →
                        </Link>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
                        {data.userPendingList.map((u, i) => (
                            <div key={i} className="flex items-center justify-between px-4 py-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-8 h-8 rounded-full bg-yellow-100 text-yellow-700
                                        flex items-center justify-center text-xs font-bold uppercase shrink-0">
                                        {(u.nama || u.username)[0]}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">{u.nama || u.username}</p>
                                        <p className="text-xs text-gray-500 truncate">{u.email}</p>
                                    </div>
                                </div>
                                <span className="ml-3 shrink-0 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                                    {u.role === 'guru_bk' ? 'Guru BK'
                                        : u.role === 'tenaga_pendidik' ? 'Tendik'
                                        : 'Santri'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ════════════════════════════════════════════════════════════════
// DASHBOARD TENAGA PENDIDIK
// ════════════════════════════════════════════════════════════════
function DashboardTenagaPendidik({ data }) {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-teal-500 rounded-2xl p-6 text-white shadow-md">
                <div className="flex items-center gap-4">
                    <Avatar foto={data.foto} nama={data.nama} size="lg" />
                    <div>
                        <p className="text-green-200 text-sm font-medium">Selamat datang,</p>
                        <h2 className="text-xl font-bold">{data.nama}</h2>
                        <p className="text-green-200 text-sm mt-0.5">{data.jabatan}</p>
                    </div>
                </div>
            </div>

            {/* Statistik */}
            <div className="grid grid-cols-3 gap-3">
                {data.stats.map((s, i) => <StatCard key={i} {...s} icon="task" />)}
            </div>

            {/* Daftar penugasan */}
            <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Kelas yang Anda Ampu
                </h3>

                {data.penugasan?.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {data.penugasan.map((p, i) => (
                            <Link key={i} href={route('kelas.show', p.kelas_id)}
                                className="group bg-white border border-gray-200 rounded-xl p-4
                                    hover:shadow-md hover:border-green-200 transition-all duration-150">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <p className="font-semibold text-gray-900 truncate">{p.kelas_nama}</p>
                                        <span className={`inline-flex mt-1 px-2 py-0.5 rounded-full text-xs font-medium
                                            ${p.jenis === 'wali_kelas'
                                                ? 'bg-blue-100 text-blue-700'
                                                : 'bg-purple-100 text-purple-700'}`}>
                                            {p.jenis_label}
                                        </span>
                                    </div>
                                    <div className="shrink-0 text-right">
                                        <p className="text-2xl font-bold text-gray-900">{p.jml_santri}</p>
                                        <p className="text-xs text-gray-500">santri</p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white border border-dashed border-gray-300 rounded-xl p-8 text-center">
                        <Icon name="task" className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Belum ada penugasan kelas.</p>
                        <p className="text-xs text-gray-400 mt-1">Hubungi Guru BK untuk mendapatkan penugasan.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// ════════════════════════════════════════════════════════════════
// DASHBOARD SANTRI
// ════════════════════════════════════════════════════════════════
function DashboardSantri({ data }) {
    return (
        <div className="space-y-6">
            {/* Header — beda tampilan jika pending */}
            <div className={`rounded-2xl p-6 text-white shadow-md
                ${data.is_pending
                    ? 'bg-gradient-to-r from-yellow-500 to-orange-400'
                    : 'bg-gradient-to-r from-purple-600 to-indigo-500'}`}>
                <div className="flex items-center gap-4">
                    <Avatar foto={data.foto} nama={data.nama} size="lg" />
                    <div>
                        <p className={`text-sm font-medium ${data.is_pending ? 'text-yellow-100' : 'text-purple-200'}`}>
                            Selamat datang,
                        </p>
                        <h2 className="text-xl font-bold">{data.nama}</h2>
                        <p className={`text-sm mt-0.5 ${data.is_pending ? 'text-yellow-100' : 'text-purple-200'}`}>
                            NISN: {data.nisn}
                        </p>
                    </div>
                </div>

                {/* Banner pending */}
                {data.is_pending && (
                    <div className="mt-4 bg-white/20 rounded-xl px-4 py-3 flex items-start gap-2">
                        <Icon name="warning" className="w-5 h-5 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold text-sm">Menunggu Penempatan Kelas</p>
                            <p className="text-xs mt-0.5 text-yellow-100">
                                Akun Anda aktif, namun belum ditempatkan ke kelas. Harap menunggu konfirmasi dari Guru BK.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Info kelas (jika sudah ditempatkan) */}
            {!data.is_pending && data.kelas && (
                <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                        Informasi Kelas
                    </h3>
                    <div className="bg-white border border-gray-200 rounded-xl p-5">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-11 h-11 rounded-xl bg-purple-100 text-purple-600
                                flex items-center justify-center shrink-0">
                                <Icon name="kelas" className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Kelas Saat Ini</p>
                                <p className="text-lg font-bold text-gray-900">{data.kelas.nama}</p>
                            </div>
                            <span className="ml-auto px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                                {data.kelas.tahun_ajaran}
                            </span>
                        </div>

                        {/* Wali Kelas & Asrama */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-gray-100">
                            {/* Wali Kelas */}
                            <div className="flex items-center gap-3">
                                {data.wali_kelas ? (
                                    <>
                                        <Avatar foto={data.wali_kelas.foto} nama={data.wali_kelas.nama} size="sm" />
                                        <div>
                                            <p className="text-xs text-gray-500">Wali Kelas</p>
                                            <p className="text-sm font-semibold text-gray-900">{data.wali_kelas.nama}</p>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex items-center gap-2 text-gray-400">
                                        <Icon name="user" className="w-4 h-4" />
                                        <span className="text-sm italic">Belum ada wali kelas</span>
                                    </div>
                                )}
                            </div>

                            {/* Wali Asrama */}
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Wali Asrama</p>
                                {data.wali_asrama?.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {data.wali_asrama.map((wa, i) => (
                                            <div key={i} className="flex items-center gap-1.5">
                                                <Avatar foto={wa.foto} nama={wa.nama} size="sm" />
                                                <span className="text-sm font-medium text-gray-900">{wa.nama}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <span className="text-sm text-gray-400 italic">Belum ada wali asrama</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Riwayat kelas */}
            {data.riwayat?.length > 0 && (
                <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                        Riwayat Kelas
                    </h3>
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
                        {data.riwayat.map((r, i) => (
                            <div key={i} className="flex items-center justify-between px-4 py-3 gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className={`w-2 h-2 rounded-full shrink-0
                                        ${r.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">{r.kelas_nama}</p>
                                        <p className="text-xs text-gray-500">{r.tahun_ajaran}</p>
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-xs text-gray-500">
                                        {r.tanggal_masuk}
                                        {r.tanggal_keluar && ` — ${r.tanggal_keluar}`}
                                    </p>
                                    {r.is_active && (
                                        <span className="inline-flex px-1.5 py-0.5 rounded text-xs
                                            bg-green-100 text-green-700 font-medium">Aktif</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ════════════════════════════════════════════════════════════════
// MAIN DASHBOARD — router per role
// ════════════════════════════════════════════════════════════════
export default function Dashboard({ auth, dashboardData }) {
    const role = dashboardData?.role;

    return (
        <AppLayout
            user={auth.user}
            header={
                <h2 className="font-semibold text-lg text-gray-800">
                    {role === 'guru_bk'         && 'Dashboard Guru BK'}
                    {role === 'tenaga_pendidik'  && 'Dashboard Tenaga Pendidik'}
                    {role === 'santri'           && 'Dashboard Santri'}
                    {!role                       && 'Dashboard'}
                </h2>
            }
        >
            <Head title="Dashboard" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {role === 'guru_bk'        && <DashboardGuruBk        data={dashboardData} />}
                    {role === 'tenaga_pendidik' && <DashboardTenagaPendidik data={dashboardData} />}
                    {role === 'santri'          && <DashboardSantri         data={dashboardData} />}

                    {/* Fallback jika belum ada data */}
                    {!role && (
                        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-10 text-center">
                            <Icon name="user" className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                            <p className="text-gray-500">Data dashboard tidak tersedia.</p>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}