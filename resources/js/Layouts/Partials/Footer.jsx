export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-white border-t border-gray-200 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex flex-col md:flex-row justify-between items-center gap-2">
                    <p className="text-sm text-gray-500">
                        © {currentYear} <span className="font-semibold text-gray-700">Ramah Anak</span>. All rights reserved.
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Sistem Informasi Ramah Anak</span>
                        <span className="hidden md:inline">•</span>
                        <span className="hidden md:inline">v1.0.0</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}