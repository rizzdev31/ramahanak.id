import { Head, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';

export default function MyBimbinganIsiForm({ antrian, jadwal, pertanyaan = [] }) {
    const { auth } = usePage().props;

    const { data, setData, post, processing, errors } = useForm({
        jawaban: pertanyaan.map(p => ({
            pertanyaan_id:    p.id,
            jawaban_teks:     '',
            jawaban_skor:     null,
            jawaban_pilihan:  null,
            jawaban_ya_tidak: null,
        })),
    });

    const update = (idx, field, val) => {
        const j = [...data.jawaban];
        j[idx][field] = val;
        setData('jawaban', j);
    };

    const isValid = () => pertanyaan.every((p, i) => {
        if (!p.is_required) return true;
        const j = data.jawaban[i];
        if (p.tipe === 'skala_1_5')   return j.jawaban_skor !== null;
        if (p.tipe === 'ya_tidak')    return j.jawaban_ya_tidak !== null;
        if (p.tipe === 'pilihan')     return !!j.jawaban_pilihan;
        if (p.tipe === 'teks_bebas' || p.tipe === 'teks_curhat') return j.jawaban_teks.trim().length > 0;
        return true;
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('my-bimbingan.santri.submit', antrian.id));
    };

    return (
        <AppLayout user={auth.user} header="Isi Angket Bimbingan">
            <Head title="Isi Angket Bimbingan" />

            <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-5">

                {/* Header */}
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5">
                    <h2 className="font-semibold text-indigo-900 text-lg">{jadwal.judul}</h2>
                    <p className="text-sm text-indigo-700 mt-1">{jadwal.kelas} &bull; {jadwal.tanggal}</p>
                    {jadwal.deadline && (
                        <p className="text-xs text-indigo-600 mt-1">⏰ Deadline: {jadwal.deadline}</p>
                    )}
                    <p className="text-xs text-indigo-600 mt-2 bg-white/60 rounded-lg px-3 py-2">
                        📌 Isi dengan jujur. Jawaban kamu hanya diketahui oleh Guru BK dan digunakan untuk membantumu.
                        Form ini hanya bisa diisi <strong>1 kali</strong>.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {pertanyaan.map((p, i) => {
                        const j = data.jawaban[i];
                        return (
                            <div key={p.id} className="bg-white rounded-xl border p-5">
                                <p className="text-sm font-medium text-gray-900 mb-1">
                                    <span className="text-indigo-600 font-bold mr-2">{p.urutan}.</span>
                                    {p.teks_pertanyaan}
                                    {p.is_required && <span className="text-red-500 ml-1">*</span>}
                                </p>

                                {p.tipe === 'skala_1_5' && (
                                    <div>
                                        <div className="flex gap-2 mt-3">
                                            {[1,2,3,4,5].map(n => (
                                                <button key={n} type="button"
                                                    onClick={() => update(i, 'jawaban_skor', n)}
                                                    className={`w-11 h-11 rounded-full border-2 font-bold text-sm transition ${
                                                        j.jawaban_skor === n
                                                            ? 'border-indigo-500 bg-indigo-500 text-white'
                                                            : 'border-gray-300 text-gray-600 hover:border-indigo-400'
                                                    }`}
                                                >{n}</button>
                                            ))}
                                        </div>
                                        <div className="flex justify-between text-xs text-gray-400 mt-1 px-1">
                                            <span>Tidak sama sekali</span><span>Sangat sering</span>
                                        </div>
                                    </div>
                                )}

                                {p.tipe === 'ya_tidak' && (
                                    <div className="flex gap-3 mt-3">
                                        {[{l:'Ya',v:true},{l:'Tidak',v:false}].map(opt => (
                                            <button key={opt.l} type="button"
                                                onClick={() => update(i, 'jawaban_ya_tidak', opt.v)}
                                                className={`flex-1 py-2.5 rounded-lg border-2 font-medium text-sm transition ${
                                                    j.jawaban_ya_tidak === opt.v
                                                        ? opt.v ? 'border-red-500 bg-red-500 text-white' : 'border-green-500 bg-green-500 text-white'
                                                        : 'border-gray-300 text-gray-600 hover:border-gray-400'
                                                }`}
                                            >{opt.l}</button>
                                        ))}
                                    </div>
                                )}

                                {p.tipe === 'pilihan' && (
                                    <div className="space-y-2 mt-3">
                                        {(p.pilihan_json ?? []).map((pl, pi) => (
                                            <label key={pi} className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition ${
                                                j.jawaban_pilihan === pl.label
                                                    ? 'border-indigo-500 bg-indigo-50'
                                                    : 'border-gray-200 hover:border-indigo-300'
                                            }`}>
                                                <input type="radio" checked={j.jawaban_pilihan === pl.label}
                                                    onChange={() => update(i, 'jawaban_pilihan', pl.label)}
                                                    className="text-indigo-600" />
                                                <span className="text-sm text-gray-800">{pl.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}

                                {(p.tipe === 'teks_bebas' || p.tipe === 'teks_curhat') && (
                                    <textarea
                                        rows={4}
                                        value={j.jawaban_teks}
                                        onChange={e => update(i, 'jawaban_teks', e.target.value)}
                                        placeholder="Tulis jawabanmu di sini..."
                                        className="w-full mt-3 rounded-lg border-gray-300 text-sm shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                )}
                            </div>
                        );
                    })}

                    {errors.submit && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">{errors.submit}</div>
                    )}

                    <button
                        type="submit"
                        disabled={processing || !isValid()}
                        className="w-full py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-60"
                    >
                        {processing ? 'Mengirim...' : '✅ Kirim Jawaban (Tidak Bisa Diubah)'}
                    </button>

                    <p className="text-xs text-center text-gray-400">
                        Setelah dikirim, jawaban tidak bisa diubah. Pastikan sudah benar sebelum submit.
                    </p>
                </form>
            </div>
        </AppLayout>
    );
}