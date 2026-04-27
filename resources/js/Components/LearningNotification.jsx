import { useState } from 'react';
import { CheckCircleIcon, XMarkIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

export default function LearningNotification({ learningResult, onDismiss }) {
    const [expanded, setExpanded] = useState(false);

    if (!learningResult || !learningResult.learned) {
        return null;
    }

    const { count, details } = learningResult;

    return (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-l-4 border-purple-500 rounded-lg shadow-lg p-4 mb-6 animate-fade-in">
            <div className="flex items-start">
                <div className="flex-shrink-0">
                    <CheckCircleIcon className="h-6 w-6 text-purple-500" />
                </div>
                
                <div className="ml-3 flex-1">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900">
                                ✨ Sistem Telah Belajar!
                            </h3>
                            <p className="mt-1 text-sm text-gray-700">
                                Pembelajaran berhasil dari <span className="font-semibold">{count}</span> koreksi Anda.
                            </p>
                        </div>
                        
                        <button
                            onClick={onDismiss}
                            className="flex-shrink-0 ml-4 text-gray-400 hover:text-gray-600"
                        >
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Toggle Details */}
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="mt-2 inline-flex items-center text-xs font-medium text-purple-600 hover:text-purple-800"
                    >
                        {expanded ? (
                            <>
                                <ChevronUpIcon className="h-4 w-4 mr-1" />
                                Sembunyikan Detail
                            </>
                        ) : (
                            <>
                                <ChevronDownIcon className="h-4 w-4 mr-1" />
                                Lihat Detail
                            </>
                        )}
                    </button>

                    {/* Expanded Details */}
                    {expanded && details && (
                        <div className="mt-3 space-y-3">
                            {details.map((detail, index) => (
                                <div 
                                    key={index}
                                    className="bg-white rounded-md p-3 border border-purple-200"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                            {detail.kode}
                                        </span>
                                        <span className="text-xs text-gray-500 capitalize">
                                            {detail.type}
                                        </span>
                                    </div>

                                    {detail.auto_updated ? (
                                        <div className="space-y-1">
                                            <div className="flex items-center text-xs text-green-700">
                                                <CheckCircleIcon className="h-4 w-4 mr-1" />
                                                <span className="font-medium">Kamus Kata Diperbarui</span>
                                            </div>
                                            
                                            {detail.added_keywords && detail.added_keywords.length > 0 && (
                                                <div className="mt-2">
                                                    <p className="text-xs text-gray-600 mb-1">Kata ditambahkan:</p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {detail.added_keywords.map((keyword, i) => (
                                                            <span
                                                                key={i}
                                                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800"
                                                            >
                                                                + {keyword}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-xs text-gray-600">
                                            Kata kunci sudah ada di database
                                        </div>
                                    )}

                                    {detail.keywords && detail.keywords.length > 0 && (
                                        <div className="mt-2">
                                            <p className="text-xs text-gray-500">
                                                Kata kunci terdeteksi: {detail.keywords.join(', ')}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Summary */}
                    <div className="mt-3 pt-3 border-t border-purple-200">
                        <div className="flex items-center text-xs text-gray-600">
                            <svg className="h-4 w-4 mr-1 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            <span>
                                Preprocessing berikutnya akan lebih akurat dengan pembelajaran ini
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}