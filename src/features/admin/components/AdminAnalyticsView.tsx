'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { ChartBar, Zap, Cpu, DollarSign, Database, TrendingUp, TrendingDown, Receipt, Image, ChartLine, Bot, Users, Gauge, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface UsageStats {
    totalGenerations: number;
    totalTokens: number;
    totalCost: number;
    cacheHitRate: number;
    avgResponseTime: number;
    usageByModel: { model: string; count: number; cost: number }[];
    dailyUsage: { date: string; count: number; cost: number }[];
    topUsers: { email: string; count: number; cost: number }[];
    totalRevenue: number;
    totalProfit: number;
    ivaAmount: number;
    totalImages: number;
    imageCostCLP: number;
    totalCostCLP: number;
    subscriptionBreakdown: { plan: string; count: number; revenue: number }[];
}

interface TopUserLogRow {
    cost_usd: string | number | null;
    user_profiles?: { email?: string | null } | null;
}

interface PlanPriceRow {
    plan_type: string | null;
    price_clp: number | null;
}

interface ActiveSubscriptionRow {
    plan_type: string | null;
}

export function AdminAnalyticsView() {
    const supabase = createClient();
    const router = useRouter();
    const [stats, setStats] = useState<UsageStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');

    useEffect(() => {
        fetchStats();
    }, [period]);

    const fetchStats = async () => {
        setLoading(true);

        const daysMap = { '7d': 7, '30d': 30, '90d': 90 };
        const days = daysMap[period];
        const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

        const { data: usageLogs } = await supabase
            .from('usage_logs')
            .select('*')
            .gte('created_at', startDate);

        if (!usageLogs) { setLoading(false); return; }

        const totalGenerations = usageLogs.length;
        const totalTokens = usageLogs.reduce((sum, log) => sum + (log.tokens_total || 0), 0);
        const totalCost = usageLogs.reduce((sum, log) => sum + (parseFloat(log.cost_usd) || 0), 0);
        const cachedRequests = usageLogs.filter(log => log.was_cached).length;
        const cacheHitRate = totalGenerations > 0 ? (cachedRequests / totalGenerations) * 100 : 0;
        const avgResponseTime = totalGenerations > 0
            ? usageLogs.reduce((sum, log) => sum + (log.response_time_ms || 0), 0) / totalGenerations : 0;

        const modelMap = new Map<string, { count: number; cost: number }>();
        usageLogs.forEach(log => {
            const current = modelMap.get(log.model) || { count: 0, cost: 0 };
            modelMap.set(log.model, { count: current.count + 1, cost: current.cost + (parseFloat(log.cost_usd) || 0) });
        });
        const usageByModel = Array.from(modelMap.entries()).map(([model, data]) => ({ model, ...data }));

        const dailyMap = new Map<string, { count: number; cost: number }>();
        for (let i = 6; i >= 0; i--) {
            const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
            dailyMap.set(date.toISOString().split('T')[0], { count: 0, cost: 0 });
        }
        usageLogs.forEach(log => {
            const date = log.created_at.split('T')[0];
            if (dailyMap.has(date)) {
                const current = dailyMap.get(date)!;
                dailyMap.set(date, { count: current.count + 1, cost: current.cost + (parseFloat(log.cost_usd) || 0) });
            }
        });
        const dailyUsage = Array.from(dailyMap.entries()).map(([date, data]) => ({ date, ...data }));

        const { data: topUsersData } = await supabase
            .from('usage_logs')
            .select(`user_id, tokens_total, cost_usd, user_profiles!inner(email)`)
            .gte('created_at', startDate)
            .not('user_id', 'is', null);

        const userMap = new Map<string, { email: string; count: number; cost: number }>();
        (topUsersData as TopUserLogRow[] | null)?.forEach((log) => {
            const email = log.user_profiles?.email || 'Unknown';
            const current = userMap.get(email) || { email, count: 0, cost: 0 };
            userMap.set(email, { email, count: current.count + 1, cost: current.cost + (Number(log.cost_usd ?? 0) || 0) });
        });
        const topUsers = Array.from(userMap.values()).sort((a, b) => b.cost - a.cost).slice(0, 5);

        const { data: planPrices } = await supabase.from('subscription_plans').select('plan_type, price_clp');
        const PLAN_PRICES_CLP: Record<string, number> = {};
        (planPrices as PlanPriceRow[] | null)?.forEach((p) => {
            const key = (p.plan_type || '').toLowerCase();
            if (key) PLAN_PRICES_CLP[key] = p.price_clp || 0;
        });

        const USD_TO_CLP = 871.75;
        const { data: subscriptions } = await supabase.from('user_subscriptions').select('plan_type, status').eq('status', 'active');

        const subMap = new Map<string, { count: number; revenue: number }>();
        let totalRevenueCLP = 0;
        (subscriptions as ActiveSubscriptionRow[] | null)?.forEach((sub) => {
            const plan = sub.plan_type?.toLowerCase() || 'trial';
            const price = PLAN_PRICES_CLP[plan] || 0;
            const current = subMap.get(plan) || { count: 0, revenue: 0 };
            subMap.set(plan, { count: current.count + 1, revenue: current.revenue + price });
            totalRevenueCLP += price;
        });
        const subscriptionBreakdown = Array.from(subMap.entries()).map(([plan, data]) => ({ plan, ...data })).sort((a, b) => b.revenue - a.revenue);

        const totalCostCLP = totalCost * USD_TO_CLP;
        const totalProfitCLP = totalRevenueCLP - totalCostCLP;
        const ivaAmount = totalRevenueCLP * 0.19;

        const { count: imageCount } = await supabase
            .from('generated_classes')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', startDate)
            .not('cover_image_url', 'is', null);

        const totalImages = imageCount || 0;
        const imageCostCLP = totalImages * 0.003 * USD_TO_CLP;

        setStats({
            totalGenerations, totalTokens, totalCost, cacheHitRate, avgResponseTime,
            usageByModel, dailyUsage, topUsers,
            totalRevenue: totalRevenueCLP, totalProfit: totalProfitCLP, ivaAmount,
            totalImages, imageCostCLP, totalCostCLP, subscriptionBreakdown
        });
        setLoading(false);
    };

    const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
    const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', border: '4px solid var(--primary)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }}></div>
            </div>
        );
    }

    const maxDailyCount = Math.max(...(stats?.dailyUsage.map(d => d.count) || [1]));

    return (
        <motion.div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '3rem' }} variants={container} initial="hidden" animate="show">
            {/* Back Button */}
            <motion.div variants={item}>
                <button onClick={() => router.push('/dashboard/admin')} className="admin-back-btn">
                    <ArrowLeft size={18} />
                    Volver
                </button>
            </motion.div>

            {/* Header */}
            <motion.div variants={item} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                <div className="admin-page-header" style={{ marginBottom: 0 }}>
                    <div className="header-icon">
                        <ChartBar size={22} />
                    </div>
                    <div>
                        <h1>Analytics</h1>
                        <p>Métricas de uso de IA y costos</p>
                    </div>
                </div>

                <div className="filter-pills">
                    {(['7d', '30d', '90d'] as const).map(p => (
                        <button key={p} onClick={() => setPeriod(p)}
                            className={`filter-pill ${period === p ? 'active' : ''}`}>
                            {p === '7d' ? '7 días' : p === '30d' ? '30 días' : '90 días'}
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* KPI Cards */}
            <motion.div variants={item} className="admin-kpi-grid">
                <div className="glass-card-premium admin-kpi-card">
                    <div className="kpi-header">
                        <span className="kpi-label">Generaciones</span>
                        <div className="kpi-icon" style={{ background: 'rgba(164,143,255,0.1)' }}>
                            <Zap size={18} style={{ color: 'var(--primary)' }} />
                        </div>
                    </div>
                    <div className="kpi-value">{stats?.totalGenerations.toLocaleString()}</div>
                    <div className="kpi-sub">últimos {period}</div>
                </div>

                <div className="glass-card-premium admin-kpi-card">
                    <div className="kpi-header">
                        <span className="kpi-label">Tokens Totales</span>
                        <div className="kpi-icon" style={{ background: 'rgba(59,130,246,0.1)' }}>
                            <Cpu size={18} style={{ color: '#3b82f6' }} />
                        </div>
                    </div>
                    <div className="kpi-value">
                        {(stats?.totalTokens || 0) > 1000000
                            ? `${((stats?.totalTokens || 0) / 1000000).toFixed(2)}M`
                            : `${((stats?.totalTokens || 0) / 1000).toFixed(1)}K`}
                    </div>
                    <div className="kpi-sub">consumidos</div>
                </div>

                <div className="glass-card-premium admin-kpi-card">
                    <div className="kpi-header">
                        <span className="kpi-label">Costo Total</span>
                        <div className="kpi-icon" style={{ background: 'rgba(16,185,129,0.1)' }}>
                            <DollarSign size={18} style={{ color: '#10b981' }} />
                        </div>
                    </div>
                    <div className="kpi-value" style={{ color: '#10b981' }}>${stats?.totalCost.toFixed(2)}</div>
                    <div className="kpi-sub">USD</div>
                </div>

                <div className="glass-card-premium admin-kpi-card">
                    <div className="kpi-header">
                        <span className="kpi-label">Cache Hit Rate</span>
                        <div className="kpi-icon" style={{ background: 'rgba(245,158,11,0.1)' }}>
                            <Database size={18} style={{ color: '#f59e0b' }} />
                        </div>
                    </div>
                    <div className="kpi-value" style={{ color: '#f59e0b' }}>{stats?.cacheHitRate.toFixed(1)}%</div>
                    <div className="kpi-sub">ahorro estimado</div>
                </div>
            </motion.div>

            {/* Financial KPIs */}
            <motion.div variants={item} className="admin-kpi-grid">
                <div className="glass-card-premium admin-kpi-card">
                    <div className="kpi-header">
                        <span className="kpi-label">Ingresos</span>
                        <div className="kpi-icon" style={{ background: 'rgba(34,197,94,0.1)' }}>
                            <DollarSign size={18} style={{ color: '#22c55e' }} />
                        </div>
                    </div>
                    <div className="kpi-value" style={{ color: '#22c55e' }}>${(stats?.totalRevenue || 0).toLocaleString('es-CL')}</div>
                    <div className="kpi-sub">CLP mensual</div>
                </div>

                <div className="glass-card-premium admin-kpi-card">
                    <div className="kpi-header">
                        <span className="kpi-label">Ganancia Neta</span>
                        <div className="kpi-icon" style={{ background: (stats?.totalProfit || 0) >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)' }}>
                            {(stats?.totalProfit || 0) >= 0 ? <TrendingUp size={18} style={{ color: '#10b981' }} /> : <TrendingDown size={18} style={{ color: '#ef4444' }} />}
                        </div>
                    </div>
                    <div className="kpi-value" style={{ color: (stats?.totalProfit || 0) >= 0 ? '#10b981' : '#ef4444' }}>
                        ${Math.round(stats?.totalProfit || 0).toLocaleString('es-CL')}
                    </div>
                    <div className="kpi-sub">CLP (ingresos - costos IA)</div>
                </div>

                <div className="glass-card-premium admin-kpi-card">
                    <div className="kpi-header">
                        <span className="kpi-label">IVA a Pagar (19%)</span>
                        <div className="kpi-icon" style={{ background: 'rgba(249,115,22,0.1)' }}>
                            <Receipt size={18} style={{ color: '#f97316' }} />
                        </div>
                    </div>
                    <div className="kpi-value" style={{ color: '#f97316' }}>${Math.round(stats?.ivaAmount || 0).toLocaleString('es-CL')}</div>
                    <div className="kpi-sub">CLP</div>
                </div>

                <div className="glass-card-premium admin-kpi-card">
                    <div className="kpi-header">
                        <span className="kpi-label">Imágenes (Replicate)</span>
                        <div className="kpi-icon" style={{ background: 'rgba(139,92,246,0.1)' }}>
                            <Image size={18} style={{ color: '#8b5cf6' }} />
                        </div>
                    </div>
                    <div className="kpi-value" style={{ color: '#8b5cf6' }}>{stats?.totalImages}</div>
                    <div className="kpi-sub">~${Math.round(stats?.imageCostCLP || 0).toLocaleString('es-CL')} CLP</div>
                </div>
            </motion.div>

            {/* Charts Row */}
            <motion.div variants={item} className="admin-two-col">
                <div className="glass-card-premium admin-section-card" style={{ gridColumn: 'span 1' }}>
                    <h3><ChartLine size={18} style={{ color: 'var(--primary)' }} /> Generaciones Diarias</h3>
                    <div style={{ height: '180px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '0.5rem' }}>
                        {stats?.dailyUsage.map((day) => (
                            <div key={day.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                                <div
                                    style={{
                                        width: '100%',
                                        height: `${Math.max((day.count / maxDailyCount) * 100, 4)}%`,
                                        minHeight: '4px',
                                        background: 'linear-gradient(to top, var(--primary), var(--secondary))',
                                        borderRadius: '6px 6px 0 0',
                                        transition: 'all 0.3s'
                                    }}
                                    title={`${day.count} generaciones - $${day.cost.toFixed(4)}`}
                                ></div>
                                <span style={{ fontSize: '0.65rem', color: 'var(--muted)' }}>
                                    {new Date(day.date).toLocaleDateString('es', { weekday: 'short' })}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="glass-card-premium admin-section-card">
                    <h3><Bot size={18} style={{ color: 'var(--secondary)' }} /> Por Modelo</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {stats?.usageByModel.map((model) => (
                            <div key={model.model} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{
                                        width: 10, height: 10, borderRadius: '50%',
                                        background: model.model === 'gpt-4o-mini' ? 'var(--primary)' :
                                            model.model === 'gpt-4o' ? '#10b981' :
                                                model.model === 'cache' ? '#f59e0b' : '#3b82f6'
                                    }}></div>
                                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--foreground)' }}>{model.model}</span>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--foreground)' }}>{model.count}</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>${model.cost.toFixed(3)}</div>
                                </div>
                            </div>
                        ))}
                        {(!stats?.usageByModel || stats.usageByModel.length === 0) && (
                            <p style={{ fontSize: '0.875rem', color: 'var(--muted)', textAlign: 'center', padding: '1rem' }}>Sin datos aún</p>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Bottom Row */}
            <motion.div variants={item} className="admin-two-col">
                <div className="glass-card-premium admin-section-card">
                    <h3><Users size={18} style={{ color: '#f59e0b' }} /> Top Usuarios por Consumo</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {stats?.topUsers.map((user, idx) => (
                            <div key={user.email} style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '0.75rem', borderRadius: '10px',
                                background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <span style={{
                                        width: 24, height: 24, borderRadius: '50%',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '0.7rem', fontWeight: 700,
                                        background: idx === 0 ? '#f59e0b' : idx === 1 ? '#9ca3af' : idx === 2 ? '#c2410c' : 'var(--border)',
                                        color: idx <= 1 ? 'black' : 'white'
                                    }}>{idx + 1}</span>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--foreground)' }}>{user.email}</span>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{user.count} gen</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>${user.cost.toFixed(3)}</div>
                                </div>
                            </div>
                        ))}
                        {(!stats?.topUsers || stats.topUsers.length === 0) && (
                            <p style={{ fontSize: '0.875rem', color: 'var(--muted)', textAlign: 'center', padding: '1rem' }}>Sin usuarios registrados</p>
                        )}
                    </div>
                </div>

                <div className="glass-card-premium admin-section-card">
                    <h3><Gauge size={18} style={{ color: '#10b981' }} /> Rendimiento</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                                <span style={{ color: 'var(--muted)' }}>Tiempo promedio de respuesta</span>
                                <span style={{ fontWeight: 700, color: 'var(--foreground)' }}>
                                    {(stats?.avgResponseTime || 0) > 1000
                                        ? `${((stats?.avgResponseTime || 0) / 1000).toFixed(1)}s`
                                        : `${stats?.avgResponseTime.toFixed(0)}ms`}
                                </span>
                            </div>
                            <div style={{ height: 8, background: 'var(--border)', borderRadius: 999, overflow: 'hidden' }}>
                                <div style={{
                                    height: '100%', borderRadius: 999,
                                    background: 'linear-gradient(to right, #10b981, var(--primary))',
                                    width: `${Math.min((stats?.avgResponseTime || 0) / 300, 100)}%`
                                }}></div>
                            </div>
                        </div>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                                <span style={{ color: 'var(--muted)' }}>Eficiencia de caché</span>
                                <span style={{ fontWeight: 700, color: 'var(--foreground)' }}>{stats?.cacheHitRate.toFixed(1)}%</span>
                            </div>
                            <div style={{ height: 8, background: 'var(--border)', borderRadius: 999, overflow: 'hidden' }}>
                                <div style={{
                                    height: '100%', borderRadius: 999,
                                    background: 'linear-gradient(to right, #f59e0b, #f97316)',
                                    width: `${stats?.cacheHitRate || 0}%`
                                }}></div>
                            </div>
                        </div>
                        <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>
                                ${((stats?.totalCost || 0) / (stats?.totalGenerations || 1)).toFixed(4)}
                            </div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Costo promedio por generación</p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
