'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/components/ui/UIComponents';
import { Check, Sparkles } from 'lucide-react';

const LessonGeneratorLanding: React.FC = () => {
    const router = useRouter();

    return (
        <div className="bg-[var(--background)] min-h-screen">
            {/* Navbar Simple */}
            <nav className="border-b border-[var(--border)] bg-[var(--card)]/50 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
                    <div className="font-bold text-xl text-[var(--foreground)] flex items-center gap-2">
                        <span className="text-2xl">
                            <Sparkles className="w-6 h-6" />
                        </span> EducMark
                    </div>
                    <Button onClick={() => router.push('/auth')} className="text-sm">
                        Probar Gratis
                    </Button>
                </div>
            </nav>

            <main className="max-w-4xl mx-auto px-6 py-12 md:py-20">
                <header className="text-center mb-16">
                    <h1 className="text-4xl md:text-6xl font-black mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                        Planificaciones de Clase <br /> en Segundos con IA
                    </h1>
                    <p className="text-xl text-[var(--muted)] max-w-2xl mx-auto leading-relaxed">
                        Herramienta diseñada específicamente para profesores chilenos. Ahorra 10+ horas semanales automatizando tu burocracia docente.
                    </p>
                    <div className="mt-10 flex gap-4 justify-center">
                        <Button
                            onClick={() => router.push('/auth')}
                            className="text-lg px-8 py-4 h-auto shadow-[0_0_30px_rgba(168,85,247,0.4)]"
                        >
                            Empezar Ahora - Es Gratis
                        </Button>
                    </div>
                </header>

                <section className="grid md:grid-cols-2 gap-12 my-20">
                    <div className="space-y-6">
                        <h2 className="text-3xl font-bold text-[var(--foreground)]">Diseñado para el Currículum Nacional</h2>
                        <p className="text-[var(--muted)] leading-relaxed">
                            No más copiar y pegar OAs manualmente. EducMark conoce el currículum del MINEDUC para todas las asignaturas y niveles, desde 1° Básico hasta IV° Medio.
                        </p>
                        <ul className="space-y-4">
                            {[
                                "Alineación automática con Objetivos de Aprendizaje (OA)",
                                "Sugerencias de actividades DUA (Diseño Universal de Aprendizaje)",
                                "Evaluaciones formativas y sumativas integradas",
                                "Adaptación a necesidades educativas especiales (NEE)"
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <div className="bg-emerald-500/10 p-1 rounded-full mt-0.5">
                                        <Check size={16} className="text-emerald-400" />
                                    </div>
                                    <span className="text-[var(--foreground)]">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="bg-[var(--card)] p-2 rounded-2xl border border-[var(--border)] shadow-2xl skew-y-1 transform transition-transform hover:skew-y-0">
                        {/* Mock UI */}
                        <div className="w-full h-full bg-[#1a1b26] rounded-xl p-6 overflow-hidden relative">
                            <div className="flex gap-2 mb-4">
                                <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                                <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                            </div>
                            <div className="space-y-3 font-mono text-sm">
                                <div className="text-purple-400">Generando planificación para:</div>
                                <div className="text-white">Asignatura: <span className="text-yellow-300">Historia</span></div>
                                <div className="text-white">Nivel: <span className="text-blue-300">III° Medio</span></div>
                                <div className="text-gray-500">// Analizando bases curriculares...</div>
                                <div className="text-emerald-400 mt-2">✓ Actividad de inicio creada</div>
                                <div className="text-emerald-400">✓ Rúbrica de evaluación generada</div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="border-t border-[var(--border)] pt-16">
                    <h2 className="text-2xl font-bold mb-8 text-center text-[var(--foreground)]">Preguntas Frecuentes sobre el Generador</h2>
                    <div className="space-y-6 max-w-2xl mx-auto">
                        <details className="group bg-[var(--card)] rounded-xl border border-[var(--border)]">
                            <summary className="flex items-center justify-between p-6 cursor-pointer font-medium text-[var(--foreground)]">
                                ¿Sirve para el Portafolio Docente?
                                <span className="text-[var(--primary)] group-open:rotate-180 transition-transform">▼</span>
                            </summary>
                            <div className="px-6 pb-6 text-[var(--muted)] leading-relaxed">
                                Absolutamente. La estructura de nuestras planificaciones (Inicio, Desarrollo, Cierre, Indicadores) está alineada con los estándares requeridos para el portafolio y la evaluación docente en Chile.
                            </div>
                        </details>
                        <details className="group bg-[var(--card)] rounded-xl border border-[var(--border)]">
                            <summary className="flex items-center justify-between p-6 cursor-pointer font-medium text-[var(--foreground)]">
                                ¿Puedo editar las planificaciones?
                                <span className="text-[var(--primary)] group-open:rotate-180 transition-transform">▼</span>
                            </summary>
                            <div className="px-6 pb-6 text-[var(--muted)] leading-relaxed">
                                Sí. Una vez generada la planificación, puedes copiarla a Google Docs, Word o editarla directamente en nuestra plataforma antes de exportar. Es tu material y tienes control total.
                            </div>
                        </details>
                    </div>
                </section>
            </main>

            {/* Cross-links SEO */}
            <section className="py-16 border-t border-white/[0.06]">
                <div className="max-w-4xl mx-auto px-6">
                    <h2 className="text-2xl font-bold text-foreground mb-6 text-center">Recursos Relacionados</h2>
                    <div className="grid md:grid-cols-3 gap-4">
                        {[
                            { title: 'Planificaciones MINEDUC con IA', desc: 'Genera planificaciones con OA reales de las Bases Curriculares vigentes del MINEDUC.', href: '/planificaciones-mineduc' },
                            { title: 'EducMark vs ChatGPT', desc: 'Descubre por qué un generador especializado supera a ChatGPT para planificar clases.', href: '/educmark-vs-chatgpt' },
                            { title: 'Corrección Automática de Pruebas', desc: 'Escanea hojas de respuesta con tu celular y califica automáticamente con OMR.', href: '/evaluaciones-automaticas' },
                        ].map((link, i) => (
                            <a key={i} href={link.href} className="rounded-xl border border-white/[0.06] bg-card/50 p-5 hover:border-primary/30 hover:bg-card/80 transition-all block">
                                <h3 className="font-semibold text-foreground text-sm mb-1">{link.title}</h3>
                                <p className="text-xs text-muted-foreground">{link.desc}</p>
                            </a>
                        ))}
                    </div>
                </div>
            </section>

            <footer className="border-t border-[var(--border)] bg-[var(--card)] py-12 px-6 text-center">
                <p className="text-[var(--muted)] text-sm">
                    © {new Date().getFullYear()} EducMark Chile. Potenciando la educación con IA ética.
                </p>
            </footer>
        </div>
    );
};

export default LessonGeneratorLanding;
