<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Autentikasi sederhana antar-aplikasi untuk API integrasi.
 * Memeriksa header Authorization: Bearer <token> == config('integrasi.token').
 */
class VerifyIntegrasiToken
{
    public function handle(Request $request, Closure $next): Response
    {
        $expected = config('integrasi.token');
        $given    = $request->bearerToken();

        if (empty($expected) || empty($given) || !hash_equals($expected, $given)) {
            return response()->json([
                'status'  => 'unauthorized',
                'message' => 'Token integrasi tidak valid.',
            ], 401);
        }

        return $next($request);
    }
}
