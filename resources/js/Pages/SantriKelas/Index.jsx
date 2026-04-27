/**
 * SantriKelas/Index.jsx
 * Tenaga Pendidik memantau daftar santri di kelas yang diampu.
 * Menampilkan kondisi singkat: poin, konseling aktif, konsekuensi.
 */
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import TenagaPendidikLayout from '@/Layouts/TenagaPendidik/TenagaPendidikLayout';

// ── Icon ──────────────────────────────────────────────────────
const Icon = ({ d, className = 'w-4 h-4' }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
    </svg>
);
const ICONS = {
    search:  'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
    user:    'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-1.964-1.333-2.732 0L3.072 16c-.77 1.333.192 3 1.732 3z',
    arrow:   'M13 7l5 5m0 0l-5 5m5-5H6',
    filter:  'M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z',
    chart:   'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    heart:   'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
};

// ── Avatar ────────────────────────────────────────────────────
function Avatar({ foto, nama, size = 'md' }) {
    const sz = size === 'lg' ? 'w-12 h-12 text-base' : 'w-9 h-9 text-sm';
    if (foto) return (
        <img src={foto} alt={nama}
            className={`${sz} rounded-full object-cover ring-2 ring-white`}
            onError={e => { e.target.onerror = null; e.target.src = '/storage/defaultavatar.png'; }} />
    );
    return (
        <div className={`${sz} rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white flex items-center justify-center font-bold uppercase ring-2 ring-white`}>
            {(nama || '?')[0]}
        </div>
    );
}

// ── Poin badge ────────────────────────────────────────────────
function PoinBadge({ net }) {
    if (net > 0)  return <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">+{net}</span>;
    if (net < 0)  return <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">{net}</span>;
    return <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">0</span>;
}

// ── Main ──────────────────────────────────────────────────────
export default function SantriKelasIndex({ auth, santriList = [], kelasList = [], filters = {}, message }) {
    const [search, setSearch]   = useState(filters.search ?? '');
    const [kelasId, setKelasId] = useState(filters.kelas_id ?? '');

    const doFilter = (newSearch, newKelasId) => {
        router.get(route('santri-kelas.index'), {
            search:   newSearch,
            kelas_id: newKelasId,
        }, { preserveState: true, replace: true });
    };

    const perlu   = santriList.filter(s => s.perlu_perhatian).length;
    const aman    = santriList.length - perlu;

    return (
        <TenagaPendidikLayout user={auth.user} header="Santri Kelas">
            <Head title="Santri Kelas — Tenaga Pendidik" />

            <div className="py-5 px-4 sm:px-6 lg:px-8 space-y-5">

                {/* ── Header ─────────────────────────────────── */}
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Santri di Kelas Anda</h1>
                        <p className="text-sm text-gray-500 mt-0.5">
                            Pantau kondisi, expert system point, dan konseling santri yang Anda ampu.
                        </p>
                    </div>
                    {/* Ringkasan cepat */}
                    <div className="hidden sm:flex gap-3 shrink-0">
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2 text-center">
                            <p className="text-xl font-bold text-emerald-700">{aman}</p>
                            <p className="text-xs text-emerald-600">Aman</p>
                        </div>
                        <div className={`border rounded-xl px-4 py-2 text-center ${perlu > 0 ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'}`}>
                            <p className={`text-xl font-bold ${perlu > 0 ? 'text-amber-700' : 'text-gray-400'}`}>{perlu}</p>
                            <p className={`text-xs ${perlu > 0 ? 'text-amber-600' : 'text-gray-400'}`}>Perlu Perhatian</p>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-center">
                            <p className="text-xl font-bold text-gray-700">{santriList.length}</p>
                            <p className="text-xs text-gray-500">Total</p>
                        </div>
                    </div>
                </div>

                {/* ── Filter ─────────────────────────────────── */}
                <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* Search */}
                        <div className="relative flex-1">
                            <Icon d={ICONS.search} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Cari nama atau NISN..."
                                value={search}
                                onChange={e => { setSearch(e.target.value); doFilter(e.target.value, kelasId); }}
                                className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                        </div>
                        {/* Filter kelas */}
                        {kelasList.length > 1 && (
                            <select
                                value={kelasId}
                                onChange={e => { setKelasId(e.target.value); doFilter(search, e.target.value); }}
                                className="sm:w-48 rounded-xl border border-gray-200 text-sm py-2 px-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            >
                                <option value="">Semua Kelas</option>
                                {kelasList.map(k => (
                                    <option key={k.id} value={k.id}>{k.label}</option>
                                ))}
                            </select>
                        )}
                    </div>
                </div>

                {/* ── Empty / Pesan ───────────────────────────── */}
                {message && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center text-amber-800">
                        <Icon d={ICONS.warning} className="w-8 h-8 mx-auto mb-2 text-amber-400" />
                        <p className="font-semibold">{message}</p>
                        <p className="text-sm mt-1">Hubungi Guru BK untuk mendapatkan penugasan kelas.</p>
                    </div>
                )}

                {/* ── Daftar santri ───────────────────────────── */}
                {santriList.length === 0 && !message ? (
                    <div className="bg-white rounded-2xl border border-gray-200 py-16 text-center text-gray-400">
                        <Icon d={ICONS.user} className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                        <p className="font-medium">Tidak ada santri ditemukan</p>
                        <p className="text-sm mt-1">Coba ubah filter pencarian</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {santriList.map(santri => (
                            <Link key={santri.id}
                                href={route('santri-kelas.show', santri.id)}
                                className={`block bg-white rounded-2xl border transition-all hover:shadow-lg group ${
                                    santri.perlu_perhatian
                                        ? 'border-amber-200 ring-1 ring-amber-200'
                                        : 'border-gray-200 hover:border-emerald-300'
                                }`}
                            >
                                <div className="p-4">
                                    {/* Header santri */}
                                    <div className="flex items-center gap-3 mb-4">
                                        <Avatar foto={santri.foto} nama={santri.nama} />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-gray-900 text-sm truncate group-hover:text-emerald-700 transition-colors">
                                                {santri.nama}
                                            </p>
                                            <p className="text-xs text-gray-400 truncate">{santri.nisn}</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-1 shrink-0">
                                            {santri.kelas && (
                                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                                                    {santri.kelas.kode}
                                                </span>
                                            )}
                                            {santri.perlu_perhatian && (
                                                <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                                            )}
                                        </div>
                                    </div>

                                    {/* Net Poin */}
                                    <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
                                        <span className="text-xs text-gray-500 font-medium">Net Poin</span>
                                        <PoinBadge net={santri.net_poin} />
                                    </div>

                                    {/* Indikator kondisi */}
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="text-center">
                                            <p className={`text-lg font-bold ${santri.poin_pelanggaran > 0 ? 'text-rose-600' : 'text-gray-300'}`}>
                                                {santri.poin_pelanggaran}
                                            </p>
                                            <p className="text-xs text-gray-400">Poin P.</p>
                                        </div>
                                        <div className="text-center">
                                            <p className={`text-lg font-bold ${santri.konseling_aktif > 0 ? 'text-violet-600' : 'text-gray-300'}`}>
                                                {santri.konseling_aktif}
                                            </p>
                                            <p className="text-xs text-gray-400">Konseling</p>
                                        </div>
                                        <div className="text-center">
                                            <p className={`text-lg font-bold ${santri.konsekuensi_aktif > 0 ? 'text-amber-600' : 'text-gray-300'}`}>
                                                {santri.konsekuensi_aktif}
                                            </p>
                                            <p className="text-xs text-gray-400">Konsekuensi</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className={`px-4 py-2.5 flex items-center justify-between rounded-b-2xl text-xs ${
                                    santri.perlu_perhatian ? 'bg-amber-50' : 'bg-gray-50'
                                }`}>
                                    <span className={santri.perlu_perhatian ? 'text-amber-600 font-medium' : 'text-gray-400'}>
                                        {santri.perlu_perhatian ? '⚠ Perlu perhatian' : '✓ Kondisi baik'}
                                    </span>
                                    <Icon d={ICONS.arrow} className="w-3.5 h-3.5 text-gray-400 group-hover:text-emerald-600 transition-colors" />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </TenagaPendidikLayout>
    );
}