import { Head, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';

const BADGE = {
    gray:   'bg-gray-100 text-gray-600',
    blue:   'bg-blue-100 text-blue-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    green:  'bg-green-100 text-green-700',
    red:    'bg-red-100 text-red-700',
};

const Badge = ({ label, color = 'gray' }) => (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${BADGE[color] ?? BADGE.gray}`}>
        {label}
    </span>
);

export default function BimbinganKelasShow({ jadwal }) {
    const { auth } = usePage().props;

    const progress = jadwal.progress ?? { total: 0, selesai: 0, persen: 0 };

    const antrianMenunggu  = (jadwal.antrian ?? []).filter(a => a.status === 'menunggu');
    const antrianSelesai   = (jadwal.antrian ?? []).filter(a => a.status === 'selesai');
    const antrianTidakHadir = (jadwal.antrian ?? []).filter(a => a.status === 'tidak_hadir');

    return (
        <AppLayout user={auth.user} header="Detail Jadwal Bimbingan">
            <Head title={jadwal.judul} />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">

                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Link href={route('bimbingan-kelas.index')} className="hover:text-indigo-600 transition">
                        Jadwal Bimbingan
                    </Link>
                    <span>/</span>
                    <span className="text-gray-800 font-medium">{jadwal.judul}</span>
                </div>

                {/* Info Jadwal */}
                <div className="bg-white rounded-xl border p-5">
                    <div className="flex items-start justify-between mb-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-3 flex-wrap">
                                <h2 className="text-lg font-semibold text-gray-900">{jadwal.judul}</h2>
                                <Badge label={jadwal.status_label} color={
                                    jadwal.status === 'aktif'      ? 'blue'   :
                                    jadwal.status === 'berjalan'   ? 'yellow' :
                                    jadwal.status === 'selesai'    ? 'green'  :
                                    jadwal.status === 'dibatalkan' ? 'red'    : 'gray'
                                } />
                            </div>
                            <p className="text-sm text-gray-500">
                                📚 {jadwal.template} &bull; 🏫 {jadwal.kelas} &bull; 📅 {jadwal.tanggal}
                            </p>
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div>
                        <div className="flex justify-between text-sm text-gray-500 mb-1.5">
                            <span>Progress Bimbingan</span>
                            <span className="font-medium">{progress.selesai} / {progress.total} santri selesai</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                                className="h-3 rounded-full bg-indigo-500 transition-all duration-500"
                                style={{ width: `${progress.persen}%` }}
                            />
                        </div>
                        <p className="text-xs text-gray-400 mt-1 text-right">{progress.persen}%</p>
                    </div>

                    {/* Statistik singkat */}
                    <div className="mt-4 grid grid-cols-3 gap-3">
                        <div className="bg-gray-50 rounded-lg p-3 text-center">
                            <p className="text-xl font-bold text-gray-700">{antrianMenunggu.length}</p>
                            <p className="text-xs text-gray-500 mt-0.5">Menunggu</p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-3 text-center">
                            <p className="text-xl font-bold text-green-700">{antrianSelesai.length}</p>
                            <p className="text-xs text-green-600 mt-0.5">Selesai</p>
                        </div>
                        <div className="bg-red-50 rounded-lg p-3 text-center">
                            <p className="text-xl font-bold text-red-700">{antrianTidakHadir.length}</p>
                            <p className="text-xs text-red-600 mt-0.5">Tidak Hadir</p>
                        </div>
                    </div>

                    {/* Catatan dari BK */}
                    {jadwal.catatan && (
                        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                            <span className="font-medium">📌 Catatan Guru BK:</span> {jadwal.catatan}
                        </div>
                    )}
                </div>

                {/* Daftar Antrian */}
                <div className="bg-white rounded-xl border overflow-hidden">
                    <div className="px-5 py-4 border-b bg-gray-50">
                        <h3 className="font-semibold text-gray-700 text-sm">
                            Daftar Santri ({(jadwal.antrian ?? []).length} orang)
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                            Tampilan read-only. Detail hasil bimbingan hanya bisa dilihat oleh Guru BK.
                        </p>
                    </div>

                    {(jadwal.antrian ?? []).length === 0 ? (
                        <div className="py-10 text-center text-gray-400">
                            <p>Belum ada santri dalam antrian.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {jadwal.antrian.map((a, i) => (
                                <div key={i} className="px-5 py-3 flex items-center gap-4">
                                    {/* Nomor urut */}
                                    <div className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 ${
                                        a.status === 'selesai'      ? 'bg-green-100 text-green-700' :
                                        a.status === 'dipanggil'    ? 'bg-yellow-400 text-white'   :
                                        a.status === 'tidak_hadir'  ? 'bg-red-100 text-red-600'    :
                                        'bg-gray-100 text-gray-500'
                                    }`}>
                                        {a.nomor_urut}
                                    </div>

                                    {/* Info santri */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">{a.santri_nama}</p>
                                        <p className="text-xs text-gray-400">{a.nisn}</p>
                                    </div>

                                    {/* Status antrian */}
                                    <Badge label={a.status_label} color={a.status_badge} />

                                    {/* Tindak lanjut (hanya label, tanpa detail gejala) */}
                                    {a.tindak_lanjut && (
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                            a.tindak_lanjut === 'rujuk_konseling' ? 'bg-red-100 text-red-700' :
                                            a.tindak_lanjut === 'pantau'          ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-green-100 text-green-700'
                                        }`}>
                                            {a.tindak_lanjut === 'rujuk_konseling' ? '🔴 Dirujuk' :
                                             a.tindak_lanjut === 'pantau'          ? '🟡 Dipantau' : '🟢 OK'}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Tombol kembali */}
                <div>
                    <Link
                        href={route('bimbingan-kelas.index')}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white border rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Kembali
                    </Link>
                </div>
            </div>
        </AppLayout>
    );
}