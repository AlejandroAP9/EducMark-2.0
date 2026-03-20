'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import {
    ThumbsUp, ThumbsDown, FileText, Presentation, CheckSquare, Trash2,
    Clock, Library, Wand2, Folder, GraduationCap, Plus, Calculator,
    FlaskConical, Globe, BookOpen, Sparkles, FolderHeart, TrendingUp, ClipboardList,
    Gift, Copy, Share2, X
} from 'lucide-react';
import { toast } from 'sonner';
import { UsageCard } from './UsageTracker';
import { Tour } from './Tour';
import { downloadUrlAsHtml, buildHtmlFilename } from '@/shared/lib/htmlToPdf';
import { trackEvent } from '@/shared/lib/analytics';
import { MINUTES_PER_CLASS, CLP_PER_HOUR, STUDENTS_PER_CLASS } from '@/shared/constants/metrics';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface UserProfile {
    full_name: string | null;
    email?: string;
    avatar_url?: string | null;
}

interface GeneratedClass {
    id: string;
    created_at: string;
    topic: string | null;
    objetivo_clase: string | null;
    asignatura: string | null;
    curso: string | null;
    feedback: 'up' | 'down' | null;
    link_presentacion: string | null;
    link_paci: string | null;
    planificacion: string | null;
    quiz: string | null;
    planning_blocks: Record<string, unknown> | null;
    exit_ticket: Record<string, unknown> | null;
}

export function Overview() {
    const supabase = createClient();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [stats, setStats] = useState({ total: 0, timeSaved: 0 });
    const [weeklyStats, setWeeklyStats] = useState({ timeSaved: 0, count: 0 });
    const [streak, setStreak] = useState(0);
    const [loading, setLoading] = useState(true);

    const [recentClasses, setRecentClasses] = useState<GeneratedClass[]>([]);
    const [downloadingPdf, setDownloadingPdf] = useState<string | null>(null);
    const [showReferralModal, setShowReferralModal] = useState(false);
    const [referralLink, setReferralLink] = useState('');
    const router = useRouter();

    const handleDownloadHtml = async (
        url: string,
        type: 'planificacion' | 'presentacion' | 'evaluacion' | 'pauta',
        item: GeneratedClass,
    ) => {
        const key = `${item.id}-${type}`;
        setDownloadingPdf(key);
        try {
            const filename = buildHtmlFilename(type, { subject: item.asignatura || undefined, grade: item.curso || undefined });
            await downloadUrlAsHtml(url, filename);
            toast.success('Descarga iniciada');
        } catch {
            toast.error('Error al descargar. Abriendo en nueva pestaña...');
            window.open(url, '_blank');
        } finally {
            setDownloadingPdf(null);
        }
    };

    // Quotes Logic
    const quotes = [
        { text: "La educación es el arma más poderosa que puedes usar para cambiar el mundo.", author: "Nelson Mandela" },
        { text: "La enseñanza que deja huella no es la que se hace de cabeza a cabeza, sino de corazón a corazón.", author: "Howard G. Hendricks" },
        { text: "Educar no es dar carrera para vivir, sino templar el alma para las dificultades de la vida.", author: "Pitágoras" },
        { text: "El arte supremo del maestro es despertar la curiosidad en la expresión creativa y conocimiento.", author: "Albert Einstein" }
    ];

    const [quote, setQuote] = useState(quotes[0]);
    useEffect(() => {
        setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
    }, []);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
            const { data: profileData } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', session.user.id)
                .maybeSingle();

            // Fallback to metadata if profile is missing
            const metaName = session.user.user_metadata?.full_name;
            const displayName = profileData?.full_name || metaName || session.user.email?.split('@')[0];

            setProfile(profileData || { full_name: displayName });

            const { data: allGenerated, error: genError } = await supabase
                .from('generated_classes')
                .select('created_at, id, topic, objetivo_clase, asignatura, curso, feedback, link_presentacion, link_paci, planificacion, quiz, planning_blocks, exit_ticket')
                .eq('user_id', session.user.id)
                .order('created_at', { ascending: false });

            if (genError) {
                console.error('Error fetching classes:', genError);
                setLoading(false);
                return;
            }

            const allClasses = allGenerated || [];
            const totalClasses = allClasses.length;

            // Stats logic
            setStats({
                total: totalClasses,
                timeSaved: totalClasses * MINUTES_PER_CLASS
            });

            // Weekly Stats logic (Current Week)
            const now = new Date();
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
            startOfWeek.setHours(0, 0, 0, 0);

            const weeklyClasses = allClasses.filter(c => new Date(c.created_at) >= startOfWeek);
            setWeeklyStats({
                count: weeklyClasses.length,
                timeSaved: Math.round((weeklyClasses.length * MINUTES_PER_CLASS) / 60)
            });

            // Streak Logic (Weeks)
            if (totalClasses > 0) {
                const weeksSet = new Set<string>();
                allClasses.forEach(c => {
                    const d = new Date(c.created_at);
                    const weekNum = Math.floor(d.getTime() / (7 * 24 * 60 * 60 * 1000));
                    weeksSet.add(weekNum.toString());
                });

                let currentStreak = 0;
                let checkWeek = Math.floor(now.getTime() / (7 * 24 * 60 * 60 * 1000));

                // If not active this week, check last week to maintain streak
                if (!weeksSet.has(checkWeek.toString())) {
                    checkWeek--;
                }

                while (weeksSet.has(checkWeek.toString())) {
                    currentStreak++;
                    checkWeek--;
                }
                setStreak(Math.max(currentStreak, weeklyClasses.length > 0 ? 1 : 0));
            } else {
                setStreak(0);
            }

            // Recent Classes
            setRecentClasses(allClasses.slice(0, 5));

            // Show referral modal after first generation (once)
            const referralShown = localStorage.getItem('educmark_referral_post_first');
            if (totalClasses === 1 && !referralShown) {
                const { data: refData } = await supabase
                    .from('referral_events')
                    .select('referral_code')
                    .eq('referrer_id', session.user.id)
                    .limit(1);

                const code = refData?.[0]?.referral_code;
                if (code) {
                    setReferralLink(`https://educmark.cl/login?tab=register&ref=${code}`);
                    setTimeout(() => setShowReferralModal(true), 1500);
                }
            }
        }
        setLoading(false);
    };

    const handleQuickGenerate = () => {
        router.push('/dashboard/generator');
    };

    const handleFeedback = async (id: string, feedback: 'up' | 'down') => {
        // Optimistic update
        setRecentClasses(prev => prev.map(item =>
            item.id === id ? { ...item, feedback } : item
        ));

        const { error } = await supabase
            .from('generated_classes')
            .update({ feedback })
            .eq('id', id);

        if (error) {
            console.error('Error updating feedback:', error);
            // Revert on error could be implemented here
        }
    };

    const deleteKit = async (id: string) => {
        const { error } = await supabase
            .from('generated_classes')
            .delete()
            .eq('id', id);

        if (error) {
            toast.error('Error al eliminar: ' + error.message);
        } else {
            setRecentClasses(prev => prev.filter(item => item.id !== id));
            setStats(prev => ({ ...prev, total: Math.max(0, prev.total - 1) }));
        }
    };

    const handleDelete = (id: string) => {
        toast('¿Eliminar este kit?', {
            action: {
                label: 'Eliminar',
                onClick: () => deleteKit(id),
            },
            cancel: {
                label: 'Cancelar',
                onClick: () => undefined,
            },
        });
    };


    if (loading) {
        return (
            <div className="space-y-6 p-2">
                <div className="flex justify-between items-center mb-6">
                    <div className="space-y-3">
                        <div className="h-8 bg-white/10 rounded-md w-64 animate-pulse"></div>
                        <div className="h-4 bg-white/5 rounded-md w-48 animate-pulse"></div>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 h-32 animate-pulse"></div>
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6 h-96 animate-pulse"></div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 h-96 animate-pulse"></div>
                </div>
            </div>
        );
    }

    const container = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const item = {
        hidden: { opacity: 0, y: 10 },
        show: { opacity: 1, y: 0 }
    };

    // Greeting Logic
    const hour = new Date().getHours();
    let greeting = 'Buenos Días';
    if (hour >= 12 && hour < 20) greeting = 'Buenas Tardes';
    else if (hour >= 20) greeting = 'Buenas Noches';

    // Helper to calc stroke offset for rings. Circumference = 2 * PI * 28 ≈ 175.9
    const CIRCUMFERENCE = 175;
    const timeSavedHours = useMemo(() => Math.floor(stats.timeSaved / 60), [stats.timeSaved]);
    const moneySaved = useMemo(() => timeSavedHours * CLP_PER_HOUR, [timeSavedHours]);

    const getSubjectStyle = useCallback((subject: string) => {
        const s = (subject || '').toLowerCase();
        if (s.includes('matem')) return { icon: Calculator, color: 'blue', badge: 'blue' };
        if (s.includes('cienc') || s.includes('fís') || s.includes('quím') || s.includes('biol')) return { icon: FlaskConical, color: 'green', badge: 'green' };
        if (s.includes('hist') || s.includes('socía') || s.includes('cív')) return { icon: Globe, color: 'orange', badge: 'orange' };
        if (s.includes('leng') || s.includes('lit') || s.includes('ingl') || s.includes('comun')) return { icon: BookOpen, color: 'primary', badge: 'primary' };
        return { icon: Folder, color: 'primary', badge: 'blue' };
    }, []);

    return (
        <motion.div className="space-y-10 pb-12 -mt-2" variants={container} initial="hidden" animate="show">
            <Tour />

            {/* Header Area */}
            <motion.div variants={item} className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-[var(--on-background)] mb-3 tracking-tight font-[family-name:var(--font-heading)]">
                        {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)]">{profile?.full_name?.split(' ')[0]}</span>
                    </h1>
                    <div className="text-[var(--muted)] text-base md:text-lg max-w-4xl leading-relaxed">
                        "{quote.text}" <span className="text-[var(--primary)] font-medium">— {quote.author}</span>
                    </div>
                    <p className="text-sm text-[var(--muted)] mt-2 opacity-60">Bienvenido de nuevo a tu espacio educativo.</p>
                </div>

                {/* Streak Counter */}
                <div className="hidden md:flex items-center gap-3 px-5 py-3 bg-orange-500/5 border border-orange-500/15 rounded-2xl backdrop-blur-md">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                        <TrendingUp size={20} className="text-orange-400" />
                    </div>
                    <div>
                        <p className="text-[10px] text-[var(--muted)] font-medium uppercase tracking-wider leading-none mb-1">Racha Actual</p>
                        <p className="text-lg font-bold text-orange-400 leading-none">{streak} {streak === 1 ? 'Semana' : 'Semanas'}</p>
                    </div>
                </div>
            </motion.div>

            {/* Bento Grid Layout */}
            <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-3 gap-6" id="dashboard-grid">

                {/* Hero / Generator - Full Width */}
                <motion.div className="md:col-span-3 relative group h-full min-h-[400px]">
                    {/* Global Glow */}
                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary)] via-purple-400 to-indigo-500 rounded-3xl blur-3xl -z-10 opacity-15 group-hover:opacity-25 transition-opacity duration-700"></div>

                    <div className="generator-hero glass-card-premium relative overflow-hidden h-full flex flex-col justify-center items-center text-center p-8 md:p-12">
                        <div className="neural-bg absolute inset-0 opacity-30 pointer-events-none">
                            <div className="neural-orb orb-1" style={{ width: '400px', height: '400px', top: '-10%', right: '-10%', opacity: 0.15 }}></div>
                        </div>

                        <div className="relative z-20 w-full flex flex-col items-center">
                            {stats.total === 0 ? (
                                /* First-class wizard for new users */
                                <>
                                    <motion.span
                                        whileHover={{ scale: 1.05 }}
                                        className="inline-block py-1.5 px-4 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase tracking-wider border border-emerald-500/20 flex items-center gap-1 w-fit mb-6"
                                    >
                                        <Sparkles size={14} className="fill-current" /> Empieza Aquí
                                    </motion.span>

                                    <h2 className="text-2xl md:text-4xl font-bold text-[var(--on-background)] tracking-tight mb-4 leading-tight font-[family-name:var(--font-heading)]">
                                        Tu primera clase en <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">3 simples pasos</span>
                                    </h2>

                                    <div className="flex flex-col md:flex-row gap-4 md:gap-8 mb-10 mt-4">
                                        {[
                                            { step: '1', label: 'Elige asignatura y nivel', icon: BookOpen },
                                            { step: '2', label: 'Selecciona el OA', icon: GraduationCap },
                                            { step: '3', label: 'Genera tu kit completo', icon: Wand2 },
                                        ].map((s) => (
                                            <div key={s.step} className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 border border-[var(--primary)]/20 flex items-center justify-center">
                                                    <s.icon size={20} className="text-[var(--primary)]" />
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-[10px] text-[var(--muted)] font-bold uppercase">Paso {s.step}</p>
                                                    <p className="text-sm text-[var(--on-background)] font-medium">{s.label}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        id="tour-generator-btn"
                                        onClick={handleQuickGenerate}
                                        className="btn-gradient text-lg px-10 py-4 rounded-xl flex items-center gap-3 transition-all hover:scale-105 active:scale-95 group w-fit animate-pulse hover:animate-none"
                                    >
                                        <Wand2 size={24} className="fill-current" />
                                        <span className="font-bold tracking-wide">Crear Mi Primera Clase</span>
                                    </button>
                                    <p className="text-xs text-[var(--muted)] mt-3">Solo toma ~5 minutos. Sin tarjeta de crédito.</p>
                                </>
                            ) : (
                                /* Regular hero for returning users */
                                <>
                                    <motion.span
                                        whileHover={{ scale: 1.05 }}
                                        className="inline-block py-1.5 px-4 rounded-full bg-[var(--primary-bg)] text-[var(--primary)] text-xs font-bold uppercase tracking-wider border border-[var(--primary)]/20 shadow-[0_0_15px_rgba(164,143,255,0.2)] flex items-center gap-1 w-fit mb-6"
                                    >
                                        <Sparkles size={14} className="fill-current" /> Generador Unificado
                                    </motion.span>

                                    <h2 className="text-2xl md:text-4xl font-bold text-[var(--on-background)] tracking-tight mb-4 leading-tight font-[family-name:var(--font-heading)]">
                                        Crear una clase nunca fue <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--primary)] to-cyan-400">tan sencillo</span>
                                    </h2>
                                    <p className="text-[var(--muted)] text-lg max-w-lg leading-relaxed mb-10">
                                        Genera tu kit completo (Planificaci&oacute;n, Presentaci&oacute;n, Quiz) en segundos.
                                    </p>

                                    <button
                                        id="tour-generator-btn"
                                        onClick={handleQuickGenerate}
                                        className="btn-gradient text-lg px-8 py-4 rounded-xl flex items-center gap-3 transition-all hover:scale-105 active:scale-95 group w-fit"
                                    >
                                        <Wand2 size={24} className="fill-current" />
                                        <span className="font-bold tracking-wide">Generar Kit de Clase</span>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Impact Stat 1: Time Saved Gamified */}
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    id="tour-stats"
                    className="card-proto glass-card-premium p-6 flex flex-col relative overflow-hidden h-full min-h-[160px]"
                >
                    <div className="absolute -right-4 -top-4 p-4 opacity-5 rotate-12">
                        <Clock size={120} />
                    </div>
                    <p className="text-sm text-[var(--muted)] font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                        <Clock size={16} className="text-emerald-400" />
                        Tiempo Recuperado
                    </p>
                    <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">
                            {timeSavedHours}h
                        </span>
                    </div>
                    <p className="text-sm text-[var(--muted)] mb-4 leading-snug">
                        Equivale a <strong className="text-emerald-400">${moneySaved.toLocaleString('es-CL')} ahorrados</strong> en planificación.
                    </p>
                    <div className="mt-auto">
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md font-medium border border-emerald-400/20">
                            <TrendingUp size={12} /> +{weeklyStats.timeSaved}h esta semana
                        </span>
                    </div>
                </motion.div>

                {/* Impact Stat 2: Students Reached Gamified */}
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="card-proto glass-card-premium p-6 flex flex-col relative overflow-hidden h-full min-h-[160px]"
                >
                    <div className="absolute -right-4 -top-4 p-4 opacity-5 rotate-12">
                        <GraduationCap size={120} />
                    </div>
                    <p className="text-sm text-[var(--muted)] font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                        <Sparkles size={16} className="text-purple-400" />
                        Alumnos Impactados
                    </p>
                    <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                            {stats.total * STUDENTS_PER_CLASS}
                        </span>
                    </div>
                    <p className="text-sm text-[var(--muted)] mb-4 leading-snug">
                        Basado en <strong className="text-purple-400">{stats.total} clases</strong> creadas (prom. 35 alum/clase).
                    </p>
                    <div className="mt-auto w-full">
                        <div className="flex justify-between text-xs text-[var(--muted)] mb-1">
                            <span>Progreso Nivel</span>
                            <span>Meta: {Math.ceil(stats.total / 10 || 1) * 10} Clases</span>
                        </div>
                        <div className="w-full bg-[var(--border)] h-2 rounded-full overflow-hidden">
                            <div className="bg-gradient-to-r from-purple-400 to-pink-500 h-full rounded-full transition-all duration-1000" style={{ width: `${stats.total === 0 ? 0 : ((stats.total % 10) || 10) * 10}%` }}></div>
                        </div>
                    </div>
                </motion.div>

                {/* Usage Tracker */}
                <motion.div className="md:col-span-3 lg:col-span-1" id="tour-usage">
                    <UsageCard className="h-full" />
                </motion.div>


            </motion.div>

            {/* Referral Modal — shown after first generation */}
            <AnimatePresence>
                {showReferralModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative bg-[var(--card)] border border-[var(--border)] rounded-3xl p-8 md:p-10 max-w-md w-full text-center shadow-2xl"
                        >
                            <button
                                onClick={() => {
                                    setShowReferralModal(false);
                                    localStorage.setItem('educmark_referral_post_first', 'true');
                                }}
                                className="absolute top-4 right-4 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-5">
                                <Gift className="text-amber-400 w-8 h-8" />
                            </div>

                            <h3 className="text-2xl font-bold text-[var(--foreground)] mb-2">
                                ¡Tu primera clase está lista!
                            </h3>
                            <p className="text-[var(--muted)] mb-6 leading-relaxed">
                                Comparte EducMark con un colega y ambos reciben <strong className="text-amber-400">5 clases gratis</strong>.
                            </p>

                            <div className="space-y-3">
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(referralLink);
                                        toast.success('Link copiado');
                                        trackEvent('referral_copy_post_first', {});
                                    }}
                                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-[var(--primary)] font-semibold hover:bg-[var(--primary)]/20 transition-colors"
                                >
                                    <Copy size={16} /> Copiar Link
                                </button>
                                <button
                                    onClick={() => {
                                        const text = `¡Prueba EducMark! Genera planificaciones completas en minutos. Usa mi link y ambos ganamos clases gratis: ${referralLink}`;
                                        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                                        trackEvent('referral_whatsapp_post_first', {});
                                        localStorage.setItem('educmark_referral_post_first', 'true');
                                        setShowReferralModal(false);
                                    }}
                                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold hover:bg-emerald-500/20 transition-colors"
                                >
                                    <Share2 size={16} /> Compartir por WhatsApp
                                </button>
                                <button
                                    onClick={() => {
                                        setShowReferralModal(false);
                                        localStorage.setItem('educmark_referral_post_first', 'true');
                                    }}
                                    className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                                >
                                    Ahora no
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Recent Kits Table */}
            <motion.div variants={item} className="card-proto p-0 overflow-hidden" id="tour-history">
                <div className="p-6 border-b border-[var(--border)] flex items-center justify-between">
                    <h3 className="font-bold text-[var(--on-background)] text-lg flex items-center gap-2">
                        <span className="text-[var(--primary)]"><FolderHeart className="fill-current" /></span>
                        Mis Kits de Clase
                    </h3>
                    <button onClick={() => router.push('/dashboard/history')} className="text-sm font-medium text-[var(--primary)] hover:opacity-80 transition-colors">Ver todo</button>
                </div>
                {recentClasses.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center justify-center">
                        <div className="w-20 h-20 bg-[var(--primary)]/10 rounded-full flex items-center justify-center mb-4">
                            <GraduationCap size={40} className="text-[var(--primary)]" />
                        </div>
                        <h4 className="text-xl font-bold text-[var(--on-background)] mb-2">Aún no has creado clases</h4>
                        <p className="text-[var(--muted)] mb-6 max-w-sm mx-auto">
                            Empieza ahora y planifica tu próxima lección en segundos.
                        </p>
                        <button
                            onClick={handleQuickGenerate}
                            className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 mx-auto transition-all shadow-lg shadow-purple-500/20"
                        >
                            <Plus size={18} strokeWidth={3} /> Crear mi primer Kit
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table */}
                        <div className="hidden md:block table-container-proto">
                            <table className="table-proto">
                                <thead>
                                    <tr>
                                        <th>Nombre del Kit</th>
                                        <th>Asignatura</th>
                                        <th>Feedback</th>
                                        <th>Creado</th>
                                        <th className="text-right">Acciones Rápidas</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentClasses.map((item, idx) => {
                                        const style = getSubjectStyle(item.asignatura ?? '');
                                        return (
                                            <tr key={item.id} className="group transition-colors hover:bg-[rgba(255,255,255,0.02)]">
                                                <td>
                                                    <div className="flex items-center gap-3">
                                                        <div className={`icon-box ${style.color}`}>
                                                            <style.icon size={24} />
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-[var(--on-background)] max-w-[300px]" title={(item.topic || item.objetivo_clase) ?? undefined}>{item.topic || item.objetivo_clase || 'Sin Título'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`badge-proto ${style.badge}`}>
                                                        {item.asignatura || 'General'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleFeedback(item.id, 'up')}
                                                            className={`p-1.5 rounded-lg transition-colors ${item.feedback === 'up' ? 'bg-green-500/20 text-green-500' : 'text-[var(--muted)] hover:text-green-500 hover:bg-green-500/10'}`}
                                                        >
                                                            <ThumbsUp size={16} className={item.feedback === 'up' ? 'fill-current' : ''} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleFeedback(item.id, 'down')}
                                                            className={`p-1.5 rounded-lg transition-colors ${item.feedback === 'down' ? 'bg-red-500/20 text-red-500' : 'text-[var(--muted)] hover:text-red-500 hover:bg-red-500/10'}`}
                                                        >
                                                            <ThumbsDown size={16} className={item.feedback === 'down' ? 'fill-current' : ''} />
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="text-[var(--muted)]">
                                                    {new Date(item.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="text-right">
                                                    <div className="flex items-center justify-end gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
                                                        {/* Download Slide PDF */}
                                                        <button
                                                            onClick={() => item.link_presentacion ? handleDownloadHtml(item.link_presentacion, 'presentacion', item) : toast.error('Link de Presentación no disponible')}
                                                            disabled={downloadingPdf === `${item.id}-presentacion`}
                                                            className="p-2 hover:bg-[var(--primary)]/10 text-[var(--muted)] hover:text-[var(--primary)] rounded-lg transition-colors disabled:opacity-50"
                                                            title="Descargar Slide como PDF"
                                                        >
                                                            <Presentation size={18} />
                                                        </button>

                                                        {/* Download Planning PDF */}
                                                        <button
                                                            onClick={() => item.planificacion ? handleDownloadHtml(item.planificacion, 'planificacion', item) : toast.error('Link de Planificación no disponible')}
                                                            disabled={downloadingPdf === `${item.id}-planificacion`}
                                                            className="p-2 hover:bg-blue-500/10 text-[var(--muted)] hover:text-blue-500 rounded-lg transition-colors disabled:opacity-50"
                                                            title="Descargar Planificación como PDF"
                                                        >
                                                            <FileText size={18} />
                                                        </button>

                                                        {/* Download Quiz PDF */}
                                                        <button
                                                            onClick={() => item.quiz ? handleDownloadHtml(item.quiz, 'evaluacion', item) : toast.error('Link de Quiz no disponible')}
                                                            disabled={downloadingPdf === `${item.id}-evaluacion`}
                                                            className="p-2 hover:bg-green-500/10 text-[var(--muted)] hover:text-green-500 rounded-lg transition-colors disabled:opacity-50"
                                                            title="Descargar Quiz como PDF"
                                                        >
                                                            <CheckSquare size={18} />
                                                        </button>

                                                        {/* Download PACI PDF */}
                                                        {item.link_paci && (
                                                            <button
                                                                onClick={() => handleDownloadHtml(item.link_paci!, 'planificacion', item)}
                                                                disabled={downloadingPdf === `${item.id}-paci`}
                                                                className="p-2 hover:bg-orange-500/10 text-[var(--muted)] hover:text-orange-500 rounded-lg transition-colors disabled:opacity-50"
                                                                title="Descargar PACI como PDF"
                                                            >
                                                                <ClipboardList size={18} />
                                                            </button>
                                                        )}

                                                        <div className="w-px h-4 bg-[var(--border)] mx-1"></div>

                                                        {/* Delete */}
                                                        <button
                                                            onClick={() => handleDelete(item.id)}
                                                            className="p-2 hover:bg-red-500/10 text-[var(--muted)] hover:text-red-500 rounded-lg transition-colors"
                                                            title="Eliminar"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards View */}
                        <div className="md:hidden flex flex-col divide-y divide-[var(--border)]">
                            {recentClasses.map((item, idx) => {
                                const style = getSubjectStyle(item.asignatura ?? '');
                                return (
                                    <div key={item.id} className="p-4 flex flex-col gap-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white ${style.color === 'orange' ? 'bg-orange-500' : style.color === 'green' ? 'bg-emerald-500' : style.color === 'blue' ? 'bg-blue-500' : 'bg-[var(--primary)]'}`}>
                                                    <style.icon size={20} />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-[var(--on-background)] text-sm">{item.topic || item.objetivo_clase || 'Sin Título'}</h4>
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full mt-1 inline-block ${style.badge === 'orange' ? 'bg-orange-500/10 text-orange-400' : style.badge === 'green' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                                        {item.asignatura || 'General'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-[var(--muted)] text-xs">
                                                {new Date(item.created_at).toLocaleDateString()}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pl-[3.25rem]">
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => handleFeedback(item.id, 'up')}
                                                    className={`p-1.5 rounded-lg transition-colors ${item.feedback === 'up' ? 'bg-green-500/20 text-green-500' : 'text-[var(--muted)] hover:text-green-500'}`}
                                                >
                                                    <ThumbsUp size={16} className={item.feedback === 'up' ? 'fill-current' : ''} />
                                                </button>
                                                <button
                                                    onClick={() => handleFeedback(item.id, 'down')}
                                                    className={`p-1.5 rounded-lg transition-colors ${item.feedback === 'down' ? 'bg-red-500/20 text-red-500' : 'text-[var(--muted)] hover:text-red-500'}`}
                                                >
                                                    <ThumbsDown size={16} className={item.feedback === 'down' ? 'fill-current' : ''} />
                                                </button>
                                            </div>
                                            <div className="flex flex-wrap gap-1.5 justify-end">
                                                {item.link_presentacion && (
                                                    <button onClick={() => handleDownloadHtml(item.link_presentacion!, 'presentacion', item)} disabled={downloadingPdf === `${item.id}-presentacion`} className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--input-bg)] text-[var(--muted)] hover:text-[var(--primary)] border border-[var(--border)] disabled:opacity-50">
                                                        <Presentation size={16} />
                                                    </button>
                                                )}
                                                {item.planificacion && (
                                                    <button onClick={() => handleDownloadHtml(item.planificacion!, 'planificacion', item)} disabled={downloadingPdf === `${item.id}-planificacion`} className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--input-bg)] text-[var(--muted)] hover:text-blue-500 border border-[var(--border)] disabled:opacity-50">
                                                        <FileText size={16} />
                                                    </button>
                                                )}
                                                {item.quiz && (
                                                    <button onClick={() => handleDownloadHtml(item.quiz!, 'evaluacion', item)} disabled={downloadingPdf === `${item.id}-evaluacion`} className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--input-bg)] text-[var(--muted)] hover:text-green-500 border border-[var(--border)] disabled:opacity-50">
                                                        <CheckSquare size={16} />
                                                    </button>
                                                )}
                                                {item.link_paci && (
                                                    <button onClick={() => handleDownloadHtml(item.link_paci!, 'planificacion', item)} disabled={downloadingPdf === `${item.id}-paci`} className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--input-bg)] text-[var(--muted)] hover:text-orange-500 border border-[var(--border)] disabled:opacity-50">
                                                        <ClipboardList size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </motion.div>
        </motion.div>
    );
}
