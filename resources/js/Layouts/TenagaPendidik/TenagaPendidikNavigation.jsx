/**
 * TenagaPendidikNavigation.jsx
 * Navigasi horizontal untuk Tenaga Pendidik — dengan badge notifikasi
 * Menu: Dashboard | Laporan Wali | Jadwal Bimbingan | Buat Laporan
 */
import NavLink from '@/Components/NavLink';
import ResponsiveNavLink from '@/Components/ResponsiveNavLink';
import { usePage } from '@inertiajs/react';

const Icon = ({ path, className = 'w-4 h-4' }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
    </svg>
);

const ICONS = {
    dashboard:  'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    report:     'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    bimbingan:  'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
    laporan:    'M12 4v16m8-8H4',
};

// Badge notif merah kecil
const Badge = ({ count }) => {
    if (!count || count <= 0) return null;
    return (
        <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
            {count > 9 ? '9+' : count}
        </span>
    );
};

export default function TenagaPendidikNavigation({ isMobile = false }) {
    const { props } = usePage();
    // Ambil approval_pending dari dashboardData jika ada di halaman dashboard
    const approvalPending = props?.dashboardData?.stats?.find(s => s.label === 'Approval Pending')?.value ?? 0;

    const MENU = [
        { icon: 'dashboard', label: 'Dashboard',      routeName: 'dashboard',           match: 'dashboard',            badge: 0             },
        { icon: 'report',    label: 'Laporan Wali',   routeName: 'laporan-wali.index',  match: 'laporan-wali.*',       badge: approvalPending },
        { icon: 'bimbingan', label: 'Jadwal Bimbingan', routeName: 'bimbingan-kelas.index', match: 'bimbingan-kelas.*', badge: 0            },
        { icon: 'laporan',   label: 'Buat Laporan',   routeName: 'laporan.create',      match: 'laporan.create',       badge: 0             },
    ];

    if (isMobile) {
        return (
            <>
                {MENU.map(item => (
                    <ResponsiveNavLink
                        key={item.routeName}
                        href={route(item.routeName)}
                        active={route().current(item.match)}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Icon path={ICONS[item.icon]} />
                                {item.label}
                            </div>
                            {item.badge > 0 && (
                                <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-600 text-xs font-bold rounded-full">
                                    {item.badge}
                                </span>
                            )}
                        </div>
                    </ResponsiveNavLink>
                ))}
            </>
        );
    }

    return (
        <>
            {MENU.map(item => (
                <div key={item.routeName} className="relative inline-flex">
                    <NavLink
                        href={route(item.routeName)}
                        active={route().current(item.match)}
                        className="inline-flex items-center gap-1.5 px-1"
                    >
                        <Icon path={ICONS[item.icon]} />
                        {item.label}
                    </NavLink>
                    <Badge count={item.badge} />
                </div>
            ))}
        </>
    );
}