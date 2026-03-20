'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Check, Clock, TrendingUp, ArrowRight, DollarSign } from 'lucide-react';
import { motion, useInView } from 'framer-motion';
import { useRegisterModal } from '../context/RegisterModalContext';
import { FadeIn, SectionTitle, Button } from '@/shared/components/ui/UIComponents';
import { trackEvent } from '@/shared/lib/analytics';

export const Comparison: React.FC = () => {
  const { open: openRegister } = useRegisterModal();
  // Counter animation logic
  const [timeSaved, setTimeSaved] = useState(0);
  const statsRef = useRef(null);
  const isStatsInView = useInView(statsRef, { once: true, margin: "-50px" });

  useEffect(() => {
    if (!isStatsInView) return;

    const interval = setInterval(() => {
      setTimeSaved(prev => prev < 24 ? prev + 1 : 24);
    }, 40);
    return () => clearInterval(interval);
  }, [isStatsInView]);

  const statItemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.9 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay: i * 0.15,
        duration: 0.5,
        ease: "easeOut" as const
      }
    })
  };

  const painPoints = [
    '+3 horas preparando una sola clase',
    'Domingos sacrificados trabajando',
    'Material generico de internet',
    'Estres constante y agobio',
    'Vida personal descuidada'
  ];

  const benefits = [
    '± 10 clases listas en 1 hora',
    'Fines de semana libres',
    'Clases con respaldo neuroeducativo',
    'Alineacion curricular garantizada',
    'Balance vida-trabajo real'
  ];

  // 4.1 -- Named competitor comparison table
  const competitorFeatures = [
    {
      feature: 'MINEDUC 100%',
      educmark: true,
      chatLPO: true,
      califica: true,
      teachy: false,
      edugami: 'parcial',
      chatgpt: false,
    },
    {
      feature: 'Planificaci\u00f3n/Presentaci\u00f3n/Quiz en 1 click',
      educmark: true,
      chatLPO: 'separado',
      califica: 'separado',
      teachy: 'separado',
      edugami: false,
      chatgpt: false,
    },
    {
      feature: 'Corrector OMR celular',
      educmark: true,
      chatLPO: false,
      califica: false,
      teachy: false,
      edugami: true,
      chatgpt: false,
    },
    {
      feature: 'Neuroeducacion integrada',
      educmark: true,
      chatLPO: false,
      califica: false,
      teachy: false,
      edugami: false,
      chatgpt: false,
    },
    {
      feature: 'Adaptaciones NEE/DUA/PACI',
      educmark: true,
      chatLPO: 'separado',
      califica: 'separado',
      teachy: false,
      edugami: false,
      chatgpt: false,
    },
    {
      feature: 'Imagenes IA contextualizadas',
      educmark: true,
      chatLPO: 'separado',
      califica: 'separado',
      teachy: 'separado',
      edugami: false,
      chatgpt: false,
    },
    {
      feature: 'Desde (CLP/mes)',
      educmark: '$13.900',
      chatLPO: '$25.000',
      califica: '$3.575',
      teachy: '$7.000',
      edugami: '$7.990',
      chatgpt: 'Gratis*',
    },
  ];

  const competitors = [
    { key: 'educmark', name: 'EducMark', highlight: true },
    { key: 'chatLPO', name: 'ChatLPO' },
    { key: 'califica', name: 'Califica' },
    { key: 'teachy', name: 'Teachy' },
    { key: 'edugami', name: 'Edugami' },
    { key: 'chatgpt', name: 'ChatGPT' },
  ];

  const renderCell = (value: boolean | string) => {
    if (value === true) return <Check size={16} className="text-emerald-400 mx-auto" />;
    if (value === false) return <X size={16} className="text-muted-foreground/30 mx-auto" />;
    if (value === 'parcial') return <span className="text-xs text-amber-400/80 font-medium">Parcial</span>;
    if (value === 'separado') return <span className="text-[10px] text-amber-400/70 font-medium leading-tight block">Por separado</span>;
    return <span className="text-xs text-foreground/70 font-medium">{value}</span>;
  };

  return (
    <section id="comparativa" className="py-28 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-1/4 -left-64 w-96 h-96 bg-destructive/8 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 -right-64 w-96 h-96 bg-primary/8 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <FadeIn>
          <SectionTitle
            title="El Costo de Seguir Igual"
            subtitle="Cada hora que sacrificas planificando es una hora que le robas a tu familia. Hay una forma mejor."
          />
        </FadeIn>

        {/* Before / After Cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto mb-24">
          {/* BEFORE card */}
          <FadeIn delay={0.15}>
            <div className="rounded-3xl p-8 border border-white/[0.06] bg-card/30 h-full">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                  <X size={20} className="text-destructive" />
                </div>
                <h3 className="text-xl font-semibold text-foreground/70">Sin EducMark</h3>
              </div>
              <ul className="space-y-3">
                {painPoints.map((item, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + i * 0.08, duration: 0.4 }}
                    className="flex items-center gap-3 py-3 text-foreground/60"
                    style={{ borderBottom: i < painPoints.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
                  >
                    <div className="w-5 h-5 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                      <X size={12} className="text-destructive/70" />
                    </div>
                    <span className="font-light">{item}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          </FadeIn>

          {/* AFTER card */}
          <FadeIn delay={0.3}>
            <div className="rounded-3xl p-8 border border-primary/20 bg-card/50 relative overflow-hidden h-full shadow-[0_0_40px_-15px_rgba(139,92,246,0.15)]">
              {/* Top accent line */}
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <Check size={20} className="text-emerald-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">Con EducMark</h3>
              </div>
              <ul className="space-y-3">
                {benefits.map((item, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.35 + i * 0.08, duration: 0.4 }}
                    className="flex items-center gap-3 py-3 text-foreground/90"
                    style={{ borderBottom: i < benefits.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
                  >
                    <div className="w-5 h-5 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
                      <Check size={12} className="text-emerald-400" />
                    </div>
                    <span>{item}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          </FadeIn>
        </div>

        {/* 4.1 + 4.9 -- Named Competitor Comparison Table */}
        <FadeIn>
          <div className="rounded-3xl p-6 md:p-10 border border-white/[0.06] bg-card/30 max-w-6xl mx-auto mb-16">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold font-heading tracking-tight">EducMark vs. Alternativas</h2>
              <p className="text-sm text-muted-foreground mt-3 max-w-lg mx-auto">
                Solo EducMark genera el kit completo en 1 click. Las demas requieren iteraciones separadas, como un chatbot.
              </p>
            </div>

            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium text-xs uppercase tracking-wider">Funcionalidad</th>
                    {competitors.map(c => (
                      <th key={c.key} className={`py-3 px-2 text-center text-xs uppercase tracking-wider ${c.highlight ? 'text-primary font-bold' : 'text-muted-foreground font-medium'}`}>
                        {c.highlight && <div className="text-[9px] text-primary bg-primary/10 rounded-full px-2 py-0.5 mb-1 inline-block">Nosotros</div>}
                        <div>{c.name}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {competitorFeatures.map((row, i) => (
                    <motion.tr
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.06, duration: 0.3 }}
                      className="border-b border-white/[0.03]"
                    >
                      <td className="py-3 px-2 text-foreground/70 font-light">{row.feature}</td>
                      {competitors.map(c => (
                        <td key={c.key} className={`py-3 px-2 text-center ${c.highlight ? 'bg-primary/[0.04]' : ''}`}>
                          {renderCell(row[c.key as keyof typeof row] as boolean | string)}
                        </td>
                      ))}
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-muted-foreground/40 mt-4 text-center">
              &quot;Por separado&quot; = requiere multiples iteraciones independientes (como un chatbot). EducMark genera los 3 entregables en una sola solicitud.<br />
              * ChatGPT gratuito genera texto sin formato. ChatGPT Plus ($20 USD/mes) tampoco incluye alineacion MINEDUC ni kit descargable. Precios consultados en marzo 2026.
            </p>
          </div>
        </FadeIn>

        {/* 4.2 -- Por que no usar un chatbot generico? */}
        <FadeIn>
          <div className="rounded-3xl p-8 md:p-10 border border-white/[0.06] bg-card/30 max-w-5xl mx-auto mb-16">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold font-heading tracking-tight">Por que no usar un chatbot generico?</h2>
              <p className="text-sm text-muted-foreground mt-3 max-w-lg mx-auto">
                ChatGPT es brillante, pero no fue disenado para tu realidad como docente chileno.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {[
                { problem: 'Inventa OA que no existen', solution: 'Motor curricular con 2.000+ OA reales del MINEDUC' },
                { problem: 'Entrega texto plano sin formato', solution: 'Kit completo: Planificaci\u00f3n + Presentaci\u00f3n + Quiz en HTML editable' },
                { problem: 'No conoce el Decreto 67 ni las Bases Curriculares', solution: 'Alineacion verificable con el curriculum vigente' },
                { problem: 'Requiere 15+ minutos de prompting para un resultado decente', solution: '3 clicks y 6 minutos: selecciona, personaliza, descarga' },
                { problem: 'No genera adaptaciones NEE ni PACI', solution: 'Inclusion integrada: DUA, NEE, PACI segun Decreto 83' },
              ].map((item, i) => (
                <div key={i} className="flex gap-3 p-4 rounded-2xl bg-background/30 border border-white/[0.03]">
                  <div className="shrink-0 mt-0.5">
                    <div className="w-5 h-5 rounded-full bg-destructive/10 flex items-center justify-center">
                      <X size={12} className="text-destructive/70" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-foreground/60 line-through decoration-destructive/30 mb-1">{item.problem}</p>
                    <p className="text-sm text-foreground/90 flex items-center gap-1.5">
                      <Check size={12} className="text-emerald-400 shrink-0" />
                      {item.solution}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>

        {/* 4.3 -- ROI: Costo Real del Tiempo Docente */}
        <FadeIn>
          <div className="rounded-3xl p-8 md:p-12 border border-white/[0.06] bg-card/30 max-w-5xl mx-auto mb-16">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-4 py-1.5 rounded-full text-sm font-semibold border border-emerald-500/20 mb-4">
                <DollarSign size={16} />
                El Numero que Tu Sostenedor Necesita Ver
              </div>
              <h2 className="text-3xl font-bold font-heading tracking-tight">Tu Tiempo Tiene Precio</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-10 items-center">
              {/* Cost breakdown */}
              <div className="space-y-4">
                <div className="rounded-2xl border border-destructive/20 bg-destructive/[0.04] p-5">
                  <p className="text-xs text-destructive/80 font-semibold uppercase tracking-wider mb-3">Sin EducMark -- Costo anual en tiempo</p>
                  <div className="space-y-2 text-sm text-foreground/70">
                    <div className="flex justify-between"><span>55 min/clase x 30 clases/mes</span><span className="text-white font-medium">27,5 h/mes</span></div>
                    <div className="flex justify-between"><span>Valor hora docente promedio</span><span className="text-white font-medium">$7.500 CLP</span></div>
                    <div className="flex justify-between"><span>Costo mensual en tiempo</span><span className="text-white font-medium">$206.250</span></div>
                    <div className="flex justify-between pt-2 border-t border-destructive/10">
                      <span className="font-semibold text-white">Costo anual en tiempo</span>
                      <span className="font-bold text-destructive text-lg">$2.475.000</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-5">
                  <p className="text-xs text-emerald-400/80 font-semibold uppercase tracking-wider mb-3">Con EducMark Araucaria -- $262.800/ano</p>
                  <div className="space-y-2 text-sm text-foreground/70">
                    <div className="flex justify-between"><span>6 min/clase x 30 clases/mes</span><span className="text-white font-medium">3 h/mes</span></div>
                    <div className="flex justify-between"><span>Costo en tiempo + suscripcion</span><span className="text-white font-medium">$532.800/ano</span></div>
                    <div className="flex justify-between pt-2 border-t border-emerald-500/10">
                      <span className="font-semibold text-white">Ahorro neto anual</span>
                      <span className="font-bold text-emerald-400 text-lg">$1.942.200</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ROI highlight */}
              <div
                ref={statsRef}
                className="rounded-2xl p-8 flex flex-col items-center justify-center text-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(99,102,241,0.05))',
                  border: '1px solid rgba(139,92,246,0.12)'
                }}
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 w-full">
                  <motion.div custom={0} initial="hidden" animate={isStatsInView ? "visible" : "hidden"} variants={statItemVariants}>
                    <div className="flex items-center justify-center gap-2 mb-2"><Clock size={18} className="text-primary/60" /></div>
                    <div className="text-3xl font-bold text-white tracking-tight">6 min</div>
                    <p className="text-xs text-muted-foreground mt-1 font-light">Tiempo por clase</p>
                  </motion.div>

                  <motion.div custom={1} initial="hidden" animate={isStatsInView ? "visible" : "hidden"} variants={statItemVariants}>
                    <div className="flex items-center justify-center gap-2 mb-2"><TrendingUp size={18} className="text-primary/60" /></div>
                    <div className="text-3xl font-bold text-white tracking-tight" aria-live="polite" aria-atomic="true">~{timeSaved}h</div>
                    <p className="text-xs text-muted-foreground mt-1 font-light">Ahorro mensual</p>
                  </motion.div>

                  <motion.div custom={2} initial="hidden" animate={isStatsInView ? "visible" : "hidden"} variants={statItemVariants}>
                    <div className="flex items-center justify-center gap-2 mb-2"><DollarSign size={18} className="text-emerald-400/60" /></div>
                    <div className="text-3xl font-bold text-emerald-400 tracking-tight">7.4x</div>
                    <p className="text-xs text-muted-foreground mt-1 font-light">ROI de tu inversion</p>
                  </motion.div>
                </div>

                <div className="mt-6 pt-6 border-t border-white/[0.06] w-full">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Check size={14} className="text-emerald-400" />
                    <span className="text-xs text-foreground/60">100% Alineacion Curricular MINEDUC</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </FadeIn>

        {/* 4.5 -- Positioning Map */}
        <FadeIn>
          <div className="rounded-3xl p-8 md:p-10 border border-white/[0.06] bg-card/30 max-w-4xl mx-auto mb-16">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold font-heading tracking-tight">Mapa de Posicionamiento</h2>
              <p className="text-sm text-muted-foreground mt-3 max-w-lg mx-auto">
                EducMark es la unica plataforma que combina automatizacion total con alineacion curricular chilena verificada.
              </p>
            </div>

            <div className="relative mx-auto" style={{ maxWidth: 520 }}>
              <svg viewBox="0 0 520 420" className="w-full h-auto" aria-label="Mapa de posicionamiento: EducMark en el cuadrante superior derecho (alta automatizacion + alta especificidad curricular)">
                {/* Axes */}
                <line x1="60" y1="380" x2="500" y2="380" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                <line x1="60" y1="380" x2="60" y2="20" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                {/* Arrows */}
                <polygon points="500,380 494,375 494,385" fill="rgba(255,255,255,0.3)" />
                <polygon points="60,20 55,26 65,26" fill="rgba(255,255,255,0.3)" />
                {/* Axis labels */}
                <text x="280" y="410" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="11" fontWeight="600">Especificidad Curricular Chile &rarr;</text>
                <text x="18" y="200" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="11" fontWeight="600" transform="rotate(-90, 18, 200)">Automatizacion &rarr;</text>

                {/* Quadrant labels */}
                <text x="170" y="55" textAnchor="middle" fill="rgba(255,255,255,0.08)" fontSize="10" fontWeight="500">Alta automatizacion</text>
                <text x="170" y="68" textAnchor="middle" fill="rgba(255,255,255,0.08)" fontSize="10" fontWeight="500">Baja especificidad</text>
                <text x="390" y="55" textAnchor="middle" fill="rgba(139,92,246,0.15)" fontSize="10" fontWeight="500">Alta automatizacion</text>
                <text x="390" y="68" textAnchor="middle" fill="rgba(139,92,246,0.15)" fontSize="10" fontWeight="500">Alta especificidad</text>

                {/* Competitors */}
                <circle cx="160" cy="120" r="24" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
                <text x="160" y="117" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="9" fontWeight="500">ChatGPT</text>
                <text x="160" y="129" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="8">Generico</text>

                <circle cx="200" cy="220" r="20" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.10)" strokeWidth="1" />
                <text x="200" y="218" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="9" fontWeight="500">Teachy</text>
                <text x="200" y="229" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="8">LATAM</text>

                <circle cx="380" cy="260" r="20" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.10)" strokeWidth="1" />
                <text x="380" y="258" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="9" fontWeight="500">ChatLPO</text>
                <text x="380" y="269" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="8">Separado</text>

                <circle cx="420" cy="300" r="18" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.10)" strokeWidth="1" />
                <text x="420" y="298" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="9" fontWeight="500">Califica</text>
                <text x="420" y="309" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="8">Evaluacion</text>

                <circle cx="300" cy="250" r="20" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.10)" strokeWidth="1" />
                <text x="300" y="248" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="9" fontWeight="500">Edugami</text>
                <text x="300" y="259" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="8">Parcial</text>

                <circle cx="280" cy="350" r="18" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                <text x="280" y="348" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="9" fontWeight="500">Manual</text>
                <text x="280" y="359" textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="8">55 min/clase</text>

                {/* EducMark: upper-right quadrant */}
                <circle cx="420" cy="100" r="36" fill="rgba(139,92,246,0.12)" stroke="rgba(139,92,246,0.5)" strokeWidth="2" />
                <circle cx="420" cy="100" r="36" fill="none" stroke="rgba(139,92,246,0.2)" strokeWidth="8" />
                <text x="420" y="96" textAnchor="middle" fill="rgb(168,139,250)" fontSize="12" fontWeight="700">EducMark</text>
                <text x="420" y="110" textAnchor="middle" fill="rgba(168,139,250,0.7)" fontSize="9" fontWeight="500">Kit completo &middot; 6 min</text>
              </svg>
            </div>

            <p className="text-center text-xs text-muted-foreground/50 mt-4">
              Solo EducMark ocupa el cuadrante de maxima automatizacion + maxima especificidad curricular chilena.
            </p>
          </div>
        </FadeIn>

        {/* CTA after Comparison */}
        <FadeIn>
          <div className="text-center mt-16">
            <a href="/login?tab=register" onClick={(e) => { e.preventDefault(); trackEvent('click_cta', { location: 'comparison' }); openRegister(); }}>
              <Button
                variant="primary"
                className="h-auto py-4 px-10 !rounded-full text-lg font-semibold"
              >
                Deja de perder 27 horas al mes -- Probar Gratis
              </Button>
            </a>
            <p className="text-muted-foreground/50 text-sm mt-3">Sin tarjeta de credito &middot; Acceso inmediato</p>
          </div>
        </FadeIn>
      </div>
    </section>
  );
};
