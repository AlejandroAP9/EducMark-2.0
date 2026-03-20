'use client';

import React, { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Header } from './Header';
import { Hero } from './Hero';
import { Button } from '@/shared/components/ui/UIComponents';
import { Features } from './Features';
import { Comparison } from './Comparison';
import { SocialProof } from './SocialProof';
import { Pricing } from './Pricing';
import { FAQ } from './FAQ';
import { Footer } from './Footer';
import { FinalCTA } from './FinalCTA';
import { trackEvent } from '@/shared/lib/analytics';
import { RegisterModalProvider, useRegisterModal } from '../context/RegisterModalContext';
import { RegisterModal } from './RegisterModal';

function LandingPageContent() {
    const { open: openRegister, isOpen, close: closeRegister } = useRegisterModal();
    const [showExitPopup, setShowExitPopup] = useState(false);
    const [hasShownExit, setHasShownExit] = useState(false);

    const [scrollProgress, setScrollProgress] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            const totalScroll = document.documentElement.scrollTop;
            const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scroll = `${totalScroll / windowHeight}`;
            setScrollProgress(Number(scroll));
        }
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const handleMouseLeave = (e: MouseEvent) => {
            if (e.clientY < 0 && !hasShownExit) {
                setShowExitPopup(true);
                setHasShownExit(true);
            }
        };
        const timer = setTimeout(() => {
            if (!hasShownExit) {
                // setShowExitPopup(true);
            }
        }, 60000);
        document.addEventListener('mouseleave', handleMouseLeave);
        return () => {
            document.removeEventListener('mouseleave', handleMouseLeave);
            clearTimeout(timer);
        };
    }, [hasShownExit]);

    return (
        <div className="min-h-screen text-foreground font-body bg-background selection:bg-primary/30">
            {/* Scroll Progress Bar */}
            <div
                className="fixed top-0 left-0 h-1 bg-gradient-to-r from-primary to-[#8080ff] z-[100]"
                style={{ width: `${scrollProgress * 100}%` }}
            />

            <Header />
            <main>
                <Hero />
                <Features />
                <Comparison />
                <SocialProof />
                <Pricing />
                <FAQ />
                <FinalCTA />
            </main>
            <Footer />

            {/* Mobile Sticky CTA -- visible after scrolling past Hero */}
            {scrollProgress > 0.05 && (
                <div className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-background/90 backdrop-blur-lg border-t border-white/10 px-4 py-3 safe-area-bottom">
                    <button
                        onClick={() => { trackEvent('click_cta', { location: 'sticky_mobile' }); openRegister(); }}
                        className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-6 rounded-full transition-colors text-sm"
                    >
                        Probar Gratis
                        <ArrowRight size={16} />
                    </button>
                </div>
            )}

            {/* Exit Popup */}
            {showExitPopup && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-card border border-primary/50 rounded-2xl p-8 max-w-sm text-center shadow-2xl relative">
                        <button onClick={() => setShowExitPopup(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-white">&#x2715;</button>
                        <div className="text-4xl mb-4">&#127873;</div>
                        <h3 className="text-2xl font-bold mb-2">Espera!</h3>
                        <p className="text-muted-foreground mb-6">Sabias que puedes probar <strong>3 clases GRATIS</strong>? No pierdas la oportunidad.</p>
                        <Button onClick={() => openRegister()} variant="primary" fullWidth className="font-bold py-3">
                            Probar Gratis
                        </Button>
                        <button onClick={() => setShowExitPopup(false)} className="mt-4 text-xs text-muted-foreground hover:text-white underline">
                            No gracias, prefiero trabajar el domingo
                        </button>
                    </div>
                </div>
            )}

            {/* Registration Modal */}
            <RegisterModal isOpen={isOpen} onClose={closeRegister} location="landing" />
        </div>
    );
}

export function LandingPage() {
    return (
        <RegisterModalProvider>
            <LandingPageContent />
        </RegisterModalProvider>
    );
}
