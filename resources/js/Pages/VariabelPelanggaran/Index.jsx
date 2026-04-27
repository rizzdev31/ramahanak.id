import { useState, useEffect, useRef, useCallback } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Head, useForm, router } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';

// ─── Warna badge per tipe ───────────────────────────────────────────
const TIPE_COLOR = {
    pelanggaran: 'bg-red-100 text-red-700 border-red-200',
    apresiasi:   'bg-green-100 text-green-700 border-green-200',
    konselor:    'bg-purple-100 text-purple-700 border-purple-200',
};
const TIPE_LABEL = { pelanggaran: '⚠️ Pelanggaran', apresiasi: '✅ Apresiasi', konselor: '🧠 Konselor' };

// ─── Komponen: badge konflik kata ──────────────────────────────────
function ConflictBadge({ conflicts }) {
    if (!conflicts?.length) return null;
    return (
        <div className="mt-2 flex flex-wrap gap-1">
            {conflicts.map((c, i) => (
                <span
                    key={i}
                    title={c.konflik_label}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium border rounded-full ${TIPE_COLOR[c.konflik_tipe] ?? 'bg-gray-100 text-gray-700'}`}
                >
                    ⚡ <strong>"{c.kata}"</strong> juga di {c.konflik_kode}
                </span>
            ))}
        </div>
    );
}

// ─── Komponen: panel input kamus kata dengan deteksi konflik ───────
function KamusKataInput({ value, onChange, excludeKode, conflictRoute }) {
    const [conflicts, setConflicts]   = useState([]);
    const [checking, setChecking]     = useState(false);
    const debounceRef                 = useRef(null);

    const checkConflicts = useCallback(async (kata) => {
        if (!kata.trim()) { setConflicts([]); return; }
        setChecking(true);
        try {
            const res = await fetch(conflictRoute, {
                method : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content ?? '',
                    'Accept'      : 'application/json',
                },
                body: JSON.stringify({ kamus_kata: kata, exclude_kode: excludeKode }),
            });
            const json = await res.json();
            setConflicts(json.conflicts ?? []);
        } catch { setConflicts([]); }
        finally  { setChecking(false); }
    }, [conflictRoute, excludeKode]);

    const handleChange = (e) => {
        onChange(e.target.value);
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => checkConflicts(e.target.value), 700);
    };

    // Kelompokkan konflik per kata agar lebih mudah dibaca
    const byKata = conflicts.reduce((acc, c) => {
        if (!acc[c.kata]) acc[c.kata] = [];
        acc[c.kata].push(c);
        return acc;
    }, {});

    return (
        <div>
            <div className="relative">
                <textarea
                    value={value}
                    onChange={handleChange}
                    rows={3}
                    placeholder="telat,terlambat,ngaret,lambat (pisahkan dengan koma)"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
                {checking && (
                    <span className="absolute top-2 right-2 text-xs text-gray-400 animate-pulse">
                        Memeriksa…
                    </span>
                )}
            </div>
            <p className="text-xs text-gray-400 mt-1">Pisahkan dengan koma. Huruf kecil semua disarankan.</p>

            {/* Panel konflik */}
            {Object.keys(byKata).length > 0 && (
                <div className="mt-3 border border-yellow-300 rounded-lg bg-yellow-50 p-3 space-y-3">
                    <p className="text-xs font-semibold text-yellow-800 flex items-center gap-1">
                        ⚡ Terdeteksi {conflicts.length} konflik kata dengan variabel lain
                    </p>
                    {Object.entries(byKata).map(([kata, items]) => (
                        <div key={kata} className="space-y-1">
                            <p className="text-xs font-bold text-gray-700">
                                Kata: <span className="font-mono bg-white border border-gray-300 px-1 rounded">{kata}</span>
                            </p>
                            {items.map((c, i) => (
                                <div
                                    key={i}
                                    className={`text-xs rounded p-2 border ${
                                        c.bisa_negation
                                            ? 'bg-blue-50 border-blue-200 text-blue-800'
                                            : 'bg-gray-50 border-gray-200 text-gray-700'
                                    }`}
                                >
                                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium mr-2 ${TIPE_COLOR[c.konflik_tipe]}`}>
                                        {TIPE_LABEL[c.konflik_tipe]}
                                    </span>
                                    <strong>{c.konflik_kode}</strong> — {c.konflik_label}
                                    {c.bisa_negation && (
                                        <p className="mt-1 text-blue-700">
                                            💡 {c.saran_negation}
                                        </p>
                                    )}
                                    {!c.bisa_negation && (
                                        <p className="mt-1 text-gray-500">
                                            ⚠️ {c.saran_negation}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Komponen: Setup Negation Panel ────────────────────────────────
function NegationSetupPanel({ formData, setData, availableCounterparts, mode }) {
    return (
        <div className="border border-dashed border-indigo-300 rounded-xl bg-indigo-50 p-4 space-y-4">
            <div className="flex items-start gap-2">
                <span className="text-lg">🔄</span>
                <div>
                    <p className="text-sm font-semibold text-indigo-900">Setup Negation (Opsional)</p>
                    <p className="text-xs text-indigo-700 mt-0.5">
                        Jika ada kata di kamus yang bisa dinegasi (misal: "tidak telat"), aktifkan di sini agar sistem otomatis flip ke variabel apresiasi yang sesuai.
                    </p>
                </div>
            </div>

            {/* Toggle negatable */}
            <label className="flex items-center gap-3 cursor-pointer select-none">
                <div
                    onClick={() => setData('negatable', !formData.negatable)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${formData.negatable ? 'bg-indigo-600' : 'bg-gray-300'}`}
                >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${formData.negatable ? 'translate-x-5' : ''}`} />
                </div>
                <span className="text-sm font-medium text-gray-800">
                    {formData.negatable ? '✅ Negation Aktif' : 'Negation Nonaktif'}
                </span>
            </label>

            {formData.negatable && (
                <div className="space-y-3 border-t border-indigo-200 pt-3">
                    {/* Counterpart */}
                    <div>
                        <InputLabel value="Counterpart Apresiasi *" className="text-xs" />
                        <p className="text-xs text-gray-500 mb-1">
                            Jika kata di kamus ini dinegasi ("tidak [kata]"), sistem akan flip ke kode apresiasi ini.
                        </p>
                        <select
                            value={formData.counterpart_kode ?? ''}
                            onChange={(e) => setData('counterpart_kode', e.target.value || null)}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="">-- Pilih Counterpart Apresiasi --</option>
                            {availableCounterparts.map((a) => (
                                <option key={a.kode} value={a.kode}>
                                    {a.kode} — {a.kategori}
                                </option>
                            ))}
                        </select>
                        <InputError message={''} />
                    </div>

                    {/* Preview */}
                    {formData.counterpart_kode && formData.kamus_kata && (
                        <div className="bg-white border border-indigo-200 rounded-lg p-3">
                            <p className="text-xs font-semibold text-indigo-800 mb-2">Preview Negation:</p>
                            {formData.kamus_kata.split(',').slice(0, 3).map((k, i) => {
                                const kata = k.trim();
                                if (!kata) return null;
                                return (
                                    <div key={i} className="text-xs text-gray-700 mb-1 flex items-center gap-2">
                                        <span className="font-mono bg-red-50 border border-red-200 px-1.5 rounded text-red-700">
                                            "{kata}"
                                        </span>
                                        <span className="text-gray-400">→</span>
                                        <span className="text-xs text-gray-500">match kode ini</span>
                                        <span className="text-gray-400">|</span>
                                        <span className="font-mono bg-blue-50 border border-blue-200 px-1.5 rounded text-blue-700">
                                            "tidak {kata}"
                                        </span>
                                        <span className="text-gray-400">→ flip ke</span>
                                        <span className="font-mono bg-green-50 border border-green-200 px-1.5 rounded text-green-700">
                                            {formData.counterpart_kode}
                                        </span>
                                    </div>
                                );
                            })}
                            {formData.kamus_kata.split(',').length > 3 && (
                                <p className="text-xs text-gray-400 mt-1">... dan {formData.kamus_kata.split(',').length - 3} kata lainnya</p>
                            )}
                        </div>
                    )}

                    {/* Negation Notes */}
                    <div>
                        <InputLabel value="Catatan Negation (Opsional)" className="text-xs" />
                        <textarea
                            value={formData.negation_notes ?? ''}
                            onChange={(e) => setData('negation_notes', e.target.value)}
                            rows={2}
                            placeholder="Contoh: Kata 'telat' hanya flip jika ada 'tidak' atau 'belum' di depannya, bukan 'hampir'."
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════
export default function VariabelPelanggaranIndex({ auth, data, availableCounterparts }) {
    const [showModal,     setShowModal]     = useState(false);
    const [editMode,      setEditMode]      = useState(false);
    const [selectedItem,  setSelectedItem]  = useState(null);
    const [expandedId,    setExpandedId]    = useState(null);

    const { data: formData, setData, post, put, processing, errors, reset } = useForm({
        kode            : '',
        kategori        : '',
        poin            : '',
        tindakan        : '',
        kamus_kata      : '',
        negatable       : false,
        counterpart_kode: null,
        negation_notes  : '',
    });

    const conflictCheckRoute = '/variabel/pelanggaran/check-conflict';

    const openCreateModal = () => {
        reset();
        setEditMode(false);
        setShowModal(true);
    };

    const openEditModal = (item) => {
        setSelectedItem(item);
        setData({
            kode            : item.kode,
            kategori        : item.kategori,
            poin            : item.poin,
            tindakan        : item.tindakan,
            kamus_kata      : item.kamus_kata,
            negatable       : item.negatable ?? false,
            counterpart_kode: item.counterpart_kode ?? null,
            negation_notes  : item.negation_notes ?? '',
        });
        setEditMode(true);
        setShowModal(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editMode) {
            put(route('variabel.pelanggaran.update', selectedItem.id), {
                onSuccess: () => { setShowModal(false); reset(); },
            });
        } else {
            post(route('variabel.pelanggaran.store'), {
                onSuccess: () => { setShowModal(false); reset(); },
            });
        }
    };

    const handleDelete = (id) => {
        if (confirm('Yakin ingin menghapus variabel ini? Data yang sudah diproses tidak terpengaruh.')) {
            router.delete(route('variabel.pelanggaran.destroy', id));
        }
    };

    // Hitung statistik
    const totalKonflik     = data.filter(d => d.has_conflicts).length;
    const totalNegatable   = data.filter(d => d.negatable).length;
    const totalBelumNegasi = data.filter(d => d.has_conflicts && !d.negatable).length;

    return (
        <AppLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800">Kelola Variabel Pelanggaran</h2>}
        >
            <Head title="Variabel Pelanggaran" />

            <div className="py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

                    {/* ── Header ── */}
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Daftar Variabel Pelanggaran</h3>
                            <p className="text-sm text-gray-500 mt-1">
                                Kelola kamus kata dan aturan negation untuk setiap variabel pelanggaran.
                            </p>
                        </div>
                        <PrimaryButton onClick={openCreateModal}>+ Tambah Variabel</PrimaryButton>
                    </div>

                    {/* ── Ringkasan Konflik ── */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
                            <span className="text-2xl">📚</span>
                            <div>
                                <p className="text-xs text-gray-500">Total Variabel</p>
                                <p className="text-xl font-bold text-gray-900">{data.length}</p>
                            </div>
                        </div>
                        <div className={`rounded-xl border p-4 flex items-center gap-3 ${totalKonflik > 0 ? 'bg-yellow-50 border-yellow-300' : 'bg-white border-gray-200'}`}>
                            <span className="text-2xl">⚡</span>
                            <div>
                                <p className="text-xs text-gray-500">Variabel Ada Konflik Kata</p>
                                <p className="text-xl font-bold text-yellow-700">{totalKonflik}</p>
                            </div>
                        </div>
                        <div className={`rounded-xl border p-4 flex items-center gap-3 ${totalBelumNegasi > 0 ? 'bg-red-50 border-red-300' : 'bg-green-50 border-green-200'}`}>
                            <span className="text-2xl">{totalBelumNegasi > 0 ? '🔴' : '✅'}</span>
                            <div>
                                <p className="text-xs text-gray-500">Konflik Belum Setup Negation</p>
                                <p className={`text-xl font-bold ${totalBelumNegasi > 0 ? 'text-red-700' : 'text-green-700'}`}>
                                    {totalBelumNegasi}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* ── Alert jika ada konflik belum di-setup ── */}
                    {totalBelumNegasi > 0 && (
                        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-start gap-3">
                            <span className="text-xl mt-0.5">⚠️</span>
                            <div className="text-sm text-amber-900">
                                <p className="font-semibold">Ada {totalBelumNegasi} variabel dengan konflik kata yang belum di-setup negation-nya.</p>
                                <p className="mt-1 text-amber-700">
                                    Konflik kata artinya kata yang sama ada di dua variabel berbeda. Jika ini disengaja (misalnya "telat" ada di Pelanggaran P002 dan Apresiasi A101), setup negation agar sistem tahu kapan kata itu flip.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* ── Tabel Variabel ── */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    {['Kode', 'Kategori', 'Poin', 'Kamus Kata & Konflik', 'Negation', 'Aksi'].map(h => (
                                        <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {data.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-10 text-center text-gray-400 text-sm">
                                            Belum ada variabel. Klik "Tambah Variabel" untuk memulai.
                                        </td>
                                    </tr>
                                ) : data.map((item) => {
                                    const isExpanded = expandedId === item.id;
                                    const words = (item.kamus_kata ?? '').split(',').map(w => w.trim()).filter(Boolean);
                                    const conflictWords = new Set((item.conflicts ?? []).map(c => c.kata.toLowerCase()));

                                    return (
                                        <tr key={item.id} className={`hover:bg-gray-50 transition-colors ${item.has_conflicts ? 'bg-yellow-50/40' : ''}`}>
                                            {/* Kode */}
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className="px-2 py-1 text-xs font-mono font-bold bg-red-100 text-red-800 rounded">
                                                    {item.kode}
                                                </span>
                                            </td>
                                            {/* Kategori */}
                                            <td className="px-4 py-3">
                                                <p className="text-sm font-medium text-gray-900">{item.kategori}</p>
                                            </td>
                                            {/* Poin */}
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className="px-2 py-1 text-sm font-bold text-red-700 bg-red-50 rounded-full border border-red-200">
                                                    -{item.poin}
                                                </span>
                                            </td>
                                            {/* Kamus Kata */}
                                            <td className="px-4 py-3 max-w-xs">
                                                <div className="flex flex-wrap gap-1">
                                                    {words.slice(0, isExpanded ? words.length : 6).map((w, i) => {
                                                        const isConflict = conflictWords.has(w.toLowerCase());
                                                        return (
                                                            <span
                                                                key={i}
                                                                title={isConflict ? '⚡ Kata ini ada di variabel lain' : ''}
                                                                className={`text-xs px-1.5 py-0.5 rounded font-mono ${
                                                                    isConflict
                                                                        ? 'bg-yellow-100 text-yellow-800 border border-yellow-400 font-semibold'
                                                                        : 'bg-gray-100 text-gray-600'
                                                                }`}
                                                            >
                                                                {isConflict && '⚡ '}{w}
                                                            </span>
                                                        );
                                                    })}
                                                    {!isExpanded && words.length > 6 && (
                                                        <button
                                                            onClick={() => setExpandedId(item.id)}
                                                            className="text-xs text-blue-500 hover:underline px-1"
                                                        >
                                                            +{words.length - 6} lainnya
                                                        </button>
                                                    )}
                                                    {isExpanded && words.length > 6 && (
                                                        <button
                                                            onClick={() => setExpandedId(null)}
                                                            className="text-xs text-blue-500 hover:underline px-1"
                                                        >
                                                            Sembunyikan
                                                        </button>
                                                    )}
                                                </div>
                                                <ConflictBadge conflicts={item.conflicts} />
                                            </td>
                                            {/* Negation */}
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                {item.negatable ? (
                                                    <div className="space-y-1">
                                                        <span className="inline-flex items-center gap-1 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                                                            🔄 Aktif
                                                        </span>
                                                        {item.counterpart_kode && (
                                                            <p className="text-xs text-gray-500">
                                                                → <span className="font-mono font-semibold text-green-700">{item.counterpart_kode}</span>
                                                            </p>
                                                        )}
                                                    </div>
                                                ) : item.has_conflicts ? (
                                                    <span className="inline-flex items-center gap-1 text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 px-2 py-0.5 rounded-full">
                                                        ⚠️ Perlu setup
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-gray-400">—</span>
                                                )}
                                            </td>
                                            {/* Aksi */}
                                            <td className="px-4 py-3 whitespace-nowrap text-right space-x-2">
                                                <button
                                                    onClick={() => openEditModal(item)}
                                                    className="text-sm text-blue-600 hover:text-blue-900 font-medium"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="text-sm text-red-500 hover:text-red-800"
                                                >
                                                    Hapus
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* ════════════════════ MODAL FORM ════════════════════ */}
            <Modal show={showModal} onClose={() => setShowModal(false)} maxWidth="2xl">
                <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[90vh] overflow-y-auto">
                    <h2 className="text-lg font-bold text-gray-900">
                        {editMode ? `✏️ Edit: ${selectedItem?.kode}` : '➕ Tambah Variabel Pelanggaran'}
                    </h2>

                    {/* Grid 2 kolom: Kode + Poin */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <InputLabel htmlFor="kode" value="Kode *" />
                            <TextInput
                                id="kode"
                                value={formData.kode}
                                onChange={(e) => setData('kode', e.target.value.toUpperCase())}
                                className="mt-1 block w-full font-mono"
                                placeholder="P001"
                                disabled={editMode}
                                required
                            />
                            <InputError message={errors.kode} className="mt-1" />
                        </div>
                        <div>
                            <InputLabel htmlFor="poin" value="Poin Pengurangan *" />
                            <TextInput
                                id="poin"
                                type="number"
                                value={formData.poin}
                                onChange={(e) => setData('poin', e.target.value)}
                                className="mt-1 block w-full"
                                placeholder="10"
                                min={1}
                                required
                            />
                            <InputError message={errors.poin} className="mt-1" />
                        </div>
                    </div>

                    {/* Kategori */}
                    <div>
                        <InputLabel htmlFor="kategori" value="Kategori *" />
                        <TextInput
                            id="kategori"
                            value={formData.kategori}
                            onChange={(e) => setData('kategori', e.target.value)}
                            className="mt-1 block w-full"
                            placeholder="Perundungan Fisik"
                            required
                        />
                        <InputError message={errors.kategori} className="mt-1" />
                    </div>

                    {/* Tindakan */}
                    <div>
                        <InputLabel htmlFor="tindakan" value="Tindakan BK *" />
                        <textarea
                            id="tindakan"
                            value={formData.tindakan}
                            onChange={(e) => setData('tindakan', e.target.value)}
                            rows={2}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Panggil orang tua, beri peringatan tertulis..."
                            required
                        />
                        <InputError message={errors.tindakan} className="mt-1" />
                    </div>

                    {/* Kamus Kata — dengan deteksi konflik real-time */}
                    <div>
                        <InputLabel value="Kamus Kata *" />
                        <p className="text-xs text-gray-500 mb-1">
                            Kata-kata yang jika muncul di laporan, akan dicocokkan ke variabel ini.
                        </p>
                        <KamusKataInput
                            value={formData.kamus_kata}
                            onChange={(v) => setData('kamus_kata', v)}
                            excludeKode={editMode ? selectedItem?.kode : null}
                            conflictRoute={conflictCheckRoute}
                        />
                        <InputError message={errors.kamus_kata} className="mt-1" />
                    </div>

                    {/* Negation Setup */}
                    <NegationSetupPanel
                        formData={formData}
                        setData={setData}
                        availableCounterparts={availableCounterparts}
                        mode={editMode ? 'edit' : 'create'}
                    />

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                        <SecondaryButton type="button" onClick={() => setShowModal(false)}>
                            Batal
                        </SecondaryButton>
                        <PrimaryButton disabled={processing}>
                            {processing ? 'Menyimpan…' : editMode ? 'Perbarui' : 'Simpan'}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>
        </AppLayout>
    );
}