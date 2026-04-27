<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\PenugasanKelas;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $role): Response
    {
        $user = $request->user();

        // Check if user is logged in
        if (!$user) {
            abort(403, 'Anda tidak memiliki akses ke halaman ini.');
        }

        // ✅ STANDARD CHECK: User role matches required role
        if ($user->role === $role) {
            return $next($request);
        }

        // ✅ SPECIAL CASE: Allow guru_bk to access laporan-wali routes if they have class assignment
        if ($user->role === 'guru_bk' && $role === 'tenaga_pendidik') {
            // Check if this is a laporan-wali route
            $routeName = $request->route() ? $request->route()->getName() : '';
            
            if (str_starts_with($routeName, 'laporan-wali.')) {
                // ✅ FIX: Use is_active (boolean) - align with existing system
                $hasAssignment = PenugasanKelas::where('user_id', $user->id)
                    ->where('is_active', 1) // ← Changed from status = 'aktif'
                    ->exists();

                if ($hasAssignment) {
                    // Allow access
                    return $next($request);
                }
            }
        }

        // If no match, deny access
        abort(403, 'Anda tidak memiliki akses ke halaman ini.');
    }
}