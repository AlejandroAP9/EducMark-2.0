'use client';

import React, { useState } from 'react';
import { Button } from '@/shared/components/ui/UIComponents';
import { useSubscriptionStore } from '@/features/auth/store/subscriptionStore';
import { type PlanType } from '@/shared/constants/plans';
import { Flower2, TreePine, Bird, Check, MessageCircle, Star } from 'lucide-react';

const ANNUAL_PRICES: Record<string, { display: string; monthly: string }> = {
    copihue: { display: '$139.000', monthly: '$11.583' },
    araucaria: { display: '$219.000', monthly: '$18.250' },
    condor: { display: '$299.000', monthly: '$24.917' },
};

const PER_KIT_COST: Record<string, string> = {
    copihue: '$695',
    araucaria: '$626',
    condor: '$598',
};

export function Subscription() {
    const { plan: currentPlanKey, credits, classesLimit, isLoading } = useSubscriptionStore();
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

    const percentage = credits.total > 0
        ? Math.min(Math.round((credits.used / credits.total) * 100), 100)
        : 0;

    // Plans Data with MercadoPago URLs
    const plans: Array<{
        id: PlanType;
        name: string;
        price: string;
        period: string;
        features: string[];
        current: boolean;
        highlight: boolean;
        badge?: string;
        icon?: React.ReactNode;
        url: string | null;
    }> = [
        {
            id: 'free',
            name: 'Plan Gratuito',
            price: 'Gratis',
            period: '',
            features: [
                '3 Clases completas',
                '3 Presentaciones HTML editables',
                '3 Planificaciones detalladas',
                '3 Quiz Interactivos',
                '27 Imágenes',
                'Premium',
                'Soporte VIP por WhatsApp'
            ],
            current: currentPlanKey === 'free',
            highlight: false,
            url: null
        },
        {
            id: 'copihue',
            name: 'Plan Copihue',
            price: billingCycle === 'annual' ? ANNUAL_PRICES.copihue.monthly : '$13.900',
            period: billingCycle === 'annual' ? '/mes (anual)' : '/mes',
            features: [
                '20 Clases completas al mes',
                '20 Presentaciones HTML editables',
                '20 Planificaciones detalladas',
                '20 Quiz Interactivos',
                '180 Imágenes',
                'Premium',
                'Soporte VIP por WhatsApp'
            ],
            current: currentPlanKey === 'copihue',
            highlight: false,
            icon: <Flower2 className="w-12 h-12 text-pink-400" />,
            url: billingCycle === 'annual'
                ? 'https://www.mercadopago.cl/subscriptions/checkout?preapproval_plan_id=f5e56573afa144289f6db9b9188b139a'
                : 'https://www.mercadopago.cl/subscriptions/checkout?preapproval_plan_id=ce704844f5f84e939c358e86dbd0e6f2'
        },
        {
            id: 'araucaria',
            name: 'Plan Araucaria',
            price: billingCycle === 'annual' ? ANNUAL_PRICES.araucaria.monthly : '$21.900',
            period: billingCycle === 'annual' ? '/mes (anual)' : '/mes',
            features: [
                '35 Clases completas al mes',
                '35 Presentaciones HTML editables',
                '35 Planificaciones detalladas',
                '35 Quiz Interactivos',
                '315 Imágenes',
                'Premium',
                'Soporte VIP por WhatsApp'
            ],
            current: currentPlanKey === 'araucaria',
            highlight: true,
            badge: 'Más Popular',
            icon: <TreePine className="w-12 h-12 text-emerald-400" />,
            url: billingCycle === 'annual'
                ? 'https://www.mercadopago.cl/subscriptions/checkout?preapproval_plan_id=40c3c82bf7974f50892067cae4f29eee'
                : 'https://www.mercadopago.cl/subscriptions/checkout?preapproval_plan_id=4f956c79d0f84a8da5037e9450082e6b'
        },
        {
            id: 'condor',
            name: 'Plan Condor',
            price: billingCycle === 'annual' ? ANNUAL_PRICES.condor.monthly : '$29.900',
            period: billingCycle === 'annual' ? '/mes (anual)' : '/mes',
            features: [
                '50 Clases completas al mes',
                '50 Presentaciones HTML editables',
                '50 Planificaciones detalladas',
                '50 Quiz Interactivos',
                '450 Imágenes',
                'Premium',
                'Soporte VIP por WhatsApp'
            ],
            current: currentPlanKey === 'condor',
            highlight: true,
            badge: 'Mejor Valor',
            icon: <Bird className="w-12 h-12 text-amber-400" />,
            url: billingCycle === 'annual'
                ? 'https://www.mercadopago.cl/subscriptions/checkout?preapproval_plan_id=87592c4a7a5c4dfdb79e8f7c3abe2d7d'
                : 'https://www.mercadopago.cl/subscriptions/checkout?preapproval_plan_id=e072662afe1d4cda8639bf83938df1b1'
        }
    ];

    const currentPlan = plans.find(p => p.current) || plans[0];

    // Hide free plan for paid users
    const displayPlans = plans.filter(p => {
        if (currentPlanKey !== 'free') return p.id !== 'free';
        return true;
    });

    const handleSubscribe = (url: string | null, planId: string) => {
        if (!url) return;
        window.open(url, 'mercadopago_checkout', 'width=800,height=600,scrollbars=yes,resizable=yes,centerscreen=yes');
    };

    if (isLoading) return <div className="p-12 text-center text-[var(--muted)]">Calculando uso del plan...</div>;

    // Helper for circular progress
    const RADIUS = 50;
    const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
    const offset = CIRCUMFERENCE - (percentage / 100) * CIRCUMFERENCE;

    return (
        <div className="animate-fade-in max-w-7xl mx-auto pb-12 relative -mt-2">
            <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-[var(--primary)]/5 rounded-full blur-3xl pointer-events-none -z-10"></div>

            <div className="mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-[var(--on-background)] font-[family-name:var(--font-heading)] tracking-tight">Mi Suscripción</h1>
                <p className="text-[var(--muted)] text-sm md:text-base max-w-2xl leading-relaxed mt-1">Gestiona tu plan actual, límites de uso y facturación.</p>
            </div>

            <div className="flex flex-col gap-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Usage Card */}
                    <div className="glass-card-premium rounded-2xl p-6 flex flex-col items-center justify-center relative overflow-hidden group">
                        <div className="neural-bg opacity-30">
                            <div className="neural-orb orb-1" style={{ width: '80px', height: '80px', top: '-10px', right: '-10px' }}></div>
                        </div>

                        <div className="absolute top-6 left-6 z-10">
                            <h3 className="font-bold text-lg text-[var(--on-background)]">Estado de Uso</h3>
                            <p className="text-xs text-[var(--muted)]">Ciclo actual: Mensual</p>
                        </div>

                        <div className="relative w-48 h-48 mt-8 flex items-center justify-center z-10">
                            <svg className="w-full h-full transform -rotate-90 drop-shadow-[0_0_15px_rgba(164,143,255,0.2)]">
                                <circle cx="50%" cy="50%" r={RADIUS} fill="transparent" stroke="var(--border)" strokeWidth="12" strokeLinecap="round" />
                                <circle cx="50%" cy="50%" r={RADIUS} fill="transparent" stroke="var(--primary)" strokeWidth="12"
                                    strokeDasharray={CIRCUMFERENCE} strokeDashoffset={offset} strokeLinecap="round"
                                    className="transition-all duration-1000 ease-out" />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-4xl font-bold text-[var(--on-background)]">{percentage}%</span>
                                <span className="text-xs text-[var(--muted)] uppercase tracking-wider font-semibold">Usado</span>
                            </div>
                        </div>

                        <div className="mt-4 text-center z-10">
                            <p className="text-xl font-bold text-[var(--on-background)]">
                                {credits.used} de {credits.total} <span className="text-base font-normal text-[var(--muted)]">Kits</span>
                            </p>
                            <p className="text-xs text-[var(--muted)] mt-1">{credits.remaining} créditos restantes este mes.</p>
                        </div>
                    </div>

                    {/* Current Plan Details */}
                    <div className="lg:col-span-2 glass-card-premium rounded-2xl p-8 relative overflow-hidden flex flex-col justify-between group">
                        <div className="neural-bg opacity-20">
                            <div className="neural-orb orb-2" style={{ bottom: '-30px', left: '-30px', width: '200px', height: '200px', background: 'var(--secondary)' }}></div>
                        </div>

                        <div className="flex flex-col gap-4 mb-6 relative z-10">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mt-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h2 className="text-2xl font-bold text-[var(--on-background)] font-[family-name:var(--font-heading)] flex items-center gap-2">
                                            <span className="text-3xl filter drop-shadow-lg">{currentPlan?.icon}</span> {currentPlan?.name}
                                        </h2>
                                    </div>
                                    <p className="text-[var(--muted)] text-sm max-w-sm font-[family-name:var(--font-body)]">
                                        Tienes acceso a todas las funcionalidades premium y el mayor volumen de generación.
                                    </p>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-baseline justify-end gap-1 text-[var(--on-background)] font-[family-name:var(--font-heading)]">
                                        <span className="text-4xl font-bold tracking-tight">{currentPlan?.price}</span>
                                        <span className="text-[var(--muted)] text-sm font-sans">{currentPlan?.period}</span>
                                    </div>
                                    <p className="text-[10px] text-[var(--muted)] mt-1 font-[family-name:var(--font-body)]">IVA incluido</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 mb-8 relative z-10">
                            {currentPlan?.features.slice(0, 4).map((feat, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <div className="mt-1 w-5 h-5 rounded-full bg-[var(--primary)] flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/20">
                                        <Check size={12} className="text-white" strokeWidth={3} />
                                    </div>
                                    <p className="font-semibold text-[var(--on-background)] text-sm">{feat}</p>
                                </div>
                            ))}
                        </div>

                        <div className="pt-6 border-t border-[var(--border)] flex justify-center relative z-10">
                            <button
                                onClick={() => window.open('https://wa.me/56995155799?text=Hola%20EducMark,%20necesito%20ayuda%20con%20mi%20suscripci%C3%B3n', '_blank')}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-[var(--border)] text-[var(--on-background)] text-sm font-medium hover:bg-[var(--primary-bg)] hover:border-[var(--primary)] transition-all hover:shadow-[0_0_20px_rgba(164,143,255,0.15)]"
                            >
                                <MessageCircle size={18} className="text-[#25D366] fill-current" /> Gestionar Suscripción
                            </button>
                        </div>
                    </div>
                </div>

                {/* Plan Comparison */}
                <div className="relative">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <h3 className="text-xl font-bold text-[var(--on-background)] flex items-center gap-2">
                            <Star className="text-[var(--primary)] fill-current" size={24} /> Comparar otros planes
                        </h3>

                        {/* Billing Cycle Toggle */}
                        <div className="flex items-center gap-3 bg-[var(--input-bg)] border border-[var(--border)] rounded-full p-1">
                            <button
                                onClick={() => setBillingCycle('monthly')}
                                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                                    billingCycle === 'monthly'
                                        ? 'bg-[var(--primary)] text-white shadow-lg shadow-purple-500/20'
                                        : 'text-[var(--muted)] hover:text-[var(--foreground)]'
                                }`}
                            >
                                Mensual
                            </button>
                            <button
                                onClick={() => setBillingCycle('annual')}
                                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
                                    billingCycle === 'annual'
                                        ? 'bg-[var(--primary)] text-white shadow-lg shadow-purple-500/20'
                                        : 'text-[var(--muted)] hover:text-[var(--foreground)]'
                                }`}
                            >
                                Anual
                                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-emerald-500/30">
                                    Ahorra 2 meses
                                </span>
                            </button>
                        </div>
                    </div>

                    <div className={`grid grid-cols-1 md:grid-cols-2 ${displayPlans.length > 2 ? 'xl:grid-cols-3' : ''} gap-6`}>
                        {displayPlans.map((plan, idx) => (
                            <div key={idx}
                                className={`glass-card-premium rounded-2xl p-6 flex flex-col relative transition-all duration-300 group
                                    ${plan.current
                                        ? 'border-2 border-[var(--primary)] shadow-[0_0_30px_rgba(164,143,255,0.2)] transform scale-[1.02] z-10'
                                        : 'hover:border-[var(--primary)] hover:translate-y-[-5px]'
                                    }`}
                            >
                                {plan.current && (
                                    <div className="neural-bg opacity-20 pointer-events-none">
                                        <div className="neural-orb orb-1"></div>
                                    </div>
                                )}

                                {plan.badge && (
                                    <div className="flex justify-center -mt-3 mb-4 relative z-20">
                                        <span className="bg-[var(--primary)] text-white text-xs font-bold px-3 py-1 rounded-full shadow-[0_0_15px_rgba(124,58,237,0.5)] border border-[rgba(255,255,255,0.2)] uppercase tracking-wider flex items-center gap-1 whitespace-nowrap">
                                            {plan.badge}
                                        </span>
                                    </div>
                                )}

                                <div className="mb-6 text-center relative z-10">
                                    <div className="flex justify-center mb-3 filter drop-shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                                        {plan.icon || '🌱'}
                                    </div>
                                    <p className="font-bold text-[var(--on-background)] text-lg">{plan.name}</p>
                                    <div className="flex items-baseline justify-center gap-1 mt-2">
                                        <h4 className="text-3xl font-bold text-[var(--on-background)]">{plan.price}</h4>
                                        <span className="text-xs text-[var(--muted)]">{plan.period}</span>
                                    </div>
                                    {plan.id !== 'free' && billingCycle === 'annual' && ANNUAL_PRICES[plan.id] && (
                                        <p className="text-xs text-emerald-400 font-semibold mt-1">
                                            {ANNUAL_PRICES[plan.id].display}/año total
                                        </p>
                                    )}
                                    {plan.id !== 'free' && PER_KIT_COST[plan.id] && (
                                        <p className="text-xs text-[var(--primary)] font-semibold mt-1">
                                            {PER_KIT_COST[plan.id]} por clase
                                        </p>
                                    )}
                                </div>

                                <ul className="space-y-4 mb-8 flex-1 relative z-10">
                                    {plan.features.slice(0, 5).map((feat, i) => (
                                        <li key={i} className="flex items-start gap-3 text-xs text-[var(--muted)]">
                                            <div className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${plan.current ? 'bg-[var(--primary)] text-white' : 'bg-[var(--card-border)] text-[var(--muted)]'}`}>
                                                <Check size={10} strokeWidth={3} />
                                            </div>
                                            <span className={`text-sm ${plan.current ? 'text-[var(--on-background)]' : ''}`}>{feat}</span>
                                        </li>
                                    ))}
                                    {plan.features.length > 5 && (
                                        <li className="text-xs text-[var(--primary)] text-center italic pt-2">
                                            + {plan.features.length - 5} beneficios más...
                                        </li>
                                    )}
                                </ul>

                                <Button
                                    onClick={() => !plan.current && handleSubscribe(plan.url, plan.id)}
                                    variant={plan.current ? 'secondary' : 'primary'}
                                    disabled={plan.current}
                                    fullWidth
                                    className={`py-3 text-sm font-bold ${plan.current ? 'opacity-80' : 'shadow-lg shadow-purple-500/20'}`}
                                >
                                    {plan.current ? 'Plan Actual' : billingCycle === 'annual' ? 'Consultar Plan Anual' : 'Seleccionar Plan'}
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
