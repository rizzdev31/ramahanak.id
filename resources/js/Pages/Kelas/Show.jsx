import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import Modal from '@/Components/Modal';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';

const DEFAULT_AVATAR = '/storage/defaultavatar.png';

export default function Show({ auth, kelas, santri, wali_kelas, wali_asrama, santriTersedia, semuaKelas }) {
    const [activeTab, setActiveTab]           = useState('santri');
    const [showTambahModal, setShowTambahModal] = useState(false);
    const [showPindahModal, setShowPindahModal] = useState(false);
    const [showKeluarModal, setShowKeluarModal] = useState(false);
    const [selectedSantri,  setSelectedSantri]  = useState(null);

    // ── Form tambah santri (multi-select) ────────────────────
    const formTambah = useForm({ santri_ids: [] });

    // ── Form pindah santri ───────────────────────────────────
    const formPindah = useForm({ santri_id: '', kelas_id: '' });

    // ── Tambah ───────────────────────────────────────────────
    const togglePilihSantri = (id) => {
        const ids = formTambah.data.santri_ids;
        formTambah.setData('santri_ids',
            ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id]
        );
    };

    const handleTambah = (e) => {
        e.preventDefault();
        formTambah.post(route('kelas.tambah-santri', { kelas: kelas.id }), {
            preserveScroll: true,
            onSuccess: () => { setShowTambahModal(false); formTambah.reset(); },
        });
    };

    // ── Pindah ───────────────────────────────────────────────
    const openPindahModal = (s) => {
        setSelectedSantri(s);
        formPindah.setData('santri_id', s.id);
        formPindah.setData('kelas_id', '');
        setShowPindahModal(true);
    };

    const handlePindah = (e) => {
        e.preventDefault();
        formPindah.post(route('kelas.pindah-santri', { kelas: kelas.id }), {
            preserveScroll: true,
            onSuccess: () => { setShowPindahModal(false); setSelectedSantri(null); formPindah.reset(); },
        });
    };

    // ── Keluarkan ke PENDING ─────────────────────────────────
    const openKeluarModal = (s) => { setSelectedSantri(s); setShowKeluarModal(true); };

    const handleKeluar = () => {
        router.post(route('kelas.keluarkan-santri', { kelas: kelas.id }), {
            santri_id: selectedSantri.id,
        }, {
            preserveScroll: true,
            onSuccess: () => { setShowKeluarModal(false); setSelectedSantri(null); },
            onError: (e) => alert(e.message || 'Terjadi kesalahan'),
        });
    };

    return (
        <AppLayout
            user={auth.user}
            header={
                <div className="flex justify-between items-center flex-wrap gap-2">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Detail Kelas: {kelas.nama_lengkap}
                    </h2>
                    <div className="flex gap-2">
                        <Link href={route('kelas.edit', { kelas: kelas.id })}>
                            <SecondaryButton>Edit Kelas</SecondaryButton>
                        </Link>
                        <Link href={route('kelas.index')}>
                            <PrimaryButton>Kembali</PrimaryButton>
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title={`Detail Kelas ${kelas.kode_kelas}`} />

            <div className="py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

                    {/* ── Info Kelas ──────────────────────────── */}
                    <div className="bg-white shadow-sm rounded-lg p-6">
                        <h3 className="text-base font-semibold text-gray-900 mb-4">Informasi Kelas</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <div className="text-xs text-blue-600 font-medium mb-1">Kode Kelas</div>
                                <div className="text-2xl font-bold text-blue-900">{kelas.kode_kelas}</div>
                            </div>
                            <div className="bg-green-50 p-4 rounded-lg">
                                <div className="text-xs text-green-600 font-medium mb-1">Nama Kelas</div>
                                <div className="text-xl font-bold text-green-900">{kelas.nama}</div>
                            </div>
                            <div className="bg-purple-50 p-4 rounded-lg">
                                <div className="text-xs text-purple-600 font-medium mb-1">Tingkat</div>
                                <div className="text-xl font-bold text-purple-900">
                                    {kelas.tingkat > 0 ? `Tingkat ${kelas.tingkat}` : 'Belum Ditempatkan'}
                                </div>
                            </div>
                            <div className="bg-yellow-50 p-4 rounded-lg">
                                <div className="text-xs text-yellow-600 font-medium mb-1">Tahun Ajaran</div>
                                <div className="text-xl font-bold text-yellow-900">{kelas.tahun_ajaran}</div>
                            </div>
                            <div className="bg-indigo-50 p-4 rounded-lg">
                                <div className="text-xs text-indigo-600 font-medium mb-1">Kapasitas</div>
                                <div className="text-xl font-bold text-indigo-900">
                                    {kelas.jumlah_santri} / {kelas.kapasitas || '∞'}
                                    {kelas.is_penuh && <span className="ml-2 text-xs text-red-600">(Penuh!)</span>}
                                </div>
                                {kelas.sisa_kapasitas !== null && (
                                    <div className="text-xs text-indigo-500 mt-1">Sisa: {kelas.sisa_kapasitas} kursi</div>
                                )}
                            </div>
                            <div className={`p-4 rounded-lg ${kelas.status === 'active' ? 'bg-green-50' : 'bg-red-50'}`}>
                                <div className={`text-xs font-medium mb-1 ${kelas.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>Status</div>
                                <div className={`text-xl font-bold ${kelas.status === 'active' ? 'text-green-900' : 'text-red-900'}`}>
                                    {kelas.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Tabs ────────────────────────────────── */}
                    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                        <div className="border-b border-gray-200">
                            <nav className="flex -mb-px">
                                {[
                                    { key: 'santri', label: `Santri (${santri.length})` },
                                    { key: 'wali',   label: `Wali Kelas & Asrama (${(wali_kelas?.length||0)+(wali_asrama?.length||0)})` },
                                ].map(tab => (
                                    <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                                        className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors
                                            ${activeTab === tab.key
                                                ? 'border-indigo-500 text-indigo-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                                        {tab.label}
                                    </button>
                                ))}
                            </nav>
                        </div>

                        <div className="p-6">

                            {/* ══ Tab Santri ══════════════════════════════════════ */}
                            {activeTab === 'santri' && (
                                <div>
                                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                                        <h3 className="text-base font-semibold text-gray-900">
                                            Daftar Santri — {kelas.nama_lengkap}
                                        </h3>
                                        {/* Tombol tambah: hanya jika ada santri tersedia & kelas tidak penuh */}
                                        {!kelas.is_penuh && santriTersedia?.length > 0 && (
                                            <PrimaryButton onClick={() => setShowTambahModal(true)}>
                                                + Tambah Santri
                                            </PrimaryButton>
                                        )}
                                    </div>

                                    {kelas.is_penuh && (
                                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                                            ⚠️ Kelas sudah penuh ({kelas.jumlah_santri}/{kelas.kapasitas}). Tidak dapat menambah santri baru.
                                        </div>
                                    )}

                                    {santri.length > 0 ? (
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        {['No','Foto','NISN','Nama Lengkap','Jenis Kelamin','Status','Aksi'].map(h => (
                                                            <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">
                                                                {h}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {santri.map((s, i) => (
                                                        <tr key={s.id} className="hover:bg-gray-50">
                                                            <td className="px-4 py-3 text-xs text-gray-400">{i+1}</td>
                                                            <td className="px-4 py-3">
                                                                <img src={s.foto || DEFAULT_AVATAR} alt={s.nama_lengkap}
                                                                    className="h-9 w-9 rounded-full object-cover border border-gray-200"
                                                                    onError={(e) => { e.target.onerror=null; e.target.src=DEFAULT_AVATAR; }} />
                                                            </td>
                                                            <td className="px-4 py-3 font-mono text-xs text-gray-500">{s.nisn||'-'}</td>
                                                            <td className="px-4 py-3 font-medium text-gray-900">{s.nama_lengkap}</td>
                                                            <td className="px-4 py-3 text-xs text-gray-500">{s.jenis_kelamin||'-'}</td>
                                                            <td className="px-4 py-3">
                                                                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full
                                                                    ${s.status==='active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                                    {s.status==='active' ? 'Aktif' : 'Menunggu'}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 whitespace-nowrap">
                                                                <div className="flex gap-3">
                                                                    {/* Pindah ke kelas lain */}
                                                                    {semuaKelas?.filter(k => k.id !== kelas.id).length > 0 && (
                                                                        <button onClick={() => openPindahModal(s)}
                                                                            className="text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline">
                                                                            Pindah
                                                                        </button>
                                                                    )}
                                                                    {/* Keluarkan ke PENDING — tidak untuk kelas PENDING itu sendiri */}
                                                                    {!kelas.is_pending && (
                                                                        <button onClick={() => openKeluarModal(s)}
                                                                            className="text-xs font-medium text-red-600 hover:text-red-800 hover:underline">
                                                                            Keluarkan
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 text-gray-400">
                                            <svg className="mx-auto h-10 w-10 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
                                            </svg>
                                            <p className="text-sm font-medium text-gray-500">Belum ada santri</p>
                                            {santriTersedia?.length > 0 && !kelas.is_penuh && (
                                                <button onClick={() => setShowTambahModal(true)}
                                                    className="mt-3 text-sm text-indigo-600 hover:underline">
                                                    + Tambah santri ke kelas ini
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ══ Tab Wali ════════════════════════════════════════ */}
                            {activeTab === 'wali' && (
                                <div className="space-y-6">
                                    {/* Wali Kelas */}
                                    <div>
                                        <h3 className="text-base font-semibold text-gray-900 mb-3">Wali Kelas</h3>
                                        {wali_kelas?.length > 0 ? (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {wali_kelas.map(wali => (
                                                    <div key={wali.id} className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-4">
                                                        <img src={wali.foto ? `/storage/${wali.foto}` : DEFAULT_AVATAR} alt={wali.nama}
                                                            className="h-14 w-14 rounded-full object-cover border-2 border-blue-200 shrink-0"
                                                            onError={(e) => { e.target.onerror=null; e.target.src=DEFAULT_AVATAR; }} />
                                                        <div>
                                                            <h4 className="font-semibold text-gray-900">{wali.nama||'N/A'}</h4>
                                                            <p className="text-sm text-gray-500">NIP: {wali.nip||'-'}</p>
                                                            <span className="mt-1 inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                {wali.role==='guru_bk' ? 'Guru BK' : 'Tenaga Pendidik'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                                                <p className="text-sm text-yellow-800">
                                                    ⚠️ Belum ada wali kelas.{' '}
                                                    <Link href={route('penugasan.index')} className="font-semibold underline">Assign sekarang</Link>
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Wali Asrama */}
                                    <div>
                                        <h3 className="text-base font-semibold text-gray-900 mb-3">Wali Asrama</h3>
                                        {wali_asrama?.length > 0 ? (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {wali_asrama.map(wali => (
                                                    <div key={wali.id} className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-4">
                                                        <img src={wali.foto ? `/storage/${wali.foto}` : DEFAULT_AVATAR} alt={wali.nama}
                                                            className="h-14 w-14 rounded-full object-cover border-2 border-green-200 shrink-0"
                                                            onError={(e) => { e.target.onerror=null; e.target.src=DEFAULT_AVATAR; }} />
                                                        <div>
                                                            <h4 className="font-semibold text-gray-900">{wali.nama||'N/A'}</h4>
                                                            <p className="text-sm text-gray-500">NIP: {wali.nip||'-'}</p>
                                                            <span className="mt-1 inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                {wali.role==='guru_bk' ? 'Guru BK' : 'Tenaga Pendidik'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                                                <p className="text-sm text-yellow-800">
                                                    ⚠️ Belum ada wali asrama.{' '}
                                                    <Link href={route('penugasan.index')} className="font-semibold underline">Assign sekarang</Link>
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════
                Modal: Tambah Santri
            ══════════════════════════════════════════════════════ */}
            <Modal show={showTambahModal} onClose={() => { setShowTambahModal(false); formTambah.reset(); }} maxWidth="2xl">
                <form onSubmit={handleTambah} className="divide-y divide-gray-100">
                    <div className="px-6 py-4">
                        <h2 className="text-lg font-semibold text-gray-900">Tambah Santri ke {kelas.nama_lengkap}</h2>
                        <p className="text-sm text-gray-400 mt-1">Santri dari PENDING atau kelas lain</p>
                    </div>

                    <div className="px-6 py-4 max-h-96 overflow-y-auto">
                        {santriTersedia?.length > 0 ? (
                            <div className="space-y-1">
                                {/* Select All */}
                                <label className="flex items-center gap-3 p-2 rounded cursor-pointer border-b pb-3 mb-1 hover:bg-gray-50">
                                    <input type="checkbox"
                                        className="rounded border-gray-300 text-indigo-600"
                                        checked={formTambah.data.santri_ids.length === santriTersedia.length && santriTersedia.length > 0}
                                        onChange={(e) => formTambah.setData('santri_ids',
                                            e.target.checked ? santriTersedia.map(s => s.id) : []
                                        )} />
                                    <span className="text-sm font-medium text-gray-700">Pilih Semua ({santriTersedia.length})</span>
                                </label>

                                {santriTersedia.map(s => (
                                    <label key={s.id} className="flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-gray-50">
                                        <input type="checkbox"
                                            className="rounded border-gray-300 text-indigo-600"
                                            checked={formTambah.data.santri_ids.includes(s.id)}
                                            onChange={() => togglePilihSantri(s.id)} />
                                        <img src={s.foto || DEFAULT_AVATAR} alt={s.nama_lengkap}
                                            className="h-9 w-9 rounded-full object-cover border shrink-0"
                                            onError={(e) => { e.target.onerror=null; e.target.src=DEFAULT_AVATAR; }} />
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-gray-900 truncate">{s.nama_lengkap}</div>
                                            <div className="text-xs text-gray-400">
                                                NISN: {s.nisn||'-'} •{' '}
                                                <span className={`font-medium ${s.kelas_asal==='PENDING' ? 'text-yellow-600' : 'text-blue-600'}`}>
                                                    {s.kelas_asal || 'PENDING'}
                                                </span>
                                            </div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400 text-center py-8">Tidak ada santri tersedia.</p>
                        )}
                        <InputError message={formTambah.errors.santri_ids} className="mt-2" />
                    </div>

                    <div className="px-6 py-4 bg-gray-50 flex justify-between items-center">
                        <span className="text-sm text-gray-500">{formTambah.data.santri_ids.length} dipilih</span>
                        <div className="flex gap-3">
                            <SecondaryButton type="button" onClick={() => { setShowTambahModal(false); formTambah.reset(); }}>Batal</SecondaryButton>
                            <PrimaryButton disabled={formTambah.processing || formTambah.data.santri_ids.length === 0}>
                                {formTambah.processing ? 'Menyimpan...' : `Tambahkan (${formTambah.data.santri_ids.length})`}
                            </PrimaryButton>
                        </div>
                    </div>
                </form>
            </Modal>

            {/* ══════════════════════════════════════════════════════
                Modal: Pindah Santri
            ══════════════════════════════════════════════════════ */}
            <Modal show={showPindahModal} onClose={() => { setShowPindahModal(false); setSelectedSantri(null); }} maxWidth="md">
                <form onSubmit={handlePindah} className="divide-y divide-gray-100">
                    <div className="px-6 py-4">
                        <h2 className="text-lg font-semibold text-gray-900">Pindah Santri</h2>
                        {selectedSantri && (
                            <div className="flex items-center gap-3 mt-2 p-2 bg-gray-50 rounded-lg">
                                <img src={selectedSantri.foto || DEFAULT_AVATAR} alt={selectedSantri.nama_lengkap}
                                    className="h-10 w-10 rounded-full object-cover border shrink-0"
                                    onError={(e) => { e.target.onerror=null; e.target.src=DEFAULT_AVATAR; }} />
                                <div>
                                    <div className="text-sm font-medium text-gray-900">{selectedSantri.nama_lengkap}</div>
                                    <div className="text-xs text-gray-400">Dari kelas: <strong>{kelas.nama_lengkap}</strong></div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="px-6 py-5">
                        <InputLabel htmlFor="kelas_tujuan" value="Pindah ke Kelas *" />
                        <select id="kelas_tujuan"
                            className="mt-1 block w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            value={formPindah.data.kelas_id}
                            onChange={(e) => formPindah.setData('kelas_id', e.target.value)}
                            required>
                            <option value="">-- Pilih Kelas Tujuan --</option>
                            {semuaKelas?.filter(k => k.id !== kelas.id).map(k => (
                                <option key={k.id} value={k.id} disabled={k.is_penuh}>
                                    {k.kode_kelas} - {k.nama}
                                    {k.is_penuh ? ' (Penuh)' : ` (${k.jumlah_santri}/${k.kapasitas||'∞'})`}
                                </option>
                            ))}
                        </select>
                        <InputError message={formPindah.errors.kelas_id} className="mt-1" />
                    </div>

                    <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
                        <SecondaryButton type="button" onClick={() => { setShowPindahModal(false); setSelectedSantri(null); }}>Batal</SecondaryButton>
                        <PrimaryButton disabled={formPindah.processing || !formPindah.data.kelas_id}>
                            {formPindah.processing ? 'Memindahkan...' : 'Pindahkan'}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* ══════════════════════════════════════════════════════
                Modal: Keluarkan Santri
            ══════════════════════════════════════════════════════ */}
            <Modal show={showKeluarModal} onClose={() => { setShowKeluarModal(false); setSelectedSantri(null); }}>
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className="shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.072 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-gray-900">Keluarkan dari Kelas</h2>
                            <p className="text-sm text-gray-500 mt-1">
                                <strong className="text-gray-900">{selectedSantri?.nama_lengkap}</strong> akan dipindahkan ke
                                kelas <strong>PENDING</strong> dan riwayat kelasnya diperbarui.
                            </p>
                        </div>
                    </div>
                    <div className="mt-5 flex justify-end gap-3">
                        <SecondaryButton onClick={() => { setShowKeluarModal(false); setSelectedSantri(null); }}>Batal</SecondaryButton>
                        <DangerButton onClick={handleKeluar}>Ya, Keluarkan</DangerButton>
                    </div>
                </div>
            </Modal>
        </AppLayout>
    );
}