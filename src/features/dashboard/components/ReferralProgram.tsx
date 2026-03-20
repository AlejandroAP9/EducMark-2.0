'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Gift, Copy, CheckCircle2, Users, Share2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { trackEvent } from '@/shared/lib/analytics';

interface ReferralEvent {
    id: string;
    created_at: string;
    status: string;
    credits_given_referrer: number;
}

export function ReferralButton() {
    const supabase = createClient();
    const [referralCode, setReferralCode] = useState<string>('');
    const [referrals, setReferrals] = useState<ReferralEvent[]>([]);
    const [copied, setCopied] = useState(false);
    const [showPanel, setShowPanel] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchReferralData = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session?.user) return;

                const uid = session.user.id;

                const { data: profile } = await supabase
                    .from('user_profiles')
                    .select('referral_code')
                    .eq('user_id', uid)
                    .single();

                let code = profile?.referral_code;

                if (!code) {
                    code = uid.replace(/-/g, '').slice(0, 8).toLowerCase();
                    await supabase
                        .from('user_profiles')
                        .update({ referral_code: code })
                        .eq('user_id', uid);
                }

                setReferralCode(code);

                const { data: events } = await supabase
                    .from('referral_events')
                    .select('id, created_at, status, credits_given_referrer')
                    .eq('referrer_id', uid)
                    .order('created_at', { ascending: false });

                if (events) setReferrals(events);
            } catch (err) {
                console.warn('[ReferralButton] Error:', err);
            }
        };

        fetchReferralData();
    }, []);

    // Close panel on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setShowPanel(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const referralLink = referralCode
        ? `https://educmark.cl/login?tab=register&ref=${referralCode}`
        : '';

    const totalCreditsEarned = referrals.reduce((sum, r) => sum + r.credits_given_referrer, 0);

    const handleCopy = () => {
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        toast.success('Link copiado al portapapeles');
        trackEvent('referral_copy_link', { code: referralCode });
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShare = () => {
        const text = `Prueba EducMark \u2014 planifica clases en 6 minutos con IA alineada al curr\u00edculum MINEDUC. Reg\u00edstrate con mi link y recibe 2 clases extra gratis: ${referralLink}`;
        trackEvent('referral_share', { code: referralCode });

        if (navigator.share) {
            navigator.share({ title: 'EducMark \u2014 Invita a un Colega', text }).catch(() => {});
        } else {
            navigator.clipboard.writeText(text);
            toast.success('Texto copiado \u2014 comp\u00e1rtelo con un colega');
        }
    };

    return (
        <div className="relative" ref={panelRef} id="referral-button">
            <button
                onClick={() => setShowPanel(!showPanel)}
                className="relative p-2 rounded-lg hover:bg-[var(--card-hover)] transition-colors"
                title="Invita a un colega"
            >
                <Gift size={20} className="text-amber-400" />
                {totalCreditsEarned > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-emerald-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {totalCreditsEarned > 9 ? '9+' : totalCreditsEarned}
                    </span>
                )}
            </button>

            {showPanel && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl z-50 overflow-hidden">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-[var(--border)] bg-gradient-to-r from-amber-500/10 to-emerald-500/10">
                        <h3 className="font-semibold text-sm text-[var(--on-background)] flex items-center gap-2">
                            <Gift size={16} className="text-amber-400" />
                            Invita a un Colega
                        </h3>
                        <p className="text-[11px] text-[var(--muted)] mt-0.5">
                            Gana <span className="text-amber-400 font-medium">5 clases</span> por referido.
                            Tu colega recibe <span className="text-emerald-400 font-medium">2 extra</span>.
                        </p>
                    </div>

                    {/* Link + actions */}
                    <div className="p-4 space-y-3">
                        <div className="flex gap-2">
                            <input
                                readOnly
                                value={referralLink || 'Cargando...'}
                                className="flex-1 bg-[var(--input-bg)] border border-[var(--border)] rounded-lg px-2.5 py-2 text-xs text-[var(--on-background)] truncate min-w-0"
                            />
                            <button
                                onClick={handleCopy}
                                disabled={!referralCode}
                                className="shrink-0 px-3 py-2 rounded-lg bg-[var(--primary)] text-white text-xs font-medium hover:opacity-90 transition-opacity flex items-center gap-1 disabled:opacity-50"
                            >
                                {copied ? <CheckCircle2 size={13} /> : <Copy size={13} />}
                                {copied ? 'Listo' : 'Copiar'}
                            </button>
                        </div>

                        <button
                            onClick={handleShare}
                            disabled={!referralCode}
                            className="w-full px-3 py-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                            <Share2 size={13} />
                            Compartir con mensaje
                        </button>

                        {/* Stats */}
                        <div className="flex items-center justify-around pt-2 border-t border-[var(--border)]">
                            <div className="flex items-center gap-1.5 text-center">
                                <Users size={14} className="text-[var(--primary)]" />
                                <span className="text-base font-bold text-[var(--on-background)]">{referrals.length}</span>
                                <span className="text-[10px] text-[var(--muted)] uppercase tracking-wider">Invitados</span>
                            </div>
                            <div className="w-px h-6 bg-[var(--border)]" />
                            <div className="flex items-center gap-1.5 text-center">
                                <Gift size={14} className="text-emerald-400" />
                                <span className="text-base font-bold text-emerald-400">{totalCreditsEarned}</span>
                                <span className="text-[10px] text-[var(--muted)] uppercase tracking-wider">Ganadas</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
