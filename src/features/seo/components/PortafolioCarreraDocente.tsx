'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/components/ui/UIComponents';
import {
    Check,
    ArrowRight,
    FileText,
    Brain,
    Sparkles,
    Clock,
    ShieldCheck,
    Target,
} from 'lucide-react';
import { trackEvent } from '@/shared/lib/analytics';

const indicadores = [
    {
        codigo: 'T1',
        titulo: 'Planificación para todos y todas',
        desc: 'Descripción de 3 experiencias de aprendizaje con objetivos, inicio, desarrollo y cierre, más la fundamentación de la diversidad (NEE, DUA, barreras de aprendizaje).',
    },
    {
        codigo: 'T2',
        titulo: 'Evaluación formativa',
        desc: 'Estrategia de monitoreo, análisis de resultados, causas pedagógicas y contextuales, y acciones concretas de mejora con participación del estudiante.',
    },
    {
        codigo: 'T3',
        titulo: 'Reflexión socioemocional',
        desc: 'Aprendizaje socioemocional alineado con el perfil real del grupo (barreras, perfil neurocognitivo) y reflexión sobre la propia práctica docente.',
    },
];

const faqs = [
    {
        q: '¿Esto reemplaza al portafolio oficial de docentemas.cl?',
        a: 'No. EducMark genera los borradores de texto del Módulo 1 (Tareas 1, 2 y 3). Tú los revisas, los ajustas con tu voz y los copias en docentemas.cl. El portafolio oficial siempre lo subes tú.',
    },
    {
        q: '¿De dónde saca los datos la IA?',
        a: 'De tus clases generadas en EducMark. Cada vez que generas una planificación, EducMark guarda los datos reales (objetivo, inicio, desarrollo, cierre, evaluación formativa, NEE, DUA, PACI). Cuando vas a generar borradores del portafolio, la IA usa esa información real, no la inventa.',
    },
    {
        q: '¿Apunta a nivel Competente o Destacado?',
        a: 'Los prompts están construidos apuntando al nivel Competente/Destacado de las Rúbricas 2025 de CPEIP. Usan el lenguaje exacto de los indicadores oficiales.',
    },
    {
        q: '¿Cubre los 3 módulos del portafolio?',
        a: 'No. Solo el Módulo 1 (3 tareas de texto). El Módulo 2 (clase grabada) y el Módulo 3 (evaluación escrita del conocimiento) no son automatizables — son presenciales o de aplicación individual.',
    },
    {
        q: '¿Cuántas clases necesito tener generadas?',
        a: 'Seleccionas hasta 3 experiencias de aprendizaje del semestre. La IA usa esas 3 clases reales + sus datos de planificación, evaluación y NEE como fuente primaria.',
    },
];

const PortafolioCarreraDocente: React.FC = () => {
    const router = useRouter();

    const handleCTA = (location: string) => {
        trackEvent('click_cta', { location });
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
                    <Button onClick={() => handleCTA('seo_portafolio_navbar')} className="text-sm">
                        Probar Gratis
                    </Button>
                </div>
            </nav>

            <main className="max-w-4xl mx-auto px-6 py-12 md:py-20">
                {/* Hero */}
                <header className="text-center mb-16">
                    <span className="inline-block bg-violet-500/10 text-violet-300 px-4 py-1.5 rounded-full text-sm font-semibold border border-violet-500/20 mb-6">
                        Carrera Docente · Evaluación 2025
                    </span>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-heading leading-[1.1] tracking-tight mb-6">
                        <span className="text-foreground">Tu Portafolio de Carrera Docente</span>
                        <br />
                        <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                            listo en minutos, no semanas
                        </span>
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        EducMark genera los borradores completos del Módulo 1 del Portafolio
                        Docentemás 2025 usando los datos reales de tus clases. Tareas 1, 2 y 3,
                        redactadas apuntando al nivel Competente/Destacado de las rúbricas oficiales de CPEIP.
                    </p>
                    <div className="mt-10">
                        <Button
                            onClick={() => handleCTA('seo_portafolio_hero')}
                            variant="primary"
                            className="h-auto py-4 px-10 !rounded-full text-lg font-semibold"
                        >
                            Generar Mis Borradores
                            <ArrowRight size={20} className="ml-2" />
                        </Button>
                        <p className="text-muted-foreground/60 text-sm mt-3">
                            3 clases gratis para comenzar · Sin tarjeta
                        </p>
                    </div>
                </header>

                {/* Problem */}
                <section className="mb-20 rounded-3xl border border-white/[0.06] bg-card/40 p-8 md:p-10">
                    <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                        El portafolio consume fines de semana enteros
                    </h2>
                    <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                        Redactar los textos del Módulo 1 mirando rúbricas, pensando cómo fundamentar
                        la diversidad del curso, cómo describir el monitoreo formativo, cómo reflexionar
                        sobre lo socioemocional... todo desde la hoja en blanco. Y los profesores
                        evaluados en Chile son más de 50.000 cada año.
                    </p>
                    <p className="text-foreground/90 text-lg leading-relaxed">
                        EducMark ya tiene los datos de tus clases: objetivos, inicio, desarrollo,
                        cierre, evaluación formativa, necesidades educativas, estrategias DUA, PACI.
                        Lo único que falta es convertir esos datos en texto del portafolio.
                        Eso es lo que hace esta herramienta.
                    </p>
                </section>

                {/* What you get */}
                <section className="mb-20">
                    <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8 text-center">
                        Las 3 tareas del Módulo 1, redactadas
                    </h2>
                    <div className="space-y-5">
                        {indicadores.map((item) => (
                            <div
                                key={item.codigo}
                                className="rounded-2xl border border-white/[0.06] bg-card/50 p-6 flex gap-5"
                            >
                                <div className="shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 border border-violet-500/20 flex items-center justify-center font-bold text-violet-300 text-lg">
                                    {item.codigo}
                                </div>
                                <div>
                                    <h3 className="font-bold text-foreground mb-1 text-lg">{item.titulo}</h3>
                                    <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <p className="text-center text-muted-foreground text-sm mt-8 max-w-2xl mx-auto">
                        Cada borrador llega con mínimo 500 palabras, en primera persona, en lenguaje formal
                        y natural de profesor chileno. Listo para copiar en docentemas.cl y ajustar con tu voz.
                    </p>
                </section>

                {/* How it works */}
                <section className="mb-20">
                    <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8 text-center">
                        ¿Cómo funciona?
                    </h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            {
                                step: '1',
                                icon: <Target className="w-5 h-5" />,
                                title: 'Selecciona 3 experiencias',
                                desc: 'Elige hasta 3 clases del semestre que ya generaste en EducMark. Cada clase trae sus datos reales: objetivo, actividades, evaluación formativa, NEE, DUA.',
                            },
                            {
                                step: '2',
                                icon: <Brain className="w-5 h-5" />,
                                title: 'La IA redacta',
                                desc: 'GPT-4 analiza las rúbricas 2025 y redacta los 3 borradores usando los datos reales como fuente primaria. No inventa: usa lo que ya existe.',
                            },
                            {
                                step: '3',
                                icon: <FileText className="w-5 h-5" />,
                                title: 'Copias en docentemas.cl',
                                desc: 'Revisas, ajustas con tu voz, copias y pegas en el portafolio oficial. Todo el peso de arrancar desde cero desaparece.',
                            },
                        ].map((item, i) => (
                            <div key={i} className="text-center">
                                <div className="w-14 h-14 rounded-2xl bg-primary/20 text-primary font-bold text-xl flex items-center justify-center mx-auto mb-4 relative">
                                    {item.icon}
                                    <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center">
                                        {item.step}
                                    </span>
                                </div>
                                <h3 className="font-bold text-foreground mb-2">{item.title}</h3>
                                <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Differentiator */}
                <section className="mb-20">
                    <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8 text-center">
                        Por qué no basta con ChatGPT
                    </h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        {[
                            {
                                icon: <ShieldCheck className="w-6 h-6 text-emerald-400" />,
                                title: 'Rúbricas 2025 integradas',
                                desc: 'Los prompts incluyen el lenguaje exacto de los indicadores Competente/Destacado de CPEIP. ChatGPT no conoce esas rúbricas actualizadas.',
                            },
                            {
                                icon: <Sparkles className="w-6 h-6 text-violet-400" />,
                                title: 'Datos reales, no genéricos',
                                desc: 'La IA trabaja con TUS clases (objetivo real, monitoreo real, NEE reales del curso), no con ejemplos inventados que no pasan un filtro experto.',
                            },
                            {
                                icon: <Clock className="w-6 h-6 text-cyan-400" />,
                                title: 'Minutos en lugar de horas',
                                desc: 'Seleccionas 3 clases y la IA redacta los 3 borradores en ~30 segundos. Sin hojas en blanco, sin bloqueo del escritor.',
                            },
                            {
                                icon: <Target className="w-6 h-6 text-amber-400" />,
                                title: 'Alineado al Marco Para la Buena Enseñanza',
                                desc: 'Cada tarea referencia los estándares del MBE 2021 y las categorías exactas que evalúan las rúbricas oficiales de Carrera Docente.',
                            },
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

                {/* Trust */}
                <section className="mb-20">
                    <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/[0.04] p-8 md:p-10">
                        <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">
                            Lo que EducMark hace y lo que NO hace
                        </h2>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="font-semibold text-emerald-400 mb-3 text-sm uppercase tracking-wider">
                                    Sí hace
                                </h3>
                                <ul className="space-y-2">
                                    {[
                                        'Borradores de texto para T1, T2 y T3 del Módulo 1',
                                        'Usa los datos reales de tus clases en EducMark',
                                        'Redacta apuntando a Competente/Destacado',
                                        'Primera persona, lenguaje natural de profesor',
                                        'Listo para copiar en docentemas.cl',
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-start gap-2 text-foreground/80 text-sm">
                                            <Check size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h3 className="font-semibold text-amber-400 mb-3 text-sm uppercase tracking-wider">
                                    No hace
                                </h3>
                                <ul className="space-y-2">
                                    {[
                                        'No sube nada a docentemas.cl por ti',
                                        'No reemplaza al Módulo 2 (clase grabada)',
                                        'No reemplaza al Módulo 3 (evaluación escrita)',
                                        'No inventa datos que no estén en tus clases',
                                        'No garantiza una calificación específica',
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-start gap-2 text-foreground/80 text-sm">
                                            <Check size={16} className="text-amber-400 shrink-0 mt-0.5" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                {/* FAQ */}
                <section className="mb-20">
                    <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8 text-center">
                        Preguntas frecuentes
                    </h2>
                    <div className="space-y-4">
                        {faqs.map((faq, i) => (
                            <details
                                key={i}
                                className="rounded-2xl border border-white/[0.06] bg-card/50 p-6 group"
                            >
                                <summary className="font-bold text-foreground cursor-pointer list-none flex justify-between items-center">
                                    {faq.q}
                                    <span className="text-primary group-open:rotate-45 transition-transform text-2xl leading-none">
                                        +
                                    </span>
                                </summary>
                                <p className="text-muted-foreground text-sm leading-relaxed mt-4">{faq.a}</p>
                            </details>
                        ))}
                    </div>
                </section>

                {/* CTA */}
                <section className="text-center py-12 rounded-3xl border border-primary/20 bg-primary/[0.04] px-6">
                    <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                        Llega preparado a tu evaluación
                    </h2>
                    <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                        Deja de perder fines de semana frente a la hoja en blanco.
                        Genera tus primeros borradores gratis.
                    </p>
                    <Button
                        onClick={() => handleCTA('seo_portafolio_cta_final')}
                        variant="primary"
                        className="h-auto py-4 px-10 !rounded-full text-lg font-semibold"
                    >
                        Probar Gratis
                        <ArrowRight size={20} className="ml-2" />
                    </Button>
                    <p className="text-muted-foreground/60 text-sm mt-3">
                        3 clases gratis · Sin tarjeta de crédito
                    </p>
                </section>
            </main>

            {/* Cross-links SEO */}
            <section className="py-16 border-t border-white/[0.06]">
                <div className="max-w-4xl mx-auto px-6">
                    <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
                        Recursos Relacionados
                    </h2>
                    <div className="grid md:grid-cols-3 gap-4">
                        {[
                            {
                                title: 'Planificaciones MINEDUC',
                                desc: 'Genera planificaciones alineadas a las Bases Curriculares en 6 minutos.',
                                href: '/planificaciones-mineduc',
                            },
                            {
                                title: 'Evaluaciones Automáticas',
                                desc: 'Crea evaluaciones sumativas con tabla de especificaciones y pauta automática.',
                                href: '/evaluaciones-automaticas',
                            },
                            {
                                title: 'EducMark vs ChatGPT',
                                desc: 'Por qué una IA especializada en currículum chileno supera a ChatGPT para docentes.',
                                href: '/educmark-vs-chatgpt',
                            },
                        ].map((link, i) => (
                            <a
                                key={i}
                                href={link.href}
                                className="rounded-xl border border-white/[0.06] bg-card/50 p-5 hover:border-primary/30 hover:bg-card/80 transition-all block"
                            >
                                <h3 className="font-semibold text-foreground text-sm mb-1">{link.title}</h3>
                                <p className="text-xs text-muted-foreground">{link.desc}</p>
                            </a>
                        ))}
                    </div>
                </div>
            </section>

            <footer className="border-t border-white/[0.06] py-10 px-6 text-center">
                <p className="text-muted-foreground text-sm">
                    © {new Date().getFullYear()} EducMark Chile ·{' '}
                    <a href="/" className="text-primary hover:underline">
                        Volver al inicio
                    </a>
                </p>
            </footer>
        </div>
    );
};

export default PortafolioCarreraDocente;
