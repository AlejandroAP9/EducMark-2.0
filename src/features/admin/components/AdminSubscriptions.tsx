'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import {
    CreditCard, DollarSign, TrendingUp, TrendingDown,
    CheckCircle2, XCircle, Clock, AlertTriangle, BarChart3, ArrowLeft
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SubStats {
    monthlyRevenue: number;
    totalRevenue: number;
    avgRevenuePerUser: number;
    activeCount: number;
    cancelledCount: number;
    expiredCount: number;
    pausedCount: number;
    planDistribution: { plan: string; count: number; revenue: number }[];
    newThisMonth: number;
    churnThisMonth: number;
    churnRate: number;
    recentTransactions: Array<Record<string, unknown>>;
}

interface PlanPriceRow {
    plan_type: string | null;
    price_clp: number | null;
}

export function AdminSubscriptions() {
    const supabase = createClient();
    const router = useRouter();
    const [stats, setStats] = useState<SubStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSubStats();
    }, []);

    const fetchSubStats = async () => {
        try {
            // All subscriptions
            const { data: allSubs } = await supabase
                .from('user_subscriptions')
                .select('plan_type, status, created_at, updated_at');

            // Plan prices
            const { data: planPrices } = await supabase
                .from('subscription_plans')
                .select('plan_type, price_clp, display_name');

            const priceMap: Record<string, number> = {};
            (planPrices as PlanPriceRow[] | null)?.forEach((p) => {
                const key = (p.plan_type || '').toLowerCase();
                if (key) priceMap[key] = p.price_clp || 0;
            });

            const activeCount = (allSubs || []).filter(s => s.status === 'active').length;
            const cancelledCount = (allSubs || []).filter(s => s.status === 'cancelled').length;
            const expiredCount = (allSubs || []).filter(s => s.status === 'expired').length;
            const pausedCount = (allSubs || []).filter(s => s.status === 'paused').length;

            // Revenue from active subs
            let monthlyRevenue = 0;
            const distMap = new Map<string, { count: number; revenue: number }>();

            (allSubs || []).filter(s => s.status === 'active').forEach(s => {
                const plan = s.plan_type?.toLowerCase() || 'trial';
                const price = priceMap[plan] || 0;
                monthlyRevenue += price;
                const curr = distMap.get(plan) || { count: 0, revenue: 0 };
                distMap.set(plan, { count: curr.count + 1, revenue: curr.revenue + price });
            });

            const planDistribution = Array.from(distMap.entries())
                .map(([plan, data]) => ({ plan, ...data }))
                .sort((a, b) => b.revenue - a.revenue);

            // Growth (created this month)
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);
            const newThisMonth = (allSubs || []).filter(s =>
                new Date(s.created_at) >= startOfMonth
            ).length;

            // Churn (cancelled this month)
            const churnThisMonth = (allSubs || []).filter(s =>
                s.status === 'cancelled' && new Date(s.updated_at || s.created_at) >= startOfMonth
            ).length;

            const totalActiveEver = activeCount + cancelledCount + expiredCount;
            const churnRate = totalActiveEver > 0 ? (churnThisMonth / totalActiveEver) * 100 : 0;

            // Total revenue from payment_transactions
            const { data: transactions } = await supabase
                .from('payment_transactions')
                .select('amount, status, plan_type, created_at')
                .eq('status', 'approved')
                .order('created_at', { ascending: false });

            const totalRevenue = (transactions || []).reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
            const avgRevenuePerUser = activeCount > 0 ? monthlyRevenue / activeCount : 0;

            // Recent transactions
            const { data: recentTx } = await supabase
                .from('payment_transactions')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5);

            setStats({
                monthlyRevenue,
                totalRevenue,
                avgRevenuePerUser,
                activeCount,
                cancelledCount,
                expiredCount,
                pausedCount,
                planDistribution,
                newThisMonth,
                churnThisMonth,
                churnRate,
                recentTransactions: recentTx || []
            });
        } catch (err) {
            console.error('Error fetching sub stats:', err);
        } finally {
            setLoading(false);
        }
    };

    const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
    const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', border: '4px solid var(--primary)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }}></div>
            </div>
        );
    }

    return (
        <motion.div variants={container} initial="hidden" animate="show">
            {/* Back Button */}
            <motion.div variants={item}>
                <button onClick={() => router.push('/dashboard/admin')} className="admin-back-btn">
                    <ArrowLeft size={18} />
                    Volver
                </button>
            </motion.div>

            <motion.div variants={item} className="admin-page-header">
                <div className="header-icon">
                    <CreditCard size={22} />
                </div>
                <div>
                    <h1>Suscripciones & Revenue</h1>
                    <p>Métricas de suscripciones, revenue y transacciones</p>
                </div>
            </motion.div>

            {/* Revenue KPIs */}
            <motion.div variants={item} className="admin-kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="glass-card-premium admin-kpi-card">
                    <div className="kpi-header">
                        <span className="kpi-label">Revenue Mensual</span>
                        <div className="kpi-icon" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                            <DollarSign size={18} style={{ color: '#10b981' }} />
                        </div>
                    </div>
                    <div className="kpi-value" style={{ color: '#10b981' }}>
                        ${stats?.monthlyRevenue.toLocaleString('es-CL')}
                    </div>
                    <div className="kpi-sub">CLP / mes</div>
                </div>

                <div className="glass-card-premium admin-kpi-card">
                    <div className="kpi-header">
                        <span className="kpi-label">Revenue Total</span>
                        <div className="kpi-icon" style={{ background: 'rgba(99, 102, 241, 0.1)' }}>
                            <TrendingUp size={18} style={{ color: '#6366f1' }} />
                        </div>
                    </div>
                    <div className="kpi-value">
                        ${stats?.totalRevenue.toLocaleString('es-CL')}
                    </div>
                    <div className="kpi-sub">CLP acumulado</div>
                </div>

                <div className="glass-card-premium admin-kpi-card">
                    <div className="kpi-header">
                        <span className="kpi-label">Revenue Promedio/Usuario</span>
                        <div className="kpi-icon" style={{ background: 'rgba(245, 158, 11, 0.1)' }}>
                            <BarChart3 size={18} style={{ color: '#f59e0b' }} />
                        </div>
                    </div>
                    <div className="kpi-value">
                        ${Math.round(stats?.avgRevenuePerUser || 0).toLocaleString('es-CL')}
                    </div>
                    <div className="kpi-sub">CLP / usuario activo</div>
                </div>
            </motion.div>

            {/* Status Counters */}
            <motion.div variants={item} className="stat-counters">
                <div className="stat-counter">
                    <div className="counter-icon" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                        <CheckCircle2 size={16} style={{ color: '#10b981' }} />
                    </div>
                    <div>
                        <div className="counter-label">Active</div>
                        <div className="counter-value">{stats?.activeCount}</div>
                    </div>
                </div>
                <div className="stat-counter">
                    <div className="counter-icon" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
                        <XCircle size={16} style={{ color: '#ef4444' }} />
                    </div>
                    <div>
                        <div className="counter-label">Cancelled</div>
                        <div className="counter-value">{stats?.cancelledCount}</div>
                    </div>
                </div>
                <div className="stat-counter">
                    <div className="counter-icon" style={{ background: 'rgba(156, 163, 175, 0.1)' }}>
                        <Clock size={16} style={{ color: '#9ca3af' }} />
                    </div>
                    <div>
                        <div className="counter-label">Expired</div>
                        <div className="counter-value">{stats?.expiredCount}</div>
                    </div>
                </div>
                <div className="stat-counter">
                    <div className="counter-icon" style={{ background: 'rgba(245, 158, 11, 0.1)' }}>
                        <AlertTriangle size={16} style={{ color: '#f59e0b' }} />
                    </div>
                    <div>
                        <div className="counter-label">Paused</div>
                        <div className="counter-value">{stats?.pausedCount}</div>
                    </div>
                </div>
            </motion.div>

            {/* Plan Distribution & Growth/Churn */}
            <motion.div variants={item} className="admin-two-col">
                <div className="glass-card-premium admin-section-card">
                    <h3>
                        <BarChart3 size={18} style={{ color: 'var(--primary)' }} />
                        Distribución por Plan
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {['trial', 'copihue', 'araucaria', 'condor'].map(plan => {
                            const dist = stats?.planDistribution.find(d => d.plan === plan);
                            return (
                                <div key={plan} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <span className={`badge-proto ${plan === 'copihue' ? 'orange' : plan === 'araucaria' ? 'green' : plan === 'condor' ? 'primary' : 'blue'}`}>{plan.charAt(0).toUpperCase() + plan.slice(1)}</span>
                                    </div>
                                    <span style={{ fontWeight: 700, color: 'var(--foreground)' }}>{dist?.count || 0}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="glass-card-premium admin-section-card">
                    <h3>
                        <TrendingUp size={18} style={{ color: '#10b981' }} />
                        Growth & Churn
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Nuevas Suscripciones (mes)</span>
                                <TrendingUp size={16} style={{ color: '#10b981' }} />
                            </div>
                            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--foreground)' }}>
                                {stats?.newThisMonth}
                            </div>
                        </div>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Churns (mes)</span>
                                <TrendingDown size={16} style={{ color: '#ef4444' }} />
                            </div>
                            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--foreground)' }}>
                                {stats?.churnThisMonth}
                            </div>
                        </div>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Churn Rate</span>
                            </div>
                            <div style={{ fontSize: '2rem', fontWeight: 700, color: stats?.churnRate === 0 ? '#10b981' : '#ef4444' }}>
                                {stats?.churnRate.toFixed(1)}%
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
