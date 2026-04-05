'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, HeartPulse, Users, AlertTriangle, CheckCircle2,
    TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp,
    RefreshCw, BookOpen, ClipboardList, ScanLine, LogIn
} from 'lucide-react';
import { useHealthScores, HealthScoreUser } from '../hooks/useHealthScores';

interface AdminHealthScoreProps {
    onBack: () => void;
}

function ScoreBadge({ score }: { score: number }) {
    let bg: string;
    let color: string;
    let label: string;

    if (score <= 30) {
        bg = 'rgba(239, 68, 68, 0.15)';
        color = '#ef4444';
        label = 'En riesgo';
    } else if (score <= 60) {
        bg = 'rgba(245, 158, 11, 0.15)';
        color = '#f59e0b';
        label = 'Atención';
    } else {
        bg = 'rgba(16, 185, 129, 0.15)';
        color = '#10b981';
        label = 'Saludable';
    }

    return (
        <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            padding: '0.25rem 0.75rem',
            borderRadius: '9999px',
            background: bg,
            fontSize: '0.8rem',
            fontWeight: 600,
            color,
        }}>
            <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: color,
                display: 'inline-block',
            }} />
            {score}
            <span style={{ fontWeight: 400, opacity: 0.8 }}>— {label}</span>
        </div>
    );
}

function TrendIcon({ score }: { score: number }) {
    if (score > 60) return <TrendingUp size={16} style={{ color: '#10b981' }} />;
    if (score > 30) return <Minus size={16} style={{ color: '#f59e0b' }} />;
    return <TrendingDown size={16} style={{ color: '#ef4444' }} />;
}

function PlanBadge({ plan }: { plan: string | null }) {
    const p = plan?.toLowerCase() || 'trial';
    const colors: Record<string, { bg: string; color: string }> = {
        trial: { bg: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8' },
        copihue: { bg: 'rgba(244, 114, 182, 0.12)', color: '#f472b6' },
        araucaria: { bg: 'rgba(52, 211, 153, 0.12)', color: '#34d399' },
        condor: { bg: 'rgba(251, 191, 36, 0.12)', color: '#fbbf24' },
    };
    const c = colors[p] || colors.trial;

    return (
        <span style={{
            padding: '0.2rem 0.6rem',
            borderRadius: '9999px',
            background: c.bg,
            color: c.color,
            fontSize: '0.75rem',
            fontWeight: 600,
            textTransform: 'capitalize',
        }}>
            {plan || 'Trial'}
        </span>
    );
}

function ExpandedRow({ user }: { user: HealthScoreUser }) {
    return (
        <motion.tr
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
        >
            <td colSpan={8} style={{ padding: '1rem 1.5rem', background: 'rgba(139, 92, 246, 0.04)' }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                    gap: '1rem',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <BookOpen size={16} style={{ color: '#8b5cf6' }} />
                        <div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--muted)', textTransform: 'uppercase' }}>Clases 7d</div>
                            <div style={{ fontWeight: 600 }}>{user.classes_7d}</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <ClipboardList size={16} style={{ color: '#06b6d4' }} />
                        <div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--muted)', textTransform: 'uppercase' }}>Evaluaciones 7d</div>
                            <div style={{ fontWeight: 600 }}>{user.evaluations_7d}</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <ScanLine size={16} style={{ color: '#10b981' }} />
                        <div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--muted)', textTransform: 'uppercase' }}>Scans OMR 7d</div>
                            <div style={{ fontWeight: 600 }}>{user.omr_scans_7d}</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <LogIn size={16} style={{ color: '#f59e0b' }} />
                        <div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--muted)', textTransform: 'uppercase' }}>Logins 7d</div>
                            <div style={{ fontWeight: 600 }}>{user.logins_7d}</div>
                        </div>
                    </div>
                </div>
                <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--muted)' }}>
                    Calculado: {new Date(user.calculated_at).toLocaleString('es-CL')}
                </div>
            </td>
        </motion.tr>
    );
}

export function AdminHealthScore({ onBack }: AdminHealthScoreProps) {
    const { users, loading, error, refetch } = useHealthScores();
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const totalUsers = users.length;
    const avgScore = totalUsers > 0 ? Math.round(users.reduce((sum, u) => sum + u.score, 0) / totalUsers) : 0;
    const atRisk = users.filter(u => u.score < 30).length;
    const healthy = users.filter(u => u.score > 60).length;

    const container = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.08 } }
    };
    const item = {
        hidden: { opacity: 0, y: 10 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <motion.div variants={container} initial="hidden" animate="show">
            {/* Back Button */}
            <motion.div variants={item}>
                <button onClick={onBack} className="admin-back-btn">
                    <ArrowLeft size={18} />
                    Volver
                </button>
            </motion.div>

            {/* Header */}
            <motion.div variants={item} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div className="admin-page-header" style={{ marginBottom: 0 }}>
                    <div className="header-icon" style={{ background: 'rgba(239, 68, 68, 0.15)' }}>
                        <HeartPulse size={22} style={{ color: '#ef4444' }} />
                    </div>
                    <div>
                        <h1>Health Score</h1>
                        <p>Monitorea la salud de tus usuarios pioneros</p>
                    </div>
                </div>
                <button
                    className="admin-back-btn"
                    style={{ margin: 0, padding: '0.75rem 1.5rem' }}
                    onClick={refetch}
                    disabled={loading}
                >
                    <RefreshCw size={16} style={{ marginRight: '0.5rem', animation: loading ? 'spin 1s linear infinite' : 'none' }} />
                    Actualizar
                </button>
            </motion.div>

            {/* Summary KPI Cards */}
            <motion.div variants={item} className="admin-kpi-grid" style={{ marginTop: '1.5rem' }}>
                <div className="glass-card-premium admin-kpi-card">
                    <div className="kpi-header">
                        <span className="kpi-label">Total Usuarios</span>
                        <div className="kpi-icon" style={{ background: 'rgba(164, 143, 255, 0.15)' }}>
                            <Users size={18} style={{ color: 'var(--primary)' }} />
                        </div>
                    </div>
                    <div className="kpi-value">{totalUsers}</div>
                    <div className="kpi-sub">con health score</div>
                </div>

                <div className="glass-card-premium admin-kpi-card">
                    <div className="kpi-header">
                        <span className="kpi-label">Score Promedio</span>
                        <div className="kpi-icon" style={{ background: avgScore > 60 ? 'rgba(16, 185, 129, 0.15)' : avgScore > 30 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)' }}>
                            <HeartPulse size={18} style={{ color: avgScore > 60 ? '#10b981' : avgScore > 30 ? '#f59e0b' : '#ef4444' }} />
                        </div>
                    </div>
                    <div className="kpi-value" style={{ color: avgScore > 60 ? '#10b981' : avgScore > 30 ? '#f59e0b' : '#ef4444' }}>
                        {avgScore}
                    </div>
                    <div className="kpi-sub">de 100</div>
                </div>

                <div className="glass-card-premium admin-kpi-card">
                    <div className="kpi-header">
                        <span className="kpi-label">En Riesgo</span>
                        <div className="kpi-icon" style={{ background: 'rgba(239, 68, 68, 0.15)' }}>
                            <AlertTriangle size={18} style={{ color: '#ef4444' }} />
                        </div>
                    </div>
                    <div className="kpi-value" style={{ color: '#ef4444' }}>{atRisk}</div>
                    <div className="kpi-sub">score &lt; 30</div>
                </div>

                <div className="glass-card-premium admin-kpi-card">
                    <div className="kpi-header">
                        <span className="kpi-label">Saludables</span>
                        <div className="kpi-icon" style={{ background: 'rgba(16, 185, 129, 0.15)' }}>
                            <CheckCircle2 size={18} style={{ color: '#10b981' }} />
                        </div>
                    </div>
                    <div className="kpi-value" style={{ color: '#10b981' }}>{healthy}</div>
                    <div className="kpi-sub">score &gt; 60</div>
                </div>
            </motion.div>

            {/* Error State */}
            {error && (
                <motion.div variants={item} className="glass-card-premium" style={{
                    padding: '1.5rem', marginTop: '1.5rem', borderRadius: '1.25rem',
                    borderLeft: '4px solid #ef4444',
                }}>
                    <p style={{ color: '#ef4444', fontSize: '0.875rem' }}>
                        <AlertTriangle size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                        {error}
                    </p>
                    <p style={{ color: 'var(--muted)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                        Verifica que la tabla <code>user_health_scores</code> exista en Supabase.
                    </p>
                </motion.div>
            )}

            {/* Table */}
            <motion.div variants={item} className="glass-card-premium" style={{ padding: 0, borderRadius: '1.25rem', overflow: 'hidden', marginTop: '1.5rem' }}>
                <div className="admin-table-header">
                    <span className="table-info">
                        {totalUsers} usuarios con health score
                    </span>
                    <span className="table-info" style={{ color: 'var(--muted)' }}>
                        Ordenados por score (peor primero)
                    </span>
                </div>

                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center' }}>
                        <div style={{
                            width: 32, height: 32, borderRadius: '50%', margin: '0 auto',
                            border: '4px solid var(--primary)', borderTopColor: 'transparent',
                            animation: 'spin 1s linear infinite',
                        }} />
                        <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginTop: '1rem' }}>
                            Cargando health scores...
                        </p>
                    </div>
                ) : users.length === 0 && !error ? (
                    <div style={{ padding: '3rem', textAlign: 'center' }}>
                        <HeartPulse size={40} style={{ color: 'var(--muted)', margin: '0 auto 1rem', opacity: 0.4 }} />
                        <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
                            No hay datos de health score disponibles.
                        </p>
                        <p style={{ color: 'var(--muted)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                            Los scores se calculan automaticamente cada noche via cron job.
                        </p>
                    </div>
                ) : (
                    <div className="admin-table-wrapper">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th>Plan</th>
                                    <th>Score</th>
                                    <th className="hide-mobile">Clases 7d</th>
                                    <th className="hide-mobile">Evals 7d</th>
                                    <th className="hide-mobile">Scans 7d</th>
                                    <th>Dias inactivo</th>
                                    <th>Tendencia</th>
                                </tr>
                            </thead>
                            <tbody>
                                <AnimatePresence>
                                    {users.map(user => (
                                        <React.Fragment key={user.user_id}>
                                            <tr
                                                onClick={() => setExpandedId(expandedId === user.user_id ? null : user.user_id)}
                                                style={{ cursor: 'pointer', transition: 'background 0.2s' }}
                                                className="health-row-hover"
                                            >
                                                <td>
                                                    <div>
                                                        <div style={{ fontWeight: 600, marginBottom: '2px' }}>{user.full_name}</div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{user.email}</div>
                                                    </div>
                                                </td>
                                                <td><PlanBadge plan={user.plan_type} /></td>
                                                <td><ScoreBadge score={user.score} /></td>
                                                <td className="hide-mobile">{user.classes_7d}</td>
                                                <td className="hide-mobile">{user.evaluations_7d}</td>
                                                <td className="hide-mobile">{user.omr_scans_7d}</td>
                                                <td>
                                                    <span style={{
                                                        color: user.days_inactive > 7 ? '#ef4444' : user.days_inactive > 3 ? '#f59e0b' : 'var(--on-background)',
                                                        fontWeight: user.days_inactive > 7 ? 600 : 400,
                                                    }}>
                                                        {user.days_inactive}d
                                                    </span>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                                        <TrendIcon score={user.score} />
                                                        {expandedId === user.user_id
                                                            ? <ChevronUp size={14} style={{ color: 'var(--muted)' }} />
                                                            : <ChevronDown size={14} style={{ color: 'var(--muted)' }} />
                                                        }
                                                    </div>
                                                </td>
                                            </tr>
                                            {expandedId === user.user_id && (
                                                <ExpandedRow user={user} />
                                            )}
                                        </React.Fragment>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
}
