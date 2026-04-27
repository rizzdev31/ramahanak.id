export default function Alert({ type = 'info', title, message, onClose, className = '' }) {
    const styles = {
        success: {
            container: 'bg-green-50 border-green-200',
            icon: 'text-green-600',
            title: 'text-green-800',
            message: 'text-green-700',
            iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
        },
        error: {
            container: 'bg-red-50 border-red-200',
            icon: 'text-red-600',
            title: 'text-red-800',
            message: 'text-red-700',
            iconPath: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z'
        },
        warning: {
            container: 'bg-yellow-50 border-yellow-200',
            icon: 'text-yellow-600',
            title: 'text-yellow-800',
            message: 'text-yellow-700',
            iconPath: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-1.964-1.333-2.732 0L3.072 16c-.77 1.333.192 3 1.732 3z'
        },
        info: {
            container: 'bg-blue-50 border-blue-200',
            icon: 'text-blue-600',
            title: 'text-blue-800',
            message: 'text-blue-700',
            iconPath: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
        }
    };

    const style = styles[type] || styles.info;

    return (
        <div className={`${style.container} border-l-4 rounded-lg p-4 ${className}`}>
            <div className="flex">
                <div className="flex-shrink-0">
                    <svg className={`h-5 w-5 ${style.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={style.iconPath} />
                    </svg>
                </div>
                <div className="ml-3 flex-1">
                    {title && (
                        <h3 className={`text-sm font-medium ${style.title}`}>
                            {title}
                        </h3>
                    )}
                    {message && (
                        <div className={`text-sm ${title ? 'mt-2' : ''} ${style.message}`}>
                            {message}
                        </div>
                    )}
                </div>
                {onClose && (
                    <div className="ml-auto pl-3">
                        <div className="-mx-1.5 -my-1.5">
                            <button
                                type="button"
                                onClick={onClose}
                                className={`inline-flex rounded-md p-1.5 ${style.icon} hover:opacity-70 transition-opacity`}
                            >
                                <span className="sr-only">Dismiss</span>
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}