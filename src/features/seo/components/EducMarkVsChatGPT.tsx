'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/components/ui/UIComponents';
import { Check, X, ArrowRight, Clock, FileText, Presentation, BookOpen, ScanLine } from 'lucide-react';
import { trackEvent } from '@/shared/lib/analytics';

const rows = [
    { feature: 'Alineación MINEDUC automática', educmark: true, chatgpt: false },
    { feature: 'Base de 2.000+ OA indexados', educmark: true, chatgpt: false },
    { feature: 'Planificación + Presentación + Quiz en 1 click', educmark: true, chatgpt: false },
    { feature: 'Corrección OMR con celular', educmark: true, chatgpt: false },
    { feature: 'Formato listo para UTP (HTML editable y descargable)', educmark: true, chatgpt: false },
    { feature: 'Neuroeducación (Céspedes & Maturana)', educmark: true, chatgpt: false },
    { feature: 'Adaptaciones NEE/DUA integradas', educmark: true, chatgpt: false },
    { feature: 'Necesita editar y formatear resultado', educmark: false, chatgpt: true },
    { feature: 'Inventa OA que no existen', educmark: false, chatgpt: true },
    { feature: 'Tiempo por clase: 6 min vs 45+ min', educmark: true, chatgpt: false },
];

const faqItems = [
    {
        question: '¿EducMark usa ChatGPT por dentro?',
        answer: 'EducMark utiliza modelos de inteligencia artificial avanzados (incluyendo GPT-4o de OpenAI), pero la diferencia clave es que estos modelos están entrenados y configurados específicamente con las Bases Curriculares chilenas, los 2.000+ Objetivos de Aprendizaje reales del MINEDUC, y principios de neuroeducación de Céspedes y Maturana. No es simplemente "ChatGPT con un prompt": es un sistema especializado que genera planificaciones, presentaciones y evaluaciones validadas curricularmente.',
    },
    {
        question: '¿Puedo usar ChatGPT Y EducMark juntos?',
        answer: 'Sí, y de hecho muchos profesores lo hacen. ChatGPT es excelente para tareas creativas como generar ideas de actividades, crear listas de vocabulario, o explicar conceptos complejos de forma simple. EducMark, en cambio, se encarga del trabajo pesado: la planificación formal alineada al currículum, la presentación con diapositivas editables, el quiz autocorregible y la corrección de pruebas. Usar ambas herramientas es una estrategia inteligente.',
    },
    {
        question: '¿Qué niveles cubre EducMark?',
        answer: 'EducMark cubre desde 1° Básico hasta 4° Medio en educación regular (científico-humanista). Cada nivel tiene sus OA específicos cargados y validados directamente de las Bases Curriculares vigentes. Actualmente no incluye cobertura para Pre-básica (NT1/NT2) ni Educación Técnico Profesional (TP).',
    },
    {
        question: '¿Qué pasa si el MINEDUC actualiza las Bases Curriculares?',
        answer: 'Nuestro equipo monitorea activamente las actualizaciones del MINEDUC. Cuando hay cambios en las Bases Curriculares, Programas de Estudio o marcos normativos, actualizamos la base de datos de OA de EducMark. Esto significa que siempre generas planificaciones con los objetivos vigentes, sin tener que verificar manualmente si un OA cambió o fue reemplazado. Con ChatGPT, tú eres responsable de verificar cada OA.',
    },
    {
        question: '¿EducMark genera planificaciones para Pre-básica o TP?',
        answer: 'Actualmente EducMark cubre de 1° Básico a 4° Medio en educación regular. No incluye Pre-básica (NT1/NT2) ni Educación Técnico Profesional (TP) por ahora. Estamos evaluando expandir la cobertura en el futuro.',
    },
];

const EducMarkVsChatGPT: React.FC = () => {
    const router = useRouter();

    const handleCTA = () => {
        trackEvent('click_cta', { location: 'seo_vs_chatgpt' });
        router.push('/login?tab=register');
    };

    return (
        <div className="bg-[var(--background)] min-h-screen">
            {/* Navbar */}
            <nav className="border-b border-white/[0.06] bg-[var(--card)]/50 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
                    <a href="/" className="font-bold text-xl text-[var(--foreground)] flex items-center gap-2 hover:opacity-80 transition-opacity">
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
                    <span className="inline-block bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-semibold border border-primary/20 mb-6">
                        Comparación 2026
                    </span>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-heading leading-[1.1] tracking-tight mb-6">
                        <span className="text-foreground">EducMark vs ChatGPT</span>
                        <br />
                        <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                            para profesores chilenos
                        </span>
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        ChatGPT es una herramienta genial. Pero no conoce las Bases Curriculares de Chile,
                        no genera PPT, y no corrige pruebas. Para eso existe EducMark.
                    </p>
                </header>

                {/* El problema con ChatGPT */}
                <section className="mb-20">
                    <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8">
                        ¿Por qué ChatGPT no basta para planificar clases en Chile?
                    </h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        {[
                            {
                                title: 'Inventa Objetivos de Aprendizaje',
                                desc: 'ChatGPT genera OA que suenan reales pero no existen en las Bases Curriculares. Si tu UTP revisa, tendrás que rehacer todo.',
                            },
                            {
                                title: 'Solo genera texto plano',
                                desc: 'Copiar el output de ChatGPT, formatearlo como planificación, crear la PPT y el quiz toma +45 minutos. Con EducMark: 6 minutos, todo listo.',
                            },
                            {
                                title: 'No conoce el contexto chileno',
                                desc: 'No distingue entre OA de 3° Básico y 3° Medio, ni sabe qué es un DIA, SIMCE o Marco para la Buena Enseñanza.',
                            },
                            {
                                title: 'Cada vez que lo usas, partes de cero',
                                desc: 'No recuerda tu asignatura, nivel ni estilo. EducMark ya sabe todo eso y genera consistentemente.',
                            },
                        ].map((item, i) => (
                            <div key={i} className="rounded-2xl border border-white/[0.06] bg-card/50 p-6">
                                <h3 className="font-bold text-foreground mb-2">{item.title}</h3>
                                <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Comparison Table */}
                <section className="mb-20">
                    <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8 text-center">
                        Comparación directa
                    </h2>
                    <div className="rounded-2xl border border-white/10 overflow-hidden">
                        <div className="grid grid-cols-3 bg-card/80 border-b border-white/10 px-4 py-3">
                            <span className="text-sm font-semibold text-muted-foreground">Característica</span>
                            <span className="text-sm font-semibold text-primary text-center">EducMark</span>
                            <span className="text-sm font-semibold text-muted-foreground text-center">ChatGPT</span>
                        </div>
                        {rows.map((row, i) => (
                            <div key={i} className={`grid grid-cols-3 px-4 py-3 ${i % 2 === 0 ? 'bg-white/[0.02]' : ''} border-b border-white/[0.04]`}>
                                <span className="text-sm text-foreground/80">{row.feature}</span>
                                <div className="flex justify-center">
                                    {row.educmark
                                        ? <div className="w-6 h-6 rounded-full bg-emerald-500/15 flex items-center justify-center"><Check size={14} className="text-emerald-400" /></div>
                                        : <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center"><X size={14} className="text-muted-foreground/40" /></div>
                                    }
                                </div>
                                <div className="flex justify-center">
                                    {row.chatgpt
                                        ? <div className="w-6 h-6 rounded-full bg-red-500/15 flex items-center justify-center"><X size={14} className="text-red-400" /></div>
                                        : <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center"><X size={14} className="text-muted-foreground/40" /></div>
                                    }
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Ejemplo real */}
                <section className="mb-20">
                    <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                        Ejemplo real: planificación de Lenguaje 5° Básico
                    </h2>
                    <p className="text-muted-foreground leading-relaxed mb-8">
                        Veamos qué pasa cuando un profesor de Lenguaje necesita planificar una clase para el
                        <strong className="text-foreground"> OA 4 de Lenguaje y Comunicación, 5° Básico</strong>:
                        «Analizar aspectos relevantes de las narraciones leídas para profundizar su
                        comprensión». Este es uno de los OA más trabajados en el segundo ciclo
                        básico y un excelente caso para comparar ambas herramientas.
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* ChatGPT column */}
                        <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.04] p-6">
                            <h3 className="font-bold text-red-400 mb-4 text-lg">Con ChatGPT</h3>
                            <ol className="space-y-3 text-sm text-muted-foreground">
                                <li className="flex gap-3">
                                    <span className="text-red-400 font-bold shrink-0">1.</span>
                                    <span>Escribes un prompt largo explicando el OA, el nivel, el formato que necesitas y el contexto chileno. <strong className="text-foreground">~5 minutos</strong> redactando el prompt.</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="text-red-400 font-bold shrink-0">2.</span>
                                    <span>ChatGPT genera un texto plano con una estructura genérica de inicio-desarrollo-cierre. El OA que cita puede no ser el exacto de las Bases Curriculares. <strong className="text-foreground">Debes verificar manualmente.</strong></span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="text-red-400 font-bold shrink-0">3.</span>
                                    <span>Copias el texto a Word o Google Docs. Lo formateas con encabezados, tablas, logos del colegio. <strong className="text-foreground">~15 minutos</strong> de formato.</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="text-red-400 font-bold shrink-0">4.</span>
                                    <span>Necesitas una presentación para la clase. ChatGPT no genera diapositivas. Abres PowerPoint y creas todo desde cero. <strong className="text-foreground">~15 minutos más.</strong></span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="text-red-400 font-bold shrink-0">5.</span>
                                    <span>Para evaluar, creas un quiz manualmente en Google Forms o en papel. <strong className="text-foreground">~10 minutos adicionales.</strong></span>
                                </li>
                            </ol>
                            <div className="mt-4 pt-4 border-t border-red-500/10">
                                <p className="text-red-400 font-bold text-lg">Total: 45–60 minutos</p>
                                <p className="text-muted-foreground text-xs mt-1">Y aún debes verificar que el OA sea correcto</p>
                            </div>
                        </div>

                        {/* EducMark column */}
                        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-6">
                            <h3 className="font-bold text-emerald-400 mb-4 text-lg">Con EducMark</h3>
                            <ol className="space-y-3 text-sm text-muted-foreground">
                                <li className="flex gap-3">
                                    <span className="text-emerald-400 font-bold shrink-0">1.</span>
                                    <span>Seleccionas <strong className="text-foreground">Lenguaje → 5° Básico → OA 4</strong> directamente del menú. El OA real ya está cargado. <strong className="text-foreground">~30 segundos.</strong></span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="text-emerald-400 font-bold shrink-0">2.</span>
                                    <span>Personalizas: cantidad de horas, si hay estudiantes NEE, estilo de actividades. <strong className="text-foreground">~1 minuto.</strong></span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="text-emerald-400 font-bold shrink-0">3.</span>
                                    <span>Haces clic en «Generar». EducMark produce <strong className="text-foreground">3 documentos simultáneamente</strong>: planificación completa con formato UTP, presentación con diapositivas editables, y quiz interactivo autocorregible. Todo en HTML editable. <strong className="text-foreground">~4 minutos de generación.</strong></span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="text-emerald-400 font-bold shrink-0">4.</span>
                                    <span>Descargas los 3 archivos. La planificación ya tiene los indicadores de evaluación, las habilidades del siglo XXI, y la estructura inicio-desarrollo-cierre con tiempos estimados.</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="text-emerald-400 font-bold shrink-0">5.</span>
                                    <span>Si tienes estudiantes con NEE, EducMark genera automáticamente un documento PACI adicional con adaptaciones según Decreto 83.</span>
                                </li>
                            </ol>
                            <div className="mt-4 pt-4 border-t border-emerald-500/10">
                                <p className="text-emerald-400 font-bold text-lg">Total: 6 minutos</p>
                                <p className="text-muted-foreground text-xs mt-1">Planificación + Presentación + Quiz + PACI (si aplica), todo alineado al currículum</p>
                            </div>
                        </div>
                    </div>

                    <p className="text-muted-foreground leading-relaxed mt-6 text-sm">
                        La diferencia no es solo de tiempo: es de <strong className="text-foreground">calidad curricular</strong>.
                        La planificación de EducMark incluye los indicadores de evaluación sugeridos por el MINEDUC,
                        los ejes temáticos correctos, y actividades diseñadas con principios de neuroeducación
                        (Céspedes &amp; Maturana) que favorecen el aprendizaje significativo. ChatGPT, por muy bueno que sea,
                        no tiene acceso a esta información especializada.
                    </p>
                </section>

                {/* Lo que ChatGPT no puede hacer */}
                <section className="mb-20">
                    <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                        Lo que ChatGPT no puede hacer (y EducMark sí)
                    </h2>
                    <p className="text-muted-foreground leading-relaxed mb-8">
                        ChatGPT es un modelo de lenguaje generalista. EducMark es una plataforma especializada
                        para docentes chilenos. Estas son las capacidades que solo EducMark ofrece:
                    </p>

                    <div className="space-y-6">
                        {[
                            {
                                icon: Presentation,
                                title: 'Generar presentaciones editables con diapositivas reales',
                                desc: 'EducMark genera presentaciones completas con diapositivas estructuradas: portada, objetivos de la clase, desarrollo del contenido, actividades grupales, y cierre reflexivo. Cada diapositiva tiene diseño profesional y puedes editarla directamente en tu navegador. ChatGPT solo puede describir qué pondría en cada diapositiva, pero no genera el archivo listo.',
                                color: 'text-blue-400',
                                bg: 'bg-blue-500/[0.06]',
                                border: 'border-blue-500/15',
                            },
                            {
                                icon: BookOpen,
                                title: 'Crear quiz interactivos autocorregibles',
                                desc: 'Cada clase generada incluye un quiz interactivo con preguntas de selección múltiple, verdadero/falso y respuesta corta. Los estudiantes responden en línea y la corrección es automática e instantánea. Con ChatGPT tendrías que copiar las preguntas a Google Forms, configurar las respuestas correctas, y compartir el link manualmente.',
                                color: 'text-violet-400',
                                bg: 'bg-violet-500/[0.06]',
                                border: 'border-violet-500/15',
                            },
                            {
                                icon: ScanLine,
                                title: 'Corregir pruebas con escáner OMR desde el celular',
                                desc: 'EducMark incluye un escáner de hojas de respuesta tipo ZipGrade. Generas la hoja de respuestas, tus estudiantes la marcan con lápiz, y tú la escaneas con la cámara del celular. En segundos obtienes las calificaciones, el análisis de ítems, y qué preguntas tuvieron más errores. Todo esto es imposible con ChatGPT.',
                                color: 'text-amber-400',
                                bg: 'bg-amber-500/[0.06]',
                                border: 'border-amber-500/15',
                            },
                            {
                                icon: FileText,
                                title: 'Generar adaptaciones NEE/DUA y documentos PACI (Decreto 83)',
                                desc: 'Cuando indicas que tienes estudiantes con Necesidades Educativas Especiales, EducMark genera automáticamente un Plan de Adecuación Curricular Individual (PACI) según el Decreto 83/2015. Incluye adaptaciones de acceso, adaptaciones metodológicas, adaptaciones de evaluación, y estrategias DUA (Diseño Universal para el Aprendizaje). ChatGPT no conoce la normativa chilena de inclusión educativa en este nivel de detalle.',
                                color: 'text-emerald-400',
                                bg: 'bg-emerald-500/[0.06]',
                                border: 'border-emerald-500/15',
                            },
                            {
                                icon: Check,
                                title: 'Conocer los 2.000+ OA reales de las Bases Curriculares',
                                desc: 'EducMark tiene indexados más de 2.000 Objetivos de Aprendizaje oficiales del MINEDUC, desde NT1 hasta 4° Medio, incluyendo todas las asignaturas y especialidades TP. Cada OA tiene sus indicadores de evaluación, ejes temáticos y habilidades asociadas. Cuando seleccionas un OA en EducMark, sabes que es el OA real y vigente. ChatGPT, en cambio, genera OA a partir de su entrenamiento general y frecuentemente inventa objetivos que no existen o mezcla OA de distintos niveles.',
                                color: 'text-pink-400',
                                bg: 'bg-pink-500/[0.06]',
                                border: 'border-pink-500/15',
                            },
                        ].map((item, i) => (
                            <div key={i} className={`rounded-2xl border ${item.border} ${item.bg} p-6`}>
                                <div className="flex items-start gap-4">
                                    <div className={`${item.color} mt-1 shrink-0`}>
                                        <item.icon size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-foreground mb-2">{item.title}</h3>
                                        <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* El costo real */}
                <section className="mb-20">
                    <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                        El costo real de usar ChatGPT para planificar
                    </h2>
                    <p className="text-muted-foreground leading-relaxed mb-8">
                        El tiempo es el recurso más escaso de un profesor. Hagamos la matemática
                        real de cuánto tiempo inviertes en un año escolar usando cada herramienta.
                    </p>

                    <div className="rounded-2xl border border-white/10 bg-card/50 p-6 md:p-8 mb-8">
                        <div className="flex items-center gap-3 mb-6">
                            <Clock size={24} className="text-primary" />
                            <h3 className="font-bold text-foreground text-lg">Tiempo por clase: el desglose</h3>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6 mb-8">
                            <div>
                                <h4 className="font-semibold text-red-400 mb-3">ChatGPT: 45–60 min por clase</h4>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    <li className="flex justify-between"><span>Redactar el prompt</span> <span className="text-foreground font-medium">5 min</span></li>
                                    <li className="flex justify-between"><span>Verificar y corregir el OA</span> <span className="text-foreground font-medium">5 min</span></li>
                                    <li className="flex justify-between"><span>Editar y formatear planificación</span> <span className="text-foreground font-medium">15 min</span></li>
                                    <li className="flex justify-between"><span>Crear PPT manualmente</span> <span className="text-foreground font-medium">15 min</span></li>
                                    <li className="flex justify-between"><span>Crear quiz / evaluación</span> <span className="text-foreground font-medium">10 min</span></li>
                                    <li className="flex justify-between border-t border-white/10 pt-2 mt-2"><span className="font-semibold text-red-400">Total por clase</span> <span className="text-red-400 font-bold">~50 min</span></li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-semibold text-emerald-400 mb-3">EducMark: 6 min por clase</h4>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    <li className="flex justify-between"><span>Seleccionar OA del menú</span> <span className="text-foreground font-medium">0.5 min</span></li>
                                    <li className="flex justify-between"><span>Personalizar opciones</span> <span className="text-foreground font-medium">1 min</span></li>
                                    <li className="flex justify-between"><span>Generación automática (3 docs)</span> <span className="text-foreground font-medium">4 min</span></li>
                                    <li className="flex justify-between"><span>Revisar y descargar</span> <span className="text-foreground font-medium">0.5 min</span></li>
                                    <li className="flex justify-between"><span>&nbsp;</span> <span>&nbsp;</span></li>
                                    <li className="flex justify-between border-t border-white/10 pt-2 mt-2"><span className="font-semibold text-emerald-400">Total por clase</span> <span className="text-emerald-400 font-bold">~6 min</span></li>
                                </ul>
                            </div>
                        </div>

                        <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5">
                            <h4 className="font-semibold text-foreground mb-4">Cálculo anual (profesor típico)</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                                <div className="rounded-lg bg-white/[0.03] p-4">
                                    <p className="text-3xl font-bold text-foreground">200</p>
                                    <p className="text-xs text-muted-foreground mt-1">clases por año<br />(5/semana x 40 semanas)</p>
                                </div>
                                <div className="rounded-lg bg-red-500/[0.06] p-4">
                                    <p className="text-3xl font-bold text-red-400">167 hrs</p>
                                    <p className="text-xs text-muted-foreground mt-1">con ChatGPT<br />(200 x 50 min)</p>
                                </div>
                                <div className="rounded-lg bg-emerald-500/[0.06] p-4">
                                    <p className="text-3xl font-bold text-emerald-400">20 hrs</p>
                                    <p className="text-xs text-muted-foreground mt-1">con EducMark<br />(200 x 6 min)</p>
                                </div>
                            </div>
                            <div className="mt-5 text-center rounded-xl bg-primary/[0.08] border border-primary/20 p-4">
                                <p className="text-2xl md:text-3xl font-bold text-primary">Ahorras ~147 horas al año</p>
                                <p className="text-muted-foreground text-sm mt-1">
                                    Eso equivale a <strong className="text-foreground">18 días laborales completos</strong> que recuperas
                                    para tu vida personal, preparar material diferenciado, o simplemente descansar.
                                </p>
                            </div>
                        </div>
                    </div>

                    <p className="text-muted-foreground text-sm leading-relaxed">
                        Y esto es solo considerando la planificación. Si sumas el tiempo de corrección
                        de pruebas que ahorras con el escáner OMR de EducMark (aproximadamente 2 horas por
                        prueba corregida), el ahorro total supera fácilmente las <strong className="text-foreground">200
                        horas anuales</strong>. El plan Copihue de EducMark cuesta menos que una hora de clases
                        particulares al mes. La ecuación es clara.
                    </p>
                </section>

                {/* When ChatGPT IS good */}
                <section className="mb-20">
                    <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                        ¿Cuándo sí usar ChatGPT?
                    </h2>
                    <p className="text-muted-foreground leading-relaxed mb-6">
                        No queremos ser injustos: ChatGPT es una herramienta extraordinaria para muchas tareas
                        docentes. Es excelente para brainstorming de ideas creativas, generar listas de vocabulario
                        en inglés, explicar conceptos difíciles de forma simple para distintos niveles,
                        crear rúbricas genéricas, redactar comunicaciones a apoderados, o incluso
                        practicar conversaciones en otro idioma. También es útil para investigar
                        metodologías pedagógicas o pedir ideas de actividades innovadoras.
                    </p>
                    <p className="text-muted-foreground leading-relaxed mb-6">
                        Pero cuando necesitas una <strong className="text-foreground">planificación completa
                        alineada al currículum chileno</strong> con PPT y quiz incluidos, con OA verificados,
                        con adaptaciones NEE/DUA, y con formato listo para entregar a tu UTP, EducMark es
                        la herramienta especializada para eso. No es mejor ni peor que ChatGPT: es
                        una <strong className="text-foreground">herramienta diferente para un trabajo diferente</strong>.
                    </p>
                    <div className="rounded-2xl border border-primary/20 bg-primary/[0.04] p-6 text-center">
                        <p className="text-foreground font-semibold mb-1">La diferencia en una frase:</p>
                        <p className="text-muted-foreground italic">
                            «ChatGPT te da texto. EducMark te da la clase lista.»
                        </p>
                    </div>
                </section>

                {/* FAQ Section */}
                <section className="mb-20">
                    <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8 text-center">
                        Preguntas frecuentes
                    </h2>
                    <div className="space-y-4">
                        {faqItems.map((item, i) => (
                            <details key={i} className="group rounded-2xl border border-white/[0.06] bg-card/50 overflow-hidden">
                                <summary className="flex items-center justify-between cursor-pointer p-6 text-foreground font-semibold hover:bg-white/[0.02] transition-colors">
                                    <span className="pr-4">{item.question}</span>
                                    <ArrowRight size={18} className="text-muted-foreground shrink-0 transition-transform group-open:rotate-90" />
                                </summary>
                                <div className="px-6 pb-6 pt-0">
                                    <p className="text-muted-foreground text-sm leading-relaxed">{item.answer}</p>
                                </div>
                            </details>
                        ))}
                    </div>
                </section>

                {/* CTA */}
                <section className="text-center py-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                        Prueba EducMark gratis
                    </h2>
                    <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                        3 clases completas gratis. Sin tarjeta. Genera tu primera planificación + PPT + quiz en 6 minutos.
                    </p>
                    <Button
                        onClick={handleCTA}
                        variant="primary"
                        className="h-auto py-4 px-10 !rounded-full text-lg font-semibold"
                    >
                        Probar Gratis
                        <ArrowRight size={20} className="ml-2" />
                    </Button>
                    <p className="text-muted-foreground/60 text-sm mt-4">
                        Sin tarjeta de crédito · Acceso inmediato · Garantía 7 días
                    </p>
                </section>
            </main>

            {/* Cross-links SEO */}
            <section className="py-16 border-t border-white/[0.06]">
                <div className="max-w-4xl mx-auto px-6">
                    <h2 className="text-2xl font-bold text-foreground mb-6 text-center">Recursos Relacionados</h2>
                    <div className="grid md:grid-cols-3 gap-4">
                        {[
                            { title: 'EducMark vs ChatLPO', desc: 'ChatLPO cuesta $25.000/mes. EducMark genera plan + PPT + quiz por $13.900/mes.', href: '/educmark-vs-chatlpo' },
                            { title: 'EducMark vs Califica', desc: 'Plataforma genérica LATAM vs especialista Chile con RAG MINEDUC.', href: '/educmark-vs-califica' },
                            { title: 'EducMark vs Teachy', desc: 'Plataforma brasileña vs herramienta hecha para profesores chilenos.', href: '/educmark-vs-teachy' },
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

export default EducMarkVsChatGPT;
