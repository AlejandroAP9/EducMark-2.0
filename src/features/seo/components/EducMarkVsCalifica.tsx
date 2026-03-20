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
    califica: CellValue;
}

const rows: ComparisonRow[] = [
    { feature: 'Planificaci\u00F3n alineada a Bases Curriculares MINEDUC', educmark: true, califica: 'partial' },
    { feature: 'RAG con 2.000+ OA chilenos indexados', educmark: true, califica: false },
    { feature: 'Genera planificaci\u00F3n + presentaci\u00F3n + quiz en un flujo', educmark: true, califica: false },
    { feature: 'Correcci\u00F3n OMR con c\u00E1mara del celular', educmark: true, califica: false },
    { feature: 'Adaptaciones NEE/DUA y documento PACI', educmark: true, califica: false },
    { feature: 'Plan gratuito con planificaciones ilimitadas', educmark: false, califica: true },
    { feature: 'Recursos variados (crucigramas, juegos, listas)', educmark: false, califica: true },
    { feature: 'Creado por un profesor chileno', educmark: true, califica: false },
    { feature: 'Precio mensual flexible desde $13.900', educmark: true, califica: false },
    { feature: 'Neuroeducaci\u00F3n (C\u00E9spedes & Maturana)', educmark: true, califica: false },
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

const EducMarkVsCalifica: React.FC = () => {
    const router = useRouter();

    const handleCTA = () => {
        trackEvent('click_cta', { location: 'seo_vs_califica' });
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
                        <span className="text-foreground">EducMark vs Califica</span>
                        <br />
                        <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                            para profesores chilenos
                        </span>
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        Califica es una buena plataforma para generar recursos educativos en Latinoam&eacute;rica.
                        Pero si necesitas planificaciones profundamente alineadas al curr&iacute;culum chileno,
                        con presentaci&oacute;n y evaluaci&oacute;n integradas en un solo flujo, EducMark fue
                        construido espec&iacute;ficamente para eso.
                    </p>
                </header>

                {/* El problema */}
                <section className="mb-20">
                    <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8">
                        &iquest;Por qu&eacute; una plataforma gen&eacute;rica para 5 pa&iacute;ses no alcanza?
                    </h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        {[
                            {
                                title: 'Gen\u00E9rica para LATAM, no especialista Chile',
                                desc: 'Califica cubre Per\u00FA, M\u00E9xico, Chile, Colombia y Ecuador. Cuando cubres 5 pa\u00EDses, ninguno recibe profundidad curricular real. EducMark tiene RAG con las Bases Curriculares MINEDUC completas.',
                            },
                            {
                                title: 'Recursos sueltos, no un flujo integrado',
                                desc: 'Califica genera planificaciones, r\u00FAbricas y juegos por separado. EducMark genera planificaci\u00F3n + presentaci\u00F3n + evaluaci\u00F3n en un flujo de 4 minutos.',
                            },
                            {
                                title: 'Fundada por ingeniero, no por profesor',
                                desc: 'Califica fue creada por un ingeniero industrial peruano. EducMark fue creado por Alejandro, profesor de Historia chileno que entiende la realidad del aula.',
                            },
                            {
                                title: 'Sin NEE/DUA ni PACI',
                                desc: 'EducMark genera adaptaciones NEE/DUA autom\u00E1ticas y documentos PACI seg\u00FAn Decreto 83/2015. Califica no contempla la normativa de inclusi\u00F3n chilena.',
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
                            <span className="text-sm font-semibold text-muted-foreground text-center">Califica</span>
                        </div>
                        {rows.map((row, i) => (
                            <div key={i} className={`grid grid-cols-3 px-4 py-3 ${i % 2 === 0 ? 'bg-white/[0.02]' : ''} border-b border-white/[0.04]`}>
                                <span className="text-sm text-foreground/80">{row.feature}</span>
                                <div className="flex justify-center">
                                    {renderCell(row.educmark)}
                                </div>
                                <div className="flex justify-center">
                                    {renderCell(row.califica)}
                                </div>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-muted-foreground/60 mt-3 text-center">
                        <Minus size={12} className="inline text-amber-400 mr-1" />
                        = soporte parcial
                    </p>
                </section>

                {/* When Califica IS good */}
                <section className="mb-20">
                    <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                        &iquest;Cu&aacute;ndo s&iacute; usar Califica?
                    </h2>
                    <p className="text-muted-foreground leading-relaxed mb-6">
                        Califica es una buena opci&oacute;n si necesitas variedad de recursos educativos para
                        distintos pa&iacute;ses latinoamericanos, o si buscas un plan gratuito para generar
                        planificaciones b&aacute;sicas. Su plan free con publicidad permite acceso ilimitado.
                        Pero cuando necesitas <strong className="text-foreground">planificaciones profundamente
                        alineadas al MINEDUC</strong> con presentaci&oacute;n, evaluaci&oacute;n y correcci&oacute;n
                        autom&aacute;tica, EducMark es la plataforma especializada.
                    </p>
                    <div className="rounded-2xl border border-primary/20 bg-primary/[0.04] p-6 text-center">
                        <p className="text-foreground font-semibold mb-1">La diferencia en una frase:</p>
                        <p className="text-muted-foreground italic">
                            &laquo;Califica cubre Latinoam&eacute;rica. EducMark domina Chile.&raquo;
                        </p>
                    </div>
                </section>

                {/* CTA */}
                <section className="text-center py-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                        Prueba EducMark gratis
                    </h2>
                    <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                        3 clases completas gratis. Sin tarjeta. Genera tu primera planificaci&oacute;n + PPT + quiz en 4 minutos.
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
                            { title: 'EducMark vs Edugami', desc: 'Evaluación digital vs generación de clases completas alineadas al currículum.', href: '/educmark-vs-edugami' },
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

            <footer className="border-t border-white/[0.06] py-10 px-6 text-center">
                <p className="text-muted-foreground text-sm">
                    &copy; {new Date().getFullYear()} EducMark Chile &middot; <a href="/" className="text-primary hover:underline">Volver al inicio</a>
                </p>
            </footer>
        </div>
    );
};

export default EducMarkVsCalifica;
