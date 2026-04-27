<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class CheckAccountStatus
{
    public function handle(Request $request, Closure $next): Response
    {
        if (Auth::check() && Auth::user()->status !== 'active') {
            $status = Auth::user()->status;
            Auth::logout();

            $message = $status === 'pending' 
                ? 'Akun Anda sedang menunggu validasi dari Guru BK.' 
                : 'Akun Anda telah dinonaktifkan.';

            return redirect()->route('login')->with('error', $message);
        }

        return $next($request);
    }
}