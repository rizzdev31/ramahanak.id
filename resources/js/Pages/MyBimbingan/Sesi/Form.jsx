import { Head, Link, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';

// Komponen per tipe soal
const SoalSkala = ({ soal, value, onChange }) => (
    <div className="flex gap-3">
        {[1, 2, 3, 4, 5].map(n => (
            <button
                key={n}
                type="button"
                onClick={() => onChange(n)}
                className={`w-11 h-11 rounded-full border-2 font-bold text-sm transition ${
                    value === n
                        ? 'border-indigo-500 bg-indigo-500 text-white'
                        : 'border-gray-300 text-gray-600 hover:border-indigo-400 hover:bg-indigo-50'
                }`}
            >
                {n}
            </button>
        ))}
        <div className="flex items-center gap-2 ml-2 text-xs text-gray-400">
            <span>1=Tidak sama sekali</span>
            <span>—</span>
            <span>5=Sangat sering</span>
        </div>
    </div>
);

const SoalYaTidak = ({ value, onChange }) => (
    <div className="flex gap-3">
        {[{ label: 'Ya', val: true }, { label: 'Tidak', val: false }].map(opt => (
            <button
                key={opt.label}
                type="button"
                onClick={() => onChange(opt.val)}
                className={`px-6 py-2.5 rounded-lg border-2 font-medium text-sm transition ${
                    value === opt.val
                        ? opt.val ? 'border-red-500 bg-red-500 text-white' : 'border-green-500 bg-green-500 text-white'
                        : 'border-gray-300 text-gray-600 hover:border-gray-400'
                }`}
            >
                {opt.label}
            </button>
        ))}
    </div>
);

const SoalPilihan = ({ pilihan, value, onChange }) => (
    <div className="space-y-2">
        {(pilihan ?? []).map((p, i) => (
            <label key={i} className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition ${
                value === p.label
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-indigo-300'
            }`}>
                <input
                    type="radio"
                    name={`pilihan_${i}`}
                    checked={value === p.label}
                    onChange={() => onChange(p.label)}
                    className="text-indigo-600"
                />
                <span className="text-sm text-gray-800">{p.label}</span>
            </label>
        ))}
    </div>
);

export default function SesiForm({ antrian, sesi, santri, pertanyaan, jawaban_existing = {} }) {
    const { auth } = usePage().props;

    const initialJawaban = pertanyaan.map(p => ({
        pertanyaan_id:    p.id,
        jawaban_teks:     jawaban_existing[p.id]?.jawaban_teks     ?? '',
        jawaban_skor:     jawaban_existing[p.id]?.jawaban_skor     ?? null,
        jawaban_pilihan:  jawaban_existing[p.id]?.jawaban_pilihan  ?? null,
        jawaban_ya_tidak: jawaban_existing[p.id]?.jawaban_ya_tidak ?? null,
    }));

    const { data, setData, post, processing, errors } = useForm({
        jawaban:         initialJawaban,
        catatan_bk_umum: '',
    });

    const updateJawaban = (idx, field, val) => {
        const updated = [...data.jawaban];
        updated[idx][field] = val;
        setData('jawaban', updated);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('my-bimbingan.sesi.store', sesi.id));
    };

    return (
        <AppLayout user={auth.user} header="Isi Jawaban Sesi">
            <Head title="Isi Jawaban Sesi" />

            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">

                {/* Header santri */}
                <div className="bg-white rounded-xl border p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 font-bold text-lg flex items-center justify-center">
                        #{antrian.nomor_urut}
                    </div>
                    <div>
                        <p className="font-semibold text-gray-900 text-lg">{santri.nama}</p>
                        <p className="text-sm text-gray-500">NISN: {santri.nisn} &bull; {antrian.jadwal_judul}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Soal-soal */}
                    {pertanyaan.map((p, i) => {
                        const j = data.jawaban[i];
                        return (
                            <div key={p.id} className="bg-white rounded-xl border p-5">
                                <div className="flex items-start gap-3 mb-4">
                                    <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                                        {p.urutan}
                                    </span>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900">
                                            {p.teks_pertanyaan}
                                            {p.is_required && <span className="text-red-500 ml-1">*</span>}
                                        </p>
                                        <span className={`mt-1 text-xs px-2 py-0.5 rounded-full inline-block ${
                                            p.tipe === 'skala_1_5'   ? 'bg-blue-100 text-blue-700' :
                                            p.tipe === 'ya_tidak'    ? 'bg-green-100 text-green-700' :
                                            p.tipe === 'pilihan'     ? 'bg-purple-100 text-purple-700' :
                                            p.tipe === 'teks_bebas'  ? 'bg-orange-100 text-orange-700' :
                                            'bg-gray-100 text-gray-600'
                                        }`}>
                                            {p.tipe_label}
                                        </span>
                                    </div>
                                </div>

                                {p.tipe === 'skala_1_5' && (
                                    <SoalSkala
                                        soal={p}
                                        value={j.jawaban_skor}
                                        onChange={v => updateJawaban(i, 'jawaban_skor', v)}
                                    />
                                )}
                                {p.tipe === 'ya_tidak' && (
                                    <SoalYaTidak
                                        value={j.jawaban_ya_tidak}
                                        onChange={v => updateJawaban(i, 'jawaban_ya_tidak', v)}
                                    />
                                )}
                                {p.tipe === 'pilihan' && (
                                    <SoalPilihan
                                        pilihan={p.pilihan_json}
                                        value={j.jawaban_pilihan}
                                        onChange={v => updateJawaban(i, 'jawaban_pilihan', v)}
                                    />
                                )}
                                {(p.tipe === 'teks_bebas' || p.tipe === 'teks_curhat') && (
                                    <div>
                                        <textarea
                                            rows={4}
                                            value={j.jawaban_teks}
                                            onChange={e => updateJawaban(i, 'jawaban_teks', e.target.value)}
                                            placeholder={p.tipe === 'teks_bebas' ? 'Catat jawaban santri di sini...' : 'Catat curahan hati santri...'}
                                            className="w-full rounded-lg border-gray-300 text-sm shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                        {p.tipe === 'teks_bebas' && (
                                            <p className="text-xs text-orange-600 mt-1">
                                                🔍 Jawaban ini akan dianalisis untuk mendeteksi gejala. Hasilnya hanya saran untuk BK.
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* Catatan umum */}
                    <div className="bg-white rounded-xl border p-5">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Catatan Umum BK <span className="text-gray-400 font-normal">(opsional)</span>
                        </label>
                        <textarea
                            rows={3}
                            value={data.catatan_bk_umum}
                            onChange={e => setData('catatan_bk_umum', e.target.value)}
                            placeholder="Observasi umum selama sesi wawancara..."
                            className="w-full rounded-lg border-gray-300 text-sm shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>

                    {/* Submit */}
                    <div className="flex gap-3">
                        <Link
                            href={route('my-bimbingan.jadwal.show', antrian.jadwal_id)}
                            className="flex-1 text-center px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
                        >
                            Kembali
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-60"
                        >
                            {processing ? 'Menyimpan & Menganalisis...' : '🔍 Simpan & Analisis Jawaban'}
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}