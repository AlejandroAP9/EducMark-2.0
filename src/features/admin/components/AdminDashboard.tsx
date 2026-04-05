'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import {
    Users, CreditCard, BarChart3, ScrollText,
    ShieldCheck, Zap, DollarSign, Activity, ArrowLeft, HeartPulse
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface DashboardStats {
    totalUsers: number;
    activeSubscriptions: number;
    monthlyRevenue: number;
    totalGenerations: number;
    recentActivity: { event: string; timestamp: string; details?: Record<string, string | number | null> }[];
}

interface PlanPriceRow {
    plan_type: string | null;
    price_clp: number | null;
}

interface SubscriptionPlanRow {
    plan_type: string | null;
}

interface AuditLogRow {
    event: string;
    timestamp: string;
    payer_email: string | null;
    amount: number | null;
    plan_type: string | null;
}

export function AdminDashboard() {
    const supabase = createClient();
    const router = useRouter();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardStats();
    }, []);

    const fetchDashboardStats = async () => {
        try {
            const { count: totalUsers } = await supabase
                .from('user_profiles')
                .select('*', { count: 'exact', head: true });

            const { count: activeSubscriptions } = await supabase
                .from('user_subscriptions')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'active');

            const { data: subs } = await supabase
                .from('user_subscriptions')
                .select('plan_type')
                .eq('status', 'active');

            const { data: planPrices } = await supabase
                .from('subscription_plans')
                .select('plan_type, price_clp');

            const priceMap: Record<string, number> = {};
            (planPrices as PlanPriceRow[] | null)?.forEach((p) => {
                const key = p.plan_type?.toLowerCase();
                if (key) priceMap[key] = p.price_clp || 0;
            });

            let monthlyRevenue = 0;
            (subs as SubscriptionPlanRow[] | null)?.forEach((s) => {
                const plan = s.plan_type?.toLowerCase() || 'trial';
                monthlyRevenue += priceMap[plan] || 0;
            });

            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
            const { count: totalGenerations } = await supabase
                .from('usage_logs')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', thirtyDaysAgo);

            const { data: recentLogs } = await supabase
                .from('audit_logs')
                .select('event, timestamp, details, payer_email, amount, plan_type')
                .order('timestamp', { ascending: false })
                .limit(5);

            const recentActivity = ((recentLogs || []) as AuditLogRow[]).map((log) => ({
                event: log.event,
                timestamp: log.timestamp,
                details: {
                    email: log.payer_email,
                    amount: log.amount,
                    plan: log.plan_type
                }
            }));

            setStats({
                totalUsers: totalUsers || 0,
                activeSubscriptions: activeSubscriptions || 0,
                monthlyRevenue,
                totalGenerations: totalGenerations || 0,
                recentActivity
            });
        } catch (err) {
            console.error('Error fetching dashboard stats:', err);
        } finally {
            setLoading(false);
        }
    };

    const quickActions = [
        { icon: Users, label: 'Gestión Usuarios', desc: 'Ver y administrar usuarios', path: '/dashboard/admin/users', color: '#a48fff', bg: 'rgba(164, 143, 255, 0.12)' },
        { icon: CreditCard, label: 'Suscripciones', desc: 'Revenue y planes', path: '/dashboard/admin/subscriptions', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' },
        { icon: BarChart3, label: 'Analytics', desc: 'Métricas de uso de IA', path: '/dashboard/admin/analytics', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.12)' },
        { icon: ScrollText, label: 'Admin Logs', desc: 'Historial de auditoría', path: '/dashboard/admin/logs', color: '#64748b', bg: 'rgba(100, 116, 139, 0.12)' },
        { icon: ShieldCheck, label: 'Config Institución', desc: 'Licencia, branding, periodos', path: '/dashboard/admin/institution', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.12)' },
        { icon: Activity, label: 'Tickets Soporte', desc: 'Mesa de ayuda institucional', path: '/dashboard/admin/support', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.12)' },
        { icon: HeartPulse, label: 'Health Score', desc: 'Monitorea la salud de tus usuarios pioneros', path: '/dashboard/admin/health-score', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' },
    ];

    const container = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.08 } }
    };
    const item = {
        hidden: { opacity: 0, y: 10 },
        show: { opacity: 1, y: 0 }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' }}>
                <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    border: '3px solid var(--primary)', borderTopColor: 'transparent',
                    animation: 'spin 1s linear infinite'
                }}></div>
                <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>Cargando panel de administracion...</p>
            </div>
        );
    }

    const formatEventName = (event: string) => {
        const map: Record<string, string> = {
            'payment.approved': '💳 Pago aprobado',
            'payment.rejected': '❌ Pago rechazado',
            'subscription.created': '🎉 Nueva suscripción',
            'subscription.cancelled': '⚠️ Suscripción cancelada',
            'subscription.updated': '🔄 Suscripción actualizada',
            'user.created': '👤 Nuevo usuario',
        };
        return map[event] || event;
    };

    const timeAgo = (timestamp: string) => {
        const diff = Date.now() - new Date(timestamp).getTime();
        const minutes = Math.floor(diff / 60000);
        if (minutes < 60) return `hace ${minutes}m`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `hace ${hours}h`;
        const days = Math.floor(hours / 24);
        return `hace ${days}d`;
    };

    return (
        <motion.div variants={container} initial="hidden" animate="show">
            {/* Back Button */}
            <motion.div variants={item}>
                <button
                    onClick={() => router.push('/dashboard')}
                    className="admin-back-btn"
                >
                    <ArrowLeft size={18} />
                    Volver al Dashboard
                </button>
            </motion.div>

            {/* Header */}
            <motion.div variants={item} className="admin-page-header">
                <div className="header-icon">
                    <ShieldCheck size={22} />
                </div>
                <div>
                    <h1>Admin Dashboard</h1>
                    <p>Panel de control y resumen general</p>
                </div>
            </motion.div>

            {/* Admin Status Badge */}
            <motion.div variants={item} className="admin-status-badge">
                <div className="status-dot"></div>
                <div>
                    <div className="status-text">Admin Access Active</div>
                    <div className="status-subtitle">Tienes acceso completo a la plataforma</div>
                </div>
            </motion.div>

            {/* KPI Cards */}
            <motion.div variants={item} className="admin-kpi-grid">
                <div className="glass-card-premium admin-kpi-card">
                    <div className="kpi-header">
                        <span className="kpi-label">Total Usuarios</span>
                        <div className="kpi-icon" style={{ background: 'rgba(164, 143, 255, 0.15)' }}>
                            <Users size={18} style={{ color: 'var(--primary)' }} />
                        </div>
                    </div>
                    <div className="kpi-value">{stats?.totalUsers}</div>
                    <div className="kpi-sub">registrados</div>
                </div>

                <div className="glass-card-premium admin-kpi-card">
                    <div className="kpi-header">
                        <span className="kpi-label">Suscripciones Activas</span>
                        <div className="kpi-icon" style={{ background: 'rgba(16, 185, 129, 0.15)' }}>
                            <CreditCard size={18} style={{ color: '#10b981' }} />
                        </div>
                    </div>
                    <div className="kpi-value">{stats?.activeSubscriptions}</div>
                    <div className="kpi-sub">planes activos</div>
                </div>

                <div className="glass-card-premium admin-kpi-card">
                    <div className="kpi-header">
                        <span className="kpi-label">Revenue Mensual</span>
                        <div className="kpi-icon" style={{ background: 'rgba(16, 185, 129, 0.15)' }}>
                            <DollarSign size={18} style={{ color: '#10b981' }} />
                        </div>
                    </div>
                    <div className="kpi-value" style={{ color: '#10b981' }}>
                        ${stats?.monthlyRevenue.toLocaleString('es-CL')}
                    </div>
                    <div className="kpi-sub">CLP</div>
                </div>

                <div className="glass-card-premium admin-kpi-card">
                    <div className="kpi-header">
                        <span className="kpi-label">Generaciones IA</span>
                        <div className="kpi-icon" style={{ background: 'rgba(139, 92, 246, 0.15)' }}>
                            <Zap size={18} style={{ color: '#8b5cf6' }} />
                        </div>
                    </div>
                    <div className="kpi-value">{stats?.totalGenerations}</div>
                    <div className="kpi-sub">últimos 30 días</div>
                </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div variants={item}>
                <h3 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Acciones Rápidas
                </h3>
                <div className="quick-actions-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                    {quickActions.map(action => (
                        <div
                            key={action.label}
                            className="card-proto quick-action-card"
                            onClick={() => router.push(action.path)}
                        >
                            <div className="icon-box" style={{ background: action.bg }}>
                                <action.icon size={20} style={{ color: action.color }} />
                            </div>
                            <div className="action-text">
                                <h3>{action.label}</h3>
                                <p>{action.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Recent Activity */}
            <motion.div variants={item} className="glass-card-premium" style={{ padding: '1.5rem', marginTop: '2rem', borderRadius: '1.25rem' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                    <Activity size={18} style={{ color: 'var(--primary)' }} />
                    Actividad Reciente
                </h3>
                {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                    <div>
                        {stats.recentActivity.map((act, idx) => (
                            <div key={idx} className="activity-item">
                                <div className="activity-dot" style={{
                                    background: act.event.includes('approved') || act.event.includes('created')
                                        ? '#10b981'
                                        : act.event.includes('rejected') || act.event.includes('cancelled')
                                            ? '#ef4444'
                                            : 'var(--primary)'
                                }}></div>
                                <div>
                                    <div className="activity-text">
                                        {formatEventName(act.event)}
                                        {act.details?.email && <span style={{ color: 'var(--muted)' }}> — {act.details.email}</span>}
                                        {act.details?.amount && <span style={{ color: '#10b981', fontWeight: 600 }}> ${act.details.amount?.toLocaleString('es-CL')} CLP</span>}
                                    </div>
                                    <div className="activity-time">{timeAgo(act.timestamp)}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p style={{ fontSize: '0.875rem', color: 'var(--muted)', textAlign: 'center', padding: '2rem 0' }}>
                        Los registros de actividad aparecerán aquí cuando haya eventos registrados.
                    </p>
                )}
            </motion.div>
        </motion.div>
    );
}
