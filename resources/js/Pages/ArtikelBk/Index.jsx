import { useState } from 'react';
import GuruBkLayout from '@/Layouts/GuruBk/GuruBkLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';

const STATUS_CFG = {
    draft:     { label: 'Draft',     bg: 'bg-amber-100',   text: 'text-amber-800'   },
    published: { label: 'Published', bg: 'bg-emerald-100', text: 'text-emerald-800' },
    archived:  { label: 'Archived',  bg: 'bg-gray-100',    text: 'text-gray-600'    },
};

export default function ArtikelBkIndex({ auth, artikels, kategoris, filters }) {
    const { flash } = usePage().props;

    const [search,   setSearch]   = useState(filters?.search   || '');
    const [status,   setStatus]   = useState(filters?.status   || 'all');
    const [kategori, setKategori] = useState(filters?.kategori || 'all');

    const handleFilter = () =>
        router.get(route('artikel-bk.index'), { search, status, kategori }, { preserveState: true });

    const handleReset = () => {
        setSearch(''); setStatus('all'); setKategori('all');
        router.get(route('artikel-bk.index'));
    };

    const handleDelete = (id, judul) => {
        if (!confirm(`Hapus artikel "${judul}"? Tindakan ini tidak bisa dibatalkan.`)) return;
        router.delete(route('artikel-bk.destroy', id), { preserveScroll: true });
    };

    const handleToggle = (id) => {
        router.post(route('artikel-bk.toggle-publish', id), {}, { preserveScroll: true });
    };

    const selectCls = 'text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition shadow-sm px-3 py-2';

    return (
        <GuruBkLayout user={auth.user} header="Artikel Belajar Konseling">
            <Head title="Kelola Artikel BK" />

            <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-5">

                {/* Flash */}
                {flash?.success && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl px-4 py-3 text-sm font-semibold">
                        {flash.success}
                    </div>
                )}

                {/* Header */}
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-black text-gray-900">Artikel Belajar Konseling</h2>
                        <p className="text-xs text-gray-400 mt-0.5">Kelola artikel yang tampil di halaman publik</p>
                    </div>
                    <Link href={route('artikel-bk.create')}
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-md">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Buat Artikel Baru
                    </Link>
                </div>

                {/* Filter */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                    <div className="flex flex-wrap gap-3 items-end">
                        <div className="flex-1 min-w-[180px]">
                            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Cari</label>
                            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleFilter()}
                                placeholder="Judul artikel..."
                                className={selectCls + ' w-full'} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Status</label>
                            <select value={status} onChange={e => setStatus(e.target.value)} className={selectCls}>
                                <option value="all">Semua</option>
                                <option value="draft">Draft</option>
                                <option value="published">Published</option>
                                <option value="archived">Archived</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Kategori</label>
                            <select value={kategori} onChange={e => setKategori(e.target.value)} className={selectCls}>
                                <option value="all">Semua</option>
                                {kategoris.map(k => <option key={k} value={k}>{k}</option>)}
                            </select>
                        </div>
                        <button onClick={handleFilter}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition">
                            Filter
                        </button>
                        <button onClick={handleReset}
                            className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition">
                            Reset
                        </button>
                    </div>
                </div>

                {/* Tabel */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50/80">
                                    {['Artikel','Kategori','Media','Views','Status','Diedit','Aksi'].map(h => (
                                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {artikels.data.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="py-16 text-center">
                                            <div className="flex flex-col items-center gap-2 text-gray-400">
                                                <svg className="w-10 h-10 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                <p className="font-semibold text-sm">Belum ada artikel</p>
                                                <Link href={route('artikel-bk.create')} className="text-indigo-600 text-xs font-semibold hover:underline">
                                                    Buat artikel pertama
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ) : artikels.data.map((a, idx) => {
                                    const sc = STATUS_CFG[a.status] ?? STATUS_CFG.draft;
                                    return (
                                        <tr key={a.id} className={`border-b border-gray-50 hover:bg-indigo-50/20 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                                            {/* Artikel */}
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    {/* Thumbnail mini */}
                                                    <div className="w-12 h-9 rounded-lg overflow-hidden bg-gradient-to-br from-indigo-50 to-violet-100 shrink-0">
                                                        {a.gambar_utama_url ? (
                                                            <img src={a.gambar_utama_url} alt={a.judul}
                                                                className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-indigo-300">
                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                                                                </svg>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900 text-sm max-w-[200px] truncate">{a.judul}</p>
                                                        <p className="text-[10px] text-gray-400 font-mono mt-0.5">{a.slug}</p>
                                                        <p className="text-[10px] text-gray-400">{a.estimasi_baca}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            {/* Kategori */}
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full">{a.kategori}</span>
                                            </td>
                                            {/* Media */}
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="flex items-center gap-2 text-[10px] text-gray-500 font-semibold">
                                                    {a.gambar_count > 0 && <span className="flex items-center gap-1"> {a.gambar_count}</span>}
                                                    {a.media_links_count > 0 && <span className="flex items-center gap-1"> {a.media_links_count}</span>}
                                                    {a.gambar_count === 0 && a.media_links_count === 0 && <span className="text-gray-300">-</span>}
                                                </div>
                                            </td>
                                            {/* Views */}
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className="text-sm font-bold text-gray-700">{a.view_count}</span>
                                            </td>
                                            {/* Status */}
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${sc.bg} ${sc.text}`}>
                                                    {sc.label}
                                                </span>
                                            </td>
                                            {/* Tanggal */}
                                            <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-400">{a.updated_at}</td>
                                            {/* Aksi */}
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <Link href={route('artikel-bk.edit', a.id)}
                                                        className="text-xs font-semibold text-indigo-600 hover:underline">
                                                        Edit
                                                    </Link>
                                                    <button onClick={() => handleToggle(a.id)}
                                                        className={`text-xs font-semibold ${a.status === 'published' ? 'text-amber-600' : 'text-emerald-600'} hover:underline`}>
                                                        {a.status === 'published' ? 'Unpublish' : 'Publish'}
                                                    </button>
                                                    <a href={`/belajar-konseling/${a.slug}`} target="_blank" rel="noopener noreferrer"
                                                        className="text-xs font-semibold text-teal-600 hover:underline">
                                                        Lihat
                                                    </a>
                                                    <button onClick={() => handleDelete(a.id, a.judul)}
                                                        className="text-xs font-semibold text-red-500 hover:underline">
                                                        Hapus
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {artikels.links?.length > 3 && (
                        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/60 flex items-center justify-between gap-2 flex-wrap">
                            <p className="text-xs text-gray-400">
                                {artikels.from}-{artikels.to} dari <span className="font-semibold text-gray-600">{artikels.total}</span> artikel
                            </p>
                            <div className="flex gap-1">
                                {artikels.links.map((link, i) => (
                                    <button key={i} onClick={() => link.url && router.get(link.url)} disabled={!link.url}
                                        className={`px-3 py-1 rounded-lg text-xs font-medium transition ${link.active ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'} ${!link.url ? 'opacity-40 cursor-not-allowed' : ''}`}
                                        dangerouslySetInnerHTML={{ __html: link.label }} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </GuruBkLayout>
    );
}