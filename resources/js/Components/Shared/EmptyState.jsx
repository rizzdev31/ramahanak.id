export default function EmptyState({ 
    icon, 
    title, 
    message, 
    action, 
    actionLabel,
    className = '' 
}) {
    return (
        <div className={`text-center py-12 ${className}`}>
            {/* Icon */}
            {icon ? (
                <div className="text-6xl mb-4">{icon}</div>
            ) : (
                <svg 
                    className="mx-auto h-16 w-16 text-gray-300 mb-4" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                >
                    <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={1.5} 
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" 
                    />
                </svg>
            )}

            {/* Title */}
            <h3 className="text-lg font-medium text-gray-900 mb-2">
                {title || 'Tidak ada data'}
            </h3>

            {/* Message */}
            {message && (
                <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
                    {message}
                </p>
            )}

            {/* Action Button */}
            {action && actionLabel && (
                <button
                    onClick={action}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    {actionLabel}
                </button>
            )}
        </div>
    );
}