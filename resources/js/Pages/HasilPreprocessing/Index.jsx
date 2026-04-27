import { useState, useEffect } from 'react';
import GuruBkLayout from '@/Layouts/GuruBk/GuruBkLayout';
import { Head, router, usePage } from '@inertiajs/react';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Modal from '@/Components/Modal';
import LearningNotification from '@/Components/LearningNotification';

// ---- Helpers -----------------------------------------------------------
const statusCls = {
    pending_validasi: 'bg-amber-100 text-amber-800',
    approved:         'bg-emerald-100 text-emerald-800',
    rejected:         'bg-red-100 text-red-800',
    failed:           'bg-gray-100 text-gray-800',
};
const statusLabel = {
    pending_validasi: 'Pending Validasi',
    approved:         'Disetujui',
    rejected:         'Ditolak',
    failed:           'Gagal',
};

function StatusBadge({ status }) {
    return (
        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${statusCls[status] ?? 'bg-gray-100 text-gray-700'}`}>
            {statusLabel[status] ?? status}
        </span>
    );
}

// Kode badge dengan warna sesuai prefix
function KodeBadge({ kode }) {
    const prefix = kode?.[0] ?? '';
    const cls =
        prefix === 'P' ? 'bg-red-100 text-red-800' :
        prefix === 'A' ? 'bg-emerald-100 text-emerald-800' :
        prefix === 'G' ? 'bg-blue-100 text-blue-800' :
        prefix === 'K' ? 'bg-orange-100 text-orange-800' :
        prefix === 'D' ? 'bg-purple-100 text-purple-800' :
        prefix === 'R' ? 'bg-teal-100 text-teal-800' :
        'bg-gray-100 text-gray-700';
    return (
        <span className={`inline-block px-2 py-0.5 text-xs font-mono font-semibold rounded mr-1 mb-0.5 ${cls}`}>
            {kode}
        </span>
    );
}

// Info santri dengan kelas
function SantriInfo({ nama, santriId, santriDetail }) {
    if (!nama) return <span className="text-xs text-gray-400 italic">Tidak terdeteksi</span>;
    return (
        <div>
            <p className="text-sm font-medium text-gray-900">{nama}</p>
            {santriDetail?.kelas_kode && (
                <p className="text-xs text-indigo-600 font-medium">
                    Kelas {santriDetail.kelas_kode}
                </p>
            )}
            {santriId ? (
                <p className="text-xs text-gray-400">ID: {santriId}</p>
            ) : (
                <p className="text-xs text-amber-600">Tidak ditemukan di DB</p>
            )}
        </div>
    );
}

export default function HasilPreprocessingIndex({ auth, hasilList, filters }) {
    const { flash } = usePage().props;

    const [showLearningNotif, setShowLearningNotif] = useState(false);
    const [learningResult,    setLearningResult]    = useState(null);
    const [showDetailModal,   setShowDetailModal]   = useState(false);
    const [selectedHasil,     setSelectedHasil]     = useState(null);
    const [filterStatus,      setFilterStatus]      = useState(filters?.status || 'all');
    const [search,            setSearch]            = useState(filters?.search || '');

    useEffect(() => {
        if (flash?.learning_result) {
            setLearningResult(flash.learning_result);
            setShowLearningNotif(true);
        }
    }, [flash]);

    const results = Array.isArray(hasilList?.data) ? hasilList.data : [];
    const links   = Array.isArray(hasilList?.links) ? hasilList.links : [];
    const from    = hasilList?.from ?? 0;
    const to      = hasilList?.to   ?? 0;
    const total   = hasilList?.total ?? 0;

    // ---- Kata kerja dari kode matched (multi-verb support) --------------
    // Daftar mapping prefix -> label tipe untuk tooltip
    const getKodeLabel = (kode) => {
        if (!kode) return '';
        const p = kode[0];
        return p === 'P' ? 'Pelanggaran' :
               p === 'A' ? 'Apresiasi' :
               p === 'G' ? 'Gejala' :
               p === 'K' ? 'Konsekuensi' :
               p === 'D' ? 'Diagnosis' :
               p === 'R' ? 'Reward' : '';
    };

    // Ambil semua kata kerja dari verb_info atau kata_kerja_dasar
    const getKataKerjaDisplay = (hasil) => {
        // Jika ada verb_info dari preprocessing v4
        const vi = hasil.verb_info;
        if (vi?.kata) {
            return vi.kata;
        }
        // Fallback ke kata_kerja_dasar
        return hasil.kata_kerja_dasar ?? null;
    };

    // ---- Handlers -------------------------------------------------------
    const handleFilter = () =>
        router.get(route('hasil-preprocessing.index'),
            { status: filterStatus, search },
            { preserveState: true, preserveScroll: true });

    const handleResetFilter = () => {
        setFilterStatus('all');
        setSearch('');
        router.get(route('hasil-preprocessing.index'), { status: 'all' });
    };

    const handleEdit    = (id) => router.get(route('hasil-preprocessing.edit', id));
    const handleApprove = (id) => {
        if (!confirm('Approve hasil preprocessing ini?')) return;
        router.post(route('hasil-preprocessing.approve', id), {}, {
            preserveScroll: true,
        });
    };
    const handleReject = (id) => {
        const reason = prompt('Alasan penolakan:');
        if (!reason) return;
        router.post(route('hasil-preprocessing.reject', id), { reason }, {
            preserveScroll: true,
        });
    };

    // ---- Render ---------------------------------------------------------
    return (
        <GuruBkLayout user={auth.user} header="Hasil Preprocessing">
            <Head title="Hasil Preprocessing" />

            <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-4">

                {showLearningNotif && learningResult && (
                    <LearningNotification
                        learningResult={learningResult}
                        onDismiss={() => setShowLearningNotif(false)}
                    />
                )}

                {/* Filter Bar */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="flex flex-wrap gap-3 items-end">
                        <div className="min-w-[150px]">
                            <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                            <select
                                value={filterStatus}
                                onChange={e => setFilterStatus(e.target.value)}
                                className="w-full text-sm border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option value="all">Semua Status</option>
                                <option value="pending_validasi">Pending Validasi</option>
                                <option value="approved">Disetujui</option>
                                <option value="rejected">Ditolak</option>
                                <option value="failed">Gagal</option>
                            </select>
                        </div>
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-xs font-medium text-gray-600 mb-1">Cari</label>
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleFilter()}
                                placeholder="Pelaku, korban, kode..."
                                className="w-full text-sm border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        <div className="flex gap-2">
                            <PrimaryButton onClick={handleFilter}>Filter</PrimaryButton>
                            <SecondaryButton onClick={handleResetFilter}>Reset</SecondaryButton>
                        </div>
                    </div>
                </div>

                {/* Tabel */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100 text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    {['#', 'Laporan', 'Kode Matched', 'Pelaku', 'Korban', 'Kata Kerja', 'Format', 'Status', 'Aksi'].map(h => (
                                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {results.length > 0 ? results.map(hasil => {
                                    const kataKerja = getKataKerjaDisplay(hasil);
                                    return (
                                        <tr key={hasil.id} className="hover:bg-gray-50/60 transition-colors">

                                            {/* # */}
                                            <td className="px-4 py-3 whitespace-nowrap font-mono text-xs text-gray-400">
                                                #{hasil.id}
                                            </td>

                                            {/* Laporan */}
                                            <td className="px-4 py-3">
                                                <div className="max-w-[180px]">
                                                    <p className="text-xs font-semibold text-gray-600">
                                                        #{hasil.laporan_awal_id}
                                                    </p>
                                                    <p className="text-xs text-gray-400 truncate">
                                                        {hasil.laporan_awal?.text_laporan?.substring(0, 55) ?? ''}...
                                                    </p>
                                                </div>
                                            </td>

                                            {/* Kode Matched */}
                                            <td className="px-4 py-3">
                                                <div className="flex flex-wrap max-w-[160px]">
                                                    {hasil.kode_matched?.length > 0
                                                        ? hasil.kode_matched.map(k => <KodeBadge key={k} kode={k} />)
                                                        : <span className="text-xs text-gray-400 italic">-</span>
                                                    }
                                                </div>
                                            </td>

                                            {/* Pelaku */}
                                            <td className="px-4 py-3">
                                                <SantriInfo
                                                    nama={hasil.pelaku_nama}
                                                    santriId={hasil.pelaku_santri_id}
                                                    santriDetail={hasil.pelaku_santri}
                                                />
                                            </td>

                                            {/* Korban */}
                                            <td className="px-4 py-3">
                                                <SantriInfo
                                                    nama={hasil.korban_nama}
                                                    santriId={hasil.korban_santri_id}
                                                    santriDetail={hasil.korban_santri}
                                                />
                                            </td>

                                            {/* Kata Kerja */}
                                            <td className="px-4 py-3">
                                                {kataKerja ? (
                                                    <div>
                                                        <span className="inline-block px-2 py-1 bg-violet-100 text-violet-800 text-xs font-mono rounded">
                                                            {kataKerja}
                                                        </span>
                                                        {hasil.verb_info?.tipe && (
                                                            <p className="text-xs text-gray-400 mt-0.5">
                                                                {hasil.verb_info.tipe}
                                                            </p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400">-</span>
                                                )}
                                            </td>

                                            {/* Format Laporan */}
                                            <td className="px-4 py-3 max-w-[160px]">
                                                {hasil.format_laporan ? (
                                                    <p className="text-xs text-gray-700 font-medium italic truncate" title={hasil.format_laporan}>
                                                        {hasil.format_laporan}
                                                    </p>
                                                ) : (
                                                    <span className="text-xs text-gray-400">-</span>
                                                )}
                                            </td>

                                            {/* Status */}
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <StatusBadge status={hasil.status} />
                                                {hasil.is_corrected && (
                                                    <p className="text-xs text-amber-600 mt-0.5">Dikoreksi</p>
                                                )}
                                            </td>

                                            {/* Aksi */}
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="flex gap-2 flex-wrap">
                                                    <button
                                                        onClick={() => { setSelectedHasil(hasil); setShowDetailModal(true); }}
                                                        className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
                                                    >
                                                        Detail
                                                    </button>
                                                    {hasil.status === 'pending_validasi' && (
                                                        <>
                                                            <button onClick={() => handleEdit(hasil.id)}
                                                                className="text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline">
                                                                Edit
                                                            </button>
                                                            <button onClick={() => handleApprove(hasil.id)}
                                                                className="text-xs font-medium text-emerald-600 hover:text-emerald-800 hover:underline">
                                                                Approve
                                                            </button>
                                                            <button onClick={() => handleReject(hasil.id)}
                                                                className="text-xs font-medium text-red-600 hover:text-red-800 hover:underline">
                                                                Reject
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                }) : (
                                    <tr>
                                        <td colSpan="9" className="py-16 text-center">
                                            <div className="flex flex-col items-center gap-2 text-gray-400">
                                                <svg className="h-10 w-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                <p className="text-sm font-medium">Tidak ada hasil preprocessing</p>
                                                <p className="text-xs">
                                                    {filterStatus !== 'all' || search
                                                        ? 'Coba reset filter'
                                                        : 'Belum ada laporan yang diproses'}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {links.length > 3 && (
                        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between flex-wrap gap-2">
                            <p className="text-xs text-gray-400">
                                {from}-{to} dari {total} hasil
                            </p>
                            <div className="flex gap-1 flex-wrap">
                                {links.map((link, i) => (
                                    <button
                                        key={i}
                                        onClick={() => link.url && router.get(link.url)}
                                        disabled={!link.url}
                                        className={`px-3 py-1 rounded text-xs font-medium transition
                                            ${link.active ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
                                            ${!link.url ? 'opacity-40 cursor-not-allowed' : ''}`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Detail */}
            <Modal show={showDetailModal} onClose={() => setShowDetailModal(false)} maxWidth="4xl">
                {selectedHasil && (
                    <div className="p-6">
                        <div className="border-b border-gray-200 pb-4 mb-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Detail Hasil Preprocessing #{selectedHasil.id}
                                </h2>
                                <div className="flex items-center gap-2">
                                    <StatusBadge status={selectedHasil.status} />
                                    {selectedHasil.is_corrected && (
                                        <span className="px-2 py-0.5 text-xs bg-amber-100 text-amber-800 rounded-full">
                                            Dikoreksi Manual
                                        </span>
                                    )}
                                </div>
                            </div>
                            {/* Format laporan ringkas */}
                            {selectedHasil.format_laporan && (
                                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-violet-50 border border-violet-200 rounded-full">
                                    <span className="text-xs text-violet-600 font-medium">Format:</span>
                                    <span className="text-xs text-violet-800 font-semibold italic">{selectedHasil.format_laporan}</span>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            {/* Teks laporan */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-700 mb-1">Teks Laporan</h3>
                                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    {selectedHasil.laporan_awal?.text_laporan}
                                </p>
                            </div>

                            {/* Kode matched dengan distribusi */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-700 mb-2">Kode Matched</h3>
                                <div className="flex flex-wrap gap-1 mb-2">
                                    {selectedHasil.kode_matched?.map(k => <KodeBadge key={k} kode={k} />)}
                                </div>
                                {/* Distribusi kode */}
                                {(selectedHasil.pelaku_kode?.length > 0 || selectedHasil.korban_kode?.length > 0) && (
                                    <div className="grid grid-cols-2 gap-3 mt-2">
                                        {selectedHasil.pelaku_kode?.length > 0 && (
                                            <div className="bg-red-50 rounded-lg p-2.5">
                                                <p className="text-xs font-semibold text-red-700 mb-1">Kode Pelaku</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {selectedHasil.pelaku_kode.map(k => <KodeBadge key={k} kode={k} />)}
                                                </div>
                                            </div>
                                        )}
                                        {selectedHasil.korban_kode?.length > 0 && (
                                            <div className="bg-blue-50 rounded-lg p-2.5">
                                                <p className="text-xs font-semibold text-blue-700 mb-1">Kode Korban</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {selectedHasil.korban_kode.map(k => <KodeBadge key={k} kode={k} />)}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Pelaku & Korban dengan kelas */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-red-50 border border-red-100 p-4 rounded-xl">
                                    <h3 className="text-sm font-semibold text-red-900 mb-2">Pelaku</h3>
                                    {selectedHasil.pelaku_nama ? (
                                        <div className="space-y-1">
                                            <p className="text-sm font-bold text-gray-900">{selectedHasil.pelaku_nama}</p>
                                            {selectedHasil.pelaku_santri?.kelas_kode && (
                                                <div className="flex items-center gap-1.5">
                                                    <span className="w-2 h-2 rounded-full bg-indigo-400" />
                                                    <p className="text-xs font-semibold text-indigo-700">
                                                        Kelas {selectedHasil.pelaku_santri.kelas_kode}
                                                    </p>
                                                </div>
                                            )}
                                            {selectedHasil.pelaku_santri_id
                                                ? <p className="text-xs text-gray-500">ID: {selectedHasil.pelaku_santri_id}</p>
                                                : <p className="text-xs text-amber-700">Nama terdeteksi, tidak ditemukan di DB</p>
                                            }
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-400 italic">Tidak terdeteksi</p>
                                    )}
                                </div>

                                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
                                    <h3 className="text-sm font-semibold text-blue-900 mb-2">Korban</h3>
                                    {selectedHasil.korban_nama ? (
                                        <div className="space-y-1">
                                            <p className="text-sm font-bold text-gray-900">{selectedHasil.korban_nama}</p>
                                            {selectedHasil.korban_santri?.kelas_kode && (
                                                <div className="flex items-center gap-1.5">
                                                    <span className="w-2 h-2 rounded-full bg-indigo-400" />
                                                    <p className="text-xs font-semibold text-indigo-700">
                                                        Kelas {selectedHasil.korban_santri.kelas_kode}
                                                    </p>
                                                </div>
                                            )}
                                            {selectedHasil.korban_santri_id
                                                ? <p className="text-xs text-gray-500">ID: {selectedHasil.korban_santri_id}</p>
                                                : <p className="text-xs text-amber-700">Nama terdeteksi, tidak ditemukan di DB</p>
                                            }
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-400 italic">Tidak ada korban</p>
                                    )}
                                </div>
                            </div>

                            {/* Kata Kerja + Verb Info */}
                            {(selectedHasil.kata_kerja_dasar || selectedHasil.verb_info?.kata) && (
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Kata Kerja Terdeteksi</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedHasil.verb_info?.kata ? (
                                            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-100 border border-violet-200 rounded-lg">
                                                <span className="text-sm font-mono font-bold text-violet-800">
                                                    {selectedHasil.verb_info.kata}
                                                </span>
                                                <span className="text-xs text-violet-600">
                                                    ({selectedHasil.verb_info.tipe ?? 'unknown'})
                                                </span>
                                                {selectedHasil.verb_info.awalan && (
                                                    <span className="text-xs bg-violet-200 text-violet-700 px-1.5 py-0.5 rounded font-mono">
                                                        {selectedHasil.verb_info.awalan}-
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="inline-block px-3 py-1.5 bg-violet-100 text-violet-800 text-sm font-mono rounded-lg">
                                                {selectedHasil.kata_kerja_dasar}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Preprocessing data */}
                            {selectedHasil.preprocessing_data && (
                                <details className="bg-gray-50 border border-gray-100 p-3 rounded-lg">
                                    <summary className="text-sm font-medium text-gray-700 cursor-pointer">
                                        Data Preprocessing (JSON)
                                    </summary>
                                    <pre className="text-xs text-gray-600 mt-2 overflow-auto max-h-60">
                                        {JSON.stringify(selectedHasil.preprocessing_data, null, 2)}
                                    </pre>
                                </details>
                            )}

                            {selectedHasil.is_corrected && selectedHasil.correction_notes && (
                                <div className="bg-amber-50 border border-amber-100 p-3 rounded-lg">
                                    <h3 className="text-sm font-semibold text-amber-900 mb-1">Catatan Koreksi</h3>
                                    <p className="text-sm text-gray-700">{selectedHasil.correction_notes}</p>
                                </div>
                            )}

                            {selectedHasil.error_message && (
                                <div className="bg-red-50 border border-red-100 p-3 rounded-lg">
                                    <h3 className="text-sm font-semibold text-red-900 mb-1">Error</h3>
                                    <p className="text-xs text-red-700 font-mono break-all">{selectedHasil.error_message}</p>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 flex justify-end">
                            <SecondaryButton onClick={() => setShowDetailModal(false)}>Tutup</SecondaryButton>
                        </div>
                    </div>
                )}
            </Modal>
        </GuruBkLayout>
    );
}