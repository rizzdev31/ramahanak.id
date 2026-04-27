import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Head, useForm } from '@inertiajs/react';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';

export default function VerifyKorban({ auth, hasil, variabelPelanggaranList, variabelKonselorList }) {
    const { data, setData, post, processing, errors } = useForm({
        has_kondisi_mental: false,
        verified_kode_konselor: hasil.kode_konselor_from_ner || [],  // ✅ Default dari NER
        catatan_verifikasi: '',
    });

    // Toggle kode konselor
    const toggleKodeKonselor = (kode) => {
        const current = [...data.verified_kode_konselor];
        const index = current.indexOf(kode);
        
        if (index > -1) {
            current.splice(index, 1);
        } else {
            current.push(kode);
        }
        
        setData('verified_kode_konselor', current);
    };

    // Handle submit
    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('hasil-preprocessing.store-verify-korban', hasil.id));
    };

    // Handle "Tidak Ada Gangguan"
    const handleTidakAdaGangguan = () => {
        if (!confirm('Yakin korban tidak mengalami kondisi mental/gangguan? Laporan konseling tidak akan dibuat.')) {
            return;
        }
        
        setData({
            ...data,
            has_kondisi_mental: false,
            verified_kode_konselor: [],
        });
        
        post(route('hasil-preprocessing.store-verify-korban', hasil.id));
    };

    return (
        <AppLayout
            user={auth.user}
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    ✅ Verifikasi Kondisi Korban
                </h2>
            }
        >
            <Head title="Verifikasi Korban" />

            <div className="py-8">
                <div className="max-w-5xl mx-auto sm:px-6 lg:px-8">

                    {/* Info Banner */}
                    <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="text-sm text-blue-800">
                                <p className="font-semibold mb-1">Verifikasi Diperlukan</p>
                                <p>Laporan ini melibatkan pelanggaran dengan korban. Silakan verifikasi apakah korban mengalami kondisi mental/gangguan yang memerlukan konseling.</p>
                            </div>
                        </div>
                    </div>

                    {/* Laporan Awal */}
                    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">📄 Laporan Awal</h3>
                        <div className="bg-gray-50 p-4 rounded border border-gray-200">
                            <p className="text-sm text-gray-700 leading-relaxed">
                                {hasil.laporan_awal.text_laporan}
                            </p>
                        </div>
                        <div className="mt-3 text-xs text-gray-500">
                            <span className="font-medium">Tanggal Kejadian:</span> {hasil.laporan_awal.tanggal_kejadian}
                        </div>
                    </div>

                    {/* Info Pelanggaran & Pihak Terlibat */}
                    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">⚠️ Detail Pelanggaran</h3>
                        
                        {/* Kode Pelanggaran */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Kode Pelanggaran Terdeteksi:</label>
                            <div className="flex flex-wrap gap-2">
                                {variabelPelanggaranList.map((v) => (
                                    <div key={v.kode} className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
                                        <p className="text-sm font-mono font-semibold text-red-800">{v.kode}</p>
                                        <p className="text-xs text-red-600">{v.kategori}</p>
                                        <p className="text-xs text-gray-600 mt-1">{v.poin} poin</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Pelaku & Korban */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Pelaku */}
                            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                                <h4 className="text-sm font-semibold text-red-900 mb-2">👤 Pelaku</h4>
                                {hasil.pelaku ? (
                                    <>
                                        <p className="text-sm font-medium text-gray-900">{hasil.pelaku.nama_lengkap}</p>
                                        <p className="text-xs text-gray-600">Panggilan: {hasil.pelaku.nama_panggilan}</p>
                                        <p className="text-xs text-gray-600">NISN: {hasil.pelaku.nisn}</p>
                                    </>
                                ) : (
                                    <p className="text-sm text-gray-500 italic">Tidak teridentifikasi</p>
                                )}
                            </div>

                            {/* Korban */}
                            <div className="bg-orange-50 p-4 rounded-lg border-2 border-orange-400">
                                <h4 className="text-sm font-semibold text-orange-900 mb-2">👥 Korban (Perlu Verifikasi)</h4>
                                {hasil.korban ? (
                                    <>
                                        <p className="text-base font-bold text-gray-900">{hasil.korban.nama_lengkap}</p>
                                        <p className="text-xs text-gray-600">Panggilan: {hasil.korban.nama_panggilan}</p>
                                        <p className="text-xs text-gray-600">NISN: {hasil.korban.nisn}</p>
                                    </>
                                ) : (
                                    <p className="text-sm text-gray-500 italic">Tidak teridentifikasi</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Form Verifikasi */}
                    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-6">🧠 Verifikasi Kondisi Mental Korban</h3>

                        {/* Toggle Kondisi Mental */}
                        <div className="mb-6">
                            <label className="flex items-center space-x-3 cursor-pointer p-4 bg-purple-50 border-2 border-purple-200 rounded-lg hover:bg-purple-100 transition">
                                <input
                                    type="checkbox"
                                    checked={data.has_kondisi_mental}
                                    onChange={(e) => setData('has_kondisi_mental', e.target.checked)}
                                    className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                />
                                <span className="flex-1">
                                    <span className="block text-sm font-semibold text-purple-900">
                                        Korban mengalami kondisi mental/gangguan yang memerlukan konseling
                                    </span>
                                    <span className="block text-xs text-purple-700 mt-1">
                                        Centang jika korban menunjukkan tanda-tanda seperti menangis, cemas, trauma, atau gangguan lainnya
                                    </span>
                                </span>
                            </label>
                            <InputError message={errors.has_kondisi_mental} className="mt-2" />
                        </div>

                        {/* Kode Konselor Selection (Conditional) */}
                        {data.has_kondisi_mental && (
                            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <InputLabel value="Pilih Kondisi yang Dialami Korban *" />
                                
                                {/* NER Detection Notice */}
                                {hasil.kode_konselor_from_ner.length > 0 && (
                                    <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded">
                                        <p className="text-xs text-blue-800">
                                            <strong>💡 Saran dari NER:</strong> Sistem mendeteksi kata kunci yang cocok dengan kode: {hasil.kode_konselor_from_ner.join(', ')}. 
                                            Kode ini sudah dicentang otomatis, Anda bisa menambah/mengurangi sesuai observasi langsung.
                                        </p>
                                    </div>
                                )}

                                <p className="text-xs text-gray-600 mb-3">
                                    Pilih satu atau lebih kondisi yang sesuai dengan observasi Anda terhadap korban:
                                </p>

                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {variabelKonselorList.map((v) => {
                                        const isFromNER = hasil.kode_konselor_from_ner.includes(v.kode);
                                        const isChecked = data.verified_kode_konselor.includes(v.kode);
                                        
                                        return (
                                            <label
                                                key={v.kode}
                                                className={`flex items-start p-3 border-2 rounded-lg cursor-pointer transition ${
                                                    isChecked 
                                                        ? 'bg-purple-50 border-purple-500' 
                                                        : 'bg-white border-gray-200 hover:border-purple-300'
                                                }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={() => toggleKodeKonselor(v.kode)}
                                                    className="mt-1 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                                />
                                                <div className="ml-3 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-mono font-semibold text-purple-800">
                                                            {v.kode}
                                                        </span>
                                                        {isFromNER && (
                                                            <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                                                                Terdeteksi NER
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm font-medium text-gray-900 mt-1">
                                                        {v.gangguan_mental}
                                                    </p>
                                                    <p className="text-xs text-gray-600 mt-1">
                                                        <strong>Gejala:</strong> {v.gejala}
                                                    </p>
                                                    <p className="text-xs text-purple-700 mt-1">
                                                        <strong>Rekomendasi:</strong> {v.rekomendasi}
                                                    </p>
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>

                                <InputError message={errors.verified_kode_konselor} className="mt-2" />
                            </div>
                        )}

                        {/* Catatan Verifikasi */}
                        <div className="mb-6">
                            <InputLabel htmlFor="catatan_verifikasi" value="Catatan Verifikasi (Opsional)" />
                            <textarea
                                id="catatan_verifikasi"
                                value={data.catatan_verifikasi}
                                onChange={(e) => setData('catatan_verifikasi', e.target.value)}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                                rows="4"
                                placeholder="Tambahkan observasi atau catatan tambahan tentang kondisi korban..."
                            />
                            <InputError message={errors.catatan_verifikasi} className="mt-2" />
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row justify-end gap-3">
                            <SecondaryButton
                                type="button"
                                onClick={() => window.history.back()}
                            >
                                ← Kembali
                            </SecondaryButton>
                            
                            <button
                                type="button"
                                onClick={handleTidakAdaGangguan}
                                disabled={processing}
                                className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                                ✓ Tidak Ada Gangguan
                            </button>
                            
                            <PrimaryButton disabled={processing || (!data.has_kondisi_mental && data.verified_kode_konselor.length === 0)}>
                                {processing ? 'Menyimpan...' : '💾 Simpan Verifikasi & Buat Laporan'}
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}