/**
 * GuruBkLayout.jsx — Layout Guru BK dengan Sidebar (FINAL FIX)
 *
 * ROOT CAUSE yang diperbaiki:
 *   Tailwind JIT purge MENGHAPUS class yang dibuat via template literal
 *   seperti `lg:${condition ? 'ml-64' : 'ml-[68px]'}` karena tidak ada
 *   sebagai string literal di source code.
 *
 * SOLUSI:
 *   Pakai inline style untuk marginLeft — nilai angka (px) tidak di-purge.
 *   useEffect + resize listener untuk deteksi mobile dan skip margin.
 */
import { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import SidebarNavigation from './SidebarNavigation';

// Konstanta lebar sidebar — harus sama dengan nilai di SidebarNavigation.jsx
const W_EXPANDED  = 256; // px  =  w-64
const W_COLLAPSED = 68;  // px  =  w-[68px]

export default function GuruBkLayout({ user, header, children }) {
    const [sidebarOpen,       setSidebarOpen]       = useState(true);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    // Deteksi mobile — untuk matikan margin saat sidebar jadi overlay
    const [isMobile, setIsMobile] = useState(
        typeof window !== 'undefined' ? window.innerWidth < 1024 : false
    );

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 1024);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    const pageTitle   = typeof header === 'string' ? header : 'Dashboard';
    // Hitung margin konten secara JS — bukan Tailwind dynamic class
    const contentLeft = isMobile ? 0 : (sidebarOpen ? W_EXPANDED : W_COLLAPSED);

    return (
        <>
            <Head title={`${pageTitle} — Ramah Anak`} />

            <div className="min-h-screen bg-gray-50">

                {/* ── Sidebar ───────────────────────────────────── */}
                <SidebarNavigation
                    user={user}
                    sidebarOpen={sidebarOpen}
                    setSidebarOpen={setSidebarOpen}
                    mobileSidebarOpen={mobileSidebarOpen}
                    setMobileSidebarOpen={setMobileSidebarOpen}
                />

                {/* ── Main Content Area ─────────────────────────────
                  *  KENAPA inline style, bukan Tailwind class?
                  *  Tailwind purge hapus class yang tidak ada sebagai
                  *  string literal. `lg:ml-64` hasil template literal
                  *  tidak akan di-generate ke CSS.
                  *
                  *  Inline style selalu bekerja karena ini plain CSS.
                ──────────────────────────────────────────────────── */}
                <div
                    className="flex flex-col min-h-screen transition-[margin-left] duration-300 ease-in-out"
                    style={{ marginLeft: contentLeft }}
                >
                    {/* ── Mobile Top Bar ──────────────────────────── */}
                    <div className="lg:hidden sticky top-0 z-30 bg-white border-b border-gray-200
                        flex items-center gap-3 px-4 h-14 shadow-sm">
                        <button
                            onClick={() => setMobileSidebarOpen(true)}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
                            aria-label="Buka sidebar"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        {typeof header === 'string' && (
                            <h1 className="text-base font-semibold text-gray-900 truncate">
                                {header}
                            </h1>
                        )}
                    </div>

                    {/* ── Page Header Desktop ─────────────────────── */}
                    {header && (
                        <header className="hidden lg:block bg-white border-b border-gray-200 px-6 py-4 shrink-0">
                            {typeof header === 'string' ? (
                                <h1 className="text-xl font-bold text-gray-900">{header}</h1>
                            ) : (
                                header
                            )}
                        </header>
                    )}

                    {/* ── Konten Halaman ──────────────────────────── */}
                    <main className="flex-1">
                        {children}
                    </main>

                    {/* ── Footer ──────────────────────────────────── */}
                    <footer className="bg-white border-t border-gray-100 px-6 py-3 shrink-0">
                        <p className="text-xs text-gray-400 text-center">
                            © {new Date().getFullYear()} Sistem Pakar BK — Pondok Pesantren Muhammadiyah An Nur Sidoarjo
                        </p>
                    </footer>
                </div>
            </div>
        </>
    );
}