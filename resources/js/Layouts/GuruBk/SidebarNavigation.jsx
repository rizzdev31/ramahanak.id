/**
 * SidebarNavigation.jsx - Sidebar Guru BK
 *
 * Fitur badge notifikasi:
 *   - Setiap menu dan submenu yang punya data pending
 *     menampilkan angka badge merah
 *   - Data badges dari shared props Inertia (HandleInertiaRequests)
 *   - Parent menu menampilkan TOTAL badge semua child-nya
 *
 * Sinkron dengan GuruBkLayout.jsx:
 *   W_EXPANDED  = 256px
 *   W_COLLAPSED = 68px
 */
import { useState, useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';
import ApplicationLogo from '@/Components/ApplicationLogo';

const W_EXPANDED  = 256;
const W_COLLAPSED = 68;

// ---- Icon helper ----------------------------------------------------
const Icon = ({ path, className = 'w-5 h-5' }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
    </svg>
);

const ICONS = {
    dashboard:    'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    users:        'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
    eye:          'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
    document:     'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    clipboard:    'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
    chart:        'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    collection:   'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
    cog:          'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
    shield:       'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    bimbingan:    'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
    chevronDown:  'M19 9l-7 7-7-7',
    chevronLeft:  'M15 19l-7-7 7-7',
    chevronRight: 'M9 5l7 7-7 7',
    logout:       'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
};

// ---- Badge component ------------------------------------------------
// Menampilkan angka merah. Max display 99+.
function Badge({ count, collapsed = false }) {
    if (!count || count <= 0) return null;
    const label = count > 99 ? '99+' : String(count);
    return (
        <span className={`
            inline-flex items-center justify-center
            bg-red-500 text-white text-xs font-bold
            rounded-full leading-none shrink-0
            ${collapsed
                ? 'absolute -top-1 -right-1 w-4 h-4 text-[10px]'
                : 'min-w-[1.25rem] h-5 px-1'
            }
        `}>
            {label}
        </span>
    );
}

// ---- Menu definition ------------------------------------------------
// badge_keys: array key dari props.badges yang dijumlahkan untuk menu ini
// Submenu juga bisa punya badge_key sendiri
const MENU_ITEMS = [
    {
        label: 'Dashboard',
        icon:  'dashboard',
        href:  'dashboard',
        exact: true,
    },
    {
        label:      'Kelola',
        icon:       'users',
        badge_keys: ['user_pending'],
        submenu: [
            { label: 'Kelola User',      href: 'manage-user.index', badge_keys: ['user_pending'] },
            { label: 'Kelola Kelas',     href: 'kelas.index'       },
            { label: 'Kelola Penugasan', href: 'penugasan.index'   },
        ],
    },
    {
        label: 'Monitoring Santri',
        icon:  'eye',
        href:  'santri.index',
    },
    {
        label:      'Laporan Kategori',
        icon:       'document',
        badge_keys: ['pelanggaran_pending', 'apresiasi_pending', 'konselor_pending'],
        submenu: [
            { label: 'Laporan Pelanggaran', href: 'laporan-pelanggaran.index', badge_keys: ['pelanggaran_pending'] },
            { label: 'Laporan Apresiasi',   href: 'laporan-apresiasi.index',   badge_keys: ['apresiasi_pending']   },
            { label: 'Laporan Konselor',    href: 'laporan-konselor.index',    badge_keys: ['konselor_pending']    },
        ],
    },
    {
        label:      'Laporan Proses',
        icon:       'clipboard',
        badge_keys: ['laporan_awal', 'hasil_preprocessing'],
        submenu: [
            { label: 'Validasi Laporan',    href: 'laporan.index',             badge_keys: ['laporan_awal']           },
            { label: 'Hasil Preprocessing', href: 'hasil-preprocessing.index', badge_keys: ['hasil_preprocessing']   },
            { label: 'Buat Laporan',        href: 'laporan.create'             },
        ],
    },
    {
        label:      'Expert System',
        icon:       'chart',
        badge_keys: ['es_point_pending', 'es_konselor_pending'],
        submenu: [
            { label: 'Expert System Point',    href: 'expert-system-point.index',    badge_keys: ['es_point_pending']    },
            { label: 'Expert System Konselor', href: 'expert-system-konselor.index', badge_keys: ['es_konselor_pending'] },
        ],
    },
    {
        label:      'Kelola Approval',
        icon:       'shield',
        href:       'kelola-approval.index',
        badge_keys: ['kelola_approval'],
    },
    {
        label:  'My Bimbingan',
        icon:   'bimbingan',
        submenu: [
            { label: 'Template Angket',  href: 'my-bimbingan.template.index' },
            { label: 'Jadwal Bimbingan', href: 'my-bimbingan.jadwal.index'   },
            { label: 'Logbook Santri',   href: 'my-bimbingan.logbook'        },
        ],
    },
    {
        label:   'Kelola Variabel',
        icon:    'collection',
        submenu: [
            { label: 'Variabel Pelanggaran', href: 'variabel.pelanggaran.index' },
            { label: 'Variabel Apresiasi',   href: 'variabel.apresiasi.index'   },
            { label: 'Variabel Konselor',    href: 'variabel.konselor.index'    },
            { label: 'Variabel Konsekuensi', href: 'variabel.konsekuensi.index' },
            { label: 'Variabel Reward',      href: 'variabel.reward.index'      },
            { label: 'Variabel Diagnosis',   href: 'variabel.diagnosis.index'   },
        ],
    },
    {
        label:   'Rule Expert System',
        icon:    'cog',
        submenu: [
            { label: 'Kelola Rule', href: 'rules.index' },
        ],
    },
];

// ---- Helpers --------------------------------------------------------
function resolveHref(routeName) {
    try { return route(routeName); } catch { return '#'; }
}

function isUrlActive(href, currentUrl) {
    if (!href || href === '#') return false;
    return currentUrl.startsWith(href);
}

function submenuHasActive(submenu, currentUrl) {
    return submenu.some(s => isUrlActive(resolveHref(s.href), currentUrl));
}

function sumBadges(badgeKeys, badges) {
    if (!badges || !badgeKeys?.length) return 0;
    return badgeKeys.reduce((total, key) => total + (badges[key] ?? 0), 0);
}

// ---- SidebarItem ----------------------------------------------------
function SidebarItem({ item, sidebarOpen, badges }) {
    const { url } = usePage();
    const hasSubmenu = Array.isArray(item.submenu) && item.submenu.length > 0;

    const defaultOpen = hasSubmenu && submenuHasActive(item.submenu, url);
    const [isOpen, setIsOpen] = useState(defaultOpen);

    useEffect(() => {
        if (hasSubmenu && submenuHasActive(item.submenu, url)) {
            setIsOpen(true);
        }
    }, [url]);

    const itemBadgeCount = sumBadges(item.badge_keys, badges);

    // ---- Leaf item --------------------------------------------------
    if (!hasSubmenu) {
        const href     = resolveHref(item.href);
        const isActive = item.exact ? url === href : isUrlActive(href, url);

        return (
            <Link
                href={href}
                title={!sidebarOpen ? item.label : undefined}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg
                    text-sm font-medium transition-colors mb-0.5 ${
                    isActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                        : 'text-gray-700 hover:bg-gray-100'
                }`}
            >
                {/* Icon container - relative untuk badge collapsed */}
                <span className="relative shrink-0">
                    <Icon path={ICONS[item.icon]} className="w-5 h-5" />
                    {!sidebarOpen && itemBadgeCount > 0 && (
                        <Badge count={itemBadgeCount} collapsed />
                    )}
                </span>

                {sidebarOpen && (
                    <>
                        <span className="flex-1 truncate">{item.label}</span>
                        {itemBadgeCount > 0 && (
                            <Badge count={itemBadgeCount} />
                        )}
                    </>
                )}
            </Link>
        );
    }

    // ---- Parent item (with submenu) ---------------------------------
    const isAnyChildActive = submenuHasActive(item.submenu, url);

    return (
        <div className="mb-0.5">
            <button
                type="button"
                onClick={() => setIsOpen(o => !o)}
                title={!sidebarOpen ? item.label : undefined}
                className={`relative w-full flex items-center justify-between px-3 py-2.5
                    rounded-lg text-sm font-medium transition-colors ${
                    isAnyChildActive
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-gray-700 hover:bg-gray-100'
                }`}
            >
                <div className="flex items-center gap-3 min-w-0">
                    {/* Icon + badge collapsed */}
                    <span className="relative shrink-0">
                        <Icon path={ICONS[item.icon]} className="w-5 h-5" />
                        {!sidebarOpen && itemBadgeCount > 0 && (
                            <Badge count={itemBadgeCount} collapsed />
                        )}
                    </span>

                    {sidebarOpen && (
                        <span className="truncate">{item.label}</span>
                    )}
                </div>

                {sidebarOpen && (
                    <div className="flex items-center gap-1.5 shrink-0">
                        {itemBadgeCount > 0 && (
                            <Badge count={itemBadgeCount} />
                        )}
                        <Icon
                            path={ICONS.chevronDown}
                            className={`w-4 h-4 transition-transform duration-200 ${
                                isOpen ? 'rotate-180' : ''
                            }`}
                        />
                    </div>
                )}
            </button>

            {/* Submenu */}
            {sidebarOpen && isOpen && (
                <div className="mt-0.5 ml-3 pl-3 border-l-2 border-indigo-100 space-y-0.5">
                    {item.submenu.map((sub, i) => {
                        const subHref   = resolveHref(sub.href);
                        const subActive = isUrlActive(subHref, url);
                        const subBadge  = sumBadges(sub.badge_keys, badges);

                        return (
                            <Link
                                key={i}
                                href={subHref}
                                className={`flex items-center justify-between px-3 py-2
                                    rounded-lg text-sm transition-colors ${
                                    subActive
                                        ? 'bg-indigo-600 text-white font-medium'
                                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                }`}
                            >
                                <span className="truncate">{sub.label}</span>
                                {subBadge > 0 && (
                                    <Badge count={subBadge} />
                                )}
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ---- Main Export ----------------------------------------------------
export default function SidebarNavigation({
    user,
    sidebarOpen,
    setSidebarOpen,
    mobileSidebarOpen,
    setMobileSidebarOpen,
}) {
    const { props } = usePage();
    // badges dikirim dari HandleInertiaRequests - bisa null jika bukan guru_bk
    const badges = props.badges ?? {};

    // Total badge untuk semua menu (ditampilkan di header collapsed)
    const totalBadge = Object.values(badges).reduce((s, v) => s + (v ?? 0), 0);

    return (
        <>
            {/* Mobile backdrop */}
            {mobileSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setMobileSidebarOpen(false)}
                    aria-hidden="true"
                />
            )}

            <aside className={`
                fixed top-0 left-0 z-50 h-screen
                bg-white border-r border-gray-200
                flex flex-col
                transition-[width] duration-300 ease-in-out
                ${sidebarOpen ? 'w-64' : 'w-[68px]'}
                ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                lg:translate-x-0
            `}>
                {/* Header: logo + toggle */}
                <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 shrink-0">
                    <div className="flex items-center gap-3 min-w-0 overflow-hidden">
                        <div className="relative shrink-0">
                            <ApplicationLogo className="w-8 h-8" />
                            {/* Badge total saat collapsed */}
                            {!sidebarOpen && totalBadge > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500
                                    rounded-full flex items-center justify-center text-white text-[9px] font-bold">
                                    {totalBadge > 99 ? '!' : totalBadge}
                                </span>
                            )}
                        </div>
                        {sidebarOpen && (
                            <span className="font-bold text-base text-gray-900 truncate">
                                Ramah Anak
                            </span>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={() => setSidebarOpen(o => !o)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 shrink-0"
                        title={sidebarOpen ? 'Collapse' : 'Expand'}
                    >
                        <Icon
                            path={sidebarOpen ? ICONS.chevronLeft : ICONS.chevronRight}
                            className="w-4 h-4"
                        />
                    </button>
                </div>

                {/* User info */}
                <div className="px-3 py-3 border-b border-gray-100 shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center
                            justify-center text-indigo-700 font-bold text-sm shrink-0 uppercase">
                            {user?.username?.[0] ?? 'G'}
                        </div>
                        {sidebarOpen && (
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">
                                    {user?.username ?? 'Guru BK'}
                                </p>
                                <p className="text-xs text-indigo-600 font-medium">Guru BK</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Nav menu */}
                <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3">
                    {MENU_ITEMS.map((item, i) => (
                        <SidebarItem
                            key={i}
                            item={item}
                            sidebarOpen={sidebarOpen}
                            badges={badges}
                        />
                    ))}
                </nav>

                {/* Logout */}
                <div className="px-2 py-3 border-t border-gray-100 shrink-0">
                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        title={!sidebarOpen ? 'Logout' : undefined}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                            text-sm font-medium text-red-600 hover:bg-red-50 transition-colors ${
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