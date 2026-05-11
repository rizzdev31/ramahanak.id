import { useState } from 'react';
import GuruBkLayout from '@/Layouts/GuruBk/GuruBkLayout';
import { Head, useForm, router, Link } from '@inertiajs/react';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import Modal from '@/Components/Modal';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';

//  Di luar komponen  tidak re-render tiap siklus
const DEFAULT_AVATAR = '/storage/defaultavatar.png';

export default function ManageUser({ auth, users, kelas, filters }) {

    //  State 
    const [editingUser,     setEditingUser]     = useState(null);
    const [showEditModal,   setShowEditModal]   = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [userToDelete,    setUserToDelete]    = useState(null);

    // Filter state  sinkron dengan props filters dari controller
    const [filterRole,   setFilterRole]   = useState(filters?.role   || '');
    const [filterStatus, setFilterStatus] = useState(filters?.status || '');
    const [search,       setSearch]       = useState(filters?.search  || '');

    //  Form 
    const { data, setData, put, post, processing, errors, reset, clearErrors } = useForm({
        email: '', nama_lengkap: '', nama_panggilan: '',
        tempat_lahir: '', tanggal_lahir: '', jenis_kelamin: 'Laki-laki',
        no_whatsapp: '', nip: '', nisn: '', jabatan: '',
        nama_wali: '', kelas_id: '', alamat: '', //  FIX: tambah kelas_id di initial state
        foto: null, password: '', password_confirmation: '',
    });

    //  Filter handlers 
    const handleFilter = () => {
        router.get(route('manage-user.index'),
            { role: filterRole, status: filterStatus, search },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleResetFilter = () => {
        setFilterRole(''); setFilterStatus(''); setSearch('');
        router.get(route('manage-user.index'));
    };

    //  Approve 
    const handleApprove = (userId) => {
        if (!confirm('Approve user ini?')) return;
        router.post(route('manage-user.approve', userId), {}, {
            preserveScroll: true,
            onError: (e) => alert(e.approve || 'Terjadi kesalahan'),
        });
    };

    //  Toggle status 
    const handleToggleStatus = (userId) => {
        if (!confirm('Ubah status user ini?')) return;
        router.post(route('manage-user.toggle-status', userId), {}, {
            preserveScroll: true,
            onError: (e) => alert(e.toggle || 'Terjadi kesalahan'),
        });
    };

    //  Open edit modal 
    const openEditModal = (user) => {
        clearErrors();

        // Ambil profile sesuai role
        let profile = null;
        if      (user.role === 'santri')           profile = user.santri_profile;
        else if (user.role === 'guru_bk')          profile = user.guru_bk_profile;
        else if (user.role === 'tenaga_pendidik')  profile = user.tenaga_pendidik_profile;

        //  Format tanggal  "YYYY-MM-DD" agar cocok dengan input type="date"
        const tanggalLahir = profile?.tanggal_lahir
            ? profile.tanggal_lahir.split('T')[0]
            : '';

        setData({
            email:          user.email              || '',
            nama_lengkap:   profile?.nama_lengkap   || '',
            nama_panggilan: profile?.nama_panggilan || '',
            tempat_lahir:   profile?.tempat_lahir   || '',
            tanggal_lahir:  tanggalLahir,
            jenis_kelamin:  profile?.jenis_kelamin  || 'Laki-laki',
            no_whatsapp:    profile?.no_whatsapp    || '',
            nip:            profile?.nip            || '',
            nisn:           profile?.nisn           || '',
            jabatan:        profile?.jabatan        || '',
            nama_wali:      profile?.nama_wali      || '',
            kelas_id:       profile?.kelas_id       || '', //  FIX: tambah kelas_id
            alamat:         profile?.alamat         || '',
            foto:           null,
            password:       '',
            password_confirmation: '',
        });

        setEditingUser(user);
        setShowEditModal(true);
    };

    //  Submit edit 
    //  Hanya pakai forceFormData jika ada foto  cegah field hilang
    const handleSubmitEdit = (e) => {
        e.preventDefault();
        const opts = {
            preserveScroll: true,
            onSuccess: () => { setShowEditModal(false); reset(); },
            onError:   (e) => console.error('Update errors:', e),
        };
        data.foto
            ? post(route('manage-user.update', editingUser.id), { ...opts, forceFormData: true })
            : put(route('manage-user.update',  editingUser.id), opts);
    };

    //  Delete 
    const openDeleteModal = (user) => { setUserToDelete(user); setShowDeleteModal(true); };

    const handleDelete = () => {
        if (!userToDelete) return;
        router.delete(route('manage-user.destroy', userToDelete.id), {
            preserveScroll: true,
            onSuccess: () => { setShowDeleteModal(false); setUserToDelete(null); },
            onError:   (e) => { alert(e.delete || 'Terjadi kesalahan'); setShowDeleteModal(false); },
        });
    };

    //  Helpers 
    const getUserName = (user) => {
        const p = user.santri_profile || user.guru_bk_profile || user.tenaga_pendidik_profile;
        return p?.nama_lengkap || 'N/A';
    };

    const getUserIdentity = (user) => {
        if (user.role === 'santri') return user.santri_profile?.nisn || '-';
        const p = user.guru_bk_profile || user.tenaga_pendidik_profile;
        return p?.nip || '-';
    };

    //  FIX defaultavatar  onError pakai e.target.onerror = null; cegah infinite loop
    const getProfileFoto = (user) => {
        const p = user.santri_profile || user.guru_bk_profile || user.tenaga_pendidik_profile;
        return p?.foto ? `/storage/${p.foto}` : DEFAULT_AVATAR;
    };

    //  Kolom Kelas / Penugasan (sinkron dari DB, read-only):
    const getKelasOrPenugasan = (user) => {
        if (user.role === 'santri') {
            const k = user.santri_profile?.kelas;
            if (!k) return <span className="text-gray-400 text-xs italic">Belum ada kelas</span>;
            return (
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full
                    ${k.kode_kelas === 'PENDING'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-blue-100 text-blue-800'}`}>
                    {k.kode_kelas} - {k.nama}
                </span>
            );
        }

        const penugasan = user.penugasan_kelas_aktif;
        if (!penugasan?.length)
            return <span className="text-gray-400 text-xs italic">Belum ditugaskan</span>;

        return (
            <div className="space-y-1">
                {penugasan.map((p) => (
                    <div key={p.id} className="flex items-center gap-1.5">
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium text-white
                            ${p.jenis_penugasan === 'wali_kelas' ? 'bg-blue-500' : 'bg-green-500'}`}>
                            {p.jenis_penugasan === 'wali_kelas' ? 'Wali Kelas' : 'Wali Asrama'}
                        </span>
                        <span className="text-xs text-gray-700 font-medium">
                            {p.kelas?.kode_kelas || '-'}
                        </span>
                    </div>
                ))}
            </div>
        );
    };

    // Badge helpers
    const roleBadge = (role) => {
        const map = {
            guru_bk:         'bg-purple-100 text-purple-800',
            santri:          'bg-blue-100 text-blue-800',
            tenaga_pendidik: 'bg-green-100 text-green-800',
        };
        const label = { guru_bk: 'Guru BK', santri: 'Santri', tenaga_pendidik: 'Tenaga Pendidik' };
        return (
            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${map[role] || 'bg-gray-100 text-gray-700'}`}>
                {label[role] || role}
            </span>
        );
    };

    const statusBadge = (status) => {
        const map   = { active: 'bg-green-100 text-green-800', pending: 'bg-yellow-100 text-yellow-800', unactive: 'bg-red-100 text-red-800' };
        const label = { active: 'Aktif', pending: 'Menunggu', unactive: 'Nonaktif' };
        return (
            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${map[status] || 'bg-gray-100 text-gray-700'}`}>
                {label[status] || status}
            </span>
        );
    };

    //  Render 
    return (
        <GuruBkLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Kelola User</h2>}
        >
            <Head title="Kelola User" />

            <div className="py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">

                    {/*  Filter Bar  */}
                    <div className="bg-white rounded-lg shadow-sm p-4">
                        <div className="flex flex-wrap gap-3 items-end">

                            {/* Role */}
                            <div className="flex-1 min-w-[130px]">
                                <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
                                <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}
                                    className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500">
                                    <option value="">Semua Role</option>
                                    <option value="guru_bk">Guru BK</option>
                                    <option value="tenaga_pendidik">Tenaga Pendidik</option>
                                    <option value="santri">Santri</option>
                                </select>
                            </div>

                            {/* Status */}
                            <div className="flex-1 min-w-[130px]">
                                <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                                    className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500">
                                    <option value="">Semua Status</option>
                                    <option value="active">Aktif</option>
                                    <option value="pending">Menunggu</option>
                                    <option value="unactive">Nonaktif</option>
                                </select>
                            </div>

                            {/* Search */}
                            <div className="flex-[2] min-w-[200px]">
                                <label className="block text-xs font-medium text-gray-600 mb-1">Cari</label>
                                <input type="text" value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
                                    placeholder="Nama, username, email, NIP/NISN..."
                                    className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
                            </div>

                            {/* Tombol */}
                            <div className="flex gap-2">
                                <PrimaryButton onClick={handleFilter}>Filter</PrimaryButton>
                                <SecondaryButton onClick={handleResetFilter}>Reset</SecondaryButton>
                            </div>
                        </div>
                    </div>

                    {/*  Tabel  */}
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        {['Nama', 'Username / Email', 'Role', 'NIP / NISN', 'Kelas / Penugasan', 'Status', 'Aksi'].map((h) => (
                                            <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {users.data?.length > 0 ? users.data.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50 transition-colors">

                                            {/* Nama + Foto */}
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={getProfileFoto(user)}
                                                        alt="foto"
                                                        className="h-9 w-9 rounded-full object-cover border border-gray-200 shrink-0"
                                                        onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_AVATAR; }}
                                                    />
                                                    <span className="font-medium text-gray-900 truncate max-w-[150px]">
                                                        {getUserName(user)}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Username / Email */}
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="text-gray-900">{user.username}</div>
                                                <div className="text-xs text-gray-400">{user.email}</div>
                                            </td>

                                            {/* Role */}
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                {roleBadge(user.role)}
                                            </td>

                                            {/* NIP / NISN */}
                                            <td className="px-4 py-3 whitespace-nowrap font-mono text-xs text-gray-500">
                                                {getUserIdentity(user)}
                                            </td>

                                            {/* Kelas / Penugasan */}
                                            <td className="px-4 py-3">
                                                {getKelasOrPenugasan(user)}
                                            </td>

                                            {/* Status */}
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                {statusBadge(user.status)}
                                            </td>

                                            {/* Aksi */}
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="flex gap-3 flex-wrap">
                                                    {user.status === 'pending' && (
                                                        <button onClick={() => handleApprove(user.id)}
                                                            className="text-xs font-medium text-green-600 hover:text-green-800 hover:underline">
                                                            Approve
                                                        </button>
                                                    )}
                                                    {user.role !== 'guru_bk' && user.status !== 'pending' && (
                                                        <button onClick={() => handleToggleStatus(user.id)}
                                                            className="text-xs font-medium text-yellow-600 hover:text-yellow-800 hover:underline">
                                                            {user.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}
                                                        </button>
                                                    )}
                                                    <button onClick={() => openEditModal(user)}
                                                        className="text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline">
                                                        Edit
                                                    </button>
                                                    {user.role !== 'guru_bk' && (
                                                        <button onClick={() => openDeleteModal(user)}
                                                            className="text-xs font-medium text-red-600 hover:text-red-800 hover:underline">
                                                            Hapus
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="7" className="py-14 text-center">
                                                <div className="flex flex-col items-center gap-2 text-gray-400">
                                                    <svg className="h-10 w-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                    <p className="text-sm">Tidak ada data user</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {users.links?.length > 3 && (
                            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between flex-wrap gap-2">
                                <p className="text-xs text-gray-400">
                                    Menampilkan {users.from}{users.to} dari {users.total} user
                                </p>
                                <div className="flex gap-1 flex-wrap">
                                    {users.links.map((link, i) => (
                                        <button key={i}
                                            onClick={() => link.url && router.get(link.url)}
                                            disabled={!link.url}
                                            className={`px-3 py-1 rounded text-xs font-medium transition
                                                ${link.active ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
                                                ${!link.url ? 'opacity-40 cursor-not-allowed' : ''}`}
                                            dangerouslySetInnerHTML={{ __html: link.label }} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 
                Modal Edit
             */}
            <Modal show={showEditModal} onClose={() => { setShowEditModal(false); clearErrors(); }} maxWidth="2xl">
                <form onSubmit={handleSubmitEdit} className="flex flex-col max-h-[90vh] divide-y divide-gray-100">

                    {/* Header */}
                    <div className="px-5 py-4 shrink-0">
                        <h2 className="text-base font-bold text-gray-900">Edit User</h2>
                        {editingUser && (
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-sm text-gray-500">{getUserName(editingUser)}</span>
                                <span className="text-gray-300"></span>
                                {roleBadge(editingUser.role)}
                            </div>
                        )}
                    </div>

                    {/* Scrollable body */}
                    <div className="flex-1 overflow-y-auto">
                    {/* Fields umum */}
                    <div className="px-5 py-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                            <div>
                                <InputLabel htmlFor="email" value="Email *" />
                                <TextInput id="email" type="email" className="mt-1 block w-full text-sm"
                                    value={data.email} onChange={(e) => setData('email', e.target.value)} required />
                                <InputError message={errors.email} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel htmlFor="nama_lengkap" value="Nama Lengkap *" />
                                <TextInput id="nama_lengkap" className="mt-1 block w-full text-sm"
                                    value={data.nama_lengkap} onChange={(e) => setData('nama_lengkap', e.target.value)} required />
                                <InputError message={errors.nama_lengkap} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel htmlFor="nama_panggilan" value="Nama Panggilan" />
                                <TextInput id="nama_panggilan" className="mt-1 block w-full text-sm"
                                    value={data.nama_panggilan} onChange={(e) => setData('nama_panggilan', e.target.value)} />
                            </div>

                            <div>
                                <InputLabel htmlFor="jenis_kelamin" value="Jenis Kelamin" />
                                <select id="jenis_kelamin" value={data.jenis_kelamin}
                                    onChange={(e) => setData('jenis_kelamin', e.target.value)}
                                    className="mt-1 block w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500">
                                    <option value="Laki-laki">Laki-laki</option>
                                    <option value="Perempuan">Perempuan</option>
                                </select>
                            </div>

                            <div>
                                <InputLabel htmlFor="tempat_lahir" value="Tempat Lahir" />
                                <TextInput id="tempat_lahir" className="mt-1 block w-full text-sm"
                                    value={data.tempat_lahir} onChange={(e) => setData('tempat_lahir', e.target.value)} />
                            </div>

                            <div>
                                <InputLabel htmlFor="tanggal_lahir" value="Tanggal Lahir" />
                                <TextInput id="tanggal_lahir" type="date" className="mt-1 block w-full text-sm"
                                    value={data.tanggal_lahir} onChange={(e) => setData('tanggal_lahir', e.target.value)} />
                            </div>

                            <div>
                                <InputLabel htmlFor="no_whatsapp" value="No WhatsApp" />
                                <TextInput id="no_whatsapp" className="mt-1 block w-full text-sm"
                                    value={data.no_whatsapp} onChange={(e) => setData('no_whatsapp', e.target.value)} />
                            </div>

                            {/*  Guru BK & Tenaga Pendidik  */}
                            {editingUser && (editingUser.role === 'guru_bk' || editingUser.role === 'tenaga_pendidik') && (
                                <>
                                    <div>
                                        <InputLabel htmlFor="nip" value="NIP" />
                                        <TextInput id="nip" className="mt-1 block w-full bg-gray-50 cursor-not-allowed"
                                            value={data.nip} readOnly />
                                        <p className="text-xs text-gray-400 mt-1">NIP tidak dapat diubah</p>
                                    </div>
                                    <div>
                                        <InputLabel htmlFor="jabatan" value="Jabatan" />
                                        <TextInput id="jabatan" className="mt-1 block w-full text-sm"
                                            value={data.jabatan} onChange={(e) => setData('jabatan', e.target.value)} />
                                    </div>

                                    {/*  Penugasan: read-only */}
                                    {editingUser.penugasan_kelas_aktif?.length > 0 && (
                                        <div className="sm:col-span-2">
                                            <InputLabel value="Penugasan Kelas" />
                                            <div className="mt-1 p-3 bg-gray-50 border border-gray-200 rounded-md space-y-1.5">
                                                {editingUser.penugasan_kelas_aktif.map((p) => (
                                                    <div key={p.id} className="flex items-center gap-2 text-sm">
                                                        <span className={`px-2 py-0.5 rounded text-xs font-medium text-white
                                                            ${p.jenis_penugasan === 'wali_kelas' ? 'bg-blue-500' : 'bg-green-500'}`}>
                                                            {p.jenis_penugasan === 'wali_kelas' ? 'Wali Kelas' : 'Wali Asrama'}
                                                        </span>
                                                        <span className="text-gray-700 font-medium">
                                                            {p.kelas?.kode_kelas} - {p.kelas?.nama}
                                                        </span>
                                                    </div>
                                                ))}
                                                <p className="text-xs text-gray-400 pt-1.5 border-t border-gray-200">
                                                    Ubah penugasan via{' '}
                                                    <Link href={route('penugasan.index')} className="text-indigo-500 underline">
                                                        Kelola Penugasan
                                                    </Link>
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {/*  Santri  */}
                            {editingUser && editingUser.role === 'santri' && (
                                <>
                                    <div>
                                        <InputLabel htmlFor="nisn" value="NISN" />
                                        <TextInput id="nisn" className="mt-1 block w-full bg-gray-50 cursor-not-allowed"
                                            value={data.nisn} readOnly />
                                        <p className="text-xs text-gray-400 mt-1">NISN tidak dapat diubah</p>
                                    </div>

                                    {/*  Kelas: READ-ONLY dengan hidden input kelas_id */}
                                    <div>
                                        <InputLabel value="Kelas Saat Ini" />
                                        <div className="mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm min-h-[38px] flex flex-col justify-center">
                                            {(() => {
                                                const k = editingUser.santri_profile?.kelas;
                                                if (!k) return <span className="text-gray-400 italic">Belum ada kelas</span>;
                                                return (
                                                    <span className={`font-medium ${k.kode_kelas === 'PENDING' ? 'text-yellow-700' : 'text-blue-700'}`}>
                                                        {k.kode_kelas} - {k.nama}
                                                    </span>
                                                );
                                            })()}
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                Pindah kelas via{' '}
                                                <Link href={route('kelas.index')} className="text-indigo-500 underline">
                                                    Kelola Kelas
                                                </Link>
                                            </p>
                                        </div>
                                        {/*  FIX: Hidden input untuk mengirim kelas_id ke backend */}
                                        <input type="hidden" name="kelas_id" value={data.kelas_id || ''} />
                                    </div>

                                    <div className="sm:col-span-2">
                                        <InputLabel htmlFor="nama_wali" value="Nama Wali" />
                                        <TextInput id="nama_wali" className="mt-1 block w-full text-sm"
                                            value={data.nama_wali} onChange={(e) => setData('nama_wali', e.target.value)} />
                                    </div>

                                    <div className="sm:col-span-2">
                                        <InputLabel htmlFor="alamat" value="Alamat" />
                                        <textarea id="alamat" rows="3"
                                            className="mt-1 block w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                            value={data.alamat} onChange={(e) => setData('alamat', e.target.value)} />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Foto */}
                    <div className="px-5 py-4">
                        <InputLabel value="Foto Profil" />
                        {editingUser && (() => {
                            const p = editingUser.santri_profile || editingUser.guru_bk_profile || editingUser.tenaga_pendidik_profile;
                            return p?.foto ? (
                                <div className="mt-2 mb-3 flex items-center gap-3">
                                    <img src={`/storage/${p.foto}`} alt="foto"
                                        className="h-12 w-12 rounded-full object-cover border-2 border-indigo-200"
                                        onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_AVATAR; }} />
                                    <p className="text-xs text-gray-500">Foto saat ini. Upload baru untuk mengganti.</p>
                                </div>
                            ) : (
                                <p className="text-xs text-gray-400 mt-1 mb-2">Belum ada foto profil.</p>
                            );
                        })()}
                        <input type="file" id="foto" accept="image/jpeg,image/png,image/jpg"
                            className="block w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                            onChange={(e) => setData('foto', e.target.files[0] || null)} />
                        <InputError message={errors.foto} className="mt-1" />
                    </div>

                    {/* Password */}
                    <div className="px-5 py-4">
                        <p className="text-xs text-gray-400 mb-3">Kosongkan jika tidak ingin mengubah password</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <InputLabel htmlFor="password" value="Password Baru" />
                                <TextInput id="password" type="password" className="mt-1 block w-full text-sm"
                                    value={data.password} onChange={(e) => setData('password', e.target.value)} />
                                <InputError message={errors.password} className="mt-1" />
                            </div>
                            <div>
                                <InputLabel htmlFor="password_confirmation" value="Konfirmasi Password" />
                                <TextInput id="password_confirmation" type="password" className="mt-1 block w-full text-sm"
                                    value={data.password_confirmation} onChange={(e) => setData('password_confirmation', e.target.value)} />
                            </div>
                        </div>
                    </div>

                    </div>{/* /scrollable body */}

                    {/* Footer Modal */}
                    <div className="px-5 py-4 bg-gray-50 rounded-b-lg shrink-0">
                        {errors.update && (
                            <p className="text-sm text-red-600 mb-3 p-2 bg-red-50 border border-red-200 rounded">
                                {errors.update}
                            </p>
                        )}
                        <div className="flex justify-end gap-3">
                            <SecondaryButton type="button" onClick={() => { setShowEditModal(false); clearErrors(); }}>
                                Batal
                            </SecondaryButton>
                            <PrimaryButton disabled={processing}>
                                {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </PrimaryButton>
                        </div>
                    </div>
                </form>
            </Modal>

            {/* 
                Modal Delete
             */}
            <Modal show={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className="shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.072 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-gray-900">Hapus User</h2>
                            <p className="text-sm text-gray-500 mt-1">
                                Yakin ingin menghapus{' '}
                                <strong className="text-gray-900">{userToDelete && getUserName(userToDelete)}</strong>?
                                {' '}Semua data terkait akan terhapus permanen dan tidak dapat dikembalikan.
                            </p>
                        </div>
                    </div>
                    <div className="mt-5 flex justify-end gap-3">
                        <SecondaryButton onClick={() => setShowDeleteModal(false)}>Batal</SecondaryButton>
                        <DangerButton onClick={handleDelete}>Ya, Hapus</DangerButton>
                    </div>
                </div>
            </Modal>
        </GuruBkLayout>
    );
}