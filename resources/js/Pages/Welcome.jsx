import { Head, Link } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';

//  Animated counter hook 
function useCounter(target, duration = 2000, start = false) {
    const [count, setCount] = useState(0);
    useEffect(() => {
        if (!start) return;
        let startTime = null;
        const step = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }, [start, target, duration]);
    return count;
}

//  Floating card component 
const FloatingCard = ({ icon, title, value, color, delay = 0 }) => (
    <div
        className="floating-card absolute bg-white rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3 border border-gray-100"
        style={{ animationDelay: `${delay}s` }}
    >
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold ${color}`}>
            {icon}
        </div>
        <div>
            <div className="text-xs text-gray-400 font-medium">{title}</div>
            <div className="text-sm font-bold text-gray-800">{value}</div>
        </div>
    </div>
);

//  Feature card 
const FeatureCard = ({ icon, title, desc, accent }) => (
    <div className={`feature-card group relative bg-white rounded-2xl p-6 border border-gray-100 hover:border-transparent hover:shadow-2xl transition-all duration-500 overflow-hidden`}>
        <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-500 ${accent}`} />
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${accent} text-white`}>
            {icon}
        </div>
        <h3 className="text-base font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
    </div>
);

//  Stat badge 
const StatBadge = ({ label, value, suffix = '', color }) => (
    <div className="text-center">
        <div className={`text-3xl font-black ${color}`}>{value}{suffix}</div>
        <div className="text-xs text-gray-500 mt-1 font-medium">{label}</div>
    </div>
);

//  Main component 
export default function Welcome({ auth, stats = {} }) {
    const [heroVisible, setHeroVisible] = useState(false);
    const [statsVisible, setStatsVisible] = useState(false);
    const [mobileMenu, setMobileMenu] = useState(false);
    const statsRef = useRef(null);

    const totalSesi      = stats.total_sesi      ?? 247;
    const totalSantri    = stats.total_santri     ?? 136;
    const totalBimbingan = stats.total_bimbingan  ?? 89;
    const akurasi        = stats.akurasi          ?? 100;

    const cSesi      = useCounter(totalSesi,      1800, statsVisible);
    const cSantri    = useCounter(totalSantri,    1600, statsVisible);
    const cBimbingan = useCounter(totalBimbingan, 2000, statsVisible);
    const cAkurasi   = useCounter(akurasi,        1200, statsVisible);

    useEffect(() => {
        setTimeout(() => setHeroVisible(true), 100);
        const obs = new IntersectionObserver(
            ([e]) => { if (e.isIntersecting) setStatsVisible(true); },
            { threshold: 0.3 }
        );
        if (statsRef.current) obs.observe(statsRef.current);
        return () => obs.disconnect();
    }, []);

    // Bimbingan aktif simulasi (bisa diganti dari props)
    const bimbinganAktif = stats.bimbingan_aktif ?? [
        { jenis: 'Konseling Individual',  jumlah: 12, warna: 'bg-violet-500', pct: 48 },
        { jenis: 'Bimbingan Kelompok',    jumlah: 7,  warna: 'bg-teal-500',   pct: 28 },
        { jenis: 'Konsultasi Akademik',   jumlah: 5,  warna: 'bg-amber-500',  pct: 20 },
        { jenis: 'Mediasi Konflik',       jumlah: 1,  warna: 'bg-red-400',    pct: 4  },
    ];

    return (
        <>
            <Head title="RamahAnak.id  Platform Konseling Pesantren" />

            <div className="font-sans min-h-screen bg-[#F7F8FC] text-gray-900">

                {/*  GLOBAL STYLES  */}
                <style>{`
                    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=Lora:ital,wght@0,400;0,600;1,400&display=swap');

                    * { font-family: 'Plus Jakarta Sans', sans-serif; }
                    .font-display { font-family: 'Lora', serif; }

                    @keyframes float {
                        0%,100% { transform: translateY(0px) rotate(0deg); }
                        33%     { transform: translateY(-10px) rotate(1deg); }
                        66%     { transform: translateY(-5px) rotate(-1deg); }
                    }
                    @keyframes slideUp {
                        from { opacity:0; transform:translateY(30px); }
                        to   { opacity:1; transform:translateY(0); }
                    }
                    @keyframes fadeIn {
                        from { opacity:0; }
                        to   { opacity:1; }
                    }
                    @keyframes pulse-ring {
                        0%   { transform:scale(0.9); opacity:0.6; }
                        100% { transform:scale(1.4); opacity:0; }
                    }
                    .floating-card {
                        animation: float 6s ease-in-out infinite;
                    }
                    .hero-enter { animation: slideUp 0.8s ease forwards; }
                    .hero-enter-delay-1 { animation: slideUp 0.8s 0.15s ease both; }
                    .hero-enter-delay-2 { animation: slideUp 0.8s 0.30s ease both; }
                    .hero-enter-delay-3 { animation: slideUp 0.8s 0.45s ease both; }
                    .hero-enter-delay-4 { animation: slideUp 0.8s 0.60s ease both; }
                    .feature-card { transition: transform 0.3s ease, box-shadow 0.3s ease; }
                    .feature-card:hover { transform: translateY(-4px); }
                    .pulse-ring::after {
                        content:''; position:absolute; inset:0; border-radius:50%;
                        border:3px solid currentColor; opacity:0.3;
                        animation: pulse-ring 2s ease-out infinite;
                    }
                    .mesh-bg {
                        background: radial-gradient(at 30% 20%, #DCFCE7 0%, transparent 50%),
                                    radial-gradient(at 80% 80%, #DBEAFE 0%, transparent 50%),
                                    radial-gradient(at 60% 40%, #EDE9FE 0%, transparent 40%),
                                    #F7F8FC;
                    }
                    .card-glass {
                        background: rgba(255,255,255,0.85);
                        backdrop-filter: blur(12px);
                        -webkit-backdrop-filter: blur(12px);
                    }
                    .text-gradient {
                        background: linear-gradient(135deg, #0F766E 0%, #0891B2 50%, #7C3AED 100%);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        background-clip: text;
                    }
                    .shimmer {
                        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                        background-size: 200% 100%;
                        animation: shimmer 1.5s infinite;
                    }
                    @keyframes shimmer {
                        0%  { background-position: -200% 0; }
                        100%{ background-position:  200% 0; }
                    }
                    .live-dot { animation: livePulse 1.5s ease-in-out infinite; }
                    @keyframes livePulse {
                        0%,100% { opacity:1; transform:scale(1); }
                        50%     { opacity:0.5; transform:scale(0.8); }
                    }
                `}</style>

                {/* 
                    NAVBAR
                 */}
                <nav className="sticky top-0 z-50 card-glass border-b border-white/40 shadow-sm">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center h-20">

                            {/* Logo  lebih besar, lebih menonjol */}
                            <Link href="/" className="flex items-center shrink-0">
                                <img
                                    src="/images/Logo_RA.png"
                                    alt="RamahAnak.id"
                                    className="h-16 w-auto object-contain drop-shadow-sm"
                                    onError={e => { e.target.style.display='none'; }}
                                />
                            </Link>

                            {/* Desktop Nav  tengah */}
                            <div className="hidden md:flex items-center gap-1">
                                {[
                                    { label: 'Fitur',             href: '#fitur',      ext: false },
                                    { label: 'Statistik',         href: '#statistik',  ext: false },
                                    { label: 'Bimbingan',         href: '#bimbingan',  ext: false },
                                    { label: 'Belajar Konseling', href: '/belajar-konseling', ext: false },
                                    { label: 'Kerja Sama',        href: 'https://wa.me/6281235738412', ext: true },
                                ].map(item => (
                                    item.ext ? (
                                        <a key={item.label}
                                            href={item.href} target="_blank" rel="noopener noreferrer"
                                            className="relative px-4 py-2 text-sm font-semibold text-gray-500 rounded-xl hover:text-teal-700 hover:bg-teal-50 transition-all duration-200">
                                            {item.label}
                                        </a>
                                    ) : (
                                        <a key={item.label}
                                            href={item.href}
                                            className="relative px-4 py-2 text-sm font-semibold text-gray-500 rounded-xl hover:text-teal-700 hover:bg-teal-50 transition-all duration-200">
                                            {item.label}
                                        </a>
                                    )
                                ))}
                            </div>

                            {/* Auth CTA */}
                            <div className="flex items-center gap-2 shrink-0">
                                {auth.user ? (
                                    <Link href={route('dashboard')}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-bold hover:bg-teal-700 active:scale-95 transition-all shadow-md">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                        </svg>
                                        Dashboard
                                    </Link>
                                ) : (
                                    <>
                                        <Link href={route('login')}
                                            className="hidden sm:flex items-center gap-1.5 px-4 py-2.5 text-gray-600 text-sm font-semibold rounded-xl hover:text-teal-700 hover:bg-gray-100 transition-all">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                            </svg>
                                            Masuk
                                        </Link>
                                        <a href="https://wa.me/6281235738412" target="_blank" rel="noopener noreferrer"
                                            className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-bold hover:bg-teal-700 active:scale-95 transition-all shadow-md">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M11.999 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.878-1.42A9.985 9.985 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" fillRule="evenodd" clipRule="evenodd"/>
                                            </svg>
                                            Hubungi Kami
                                        </a>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </nav>

                {/* 
                    HERO
                 */}
                <section className="mesh-bg relative overflow-hidden">
                    {/* Decorative circles */}
                    <div className="absolute -top-40 -right-40 w-96 h-96 bg-teal-100 rounded-full opacity-40 blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-violet-100 rounded-full opacity-40 blur-3xl pointer-events-none" />

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
                        <div className="grid lg:grid-cols-2 gap-16 items-center">

                            {/* Left */}
                            <div className={`space-y-7 ${heroVisible ? 'opacity-100' : 'opacity-0'}`}>
                                {/* Pill */}
                                <div className="hero-enter inline-flex items-center gap-2 px-4 py-2 bg-teal-50 border border-teal-200 rounded-full text-sm font-semibold text-teal-700">
                                    <span className="live-dot w-2 h-2 bg-teal-500 rounded-full inline-block" />
                                    Platform Konseling Digital Pesantren
                                </div>

                                {/* Heading */}
                                <h1 className="hero-enter-delay-1 text-4xl lg:text-[3.25rem] font-black leading-[1.1] tracking-tight">
                                    <span className="text-gray-900">Bimbingan & Konseling</span>
                                    <br />
                                    <span className="font-display italic text-gradient">Lebih Cerdas,</span>
                                    <br />
                                    <span className="text-gray-900">Lebih Terstruktur.</span>
                                </h1>

                                {/* Desc */}
                                <p className="hero-enter-delay-2 text-gray-500 text-lg leading-relaxed max-w-lg">
                                    Sistem pakar berbasis <strong className="text-gray-700">Rule-Based Expert System</strong> untuk
                                    deteksi dini, monitoring, dan tindak lanjut kesehatan mental santri secara otomatis dan terukur.
                                </p>

                                {/* CTA */}
                                <div className="hero-enter-delay-3 flex flex-wrap gap-4">
                                    <Link href='/fitur'
                                        className="group px-7 py-3.5 bg-teal-600 text-white rounded-xl font-bold text-sm hover:bg-teal-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2">
                                        Mulai Sekarang
                                        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                    </Link>
                                    <a href="https://wa.me/6281235738412" target="_blank" rel="noopener noreferrer"
                                        className="px-7 py-3.5 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-bold text-sm hover:border-teal-300 hover:text-teal-700 transition-all">
                                        Ajukan Kerja Sama
                                    </a>
                                </div>

                                {/* Mini stats */}
                                <div className="hero-enter-delay-4 flex gap-8 pt-2">
                                    {[
                                        { label: 'Santri Terdaftar', val: '136+', color: 'text-teal-600' },
                                        { label: 'Sesi Bimbingan', val: '247+', color: 'text-violet-600' },
                                        { label: 'Akurasi Sistem', val: '100%', color: 'text-cyan-600' },
                                    ].map(s => (
                                        <div key={s.label}>
                                            <div className={`text-2xl font-black ${s.color}`}>{s.val}</div>
                                            <div className="text-xs text-gray-400 font-semibold mt-0.5">{s.label}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Right  Dashboard Preview Card */}
                            <div className="relative flex justify-center lg:justify-end">
                                {/* Floating badges */}
                                <FloatingCard icon="" title="Sesi Aktif Hari Ini" value="24 Sesi Berjalan"
                                    color="bg-violet-500" delay={0} style={{ top: '-20px', left: '0px' }} />
                                <div className="floating-card absolute -top-5 left-4 bg-white rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3 border border-gray-100"
                                    style={{ animationDelay: '0s' }}>
                                    <div className="w-9 h-9 rounded-xl bg-violet-500 flex items-center justify-center text-white text-base"></div>
                                    <div>
                                        <div className="text-xs text-gray-400 font-medium">Sesi Aktif Hari Ini</div>
                                        <div className="text-sm font-bold text-gray-800">24 Sesi Berjalan</div>
                                    </div>
                                </div>
                                <div className="floating-card absolute -bottom-4 right-4 bg-white rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3 border border-gray-100"
                                    style={{ animationDelay: '2s' }}>
                                    <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-white">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-400 font-medium">Kasus Ditangani</div>
                                        <div className="text-sm font-bold text-gray-800">89 Bimbingan Selesai</div>
                                    </div>
                                </div>

                                {/* Main card */}
                                <div className="relative z-10 bg-white rounded-3xl shadow-2xl border border-gray-100 p-6 w-full max-w-md">
                                    {/* Card header */}
                                    <div className="flex items-center justify-between mb-5">
                                        <div>
                                            <h3 className="font-black text-gray-900 text-sm">Bimbingan Aktif</h3>
                                            <p className="text-xs text-gray-400 mt-0.5">Update real-time</p>
                                        </div>
                                        <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                                            <span className="live-dot w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                            LIVE
                                        </span>
                                    </div>

                                    {/* Bimbingan bars */}
                                    <div className="space-y-3.5">
                                        {bimbinganAktif.map((item, i) => (
                                            <div key={i}>
                                                <div className="flex justify-between text-xs font-semibold text-gray-600 mb-1.5">
                                                    <span>{item.jenis}</span>
                                                    <span className="text-gray-800">{item.jumlah} sesi</span>
                                                </div>
                                                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full ${item.warna} rounded-full transition-all duration-1000`}
                                                        style={{ width: `${item.pct}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Divider */}
                                    <div className="my-5 border-t border-gray-100" />

                                    {/* Mini grid info */}
                                    <div className="grid grid-cols-3 gap-3 text-center">
                                        {[
                                            { label: 'Konselor', val: '3', icon: '' },
                                            { label: 'Santri Aktif', val: '136', icon: '' },
                                            { label: 'Selesai', val: '89', icon: '' },
                                        ].map(m => (
                                            <div key={m.label} className="bg-gray-50 rounded-xl p-3">
                                                <div className="text-xl mb-1">{m.icon}</div>
                                                <div className="font-black text-gray-900 text-base">{m.val}</div>
                                                <div className="text-[10px] text-gray-400 font-semibold mt-0.5">{m.label}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 
                    STATISTIK LIVE
                 */}
                <section id="statistik" ref={statsRef} className="py-16 bg-white border-y border-gray-100">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { label: 'Santri Terdaftar', val: cSantri, suffix: '+', color: 'text-teal-600', bg: 'bg-teal-50', icon: '' },
                                { label: 'Total Sesi Bimbingan', val: cSesi, suffix: '+', color: 'text-violet-600', bg: 'bg-violet-50', icon: '' },
                                { label: 'Kasus Diselesaikan', val: cBimbingan, suffix: '', color: 'text-cyan-600', bg: 'bg-cyan-50', icon: '' },
                                { label: 'Akurasi Sistem', val: cAkurasi, suffix: '%', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: '' },
                            ].map(s => (
                                <div key={s.label} className={`${s.bg} rounded-2xl p-6 text-center border border-white shadow-sm`}>
                                    <div className="text-3xl mb-2">{s.icon}</div>
                                    <div className={`text-3xl font-black ${s.color}`}>{s.val}{s.suffix}</div>
                                    <div className="text-xs font-semibold text-gray-500 mt-1">{s.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* 
                    BIMBINGAN AKTIF (Info Umum)
                 */}
                <section id="bimbingan" className="py-20 bg-[#F7F8FC]">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-violet-50 border border-violet-200 rounded-full text-sm font-semibold text-violet-700 mb-4">
                                <span className="live-dot w-2 h-2 bg-violet-500 rounded-full" />
                                Informasi Umum Bimbingan
                            </div>
                            <h2 className="text-3xl lg:text-4xl font-black text-gray-900">
                                Layanan Bimbingan <span className="text-gradient font-display italic">Berjalan</span>
                            </h2>
                            <p className="text-gray-500 mt-3 max-w-xl mx-auto text-sm leading-relaxed">
                                Gambaran umum jenis layanan bimbingan konseling yang tersedia di sistem.
                                Data detail hanya dapat diakses oleh pengguna yang berwenang.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
                            {[
                                { jenis: 'Konseling Individual', desc: 'Sesi 1-on-1 antara santri dan Guru BK untuk penanganan masalah personal.', icon: '', warna: 'border-violet-200 bg-violet-50', badge: 'bg-violet-100 text-violet-700' },
                                { jenis: 'Bimbingan Kelompok', desc: 'Sesi kolektif untuk pengembangan karakter dan dinamika sosial santri.', icon: '', warna: 'border-teal-200 bg-teal-50', badge: 'bg-teal-100 text-teal-700' },
                                { jenis: 'Konsultasi Akademik', desc: 'Pendampingan motivasi belajar dan strategi menghadapi tekanan akademik.', icon: '', warna: 'border-amber-200 bg-amber-50', badge: 'bg-amber-100 text-amber-700' },
                                { jenis: 'Mediasi Konflik', desc: 'Penyelesaian terstruktur atas konflik antar santri dengan pendekatan restoratif.', icon: '', warna: 'border-rose-200 bg-rose-50', badge: 'bg-rose-100 text-rose-700' },
                            ].map((item, i) => (
                                <div key={i} className={`rounded-2xl border ${item.warna} p-6 hover:shadow-lg transition-all duration-300`}>
                                    <div className="text-4xl mb-4">{item.icon}</div>
                                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${item.badge}`}>
                                        LAYANAN TERSEDIA
                                    </span>
                                    <h3 className="font-bold text-gray-900 mt-3 mb-2">{item.jenis}</h3>
                                    <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                                </div>
                            ))}
                        </div>

                        {/* Info note */}
                        <div className="mt-8 flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-2xl p-5 max-w-2xl mx-auto">
                            <svg className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-sm text-blue-700">
                                <strong>Privasi terjaga.</strong> Detail laporan, data santri, dan rekam jejak bimbingan
                                hanya dapat diakses oleh Guru BK, Tenaga Pendidik yang bertugas, dan santri yang bersangkutan
                                setelah melakukan login.
                            </p>
                        </div>
                    </div>
                </section>

                {/* 
                    FITUR
                 */}
                <section id="fitur" className="py-20 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl lg:text-4xl font-black text-gray-900">
                                Kenapa <span className="text-gradient font-display italic">RamahAnak.id?</span>
                            </h2>
                            <p className="text-gray-500 mt-3 max-w-xl mx-auto text-sm">
                                Teknologi sistem pakar terintegrasi untuk pendekatan konseling yang lebih presisi dan objektif
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {[
                                { icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
                                  title: 'Forward Chaining', desc: 'Mesin inferensi 43 rule IF-THEN yang mendiagnosis kondisi mental santri secara otomatis setiap malam.', accent: 'bg-teal-600' },
                                { icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10" /></svg>,
                                  title: 'NLP Preprocessing', desc: 'Laporan teks bebas diproses otomatis oleh Python NLP Engine  dari input tenaga pendidik menjadi data terstruktur.', accent: 'bg-violet-600' },
                                { icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
                                  title: 'Privasi & Keamanan', desc: 'Data santri terenkripsi dan hanya dapat diakses sesuai peran yang diberikan. Tidak ada data sensitif yang bocor.', accent: 'bg-cyan-600' },
                                { icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>,
                                  title: 'Rekam Jejak Digital', desc: 'Setiap laporan, apresiasi, dan tindak lanjut tersimpan dalam riwayat digital yang dapat diakses kapan saja.', accent: 'bg-amber-500' },
                                { icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
                                  title: 'Reward & Konsekuensi', desc: 'Sistem poin otomatis yang memberi reward untuk prestasi dan konsekuensi terstruktur untuk pelanggaran.', accent: 'bg-emerald-600' },
                                { icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253" /></svg>,
                                  title: '3 Peran Terintegrasi', desc: 'Guru BK, Tenaga Pendidik, dan Santri memiliki antarmuka dan hak akses yang disesuaikan kebutuhan masing-masing.', accent: 'bg-rose-500' },
                            ].map((f, i) => (
                                <FeatureCard key={i} {...f} />
                            ))}
                        </div>
                    </div>
                </section>

                {/* 
                    KERJA SAMA
                 */}
                <section id="kerjasama" className="py-20 mesh-bg">
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
                            <div className="grid lg:grid-cols-2">

                                {/* Left */}
                                <div className="p-10 lg:p-14">
                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-teal-50 border border-teal-200 rounded-full text-xs font-bold text-teal-700 mb-6">
                                        UNDANGAN KOLABORASI
                                    </div>
                                    <h2 className="text-3xl font-black text-gray-900 mb-4 leading-tight">
                                        Bawa <span className="font-display italic text-gradient">RamahAnak.id</span>
                                        <br />ke Pesantren Anda
                                    </h2>
                                    <p className="text-gray-500 text-sm leading-relaxed mb-8">
                                        Kami membuka kesempatan kerja sama dengan pondok pesantren, lembaga pendidikan,
                                        dan organisasi yang peduli terhadap kesehatan mental generasi muda. Bersama-sama
                                        kita wujudkan sistem bimbingan konseling yang modern dan terstruktur.
                                    </p>

                                    <div className="space-y-4 mb-8">
                                        {[
                                            'Implementasi sistem tanpa biaya pengembangan awal',
                                            'Pelatihan Guru BK dan Tenaga Pendidik',
                                            'Dukungan teknis dan pemeliharaan sistem',
                                            'Laporan periodik perkembangan santri',
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-start gap-3">
                                                <div className="w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center shrink-0 mt-0.5">
                                                    <svg className="w-3 h-3 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                                <span className="text-sm text-gray-600">{item}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex flex-wrap gap-3">
                                        <a href="https://wa.me/6281235738412" target="_blank" rel="noopener noreferrer"
                                            className="px-6 py-3 bg-teal-600 text-white rounded-xl font-bold text-sm hover:bg-teal-700 transition-all shadow-md hover:shadow-lg">
                                            Chat WhatsApp
                                        </a>
                                        <Link href='/fitur'
                                            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 transition-all">
                                            Lihat Fitur Lengkap
                                        </Link>
                                    </div>
                                </div>

                                {/* Right */}
                                <div className="bg-gradient-to-br from-teal-600 to-cyan-700 p-10 lg:p-14 flex flex-col justify-center">
                                    <h3 className="text-white font-black text-xl mb-6">Informasi Kontak</h3>
                                    <div className="space-y-5">
                                        {[
                                            { icon: '', label: 'Institusi', val: 'Pondok Pesantren Muhammadiyah An-Nur' },
                                            { icon: '', label: 'Lokasi', val: 'Sidoarjo, Jawa Timur' },
                                            { icon: '', label: 'Email', val: 'lensahati98@gmail.com' },
                                            { icon: '', label: 'Respons', val: 'Dalam 1x24 jam kerja' },
                                        ].map(c => (
                                            <div key={c.label} className="flex items-start gap-3">
                                                <span className="text-2xl">{c.icon}</span>
                                                <div>
                                                    <div className="text-teal-200 text-xs font-semibold">{c.label}</div>
                                                    <div className="text-white text-sm font-semibold mt-0.5">{c.val}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-8 pt-6 border-t border-teal-500">
                                        <p className="text-teal-200 text-xs leading-relaxed">
                                            Sistem ini dikembangkan sebagai platform edukasi berbasis penelitian.
                                            Seluruh data dikelola dengan standar privasi yang ketat.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 
                    FOOTER
                 */}
                <footer className="bg-gray-950 text-gray-400 py-12">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid md:grid-cols-3 gap-8 mb-8">
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <img src="/images/Logo_RA.png" alt="RamahAnak.id"
                                        className="h-10 w-auto object-contain brightness-0 invert"
                                        onError={e => e.target.style.display='none'} />
                                </div>
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    Platform konseling digital berbasis Expert System untuk pondok pesantren modern.
                                </p>
                            </div>
                            <div>
                                <h4 className="text-white font-bold text-sm mb-3">Akses Cepat</h4>
                                <ul className="space-y-2 text-sm">
                                    <li><Link href={route('login')} className="hover:text-teal-400 transition-colors">Masuk ke Sistem</Link></li>
                                    <li><Link href="/belajar-konseling" className="hover:text-teal-400 transition-colors">Belajar Konseling</Link></li>
                                     <li><a href="https://wa.me/6281235738412" target="_blank" rel="noopener noreferrer" className="hover:text-teal-400 transition-colors">Hubungi WA</a></li>
                                    <li><a href="#fitur" className="hover:text-teal-400 transition-colors">Fitur Sistem</a></li>
                                    <li><a href="https://wa.me/6281235738412" target="_blank" rel="noopener noreferrer" className="hover:text-teal-400 transition-colors">Kerja Sama</a></li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="text-white font-bold text-sm mb-3">Teknologi</h4>
                                <div className="flex flex-wrap gap-2">
                                    {['Laravel 11','React.js','Inertia.js','Python NLP','Expert System','Tailwind CSS'].map(t => (
                                        <span key={t} className="px-2.5 py-1 bg-gray-800 text-gray-300 rounded-lg text-xs font-medium">
                                            {t}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-600">
                            <p>&copy; 2026 RamahAnak.id  Pondok Pesantren Muhammadiyah An-Nur Sidoarjo</p>
                            <p>Dikembangkan sebagai Tugas Akhir Sistem Pakar Berbasis Web</p>
                        </div>
                    </div>
                </footer>

            </div>
        </>
    );
}