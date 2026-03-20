'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, Calendar, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/shared/components/ui/UIComponents';

const ErroresPlanificarMINEDUC: React.FC = () => {
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
                            Currículo
                        </span>
                        <span className="flex items-center gap-1">
                            <Calendar size={12} /> 14 de marzo, 2026
                        </span>
                        <span className="flex items-center gap-1">
                            <Clock size={12} /> 4 min de lectura
                        </span>
                    </div>
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold font-heading text-foreground tracking-tight leading-[1.1] mb-4">
                        5 errores comunes al planificar sin alineación MINEDUC
                    </h1>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                        La alineación curricular no es un trámite burocrático: es la diferencia entre una clase
                        que cumple con los estándares nacionales y una que deja vacíos en el aprendizaje de tus
                        estudiantes. Estos son los errores que más se repiten y cómo evitarlos.
                    </p>
                </header>

                {/* Content */}
                <div className="prose prose-invert max-w-none space-y-8">
                    <section>
                        <h2 className="text-2xl font-bold text-foreground mb-3">Por qué importa la alineación curricular</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            En Chile, las Bases Curriculares del MINEDUC definen los Objetivos de Aprendizaje (OA)
                            que cada estudiante debe alcanzar en cada nivel y asignatura. Cuando un docente planifica
                            sin considerar estos OA, se generan brechas de aprendizaje que se acumulan año tras año.
                        </p>
                        <p className="text-muted-foreground leading-relaxed mt-3">
                            El problema se agrava porque muchos profesores heredan planificaciones de años anteriores,
                            copian recursos de internet sin verificar su alineación, o simplemente no tienen tiempo
                            para revisar el marco curricular vigente. El resultado: clases que parecen completas
                            pero que no cubren lo que el currículo nacional exige.
                        </p>
                        <p className="text-muted-foreground leading-relaxed mt-3">
                            Según la Agencia de Calidad de la Educación, uno de los factores que más incide en los
                            resultados SIMCE es precisamente la cobertura curricular efectiva. No basta con tener
                            una planificación: debe estar alineada.
                        </p>
                    </section>

                    <section>
                        <div className="space-y-6">
                            {[
                                {
                                    error: 'Error 1: Usar OA genéricos o inventados',
                                    desc: 'Muchos docentes escriben objetivos de aprendizaje desde cero en lugar de usar los OA oficiales del MINEDUC. Frases como "el estudiante comprenderá la importancia de..." suenan pedagógicas, pero si no corresponden a un OA específico de las Bases Curriculares, la clase queda fuera del marco curricular.',
                                    impact: 'Una supervisión técnica o una evaluación docente puede detectar que la planificación no está alineada. Además, si otros docentes del mismo nivel sí cubren los OA oficiales, tus estudiantes quedan en desventaja en evaluaciones estandarizadas.',
                                    fix: 'Siempre parte del OA oficial. Puedes adaptar las actividades, pero el objetivo debe ser textualmente el que indica el MINEDUC para ese nivel y asignatura.',
                                },
                                {
                                    error: 'Error 2: No verificar la vigencia de las Bases Curriculares',
                                    desc: 'Las Bases Curriculares han tenido actualizaciones importantes. La versión de Educación Básica (2012) difiere de la de Media (2015, actualizada en 2019). Algunos docentes siguen usando programas de estudio antiguos o marcos curriculares que ya fueron reemplazados.',
                                    impact: 'Planificar con un currículo desactualizado significa enseñar contenidos que ya no son prioritarios o ignorar habilidades que el MINEDUC incorporó en las últimas revisiones. Esto es especialmente crítico en asignaturas como Ciencias Naturales y Tecnología.',
                                    fix: 'Consulta siempre el sitio oficial curriculumnacional.cl para verificar que estás usando la versión vigente de las Bases Curriculares y los Programas de Estudio.',
                                },
                                {
                                    error: 'Error 3: Confundir indicadores de evaluación con actividades',
                                    desc: 'Los indicadores de evaluación (IE) describen evidencias observables de aprendizaje. Sin embargo, muchos docentes los confunden con actividades de clase. Por ejemplo, "el estudiante realiza un mapa conceptual" es una actividad, no un indicador. Un indicador sería "identifica las relaciones causales entre los eventos estudiados".',
                                    impact: 'Sin indicadores claros, la evaluación se vuelve subjetiva. No puedes medir si el OA se logró porque nunca definiste qué evidencia buscar. Esto afecta tanto la evaluación formativa como la sumativa.',
                                    fix: 'Usa los indicadores sugeridos en los Programas de Estudio del MINEDUC como punto de partida. Cada OA tiene indicadores asociados que describen exactamente qué debería poder hacer el estudiante.',
                                },
                                {
                                    error: 'Error 4: Ignorar la progresión entre niveles',
                                    desc: 'El currículo chileno está diseñado con una progresión vertical: los OA de 5° Básico se construyen sobre los de 4° Básico y preparan para los de 6°. Cuando un docente planifica sin considerar esta progresión, puede repetir contenidos que ya se cubrieron o saltar prerrequisitos que los estudiantes necesitan.',
                                    impact: 'Los estudiantes perciben clases repetitivas ("esto ya lo vimos el año pasado") o se frustran porque les falta la base para entender el contenido nuevo. Ambos escenarios dañan la motivación y el aprendizaje.',
                                    fix: 'Antes de planificar una unidad, revisa los OA del nivel anterior y del siguiente. Esto te da contexto sobre qué ya deberían saber tus estudiantes y hacia dónde deben avanzar.',
                                },
                                {
                                    error: 'Error 5: Planificar sin considerar el Decreto 67 de evaluación',
                                    desc: 'El Decreto 67 (2018) cambió las reglas de evaluación en Chile. Establece que la evaluación debe ser un proceso continuo, diversificado y orientado al aprendizaje. Sin embargo, muchas planificaciones siguen el modelo antiguo: una prueba escrita al final de la unidad como única instancia evaluativa.',
                                    impact: 'Una planificación que no contempla evaluación formativa continua, diversificación de instrumentos y retroalimentación oportuna no cumple con la normativa vigente. Además, pierde la oportunidad de ajustar la enseñanza en tiempo real.',
                                    fix: 'Incluye al menos 2-3 instancias de evaluación formativa por unidad (tickets de salida, rúbricas de proceso, autoevaluación). Diversifica los instrumentos: no todo tiene que ser una prueba escrita.',
                                },
                            ].map((item, i) => (
                                <div key={i} className="rounded-xl border border-white/[0.06] bg-card/50 p-6">
                                    <h3 className="font-bold text-foreground mb-3 flex items-center gap-2 text-lg">
                                        <AlertTriangle size={18} className="text-amber-400 shrink-0" />
                                        {item.error}
                                    </h3>
                                    <p className="text-muted-foreground text-sm leading-relaxed mb-3">
                                        {item.desc}
                                    </p>
                                    <div className="flex items-start gap-2 mb-3">
                                        <XCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
                                        <p className="text-muted-foreground text-sm leading-relaxed">
                                            <strong className="text-red-400">Consecuencia:</strong> {item.impact}
                                        </p>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                                        <p className="text-muted-foreground text-sm leading-relaxed">
                                            <strong className="text-emerald-400">Solución:</strong> {item.fix}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-foreground mb-3">Cómo EducMark previene los 5 errores automáticamente</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            EducMark fue diseñado específicamente para resolver estos problemas de raíz. No es un
                            generador de texto genérico: es una herramienta que tiene integradas las Bases Curriculares
                            vigentes del MINEDUC, con todos los OA, indicadores de evaluación y la progresión entre niveles.
                        </p>
                        <ul className="space-y-2 mt-4">
                            {[
                                'OA oficiales del MINEDUC integrados: no necesitas buscarlos ni copiarlos. Selecciona nivel y asignatura, y el sistema te muestra los OA correspondientes.',
                                'Bases Curriculares siempre actualizadas: EducMark usa la versi\u00f3n vigente del curr\u00edculo, desde 1\u00b0 B\u00e1sico hasta 4\u00b0 Medio.',
                                'Indicadores de evaluación correctos: cada planificación incluye indicadores alineados al OA seleccionado, no actividades disfrazadas de indicadores.',
                                'Progresión curricular respetada: el sistema conoce la secuencia de OA entre niveles y genera contenido coherente con el punto donde están tus estudiantes.',
                                'Evaluación alineada al Decreto 67: las planificaciones incluyen evaluación formativa, diversificación de instrumentos y momentos de retroalimentación.',
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-2 text-muted-foreground">
                                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                        <p className="text-muted-foreground leading-relaxed mt-4">
                            El resultado es una planificación que pasa cualquier supervisión técnica, cubre el
                            currículo efectivamente y te ahorra las horas de verificación manual que estos
                            5 errores normalmente requieren.
                        </p>
                    </section>

                    {/* CTA */}
                    <div className="rounded-2xl border border-primary/20 bg-primary/[0.04] p-8 text-center mt-12">
                        <h3 className="text-xl font-bold text-foreground mb-2">
                            Planifica alineado al MINEDUC desde el primer clic
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

                    {/* Related articles */}
                    <section className="mt-16">
                        <h2 className="text-xl font-bold text-foreground mb-6">Artículos relacionados</h2>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <Link
                                href="/blog/planificar-clase-en-6-minutos"
                                className="rounded-xl border border-white/[0.06] bg-card/50 p-5 hover:border-primary/30 transition-colors group"
                            >
                                <span className="text-xs text-primary font-medium">Productividad</span>
                                <h3 className="font-bold text-foreground mt-1 group-hover:text-primary transition-colors">
                                    Cómo planificar una clase en 6 minutos con IA
                                </h3>
                                <p className="text-muted-foreground text-sm mt-1">
                                    El método paso a paso que usan cientos de profesores chilenos.
                                </p>
                            </Link>
                            <Link
                                href="/blog/neuroeducacion-en-el-aula"
                                className="rounded-xl border border-white/[0.06] bg-card/50 p-5 hover:border-primary/30 transition-colors group"
                            >
                                <span className="text-xs text-primary font-medium">Neuroeducación</span>
                                <h3 className="font-bold text-foreground mt-1 group-hover:text-primary transition-colors">
                                    Neuroeducación en el aula: guía práctica para docentes
                                </h3>
                                <p className="text-muted-foreground text-sm mt-1">
                                    Estrategias basadas en cómo funciona el cerebro para mejorar el aprendizaje.
                                </p>
                            </Link>
                        </div>
                    </section>
                </div>
            </article>

            {/* Cross-links SEO */}
            <section className="py-16 border-t border-white/[0.06]">
                <div className="max-w-4xl mx-auto px-6">
                    <h2 className="text-2xl font-bold text-foreground mb-6 text-center">Recursos Relacionados</h2>
                    <div className="grid md:grid-cols-3 gap-4">
                        {[
                            { title: 'Planificaciones MINEDUC con IA', desc: 'Genera planificaciones alineadas a las Bases Curriculares en 6 minutos.', href: '/planificaciones-mineduc' },
                            { title: 'Neuroeducaci\u00f3n en el aula', desc: 'Gu\u00eda pr\u00e1ctica de neuroeducaci\u00f3n para aplicar la ciencia del cerebro en tu clase.', href: '/blog/neuroeducacion-en-el-aula' },
                            { title: 'Generador de Clases Chile', desc: 'Kit completo: planificaci\u00f3n + presentaci\u00f3n + quiz con IA para el curr\u00edculum chileno.', href: '/generador-clases-chile' },
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

export default ErroresPlanificarMINEDUC;
