import { Head, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';

const BADGE = {
    gray:  'bg-gray-100 text-gray-600',
    blue:  'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
    red:   'bg-red-100 text-red-700',
    yellow:'bg-yellow-100 text-yellow-700',
};

export default function MyBimbinganIndex({ antrianList = [] }) {
    const { auth } = usePage().props;

    const aktif  = antrianList.filter(a => a.bisa_isi && !a.sudah_selesai);
    const review = antrianList.filter(a => !a.bisa_isi && !a.sudah_selesai && a.jadwal_status !== 'selesai' && a.jadwal_status !== 'dibatalkan');
    const selesai = antrianList.filter(a => a.sudah_selesai);

    return (
        <AppLayout user={auth.user} header="My Bimbingan">
            <Head title="My Bimbingan" />
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Bimbingan</h1>
                    <p className="text-sm text-gray-500 mt-1">Jadwal bimbingan berkala dari Guru BK.</p>
                </div>

                {/* Aktif — bisa isi */}
                {aktif.length > 0 && (
                    <div>
                        <h2 className="text-sm font-semibold text-indigo-700 uppercase tracking-wide mb-3">📝 Perlu Diisi</h2>
                        <div className="space-y-3">
                            {aktif.map(a => (
                                <div key={a.antrian_id} className="bg-white rounded-xl border-2 border-indigo-300 p-5">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="font-semibold text-gray-900">{a.jadwal_judul}</p>
                                            <p className="text-sm text-gray-500 mt-0.5">{a.kelas} &bull; {a.tanggal}</p>
                                        </div>
                                        <span className="bg-indigo-100 text-indigo-700 text-xs px-2.5 py-1 rounded-full font-medium">Bisa Diisi</span>
                                    </div>
                                    <Link
                                        href={route('my-bimbingan.santri.isi', a.antrian_id)}
                                        className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
                                    >
                                        📝 Isi Angket Sekarang
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Menunggu proses / belum dipanggil */}
                {review.length > 0 && (
                    <div>
                        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">⏳ Menunggu Proses</h2>
                        <div className="space-y-3">
                            {review.map(a => (
                                <div key={a.antrian_id} className="bg-white rounded-xl border p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-gray-900">{a.jadwal_judul}</p>
                                            <p className="text-xs text-gray-500">{a.kelas} &bull; {a.tanggal}</p>
                                        </div>
                                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${BADGE.yellow}`}>
                                            {a.jadwal_status === 'aktif' ? 'Akan Datang' : 'Menunggu Giliran'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Riwayat selesai */}
                {selesai.length > 0 && (
                    <div>
                        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">✅ Riwayat</h2>
                        <div className="space-y-3">
                            {selesai.map(a => (
                                <div key={a.antrian_id} className="bg-white rounded-xl border p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-gray-900">{a.jadwal_judul}</p>
                                            <p className="text-xs text-gray-500">{a.kelas} &bull; {a.tanggal}</p>
                                        </div>
                                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                                            a.tindak_lanjut === 'rujuk_konseling' ? BADGE.red :
                                            a.tindak_lanjut === 'pantau' ? BADGE.yellow : BADGE.green
                                        }`}>
                                            {a.tl_label}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {antrianList.length === 0 && (
                    <div className="bg-white rounded-xl border py-16 text-center text-gray-400">
                        <p className="text-lg">📚</p>
                        <p className="font-medium mt-2">Belum ada jadwal bimbingan</p>
                        <p className="text-sm mt-1">Guru BK akan membuat jadwal bimbingan berkala untuk kelasmu.</p>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}