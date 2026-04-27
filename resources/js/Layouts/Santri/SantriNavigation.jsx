import NavLink from '@/Components/NavLink';
import ResponsiveNavLink from '@/Components/ResponsiveNavLink';

// Icon helper
const Icon = ({ path, className = 'w-4 h-4' }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
    </svg>
);

const ICONS = {
    dashboard: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    profil:    'M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
    points:    'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    konseling: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z',
    report:    'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
};

export default function SantriNavigation({ isMobile = false }) {
    if (isMobile) {
        return (
            <>
                <ResponsiveNavLink href={route('dashboard')} active={route().current('dashboard')}>
                    <div className="flex items-center gap-2">
                        <Icon path={ICONS.dashboard} />
                        Dashboard
                    </div>
                </ResponsiveNavLink>

                {/* Rekam Jejak Saya - halaman monitoring diri */}
                <ResponsiveNavLink href={route('my-profil.index')} active={route().current('my-profil.*')}>
                    <div className="flex items-center gap-2">
                        <Icon path={ICONS.profil} />
                        Rekam Jejak
                    </div>
                </ResponsiveNavLink>

                <ResponsiveNavLink href={route('my-expert-system-point.index')} active={route().current('my-expert-system-point.*')}>
                    <div className="flex items-center gap-2">
                        <Icon path={ICONS.points} />
                        Expert Point
                    </div>
                </ResponsiveNavLink>

                <ResponsiveNavLink href={route('my-konseling.index')} active={route().current('my-konseling.*')}>
                    <div className="flex items-center gap-2">
                        <Icon path={ICONS.konseling} />
                        Konseling
                    </div>
                </ResponsiveNavLink>

                <ResponsiveNavLink href={route('laporan.create')} active={route().current('laporan.*')}>
                    <div className="flex items-center gap-2">
                        <Icon path={ICONS.report} />
                        Buat Laporan
                    </div>
                </ResponsiveNavLink>
            </>
        );
    }

    return (
        <>
            <NavLink
                href={route('dashboard')}
                active={route().current('dashboard')}
                className="inline-flex items-center gap-1.5 px-1"
            >
                <Icon path={ICONS.dashboard} />
                Dashboard
            </NavLink>

            {/* Rekam Jejak Saya */}
            <NavLink
                href={route('my-profil.index')}
                active={route().current('my-profil.*')}
                className="inline-flex items-center gap-1.5 px-1"
            >
                <Icon path={ICONS.profil} />
                Rekam Jejak
            </NavLink>

            <NavLink
                href={route('my-expert-system-point.index')}
                active={route().current('my-expert-system-point.*')}
                className="inline-flex items-center gap-1.5 px-1"
            >
                <Icon path={ICONS.points} />
                Expert Point
            </NavLink>

            <NavLink
                href={route('my-konseling.index')}
                active={route().current('my-konseling.*')}
                className="inline-flex items-center gap-1.5 px-1"
            >
                <Icon path={ICONS.konseling} />
                Konseling
            </NavLink>

            <NavLink
                href={route('laporan.create')}
                active={route().current('laporan.*')}
                className="inline-flex items-center gap-1.5 px-1"
            >
                <Icon path={ICONS.report} />
                Buat Laporan
            </NavLink>
        </>
    );
}