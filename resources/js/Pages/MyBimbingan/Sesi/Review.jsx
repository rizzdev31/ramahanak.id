import { useState } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';

// ── Konstanta ─────────────────────────────────────────────────
const CONF_BADGE = {
    tinggi: 'bg-red-100 text-red-700',
    sedang: 'bg-yellow-100 text-yellow-700',
    rendah: 'bg-gray-100 text-gray-500',
};
const SUMBER_LABEL = {
    skala:   '📊 Skala',
    pilihan: '☑ Pilihan',
    nlp:     '🔍 Analisis NLP',
};

// ── Komponen Pilih Gejala ─────────────────────────────────────
function PilihGejala({ gejalaList, dipilih, onToggle, variabelKonselor, isSelesai }) {
    return (
        <div className="bg-white rounded-xl border p-5">
            <h3 className="font-semibold text-gray-700 text-sm mb-1">🔍 Gejala Terdeteksi Sistem</h3>
            <p className="text-xs text-gray-500 mb-3">
                Centang gejala yang dikonfirmasi. Bisa tambah manual.
            </p>

            <div className="space-y-2">
                {gejalaList.map((g, i) => (
                    <label key={i} className={`flex items-start gap-3 p-3 rounded-lg border-2 transition ${
                        dipilih.includes(g.kode)
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 hover:border-gray-300'
                    } ${isSelesai ? 'cursor-default' : 'cursor-pointer'}`}>
                        <input
                            type="checkbox"
                            checked={dipilih.includes(g.kode)}
                            onChange={() => !isSelesai && onToggle(g.kode)}
                            className="mt-0.5 text-indigo-600"
                            disabled={isSelesai}
                        />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-sm font-bold text-gray-800">{g.kode}</span>
                                <span className="text-sm text-gray-700">{g.gangguan}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${CONF_BADGE[g.confidence] ?? CONF_BADGE.rendah}`}>
                                    {g.confidence === 'tinggi' ? '⬆ Tinggi' :
                                     g.confidence === 'sedang' ? '⚠ Sedang (NLP saran)' : 'Rendah'}
                                </span>
                                <span className="text-xs text-gray-400">{SUMBER_LABEL[g.sumber]}</span>
                            </div>
                            {g.detail && Array.isArray(g.detail) && (
                                <p className="text-xs text-gray-500 mt-1">{g.detail.join('; ')}</p>
                            )}
                        </div>
                    </label>
                ))}
            </div>

            {/* Tambah gejala manual */}
            {!isSelesai && (
                <div className="mt-3 pt-3 border-t">
                    <p className="text-xs font-medium text-gray-600 mb-2">+ Tambah gejala secara manual</p>
                    <div className="flex gap-2">
                        <select id="gejala_manual_sel" className="flex-1 rounded-lg border-gray-300 text-xs">
                            <option value="">-- Pilih --</option>
                            {variabelKonselor
                                .filter(v => !dipilih.includes(v.kode))
                                .map(v => <option key={v.kode} value={v.kode}>{v.label}</option>)
                            }
                        </select>
                        <button
                            type="button"
                            onClick={() => {
                                const sel = document.getElementById('gejala_manual_sel');
                                if (sel.value) { onToggle(sel.value); sel.value = ''; }
                            }}
                            className="px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg text-xs hover:bg-indigo-200 transition"
                        >
                            Tambah
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Main ──────────────────────────────────────────────────────
export default function SesiReview({
    sesi, santri, dataTerintegrasi = {}, variabelKonselor = []
}) {
    const { auth } = usePage().props;
    const isSelesai = sesi.status === 'selesai';

    // Gejala
    const detectedCodes = (sesi.gejala_terdeteksi ?? []).map(g => g.kode);
    const [gejalaDipilih, setGejalaDipilih] = useState(
        isSelesai ? (sesi.gejala_dikonfirmasi ?? detectedCodes) : detectedCodes
    );

    // Tab aktif: 'tidak_perlu' | 'pantau' | 'rujuk_konseling'
    const [tindakLanjut, setTindakLanjut] = useState(
        isSelesai ? (sesi.tindak_lanjut ?? 'tidak_perlu') : 'tidak_perlu'
    );

    const { data, setData, post, processing, errors } = useForm({
        gejala_dikonfirmasi: gejalaDipilih,
        tindak_lanjut:       tindakLanjut,
        catatan_keputusan:   isSelesai ? (sesi.catatan_keputusan ?? '') : '',
    });

    const toggleGejala = (kode) => {
        const updated = gejalaDipilih.includes(kode)
            ? gejalaDipilih.filter(k => k !== kode)
            : [...gejalaDipilih, kode];
        setGejalaDipilih(updated);
        setData('gejala_dikonfirmasi', updated);
    };

    const handleTindakLanjutChange = (val) => {
        setTindakLanjut(val);
        setData('tindak_lanjut', val);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('my-bimbingan.sesi.keputusan', sesi.id));
    };

    // ── Tab config ────────────────────────────────────────────
    const TABS = [
        {
            value: 'tidak_perlu',
            label: 'Tidak Perlu',
            icon:  '✅',
            color: 'green',
            desc:  'Santri dalam kondisi baik. Tidak ada tindak lanjut khusus.',
        },
        {
            value: 'pantau',
            label: 'Pantau',
            icon:  '🟡',
            color: 'yellow',
            desc:  'Perlu dipantau di sesi berikutnya. Tulis catatan rencana pantau.',
        },
        {
            value: 'rujuk_konseling',
            label: 'Rujuk Konseling',
            icon:  '🔴',
            color: 'red',
            desc:  'Santri perlu konseling individual. Setelah simpan, kamu akan melihat preview laporan yang akan dibuat.',
        },
    ];

    const TAB_ACTIVE = {
        green:  'bg-green-600 text-white',
        yellow: 'bg-yellow-500 text-white',
        red:    'bg-red-600 text-white',
    };
    const TAB_INACTIVE = 'bg-gray-100 text-gray-600 hover:bg-gray-200';

    const activeTab = TABS.find(t => t.value === tindakLanjut);

    return (
        <AppLayout user={auth.user} header="Review Hasil Bimbingan">
            <Head title="Review Sesi Bimbingan" />

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">

                {/* Header */}
                <div className="bg-white rounded-xl border p-5 flex items-center justify-between">
                    <div>
                        <h2 className="font-semibold text-gray-900 text-lg">{santri.nama}</h2>
                        <p className="text-sm text-gray-500">
                            NISN: {santri.nisn} &bull; {sesi.jadwal_judul} &bull; {sesi.tanggal}
                        </p>
                    </div>
                    <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                        isSelesai ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                        {isSelesai ? '✅ Selesai' : '⏳ Menunggu Review'}
                    </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                    {/* ── Kiri: Data santri + Jawaban + Gejala ─── */}
                    <div className="lg:col-span-2 space-y-5">

                        {/* Data terintegrasi */}
                        <div className="bg-white rounded-xl border p-5">
                            <h3 className="font-semibold text-gray-700 text-sm mb-3">📊 Data Santri Saat Ini</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div className="bg-red-50 rounded-lg p-3 text-center">
                                    <p className="text-xl font-bold text-red-700">{dataTerintegrasi.total_poin_pelanggaran ?? 0}</p>
                                    <p className="text-xs text-red-600">Poin Pelanggaran</p>
                                </div>
                                <div className="bg-green-50 rounded-lg p-3 text-center">
                                    <p className="text-xl font-bold text-green-700">{dataTerintegrasi.total_poin_apresiasi ?? 0}</p>
                                    <p className="text-xs text-green-600">Poin Apresiasi</p>
                                </div>
                                <div className="bg-orange-50 rounded-lg p-3 text-center">
                                    <p className="text-xl font-bold text-orange-700">{(dataTerintegrasi.expert_system_aktif ?? []).length}</p>
                                    <p className="text-xs text-orange-600">Konsekuensi Aktif</p>
                                </div>
                                <div className="bg-purple-50 rounded-lg p-3 text-center">
                                    <p className="text-xl font-bold text-purple-700">{(dataTerintegrasi.konseling_aktif ?? []).length}</p>
                                    <p className="text-xs text-purple-600">Konseling Aktif</p>
                                </div>
                            </div>
                            {(dataTerintegrasi.riwayat_bimbingan ?? []).length > 0 && (
                                <div className="mt-3 pt-3 border-t">
                                    <p className="text-xs font-medium text-gray-500 mb-2">Bimbingan Sebelumnya:</p>
                                    {dataTerintegrasi.riwayat_bimbingan.map((r, i) => (
                                        <div key={i} className="flex justify-between text-xs text-gray-600 py-1 border-b last:border-0">
                                            <span>{r.judul} ({r.tanggal})</span>
                                            <span className={`font-medium ${
                                                r.tindak_lanjut === 'rujuk_konseling' ? 'text-red-600' :
                                                r.tindak_lanjut === 'pantau' ? 'text-yellow-600' : 'text-green-600'
                                            }`}>{r.tl_label}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Jawaban santri */}
                        <div className="bg-white rounded-xl border p-5">
                            <h3 className="font-semibold text-gray-700 text-sm mb-3">📋 Jawaban Santri</h3>
                            <div className="space-y-2">
                                {(sesi.jawaban ?? []).map((j, i) => (
                                    <div key={i} className={`p-3 rounded-lg border ${
                                        j.flag_triggered ? 'border-orange-300 bg-orange-50' : 'border-gray-200'
                                    }`}>
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1">
                                                <p className="text-xs font-medium text-gray-600">
                                                    Soal {j.urutan}: {j.teks_pertanyaan}
                                                </p>
                                                <p className="text-sm text-gray-900 mt-1 font-medium">{j.jawaban_display}</p>
                                            </div>
                                            {j.flag_triggered && (
                                                <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full flex-shrink-0">
                                                    🚩 {j.kode_triggered}
                                                </span>
                                            )}
                                        </div>
                                        {j.nlp_detail && j.nlp_detail.length > 0 && (
                                            <p className="text-xs text-orange-600 mt-1">
                                                🔍 NLP: {j.nlp_detail.map(n =>
                                                    `${n.kode} (kata: ${n.kata_pemicu?.join(', ')})`
                                                ).join('; ')}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Gejala terdeteksi */}
                        {(sesi.gejala_terdeteksi ?? []).length > 0 && (
                            <PilihGejala
                                gejalaList={sesi.gejala_terdeteksi}
                                dipilih={gejalaDipilih}
                                onToggle={toggleGejala}
                                variabelKonselor={variabelKonselor}
                                isSelesai={isSelesai}
                            />
                        )}
                    </div>

                    {/* ── Kanan: Keputusan tindak lanjut ──────── */}
                    <div className="space-y-4">
                        {!isSelesai ? (
                            <form onSubmit={handleSubmit} className="space-y-4">

                                {/* Tab pilih tindak lanjut */}
                                <div className="bg-white rounded-xl border p-4">
                                    <p className="text-sm font-semibold text-gray-700 mb-3">
                                        Keputusan Tindak Lanjut <span className="text-red-500">*</span>
                                    </p>

                                    {/* Tombol tab */}
                                    <div className="flex gap-1 mb-4">
                                        {TABS.map(tab => (
                                            <button
                                                key={tab.value}
                                                type="button"
                                                onClick={() => handleTindakLanjutChange(tab.value)}
                                                className={`flex-1 py-2 px-1 rounded-lg text-xs font-medium transition text-center ${
                                                    tindakLanjut === tab.value
                                                        ? TAB_ACTIVE[tab.color]
                                                        : TAB_INACTIVE
                                                }`}
                                            >
                                                <span className="block text-base mb-0.5">{tab.icon}</span>
                                                {tab.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Deskripsi tab aktif */}
                                    <div className={`rounded-lg p-3 text-xs mb-4 ${
                                        tindakLanjut === 'tidak_perlu'     ? 'bg-green-50 text-green-800 border border-green-200' :
                                        tindakLanjut === 'pantau'          ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' :
                                        'bg-red-50 text-red-800 border border-red-200'
                                    }`}>
                                        {activeTab?.desc}
                                        {tindakLanjut === 'rujuk_konseling' && (
                                            <p className="mt-1 font-medium">
                                                Setelah klik simpan, kamu akan diarahkan ke halaman preview laporan sebelum dikonfirmasi.
                                            </p>
                                        )}
                                    </div>

                                    {/* Catatan BK */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                            {tindakLanjut === 'pantau'
                                                ? 'Rencana Pantau (wajib)' : 'Catatan BK (opsional)'}
                                            {tindakLanjut === 'pantau' && <span className="text-red-500 ml-1">*</span>}
                                        </label>
                                        <textarea
                                            rows={3}
                                            value={data.catatan_keputusan}
                                            onChange={e => setData('catatan_keputusan', e.target.value)}
                                            placeholder={
                                                tindakLanjut === 'pantau'
                                                    ? 'Tuliskan rencana pemantauan di sesi bimbingan berikutnya...'
                                                    : 'Catatan tambahan dari BK...'
                                            }
                                            className="w-full rounded-lg border-gray-300 text-sm shadow-sm"
                                            required={tindakLanjut === 'pantau'}
                                        />
                                    </div>
                                </div>

                                {/* Validasi rujuk perlu pilih gejala */}
                                {tindakLanjut === 'rujuk_konseling' && gejalaDipilih.length === 0 && (
                                    <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-3 text-xs text-yellow-800">
                                        ⚠️ Pilih minimal 1 gejala yang dikonfirmasi untuk membuat rujukan.
                                    </div>
                                )}

                                {errors.keputusan && (
                                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700">
                                        {errors.keputusan}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={
                                        processing ||
                                        (tindakLanjut === 'rujuk_konseling' && gejalaDipilih.length === 0) ||
                                        (tindakLanjut === 'pantau' && !data.catatan_keputusan?.trim())
                                    }
                                    className={`w-full py-3 rounded-xl text-sm font-semibold transition disabled:opacity-60 ${
                                        tindakLanjut === 'tidak_perlu'     ? 'bg-green-600 hover:bg-green-700 text-white' :
                                        tindakLanjut === 'pantau'          ? 'bg-yellow-500 hover:bg-yellow-600 text-white' :
                                        'bg-red-600 hover:bg-red-700 text-white'
                                    }`}
                                >
                                    {processing ? 'Menyimpan...' :
                                     tindakLanjut === 'tidak_perlu'     ? '✅ Simpan — Selesai' :
                                     tindakLanjut === 'pantau'          ? '🟡 Simpan — Pantau Berikutnya' :
                                     '🔴 Simpan & Lihat Preview Laporan →'}
                                </button>
                            </form>
                        ) : (
                            /* Tampilan read-only jika sudah selesai */
                            <div className="bg-white rounded-xl border p-5 space-y-3">
                                <h3 className="font-semibold text-gray-800">Keputusan BK</h3>
                                <div className={`p-3 rounded-lg border ${
                                    sesi.tindak_lanjut === 'rujuk_konseling' ? 'bg-red-50 border-red-200' :
                                    sesi.tindak_lanjut === 'pantau'          ? 'bg-yellow-50 border-yellow-200' :
                                    'bg-green-50 border-green-200'
                                }`}>
                                    <p className="text-sm font-semibold">
                                        {TABS.find(t => t.value === sesi.tindak_lanjut)?.icon}{' '}
                                        {TABS.find(t => t.value === sesi.tindak_lanjut)?.label ?? '-'}
                                    </p>
                                    {sesi.catatan_keputusan && (
                                        <p className="text-xs text-gray-600 mt-2 italic">
                                            "{sesi.catatan_keputusan}"
                                        </p>
                                    )}
                                </div>

                                {/* Jika rujuk dan status menunggu_review, link ke preview */}
                                {sesi.tindak_lanjut === 'rujuk_konseling' &&
                                 sesi.status === 'menunggu_review' && (
                                    <Link
                                        href={route('my-bimbingan.sesi.preview-laporan', sesi.id)}
                                        className="block text-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
                                    >
                                        Lanjut ke Preview Laporan →
                                    </Link>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}