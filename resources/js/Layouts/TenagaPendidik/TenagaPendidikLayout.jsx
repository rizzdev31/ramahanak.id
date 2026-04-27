/**
 * TenagaPendidikLayout.jsx
 * Layout Tenaga Pendidik dengan sidebar collapsible.
 * Sinkron dengan pola GuruBkLayout — sidebar kiri + konten kanan.
 */
import { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import ApplicationLogo from '@/Components/ApplicationLogo';

// ── Konstanta lebar sidebar ───────────────────────────────────
const W_EXPANDED  = 240; // px
const W_COLLAPSED = 64;  // px

// ── Icon helper ───────────────────────────────────────────────
const Icon = ({ path, className = 'w-5 h-5' }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
    </svg>
);

const ICONS = {
    dashboard:   'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    santri:      'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
    report:      'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    bimbingan:   'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
    create:      'M12 4v16m8-8H4',
    menu:        'M4 6h16M4 12h16M4 18h16',
    chevronLeft: 'M15 19l-7-7 7-7',
    chevronRight:'M9 5l7 7-7 7',
    logout:      'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
};

// ── Menu config ───────────────────────────────────────────────
const MENU = [
    { icon: 'dashboard', label: 'Dashboard',       href: 'dashboard',              match: ['dashboard']         },
    { icon: 'santri',    label: 'Santri Kelas',     href: 'santri-kelas.index',     match: ['santri-kelas.*']    },
    { icon: 'report',    label: 'Laporan Wali',     href: 'laporan-wali.index',     match: ['laporan-wali.*']    },
    { icon: 'bimbingan', label: 'Jadwal Bimbingan', href: 'bimbingan-kelas.index',  match: ['bimbingan-kelas.*'] },
    { icon: 'create',    label: 'Buat Laporan',     href: 'laporan.create',         match: ['laporan.create']    },
];

function resolveHref(routeName) {
    try { return route(routeName); } catch { return '#'; }
}

function isActive(matchPatterns, currentUrl) {
    return matchPatterns.some(p => {
        try { return route().current(p); } catch { return false; }
    });
}

// ── Sidebar ───────────────────────────────────────────────────
function Sidebar({ user, sidebarOpen, setSidebarOpen, mobileSidebarOpen, setMobileSidebarOpen }) {
    const { url } = typeof usePage !== 'undefined' ? usePage() : { url: '' };

    return (
        <>
            {/* Mobile backdrop */}
            {mobileSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setMobileSidebarOpen(false)}
                />
            )}

            <aside className={`
                fixed top-0 left-0 z-50 h-screen
                bg-white border-r border-gray-200
                flex flex-col
                transition-[width] duration-300 ease-in-out
                ${sidebarOpen ? 'w-60' : 'w-[64px]'}
                ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                lg:translate-x-0
            `}>
                {/* Header */}
                <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 shrink-0">
                    <div className="flex items-center gap-3 min-w-0 overflow-hidden">
                        <ApplicationLogo className="w-8 h-8 shrink-0 text-emerald-600" />
                        {sidebarOpen && (
                            <span className="font-bold text-base text-gray-900 truncate">Ramah Anak</span>
                        )}
                    </div>
                    <button
                        onClick={() => setSidebarOpen(o => !o)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 shrink-0"
                    >
                        <Icon path={sidebarOpen ? ICONS.chevronLeft : ICONS.chevronRight} className="w-4 h-4" />
                    </button>
                </div>

                {/* User info */}
                <div className="px-3 py-3 border-b border-gray-100 shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm shrink-0">
                            {user?.username?.[0]?.toUpperCase() ?? 'T'}
                        </div>
                        {sidebarOpen && (
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">{user?.username ?? '-'}</p>
                                <p className="text-xs text-emerald-600 font-medium">Tenaga Pendidik</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3 space-y-0.5">
                    {MENU.map((item, i) => {
                        const active = isActive(item.match);
                        return (
                            <Link
                                key={i}
                                href={resolveHref(item.href)}
                                title={!sidebarOpen ? item.label : undefined}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                    active
                                        ? 'bg-emerald-600 text-white shadow-md'
                                        : 'text-gray-700 hover:bg-gray-100'
                                }`}
                            >
                                <Icon path={ICONS[item.icon]} className="w-5 h-5 shrink-0" />
                                {sidebarOpen && <span className="truncate">{item.label}</span>}
                            </Link>
                        );
                    })}
                </nav>

                {/* Logout */}
                <div className="px-2 py-3 border-t border-gray-100 shrink-0">
                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        title={!sidebarOpen ? 'Logout' : undefined}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors ${
                            !sidebarOpen ? 'justify-center' : ''
                        }`}
                    >
                        <Icon path={ICONS.logout} className="w-5 h-5 shrink-0" />
                        {sidebarOpen && <span>Logout</span>}
                    </Link>
                </div>
            </aside>
        </>
    );
}

// ── Top bar ───────────────────────────────────────────────────
function TopBar({ header, setSidebarOpen, setMobileSidebarOpen }) {
    return (
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200 h-14 flex items-center px-4 gap-3 shadow-sm">
            {/* Mobile toggle */}
            <button
                onClick={() => setMobileSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600"
            >
                <Icon path={ICONS.menu} className="w-5 h-5" />
            </button>

            {typeof header === 'string' ? (
                <h1 className="text-base font-semibold text-gray-900 truncate">{header}</h1>
            ) : header ? (
                <div className="flex-1">{header}</div>
            ) : (
                <span className="text-sm text-gray-400">Ramah Anak — Tenaga Pendidik</span>
            )}

            {/* Quick action */}
            <div className="ml-auto flex items-center gap-2">
                <Link
                    href={route('laporan.create')}
                    className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition"
                >
                    <Icon path={ICONS.create} className="w-4 h-4" />
                    Buat Laporan
                </Link>
            </div>
        </div>
    );
}

// ── Main Layout ───────────────────────────────────────────────
export default function TenagaPendidikLayout({ user, header, children }) {
    const [sidebarOpen, setSidebarOpen]             = useState(true);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    const [isMobile, setIsMobile] = useState(
        typeof window !== 'undefined' ? window.innerWidth < 1024 : false
    );

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 1024);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    const contentLeft = isMobile ? 0 : (sidebarOpen ? W_EXPANDED : W_COLLAPSED);

    return (
        <>
            <Head title={`${typeof header === 'string' ? header + ' — ' : ''}Ramah Anak`} />

            <div className="min-h-screen bg-gray-50">
                <Sidebar
                    user={user}
                    sidebarOpen={sidebarOpen}
                    setSidebarOpen={setSidebarOpen}
                    mobileSidebarOpen={mobileSidebarOpen}
                    setMobileSidebarOpen={setMobileSidebarOpen}
                />

                <div
                    className="flex flex-col min-h-screen transition-[margin-left] duration-300 ease-in-out"
                    style={{ marginLeft: contentLeft }}
                >
                    <TopBar
                        header={header}
                        setSidebarOpen={setSidebarOpen}
                        setMobileSidebarOpen={setMobileSidebarOpen}
                    />

                    <main className="flex-1">
                        {children}
                    </main>

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