/**
 * MyBimbingan/Logbook.jsx
 *
 * DIPAKAI oleh dua role dengan fitur berbeda:
 *   mode = 'bk'     → BK melihat semua santri, bisa buka detail sesi,
 *                      link ke review/preview, tambah catatan
 *   mode = 'santri' → Santri hanya lihat logbook diri sendiri,
 *                      tidak ada dropdown, tidak ada link aksi BK
 */
import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';

// ── Badge helpers ─────────────────────────────────────────────
const TL = {
    tidak_perlu:     { bg: 'bg-green-100',  text: 'text-green-700',  icon: '✅', label: 'Aman'              },
    pantau:          { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: '🟡', label: 'Dipantau'          },
    rujuk_konseling: { bg: 'bg-red-100',    text: 'text-red-700',    icon: '🔴', label: 'Dirujuk Konseling' },
};

const APPROVAL_STYLE = {
    pending_tenaga_pendidik: 'bg-yellow-100 text-yellow-700',
    pending_bk:              'bg-blue-100 text-blue-700',
    selesai:                 'bg-green-100 text-green-700',
    dirujuk:                 'bg-purple-100 text-purple-700',
};

// ── Kartu satu entri logbook ───────────────────────────────────
function LogbookCard({ entry, isBK }) {
    const [open, setOpen] = useState(false);

    const tl       = TL[entry.tindak_lanjut] ?? { bg: 'bg-gray-100', text: 'text-gray-600', icon: '—', label: '-' };
    const hasCatat = !!entry.catatan;
    const hasRujuk = !!entry.laporan_rujukan;
    const hasGejala= (entry.gejala_dikonfirmasi ?? []).length > 0;

    return (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            {/* ── Baris header ───────────────────────────────── */}
            <div
                className="px-5 py-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition select-none"
                onClick={() => setOpen(o => !o)}
            >
                {/* Ikon tindak lanjut */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 ${tl.bg}`}>
                    {tl.icon}
                </div>

                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{entry.jadwal_judul}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                        {entry.kelas} &bull; {entry.tanggal}
                        {entry.reviewed_at && entry.reviewed_at !== '-' && (
                            <> &bull; Direview: {entry.reviewed_at}</>
                        )}
                    </p>
                </div>

                {/* Badge tindak lanjut */}
                <span className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${tl.bg} ${tl.text}`}>
                    {tl.icon} {tl.label}
                </span>

                {/* Expand chevron */}
                <svg className={`w-4 h-4 text-gray-400 transition-transform shrink-0 ${open ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </div>

            {/* ── Detail expandable ───────────────────────────── */}
            {open && (
                <div className="border-t px-5 py-4 bg-gray-50 space-y-4">

                    {/* Catatan BK (opsi pantau atau catatan umum) */}
                    {hasCatat && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <p className="text-xs font-semibold text-yellow-700 mb-1">💬 Catatan BK:</p>
                            <p className="text-sm text-yellow-900">{entry.catatan}</p>
                        </div>
                    )}

                    {/* Gejala yang dikonfirmasi */}
                    {hasGejala && (
                        <div>
                            <p className="text-xs font-medium text-gray-500 mb-1.5">Gejala teridentifikasi:</p>
                            <div className="flex flex-wrap gap-1.5">
                                {entry.gejala_dikonfirmasi.map((kode, i) => (
                                    <span key={i}
                                        className="text-xs bg-purple-100 text-purple-700 px-2.5 py-0.5 rounded-full font-mono font-semibold">
                                        {kode}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Laporan rujukan (opsi 3) */}
                    {hasRujuk && (
                        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold text-indigo-600 mb-0.5">📄 Laporan Konseling dibuat:</p>
                                    <p className="text-sm text-indigo-900 font-medium">
                                        <span className="font-mono">{entry.laporan_rujukan.kode}</span>
                                        {' — '}{entry.laporan_rujukan.diagnosis}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                        APPROVAL_STYLE[entry.laporan_rujukan.approval_status] ?? 'bg-gray-100 text-gray-600'
                                    }`}>
                                        {entry.laporan_rujukan.approval_label}
                                    </span>
                                    {/* BK: link ke Kelola Approval */}
                                    {isBK && (
                                        <Link
                                            href={route('kelola-approval.show', {
                                                jenis: 'konselor',
                                                id: entry.laporan_rujukan.id,
                                            })}
                                            className="text-xs px-2.5 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                                            onClick={e => e.stopPropagation()}
                                        >
                                            Lihat Laporan →
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Aksi BK: link ke Review sesi */}
                    {isBK && entry.sesi_id && (
                        <div className="flex gap-2 pt-1">
                            <Link
                                href={route('my-bimbingan.sesi.review', entry.sesi_id)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-50 transition"
                                onClick={e => e.stopPropagation()}
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                Lihat Sesi
                            </Link>

                            {/* Jika rujuk tapi belum selesai, buka PreviewLaporan */}
                            {entry.tindak_lanjut === 'rujuk_konseling' && !hasRujuk && (
                                <Link
                                    href={route('my-bimbingan.sesi.preview-laporan', entry.sesi_id)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition"
                                    onClick={e => e.stopPropagation()}
                                >
                                    ⚠ Selesaikan Rujukan →
                                </Link>
                            )}
                        </div>
                    )}

                    {/* Jika tidak ada detail apapun */}
                    {!hasCatat && !hasGejala && !hasRujuk && !isBK && (
                        <p className="text-sm text-gray-400 italic">Tidak ada catatan tambahan.</p>
                    )}
                </div>
            )}
        </div>
    );
}

// ── Statistik bar ─────────────────────────────────────────────
function StatBar({ logbookData }) {
    const total  = logbookData.length;
    const ok     = logbookData.filter(e => e.tindak_lanjut === 'tidak_perlu').length;
    const pantau = logbookData.filter(e => e.tindak_lanjut === 'pantau').length;
    const rujuk  = logbookData.filter(e => e.tindak_lanjut === 'rujuk_konseling').length;

    return (
        <div className="grid grid-cols-4 gap-3">
            <div className="bg-white border rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-gray-800">{total}</p>
                <p className="text-xs text-gray-500 mt-0.5">Total Sesi</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-green-700">{ok}</p>
                <p className="text-xs text-green-600 mt-0.5">Aman</p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-yellow-700">{pantau}</p>
                <p className="text-xs text-yellow-600 mt-0.5">Dipantau</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-red-700">{rujuk}</p>
                <p className="text-xs text-red-600 mt-0.5">Dirujuk</p>
            </div>
        </div>
    );
}

// ── Main ──────────────────────────────────────────────────────
export default function Logbook({
    santriList      = [],
    selectedSantriId = 0,
    selectedSantri  = null,
    logbookData     = [],
    mode            = 'bk',
}) {
    const { auth } = usePage().props;
    const isBK = mode === 'bk';

    const handleSelectSantri = (val) => {
        router.get(
            route('my-bimbingan.logbook'),
            { santri_id: val },
            { preserveState: true, replace: true }
        );
    };

    return (
        <AppLayout user={auth.user} header={isBK ? 'Logbook Bimbingan Santri' : 'Logbook Bimbingan Saya'}>
            <Head title="Logbook Bimbingan" />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">

                {/* ── Header ─────────────────────────────────── */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {isBK ? '📒 Logbook Bimbingan Santri' : '📒 Logbook Bimbingan Saya'}
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {isBK
                            ? 'Riwayat lengkap semua sesi bimbingan berkala per santri. Pilih santri untuk melihat logbooknya.'
                            : 'Semua sesi bimbingan berkala yang sudah kamu selesaikan.'
                        }
                    </p>
                </div>

                {/* ── BK: panel pilih santri + filter ────────── */}
                {isBK && (
                    <div className="bg-white rounded-xl border p-4 space-y-3">
                        <label className="block text-sm font-medium text-gray-700">
                            Cari Santri
                        </label>
                        <div className="flex gap-2">
                            <select
                                value={selectedSantriId || ''}
                                onChange={e => handleSelectSantri(e.target.value)}
                                className="flex-1 rounded-lg border-gray-300 text-sm shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option value="">— Pilih santri untuk lihat logbook —</option>
                                {santriList.map(s => (
                                    <option key={s.id} value={s.id}>
                                        [{s.kelas}] {s.nama} — {s.nisn}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Info mode BK */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-800">
                            <p className="font-medium mb-1">Fitur BK di Logbook:</p>
                            <ul className="space-y-0.5 list-disc list-inside">
                                <li>Lihat detail setiap sesi bimbingan (klik kartu)</li>
                                <li>Buka halaman review sesi langsung dari sini</li>
                                <li>Link ke Kelola Approval untuk laporan rujukan</li>
                                <li>Lanjutkan rujukan yang belum selesai</li>
                            </ul>
                        </div>
                    </div>
                )}

                {/* ── Konten logbook ──────────────────────────── */}
                {(selectedSantriId || !isBK) ? (
                    <>
                        {/* Info santri yang dipilih */}
                        {selectedSantri && (
                            <div className={`rounded-xl px-5 py-3 flex items-center gap-3 ${
                                isBK
                                    ? 'bg-indigo-50 border border-indigo-200'
                                    : 'bg-gray-50 border border-gray-200'
                            }`}>
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                                    isBK ? 'bg-indigo-200 text-indigo-700' : 'bg-gray-200 text-gray-600'
                                }`}>
                                    {selectedSantri.nama?.[0]?.toUpperCase() ?? '?'}
                                </div>
                                <div>
                                    <p className={`font-semibold ${isBK ? 'text-indigo-900' : 'text-gray-900'}`}>
                                        {selectedSantri.nama}
                                    </p>
                                    <p className={`text-xs ${isBK ? 'text-indigo-600' : 'text-gray-500'}`}>
                                        NISN: {selectedSantri.nisn}
                                    </p>
                                </div>
                                {/* BK: link ke profil santri */}
                                {isBK && selectedSantriId && (
                                    <div className="ml-auto">
                                        <Link
                                            href={route('santri.profil', selectedSantriId)}
                                            className="text-xs px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                                        >
                                            Lihat Profil Lengkap →
                                        </Link>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Statistik */}
                        {logbookData.length > 0 && (
                            <StatBar logbookData={logbookData} />
                        )}

                        {/* Daftar entri */}
                        {logbookData.length === 0 ? (
                            <div className="bg-white rounded-xl border py-16 text-center">
                                <p className="text-4xl mb-3">📭</p>
                                <p className="font-medium text-gray-600">Belum ada sesi bimbingan yang selesai</p>
                                <p className="text-sm text-gray-400 mt-1">
                                    {isBK
                                        ? 'Santri ini belum pernah mengikuti sesi bimbingan berkala yang sudah direview.'
                                        : 'Kamu belum pernah mengikuti sesi bimbingan berkala yang sudah selesai.'
                                    }
                                </p>
                                {isBK && (
                                    <Link
                                        href={route('my-bimbingan.jadwal.index')}
                                        className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition"
                                    >
                                        Buat Jadwal Bimbingan
                                    </Link>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {logbookData.map((entry, i) => (
                                    <LogbookCard key={entry.id ?? i} entry={entry} isBK={isBK} />
                                ))}
                            </div>
                        )}
                    </>
                ) : (
                    /* BK belum pilih santri */
                    <div className="bg-white rounded-xl border py-20 text-center">
                        <p className="text-5xl mb-4">👆</p>
                        <p className="font-semibold text-gray-600 text-lg">Pilih santri di atas</p>
                        <p className="text-sm text-gray-400 mt-1">
                            Pilih nama santri untuk melihat riwayat bimbingan berkalanya
                        </p>
                        <div className="mt-6 flex gap-3 justify-center">
                            <Link
                                href={route('my-bimbingan.jadwal.index')}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition font-medium"
                            >
                                Lihat Jadwal Bimbingan
                            </Link>
                            <Link
                                href={route('santri.index')}
                                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition font-medium"
                            >
                                Monitoring Santri
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}