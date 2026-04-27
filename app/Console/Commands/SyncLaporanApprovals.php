<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\LaporanPelanggaran;
use App\Models\LaporanApresiasi;
use App\Models\LaporanKonselor;
use App\Models\LaporanApproval;
use App\Models\PenugasanKelas;
use App\Models\RiwayatKelasSantri;
use Illuminate\Support\Facades\DB;

class SyncLaporanApprovals extends Command
{
    protected $signature = 'laporan:sync-approvals {--force : Force sync all}';
    protected $description = 'Sync laporan approvals with current ACTIVE class assignments';

    public function handle()
    {
        $this->info('Starting approval sync...');
        
        $force = $this->option('force');
        
        DB::transaction(function () use ($force) {
            $this->syncLaporanType(LaporanPelanggaran::class, 'pelaku_santri_id', $force);
            $this->syncLaporanType(LaporanApresiasi::class, 'santri_id', $force);
            $this->syncLaporanType(LaporanKonselor::class, 'santri_id', $force);
        });
        
        $this->info('Approval sync completed!');
    }
    
    private function syncLaporanType($laporanClass, $santriIdColumn, $force)
    {
        $this->info("Syncing {$laporanClass}...");
        
        $query = $laporanClass::query()
            ->whereIn('approval_status', ['pending_tenaga_pendidik', 'pending_bk']);
            
        if (!$force) {
            $query->whereDoesntHave('approvals');
        }
        
        $laporanList = $query->with(['approvals'])->get();
        
        foreach ($laporanList as $laporan) {
            $this->syncSingleLaporan($laporan, $santriIdColumn, get_class($laporan));
        }
        
        $this->info("Synced {$laporanList->count()} laporan");
    }
    
    private function syncSingleLaporan($laporan, $santriIdColumn, $laporanType)
    {
        $santriId = $laporan->{$santriIdColumn};
        
        if (!$santriId) {
            $this->warn("No santri found for laporan {$laporan->id}");
            return;
        }
        
        // ✅ FIX: Get kelas_id dari riwayat_kelas_santri yang aktif
        $riwayat = RiwayatKelasSantri::where('user_id', $santriId)
            ->where('is_active', 1)
            ->first();
        
        if (!$riwayat) {
            $this->warn("No active kelas for santri {$santriId} (laporan {$laporan->id})");
            return;
        }
        
        $kelasId = $riwayat->kelas_id;
        
        // ✅ FIX: Get ACTIVE wali dari kelas tersebut
        $currentAssignments = PenugasanKelas::where('kelas_id', $kelasId)
            ->where('is_active', 1)
            ->pluck('user_id')
            ->toArray();
        
        if (empty($currentAssignments)) {
            $this->warn("No ACTIVE wali for kelas {$kelasId} (laporan {$laporan->id})");
            return;
        }
        
        $existingApprovals = $laporan->approvals->pluck('tenaga_pendidik_id')->toArray();
        
        // Add new approvals
        $newApprovers = array_diff($currentAssignments, $existingApprovals);
        foreach ($newApprovers as $userId) {
            LaporanApproval::create([
                'laporan_type' => $laporanType,
                'laporan_id' => $laporan->id,
                'tenaga_pendidik_id' => $userId,
                'deadline_at' => now()->addHours(24),
            ]);
            
            $this->info("✓ Added approval for user {$userId} on laporan {$laporan->id}");
        }
        
        // Remove approvals from removed approvers (only pending)
        $removedApprovers = array_diff($existingApprovals, $currentAssignments);
        if (!empty($removedApprovers)) {
            $deleted = LaporanApproval::where('laporan_type', $laporanType)
                ->where('laporan_id', $laporan->id)
                ->whereIn('tenaga_pendidik_id', $removedApprovers)
                ->whereNull('approved_at')
                ->delete();
            
            if ($deleted > 0) {
                $this->warn("✗ Removed {$deleted} pending approvals from: " . implode(', ', $removedApprovers));
            }
        }
        
        // Recalculate status
        if (LaporanApproval::isAllApproved($laporanType, $laporan->id)) {
            $laporan->update(['approval_status' => 'pending_bk']);
            $this->info("→ Laporan {$laporan->id} status: pending_bk");
        } else {
            $laporan->update(['approval_status' => 'pending_tenaga_pendidik']);
        }
    }
}