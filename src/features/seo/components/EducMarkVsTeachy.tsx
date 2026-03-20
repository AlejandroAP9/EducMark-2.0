'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/components/ui/UIComponents';
import { Check, X, ArrowRight } from 'lucide-react';
import { trackEvent } from '@/shared/lib/analytics';

type RowType = {
    feature: string;
    educmark: boolean | 'partial';
    teachy: boolean | 'partial';
};

const rows: RowType[] = [
    { feature: 'RAG con Bases Curriculares MINEDUC completas', educmark: true, teachy: false },
    { feature: 'Alineación nativa al currículum chileno', educmark: true, teachy: 'partial' },
    { feature: 'Genera planificación + presentación + quiz en un flujo', educmark: true, teachy: 'partial' },
    { feature: 'Corrección OMR con cámara del celular', educmark: true, teachy: false },
    { feature: 'Adaptaciones NEE/DUA y documento PACI', educmark: true, teachy: false },
    { feature: 'Biblioteca de 1M+ materiales', educmark: false, teachy: true },
    { feature: 'App móvil', educmark: false, teachy: true },
    { feature: 'Precios en CLP con MercadoPago', educmark: true, teachy: false },
    { feature: 'Creado por profesor chileno', educmark: true, teachy: false },
    { feature: 'Educación intercultural (Aymara, Mapudungun)', educmark: true, teachy: false },
];

function renderCell(value: boolean | 'partial') {
    if (value === 'partial') {
        return (
            <div className="w-6 h-6 rounded-full bg-amber-500/15 flex items-center justify-center">
                <span className="text-amber-400 text-xs font-bold">~</span>
            </div>
        );
    }
    if (value) {
        return (
            <div className="w-6 h-6 rounded-full bg-emerald-500/15 flex items-center justify-center">
                <Check size={14} className="text-emerald-400" />
            </div>
        );
    }
    return (
        <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center">
            <X size={14} className="text-muted-foreground/40" />
        </div>
    );
}

const EducMarkVsTeachy: React.FC = () => {
    const router = useRouter();

    const handleCTA = () => {
        trackEvent('click_cta', { location: 'seo_vs_teachy' });
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
                        <span className="text-foreground">EducMark vs Teachy</span>
                        <br />
                        <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                            para profesores chilenos
                        </span>
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        Teachy tiene escala masiva con millones de profesores y una biblioteca impresionante.
                        Pero fue construida sobre el curr&iacute;culum brasile&ntilde;o (BNCC), no sobre las Bases
                        Curriculares MINEDUC. Para profesores chilenos, EducMark fue dise&ntilde;ado espec&iacute;ficamente
                        para tu realidad.
                    </p>
                </header>

                {/* El problema */}
                <section className="mb-20">
                    <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8">
                        &iquest;Por qu&eacute; una plataforma brasile&ntilde;a no sirve para Chile?
                    </h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        {[
                            {
                                title: 'Currículum brasileño, no chileno',
                                desc: 'Teachy se construyó sobre la BNCC de Brasil. Su adaptación al MINEDUC es superficial. EducMark tiene RAG con los 2.000+ OA de las Bases Curriculares indexados nativamente.',
                            },
                            {
                                title: 'Sin formato UTP chileno',
                                desc: 'Las planificaciones de Teachy no tienen el formato que las jefaturas técnicas chilenas esperan. EducMark genera documentos listos para entregar: con OA, indicadores, momentos de la clase y ejes temáticos.',
                            },
                            {
                                title: 'Precios en dólares',
                                desc: 'Teachy cobra en USD (~$10-20 USD/mes). EducMark tiene precios en CLP desde $13.900/mes y acepta MercadoPago, pensado para el sueldo docente chileno.',
                            },
                            {
                                title: 'Sin NEE/DUA ni PACI',
                                desc: 'EducMark genera adaptaciones NEE/DUA automáticas y documentos PACI según Decreto 83/2015. Teachy no contempla la normativa de inclusión chilena.',
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
                            <span className="text-sm font-semibold text-muted-foreground text-center">Teachy</span>
                        </div>
                        {rows.map((row, i) => (
                            <div key={i} className={`grid grid-cols-3 px-4 py-3 ${i % 2 === 0 ? 'bg-white/[0.02]' : ''} border-b border-white/[0.04]`}>
                                <span className="text-sm text-foreground/80">{row.feature}</span>
                                <div className="flex justify-center">
                                    {renderCell(row.educmark)}
                                </div>
                                <div className="flex justify-center">
                                    {renderCell(row.teachy)}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* When Teachy IS good */}
                <section className="mb-20">
                    <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                        &iquest;Cu&aacute;ndo s&iacute; usar Teachy?
                    </h2>
                    <p className="text-muted-foreground leading-relaxed mb-6">
                        Teachy es una buena opci&oacute;n si ense&ntilde;as en un colegio internacional con
                        curr&iacute;culum extranjero (IB, BNCC brasile&ntilde;o) o si valoras tener acceso a una
                        biblioteca masiva de materiales en m&uacute;ltiples idiomas. Pero si ense&ntilde;as en un
                        colegio chileno con curr&iacute;culum MINEDUC, <strong className="text-foreground">EducMark
                        es la &uacute;nica plataforma que conoce todos los OA</strong>, genera el formato que tu
                        UTP necesita y cobra en pesos chilenos.
                    </p>
                    <div className="rounded-2xl border border-primary/20 bg-primary/[0.04] p-6 text-center">
                        <p className="text-foreground font-semibold mb-1">La diferencia en una frase:</p>
                        <p className="text-muted-foreground italic">
                            &laquo;Teachy es para el mundo. EducMark es para Chile.&raquo;
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
                            { title: 'EducMark vs Edugami', desc: 'Evaluación digital vs generación de clases completas alineadas al currículum.', href: '/educmark-vs-edugami' },
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

export default EducMarkVsTeachy;
