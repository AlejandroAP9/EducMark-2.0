'use client';

import React, { useEffect, useState } from 'react';
import { ArrowRight, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { FadeIn, Button } from '@/shared/components/ui/UIComponents';
import { useRegisterModal } from '../context/RegisterModalContext';
import { createClient } from '@/lib/supabase/client';
import { trackEvent } from '@/shared/lib/analytics';

export const FinalCTA: React.FC = () => {
    const router = useRouter();
    const supabase = createClient();
    const { open: openRegister } = useRegisterModal();
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            setIsLoggedIn(!!data.session);
        });
    }, []);

    return (
        <section className="py-32 md:py-40 relative overflow-hidden">
            {/* Gradient mesh background */}
            <div className="absolute inset-0 bg-background">
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                {/* Ambient orbs */}
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.08, 0.15, 0.08],
                    }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-1/2 left-1/3 w-[600px] h-[600px] bg-primary rounded-full blur-[150px] -translate-y-1/2 pointer-events-none"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.15, 1],
                        opacity: [0.05, 0.1, 0.05],
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                    className="absolute top-1/2 right-1/4 w-[500px] h-[500px] bg-secondary rounded-full blur-[120px] -translate-y-1/2 pointer-events-none"
                />
            </div>

            <div className="container mx-auto px-4 relative z-10">
                <FadeIn>
                    <div className="max-w-3xl mx-auto text-center">
                        {isLoggedIn ? (
                            <>
                                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold font-heading leading-[1.1] tracking-tight mb-6">
                                    <span className="text-foreground">Tu proxima clase</span>
                                    <br />
                                    <span className="bg-gradient-primary bg-clip-text text-transparent">
                                        te esta esperando.
                                    </span>
                                </h2>
                                <p className="text-lg md:text-xl text-muted-foreground font-light leading-relaxed max-w-xl mx-auto mb-12">
                                    Ya eres parte de EducMark. Genera tu siguiente clase en menos de 6 minutos.
                                </p>
                                <a href="/dashboard" onClick={(e) => { e.preventDefault(); trackEvent('click_cta', { location: 'final_cta_dashboard' }); router.push('/dashboard'); }}>
                                    <Button
                                        variant="primary"
                                        className="h-auto py-4 px-10 !rounded-full text-lg font-semibold"
                                    >
                                        <Zap size={20} className="mr-1" />
                                        Ir al Dashboard
                                    </Button>
                                </a>
                            </>
                        ) : (
                            <>
                                {/* Differentiated headline */}
                                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold font-heading leading-[1.1] tracking-tight mb-6">
                                    <span className="text-foreground">Ya viste lo que puede hacer.</span>
                                    <br />
                                    <span className="bg-gradient-primary bg-clip-text text-transparent">
                                        Ahora pruebalo tu.
                                    </span>
                                </h2>

                                <p className="text-lg md:text-xl text-muted-foreground font-light leading-relaxed max-w-xl mx-auto mb-12">
                                    3 clases completas gratis. Sin tarjeta. Si no te convence, no has perdido nada.
                                </p>

                                <div className="flex flex-col items-center gap-6">
                                    <a href="/login?tab=register" onClick={(e) => { e.preventDefault(); trackEvent('click_cta', { location: 'final_cta' }); openRegister(); }}>
                                        <Button
                                            variant="primary"
                                            className="h-auto py-4 px-10 !rounded-full text-lg font-semibold"
                                        >
                                            Crear Mi Cuenta Gratis
                                            <ArrowRight size={20} className="ml-1 group-hover:translate-x-1 transition-transform" />
                                        </Button>
                                    </a>

                                    <p className="text-muted-foreground/60 text-sm font-light">
                                        Sin tarjeta de credito &middot; Acceso inmediato &middot; Garantia 7 dias
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </FadeIn>
            </div>
        </section>
    );
};
