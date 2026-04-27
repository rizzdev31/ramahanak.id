import { Head, Link, router, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';

const BADGE = { gray:'bg-gray-100 text-gray-600', blue:'bg-blue-100 text-blue-700', yellow:'bg-yellow-100 text-yellow-700', green:'bg-green-100 text-green-700', red:'bg-red-100 text-red-700' };

export default function BimbinganKelasIndex({ jadwalList = {}, filters = {}, message }) {
    const { auth } = usePage().props;
    const data = jadwalList?.data ?? jadwalList ?? [];

    const handleFilter = (val) => {
        router.get(route('bimbingan-kelas.index'), { status: val }, { preserveState: true, replace: true });
    };

    return (
        <AppLayout user={auth.user} header="Jadwal Bimbingan Kelas">
            <Head title="Jadwal Bimbingan Kelas" />
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">

                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Jadwal Bimbingan Kelas</h1>
                    <p className="text-sm text-gray-500 mt-1">Jadwal bimbingan berkala di kelas yang Anda tangani.</p>
                </div>

                {message && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">{message}</div>
                )}

                {/* Filter */}
                <div className="flex gap-2 flex-wrap">
                    {['', 'aktif', 'berjalan', 'selesai'].map(s => (
                        <button key={s} onClick={() => handleFilter(s)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                                (filters.status ?? '') === s ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}>
                            {s === '' ? 'Semua' : s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                    ))}
                </div>

                {data.length === 0 ? (
                    <div className="bg-white rounded-xl border py-16 text-center text-gray-400">
                        <p className="text-4xl mb-3">📚</p>
                        <p className="font-medium">Tidak ada jadwal bimbingan</p>
                        <p className="text-sm mt-1">Guru BK belum membuat jadwal untuk kelas Anda.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {data.map(j => (
                            <div key={j.id} className="bg-white rounded-xl border p-5">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h3 className="font-semibold text-gray-900">{j.judul}</h3>
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${BADGE[j.status_badge] ?? BADGE.gray}`}>
                                                {j.status_label}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1">
                                            📚 {j.template_judul} &bull; 🏫 {j.kelas} &bull; 📅 {j.tanggal} &bull; {j.mode_label}
                                        </p>
                                    </div>
                                    <Link href={route('bimbingan-kelas.show', j.id)}
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition">
                                        Lihat Detail
                                    </Link>
                                </div>

                                {/* Progress */}
                                <div>
                                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                                        <span>Progress</span>
                                        <span>{j.progress?.selesai}/{j.progress?.total} santri</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div className="h-2 rounded-full bg-indigo-500 transition-all" style={{ width: `${j.progress?.persen ?? 0}%` }} />
                                    </div>
                                </div>

                                {j.catatan && (
                                    <div className="mt-3 text-xs text-yellow-800 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                                        💬 {j.catatan}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}