'use client';

import React, { useState } from 'react';
import { Lock, ShieldCheck, Mail } from 'lucide-react';
import { LegalModals } from './LegalModals';

const navSections = [
  { label: 'Como funciona', href: '#pasos' },
  { label: 'Comparativa', href: '#comparativa' },
  { label: 'Precios', href: '#planes' },
  { label: 'FAQ', href: '#faq' },
];

export const Footer: React.FC = () => {
  const [activeModal, setActiveModal] = useState<'terms' | 'privacy' | null>(null);

  const handleNavClick = (href: string) => {
    const element = document.querySelector(href);
    if (element) element.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer className="border-t border-white/[0.06] bg-background relative">
      <div className="container mx-auto px-4 py-16">
        {/* Main footer grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 mb-12">
          {/* Brand column */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src="/images/logo.png" alt="EducMark" width="36" height="36" className="w-9 h-9 rounded-full bg-white p-1" />
              <span className="font-heading font-bold text-lg text-white">EducMark</span>
            </div>
            <p className="text-sm text-muted-foreground font-light leading-relaxed max-w-xs">
              El Sistema Operativo de Gestion Pedagogica para el docente chileno. Planifica, evalua y analiza con respaldo neuroeducativo.
            </p>
          </div>

          {/* Navigation column */}
          <div>
            <h4 className="text-sm font-semibold text-foreground/60 uppercase tracking-wider mb-4">Navegacion</h4>
            <ul className="space-y-3">
              {navSections.map(item => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    onClick={(e) => { e.preventDefault(); handleNavClick(item.href); }}
                    className="text-sm text-muted-foreground hover:text-white transition-colors font-light"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal + Contact column */}
          <div>
            <h4 className="text-sm font-semibold text-foreground/60 uppercase tracking-wider mb-4">Legal</h4>
            <ul className="space-y-3">
              <li>
                <button onClick={() => setActiveModal('privacy')} className="text-sm text-muted-foreground hover:text-white transition-colors font-light">
                  Politica de Privacidad
                </button>
              </li>
              <li>
                <button onClick={() => setActiveModal('terms')} className="text-sm text-muted-foreground hover:text-white transition-colors font-light">
                  Terminos y Condiciones
                </button>
              </li>
              <li className="pt-2">
                <a href="mailto:alejandro@educmark.cl" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors font-light">
                  <Mail size={14} />
                  alejandro@educmark.cl
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent mb-8" />

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground/60 font-light">
            &copy; {new Date().getFullYear()} EducMark. Todos los derechos reservados.
          </p>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground/50">
              <Lock size={12} className="text-emerald-500/60" />
              <span>SSL</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground/50">
              <ShieldCheck size={12} className="text-primary/60" />
              <span>Garantia 7 dias</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground/50">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-[#009EE3]/60">
                <path d="M11.3 2.3C6.5 2.3 2.6 6.2 2.6 11c0 2 .7 3.8 1.8 5.3L2.1 22l5.8-2.3c1.4.8 3 1.2 4.7 1.2h0c4.8 0 8.7-3.9 8.7-8.7C21.3 7.5 18.7 2.3 11.3 2.3z"/>
              </svg>
              <span>MercadoPago</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating WhatsApp */}
      <a
        href="https://wa.me/56995155799?text=Hola,%20tengo%20dudas%20sobre%20EducMark"
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 w-12 h-12 sm:w-14 sm:h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(37,211,102,0.4)] hover:scale-110 hover:shadow-[0_4px_30px_rgba(37,211,102,0.5)] transition-all z-40"
        aria-label="Contactar por WhatsApp"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
        </svg>
      </a>

      <LegalModals activeModal={activeModal} onClose={() => setActiveModal(null)} />
    </footer>
  );
};
