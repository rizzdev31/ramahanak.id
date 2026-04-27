import { Transition } from '@headlessui/react';

export default function MobileMenu({ isOpen, onClose, children }) {
    return (
        <Transition
            show={isOpen}
            enter="transition duration-200 ease-out"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="transition duration-150 ease-in"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
        >
            <div className="lg:hidden">
                {/* Backdrop */}
                <div
                    className="fixed inset-0 bg-gray-600 bg-opacity-50 z-40"
                    onClick={onClose}
                />

                {/* Menu Panel */}
                <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl z-50 overflow-y-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200">
                        <span className="text-lg font-bold text-gray-900">Menu</span>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                        >
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Navigation Items */}
                    <div className="py-2" onClick={onClose}>
                        {children}
                    </div>
                </div>
            </div>
        </Transition>
    );
}