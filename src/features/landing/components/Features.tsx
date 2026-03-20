'use client';

import React from 'react';
import Image from 'next/image';
import { FileText, Presentation, Gamepad2, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRegisterModal } from '../context/RegisterModalContext';
import { FadeIn, SectionTitle, Button } from '@/shared/components/ui/UIComponents';
import { trackEvent } from '@/shared/lib/analytics';

export const Features: React.FC = () => {
  const { open: openRegister } = useRegisterModal();

  return (
    <>
      {/* Steps Section */}
      <section id="pasos" className="py-24 bg-background relative z-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <SectionTitle
              title="Tu Clase Lista en 3 Pasos"
              subtitle="Sin configuraciones complejas. Entras, eliges y descargas."
            />
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 mt-16 relative">
            {[
              { num: 1, title: 'Selecciona', desc: 'Elige tu curso, asignatura y el OA oficial del MINEDUC desde nuestro menu.' },
              { num: 2, title: 'Personaliza', desc: 'Ajusta palabras clave, duracion o necesidades educativas especiales (DUA).' },
              { num: 3, title: 'Descarga', desc: 'En segundos, obten tu Planificacion, Diapositivas, Quiz y Evaluaciones.' }
            ].map((step, idx) => (
              <FadeIn key={idx} delay={idx * 0.2} className="relative z-10">
                <div className="bg-card backdrop-blur-md border border-border p-8 rounded-3xl hover:border-primary/50 transition-colors group text-center h-full">
                  <div className="w-16 h-16 rounded-full bg-primary/20 text-primary flex items-center justify-center text-2xl font-bold mx-auto mb-6 group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(164,143,255,0.3)]">
                    {step.num}
                  </div>
                  <h3 className="text-xl font-bold mb-4 text-foreground">{step.title}</h3>
                  <p className="text-muted-foreground">{step.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>

          {/* Screenshot del formulario */}
          <FadeIn delay={0.6} className="mt-12 max-w-4xl mx-auto">
            <div className="rounded-2xl overflow-hidden border border-white/[0.06] shadow-[0_0_40px_-10px_rgba(164,143,255,0.2)]">
              <Image
                src="/images/screenshots/formulario.jpg"
                alt="Formulario de generacion EducMark -- selecciona asignatura, curso y OA del MINEDUC"
                width={1200}
                height={629}
                className="w-full h-auto"
                quality={80}
              />
            </div>
            <p className="text-center text-xs text-muted-foreground/50 mt-3">Selecciona asignatura, curso y OA -- EducMark hace el resto.</p>
          </FadeIn>
        </div>
      </section>

      {/* Bento Grid Section */}
      <section className="py-24 bg-[#131320]">
        <div className="container mx-auto px-4">
          <FadeIn>
            <div className="flex justify-center mb-6">
              <span className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-semibold border border-primary/20">
                ★ Lo que recibes en cada descarga
              </span>
            </div>
            <SectionTitle
              title="No es solo texto. Es tu Kit Cerebro-Compatible."
              subtitle="A diferencia de ChatGPT, EducMark nunca inventa OA. Te entrega secuencias didacticas verificadas contra las Bases Curriculares, listas para proyectar e imprimir."
            />
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-12 max-w-6xl mx-auto">
            {/* Planning Card */}
            <FadeIn className="md:col-span-6 bg-card border border-border rounded-3xl p-8 hover:border-primary/50 hover:scale-[1.02] hover:shadow-[0_0_40px_-10px_rgba(164,143,255,0.4)] transition-all duration-300 flex flex-col justify-between overflow-hidden relative group">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
              <div className="absolute top-6 right-6 bg-primary/20 text-primary text-xs font-bold px-3 py-1 rounded-full uppercase">HTML Editable</div>

              <div>
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 text-primary">
                  <FileText size={32} />
                </div>
                <h3 className="text-2xl font-bold mb-2">Planificacion Docente</h3>
                <p className="text-muted-foreground mb-6">Cumple con UTP sin estres. Secuencia cerebro-compatible con:</p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-foreground/70 mb-6">
                  {['Objetivos (OA) y Habilidades', 'Indicadores de Logro', 'Estrategias DUA y NEE', 'Rubrica de evaluacion'].map(item => (
                    <li key={item} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary"></div> {item}
                    </li>
                  ))}
                </ul>
                {/* Screenshot */}
                <div className="rounded-xl overflow-hidden border border-white/[0.06] shadow-lg">
                  <Image
                    src="/images/screenshots/planificacion.jpg"
                    alt="Planificacion docente generada por EducMark -- Marco Curricular y Secuencia Didactica"
                    width={1200}
                    height={626}
                    className="w-full h-auto"
                    quality={80}
                  />
                </div>
              </div>
            </FadeIn>

            {/* PPT Card */}
            <FadeIn delay={0.2} className="md:col-span-6 bg-card border border-border rounded-3xl p-8 hover:border-amber-400/50 hover:scale-[1.02] hover:shadow-[0_0_40px_-10px_rgba(251,191,36,0.4)] transition-all duration-300 flex flex-col justify-between overflow-hidden relative group">
              <div className="absolute top-0 left-0 w-1 h-full bg-amber-400"></div>
              <div className="absolute top-6 right-6 bg-amber-400/20 text-amber-400 text-xs font-bold px-3 py-1 rounded-full uppercase">HTML Editable</div>

              <div>
                <div className="w-14 h-14 bg-amber-400/10 rounded-2xl flex items-center justify-center mb-6 text-amber-400">
                  <Presentation size={32} />
                </div>
                <h3 className="text-2xl font-bold mb-2">Clase Visual Lista</h3>
                <p className="text-muted-foreground mb-4">Nada de diapositivas en blanco. Secuencia con inicio emocional, micro-ciclos de atencion y cierre metacognitivo.</p>
                <div className="p-3 bg-amber-400/10 rounded-lg text-amber-400 text-sm mb-6">
                  ★ Imagenes exclusivas + diseno basado en neuroeducacion (<span className="relative group/tip cursor-help border-b border-dashed border-amber-400/50">Cespedes &amp; Maturana<span className="invisible group-hover/tip:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 rounded-lg bg-[#1a1a2e] border border-white/10 text-xs text-foreground/80 font-normal leading-relaxed shadow-xl z-50 pointer-events-none">Basado en la investigacion de la Dra. Amanda Cespedes (neuropsiquiatra infantil) y el biologo Humberto Maturana sobre aprendizaje cerebro-compatible.</span></span>).
                </div>
                {/* Screenshot */}
                <div className="rounded-xl overflow-hidden border border-white/[0.06] shadow-lg">
                  <Image
                    src="/images/screenshots/slides.jpg"
                    alt="Diapositiva generada por EducMark -- Introduccion al Humanismo con imagen IA contextualizada"
                    width={1200}
                    height={744}
                    className="w-full h-auto"
                    quality={80}
                  />
                </div>
              </div>
            </FadeIn>

            {/* Quiz Card */}
            <FadeIn delay={0.4} className="md:col-span-6 bg-card border border-border rounded-3xl p-8 hover:border-emerald-500/50 hover:scale-[1.02] hover:shadow-[0_0_40px_-10px_rgba(16,185,129,0.4)] transition-all duration-300 flex flex-col justify-between overflow-hidden relative group">
              <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
              <div className="absolute top-6 right-6 bg-emerald-500/20 text-emerald-500 text-xs font-bold px-3 py-1 rounded-full uppercase">App Interactiva</div>

              <div>
                <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 text-emerald-500">
                  <Gamepad2 size={32} />
                </div>
                <h3 className="text-2xl font-bold mb-2">Quiz Gamificado</h3>
                <p className="text-muted-foreground mb-4">Evaluacion formativa que funciona en cualquier navegador.</p>
                <div className="text-sm text-emerald-500 italic opacity-80 mb-6">
                  &quot;Feedback inmediato: Si el alumno se equivoca, el sistema le explica por que.&quot;
                </div>
                {/* Screenshot */}
                <div className="rounded-xl overflow-hidden border border-white/[0.06] shadow-lg">
                  <Image
                    src="/images/screenshots/quiz.jpg"
                    alt="Quiz interactivo generado por EducMark -- preguntas con timer y opciones multiples"
                    width={1200}
                    height={621}
                    className="w-full h-auto"
                    quality={80}
                  />
                </div>
              </div>
            </FadeIn>

            {/* Evaluaciones OMR Card */}
            <FadeIn delay={0.6} className="md:col-span-6 bg-card border border-border rounded-3xl p-8 hover:border-primary/50 hover:scale-[1.02] hover:shadow-[0_0_40px_-10px_rgba(164,143,255,0.4)] transition-all duration-300 flex flex-col justify-between overflow-hidden relative group">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>

              <div>
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 text-primary">
                  <FileText size={32} />
                </div>
                <h3 className="text-2xl font-bold mb-2">Evaluaciones y Corrector Automatico</h3>
                <p className="text-muted-foreground mb-4">Crea evaluaciones (Filas A/B) en segundos.</p>
                <div className="p-3 bg-primary/10 rounded-lg text-primary text-sm italic mb-6">
                  ★ Usa tu celular desde la Sala de Profesores para escanear y corregir 40 pruebas en 2 minutos. (100% compatible con la Ley 21.801 de restriccion celular en aulas).
                </div>
                {/* Screenshot */}
                <div className="rounded-xl overflow-hidden border border-white/[0.06] shadow-lg">
                  <Image
                    src="/images/screenshots/evaluaciones.jpg"
                    alt="Seccion de evaluaciones EducMark -- disenar, escanear y retroalimentar automaticamente"
                    width={1200}
                    height={644}
                    className="w-full h-auto"
                    quality={80}
                  />
                </div>
              </div>
            </FadeIn>
          </div>

          {/* CTA after Features */}
          <FadeIn delay={0.8}>
            <div className="text-center mt-16">
              <a href="/login?tab=register" onClick={(e) => { e.preventDefault(); trackEvent('click_cta', { location: 'features' }); openRegister(); }}>
                <Button
                  variant="primary"
                  className="h-auto py-4 px-10 !rounded-full text-lg font-semibold"
                >
                  Probar Gratis
                </Button>
              </a>
              <p className="text-muted-foreground/50 text-sm mt-3">Sin tarjeta de credito &middot; 3 clases incluidas</p>
            </div>
          </FadeIn>
        </div>
      </section>
    </>
  );
};
