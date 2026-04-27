import { Head, Link } from '@inertiajs/react';

export default function Welcome({ auth }) {
    return (
        <>
            <Head title="Welcome - RamahAnak.id" />
            
            <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50">
                
                {/* ═══════════════════════════════════════════════
                    NAVBAR
                ═══════════════════════════════════════════════ */}
                <nav className="bg-white/80 backdrop-blur-md border-b border-teal-100 sticky top-0 z-50 shadow-sm">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center h-16">
                            
                            {/* Logo */}
                            <div className="flex items-center gap-2 sm:gap-3">
                                <img 
                                    src="/images/Logo_RA.png" 
                                    alt="RamahAnak.id Logo" 
                                    className="h-10 sm:h-20 w-auto flex-shrink-0"
                                    onError={(e) => {
                                        // Fallback jika logo belum ada
                                        e.target.style.display = 'none';
                                    }}
                                />
                                <div className="flex flex-col min-w-0">
                                    <span className="text-lg sm:text-xl font-bold text-teal-700 whitespace-nowrap">
                                        RamahAnak<span className="text-teal-500">.id</span>
                                    </span>
                                    <span className="text-xs text-gray-500 hidden sm:block truncate">
                                        Tempat Hangat, Didengar & Disayang
                                    </span>
                                </div>
                            </div>

                            {/* Auth Buttons */}
                            <div className="flex items-center gap-3">
                                {auth.user ? (
                                    <Link
                                        href={route('dashboard')}
                                        className="px-6 py-2.5 bg-teal-600 text-white rounded-full font-medium hover:bg-teal-700 transition-all duration-200 shadow-md hover:shadow-lg"
                                    >
                                        Dashboard
                                    </Link>
                                ) : (
                                    <>
                                        <Link
                                            href={route('login')}
                                            className="px-6 py-2.5 bg-teal-600 text-white rounded-full font-medium hover:bg-teal-700 transition-all duration-200 shadow-md hover:shadow-lg"
                                        >
                                            Masuk
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </nav>

                {/* ═══════════════════════════════════════════════
                    HERO SECTION
                ═══════════════════════════════════════════════ */}
                <section className="relative overflow-hidden">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
                        <div className="grid lg:grid-cols-2 gap-12 items-center">
                            
                            {/* Left Content */}
                            <div className="space-y-8">
                                {/* Badge */}
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-100 text-teal-700 rounded-full text-sm font-medium">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    Sistem Pakar Kesehatan Mental Santri
                                </div>

                                {/* Heading */}
                                <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
                                    <span className="text-gray-900">Monitoring Kesehatan Mental dengan </span>
                                    <span className="text-teal-600 relative">
                                        Expert System
                                        <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                                            <path d="M2 10C76 2.5 224 2.5 298 10" stroke="#14b8a6" strokeWidth="3" strokeLinecap="round"/>
                                        </svg>
                                    </span>
                                </h1>

                                {/* Description */}
                                <p className="text-lg text-gray-600 leading-relaxed">
                                    Platform monitoring kesehatan mental santri berbasis <strong>Rule-Based System (Forward Chaining)</strong> untuk deteksi dini dan rekomendasi penanganan oleh Guru BK secara profesional.
                                </p>

                                {/* CTA Buttons */}
                                <div className="flex flex-wrap gap-4">
                                    <Link
                                        href={route('register')}
                                        className="px-8 py-4 bg-teal-600 text-white rounded-full font-semibold hover:bg-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
                                    >
                                        Bergabung Sekarang
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                    </Link>
                                    <Link
                                        href={route('login')}
                                        className="px-8 py-4 bg-white text-teal-700 rounded-full font-semibold border-2 border-teal-200 hover:border-teal-300 hover:bg-teal-50 transition-all duration-200"
                                    >
                                        Buat Akun Gratis
                                    </Link>
                                </div>

                                {/* Stats */}
                                <div className="flex flex-wrap gap-8 pt-4">
                                    <div>
                                        <div className="text-3xl font-bold text-teal-600">6+</div>
                                        <div className="text-sm text-gray-600">Variabel Sistem</div>
                                    </div>
                                    <div>
                                        <div className="text-3xl font-bold text-teal-600">50+</div>
                                        <div className="text-sm text-gray-600">Rule Expert</div>
                                    </div>
                                    <div>
                                        <div className="text-3xl font-bold text-teal-600">100%</div>
                                        <div className="text-sm text-gray-600">Data Terenkripsi</div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Image */}
                            <div className="relative">
                                <div className="relative z-10">
                                    {/* Card Container */}
                                    <div className="bg-white rounded-3xl shadow-2xl p-8 border border-teal-100 overflow-visible relative">
                                        {/* Gradient Background */}
                                        <div className="aspect-square rounded-2xl bg-gradient-to-br from-teal-100 to-cyan-100 relative overflow-hidden">
                                        </div>

                                        {/* Image - timbul di atas mask */}
                                        <img
                                            src="/images/hero-person.png"
                                            alt="Mental Health Support"
                                            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[85%] h-auto max-h-[110%] object-contain object-bottom z-10"
                                            onError={(e) => {
                                                // Fallback ke icon jika gambar tidak ada
                                                e.target.style.display = 'none';
                                                e.target.nextElementSibling.style.display = 'flex';
                                            }}
                                        />

                                        {/* Fallback Icon (hidden by default) */}
                                        <div className="absolute inset-0 hidden items-center justify-center z-10">
                                            <svg className="w-64 h-64 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                            </svg>
                                        </div>
                                        
                                        {/* Floating Badge */}
                                        <div className="absolute -top-4 -right-4 bg-teal-600 text-white px-6 py-3 rounded-full shadow-lg z-10">
                                            <div className="text-2xl font-bold">99%</div>
                                            <div className="text-xs">Akurasi</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Background Decoration */}
                                <div className="absolute top-10 -left-10 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
                                <div className="absolute -bottom-10 -right-10 w-72 h-72 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════
                    FEATURES SECTION
                ═══════════════════════════════════════════════ */}
                <section className="py-20 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        
                        {/* Section Header */}
                        <div className="text-center max-w-3xl mx-auto mb-16">
                            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                                Fitur Unggulan Sistem
                            </h2>
                            <p className="text-lg text-gray-600">
                                Teknologi Expert System dengan Forward Chaining untuk monitoring kesehatan mental yang akurat dan efisien
                            </p>
                        </div>

                        {/* Features Grid */}
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            
                            {/* Feature 1 */}
                            <div className="bg-gradient-to-br from-teal-50 to-white p-8 rounded-2xl border border-teal-100 hover:shadow-xl transition-all duration-300 group">
                                <div className="w-14 h-14 bg-teal-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">Forward Chaining</h3>
                                <p className="text-gray-600">
                                    Sistem reasoning dari fakta menuju kesimpulan dengan logika IF-THEN yang terstruktur
                                </p>
                            </div>

                            {/* Feature 2 */}
                            <div className="bg-gradient-to-br from-cyan-50 to-white p-8 rounded-2xl border border-cyan-100 hover:shadow-xl transition-all duration-300 group">
                                <div className="w-14 h-14 bg-cyan-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">Deteksi Dini</h3>
                                <p className="text-gray-600">
                                    Identifikasi gejala masalah mental santri sejak dini untuk penanganan yang tepat
                                </p>
                            </div>

                            {/* Feature 3 */}
                            <div className="bg-gradient-to-br from-blue-50 to-white p-8 rounded-2xl border border-blue-100 hover:shadow-xl transition-all duration-300 group">
                                <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">Knowledge Base</h3>
                                <p className="text-gray-600">
                                    Database pengetahuan lengkap dengan 6 variabel dan puluhan aturan pakar
                                </p>
                            </div>

                            {/* Feature 4 */}
                            <div className="bg-gradient-to-br from-purple-50 to-white p-8 rounded-2xl border border-purple-100 hover:shadow-xl transition-all duration-300 group">
                                <div className="w-14 h-14 bg-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">Rekomendasi BK</h3>
                                <p className="text-gray-600">
                                    Saran tindakan profesional untuk Guru BK dalam menangani setiap kasus
                                </p>
                            </div>

                            {/* Feature 5 */}
                            <div className="bg-gradient-to-br from-pink-50 to-white p-8 rounded-2xl border border-pink-100 hover:shadow-xl transition-all duration-300 group">
                                <div className="w-14 h-14 bg-pink-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">Data Aman</h3>
                                <p className="text-gray-600">
                                    Keamanan dan privasi data santri terjamin dengan enkripsi tingkat enterprise
                                </p>
                            </div>

                            {/* Feature 6 */}
                            <div className="bg-gradient-to-br from-orange-50 to-white p-8 rounded-2xl border border-orange-100 hover:shadow-xl transition-all duration-300 group">
                                <div className="w-14 h-14 bg-orange-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">Real-time Processing</h3>
                                <p className="text-gray-600">
                                    Analisis dan diagnosis real-time dengan preprocessing Python yang cepat
                                </p>
                            </div>

                        </div>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════
                    CTA SECTION
                ═══════════════════════════════════════════════ */}
                <section className="py-20 bg-gradient-to-br from-teal-600 to-cyan-600 relative overflow-hidden">
                    <div className="absolute inset-0 bg-black opacity-5"></div>
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                        <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
                            Siap Memulai Monitoring Kesehatan Mental?
                        </h2>
                        <p className="text-xl text-teal-50 mb-8">
                            Daftarkan diri Anda sebagai Guru BK, Tenaga Pendidik, atau Santri dan mulai gunakan sistem kami
                        </p>
                        <Link
                            href={route('register')}
                            className="inline-flex items-center gap-2 px-10 py-4 bg-white text-teal-600 rounded-full font-bold text-lg hover:bg-gray-50 transition-all duration-200 shadow-xl hover:shadow-2xl"
                        >
                            Daftar Sekarang Gratis
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </Link>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════
                    FOOTER
                ═══════════════════════════════════════════════ */}
                <footer className="bg-gray-900 text-gray-300 py-12">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid md:grid-cols-3 gap-8 mb-8">
                            
                            {/* Brand */}
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <img 
                                        src="/images/Logo_RA.png" 
                                        alt="RamahAnak.id" 
                                        className="h-8 w-auto"
                                        onError={(e) => e.target.style.display = 'none'}
                                    />
                                    <span className="text-xl font-bold text-white">
                                        RamahAnak<span className="text-teal-400">.id</span>
                                    </span>
                                </div>
                                <p className="text-sm text-gray-400">
                                    Platform monitoring kesehatan mental santri berbasis Expert System untuk pondok pesantren modern
                                </p>
                            </div>

                            {/* Links */}
                            <div>
                                <h3 className="text-white font-semibold mb-4">Quick Links</h3>
                                <ul className="space-y-2">
                                    <li><Link href={route('login')} className="hover:text-teal-400 transition-colors">Login</Link></li>
                                    <li><Link href={route('register')} className="hover:text-teal-400 transition-colors">Register</Link></li>
                                </ul>
                            </div>

                            {/* Contact */}
                            <div>
                                <h3 className="text-white font-semibold mb-4">Kontak</h3>
                                <ul className="space-y-2 text-sm">
                                    <li>Pondok Pesantren An-Nur</li>
                                    <li>Sidoarjo, Jawa Timur</li>
                                    <li className="text-teal-400">support@ramahanak.id</li>
                                </ul>
                            </div>
                        </div>

                        <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-500">
                            <p>&copy; 2026 RamahAnak.id. All rights reserved. Built with Laravel + React + Inertia.js</p>
                        </div>
                    </div>
                </footer>

            </div>

            {/* Animations */}
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes blob {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    25% { transform: translate(20px, -50px) scale(1.1); }
                    50% { transform: translate(-20px, 20px) scale(0.9); }
                    75% { transform: translate(50px, 50px) scale(1.05); }
                }
                .animate-blob {
                    animation: blob 7s infinite;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
            `}} />
        </>
    );
}