'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/components/ui/UIComponents';
import { ArrowRight, Shield, Lock, Eye, Server, Trash2, Building2 } from 'lucide-react';
import { trackEvent } from '@/shared/lib/analytics';

const PrivacidadEscolar: React.FC = () => {
    const router = useRouter();

    const handleCTA = () => {
        trackEvent('click_cta', { location: 'seo_privacidad_escolar' });
        window.open('https://wa.me/56995155799?text=Hola%2C%20tengo%20consultas%20sobre%20privacidad%20y%20seguridad%20de%20datos%20en%20EducMark', '_blank');
    };

    const handleDemo = () => {
        trackEvent('click_cta', { location: 'seo_privacidad_demo' });
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
                            Probar gratis
                        </button>
                        <Button onClick={handleCTA} className="text-sm">
                            Consultar
                        </Button>
                    </div>
                </div>
            </nav>

            <main className="max-w-5xl mx-auto px-6 py-12 md:py-20">
                {/* Hero */}
                <header className="text-center mb-20">
                    <span className="inline-block bg-emerald-500/10 text-emerald-400 px-4 py-1.5 rounded-full text-sm font-semibold border border-emerald-500/20 mb-6">
                        <Shield className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
                        Seguridad &amp; Privacidad
                    </span>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-heading leading-[1.1] tracking-tight mb-6">
                        <span className="text-foreground">Privacidad y Seguridad de</span>
                        <br />
                        <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                            Datos Escolares en EducMark
                        </span>
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        Su establecimiento necesita garant&iacute;as concretas antes de adoptar tecnolog&iacute;a.
                        As&iacute; protegemos los datos de su equipo docente &mdash; y por qu&eacute; no recopilamos datos de estudiantes.
                    </p>
                </header>

                {/* Ley 19.628 */}
                <section className="mb-16 rounded-3xl border border-white/10 bg-card/50 p-8 md:p-10">
                    <div className="flex items-start gap-4 mb-6">
                        <div className="shrink-0 w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                            <Shield className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-foreground mb-2">
                                Cumplimiento con la Ley 19.628
                            </h2>
                            <p className="text-muted-foreground leading-relaxed">
                                EducMark opera en conformidad con la Ley 19.628 sobre Protecci&oacute;n de la Vida Privada de Chile.
                                Esto significa que:
                            </p>
                        </div>
                    </div>
                    <ul className="space-y-3 ml-16">
                        {[
                            'Solo recopilamos datos con consentimiento expl&iacute;cito del usuario al registrarse.',
                            'Los datos personales se usan exclusivamente para el funcionamiento del servicio.',
                            'No vendemos, compartimos ni cedemos datos a terceros con fines comerciales.',
                            'Todo usuario puede solicitar la eliminaci&oacute;n completa de sus datos en cualquier momento.',
                            'Mantenemos registros de tratamiento de datos conforme a la normativa vigente.',
                        ].map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-foreground/80 text-sm leading-relaxed">
                                <Shield size={14} className="text-emerald-400 shrink-0 mt-1" />
                                <span dangerouslySetInnerHTML={{ __html: item }} />
                            </li>
                        ))}
                    </ul>
                </section>

                {/* Data Storage */}
                <section className="mb-16">
                    <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8 text-center">
                        Infraestructura de seguridad
                    </h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        {[
                            {
                                icon: <Server className="w-6 h-6 text-blue-400" />,
                                title: 'Supabase &mdash; SOC 2 Type II',
                                desc: 'Nuestra base de datos est&aacute; alojada en Supabase, plataforma certificada SOC 2 Type II. Esto garantiza controles de seguridad, disponibilidad y confidencialidad auditados por terceros independientes.',
                            },
                            {
                                icon: <Lock className="w-6 h-6 text-purple-400" />,
                                title: 'Cifrado SSL/TLS en tr&aacute;nsito',
                                desc: 'Toda comunicaci&oacute;n entre su navegador y nuestros servidores est&aacute; cifrada con TLS 1.2+. Los datos nunca viajan en texto plano, ni siquiera dentro de nuestra infraestructura.',
                            },
                            {
                                icon: <Building2 className="w-6 h-6 text-amber-400" />,
                                title: 'Aislamiento por establecimiento (RLS)',
                                desc: 'Cada colegio opera en un espacio aislado mediante Row Level Security (RLS) de PostgreSQL. Un establecimiento no puede acceder a los datos de otro, ni siquiera a nivel de base de datos.',
                            },
                            {
                                icon: <Shield className="w-6 h-6 text-emerald-400" />,
                                title: 'Autenticaci&oacute;n segura',
                                desc: 'Autenticaci&oacute;n basada en JWT con Supabase Auth. Contrase&ntilde;as hasheadas con bcrypt. Soporte para inicio de sesi&oacute;n con Google para mayor comodidad sin sacrificar seguridad.',
                            },
                        ].map((item, i) => (
                            <div key={i} className="rounded-2xl border border-white/[0.06] bg-card/50 p-6 flex gap-4">
                                <div className="shrink-0 w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                                    {item.icon}
                                </div>
                                <div>
                                    <h3 className="font-bold text-foreground mb-1" dangerouslySetInnerHTML={{ __html: item.title }} />
                                    <p className="text-muted-foreground text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: item.desc }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* What data we collect */}
                <section className="mb-16 rounded-3xl border border-white/10 bg-card/50 p-8 md:p-10">
                    <div className="flex items-start gap-4 mb-6">
                        <div className="shrink-0 w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                            <Eye className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-foreground mb-2">
                                &iquest;Qu&eacute; datos recopilamos?
                            </h2>
                            <p className="text-muted-foreground leading-relaxed">
                                EducMark recopila el m&iacute;nimo de datos necesarios para funcionar. Aplicamos el principio de <strong className="text-foreground">minimizaci&oacute;n de datos</strong>.
                            </p>
                        </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6 ml-0 md:ml-16">
                        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                            <h3 className="font-bold text-emerald-400 text-sm mb-3 uppercase tracking-wide">S&iacute; recopilamos</h3>
                            <ul className="space-y-2">
                                {[
                                    'Nombre y correo electr&oacute;nico del docente',
                                    'Planificaciones y materiales generados',
                                    'Datos de uso (clases generadas, fechas)',
                                    'Establecimiento asociado (plan institucional)',
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-2 text-foreground/80 text-sm">
                                        <Shield size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                                        <span dangerouslySetInnerHTML={{ __html: item }} />
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5">
                            <h3 className="font-bold text-red-400 text-sm mb-3 uppercase tracking-wide">No recopilamos</h3>
                            <ul className="space-y-2">
                                {[
                                    'Datos personales de estudiantes',
                                    'RUT, direcci&oacute;n o tel&eacute;fono de alumnos',
                                    'Calificaciones ni rendimiento individual',
                                    'Los estudiantes no tienen cuentas en EducMark',
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-2 text-foreground/80 text-sm">
                                        <Eye size={14} className="text-red-400 shrink-0 mt-0.5" />
                                        <span dangerouslySetInnerHTML={{ __html: item }} />
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </section>

                {/* AI Processing */}
                <section className="mb-16 rounded-3xl border border-white/10 bg-card/50 p-8 md:p-10">
                    <div className="flex items-start gap-4 mb-4">
                        <div className="shrink-0 w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                            <Lock className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-foreground mb-2">
                                Procesamiento con IA
                            </h2>
                            <p className="text-muted-foreground leading-relaxed">
                                EducMark usa inteligencia artificial para generar planificaciones, presentaciones y evaluaciones.
                                Es importante que su establecimiento sepa exactamente qu&eacute; datos se env&iacute;an a los modelos de IA:
                            </p>
                        </div>
                    </div>
                    <ul className="space-y-3 ml-16">
                        {[
                            '<strong class="text-foreground">Solo datos curriculares:</strong> Se env&iacute;an Objetivos de Aprendizaje (OA), nivel, asignatura y par&aacute;metros de clase. Nunca datos personales de estudiantes.',
                            '<strong class="text-foreground">Sin entrenamiento con sus datos:</strong> Los modelos de IA no se entrenan con el contenido generado para su colegio. Sus planificaciones no alimentan ning&uacute;n modelo.',
                            '<strong class="text-foreground">Propiedad del contenido:</strong> Las planificaciones generadas pertenecen al docente que las cre&oacute;. EducMark no reclama propiedad intelectual sobre el material generado.',
                            '<strong class="text-foreground">Almacenamiento seguro:</strong> Todo el contenido generado se almacena cifrado en Supabase, no en los servidores de los proveedores de IA.',
                        ].map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-foreground/80 text-sm leading-relaxed">
                                <Lock size={14} className="text-purple-400 shrink-0 mt-1" />
                                <span dangerouslySetInnerHTML={{ __html: item }} />
                            </li>
                        ))}
                    </ul>
                </section>

                {/* Institutional Controls */}
                <section className="mb-16">
                    <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8 text-center">
                        Controles institucionales
                    </h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            {
                                icon: <Building2 className="w-6 h-6 text-amber-400" />,
                                title: 'Gesti&oacute;n de licencias',
                                desc: 'El administrador UTP puede asignar, reasignar o revocar licencias docentes desde el panel de administraci&oacute;n.',
                            },
                            {
                                icon: <Eye className="w-6 h-6 text-blue-400" />,
                                title: 'Reportes de uso',
                                desc: 'Direcci&oacute;n y UTP pueden ver estad&iacute;sticas de uso: clases generadas, asignaturas cubiertas, frecuencia. Sin acceso al contenido individual.',
                            },
                            {
                                icon: <Lock className="w-6 h-6 text-purple-400" />,
                                title: 'Privacidad docente',
                                desc: 'El contenido de cada planificaci&oacute;n es privado del docente. UTP ve m&eacute;tricas agregadas, no el detalle de cada clase.',
                            },
                        ].map((item, i) => (
                            <div key={i} className="rounded-2xl border border-white/[0.06] bg-card/50 p-6 text-center">
                                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                                    {item.icon}
                                </div>
                                <h3 className="font-bold text-foreground mb-2" dangerouslySetInnerHTML={{ __html: item.title }} />
                                <p className="text-muted-foreground text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: item.desc }} />
                            </div>
                        ))}
                    </div>
                </section>

                {/* Data Deletion */}
                <section className="mb-16 rounded-3xl border border-white/10 bg-card/50 p-8 md:p-10">
                    <div className="flex items-start gap-4 mb-4">
                        <div className="shrink-0 w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                            <Trash2 className="w-6 h-6 text-red-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-foreground mb-2">
                                Derecho a eliminaci&oacute;n de datos
                            </h2>
                            <p className="text-muted-foreground leading-relaxed">
                                Cualquier docente puede solicitar la eliminaci&oacute;n completa de su cuenta y todos los datos asociados
                                en cualquier momento. Esto incluye:
                            </p>
                        </div>
                    </div>
                    <ul className="space-y-3 ml-16 mb-6">
                        {[
                            'Perfil de usuario y datos personales',
                            'Todas las planificaciones, presentaciones y evaluaciones generadas',
                            'Historial de uso y estad&iacute;sticas',
                            'Datos de suscripci&oacute;n y facturaci&oacute;n',
                        ].map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-foreground/80 text-sm">
                                <Trash2 size={14} className="text-red-400 shrink-0 mt-0.5" />
                                <span dangerouslySetInnerHTML={{ __html: item }} />
                            </li>
                        ))}
                    </ul>
                    <p className="text-muted-foreground text-sm ml-16">
                        La eliminaci&oacute;n se procesa en un plazo m&aacute;ximo de 30 d&iacute;as h&aacute;biles.
                        Para solicitar la eliminaci&oacute;n, contacte a nuestro equipo por WhatsApp o correo electr&oacute;nico.
                    </p>
                </section>

                {/* Contact CTA */}
                <section className="text-center py-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                        &iquest;Tiene consultas sobre seguridad?
                    </h2>
                    <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                        Nuestro equipo est&aacute; disponible para responder cualquier pregunta sobre privacidad,
                        seguridad de datos y cumplimiento normativo para su establecimiento.
                    </p>
                    <Button onClick={handleCTA} variant="primary" className="h-auto py-4 px-10 !rounded-full text-lg font-semibold">
                        Consultar por WhatsApp
                        <ArrowRight size={20} className="ml-2" />
                    </Button>
                    <p className="text-muted-foreground/60 text-sm mt-4">
                        WhatsApp: +56 9 9515 5799 &middot; Respuesta en menos de 24h
                    </p>
                </section>
            </main>

            {/* Cross-links SEO */}
            <section className="py-16 border-t border-white/[0.06]">
                <div className="max-w-4xl mx-auto px-6">
                    <h2 className="text-2xl font-bold text-foreground mb-6 text-center">Recursos Relacionados</h2>
                    <div className="grid md:grid-cols-3 gap-4">
                        {[
                            { title: 'EducMark para Colegios', desc: 'Plan institucional con 20+ licencias, panel UTP y facturaci&oacute;n centralizada.', href: '/colegios' },
                            { title: 'Corrección Automática de Pruebas', desc: 'Esc&aacute;ner OMR desde el celular con an&aacute;lisis de &iacute;tems y retroalimentaci&oacute;n IA.', href: '/evaluaciones-automaticas' },
                            { title: 'Planificaciones MINEDUC con IA', desc: '2.000+ OA indexados. Planificaciones alineadas a las Bases Curriculares en 6 minutos.', href: '/planificaciones-mineduc' },
                        ].map((link, i) => (
                            <a key={i} href={link.href} className="rounded-xl border border-white/[0.06] bg-card/50 p-5 hover:border-primary/30 hover:bg-card/80 transition-all block">
                                <h3 className="font-semibold text-foreground text-sm mb-1">{link.title}</h3>
                                <p className="text-xs text-muted-foreground" dangerouslySetInnerHTML={{ __html: link.desc }} />
                            </a>
                        ))}
                    </div>
                </div>
            </section>

            <footer className="border-t border-white/[0.06] py-10 px-6 text-center">
                <p className="text-muted-foreground text-sm">
                    &copy; {new Date().getFullYear()} EducMark Chile &middot; <a href="/" className="text-primary hover:underline">Volver al inicio</a>
                </p>
            </footer>
        </div>
    );
};

export default PrivacidadEscolar;
