'use client';

import React, { useState, useEffect } from 'react';
import { Check, Mail, Lock, User, Loader, X as XIcon, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/components/ui/UIComponents';
import { createClient } from '@/lib/supabase/client';
import { trackEvent } from '@/shared/lib/analytics';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  location?: string;
}

export const RegisterModal: React.FC<RegisterModalProps> = ({ isOpen, onClose, location = 'modal' }) => {
  const router = useRouter();
  const supabase = createClient();
  const [formStep, setFormStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMSG, setErrorMSG] = useState('');

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormStep(1);
      setEmail('');
      setPassword('');
      setName('');
      setErrorMSG('');
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMSG('');

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      });
      if (error) throw error;
      trackEvent('signup_complete', { method: 'email', location });
      onClose();
      router.push('/dashboard');
    } catch (error: unknown) {
      let msg = error instanceof Error ? error.message : 'Error desconocido';
      if (msg.includes('already registered')) msg = 'Este correo ya esta registrado.';
      setErrorMSG(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    trackEvent('signup_start', { method: 'google', location });
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setErrorMSG('Error al conectar con Google: ' + error.message);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-[var(--card)] border border-white/10 rounded-2xl shadow-2xl p-6 md:p-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-white transition-colors"
          aria-label="Cerrar"
        >
          <XIcon size={20} />
        </button>

        {/* Header */}
        <div className="text-center mb-5">
          <h2 className="text-xl md:text-2xl font-bold text-foreground">
            Crea tu cuenta gratuita
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            3 clases completas gratis &middot; Sin tarjeta de cr&eacute;dito
          </p>
        </div>

        {/* Google OAuth */}
        <button
          type="button"
          onClick={handleGoogleSignup}
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
          {formStep === 1 && (
            <>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground ml-1">Correo Electr&oacute;nico</label>
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
                    setErrorMSG('Ingresa un correo electr\u00f3nico v\u00e1lido.');
                    return;
                  }
                  setErrorMSG('');
                  trackEvent('signup_start', { method: 'email', location });
                  setFormStep(2);
                }}
              >
                Continuar
              </Button>
            </>
          )}

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
                <label className="text-xs font-medium text-muted-foreground ml-1">Contrase&ntilde;a</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 w-4 h-4 group-focus-within:text-primary transition-colors" />
                  <input
                    type="password"
                    placeholder="M&iacute;nimo 8 caracteres"
                    className="w-full bg-background border border-white/10 rounded-xl px-10 py-2.5 text-sm text-white placeholder:text-muted-foreground/30 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="flex items-center gap-2 mt-1 ml-1">
                  {password.length === 0 ? (
                    <p className="text-[10px] text-muted-foreground/60">8+ caracteres &middot; 1 may&uacute;scula &middot; 1 n&uacute;mero o s&iacute;mbolo</p>
                  ) : password.length < 8 ? (
                    <>
                      <div className="h-0.5 w-16 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-destructive/70 w-1/3 rounded-full"></div>
                      </div>
                      <p className="text-[10px] text-destructive/70">D&eacute;bil &mdash; necesita 8+ caracteres</p>
                    </>
                  ) : (
                    <>
                      <div className="h-0.5 w-16 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 w-full rounded-full"></div>
                      </div>
                      <p className="text-[10px] text-emerald-400">Contrase&ntilde;a v&aacute;lida</p>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3 mt-1">
                <div className="relative flex items-center pt-0.5">
                  <input
                    type="checkbox"
                    required
                    id="modal-terms"
                    aria-label="Acepto los terminos y condiciones y la politica de privacidad"
                    className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-white/30 bg-background checked:border-primary checked:bg-primary transition-all focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background"
                  />
                  <Check className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100" size={14} strokeWidth={3} />
                </div>
                <label htmlFor="modal-terms" className="text-xs text-muted-foreground leading-tight select-none cursor-pointer">
                  Acepto los <a href="/terms" target="_blank" className="text-primary hover:underline">t&eacute;rminos y condiciones</a> y la <a href="/privacy" target="_blank" className="text-primary hover:underline">pol&iacute;tica de privacidad</a>.
                </label>
              </div>

              {errorMSG && <p className="text-red-400 text-xs text-center bg-red-500/10 py-1.5 rounded-lg border border-red-500/20">{errorMSG}</p>}

              <Button
                type="submit"
                fullWidth
                disabled={loading}
                className="py-3 text-base font-bold mt-1"
              >
                {loading ? <Loader className="animate-spin w-5 h-5" /> : 'Crear Cuenta Gratis'}
              </Button>
            </>
          )}
        </form>

        {/* Guarantee */}
        <div className="flex justify-center mt-3">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-white/5 px-3 py-1 rounded-full border border-white/10">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>Garant&iacute;a 7 d&iacute;as &middot; Sin tarjeta de cr&eacute;dito</span>
          </div>
        </div>
      </div>
    </div>
  );
};
