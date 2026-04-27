import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Head, useForm } from '@inertiajs/react';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';

export default function Create({ auth, tahunAjaranAktif }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        text_laporan: '',
        jenis_laporan: 'pelanggaran',
        tanggal_kejadian: new Date().toISOString().split('T')[0],
        waktu_kejadian: '',
        lokasi_kejadian: '',
    });

    const [charCount, setCharCount] = useState(0);

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('laporan.store'), {
            onSuccess: () => {
                reset();
                setCharCount(0);
            },
        });
    };

    const handleTextChange = (e) => {
        const value = e.target.value;
        setData('text_laporan', value);
        setCharCount(value.length);
    };

    return (
        <AppLayout
            user={auth.user}
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Buat Laporan Baru
                </h2>
            }
        >
            <Head title="Buat Laporan" />

            <div className="py-8">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    
                    {/* Info Card */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <div className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <div>
                                <h3 className="text-sm font-semibold text-blue-900 mb-1">
                                    Panduan Membuat Laporan
                                </h3>
                                <ul className="text-sm text-blue-800 space-y-1">
                                    <li>• Tulis laporan dengan jelas dan detail (minimal 20 karakter)</li>
                                    <li>• Sebutkan nama pelaku/individu yang terlibat jika ada</li>
                                    <li>• Jelaskan kejadian dengan objektif tanpa asumsi</li>
                                    <li>• Laporan akan divalidasi oleh Guru BK terlebih dahulu</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Form Card */}
                    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            
                            {/* Jenis Laporan */}
                            <div>
                                <InputLabel htmlFor="jenis_laporan" value="Jenis Laporan *" />
                                <select
                                    id="jenis_laporan"
                                    value={data.jenis_laporan}
                                    onChange={(e) => setData('jenis_laporan', e.target.value)}
                                    className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                >
                                    <option value="pelanggaran">Pelanggaran (Tindakan Negatif)</option>
                                    <option value="apresiasi">Apresiasi (Tindakan Positif)</option>
                                    <option value="kondisi_mental">Kondisi Mental (Psikologis)</option>
                                    <option value="lainnya">Lainnya</option>
                                </select>
                                <p className="mt-1 text-xs text-gray-500">
                                    Pilih kategori yang paling sesuai dengan kejadian
                                </p>
                                <InputError message={errors.jenis_laporan} className="mt-2" />
                            </div>

                            {/* Text Laporan */}
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <InputLabel htmlFor="text_laporan" value="Isi Laporan *" />
                                    <span className={`text-xs ${charCount < 20 ? 'text-red-500' : 'text-green-600'}`}>
                                        {charCount} / 20 karakter minimum
                                    </span>
                                </div>
                                <textarea
                                    id="text_laporan"
                                    value={data.text_laporan}
                                    onChange={handleTextChange}
                                    rows={8}
                                    className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                    placeholder="Contoh: Saya melihat Ahmad memukul Budi di bagian kepala saat istirahat di kelas. Budi terlihat menangis dan kesakitan..."
                                    required
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    Jelaskan kejadian secara detail: siapa, apa, kapan, di mana, dan bagaimana
                                </p>
                                <InputError message={errors.text_laporan} className="mt-2" />
                            </div>

                            {/* Tanggal & Waktu */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <InputLabel htmlFor="tanggal_kejadian" value="Tanggal Kejadian *" />
                                    <TextInput
                                        id="tanggal_kejadian"
                                        type="date"
                                        value={data.tanggal_kejadian}
                                        onChange={(e) => setData('tanggal_kejadian', e.target.value)}
                                        className="mt-1 block w-full"
                                        max={new Date().toISOString().split('T')[0]}
                                        required
                                    />
                                    <InputError message={errors.tanggal_kejadian} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="waktu_kejadian" value="Waktu Kejadian (Opsional)" />
                                    <TextInput
                                        id="waktu_kejadian"
                                        type="time"
                                        value={data.waktu_kejadian}
                                        onChange={(e) => setData('waktu_kejadian', e.target.value)}
                                        className="mt-1 block w-full"
                                    />
                                    <InputError message={errors.waktu_kejadian} className="mt-2" />
                                </div>
                            </div>

                            {/* Lokasi */}
                            <div>
                                <InputLabel htmlFor="lokasi_kejadian" value="Lokasi Kejadian (Opsional)" />
                                <TextInput
                                    id="lokasi_kejadian"
                                    type="text"
                                    value={data.lokasi_kejadian}
                                    onChange={(e) => setData('lokasi_kejadian', e.target.value)}
                                    className="mt-1 block w-full"
                                    placeholder="Contoh: Kelas 7A, Kantin, Asrama Putra, dll"
                                />
                                <InputError message={errors.lokasi_kejadian} className="mt-2" />
                            </div>

                            {/* Info Tahun Ajaran */}
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                    </svg>
                                    <span>Laporan akan dicatat untuk tahun ajaran: <strong>{tahunAjaranAktif}</strong></span>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="flex items-center justify-end gap-3 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={() => reset()}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                    disabled={processing}
                                >
                                    Reset
                                </button>
                                <PrimaryButton disabled={processing || charCount < 20}>
                                    {processing ? 'Mengirim...' : 'Kirim Laporan'}
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>

                    {/* Footer Note */}
                    <p className="text-center text-sm text-gray-500 mt-4">
                        Laporan Anda akan divalidasi oleh Guru BK sebelum diproses lebih lanjut
                    </p>
                </div>
            </div>
        </AppLayout>
    );
}