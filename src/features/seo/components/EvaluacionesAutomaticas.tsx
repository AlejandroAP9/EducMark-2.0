'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/components/ui/UIComponents';
import { ArrowRight, ScanLine, BarChart3, FileCheck, Smartphone } from 'lucide-react';
import { trackEvent } from '@/shared/lib/analytics';

const EvaluacionesAutomaticas: React.FC = () => {
    const router = useRouter();

    const handleCTA = () => {
        trackEvent('click_cta', { location: 'seo_evaluaciones' });
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
                    <span className="inline-block bg-amber-500/10 text-amber-400 px-4 py-1.5 rounded-full text-sm font-semibold border border-amber-500/20 mb-6">
                        Sin máquina, sin software extra
                    </span>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-heading leading-[1.1] tracking-tight mb-6">
                        <span className="text-foreground">Corrige pruebas</span>
                        <br />
                        <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                            con tu celular
                        </span>
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        Imprime la hoja de respuestas, tus alumnos marcan las burbujas,
                        escaneas con la cámara del celular y EducMark califica automáticamente.
                        Como ZipGrade, pero integrado con tu planificación.
                    </p>
                    <div className="mt-10">
                        <Button onClick={handleCTA} variant="primary" className="h-auto py-4 px-10 !rounded-full text-lg font-semibold">
                            Probar Corrección Automática
                            <ArrowRight size={20} className="ml-2" />
                        </Button>
                        <p className="text-muted-foreground/60 text-sm mt-3">Plan Araucaria o superior</p>
                    </div>
                </header>

                {/* How it works */}
                <section className="mb-20">
                    <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8 text-center">
                        ¿Cómo funciona?
                    </h2>
                    <div className="grid md:grid-cols-4 gap-6">
                        {[
                            { step: '1', icon: <FileCheck className="w-6 h-6 text-blue-400" />, title: 'Diseña la prueba', desc: 'Crea tu evaluación sumativa con el constructor de pruebas de EducMark.' },
                            { step: '2', icon: <ScanLine className="w-6 h-6 text-emerald-400" />, title: 'Imprime hojas OMR', desc: 'Genera hojas de respuesta con burbujas y QR único por alumno.' },
                            { step: '3', icon: <Smartphone className="w-6 h-6 text-amber-400" />, title: 'Escanea con el celular', desc: 'Apunta la cámara a la hoja. EducMark lee las burbujas automáticamente.' },
                            { step: '4', icon: <BarChart3 className="w-6 h-6 text-purple-400" />, title: 'Obtén resultados', desc: 'Calificaciones instantáneas + análisis de ítems + retroalimentación IA.' },
                        ].map((item, i) => (
                            <div key={i} className="text-center">
                                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                                    {item.icon}
                                </div>
                                <div className="text-xs text-primary font-bold mb-1">Paso {item.step}</div>
                                <h3 className="font-bold text-foreground mb-2 text-sm">{item.title}</h3>
                                <p className="text-muted-foreground text-xs leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Features */}
                <section className="mb-20">
                    <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8 text-center">
                        Más que solo calificar
                    </h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        {[
                            {
                                title: 'Análisis de ítems automático',
                                desc: 'Identifica qué preguntas fueron muy fáciles, muy difíciles o con distractores que no funcionan. Mejora tus evaluaciones iterativamente.',
                            },
                            {
                                title: 'Retroalimentación pedagógica IA',
                                desc: 'Para cada alumno, EducMark genera sugerencias de refuerzo basadas en los OA no logrados. No solo una nota: un diagnóstico.',
                            },
                            {
                                title: 'Cumple Ley 21.801',
                                desc: 'Las evaluaciones se imprimen en papel. Los alumnos no necesitan celular ni computador. 100% compatible con la restricción de dispositivos en aula.',
                            },
                            {
                                title: 'Funciona con cualquier celular',
                                desc: 'iPhone, Android, cualquier modelo con cámara. No necesitas app especial — funciona desde el navegador.',
                            },
                        ].map((item, i) => (
                            <div key={i} className="rounded-2xl border border-white/[0.06] bg-card/50 p-6">
                                <h3 className="font-bold text-foreground mb-2">{item.title}</h3>
                                <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Comparison */}
                <section className="mb-20 rounded-3xl border border-white/10 bg-card/50 p-8 md:p-10">
                    <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
                        Corrección manual vs EducMark OMR
                    </h2>
                    <div className="grid md:grid-cols-2 gap-8 text-center">
                        <div>
                            <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2">Corrección manual</p>
                            <p className="text-4xl font-bold text-foreground">2-3 horas</p>
                            <p className="text-muted-foreground text-sm">por curso de 35 alumnos</p>
                        </div>
                        <div>
                            <p className="text-sm text-amber-400 uppercase tracking-wider mb-2">Con EducMark OMR</p>
                            <p className="text-4xl font-bold text-amber-400">5 minutos</p>
                            <p className="text-muted-foreground text-sm">escaneo + calificación automática</p>
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="text-center py-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                        Deja de corregir a mano
                    </h2>
                    <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                        Corrección automática, análisis de ítems y retroalimentación IA.
                        Disponible en planes Araucaria y Cóndor.
                    </p>
                    <Button onClick={handleCTA} variant="primary" className="h-auto py-4 px-10 !rounded-full text-lg font-semibold">
                        Crear Mi Cuenta Gratis
                        <ArrowRight size={20} className="ml-2" />
                    </Button>
                    <p className="text-muted-foreground/60 text-sm mt-4">
                        Sin tarjeta de crédito · Acceso inmediato
                    </p>
                </section>
            </main>

            {/* Cross-links SEO */}
            <section className="py-16 border-t border-white/[0.06]">
                <div className="max-w-4xl mx-auto px-6">
                    <h2 className="text-2xl font-bold text-foreground mb-6 text-center">Recursos Relacionados</h2>
                    <div className="grid md:grid-cols-3 gap-4">
                        {[
                            { title: 'Generador de Clases Chile', desc: 'Crea clases completas con planificación, PPT y quiz alineados al currículum MINEDUC.', href: '/generador-clases-chile' },
                            { title: 'EducMark para Colegios', desc: 'Plan institucional con 20+ licencias, panel UTP y facturación centralizada.', href: '/colegios' },
                            { title: 'EducMark vs ChatGPT', desc: 'Por qué un generador especializado supera a ChatGPT para docentes chilenos.', href: '/educmark-vs-chatgpt' },
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

export default EvaluacionesAutomaticas;
