<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreBuktiPelaksanaanRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Authorization akan dicek di controller
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            // File validation
            'files' => 'required|array|min:1|max:3',
            'files.*' => [
                'required',
                'file',
                'mimes:jpeg,jpg,png,pdf',
                'max:2048',  // Max 2MB per file
            ],
            
            // Optional keterangan
            'keterangan' => 'nullable|string|max:500',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'files.required' => 'File bukti pelaksanaan wajib diupload.',
            'files.array' => 'Format file tidak valid.',
            'files.min' => 'Minimal upload 1 file.',
            'files.max' => 'Maksimal upload 3 file.',
            
            'files.*.required' => 'Setiap file wajib diisi.',
            'files.*.file' => 'Upload harus berupa file.',
            'files.*.mimes' => 'File harus berformat: JPEG, JPG, PNG, atau PDF.',
            'files.*.max' => 'Ukuran file maksimal 2MB per file.',
            
            'keterangan.max' => 'Keterangan maksimal 500 karakter.',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     */
    public function attributes(): array
    {
        return [
            'files' => 'file bukti',
            'files.*' => 'file',
            'keterangan' => 'keterangan',
        ];
    }
}