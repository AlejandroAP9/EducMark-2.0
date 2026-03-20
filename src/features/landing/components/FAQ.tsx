'use client';

import React, { useState } from 'react';
import { ChevronDown, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRegisterModal } from '../context/RegisterModalContext';
import { FadeIn, SectionTitle, Button } from '@/shared/components/ui/UIComponents';
import { trackEvent } from '@/shared/lib/analytics';

interface FaqItem {
  question: string;
  answer: string;
}

const faqs: FaqItem[] = [
  {
    question: "Realmente cumple con el Curriculum Nacional chileno?",
    answer: "Si. EducMark esta conectado directamente a las Bases Curriculares vigentes del MINEDUC. Conoce los OA e indicadores de evaluacion para cada nivel y asignatura, asegurando que tus planificaciones sean tecnicamente validas ante UTP."
  },
  {
    question: "En que se diferencia de usar ChatGPT gratis?",
    answer: "ChatGPT es un asistente generalista; EducMark es un especialista educativo chileno. No necesitas explicar el contexto, el formato ni los criterios de evaluacion. Te entregamos el documento estructurado y listo para usar en segundos."
  },
  {
    question: "Puedo descargar y editar los documentos generados?",
    answer: "Si. Todo lo que generas es tuyo y 100% editable. El sistema te entrega el 90% del trabajo listo y tu ajustas el 10% final para adaptarlo al formato de tu colegio."
  },
  {
    question: "Funciona para todas las asignaturas y niveles?",
    answer: "Si. Cubrimos desde 1 basico hasta IV medio, incluyendo asignaturas humanistas, cientificas y artisticas. El sistema adapta la complejidad del lenguaje y las actividades segun el nivel del curso."
  },
  {
    question: "Que pasa si no estoy satisfecho con el servicio?",
    answer: "Tienes 7 dias de garantia total. Si no quedas conforme con el resultado, te devolvemos el 100% de tu inversion. Sin letra chica, sin preguntas incomodas."
  },
  {
    question: "Mis datos y los de mis estudiantes estan seguros?",
    answer: "Si. Toda la informacion viaja cifrada con SSL (TLS 1.2+) y se almacena en Supabase, una plataforma con certificacion SOC 2 Type II. No compartimos datos con terceros ni los usamos para entrenar modelos de IA. Cumplimos con la Ley 19.628 de proteccion de datos personales de Chile."
  },
  {
    question: "Funciona con internet lento o inestable?",
    answer: "EducMark esta optimizado para conexiones chilenas reales. La generacion de una clase completa pesa menos de 2 MB y los documentos se descargan en formato ligero. Si pierdes conexion mientras generas, tu trabajo queda guardado."
  },
  {
    question: "Hay un limite de clases que puedo generar al mes?",
    answer: "Los planes pagados tienen creditos mensuales que se renuevan automaticamente: Copihue (20), Araucaria (35) y Condor (50). El plan gratuito incluye 3 clases que no se renuevan — es para que pruebes el sistema. Cada credito genera el kit completo: planificacion + presentacion + quiz, todo en HTML editable."
  },
  {
    question: "Puedo compartir mi cuenta con otro colega?",
    answer: "Cada cuenta es individual y esta asociada a un correo electronico. Esto nos permite personalizar tu experiencia segun tus asignaturas y niveles. Si tu colegio necesita varias cuentas, contactanos para planes institucionales."
  }
];

export const FAQ: React.FC = () => {
  const { open: openRegister } = useRegisterModal();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-28 bg-gradient-to-b from-background to-[#131320] relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="container mx-auto px-4 max-w-3xl relative z-10">
        <FadeIn>
          <SectionTitle title="Preguntas Frecuentes" />
        </FadeIn>

        <div className="space-y-3 mt-12">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;

            return (
              <FadeIn key={idx} delay={idx * 0.08}>
                <div
                  className={`rounded-2xl border transition-all duration-300 ${
                    isOpen
                      ? 'bg-card/80 border-primary/30 shadow-[0_0_30px_-10px_rgba(139,92,246,0.15)]'
                      : 'bg-transparent border-white/[0.06] hover:border-white/10 hover:bg-card/30'
                  }`}
                >
                  <button
                    className="w-full flex justify-between items-center p-6 text-left group"
                    onClick={() => setOpenIndex(isOpen ? null : idx)}
                  >
                    <span className={`font-medium text-lg pr-6 transition-colors duration-200 ${
                      isOpen ? 'text-white' : 'text-foreground/80 group-hover:text-white'
                    }`}>
                      {faq.question}
                    </span>
                    <motion.div
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="shrink-0"
                    >
                      <ChevronDown
                        size={20}
                        className={`transition-colors duration-200 ${
                          isOpen ? 'text-primary' : 'text-muted-foreground'
                        }`}
                      />
                    </motion.div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-6">
                          <div className="h-px bg-gradient-to-r from-primary/20 via-primary/10 to-transparent mb-4" />
                          <p className="text-muted-foreground leading-relaxed font-light">
                            {faq.answer}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </FadeIn>
            );
          })}
        </div>

        {/* CTA after FAQ */}
        <FadeIn>
          <div className="text-center mt-14 space-y-4">
            <a href="/login?tab=register" onClick={(e) => { e.preventDefault(); trackEvent('click_cta', { location: 'faq' }); openRegister(); }}>
              <Button
                variant="primary"
                className="h-auto py-4 px-10 !rounded-full text-lg font-semibold"
              >
                Probar EducMark Gratis
              </Button>
            </a>
            <div className="flex items-center justify-center gap-2">
              <a
                href="https://wa.me/56995155799?text=Hola%2C%20tengo%20una%20consulta%20sobre%20EducMark"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-emerald-400 transition-colors"
              >
                <MessageCircle size={16} />
                Tienes mas preguntas? Escribenos por WhatsApp
              </a>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
};
