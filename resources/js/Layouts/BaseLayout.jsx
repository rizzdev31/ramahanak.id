import { useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { ToastProvider } from '@/Components/Shared/Toast';

export default function BaseLayout({ user, title, children }) {
    // Set toast global function
    useEffect(() => {
        // This allows using toast.success() etc from anywhere
        // Will be properly wired in ToastProvider
    }, []);

    return (
        <ToastProvider>
            <div className="min-h-screen bg-gray-50">
                <Head title={title || 'Ramah Anak'} />
                
                {/* Main Content */}
                {children}
            </div>
        </ToastProvider>
    );
}