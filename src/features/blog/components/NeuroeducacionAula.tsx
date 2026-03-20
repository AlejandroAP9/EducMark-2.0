'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, Calendar, Brain, CheckCircle2, Lightbulb, Heart, Users, Activity } from 'lucide-react';
import { Button } from '@/shared/components/ui/UIComponents';

const NeuroeducacionAula: React.FC = () => {
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
                            Neuroeducación
                        </span>
                        <span className="flex items-center gap-1">
                            <Calendar size={12} /> 14 de marzo, 2026
                        </span>
                        <span className="flex items-center gap-1">
                            <Clock size={12} /> 7 min de lectura
                        </span>
                    </div>
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold font-heading text-foreground tracking-tight leading-[1.1] mb-4">
                        Neuroeducación en el aula: guía práctica para docentes
                    </h1>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                        Lo que la ciencia del cerebro nos dice sobre cómo aprenden realmente los estudiantes,
                        y cómo puedes aplicar estos principios en tu aula sin necesitar un doctorado en neurociencia.
                    </p>
                </header>

                {/* Content */}
                <div className="prose prose-invert max-w-none space-y-8">
                    <section>
                        <h2 className="text-2xl font-bold text-foreground mb-3">¿Qué es la neuroeducación y por qué debería importarte?</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            La neuroeducación es el puente entre la neurociencia y la práctica pedagógica. No se trata
                            de convertir a los docentes en neurocientíficos, sino de usar lo que ya sabemos sobre cómo
                            funciona el cerebro para diseñar clases más efectivas.
                        </p>
                        <p className="text-muted-foreground leading-relaxed mt-3">
                            En Chile, autoras como Amanda Céspedes han sido pioneras en conectar la neurociencia
                            con la realidad del aula latinoamericana. Su trabajo, junto con los aportes de Humberto
                            Maturana sobre la biología del conocimiento, nos da un marco poderoso: <strong className="text-foreground">el
                            aprendizaje no es un acto puramente intelectual, sino un proceso biológico que depende
                            de las emociones, el contexto social y los ritmos naturales del cerebro</strong>.
                        </p>
                        <p className="text-muted-foreground leading-relaxed mt-3">
                            La buena noticia es que los principios de la neuroeducación no requieren equipos costosos
                            ni formación especializada. Son ajustes en la estructura de tus clases que respetan cómo
                            el cerebro procesa, retiene y conecta la información.
                        </p>
                    </section>

                    <section>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                                <Brain size={20} className="text-purple-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-foreground">1. El cerebro aprende por ciclos de atención</h2>
                        </div>
                        <p className="text-muted-foreground leading-relaxed">
                            La investigación en neurociencia cognitiva ha demostrado que la atención sostenida tiene
                            límites biológicos. En adolescentes, los ciclos de atención efectiva duran entre 15 y 20
                            minutos. En niños de Educación Básica, pueden ser incluso más cortos: 10 a 15 minutos.
                        </p>
                        <p className="text-muted-foreground leading-relaxed mt-3">
                            Esto no significa que los estudiantes "no pongan atención". Significa que su corteza
                            prefrontal, la zona del cerebro responsable de la atención voluntaria, necesita pausas
                            para consolidar la información antes de recibir más estímulos.
                        </p>
                        <p className="text-muted-foreground leading-relaxed mt-3">
                            <strong className="text-foreground">Aplicación práctica:</strong> divide tu clase de 90 minutos en
                            bloques de 15-20 minutos con transiciones activas entre ellos. Cada bloque debería tener
                            un foco claro y terminar con un momento de procesamiento: una pregunta, una reflexión breve
                            o un intercambio con un compañero. Amanda Céspedes llama a esto "respiraciones cognitivas":
                            momentos donde el cerebro consolida lo que acaba de recibir.
                        </p>
                        <div className="rounded-xl border border-purple-500/20 bg-purple-500/[0.04] p-4 mt-4">
                            <p className="text-sm text-muted-foreground">
                                <strong className="text-purple-400">Ejemplo de estructura:</strong> Bloque 1 (15 min): exposición del
                                concepto clave. Pausa activa (3 min): los estudiantes explican a su compañero lo que
                                entendieron. Bloque 2 (15 min): actividad práctica. Pausa activa (3 min): ticket de salida
                                rápido. Bloque 3 (15 min): aplicación o cierre metacognitivo.
                            </p>
                        </div>
                    </section>

                    <section>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                                <Heart size={20} className="text-rose-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-foreground">2. Inicio emocional: la puerta del aprendizaje</h2>
                        </div>
                        <p className="text-muted-foreground leading-relaxed">
                            La amígdala cerebral actúa como un filtro emocional: decide si la información que llega
                            es relevante o amenazante antes de que llegue a la corteza prefrontal donde ocurre el
                            pensamiento consciente. Si un estudiante llega al aula estresado, ansioso o emocionalmente
                            desregulado, la amígdala bloquea el aprendizaje. No es falta de voluntad: es biología.
                        </p>
                        <p className="text-muted-foreground leading-relaxed mt-3">
                            Por eso, los primeros 3 a 5 minutos de una clase son cruciales. Un inicio emocional
                            positivo activa el sistema de recompensa del cerebro (liberación de dopamina) y
                            "abre la puerta" al aprendizaje. Maturana lo expresaba así: <strong className="text-foreground">"el
                            aprendizaje ocurre en la convivencia"</strong>, es decir, en un espacio donde el estudiante se siente
                            legítimo y seguro.
                        </p>
                        <p className="text-muted-foreground leading-relaxed mt-3">
                            <strong className="text-foreground">Aplicación práctica:</strong> comienza cada clase con un
                            "activador emocional" breve. Puede ser una pregunta curiosa relacionada con el tema
                            ("¿Sabían que el océano tiene cascadas submarinas?"), una anécdota personal, un desafío
                            lúdico o simplemente un check-in emocional ("¿Cómo llegan hoy? Pulgares arriba, medio o abajo").
                        </p>
                        <ul className="space-y-2 mt-4">
                            {[
                                'Pregunta provocadora que conecte con la vida real del estudiante',
                                'Dato curioso o contra-intuitivo sobre el tema de la clase',
                                'Breve dinámica de conexión grupal (30 segundos)',
                                'Imagen o video corto (máximo 1 minuto) que genere curiosidad',
                                'Referencia al contexto local: noticias de Chile, eventos de la comunidad',
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-2 text-muted-foreground text-sm">
                                    <Lightbulb size={14} className="text-amber-400 shrink-0 mt-0.5" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </section>

                    <section>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                <Activity size={20} className="text-emerald-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-foreground">3. Estrategias concretas para el aula</h2>
                        </div>
                        <p className="text-muted-foreground leading-relaxed">
                            La neuroeducación no es teoría abstracta. Estas son estrategias que puedes implementar
                            desde tu próxima clase, basadas en evidencia neurocientífica:
                        </p>
                        <div className="space-y-4 mt-4">
                            {[
                                {
                                    title: 'Cierre metacognitivo (últimos 5 minutos)',
                                    desc: 'Pide a los estudiantes que escriban: "Lo más importante que aprendí hoy fue..." y "Una pregunta que me queda es...". Este ejercicio activa la memoria de trabajo y fortalece la consolidación. La neurociencia muestra que la reflexión consciente sobre el propio aprendizaje (metacognición) activa la corteza prefrontal y mejora la retención a largo plazo.',
                                },
                                {
                                    title: 'Trabajo colaborativo estructurado',
                                    desc: 'El cerebro es un órgano social. La interacción entre pares activa los sistemas de espejo neuronal y facilita la comprensión profunda. Pero el trabajo grupal debe ser estructurado: roles definidos, tiempo acotado y un producto concreto. El "piensen en parejas y compartan" (Think-Pair-Share) es una técnica simple y efectiva.',
                                },
                                {
                                    title: 'Pausas de movimiento (brain breaks)',
                                    desc: 'El movimiento físico aumenta el flujo sanguíneo al cerebro y libera BDNF (factor neurotrófico derivado del cerebro), una proteína que mejora la plasticidad sináptica. Una pausa de 2 minutos con movimiento cada 20 minutos puede mejorar significativamente la atención y el rendimiento cognitivo.',
                                },
                                {
                                    title: 'Práctica espaciada y recuperación activa',
                                    desc: 'En lugar de revisar un tema una vez y pasar al siguiente, incorpora revisiones breves de contenido anterior al inicio de cada clase. El efecto de espaciado y la práctica de recuperación son dos de los hallazgos más robustos de la ciencia cognitiva: recordar activamente fortalece las conexiones neuronales mucho más que releer o repasar pasivamente.',
                                },
                            ].map((item, i) => (
                                <div key={i} className="rounded-xl border border-white/[0.06] bg-card/50 p-5">
                                    <h3 className="font-bold text-foreground mb-2 flex items-center gap-2">
                                        <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                                        {item.title}
                                    </h3>
                                    <p className="text-muted-foreground text-sm leading-relaxed pl-7">
                                        {item.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                                <Users size={20} className="text-blue-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-foreground">4. DUA y neuroeducación: la conexión</h2>
                        </div>
                        <p className="text-muted-foreground leading-relaxed">
                            El Diseño Universal para el Aprendizaje (DUA) no es solo una exigencia del Decreto 83/2015
                            para estudiantes con Necesidades Educativas Especiales. Es, en esencia, una aplicación
                            directa de lo que la neurociencia nos dice sobre la diversidad cerebral.
                        </p>
                        <p className="text-muted-foreground leading-relaxed mt-3">
                            El DUA se basa en tres redes neuronales que participan en el aprendizaje:
                        </p>
                        <ul className="space-y-3 mt-4">
                            {[
                                {
                                    red: 'Redes de reconocimiento (el "qué" del aprendizaje)',
                                    desc: 'Procesan la información que llega. El DUA propone múltiples formas de representación: visual, auditiva, kinestésica. Esto no es un capricho pedagógico, sino un reflejo de cómo diferentes cerebros procesan la información de manera distinta.',
                                },
                                {
                                    red: 'Redes estratégicas (el "cómo" del aprendizaje)',
                                    desc: 'Planifican y ejecutan acciones. El DUA propone múltiples formas de acción y expresión: que un estudiante demuestre lo que aprendió escribiendo, hablando, dibujando o construyendo. Cada vía activa diferentes circuitos cerebrales.',
                                },
                                {
                                    red: 'Redes afectivas (el "por qué" del aprendizaje)',
                                    desc: 'Determinan la motivación y el compromiso. El DUA propone múltiples formas de implicación: conectar con intereses personales, ofrecer opciones, graduar el desafío. Esto está directamente conectado con el sistema dopaminérgico del cerebro.',
                                },
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-3 text-muted-foreground">
                                    <span className="bg-blue-500/20 text-blue-400 text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                                        {i + 1}
                                    </span>
                                    <div>
                                        <strong className="text-foreground">{item.red}:</strong>{' '}
                                        <span className="text-sm">{item.desc}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                        <p className="text-muted-foreground leading-relaxed mt-4">
                            Cuando planificas con DUA, no solo estás cumpliendo con la normativa chilena: estás
                            diseñando clases que respetan la diversidad neurológica natural de cualquier grupo
                            de estudiantes. Amanda Céspedes señala que <strong className="text-foreground">todos
                            los cerebros son diferentes</strong>, y que la "normalidad" es, en realidad, la diversidad.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-foreground mb-3">5. Cómo EducMark integra la neuroeducación</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Las planificaciones generadas por EducMark no son plantillas genéricas. Están diseñadas
                            con principios de neuroeducación integrados en su estructura:
                        </p>
                        <ul className="space-y-2 mt-4">
                            {[
                                'Estructura en bloques de 15-20 minutos con transiciones activas, respetando los ciclos de atención del cerebro',
                                'Inicio emocional en cada clase: activadores diseñados para generar curiosidad y activar la dopamina',
                                'Cierre metacognitivo con preguntas de reflexión que fortalecen la consolidación en memoria a largo plazo',
                                'Actividades colaborativas estructuradas que aprovechan la naturaleza social del aprendizaje',
                                'Diversificación de estrategias alineada al DUA: múltiples formas de representación, expresión e implicación',
                                'Adecuaciones NEE integradas con enfoque neuroeducativo, incluyendo generación automática de PACI según Decreto 83',
                                'Evaluación formativa continua con instancias variadas, no solo pruebas escritas al final de la unidad',
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-2 text-muted-foreground">
                                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                        <p className="text-muted-foreground leading-relaxed mt-4">
                            No necesitas ser experto en neurociencia para aplicar estos principios. EducMark los
                            incorpora automáticamente en cada planificación, para que puedas enfocarte en lo que
                            realmente importa: la relación con tus estudiantes y la experiencia en el aula.
                        </p>
                    </section>

                    {/* CTA */}
                    <div className="rounded-2xl border border-primary/20 bg-primary/[0.04] p-8 text-center mt-12">
                        <h3 className="text-xl font-bold text-foreground mb-2">
                            Planifica clases con neuroeducación integrada
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
                                href="/blog/5-errores-planificar-sin-alineacion-mineduc"
                                className="rounded-xl border border-white/[0.06] bg-card/50 p-5 hover:border-primary/30 transition-colors group"
                            >
                                <span className="text-xs text-primary font-medium">Currículo</span>
                                <h3 className="font-bold text-foreground mt-1 group-hover:text-primary transition-colors">
                                    5 errores comunes al planificar sin alineación MINEDUC
                                </h3>
                                <p className="text-muted-foreground text-sm mt-1">
                                    Los errores más frecuentes y cómo evitarlos automáticamente.
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
                            { title: 'Generador de Clases Chile', desc: 'Clases con neuroeducaci\u00f3n integrada: planificaci\u00f3n + presentaci\u00f3n + quiz en 6 minutos.', href: '/generador-clases-chile' },
                            { title: 'Planifica tu clase en 6 minutos', desc: 'El m\u00e9todo paso a paso que usan cientos de profesores chilenos con IA.', href: '/blog/planificar-clase-en-6-minutos' },
                            { title: 'Correcci\u00f3n Autom\u00e1tica de Pruebas', desc: 'Escanea hojas de respuesta con tu celular y obt\u00e9n an\u00e1lisis de \u00edtems con IA.', href: '/evaluaciones-automaticas' },
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

export default NeuroeducacionAula;
