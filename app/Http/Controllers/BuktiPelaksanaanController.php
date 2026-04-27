<?php

namespace App\Http\Controllers;

use App\Models\LaporanExpertSystemPoint;
use App\Models\BuktiPelaksanaan;
use App\Http\Requests\StoreBuktiPelaksanaanRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class BuktiPelaksanaanController extends Controller
{
    /**
     * Upload bukti pelaksanaan (Santri only)
     * 
     * POST /my-expert-system-point/{laporan}/upload-bukti
     */
    public function store(StoreBuktiPelaksanaanRequest $request, LaporanExpertSystemPoint $laporan)
    {
        try {
            // ══════════════════════════════════════════════════════
            // AUTHORIZATION CHECK
            // ══════════════════════════════════════════════════════
            
            // 1. Pastikan user adalah santri
            if (auth()->user()->role !== 'santri') {
                return redirect()->back()->withErrors([
                    'upload' => 'Hanya santri yang dapat upload bukti pelaksanaan.'
                ]);
            }

            // 2. Pastikan laporan adalah milik santri ini
            if ($laporan->santri_id !== auth()->id()) {
                return redirect()->back()->withErrors([
                    'upload' => 'Anda tidak memiliki akses untuk upload bukti pada laporan ini.'
                ]);
            }

            // 3. Pastikan laporan sudah selesai (status = selesai)
            if ($laporan->status !== 'selesai') {
                return redirect()->back()->withErrors([
                    'upload' => 'Laporan belum selesai diproses oleh BK.'
                ]);
            }

            // 4. Pastikan belum melewati deadline
            if ($laporan->is_terlambat) {
                return redirect()->back()->withErrors([
                    'upload' => 'Deadline upload bukti telah terlewati.'
                ]);
            }

            // 5. Pastikan belum ada bukti yang approved
            if ($laporan->bukti_approved) {
                return redirect()->back()->withErrors([
                    'upload' => 'Bukti pelaksanaan sudah disetujui BK. Tidak dapat upload lagi.'
                ]);
            }

            // ══════════════════════════════════════════════════════
            // VALIDATE MAX FILES
            // ══════════════════════════════════════════════════════
            
            $existingBuktisCount = $laporan->buktis()->count();
            $newFilesCount = count($request->file('files'));
            $totalFiles = $existingBuktisCount + $newFilesCount;

            if ($totalFiles > 3) {
                return redirect()->back()->withErrors([
                    'upload' => "Maksimal 3 file bukti. Anda sudah upload {$existingBuktisCount} file, tidak bisa upload {$newFilesCount} file lagi."
                ]);
            }

            // ══════════════════════════════════════════════════════
            // UPLOAD FILES
            // ══════════════════════════════════════════════════════
            
            DB::beginTransaction();

            $uploadedFiles = [];

            foreach ($request->file('files') as $file) {
                // Generate unique filename
                $timestamp = now()->format('YmdHis');
                $originalName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
                $extension = $file->getClientOriginalExtension();
                $filename = $timestamp . '-' . \Str::slug($originalName) . '.' . $extension;

                // Store file
                $path = $file->storeAs(
                    'bukti-pelaksanaan/expert-system/laporan-' . $laporan->id,
                    $filename,
                    'public'
                );

                // Create record
                $bukti = BuktiPelaksanaan::create([
                    'bukti_able_type' => LaporanExpertSystemPoint::class,
                    'bukti_able_id' => $laporan->id,
                    'file_path' => $path,
                    'file_name' => $file->getClientOriginalName(),
                    'file_type' => $file->getMimeType(),
                    'file_size' => $file->getSize(),
                    'keterangan' => $request->keterangan,
                    'uploaded_by' => auth()->id(),
                    'uploaded_at' => now(),
                    'status' => 'pending',
                ]);

                $uploadedFiles[] = $bukti;
            }

            // ══════════════════════════════════════════════════════
            // UPDATE LAPORAN STATUS
            // ══════════════════════════════════════════════════════
            
            $laporan->update([
                'has_bukti' => true,
                'final_status' => 'completed',  // Menunggu review BK
            ]);

            DB::commit();

            Log::info('Bukti pelaksanaan uploaded', [
                'laporan_id' => $laporan->id,
                'santri_id' => auth()->id(),
                'files_count' => count($uploadedFiles),
            ]);

            return redirect()->back()->with('success', 
                'Bukti pelaksanaan berhasil diupload! Menunggu review dari BK.'
            );

        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('BuktiPelaksanaanController@store failed', [
                'laporan_id' => $laporan->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return redirect()->back()->withErrors([
                'upload' => 'Gagal upload bukti: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Delete bukti pelaksanaan (Santri only, sebelum direview)
     * 
     * DELETE /my-expert-system-point/bukti/{bukti}
     */
    public function destroy(BuktiPelaksanaan $bukti)
    {
        try {
            // ══════════════════════════════════════════════════════
            // AUTHORIZATION CHECK
            // ══════════════════════════════════════════════════════
            
            // 1. Pastikan uploader adalah user ini
            if ($bukti->uploaded_by !== auth()->id()) {
                return redirect()->back()->withErrors([
                    'delete' => 'Anda tidak memiliki akses untuk menghapus bukti ini.'
                ]);
            }

            // 2. Pastikan bukti masih pending (belum direview)
            if (!$bukti->canBeDeletedByUploader()) {
                return redirect()->back()->withErrors([
                    'delete' => 'Bukti tidak dapat dihapus karena sudah direview oleh BK.'
                ]);
            }

            // ══════════════════════════════════════════════════════
            // DELETE FILE & RECORD
            // ══════════════════════════════════════════════════════
            
            $laporan = $bukti->buktiAble;

            $bukti->deleteFile();

            // Update laporan jika tidak ada bukti lagi
            if ($laporan->buktis()->count() === 0) {
                $laporan->update([
                    'has_bukti' => false,
                    'final_status' => 'in_progress',
                ]);
            }

            Log::info('Bukti pelaksanaan deleted', [
                'bukti_id' => $bukti->id,
                'deleted_by' => auth()->id(),
            ]);

            return redirect()->back()->with('success', 'Bukti berhasil dihapus.');

        } catch (\Exception $e) {
            Log::error('BuktiPelaksanaanController@destroy failed', [
                'bukti_id' => $bukti->id,
                'error' => $e->getMessage(),
            ]);

            return redirect()->back()->withErrors([
                'delete' => 'Gagal menghapus bukti: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Approve bukti pelaksanaan (BK only)
     * 
     * POST /expert-system-point/{laporan}/approve-bukti
     */
    public function approve(Request $request, LaporanExpertSystemPoint $laporan)
    {
        try {
            $validated = $request->validate([
                'catatan_review' => 'nullable|string|max:500',
            ]);

            // ══════════════════════════════════════════════════════
            // AUTHORIZATION CHECK
            // ══════════════════════════════════════════════════════
            
            if (auth()->user()->role !== 'guru_bk') {
                return redirect()->back()->withErrors([
                    'approve' => 'Hanya Guru BK yang dapat mereview bukti.'
                ]);
            }

            // ══════════════════════════════════════════════════════
            // APPROVE ALL PENDING BUKTI
            // ══════════════════════════════════════════════════════
            
            DB::beginTransaction();

            $pendingBuktis = $laporan->buktisPending;

            if ($pendingBuktis->isEmpty()) {
                return redirect()->back()->withErrors([
                    'approve' => 'Tidak ada bukti yang perlu direview.'
                ]);
            }

            foreach ($pendingBuktis as $bukti) {
                $bukti->approve(auth()->id(), $validated['catatan_review'] ?? null);
            }

            // Update laporan
            $laporan->update([
                'bukti_approved' => true,
                'final_status' => 'verified',
            ]);

            DB::commit();

            Log::info('Bukti pelaksanaan approved', [
                'laporan_id' => $laporan->id,
                'approved_by' => auth()->id(),
                'buktis_count' => $pendingBuktis->count(),
            ]);

            return redirect()->back()->with('success', 
                'Bukti pelaksanaan disetujui! Status laporan: Verified.'
            );

        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('BuktiPelaksanaanController@approve failed', [
                'laporan_id' => $laporan->id,
                'error' => $e->getMessage(),
            ]);

            return redirect()->back()->withErrors([
                'approve' => 'Gagal approve bukti: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Reject bukti pelaksanaan (BK only)
     * 
     * POST /expert-system-point/{laporan}/reject-bukti
     */
    public function reject(Request $request, LaporanExpertSystemPoint $laporan)
    {
        try {
            $validated = $request->validate([
                'catatan_review' => 'required|string|max:500',
            ], [
                'catatan_review.required' => 'Alasan penolakan wajib diisi.',
            ]);

            // ══════════════════════════════════════════════════════
            // AUTHORIZATION CHECK
            // ══════════════════════════════════════════════════════
            
            if (auth()->user()->role !== 'guru_bk') {
                return redirect()->back()->withErrors([
                    'reject' => 'Hanya Guru BK yang dapat mereview bukti.'
                ]);
            }

            // ══════════════════════════════════════════════════════
            // REJECT ALL PENDING BUKTI
            // ══════════════════════════════════════════════════════
            
            DB::beginTransaction();

            $pendingBuktis = $laporan->buktisPending;

            if ($pendingBuktis->isEmpty()) {
                return redirect()->back()->withErrors([
                    'reject' => 'Tidak ada bukti yang perlu direview.'
                ]);
            }

            foreach ($pendingBuktis as $bukti) {
                $bukti->reject(auth()->id(), $validated['catatan_review']);
            }

            // Update laporan - santri harus upload ulang
            $laporan->update([
                'final_status' => 'in_progress',
            ]);

            DB::commit();

            Log::info('Bukti pelaksanaan rejected', [
                'laporan_id' => $laporan->id,
                'rejected_by' => auth()->id(),
                'buktis_count' => $pendingBuktis->count(),
            ]);

            return redirect()->back()->with('success', 
                'Bukti pelaksanaan ditolak. Santri akan diminta upload ulang.'
            );

        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('BuktiPelaksanaanController@reject failed', [
                'laporan_id' => $laporan->id,
                'error' => $e->getMessage(),
            ]);

            return redirect()->back()->withErrors([
                'reject' => 'Gagal reject bukti: ' . $e->getMessage()
            ]);
        }
    }
}