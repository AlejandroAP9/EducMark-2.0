'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Download, Mail, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { trackEvent } from '@/shared/lib/analytics';

export function EbookLeadMagnet() {
    const [email, setEmail] = useState('');
    const [nombre, setNombre] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;

        setSubmitting(true);
        try {
            const res = await fetch('/api/ebook/capture', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim(), nombre: nombre.trim() || undefined }),
            });

            if (!res.ok) {
                const { error } = await res.json().catch(() => ({ error: 'Error desconocido' }));
                throw new Error(error);
            }

            const { pdfUrl, emailSent } = await res.json();

            trackEvent('ebook_download', { source: 'landing_ebook', emailSent });

            // Abrir PDF en nueva pestaña (descarga inmediata)
            window.open(pdfUrl, '_blank', 'noopener,noreferrer');

            setDone(true);
            toast.success(
                emailSent
                    ? 'Listo. El ebook se abre en una nueva pestaña y te llega copia al email.'
                    : 'Listo. El ebook se abre en una nueva pestaña.'
            );
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'No pudimos procesar tu descarga.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <section id="ebook" className="relative py-20 md:py-28 overflow-hidden">
            {/* Background glow */}
            <div className="absolute inset-0 -z-10 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl" />
            </div>

            <div className="max-w-6xl mx-auto px-4 md:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
                    {/* Left: cover */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: '-100px' }}
                        transition={{ duration: 0.6 }}
                        className="relative mx-auto w-full max-w-sm"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-secondary/30 rounded-2xl blur-2xl -z-10" />
                        <Image
                            src="/images/ebook-cover.jpg"
                            alt="Portada del ebook 'De 12 Horas a 5 Minutos'"
                            width={480}
                            height={640}
                            className="rounded-2xl shadow-2xl border border-white/10 w-full h-auto"
                            priority={false}
                        />
                    </motion.div>

                    {/* Right: copy + form */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: '-100px' }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                    >
                        <span className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider border border-primary/25 mb-5">
                            <Download size={14} /> Ebook gratis — sin crear cuenta
                        </span>

                        <h2 className="text-3xl md:text-5xl font-bold text-foreground tracking-tight leading-tight mb-4 font-[family-name:var(--font-heading)]">
                            De 12 Horas a <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">5 Minutos</span>
                        </h2>

                        <p className="text-muted-foreground text-lg leading-relaxed mb-2">
                            16 páginas honestas sobre cómo la IA puede recuperarte las tardes
                            sin convertirte en un &quot;prompt engineer&quot;.
                        </p>
                        <p className="text-muted-foreground text-base leading-relaxed mb-8">
                            Lo escribe un profe chileno con 20 años de aula, para profes chilenos.
                        </p>

                        {done ? (
                            <div className="flex items-start gap-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl px-4 py-3">
                                <CheckCircle2 size={22} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-foreground font-semibold text-sm">
                                        ¡Listo! Si no se abrió la descarga, revisá tu email.
                                    </p>
                                    <p className="text-muted-foreground text-xs mt-1">
                                        El PDF queda guardado en tu bandeja de entrada para cuando quieras.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-3">
                                <div>
                                    <input
                                        type="text"
                                        value={nombre}
                                        onChange={(e) => setNombre(e.target.value)}
                                        placeholder="Tu nombre (opcional)"
                                        className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                                        disabled={submitting}
                                        autoComplete="name"
                                    />
                                </div>
                                <div className="relative">
                                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="tucorreo@colegio.cl"
                                        required
                                        className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-xl pl-11 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                                        disabled={submitting}
                                        autoComplete="email"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={submitting || !email.trim()}
                                    className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" /> Preparando tu ebook…
                                        </>
                                    ) : (
                                        <>
                                            <Download size={18} /> Descargar ebook gratis
                                        </>
                                    )}
                                </button>
                                <p className="text-xs text-muted-foreground text-center">
                                    También te lo enviamos por email. Sin spam.
                                </p>
                            </form>
                        )}
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
