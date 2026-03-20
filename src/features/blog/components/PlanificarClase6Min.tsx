'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, Calendar, CheckCircle2 } from 'lucide-react';
import { Button } from '@/shared/components/ui/UIComponents';

const PlanificarClase6Min: React.FC = () => {
    return (
        <div className="bg-[var(--background)] min-h-screen">
            
            {/* Navbar */}
            <nav className="border-b border-white/[0.06] bg-[var(--card)]/50 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
                    <a href="/" className="font-bold text-xl text-foreground hover:opacity-80 transition-opacity">
                        EducMark
                    </a>
                    <Link href="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                        <ArrowLeft size={14} /> Blog
                    </Link>
                </div>
            </nav>

            <article className="max-w-3xl mx-auto px-6 py-12 md:py-20">
                {/* Header */}
                <header className="mb-12">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                        <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-medium border border-primary/20">
                            Productividad
                        </span>
                        <span className="flex items-center gap-1">
                            <Calendar size={12} /> 14 de marzo, 2026
                        </span>
                        <span className="flex items-center gap-1">
                            <Clock size={12} /> 5 min de lectura
                        </span>
                    </div>
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold font-heading text-foreground tracking-tight leading-[1.1] mb-4">
                        Cómo planificar una clase en 6 minutos con IA
                    </h1>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                        El método paso a paso que usan cientos de profesores chilenos para crear planificaciones
                        alineadas al currículo MINEDUC en una fracción del tiempo habitual.
                    </p>
                </header>

                {/* Content */}
                <div className="prose prose-invert max-w-none space-y-8">
                    <section>
                        <h2 className="text-2xl font-bold text-foreground mb-3">El problema: 55 minutos por clase</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Según estudios del CIAE (Centro de Investigación Avanzada en Educación), los docentes
                            chilenos dedican en promedio 55 minutos a planificar cada clase. Con una carga de
                            30+ horas semanales, esto significa que gran parte del tiempo fuera del aula se
                            consume en trabajo administrativo en lugar de preparación pedagógica real.
                        </p>
                        <p className="text-muted-foreground leading-relaxed mt-3">
                            El resultado: domingos enteros dedicados a planificar, agotamiento profesional
                            y una calidad de vida que se deteriora semestre a semestre.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-foreground mb-3">La solución: IA alineada al currículo</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            La clave no es usar cualquier IA (como ChatGPT), sino una herramienta que ya
                            conozca el currículo MINEDUC. EducMark tiene integrados los Objetivos de Aprendizaje
                            (OA) de todas las asignaturas y niveles, desde 1&deg; B&aacute;sico hasta 4&deg; Medio.
                        </p>
                        <p className="text-muted-foreground leading-relaxed mt-3">
                            Esto significa que no necesitas copiar y pegar OA, ni verificar alineación
                            curricular. El sistema lo hace por ti.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-foreground mb-4">3 pasos para planificar en 6 minutos</h2>
                        <div className="space-y-4">
                            {[
                                {
                                    step: 'Paso 1: Selecciona asignatura, nivel y OA (1 min)',
                                    desc: 'Elige tu asignatura y nivel. El sistema te muestra los OA correspondientes a la unidad que estás trabajando. Selecciona uno o más OA con un clic.',
                                },
                                {
                                    step: 'Paso 2: Personaliza tu clase (1 min)',
                                    desc: 'Indica el número de clases, duración, si necesitas adecuación NEE/DUA, y cualquier enfoque especial. Por ejemplo: "énfasis en trabajo colaborativo" o "incluir actividad de cierre reflexiva".',
                                },
                                {
                                    step: 'Paso 3: Genera y revisa (4 min)',
                                    desc: 'EducMark genera la planificación completa: inicio, desarrollo y cierre con actividades detalladas, indicadores de evaluación, y recursos sugeridos. Revisa, ajusta lo que necesites, y descarga en formato listo para imprimir o compartir.',
                                },
                            ].map((item, i) => (
                                <div key={i} className="rounded-xl border border-white/[0.06] bg-card/50 p-5">
                                    <h3 className="font-bold text-foreground mb-2 flex items-center gap-2">
                                        <CheckCircle2 size={18} className="text-primary shrink-0" />
                                        {item.step}
                                    </h3>
                                    <p className="text-muted-foreground text-sm leading-relaxed pl-7">
                                        {item.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-foreground mb-3">Qué obtienes al final</h2>
                        <ul className="space-y-2">
                            {[
                                'Planificación completa alineada a OA MINEDUC',
                                'Presentaci\u00f3n HTML editable con 10-15 diapositivas',
                                'Quiz interactivo para evaluar comprensión',
                                'Imágenes educativas generadas por IA (plan con imágenes)',
                                'Adecuación NEE/DUA si lo necesitas (PACI incluido)',
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-2 text-muted-foreground">
                                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-foreground mb-3">La matemática del tiempo recuperado</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Si planificas 5 clases por semana y cada una te tomaba 55 minutos, eso son
                            <strong className="text-foreground"> 4.5 horas semanales</strong>. Con EducMark,
                            esas 5 clases toman 30 minutos en total.
                        </p>
                        <p className="text-muted-foreground leading-relaxed mt-3">
                            <strong className="text-foreground">Recuperas 4 horas cada semana.</strong> Eso son
                            16 horas al mes que puedes dedicar a tu familia, a descansar, o a mejorar tu práctica
                            pedagógica de formas que realmente importan.
                        </p>
                    </section>

                    {/* CTA */}
                    <div className="rounded-2xl border border-primary/20 bg-primary/[0.04] p-8 text-center mt-12">
                        <h3 className="text-xl font-bold text-foreground mb-2">
                            Prueba planificar tu primera clase gratis
                        </h3>
                        <p className="text-muted-foreground mb-6">
                            Crea tu cuenta en 30 segundos. Sin tarjeta de crédito. 3 clases de prueba incluidas.
                        </p>
                        <Link href="/login?tab=register">
                            <Button variant="primary" className="px-8 py-3 font-bold text-lg">
                                Probar Gratis
                            </Button>
                        </Link>
                    </div>
                </div>
            </article>

            {/* Cross-links SEO */}
            <section className="py-16 border-t border-white/[0.06]">
                <div className="max-w-4xl mx-auto px-6">
                    <h2 className="text-2xl font-bold text-foreground mb-6 text-center">Recursos Relacionados</h2>
                    <div className="grid md:grid-cols-3 gap-4">
                        {[
                            { title: 'Generador de Planificaciones con IA', desc: 'Crea planificaciones alineadas al MINEDUC con OA reales en segundos.', href: '/features/generador-planificaciones' },
                            { title: 'Planificaciones MINEDUC con IA', desc: '2.000+ OA indexados de las Bases Curriculares vigentes del MINEDUC.', href: '/planificaciones-mineduc' },
                            { title: '5 errores al planificar sin MINEDUC', desc: 'Los errores m\u00e1s frecuentes al planificar sin alineaci\u00f3n curricular y c\u00f3mo evitarlos.', href: '/blog/5-errores-planificar-sin-alineacion-mineduc' },
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
                    &copy; {new Date().getFullYear()} EducMark Chile &middot; <a href="/blog" className="text-primary hover:underline">Volver al blog</a> &middot; <a href="/" className="text-primary hover:underline">Inicio</a>
                </p>
            </footer>
        </div>
    );
};

export default PlanificarClase6Min;
