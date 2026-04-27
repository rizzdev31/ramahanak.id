import { useState } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';

export default function PreviewLaporan({ sesi, santri, preview_laporan = [] }) {
    const { auth } = usePage().props;

    // State: kode mana yang BK centang untuk disertakan
    const [disertakan, setDisertakan] = useState(
        preview_laporan.filter(p => p.sertakan && !p.sudah_ada).map(p => p.kode)
    );

    const { post, processing, errors } = useForm({});

    const toggle = (kode) => {
        setDisertakan(prev =>
            prev.includes(kode) ? prev.filter(k => k !== kode) : [...prev, kode]
        );
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (disertakan.length === 0) {
            alert('Pilih minimal 1 kode gejala untuk dirujuk.');
            return;
        }
        post(route('my-bimbingan.sesi.konfirmasi-laporan', sesi.id), {
            data: { kode_disertakan: disertakan },
        });
    };

    const APPROVAL_BADGE = 'bg-blue-100 text-blue-700';

    return (
        <AppLayout user={auth.user} header="Preview Laporan Rujukan">
            <Head title="Preview Laporan Rujukan" />

            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">

                {/* Header */}
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Link href={route('my-bimbingan.jadwal.index')} className="hover:text-indigo-600">Jadwal</Link>
                    <span>/</span>
                    <span className="text-gray-700">Preview Laporan Rujukan</span>
                </div>

                {/* Info */}
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5">
                    <h2 className="font-semibold text-indigo-900">📋 Konfirmasi Laporan Konseling</h2>
                    <p className="text-sm text-indigo-700 mt-1">
                        Santri: <strong>{santri.nama}</strong> ({santri.nisn}) &bull; {sesi.jadwal_judul} &bull; {sesi.tanggal}
                    </p>
                    {sesi.catatan_keputusan && (
                        <p className="text-xs text-indigo-600 mt-2 italic">
                            Catatan BK: "{sesi.catatan_keputusan}"
                        </p>
                    )}
                    <div className="mt-3 bg-white/60 rounded-lg p-3 text-xs text-indigo-800">
                        <p className="font-medium mb-1">ℹ️ Yang akan terjadi setelah konfirmasi:</p>
                        <ul className="space-y-1 list-disc list-inside">
                            <li>Laporan konseling dibuat per kode gejala yang dipilih</li>
                            <li>Wali Kelas / Wali Asrama mendapat notifikasi approval</li>
                            <li>Setelah semua approve, BK melakukan pengesahan akhir di Kelola Approval</li>
                        </ul>
                    </div>
                </div>

                {/* Preview per kode gejala */}
                <form onSubmit={handleSubmit} className="space-y-4">

                    {preview_laporan.length === 0 ? (
                        <div className="bg-white rounded-xl border py-10 text-center text-gray-400">
                            Tidak ada gejala yang dikonfirmasi.
                        </div>
                    ) : (
                        preview_laporan.map((item, i) => (
                            <div key={i} className={`bg-white rounded-xl border-2 transition ${
                                item.sudah_ada
                                    ? 'border-gray-200 opacity-60'
                                    : disertakan.includes(item.kode)
                                        ? 'border-indigo-400 shadow-sm'
                                        : 'border-gray-200'
                            }`}>
                                <div className="p-5">
                                    {/* Header kode */}
                                    <div className="flex items-start gap-3">
                                        {!item.sudah_ada ? (
                                            <input
                                                type="checkbox"
                                                checked={disertakan.includes(item.kode)}
                                                onChange={() => toggle(item.kode)}
                                                className="mt-1 w-4 h-4 text-indigo-600 rounded"
                                            />
                                        ) : (
                                            <span className="mt-1 w-4 h-4 text-gray-400">—</span>
                                        )}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-mono text-sm font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded">
                                                    {item.kode}
                                                </span>
                                                <span className="text-sm font-semibold text-gray-900">
                                                    {item.gangguan}
                                                </span>
                                                {item.sudah_ada && (
                                                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                                                        ⚠ Laporan sudah pernah dibuat
                                                    </span>
                                                )}
                                            </div>

                                            {/* Rekomendasi tindakan */}
                                            <div className="mt-3 bg-gray-50 rounded-lg p-3">
                                                <p className="text-xs font-medium text-gray-500 mb-1">Tindakan yang direkomendasikan:</p>
                                                <p className="text-sm text-gray-800">{item.rekomendasi || '-'}</p>
                                            </div>

                                            {/* Siapa yang akan approve */}
                                            {(item.approver_list ?? []).length > 0 && (
                                                <div className="mt-3">
                                                    <p className="text-xs font-medium text-gray-500 mb-1">
                                                        Akan dikirim ke ({item.approver_list.length} orang):
                                                    </p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {item.approver_list.map((a, ai) => (
                                                            <span key={ai} className={`text-xs px-2 py-0.5 rounded-full ${APPROVAL_BADGE}`}>
                                                                {a.nama}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}

                    {/* Status checklist */}
                    {preview_laporan.length > 0 && (
                        <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600">
                            <span className="font-medium">{disertakan.length}</span> dari{' '}
                            <span className="font-medium">
                                {preview_laporan.filter(p => !p.sudah_ada).length}
                            </span>{' '}
                            laporan akan dibuat.
                            {disertakan.length === 0 && (
                                <span className="text-red-500 ml-2">Pilih minimal 1.</span>
                            )}
                        </div>
                    )}

                    {errors.konfirmasi && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
                            {errors.konfirmasi}
                        </div>
                    )}

                    <div className="flex gap-3">
                        <Link
                            href={route('my-bimbingan.sesi.review', sesi.id)}
                            className="flex-1 text-center px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
                        >
                            ← Kembali ke Review
                        </Link>
                        <button
                            type="submit"
                            disabled={processing || disertakan.length === 0}
                            className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-60"
                        >
                            {processing ? 'Membuat Laporan...' : `✅ Konfirmasi & Buat ${disertakan.length} Laporan`}
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}