'use client';

import { useState, useMemo, useCallback, ChangeEvent } from 'react';
import { useAuth } from '../../../components/providers/auth-provider';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';

type AuthMode = 'signin' | 'register' | 'passwordless';

/* ═══════════════════════════
   Password Validation
   ═══════════════════════════ */
interface PasswordValidation {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
    isValid: boolean;
}

function validatePassword(password: string): PasswordValidation {
    const checks = {
        minLength: password.length >= 8,
        hasUppercase: /[A-Z]/.test(password),
        hasLowercase: /[a-z]/.test(password),
        hasNumber: /[0-9]/.test(password),
        hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    };
    return {
        ...checks,
        isValid: Object.values(checks).every(Boolean),
    };
}

/* ═══════════════════════════
   Animated Password Strength
   ═══════════════════════════ */
function PasswordStrengthBar({ validation, password }: { validation: PasswordValidation; password: string }) {
    const strength = [
        validation.minLength,
        validation.hasUppercase,
        validation.hasLowercase,
        validation.hasNumber,
        validation.hasSpecial,
    ].filter(Boolean).length;
    const percentage = (strength / 5) * 100;

    const color =
        percentage <= 20 ? 'bg-red-500' :
            percentage <= 40 ? 'bg-orange-500' :
                percentage <= 60 ? 'bg-yellow-500' :
                    percentage <= 80 ? 'bg-caneris-blue' :
                        'bg-caneris-cyan';

    const label =
        percentage <= 20 ? 'Very Weak' :
            percentage <= 40 ? 'Weak' :
                percentage <= 60 ? 'Fair' :
                    percentage <= 80 ? 'Strong' :
                        'Excellent';

    const rules = [
        { id: 'len', label: '8+ characters', met: validation.minLength },
        { id: 'upper', label: 'Uppercase (A-Z)', met: validation.hasUppercase },
        { id: 'lower', label: 'Lowercase (a-z)', met: validation.hasLowercase },
        { id: 'num', label: 'Number (0-9)', met: validation.hasNumber },
        { id: 'special', label: 'Special (!@#$)', met: validation.hasSpecial },
    ];

    if (!password) return null;

    return (
        <div className="space-y-2.5 animate-tab-enter">
            {/* Bar */}
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#94a3b8]">
                    Strength
                </span>
                <span className={`text-[10px] font-mono uppercase tracking-widest transition-colors duration-300 ${percentage <= 40 ? 'text-red-400' :
                    percentage <= 60 ? 'text-yellow-400' :
                        'text-caneris-cyan'
                    }`}>
                    {label}
                </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-[#1f2937] overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-500 ease-out animate-strength-fill ${color}`}
                    style={{ width: `${percentage}%` }}
                />
            </div>

            {/* Criteria */}
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                {rules.map((rule, i) => (
                    <div
                        key={rule.id}
                        className="flex items-center gap-2"
                        style={{ animationDelay: `${i * 50}ms` }}
                    >
                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-all duration-300 ${rule.met
                            ? 'bg-caneris-cyan/20 animate-check-pop'
                            : 'bg-[#1f2937]'
                            }`}>
                            {rule.met ? (
                                <svg className="w-2 h-2 text-caneris-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            ) : (
                                <div className="w-1 h-1 rounded-full bg-[#374151]" />
                            )}
                        </div>
                        <span className={`text-[10px] transition-colors duration-300 animate-label-slide ${rule.met ? 'text-caneris-cyan' : 'text-[#4b5563]'
                            }`} style={{ animationDelay: `${i * 50}ms` }}>
                            {rule.label}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ═══════════════════════════
   Main Login Page
   ═══════════════════════════ */
export default function LoginPage() {
    const [mode, setMode] = useState<AuthMode>('signin');

    // ---------- ISOLATED form state per mode ----------
    const [signinEmail, setSigninEmail] = useState('');
    const [signinPassword, setSigninPassword] = useState('');

    const [regEmail, setRegEmail] = useState('');
    const [regDisplayName, setRegDisplayName] = useState('');
    const [regConfirmEmail, setRegConfirmEmail] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [regConfirmPassword, setRegConfirmPassword] = useState('');

    const [magicEmail, setMagicEmail] = useState('');

    // ---------- Shared UI state ----------
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Removed EmailSuggestions state and refs

    const { signIn, signUp, signInWithGoogle, sendPasswordlessLink } = useAuth();

    const regPasswordValidation = useMemo(() => validatePassword(regPassword), [regPassword]);

    // Unique key forces re-mount → triggers animate-tab-enter
    const [tabKey, setTabKey] = useState(0);

    const switchMode = useCallback((newMode: AuthMode) => {
        setMode(newMode);
        setError('');
        setMessage('');
        setTabKey((k) => k + 1);
    }, []);

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setIsLoading(true);

        const result = await signIn(signinEmail, signinPassword);
        if (result.error) {
            setError(result.error);
        }
        // Removed saveEmailToHistory
        setIsLoading(false);
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (regEmail !== regConfirmEmail) {
            setError('Email addresses do not match.');
            return;
        }
        if (!regPasswordValidation.isValid) {
            setError('Password does not meet all requirements.');
            return;
        }
        if (regPassword !== regConfirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setIsLoading(true);
        const result = await signUp(regEmail, regPassword, regDisplayName);
        if (result.error) {
            setError(result.error);
        }
        // Removed saveEmailToHistory
        setIsLoading(false);
    };

    const handlePasswordless = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setIsLoading(true);

        const result = await sendPasswordlessLink(magicEmail);
        if (result.error) {
            setError(result.error);
        } else {
            // Removed saveEmailToHistory
            setMessage('Magic link sent! Check your inbox.');
        }
        setIsLoading(false);
    };

    return (
        <div className="relative flex items-center justify-center min-h-screen caneris-grid-bg overflow-hidden">
            {/* Ambient glow orbs */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -left-40 w-80 h-80 bg-caneris-cyan/5 rounded-full blur-[120px]" />
                <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-caneris-purple/5 rounded-full blur-[120px]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-caneris-blue/3 rounded-full blur-[200px]" />
            </div>

            <div className="relative z-10 w-full max-w-md mx-4 animate-fade-in-up">
                {/* Brand */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 rounded-full bg-caneris-cyan pulse-dot" />
                        <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-caneris-cyan">
                            Project Intelligence
                        </span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight gradient-text">CANERIS</h1>
                    <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#94a3b8] mt-1">
                        PMO Control Center
                    </p>
                </div>

                {/* Auth Card */}
                <div className="glass-card rounded-2xl glow-border">
                    {/* Tab Switcher */}
                    <div className="flex border-b border-white/5">
                        {([
                            { key: 'signin' as AuthMode, label: 'Sign In' },
                            { key: 'register' as AuthMode, label: 'Register' },
                            { key: 'passwordless' as AuthMode, label: 'Magic Link' },
                        ]).map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => switchMode(tab.key)}
                                className={`flex-1 py-3.5 text-xs font-medium tracking-wide transition-all duration-200 relative ${mode === tab.key
                                    ? 'text-caneris-cyan'
                                    : 'text-[#64748b] hover:text-[#94a3b8]'
                                    }`}
                            >
                                {tab.label}
                                {mode === tab.key && (
                                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-caneris-cyan rounded-full transition-all duration-300" />
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="p-6">
                        {/* Alerts */}
                        {error && (
                            <div className="mb-4 flex items-start gap-2 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm animate-tab-enter">
                                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                <span>{error}</span>
                            </div>
                        )}
                        {message && (
                            <div className="mb-4 flex items-start gap-2 bg-caneris-cyan/10 border border-caneris-cyan/20 text-caneris-cyan px-4 py-3 rounded-lg text-sm animate-tab-enter">
                                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span>{message}</span>
                            </div>
                        )}

                        {/* ─── Sign In ─── */}
                        {mode === 'signin' && (
                            <div key={tabKey} className="animate-tab-enter">
                                <form onSubmit={handleSignIn} className="space-y-4">
                                    <div className="space-y-1.5 relative">
                                        <Label htmlFor="signin-email" className="text-xs font-mono uppercase tracking-wider text-[#94a3b8]">
                                            Email
                                        </Label>
                                        <Input
                                            id="signin-email"
                                            type="email"
                                            placeholder="Enter your email"
                                            value={signinEmail}
                                            onChange={(e: ChangeEvent<HTMLInputElement>) => setSigninEmail(e.target.value)}
                                            autoComplete="username"
                                            required
                                            className="bg-white/5 border-white/10 placeholder:text-[#4b5563] focus:border-caneris-cyan/50 focus:ring-caneris-cyan/10 text-sm h-11"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="signin-password" className="text-xs font-mono uppercase tracking-wider text-[#94a3b8]">
                                            Password
                                        </Label>
                                        <Input
                                            id="signin-password"
                                            type="password"
                                            placeholder="Enter your password"
                                            value={signinPassword}
                                            onChange={(e: ChangeEvent<HTMLInputElement>) => setSigninPassword(e.target.value)}
                                            autoComplete="current-password"
                                            required
                                            className="bg-white/5 border-white/10 placeholder:text-[#4b5563] focus:border-caneris-cyan/50 focus:ring-caneris-cyan/10 text-sm h-11"
                                        />
                                    </div>
                                    <Button
                                        className="w-full h-11 bg-caneris-cyan hover:bg-caneris-cyan/90 text-[#0a0e1a] font-semibold text-sm transition-all duration-200 hover:shadow-[0_0_20px_rgba(6,214,160,0.3)]"
                                        type="submit"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <span className="flex items-center gap-2">
                                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                                Authenticating...
                                            </span>
                                        ) : 'Access System'}
                                    </Button>
                                </form>
                            </div>
                        )}

                        {/* ─── Register ─── */}
                        {mode === 'register' && (
                            <div key={tabKey} className="animate-tab-enter">
                                <form onSubmit={handleSignUp} className="space-y-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="reg-name" className="text-xs font-mono uppercase tracking-wider text-[#94a3b8]">
                                            Full Name
                                        </Label>
                                        <Input
                                            id="reg-name"
                                            type="text"
                                            placeholder="John Doe"
                                            value={regDisplayName}
                                            onChange={(e: ChangeEvent<HTMLInputElement>) => setRegDisplayName(e.target.value)}
                                            autoComplete="name"
                                            required
                                            className="bg-white/5 border-white/10 placeholder:text-[#4b5563] focus:border-caneris-cyan/50 focus:ring-caneris-cyan/10 text-sm h-11"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="reg-email" className="text-xs font-mono uppercase tracking-wider text-[#94a3b8]">
                                            Email
                                        </Label>
                                        <Input
                                            id="reg-email"
                                            type="email"
                                            placeholder="Enter your email"
                                            value={regEmail}
                                            onChange={(e: ChangeEvent<HTMLInputElement>) => setRegEmail(e.target.value)}
                                            autoComplete="username"
                                            required
                                            className="bg-white/5 border-white/10 placeholder:text-[#4b5563] focus:border-caneris-cyan/50 focus:ring-caneris-cyan/10 text-sm h-11"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="reg-confirm-email" className="text-xs font-mono uppercase tracking-wider text-[#94a3b8]">
                                            Confirm Email
                                        </Label>
                                        <Input
                                            id="reg-confirm-email"
                                            type="email"
                                            placeholder="Re-enter your email"
                                            value={regConfirmEmail}
                                            onChange={(e: ChangeEvent<HTMLInputElement>) => setRegConfirmEmail(e.target.value)}
                                            autoComplete="username"
                                            required
                                            className={`bg-white/5 border-white/10 placeholder:text-[#4b5563] focus:border-caneris-cyan/50 focus:ring-caneris-cyan/10 text-sm h-11 ${regConfirmEmail && regConfirmEmail !== regEmail ? 'border-red-500/50' : ''
                                                }`}
                                        />
                                        {regConfirmEmail && regConfirmEmail !== regEmail && (
                                            <p className="text-[10px] text-red-400 animate-label-slide">Emails do not match</p>
                                        )}
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="reg-password" className="text-xs font-mono uppercase tracking-wider text-[#94a3b8]">
                                            Password
                                        </Label>
                                        <Input
                                            id="reg-password"
                                            type="password"
                                            placeholder="Create a strong password"
                                            value={regPassword}
                                            onChange={(e: ChangeEvent<HTMLInputElement>) => setRegPassword(e.target.value)}
                                            autoComplete="new-password"
                                            required
                                            minLength={8}
                                            className="bg-white/5 border-white/10 placeholder:text-[#4b5563] focus:border-caneris-cyan/50 focus:ring-caneris-cyan/10 text-sm h-11"
                                        />
                                    </div>
                                    <PasswordStrengthBar validation={regPasswordValidation} password={regPassword} />
                                    <div className="space-y-1.5">
                                        <Label htmlFor="reg-confirm-password" className="text-xs font-mono uppercase tracking-wider text-[#94a3b8]">
                                            Confirm Password
                                        </Label>
                                        <Input
                                            id="reg-confirm-password"
                                            type="password"
                                            placeholder="Re-enter your password"
                                            value={regConfirmPassword}
                                            onChange={(e: ChangeEvent<HTMLInputElement>) => setRegConfirmPassword(e.target.value)}
                                            autoComplete="new-password"
                                            required
                                            className={`bg-white/5 border-white/10 placeholder:text-[#4b5563] focus:border-caneris-cyan/50 focus:ring-caneris-cyan/10 text-sm h-11 ${regConfirmPassword && regConfirmPassword !== regPassword ? 'border-red-500/50' : ''
                                                }`}
                                        />
                                        {regConfirmPassword && regConfirmPassword !== regPassword && (
                                            <p className="text-[10px] text-red-400 animate-label-slide">Passwords do not match</p>
                                        )}
                                    </div>
                                    <Button
                                        className="w-full h-11 bg-caneris-purple hover:bg-caneris-purple/90 text-white font-semibold text-sm transition-all duration-200 hover:shadow-[0_0_20px_rgba(131,56,236,0.3)]"
                                        type="submit"
                                        disabled={isLoading || !regPasswordValidation.isValid || regPassword !== regConfirmPassword || regEmail !== regConfirmEmail}
                                    >
                                        {isLoading ? (
                                            <span className="flex items-center gap-2">
                                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                                Creating Account...
                                            </span>
                                        ) : 'Initialize Account'}
                                    </Button>
                                </form>
                            </div>
                        )}

                        {/* ─── Passwordless ─── */}
                        {mode === 'passwordless' && (
                            <div key={tabKey} className="animate-tab-enter">
                                <form onSubmit={handlePasswordless} className="space-y-4">
                                    <div className="space-y-1.5 relative">
                                        <Label htmlFor="magic-email" className="text-xs font-mono uppercase tracking-wider text-[#94a3b8]">
                                            Email
                                        </Label>
                                        <Input
                                            id="magic-email"
                                            type="email"
                                            placeholder="Enter your email"
                                            value={magicEmail}
                                            onChange={(e: ChangeEvent<HTMLInputElement>) => setMagicEmail(e.target.value)}
                                            autoComplete="username"
                                            required
                                            className="bg-white/5 border-white/10 placeholder:text-[#4b5563] focus:border-caneris-cyan/50 focus:ring-caneris-cyan/10 text-sm h-11"
                                        />
                                    </div>
                                    <div className="flex items-start gap-2 bg-caneris-blue/5 border border-caneris-blue/10 rounded-lg px-3 py-2.5">
                                        <svg className="w-4 h-4 mt-0.5 text-caneris-blue shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                        <p className="text-[11px] text-[#94a3b8] leading-relaxed">
                                            We&apos;ll send a secure one-time link to your email. Click it to sign in without a password.
                                        </p>
                                    </div>
                                    <Button
                                        className="w-full h-11 bg-caneris-blue hover:bg-caneris-blue/90 text-white font-semibold text-sm transition-all duration-200 hover:shadow-[0_0_20px_rgba(58,134,255,0.3)]"
                                        type="submit"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <span className="flex items-center gap-2">
                                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                                Dispatching Link...
                                            </span>
                                        ) : 'Send Magic Link'}
                                    </Button>
                                </form>
                            </div>
                        )}

                        {/* ─── Google Sign In Divider ─── */}
                        <div className="relative my-6 animate-tab-enter" style={{ animationDelay: '100ms' }}>
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-white/5"></div>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="glass-card px-2 text-[#64748b] font-mono tracking-wider text-[10px]">Or continue with</span>
                            </div>
                        </div>

                        <div className="animate-tab-enter" style={{ animationDelay: '150ms' }}>
                            <Button
                                type="button"
                                onClick={async () => {
                                    setIsLoading(true);
                                    const res = await signInWithGoogle();
                                    if (res.error) setError(res.error);
                                    setIsLoading(false);
                                }}
                                disabled={isLoading}
                                className="w-full h-11 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-medium text-sm transition-all flex items-center justify-center gap-2 group"
                            >
                                <svg className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                <span className="text-[#94a3b8] group-hover:text-white transition-colors">Google Account</span>
                            </Button>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 pb-5">
                        <div className="h-px bg-white/5 mb-4" />
                        <div className="flex items-center justify-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-[#374151]" />
                            <p className="text-[10px] font-mono uppercase tracking-[0.15em] text-[#4b5563]">
                                Orchestrating Success
                            </p>
                            <div className="w-1 h-1 rounded-full bg-[#374151]" />
                        </div>
                    </div>
                </div>

                {/* Version */}
                <div className="text-center mt-6">
                    <span className="text-[10px] font-mono text-[#374151]">
                        CANERIS ERP v0.1.0 — Stage 0 Foundation
                    </span>
                </div>
            </div>
        </div>
    );
}
