import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';

export default function EnhancedTopBar({ sidebarOpen, setSidebarOpen, setMobileSidebarOpen }) {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Update clock every second
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // Handle search
    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            // Navigate to search results
            router.get(route('search'), { q: searchQuery });
        }
    };

    // Icon helper
    const Icon = ({ path, className = 'w-5 h-5' }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
        </svg>
    );

    const ICONS = {
        menu: 'M4 6h16M4 12h16M4 18h16',
        search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
        close: 'M6 18L18 6M6 6l12 12',
        bell: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
        plus: 'M12 4v16m8-8H4',
        chart: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
        calendar: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
        clock: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    };

    // Format time
    const formatTime = (date) => {
        return date.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };

    // Format date
    const formatDate = (date) => {
        return date.toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    return (
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
            <div className="flex items-center justify-between h-16 px-4 lg:px-6">
                {/* Left Side */}
                <div className="flex items-center gap-4">
                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setMobileSidebarOpen(true)}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors lg:hidden"
                        title="Open Menu"
                    >
                        <Icon path={ICONS.menu} className="w-6 h-6 text-gray-700" />
                    </button>

                    {/* Desktop Toggle */}
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="hidden lg:block p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        title={sidebarOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
                    >
                        <Icon path={ICONS.menu} className="w-5 h-5 text-gray-700" />
                    </button>

                    {/* Search Bar */}
                    <div className="relative hidden md:block">
                        {!searchOpen ? (
                            <button
                                onClick={() => setSearchOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                <Icon path={ICONS.search} className="w-5 h-5 text-gray-500" />
                                <span className="text-sm text-gray-500">Search...</span>
                                <kbd className="hidden lg:inline-block px-2 py-1 text-xs font-semibold text-gray-500 bg-white border border-gray-300 rounded">
                                    Ctrl K
                                </kbd>
                            </button>
                        ) : (
                            <form onSubmit={handleSearch} className="relative">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Cari santri, laporan, variabel..."
                                    className="w-64 lg:w-96 px-4 py-2 pl-10 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                    autoFocus
                                />
                                <Icon 
                                    path={ICONS.search} 
                                    className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearchOpen(false);
                                        setSearchQuery('');
                                    }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                                >
                                    <Icon path={ICONS.close} className="w-4 h-4 text-gray-500" />
                                </button>
                            </form>
                        )}
                    </div>
                </div>

                {/* Right Side */}
                <div className="flex items-center gap-3">
                    {/* Clock Display */}
                    <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-100">
                        <Icon path={ICONS.clock} className="w-5 h-5 text-indigo-600" />
                        <div className="flex flex-col">
                            <span className="text-xs font-medium text-indigo-600">
                                {formatTime(currentTime)}
                            </span>
                            <span className="text-xs text-gray-500">
                                {formatDate(currentTime)}
                            </span>
                        </div>
                    </div>

                    {/* Mobile Date (simplified) */}
                    <div className="flex lg:hidden items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                        <Icon path={ICONS.calendar} className="w-5 h-5 text-gray-600" />
                        <span className="text-xs text-gray-600">
                            {currentTime.toLocaleDateString('id-ID', { 
                                day: 'numeric', 
                                month: 'short' 
                            })}
                        </span>
                    </div>

                    {/* Quick Actions */}
                    <div className="hidden md:flex items-center gap-2">
                        {/* Add Report Button */}
                        <button
                            onClick={() => router.visit(route('laporan.create'))}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-sm"
                            title="Buat Laporan Baru"
                        >
                            <Icon path={ICONS.plus} className="w-5 h-5" />
                            <span className="hidden xl:inline text-sm font-medium">Laporan</span>
                        </button>

                        {/* Statistics Quick View */}
                        <button
                            onClick={() => router.visit(route('dashboard'))}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Dashboard"
                        >
                            <Icon path={ICONS.chart} className="w-5 h-5 text-gray-600" />
                        </button>

                        {/* Notifications */}
                        <button
                            className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Notifikasi"
                        >
                            <Icon path={ICONS.bell} className="w-5 h-5 text-gray-600" />
                            {/* Notification Badge */}
                            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Search (below main bar) */}
            {searchOpen && (
                <div className="md:hidden px-4 pb-4">
                    <form onSubmit={handleSearch} className="relative">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari santri, laporan..."
                            className="w-full px-4 py-2 pl-10 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            autoFocus
                        />
                        <Icon 
                            path={ICONS.search} 
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                        />
                        <button
                            type="button"
                            onClick={() => {
                                setSearchOpen(false);
                                setSearchQuery('');
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                        >
                            <Icon path={ICONS.close} className="w-4 h-4 text-gray-500" />
                        </button>
                    </form>
                </div>
            )}

            {/* Search Button for Mobile */}
            <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="md:hidden fixed bottom-20 right-4 z-50 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all"
            >
                <Icon path={searchOpen ? ICONS.close : ICONS.search} className="w-6 h-6" />
            </button>
        </div>
    );
}