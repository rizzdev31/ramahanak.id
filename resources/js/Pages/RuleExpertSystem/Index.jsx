import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';
import PrimaryButton from '@/Components/PrimaryButton';

export default function Index({ auth, rules }) {

    const handleDelete = (id) => {
        if (confirm('Yakin ingin menghapus rule ini?')) {
            router.delete(route('rules.destroy', id));
        }
    };

    return (
        <AppLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800">Kelola Rule Expert System</h2>}
        >
            <Head title="Rule Expert System" />

            <div className="py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    {/* Header + Button Tambah */}
                    <div className="mb-6 flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Daftar Rule Forward Chaining</h3>
                            <p className="text-sm text-gray-500 mt-1">
                                Kelola aturan IF-THEN untuk sistem expert forward chaining
                            </p>
                        </div>
                        <Link href={route('rules.create')}>
                            <PrimaryButton>
                                + Tambah Rule
                            </PrimaryButton>
                        </Link>
                    </div>

                    {/* Info Box */}
                    <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="text-sm text-blue-800">
                                <p className="font-semibold mb-1">Tentang Rule Expert System:</p>
                                <p>Setiap rule menggunakan logika <strong>IF (premise) THEN (conclusion)</strong>. Premise adalah kombinasi variabel yang dihubungkan dengan AND, dan conclusion adalah diagnosis yang dihasilkan.</p>
                            </div>
                        </div>
                    </div>

                    {/* Tabel */}
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Kode Rule
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Kategori
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Logika IF (Premise)
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Logika THEN (Conclusion)
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {rules.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-8 text-center text-sm text-gray-500">
                                            Belum ada rule. Klik "Tambah Rule" untuk menambahkan.
                                        </td>
                                    </tr>
                                ) : (
                                    rules.map((rule) => (
                                        <tr key={rule.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-2 py-1 text-xs font-mono font-semibold bg-purple-100 text-purple-800 rounded">
                                                    {rule.kode_rule}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                                                    {rule.kategori}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-xs font-mono text-gray-700">
                                                    {rule.premise.join(' AND ')}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="px-2 py-1 text-xs font-mono font-semibold bg-indigo-100 text-indigo-800 rounded">
                                                        {rule.conclusion}
                                                    </span>
                                                    {rule.diagnosis && (
                                                        <span className="text-xs text-gray-600">
                                                            {rule.diagnosis.diagnosis}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                                <Link
                                                    href={route('rules.edit', rule.id)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                >
                                                    Edit
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(rule.id)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    Hapus
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}