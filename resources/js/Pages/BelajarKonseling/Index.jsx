import { Head, Link } from '@inertiajs/react';

const WA_LINK = "https://wa.me/6281235738412";

const PublicNav = () => (
    <nav className="sticky top-0 z-50 bg-white/85 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
            <Link href="/" className="flex items-center">
                <img src="/images/Logo_RA.png" alt="RamahAnak.id" className="h-11 w-auto object-contain"
                    onError={e => e.target.style.display='none'} />
            </Link>
            <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-gray-500">
                <Link href="/" className="hover:text-teal-600 transition-colors">Beranda</Link>
                <Link href="/fitur" className="hover:text-teal-600 transition-colors">Fitur</Link>
                <Link href="/belajar-konseling" className="text-teal-600">Belajar Konseling</Link>
                <Link href="/" className="hover:text-teal-600 transition-colors">Statistik</Link>
                <Link href="/" className="hover:text-teal-600 transition-colors">Bimbingan</Link>
                <Link href="/" className="hover:text-teal-600 transition-colors">Kerja Sama</Link>
            </div>
            <a href={WA_LINK} target="_blank" rel="noopener noreferrer"
                className="px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-bold hover:bg-teal-700 transition-all shadow-md">
                Hubungi Kami
            </a>
        </div>
    </nav>
);

export default function BelajarKonselingIndex({ artikels = [], kategoris = [] }) {
    return (
        <div className="font-sans min-h-screen bg-[#F7F8FC]">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=Lora:ital,wght@0,600;1,400;1,600&display=swap');
                * { font-family: 'Plus Jakarta Sans', sans-serif; }
                .font-display { font-family: 'Lora', serif; }
                .mesh { background: radial-gradient(at 20% 10%, #DCFCE7 0%, transparent 50%), radial-gradient(at 85% 85%, #DBEAFE 0%, transparent 50%), #F7F8FC; }
                .line-clamp-2 { display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
                .line-clamp-3 { display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; }
                .card-hover { transition: transform 0.25s ease, box-shadow 0.25s ease; }
                .card-hover:hover { transform: translateY(-3px); box-shadow: 0 20px 40px rgba(0,0,0,0.08); }
            `}</style>

            <PublicNav />
            <Head title="Belajar Konseling  RamahAnak.id" />

            {/* Hero */}
            <section className="mesh py-14 lg:py-20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-teal-50 border border-teal-200 rounded-full text-xs font-bold text-teal-700 mb-5">
                        PUSAT PENGETAHUAN KONSELING
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-black text-gray-900 leading-tight mb-4">
                        Belajar{' '}
                        <span className="font-display italic" style={{background:'linear-gradient(135deg,#0F766E,#7C3AED)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>
                            Konseling
                        </span>
                    </h1>
                    <p className="text-gray-500 text-base leading-relaxed max-w-xl mx-auto">
                        Artikel, panduan, dan pengetahuan praktis seputar bimbingan konseling,
                        kesehatan mental remaja, dan pembinaan santri di pesantren.
                    </p>
                </div>
            </section>

            {/* Kategori pills */}
            {kategoris.length > 0 && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex gap-2 flex-wrap">
                        <span className="px-4 py-2 bg-teal-600 text-white rounded-full text-xs font-bold">Semua</span>
                        {kategoris.map(k => (
                            <span key={k} className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-full text-xs font-semibold hover:border-teal-300 hover:text-teal-700 cursor-pointer transition-all">
                                {k}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Grid Artikel */}
            <section className="py-8 pb-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {artikels.length === 0 ? (
                        /* Empty state placeholder dengan artikel dummy */
                        <div>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {artikels.map((a, i) => (
                                <ArticleCard key={i} artikel={a} />
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* CTA */}
            <section className="py-16 bg-white border-t border-gray-100">
                <div className="max-w-2xl mx-auto px-4 text-center">
                    <h3 className="text-2xl font-black text-gray-900 mb-3">Ada Pertanyaan Seputar Konseling?</h3>
                    <p className="text-gray-500 text-sm mb-6">Tim kami siap membantu mendiskusikan implementasi sistem konseling di pesantren Anda.</p>
                    <a href={WA_LINK} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-7 py-3.5 bg-teal-600 text-white rounded-xl font-bold text-sm hover:bg-teal-700 transition-all shadow-lg">
                        Konsultasi via WhatsApp
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </a>
                </div>
            </section>

            <footer className="bg-gray-950 text-gray-500 py-8 text-center text-xs">
                <p>&copy; 2026 RamahAnak.id  Pondok Pesantren Muhammadiyah An-Nur Sidoarjo</p>
            </footer>
        </div>
    );
}

//  Article Card Component 
function ArticleCard({ artikel }) {
    const KATEGORI_COLOR = {
        'Kesehatan Mental':  'bg-violet-100 text-violet-700',
        'Panduan BK':        'bg-teal-100 text-teal-700',
        'Kasus Khusus':      'bg-red-100 text-red-700',
        'Manajemen Santri':  'bg-amber-100 text-amber-700',
    };
    const catColor = KATEGORI_COLOR[artikel.kategori] || 'bg-gray-100 text-gray-600';
    const href = `/belajar-konseling/${artikel.slug}`;

    return (
        <Link href={href} className="card-hover group block bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {/* Thumbnail */}
            <div className="relative h-44 bg-gradient-to-br from-teal-50 to-cyan-100 overflow-hidden">
                {artikel.gambar_utama ? (
                    <img src={artikel.gambar_utama} alt={artikel.judul}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-16 h-16 text-teal-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                    </div>
                )}
                <div className="absolute top-3 left-3">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${catColor}`}>
                        {artikel.kategori}
                    </span>
                </div>
            </div>

            {/* Content */}
            <div className="p-5">
                <h3 className="font-black text-gray-900 text-sm leading-snug mb-2 line-clamp-2 group-hover:text-teal-700 transition-colors">
                    {artikel.judul}
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed line-clamp-3 mb-4">
                    {artikel.ringkasan}
                </p>
                <div className="flex items-center justify-between text-[10px] text-gray-400 font-medium border-t border-gray-100 pt-3">
                    <span>{artikel.tanggal}</span>
                    <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {artikel.estimasi_baca}
                    </span>
                </div>
            </div>
        </Link>
    );
}