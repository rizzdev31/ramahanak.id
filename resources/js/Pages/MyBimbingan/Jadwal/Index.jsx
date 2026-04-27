import { Head, Link, router, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';

const BADGE = {
    gray:   'bg-gray-100 text-gray-600',
    blue:   'bg-blue-100 text-blue-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    green:  'bg-green-100 text-green-700',
    red:    'bg-red-100 text-red-700',
};

const StatusBadge = ({ label, color }) => (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${BADGE[color] ?? BADGE.gray}`}>{label}</span>
);

const ProgressBar = ({ value }) => (
    <div className="flex items-center gap-2">
        <div className="flex-1 bg-gray-200 rounded-full h-1.5">
            <div className="h-1.5 rounded-full bg-indigo-500 transition-all" style={{ width: `${value}%` }} />
        </div>
        <span className="text-xs text-gray-500 w-8 text-right">{value}%</span>
    </div>
);

export default function JadwalIndex({ jadwalList, kelasList = [], filters = {} }) {
    const { auth } = usePage().props;

    const handleFilter = (key, val) => {
        router.get(route('my-bimbingan.jadwal.index'), { ...filters, [key]: val }, { preserveState: true, replace: true });
    };

    const handleDelete = (id) => {
        if (!confirm('Hapus jadwal ini beserta semua antriannya?')) return;
        router.delete(route('my-bimbingan.jadwal.destroy', id));
    };

    const data = jadwalList?.data ?? jadwalList ?? [];

    return (
        <AppLayout user={auth.user} header="My Bimbingan — Jadwal">
            <Head title="Jadwal Bimbingan" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Jadwal Bimbingan</h1>
                        <p className="text-sm text-gray-500 mt-1">Kelola dan monitor semua jadwal bimbingan berkala.</p>
                    </div>
                    <Link
                        href={route('my-bimbingan.jadwal.create')}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Buat Jadwal
                    </Link>
                </div>

                {/* Filter */}
                <div className="flex gap-2 flex-wrap">
                    {['', 'draft', 'aktif', 'berjalan', 'selesai'].map(s => (
                        <button
                            key={s}
                            onClick={() => handleFilter('status', s)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                                (filters.status ?? '') === s
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            {s === '' ? 'Semua' : s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Tabel */}
                {data.length === 0 ? (
                    <div className="bg-white rounded-xl border py-16 text-center">
                        <svg className="mx-auto w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-gray-500 font-medium">Belum ada jadwal</p>
                        <p className="text-gray-400 text-sm mt-1">Buat jadwal baru untuk memulai bimbingan berkala.</p>
                        <Link
                            href={route('my-bimbingan.jadwal.create')}
                            className="mt-4 inline-flex items-center gap-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition"
                        >
                            Buat Jadwal Pertama
                        </Link>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Judul</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Kelas</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Tanggal</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Mode</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Progress</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {data.map(j => (
                                        <tr key={j.id} className="hover:bg-gray-50 transition">
                                            <td className="px-4 py-3">
                                                <p className="font-medium text-gray-900">{j.judul}</p>
                                                <p className="text-xs text-gray-400">{j.template_judul}</p>
                                            </td>
                                            <td className="px-4 py-3 text-gray-700">{j.kelas}</td>
                                            <td className="px-4 py-3 text-gray-700">{j.tanggal}</td>
                                            <td className="px-4 py-3 text-gray-600 text-xs">{j.mode}</td>
                                            <td className="px-4 py-3">
                                                <StatusBadge label={j.status_label} color={j.status_badge} />
                                            </td>
                                            <td className="px-4 py-3 min-w-[140px]">
                                                <ProgressBar value={j.progress?.persen ?? 0} />
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {j.progress?.selesai}/{j.progress?.total} santri
                                                </p>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex gap-2 justify-center">
                                                    <Link
                                                        href={route('my-bimbingan.jadwal.show', j.id)}
                                                        className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition"
                                                    >
                                                        Monitor
                                                    </Link>
                                                    {['draft'].includes(j.status) && (
                                                        <button
                                                            onClick={() => handleDelete(j.id)}
                                                            className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs hover:bg-red-100 transition"
                                                        >
                                                            Hapus
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}