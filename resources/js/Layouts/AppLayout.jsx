/**
 * AppLayout.jsx — Layout Universal untuk Semua Role
 *
 * Cara kerja:
 *   - guru_bk      → GuruBkLayout (sidebar kiri, collapsible)
 *   - tenaga_pendidik → TenagaPendidikLayout (navbar atas)
 *   - santri        → SantriLayout (navbar atas)
 *
 * Cara pakai di semua halaman:
 *   import AppLayout from '@/Layouts/AppLayout';
 *   ...
 *   return (
 *     <AppLayout user={auth.user} header="Judul Halaman">
 *       {/* konten halaman *\/}
 *     </AppLayout>
 *   );
 *
 * TIDAK perlu lagi import AuthenticatedLayout2, GuruBkLayout, dll secara terpisah.
 */

import GuruBkLayout     from '@/Layouts/GuruBk/GuruBkLayout';
import TenagaPendidikLayout from '@/Layouts/TenagaPendidik/TenagaPendidikLayout';
import SantriLayout     from '@/Layouts/Santri/SantriLayout';

export default function AppLayout({ user, header, children }) {
    if (!user) {
        // Fallback kalau user belum di-pass (seharusnya tidak terjadi)
        return <div className="min-h-screen bg-gray-50">{children}</div>;
    }

    switch (user.role) {
        case 'guru_bk':
            return (
                <GuruBkLayout user={user} header={header}>
                    {children}
                </GuruBkLayout>
            );

        case 'tenaga_pendidik':
            return (
                <TenagaPendidikLayout user={user} header={header}>
                    {children}
                </TenagaPendidikLayout>
            );

        case 'santri':
        default:
            return (
                <SantriLayout user={user} header={header}>
                    {children}
                </SantriLayout>
            );
    }
}