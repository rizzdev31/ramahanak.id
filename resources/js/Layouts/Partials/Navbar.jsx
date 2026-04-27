import { Link } from '@inertiajs/react';
import ApplicationLogo from '@/Components/ApplicationLogo';
import UserMenu from './UserMenu';

export default function NavBar({ user, navigation, mobileMenuOpen, setMobileMenuOpen }) {
    return (
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    
                    {/* Left: Logo */}
                    <div className="flex items-center gap-8">
                        <Link href={route('dashboard')} className="flex items-center gap-3 shrink-0">
                            <ApplicationLogo className="h-9 w-auto fill-current text-indigo-600" />
                            <span className="hidden sm:block text-lg font-bold text-gray-900">
                                Ramah Anak
                            </span>
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden lg:flex items-center h-16 space-x-1">
                            {navigation}
                        </div>
                    </div>

                    {/* Right: User Menu & Mobile Toggle */}
                    <div className="flex items-center gap-4">
                        {/* User Menu */}
                        <UserMenu user={user} />

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="lg:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                        >
                            <span className="sr-only">Open menu</span>
                            {mobileMenuOpen ? (
                                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            ) : (
                                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}