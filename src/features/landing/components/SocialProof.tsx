'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Quote, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { FadeIn } from '@/shared/components/ui/UIComponents';
import { createClient } from '@/lib/supabase/client';

export const SocialProof: React.FC = () => {
  const supabase = createClient();
  const [kitsGenerated, setKitsGenerated] = useState<number | null>(null);

  useEffect(() => {
    supabase
      .from('generated_classes')
      .select('*', { count: 'exact', head: true })
      .then(({ count }) => {
        if (count !== null) setKitsGenerated(count);
      });
  }, []);

  return (
    <section id="testimonios" className="py-32 bg-background relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <FadeIn>
          <div className="max-w-3xl mx-auto">
            {/* Card */}
            <div className="relative rounded-3xl border border-white/[0.06] bg-card/40 backdrop-blur-sm p-10 md:p-14">
              {/* Top accent line */}
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

              {/* Quote mark */}
              <div className="mb-8">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Quote size={24} className="text-primary" fill="currentColor" />
                </div>
              </div>

              {/* Headline quote */}
              <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold font-heading leading-tight text-white mb-8">
                &quot;El trabajo se queda en el colegio, mi tiempo es para ellos...&quot;
              </h3>

              {/* Story */}
              <div className="space-y-6 mb-10">
                <p className="text-muted-foreground leading-relaxed font-light text-lg border-l-2 border-primary/20 pl-5">
                  &quot;...Esa fue la promesa que me hice cuando nacieron mis dos hijos. Sabia que la unica forma de cumplirla sin descuidar mi vocacion era optimizando mi tiempo.&quot;
                </p>
                <p className="text-foreground/80 leading-relaxed">
                  Por eso cree <strong className="text-white">EducMark</strong>: una herramienta hecha por un profesor, para que ningun colega tenga que volver a elegir entre ser un excelente profesional o un padre presente.
                </p>
              </div>

              {/* Signature */}
              <div className="pt-8 border-t border-white/[0.06]">
                <div className="flex items-center gap-4">
                  <Image
                    src="/images/fundador.jpg"
                    alt="Alejandro -- Fundador de EducMark, profesor de Historia"
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-full object-cover shadow-[0_0_20px_rgba(139,92,246,0.3)]"
                  />
                  <div>
                    <div className="font-semibold text-white text-lg">Alejandro</div>
                    <div className="text-xs font-medium text-primary/80 tracking-wider">
                      Fundador &middot; Profesor de Historia, Geografia y Cs. Sociales &middot; 18 anos en aula
                    </div>
                  </div>
                </div>
                {/* 4.12 -- Teacher credential badge */}
                <div className="mt-4 inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-semibold border border-primary/20">
                  Hecho por un profesor, para profesores
                </div>
              </div>
            </div>

            {/* 5.6 -- Mission */}
            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground/70 leading-relaxed max-w-lg mx-auto">
                <strong className="text-foreground/80">Nuestra mision:</strong> Devolver el tiempo a los docentes chilenos para que puedan enfocarse en lo que realmente importa -- ensenar y vivir.
              </p>
            </div>

            {/* 5.3 -- Live kit counter */}
            {kitsGenerated !== null && kitsGenerated > 0 && (
              <div className="mt-8 flex justify-center">
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-5 py-2.5 rounded-full text-sm font-semibold border border-primary/20">
                  <Zap size={16} />
                  <span>{kitsGenerated.toLocaleString('es-CL')} kits pedagogicos generados</span>
                </div>
              </div>
            )}

            {/* Biblioteca */}
            <div className="mt-12 rounded-2xl overflow-hidden border border-white/[0.06] shadow-[0_0_40px_-10px_rgba(164,143,255,0.15)]">
              <Image
                src="/images/screenshots/biblioteca.jpg"
                alt="Biblioteca EducMark -- historial de kits pedagogicos generados con acciones rapidas"
                width={1200}
                height={594}
                className="w-full h-auto"
                quality={80}
              />
            </div>
            <p className="text-center text-xs text-muted-foreground/50 mt-3">Tu biblioteca de kits pedagogicos -- todo organizado y listo para reutilizar.</p>

            {/* Real usage testimonial */}
            <div className="mt-12 rounded-2xl border border-white/[0.06] bg-card/40 backdrop-blur-sm p-8 md:p-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Zap size={18} className="text-emerald-400" />
                </div>
                <h4 className="text-lg font-semibold text-white">Probado en aula real</h4>
              </div>

              <blockquote className="text-muted-foreground leading-relaxed space-y-4">
                <p>
                  &quot;Antes de lanzar EducMark, la puse a prueba donde importa: en mi propia sala de clases. Con 18 a&ntilde;os haciendo planificaciones a mano, sab&iacute;a exactamente lo que necesitaba.
                </p>
                <p>
                  La primera semana logr&eacute; planificar todas mis clases de Historia para 7&deg; y 8&deg; b&aacute;sico en una tarde de domingo &mdash; algo que antes me tomaba todo el fin de semana. Las presentaciones sal&iacute;an listas para proyectar, con im&aacute;genes y actividades incluidas.
                </p>
                <p>
                  Lo que m&aacute;s me sorprendi&oacute; fue la calidad de las evaluaciones sumativas: preguntas alineadas al OA, con distractores bien pensados, y el corrector OMR me ahorra horas de revisi&oacute;n con la c&aacute;mara del celular.&quot;
                </p>
              </blockquote>

              <div className="flex items-center gap-4 mt-6 pt-6 border-t border-white/[0.06]">
                <Image
                  src="/images/fundador.jpg"
                  alt="Alejandro usando EducMark en aula"
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <div className="text-sm font-semibold text-white">Alejandro</div>
                  <div className="text-xs text-muted-foreground">Profesor de Historia &middot; 18 a&ntilde;os en aula &middot; Usuario activo de EducMark</div>
                </div>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
};
