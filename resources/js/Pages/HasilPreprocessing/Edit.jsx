import { useState, useMemo } from 'react';
import GuruBkLayout from '@/Layouts/GuruBk/GuruBkLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';

//  Badge kode 
function KodeBadge({ kode, removable, onRemove }) {
    const prefix = kode?.charAt(0) ?? '';
    const colors = {
        P: 'bg-red-100 text-red-800 border-red-300',
        A: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        G: 'bg-blue-100 text-blue-800 border-blue-300',
        K: 'bg-orange-100 text-orange-800 border-orange-300',
        D: 'bg-purple-100 text-purple-800 border-purple-300',
        R: 'bg-teal-100 text-teal-800 border-teal-300',
    };
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-mono font-bold border rounded-md ${colors[prefix] ?? 'bg-gray-100 text-gray-700'}`}>
            {kode}
            {removable && (
                <button type="button" onClick={() => onRemove(kode)} className="ml-1 text-current opacity-60 hover:opacity-100 font-bold">
                    
                </button>
            )}
        </span>
    );
}

//  Panel Transparansi Preprocessing 
function PreprocessingInfoPanel({ preprocessingData, negationLog }) {
    const [open, setOpen] = useState(false);
    if (!preprocessingData) return null;

    return (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition text-sm font-medium text-gray-700"
            >
                <span className="flex items-center gap-2">
                     <span>Detail Proses Preprocessing</span>
                    {negationLog?.length > 0 && (
                        <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full font-normal">
                            {negationLog.length} negation terdeteksi
                        </span>
                    )}
                </span>
                <span className="text-gray-400">{open ? '' : ''}</span>
            </button>

            {open && (
                <div className="p-4 space-y-4 bg-white text-xs">
                    {/* Pipeline steps */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {[
                            { label: '1. Teks Asli',      value: preprocessingData.original,             color: 'border-gray-300 bg-gray-50' },
                            { label: '2. Case Folding',   value: preprocessingData.case_folding,          color: 'border-blue-200 bg-blue-50' },
                            { label: '3. Tokens',         value: preprocessingData.tokens?.join(', '),    color: 'border-yellow-200 bg-yellow-50' },
                            { label: '4. No Stopwords',   value: preprocessingData.no_stopwords?.join(', '), color: 'border-orange-200 bg-orange-50' },
                            { label: '5. Stemmed',        value: preprocessingData.stemmed?.join(', '),   color: 'border-green-200 bg-green-50' },
                        ].map(({ label, value, color }) => (
                            <div key={label} className={`border rounded-lg p-2 ${color}`}>
                                <p className="font-semibold text-gray-600 mb-1">{label}</p>
                                <p className="font-mono text-gray-800 break-words">{value || '-'}</p>
                            </div>
                        ))}
                    </div>

                    {/* Negation Log */}
                    {negationLog?.length > 0 && (
                        <div className="border border-blue-200 rounded-lg p-3 bg-blue-50">
                            <p className="font-semibold text-blue-800 mb-2"> Log Negation yang Terdeteksi:</p>
                            <div className="space-y-2">
                                {negationLog.map((n, i) => (
                                    <div key={i} className="bg-white border border-blue-100 rounded p-2 text-xs">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-mono bg-gray-100 px-1 rounded">"{n.original_kata}"</span>
                                            <span className="text-gray-500">di</span>
                                            <span className="font-mono bg-red-50 border border-red-200 px-1 rounded text-red-700">{n.original_kode}</span>
                                            <span className="text-gray-400">+</span>
                                            <span className="font-mono bg-yellow-50 border border-yellow-200 px-1 rounded text-yellow-700">"{n.negation_word}"</span>
                                            <span className="text-gray-400"> flip ke</span>
                                            <span className="font-mono bg-green-50 border border-green-200 px-1 rounded text-green-700">{n.flipped_kode}</span>
                                        </div>
                                        <p className="text-gray-500 mt-1">
                                            Confidence: {(n.match_confidence * 100).toFixed(0)}% | Neg confidence: {(n.negation_confidence * 100).toFixed(0)}%
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

//  Panel Learning System 
function LearningPanel({ originalKode, currentKode, teksLaporan, variabelList }) {
    const addedKodes   = useMemo(() => currentKode.filter(k => !originalKode.includes(k)), [currentKode, originalKode]);
    const removedKodes = useMemo(() => originalKode.filter(k => !currentKode.includes(k)), [currentKode, originalKode]);

    const hasChanges  = addedKodes.length > 0 || removedKodes.length > 0;
    const learnableAdded = addedKodes.filter(k => k.startsWith('P') || k.startsWith('A'));

    // Simulasikan keyword yang akan diekstrak (untuk preview saja)
    const previewKeywords = useMemo(() => {
        if (!teksLaporan) return [];
        const skipWords = new Set([
            'saya','aku','kamu','anda','dia','mereka','kami','kita','yang','dan','atau',
            'ada','itu','ini','di','ke','dari','untuk','pada','dengan','oleh','sangat',
            'sekali','lebih','kurang','sering','selalu','sudah','telah','akan','sedang',
            'masih','belum','karena','jadi','maka','lalu','kemudian','tapi','tetapi',
            'namun','bahwa','melihat','lihat','melapor','lapor','datang','pergi','pulang',
            'masuk','keluar','kelas','sekolah','ruang','pagi','siang','sore','malam',
            'hari','minggu','bulan','tahun','kemarin','besok','nanti','sekarang','tadi',
        ]);
        return teksLaporan.toLowerCase()
            .replace(/[^a-z\s]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length >= 4 && !skipWords.has(w))
            .filter((w, i, arr) => arr.indexOf(w) === i)
            .slice(0, 12);
    }, [teksLaporan]);

    const getVariabelLabel = (kode) => {
        const allV = [
            ...(variabelList?.pelanggaran ?? []),
            ...(variabelList?.apresiasi ?? []),
            ...(variabelList?.konselor ?? []),
        ];
        return allV.find(v => v.kode === kode)?.label ?? kode;
    };

    if (!hasChanges) {
        return (
            <div className="border border-dashed border-gray-300 rounded-xl p-5 bg-gray-50 text-center">
                <p className="text-sm text-gray-400">
                     <strong>Panel Learning System</strong> - Belum ada perubahan kode.
                </p>
                <p className="text-xs text-gray-400 mt-1">
                    Ubah kode matched di atas, panel ini akan menampilkan preview apa yang akan dipelajari sistem.
                </p>
            </div>
        );
    }

    return (
        <div className="border-2 border-indigo-300 rounded-xl overflow-hidden bg-gradient-to-b from-indigo-50 to-white">
            {/* Header */}
            <div className="bg-indigo-600 px-4 py-3 flex items-center gap-2">
                <span className="text-white text-base"></span>
                <div>
                    <p className="text-white font-semibold text-sm">Learning System - Preview Pembelajaran</p>
                    <p className="text-indigo-200 text-xs">Sistem akan belajar dari koreksi ini setelah Anda menyimpan</p>
                </div>
            </div>

            <div className="p-4 space-y-4">

                {/* Perubahan kode */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {addedKodes.length > 0 && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <p className="text-xs font-semibold text-green-800 mb-2"> Kode DITAMBAHKAN (akan dipelajari):</p>
                            <div className="flex flex-wrap gap-1">
                                {addedKodes.map(k => (
                                    <div key={k} className="space-y-0.5">
                                        <KodeBadge kode={k} />
                                        {(k.startsWith('P') || k.startsWith('A')) ? (
                                            <p className="text-xs text-green-600 pl-1"> Akan dipelajari</p>
                                        ) : (
                                            <p className="text-xs text-gray-400 pl-1"> G-code, skip</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {removedKodes.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-xs font-semibold text-red-800 mb-2"> Kode DIHAPUS (tidak dipelajari):</p>
                            <div className="flex flex-wrap gap-1">
                                {removedKodes.map(k => <KodeBadge key={k} kode={k} />)}
                            </div>
                            <p className="text-xs text-red-600 mt-2">Kode yang dihapus tidak mengubah kamus. Sistem hanya belajar dari kode yang ditambah.</p>
                        </div>
                    )}
                </div>

                {/* Preview keyword yang akan diekstrak */}
                {learnableAdded.length > 0 && (
                    <div className="bg-white border border-indigo-200 rounded-lg p-3">
                        <p className="text-xs font-semibold text-indigo-800 mb-2">
                             Estimasi Keyword yang Akan Diekstrak dari Teks:
                        </p>
                        <p className="text-xs text-gray-500 mb-2">
                            Sistem akan mengambil kata dari teks laporan, menyaring nama santri dan kata umum. Hasil akhir bergantung pada kamus nama santri di database.
                        </p>
                        {previewKeywords.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                                {previewKeywords.map((w, i) => (
                                    <span key={i} className="px-2 py-0.5 text-xs font-mono bg-indigo-50 border border-indigo-200 text-indigo-700 rounded">
                                        {w}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-gray-400 italic">Tidak ada keyword yang terdeteksi dari teks.</p>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                             Ini adalah estimasi di frontend. Filter nama santri dari database dilakukan di server saat menyimpan.
                        </p>
                    </div>
                )}

                {/* Kode yang akan menerima keyword baru */}
                {learnableAdded.length > 0 && previewKeywords.length > 0 && (
                    <div className="bg-white border border-green-200 rounded-lg p-3">
                        <p className="text-xs font-semibold text-green-800 mb-2"> Keyword Akan Ditambahkan ke Kamus Mana:</p>
                        <div className="space-y-2">
                            {learnableAdded.map(kode => (
                                <div key={kode} className="flex items-center gap-2 text-xs">
                                    <KodeBadge kode={kode} />
                                    <span className="text-gray-500"></span>
                                    <span className="text-gray-700">{getVariabelLabel(kode)}</span>
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            Keyword yang sudah ada di kamus yang bersangkutan tidak akan ditambahkan lagi (no duplicate).
                        </p>
                    </div>
                )}

                {/* Info G-code */}
                {addedKodes.some(k => k.startsWith('G')) && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <p className="text-xs text-gray-600">
                            <strong> Mengapa kode G (Konselor) tidak dipelajari otomatis?</strong><br />
                            Kode G berhubungan dengan kondisi mental (cemas, depresi, dll) yang sangat kontekstual.
                            Kata yang sama bisa bermakna kondisi mental atau bukan, tergantung siapa yang menulisnya.
                            Mempelajarinya otomatis berisiko false positive yang tinggi.
                        </p>
                    </div>
                )}

                {/* Tombol konfirmasi */}
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                    <p className="text-xs text-indigo-800">
                        <strong> Cara kerja:</strong> Setelah Anda klik <em>"Simpan Koreksi"</em>, sistem akan:
                    </p>
                    <ol className="text-xs text-indigo-700 mt-1 ml-4 list-decimal space-y-0.5">
                        <li>Menyimpan perubahan kode matched</li>
                        <li>Mengekstrak keyword dari teks (dengan filter nama dari DB)</li>
                        <li>Menambahkan keyword baru ke kamus variabel P/A yang sesuai</li>
                        <li>Mencatat perubahan di log untuk keperluan rollback</li>
                    </ol>
                </div>
            </div>
        </div>
    );
}

// 
// MAIN: Edit Hasil Preprocessing
// 
export default function HasilPreprocessingEdit({ auth, hasil, santriList, variabelList }) {
    const [originalKode] = useState(hasil.kode_matched ?? []);

    const { data, setData, put, processing, errors } = useForm({
        kode_matched      : hasil.kode_matched ?? [],
        pelaku_santri_id  : hasil.pelaku_santri_id ?? '',
        korban_santri_id  : hasil.korban_santri_id ?? '',
        kata_kerja_dasar  : hasil.kata_kerja_dasar ?? '',
        correction_notes  : hasil.correction_notes ?? '',
    });

    const allVariabel = useMemo(() => [
        ...(variabelList?.pelanggaran ?? []).map(v => ({ ...v, tipe: 'P' })),
        ...(variabelList?.apresiasi   ?? []).map(v => ({ ...v, tipe: 'A' })),
        ...(variabelList?.konselor    ?? []).map(v => ({ ...v, tipe: 'G' })),
    ], [variabelList]);

    const [searchKode, setSearchKode] = useState('');
    const [filterTipe, setFilterTipe] = useState('all');

    const filteredVariabel = useMemo(() => allVariabel.filter(v => {
        const matchSearch = !searchKode || v.kode.toLowerCase().includes(searchKode.toLowerCase()) || v.label.toLowerCase().includes(searchKode.toLowerCase());
        const matchTipe   = filterTipe === 'all' || v.tipe === filterTipe;
        return matchSearch && matchTipe;
    }), [allVariabel, searchKode, filterTipe]);

    const toggleKode = (kode) => {
        const current = [...data.kode_matched];
        const idx = current.indexOf(kode);
        if (idx > -1) current.splice(idx, 1);
        else current.push(kode);
        setData('kode_matched', current);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('hasil-preprocessing.update', hasil.id));
    };

    const tipeColor = { P: 'border-red-200 bg-red-50 hover:bg-red-100', A: 'border-green-200 bg-green-50 hover:bg-green-100', G: 'border-purple-200 bg-purple-50 hover:bg-purple-100' };
    const tipeSelected = { P: 'border-red-500 bg-red-100 ring-2 ring-red-300', A: 'border-green-500 bg-green-100 ring-2 ring-green-300', G: 'border-purple-500 bg-purple-100 ring-2 ring-purple-300' };

    return (
        <GuruBkLayout user={auth.user} header={`Koreksi Preprocessing #${hasil.id}`}>
            <Head title="Koreksi Hasil Preprocessing" />

            <div className="py-8">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                            {/*  KOLOM KIRI: Konteks Laporan  */}
                            <div className="lg:col-span-1 space-y-5">

                                {/* Teks Laporan */}
                                <div className="bg-white rounded-xl border border-gray-200 p-4">
                                    <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                         Teks Laporan Asli
                                    </h3>
                                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                        <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                                            {hasil.laporan_awal?.text_laporan ?? '-'}
                                        </p>
                                    </div>
                                    <div className="mt-2 text-xs text-gray-400">
                                        Jenis: <span className="font-medium text-gray-600">{hasil.laporan_awal?.jenis_laporan ?? '-'}</span>
                                    </div>
                                    {/* Format laporan ringkas dari NER v4 */}
                                    {hasil.format_laporan && (
                                        <div className="mt-2 px-3 py-2 bg-violet-50 border border-violet-200 rounded-lg">
                                            <p className="text-xs text-violet-600 font-medium mb-0.5">Format Laporan (NER v4):</p>
                                            <p className="text-sm text-violet-900 font-semibold italic">{hasil.format_laporan}</p>
                                            {hasil.verb_info?.tipe && (
                                                <p className="text-xs text-violet-500 mt-1">
                                                    Verb: <span className="font-mono">{hasil.verb_info.kata}</span>
                                                    {' '}({hasil.verb_info.tipe})
                                                    {hasil.verb_info.awalan ? ` - awalan: ${hasil.verb_info.awalan}-` : ''}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Pelaku */}
                                <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                                    <h3 className="text-sm font-semibold text-gray-800"> Identifikasi Pelaku & Korban</h3>

                                    <div>
                                        <InputLabel htmlFor="pelaku_santri_id" value="Pelaku (Santri)" className="text-xs" />
                                        <select
                                            id="pelaku_santri_id"
                                            value={data.pelaku_santri_id}
                                            onChange={(e) => setData('pelaku_santri_id', e.target.value)}
                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                        >
                                            <option value="">- Tidak teridentifikasi -</option>
                                            {santriList.map(s => (
                                                <option key={s.id} value={s.id}>{s.label}</option>
                                            ))}
                                        </select>
                                        <InputError message={errors.pelaku_santri_id} className="mt-1" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="korban_santri_id" value="Korban (Santri)" className="text-xs" />
                                        <select
                                            id="korban_santri_id"
                                            value={data.korban_santri_id}
                                            onChange={(e) => setData('korban_santri_id', e.target.value)}
                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                        >
                                            <option value="">- Tidak ada korban -</option>
                                            {santriList.map(s => (
                                                <option key={s.id} value={s.id}>{s.label}</option>
                                            ))}
                                        </select>
                                        <InputError message={errors.korban_santri_id} className="mt-1" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="kata_kerja_dasar" value="Kata Kerja Dasar (NER)" className="text-xs" />
                                        <input
                                            id="kata_kerja_dasar"
                                            type="text"
                                            value={data.kata_kerja_dasar}
                                            onChange={(e) => setData('kata_kerja_dasar', e.target.value)}
                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                            placeholder="pukul, tendang, bolos..."
                                        />
                                        {hasil.verb_info?.kata && hasil.verb_info.kata !== data.kata_kerja_dasar && (
                                            <p className="text-xs text-violet-600 mt-1">
                                                Terdeteksi otomatis: <span className="font-mono font-bold">{hasil.verb_info.kata}</span>
                                                {' '}({hasil.verb_info.tipe})
                                            </p>
                                        )}
                                    </div>

                                    {/* Info Kelas Santri Terdeteksi */}
                                    {(hasil.pelaku_santri?.kelas_kode || hasil.korban_santri?.kelas_kode) && (
                                        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-xs">
                                            <p className="font-semibold text-indigo-800 mb-1.5">Info Kelas (terdeteksi otomatis)</p>
                                            <div className="space-y-1">
                                                {hasil.pelaku_santri?.kelas_kode && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-red-600 font-medium">Pelaku:</span>
                                                        <span className="font-semibold text-gray-800">{hasil.pelaku_nama}</span>
                                                        <span className="px-1.5 py-0.5 bg-indigo-200 text-indigo-800 rounded font-mono">
                                                            Kelas {hasil.pelaku_santri.kelas_kode}
                                                        </span>
                                                    </div>
                                                )}
                                                {hasil.korban_santri?.kelas_kode && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-blue-600 font-medium">Korban:</span>
                                                        <span className="font-semibold text-gray-800">{hasil.korban_nama}</span>
                                                        <span className="px-1.5 py-0.5 bg-indigo-200 text-indigo-800 rounded font-mono">
                                                            Kelas {hasil.korban_santri.kelas_kode}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Catatan Koreksi */}
                                <div className="bg-white rounded-xl border border-gray-200 p-4">
                                    <InputLabel htmlFor="correction_notes" value="Catatan Koreksi" className="text-sm font-semibold" />
                                    <textarea
                                        id="correction_notes"
                                        value={data.correction_notes}
                                        onChange={(e) => setData('correction_notes', e.target.value)}
                                        rows={3}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="Alasan koreksi ini..."
                                    />
                                </div>

                                {/* Info Preprocessing */}
                                <PreprocessingInfoPanel
                                    preprocessingData={hasil.preprocessing_data}
                                    negationLog={hasil.negation_log}
                                />
                            </div>

                            {/*  KOLOM KANAN: Kode Matched + Learning  */}
                            <div className="lg:col-span-2 space-y-5">

                                {/* Kode yang saat ini terpilih */}
                                <div className="bg-white rounded-xl border border-gray-200 p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-sm font-semibold text-gray-800">Kode Matched</h3>
                                        <span className="text-xs text-gray-400">
                                            {data.kode_matched.length} kode dipilih
                                        </span>
                                    </div>
                                    {/* Distribusi kode dari preprocessing v4 */}
                                    {(hasil.pelaku_kode?.length > 0 || hasil.korban_kode?.length > 0) && (
                                        <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                                            {hasil.pelaku_kode?.length > 0 && (
                                                <div className="bg-red-50 border border-red-100 rounded-lg p-2">
                                                    <p className="font-semibold text-red-700 mb-1">Kode Pelaku</p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {hasil.pelaku_kode.map(k => <KodeBadge key={k} kode={k} />)}
                                                    </div>
                                                </div>
                                            )}
                                            {hasil.korban_kode?.length > 0 && (
                                                <div className="bg-blue-50 border border-blue-100 rounded-lg p-2">
                                                    <p className="font-semibold text-blue-700 mb-1">Kode Korban</p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {hasil.korban_kode.map(k => <KodeBadge key={k} kode={k} />)}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Kode terpilih */}
                                    <div className="min-h-12 p-3 bg-gray-50 border border-gray-200 rounded-lg mb-3">
                                        {data.kode_matched.length === 0 ? (
                                            <p className="text-xs text-gray-400 italic">Belum ada kode dipilih. Pilih dari daftar di bawah.</p>
                                        ) : (
                                            <div className="flex flex-wrap gap-2">
                                                {data.kode_matched.map(k => (
                                                    <KodeBadge key={k} kode={k} removable onRemove={toggleKode} />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <InputError message={errors.kode_matched} />

                                    {/* Filter & Search */}
                                    <div className="flex gap-2 mb-3">
                                        <input
                                            type="text"
                                            value={searchKode}
                                            onChange={(e) => setSearchKode(e.target.value)}
                                            placeholder="Cari kode atau nama..."
                                            className="flex-1 border-gray-300 rounded-md shadow-sm text-xs focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                        {[
                                            {t:'all',label:'Semua'},
                                            {t:'P',  label:'P Pelanggaran'},
                                            {t:'A',  label:'A Apresiasi'},
                                            {t:'G',  label:'G Gejala'},
                                            {t:'K',  label:'K Konsekuensi'},
                                            {t:'R',  label:'R Reward'},
                                        ].map(({t,label}) => (
                                            <button
                                                key={t}
                                                type="button"
                                                onClick={() => setFilterTipe(t)}
                                                className={`px-2.5 py-1.5 text-xs rounded-md font-medium transition ${filterTipe === t ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Grid pilihan kode */}
                                    <div className="max-h-72 overflow-y-auto border border-gray-200 rounded-lg p-2">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                            {filteredVariabel.map(v => {
                                                const isSelected = data.kode_matched.includes(v.kode);
                                                const isOriginal = originalKode.includes(v.kode);
                                                return (
                                                    <label
                                                        key={v.kode}
                                                        className={`flex items-start gap-2 p-2 border rounded-lg cursor-pointer transition text-xs ${
                                                            isSelected
                                                                ? tipeSelected[v.tipe] ?? 'border-indigo-400 bg-indigo-50'
                                                                : `${tipeColor[v.tipe] ?? 'border-gray-200 bg-gray-50'}`
                                                        }`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => toggleKode(v.kode)}
                                                            className="mt-0.5 rounded border-gray-300 focus:ring-indigo-500"
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                                <span className="font-mono font-bold text-xs">
                                                                    {v.kode}
                                                                </span>
                                                                {isOriginal && !isSelected && (
                                                                    <span className="px-1 py-0.5 text-xs bg-gray-200 text-gray-600 rounded">sebelumnya</span>
                                                                )}
                                                                {!isOriginal && isSelected && (
                                                                    <span className="px-1 py-0.5 text-xs bg-indigo-200 text-indigo-700 rounded"> baru</span>
                                                                )}
                                                            </div>
                                                            <p className="text-gray-600 truncate mt-0.5">{v.label.split(' - ')[1] ?? v.label}</p>
                                                        </div>
                                                    </label>
                                                );
                                            })}
                                            {filteredVariabel.length === 0 && (
                                                <p className="col-span-2 text-center text-xs text-gray-400 py-4">Tidak ada variabel yang cocok.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/*  LEARNING SYSTEM PANEL  */}
                                <LearningPanel
                                    originalKode={originalKode}
                                    currentKode={data.kode_matched}
                                    teksLaporan={hasil.laporan_awal?.text_laporan ?? ''}
                                    variabelList={variabelList}
                                />

                                {/* Action Buttons */}
                                <div className="flex justify-end gap-3">
                                    <Link href={route('hasil-preprocessing.index')}>
                                        <SecondaryButton type="button">Batal</SecondaryButton>
                                    </Link>
                                    <PrimaryButton disabled={processing}>
                                        {processing ? ' Menyimpan & Belajar' : ' Simpan Koreksi'}
                                    </PrimaryButton>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </GuruBkLayout>
    );
}