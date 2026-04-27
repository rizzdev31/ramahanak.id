import { useState } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';

const TIPE_CONFIG = {
    skala_1_5:   { icon: '🔢', label: 'Skala 1-5',             color: 'blue'   },
    ya_tidak:    { icon: '✓✗', label: 'Ya / Tidak',            color: 'green'  },
    pilihan:     { icon: '☑',  label: 'Pilihan Ganda',         color: 'purple' },
    teks_bebas:  { icon: '🔍', label: 'Teks Bebas (Analisis)', color: 'orange' },
    teks_curhat: { icon: '💬', label: 'Teks Bebas (Curhat)',   color: 'gray'   },
};

const tipeColor = {
    blue:   'bg-blue-100 text-blue-700 border-blue-200',
    green:  'bg-green-100 text-green-700 border-green-200',
    purple: 'bg-purple-100 text-purple-700 border-purple-200',
    orange: 'bg-orange-100 text-orange-700 border-orange-200',
    gray:   'bg-gray-100 text-gray-600 border-gray-200',
};

// ── Form Tambah/Edit Soal ──────────────────────────────────────
function SoalForm({ templateId, soal = null, variabelKonselor, tipeOptions, onClose }) {
    const isEdit = !!soal;

    const { data, setData, post, put, processing, errors } = useForm({
        teks_pertanyaan:     soal?.teks_pertanyaan ?? '',
        tipe:                soal?.tipe ?? 'teks_bebas',
        is_required:         soal?.is_required ?? true,
        kode_gejala_terkait: soal?.kode_gejala_terkait ?? '',
        threshold_flag:      soal?.threshold_flag ?? 3,
        flag_jika_jawaban:   soal?.flag_jika_jawaban ?? 'ya',
        pilihan_json:        soal?.pilihan_json ?? [
            { label: '', kode_gejala: '' },
            { label: '', kode_gejala: '' },
        ],
        analisis_nlp_aktif:  soal?.analisis_nlp_aktif ?? true,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isEdit) {
            put(route('my-bimbingan.soal.update', soal.id), { onSuccess: onClose });
        } else {
            post(route('my-bimbingan.soal.store', templateId), { onSuccess: onClose });
        }
    };

    const addPilihan = () => setData('pilihan_json', [...data.pilihan_json, { label: '', kode_gejala: '' }]);
    const removePilihan = (idx) => setData('pilihan_json', data.pilihan_json.filter((_, i) => i !== idx));
    const updatePilihan = (idx, field, val) => {
        const updated = [...data.pilihan_json];
        updated[idx][field] = val;
        setData('pilihan_json', updated);
    };

    const needsGejala = ['skala_1_5', 'ya_tidak'].includes(data.tipe);
    const isNLP       = data.tipe === 'teks_bebas';
    const isPilihan   = data.tipe === 'pilihan';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <h3 className="font-semibold text-gray-800 text-lg mb-5">
                        {isEdit ? `Edit Soal #${soal.urutan}` : 'Tambah Soal Baru'}
                    </h3>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Teks Pertanyaan */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Teks Pertanyaan <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                rows={3}
                                value={data.teks_pertanyaan}
                                onChange={e => setData('teks_pertanyaan', e.target.value)}
                                placeholder="Tulis pertanyaan di sini..."
                                className="w-full rounded-lg border-gray-300 text-sm shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                required
                            />
                        </div>

                        {/* Tipe Soal */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Tipe Soal</label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {tipeOptions.map(t => (
                                    <button
                                        key={t.value}
                                        type="button"
                                        onClick={() => setData('tipe', t.value)}
                                        className={`px-3 py-2 rounded-lg border text-xs font-medium transition text-left ${
                                            data.tipe === t.value
                                                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                                : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                                        }`}
                                    >
                                        {t.icon} {t.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Konfigurasi per tipe */}
                        {needsGejala && (
                            <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <div>
                                    <label className="block text-xs font-medium text-blue-800 mb-1">Kode Gejala Terkait</label>
                                    <select
                                        value={data.kode_gejala_terkait}
                                        onChange={e => setData('kode_gejala_terkait', e.target.value)}
                                        className="w-full rounded-lg border-blue-200 text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">-- Tidak ada --</option>
                                        {variabelKonselor.map(v => (
                                            <option key={v.kode} value={v.kode}>{v.label}</option>
                                        ))}
                                    </select>
                                </div>
                                {data.tipe === 'skala_1_5' && (
                                    <div>
                                        <label className="block text-xs font-medium text-blue-800 mb-1">
                                            Flag jika skor ≥
                                        </label>
                                        <select
                                            value={data.threshold_flag}
                                            onChange={e => setData('threshold_flag', parseInt(e.target.value))}
                                            className="w-full rounded-lg border-blue-200 text-sm"
                                        >
                                            {[2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                                        </select>
                                    </div>
                                )}
                                {data.tipe === 'ya_tidak' && (
                                    <div>
                                        <label className="block text-xs font-medium text-blue-800 mb-1">Flag jika jawaban</label>
                                        <select
                                            value={data.flag_jika_jawaban}
                                            onChange={e => setData('flag_jika_jawaban', e.target.value)}
                                            className="w-full rounded-lg border-blue-200 text-sm"
                                        >
                                            <option value="ya">Ya</option>
                                            <option value="tidak">Tidak</option>
                                        </select>
                                    </div>
                                )}
                            </div>
                        )}

                        {isPilihan && (
                            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200 space-y-3">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-medium text-purple-800">Pilihan Jawaban</p>
                                    <button type="button" onClick={addPilihan}
                                        className="text-xs text-purple-600 hover:text-purple-800 font-medium">
                                        + Tambah Pilihan
                                    </button>
                                </div>
                                {data.pilihan_json.map((p, i) => (
                                    <div key={i} className="flex gap-2 items-center">
                                        <input
                                            type="text"
                                            value={p.label}
                                            onChange={e => updatePilihan(i, 'label', e.target.value)}
                                            placeholder={`Pilihan ${i + 1}`}
                                            className="flex-1 rounded-lg border-gray-300 text-xs"
                                        />
                                        <select
                                            value={p.kode_gejala}
                                            onChange={e => updatePilihan(i, 'kode_gejala', e.target.value)}
                                            className="w-32 rounded-lg border-gray-300 text-xs"
                                        >
                                            <option value="">Tidak flag</option>
                                            {variabelKonselor.map(v => (
                                                <option key={v.kode} value={v.kode}>{v.kode}</option>
                                            ))}
                                        </select>
                                        {data.pilihan_json.length > 2 && (
                                            <button type="button" onClick={() => removePilihan(i)}
                                                className="text-red-400 hover:text-red-600 text-xs">✕</button>
                                        )}
                                    </div>
                                ))}
                                <p className="text-xs text-purple-600">Pilih kode gejala jika pilihan tersebut perlu di-flag.</p>
                            </div>
                        )}

                        {isNLP && (
                            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={data.analisis_nlp_aktif}
                                        onChange={e => setData('analisis_nlp_aktif', e.target.checked)}
                                        className="w-4 h-4 text-orange-600 rounded"
                                    />
                                    <span className="text-sm text-orange-800 font-medium">
                                        Aktifkan analisis NLP untuk soal ini
                                    </span>
                                </label>
                                <p className="text-xs text-orange-600 mt-2 ml-7">
                                    Jika aktif, jawaban teks akan dianalisis untuk mendeteksi gejala G.
                                    Hasilnya hanya saran — BK tetap harus konfirmasi.
                                </p>
                            </div>
                        )}

                        {/* Wajib diisi */}
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={data.is_required}
                                onChange={e => setData('is_required', e.target.checked)}
                                className="w-4 h-4 text-indigo-600 rounded"
                            />
                            <span className="text-sm text-gray-700">Soal ini wajib diisi</span>
                        </label>

                        <div className="flex gap-3 pt-2">
                            <button type="button" onClick={onClose}
                                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition">
                                Batal
                            </button>
                            <button type="submit" disabled={processing}
                                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-60">
                                {processing ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah Soal'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

// ── Main ──────────────────────────────────────────────────────
export default function TemplateBuilder({ template, variabelKonselor, tipeOptions }) {
    const { auth } = usePage().props;
    const [showForm, setShowForm] = useState(false);
    const [editSoal, setEditSoal] = useState(null);

    const handleDelete = (soalId) => {
        if (!confirm('Hapus soal ini?')) return;
        router.delete(route('my-bimbingan.soal.destroy', soalId));
    };

    return (
        <AppLayout user={auth.user} header={`Builder — ${template.judul}`}>
            <Head title={`Builder: ${template.judul}`} />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">

                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Link href={route('my-bimbingan.template.index')} className="hover:text-indigo-600">Template</Link>
                    <span>/</span>
                    <span className="text-gray-800 font-medium">{template.judul}</span>
                </div>

                {/* Header */}
                <div className="bg-white rounded-xl border p-5">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">{template.judul}</h2>
                            {template.deskripsi && <p className="text-sm text-gray-500 mt-1">{template.deskripsi}</p>}
                            {template.tujuan && (
                                <p className="text-xs text-indigo-600 mt-2 bg-indigo-50 px-3 py-1.5 rounded-lg inline-block">
                                    🎯 {template.tujuan}
                                </p>
                            )}
                        </div>
                        <span className="text-sm text-gray-400">{template.pertanyaan.length} soal</span>
                    </div>
                </div>

                {/* Info box */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
                    <p className="font-medium mb-1">📋 Cara Membuat Soal:</p>
                    <ul className="space-y-1 text-xs list-disc list-inside text-blue-700">
                        <li>Soal tidak terbatas jumlahnya, tambah sesuai kebutuhan</li>
                        <li>Soal <b>Skala, Ya/Tidak, Pilihan</b>: set kode gejala untuk deteksi otomatis</li>
                        <li>Soal <b>Teks Bebas (Analisis)</b>: dianalisis NLP untuk saran gejala G</li>
                        <li>Soal <b>Teks Bebas (Curhat)</b>: disimpan apa adanya, tidak dianalisis</li>
                    </ul>
                </div>

                {/* Daftar soal */}
                <div className="space-y-3">
                    {template.pertanyaan.length === 0 ? (
                        <div className="bg-white rounded-xl border py-12 text-center text-gray-400">
                            Belum ada soal. Klik "+ Tambah Soal" untuk mulai.
                        </div>
                    ) : (
                        template.pertanyaan.map((p, i) => {
                            const cfg = TIPE_CONFIG[p.tipe] ?? TIPE_CONFIG.teks_bebas;
                            return (
                                <div key={p.id} className="bg-white rounded-xl border p-4 flex gap-4 items-start">
                                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 text-sm font-bold flex items-center justify-center flex-shrink-0">
                                        {p.urutan}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900">{p.teks_pertanyaan}</p>
                                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                                            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${tipeColor[cfg.color]}`}>
                                                {cfg.icon} {cfg.label}
                                            </span>
                                            {p.kode_gejala_terkait && (
                                                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                                                    → {p.kode_gejala_terkait}
                                                    {p.threshold_flag ? ` ≥${p.threshold_flag}` : ''}
                                                </span>
                                            )}
                                            {!p.is_required && (
                                                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Opsional</span>
                                            )}
                                        </div>
                                    </div>
                                    {!template.is_locked && (
                                        <div className="flex gap-2 flex-shrink-0">
                                            <button onClick={() => { setEditSoal(p); setShowForm(true); }}
                                                className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">
                                                Edit
                                            </button>
                                            <button onClick={() => handleDelete(p.id)}
                                                className="px-3 py-1.5 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition">
                                                Hapus
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Tombol tambah */}
                {!template.is_locked && (
                    <button
                        onClick={() => { setEditSoal(null); setShowForm(true); }}
                        className="w-full py-3 border-2 border-dashed border-indigo-300 text-indigo-600 rounded-xl text-sm font-medium hover:bg-indigo-50 transition flex items-center justify-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Tambah Soal
                    </button>
                )}

                {/* Tombol buat jadwal */}
                {template.pertanyaan.length > 0 && (
                    <div className="flex justify-end">
                        <Link
                            href={route('my-bimbingan.jadwal.create') + `?template_id=${template.id}`}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition"
                        >
                            📅 Buat Jadwal dengan Template Ini
                        </Link>
                    </div>
                )}
            </div>

            {/* Form Modal */}
            {showForm && (
                <SoalForm
                    templateId={template.id}
                    soal={editSoal}
                    variabelKonselor={variabelKonselor}
                    tipeOptions={tipeOptions}
                    onClose={() => { setShowForm(false); setEditSoal(null); }}
                />
            )}
        </AppLayout>
    );
}