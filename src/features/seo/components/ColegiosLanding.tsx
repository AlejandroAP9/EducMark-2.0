'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/components/ui/UIComponents';
import { ArrowRight, Users, BarChart3, Shield, Clock, Check, Building2, Brain, X } from 'lucide-react';
import { trackEvent } from '@/shared/lib/analytics';

const ColegiosLanding: React.FC = () => {
    const router = useRouter();

    const handleCTA = () => {
        trackEvent('click_cta', { location: 'seo_colegios' });
        window.open('https://wa.me/56995155799?text=Hola%2C%20me%20interesa%20el%20Plan%20Establecimiento%20de%20EducMark', '_blank');
    };

    const handleDemo = () => {
        trackEvent('click_cta', { location: 'seo_colegios_demo' });
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
                    <div className="flex items-center gap-3">
                        <button onClick={handleDemo} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                            Probar individual
                        </button>
                        <Button onClick={handleCTA} className="text-sm">
                            Contactar Ventas
                        </Button>
                    </div>
                </div>
            </nav>

            <main className="max-w-5xl mx-auto px-6 py-12 md:py-20">
                {/* Hero */}
                <header className="text-center mb-20">
                    <span className="inline-block bg-blue-500/10 text-blue-400 px-4 py-1.5 rounded-full text-sm font-semibold border border-blue-500/20 mb-6">
                        Plan Establecimiento
                    </span>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-heading leading-[1.1] tracking-tight mb-6">
                        <span className="text-foreground">EducMark para</span>
                        <br />
                        <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                            tu colegio completo
                        </span>
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        Cada profesor recibe el plan Cóndor completo: planificaciones, evaluaciones, retroalimentación pedagógica IA.
                        Panel de administración para Dirección y UTP con reportes de cobertura curricular.
                    </p>
                    <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                        <Button onClick={handleCTA} variant="primary" className="h-auto py-4 px-10 !rounded-full text-lg font-semibold">
                            Solicitar Demo Institucional
                            <ArrowRight size={20} className="ml-2" />
                        </Button>
                        <Button onClick={handleDemo} variant="outline" className="h-auto py-4 px-8 !rounded-full text-lg">
                            Probar como profesor
                        </Button>
                    </div>
                </header>

                {/* ROI for directors */}
                <section className="mb-20 rounded-3xl border border-white/10 bg-card/50 p-8 md:p-10">
                    <h2 className="text-2xl font-bold text-foreground mb-8 text-center">
                        El caso de negocio para su colegio
                    </h2>
                    <div className="grid md:grid-cols-3 gap-8 text-center">
                        <div>
                            <p className="text-4xl font-bold text-foreground mb-1">$3.0M</p>
                            <p className="text-sm text-muted-foreground">CLP/mes en tiempo docente dedicado a planificación manual (15 profesores × 27h/mes × $7.500/hora)</p>
                        </div>
                        <div>
                            <p className="text-4xl font-bold text-primary mb-1">$260K</p>
                            <p className="text-sm text-muted-foreground">CLP/mes — costo del Plan Establecimiento Pequeño (hasta 20 profesores)</p>
                        </div>
                        <div>
                            <p className="text-4xl font-bold text-emerald-400 mb-1">11x ROI</p>
                            <p className="text-sm text-muted-foreground">Retorno por cada peso invertido. 4.320 horas/año recuperadas para docencia efectiva</p>
                        </div>
                    </div>
                </section>

                {/* Features for institutions */}
                <section className="mb-20">
                    <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8 text-center">
                        Diseñado para equipos docentes
                    </h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        {[
                            { icon: <Users className="w-6 h-6 text-blue-400" />, title: 'Plan Cóndor completo por profesor', desc: '50 clases/mes por docente con planificaciones, presentaciones, quiz interactivos, evaluaciones y retroalimentación pedagógica IA.' },
                            { icon: <BarChart3 className="w-6 h-6 text-purple-400" />, title: 'Panel Dirección y UTP con reportes', desc: 'Cobertura curricular por departamento, resultados por curso, uso por profesor. Informes con gráficos listos para consejo de profesores.' },
                            { icon: <Brain className="w-6 h-6 text-pink-400" />, title: 'Retroalimentación pedagógica IA', desc: 'Análisis automático post-evaluación: fortalezas del curso, brechas de aprendizaje y sugerencias de remediación por OA.' },
                            { icon: <Shield className="w-6 h-6 text-emerald-400" />, title: 'Alineación MINEDUC garantizada', desc: 'Todas las planificaciones usan OA reales de las Bases Curriculares. Estandarización sin perder creatividad docente.' },
                            { icon: <Clock className="w-6 h-6 text-amber-400" />, title: 'Ahorro de 24h/mes por profesor', desc: 'Cada docente recupera 24+ horas mensuales. En un equipo de 15, son 360 horas mensuales reinvertidas en docencia.' },
                            { icon: <Building2 className="w-6 h-6 text-cyan-400" />, title: 'Facturación institucional', desc: 'Boleta o factura a nombre del establecimiento. Un solo pago mensual. Capacitación inicial y soporte prioritario incluidos.' },
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

                {/* Pricing */}
                <section className="mb-20">
                    <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4 text-center">
                        Precio institucional por tamaño de colegio
                    </h2>
                    <p className="text-muted-foreground mb-10 max-w-lg mx-auto text-center">
                        Todos los tramos incluyen el plan Cóndor completo por profesor + panel Dirección/UTP + reportes institucionales. Desde $9.600 por profesor.
                    </p>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                        {[
                            { name: 'Básico', profs: 'Hasta 10 profesores', price: '$150.000', perProf: '$15.000/prof', annual: '$1.500.000/año' },
                            { name: 'Pequeño', profs: 'Hasta 20 profesores', price: '$260.000', perProf: '$13.000/prof', annual: '$2.600.000/año', popular: true },
                            { name: 'Mediano', profs: 'Hasta 35 profesores', price: '$385.000', perProf: '$11.000/prof', annual: '$3.850.000/año' },
                            { name: 'Grande', profs: 'Hasta 50+ profesores', price: '$480.000', perProf: '$9.600/prof', annual: '$4.800.000/año' },
                        ].map((tier, i) => (
                            <div
                                key={i}
                                className={`rounded-2xl p-5 md:p-6 text-center transition-all ${
                                    tier.popular
                                        ? 'border-2 border-blue-400/40 bg-blue-500/10 shadow-[0_0_30px_rgba(59,130,246,0.15)] md:-translate-y-2'
                                        : 'border border-white/[0.08] bg-card/50'
                                }`}
                            >
                                {tier.popular && (
                                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Más elegido</span>
                                )}
                                <p className="text-lg font-bold text-white mt-1">{tier.name}</p>
                                <p className="text-xs text-muted-foreground mb-3">{tier.profs}</p>
                                <p className="text-3xl md:text-4xl font-bold text-white">{tier.price}</p>
                                <p className="text-sm text-muted-foreground">/mes</p>
                                <p className="text-xs text-blue-400 font-medium mt-1 mb-1">{tier.perProf}</p>
                                <p className="text-[11px] text-muted-foreground/60">{tier.annual}</p>
                            </div>
                        ))}
                    </div>

                    <div className="rounded-2xl border border-white/[0.06] bg-card/30 p-6 md:p-8 max-w-3xl mx-auto">
                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 text-center">Incluido en todos los tramos</h4>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
                            {[
                                '50 clases/mes por profesor (Plan Cóndor)',
                                'Evaluaciones + Lector OMR automático',
                                'Retroalimentación pedagógica IA',
                                'Panel Dirección y UTP con reportes',
                                'Cobertura curricular por departamento',
                                'Capacitación inicial para el equipo',
                                'Facturación institucional',
                                'Soporte prioritario por WhatsApp',
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-2 text-sm text-foreground/80">
                                    <Check size={14} className="text-blue-400 shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                        <div className="text-center">
                            <Button onClick={handleCTA} variant="primary" className="px-10 py-3 font-bold text-lg">
                                Solicitar Demo Institucional
                            </Button>
                            <p className="text-xs text-muted-foreground/40 mt-3">IVA incluido en todos los tramos</p>
                        </div>
                    </div>
                </section>

                {/* Objection handling — "¿Y qué harán en sus horas no lectivas?" */}
                <section className="mb-20">
                    <div className="rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-500/[0.04] to-orange-500/[0.02] p-8 md:p-10 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-amber-400/30 to-transparent" />
                        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3 text-center">
                            EducMark no elimina trabajo — lo transforma
                        </h2>
                        <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-8 leading-relaxed">
                            Las horas no lectivas no quedan vacías. El tiempo que antes se usaba en planificación mecánica
                            se reinvierte en trabajo pedagógico de mayor impacto:
                        </p>
                        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                            <div>
                                <h4 className="text-sm font-semibold text-red-400/80 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <X size={14} /> Antes (sin EducMark)
                                </h4>
                                <ul className="space-y-2">
                                    {[
                                        'Copiar y adaptar planificaciones en Word',
                                        'Buscar imágenes y armar PPTs genéricos',
                                        'Crear pruebas desde cero',
                                        'Corregir evaluaciones a mano',
                                        'Llenar planillas de cobertura curricular',
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                            <span className="text-red-400/60 shrink-0 mt-0.5">—</span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <Check size={14} /> Ahora (con EducMark)
                                </h4>
                                <ul className="space-y-2">
                                    {[
                                        'Revisar y personalizar el kit generado por IA',
                                        'Analizar resultados de evaluaciones por OA',
                                        'Diseñar estrategias de remediación con datos',
                                        'Atender estudiantes con NEE y crear PACI',
                                        'Reuniones de departamento con datos reales',
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                                            <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                        <p className="text-center text-sm text-amber-400/80 font-medium mt-8 pt-6 border-t border-white/[0.06] max-w-2xl mx-auto">
                            El profesor no trabaja menos — trabaja mejor. Y usted lo puede verificar con los reportes de cobertura curricular y resultados por curso.
                        </p>
                    </div>
                </section>

                {/* CTA */}
                <section className="text-center py-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                        ¿Listo para equipar a su equipo docente?
                    </h2>
                    <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                        Agende una demo de 15 minutos. Le mostramos cómo EducMark funciona para su colegio.
                    </p>
                    <Button onClick={handleCTA} variant="primary" className="h-auto py-4 px-10 !rounded-full text-lg font-semibold">
                        Contactar por WhatsApp
                        <ArrowRight size={20} className="ml-2" />
                    </Button>
                    <p className="text-muted-foreground/60 text-sm mt-4">
                        WhatsApp: +56 9 9515 5799 · Respuesta en menos de 24h
                    </p>
                </section>
            </main>

            {/* Cross-links SEO */}
            <section className="py-16 border-t border-white/[0.06]">
                <div className="max-w-4xl mx-auto px-6">
                    <h2 className="text-2xl font-bold text-foreground mb-6 text-center">Recursos Relacionados</h2>
                    <div className="grid md:grid-cols-3 gap-4">
                        {[
                            { title: 'Corrección Automática de Pruebas', desc: 'Escáner OMR desde el celular con análisis de ítems y retroalimentación IA.', href: '/evaluaciones-automaticas' },
                            { title: 'Planificaciones MINEDUC con IA', desc: '2.000+ OA indexados. Planificaciones alineadas a las Bases Curriculares en 6 minutos.', href: '/planificaciones-mineduc' },
                            { title: 'Generador de Clases Chile', desc: 'Kit completo: planificación + presentación + quiz con neuroeducación y adaptaciones DUA.', href: '/generador-clases-chile' },
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

export default ColegiosLanding;
