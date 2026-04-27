import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';

export default function Create({ auth, variabelPelanggaran, variabelApresiasi, variabelKonselor, variabelDiagnosis }) {
    const [selectedPremise, setSelectedPremise] = useState([]);

    const { data, setData, post, processing, errors } = useForm({
        kode_rule: '',
        kategori: '',
        premise: [],
        conclusion: '',
    });

    // Toggle premise selection
    const togglePremise = (kode) => {
        const newSelection = selectedPremise.includes(kode)
            ? selectedPremise.filter(k => k !== kode)
            : [...selectedPremise, kode];
        
        setSelectedPremise(newSelection);
        setData('premise', newSelection);
    };

    // Check if premise selected
    const isPremiseSelected = (kode) => selectedPremise.includes(kode);

    // Submit form
    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('rules.store'));
    };

    // Gabungkan semua variabel untuk premise
    const allVariables = [
        ...variabelPelanggaran.map(v => ({ kode: v.kode, label: `${v.kode} - ${v.kategori}`, type: 'P' })),
        ...variabelApresiasi.map(v => ({ kode: v.kode, label: `${v.kode} - ${v.kategori}`, type: 'A' })),
        ...variabelKonselor.map(v => ({ kode: v.kode, label: `${v.kode} - ${v.gangguan_mental}`, type: 'G' })),
    ];

    return (
        <AppLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800">Tambah Rule Expert System</h2>}
        >
            <Head title="Tambah Rule" />

            <div className="py-8">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white rounded-lg shadow p-6">
                        
                        <form onSubmit={handleSubmit} className="space-y-6">
                            
                            {/* Kode Rule */}
                            <div>
                                <InputLabel htmlFor="kode_rule" value="Kode Rule *" />
                                <TextInput
                                    id="kode_rule"
                                    value={data.kode_rule}
                                    onChange={(e) => setData('kode_rule', e.target.value)}
                                    className="mt-1 block w-full"
                                    placeholder="RA-01, RB-01, RC-01, dst"
                                    required
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    Format: RA (Korban), RB (Pelaku), RC (Internal) diikuti nomor
                                </p>
                                <InputError message={errors.kode_rule} className="mt-1" />
                            </div>

                            {/* Kategori */}
                            <div>
                                <InputLabel htmlFor="kategori" value="Kategori *" />
                                <TextInput
                                    id="kategori"
                                    value={data.kategori}
                                    onChange={(e) => setData('kategori', e.target.value)}
                                    className="mt-1 block w-full"
                                    placeholder="Korban, Pelaku, Internal, dst"
                                    required
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    Input manual untuk fleksibilitas kategori
                                </p>
                                <InputError message={errors.kategori} className="mt-1" />
                            </div>

                            {/* Logika IF (Premise) - Multi Select */}
                            <div>
                                <InputLabel value="Logika IF (Premise) *" />
                                <p className="text-xs text-gray-500 mt-1 mb-2">
                                    Pilih variabel yang akan dikombinasikan dengan operator AND
                                </p>
                                
                                {/* Multi-select list dengan checkbox */}
                                <div className="mt-2 border border-gray-300 rounded-lg p-4 max-h-64 overflow-y-auto bg-gray-50">
                                    {allVariables.map((variable) => (
                                        <label
                                            key={variable.kode}
                                            className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                                                isPremiseSelected(variable.kode) 
                                                    ? 'bg-indigo-50 border border-indigo-200' 
                                                    : 'hover:bg-gray-100'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isPremiseSelected(variable.kode)}
                                                onChange={() => togglePremise(variable.kode)}
                                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <span className={`text-sm ${isPremiseSelected(variable.kode) ? 'font-medium text-indigo-900' : 'text-gray-700'}`}>
                                                {variable.label}
                                            </span>
                                        </label>
                                    ))}
                                </div>

                                {/* Preview Premise */}
                                {selectedPremise.length > 0 && (
                                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                                        <p className="text-xs font-semibold text-blue-800 mb-1">Preview Logika IF:</p>
                                        <p className="text-sm font-mono text-blue-900">
                                            {selectedPremise.join(' AND ')}
                                        </p>
                                    </div>
                                )}

                                <InputError message={errors.premise} className="mt-1" />
                            </div>

                            {/* Logika THEN (Conclusion) - Single Select */}
                            <div>
                                <InputLabel htmlFor="conclusion" value="Logika THEN (Conclusion) *" />
                                <select
                                    id="conclusion"
                                    value={data.conclusion}
                                    onChange={(e) => setData('conclusion', e.target.value)}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    required
                                >
                                    <option value="">-- Pilih Diagnosis --</option>
                                    {variabelDiagnosis.map((diag) => (
                                        <option key={diag.kode} value={diag.kode}>
                                            {diag.kode} - {diag.diagnosis}
                                        </option>
                                    ))}
                                </select>
                                <p className="mt-1 text-xs text-gray-500">
                                    Pilih diagnosis yang akan menjadi hasil dari rule ini
                                </p>
                                <InputError message={errors.conclusion} className="mt-1" />
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <Link href={route('rules.index')}>
                                    <SecondaryButton type="button">
                                        Batal
                                    </SecondaryButton>
                                </Link>
                                <PrimaryButton disabled={processing}>
                                    {processing ? 'Menyimpan...' : 'Simpan Rule'}
                                </PrimaryButton>
                            </div>
                        </form>

                    </div>
                </div>
            </div>
        </AppLayout>
    );
}