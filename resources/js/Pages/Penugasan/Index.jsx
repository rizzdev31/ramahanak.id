import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Head, useForm, router } from '@inertiajs/react';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import Modal from '@/Components/Modal';
import InputLabel from '@/Components/InputLabel';

export default function Index({ auth, kelas, availableUsers }) {
    const [showAssignModal,    setShowAssignModal]    = useState(false);
    const [selectedKelas,      setSelectedKelas]      = useState(null);
    const [jenisPenugasan,     setJenisPenugasan]     = useState('wali_kelas');
    const [showDeleteModal,    setShowDeleteModal]     = useState(false);
    const [penugasanToDelete,  setPenugasanToDelete]  = useState(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        kelas_id:        '',
        user_id:         '',
        jenis_penugasan: 'wali_kelas',
    });

    // ── Buka modal assign ─────────────────────────────────────
    const openAssignModal = (kelasItem, jenis) => {
        setSelectedKelas(kelasItem);
        setJenisPenugasan(jenis);
        setData({ kelas_id: kelasItem.id, user_id: '', jenis_penugasan: jenis });
        setShowAssignModal(true);
    };

    // ── Submit assign ─────────────────────────────────────────
    const handleAssign = (e) => {
        e.preventDefault();
        post(route('penugasan.store'), {
            preserveScroll: true,
            onSuccess: () => { setShowAssignModal(false); reset(); },
        });
    };

    // ── Hapus penugasan ───────────────────────────────────────
    const openDeleteModal = (penugasan, kelasItem) => {
        setPenugasanToDelete({ ...penugasan, kelas: kelasItem });
        setShowDeleteModal(true);
    };

    const handleDelete = () => {
        router.delete(route('penugasan.destroy', penugasanToDelete.penugasan_id), {
            preserveScroll: true,
            onSuccess: () => { setShowDeleteModal(false); setPenugasanToDelete(null); },
            onError: (e) => alert(e.delete || 'Terjadi kesalahan'),
        });
    };

    /**
     * ✅ FILTER BARU — sesuai logika yang benar:
     *
     * Untuk WALI KELAS:
     *   - Tampilkan user yang BELUM jadi wali_kelas di kelas manapun
     *   - Kecualikan user yang sudah jadi wali_kelas di kelas ini (tidak mungkin dipilih lagi)
     *
     * Untuk WALI ASRAMA:
     *   - Tampilkan SEMUA user (boleh multi-kelas)
     *   - Kecualikan user yang sudah jadi wali_asrama di kelas INI saja
     *   - User yang sudah jadi wali_kelas di kelas lain TETAP bisa dipilih jadi wali_asrama
     */
    const getAvailableUsersForSelection = () => {
        if (!selectedKelas) return [];

        return availableUsers.filter(user => {
            if (jenisPenugasan === 'wali_kelas') {
                // ❌ Sudah jadi wali_kelas di kelas manapun → tidak bisa
                if (user.sudah_wali_kelas) return false;

                // ❌ Sudah jadi wali_kelas di kelas ini → tidak bisa (double check)
                if (selectedKelas.wali_kelas?.user_id === user.id) return false;

                return true;

            } else {
                // jenis = wali_asrama
                // ❌ Sudah jadi wali_asrama di kelas INI → tidak bisa
                const sudahWaliAsramaDisini = selectedKelas.wali_asrama?.some(
                    w => w.user_id === user.id
                );
                if (sudahWaliAsramaDisini) return false;

                // ✅ User yang sudah jadi wali_kelas di kelas lain TETAP BISA dipilih
                // ✅ User yang sudah jadi wali_asrama di kelas lain TETAP BISA dipilih
                return true;
            }
        });
    };

    // ── Helper label penugasan user untuk dropdown ────────────
    const getUserDropdownLabel = (user) => {
        let label = `${user.nama} (${user.role_label})`;
        const parts = [];

        if (user.sudah_wali_kelas) {
            parts.push(`WK: ${user.wali_kelas_di_kelas}`);
        }
        if (user.wali_asrama_di_kelas?.length > 0) {
            const namaKelas = user.wali_asrama_di_kelas.map(k => k.kelas_nama).join(', ');
            parts.push(`WA: ${namaKelas}`);
        }

        if (parts.length > 0) {
            label += ` — ${parts.join(' | ')}`;
        }

        return label;
    };

    return (
        <AppLayout
            user={auth.user}
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Kelola Penugasan Wali Kelas & Asrama
                </h2>
            }
        >
            <Head title="Kelola Penugasan" />

            <div className="py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">

                    {/* ── Info Panel ─────────────────────────── */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-blue-800 mb-2">📌 Aturan Penugasan</h3>
                        <ul className="text-sm text-blue-700 space-y-1">
                            <li>✅ 1 kelas hanya boleh punya <strong>1 Wali Kelas</strong></li>
                            <li>✅ 1 kelas boleh punya <strong>banyak Wali Asrama</strong></li>
                            <li>✅ 1 user hanya boleh menjadi <strong>Wali Kelas di 1 kelas</strong> saja</li>
                            {/* ✅ DIUBAH: Hapus aturan lama yang salah */}
                            <li>✅ User yang sudah menjadi Wali Kelas <strong>tetap bisa jadi Wali Asrama</strong> di kelas manapun</li>
                            <li>✅ 1 user bisa menjadi <strong>Wali Asrama di banyak kelas</strong> sekaligus</li>
                        </ul>
                    </div>

                    {/* ── Daftar Kelas & Penugasan ───────────── */}
                    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                        <div className="p-6">
                            <h3 className="text-base font-semibold text-gray-900 mb-4">
                                Daftar Kelas & Penugasan
                            </h3>

                            {kelas.length === 0 ? (
                                <p className="text-sm text-gray-400 text-center py-8">
                                    Belum ada kelas aktif.
                                </p>
                            ) : (
                                <div className="space-y-4">
                                    {kelas.map((kelasItem) => (
                                        <div key={kelasItem.id}
                                            className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition">

                                            {/* Header Kelas */}
                                            <div className="flex justify-between items-start mb-4 flex-wrap gap-2">
                                                <div>
                                                    <h4 className="text-lg font-bold text-gray-900">
                                                        {kelasItem.nama_lengkap}
                                                    </h4>
                                                    <p className="text-xs text-gray-500">
                                                        Tahun Ajaran: {kelasItem.tahun_ajaran}
                                                    </p>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold
                                                    ${kelasItem.tingkat === 7 ? 'bg-green-100 text-green-800' :
                                                      kelasItem.tingkat === 8 ? 'bg-blue-100 text-blue-800' :
                                                      'bg-purple-100 text-purple-800'}`}>
                                                    Tingkat {kelasItem.tingkat}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                                {/* Wali Kelas */}
                                                <div className="bg-blue-50 rounded-lg p-4">
                                                    <div className="flex justify-between items-center mb-3">
                                                        <h5 className="text-sm font-semibold text-blue-900">
                                                            Wali Kelas
                                                        </h5>
                                                        {!kelasItem.wali_kelas && (
                                                            <button
                                                                onClick={() => openAssignModal(kelasItem, 'wali_kelas')}
                                                                className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition">
                                                                + Assign
                                                            </button>
                                                        )}
                                                    </div>
                                                    {kelasItem.wali_kelas ? (
                                                        <div className="bg-white rounded-lg p-3">
                                                            <div className="flex justify-between items-start">
                                                                <div>
                                                                    <p className="text-sm font-medium text-gray-900">
                                                                        {kelasItem.wali_kelas.nama}
                                                                    </p>
                                                                    <p className="text-xs text-gray-500">
                                                                        {kelasItem.wali_kelas.role_label}
                                                                    </p>
                                                                </div>
                                                                <button
                                                                    onClick={() => openDeleteModal(kelasItem.wali_kelas, kelasItem)}
                                                                    className="text-xs text-red-600 hover:text-red-800 hover:underline">
                                                                    Hapus
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <p className="text-xs text-gray-400 italic">
                                                            Belum ada wali kelas
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Wali Asrama */}
                                                <div className="bg-green-50 rounded-lg p-4">
                                                    <div className="flex justify-between items-center mb-3">
                                                        <h5 className="text-sm font-semibold text-green-900">
                                                            Wali Asrama ({kelasItem.wali_asrama?.length || 0})
                                                        </h5>
                                                        <button
                                                            onClick={() => openAssignModal(kelasItem, 'wali_asrama')}
                                                            className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition">
                                                            + Assign
                                                        </button>
                                                    </div>
                                                    {kelasItem.wali_asrama?.length > 0 ? (
                                                        <div className="space-y-2">
                                                            {kelasItem.wali_asrama.map((wali) => (
                                                                <div key={wali.penugasan_id}
                                                                    className="bg-white rounded-lg p-3">
                                                                    <div className="flex justify-between items-start">
                                                                        <div>
                                                                            <p className="text-sm font-medium text-gray-900">
                                                                                {wali.nama}
                                                                            </p>
                                                                            <p className="text-xs text-gray-500">
                                                                                {wali.role_label}
                                                                            </p>
                                                                        </div>
                                                                        <button
                                                                            onClick={() => openDeleteModal(wali, kelasItem)}
                                                                            className="text-xs text-red-600 hover:text-red-800 hover:underline">
                                                                            Hapus
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-xs text-gray-400 italic">
                                                            Belum ada wali asrama
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ════════════════════════════════════════════════════
                Modal: Assign Wali
            ════════════════════════════════════════════════════ */}
            <Modal show={showAssignModal} onClose={() => { setShowAssignModal(false); reset(); }} maxWidth="lg">
                <form onSubmit={handleAssign} className="divide-y divide-gray-100">
                    <div className="px-6 py-4">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Assign {jenisPenugasan === 'wali_kelas' ? 'Wali Kelas' : 'Wali Asrama'}
                        </h2>
                        {selectedKelas && (
                            <p className="text-sm text-gray-500 mt-1">
                                Kelas: <strong>{selectedKelas.nama_lengkap}</strong>
                            </p>
                        )}
                    </div>

                    <div className="px-6 py-5">
                        <InputLabel htmlFor="user_id" value="Pilih Guru / Tenaga Pendidik *" />
                        <select
                            id="user_id"
                            className="mt-1 block w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            value={data.user_id}
                            onChange={(e) => setData('user_id', e.target.value)}
                            required
                        >
                            <option value="">-- Pilih User --</option>
                            {getAvailableUsersForSelection().map((user) => (
                                <option key={user.id} value={user.id}>
                                    {getUserDropdownLabel(user)}
                                </option>
                            ))}
                        </select>

                        {/* Info jika tidak ada user tersedia */}
                        {getAvailableUsersForSelection().length === 0 && (
                            <p className="mt-2 text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded p-2">
                                {jenisPenugasan === 'wali_kelas'
                                    ? '⚠️ Semua guru/tendik sudah menjadi Wali Kelas di kelas lain.'
                                    : '⚠️ Semua guru/tendik sudah menjadi Wali Asrama di kelas ini.'}
                            </p>
                        )}

                        {errors.user_id         && <p className="mt-1 text-sm text-red-600">{errors.user_id}</p>}
                        {errors.jenis_penugasan && <p className="mt-1 text-sm text-red-600">{errors.jenis_penugasan}</p>}
                    </div>

                    {/* Info kontekstual per jenis penugasan */}
                    <div className="px-6 py-3 bg-gray-50">
                        {jenisPenugasan === 'wali_kelas' ? (
                            <p className="text-xs text-blue-700">
                                ℹ️ Hanya user yang <strong>belum menjadi Wali Kelas</strong> di kelas manapun yang ditampilkan.
                            </p>
                        ) : (
                            <p className="text-xs text-green-700">
                                ℹ️ Semua guru/tendik dapat dipilih sebagai Wali Asrama, termasuk yang sudah menjadi Wali Kelas di kelas lain.
                            </p>
                        )}
                    </div>

                    <div className="px-6 py-4 flex justify-end gap-3">
                        <SecondaryButton type="button" onClick={() => { setShowAssignModal(false); reset(); }}>
                            Batal
                        </SecondaryButton>
                        <PrimaryButton disabled={processing || !data.user_id}>
                            {processing ? 'Menyimpan...' : 'Assign'}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* ════════════════════════════════════════════════════
                Modal: Konfirmasi Hapus Penugasan
            ════════════════════════════════════════════════════ */}
            <Modal show={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className="shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.072 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-gray-900">Hapus Penugasan</h2>
                            {penugasanToDelete && (
                                <p className="text-sm text-gray-500 mt-1">
                                    Hapus <strong className="text-gray-900">{penugasanToDelete.nama}</strong> sebagai{' '}
                                    <strong>
                                        {penugasanToDelete.penugasan_id && penugasanToDelete.role
                                            ? (penugasanToDelete.kelas?.wali_kelas?.penugasan_id === penugasanToDelete.penugasan_id
                                                ? 'Wali Kelas'
                                                : 'Wali Asrama')
                                            : 'Wali'}
                                    </strong>{' '}
                                    di kelas <strong>{penugasanToDelete.kelas?.nama_lengkap}</strong>?
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="mt-5 flex justify-end gap-3">
                        <SecondaryButton onClick={() => setShowDeleteModal(false)}>Batal</SecondaryButton>
                        <DangerButton onClick={handleDelete}>Ya, Hapus</DangerButton>
                    </div>
                </div>
            </Modal>
        </AppLayout>
    );
}