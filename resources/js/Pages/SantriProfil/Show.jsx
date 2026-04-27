import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { useState } from 'react';

export default function Show({ 
    auth, 
    santriInfo, 
    kelasInfo, 
    waliKelas, 
    waliAsrama, 
    statistics,
    laporanPelanggaran,
    laporanApresiasi,
    laporanKonseling,
    expertSystemPoint,
    expertSystemKonselor,
    timeline,
    riwayatKelas
}) {
    const [activeTab, setActiveTab] = useState('overview');

    return (
        <AppLayout
            user={auth.user}
            header={
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link
                            href={route('santri.index')}
                            className="text-gray-600 hover:text-gray-900"
                        >
                            ← Kembali
                        </Link>
                        <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                            📊 Profil Santri: {santriInfo.nama_lengkap}
                        </h2>
                    </div>
                </div>
            }
        >
            <Head title={`Profil ${santriInfo.nama_lengkap}`} />

            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    
                    {/* Header Card - Informasi Santri */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <div className="flex flex-col md:flex-row gap-6">
                                {/* Photo */}
                                <div className="flex-shrink-0">
                                    {santriInfo.foto ? (
                                        <img
                                            src={santriInfo.foto}
                                            alt={santriInfo.nama_lengkap}
                                            className="w-32 h-32 rounded-lg object-cover border-4 border-gray-200"
                                        />
                                    ) : (
                                        <div className="w-32 h-32 rounded-lg bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white text-4xl font-bold">
                                            {santriInfo.nama_lengkap.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h1 className="text-2xl font-bold text-gray-900">
                                                {santriInfo.nama_lengkap}
                                            </h1>
                                            {santriInfo.nama_panggilan !== '-' && (
                                                <p className="text-gray-600">
                                                    ({santriInfo.nama_panggilan})
                                                </p>
                                            )}
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                            santriInfo.status === 'active' 
                                                ? 'bg-green-100 text-green-800'
                                                : santriInfo.status === 'pending'
                                                ? 'bg-yellow-100 text-yellow-800'
                                                : 'bg-gray-100 text-gray-800'
                                        }`}>
                                            {santriInfo.status === 'active' ? '✅ Aktif' : 
                                             santriInfo.status === 'pending' ? '⏳ Pending' : 
                                             '❌ Tidak Aktif'}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <div>
                                            <div className="text-xs text-gray-500">NISN</div>
                                            <div className="font-medium">{santriInfo.nisn}</div>
                                        </div>
                                        {santriInfo.jenis_kelamin !== '-' && (
                                            <div>
                                                <div className="text-xs text-gray-500">Jenis Kelamin</div>
                                                <div className="font-medium">
                                                    {santriInfo.jenis_kelamin === 'L' ? '👨 Laki-laki' : '👩 Perempuan'}
                                                </div>
                                            </div>
                                        )}
                                        {santriInfo.tempat_lahir !== '-' && (
                                            <div>
                                                <div className="text-xs text-gray-500">Tempat, Tanggal Lahir</div>
                                                <div className="font-medium">
                                                    {santriInfo.tempat_lahir}, {santriInfo.tanggal_lahir}
                                                </div>
                                            </div>
                                        )}
                                        {santriInfo.nama_wali !== '-' && (
                                            <div>
                                                <div className="text-xs text-gray-500">Wali Santri</div>
                                                <div className="font-medium">{santriInfo.nama_wali}</div>
                                            </div>
                                        )}
                                        {santriInfo.no_whatsapp !== '-' && (
                                            <div>
                                                <div className="text-xs text-gray-500">WhatsApp</div>
                                                <div className="font-medium">{santriInfo.no_whatsapp}</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Kelas & Wali Info */}
                            {kelasInfo && (
                                <div className="mt-6 pt-6 border-t border-gray-200">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {/* Kelas */}
                                        <div className="bg-indigo-50 p-4 rounded-lg">
                                            <div className="text-sm text-indigo-600 font-medium mb-2">
                                                🏫 Kelas
                                            </div>
                                            <div className="text-lg font-bold text-gray-900">
                                                {kelasInfo.kode}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                {kelasInfo.nama}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                Tingkat {kelasInfo.tingkat} - {kelasInfo.tahun_ajaran}
                                            </div>
                                        </div>

                                        {/* Wali Kelas */}
                                        {waliKelas && (
                                            <div className="bg-green-50 p-4 rounded-lg">
                                                <div className="text-sm text-green-600 font-medium mb-2">
                                                    👤 Wali Kelas
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {waliKelas.foto ? (
                                                        <img
                                                            src={waliKelas.foto}
                                                            alt={waliKelas.nama}
                                                            className="w-10 h-10 rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-full bg-green-200 flex items-center justify-center text-green-700 font-bold">
                                                            {waliKelas.nama.charAt(0)}
                                                        </div>
                                                    )}
                                                    <div className="font-medium text-gray-900">
                                                        {waliKelas.nama}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Wali Asrama */}
                                        {waliAsrama && waliAsrama.length > 0 && (
                                            <div className="bg-blue-50 p-4 rounded-lg">
                                                <div className="text-sm text-blue-600 font-medium mb-2">
                                                    🏠 Wali Asrama
                                                </div>
                                                <div className="space-y-2">
                                                    {waliAsrama.map((wali, idx) => (
                                                        <div key={idx} className="flex items-center gap-3">
                                                            {wali.foto ? (
                                                                <img
                                                                    src={wali.foto}
                                                                    alt={wali.nama}
                                                                    className="w-8 h-8 rounded-full object-cover"
                                                                />
                                                            ) : (
                                                                <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold text-sm">
                                                                    {wali.nama.charAt(0)}
                                                                </div>
                                                            )}
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {wali.nama}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Statistics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        {statistics.map((stat, idx) => (
                            <div key={idx} className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                <div className="p-6">
                                    <div className={`text-3xl font-bold mb-2 ${
                                        stat.color === 'red' ? 'text-red-600' :
                                        stat.color === 'green' ? 'text-green-600' :
                                        stat.color === 'blue' ? 'text-blue-600' :
                                        stat.color === 'purple' ? 'text-purple-600' :
                                        stat.color === 'yellow' ? 'text-yellow-600' :
                                        'text-gray-600'
                                    }`}>
                                        {stat.value}
                                    </div>
                                    <div className="text-sm text-gray-600 font-medium">
                                        {stat.label}
                                    </div>
                                    {stat.poin !== null && stat.poin !== undefined && (
                                        <div className="text-xs text-gray-500 mt-1">
                                            Poin: {stat.poin}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Tabs Navigation */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="border-b border-gray-200">
                            <nav className="flex -mb-px overflow-x-auto">
                                {[
                                    { key: 'overview', label: '📊 Overview', count: null },
                                    { key: 'pelanggaran', label: '⚠️ Pelanggaran', count: laporanPelanggaran.length },
                                    { key: 'apresiasi', label: '⭐ Apresiasi', count: laporanApresiasi.length },
                                    { key: 'konseling', label: '💙 Konseling', count: laporanKonseling.length },
                                    { key: 'expert_point', label: '⚡ Expert Point', count: expertSystemPoint.length },
                                    { key: 'expert_konselor', label: '🧠 Expert Konselor', count: expertSystemKonselor.length },
                                    { key: 'timeline', label: '📅 Timeline', count: timeline.length },
                                ].map((tab) => (
                                    <button
                                        key={tab.key}
                                        onClick={() => setActiveTab(tab.key)}
                                        className={`px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                                            activeTab === tab.key
                                                ? 'border-indigo-600 text-indigo-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                    >
                                        {tab.label}
                                        {tab.count !== null && (
                                            <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                                                activeTab === tab.key
                                                    ? 'bg-indigo-100 text-indigo-600'
                                                    : 'bg-gray-100 text-gray-600'
                                            }`}>
                                                {tab.count}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </nav>
                        </div>

                        {/* Tab Content */}
                        <div className="p-6">
                            {/* Overview Tab */}
                            {activeTab === 'overview' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Recent Activity */}
                                        <div>
                                            <h3 className="text-lg font-semibold mb-4">📋 Aktivitas Terbaru</h3>
                                            {timeline.length === 0 ? (
                                                <p className="text-gray-500 text-center py-8">Belum ada aktivitas</p>
                                            ) : (
                                                <div className="space-y-3">
                                                    {timeline.slice(0, 5).map((item, idx) => (
                                                        <div key={idx} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                                                            <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${
                                                                item.color === 'red' ? 'bg-red-500' :
                                                                item.color === 'green' ? 'bg-green-500' :
                                                                item.color === 'blue' ? 'bg-blue-500' :
                                                                'bg-gray-500'
                                                            }`} />
                                                            <div className="flex-1">
                                                                <div className="font-medium text-gray-900">{item.title}</div>
                                                                <div className="text-sm text-gray-600">{item.description}</div>
                                                                <div className="text-xs text-gray-500 mt-1">{item.date_display}</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Riwayat Kelas */}
                                        <div>
                                            <h3 className="text-lg font-semibold mb-4">🏫 Riwayat Kelas</h3>
                                            {riwayatKelas.length === 0 ? (
                                                <p className="text-gray-500 text-center py-8">Belum ada riwayat kelas</p>
                                            ) : (
                                                <div className="space-y-3">
                                                    {riwayatKelas.map((riwayat, idx) => (
                                                        <div key={idx} className={`p-3 rounded-lg ${
                                                            riwayat.is_active ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                                                        }`}>
                                                            <div className="flex items-center justify-between mb-1">
                                                                <div className="font-medium text-gray-900">
                                                                    {riwayat.kelas_kode}
                                                                </div>
                                                                {riwayat.is_active && (
                                                                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                                                                        Aktif
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="text-sm text-gray-600">{riwayat.kelas_nama}</div>
                                                            <div className="text-xs text-gray-500 mt-1">
                                                                {riwayat.tahun_ajaran} • {riwayat.tanggal_masuk}
                                                                {riwayat.tanggal_keluar && ` - ${riwayat.tanggal_keluar}`}
                                                            </div>
                                                            {riwayat.keterangan && (
                                                                <div className="text-xs text-gray-500 mt-1 italic">
                                                                    {riwayat.keterangan}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Pelanggaran Tab */}
                            {activeTab === 'pelanggaran' && (
                                <div>
                                    {laporanPelanggaran.length === 0 ? (
                                        <p className="text-gray-500 text-center py-12">Tidak ada laporan pelanggaran</p>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kode</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Keterangan</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Poin</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tindakan</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status Approval</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {laporanPelanggaran.map((item) => (
                                                        <tr key={item.id} className="hover:bg-gray-50">
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                                {item.kode}
                                                            </td>
                                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                                {item.keterangan}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                {item.tanggal_kejadian}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-600">
                                                                {item.bobot_poin}
                                                            </td>
                                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                                {item.tindakan}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="text-sm">
                                                                    <div className="font-medium text-gray-900">
                                                                        {item.approval_status_label}
                                                                    </div>
                                                                    <div className="text-xs text-gray-500">
                                                                        Progress: {item.approval_progress}%
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                                                                    {item.status_label}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Apresiasi Tab */}
                            {activeTab === 'apresiasi' && (
                                <div>
                                    {laporanApresiasi.length === 0 ? (
                                        <p className="text-gray-500 text-center py-12">Tidak ada laporan apresiasi</p>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kode</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Keterangan</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Poin</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reward</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status Approval</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {laporanApresiasi.map((item) => (
                                                        <tr key={item.id} className="hover:bg-gray-50">
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                                {item.kode}
                                                            </td>
                                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                                {item.keterangan}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                {item.tanggal_kejadian}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                                                                +{item.bobot_poin}
                                                            </td>
                                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                                {item.reward}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="text-sm">
                                                                    <div className="font-medium text-gray-900">
                                                                        {item.approval_status_label}
                                                                    </div>
                                                                    <div className="text-xs text-gray-500">
                                                                        Progress: {item.approval_progress}%
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                                                                    {item.status_label}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Konseling Tab */}
                            {activeTab === 'konseling' && (
                                <div>
                                    {laporanKonseling.length === 0 ? (
                                        <p className="text-gray-500 text-center py-12">Tidak ada laporan konseling</p>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kode</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Diagnosis</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tindakan</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status Approval</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {laporanKonseling.map((item) => (
                                                        <tr key={item.id} className="hover:bg-gray-50">
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                                {item.kode}
                                                            </td>
                                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                                {item.diagnosis}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                {item.tanggal_kejadian}
                                                            </td>
                                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                                {item.tindakan}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="text-sm">
                                                                    <div className="font-medium text-gray-900">
                                                                        {item.approval_status_label}
                                                                    </div>
                                                                    <div className="text-xs text-gray-500">
                                                                        Progress: {item.approval_progress}%
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                                                                    {item.status_label}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Expert System Point Tab */}
                            {activeTab === 'expert_point' && (
                                <div>
                                    {expertSystemPoint.length === 0 ? (
                                        <p className="text-gray-500 text-center py-12">Tidak ada expert system point triggered</p>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-4">
                                            {expertSystemPoint.map((item) => (
                                                <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div>
                                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                                                item.jenis === 'konsekuensi' 
                                                                    ? 'bg-red-100 text-red-800'
                                                                    : 'bg-green-100 text-green-800'
                                                            }`}>
                                                                {item.jenis_label}
                                                            </span>
                                                            <span className="ml-2 font-mono text-sm text-gray-600">
                                                                {item.kode}
                                                            </span>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-sm text-gray-500">Total Poin</div>
                                                            <div className="text-2xl font-bold text-gray-900">
                                                                {item.total_poin}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="mb-3">
                                                        <div className="font-medium text-gray-900 mb-1">
                                                            {item.konsekuensi_reward}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            Triggered: {item.tanggal_trigger}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4 pt-3 border-t border-gray-200">
                                                        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                                                            {item.status_label}
                                                        </span>
                                                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                                                            {item.final_status_label}
                                                        </span>
                                                        {item.has_bukti && (
                                                            <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                                                                ✓ Ada Bukti
                                                            </span>
                                                        )}
                                                        {item.bukti_approved && (
                                                            <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                                                                ✓ Bukti Approved
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Expert System Konselor Tab */}
                            {activeTab === 'expert_konselor' && (
                                <div>
                                    {expertSystemKonselor.length === 0 ? (
                                        <p className="text-gray-500 text-center py-12">Tidak ada expert system konselor triggered</p>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-4">
                                            {expertSystemKonselor.map((item) => (
                                                <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div>
                                                            <div className="font-medium text-gray-900 mb-1">
                                                                {item.diagnosis_nama}
                                                            </div>
                                                            <div className="text-sm text-gray-600">
                                                                Kode: {item.diagnosis_kode}
                                                            </div>
                                                        </div>
                                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                                            item.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                            item.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                                            'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                            {item.status_label}
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-4 mb-3">
                                                        <div>
                                                            <div className="text-xs text-gray-500">Sesi</div>
                                                            <div className="font-bold text-gray-900">
                                                                {item.sesi_terakhir} / 5
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="text-xs text-gray-500">Progress</div>
                                                            <div className="font-bold text-gray-900">
                                                                {item.progress}%
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="text-xs text-gray-500">Total Sesi</div>
                                                            <div className="font-bold text-gray-900">
                                                                {item.sesi_count}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-sm text-gray-500 pt-3 border-t border-gray-200">
                                                        <div>Triggered: {item.tanggal_trigger}</div>
                                                        {item.tanggal_selesai && (
                                                            <div>Selesai: {item.tanggal_selesai}</div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Timeline Tab */}
                            {activeTab === 'timeline' && (
                                <div>
                                    {timeline.length === 0 ? (
                                        <p className="text-gray-500 text-center py-12">Belum ada aktivitas</p>
                                    ) : (
                                        <div className="space-y-4">
                                            {timeline.map((item, idx) => (
                                                <div key={idx} className="flex gap-4">
                                                    <div className="flex flex-col items-center">
                                                        <div className={`w-4 h-4 rounded-full ${
                                                            item.color === 'red' ? 'bg-red-500' :
                                                            item.color === 'green' ? 'bg-green-500' :
                                                            item.color === 'blue' ? 'bg-blue-500' :
                                                            'bg-gray-500'
                                                        }`} />
                                                        {idx < timeline.length - 1 && (
                                                            <div className="w-0.5 h-full bg-gray-200 mt-1" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 pb-8">
                                                        <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                                            <div className="flex items-start justify-between mb-2">
                                                                <div className="font-medium text-gray-900">
                                                                    {item.title}
                                                                </div>
                                                                <div className="text-sm text-gray-500">
                                                                    {item.date_display}
                                                                </div>
                                                            </div>
                                                            <div className="text-sm text-gray-600">
                                                                {item.description}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}