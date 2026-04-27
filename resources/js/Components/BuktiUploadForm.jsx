import { useState, useRef } from 'react';
import { useForm } from '@inertiajs/react';
import PrimaryButton from '@/Components/PrimaryButton';
import InputError from '@/Components/InputError';

export default function BuktiUploadForm({ laporanId, onCancel }) {
    const [previews, setPreviews] = useState([]);
    const fileInputRef = useRef(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        files: [],
        keterangan: '',
    });

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        
        // Validasi max 3 files
        const currentFilesCount = data.files.length;
        const totalFiles = currentFilesCount + selectedFiles.length;
        
        if (totalFiles > 3) {
            alert(`Maksimal 3 file. Anda sudah upload ${currentFilesCount} file, tidak bisa upload ${selectedFiles.length} file lagi.`);
            return;
        }

        // Validasi file type dan size
        const validFiles = selectedFiles.filter(file => {
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
            const maxSize = 2 * 1024 * 1024; // 2MB

            if (!validTypes.includes(file.type)) {
                alert(`File ${file.name} bukan format yang diizinkan (JPEG, PNG, PDF).`);
                return false;
            }

            if (file.size > maxSize) {
                alert(`File ${file.name} terlalu besar. Maksimal 2MB per file.`);
                return false;
            }

            return true;
        });

        if (validFiles.length === 0) return;

        // Add files to form data
        const newFiles = [...data.files, ...validFiles];
        setData('files', newFiles);

        // Generate previews
        const newPreviews = validFiles.map(file => {
            const isImage = file.type.startsWith('image/');
            
            if (isImage) {
                return {
                    id: Math.random().toString(36).substr(2, 9),
                    file: file,
                    url: URL.createObjectURL(file),
                    type: 'image',
                    name: file.name,
                    size: formatFileSize(file.size),
                };
            } else {
                return {
                    id: Math.random().toString(36).substr(2, 9),
                    file: file,
                    url: null,
                    type: 'pdf',
                    name: file.name,
                    size: formatFileSize(file.size),
                };
            }
        });

        setPreviews([...previews, ...newPreviews]);
        
        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleRemoveFile = (previewId) => {
        const previewToRemove = previews.find(p => p.id === previewId);
        
        // Remove from previews
        const newPreviews = previews.filter(p => p.id !== previewId);
        setPreviews(newPreviews);

        // Remove from form data
        const newFiles = data.files.filter(f => f !== previewToRemove.file);
        setData('files', newFiles);

        // Revoke object URL
        if (previewToRemove.url) {
            URL.revokeObjectURL(previewToRemove.url);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (data.files.length === 0) {
            alert('Pilih minimal 1 file untuk diupload.');
            return;
        }

        post(route('my-expert-system-point.upload-bukti', laporanId), {
            onSuccess: () => {
                reset();
                setPreviews([]);
                if (onCancel) onCancel();
            },
            onError: (errors) => {
                console.error('Upload error:', errors);
            },
        });
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const droppedFiles = Array.from(e.dataTransfer.files);
        
        // Create a synthetic event for handleFileChange
        const syntheticEvent = {
            target: {
                files: droppedFiles
            }
        };
        
        handleFileChange(syntheticEvent);
    };

    const canAddMore = data.files.length < 3;

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* File Upload Area */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    File Bukti (PNG, JPEG, PDF) <span className="text-red-500">*</span>
                </label>
                
                {canAddMore && (
                    <div
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-400 transition cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="mt-2 text-sm text-gray-600">
                            <span className="font-semibold text-indigo-600">Klik untuk upload</span> atau drag & drop
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            PNG, JPEG, PDF (Maks. 2MB per file) • {3 - data.files.length} slot tersisa
                        </p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="image/jpeg,image/jpg,image/png,application/pdf"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                    </div>
                )}

                {errors.files && <InputError message={errors.files} className="mt-2" />}
                {errors['files.0'] && <InputError message={errors['files.0']} className="mt-2" />}
            </div>

            {/* Preview Area */}
            {previews.length > 0 && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Preview ({previews.length}/3)
                    </label>
                    <div className="grid grid-cols-3 gap-4">
                        {previews.map((preview) => (
                            <div key={preview.id} className="relative border rounded-lg overflow-hidden">
                                {preview.type === 'image' ? (
                                    <img
                                        src={preview.url}
                                        alt={preview.name}
                                        className="w-full h-32 object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-32 bg-red-100 flex flex-col items-center justify-center">
                                        <span className="text-4xl">📄</span>
                                        <p className="text-xs text-gray-600 mt-2 px-2 text-center truncate w-full">
                                            {preview.name}
                                        </p>
                                    </div>
                                )}
                                
                                {/* Info overlay */}
                                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white p-2">
                                    <p className="text-xs truncate">{preview.name}</p>
                                    <p className="text-xs opacity-75">{preview.size}</p>
                                </div>

                                {/* Remove button */}
                                <button
                                    type="button"
                                    onClick={() => handleRemoveFile(preview.id)}
                                    className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 shadow-lg"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Keterangan (Optional) */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Keterangan (Opsional)
                </label>
                <textarea
                    value={data.keterangan}
                    onChange={(e) => setData('keterangan', e.target.value)}
                    rows={3}
                    maxLength={500}
                    placeholder="Tambahkan keterangan jika diperlukan..."
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                    {data.keterangan.length}/500 karakter
                </p>
                {errors.keterangan && <InputError message={errors.keterangan} className="mt-2" />}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={processing}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50"
                >
                    Batal
                </button>
                <PrimaryButton disabled={processing || data.files.length === 0}>
                    {processing ? 'Mengupload...' : `Upload ${data.files.length} File`}
                </PrimaryButton>
            </div>
        </form>
    );
}