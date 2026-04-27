import { useState, useRef, useEffect } from 'react';
import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import NavLink from '@/Components/NavLink';
import ResponsiveNavLink from '@/Components/ResponsiveNavLink';
import { Link } from '@inertiajs/react';

// ── Icon helper ────────────────────────────────────────────────────────────
const Icon = ({ path, className = 'w-4 h-4' }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
    </svg>
);

const ICONS = {
    dashboard:  'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    users:      'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
    kelas:      'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    penugasan:  'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
    variabel:   'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z',
    rules:      'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    chevronDown:'M19 9l-7 7-7-7',
    chevronUp:  'M5 15l7-7 7 7',
    menu:       'M4 6h16M4 12h16M4 18h16',
    close:      'M6 18L18 6M6 6l12 12',
    profile:    'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    logout:     'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
};

// ── NavDropdown — dropdown menu di desktop navbar ─────────────────────────
function NavDropdown({ label, icon, active, children }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    // Tutup saat klik di luar
    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div ref={ref} className="relative flex items-center h-full">
            <button
                onClick={() => setOpen(v => !v)}
                className={`inline-flex items-center gap-1.5 border-b-2 px-1 pt-1 h-full text-sm font-medium leading-5
                    transition duration-150 ease-in-out focus:outline-none
                    ${active
                        ? 'border-indigo-400 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
            >
                {icon && <Icon path={icon} className="w-4 h-4" />}
                {label}
                <Icon
                    path={open ? ICONS.chevronUp : ICONS.chevronDown}
                    className="w-3.5 h-3.5 transition-transform duration-200"
                />
            </button>

            {/* Dropdown panel */}
            {open && (
                <div className="absolute top-full left-0 mt-1 w-52 rounded-lg shadow-lg
                    bg-white ring-1 ring-black ring-opacity-5 z-50 py-1 overflow-hidden
                    animate-in fade-in slide-in-from-top-1 duration-150">
                    {children}
                </div>
            )}
        </div>
    );
}

// ── Item dalam NavDropdown ────────────────────────────────────────────────
function NavDropdownItem({ href, icon, active, children, onClick }) {
    return (
        <Link
            href={href}
            onClick={onClick}
            className={`flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors duration-100
                ${active
                    ? 'bg-indigo-50 text-indigo-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
        >
            {icon && <Icon path={icon} className="w-4 h-4 shrink-0 opacity-70" />}
            {children}
        </Link>
    );
}

// ── Divider di dropdown ───────────────────────────────────────────────────
function DropdownDivider() {
    return <hr className="my-1 border-gray-100" />;
}

// ── Main Layout ───────────────────────────────────────────────────────────
export default function Authenticated({ user, header, children }) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [mobileKelola, setMobileKelola] = useState(false);
    const [mobileVariabel, setMobileVariabel] = useState(false);
    const [mobileRules, setMobileRules] = useState(false);

    const isGuruBk = user.role === 'guru_bk';

    // Cek apakah salah satu sub-route kelola sedang aktif
    const isKelolaActive = route().current('manage-user.*')
        || route().current('kelas.*')
        || route().current('penugasan.*');
    
    // Cek apakah salah satu sub-route variabel sedang aktif
    const isVariabelActive = route().current('variabel.*');
    
    // Cek apakah rules sedang aktif
    const isRulesActive = route().current('rules.*');

    return (
        <div className="min-h-screen bg-gray-100">

            {/* ═══════════════════════════════════════════════
                NAVBAR
            ═══════════════════════════════════════════════ */}
            <nav className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">

                        {/* ── Logo ──────────────────────────── */}
                        <div className="flex items-center gap-8">
                            <Link href="/" className="shrink-0 flex items-center">
                                <ApplicationLogo className="h-9 w-auto fill-current text-gray-800" />
                            </Link>

                            {/* ── Desktop Nav ─────────────────── */}
                            <div className="hidden sm:flex items-center h-16 space-x-1">

                                {/* Dashboard */}
                                <NavLink
                                    href={route('dashboard')}
                                    active={route().current('dashboard')}
                                    className="inline-flex items-center gap-1.5 px-1"
                                >
                                    <Icon path={ICONS.dashboard} className="w-4 h-4" />
                                    Dashboard
                                </NavLink>

                                {/* Kelola (dropdown) — hanya guru_bk */}
                                {isGuruBk && (
                                    <NavDropdown
                                        label="Kelola"
                                        icon={ICONS.users}
                                        active={isKelolaActive}
                                    >
                                        <NavDropdownItem
                                            href={route('manage-user.index')}
                                            icon={ICONS.users}
                                            active={route().current('manage-user.*')}
                                        >
                                            Kelola User
                                        </NavDropdownItem>

                                        <NavDropdownItem
                                            href={route('kelas.index')}
                                            icon={ICONS.kelas}
                                            active={route().current('kelas.*')}
                                        >
                                            Kelola Kelas
                                        </NavDropdownItem>

                                        <NavDropdownItem
                                            href={route('penugasan.index')}
                                            icon={ICONS.penugasan}
                                            active={route().current('penugasan.*')}
                                        >
                                            Kelola Penugasan
                                        </NavDropdownItem>
                                    </NavDropdown>
                                )}

                                {/* Kelola Variabel (dropdown terpisah) — hanya guru_bk */}
                                {isGuruBk && (
                                    <NavDropdown
                                        label="Kelola Variabel"
                                        icon={ICONS.variabel}
                                        active={isVariabelActive}
                                    >
                                        <NavDropdownItem
                                            href={route('variabel.pelanggaran.index')}
                                            icon={ICONS.variabel}
                                            active={route().current('variabel.pelanggaran.*')}
                                        >
                                            Variabel Pelanggaran
                                        </NavDropdownItem>

                                        <NavDropdownItem
                                            href={route('variabel.apresiasi.index')}
                                            icon={ICONS.variabel}
                                            active={route().current('variabel.apresiasi.*')}
                                        >
                                            Variabel Apresiasi
                                        </NavDropdownItem>

                                        <NavDropdownItem
                                            href={route('variabel.konselor.index')}
                                            icon={ICONS.variabel}
                                            active={route().current('variabel.konselor.*')}
                                        >
                                            Variabel Konselor
                                        </NavDropdownItem>

                                        <NavDropdownItem
                                            href={route('variabel.konsekuensi.index')}
                                            icon={ICONS.variabel}
                                            active={route().current('variabel.konsekuensi.*')}
                                        >
                                            Variabel Konsekuensi
                                        </NavDropdownItem>

                                        <NavDropdownItem
                                            href={route('variabel.reward.index')}
                                            icon={ICONS.variabel}
                                            active={route().current('variabel.reward.*')}
                                        >
                                            Variabel Reward
                                        </NavDropdownItem>

                                        <NavDropdownItem
                                            href={route('variabel.diagnosis.index')}
                                            icon={ICONS.variabel}
                                            active={route().current('variabel.diagnosis.*')}
                                        >
                                            Variabel Diagnosis
                                        </NavDropdownItem>
                                    </NavDropdown>
                                )}

                                {/* Rule Expert System (dropdown terpisah) — hanya guru_bk */}
                                {isGuruBk && (
                                    <NavDropdown
                                        label="Rule Expert System"
                                        icon={ICONS.rules}
                                        active={isRulesActive}
                                    >
                                        <NavDropdownItem
                                            href={route('rules.index')}
                                            icon={ICONS.rules}
                                            active={route().current('rules.index')}
                                        >
                                            Kelola Rule
                                        </NavDropdownItem>

                                        <NavDropdownItem
                                            href={route('rules.create')}
                                            icon={ICONS.rules}
                                            active={route().current('rules.create')}
                                        >
                                            Tambah Rule Baru
                                        </NavDropdownItem>
                                    </NavDropdown>
                                )}
                            </div>
                        </div>

                        {/* ── User Dropdown (desktop) ──────── */}
                        <div className="hidden sm:flex items-center gap-2">
                            {/* Badge role */}
                            <span className="hidden md:inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                                {user.role === 'guru_bk' ? 'Guru BK'
                                    : user.role === 'tenaga_pendidik' ? 'Tenaga Pendidik'
                                    : user.role === 'santri' ? 'Santri'
                                    : user.role}
                            </span>

                            <Dropdown>
                                <Dropdown.Trigger>
                                    <button className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
                                        text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition duration-150">
                                        {/* Avatar inisial */}
                                        <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700
                                            flex items-center justify-center text-xs font-bold uppercase">
                                            {(user.name || user.username || '?')[0]}
                                        </span>
                                        <span className="max-w-[120px] truncate">
                                            {user.name || user.username}
                                        </span>
                                        <Icon path={ICONS.chevronDown} className="w-3.5 h-3.5 opacity-60" />
                                    </button>
                                </Dropdown.Trigger>

                                <Dropdown.Content width="56" contentClasses="py-1 bg-white">
                                    {/* Info user */}
                                    <div className="px-4 py-3 border-b border-gray-100">
                                        <p className="text-sm font-semibold text-gray-900 truncate">
                                            {user.name || user.username}
                                        </p>
                                        <p className="text-xs text-gray-500 truncate mt-0.5">
                                            {user.email}
                                        </p>
                                    </div>

                                    <Dropdown.Link href={route('profile.edit')}
                                        className="flex items-center gap-2">
                                        <Icon path={ICONS.profile} className="w-4 h-4 opacity-60" />
                                        Profil Saya
                                    </Dropdown.Link>

                                    <div className="border-t border-gray-100 mt-1">
                                        <Dropdown.Link
                                            href={route('logout')}
                                            method="post"
                                            as="button"
                                            className="flex items-center gap-2 w-full text-red-600 hover:bg-red-50"
                                        >
                                            <Icon path={ICONS.logout} className="w-4 h-4" />
                                            Keluar
                                        </Dropdown.Link>
                                    </div>
                                </Dropdown.Content>
                            </Dropdown>
                        </div>

                        {/* ── Hamburger (mobile) ───────────── */}
                        <button
                            onClick={() => setMobileOpen(v => !v)}
                            className="sm:hidden inline-flex items-center justify-center p-2 rounded-lg
                                text-gray-400 hover:text-gray-600 hover:bg-gray-100
                                focus:outline-none focus:bg-gray-100 transition duration-150"
                            aria-label="Toggle menu"
                        >
                            <Icon
                                path={mobileOpen ? ICONS.close : ICONS.menu}
                                className="w-6 h-6"
                            />
                        </button>
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════
                    MOBILE MENU
                ═══════════════════════════════════════════════ */}
                <div className={`sm:hidden border-t border-gray-100 bg-white
                    transition-all duration-200 overflow-hidden
                    ${mobileOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}`}>

                    {/* Nav links */}
                    <div className="pt-2 pb-1 px-2 space-y-0.5">
                        <ResponsiveNavLink
                            href={route('dashboard')}
                            active={route().current('dashboard')}
                            onClick={() => setMobileOpen(false)}
                        >
                            <span className="flex items-center gap-2.5">
                                <Icon path={ICONS.dashboard} className="w-4 h-4 opacity-70" />
                                Dashboard
                            </span>
                        </ResponsiveNavLink>

                        {/* Kelola — accordion di mobile */}
                        {isGuruBk && (
                            <div>
                                {/* Toggle button Kelola */}
                                <button
                                    onClick={() => setMobileKelola(v => !v)}
                                    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium
                                        transition-colors duration-150
                                        ${isKelolaActive
                                            ? 'bg-indigo-50 text-indigo-700'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                >
                                    <span className="flex items-center gap-2.5">
                                        <Icon path={ICONS.users} className="w-4 h-4 opacity-70" />
                                        Kelola
                                    </span>
                                    <Icon
                                        path={mobileKelola ? ICONS.chevronUp : ICONS.chevronDown}
                                        className="w-4 h-4 opacity-60 transition-transform duration-200"
                                    />
                                </button>

                                {/* Sub menu Kelola */}
                                <div className={`overflow-hidden transition-all duration-200
                                    ${mobileKelola ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                                    <div className="pl-4 pb-1 space-y-0.5">
                                        <ResponsiveNavLink
                                            href={route('manage-user.index')}
                                            active={route().current('manage-user.*')}
                                            onClick={() => setMobileOpen(false)}
                                        >
                                            <span className="flex items-center gap-2.5 pl-2">
                                                <Icon path={ICONS.users} className="w-4 h-4 opacity-70" />
                                                Kelola User
                                            </span>
                                        </ResponsiveNavLink>

                                        <ResponsiveNavLink
                                            href={route('kelas.index')}
                                            active={route().current('kelas.*')}
                                            onClick={() => setMobileOpen(false)}
                                        >
                                            <span className="flex items-center gap-2.5 pl-2">
                                                <Icon path={ICONS.kelas} className="w-4 h-4 opacity-70" />
                                                Kelola Kelas
                                            </span>
                                        </ResponsiveNavLink>

                                        <ResponsiveNavLink
                                            href={route('penugasan.index')}
                                            active={route().current('penugasan.*')}
                                            onClick={() => setMobileOpen(false)}
                                        >
                                            <span className="flex items-center gap-2.5 pl-2">
                                                <Icon path={ICONS.penugasan} className="w-4 h-4 opacity-70" />
                                                Kelola Penugasan
                                            </span>
                                        </ResponsiveNavLink>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Kelola Variabel — accordion terpisah di mobile */}
                        {isGuruBk && (
                            <div>
                                {/* Toggle button Kelola Variabel */}
                                <button
                                    onClick={() => setMobileVariabel(v => !v)}
                                    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium
                                        transition-colors duration-150
                                        ${isVariabelActive
                                            ? 'bg-indigo-50 text-indigo-700'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                >
                                    <span className="flex items-center gap-2.5">
                                        <Icon path={ICONS.variabel} className="w-4 h-4 opacity-70" />
                                        Kelola Variabel
                                    </span>
                                    <Icon
                                        path={mobileVariabel ? ICONS.chevronUp : ICONS.chevronDown}
                                        className="w-4 h-4 opacity-60 transition-transform duration-200"
                                    />
                                </button>

                                {/* Sub menu Kelola Variabel */}
                                <div className={`overflow-hidden transition-all duration-200
                                    ${mobileVariabel ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'}`}>
                                    <div className="pl-4 pb-1 space-y-0.5">
                                        <ResponsiveNavLink
                                            href={route('variabel.pelanggaran.index')}
                                            active={route().current('variabel.pelanggaran.*')}
                                            onClick={() => setMobileOpen(false)}
                                        >
                                            <span className="flex items-center gap-2.5 pl-2">
                                                <Icon path={ICONS.variabel} className="w-4 h-4 opacity-70" />
                                                Variabel Pelanggaran
                                            </span>
                                        </ResponsiveNavLink>

                                        <ResponsiveNavLink
                                            href={route('variabel.apresiasi.index')}
                                            active={route().current('variabel.apresiasi.*')}
                                            onClick={() => setMobileOpen(false)}
                                        >
                                            <span className="flex items-center gap-2.5 pl-2">
                                                <Icon path={ICONS.variabel} className="w-4 h-4 opacity-70" />
                                                Variabel Apresiasi
                                            </span>
                                        </ResponsiveNavLink>

                                        <ResponsiveNavLink
                                            href={route('variabel.konselor.index')}
                                            active={route().current('variabel.konselor.*')}
                                            onClick={() => setMobileOpen(false)}
                                        >
                                            <span className="flex items-center gap-2.5 pl-2">
                                                <Icon path={ICONS.variabel} className="w-4 h-4 opacity-70" />
                                                Variabel Konselor
                                            </span>
                                        </ResponsiveNavLink>

                                        <ResponsiveNavLink
                                            href={route('variabel.konsekuensi.index')}
                                            active={route().current('variabel.konsekuensi.*')}
                                            onClick={() => setMobileOpen(false)}
                                        >
                                            <span className="flex items-center gap-2.5 pl-2">
                                                <Icon path={ICONS.variabel} className="w-4 h-4 opacity-70" />
                                                Variabel Konsekuensi
                                            </span>
                                        </ResponsiveNavLink>

                                        <ResponsiveNavLink
                                            href={route('variabel.reward.index')}
                                            active={route().current('variabel.reward.*')}
                                            onClick={() => setMobileOpen(false)}
                                        >
                                            <span className="flex items-center gap-2.5 pl-2">
                                                <Icon path={ICONS.variabel} className="w-4 h-4 opacity-70" />
                                                Variabel Reward
                                            </span>
                                        </ResponsiveNavLink>

                                        <ResponsiveNavLink
                                            href={route('variabel.diagnosis.index')}
                                            active={route().current('variabel.diagnosis.*')}
                                            onClick={() => setMobileOpen(false)}
                                        >
                                            <span className="flex items-center gap-2.5 pl-2">
                                                <Icon path={ICONS.variabel} className="w-4 h-4 opacity-70" />
                                                Variabel Diagnosis
                                            </span>
                                        </ResponsiveNavLink>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Rule Expert System — accordion terpisah di mobile */}
                        {isGuruBk && (
                            <div>
                                {/* Toggle button Rule Expert System */}
                                <button
                                    onClick={() => setMobileRules(v => !v)}
                                    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium
                                        transition-colors duration-150
                                        ${isRulesActive
                                            ? 'bg-indigo-50 text-indigo-700'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                >
                                    <span className="flex items-center gap-2.5">
                                        <Icon path={ICONS.rules} className="w-4 h-4 opacity-70" />
                                        Rule Expert System
                                    </span>
                                    <Icon
                                        path={mobileRules ? ICONS.chevronUp : ICONS.chevronDown}
                                        className="w-4 h-4 opacity-60 transition-transform duration-200"
                                    />
                                </button>

                                {/* Sub menu Rule Expert System */}
                                <div className={`overflow-hidden transition-all duration-200
                                    ${mobileRules ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0'}`}>
                                    <div className="pl-4 pb-1 space-y-0.5">
                                        <ResponsiveNavLink
                                            href={route('rules.index')}
                                            active={route().current('rules.index')}
                                            onClick={() => setMobileOpen(false)}
                                        >
                                            <span className="flex items-center gap-2.5 pl-2">
                                                <Icon path={ICONS.rules} className="w-4 h-4 opacity-70" />
                                                Kelola Rule
                                            </span>
                                        </ResponsiveNavLink>

                                        <ResponsiveNavLink
                                            href={route('rules.create')}
                                            active={route().current('rules.create')}
                                            onClick={() => setMobileOpen(false)}
                                        >
                                            <span className="flex items-center gap-2.5 pl-2">
                                                <Icon path={ICONS.rules} className="w-4 h-4 opacity-70" />
                                                Tambah Rule Baru
                                            </span>
                                        </ResponsiveNavLink>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* User info + actions */}
                    <div className="border-t border-gray-100 px-2 py-3">
                        {/* Info user */}
                        <div className="flex items-center gap-3 px-4 py-2 mb-1">
                            <span className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700
                                flex items-center justify-center text-sm font-bold uppercase shrink-0">
                                {(user.name || user.username || '?')[0]}
                            </span>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">
                                    {user.name || user.username}
                                </p>
                                <p className="text-xs text-gray-500 truncate">{user.email}</p>
                            </div>
                        </div>

                        <ResponsiveNavLink href={route('profile.edit')} onClick={() => setMobileOpen(false)}>
                            <span className="flex items-center gap-2.5">
                                <Icon path={ICONS.profile} className="w-4 h-4 opacity-70" />
                                Profil Saya
                            </span>
                        </ResponsiveNavLink>

                        <ResponsiveNavLink
                            method="post"
                            href={route('logout')}
                            as="button"
                            onClick={() => setMobileOpen(false)}
                        >
                            <span className="flex items-center gap-2.5 text-red-600">
                                <Icon path={ICONS.logout} className="w-4 h-4" />
                                Keluar
                            </span>
                        </ResponsiveNavLink>
                    </div>
                </div>
            </nav>

            {/* ═══════════════════════════════════════════════
                PAGE HEADER
            ═══════════════════════════════════════════════ */}
            {header && (
                <header className="bg-white shadow-sm">
                    <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
                        {header}
                    </div>
                </header>
            )}

            {/* ═══════════════════════════════════════════════
                MAIN CONTENT
            ═══════════════════════════════════════════════ */}
            <main>{children}</main>
        </div>
    );
}