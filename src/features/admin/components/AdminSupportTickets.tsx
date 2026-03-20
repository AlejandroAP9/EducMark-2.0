'use client';

import React, { useEffect, useState } from 'react';
import { ArrowLeft, Ticket, RefreshCw } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface TicketRow {
    id: string;
    institution: string | null;
    user_email: string | null;
    subject: string;
    category: string;
    priority: string;
    status: string;
    created_at: string;
}

export function AdminSupportTickets() {
    const supabase = createClient();
    const router = useRouter();
    const [tickets, setTickets] = useState<TicketRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('support_tickets')
                .select('id, institution, user_email, subject, category, priority, status, created_at')
                .order('created_at', { ascending: false })
                .limit(100);
            if (error) throw error;
            setTickets((data || []) as TicketRow[]);
        } catch (error) {
            console.error('Error fetching support tickets:', error);
            toast.error('No se pudieron cargar los tickets.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, []);

    const updateStatus = async (id: string, status: string) => {
        setUpdatingId(id);
        try {
            const payload: Record<string, string> = {
                status,
                updated_at: new Date().toISOString(),
            };
            if (status === 'resolved' || status === 'closed') {
                payload.resolved_at = new Date().toISOString();
            }
            const { error } = await supabase.from('support_tickets').update(payload).eq('id', id);
            if (error) throw error;
            setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
            toast.success('Estado de ticket actualizado.');
        } catch (error) {
            console.error('Error updating ticket:', error);
            toast.error('No se pudo actualizar el ticket.');
        } finally {
            setUpdatingId(null);
        }
    };

    return (
        <div className="space-y-5">
            <button onClick={() => router.push('/dashboard/admin')} className="admin-back-btn">
                <ArrowLeft size={18} />
                Volver
            </button>

            <div className="admin-page-header">
                <div className="header-icon"><Ticket size={22} /></div>
                <div>
                    <h1>Tickets de Soporte</h1>
                    <p>Seguimiento operativo de solicitudes institucionales</p>
                </div>
            </div>

            <div className="glass-card-premium p-5" style={{ borderRadius: '1rem' }}>
                <div className="flex justify-end mb-4">
                    <button onClick={fetchTickets} className="admin-back-btn" style={{ margin: 0 }}>
                        <RefreshCw size={16} />
                        Recargar
                    </button>
                </div>
                <div className="overflow-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left border-b border-[var(--border)]">
                                <th className="py-2 pr-3">Fecha</th>
                                <th className="py-2 pr-3">Institución</th>
                                <th className="py-2 pr-3">Solicitante</th>
                                <th className="py-2 pr-3">Asunto</th>
                                <th className="py-2 pr-3">Categoría</th>
                                <th className="py-2 pr-3">Prioridad</th>
                                <th className="py-2">Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && (
                                <tr>
                                    <td colSpan={7} className="py-5 text-center text-[var(--muted)]">Cargando tickets...</td>
                                </tr>
                            )}
                            {!loading && tickets.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="py-5 text-center text-[var(--muted)]">No hay tickets registrados.</td>
                                </tr>
                            )}
                            {!loading && tickets.map((ticket) => (
                                <tr key={ticket.id} className="border-b border-[var(--border)]">
                                    <td className="py-2 pr-3">{new Date(ticket.created_at).toLocaleDateString('es-CL')}</td>
                                    <td className="py-2 pr-3">{ticket.institution || '—'}</td>
                                    <td className="py-2 pr-3">{ticket.user_email || '—'}</td>
                                    <td className="py-2 pr-3">{ticket.subject}</td>
                                    <td className="py-2 pr-3">{ticket.category}</td>
                                    <td className="py-2 pr-3">{ticket.priority}</td>
                                    <td className="py-2">
                                        <select
                                            value={ticket.status}
                                            disabled={updatingId === ticket.id}
                                            onChange={(e) => updateStatus(ticket.id, e.target.value)}
                                            className="px-2 py-1 rounded-md bg-[var(--input-bg)] border border-[var(--border)] text-xs"
                                        >
                                            <option value="open">open</option>
                                            <option value="in_progress">in_progress</option>
                                            <option value="resolved">resolved</option>
                                            <option value="closed">closed</option>
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

