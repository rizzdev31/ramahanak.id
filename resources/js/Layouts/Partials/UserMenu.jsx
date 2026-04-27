import { Link } from '@inertiajs/react';
import Dropdown from '@/Components/Dropdown';

export default function UserMenu({ user }) {
    // Get user display name and photo based on role
    const getUserInfo = () => {
        let name = user.username;
        let photo = null;

        if (user.role === 'guru_bk' && user.guru_bk_profile) {
            name = user.guru_bk_profile.nama_panggilan || user.guru_bk_profile.nama_lengkap || user.username;
            photo = user.guru_bk_profile.foto;
        } else if (user.role === 'tenaga_pendidik' && user.tenaga_pendidik_profile) {
            name = user.tenaga_pendidik_profile.nama_panggilan || user.tenaga_pendidik_profile.nama_lengkap || user.username;
            photo = user.tenaga_pendidik_profile.foto;
        } else if (user.role === 'santri' && user.santri_profile) {
            name = user.santri_profile.nama_panggilan || user.santri_profile.nama_lengkap || user.username;
            photo = user.santri_profile.foto;
        }

        return { name, photo };
    };

    const { name, photo } = getUserInfo();

    // Get role label
    const getRoleLabel = () => {
        switch (user.role) {
            case 'guru_bk': return 'Guru BK';
            case 'tenaga_pendidik': return 'Tenaga Pendidik';
            case 'santri': return 'Santri';
            default: return user.role;
        }
    };

    return (
        <Dropdown>
            <Dropdown.Trigger>
                <button className="flex items-center gap-3 text-sm focus:outline-none transition">
                    {/* Avatar */}
                    {photo ? (
                        <img
                            src={`/storage/${photo}`}
                            alt={name}
                            className="h-9 w-9 rounded-full object-cover border-2 border-gray-200"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '/storage/defaultavatar.png';
                            }}
                        />
                    ) : (
                        <div className="h-9 w-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold uppercase border-2 border-indigo-200">
                            {name[0]}
                        </div>
                    )}

                    {/* Name & Role (Hidden on mobile) */}
                    <div className="hidden md:block text-left">
                        <div className="font-semibold text-gray-900">{name}</div>
                        <div className="text-xs text-gray-500">{getRoleLabel()}</div>
                    </div>

                    {/* Chevron */}
                    <svg className="hidden md:block h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
            </Dropdown.Trigger>

            <Dropdown.Content align="right" width="48">
                {/* User Info Header */}
                <div className="px-4 py-3 border-b border-gray-100">
                    <div className="font-medium text-sm text-gray-900">{name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{user.email}</div>
                </div>

                {/* Profile Link */}
                <Dropdown.Link href={route('profile.edit')}>
                    <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>Profile</span>
                    </div>
                </Dropdown.Link>

                {/* Divider */}
                <div className="border-t border-gray-100" />

                {/* Logout */}
                <Dropdown.Link
                    href={route('logout')}
                    method="post"
                    as="button"
                    className="w-full text-left text-red-600 hover:bg-red-50"
                >
                    <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Logout</span>
                    </div>
                </Dropdown.Link>
            </Dropdown.Content>
        </Dropdown>
    );
}