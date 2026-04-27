import { useState } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';

const Badge = ({ color = 'gray', children }) => {
    const map = {
        green:  'bg-green-100 text-green-700',
        blue:   'bg-blue-100 text-blue-700',
        yellow: 'bg-yellow-100 text-yellow-700',
        red:    'bg-red-100 text-red-700',
        gray:   'bg-gray-100 text-gray-600',
    };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[color] ?? map.gray}`}>{children}</span>;
};

export default function TemplateIndex({ templates = [] }) {
    const { auth } = usePage().props;
    const [showModal, setShowModal] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        judul: '',
        deskripsi: '',
        tujuan: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('my-bimbingan.template.store'), {
            onSuccess: () => { reset(); setShowModal(false); },
        });
    };

    const handleDelete = (id) => {
        if (!confirm('Hapus template ini? Soal-soal di dalamnya akan ikut terhapus.')) return;
        router.delete(route('my-bimbingan.template.destroy', id));
    };

    return (
        <AppLayout user={auth.user} header="My Bimbingan — Template Angket">
            <Head title="Template Angket" />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Template Angket</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Buat dan kelola template soal bimbingan berkala. Template bisa dipakai ulang di jadwal manapun.
                        </p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Buat Template
                    </button>
                </div>

                {/* Grid Template */}
                {templates.length === 0 ? (
                    <div className="bg-white rounded-xl border py-16 text-center">
                        <svg className="mx-auto w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-gray-500 font-medium">Belum ada template</p>
                        <p className="text-gray-400 text-sm mt-1">Buat template pertama untuk memulai bimbingan berkala.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {templates.map(t => (
                            <div key={t.id} className="bg-white rounded-xl border shadow-sm hover:shadow-md transition overflow-hidden">
                                <div className="p-5">
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="font-semibold text-gray-900 text-sm leading-tight flex-1 mr-2">{t.judul}</h3>
                                        <div className="flex gap-1">
                                            {t.is_locked && <Badge color="red">Dikunci</Badge>}
                                            {!t.is_locked && t.is_active && <Badge color="green">Aktif</Badge>}
                                        </div>
                                    </div>

                                    {t.deskripsi && (
                                        <p className="text-xs text-gray-500 mb-3 line-clamp-2">{t.deskripsi}</p>
                                    )}

                                    <div className="flex gap-4 text-xs text-gray-400 mb-4">
                                        <span>📝 {t.jumlah_soal} soal</span>
                                        <span>📅 {t.jumlah_pemakai} jadwal</span>
                                    </div>

                                    <p className="text-xs text-gray-400">Dibuat: {t.created_at} oleh {t.created_by_name}</p>
                                </div>

                                <div className="px-5 py-3 border-t bg-gray-50 flex gap-2">
                                    {!t.is_locked && (
                                        <Link
                                            href={route('my-bimbingan.template.builder', t.id)}
                                            className="flex-1 text-center px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition"
                                        >
                                            Edit Soal
                                        </Link>
                                    )}
                                    {t.is_locked && (
                                        <Link
                                            href={route('my-bimbingan.template.builder', t.id)}
                                            className="flex-1 text-center px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 transition"
                                        >
                                            Lihat Soal
                                        </Link>
                                    )}
                                    {!t.is_locked && t.jumlah_pemakai === 0 && (
                                        <button
                                            onClick={() => handleDelete(t.id)}
                                            className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 transition"
                                        >
                                            Hapus
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal Buat Template */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
                        <h3 className="font-semibold text-gray-800 text-lg mb-4">Buat Template Baru</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Judul Template <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.judul}
                                    onChange={e => setData('judul', e.target.value)}
                                    placeholder="cth: Bimbingan Awal Semester Ganjil 2025"
                                    className="w-full rounded-lg border-gray-300 text-sm shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    required
                                />
                                {errors.judul && <p className="text-red-500 text-xs mt-1">{errors.judul}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                                <textarea
                                    rows={2}
                                    value={data.deskripsi}
                                    onChange={e => setData('deskripsi', e.target.value)}
                                    placeholder="Deskripsi singkat template ini..."
                                    className="w-full rounded-lg border-gray-300 text-sm shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tujuan Bimbingan</label>
                                <textarea
                                    rows={2}
                                    value={data.tujuan}
                                    onChange={e => setData('tujuan', e.target.value)}
                                    placeholder="Tujuan yang ingin dicapai dari sesi bimbingan ini..."
                                    className="w-full rounded-lg border-gray-300 text-sm shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => { setShowModal(false); reset(); }}
                                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-60"
                                >
                                    {processing ? 'Menyimpan...' : 'Buat & Edit Soal'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}