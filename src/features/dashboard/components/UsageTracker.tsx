'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useSubscriptionStore } from '@/features/auth/store/subscriptionStore';
import { Wand2, Image as ImageIcon, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface UsageProgressBarProps {
    label: string;
    used: number;
    limit: number;
    icon?: React.ReactNode;
    colorClass?: string;
}

export function UsageProgressBar({
    label, used, limit, icon, colorClass = 'bg-primary'
}: UsageProgressBarProps) {
    const percentage = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
    const isNearLimit = percentage >= 80;
    const isAtLimit = percentage >= 100;

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-[var(--foreground)]">
                    {icon}
                    <span className="font-medium">{label}</span>
                </div>
                <span className={`font-semibold ${isAtLimit ? 'text-red-400' : isNearLimit ? 'text-amber-400' : 'text-[var(--muted)]'}`}>
                    {used} / {limit}
                </span>
            </div>
            <div className="h-2 bg-[var(--input-bg)] rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-500 ${isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-amber-500' : colorClass}`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
            {isNearLimit && !isAtLimit && (
                <p className="text-xs text-amber-400">Te quedan {limit - used} usos este mes</p>
            )}
            {isAtLimit && (
                <p className="text-xs text-red-400">Has alcanzado tu límite mensual</p>
            )}
        </div>
    );
}

interface DailyCount {
    date: string;
    count: number;
}

interface UsageCardProps {
    className?: string;
}

export const UsageCard = React.memo(function UsageCard({ className = '' }: UsageCardProps) {
    const router = useRouter();
    const supabase = createClient();
    const { plan, planName, credits, classesLimit, imagesLimit, isLoading } = useSubscriptionStore();
    const [dailyActivity, setDailyActivity] = useState<DailyCount[]>([]);

    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const formatDate = (date: Date) => date.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });

    const imagesUsed = credits.used * 9;

    useEffect(() => {
        const fetchDaily = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return;

            const days: DailyCount[] = [];

            for (let i = 6; i >= 0; i--) {
                const dayStart = new Date(now);
                dayStart.setDate(dayStart.getDate() - i);
                dayStart.setHours(0, 0, 0, 0);
                const dayEnd = new Date(dayStart);
                dayEnd.setHours(23, 59, 59, 999);

                const { count } = await supabase
                    .from('generated_classes')
                    .select('id', { count: 'exact', head: true })
                    .eq('user_id', session.user.id)
                    .gte('created_at', dayStart.toISOString())
                    .lte('created_at', dayEnd.toISOString());

                days.push({
                    date: dayStart.toLocaleDateString('es-CL', { weekday: 'short' }),
                    count: count || 0,
                });
            }
            setDailyActivity(days);
        };
        fetchDaily();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const daysRemaining = Math.max(0, Math.ceil((periodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
    const maxDaily = Math.max(...dailyActivity.map(d => d.count), 1);

    return (
        <div className={`glass-card-premium p-6 rounded-2xl ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold text-[var(--on-background)]">Tu Uso Este Mes</h3>
                <span className="text-xs font-medium text-[var(--primary)] bg-[var(--primary)]/10 px-3 py-1 rounded-full border border-[var(--primary)]/20">
                    {planName}
                </span>
            </div>

            {/* Period */}
            <div className="flex items-center justify-between mb-5 text-xs text-[var(--muted)]">
                <span>{formatDate(periodStart)} — {formatDate(periodEnd)}</span>
                <span className="font-medium">{daysRemaining} dias restantes</span>
            </div>

            {isLoading ? (
                <div className="space-y-4">
                    <div className="h-8 bg-[var(--input-bg)] rounded animate-pulse" />
                    <div className="h-8 bg-[var(--input-bg)] rounded animate-pulse" />
                </div>
            ) : (
                <div className="space-y-5">
                    <UsageProgressBar
                        label="Generaciones"
                        used={credits.used}
                        limit={classesLimit}
                        icon={<Wand2 className="text-emerald-400" size={16} />}
                        colorClass="bg-gradient-to-r from-emerald-400 to-teal-500"
                    />
                    <UsageProgressBar
                        label="Imágenes Premium"
                        used={imagesUsed}
                        limit={imagesLimit}
                        icon={<ImageIcon className="text-blue-400" size={16} />}
                        colorClass="bg-gradient-to-r from-blue-400 to-indigo-500"
                    />

                    {/* Upgrade CTA when credits ≤ 2 */}
                    {credits.remaining <= 2 && plan !== 'condor' && (
                        <button
                            onClick={() => router.push('/dashboard/subscription')}
                            className="w-full flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/15 transition-colors text-left"
                        >
                            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                                <Zap size={16} className="text-amber-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-amber-400">
                                    {credits.remaining === 0
                                        ? 'Sin clases disponibles'
                                        : `Te ${credits.remaining === 1 ? 'queda' : 'quedan'} ${credits.remaining} ${credits.remaining === 1 ? 'clase' : 'clases'}`}
                                </p>
                                <p className="text-xs text-[var(--muted)]">
                                    {plan === 'free' ? 'Mejora a Copihue — 20 clases/mes' : plan === 'copihue' ? 'Mejora a Araucaria — 35 clases/mes' : 'Mejora a Cóndor — 50 clases/mes'}
                                </p>
                            </div>
                        </button>
                    )}

                    {dailyActivity.length > 0 && (
                        <div className="pt-4 border-t border-[var(--border)]">
                            <p className="text-xs font-medium text-[var(--muted)] mb-3">Actividad últimos 7 días</p>
                            <div className="flex items-end gap-1.5 h-12">
                                {dailyActivity.map((day, i) => (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                                        <div
                                            className="w-full rounded-t-sm bg-gradient-to-t from-[var(--primary)] to-[var(--secondary)] transition-all duration-300 group-hover:opacity-80"
                                            style={{
                                                height: `${Math.max((day.count / maxDaily) * 100, day.count > 0 ? 15 : 4)}%`,
                                                minHeight: day.count > 0 ? '6px' : '2px',
                                                opacity: day.count > 0 ? 1 : 0.2,
                                            }}
                                        />
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[var(--card)] border border-[var(--border)] text-[var(--on-background)] text-[10px] font-medium px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg z-10">
                                            {day.count} clases
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-1.5 mt-1">
                                {dailyActivity.map((day, i) => (
                                    <span key={i} className="flex-1 text-center text-[9px] text-[var(--muted)] capitalize">{day.date}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
});
