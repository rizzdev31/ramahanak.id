import AppLayout from '@/Layouts/AppLayout';
import { Head } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import DynamicProfileForm from './Partials/DynamicProfileForm';

// resources/js/Pages/Profile/Edit.jsx

export default function Edit({ auth, mustVerifyEmail, status, userProfile }) {
    return (
        <AppLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Pengaturan Profil</h2>}
        >
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    
                    {/* Bagian 1: Update Identitas Utama (Email) */}
                    <div className="p-4 sm:p-8 bg-white shadow sm:rounded-lg">
                        <UpdateProfileInformationForm />
                    </div>

                    {/* Bagian 2: Update Detail Profil Sesuai Role (Fleksibel) */}
                    <div className="p-4 sm:p-8 bg-white shadow sm:rounded-lg">
                        <h3 className="text-lg font-medium text-gray-900 mb-4 uppercase">
                            Detail Profil {auth.user.role.replace('_', ' ')}
                        </h3>
                        {/* Di sini kita panggil komponen dinamis sesuai role */}
                        <DynamicProfileForm 
                            userProfile={userProfile} // <-- Oper ke sini
                            className="max-w-xl" 
                        />
                    </div>

                    {/* Bagian 3: Ganti Password */}
                    <div className="p-4 sm:p-8 bg-white shadow sm:rounded-lg">
                        <UpdatePasswordForm />
                    </div>

                </div>
            </div>
        </AppLayout>
    );
}
