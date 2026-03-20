'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Check, Mail, Lock, User, Loader, Play, Pause, Volume2, VolumeX, Settings, ShieldCheck, Zap } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Button, FadeIn } from '@/shared/components/ui/UIComponents';
import { LegalModals } from './LegalModals';
import { createClient } from '@/lib/supabase/client';
import { trackEvent } from '@/shared/lib/analytics';

export const Hero: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const router = useRouter();
  const supabase = createClient();

  // Form State
  const [formStep, setFormStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMSG, setErrorMSG] = useState('');
  const [activeModal, setActiveModal] = useState<'terms' | 'privacy' | null>(null);

  // Kit counter
  const [kitsGenerated, setKitsGenerated] = useState<number | null>(null);

  useEffect(() => {
    supabase
      .from('generated_classes')
      .select('*', { count: 'exact', head: true })
      .then(({ count }) => {
        if (count !== null) setKitsGenerated(count);
      });
  }, []);

  // Video State
  const videoRef = useRef<HTMLVideoElement>(null);
  const { scrollY } = useScroll();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  // Scroll animations for Video
  const rotateX = useTransform(scrollY, [0, 500], [25, 0]);
  const scale = useTransform(scrollY, [0, 500], [0.92, 1]);
  const opacity = useTransform(scrollY, [0, 500], [0.8, 1]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMSG('');

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });

      if (error) throw error;

      trackEvent('signup_complete', { method: 'email', location: 'hero' });
      router.push('/dashboard');

    } catch (error: unknown) {
      let msg = error instanceof Error ? error.message : 'Error desconocido';
      if (msg.includes('already registered')) msg = 'Este correo ya esta registrado.';
      setErrorMSG(msg);
    } finally {
      setLoading(false);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
        trackEvent('video_play', { location: 'hero' });
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const changeSpeed = (speed: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      setPlaybackRate(speed);
      setShowSettings(false);
    }
  };

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let nodes: { x: number; y: number; vx: number; vy: number }[] = [];
    let animationFrameId: number;

    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initNodes();
    };

    const initNodes = () => {
      nodes = [];
      const densityDivider = window.innerWidth < 768 ? 25000 : 15000;
      const count = Math.floor((width * height) / densityDivider);

      for (let i = 0; i < count; i++) {
        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
        });
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = 'rgba(164, 143, 255, 0.5)';

      nodes.forEach((node, i) => {
        node.x += node.vx;
        node.y += node.vy;

        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;

        ctx.beginPath();
        ctx.arc(node.x, node.y, 2, 0, Math.PI * 2);
        ctx.fill();

        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - node.x;
          const dy = nodes[j].y - node.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 120) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(164, 143, 255, ${0.15 * (1 - dist / 120)})`;
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      });
      animationFrameId = requestAnimationFrame(animate);
    };

    window.addEventListener('resize', resize);
    resize();
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-24 pb-16 lg:pt-32">
      <canvas ref={canvasRef} className="absolute inset-0 z-0 opacity-50 pointer-events-none" />

      {/* Gradient Overlay */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />

      <div className="container mx-auto px-4 z-20 relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center mb-24">

          {/* Left Column: Value Prop */}
          <div className="text-left">
            <FadeIn>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-heading leading-[1.1] mb-6">
                Planifica 10 clases perfectas en 1 hora y <span className="bg-gradient-primary bg-clip-text text-transparent">recupera tus tardes</span>.
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-4 leading-relaxed max-w-xl">
                El primer <strong>Sistema Operativo de Gestion Pedagogica</strong> para el docente chileno. No es un chatbot. Es tu copiloto pedagogico, construido desde el aula.
              </p>
              <p className="text-base text-muted-foreground/70 mb-8 leading-relaxed max-w-xl">
                Los profesores chilenos no necesitan otro chatbot. Necesitan un sistema que entienda las Bases Curriculares, los tiempos de UTP, las NEE, y el agotamiento de trabajar domingos. EducMark es la primera plataforma construida desde el aula para el ciclo completo del docente.
              </p>

              <motion.ul
                className="space-y-4 mb-8"
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: {},
                  visible: {
                    transition: {
                      staggerChildren: 0.15,
                      delayChildren: 0.3
                    }
                  }
                }}
              >
                {[
                  "Motor Curricular 100% ajustado al MINEDUC.",
                  "Generaci\u00f3n autom\u00e1tica de planificaciones, presentaciones y pruebas sumativas.",
                  "Correccion automatizada OMR con la camara de tu celular."
                ].map((item, i) => (
                  <motion.li
                    key={i}
                    className="flex items-center gap-3 text-foreground/90 text-lg"
                    variants={{
                      hidden: { opacity: 0, x: -20 },
                      visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: "easeOut" } }
                    }}
                  >
                    <div className="bg-primary/20 p-1.5 rounded-full text-primary shrink-0">
                      <Check size={20} strokeWidth={3} />
                    </div>
                    {item}
                  </motion.li>
                ))}
              </motion.ul>

              {/* Product metrics as pre-launch social proof */}
              <div className="flex flex-wrap gap-4 mb-4">
                {[
                  { value: '2.000+', label: 'OA indexados' },
                  { value: '6 min', label: 'por clase' },
                  { value: '1° a IV°', label: 'medio' },
                ].map((metric, i) => (
                  <div key={i} className="flex items-center gap-2 bg-white/[0.06] backdrop-blur-md border border-white/[0.12] rounded-full px-4 py-2 hover:bg-white/[0.1] transition-all duration-300">
                    <span className="text-sm font-bold text-white">{metric.value}</span>
                    <span className="text-xs text-muted-foreground">{metric.label}</span>
                  </div>
                ))}
                {kitsGenerated !== null && kitsGenerated > 0 && (
                  <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2">
                    <Zap size={14} className="text-primary" />
                    <span className="text-sm font-bold text-primary">{kitsGenerated.toLocaleString('es-CL')}</span>
                    <span className="text-xs text-muted-foreground">kits generados</span>
                  </div>
                )}
              </div>

              {/* 4.11 + 4.12 -- Trust badges */}
              <div className="flex flex-wrap gap-2">
                {[
                  '100% MINEDUC',
                  'Neuroeducacion: diseno basado en como aprende el cerebro',
                  'Hecho en Chile',
                  'OMR Integrado',
                  'Creado por un docente',
                ].map((badge) => (
                  <span key={badge} className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 bg-white/[0.03] border border-white/[0.06] rounded-full px-3 py-1">
                    {badge}
                  </span>
                ))}
              </div>
            </FadeIn>
          </div>

          {/* Right Column: Form + Image */}
          <div className="relative">
            <FadeIn delay={0.2} className="relative z-10">
              {/* Aurora Glow Orbs */}
              <div className="aurora-orb aurora-orb-primary w-[300px] h-[300px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10"></div>
              <div className="aurora-orb aurora-orb-secondary w-[250px] h-[250px] top-1/3 left-1/3 -z-10"></div>

              <div className="liquid-glass liquid-glass-shine liquid-border rounded-3xl p-5 md:p-6 shadow-[0_0_60px_-15px_rgba(76,29,149,0.5)] max-w-[480px] mx-auto">
                <div className="flex flex-col items-center mb-4">
                  {/* Ebook Image - Static with Hover Glow */}
                  <div className="relative group mb-4 transition-all duration-500">
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary to-purple-400 rounded-lg blur opacity-20 group-hover:opacity-60 transition duration-500"></div>
                    <img
                      src="/images/ebook-cover.jpg"
                      alt="Guia Maestra de Prompts para Profesores - Ebook gratuito de EducMark"
                      width="160"
                      height="213"
                      className="relative w-32 md:w-40 rounded-lg shadow-2xl border border-white/10 group-hover:shadow-[0_0_40px_rgba(139,92,246,0.6)] group-hover:border-primary/50 transition-all duration-300"
                    />
                    {/* Badge */}
                    <div className="absolute -top-3 -right-3 bg-indigo-500 text-white font-bold text-[10px] px-2.5 py-1 rounded-full shadow-lg z-20 border border-white/20">
                      GRATIS
                    </div>
                  </div>

                  <h3 className="text-xl md:text-2xl font-bold text-center text-white leading-tight">Crea tu cuenta gratuita <br /><span className="text-primary">y obten el Ebook</span></h3>
                </div>

                {/* Google OAuth */}
                <button
                  type="button"
                  onClick={async () => {
                    trackEvent('signup_start', { method: 'google', location: 'hero' });
                    const { error } = await supabase.auth.signInWithOAuth({
                      provider: 'google',
                      options: { redirectTo: `${window.location.origin}/auth/callback` },
                    });
                    if (error) setErrorMSG('Error al conectar con Google: ' + error.message);
                  }}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] transition-all text-sm font-medium text-white cursor-pointer mb-3"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Registrarse con Google
                </button>

                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1 h-px bg-white/[0.06]"></div>
                  <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">o con correo</span>
                  <div className="flex-1 h-px bg-white/[0.06]"></div>
                </div>

                {/* Step indicator */}
                <div className="flex items-center gap-2 mb-3">
                  <div className={`h-1 flex-1 rounded-full transition-colors ${formStep >= 1 ? 'bg-primary' : 'bg-white/10'}`} />
                  <div className={`h-1 flex-1 rounded-full transition-colors ${formStep >= 2 ? 'bg-primary' : 'bg-white/10'}`} />
                </div>

                <form onSubmit={handleRegister} className="space-y-3">
                  {/* STEP 1: Email only */}
                  {formStep === 1 && (
                    <>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground ml-1">Correo Electronico</label>
                        <div className="relative group">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 w-4 h-4 group-focus-within:text-primary transition-colors" />
                          <input
                            type="email"
                            placeholder="tu@institucion.edu"
                            className="w-full bg-background border border-white/10 rounded-xl px-10 py-3 text-sm text-white placeholder:text-muted-foreground/30 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoFocus
                          />
                        </div>
                      </div>

                      {errorMSG && <p className="text-red-400 text-xs text-center bg-red-500/10 py-1.5 rounded-lg border border-red-500/20">{errorMSG}</p>}

                      <Button
                        type="button"
                        fullWidth
                        className="py-3 text-base font-bold"
                        onClick={() => {
                          if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                            setErrorMSG('Ingresa un correo electronico valido.');
                            return;
                          }
                          setErrorMSG('');
                          trackEvent('signup_start', { method: 'email', location: 'hero' });
                          setFormStep(2);
                        }}
                      >
                        Probar Gratis
                      </Button>
                    </>
                  )}

                  {/* STEP 2: Name + Password + Terms */}
                  {formStep === 2 && (
                    <>
                      <button
                        type="button"
                        onClick={() => setFormStep(1)}
                        className="text-xs text-muted-foreground hover:text-white transition-colors mb-1 flex items-center gap-1"
                      >
                        &larr; Cambiar correo ({email})
                      </button>

                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground ml-1">Nombre Completo</label>
                        <div className="relative group">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 w-4 h-4 group-focus-within:text-primary transition-colors" />
                          <input
                            type="text"
                            placeholder="Ana Karina Tapia"
                            className="w-full bg-background border border-white/10 rounded-xl px-10 py-2.5 text-sm text-white placeholder:text-muted-foreground/30 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            autoFocus
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground ml-1">Contrasena</label>
                        <div className="relative group">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 w-4 h-4 group-focus-within:text-primary transition-colors" />
                          <input
                            type="password"
                            placeholder="Minimo 8 caracteres"
                            className="w-full bg-background border border-white/10 rounded-xl px-10 py-2.5 text-sm text-white placeholder:text-muted-foreground/30 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                          />
                        </div>
                        {/* Password requirements */}
                        <div className="flex items-center gap-2 mt-1 ml-1">
                          {password.length === 0 ? (
                            <p className="text-[10px] text-muted-foreground/60">8+ caracteres &middot; 1 mayuscula &middot; 1 numero o simbolo</p>
                          ) : password.length < 8 ? (
                            <>
                              <div className="h-0.5 w-16 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-destructive/70 w-1/3 rounded-full"></div>
                              </div>
                              <p className="text-[10px] text-destructive/70">Debil -- necesita 8+ caracteres</p>
                            </>
                          ) : (
                            <>
                              <div className="h-0.5 w-16 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 w-full rounded-full"></div>
                              </div>
                              <p className="text-[10px] text-emerald-400">Contrasena valida</p>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Terms Checkbox */}
                      <div className="flex items-start gap-3 mt-1">
                        <div className="relative flex items-center pt-0.5">
                          <input
                            type="checkbox"
                            required
                            id="terms"
                            aria-label="Acepto los terminos y condiciones y la politica de privacidad"
                            className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-white/30 bg-background checked:border-primary checked:bg-primary transition-all focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background"
                          />
                          <Check className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100" size={14} strokeWidth={3} />
                        </div>
                        <label htmlFor="terms" className="text-xs text-muted-foreground leading-tight select-none cursor-pointer">
                          Acepto los <span
                            className="text-primary hover:underline cursor-pointer"
                            onClick={(e) => { e.preventDefault(); setActiveModal('terms'); }}
                          >
                            terminos y condiciones
                          </span> y la <span
                            className="text-primary hover:underline cursor-pointer"
                            onClick={(e) => { e.preventDefault(); setActiveModal('privacy'); }}
                          >
                            politica de privacidad
                          </span>.
                        </label>
                      </div>

                      {errorMSG && <p className="text-red-400 text-xs text-center bg-red-500/10 py-1.5 rounded-lg border border-red-500/20">{errorMSG}</p>}

                      <Button
                        type="submit"
                        fullWidth
                        disabled={loading}
                        className="py-3 text-base font-bold mt-1"
                      >
                        {loading ? <Loader className="animate-spin w-5 h-5" /> : 'Probar Gratis'}
                      </Button>
                    </>
                  )}

                  {/* Guarantee Badge */}
                  <div className="flex justify-center mt-3">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-white/5 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      <span>Garantia de Recompra de Tiempo -- 7 dias</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-center text-muted-foreground mt-2">
                    * Sin tarjeta de credito requerida &middot; Acceso inmediato &middot; Datos protegidos con SSL
                  </p>
                  {/* 5.2 -- Standards badges */}
                  <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-white/[0.04]">
                    <span className="text-[9px] text-muted-foreground/50 font-medium uppercase tracking-wider">Bases Curriculares MINEDUC</span>
                    <span className="text-muted-foreground/20">|</span>
                    <span className="text-[9px] text-muted-foreground/50 font-medium uppercase tracking-wider flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" /> SSL
                    </span>
                  </div>
                </form>
              </div>
            </FadeIn>
          </div>
        </div>

        {/* === VIDEO SECTION (Restored) === */}
        <FadeIn delay={0.4} className="mt-8 relative max-w-5xl mx-auto group perspective-[1200px]">
          <div className="aurora-orb aurora-orb-primary w-[120%] h-[120%] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10"></div>
          <div className="aurora-orb aurora-orb-secondary w-[80%] h-[80%] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 mix-blend-screen"></div>

          <div className="perspective-[1200px] w-full">
            <motion.div
              style={{ rotateX, scale, opacity }}
              transition={{ type: "spring", stiffness: 100, damping: 30 }}
              className="relative rounded-2xl bg-[#0f111a]/80 backdrop-blur-xl border border-white/[0.12] shadow-2xl overflow-hidden ring-1 ring-white/[0.08] mx-auto group/video"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent z-20 opacity-50"></div>

              <div className="relative">
                <video
                  ref={videoRef}
                  className="w-full h-auto rounded-2xl shadow-inner relative z-10 cursor-pointer"
                  preload="metadata"
                  poster="/images/screenshots/dashboard.jpg"
                  playsInline
                  onClick={togglePlay}
                  onContextMenu={(e) => e.preventDefault()}
                >
                  <source src="https://gjudfgpudbqdhclbmjjo.supabase.co/storage/v1/object/public/EducMark/VSL%20Landing.mp4" type="video/mp4" />
                  Tu navegador no soporta el tag de video.
                </video>

                <div
                  className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent z-20 transition-opacity duration-300 flex items-center gap-4 rounded-b-2xl ${isPlaying ? 'opacity-0 group-hover/video:opacity-100' : 'opacity-100'}`}
                >
                  <button
                    onClick={togglePlay}
                    aria-label={isPlaying ? "Pausar video" : "Reproducir video"}
                    className="text-white hover:text-primary transition-colors p-2 rounded-full hover:bg-white/10"
                  >
                    {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
                  </button>

                  <div className="flex-grow"></div>

                  <div className="flex items-center gap-2">
                    <button onClick={toggleMute} aria-label={isMuted ? "Activar sonido" : "Silenciar video"} className="text-white hover:text-primary transition-colors p-2 rounded-full hover:bg-white/10">
                      {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </button>

                    <div className="relative">
                      <button
                        onClick={() => setShowSettings(!showSettings)}
                        aria-label="Velocidad de reproduccion"
                        className={`text-white hover:text-primary transition-colors p-2 rounded-full hover:bg-white/10 ${showSettings ? 'text-primary bg-white/10' : ''}`}
                      >
                        <Settings size={20} />
                      </button>

                      {showSettings && (
                        <div className="absolute bottom-full right-0 mb-2 bg-[#1a1a2e] border border-white/10 rounded-lg p-2 min-w-[120px] shadow-xl animate-in fade-in slide-in-from-bottom-2">
                          <div className="text-xs text-muted-foreground mb-2 px-2">Velocidad</div>
                          {[0.5, 1, 1.25, 1.5, 2].map(speed => (
                            <button
                              key={speed}
                              onClick={() => changeSpeed(speed)}
                              className={`block w-full text-left px-2 py-1.5 text-sm rounded hover:bg-white/10 ${playbackRate === speed ? 'text-primary font-bold' : 'text-white'}`}
                            >
                              {speed}x
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {!isPlaying && (
                  <div
                    className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
                  >
                    <div className="bg-primary/90 text-white p-6 rounded-full shadow-[0_0_30px_rgba(164,143,255,0.4)] backdrop-blur-sm transform transition-transform group-hover/video:scale-110">
                      <Play size={40} fill="currentColor" className="ml-1" />
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </FadeIn>
      </div>

      <LegalModals activeModal={activeModal} onClose={() => setActiveModal(null)} />
    </section>
  );
};
