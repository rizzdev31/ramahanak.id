import { useEffect, useState } from 'react';
import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Login({ status, canResetPassword }) {
    const [showPassword, setShowPassword] = useState(false);
    const [loginType, setLoginType] = useState('username');

    const { data, setData, post, processing, errors, reset } = useForm({
        login: '',
        password: '',
        remember: false,
    });

    useEffect(() => {
        return () => { reset('password'); };
    }, []);

    useEffect(() => {
        if (data.login.includes('@')) {
            setLoginType('email');
        } else if (/^\d+$/.test(data.login)) {
            setLoginType('nip');
        } else {
            setLoginType('username');
        }
    }, [data.login]);

    const submit = (e) => {
        e.preventDefault();
        post(route('login'));
    };

    const getLoginTypeIcon = () => {
        switch (loginType) {
            case 'email': return '📧';
            case 'nip':   return '🔢';
            default:      return '👤';
        }
    };

    return (
        <>
            <Head title="Login - Ramah Anak" />

            {/* ── Root: full screen abu terang seperti referensi ── */}
            <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4 sm:p-8">

                {/* ── Card pembungkus split-panel ── */}
                <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl shadow-teal-200/40 overflow-hidden flex min-h-[600px]">

                    {/* ════════════════════════════════
                        PANEL KIRI — Visual / Brand
                    ════════════════════════════════ */}
                    <div className="hidden md:flex md:w-5/12 relative flex-col justify-between p-8 overflow-hidden">

                        {/* Gradient mesh background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-teal-500 via-teal-600 to-cyan-700" />

                        {/* Blob dekoratif */}
                        <div className="absolute -top-20 -left-20 w-72 h-72 bg-teal-400/40 rounded-full blur-3xl" />
                        <div className="absolute top-1/3 -right-16 w-64 h-64 bg-cyan-300/30 rounded-full blur-2xl" />
                        <div className="absolute -bottom-16 left-1/4 w-56 h-56 bg-cyan-500/30 rounded-full blur-3xl" />
                        <div className="absolute top-16 right-8 w-32 h-32 bg-teal-300/20 rounded-full blur-xl" />

                        {/* Logo */}
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
                                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            </div>
                        </div>

                        {/* Tagline bawah */}
                        <div className="relative z-10">
                            <p className="text-white/60 text-xs font-medium mb-2 tracking-widest uppercase">
                                Sistem Pakar BK
                            </p>
                            <h2 className="text-white text-2xl font-bold leading-snug">
                                Monitoring Kesehatan<br />Mental Santri dengan<br />Expert System
                            </h2>
                            <div className="mt-6 flex items-center gap-3">
                                <div className="flex gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-white/80" />
                                    <span className="w-2 h-2 rounded-full bg-white/30" />
                                    <span className="w-2 h-2 rounded-full bg-white/30" />
                                </div>
                                <p className="text-white/50 text-xs">Pondok Pesantren Muhammadiyah An Nur</p>
                            </div>
                        </div>
                    </div>

                    {/* ════════════════════════════════
                        PANEL KANAN — Form Login
                    ════════════════════════════════ */}
                    <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 py-10">

                        {/* Header form */}
                        <div className="mb-8">
                            {/* Logo kecil untuk mobile */}
                            <div className="md:hidden w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center mb-6">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            </div>

                            {/* Aksen titik indigo — seperti referensi */}
                            <div className="flex items-center gap-1.5 mb-3">
                                <span className="w-3 h-3 rounded-sm bg-teal-600 rotate-45 inline-block" />
                                <span className="text-xs text-teal-600 font-semibold tracking-wider uppercase">RamahAnak.id</span>
                            </div>
                            <h1 className="text-3xl font-bold text-gray-900 leading-tight">
                                Selamat Datang
                            </h1>
                            <p className="text-gray-400 text-sm mt-1.5">
                                Masuk untuk memantau perkembangan santri
                            </p>
                        </div>

                        {/* Status */}
                        {status && (
                            <div className="mb-5 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2">
                                <span className="text-emerald-500 text-lg">✓</span>
                                <p className="text-sm text-emerald-700 font-medium">{status}</p>
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={submit} className="space-y-5">

                            {/* Input: Login */}
                            <div>
                                <InputLabel
                                    htmlFor="login"
                                    value="Username / Email / NIP / NISN"
                                    className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block"
                                />
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg pointer-events-none select-none">
                                        {getLoginTypeIcon()}
                                    </span>
                                    <TextInput
                                        id="login"
                                        type="text"
                                        name="login"
                                        value={data.login}
                                        className="block w-full pl-12 pr-28 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400
                                            focus:outline-none focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200
                                            hover:border-gray-300 transition-all duration-150"
                                        placeholder="Masukkan identitas Anda"
                                        autoComplete="username"
                                        isFocused={true}
                                        onChange={(e) => setData('login', e.target.value)}
                                    />
                                    {data.login && (
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-teal-600 bg-teal-50 border border-teal-100 px-2.5 py-1 rounded-lg">
                                            {loginType === 'email' ? 'Email' : loginType === 'nip' ? 'NIP/NISN' : 'Username'}
                                        </span>
                                    )}
                                </div>
                                <InputError message={errors.login} className="mt-1.5" />
                            </div>

                            {/* Input: Password */}
                            <div>
                                <InputLabel
                                    htmlFor="password"
                                    value="Password"
                                    className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block"
                                />
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg pointer-events-none select-none">
                                        🔒
                                    </span>
                                    <TextInput
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={data.password}
                                        className="block w-full pl-12 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400
                                            focus:outline-none focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200
                                            hover:border-gray-300 transition-all duration-150"
                                        placeholder="Masukkan password"
                                        autoComplete="current-password"
                                        onChange={(e) => setData('password', e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors duration-150"
                                    >
                                        {showPassword ? (
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                            </svg>
                                        ) : (
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                <InputError message={errors.password} className="mt-1.5" />
                            </div>

                            {/* Remember + Forgot */}
                            <div className="flex items-center justify-between pt-1">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <Checkbox
                                        name="remember"
                                        checked={data.remember}
                                        onChange={(e) => setData('remember', e.target.checked)}
                                        className="rounded border-gray-300 text-teal-600 focus:ring-teal-500 focus:ring-offset-0"
                                    />
                                    <span className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors duration-150 select-none">
                                        Ingat saya
                                    </span>
                                </label>
                                {canResetPassword && (
                                    <Link
                                        href={route('password.request')}
                                        className="text-sm font-medium text-teal-600 hover:text-teal-500 transition-colors duration-150"
                                    >
                                        Lupa password?
                                    </Link>
                                )}
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full flex items-center justify-center gap-2 py-3.5 px-6
                                    bg-teal-600 hover:bg-teal-700 active:bg-teal-800
                                    text-white text-sm font-semibold rounded-xl
                                    focus:outline-none focus:ring-4 focus:ring-teal-300
                                    disabled:opacity-50 disabled:cursor-not-allowed
                                    transition-all duration-150 shadow-lg shadow-teal-500/30 hover:shadow-xl hover:shadow-teal-500/40
                                    transform hover:-translate-y-0.5 active:translate-y-0"
                            >
                                {processing ? (
                                    <>
                                        <svg className="animate-spin w-4 h-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Memproses...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4 opacity-80" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                        </svg>
                                        Masuk
                                    </>
                                )}
                            </button>

                                {/* Register */}
                                {/* <p className="text-center text-sm text-gray-500 pt-1">
                                    Belum punya akun?{' '}
                                    <Link
                                        href={route('register')}
                                        className="font-semibold text-teal-600 hover:text-teal-500 transition-colors duration-150"
                                    >
                                        Daftar sekarang
                                    </Link>
                                </p> */}
                        </form>

                        {/* Info cara login — compact */}
                        <div className="mt-8 pt-6 border-t border-gray-100">
                            <p className="text-xs text-gray-400 font-medium mb-2">Cara Login</p>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { icon: '👤', label: 'Username' },
                                    { icon: '📧', label: 'Email'    },
                                    { icon: '🔢', label: 'NIP/NISN' },
                                ].map((item, i) => (
                                    <span key={i}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600 font-medium">
                                        {item.icon} {item.label}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Footer */}
                        <p className="mt-6 text-xs text-gray-300 text-center">
                            © {new Date().getFullYear()} Ramah Anak — Pondok Pesantren Muhammadiyah An Nur Sidoarjo
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}