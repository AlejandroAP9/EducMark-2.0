'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, Calendar, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '@/shared/components/ui/UIComponents';

const PreparePortafolioDocentemas: React.FC = () => {
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
                        <span className="bg-violet-500/10 text-violet-300 px-2.5 py-0.5 rounded-full font-medium border border-violet-500/20">
                            Carrera Docente
                        </span>
                        <span className="flex items-center gap-1">
                            <Calendar size={12} /> 6 de abril, 2026
                        </span>
                        <span className="flex items-center gap-1">
                            <Clock size={12} /> 9 min de lectura
                        </span>
                    </div>
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold font-heading text-foreground tracking-tight leading-[1.1] mb-4">
                        Cómo preparar el Portafolio Docentemás 2025 sin perder tus fines de semana
                    </h1>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                        Guía paso a paso para abordar el Módulo 1 del Portafolio de Carrera Docente con los documentos oficiales de CPEIP 2025 — y cómo usar los datos de tus clases para redactar los borradores en minutos en lugar de semanas.
                    </p>
                </header>

                {/* Content */}
                <div className="prose prose-invert max-w-none space-y-8">
                    <section>
                        <h2 className="text-2xl font-bold text-foreground mb-3">El contexto: Carrera Docente en Chile</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Cada año, más de 50.000 profesores en Chile pasan por el proceso de Evaluación Docente enmarcado en el Sistema de Desarrollo Profesional Docente (Ley 20.903). Una parte central de esa evaluación es el <strong className="text-foreground">Portafolio Docentemás</strong>, administrado por CPEIP y accesible a través de docentemas.cl.
                        </p>
                        <p className="text-muted-foreground leading-relaxed mt-3">
                            El Portafolio 2025 se estructura en <strong className="text-foreground">3 módulos y 5 tareas totales</strong>:
                        </p>
                        <ul className="space-y-2 mt-3">
                            <li className="flex items-start gap-2 text-muted-foreground">
                                <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                                <span><strong className="text-foreground">Módulo 1:</strong> 3 tareas de texto (Planificación, Evaluación Formativa, Reflexión Socioemocional)</span>
                            </li>
                            <li className="flex items-start gap-2 text-muted-foreground">
                                <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                                <span><strong className="text-foreground">Módulo 2:</strong> Clase grabada + pauta de reflexión</span>
                            </li>
                            <li className="flex items-start gap-2 text-muted-foreground">
                                <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                                <span><strong className="text-foreground">Módulo 3:</strong> Evaluación escrita de conocimientos disciplinares</span>
                            </li>
                        </ul>
                        <p className="text-muted-foreground leading-relaxed mt-3">
                            Este artículo se centra en el <strong className="text-foreground">Módulo 1</strong> — el que consume más horas de escritorio y el único que se puede acelerar con herramientas digitales.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-foreground mb-3">El problema real: la hoja en blanco los domingos</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Si ya pasaste por el proceso, sabes la sensación: abres docentemas.cl un domingo por la tarde, ves 3 cajas de texto vacías, y al lado las rúbricas oficiales con descripciones largas de lo que debería decir un nivel "Competente" o "Destacado". Intentas partir, te bloqueas, copias un fragmento, lo borras, y termina siendo 4 AM sin un borrador decente.
                        </p>
                        <p className="text-muted-foreground leading-relaxed mt-3">
                            El problema no es falta de experiencia pedagógica — es que estás empezando desde cero cuando ya tienes <strong className="text-foreground">toda la información necesaria dispersa en tus planificaciones del semestre</strong>.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-foreground mb-4">Las 3 tareas del Módulo 1, explicadas</h2>

                        <div className="space-y-5">
                            <div className="rounded-xl border border-white/[0.06] bg-card/50 p-5">
                                <h3 className="font-bold text-foreground mb-2 text-lg">Tarea 1 — Planificación de la enseñanza para todos y todas</h3>
                                <p className="text-muted-foreground text-sm leading-relaxed mb-3">
                                    Debes describir 3 experiencias de aprendizaje con sus objetivos, inicio, desarrollo y cierre, y fundamentar cómo abordaste la diversidad del curso (NEE, DUA, barreras de aprendizaje).
                                </p>
                                <p className="text-muted-foreground text-sm leading-relaxed">
                                    <strong className="text-foreground">Clave para Competente/Destacado:</strong> vincular las oportunidades de aprendizaje con al menos 2 tipos de características reales del grupo (ritmos, contexto sociocultural, intereses).
                                </p>
                            </div>

                            <div className="rounded-xl border border-white/[0.06] bg-card/50 p-5">
                                <h3 className="font-bold text-foreground mb-2 text-lg">Tarea 2 — Evaluación formativa</h3>
                                <p className="text-muted-foreground text-sm leading-relaxed mb-3">
                                    Aquí hay un malentendido común: T2 NO se refiere a una prueba sumativa. Se refiere al <strong className="text-foreground">monitoreo formativo dentro de la clase</strong> — preguntas, observaciones, exit tickets, tickets de salida, análisis de productos intermedios.
                                </p>
                                <p className="text-muted-foreground text-sm leading-relaxed">
                                    <strong className="text-foreground">Clave para Competente/Destacado:</strong> mostrar el instrumento real usado, indicadores observables, análisis de causas pedagógicas Y contextuales, y 2+ acciones concretas de mejora (al menos 1 involucrando al estudiante).
                                </p>
                            </div>

                            <div className="rounded-xl border border-white/[0.06] bg-card/50 p-5">
                                <h3 className="font-bold text-foreground mb-2 text-lg">Tarea 3 — Reflexión socioemocional</h3>
                                <p className="text-muted-foreground text-sm leading-relaxed mb-3">
                                    Identificar UN aprendizaje socioemocional que necesita desarrollar el grupo, fundamentarlo con comportamientos concretos observados, y reflexionar sobre qué mantendrías o modificarías de tu propia práctica.
                                </p>
                                <p className="text-muted-foreground text-sm leading-relaxed">
                                    <strong className="text-foreground">Clave para Competente/Destacado:</strong> alinear el aprendizaje socioemocional con el perfil neurocognitivo real del grupo (no inventarse un problema genérico).
                                </p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-foreground mb-3">Los 3 errores que todos cometen</h2>
                        <div className="space-y-4">
                            {[
                                {
                                    titulo: 'Escribir en lenguaje académico rebuscado',
                                    desc: 'Los evaluadores CPEIP leen miles de portafolios. Prefieren lenguaje claro, natural, específico. Si suena como tesis universitaria, pierde fuerza.',
                                },
                                {
                                    titulo: 'Hablar en abstracto sin datos reales',
                                    desc: '"Logré que los estudiantes participaran" no dice nada. "Implementé un exit ticket de 3 preguntas donde el 78% identificó correctamente la causa principal" sí.',
                                },
                                {
                                    titulo: 'Ignorar el lenguaje de las rúbricas',
                                    desc: 'Las rúbricas CPEIP 2025 tienen términos específicos (DUA, barrera identificada, estrategia formativa). Usarlos explícitamente le dice al evaluador que conoces el marco.',
                                },
                            ].map((item, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-1" />
                                    <div>
                                        <h3 className="font-bold text-foreground mb-1">{item.titulo}</h3>
                                        <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-foreground mb-3">El camino lento vs el camino rápido</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            <strong className="text-foreground">Camino lento:</strong> abrir docentemas.cl, mirar las rúbricas, tratar de recordar qué hiciste en marzo, buscar tu planificación, reescribirla en prosa continua, verificar que menciones NEE y DUA, chequear que suene a Competente. Entre 2 y 6 fines de semana por persona.
                        </p>
                        <p className="text-muted-foreground leading-relaxed mt-3">
                            <strong className="text-foreground">Camino rápido:</strong> si ya generaste tus clases con EducMark durante el semestre, todos esos datos (objetivo real, inicio/desarrollo/cierre, evaluación formativa, NEE, adaptaciones DUA, PACI si corresponde) están guardados de forma estructurada. Una IA especializada los toma, los redacta apuntando al lenguaje de las rúbricas 2025, y en 30 segundos tienes un primer borrador de las 3 tareas listo para revisar y ajustar con tu voz.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-foreground mb-3">Cómo lo hace EducMark en 4 pasos</h2>
                        <ol className="space-y-3 list-decimal list-inside text-muted-foreground leading-relaxed">
                            <li><strong className="text-foreground">Selecciona asignatura y curso</strong> — EducMark filtra las clases que ya generaste este semestre.</li>
                            <li><strong className="text-foreground">Elige hasta 3 experiencias de aprendizaje</strong> — las que mejor representan tu trabajo con el grupo.</li>
                            <li><strong className="text-foreground">La IA redacta los 3 borradores</strong> — alimentada con tus datos reales (objetivos, actividades, evaluación, NEE) y los indicadores oficiales de las rúbricas 2025.</li>
                            <li><strong className="text-foreground">Copias en docentemas.cl</strong> — revisas, ajustas con tu voz personal, y pegas en el portafolio oficial.</li>
                        </ol>
                        <p className="text-muted-foreground leading-relaxed mt-4">
                            Importante: <strong className="text-foreground">EducMark no sube nada a docentemas.cl por ti ni garantiza una calificación</strong>. Lo que hace es eliminar la hoja en blanco y darte un borrador alineado a las rúbricas como punto de partida. El trabajo final sigue siendo tuyo.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-foreground mb-3">Checklist antes de entregar</h2>
                        <ul className="space-y-2">
                            {[
                                'Cada tarea menciona al menos un indicador de las rúbricas 2025 con lenguaje exacto',
                                'T1 fundamenta la diversidad con al menos 2 tipos de características del grupo',
                                'T2 describe un instrumento formativo REAL (no una prueba sumativa)',
                                'T2 incluye análisis de causas pedagógicas Y contextuales',
                                'T3 alinea el aprendizaje socioemocional con comportamientos observados',
                                'Todo está en primera persona (yo, mis estudiantes)',
                                'No hay muletillas académicas ni jerga innecesaria',
                                'Revisaste que los datos coincidan con lo que realmente hiciste',
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-2 text-muted-foreground text-sm">
                                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </section>

                    {/* CTA */}
                    <div className="rounded-2xl border border-violet-500/20 bg-violet-500/[0.04] p-8 text-center mt-12">
                        <h3 className="text-xl font-bold text-foreground mb-2">
                            Genera los borradores de tu Módulo 1 gratis
                        </h3>
                        <p className="text-muted-foreground mb-6">
                            Si ya estás usando EducMark para tus clases, el generador de portafolio ya trae tus datos cargados.
                            Si aún no, tienes 3 clases gratis para comenzar.
                        </p>
                        <Link href="/portafolio-carrera-docente">
                            <Button variant="primary" className="px-8 py-3 font-bold text-lg">
                                Ver Generador de Portafolio
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
                            { title: 'Portafolio Carrera Docente con IA', desc: 'La herramienta completa para generar los borradores del Módulo 1.', href: '/portafolio-carrera-docente' },
                            { title: 'Planificaciones MINEDUC', desc: '2.000+ OA indexados de las Bases Curriculares vigentes del MINEDUC.', href: '/planificaciones-mineduc' },
                            { title: 'Planifica tu clase en 6 minutos', desc: 'Método paso a paso para crear planificaciones alineadas al currículo.', href: '/blog/planificar-clase-en-6-minutos' },
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

export default PreparePortafolioDocentemas;
