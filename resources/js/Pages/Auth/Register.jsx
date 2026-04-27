import { useEffect, useState } from 'react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';

/**
 * Register.jsx — Versi Diperbaiki
 *
 * DAFTAR BUG YANG DIPERBAIKI:
 * ════════════════════════════════════════════════════════════
 *
 * BUG #1 — ROOT CAUSE UTAMA: Error backend tidak terlihat
 *   MASALAH: Saat form di-submit dan backend return validation error
 *            (misal: email sudah terdaftar, username duplikat), error
 *            muncul di step yang TIDAK AKTIF → user tidak bisa melihat
 *            → terasa "tidak ada proses sama sekali".
 *   FIX: Tambahkan onError callback di post() yang redirect user ke
 *        step yang relevan berdasarkan field mana yang error.
 *
 * BUG #2 — autoComplete interference
 *   MASALAH: Input password tanpa autoComplete="new-password" bisa
 *            menyebabkan browser autofill password lama yang mengubah
 *            nilai secara diam-diam, menyebabkan konfirmasi tidak cocok.
 *   FIX: Tambahkan autoComplete="new-password" pada field password
 *        dan password_confirmation.
 *
 * BUG #3 — Validasi step tidak mencek username
 *   MASALAH: canProceedStep2 tidak memverifikasi username sudah
 *            ter-generate, sehingga bisa lanjut ke step 3 tanpa username
 *            → backend reject dengan error yang muncul di step yang salah.
 *   FIX: Tambahkan pengecekan data.username di canProceedStep2.
 *
 * BUG #4 — clearErrors tidak dipanggil saat pindah step atau input berubah
 *   MASALAH: Error dari submit sebelumnya tetap muncul meskipun user
 *            sudah perbaiki field-nya, membingungkan user.
 *   FIX: Panggil clearErrors() saat nextStep/prevStep dan per onChange.
 *
 * BUG #5 — Error step yang sudah dilewati tidak terdeteksi secara visual
 *   MASALAH: Tidak ada indikasi visual di step progress bahwa step yang
 *            sudah dilewati punya error dari backend.
 *   FIX: Tambahkan stepHasError() dan tampilkan badge "!" di step indicator.
 *
 * BUG #6 — Tidak ada global error banner
 *   MASALAH: Jika ada error yang tidak ter-cover InputError per-field
 *            (misal error generic), tidak ada tempat tampilannya.
 *   FIX: Tambahkan global error banner di atas navigation buttons.
 *
 * BUG #7 — noValidate tidak di-set di form
 *   MASALAH: Browser HTML5 validation bisa interfere dengan Inertia
 *            validation flow, memunculkan popup browser native yang
 *            tidak konsisten dengan UI custom.
 *   FIX: Tambahkan noValidate pada <form>.
 */
export default function Register() {
    const [currentStep, setCurrentStep]                 = useState(1);
    const [showPassword, setShowPassword]               = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordStrength, setPasswordStrength]       = useState(0);

    // ── useForm ───────────────────────────────────────────────────
    // Semua field yang divalidasi backend RegisteredUserController:
    // username, email, password (confirmed), role, nip_nisn,
    // nama_lengkap, nama_panggilan
    const {
        data, setData, post, processing,
        errors, reset, clearErrors,
    } = useForm({
        role:                  '',
        nip_nisn:              '',
        nama_lengkap:          '',
        nama_panggilan:        '',
        email:                 '',
        password:              '',
        password_confirmation: '',
        username:              '', // auto-generated dari nama_panggilan
    });

    // Cleanup saat unmount
    useEffect(() => {
        return () => { reset('password', 'password_confirmation'); };
    }, []);

    // ── Auto-generate username dari nama_panggilan ─────────────────
    useEffect(() => {
        if (data.nama_panggilan) {
            const generated = data.nama_panggilan
                .toLowerCase()
                .replace(/\s+/g, '')
                .replace(/[^a-z0-9]/g, '');
            if (generated !== data.username) {
                setData('username', generated);
            }
        }
    }, [data.nama_panggilan]); // eslint-disable-line

    // ── Password strength checker ──────────────────────────────────
    useEffect(() => {
        if (data.password) {
            let s = 0;
            if (data.password.length >= 8)           s++;
            if (/[a-z]/.test(data.password))         s++;
            if (/[A-Z]/.test(data.password))         s++;
            if (/[0-9]/.test(data.password))         s++;
            if (/[^a-zA-Z0-9]/.test(data.password)) s++;
            setPasswordStrength(s);
        } else {
            setPasswordStrength(0);
        }
    }, [data.password]);

    // ── Submit handler ─────────────────────────────────────────────
    // FIX #1: onError → redirect ke step yang punya error
    const submit = (e) => {
        e.preventDefault();
        post(route('register'), {
            onError: (errs) => {
                // Tentukan step pertama yang punya error, redirect ke sana
                if (errs.role || errs.nip_nisn) {
                    setCurrentStep(1);
                } else if (
                    errs.nama_lengkap  ||
                    errs.nama_panggilan ||
                    errs.email          ||
                    errs.username
                ) {
                    setCurrentStep(2);
                }
                // Step 3 (password) sudah aktif saat submit → langsung terlihat
            },
        });
    };

    // ── Step navigation ────────────────────────────────────────────
    // FIX #4: clearErrors saat berpindah step
    const nextStep = () => {
        if (currentStep < 3) {
            clearErrors();
            setCurrentStep(s => s + 1);
        }
    };
    const prevStep = () => {
        if (currentStep > 1) {
            clearErrors();
            setCurrentStep(s => s - 1);
        }
    };

    // ── Validasi per step ──────────────────────────────────────────
    // FIX #3: canProceedStep2 cek username juga
    const canProceedStep1 = !!(data.role && data.nip_nisn.trim());
    const canProceedStep2 = !!(
        data.nama_lengkap.trim()   &&
        data.nama_panggilan.trim() &&
        data.email.trim()           &&
        data.username               // pastikan username sudah ter-generate
    );
    const canSubmit = !!(
        data.password              &&
        data.password_confirmation &&
        data.password === data.password_confirmation &&
        data.password.length >= 8  // sesuai minimum Laravel Password::defaults()
    );

    // ── FIX #5: Deteksi error per step ────────────────────────────
    const stepHasError = (step) => {
        if (step === 1) return !!(errors.role || errors.nip_nisn);
        if (step === 2) return !!(
            errors.nama_lengkap || errors.nama_panggilan ||
            errors.email        || errors.username
        );
        if (step === 3) return !!(errors.password || errors.password_confirmation);
        return false;
    };

    // ── Helpers display ────────────────────────────────────────────
    const nipNisnLabel =
        data.role === 'santri' ? 'NISN (Nomor Induk Siswa Nasional)'
        : (data.role === 'tenaga_pendidik' || data.role === 'guru_bk')
            ? 'NIP (Nomor Induk Pegawai)'
            : 'NIP / NISN';

    const strengthColor = passwordStrength <= 1 ? 'bg-red-500'
        : passwordStrength <= 3 ? 'bg-yellow-500' : 'bg-teal-500';
    const strengthText = passwordStrength <= 1 ? 'Lemah'
        : passwordStrength <= 3 ? 'Sedang' : 'Kuat';
    const strengthTextColor = passwordStrength <= 1 ? 'text-red-600'
        : passwordStrength <= 3 ? 'text-yellow-600' : 'text-teal-600';

    const STEPS = ['Identitas', 'Data Pribadi', 'Keamanan'];

    // Shared input className dengan border merah saat ada error
    const inputCls = (hasErr) =>
        `block w-full py-3 bg-gray-50 border rounded-xl text-sm text-gray-900
        placeholder-gray-400 focus:outline-none focus:bg-white
        focus:border-teal-500 focus:ring-2 focus:ring-teal-200
        hover:border-gray-300 transition-all duration-150
        ${hasErr ? 'border-red-400 bg-red-50' : 'border-gray-200'}`;

    // SVG eye icons
    const EyeOpen = () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943
                9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
    );
    const EyeOff = () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7
                a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878
                9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3
                3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543
                7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
        </svg>
    );

    // ── Render ─────────────────────────────────────────────────────
    return (
        <>
            <Head title="Daftar Akun — Sistem Pakar BK" />

            <div className="min-h-screen flex items-center justify-center
                bg-slate-100 p-4 sm:p-6">

                {/* ── Card split-panel ──────────────────────── */}
                <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl
                    shadow-teal-200/40 overflow-hidden flex">

                    {/* ══════════════════════════════════════
                        PANEL KIRI — Branding & Progress
                    ══════════════════════════════════════ */}
                    <div className="hidden md:flex md:w-5/12 relative flex-col
                        justify-between p-8 overflow-hidden">

                        <div className="absolute inset-0 bg-gradient-to-br
                            from-teal-500 via-teal-600 to-cyan-700" />
                        <div className="absolute -top-20 -left-20 w-72 h-72
                            bg-teal-400/40 rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute top-1/3 -right-16 w-64 h-64
                            bg-cyan-300/30 rounded-full blur-2xl pointer-events-none" />
                        <div className="absolute -bottom-16 left-1/4 w-56 h-56
                            bg-cyan-500/30 rounded-full blur-3xl pointer-events-none" />

                        {/* Logo */}
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm
                                rounded-2xl flex items-center justify-center
                                border border-white/30">
                                <svg className="w-7 h-7 text-white" fill="none"
                                    stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round"
                                        strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3
                                        0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6
                                        6 0 0112 0v1H3v-1z" />
                                </svg>
                            </div>
                        </div>

                        {/* FIX #5: Step progress dengan error indicator */}
                        <div className="relative z-10">
                            <p className="text-white/50 text-xs font-semibold
                                uppercase tracking-widest mb-4">
                                Langkah Pendaftaran
                            </p>
                            <div className="space-y-3">
                                {STEPS.map((label, i) => {
                                    const step    = i + 1;
                                    const done    = currentStep > step;
                                    const current = currentStep === step;
                                    const hasErr  = stepHasError(step);
                                    return (
                                        <div key={i} className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex
                                                items-center justify-center text-xs font-bold
                                                shrink-0 transition-all duration-200 ${
                                                    hasErr
                                                        ? 'bg-red-500 text-white ring-2 ring-red-300'
                                                    : done
                                                        ? 'bg-white text-teal-600'
                                                    : current
                                                        ? 'bg-white/30 text-white border-2 border-white'
                                                    : 'bg-white/10 text-white/40 border border-white/20'
                                                }`}>
                                                {hasErr ? (
                                                    <span className="text-sm font-black">!</span>
                                                ) : done ? (
                                                    <svg className="w-4 h-4" fill="currentColor"
                                                        viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707
                                                            5.293a1 1 0 010 1.414l-8 8a1 1 0
                                                            01-1.414 0l-4-4a1 1 0 011.414-1.414L8
                                                            12.586l7.293-7.293a1 1 0 011.414 0z"
                                                            clipRule="evenodd" />
                                                    </svg>
                                                ) : step}
                                            </div>
                                            <span className={`text-sm font-medium ${
                                                hasErr  ? 'text-red-300'
                                                : current ? 'text-white'
                                                : done    ? 'text-white/80'
                                                : 'text-white/40'
                                            }`}>
                                                {label}
                                                {hasErr && (
                                                    <span className="ml-1 text-xs
                                                        text-red-300 font-normal">
                                                        — ada error
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Tagline */}
                        <div className="relative z-10">
                            <p className="text-white/60 text-xs font-semibold
                                tracking-widest uppercase mb-2">
                                Sistem Pakar BK
                            </p>
                            <h2 className="text-white text-2xl font-bold leading-snug">
                                Bergabung dan mulai<br />pantau kesehatan<br />mental santri
                            </h2>
                            <p className="text-white/40 text-xs mt-4">
                                Pondok Pesantren Muhammadiyah An Nur Sidoarjo
                            </p>
                        </div>
                    </div>

                    {/* ══════════════════════════════════════
                        PANEL KANAN — Form Register
                    ══════════════════════════════════════ */}
                    <div className="flex-1 flex flex-col justify-center
                        px-8 sm:px-10 py-8 min-h-[640px]">

                        {/* Header */}
                        <div className="mb-6">
                            <div className="md:hidden w-10 h-10 bg-teal-600
                                rounded-xl flex items-center justify-center mb-5">
                                <svg className="w-6 h-6 text-white" fill="none"
                                    stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round"
                                        strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3
                                        0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6
                                        6 0 0112 0v1H3v-1z" />
                                </svg>
                            </div>
                            <div className="flex items-center gap-1.5 mb-2">
                                <span className="w-3 h-3 rounded-sm bg-teal-600
                                    rotate-45 inline-block" />
                                <span className="text-xs text-teal-600 font-semibold
                                    tracking-wider uppercase">
                                    RamahAnak.id
                                </span>
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Daftar Akun Baru
                            </h1>
                            <p className="text-gray-400 text-sm mt-1">
                                Bergabunglah dengan Sistem Pakar BK
                            </p>
                        </div>

                        {/* Step indicator mobile */}
                        <div className="md:hidden flex items-center gap-2 mb-6">
                            {STEPS.map((label, i) => {
                                const step   = i + 1;
                                const done   = currentStep > step;
                                const curr   = currentStep === step;
                                const hasErr = stepHasError(step);
                                return (
                                    <div key={i} className="flex items-center gap-1 flex-1">
                                        <div className={`w-6 h-6 rounded-full flex items-center
                                            justify-center text-xs font-bold shrink-0 ${
                                                hasErr  ? 'bg-red-500 text-white'
                                                : done    ? 'bg-teal-500 text-white'
                                                : curr    ? 'bg-teal-600 text-white ring-4 ring-teal-100'
                                                : 'bg-gray-200 text-gray-400'
                                            }`}>
                                            {hasErr ? '!' : done ? '✓' : step}
                                        </div>
                                        {i < STEPS.length - 1 && (
                                            <div className={`flex-1 h-0.5 ${
                                                done ? 'bg-teal-500' : 'bg-gray-200'
                                            }`} />
                                        )}
                                    </div>
                                );
                            })}
                            <span className="text-xs text-teal-600 font-semibold ml-1 shrink-0">
                                {STEPS[currentStep - 1]}
                            </span>
                        </div>

                        {/* ══════════════════════════════════════
                            FORM
                            FIX #7: noValidate → matikan HTML5
                            validation bawaan browser agar tidak
                            konflik dengan Inertia + Laravel.
                        ══════════════════════════════════════ */}
                        <form
                            onSubmit={submit}
                            noValidate
                            className="flex-1 flex flex-col"
                        >
                            <div className="flex-1 space-y-4">

                                {/* ────────────────────────────
                                    STEP 1 — Role & NIP/NISN
                                ──────────────────────────── */}
                                {currentStep === 1 && (
                                    <div className="space-y-5">

                                        <div>
                                            <InputLabel
                                                htmlFor="role"
                                                value="Daftar Sebagai"
                                                className="text-xs font-semibold text-gray-600
                                                    uppercase tracking-wide mb-2 block"
                                            />
                                            <div className="grid grid-cols-2 gap-3">
                                                {[
                                                    {
                                                        value: 'tenaga_pendidik',
                                                        label: 'Tenaga Pendidik',
                                                        icon: '👨‍🏫',
                                                        desc: 'Guru / Staff',
                                                    },
                                                    {
                                                        value: 'santri',
                                                        label: 'Santri',
                                                        icon: '👨‍🎓',
                                                        desc: 'Siswa / Murid',
                                                    },
                                                ].map((role) => (
                                                    // type="button" WAJIB — tanpa ini, klik
                                                    // akan trigger form submit bukan setData
                                                    <button
                                                        key={role.value}
                                                        type="button"
                                                        onClick={() => {
                                                            setData('role', role.value);
                                                            clearErrors('role');
                                                        }}
                                                        className={`p-4 rounded-xl border-2
                                                            transition-all duration-150 text-left
                                                            focus:outline-none focus:ring-2
                                                            focus:ring-teal-300 ${
                                                                data.role === role.value
                                                                    ? 'border-teal-500 bg-teal-50 shadow-md'
                                                                    : errors.role
                                                                        ? 'border-red-300 bg-red-50 hover:border-red-400'
                                                                        : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white'
                                                            }`}
                                                    >
                                                        <div className="text-2xl mb-1.5">{role.icon}</div>
                                                        <div className={`text-sm font-semibold ${
                                                            data.role === role.value
                                                                ? 'text-teal-800' : 'text-gray-800'
                                                        }`}>
                                                            {role.label}
                                                        </div>
                                                        <div className="text-xs text-gray-400 mt-0.5">
                                                            {role.desc}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                            <InputError message={errors.role} className="mt-1.5" />
                                        </div>

                                        {data.role && (
                                            <div>
                                                <InputLabel
                                                    htmlFor="nip_nisn"
                                                    value={nipNisnLabel}
                                                    className="text-xs font-semibold text-gray-600
                                                        uppercase tracking-wide mb-1.5 block"
                                                />
                                                <div className="relative">
                                                    <span className="absolute left-4 top-1/2
                                                        -translate-y-1/2 text-lg pointer-events-none">
                                                        🔢
                                                    </span>
                                                    <TextInput
                                                        id="nip_nisn"
                                                        name="nip_nisn"
                                                        value={data.nip_nisn}
                                                        placeholder={
                                                            data.role === 'santri'
                                                                ? 'Contoh: 0012345678'
                                                                : 'Contoh: 198501012010011001'
                                                        }
                                                        autoComplete="off"
                                                        className={`${inputCls(errors.nip_nisn)} pl-12 pr-4`}
                                                        onChange={(e) => {
                                                            setData('nip_nisn', e.target.value);
                                                            clearErrors('nip_nisn');
                                                        }}
                                                    />
                                                </div>
                                                <p className="text-xs text-gray-400 mt-1.5">
                                                    Nomor identitas resmi Anda
                                                </p>
                                                <InputError message={errors.nip_nisn} className="mt-1" />
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* ────────────────────────────
                                    STEP 2 — Data Pribadi
                                ──────────────────────────── */}
                                {currentStep === 2 && (
                                    <div className="space-y-4">

                                        {/* Nama Lengkap */}
                                        <div>
                                            <InputLabel
                                                htmlFor="nama_lengkap"
                                                value="Nama Lengkap"
                                                className="text-xs font-semibold text-gray-600
                                                    uppercase tracking-wide mb-1.5 block"
                                            />
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2
                                                    -translate-y-1/2 text-lg pointer-events-none">👤</span>
                                                <TextInput
                                                    id="nama_lengkap"
                                                    name="nama_lengkap"
                                                    value={data.nama_lengkap}
                                                    placeholder="Nama sesuai dokumen resmi"
                                                    autoComplete="name"
                                                    className={`${inputCls(errors.nama_lengkap)} pl-12 pr-4`}
                                                    onChange={(e) => {
                                                        setData('nama_lengkap', e.target.value);
                                                        clearErrors('nama_lengkap');
                                                    }}
                                                />
                                            </div>
                                            <InputError message={errors.nama_lengkap} className="mt-1" />
                                        </div>

                                        {/* Nama Panggilan */}
                                        <div>
                                            <InputLabel
                                                htmlFor="nama_panggilan"
                                                value="Nama Panggilan"
                                                className="text-xs font-semibold text-gray-600
                                                    uppercase tracking-wide mb-1.5 block"
                                            />
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2
                                                    -translate-y-1/2 text-lg pointer-events-none">✨</span>
                                                <TextInput
                                                    id="nama_panggilan"
                                                    name="nama_panggilan"
                                                    value={data.nama_panggilan}
                                                    placeholder="Nama yang biasa dipanggil"
                                                    autoComplete="nickname"
                                                    className={`${inputCls(errors.nama_panggilan)} pl-12 pr-4`}
                                                    onChange={(e) => {
                                                        setData('nama_panggilan', e.target.value);
                                                        clearErrors('nama_panggilan');
                                                    }}
                                                />
                                            </div>
                                            <p className="text-xs text-gray-400 mt-1.5">
                                                Akan digunakan sebagai username otomatis
                                            </p>
                                            <InputError message={errors.nama_panggilan} className="mt-1" />
                                        </div>

                                        {/* Username preview */}
                                        {data.username && (
                                            <div className="bg-teal-50 border border-teal-200
                                                rounded-xl px-4 py-3 flex items-center justify-between">
                                                <div className="min-w-0">
                                                    <p className="text-xs text-teal-500
                                                        font-semibold uppercase tracking-wide">
                                                        Username Anda
                                                    </p>
                                                    <p className="text-base font-bold
                                                        text-teal-800 mt-0.5 truncate">
                                                        @{data.username}
                                                    </p>
                                                </div>
                                                <span className="text-2xl shrink-0 ml-3">🎯</span>
                                            </div>
                                        )}
                                        {/* Error username dari backend */}
                                        <InputError message={errors.username} className="mt-1" />

                                        {/* Email */}
                                        <div>
                                            <InputLabel
                                                htmlFor="email"
                                                value="Email"
                                                className="text-xs font-semibold text-gray-600
                                                    uppercase tracking-wide mb-1.5 block"
                                            />
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2
                                                    -translate-y-1/2 text-lg pointer-events-none">📧</span>
                                                <TextInput
                                                    id="email"
                                                    name="email"
                                                    type="email"
                                                    value={data.email}
                                                    placeholder="contoh@email.com"
                                                    autoComplete="email"
                                                    className={`${inputCls(errors.email)} pl-12 pr-4`}
                                                    onChange={(e) => {
                                                        setData('email', e.target.value);
                                                        clearErrors('email');
                                                    }}
                                                />
                                            </div>
                                            <p className="text-xs text-gray-400 mt-1.5">
                                                Bisa digunakan untuk login
                                            </p>
                                            <InputError message={errors.email} className="mt-1" />
                                        </div>
                                    </div>
                                )}

                                {/* ────────────────────────────
                                    STEP 3 — Keamanan
                                ──────────────────────────── */}
                                {currentStep === 3 && (
                                    <div className="space-y-4">

                                        {/* Password */}
                                        <div>
                                            <InputLabel
                                                htmlFor="password"
                                                value="Password"
                                                className="text-xs font-semibold text-gray-600
                                                    uppercase tracking-wide mb-1.5 block"
                                            />
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2
                                                    -translate-y-1/2 text-lg pointer-events-none">🔒</span>
                                                <TextInput
                                                    id="password"
                                                    name="password"
                                                    type={showPassword ? 'text' : 'password'}
                                                    value={data.password}
                                                    placeholder="Minimal 8 karakter"
                                                    // FIX #2: new-password mencegah browser
                                                    // autofill password lama
                                                    autoComplete="new-password"
                                                    className={`${inputCls(errors.password)} pl-12 pr-12`}
                                                    onChange={(e) => {
                                                        setData('password', e.target.value);
                                                        clearErrors('password');
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(v => !v)}
                                                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2
                                                        p-1.5 text-gray-400 hover:text-gray-600
                                                        rounded-lg hover:bg-gray-100 transition-colors"
                                                >
                                                    {showPassword ? <EyeOff /> : <EyeOpen />}
                                                </button>
                                            </div>

                                            {/* Strength bar */}
                                            {data.password && (
                                                <div className="mt-2">
                                                    <div className="flex justify-between mb-1">
                                                        <span className="text-xs text-gray-500">
                                                            Kekuatan Password
                                                        </span>
                                                        <span className={`text-xs font-semibold ${strengthTextColor}`}>
                                                            {strengthText}
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                                                        <div
                                                            className={`h-1.5 rounded-full transition-all
                                                                duration-300 ${strengthColor}`}
                                                            style={{ width: `${(passwordStrength / 5) * 100}%` }}
                                                        />
                                                    </div>
                                                    {passwordStrength < 3 && (
                                                        <p className="text-xs text-gray-400 mt-1">
                                                            Gunakan huruf besar, angka, dan simbol
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                            <InputError message={errors.password} className="mt-1" />
                                        </div>

                                        {/* Konfirmasi Password */}
                                        <div>
                                            <InputLabel
                                                htmlFor="password_confirmation"
                                                value="Konfirmasi Password"
                                                className="text-xs font-semibold text-gray-600
                                                    uppercase tracking-wide mb-1.5 block"
                                            />
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2
                                                    -translate-y-1/2 text-lg pointer-events-none">✅</span>
                                                <TextInput
                                                    id="password_confirmation"
                                                    name="password_confirmation"
                                                    type={showConfirmPassword ? 'text' : 'password'}
                                                    value={data.password_confirmation}
                                                    placeholder="Ulangi password"
                                                    autoComplete="new-password"
                                                    className={`${inputCls(errors.password_confirmation)} pl-12 pr-12`}
                                                    onChange={(e) => {
                                                        setData('password_confirmation', e.target.value);
                                                        clearErrors('password_confirmation');
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirmPassword(v => !v)}
                                                    aria-label={showConfirmPassword ? 'Sembunyikan' : 'Tampilkan'}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2
                                                        p-1.5 text-gray-400 hover:text-gray-600
                                                        rounded-lg hover:bg-gray-100 transition-colors"
                                                >
                                                    {showConfirmPassword ? <EyeOff /> : <EyeOpen />}
                                                </button>
                                            </div>

                                            {/* Match indicator */}
                                            {data.password && data.password_confirmation && (
                                                <p className={`text-xs mt-1.5 flex items-center gap-1 ${
                                                    data.password === data.password_confirmation
                                                        ? 'text-teal-600' : 'text-red-600'
                                                }`}>
                                                    {data.password === data.password_confirmation ? (
                                                        <>
                                                            <svg className="w-3.5 h-3.5 shrink-0"
                                                                fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M10 18a8 8 0
                                                                    100-16 8 8 0 000 16zm3.707-9.293a1
                                                                    1 0 00-1.414-1.414L9 10.586 7.707
                                                                    9.293a1 1 0 00-1.414 1.414l2 2a1 1
                                                                    0 001.414 0l4-4z" clipRule="evenodd" />
                                                            </svg>
                                                            Password cocok!
                                                        </>
                                                    ) : (
                                                        <>
                                                            <svg className="w-3.5 h-3.5 shrink-0"
                                                                fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M10 18a8 8 0
                                                                    100-16 8 8 0 000 16zM8.707 7.293a1
                                                                    1 0 00-1.414 1.414L8.586 10l-1.293
                                                                    1.293a1 1 0 101.414 1.414L10
                                                                    11.414l1.293 1.293a1 1 0
                                                                    001.414-1.414L11.414 10l1.293-1.293a1
                                                                    1 0 00-1.414-1.414L10 8.586
                                                                    8.707 7.293z" clipRule="evenodd" />
                                                            </svg>
                                                            Password tidak cocok
                                                        </>
                                                    )}
                                                </p>
                                            )}
                                            <InputError
                                                message={errors.password_confirmation}
                                                className="mt-1"
                                            />
                                        </div>

                                        {/* Info verifikasi */}
                                        {data.role && data.role !== 'guru_bk' && (
                                            <div className="bg-amber-50 border border-amber-200
                                                rounded-xl p-3.5 flex items-start gap-3">
                                                <svg className="w-4 h-4 text-amber-500 shrink-0 mt-0.5"
                                                    fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36
                                                        2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213
                                                        2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743
                                                        -2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012
                                                        0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0
                                                        00-1-1z" clipRule="evenodd" />
                                                </svg>
                                                <div>
                                                    <p className="text-xs font-semibold text-amber-800">
                                                        Informasi Penting
                                                    </p>
                                                    <p className="text-xs text-amber-700 mt-0.5">
                                                        Akun Anda akan menunggu verifikasi dari Guru
                                                        BK sebelum dapat digunakan untuk login.
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* FIX #6: Global error banner ─────── */}
                            {Object.keys(errors).length > 0 && (
                                <div className="mt-3 p-3 bg-red-50 border border-red-200
                                    rounded-xl flex items-start gap-2">
                                    <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5"
                                        fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8
                                            8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586
                                            10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293
                                            1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1
                                            0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                            clipRule="evenodd" />
                                    </svg>
                                    <p className="text-xs font-semibold text-red-700">
                                        Terdapat kesalahan pada formulir.
                                        Periksa kembali data yang diisi.
                                    </p>
                                </div>
                            )}

                            {/* ── Navigasi Step ────────────────── */}
                            <div className="flex items-center justify-between
                                mt-5 pt-5 border-t border-gray-100">

                                {/* Kiri */}
                                {currentStep > 1 ? (
                                    <button
                                        type="button"
                                        onClick={prevStep}
                                        className="flex items-center gap-1.5 px-4 py-2.5
                                            border-2 border-gray-200 rounded-xl text-sm
                                            font-semibold text-gray-600 hover:bg-gray-50
                                            hover:border-gray-300 focus:outline-none
                                            focus:ring-2 focus:ring-gray-200
                                            transition-all duration-150"
                                    >
                                        <svg className="w-4 h-4" fill="none"
                                            stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round"
                                                strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                        Sebelumnya
                                    </button>
                                ) : (
                                    <Link
                                        href={route('login')}
                                        className="text-sm text-gray-500 hover:text-teal-600
                                            font-medium transition-colors duration-150"
                                    >
                                        ← Sudah punya akun?
                                    </Link>
                                )}

                                {/* Kanan */}
                                {currentStep < 3 ? (
                                    <button
                                        type="button"
                                        onClick={nextStep}
                                        disabled={
                                            (currentStep === 1 && !canProceedStep1) ||
                                            (currentStep === 2 && !canProceedStep2)
                                        }
                                        className="flex items-center gap-1.5 px-5 py-2.5
                                            bg-teal-600 hover:bg-teal-700 active:bg-teal-800
                                            text-white text-sm font-semibold rounded-xl
                                            focus:outline-none focus:ring-4 focus:ring-teal-200
                                            disabled:opacity-40 disabled:cursor-not-allowed
                                            transition-all duration-150 shadow-lg
                                            shadow-teal-500/30 hover:shadow-xl
                                            hover:shadow-teal-500/40 hover:-translate-y-0.5
                                            active:translate-y-0"
                                    >
                                        Selanjutnya
                                        <svg className="w-4 h-4" fill="none"
                                            stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round"
                                                strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                ) : (
                                    <button
                                        type="submit"
                                        disabled={!canSubmit || processing}
                                        className="flex items-center justify-center gap-1.5
                                            px-5 py-2.5 min-w-[140px]
                                            bg-teal-600 hover:bg-teal-700 active:bg-teal-800
                                            text-white text-sm font-semibold rounded-xl
                                            focus:outline-none focus:ring-4 focus:ring-teal-200
                                            disabled:opacity-40 disabled:cursor-not-allowed
                                            transition-all duration-150 shadow-lg
                                            shadow-teal-500/30 hover:shadow-xl
                                            hover:shadow-teal-500/40 hover:-translate-y-0.5
                                            active:translate-y-0"
                                    >
                                        {processing ? (
                                            <>
                                                <svg className="animate-spin w-4 h-4 shrink-0"
                                                    fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12"
                                                        r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor"
                                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0
                                                        12h4zm2 5.291A7.962 7.962 0 014 12H0c0
                                                        3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                </svg>
                                                Memproses...
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-4 h-4 shrink-0" fill="none"
                                                    stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round"
                                                        strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0
                                                        11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                Daftar Sekarang
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </form>

                        <p className="mt-5 text-xs text-gray-300 text-center">
                            © {new Date().getFullYear()} RamahAnak.id —
                            Pondok Pesantren Muhammadiyah An Nur Sidoarjo
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}