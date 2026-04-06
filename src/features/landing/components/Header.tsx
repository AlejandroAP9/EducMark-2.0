'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/shared/components/ui/UIComponents';
import { motion, AnimatePresence } from 'framer-motion';
import { trackEvent } from '@/shared/lib/analytics';
import { useRegisterModal } from '../context/RegisterModalContext';

interface NavItem {
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  { label: 'Como funciona', href: '#pasos' },
  { label: 'Comparativa', href: '#comparativa' },
  { label: 'Historia', href: '#testimonios' },
  { label: 'Precios', href: '#planes' },
  { label: 'FAQ', href: '#faq' },
];

export const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { open: openRegister } = useRegisterModal();

  // Close mobile menu on scroll
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const handleScroll = () => setIsMobileMenuOpen(false);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobileMenuOpen]);

  const handleNavClick = (href: string) => {
    setIsMobileMenuOpen(false);
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header role="banner">
      {/* 5.11 -- Skip to content for keyboard navigation */}
      <a href="#pasos" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[200] focus:bg-primary focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-semibold">
        Saltar al contenido
      </a>
      <style>{`
        :root {
            --nav-bg: rgba(15, 15, 26, 0.85);
            --nav-border: rgba(255, 255, 255, 0.08);
            --primary-color: #a48fff;
            --text-color: #e2e2f5;
            --hover-text-color: #0f0f1a;
        }

        .pill-nav-container {
          position: fixed;
          top: 1.5em;
          left: 0;
          right: 0;
          z-index: 100;
          display: flex;
          justify-content: center;
          pointer-events: none;
          padding: 0 1rem;
        }

        .pill-nav {
          pointer-events: auto;
          display: flex;
          align-items: center;
          background: rgba(10, 10, 20, 0.55);
          backdrop-filter: blur(40px) saturate(180%);
          -webkit-backdrop-filter: blur(40px) saturate(180%);
          padding: 5px;
          border-radius: 9999px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 0 rgba(255,255,255,0.08);
          transition: all 0.3s ease;
          max-width: 100%;
        }

        /* Logo Section */
        .pill-logo {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          flex-shrink: 0;
          margin-right: 4px;
          padding: 0;
          overflow: hidden;
          transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .pill-logo:hover {
            transform: scale(1.08);
            box-shadow: 0 0 20px rgba(164, 143, 255, 0.3);
        }

        /* Navigation List */
        .pill-list {
          list-style: none;
          display: flex;
          align-items: center;
          margin: 0;
          padding: 0;
          gap: 2px;
        }

        /* Individual Pill Item */
        .pill {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 44px;
          padding: 0 20px;
          color: var(--text-color);
          text-decoration: none;
          border-radius: 9999px;
          font-weight: 500;
          font-size: 14px;
          cursor: pointer;
          overflow: hidden;
          background: transparent;
          border: 1px solid transparent;
          transition: color 0.2s ease, border-color 0.3s ease;
          outline: none;
        }

        /* Hover Circle Animation */
        .pill .hover-circle {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) scale(0.5);
          width: 100%;
          padding-bottom: 100%;
          border-radius: 50%;
          background: var(--primary-color);
          opacity: 0;
          z-index: 1;
          transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.2s ease;
          pointer-events: none;
        }

        .pill:hover .hover-circle {
          transform: translate(-50%, -50%) scale(1.5);
          opacity: 1;
        }

        /* Text Label Stacking for Slide Effect */
        .pill .label-container {
            position: relative;
            z-index: 2;
            height: 1.2em;
            line-height: 1.2em;
            overflow: hidden;
            display: block;
        }

        .pill-label {
            display: block;
            text-align: center;
            transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
            white-space: nowrap;
        }

        .pill-label.normal {
            color: var(--text-color);
            transform: translateY(0);
        }

        .pill-label.hover {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            color: var(--hover-text-color);
            font-weight: 700;
            transform: translateY(100%);
        }

        /* Hover States for Labels */
        .pill:hover .pill-label.normal {
            transform: translateY(-120%);
            opacity: 0;
        }

        .pill:hover .pill-label.hover {
            transform: translateY(0);
        }

        /* CTA Button Specifics - Unified with Primary Theme */
        .pill.cta-btn {
            background: rgba(164, 143, 255, 0.1);
            border: 1px solid rgba(164, 143, 255, 0.3);
            margin-left: 8px;
        }
        .pill.cta-btn:hover {
            background: rgba(164, 143, 255, 0.1);
            border-color: var(--primary-color);
        }
        .pill.cta-btn .hover-circle {
            background: var(--primary-color);
        }
        .pill.cta-btn .pill-label.normal {
            color: var(--primary-color);
            font-weight: 600;
        }
        .pill.cta-btn:hover .pill-label.hover {
            color: #0f0f1a;
        }

        /* Responsive Layout */
        .desktop-only { display: flex; }
        .mobile-only { display: none; }

        @media (max-width: 900px) {
          .pill-nav-container {
             width: 100%;
             padding: 0 1.5rem;
             top: 1rem;
          }
          .pill-nav {
             width: 100%;
             justify-content: space-between;
             padding: 4px;
          }
          .desktop-only { display: none; }
          .mobile-only { display: flex; }
        }

        .mobile-menu-button {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--nav-border);
          color: var(--text-color);
          display: none;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .mobile-menu-button:active { transform: scale(0.95); }
        @media (max-width: 900px) {
          .mobile-menu-button { display: flex; }
        }
      `}</style>

      <nav className="pill-nav-container">
        <div className="pill-nav">
          <a href="#" className="pill-logo" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
            <img src="/images/logo-educmark-icon.png" alt="EducMark - Sistema Operativo de Gestion Pedagogica para el Docente Chileno" width="44" height="44" className="w-full h-full object-contain" />
          </a>

          {/* Desktop Menu */}
          <div className="desktop-only">
            <ul className="pill-list">
              {navItems.map((item) => (
                <li key={item.label}>
                  <a href={item.href} onClick={(e) => { e.preventDefault(); handleNavClick(item.href); }} className="pill">
                    <span className="hover-circle"></span>
                    <div className="label-container">
                      <span className="pill-label normal">{item.label}</span>
                      <span className="pill-label hover">{item.label}</span>
                    </div>
                  </a>
                </li>
              ))}
              <li>
                <a href="/login" className="pill">
                  <span className="hover-circle"></span>
                  <div className="label-container">
                    <span className="pill-label normal">Iniciar Sesi&oacute;n</span>
                    <span className="pill-label hover">Iniciar Sesi&oacute;n</span>
                  </div>
                </a>
              </li>
              <li>
                <a href="/login?tab=register" onClick={(e) => { e.preventDefault(); trackEvent('click_cta', { location: 'header' }); openRegister(); }}>
                  <Button
                    variant="primary"
                    className="!rounded-full !px-8 !py-2 h-[44px] text-sm font-semibold"
                  >
                    Probar Gratis
                  </Button>
                </a>
              </li>
            </ul>
          </div>

          {/* Mobile Toggle */}
          <button
            className="mobile-menu-button mobile-only"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? "Cerrar menu" : "Abrir menu"}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <span style={{ fontSize: '20px' }}>&#x2715;</span> : <span style={{ fontSize: '20px' }}>&#x2630;</span>}
          </button>
        </div>
      </nav>

      {/* Mobile Popover */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed top-24 left-6 right-6 z-[98] md:hidden"
          >
            <div className="bg-[#1a1a2e]/60 backdrop-blur-[40px] saturate-[180%] border border-white/[0.12] rounded-[2rem] p-2 shadow-2xl overflow-hidden">
              <div className="flex flex-col gap-1">
                {navItems.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    onClick={(e) => { e.preventDefault(); handleNavClick(item.href); }}
                    className="w-full text-left px-6 py-4 text-[#e2e2f5] hover:bg-white/10 rounded-3xl transition-colors font-medium text-lg block"
                  >
                    {item.label}
                  </a>
                ))}
                <div className="h-px bg-white/10 mx-4 my-2"></div>
                <a
                  href="/login"
                  className="w-full text-center px-6 py-4 text-[#e2e2f5] hover:bg-white/10 rounded-3xl transition-colors font-medium text-lg block"
                >
                  Iniciar Sesi&oacute;n
                </a>
                <a href="/login?tab=register" onClick={(e) => { e.preventDefault(); trackEvent('click_cta', { location: 'header_mobile' }); openRegister(); }}>
                  <Button
                    fullWidth
                    variant="primary"
                    className="rounded-3xl hover:brightness-110"
                  >
                    Probar Gratis
                  </Button>
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
