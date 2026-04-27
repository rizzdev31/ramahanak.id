import React, { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';

export default function Show({ auth, laporan }) {
    const [showSesiForm, setShowSesiForm] = useState(false);
    const [showCompleteModal, setShowCompleteModal] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        tanggal_sesi: new Date().toISOString().split('T')[0],
        catatan_bk: '',
        proses_bimbingan: '',
        rencana_tindak_lanjut: '',
        status_santri: 'membaik',
        lanjut_sesi_berikutnya: true,
    });

    const completeForm = useForm({
        catatan_penutup: '',
    });

    const handleApprove = () => {
        if (confirm('Approve laporan ini dan mulai sesi bimbingan?')) {
            router.post(route('expert-system-konselor.approve', laporan.id));
        }
    };

    const handleSubmitSesi = (e) => {
        e.preventDefault();
        post(route('expert-system-konselor.sesi.store', laporan.id), {
            onSuccess: () => {
                reset();
                setShowSesiForm(false);
            }
        });
    };

    const handleComplete = (e) => {
        e.preventDefault();
        completeForm.post(route('expert-system-konselor.complete', laporan.id), {
            onSuccess: () => {
                setShowCompleteModal(false);
            }
        });
    };

    const handleDiscontinue = () => {
        if (confirm('Hentikan laporan konseling ini? Tindakan tidak dapat dibatalkan.')) {
            router.delete(route('expert-system-konselor.destroy', laporan.id));
        }
    };

    const getStatusBadgeClass = (status) => {
        const classes = {
            'pending': 'bg-yellow-100 text-yellow-800 border-yellow-300',
            'in_progress': 'bg-blue-100 text-blue-800 border-blue-300',
            'completed': 'bg-green-100 text-green-800 border-green-300',
            'discontinued': 'bg-red-100 text-red-800 border-red-300'
        };
        return classes[status] || 'bg-gray-100 text-gray-800 border-gray-300';
    };

    const getStatusSantriBadge = (status) => {
        const badges = {
            'membaik': { class: 'bg-green-100 text-green-800 border-green-300', icon: '✅' },
            'stabil': { class: 'bg-blue-100 text-blue-800 border-blue-300', icon: '➡️' },
            'masih_bermasalah': { class: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: '⚠️' },
            'memburuk': { class: 'bg-red-100 text-red-800 border-red-300', icon: '❌' }
        };
        return badges[status] || { class: 'bg-gray-100 text-gray-800 border-gray-300', icon: '•' };
    };

    return (
        <AppLayout
            user={auth.user}
            header={
                <div className="flex justify-between items-center">
                    <div>
                        <Link 
                            href={route('expert-system-konselor.index')} 
                            className="text-indigo-600 hover:text-indigo-800 text-sm mb-2 inline-block"
                        >
                            ← Kembali ke List
                        </Link>
                        <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                            Detail Konseling - {laporan.santri?.santri_profile?.nama_lengkap}
                        </h2>
                    </div>
                    <span className={`px-4 py-2 text-sm font-medium rounded-full border ${getStatusBadgeClass(laporan.status)}`}>
                        {laporan.status_label}
                    </span>
                </div>
            }
        >
            <Head title={`Konseling - ${laporan.santri?.santri_profile?.nama_lengkap}`} />

            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">

                    {/* Action Buttons */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex gap-3 flex-wrap">
                            {laporan.status === 'pending' && (
                                <button
                                    onClick={handleApprove}
                                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
                                >
                                    ✅ Approve & Mulai Konseling
                                </button>
                            )}

                            {laporan.status === 'in_progress' && !laporan.is_max_sesi && (
                                <button
                                    onClick={() => setShowSesiForm(!showSesiForm)}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium"
                                >
                                    ➕ Tambah Sesi {laporan.sesi_bimbingan_terakhir + 1}
                                </button>
                            )}

                            {laporan.status === 'in_progress' && (
                                <button
                                    onClick={() => setShowCompleteModal(true)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
                                >
                                    ✓ Selesaikan Konseling
                                </button>
                            )}

                            {laporan.status !== 'completed' && laporan.status !== 'discontinued' && (
                                <button
                                    onClick={handleDiscontinue}
                                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium"
                                >
                                    🛑 Hentikan Konseling
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Progress Bar */}
                    {laporan.status !== 'pending' && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Progress Konseling</h3>
                            <div className="mb-2">
                                <div className="flex justify-between text-sm text-gray-600 mb-2">
                                    <span>Sesi {laporan.sesi_bimbingan_terakhir} dari 5</span>
                                    <span>{laporan.progress_percentage}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-4">
                                    <div 
                                        className={`h-4 rounded-full transition-all ${
                                            laporan.is_completed ? 'bg-green-600' : 'bg-blue-600'
                                        }`}
                                        style={{ width: `${laporan.progress_percentage}%` }}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2 mt-4">
                                {[1, 2, 3, 4, 5].map((num) => (
                                    <div
                                        key={num}
                                        className={`flex-1 h-2 rounded ${
                                            num <= laporan.sesi_bimbingan_terakhir
                                                ? 'bg-green-500'
                                                : 'bg-gray-200'
                                        }`}
                                        title={`Sesi ${num}`}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Form Tambah Sesi */}
                    {showSesiForm && laporan.status === 'in_progress' && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Form Sesi {laporan.sesi_bimbingan_terakhir + 1}
                                </h3>
                                <button
                                    onClick={() => setShowSesiForm(false)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    ✕
                                </button>
                            </div>

                            <form onSubmit={handleSubmitSesi} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tanggal Sesi *
                                    </label>
                                    <input
                                        type="date"
                                        value={data.tanggal_sesi}
                                        onChange={e => setData('tanggal_sesi', e.target.value)}
                                        max={new Date().toISOString().split('T')[0]}
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        required
                                    />
                                    {errors.tanggal_sesi && (
                                        <div className="text-red-600 text-sm mt-1">{errors.tanggal_sesi}</div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Catatan Sesi *
                                    </label>
                                    <textarea
                                        value={data.catatan_bk}
                                        onChange={e => setData('catatan_bk', e.target.value)}
                                        rows={4}
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        placeholder="Catatan hasil sesi konseling..."
                                        required
                                    />
                                    {errors.catatan_bk && (
                                        <div className="text-red-600 text-sm mt-1">{errors.catatan_bk}</div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Proses Bimbingan
                                    </label>
                                    <textarea
                                        value={data.proses_bimbingan}
                                        onChange={e => setData('proses_bimbingan', e.target.value)}
                                        rows={3}
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        placeholder="Metode atau proses yang dilakukan..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Rencana Tindak Lanjut
                                    </label>
                                    <textarea
                                        value={data.rencana_tindak_lanjut}
                                        onChange={e => setData('rencana_tindak_lanjut', e.target.value)}
                                        rows={3}
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        placeholder="Rencana untuk sesi berikutnya..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Status Santri *
                                    </label>
                                    <select
                                        value={data.status_santri}
                                        onChange={e => setData('status_santri', e.target.value)}
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        required
                                    >
                                        <option value="membaik">✅ Membaik</option>
                                        <option value="stabil">➡️ Stabil</option>
                                        <option value="masih_bermasalah">⚠️ Masih Bermasalah</option>
                                        <option value="memburuk">❌ Memburuk</option>
                                    </select>
                                    {errors.status_santri && (
                                        <div className="text-red-600 text-sm mt-1">{errors.status_santri}</div>
                                    )}
                                </div>

                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={data.lanjut_sesi_berikutnya}
                                        onChange={e => setData('lanjut_sesi_berikutnya', e.target.checked)}
                                        className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500 mr-2"
                                    />
                                    <label className="text-sm text-gray-700">
                                        Lanjut ke sesi berikutnya
                                    </label>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium disabled:opacity-50"
                                    >
                                        {processing ? 'Menyimpan...' : 'Simpan Sesi'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowSesiForm(false)}
                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                                    >
                                        Batal
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Data Santri */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Santri</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <div className="text-sm text-gray-600">Nama Lengkap</div>
                                <div className="font-medium text-gray-900">
                                    {laporan.santri?.santri_profile?.nama_lengkap || '-'}
                                </div>
                            </div>
                            <div>
                                <div className="text-sm text-gray-600">NISN</div>
                                <div className="font-medium text-gray-900">
                                    {laporan.santri?.santri_profile?.nisn || '-'}
                                </div>
                            </div>
                            <div>
                                <div className="text-sm text-gray-600">Jenis Kelamin</div>
                                <div className="font-medium text-gray-900">
                                    {laporan.santri?.santri_profile?.jenis_kelamin || '-'}
                                </div>
                            </div>
                            <div>
                                <div className="text-sm text-gray-600">Nama Wali</div>
                                <div className="font-medium text-gray-900">
                                    {laporan.santri?.santri_profile?.nama_wali || '-'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Diagnosis & Rekomendasi */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Diagnosis & Rekomendasi Sistem</h3>
                        
                        <div className="space-y-4">
                            <div>
                                <div className="text-sm text-gray-600 mb-1">Rule</div>
                                <div className="font-medium text-gray-900">
                                    {laporan.rule_kode} - {laporan.rule_kategori}
                                </div>
                            </div>

                            <div>
                                <div className="text-sm text-gray-600 mb-1">Kode Terpenuhi</div>
                                <div className="flex gap-2">
                                    {laporan.kode_terpenuhi.map((kode, index) => (
                                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-sm font-mono">
                                            {kode}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <div className="text-sm text-gray-600 mb-1">Diagnosis</div>
                                <div className="font-semibold text-gray-900 text-lg">
                                    {laporan.diagnosis_kode} - {laporan.diagnosis_nama}
                                </div>
                            </div>

                            {laporan.diagnosis_penjelasan && (
                                <div>
                                    <div className="text-sm text-gray-600 mb-1">Penjelasan</div>
                                    <div className="text-gray-700">
                                        {laporan.diagnosis_penjelasan}
                                    </div>
                                </div>
                            )}

                            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                                <div className="text-sm font-medium text-blue-800 mb-1">Rekomendasi Sistem</div>
                                <div className="text-blue-700">
                                    {laporan.rekomendasi_sistem}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Riwayat Sesi Bimbingan */}
                    {laporan.sesi_list && laporan.sesi_list.length > 0 && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Riwayat Sesi Bimbingan</h3>
                            
                            <div className="space-y-4">
                                {laporan.sesi_list.map((sesi) => {
                                    const statusBadge = getStatusSantriBadge(sesi.status_santri);
                                    return (
                                        <div key={sesi.id} className="border border-gray-200 rounded-lg p-4">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <h4 className="font-semibold text-gray-900">
                                                        Sesi {sesi.sesi_ke}
                                                    </h4>
                                                    <div className="text-sm text-gray-600">
                                                        {new Date(sesi.tanggal_sesi).toLocaleDateString('id-ID', {
                                                            weekday: 'long',
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric'
                                                        })}
                                                    </div>
                                                </div>
                                                <span className={`px-3 py-1 text-sm font-medium rounded-full border ${statusBadge.class}`}>
                                                    {statusBadge.icon} {sesi.status_santri_label}
                                                </span>
                                            </div>

                                            <div className="space-y-3">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-700 mb-1">Catatan Sesi</div>
                                                    <div className="text-gray-900 bg-gray-50 p-3 rounded">
                                                        {sesi.catatan_bk}
                                                    </div>
                                                </div>

                                                {sesi.proses_bimbingan && (
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-700 mb-1">Proses Bimbingan</div>
                                                        <div className="text-gray-700">
                                                            {sesi.proses_bimbingan}
                                                        </div>
                                                    </div>
                                                )}

                                                {sesi.rencana_tindak_lanjut && (
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-700 mb-1">Rencana Tindak Lanjut</div>
                                                        <div className="text-gray-700">
                                                            {sesi.rencana_tindak_lanjut}
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex items-center gap-2 text-sm">
                                                    {sesi.lanjut_sesi_berikutnya ? (
                                                        <span className="text-blue-600">➡️ Dilanjutkan ke sesi berikutnya</span>
                                                    ) : (
                                                        <span className="text-green-600">✓ Selesai di sesi ini</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Catatan Kolaboratif */}
                    {laporan.catatan_kolaboratif && laporan.catatan_kolaboratif.length > 0 && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Catatan Kolaboratif</h3>
                            
                            <div className="space-y-4">
                                {laporan.catatan_kolaboratif.map((catatan) => (
                                    <div key={catatan.id} className="border-l-4 border-indigo-500 pl-4 py-2">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <div className="font-medium text-gray-900">{catatan.judul}</div>
                                                <div className="text-sm text-gray-600">
                                                    {catatan.author?.guru_bk_profile?.nama_lengkap || 
                                                     catatan.author?.tenaga_pendidik_profile?.nama_lengkap || 
                                                     'Unknown'} 
                                                    <span className="mx-1">•</span>
                                                    {catatan.author_role_label}
                                                    <span className="mx-1">•</span>
                                                    {new Date(catatan.created_at).toLocaleDateString('id-ID')}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-gray-700">
                                            {catatan.isi_catatan}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {/* Modal Complete */}
            {showCompleteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Selesaikan Konseling
                        </h3>
                        <form onSubmit={handleComplete}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Catatan Penutup *
                                </label>
                                <textarea
                                    value={completeForm.data.catatan_penutup}
                                    onChange={e => completeForm.setData('catatan_penutup', e.target.value)}
                                    rows={4}
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    placeholder="Ringkasan hasil konseling dan catatan penutup..."
                                    required
                                />
                                {completeForm.errors.catatan_penutup && (
                                    <div className="text-red-600 text-sm mt-1">
                                        {completeForm.errors.catatan_penutup}
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    disabled={completeForm.processing}
                                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium disabled:opacity-50"
                                >
                                    {completeForm.processing ? 'Menyimpan...' : 'Selesaikan'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowCompleteModal(false)}
                                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                                >
                                    Batal
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}