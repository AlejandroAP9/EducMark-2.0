'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/components/ui/UIComponents';
import { Check, X, ArrowRight } from 'lucide-react';
import { trackEvent } from '@/shared/lib/analytics';

type RowType = {
    feature: string;
    educmark: boolean | 'partial' | string;
    chatlpo: boolean | 'partial' | string;
};

const rows: RowType[] = [
    { feature: 'Flujo integrado plan + presentación + quiz en 6 minutos', educmark: true, chatlpo: false },
    { feature: 'RAG con Bases Curriculares MINEDUC completas', educmark: true, chatlpo: false },
    { feature: 'Precio mensual', educmark: '$13.900', chatlpo: '$25.000' },
    { feature: 'Corrección OMR con cámara del celular', educmark: true, chatlpo: false },
    { feature: 'Adaptaciones NEE/DUA y documento PACI', educmark: true, chatlpo: false },
    { feature: '30+ herramientas IA individuales', educmark: false, chatlpo: true },
    { feature: 'Academia con cursos certificados', educmark: false, chatlpo: true },
    { feature: 'Soporte SEP/PIE', educmark: 'partial', chatlpo: true },
    { feature: 'Upload de archivos para análisis IA', educmark: false, chatlpo: true },
    { feature: 'Neuroeducación (Céspedes & Maturana)', educmark: true, chatlpo: false },
];

function renderCell(value: boolean | 'partial' | string, isEducmark: boolean) {
    if (typeof value === 'string' && value !== 'partial') {
        return (
            <span className={`text-sm font-semibold ${isEducmark ? 'text-emerald-400' : 'text-foreground/70'}`}>
                {value}
            </span>
        );
    }
    if (value === 'partial') {
        return (
            <div className="w-6 h-6 rounded-full bg-amber-500/15 flex items-center justify-center">
                <span className="text-amber-400 text-xs font-bold">~</span>
            </div>
        );
    }
    if (value === true) {
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

const EducMarkVsChatLPO: React.FC = () => {
    const router = useRouter();

    const handleCTA = () => {
        trackEvent('click_cta', { location: 'seo_vs_chatlpo' });
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
                        <span className="text-foreground">EducMark vs ChatLPO</span>
                        <br />
                        <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                            para profesores chilenos
                        </span>
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        ChatLPO es una buena plataforma chilena con muchas herramientas para docentes.
                        Pero si quieres generar planificaci&oacute;n + presentaci&oacute;n + evaluaci&oacute;n
                        en un solo flujo de 4 minutos, a un precio 44% menor, EducMark fue dise&ntilde;ado
                        exactamente para eso.
                    </p>
                </header>

                {/* El problema */}
                <section className="mb-20">
                    <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8">
                        &iquest;Por qu&eacute; 30 herramientas sueltas no reemplazan un flujo integrado?
                    </h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        {[
                            {
                                title: 'Herramientas sueltas vs flujo unificado',
                                desc: 'ChatLPO ofrece 30+ herramientas individuales. EducMark genera planificación + presentación + evaluación en UN solo flujo de 4 minutos. Menos clicks, más resultado.',
                            },
                            {
                                title: '44% más caro',
                                desc: 'ChatLPO cuesta $25.000/mes. EducMark Copihue cuesta $13.900/mes. Con el Plan Pionero Fundador, ese precio queda congelado para siempre.',
                            },
                            {
                                title: 'Sin corrección automática de pruebas',
                                desc: 'EducMark incluye escáner OMR: escanea hojas de respuesta con tu celular y obtén la nota + análisis de ítems al instante. ChatLPO no tiene corrección de pruebas físicas.',
                            },
                            {
                                title: 'Sin NEE/DUA ni PACI',
                                desc: 'EducMark genera adaptaciones NEE/DUA automáticas y documentos PACI según Decreto 83/2015. ChatLPO no contempla la generación automática de adecuaciones curriculares.',
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
                            <span className="text-sm font-semibold text-muted-foreground text-center">ChatLPO</span>
                        </div>
                        {rows.map((row, i) => (
                            <div key={i} className={`grid grid-cols-3 px-4 py-3 ${i % 2 === 0 ? 'bg-white/[0.02]' : ''} border-b border-white/[0.04]`}>
                                <span className="text-sm text-foreground/80">{row.feature}</span>
                                <div className="flex justify-center">
                                    {renderCell(row.educmark, true)}
                                </div>
                                <div className="flex justify-center">
                                    {renderCell(row.chatlpo, false)}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* When ChatLPO IS good */}
                <section className="mb-20">
                    <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                        &iquest;Cu&aacute;ndo s&iacute; usar ChatLPO?
                    </h2>
                    <p className="text-muted-foreground leading-relaxed mb-6">
                        ChatLPO es una buena opci&oacute;n si valoras tener acceso a muchas herramientas
                        individuales, si necesitas soporte espec&iacute;fico para reportes SEP/PIE, o si
                        quieres formaci&oacute;n certificada con su Academia. Pero cuando necesitas <strong className="text-foreground">un
                        flujo integrado que genere plan + presentaci&oacute;n + evaluaci&oacute;n en 6 minutos</strong>,
                        con correcci&oacute;n OMR y adaptaciones NEE/DUA, EducMark ofrece todo eso a un precio 44% menor.
                    </p>
                    <div className="rounded-2xl border border-primary/20 bg-primary/[0.04] p-6 text-center">
                        <p className="text-foreground font-semibold mb-1">La diferencia en una frase:</p>
                        <p className="text-muted-foreground italic">
                            &laquo;ChatLPO tiene muchas herramientas. EducMark tiene el flujo completo.&raquo;
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
                            { title: 'EducMark vs ChatGPT', desc: 'ChatGPT inventa OA. EducMark los conoce todos. Compara las diferencias.', href: '/educmark-vs-chatgpt' },
                            { title: 'EducMark vs Califica', desc: 'Libro de calificaciones vs plataforma de generación y evaluación completa.', href: '/educmark-vs-califica' },
                            { title: 'EducMark vs Edugami', desc: 'Gamificación vs generación de clases completas alineadas al currículum.', href: '/educmark-vs-edugami' },
                            { title: 'EducMark vs Teachy', desc: 'Teachy es brasileña con currículum BNCC. EducMark tiene RAG MINEDUC.', href: '/educmark-vs-teachy' },
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

export default EducMarkVsChatLPO;
