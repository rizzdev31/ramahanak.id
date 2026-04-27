import { createContext, useContext, useState, useEffect } from 'react';
import { Transition } from '@headlessui/react';

// Toast Context
const ToastContext = createContext();

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
}

// Toast Provider Component
export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const addToast = (message, type = 'success', duration = 3000) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type, duration }]);

        // Auto remove after duration
        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
    };

    const removeToast = (id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    return (
        <ToastContext.Provider value={{ addToast, removeToast }}>
            {children}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </ToastContext.Provider>
    );
}

// Toast Container - renders all toasts
function ToastContainer({ toasts, removeToast }) {
    return (
        <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
            {toasts.map(toast => (
                <Toast
                    key={toast.id}
                    {...toast}
                    onClose={() => removeToast(toast.id)}
                />
            ))}
        </div>
    );
}

// Individual Toast Component
function Toast({ id, message, type, onClose }) {
    const [show, setShow] = useState(false);

    useEffect(() => {
        setShow(true);
    }, []);

    const handleClose = () => {
        setShow(false);
        setTimeout(onClose, 300); // Wait for animation
    };

    const styles = {
        success: {
            bg: 'bg-green-50',
            border: 'border-green-200',
            icon: 'text-green-600',
            text: 'text-green-800',
            iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
        },
        error: {
            bg: 'bg-red-50',
            border: 'border-red-200',
            icon: 'text-red-600',
            text: 'text-red-800',
            iconPath: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z'
        },
        warning: {
            bg: 'bg-yellow-50',
            border: 'border-yellow-200',
            icon: 'text-yellow-600',
            text: 'text-yellow-800',
            iconPath: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-1.964-1.333-2.732 0L3.072 16c-.77 1.333.192 3 1.732 3z'
        },
        info: {
            bg: 'bg-blue-50',
            border: 'border-blue-200',
            icon: 'text-blue-600',
            text: 'text-blue-800',
            iconPath: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
        }
    };

    const style = styles[type] || styles.info;

    return (
        <Transition
            show={show}
            enter="transform transition duration-300"
            enterFrom="translate-x-full opacity-0"
            enterTo="translate-x-0 opacity-100"
            leave="transform transition duration-300"
            leaveFrom="translate-x-0 opacity-100"
            leaveTo="translate-x-full opacity-0"
        >
            <div 
                className={`
                    ${style.bg} ${style.border} ${style.text}
                    border-l-4 rounded-lg shadow-lg p-4 pr-12
                    max-w-md pointer-events-auto
                    transform transition-all duration-300
                `}
            >
                <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={`${style.icon} flex-shrink-0`}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={style.iconPath} />
                        </svg>
                    </div>

                    {/* Message */}
                    <div className="flex-1 pt-0.5">
                        <p className="text-sm font-medium">{message}</p>
                    </div>

                    {/* Close Button */}
                    <button
                        onClick={handleClose}
                        className={`${style.icon} absolute top-3 right-3 hover:opacity-70 transition-opacity`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>
        </Transition>
    );
}

// Convenience functions
export const toast = {
    success: (message, duration) => {
        // This will be set by ToastProvider
        if (window.__toast) {
            window.__toast(message, 'success', duration);
        }
    },
    error: (message, duration) => {
        if (window.__toast) {
            window.__toast(message, 'error', duration);
        }
    },
    warning: (message, duration) => {
        if (window.__toast) {
            window.__toast(message, 'warning', duration);
        }
    },
    info: (message, duration) => {
        if (window.__toast) {
            window.__toast(message, 'info', duration);
        }
    }
};

export default Toast;