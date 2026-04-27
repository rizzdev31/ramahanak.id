import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { useState, useEffect } from 'react';

export default function Index({ auth, santriList, kelasList, filters }) {
    const [search, setSearch] = useState(filters?.search || '');
    const [selectedStatus, setSelectedStatus] = useState(filters?.status || '');
    const [selectedKelas, setSelectedKelas] = useState(filters?.kelas_id || '');

    // Update state when filters change from server
    useEffect(() => {
        setSearch(filters?.search || '');
        setSelectedStatus(filters?.status || '');
        setSelectedKelas(filters?.kelas_id || '');
    }, [filters]);

    // Handle search
    const handleSearch = (e) => {
        e.preventDefault();
        applyFilters();
    };

    // Apply filters
    const applyFilters = () => {
        const params = {};
        
        if (search) params.search = search;
        if (selectedStatus) params.status = selectedStatus;
        if (selectedKelas) params.kelas_id = selectedKelas;

        router.get(route('santri.index'), params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    // Handle filter change
    const handleFilterChange = (filterType, value) => {
        if (filterType === 'status') {
            setSelectedStatus(value);
        } else if (filterType === 'kelas') {
            setSelectedKelas(value);
        }
        
        // Auto apply after state update
        setTimeout(() => {
            const params = {};
            if (search) params.search = search;
            if (filterType === 'status' && value) params.status = value;
            else if (selectedStatus) params.status = selectedStatus;
            if (filterType === 'kelas' && value) params.kelas_id = value;
            else if (selectedKelas) params.kelas_id = selectedKelas;

            router.get(route('santri.index'), params, {
                preserveState: true,
                preserveScroll: true,
            });
        }, 100);
    };

    // Clear filters
    const clearFilters = () => {
        setSearch('');
        setSelectedStatus('');
        setSelectedKelas('');
        router.get(route('santri.index'));
    };

    // Calculate statistics for charts
    const stats = {
        total: santriList.total || 0,
        active: santriList.data.filter(s => s.status === 'active').length,
        pending: santriList.data.filter(s => s.status === 'pending').length,
        unactive: santriList.data.filter(s => s.status === 'unactive').length,
    };

    return (
        <AppLayout
            user={auth.user}
            header={
                <div className="flex justify-between items-center">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        📊 Profil Santri
                    </h2>
                    <div className="text-sm text-gray-600">
                        Total: {santriList.total} santri
                    </div>
                </div>
            }
        >
            <Head title="Profil Santri" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    
                    {/* Statistics Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Total Santri</p>
                                        <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                        <span className="text-2xl">👥</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Aktif</p>
                                        <p className="text-3xl font-bold text-green-600">{stats.active}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                        <span className="text-2xl">✅</span>
                                    </div>
                                </div>
                                {stats.total > 0 && (
                                    <div className="mt-2">
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div 
                                                className="bg-green-600 h-2 rounded-full" 
                                                style={{ width: `${(stats.active / stats.total) * 100}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {((stats.active / stats.total) * 100).toFixed(1)}%
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Pending</p>
                                        <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                                        <span className="text-2xl">⏳</span>
                                    </div>
                                </div>
                                {stats.total > 0 && (
                                    <div className="mt-2">
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div 
                                                className="bg-yellow-600 h-2 rounded-full" 
                                                style={{ width: `${(stats.pending / stats.total) * 100}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {((stats.pending / stats.total) * 100).toFixed(1)}%
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Tidak Aktif</p>
                                        <p className="text-3xl font-bold text-gray-600">{stats.unactive}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                                        <span className="text-2xl">❌</span>
                                    </div>
                                </div>
                                {stats.total > 0 && (
                                    <div className="mt-2">
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div 
                                                className="bg-gray-600 h-2 rounded-full" 
                                                style={{ width: `${(stats.unactive / stats.total) * 100}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {((stats.unactive / stats.total) * 100).toFixed(1)}%
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    {/* Search & Filter Section - Simplified */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <div className="flex flex-col md:flex-row gap-4">
                                
                                {/* Search */}
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        🔍 Cari Santri
                                    </label>
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSearch(e)}
                                        placeholder="Ketik nama atau NISN santri..."
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    />
                                </div>

                                {/* Filter Status */}
                                <div className="w-full md:w-48">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        📊 Status
                                    </label>
                                    <select
                                        value={selectedStatus}
                                        onChange={(e) => handleFilterChange('status', e.target.value)}
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    >
                                        <option value="">Semua Status</option>
                                        <option value="active">✅ Aktif</option>
                                        <option value="pending">⏳ Pending</option>
                                        <option value="unactive">❌ Tidak Aktif</option>
                                    </select>
                                </div>

                                {/* Filter Kelas */}
                                <div className="w-full md:w-64">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        🏫 Kelas
                                    </label>
                                    <select
                                        value={selectedKelas}
                                        onChange={(e) => handleFilterChange('kelas', e.target.value)}
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    >
                                        <option value="">Semua Kelas</option>
                                        {kelasList && kelasList.map((kelas) => (
                                            <option key={kelas.id} value={kelas.id}>
                                                {kelas.kode_kelas}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-end gap-2">
                                    <button
                                        onClick={handleSearch}
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                                    >
                                        Cari
                                    </button>
                                    
                                    {(search || selectedStatus || selectedKelas) && (
                                        <button
                                            onClick={clearFilters}
                                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 font-medium"
                                        >
                                            Reset
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Active Filters Info */}
                            {(search || selectedStatus || selectedKelas) && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <span className="font-medium">Filter aktif:</span>
                                        {search && (
                                            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full">
                                                Pencarian: "{search}"
                                            </span>
                                        )}
                                        {selectedStatus && (
                                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full">
                                                Status: {selectedStatus === 'active' ? 'Aktif' : selectedStatus === 'pending' ? 'Pending' : 'Tidak Aktif'}
                                            </span>
                                        )}
                                        {selectedKelas && (
                                            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
                                                Kelas: {kelasList.find(k => k.id == selectedKelas)?.kode_kelas}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Santri Grid - Simplified */}
                    {santriList.data.length === 0 ? (
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-12 text-center text-gray-500">
                                <div className="text-6xl mb-4">🔍</div>
                                <p className="text-lg font-medium">Tidak ada santri ditemukan</p>
                                <p className="text-sm mt-2">Coba ubah filter atau kata kunci pencarian</p>
                                {(search || selectedStatus || selectedKelas) && (
                                    <button
                                        onClick={clearFilters}
                                        className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                                    >
                                        Reset Filter
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Results Info */}
                            <div className="flex justify-between items-center">
                                <p className="text-sm text-gray-600">
                                    Menampilkan <span className="font-semibold">{santriList.from}</span> - <span className="font-semibold">{santriList.to}</span> dari <span className="font-semibold">{santriList.total}</span> santri
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {santriList.data.map((santri) => (
                                    <Link
                                        key={santri.id}
                                        href={route('santri.profil', santri.id)}
                                        className="bg-white overflow-hidden shadow-sm sm:rounded-lg hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1"
                                    >
                                        <div className="p-5">
                                            {/* Header with Photo */}
                                            <div className="flex items-center gap-3 mb-4">
                                                {/* Photo */}
                                                {santri.foto ? (
                                                    <img
                                                        src={santri.foto}
                                                        alt={santri.nama}
                                                        className="w-14 h-14 rounded-full object-cover border-2 border-indigo-200"
                                                    />
                                                ) : (
                                                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                                                        {santri.nama.charAt(0).toUpperCase()}
                                                    </div>
                                                )}

                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-gray-900 truncate text-sm">
                                                        {santri.nama}
                                                    </h3>
                                                    <p className="text-xs text-gray-500 truncate">
                                                        {santri.nisn}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Status Badge */}
                                            <div className="mb-3">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    santri.status === 'active' 
                                                        ? 'bg-green-100 text-green-800'
                                                        : santri.status === 'pending'
                                                        ? 'bg-yellow-100 text-yellow-800'
                                                        : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {santri.status === 'active' ? '✅ Aktif' : 
                                                     santri.status === 'pending' ? '⏳ Pending' : 
                                                     '❌ Tidak Aktif'}
                                                </span>
                                            </div>

                                            {/* Kelas Info */}
                                            {santri.kelas ? (
                                                <div className="mb-3 p-2 bg-indigo-50 rounded-md">
                                                    <div className="text-xs text-indigo-600 font-medium">
                                                        🏫 {santri.kelas.kode}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="mb-3 p-2 bg-gray-50 rounded-md">
                                                    <div className="text-xs text-gray-500">
                                                        Belum ada kelas
                                                    </div>
                                                </div>
                                            )}

                                            {/* Quick Stats */}
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="text-center p-2 bg-red-50 rounded-md">
                                                    <div className="text-lg font-bold text-red-600">
                                                        {santri.total_pelanggaran}
                                                    </div>
                                                    <div className="text-xs text-red-600">Pelanggaran</div>
                                                </div>
                                                <div className="text-center p-2 bg-green-50 rounded-md">
                                                    <div className="text-lg font-bold text-green-600">
                                                        {santri.total_apresiasi}
                                                    </div>
                                                    <div className="text-xs text-green-600">Apresiasi</div>
                                                </div>
                                            </div>

                                            {/* View Link */}
                                            <div className="mt-3 pt-3 border-t border-gray-100 text-center">
                                                <span className="text-xs text-indigo-600 font-medium hover:text-indigo-800">
                                                    Lihat Detail Profil →
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>

                            {/* Pagination */}
                            {santriList.links && santriList.links.length > 3 && (
                                <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                    <div className="p-6">
                                        <div className="flex flex-wrap justify-center gap-2">
                                            {santriList.links.map((link, index) => (
                                                <Link
                                                    key={index}
                                                    href={link.url || '#'}
                                                    preserveState
                                                    preserveScroll
                                                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                                                        link.active
                                                            ? 'bg-indigo-600 text-white'
                                                            : link.url
                                                            ? 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                                                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                    }`}
                                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}