'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { ScrollText, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AuditLog {
    id: string;
    event: string;
    payment_id: string;
    user_id: string;
    plan_type: string;
    status: string;
    amount: number;
    payer_email: string;
    currency: string;
    timestamp: string;
    details: Record<string, unknown> | null;
}

const PAGE_SIZE = 15;

export function AdminLogs() {
    const supabase = createClient();
    const router = useRouter();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [eventFilter, setEventFilter] = useState<string>('all');

    useEffect(() => {
        fetchLogs();
    }, [page, eventFilter]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            // Count
            let countQuery = supabase.from('audit_logs').select('*', { count: 'exact', head: true });
            if (eventFilter !== 'all') {
                countQuery = countQuery.ilike('event', `%${eventFilter}%`);
            }
            const { count } = await countQuery;
            setTotalCount(count || 0);

            // Fetch
            let query = supabase
                .from('audit_logs')
                .select('*')
                .order('timestamp', { ascending: false })
                .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

            if (eventFilter !== 'all') {
                query = query.ilike('event', `%${eventFilter}%`);
            }

            const { data } = await query;
            setLogs(data || []);
        } catch (err) {
            console.error('Error fetching audit logs:', err);
        } finally {
            setLoading(false);
        }
    };

    const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
    const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    const formatDate = (date: string) =>
        new Date(date).toLocaleString('es-CL', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });

    const getEventColor = (event: string) => {
        if (event.includes('approved') || event.includes('created')) return '#10b981';
        if (event.includes('rejected') || event.includes('cancelled') || event.includes('failed')) return '#ef4444';
        if (event.includes('updated') || event.includes('pending')) return '#f59e0b';
        return '#6366f1';
    };

    const getEventEmoji = (event: string) => {
        if (event.includes('payment.approved')) return '💳';
        if (event.includes('payment.rejected')) return '❌';
        if (event.includes('subscription.created')) return '🎉';
        if (event.includes('subscription.cancelled')) return '⚠️';
        if (event.includes('subscription.updated')) return '🔄';
        if (event.includes('omr_scan')) return '📷';
        if (event.includes('user')) return '👤';
        return '📋';
    };

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
                    <ScrollText size={22} />
                </div>
                <div>
                    <h1>Admin Logs</h1>
                    <p>Historial de auditoría y eventos del sistema</p>
                </div>
            </motion.div>

            {/* Filters */}
            <motion.div variants={item} style={{ marginBottom: '1rem' }}>
                <div className="filter-pills">
                    {['all', 'payment', 'subscription', 'user', 'omr_scan'].map(f => (
                        <button
                            key={f}
                            className={`filter-pill ${eventFilter === f ? 'active' : ''}`}
                            onClick={() => { setEventFilter(f); setPage(0); }}
                        >
                            {f === 'all' ? 'Todos' : f === 'omr_scan' ? 'OMR Scan' : f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* Table */}
            <motion.div variants={item} className="glass-card-premium" style={{ padding: 0, borderRadius: '1.25rem', overflow: 'hidden' }}>
                <div className="admin-table-header">
                    <span className="table-info">
                        {totalCount} registros en total
                    </span>
                    <span className="table-info">
                        Página {page + 1} de {totalPages || 1}
                    </span>
                </div>

                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center' }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', margin: '0 auto', border: '4px solid var(--primary)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }}></div>
                    </div>
                ) : (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Evento</th>
                                <th>Email</th>
                                <th>Plan</th>
                                <th>Monto</th>
                                <th>Status</th>
                                <th>Fecha</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map(log => (
                                <tr key={log.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span>{getEventEmoji(log.event)}</span>
                                            <span style={{
                                                fontWeight: 600,
                                                fontSize: '0.85rem',
                                                color: getEventColor(log.event)
                                            }}>
                                                {log.event}
                                            </span>
                                        </div>
                                    </td>
                                    <td style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                                        {log.payer_email || '—'}
                                    </td>
                                    <td>
                                        {log.plan_type ? (
                                            <span className={`badge-proto ${log.plan_type?.toLowerCase() === 'copihue' ? 'orange' : log.plan_type?.toLowerCase() === 'araucaria' ? 'green' : log.plan_type?.toLowerCase() === 'condor' ? 'primary' : 'blue'}`}>
                                                {log.plan_type}
                                            </span>
                                        ) : '—'}
                                    </td>
                                    <td>
                                        {log.amount ? (
                                            <span style={{ fontWeight: 600, color: '#10b981' }}>
                                                ${Number(log.amount).toLocaleString('es-CL')} {log.currency || 'CLP'}
                                            </span>
                                        ) : '—'}
                                    </td>
                                    <td>
                                        {log.status ? (
                                            <span className={`badge-proto ${log.status === 'approved' || log.status === 'active' ? 'green' : log.status === 'rejected' || log.status === 'cancelled' ? 'orange' : 'blue'}`}>
                                                {log.status}
                                            </span>
                                        ) : '—'}
                                    </td>
                                    <td style={{ fontSize: '0.8rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                                        {formatDate(log.timestamp)}
                                    </td>
                                </tr>
                            ))}
                            {logs.length === 0 && (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>
                                        No se encontraron registros de auditoría
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}

                {/* Pagination */}
                <div className="admin-pagination">
                    <button onClick={() => setPage(p => p - 1)} disabled={page === 0}>
                        <ChevronLeft size={16} />
                    </button>
                    <span className="page-info">Página {page + 1} de {totalPages || 1}</span>
                    <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}>
                        <ChevronRight size={16} />
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}
