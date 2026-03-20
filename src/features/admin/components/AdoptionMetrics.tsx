'use client';

/**
 * Adoption Metrics — AD-20
 * Dashboard showing platform usage metrics: active users, most used features, retention.
 */
import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Users, TrendingUp, Zap, BarChart3 } from 'lucide-react';

interface MetricsData {
    activeUsersWeekly: number;
    activeUsersMonthly: number;
    totalUsers: number;
    totalGenerations: number;
    totalScans: number;
    totalEvaluations: number;
    topFeatures: { name: string; count: number }[];
}

export const AdoptionMetrics: React.FC = () => {
    const supabase = createClient();
    const [metrics, setMetrics] = useState<MetricsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchMetrics(); }, []);

    const fetchMetrics = async () => {
        setLoading(true);
        try {
            const now = new Date();
            const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
            const monthAgo = new Date(now.getTime() - 30 * 86400000).toISOString();

            // Total users
            const { count: totalUsers } = await supabase
                .from('user_profiles')
                .select('*', { count: 'exact', head: true });

            // Active users (weekly) - users who generated classes in last 7 days
            const { data: weeklyActive } = await supabase
                .from('generated_classes')
                .select('user_id')
                .gte('created_at', weekAgo);
            const weeklyActiveUsers = new Set((weeklyActive || []).map(r => r.user_id)).size;

            // Active users (monthly)
            const { data: monthlyActive } = await supabase
                .from('generated_classes')
                .select('user_id')
                .gte('created_at', monthAgo);
            const monthlyActiveUsers = new Set((monthlyActive || []).map(r => r.user_id)).size;

            // Total generations
            const { count: totalGenerations } = await supabase
                .from('generated_classes')
                .select('*', { count: 'exact', head: true });

            // Total OMR scans
            const { count: totalScans } = await supabase
                .from('omr_results')
                .select('*', { count: 'exact', head: true });

            // Total evaluations
            const { count: totalEvaluations } = await supabase
                .from('evaluations')
                .select('*', { count: 'exact', head: true });

            // Top features from audit logs
            const { data: logs } = await supabase
                .from('audit_logs')
                .select('event')
                .gte('created_at', monthAgo);

            const featureCounts = new Map<string, number>();
            (logs || []).forEach(log => {
                featureCounts.set(log.event, (featureCounts.get(log.event) || 0) + 1);
            });
            const topFeatures = Array.from(featureCounts.entries())
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);

            setMetrics({
                activeUsersWeekly: weeklyActiveUsers,
                activeUsersMonthly: monthlyActiveUsers,
                totalUsers: totalUsers || 0,
                totalGenerations: totalGenerations || 0,
                totalScans: totalScans || 0,
                totalEvaluations: totalEvaluations || 0,
                topFeatures,
            });
        } catch (err) {
            console.error('Error fetching metrics:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-[var(--muted)]">Cargando m&#233;tricas...</div>;
    if (!metrics) return null;

    const retentionRate = metrics.totalUsers > 0 ? Math.round((metrics.activeUsersMonthly / metrics.totalUsers) * 100) : 0;

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold text-[var(--on-background)] flex items-center gap-2">
                <BarChart3 size={20} className="text-[var(--primary)]" />
                M&#233;tricas de Adopci&#243;n
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard icon={<Users size={20} className="text-blue-400" />} label="Usuarios Activos (7d)" value={metrics.activeUsersWeekly} />
                <MetricCard icon={<Users size={20} className="text-indigo-400" />} label="Usuarios Activos (30d)" value={metrics.activeUsersMonthly} />
                <MetricCard icon={<TrendingUp size={20} className="text-emerald-400" />} label="Retenci&#243;n Mensual" value={`${retentionRate}%`} />
                <MetricCard icon={<Zap size={20} className="text-amber-400" />} label="Total Generaciones" value={metrics.totalGenerations} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-card-premium p-5">
                    <h4 className="text-sm font-semibold text-[var(--on-background)] mb-4">Uso por M&#243;dulo</h4>
                    <div className="space-y-3">
                        <UsageBar label="Planificaciones" value={metrics.totalGenerations} max={Math.max(metrics.totalGenerations, metrics.totalScans, metrics.totalEvaluations)} color="bg-indigo-500" />
                        <UsageBar label="Evaluaciones" value={metrics.totalEvaluations} max={Math.max(metrics.totalGenerations, metrics.totalScans, metrics.totalEvaluations)} color="bg-emerald-500" />
                        <UsageBar label="Escaneos OMR" value={metrics.totalScans} max={Math.max(metrics.totalGenerations, metrics.totalScans, metrics.totalEvaluations)} color="bg-amber-500" />
                    </div>
                </div>

                <div className="glass-card-premium p-5">
                    <h4 className="text-sm font-semibold text-[var(--on-background)] mb-4">Funciones M&#225;s Usadas (30d)</h4>
                    {metrics.topFeatures.length === 0 ? (
                        <p className="text-sm text-[var(--muted)]">Sin datos de uso registrados.</p>
                    ) : (
                        <div className="space-y-2">
                            {metrics.topFeatures.map((f, idx) => (
                                <div key={f.name} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
                                    <span className="text-sm text-[var(--on-background)]">
                                        <span className="text-[var(--muted)] mr-2">{idx + 1}.</span>
                                        {f.name.replace(/_/g, ' ')}
                                    </span>
                                    <span className="text-sm font-bold text-[var(--primary)]">{f.count}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const MetricCard: React.FC<{ icon: React.ReactNode; label: string; value: number | string }> = ({ icon, label, value }) => (
    <div className="glass-card-premium p-4">
        <div className="flex items-center gap-2 mb-2">{icon}<span className="text-xs text-[var(--muted)]">{label}</span></div>
        <p className="text-2xl font-bold text-[var(--on-background)]">{value}</p>
    </div>
);

const UsageBar: React.FC<{ label: string; value: number; max: number; color: string }> = ({ label, value, max, color }) => (
    <div>
        <div className="flex justify-between text-xs mb-1">
            <span className="text-[var(--muted)]">{label}</span>
            <span className="font-bold text-[var(--on-background)]">{value}</span>
        </div>
        <div className="h-2 bg-[var(--input-bg)] rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${color}`} style={{ width: `${max > 0 ? (value / max) * 100 : 0}%` }} />
        </div>
    </div>
);
