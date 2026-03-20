'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/components/ui/UIComponents';
import { Check, X, ArrowRight, Minus } from 'lucide-react';
import { trackEvent } from '@/shared/lib/analytics';

type CellValue = true | false | 'partial';

interface ComparisonRow {
    feature: string;
    educmark: CellValue;
    edugami: CellValue;
}

const rows: ComparisonRow[] = [
    { feature: 'Genera planificaci\u00F3n + presentaci\u00F3n + quiz completos', educmark: true, edugami: false },
    { feature: 'Alineaci\u00F3n autom\u00E1tica a Bases Curriculares MINEDUC', educmark: true, edugami: 'partial' },
    { feature: 'Cubre todas las asignaturas (1\u00B0 B\u00E1sico a 4\u00B0 Medio)', educmark: true, edugami: false },
    { feature: 'Correcci\u00F3n autom\u00E1tica de evaluaciones', educmark: true, edugami: true },
    { feature: 'An\u00E1lisis de \u00EDtems con IA', educmark: true, edugami: true },
    { feature: 'App m\u00F3vil para correcci\u00F3n', educmark: false, edugami: true },
    { feature: 'Adaptaciones NEE/DUA y documento PACI', educmark: true, edugami: false },
    { feature: 'Precio transparente desde $13.900/mes', educmark: true, edugami: false },
    { feature: 'Generaci\u00F3n de distractores con IA', educmark: false, edugami: true },
    { feature: 'Profesor individual puede suscribirse directamente', educmark: true, edugami: false },
];

function renderCell(value: CellValue): React.ReactNode {
    if (value === true) {
        return (
            <div className="w-6 h-6 rounded-full bg-emerald-500/15 flex items-center justify-center">
                <Check size={14} className="text-emerald-400" />
            </div>
        );
    }
    if (value === 'partial') {
        return (
            <div className="w-6 h-6 rounded-full bg-amber-500/15 flex items-center justify-center">
                <Minus size={14} className="text-amber-400" />
            </div>
        );
    }
    return (
        <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center">
            <X size={14} className="text-muted-foreground/40" />
        </div>
    );
}

const EducMarkVsEdugami: React.FC = () => {
    const router = useRouter();

    const handleCTA = () => {
        trackEvent('click_cta', { location: 'seo_vs_edugami' });
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
                        Comparaci&oacute;n 2026
                    </span>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-heading leading-[1.1] tracking-tight mb-6">
                        <span className="text-foreground">EducMark vs Edugami</span>
                        <br />
                        <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                            para profesores chilenos
                        </span>
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        Edugami es una s&oacute;lida plataforma chilena de evaluaci&oacute;n digital, especialmente
                        en matem&aacute;ticas. Pero si necesitas generar la clase completa &mdash; planificaci&oacute;n,
                        presentaci&oacute;n y evaluaci&oacute;n &mdash; en todas las asignaturas, EducMark cubre
                        todo el ciclo docente.
                    </p>
                </header>

                {/* El problema */}
                <section className="mb-20">
                    <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8">
                        &iquest;Por qu&eacute; evaluaci&oacute;n digital no es suficiente?
                    </h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        {[
                            {
                                title: 'Evaluar no es planificar',
                                desc: 'Edugami te ayuda a crear y corregir evaluaciones digitales, pero antes de evaluar necesitas la clase: la planificaci\u00F3n, la presentaci\u00F3n y las actividades. EducMark genera todo eso en 6 minutos.',
                            },
                            {
                                title: 'Enfocado en matem\u00E1ticas',
                                desc: 'Edugami tiene su fortaleza en evaluaci\u00F3n de matem\u00E1ticas. EducMark cubre todas las asignaturas de 1\u00B0 B\u00E1sico a 4\u00B0 Medio: Lenguaje, Ciencias, Historia, Ingl\u00E9s y m\u00E1s.',
                            },
                            {
                                title: 'Modelo B2B: necesitas que tu colegio contrate',
                                desc: 'Edugami vende a colegios con cotizaci\u00F3n directa. EducMark permite que cualquier profesor se suscriba individualmente desde $13.900/mes.',
                            },
                            {
                                title: 'Son complementarios, no excluyentes',
                                desc: 'Primero planificas la clase (EducMark), luego puedes evaluar con herramientas especializadas (Edugami). La planificaci\u00F3n es el cimiento; la evaluaci\u00F3n es parte del ciclo.',
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
                        Comparaci&oacute;n directa
                    </h2>
                    <div className="rounded-2xl border border-white/10 overflow-hidden">
                        <div className="grid grid-cols-3 bg-card/80 border-b border-white/10 px-4 py-3">
                            <span className="text-sm font-semibold text-muted-foreground">Caracter&iacute;stica</span>
                            <span className="text-sm font-semibold text-primary text-center">EducMark</span>
                            <span className="text-sm font-semibold text-muted-foreground text-center">Edugami</span>
                        </div>
                        {rows.map((row, i) => (
                            <div key={i} className={`grid grid-cols-3 px-4 py-3 ${i % 2 === 0 ? 'bg-white/[0.02]' : ''} border-b border-white/[0.04]`}>
                                <span className="text-sm text-foreground/80">{row.feature}</span>
                                <div className="flex justify-center">
                                    {renderCell(row.educmark)}
                                </div>
                                <div className="flex justify-center">
                                    {renderCell(row.edugami)}
                                </div>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-muted-foreground/60 mt-3 text-center">
                        <Minus size={12} className="inline text-amber-400 mr-1" />
                        = soporte parcial
                    </p>
                </section>

                {/* When Edugami IS good */}
                <section className="mb-20">
                    <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                        &iquest;Cu&aacute;ndo s&iacute; usar Edugami?
                    </h2>
                    <p className="text-muted-foreground leading-relaxed mb-6">
                        Edugami es una excelente opci&oacute;n si tu colegio busca una plataforma de evaluaci&oacute;n
                        digital, especialmente para matem&aacute;ticas. Su correcci&oacute;n instant&aacute;nea y
                        reportes por estudiante son de gran calidad. Pero cuando necesitas <strong className="text-foreground">generar
                        la clase completa alineada al MINEDUC</strong> &mdash; planificaci&oacute;n, presentaci&oacute;n
                        y evaluaci&oacute;n &mdash; en todas las asignaturas, EducMark es la herramienta completa.
                    </p>
                    <div className="rounded-2xl border border-primary/20 bg-primary/[0.04] p-6 text-center">
                        <p className="text-foreground font-semibold mb-1">La diferencia en una frase:</p>
                        <p className="text-muted-foreground italic">
                            &laquo;Edugami eval&uacute;a. EducMark genera la clase y la eval&uacute;a.&raquo;
                        </p>
                    </div>
                </section>

                {/* CTA */}
                <section className="text-center py-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                        Prueba EducMark gratis
                    </h2>
                    <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                        3 clases completas gratis. Sin tarjeta. Genera tu primera planificaci&oacute;n + PPT + quiz en 6 minutos.
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
                        Sin tarjeta de cr&eacute;dito &middot; Acceso inmediato &middot; Garant&iacute;a 7 d&iacute;as
                    </p>
                </section>
            </main>

            {/* Cross-links SEO */}
            <section className="py-16 border-t border-white/[0.06]">
                <div className="max-w-4xl mx-auto px-6">
                    <h2 className="text-2xl font-bold text-foreground mb-6 text-center">Recursos Relacionados</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { title: 'EducMark vs ChatLPO', desc: 'ChatLPO tiene 30+ herramientas sueltas. EducMark tiene el flujo completo por 44% menos.', href: '/educmark-vs-chatlpo' },
                            { title: 'EducMark vs ChatGPT', desc: 'ChatGPT inventa OA. EducMark los conoce todos. Compara las diferencias.', href: '/educmark-vs-chatgpt' },
                            { title: 'EducMark vs Califica', desc: 'Plataforma LATAM genérica vs especialista en currículum chileno.', href: '/educmark-vs-califica' },
                            { title: 'EducMark vs Teachy', desc: 'Plataforma internacional vs herramienta hecha para profesores chilenos.', href: '/educmark-vs-teachy' },
                        ].map((link, i) => (
                            <a key={i} href={link.href} className="rounded-xl border border-white/[0.06] bg-card/50 p-5 hover:border-primary/30 hover:bg-card/80 transition-all block">
                                <h3 className="font-semibold text-foreground text-sm mb-1">{link.title}</h3>
                                <p className="text-xs text-muted-foreground">{link.desc}</p>
                            </a>
                        ))}
                    </div>
                </div>
            </section>

            <div className="max-w-4xl mx-auto px-6 py-6">
                <p className="text-xs text-muted-foreground/50 leading-relaxed">
                    Precios y funcionalidades de terceros verificados en marzo de 2026. Consulta los sitios oficiales para informacion actualizada. EducMark no tiene relacion comercial con las marcas mencionadas. Esta comparacion se basa en informacion publica.
                </p>
            </div>

            <footer className="border-t border-white/[0.06] py-10 px-6 text-center">
                <p className="text-muted-foreground text-sm">
                    &copy; {new Date().getFullYear()} EducMark Chile &middot; <a href="/" className="text-primary hover:underline">Volver al inicio</a>
                </p>
            </footer>
        </div>
    );
};

export default EducMarkVsEdugami;
