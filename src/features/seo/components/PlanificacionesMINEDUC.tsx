'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/components/ui/UIComponents';
import { Check, ArrowRight, BookOpen, Clock, FileText, Presentation } from 'lucide-react';
import { trackEvent } from '@/shared/lib/analytics';

const levels = [
    '1° a 6° Básico',
    '7° y 8° Básico',
    'I° a IV° Medio',
];

const subjects = [
    'Lenguaje y Comunicación',
    'Matemáticas',
    'Historia, Geografía y Cs. Sociales',
    'Ciencias Naturales',
    'Inglés',
    'Artes Visuales / Música',
    'Educación Física',
    'Tecnología',
    'Orientación',
];

const PlanificacionesMINEDUC: React.FC = () => {
    const router = useRouter();

    const handleCTA = () => {
        trackEvent('click_cta', { location: 'seo_planificaciones_mineduc' });
        router.push('/login?tab=register');
    };

    return (
        <div className="bg-[var(--background)] min-h-screen">
            {/* Navbar */}
            <nav className="border-b border-white/[0.06] bg-[var(--card)]/50 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
                    <a href="/" className="font-bold text-xl text-foreground hover:opacity-80 transition-opacity">
                        EducMark
                    </a>
                    <Button onClick={handleCTA} className="text-sm">
                        Probar Gratis
                    </Button>
                </div>
            </nav>

            <main className="max-w-4xl mx-auto px-6 py-12 md:py-20">
                {/* Hero */}
                <header className="text-center mb-16">
                    <span className="inline-block bg-emerald-500/10 text-emerald-400 px-4 py-1.5 rounded-full text-sm font-semibold border border-emerald-500/20 mb-6">
                        100% Currículum Nacional
                    </span>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-heading leading-[1.1] tracking-tight mb-6">
                        <span className="text-foreground">Planificaciones MINEDUC</span>
                        <br />
                        <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                            listas en 6 minutos
                        </span>
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        EducMark genera planificaciones de clase alineadas a las Bases Curriculares del MINEDUC.
                        Con OA reales, actividades cerebro-compatibles y formato listo para UTP.
                    </p>
                    <div className="mt-10">
                        <Button onClick={handleCTA} variant="primary" className="h-auto py-4 px-10 !rounded-full text-lg font-semibold">
                            Generar Mi Primera Planificación
                            <ArrowRight size={20} className="ml-2" />
                        </Button>
                        <p className="text-muted-foreground/60 text-sm mt-3">3 clases gratis · Sin tarjeta</p>
                    </div>
                </header>

                {/* What you get */}
                <section className="mb-20">
                    <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8 text-center">
                        ¿Qué incluye cada planificación?
                    </h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        {[
                            { icon: <BookOpen className="w-6 h-6 text-emerald-400" />, title: 'Planificación Docente (HTML editable)', desc: 'Inicio, desarrollo y cierre con OA reales, indicadores de evaluación y actividades DUA.' },
                            { icon: <Presentation className="w-6 h-6 text-blue-400" />, title: 'Presentación (HTML editable)', desc: 'Diapositivas listas con diseño profesional, imágenes IA y estructura pedagógica.' },
                            { icon: <FileText className="w-6 h-6 text-amber-400" />, title: 'Quiz Interactivo', desc: 'Evaluación formativa con preguntas alineadas al OA, autocalificable.' },
                            { icon: <Clock className="w-6 h-6 text-purple-400" />, title: 'Todo en 6 minutos', desc: 'Selecciona asignatura, nivel y OA. EducMark genera el kit completo automáticamente.' },
                        ].map((item, i) => (
                            <div key={i} className="rounded-2xl border border-white/[0.06] bg-card/50 p-6 flex gap-4">
                                <div className="shrink-0 w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                                    {item.icon}
                                </div>
                                <div>
                                    <h3 className="font-bold text-foreground mb-1">{item.title}</h3>
                                    <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Coverage */}
                <section className="mb-20">
                    <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8 text-center">
                        Cobertura curricular
                    </h2>
                    <div className="grid md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wider text-muted-foreground">Niveles</h3>
                            <ul className="space-y-2">
                                {levels.map((level, i) => (
                                    <li key={i} className="flex items-center gap-2 text-foreground/80">
                                        <Check size={16} className="text-emerald-400 shrink-0" />
                                        {level}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wider text-muted-foreground">Asignaturas</h3>
                            <ul className="space-y-2">
                                {subjects.map((subject, i) => (
                                    <li key={i} className="flex items-center gap-2 text-foreground/80 text-sm">
                                        <Check size={14} className="text-emerald-400 shrink-0" />
                                        {subject}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                    <p className="text-center text-muted-foreground text-sm mt-8">
                        2.000+ Objetivos de Aprendizaje indexados directamente de las Bases Curriculares vigentes.
                    </p>
                </section>

                {/* How it works */}
                <section className="mb-20">
                    <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8 text-center">
                        ¿Cómo funciona?
                    </h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            { step: '1', title: 'Selecciona', desc: 'Elige asignatura, nivel y el OA que necesitas cubrir.' },
                            { step: '2', title: 'Genera', desc: 'EducMark crea planificación + presentación + quiz con IA especializada.' },
                            { step: '3', title: 'Descarga', desc: 'Descarga todo en HTML editable. Listo para tu clase.' },
                        ].map((item, i) => (
                            <div key={i} className="text-center">
                                <div className="w-12 h-12 rounded-full bg-primary/20 text-primary font-bold text-xl flex items-center justify-center mx-auto mb-4">
                                    {item.step}
                                </div>
                                <h3 className="font-bold text-foreground mb-2">{item.title}</h3>
                                <p className="text-muted-foreground text-sm">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* CTA */}
                <section className="text-center py-12 rounded-3xl border border-primary/20 bg-primary/[0.04] px-6">
                    <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                        Deja de planificar los domingos
                    </h2>
                    <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                        3 planificaciones completas gratis. Sin tarjeta de crédito.
                    </p>
                    <Button onClick={handleCTA} variant="primary" className="h-auto py-4 px-10 !rounded-full text-lg font-semibold">
                        Probar Gratis
                        <ArrowRight size={20} className="ml-2" />
                    </Button>
                </section>
            </main>

            {/* Cross-links SEO */}
            <section className="py-16 border-t border-white/[0.06]">
                <div className="max-w-4xl mx-auto px-6">
                    <h2 className="text-2xl font-bold text-foreground mb-6 text-center">Recursos Relacionados</h2>
                    <div className="grid md:grid-cols-3 gap-4">
                        {[
                            { title: 'EducMark vs ChatGPT', desc: 'Compara EducMark con ChatGPT para planificación docente en Chile.', href: '/educmark-vs-chatgpt' },
                            { title: 'Generador de Clases Chile', desc: 'El primer generador de clases con IA diseñado para el sistema educativo chileno.', href: '/generador-clases-chile' },
                            { title: 'Planifica tu clase en 6 minutos', desc: 'Descubre cómo EducMark automatiza la planificación de clases completas.', href: '/blog/planificar-clase-en-6-minutos' },
                        ].map((link, i) => (
                            <a key={i} href={link.href} className="rounded-xl border border-white/[0.06] bg-card/50 p-5 hover:border-primary/30 hover:bg-card/80 transition-all block">
                                <h3 className="font-semibold text-foreground text-sm mb-1">{link.title}</h3>
                                <p className="text-xs text-muted-foreground">{link.desc}</p>
                            </a>
                        ))}
                    </div>
                </div>
            </section>

            <footer className="border-t border-white/[0.06] py-10 px-6 text-center">
                <p className="text-muted-foreground text-sm">
                    © {new Date().getFullYear()} EducMark Chile · <a href="/" className="text-primary hover:underline">Volver al inicio</a>
                </p>
            </footer>
        </div>
    );
};

export default PlanificacionesMINEDUC;
