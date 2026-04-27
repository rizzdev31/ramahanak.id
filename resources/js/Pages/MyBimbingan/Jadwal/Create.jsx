import { useEffect } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';

export default function JadwalCreate({ templates = [], kelasList = [] }) {
    const { auth, flash } = usePage().props;

    // Ambil template_id dari query string jika ada (dari tombol di builder)
    const params = new URLSearchParams(window.location.search);
    const defaultTemplateId = params.get('template_id') ?? '';

    const { data, setData, post, processing, errors } = useForm({
        template_id:           defaultTemplateId,
        kelas_id:              '',
        judul:                 '',
        tanggal_jadwal:        '',
        waktu_mulai:           '',
        waktu_selesai:         '',
        catatan_untuk_tendik:  '',
        mode_pengisian:        'bk_langsung',
        deadline_mandiri:      '',
    });

    // Auto-isi judul saat template dipilih
    useEffect(() => {
        if (data.template_id) {
            const tpl = templates.find(t => String(t.id) === String(data.template_id));
            if (tpl && !data.judul) {
                setData('judul', tpl.judul);
            }
        }
    }, [data.template_id]);

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('my-bimbingan.jadwal.store'));
    };

    return (
        <AppLayout user={auth.user} header="My Bimbingan — Buat Jadwal">
            <Head title="Buat Jadwal Bimbingan" />

            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">

                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Link href={route('my-bimbingan.jadwal.index')} className="hover:text-indigo-600">Jadwal</Link>
                    <span>/</span>
                    <span className="text-gray-800">Buat Jadwal Baru</span>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">

                    {/* Template */}
                    <div className="bg-white rounded-xl border p-5 space-y-4">
                        <h3 className="font-semibold text-gray-800">1. Pilih Template Angket</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {templates.map(t => (
                                <label
                                    key={t.id}
                                    className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition ${
                                        String(data.template_id) === String(t.id)
                                            ? 'border-indigo-500 bg-indigo-50'
                                            : 'border-gray-200 hover:border-indigo-300'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="template_id"
                                        value={t.id}
                                        checked={String(data.template_id) === String(t.id)}
                                        onChange={() => setData('template_id', String(t.id))}
                                        className="mt-0.5 text-indigo-600"
                                    />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{t.judul}</p>
                                        {t.deskripsi && <p className="text-xs text-gray-500 mt-0.5">{t.deskripsi}</p>}
                                        <p className="text-xs text-indigo-600 mt-1">📝 {t.jumlah_soal} soal</p>
                                    </div>
                                </label>
                            ))}
                        </div>
                        {errors.template_id && <p className="text-red-500 text-xs">{errors.template_id}</p>}
                    </div>

                    {/* Info Jadwal */}
                    <div className="bg-white rounded-xl border p-5 space-y-4">
                        <h3 className="font-semibold text-gray-800">2. Informasi Jadwal</h3>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Judul Jadwal <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={data.judul}
                                onChange={e => setData('judul', e.target.value)}
                                placeholder="cth: Bimbingan Semester Ganjil 2025 — Kelas 7A"
                                className="w-full rounded-lg border-gray-300 text-sm shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                required
                            />
                            {errors.judul && <p className="text-red-500 text-xs mt-1">{errors.judul}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Kelas <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={data.kelas_id}
                                onChange={e => setData('kelas_id', e.target.value)}
                                className="w-full rounded-lg border-gray-300 text-sm shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                required
                            >
                                <option value="">-- Pilih Kelas --</option>
                                {kelasList.map(k => (
                                    <option key={k.id} value={k.id}>{k.label}</option>
                                ))}
                            </select>
                            {errors.kelas_id && <p className="text-red-500 text-xs mt-1">{errors.kelas_id}</p>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tanggal <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={data.tanggal_jadwal}
                                    onChange={e => setData('tanggal_jadwal', e.target.value)}
                                    className="w-full rounded-lg border-gray-300 text-sm shadow-sm"
                                    required
                                />
                                {errors.tanggal_jadwal && <p className="text-red-500 text-xs mt-1">{errors.tanggal_jadwal}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mulai</label>
                                <input
                                    type="time"
                                    value={data.waktu_mulai}
                                    onChange={e => setData('waktu_mulai', e.target.value)}
                                    className="w-full rounded-lg border-gray-300 text-sm shadow-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Selesai</label>
                                <input
                                    type="time"
                                    value={data.waktu_selesai}
                                    onChange={e => setData('waktu_selesai', e.target.value)}
                                    className="w-full rounded-lg border-gray-300 text-sm shadow-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Catatan untuk Wali Kelas/Asrama</label>
                            <textarea
                                rows={2}
                                value={data.catatan_untuk_tendik}
                                onChange={e => setData('catatan_untuk_tendik', e.target.value)}
                                placeholder="Informasi tambahan untuk tenaga pendidik terkait jadwal ini..."
                                className="w-full rounded-lg border-gray-300 text-sm shadow-sm"
                            />
                        </div>
                    </div>

                    {/* Mode Pengisian */}
                    <div className="bg-white rounded-xl border p-5 space-y-4">
                        <h3 className="font-semibold text-gray-800">3. Mode Pengisian</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <label className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition ${
                                data.mode_pengisian === 'bk_langsung'
                                    ? 'border-indigo-500 bg-indigo-50'
                                    : 'border-gray-200 hover:border-indigo-300'
                            }`}>
                                <input
                                    type="radio"
                                    value="bk_langsung"
                                    checked={data.mode_pengisian === 'bk_langsung'}
                                    onChange={() => setData('mode_pengisian', 'bk_langsung')}
                                    className="mt-0.5 text-indigo-600"
                                />
                                <div>
                                    <p className="text-sm font-medium text-gray-900">🎤 BK Wawancara Langsung</p>
                                    <p className="text-xs text-gray-500 mt-1">BK memanggil santri satu per satu dan mengisi jawaban berdasarkan wawancara tatap muka.</p>
                                </div>
                            </label>

                            <label className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition ${
                                data.mode_pengisian === 'santri_mandiri'
                                    ? 'border-green-500 bg-green-50'
                                    : 'border-gray-200 hover:border-green-300'
                            }`}>
                                <input
                                    type="radio"
                                    value="santri_mandiri"
                                    checked={data.mode_pengisian === 'santri_mandiri'}
                                    onChange={() => setData('mode_pengisian', 'santri_mandiri')}
                                    className="mt-0.5 text-green-600"
                                />
                                <div>
                                    <p className="text-sm font-medium text-gray-900">📱 Santri Isi Mandiri</p>
                                    <p className="text-xs text-gray-500 mt-1">Santri mengisi sendiri via akun mereka. BK tetap mereview hasilnya sebelum keputusan final.</p>
                                </div>
                            </label>
                        </div>

                        {data.mode_pengisian === 'santri_mandiri' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Deadline Pengisian <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="datetime-local"
                                    value={data.deadline_mandiri}
                                    onChange={e => setData('deadline_mandiri', e.target.value)}
                                    className="w-full rounded-lg border-gray-300 text-sm shadow-sm"
                                    required
                                />
                                {errors.deadline_mandiri && <p className="text-red-500 text-xs mt-1">{errors.deadline_mandiri}</p>}
                            </div>
                        )}
                    </div>

                    {/* Info penting */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
                        <p className="font-medium">📋 Yang terjadi setelah jadwal dibuat:</p>
                        <ul className="mt-2 space-y-1 text-xs list-disc list-inside">
                            <li>Antrian santri di-generate otomatis dari daftar kelas yang dipilih</li>
                            <li>Semua wali kelas & wali asrama di kelas tersebut mendapat notifikasi</li>
                            <li>Jadwal langsung aktif dan siap dijalankan</li>
                        </ul>
                    </div>

                    {/* Submit */}
                    <div className="flex gap-3">
                        <Link
                            href={route('my-bimbingan.jadwal.index')}
                            className="flex-1 text-center px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
                        >
                            Batal
                        </Link>
                        <button
                            type="submit"
                            disabled={processing || !data.template_id || !data.kelas_id}
                            className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-60"
                        >
                            {processing ? 'Membuat Jadwal...' : '✅ Buat Jadwal & Generate Antrian'}
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}