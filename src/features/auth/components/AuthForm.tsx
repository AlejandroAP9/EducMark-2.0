'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import {
    Mail, Lock, User, ArrowLeft, ArrowRight,
    Eye, EyeOff, Clock, BarChart2, CheckCircle, Info
} from 'lucide-react';
import '../styles/auth.css';

type AuthMode = 'login' | 'register' | 'forgot' | 'reset';

interface AuthFormProps {
    initialMode?: AuthMode;
}

export function AuthForm({ initialMode = 'login' }: AuthFormProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = createClient();

    const [mode, setMode] = useState<AuthMode>(initialMode);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [rememberMe, setRememberMe] = useState(false);
    const [showResendEmail, setShowResendEmail] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Load remember me preference
    useEffect(() => {
        const savedEmail = localStorage.getItem('educmark_remember_email');
        if (savedEmail) {
            setEmail(savedEmail);
            setRememberMe(true);
        }
    }, []);

    // Check URL params
    useEffect(() => {
        if (searchParams.get('tab') === 'register') {
            setMode('register');
        }
    }, [searchParams]);

    // Neural Network Animation
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = 0;
        let height = 0;
        let particles: { x: number; y: number; vx: number; vy: number }[] = [];
        let animationFrameId: number;

        const resize = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
            initParticles();
        };

        const initParticles = () => {
            particles = [];
            const particleCount = Math.floor((width * height) / 25000);
            for (let i = 0; i < particleCount; i++) {
                particles.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: (Math.random() - 0.5) * 0.5
                });
            }
        };

        const animate = () => {
            ctx.clearRect(0, 0, width, height);
            ctx.fillStyle = 'rgba(164, 143, 255, 0.5)';

            particles.forEach((p, i) => {
                p.x += p.vx;
                p.y += p.vy;
                if (p.x < 0 || p.x > width) p.vx *= -1;
                if (p.y < 0 || p.y > height) p.vy *= -1;

                ctx.beginPath();
                ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
                ctx.fill();

                for (let j = i + 1; j < particles.length; j++) {
                    const p2 = particles[j];
                    const dx = p.x - p2.x;
                    const dy = p.y - p2.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 120) {
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(164, 143, 255, ${0.15 * (1 - dist / 120)})`;
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.stroke();
                    }
                }
            });

            animationFrameId = requestAnimationFrame(animate);
        };

        window.addEventListener('resize', resize);
        resize();
        animate();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    const calculateStrength = (pass: string) => {
        let score = 0;
        if (!pass) return 0;
        if (pass.length > 8) score += 1;
        if (pass.length > 12) score += 1;
        if (/[A-Z]/.test(pass)) score += 1;
        if (/[0-9]/.test(pass)) score += 1;
        if (/[^A-Za-z0-9]/.test(pass)) score += 1;
        return Math.min(score, 4);
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newPass = e.target.value;
        setPassword(newPass);
        setPasswordStrength(calculateStrength(newPass));
    };

    const getStrengthClass = () => {
        if (passwordStrength <= 1) return 'weak';
        if (passwordStrength === 2) return 'fair';
        if (passwordStrength === 3) return 'good';
        return 'strong';
    };

    const getStrengthText = () => {
        if (passwordStrength <= 1) return 'La contraseña es débil';
        if (passwordStrength === 2) return 'Seguridad media';
        if (passwordStrength === 3) return 'Buena contraseña';
        return 'Contraseña segura';
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;

            if (rememberMe) {
                localStorage.setItem('educmark_remember_email', email);
            } else {
                localStorage.removeItem('educmark_remember_email');
            }
            router.push('/dashboard');
        } catch (error: unknown) {
            let msg = error instanceof Error ? error.message : 'Error desconocido';
            if (msg.includes('Invalid login')) msg = 'Correo o contraseña incorrectos.';
            toast.error(msg);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            toast.error('Por favor ingresa un correo electrónico válido.');
            return;
        }
        if (password.length < 8) {
            toast.error('La contraseña debe tener al menos 8 caracteres.');
            return;
        }
        if (passwordStrength < 2) {
            toast.error('La contraseña es demasiado débil. Intenta agregar números, mayúsculas o símbolos.');
            return;
        }

        const name = fullName || email.split('@')[0];

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { full_name: name },
                },
            });
            if (error) throw error;

            // Save referral code
            const refCode = searchParams.get('ref');
            if (refCode && data.user) {
                supabase
                    .from('user_profiles')
                    .update({ referred_by: refCode.toLowerCase() })
                    .eq('user_id', data.user.id)
                    .then(() => {});
            }

            if (data.session) {
                toast.success('¡Cuenta creada! Te estamos redirigiendo...');
                setTimeout(() => router.push('/dashboard?welcome=true'), 1500);
            } else {
                toast.success('¡Cuenta creada! Revisa tu correo para confirmar.');
                setShowResendEmail(true);
            }
        } catch (error: unknown) {
            let msg = error instanceof Error ? error.message : 'Error desconocido';
            if (msg.includes('already registered')) msg = 'Este correo ya está registrado.';
            toast.error(msg);
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });
            if (error) throw error;
            toast.success('Enlace enviado. Revisa tu bandeja de entrada.');
            setTimeout(() => setMode('login'), 3000);
        } catch (error: unknown) {
            toast.error('Error: ' + (error instanceof Error ? error.message : 'Error desconocido'));
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password.length < 8) {
            return toast.error('La contraseña debe tener al menos 8 caracteres.');
        }
        if (passwordStrength < 2) {
            return toast.error('La contraseña es demasiado débil. Agrega números, mayúsculas o símbolos.');
        }
        if (password !== confirmPassword) {
            return toast.error('Las contraseñas no coinciden');
        }

        try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) throw error;
            toast.success('¡Contraseña actualizada! Redirigiendo...');
            setTimeout(() => router.push('/dashboard'), 1500);
        } catch (error: unknown) {
            toast.error('Error: ' + (error instanceof Error ? error.message : 'Error desconocido'));
        }
    };

    const handleGoogleAuth = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
        if (error) {
            toast.error('Error al conectar con Google: ' + error.message);
        }
    };

    // Reset password standalone view
    if (mode === 'reset') {
        return (
            <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden font-body">
                <div className="background-orbs absolute inset-0 pointer-events-none">
                    <div className="orb orb-1 opacity-20" style={{ top: '20%', left: '30%' }}></div>
                    <div className="orb orb-2 opacity-20" style={{ bottom: '20%', right: '30%' }}></div>
                </div>
                <canvas ref={canvasRef} className="neural-network-bg absolute inset-0 pointer-events-none opacity-30"></canvas>

                <div className="z-10 w-full max-w-md">
                    <div className="flex items-center justify-center gap-3 mb-8">
                        <img src="/images/logo.png" alt="EducMark" width="40" height="40" className="w-10 h-10 rounded-full bg-white p-1" />
                        <span className="text-2xl font-bold font-heading text-white">EducMark</span>
                    </div>

                    <div className="bg-card border border-white/10 rounded-2xl p-8 shadow-2xl backdrop-blur-sm relative overflow-hidden">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"></div>

                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-white mb-2">Crea tu nueva contraseña</h2>
                            <p className="text-muted-foreground text-sm">
                                Asegúrate de que sea segura para proteger tu entorno de trabajo pedagógico
                            </p>
                        </div>

                        <form className="space-y-5" onSubmit={handleResetPassword}>
                            <div className="form-group">
                                <label className="block text-sm font-medium text-muted-foreground mb-1.5">Nueva Contraseña</label>
                                <div className="input-wrapper">
                                    <Lock className="input-icon w-5 h-5" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        className="form-control"
                                        placeholder="Introduce tu nueva contraseña"
                                        required
                                        value={password}
                                        onChange={handlePasswordChange}
                                    />
                                    <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-medium text-muted-foreground">Seguridad: <span className="text-white">{getStrengthText()}</span></span>
                                    <span className="text-xs text-muted-foreground/60">{passwordStrength}/4</span>
                                </div>
                                <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden flex gap-1">
                                    <div className={`h-full w-1/4 rounded-full ${passwordStrength > 0 ? 'bg-red-500' : 'bg-white/5'}`}></div>
                                    <div className={`h-full w-1/4 rounded-full ${passwordStrength > 1 ? 'bg-orange-500' : 'bg-white/5'}`}></div>
                                    <div className={`h-full w-1/4 rounded-full ${passwordStrength > 2 ? 'bg-amber-400' : 'bg-white/5'}`}></div>
                                    <div className={`h-full w-1/4 rounded-full ${passwordStrength > 3 ? 'bg-emerald-500' : 'bg-white/5'}`}></div>
                                </div>
                                <p className="text-xs text-muted-foreground/60 mt-2 flex items-center gap-1.5">
                                    <Info className="w-3 h-3" /> Usa al menos 8 caracteres y un símbolo.
                                </p>
                            </div>

                            <div className="form-group">
                                <label className="block text-sm font-medium text-muted-foreground mb-1.5">Confirmar Contraseña</label>
                                <div className="input-wrapper">
                                    <Lock className="input-icon w-5 h-5" />
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        className="form-control"
                                        placeholder="Repite tu nueva contraseña"
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                    />
                                    <button type="button" className="password-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <button type="submit" className="btn btn-primary mt-2">
                                Actualizar Contraseña y Entrar
                            </button>
                        </form>

                        <div className="mt-8 pt-6 border-t border-white/[0.06] text-center">
                            <button onClick={() => router.push('/login')} className="text-muted-foreground hover:text-white transition-colors text-sm flex items-center justify-center gap-2 mx-auto">
                                <ArrowLeft className="w-4 h-4" /> Volver al Inicio de Sesión
                            </button>
                        </div>
                    </div>

                    <div className="text-center mt-8 text-xs text-muted-foreground/40">
                        &copy; 2026 EducMark. Todos los derechos reservados.
                    </div>
                </div>
            </div>
        );
    }

    // Main split layout (login/register/forgot)
    return (
        <div className="split-layout font-body relative">
            <div className="background-orbs absolute inset-0 pointer-events-none z-0">
                <div className="orb orb-1"></div>
                <div className="orb orb-2"></div>
            </div>
            <canvas ref={canvasRef} className="neural-network-bg absolute inset-0 pointer-events-none z-0"></canvas>

            {/* MOBILE VALUE PROP BANNER */}
            <div className="md:hidden relative z-10 px-4 pt-4 pb-2">
                <div className="flex items-center gap-3 text-sm text-muted-foreground bg-card/60 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3">
                    <img src="/images/logo.png" alt="EducMark" width="32" height="32" className="w-8 h-8 rounded-lg bg-white p-0.5" />
                    <div>
                        <p className="text-white font-semibold text-sm">EducMark</p>
                        <p className="text-xs text-muted-foreground">Planifica 10 clases en 1 hora · 3 gratis</p>
                    </div>
                </div>
            </div>

            {/* LEFT PANEL (Marketing) */}
            <div className="marketing-panel hidden md:flex relative z-10 bg-transparent">
                <div className="marketing-content">
                    <div className="marketing-header">
                        <img src="/images/logo.png" alt="EducMark" width="64" height="64" className="w-16 h-16 rounded-2xl bg-white p-2 shadow-[0_20px_40px_rgba(164,143,255,0.3)] mb-10" />
                    </div>

                    <h1 className="marketing-title">
                        Vuelve a disfrutar <br />
                        <span style={{ color: 'var(--primary)' }}>tus fines de semana</span>
                    </h1>
                    <p className="marketing-text">
                        El sistema operativo pedagógico que potencia tu enseñanza y recupera tu tiempo libre.
                    </p>

                    <div className="marketing-features">
                        <div className="feature-item">
                            <div className="feature-icon"><Clock className="w-6 h-6" /></div>
                            <div className="feature-text">
                                <h3>Ahorra horas de planificación</h3>
                                <p>Automatiza tareas repetitivas al instante</p>
                            </div>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon"><BarChart2 className="w-6 h-6" /></div>
                            <div className="feature-text">
                                <h3>Presentaciones profesionales en segundos</h3>
                                <p>Diseños pedagógicos adaptados a ti</p>
                            </div>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon"><CheckCircle className="w-6 h-6" /></div>
                            <div className="feature-text">
                                <h3>Quiz listos para usar</h3>
                                <p>Evaluaciones instantáneas y calificadas</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT PANEL (Forms) */}
            <div className="form-panel">
                <button onClick={() => router.push('/')} className="back-to-home-mobile">
                    <ArrowLeft className="w-5 h-5" />
                </button>

                <div className="auth-container-flat">
                    <div className="auth-header-flat">
                        <h2 className="auth-welcome">
                            {mode === 'login' && 'Bienvenido de nuevo'}
                            {mode === 'register' && 'Crear Cuenta'}
                            {mode === 'forgot' && 'Recuperar Contraseña'}
                        </h2>
                        <p className="auth-subtitle-flat">
                            {mode === 'login' && 'Ingresa tus credenciales para acceder al panel.'}
                            {mode === 'register' && 'Comienza a transformar tus clases hoy mismo.'}
                            {mode === 'forgot' && 'Te enviaremos un enlace mágico a tu correo.'}
                        </p>
                    </div>

                    {(mode === 'login' || mode === 'register') && (
                        <div className="auth-tabs">
                            <button className={`tab-button ${mode === 'login' ? 'active' : ''}`} onClick={() => setMode('login')}>
                                Iniciar Sesión
                            </button>
                            <button className={`tab-button ${mode === 'register' ? 'active' : ''}`} onClick={() => setMode('register')}>
                                Crear Cuenta
                            </button>
                        </div>
                    )}

                    {/* Google OAuth */}
                    {(mode === 'login' || mode === 'register') && (
                        <div className="mb-6">
                            <button
                                type="button"
                                onClick={handleGoogleAuth}
                                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] transition-all text-sm font-medium text-white cursor-pointer"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                </svg>
                                {mode === 'login' ? 'Iniciar sesión con Google' : 'Registrarse con Google'}
                            </button>
                            <div className="flex items-center gap-3 my-5">
                                <div className="flex-1 h-px bg-white/[0.06]"></div>
                                <span className="text-xs text-muted-foreground/50 uppercase tracking-wider">o con correo</span>
                                <div className="flex-1 h-px bg-white/[0.06]"></div>
                            </div>
                        </div>
                    )}

                    {/* LOGIN FORM */}
                    {mode === 'login' && (
                        <form onSubmit={handleLogin} className="auth-form active text-left">
                            <div className="form-group">
                                <label>Correo Electrónico</label>
                                <div className="input-wrapper">
                                    <Mail className="input-icon w-5 h-5" />
                                    <input type="email" className="form-control" placeholder="tu@institucion.edu" required value={email} onChange={(e) => setEmail(e.target.value)} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Contraseña</label>
                                <div className="input-wrapper relative">
                                    <Lock className="input-icon w-5 h-5" />
                                    <input type={showPassword ? 'text' : 'password'} className="form-control" placeholder="••••••••" required value={password} onChange={(e) => setPassword(e.target.value)} />
                                    <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>
                            <div className="form-options">
                                <label className="remember-me cursor-pointer flex items-center gap-2">
                                    <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="accent-primary" />
                                    Recordarme
                                </label>
                                <a onClick={() => setMode('forgot')} className="forgot-link cursor-pointer">¿Olvidaste tu contraseña?</a>
                            </div>
                            <button type="submit" className="btn btn-primary justify-between">
                                <span className="flex-1 text-center">Iniciar Sesión</span>
                                <ArrowRight className="w-5 h-5 flex-shrink-0" />
                            </button>
                        </form>
                    )}

                    {/* REGISTER FORM */}
                    {mode === 'register' && (
                        <form onSubmit={handleRegister} className="auth-form active text-left">
                            <div className="form-group">
                                <label>Nombre Completo</label>
                                <div className="input-wrapper relative">
                                    <User className="input-icon w-5 h-5" />
                                    <input type="text" className="form-control" placeholder="Ej. Ana García" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Correo Electrónico</label>
                                <div className="input-wrapper relative">
                                    <Mail className="input-icon w-5 h-5" />
                                    <input type="email" className="form-control" placeholder="tu@institucion.edu" required value={email} onChange={(e) => setEmail(e.target.value)} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Contraseña</label>
                                <div className="input-wrapper relative">
                                    <Lock className="input-icon w-5 h-5" />
                                    <input type={showPassword ? 'text' : 'password'} className="form-control" placeholder="Mínimo 8 caracteres" required value={password} onChange={handlePasswordChange} />
                                    <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                <div className="password-strength-container">
                                    <div className="password-strength-track">
                                        <div className={`password-strength-bar ${getStrengthClass()}`} style={{ width: `${(passwordStrength / 4) * 100}%` }}></div>
                                    </div>
                                    <div className="password-info-group group">
                                        <p className={`password-strength-text ${getStrengthClass()}`}>{getStrengthText()}</p>
                                        <Info className="info-icon" />
                                        <div className="password-tooltip">
                                            La contraseña debe tener una mayúscula, un número y un símbolo.
                                            <div className="tooltip-arrow"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button type="submit" className="btn btn-primary justify-between">
                                <span className="flex-1 text-center">Crear cuenta gratis — 3 clases incluidas</span>
                                <ArrowRight className="w-5 h-5 flex-shrink-0" />
                            </button>

                            {showResendEmail && (
                                <div className="text-center mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                                    <p className="text-sm text-emerald-400 mb-2">Revisa tu correo para confirmar tu cuenta.</p>
                                    <button
                                        type="button"
                                        disabled={resendCooldown > 0}
                                        onClick={async () => {
                                            try {
                                                await supabase.auth.resend({ type: 'signup', email });
                                                toast.success('Email reenviado. Revisa tu bandeja.');
                                                setResendCooldown(60);
                                                const interval = setInterval(() => {
                                                    setResendCooldown(prev => {
                                                        if (prev <= 1) { clearInterval(interval); return 0; }
                                                        return prev - 1;
                                                    });
                                                }, 1000);
                                            } catch {
                                                toast.error('Error al reenviar. Intenta de nuevo.');
                                            }
                                        }}
                                        className="text-xs text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
                                    >
                                        {resendCooldown > 0 ? `Reenviar en ${resendCooldown}s` : '¿No llegó? Reenviar email de confirmación'}
                                    </button>
                                </div>
                            )}

                            <div className="text-center mt-6 text-sm text-muted-foreground">
                                ¿Ya tienes una cuenta? <a onClick={() => setMode('login')} className="text-white hover:text-primary font-bold cursor-pointer">Iniciar sesión</a>
                            </div>
                        </form>
                    )}

                    {/* FORGOT FORM */}
                    {mode === 'forgot' && (
                        <form onSubmit={handleForgotPassword} className="auth-form active text-left">
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-[rgba(164,143,255,0.15)] rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Lock className="w-8 h-8 text-[var(--primary)]" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Correo Electrónico</label>
                                <div className="input-wrapper relative">
                                    <Mail className="input-icon w-5 h-5" />
                                    <input type="email" className="form-control" placeholder="tu@institucion.edu" required value={email} onChange={(e) => setEmail(e.target.value)} />
                                </div>
                            </div>
                            <button type="submit" className="btn btn-primary">Enviar Enlace</button>
                            <div className="auth-link text-center mt-4">
                                <a onClick={() => setMode('login')} className="text-primary hover:underline cursor-pointer">← Volver al inicio de sesión</a>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
