import React, { useState, useRef } from 'react';
import GuruBkLayout from '@/Layouts/GuruBk/GuruBkLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';

const KATEGORIS = ['Kesehatan Mental', 'Panduan BK', 'Kasus Khusus', 'Manajemen Santri', 'Umum'];

const TIPE_MEDIA = [
    { val: 'youtube',   label: 'YouTube'    },
    { val: 'instagram', label: 'Instagram'  },
    { val: 'tiktok',    label: 'TikTok'     },
    { val: 'facebook',  label: 'Facebook'   },
    { val: 'twitter',   label: 'Twitter / X'},
    { val: 'website',   label: 'Website'    },
];

const toSlug = (str) =>
    str.toLowerCase()
       .replace(/[^a-z0-9\s-]/g, '')
       .replace(/\s+/g, '-')
       .replace(/-+/g, '-')
       .trim();

const inputCls = 'w-full text-sm border border-gray-200 rounded-xl bg-gray-50 ' +
    'focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent ' +
    'transition shadow-sm px-3 py-2.5';

const ErrorMsg = ({ msg }) => msg
    ? <p className="text-red-500 text-xs mt-1">{msg}</p>
    : null;

const Label = ({ text, required, hint }) => (
    <div className="mb-1.5">
        <label className="text-xs font-bold text-gray-700">
            {text}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        {hint && <p className="text-[10px] text-gray-400 mt-0.5">{hint}</p>}
    </div>
);

const Card = ({ title, icon, accent = 'indigo', children }) => {
    const bars = { indigo:'bg-indigo-500', teal:'bg-teal-500', violet:'bg-violet-500', amber:'bg-amber-500' };
    const ics  = { indigo:'bg-indigo-50 text-indigo-600', teal:'bg-teal-50 text-teal-600', violet:'bg-violet-50 text-violet-600', amber:'bg-amber-50 text-amber-600' };
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className={`h-0.5 ${bars[accent]}`} />
            <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-3">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${ics[accent]}`}>{icon}</div>
                <h3 className="font-black text-gray-800 text-sm">{title}</h3>
            </div>
            <div className="p-5 space-y-4">{children}</div>
        </div>
    );
};

//  Mini Toolbar Editor 
function MiniEditor({ value, onChange }) {
    const textRef = React.useRef(null);

    const wrapSelection = (before, after) => {
        const ta = textRef.current;
        if (!ta) return;
        const start = ta.selectionStart;
        const end   = ta.selectionEnd;
        const sel   = ta.value.substring(start, end);
        const newVal = ta.value.substring(0, start) + before + sel + after + ta.value.substring(end);
        onChange(newVal);
        setTimeout(() => {
            ta.focus();
            ta.setSelectionRange(start + before.length, start + before.length + sel.length);
        }, 0);
    };

    const insertLine = (prefix) => {
        const ta = textRef.current;
        if (!ta) return;
        const start   = ta.selectionStart;
        const lineStart = ta.value.lastIndexOf('\n', start - 1) + 1;
        const lineEnd   = ta.value.indexOf('\n', start);
        const end       = lineEnd === -1 ? ta.value.length : lineEnd;
        const line      = ta.value.substring(lineStart, end);
        // Toggle: hapus prefix jika sudah ada
        const already = line.startsWith(prefix);
        const newLine  = already ? line.slice(prefix.length) : prefix + line;
        const newVal   = ta.value.substring(0, lineStart) + newLine + ta.value.substring(end);
        onChange(newVal);
        setTimeout(() => { ta.focus(); ta.setSelectionRange(lineStart + newLine.length, lineStart + newLine.length); }, 0);
    };

    const insertBlock = (html) => {
        const ta = textRef.current;
        if (!ta) return;
        const pos    = ta.selectionStart;
        const before = ta.value.substring(0, pos);
        const after  = ta.value.substring(pos);
        const newVal = before + (before.endsWith('\n') || before === '' ? '' : '\n') + html + '\n' + after;
        onChange(newVal);
        setTimeout(() => { ta.focus(); }, 0);
    };

    const btnCls = 'px-2.5 py-1.5 text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition cursor-pointer select-none';
    const sepCls = 'w-px h-5 bg-gray-200 mx-0.5';

    return (
        <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-1 px-2 py-2 bg-gray-50 border-b border-gray-200">
                {/* Heading */}
                <span
                    onClick={() => insertLine('<h2>')}
                    className={btnCls}
                    title="Judul bagian (H2)">
                    H2
                </span>
                <span
                    onClick={() => insertLine('<h3>')}
                    className={btnCls}
                    title="Sub-judul (H3)">
                    H3
                </span>
                <div className={sepCls} />
                {/* Format */}
                <span
                    onClick={() => wrapSelection('<strong>', '</strong>')}
                    className={btnCls + ' font-black'}
                    title="Tebal (Bold)">
                    B
                </span>
                <span
                    onClick={() => wrapSelection('<em>', '</em>')}
                    className={btnCls + ' italic'}
                    title="Miring (Italic)">
                    I
                </span>
                <span
                    onClick={() => wrapSelection('<u>', '</u>')}
                    className={btnCls + ' underline'}
                    title="Garis bawah">
                    U
                </span>
                <div className={sepCls} />
                {/* Block elements */}
                <span
                    onClick={() => insertBlock('<p>Tulis paragraf di sini...</p>')}
                    className={btnCls}
                    title="Sisipkan paragraf">
                    P
                </span>
                <span
                    onClick={() => insertBlock('<ul>\n  <li>Item pertama</li>\n  <li>Item kedua</li>\n</ul>')}
                    className={btnCls}
                    title="Sisipkan daftar">
                    ul
                </span>
                <span
                    onClick={() => insertBlock('<blockquote>Tulis kutipan di sini...</blockquote>')}
                    className={btnCls}
                    title="Sisipkan kutipan">
                    &ldquo;&rdquo;
                </span>
                <span
                    onClick={() => insertBlock('<hr/>')}
                    className={btnCls}
                    title="Garis pemisah">
                    --
                </span>
                <div className={sepCls} />
                {/* Link */}
                <span
                    onClick={() => wrapSelection('<a href="URL">', '</a>')}
                    className={btnCls}
                    title="Sisipkan link">
                    Link
                </span>
                {/* Preview toggle */}
                <div className="ml-auto text-[10px] text-gray-400 font-medium pr-1">HTML</div>
            </div>
            {/* Textarea */}
            <textarea
                ref={textRef}
                value={value}
                onChange={e => onChange(e.target.value)}
                rows={14}
                placeholder={'<h2>Judul Bagian</h2>\n<p>Isi paragraf pertama di sini dengan kalimat yang lengkap dan informatif.</p>\n\n<h2>Bagian Berikutnya</h2>\n<p>Lanjutan konten artikel...</p>\n\n<blockquote>Kutipan inspiratif di sini.</blockquote>'}
                className="w-full text-xs font-mono leading-relaxed resize-y bg-white text-gray-800 p-3 outline-none"
                style={{minHeight:'280px',borderRadius:0}} />
            {/* Preview strip */}
            {value && (
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">Preview</div>
                    <div
                        className="art-preview text-sm text-gray-700 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: value }}
                        style={{
                            maxHeight:'120px', overflow:'hidden',
                            maskImage:'linear-gradient(to bottom, black 60%, transparent 100%)',
                            WebkitMaskImage:'linear-gradient(to bottom, black 60%, transparent 100%)',
                        }} />
                </div>
            )}
        </div>
    );
}


export default function ArtikelBkForm({ auth, mode = 'create', artikel = null }) {
    const isEdit = mode === 'edit';

    // FIX 1: Hapus _method dari useForm  route sudah POST bukan PUT
    const { data, setData, processing, errors } = useForm({
        judul:              artikel?.judul            ?? '',
        slug:               artikel?.slug             ?? '',
        kategori:           artikel?.kategori         ?? 'Umum',
        ringkasan:          artikel?.ringkasan        ?? '',
        konten:             artikel?.konten           ?? '',
        tags:               artikel?.tags             ?? '',
        meta_description:   artikel?.meta_description ?? '',
        meta_keywords:      artikel?.meta_keywords    ?? '',
        gambar_utama_alt:   artikel?.gambar_utama_alt ?? '',
        status:             artikel?.status           ?? 'draft',
        gambar_utama:       null,
        // FIX 2: gallery sebagai array file  dikelola via state terpisah
        media_links_json:   JSON.stringify(artikel?.media_links ?? []),
        hapus_gambar:       JSON.stringify([]),
    });

    // State gallery: [{id, url, file, keterangan, existing}]
    const [gallery, setGallery] = useState(
        (artikel?.gambar ?? []).map(g => ({
            id: g.id, url: g.file_url, file: null, keterangan: g.keterangan ?? '', existing: true
        }))
    );

    // State media links  dikelola local, dikirim sebagai JSON string
    const [mediaLinks, setMediaLinks] = useState(
        (artikel?.media_links ?? []).map(m => ({
            tipe: m.tipe ?? 'youtube', url: m.url ?? '', judul: m.judul ?? ''
        }))
    );

    const [thumbnailPreview, setThumbnailPreview] = useState(artikel?.gambar_utama_url ?? null);
    const [slugLocked, setSlugLocked] = useState(isEdit);

    const thumbnailRef = useRef();
    // FIX 3: satu ref per slot gallery (maks 4)
    const galleryRefs  = [useRef(), useRef(), useRef(), useRef()];

    //  Handlers 
    const handleJudul = (val) => {
        setData(d => ({
            ...d,
            judul: val,
            slug: slugLocked ? d.slug : toSlug(val),
            meta_description: d.meta_description || val.substring(0, 155),
        }));
    };

    const handleThumbnail = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setData('gambar_utama', file);
        setThumbnailPreview(URL.createObjectURL(file));
    };

    // FIX 4: Gallery  tiap slot punya input sendiri, bisa accumulate
    const handleGallerySlot = (slotIdx, e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        setGallery(prev => {
            const next = [...prev];
            if (slotIdx < next.length) {
                // Ganti slot existing
                next[slotIdx] = { ...next[slotIdx], file, url, existing: false };
            } else {
                // Tambah slot baru
                next.push({ id: null, url, file, keterangan: '', existing: false });
            }
            return next;
        });
    };

    const handleAddGallerySlot = () => {
        if (gallery.length >= 4) return;
        const idx = gallery.length;
        // Trigger input file slot baru
        setTimeout(() => galleryRefs[idx]?.current?.click(), 50);
        setGallery(prev => [...prev, { id: null, url: null, file: null, keterangan: '', existing: false, placeholder: true }]);
    };

    const removeGallery = (idx) => {
        const item = gallery[idx];
        if (item.existing && item.id) {
            const hapus = JSON.parse(data.hapus_gambar || '[]');
            hapus.push(item.id);
            setData('hapus_gambar', JSON.stringify(hapus));
        }
        setGallery(prev => prev.filter((_, i) => i !== idx));
    };

    const updateKeterangan = (idx, val) => {
        setGallery(prev => prev.map((g, i) => i === idx ? { ...g, keterangan: val } : g));
    };

    // FIX 5: Media links dikelola state, dikirim sebagai JSON string
    const addMediaLink = () => {
        const updated = [...mediaLinks, { tipe: 'youtube', url: '', judul: '' }];
        setMediaLinks(updated);
        setData('media_links_json', JSON.stringify(updated));
    };
    const removeMediaLink = (i) => {
        const updated = mediaLinks.filter((_, idx) => idx !== i);
        setMediaLinks(updated);
        setData('media_links_json', JSON.stringify(updated));
    };
    const updateMediaLink = (i, field, val) => {
        const updated = mediaLinks.map((ml, idx) => idx === i ? { ...ml, [field]: val } : ml);
        setMediaLinks(updated);
        setData('media_links_json', JSON.stringify(updated));
    };

    //  Submit 
    const handleSubmit = (e, overrideStatus) => {
        if (e && e.preventDefault) e.preventDefault();

        // FIX 6: Bangun FormData manual agar bisa kirim multiple files
        const fd = new FormData();

        // Fields teks
        fd.append('judul',            data.judul);
        fd.append('slug',             data.slug);
        fd.append('kategori',         data.kategori);
        fd.append('ringkasan',        data.ringkasan    || '');
        fd.append('konten',           data.konten       || '');
        fd.append('tags',             data.tags         || '');
        fd.append('meta_description', data.meta_description || '');
        fd.append('meta_keywords',    data.meta_keywords    || '');
        fd.append('gambar_utama_alt', data.gambar_utama_alt || '');
        fd.append('status',           overrideStatus || data.status);
        fd.append('media_links_json', data.media_links_json);
        fd.append('hapus_gambar',     data.hapus_gambar || '[]');

        // Gambar utama
        if (data.gambar_utama instanceof File) {
            fd.append('gambar_utama', data.gambar_utama);
        }

        // FIX 7: Gallery  kirim setiap file baru + keterangan semua slot
        gallery.forEach((g, i) => {
            if (g.file instanceof File) {
                fd.append(`gallery[${i}]`, g.file);
            }
            fd.append(`gallery_keterangan[${i}]`, g.keterangan || '');
        });
        // Kirim juga existing gallery ids agar controller tahu urutan
        const existingIds = gallery
            .filter(g => g.existing && g.id)
            .map(g => g.id);
        fd.append('existing_gallery_ids', JSON.stringify(existingIds));

        // FIX 8: Gunakan post() ke route POST  bukan PUT
        const routeName = isEdit
            ? route('artikel-bk.update', artikel.id)
            : route('artikel-bk.store');

        // router.post() support FormData langsung sebagai arg ke-2
        router.post(routeName, fd, {
            forceFormData: true,
            preserveScroll: true,
            onError: (errors) => console.error('Submit errors:', errors),
        });
    };

    const totalGambar = gallery.length;

    return (
        <GuruBkLayout user={auth.user} header={isEdit ? 'Edit Artikel' : 'Buat Artikel Baru'}>
            <Head title={isEdit ? 'Edit Artikel' : 'Buat Artikel Baru'} />

            <div className="py-6 px-4 sm:px-6 max-w-5xl mx-auto">
                <style>{`
                    .art-preview h2{font-size:1rem;font-weight:700;color:#111827;margin:.5rem 0 .25rem}
                    .art-preview h3{font-size:.9rem;font-weight:700;margin:.4rem 0 .2rem}
                    .art-preview p{margin-bottom:.5rem}
                    .art-preview blockquote{border-left:3px solid #14B8A6;padding:.4rem .75rem;background:#F0FDFA;border-radius:0 6px 6px 0;font-style:italic;color:#0F766E;margin:.5rem 0}
                    .art-preview strong{font-weight:700}
                    .art-preview ul{padding-left:1.2rem}
                `}</style>

                {/* Breadcrumb */}
                <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-5">
                    <Link href={route('artikel-bk.index')} className="hover:text-indigo-600 font-medium transition">
                        Artikel BK
                    </Link>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="font-semibold text-gray-700">{isEdit ? 'Edit' : 'Artikel Baru'}</span>
                </nav>

                <form onSubmit={handleSubmit} className="space-y-5">

                    {/*  KONTEN  */}
                    <Card title="Konten Artikel" icon="P" accent="indigo">
                        <div>
                            <Label text="Judul Artikel" required hint="Maks 200 karakter." />
                            <input type="text" value={data.judul}
                                onChange={e => handleJudul(e.target.value)}
                                placeholder="Teknik Konseling Individual yang Efektif"
                                className={inputCls} maxLength={200} />
                            <div className="flex justify-between mt-1">
                                <ErrorMsg msg={errors.judul} />
                                <span className="text-[10px] text-gray-300 ml-auto">{data.judul.length}/200</span>
                            </div>
                        </div>

                        <div>
                            <Label text="Slug URL" hint="Auto-generate dari judul. Klik Edit untuk ubah manual." />
                            <div className="flex gap-2">
                                <div className="flex items-center px-3 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-xs text-gray-400 font-mono whitespace-nowrap">
                                    /belajar-konseling/
                                </div>
                                <input type="text" value={data.slug}
                                    onChange={e => setData('slug', toSlug(e.target.value))}
                                    readOnly={!slugLocked}
                                    className={`${inputCls} flex-1 font-mono text-xs ${!slugLocked ? 'bg-gray-100 text-gray-400' : ''}`} />
                                <button type="button"
                                    onClick={() => setSlugLocked(!slugLocked)}
                                    className="px-3 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 transition whitespace-nowrap">
                                    {slugLocked ? 'Edit' : 'Kunci'}
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label text="Kategori" required />
                                <select value={data.kategori}
                                    onChange={e => setData('kategori', e.target.value)}
                                    className={inputCls}>
                                    {KATEGORIS.map(k => <option key={k} value={k}>{k}</option>)}
                                </select>
                            </div>
                            <div>
                                <Label text="Status" required />
                                <select value={data.status}
                                    onChange={e => setData('status', e.target.value)}
                                    className={inputCls}>
                                    <option value="draft">Draft</option>
                                    <option value="published">Published</option>
                                    <option value="archived">Archived</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <Label text="Ringkasan" hint="Maks 500 karakter  tampil di card artikel." />
                            <textarea value={data.ringkasan}
                                onChange={e => setData('ringkasan', e.target.value)}
                                rows={3} maxLength={500}
                                placeholder="Ringkasan singkat yang menarik perhatian pembaca..."
                                className={inputCls + ' resize-none'} />
                            <div className="flex justify-between mt-1">
                                <ErrorMsg msg={errors.ringkasan} />
                                <span className="text-[10px] text-gray-300 ml-auto">{(data.ringkasan||'').length}/500</span>
                            </div>
                        </div>

                        <div>
                            <Label text="Konten Artikel" hint="Klik tombol format lalu ketik, atau blok teks lalu klik tombol." />
                            <MiniEditor value={data.konten} onChange={v => setData('konten', v)} />
                        </div>

                        <div>
                            <Label text="Tags" hint="Pisahkan dengan koma  cth: konseling, remaja, pesantren" />
                            <input type="text" value={data.tags}
                                onChange={e => setData('tags', e.target.value)}
                                placeholder="konseling, kesehatan mental, santri"
                                className={inputCls} />
                        </div>
                    </Card>

                    {/*  GAMBAR  */}
                    <Card title="Gambar Artikel" icon="G" accent="teal">

                        {/* Thumbnail */}
                        <div>
                            <Label text="Gambar Utama (Thumbnail)"
                                hint="Format: JPG, PNG, WebP. Maks 2MB. Rasio 16:9 disarankan." />
                            <div className="flex gap-4 items-start">
                                <div
                                    onClick={() => thumbnailRef.current?.click()}
                                    className="w-40 h-28 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden cursor-pointer hover:border-teal-400 transition-colors shrink-0 bg-gray-50">
                                    {thumbnailPreview
                                        ? <img src={thumbnailPreview} alt="preview" className="w-full h-full object-cover" />
                                        : <div className="text-center text-gray-400 text-xs">Klik upload</div>
                                    }
                                </div>
                                <div className="flex-1">
                                    <input ref={thumbnailRef} type="file"
                                        accept="image/jpg,image/jpeg,image/png,image/webp"
                                        onChange={handleThumbnail} className="hidden" />
                                    <div className="flex gap-2 mb-3">
                                        <button type="button"
                                            onClick={() => thumbnailRef.current?.click()}
                                            className="px-4 py-2 bg-teal-50 border border-teal-200 text-teal-700 rounded-xl text-sm font-semibold hover:bg-teal-100 transition">
                                            Pilih Gambar
                                        </button>
                                        {thumbnailPreview && (
                                            <button type="button"
                                                onClick={() => { setThumbnailPreview(null); setData('gambar_utama', null); }}
                                                className="px-3 py-2 text-red-600 text-xs font-semibold hover:underline">
                                                Hapus
                                            </button>
                                        )}
                                    </div>
                                    <div>
                                        <Label text="Alt Text" hint="Deskripsi gambar untuk SEO." />
                                        <input type="text" value={data.gambar_utama_alt}
                                            onChange={e => setData('gambar_utama_alt', e.target.value)}
                                            placeholder="Guru BK sedang melakukan sesi konseling"
                                            className={inputCls} maxLength={120} />
                                    </div>
                                </div>
                            </div>
                            <ErrorMsg msg={errors.gambar_utama} />
                        </div>

                        {/* FIX: Gallery dengan slot individual */}
                        <div>
                            <Label text={`Gallery Foto (${totalGambar}/4)`}
                                hint="Maksimal 4 foto. Klik slot untuk ganti foto. Format JPG/PNG/WebP, maks 2MB." />

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                                {/* Render slot yang sudah ada */}
                                {gallery.map((g, i) => (
                                    <div key={i} className="relative group">
                                        <input
                                            ref={galleryRefs[i]}
                                            type="file"
                                            accept="image/jpg,image/jpeg,image/png,image/webp"
                                            onChange={e => handleGallerySlot(i, e)}
                                            className="hidden" />
                                        <div
                                            onClick={() => galleryRefs[i]?.current?.click()}
                                            className="aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200 cursor-pointer hover:border-teal-400 transition">
                                            {g.url
                                                ? <img src={g.url} alt={`gallery ${i+1}`} className="w-full h-full object-cover" />
                                                : <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">Klik upload</div>
                                            }
                                        </div>
                                        {/* Hapus tombol */}
                                        <button type="button"
                                            onClick={() => removeGallery(i)}
                                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs font-bold flex items-center justify-center hover:bg-red-600 transition opacity-0 group-hover:opacity-100">
                                            x
                                        </button>
                                        {/* Keterangan */}
                                        <input type="text"
                                            value={g.keterangan || ''}
                                            onChange={e => updateKeterangan(i, e.target.value)}
                                            placeholder={`Keterangan foto ${i+1}...`}
                                            className="mt-1.5 w-full text-[11px] border border-gray-200 rounded-lg px-2 py-1.5 bg-gray-50 focus:bg-white focus:ring-1 focus:ring-teal-400 transition" />
                                    </div>
                                ))}

                                {/* Slot tambah baru */}
                                {totalGambar < 4 && (
                                    <div>
                                        {/* Hidden input untuk slot baru */}
                                        {[0,1,2,3].map(i => (
                                            <input key={i}
                                                ref={i < gallery.length ? null : galleryRefs[i]}
                                                type="file"
                                                accept="image/jpg,image/jpeg,image/png,image/webp"
                                                onChange={e => handleGallerySlot(i, e)}
                                                className="hidden" />
                                        ))}
                                        <div
                                            onClick={handleAddGallerySlot}
                                            className="aspect-square rounded-xl border-2 border-dashed border-teal-200 flex flex-col items-center justify-center cursor-pointer hover:border-teal-400 hover:bg-teal-50 transition gap-1">
                                            <svg className="w-6 h-6 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                            </svg>
                                            <span className="text-xs text-teal-500 font-semibold">Tambah foto</span>
                                            <span className="text-[10px] text-gray-400">{4-totalGambar} slot tersisa</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>

                    {/*  MEDIA LINK  */}
                    <Card title="Link Video & Media Sosial" icon="L" accent="violet">
                        <p className="text-xs text-gray-500">
                            Tambahkan link YouTube, Instagram, TikTok, atau platform lain.
                            Link YouTube akan ditampilkan sebagai embed otomatis di artikel.
                        </p>

                        <div className="space-y-3">
                            {mediaLinks.map((ml, i) => (
                                <div key={i} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-xs font-bold text-gray-700">Link #{i+1}</span>
                                        <button type="button" onClick={() => removeMediaLink(i)}
                                            className="text-red-500 text-xs font-semibold hover:underline">
                                            Hapus
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                        <div>
                                            <Label text="Platform" />
                                            <select value={ml.tipe}
                                                onChange={e => updateMediaLink(i, 'tipe', e.target.value)}
                                                className={inputCls}>
                                                {TIPE_MEDIA.map(t => (
                                                    <option key={t.val} value={t.val}>{t.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <Label text="Judul / Label" hint="Opsional" />
                                            <input type="text" value={ml.judul}
                                                onChange={e => updateMediaLink(i, 'judul', e.target.value)}
                                                placeholder="Tips Konseling Santri"
                                                className={inputCls} />
                                        </div>
                                    </div>
                                    <div>
                                        <Label text="URL" required />
                                        <input type="url" value={ml.url}
                                            onChange={e => updateMediaLink(i, 'url', e.target.value)}
                                            placeholder={
                                                ml.tipe === 'youtube'   ? 'https://www.youtube.com/watch?v=...' :
                                                ml.tipe === 'instagram' ? 'https://www.instagram.com/p/...' :
                                                'https://...'
                                            }
                                            className={inputCls + ' font-mono text-xs'} />
                                        {ml.url && ml.tipe === 'youtube' && (
                                            <p className="text-[10px] text-emerald-600 mt-1 font-semibold">
                                                Video akan tampil sebagai embed otomatis
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button type="button" onClick={addMediaLink}
                            className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-violet-200 text-violet-600 rounded-xl text-sm font-semibold hover:border-violet-400 hover:bg-violet-50 transition w-full justify-center">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Tambah Link Media
                        </button>
                    </Card>

                    {/*  SEO  */}
                    <Card title="Pengaturan SEO" icon="S" accent="amber">
                        <div>
                            <Label text="Meta Description"
                                hint="Maks 160 karakter  tampil di hasil pencarian Google." />
                            <textarea value={data.meta_description}
                                onChange={e => setData('meta_description', e.target.value)}
                                rows={2} maxLength={160}
                                placeholder="Deskripsi singkat untuk mesin pencari..."
                                className={inputCls + ' resize-none'} />
                            <div className="flex justify-between mt-1">
                                <ErrorMsg msg={errors.meta_description} />
                                <span className={`text-[10px] ml-auto ${(data.meta_description||'').length > 155 ? 'text-red-400' : 'text-gray-300'}`}>
                                    {(data.meta_description||'').length}/160
                                </span>
                            </div>
                        </div>
                        <div>
                            <Label text="Meta Keywords" hint="Pisahkan koma. Maks 255 karakter." />
                            <input type="text" value={data.meta_keywords}
                                onChange={e => setData('meta_keywords', e.target.value)}
                                placeholder="konseling, pesantren, santri"
                                className={inputCls} maxLength={255} />
                        </div>
                        {(data.judul || data.meta_description) && (
                            <div className="bg-white border border-gray-200 rounded-xl p-4">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Preview Google</p>
                                <p className="text-blue-700 text-sm font-medium line-clamp-1">
                                    {data.judul || 'Judul Artikel'}  RamahAnak.id
                                </p>
                                <p className="text-green-700 text-[11px] mt-0.5">
                                    ramahaanak.id/belajar-konseling/{data.slug || 'slug-artikel'}
                                </p>
                                <p className="text-gray-600 text-xs mt-1 line-clamp-2">
                                    {data.meta_description || 'Deskripsi artikel akan muncul di sini...'}
                                </p>
                            </div>
                        )}
                    </Card>

                    {/*  ACTION  */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between gap-4 flex-wrap">
                        <Link href={route('artikel-bk.index')}>
                            <SecondaryButton type="button">Batal</SecondaryButton>
                        </Link>
                        <div className="flex gap-3">
                            <button type="button"
                                onClick={() => { setData('status','draft'); setTimeout(() => handleSubmit(null, 'draft'), 50); }}
                                disabled={processing}
                                className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition disabled:opacity-50">
                                Simpan Draft
                            </button>
                            <PrimaryButton disabled={processing}>
                                {processing ? 'Menyimpan...' : (isEdit ? 'Simpan Perubahan' : 'Publish Artikel')}
                            </PrimaryButton>
                        </div>
                    </div>

                </form>
            </div>
        </GuruBkLayout>
    );
}