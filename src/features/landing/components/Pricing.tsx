'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Check, ShieldCheck, Flower2, TreePine, Bird, Gift, Loader2, CheckCircle2, X, School } from 'lucide-react';
import { FadeIn, Button, SectionTitle } from '@/shared/components/ui/UIComponents';
import { useSubscriptionStore } from '@/features/auth/store/subscriptionStore';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useRegisterModal } from '../context/RegisterModalContext';
import { trackEvent } from '@/shared/lib/analytics';

interface PlanFeature {
  text: string;
  included: boolean;
}

interface PricingPlan {
  id: string;
  name: string;
  icon: React.ReactNode;
  price: string;
  priceMonthly: string;
  priceAnnually: string;
  recommended?: boolean;
  features: PlanFeature[];
  url: string;
  urlAnnual?: string;
}

const plans: PricingPlan[] = [
  {
    id: 'free',
    name: 'Plan Gratis',
    icon: <Gift className="w-6 h-6 text-sky-400" />,
    price: '$0',
    priceMonthly: '$0',
    priceAnnually: '$0',
    features: [
      { text: '3 Planificaciones de clases', included: true },
      { text: '3 PPTs editables', included: true },
      { text: '3 Quiz Interactivos', included: true },
      { text: '27 Imagenes IA incluidas', included: true },
      { text: 'Evaluaciones + Lector OMR', included: false },
      { text: 'Soporte por email', included: true },
    ],
    url: ''
  },
  {
    id: 'basic',
    name: 'Plan Copihue',
    icon: <Flower2 className="w-6 h-6 text-pink-400" />,
    price: '$13.900',
    priceMonthly: '$13.900',
    priceAnnually: '$139.000',
    features: [
      { text: '20 Planificaciones de clases', included: true },
      { text: '20 PPTs editables', included: true },
      { text: '20 Quiz Interactivos', included: true },
      { text: '180 Imagenes Premium', included: true },
      { text: 'Soporte por email', included: true },
    ],
    url: 'https://www.mercadopago.cl/subscriptions/checkout?preapproval_plan_id=ce704844f5f84e939c358e86dbd0e6f2',
    urlAnnual: 'https://www.mercadopago.cl/subscriptions/checkout?preapproval_plan_id=f5e56573afa144289f6db9b9188b139a'
  },
  {
    id: 'pro',
    name: 'Plan Araucaria',
    icon: <TreePine className="w-6 h-6 text-emerald-400" />,
    price: '$21.900',
    priceMonthly: '$21.900',
    priceAnnually: '$219.000',
    recommended: true,
    features: [
      { text: '35 Planificaciones de clases', included: true },
      { text: '35 PPTs editables', included: true },
      { text: '35 Quiz Interactivos', included: true },
      { text: '35 Evaluaciones + Lector OMR', included: true },
      { text: '315 Imagenes Premium', included: true },
      { text: 'Soporte WhatsApp', included: true },
    ],
    url: 'https://www.mercadopago.cl/subscriptions/checkout?preapproval_plan_id=4f956c79d0f84a8da5037e9450082e6b',
    urlAnnual: 'https://www.mercadopago.cl/subscriptions/checkout?preapproval_plan_id=40c3c82bf7974f50892067cae4f29eee'
  },
  {
    id: 'expert',
    name: 'Plan Condor',
    icon: <Bird className="w-6 h-6 text-amber-400" />,
    price: '$29.900',
    priceMonthly: '$29.900',
    priceAnnually: '$299.000',
    features: [
      { text: '50 Planificaciones de clases', included: true },
      { text: '50 PPTs editables', included: true },
      { text: '50 Quiz Interactivos', included: true },
      { text: '50 Evaluaciones + Retroalimentacion Pedagogica', included: true },
      { text: '450 Imagenes Premium', included: true },
      { text: 'Soporte WhatsApp prioritario + Q&A mensual', included: true },
    ],
    url: 'https://www.mercadopago.cl/subscriptions/checkout?preapproval_plan_id=e072662afe1d4cda8639bf83938df1b1',
    urlAnnual: 'https://www.mercadopago.cl/subscriptions/checkout?preapproval_plan_id=87592c4a7a5c4dfdb79e8f7c3abe2d7d'
  }
];

const PRICE_PER_CLASS: Record<string, string> = {
  free: '$0',
  basic: '$695',
  pro: '$626',
  expert: '$598',
};

export const Pricing: React.FC = () => {
  const router = useRouter();
  const supabase = createClient();
  const { open: openRegister } = useRegisterModal();
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; mins: number; secs: number } | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [pioneerCount, setPioneerCount] = useState<number | null>(null);
  const { plan: currentPlan, isLoading } = useSubscriptionStore();
  const [paymentPending, setPaymentPending] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  // Poll user_subscriptions to detect webhook update
  const startPaymentPolling = useCallback((expectedPlan: string) => {
    stopPolling();
    let attempts = 0;
    const MAX_ATTEMPTS = 90; // 6 minutes max (4s intervals)

    pollRef.current = setInterval(async () => {
      attempts++;
      if (attempts > MAX_ATTEMPTS) {
        stopPolling();
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data } = await supabase
          .from('user_subscriptions')
          .select('plan_type, status')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (data && data.plan_type !== 'free' && data.status === 'active') {
          stopPolling();
          setPaymentSuccess(true);
          trackEvent('payment_confirmed', { plan: data.plan_type });
          setTimeout(() => {
            router.push('/dashboard');
          }, 2000);
        }
      } catch {
        // Silently retry
      }
    }, 4000);
  }, [stopPolling, router, supabase]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date('2026-04-15T23:59:59') - +new Date();

      if (difference > 0) {
        return {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          mins: Math.floor((difference / 1000 / 60) % 60),
          secs: Math.floor((difference / 1000) % 60),
        };
      }
      return null;
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 6.1 -- Dynamic pioneer counter
  useEffect(() => {
    supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('plan', 'pioneer')
      .then(({ count }) => {
        if (count !== null) setPioneerCount(count);
      });
  }, []);

  const openPayment = async (url: string, planName?: string) => {
    trackEvent('payment_start', { plan: planName || 'unknown', location: 'pricing' });

    // Check if user is logged in before opening payment
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      openRegister();
      return;
    }

    setPaymentPending(planName || 'tu plan');
    setPaymentSuccess(false);
    startPaymentPolling(planName || 'unknown');
    window.open(url, 'mercadopago_checkout', 'width=800,height=600,scrollbars=yes,resizable=yes,centerscreen=yes');
  };

  return (
    <>
      <section id="founders" className="py-20 px-4">
        <FadeIn>
          <div className="container max-w-4xl mx-auto relative">
            {timeLeft ? (
              <div className="rounded-3xl border border-primary/20 bg-card/60 backdrop-blur-sm p-8 md:p-12 relative overflow-hidden shadow-[0_0_60px_-20px_rgba(139,92,246,0.2)]">
                {/* Top accent */}
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                {/* Ambient glow */}
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

                <div className="text-center mb-10 relative z-10">
                  <span className="inline-block bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-semibold border border-primary/20 mb-4">
                    Oferta Miembros Pioneros
                  </span>
                  <h3 className="text-3xl md:text-4xl font-bold font-heading text-white tracking-tight mb-2">
                    Asegura tu acceso de por vida
                  </h3>
                  <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                    Precio congelado para siempre. Ahorra <span className="text-white font-semibold">$834.000 CLP</span> al ano.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 items-stretch mb-10 relative z-10">
                  {/* Value stack */}
                  <div className="rounded-2xl border border-white/[0.06] bg-background/50 p-6">
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-5 pb-3 border-b border-white/[0.06]">Lo que recibes hoy</h4>
                    <ul className="space-y-3">
                      {[
                        { name: 'Plan Pionero', detail: '40 clases/mes', price: '$359.000' },
                        { name: 'Constructor de Pruebas Sumativas', detail: 'Bonus #1', price: '$250.000' },
                        { name: 'Grupo Privado "Pioneros"', detail: 'Bonus #2', price: '$150.000' },
                        { name: 'Sesion Q&A Mensual', detail: 'Bonus #3', price: '$200.000' },
                        { name: 'Acceso Anticipado', detail: 'Bonus #4', price: '$75.000' },
                      ].map((item, i) => (
                        <li key={i} className="flex justify-between items-center">
                          <div className="flex items-center gap-2.5">
                            <div className="w-5 h-5 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
                              <Check size={12} className="text-emerald-400" />
                            </div>
                            <span className="text-sm text-foreground/80">
                              <strong className="text-white">{item.name}</strong> <span className="text-muted-foreground">({item.detail})</span>
                            </span>
                          </div>
                          <span className="text-sm font-medium text-muted-foreground ml-2 shrink-0">{item.price}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="border-t border-dashed border-white/10 pt-3 mt-4 flex justify-between items-center">
                      <span className="text-sm font-medium text-muted-foreground">Valor total anual</span>
                      <span className="font-semibold text-muted-foreground line-through decoration-1">$1.034.000</span>
                    </div>
                  </div>

                  {/* Price + CTA */}
                  <div className="rounded-2xl border border-primary/20 bg-gradient-to-b from-primary/[0.06] to-transparent p-6 flex flex-col items-center justify-center text-center">
                    <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">Oferta Exclusiva Pioneros</p>
                    <div className="text-5xl md:text-6xl font-bold text-white tracking-tight mb-1">
                      $200.000
                    </div>
                    <span className="text-lg text-foreground/80 font-medium mb-1">pago anual</span>
                    <span className="text-sm text-muted-foreground mb-2">Precio congelado de por vida &middot; Ahorras 81%</span>
                    <span className="inline-block text-[11px] text-amber-400/90 font-medium bg-amber-400/10 border border-amber-400/20 rounded-full px-3 py-1 mb-6">Al llegar a 100 usuarios este plan desaparece y los precios suben</span>

                    <Button
                      onClick={() => { trackEvent('plan_click', { plan: 'pioneer', location: 'pricing' }); openPayment('https://www.mercadopago.cl/subscriptions/checkout?preapproval_plan_id=2ae17611df5e4db5a78518a2b2e373f6', 'pioneer'); }}
                      variant="primary"
                      className="w-full py-4 text-lg font-bold"
                    >
                      Quiero Recuperar Mis Tardes
                    </Button>

                    <div className="mt-5 pt-4 border-t border-white/[0.06] w-full">
                      <div className="flex items-center justify-center gap-2 text-xs text-emerald-400 font-medium mb-1">
                        <ShieldCheck size={14} />
                        <span>Garantia de Recompra de Tiempo</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Si no quedas conforme con el resultado, te devolvemos el 100%.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Countdown */}
                <div className="flex flex-wrap justify-center gap-3 mb-4 relative z-10">
                  {[
                    { label: 'Dias', value: timeLeft.days },
                    { label: 'Horas', value: timeLeft.hours },
                    { label: 'Mins', value: timeLeft.mins },
                    { label: 'Segs', value: timeLeft.secs }
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl bg-background/80 border border-white/[0.06] px-4 py-2.5 min-w-[68px] text-center">
                      <div className="text-xl font-bold text-white tabular-nums">{item.value < 10 ? `0${item.value}` : item.value}</div>
                      <div className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider">{item.label}</div>
                    </div>
                  ))}
                </div>

                <p className="text-center text-xs text-muted-foreground/60 relative z-10">
                  {pioneerCount !== null
                    ? `${100 - pioneerCount} de 100 cupos disponibles para Pioneros`
                    : 'Solo 100 cupos disponibles para Pioneros'}
                </p>
              </div>
            ) : (
              <div className="rounded-3xl border border-primary/20 bg-card/60 backdrop-blur-sm p-8 md:p-12 text-center relative overflow-hidden shadow-[0_0_60px_-20px_rgba(139,92,246,0.2)]">
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                <span className="inline-block bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-semibold border border-primary/20 mb-4">
                  Oferta Miembros Pioneros
                </span>
                <h3 className="text-3xl md:text-4xl font-bold font-heading text-white tracking-tight mb-3">
                  Ultimos cupos disponibles
                </h3>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-4">
                  La oferta Pionero sigue activa mientras queden cupos. 40 clases/mes con precio congelado de por vida.
                </p>
                <p className="text-sm text-amber-400/90 font-medium mb-8">Al llegar a 100 usuarios este plan desaparece y los precios suben.</p>
                <Button
                  onClick={() => { trackEvent('plan_click', { plan: 'pioneer', location: 'pricing' }); openPayment('https://www.mercadopago.cl/subscriptions/checkout?preapproval_plan_id=2ae17611df5e4db5a78518a2b2e373f6', 'pioneer'); }}
                  variant="primary"
                  className="py-4 px-10 text-lg font-bold"
                >
                  Asegurar mi cupo Pionero -- $200.000/ano
                </Button>
                <p className="text-xs text-muted-foreground/60 mt-4">
                  {pioneerCount !== null
                    ? `${100 - pioneerCount} de 100 cupos disponibles para Pioneros`
                    : 'Solo 100 cupos disponibles para Pioneros'}
                </p>
              </div>
            )}
          </div>
        </FadeIn>
      </section>

      <section id="planes" className="py-24 bg-background relative overflow-hidden">
        {/* Glow effect for section */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">
          <FadeIn>
            <SectionTitle
              title="Tu Sistema Operativo Pedagogico"
              subtitle="Cada plan incluye planificaciones cerebro-compatibles con respaldo neuroeducativo. Elige segun tu volumen de clases."
            />
          </FadeIn>

          {/* 6.14 -- Billing toggle */}
          <div className="flex justify-center mb-16">
            <div className="inline-flex items-center bg-card/60 border border-white/10 rounded-full p-1">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${billingCycle === 'monthly' ? 'bg-primary text-white shadow-lg' : 'text-muted-foreground hover:text-white'}`}
              >
                Mensual
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all relative ${billingCycle === 'annual' ? 'bg-primary text-white shadow-lg' : 'text-muted-foreground hover:text-white'}`}
              >
                Anual
                <span className="absolute -top-2.5 -right-2 bg-emerald-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">-17%</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {plans.map((plan, idx) => {
              const isCurrentPlan = currentPlan === plan.id;
              const isFree = plan.id === 'free';
              const pricePerClass = PRICE_PER_CLASS[plan.id];

              return (
                <FadeIn key={plan.id} delay={idx * 0.1}>
                  <div
                    className={`
                    relative rounded-3xl p-7 flex flex-col h-full transition-all duration-300
                    ${plan.recommended
                        ? 'bg-gradient-to-b from-[#1e1b4b] to-[#0f0f1a] border border-primary/50 shadow-[0_0_40px_rgba(76,29,149,0.3)] transform md:-translate-y-4 md:scale-[1.03] z-10'
                        : 'bg-card/50 backdrop-blur-sm border border-white/10 hover:border-primary/30 hover:bg-card/80 hover:-translate-y-2 hover:shadow-2xl'
                      }
                  `}
                  >
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-2">
                        {plan.icon}
                        <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                          {billingCycle === 'annual' && !isFree ? plan.priceAnnually : plan.priceMonthly}
                        </span>
                        {!isFree && <span className="text-muted-foreground text-sm">/{billingCycle === 'annual' ? 'ano' : 'mes'}</span>}
                        {isFree && <span className="text-muted-foreground text-sm">para siempre</span>}
                      </div>
                      {!isFree && (
                        <div className="text-xs text-muted-foreground mt-1 font-medium">
                          IVA incluido &middot; <span className="text-primary font-semibold">{pricePerClass}/clase</span>
                          {billingCycle === 'annual' && <span className="text-emerald-400 ml-1">&middot; Ahorras 2 meses</span>}
                        </div>
                      )}
                      {isFree && (
                        <div className="text-xs text-muted-foreground mt-1 font-medium">3 clases incluidas (no renovables)</div>
                      )}
                      <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                        {plan.id === 'free' && "Prueba el sistema sin compromiso. Al agotar tus 3 clases, elige un plan para continuar."}
                        {plan.id === 'basic' && "Ideal para comenzar a planificar con neuroeducacion."}
                        {plan.id === 'pro' && "Todo el sistema pedagogico + evaluaciones con correccion automatizada."}
                        {plan.id === 'expert' && "Maxima capacidad para profesores con alta carga horaria."}
                      </p>
                    </div>

                    <div className="mb-6">
                      <Button
                        onClick={() => {
                          if (isCurrentPlan) return;
                          trackEvent('plan_click', { plan: plan.id, location: 'pricing_table' });
                          if (isFree) { openRegister(); return; }
                          const payUrl = billingCycle === 'annual' && plan.urlAnnual ? plan.urlAnnual : plan.url;
                          openPayment(payUrl, plan.id);
                        }}
                        variant={isCurrentPlan ? "outline" : isFree ? "outline" : "primary"}
                        fullWidth
                        className="py-3 font-bold"
                        disabled={isCurrentPlan}
                      >
                        {isCurrentPlan ? "Tu Plan Actual" : isFree ? "Crear Cuenta Gratis" : `Comenzar con ${plan.name.replace('Plan ', '')}`}
                      </Button>
                    </div>

                    <div className="border-t border-white/10 pt-6 flex-grow">
                      <ul className="space-y-3">
                        {plan.features.map((feature, i) => (
                          <li key={i} className={`flex items-start gap-3 text-sm ${feature.included ? 'text-foreground/70' : 'text-muted-foreground/40 line-through'}`}>
                            <div className={`
                            rounded-full p-0.5 shrink-0
                            ${!feature.included ? 'bg-white/5 text-muted-foreground/30' : plan.recommended ? 'bg-primary text-background' : 'bg-white/10 text-primary'}
                          `}>
                              <Check size={14} strokeWidth={3} />
                            </div>
                            <span>
                              {feature.text.split(/(Planificaciones|PPTs|Quiz|Evaluaciones|Imagenes|Soporte|Q&A)/g).map((part, pidx) =>
                                ['Planificaciones', 'PPTs', 'Quiz', 'Evaluaciones', 'Imagenes', 'Soporte', 'Q&A'].includes(part) ? (
                                  <strong key={pidx} className={feature.included ? 'text-white' : ''}>{part}</strong>
                                ) : (
                                  part
                                )
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </FadeIn>
              );
            })}
          </div>

          {/* 6.6 -- Plan Establecimiento B2B */}
          <div className="mt-16 max-w-5xl mx-auto">
            <FadeIn>
              <div className="rounded-3xl border border-blue-500/20 bg-gradient-to-br from-blue-500/[0.06] to-cyan-500/[0.03] p-8 md:p-10 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-400/30 to-transparent" />
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

                <div className="text-center mb-8 relative z-10">
                  <span className="inline-block bg-blue-500/10 text-blue-400 px-4 py-1.5 rounded-full text-sm font-semibold border border-blue-500/20 mb-4">
                    <School size={14} className="inline -mt-0.5 mr-1.5" />
                    Para Colegios
                  </span>
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-3 tracking-tight">
                    Plan Establecimiento
                  </h3>
                  <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                    Cada profesor recibe el plan completo: planificaciones, evaluaciones, retroalimentacion pedagogica IA y 50 clases/mes.
                    Panel de administracion para Direccion y UTP con reportes de cobertura curricular.
                  </p>
                  <p className="text-sm text-blue-400 font-semibold mt-2">Planes desde $9.600 por profesor</p>
                </div>

                {/* Tiers grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8 relative z-10">
                  {[
                    { name: 'Basico', profs: 'Hasta 10', price: '$150.000', perProf: '$15.000/prof' },
                    { name: 'Pequeno', profs: 'Hasta 20', price: '$260.000', perProf: '$13.000/prof', popular: true },
                    { name: 'Mediano', profs: 'Hasta 35', price: '$385.000', perProf: '$11.000/prof' },
                    { name: 'Grande', profs: 'Hasta 50+', price: '$480.000', perProf: '$9.600/prof' },
                  ].map((tier, i) => (
                    <div
                      key={i}
                      className={`rounded-2xl p-4 md:p-5 text-center transition-all ${
                        tier.popular
                          ? 'border-2 border-blue-400/40 bg-blue-500/10 shadow-[0_0_30px_rgba(59,130,246,0.15)]'
                          : 'border border-white/[0.08] bg-background/40'
                      }`}
                    >
                      {tier.popular && (
                        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Mas elegido</span>
                      )}
                      <p className="text-sm font-semibold text-white mt-1">{tier.name}</p>
                      <p className="text-xs text-muted-foreground mb-2">{tier.profs} profesores</p>
                      <p className="text-2xl md:text-3xl font-bold text-white">{tier.price}</p>
                      <p className="text-xs text-muted-foreground">/mes</p>
                      <p className="text-xs text-blue-400 font-medium mt-1">{tier.perProf}</p>
                    </div>
                  ))}
                </div>

                {/* Features + CTA */}
                <div className="flex flex-col md:flex-row items-start gap-8 relative z-10">
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Cada profesor recibe</h4>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        '50 clases/mes (Plan Condor completo)',
                        'Evaluaciones + Lector OMR',
                        'Retroalimentacion pedagogica IA',
                        'Panel Direccion y UTP con reportes',
                        'Cobertura curricular por departamento',
                        'Capacitacion inicial incluida',
                        'Facturacion institucional',
                        'Soporte prioritario WhatsApp',
                      ].map((item, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-foreground/80">
                          <Check size={14} className="text-blue-400 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="shrink-0 text-center md:text-right">
                    <Button
                      onClick={() => {
                        trackEvent('click_cta', { plan: 'establecimiento', location: 'pricing' });
                        window.open('https://wa.me/56995155799?text=Hola%2C%20me%20interesa%20el%20Plan%20Establecimiento%20de%20EducMark', '_blank');
                      }}
                      variant="primary"
                      className="px-8 py-3 font-bold"
                    >
                      Solicitar Demo Institucional
                    </Button>
                    <p className="text-xs text-muted-foreground/60 mt-3">
                      <a href="/colegios" className="text-blue-400 hover:underline">Ver pagina completa &rarr;</a>
                    </p>
                    <p className="text-xs text-muted-foreground/40 mt-1">IVA incluido en todos los tramos</p>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>

          <div className="mt-12 text-center max-w-3xl mx-auto space-y-4">
            <p className="text-muted-foreground text-sm">
              Todos los planes ofrecen la misma calidad premium. Los creditos se renuevan cada mes.<br />
              <span className="text-primary/80 font-medium">Desde $695 por clase perfecta -- menos que un cafe.</span>
            </p>
            {/* 5.5 -- MercadoPago trust badge */}
            <div className="flex items-center justify-center gap-3 mt-4">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60 bg-white/[0.03] border border-white/[0.06] rounded-full px-3 py-1.5">
                <ShieldCheck size={14} className="text-[#009EE3]/70" />
                <span>Pago seguro con MercadoPago</span>
              </div>
            </div>

            <div className="mt-12 rounded-3xl border border-emerald-500/20 bg-emerald-500/[0.04] p-8 md:p-10 max-w-4xl mx-auto relative overflow-hidden">
              <div className="flex flex-col md:flex-row items-start gap-8 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <ShieldCheck className="text-emerald-400 w-7 h-7" />
                </div>
                <div className="text-left">
                  <h4 className="text-xl md:text-2xl font-bold text-white mb-3 tracking-tight">
                    Garantia de Recompra de Tiempo -- 7 Dias
                  </h4>
                  <p className="text-muted-foreground leading-relaxed">
                    Si luego de probar EducMark por 7 dias no quedas conforme con el resultado, no merecemos tu dinero. Te devolveremos el 100% de tu inversion en 24 horas. <strong className="text-foreground/90">Cero letras chicas.</strong>
                  </p>
                  <p className="text-sm font-medium text-emerald-400/80 mt-4 pt-4 border-t border-emerald-500/10">
                    El unico riesgo que corres es seguir trabajando los domingos.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* 2.15 + 2.16 -- Payment verification overlay */}
      {paymentPending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="relative bg-card border border-white/10 rounded-3xl p-8 md:p-10 max-w-md w-full mx-4 text-center shadow-2xl">
            {!paymentSuccess && (
              <button
                onClick={() => { setPaymentPending(null); stopPolling(); }}
                className="absolute top-4 right-4 text-muted-foreground hover:text-white transition-colors"
                aria-label="Cerrar"
              >
                <X size={20} />
              </button>
            )}

            {paymentSuccess ? (
              <>
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-5">
                  <CheckCircle2 className="text-emerald-400 w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Pago confirmado!</h3>
                <p className="text-muted-foreground">
                  Tu suscripcion esta activa. Redirigiendo al dashboard...
                </p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-5">
                  <Loader2 className="text-primary w-8 h-8 animate-spin" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Verificando tu suscripcion...</h3>
                <p className="text-muted-foreground mb-6">
                  Completa tu pago en la ventana de MercadoPago. Detectaremos tu suscripcion automaticamente.
                </p>
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/60">
                  <ShieldCheck size={14} className="text-[#009EE3]/70" />
                  <span>Pago seguro con MercadoPago</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};
