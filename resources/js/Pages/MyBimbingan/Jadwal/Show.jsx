import { Head, Link, router, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';

const BADGE = {
    gray:   'bg-gray-100 text-gray-600',
    blue:   'bg-blue-100 text-blue-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    green:  'bg-green-100 text-green-700',
    red:    'bg-red-100 text-red-700',
};
const Badge = ({ label, color }) => (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${BADGE[color] ?? BADGE.gray}`}>{label}</span>
);

export default function JadwalShow({ jadwal }) {
    const { auth } = usePage().props;

    const handlePanggil = () => {
        router.post(route('my-bimbingan.jadwal.panggil', jadwal.id));
    };

    const handleTidakHadir = (antrianId) => {
        if (!confirm('Tandai santri ini tidak hadir?')) return;
        router.post(route('my-bimbingan.antrian.tidak-hadir', antrianId));
    };

    const progress = jadwal.progress ?? { total: 0, selesai: 0, persen: 0 };
    const isAktif  = ['aktif', 'berjalan'].includes(jadwal.status);

    const antrianMenunggu   = jadwal.antrian.filter(a => a.status === 'menunggu');
    const antrianDipanggil  = jadwal.antrian.filter(a => a.status === 'dipanggil');
    const antrianSelesai    = jadwal.antrian.filter(a => ['selesai', 'tidak_hadir'].includes(a.status));

    return (
        <AppLayout user={auth.user} header={jadwal.judul}>
            <Head title={jadwal.judul} />

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">

                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Link href={route('my-bimbingan.jadwal.index')} className="hover:text-indigo-600">Jadwal</Link>
                    <span>/</span>
                    <span className="text-gray-800 font-medium">{jadwal.judul}</span>
                </div>

                {/* Info + Progress */}
                <div className="bg-white rounded-xl border p-5">
                    <div className="flex items-start justify-between mb-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <h2 className="text-lg font-semibold text-gray-900">{jadwal.judul}</h2>
                                <Badge label={jadwal.status_label} color={jadwal.status_badge} />
                            </div>
                            <p className="text-sm text-gray-500">
                                📚 {jadwal.template_judul} &bull; 🏫 {jadwal.kelas} &bull; 📅 {jadwal.tanggal}
                                {jadwal.waktu_mulai && ` • ⏰ ${jadwal.waktu_mulai}–${jadwal.waktu_selesai ?? '?'}`}
                            </p>
                            <p className="text-sm text-gray-500">Mode: {jadwal.mode_label}</p>
                        </div>

                        {isAktif && jadwal.mode_pengisian === 'bk_langsung' && (
                            <button
                                onClick={handlePanggil}
                                disabled={antrianMenunggu.length === 0}
                                className="px-5 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition disabled:opacity-40"
                            >
                                📣 Panggil Berikutnya
                            </button>
                        )}
                    </div>

                    {/* Progress bar */}
                    <div>
                        <div className="flex justify-between text-sm text-gray-500 mb-1">
                            <span>Progress</span>
                            <span>{progress.selesai} / {progress.total} santri selesai</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                                className="h-3 rounded-full bg-indigo-500 transition-all"
                                style={{ width: `${progress.persen}%` }}
                            />
                        </div>
                        <p className="text-xs text-gray-400 mt-1 text-right">{progress.persen}%</p>
                    </div>

                    {jadwal.catatan_untuk_tendik && (
                        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                            <span className="font-medium">Catatan untuk Tendik:</span> {jadwal.catatan_untuk_tendik}
                        </div>
                    )}
                </div>

                {/* Yang sedang dipanggil */}
                {antrianDipanggil.length > 0 && (
                    <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-4">
                        <p className="text-xs font-semibold text-yellow-700 uppercase tracking-wide mb-2">Sedang Dipanggil</p>
                        {antrianDipanggil.map(a => (
                            <div key={a.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-yellow-400 text-white font-bold text-sm flex items-center justify-center">
                                        #{a.nomor_urut}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900">{a.santri.nama}</p>
                                        <p className="text-xs text-gray-500">{a.santri.nisn}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {a.sesi_id ? (
                                        <Link
                                            href={route('my-bimbingan.sesi.review', a.sesi_id)}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                                        >
                                            Review Hasil
                                        </Link>
                                    ) : (
                                        <Link
                                            href={route('my-bimbingan.sesi.form', a.id)}
                                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
                                        >
                                            Isi Jawaban
                                        </Link>
                                    )}
                                    <button
                                        onClick={() => handleTidakHadir(a.id)}
                                        className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 transition"
                                    >
                                        Tidak Hadir
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Antrian Keseluruhan */}
                <div className="bg-white rounded-xl border overflow-hidden">
                    <div className="px-5 py-4 border-b bg-gray-50 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-700 text-sm">
                            Daftar Antrian ({jadwal.antrian.length} santri)
                        </h3>
                        <div className="flex gap-3 text-xs text-gray-500">
                            <span>⏳ {antrianMenunggu.length} menunggu</span>
                            <span>✅ {antrianSelesai.length} selesai</span>
                        </div>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {jadwal.antrian.map(a => (
                            <div key={a.id} className={`px-5 py-3 flex items-center gap-4 ${
                                a.status === 'dipanggil' ? 'bg-yellow-50' : ''
                            }`}>
                                <div className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 ${
                                    a.status === 'selesai'     ? 'bg-green-100 text-green-700' :
                                    a.status === 'dipanggil'  ? 'bg-yellow-400 text-white' :
                                    a.status === 'tidak_hadir'? 'bg-red-100 text-red-700' :
                                    'bg-gray-100 text-gray-600'
                                }`}>
                                    {a.nomor_urut}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900">{a.santri.nama}</p>
                                    <p className="text-xs text-gray-400">{a.santri.nisn}</p>
                                </div>

                                <Badge label={a.status_label} color={a.status_badge} />

                                {/* Tindak lanjut jika selesai */}
                                {a.sesi_tindak_lanjut && (
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                        a.sesi_tindak_lanjut === 'rujuk_konseling' ? 'bg-red-100 text-red-700' :
                                        a.sesi_tindak_lanjut === 'pantau'          ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-green-100 text-green-700'
                                    }`}>
                                        {a.sesi_tindak_lanjut === 'rujuk_konseling' ? 'Dirujuk' :
                                         a.sesi_tindak_lanjut === 'pantau'          ? 'Dipantau' : 'OK'}
                                    </span>
                                )}

                                {/* Aksi */}
                                {a.sesi_id && a.sesi_status === 'selesai' && (
                                    <Link
                                        href={route('my-bimbingan.sesi.review', a.sesi_id)}
                                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                                    >
                                        Lihat
                                    </Link>
                                )}
                                {a.sesi_id && a.sesi_status === 'menunggu_review' && (
                                    <Link
                                        href={route('my-bimbingan.sesi.review', a.sesi_id)}
                                        className="text-xs text-orange-600 hover:text-orange-800 font-semibold"
                                    >
                                        Review!
                                    </Link>
                                )}
                                {/* Tombol Isi Langsung — BK bisa isi tanpa urutan ketat */}
                                {!a.sesi_id && a.status !== 'tidak_hadir' && isAktif && (
                                    <Link
                                        href={route('my-bimbingan.sesi.form-santri', {
                                            jadwal: jadwal.id,
                                            antrian: a.id,
                                        })}
                                        className="text-xs px-2.5 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 font-medium transition"
                                    >
                                        Isi
                                    </Link>
                                )}
                                {/* Jika sesi masih draft (BK belum selesai isi) */}
                                {a.sesi_id && a.sesi_status === 'draft' && (
                                    <Link
                                        href={route('my-bimbingan.sesi.form-santri', {
                                            jadwal: jadwal.id,
                                            antrian: a.id,
                                        })}
                                        className="text-xs px-2.5 py-1.5 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 font-medium transition"
                                    >
                                        Lanjut
                                    </Link>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}