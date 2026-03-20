'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/components/ui/UIComponents';
import { ArrowRight, Zap, Brain, Shield, Clock } from 'lucide-react';
import { trackEvent } from '@/shared/lib/analytics';

const GeneradorClasesChile: React.FC = () => {
    const router = useRouter();

    const handleCTA = () => {
        trackEvent('click_cta', { location: 'seo_generador_clases' });
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
                <header className="text-center mb-16">
                    <span className="inline-block bg-blue-500/10 text-blue-400 px-4 py-1.5 rounded-full text-sm font-semibold border border-blue-500/20 mb-6">
                        Hecho en Chile, para Chile
                    </span>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-heading leading-[1.1] tracking-tight mb-6">
                        <span className="text-foreground">Genera clases completas</span>
                        <br />
                        <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                            alineadas al currículum chileno
                        </span>
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        EducMark es el primer generador de clases con IA diseñado desde cero
                        para el sistema educativo chileno. No es un chatbot con un prompt educativo encima.
                    </p>
                    <div className="mt-10">
                        <Button onClick={handleCTA} variant="primary" className="h-auto py-4 px-10 !rounded-full text-lg font-semibold">
                            Generar Mi Primera Clase
                            <ArrowRight size={20} className="ml-2" />
                        </Button>
                        <p className="text-muted-foreground/60 text-sm mt-3">3 clases gratis · Sin tarjeta · 6 minutos</p>
                    </div>
                </header>

                <section className="mb-20">
                    <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8 text-center">
                        ¿Qué hace diferente a EducMark?
                    </h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        {[
                            { icon: <Shield className="w-6 h-6 text-emerald-400" />, title: 'Currículum real, no inventado', desc: '2.000+ Objetivos de Aprendizaje indexados directamente de las Bases Curriculares vigentes del MINEDUC. Cada OA es verificable.' },
                            { icon: <Brain className="w-6 h-6 text-purple-400" />, title: 'Base neuroeducativa', desc: 'Actividades diseñadas con principios de Céspedes & Maturana: activación emocional, momentos de alta atención, consolidación.' },
                            { icon: <Zap className="w-6 h-6 text-amber-400" />, title: 'Kit completo en 1 click', desc: 'Planificación docente + Presentación + Quiz interactivo, todo en HTML editable. No solo texto: el kit completo para la clase.' },
                            { icon: <Clock className="w-6 h-6 text-blue-400" />, title: '6 minutos vs 55 minutos', desc: 'Tiempo promedio de planificación manual: 55 min. Con EducMark: 6 min. Ahorra 24+ horas al mes.' },
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

                <section className="mb-20">
                    <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8 text-center">¿Para quién es EducMark?</h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            { title: 'Profesores de aula', desc: 'Que necesitan planificar 20-40 clases al mes y recuperar sus tardes y fines de semana.' },
                            { title: 'Jefes de UTP', desc: 'Que necesitan que sus docentes entreguen planificaciones alineadas al currículum, con formato estandarizado.' },
                            { title: 'Profesores con NEE', desc: 'Que necesitan adaptaciones DUA y PACI (Decreto 83/2015) integradas en cada planificación.' },
                        ].map((item, i) => (
                            <div key={i} className="rounded-2xl border border-white/[0.06] bg-card/50 p-6 text-center">
                                <h3 className="font-bold text-foreground mb-2">{item.title}</h3>
                                <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="mb-20 rounded-3xl border border-white/10 bg-card/50 p-8 md:p-10">
                    <h2 className="text-2xl font-bold text-foreground mb-6 text-center">La matemática del ahorro</h2>
                    <div className="grid md:grid-cols-2 gap-8 text-center">
                        <div>
                            <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2">Sin EducMark</p>
                            <p className="text-4xl font-bold text-foreground">55 min</p>
                            <p className="text-muted-foreground text-sm">por clase x 30 clases = <strong className="text-foreground">27.5 horas/mes</strong></p>
                        </div>
                        <div>
                            <p className="text-sm text-primary uppercase tracking-wider mb-2">Con EducMark</p>
                            <p className="text-4xl font-bold text-primary">6 min</p>
                            <p className="text-muted-foreground text-sm">por clase x 30 clases = <strong className="text-primary">3 horas/mes</strong></p>
                        </div>
                    </div>
                    <p className="text-center text-emerald-400 font-semibold mt-6 text-lg">Ahorro: 24.5 horas al mes</p>
                </section>

                <section className="text-center py-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Tu próxima clase en 6 minutos</h2>
                    <p className="text-muted-foreground mb-8 max-w-lg mx-auto">3 clases completas gratis. Sin tarjeta de crédito. Sin compromiso.</p>
                    <Button onClick={handleCTA} variant="primary" className="h-auto py-4 px-10 !rounded-full text-lg font-semibold">
                        Probar Gratis
                        <ArrowRight size={20} className="ml-2" />
                    </Button>
                </section>
            </main>

            <section className="py-16 border-t border-white/[0.06]">
                <div className="max-w-4xl mx-auto px-6">
                    <h2 className="text-2xl font-bold text-foreground mb-6 text-center">Recursos Relacionados</h2>
                    <div className="grid md:grid-cols-3 gap-4">
                        {[
                            { title: 'Planificaciones MINEDUC con IA', desc: 'Genera planificaciones alineadas a las Bases Curriculares con OA reales verificables.', href: '/planificaciones-mineduc' },
                            { title: 'Corrección Automática de Pruebas', desc: 'Corrige pruebas con tu celular usando escáner OMR y obtén análisis de ítems.', href: '/evaluaciones-automaticas' },
                            { title: 'EducMark para Colegios', desc: 'Plan institucional con licencias docentes, panel UTP y soporte prioritario.', href: '/colegios' },
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

export default GeneradorClasesChile;
