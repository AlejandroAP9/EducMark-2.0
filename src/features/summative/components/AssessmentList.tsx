'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Search, Plus, Edit3, Download, Copy, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

const supabase = createClient();

interface AssessmentListProps {
    onCreate: () => void;
    onEdit: (id: string) => void;
}

interface AssessmentRow {
    id: string;
    title: string;
    grade: string;
    subject: string;
    unit?: string;
    status: string;
    created_at: string;
    updated_at: string;
    items: number;
    lastModified: string;
}

export const AssessmentList: React.FC<AssessmentListProps> = ({ onCreate, onEdit }) => {
    const [tests, setTests] = useState<AssessmentRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState('');

    const fetchTests = async () => {
        setLoading(true);
        try {
            const { data: userData } = await supabase.auth.getUser();
            const userId = userData?.user?.id;
            if (!userId) {
                setTests([]);
                return;
            }

            const { data: evaluations, error } = await supabase
                .from('evaluations')
                .select('id, title, grade, subject, status, created_at, updated_at')
                .eq('user_id', userId)
                .neq('status', 'archived')
                .order('created_at', { ascending: false });

            if (error) throw error;
            const evals = evaluations || [];

            const countsEntries = await Promise.all(
                evals.map(async (ev) => {
                    const { count } = await supabase
                        .from('evaluation_items')
                        .select('*', { count: 'exact', head: true })
                        .eq('evaluation_id', ev.id);
                    return [ev.id, count || 0] as const;
                })
            );

            const countsMap = new Map<string, number>(countsEntries);

            setTests(
                evals.map((ev) => ({
                    ...ev,
                    items: countsMap.get(ev.id) || 0,
                    lastModified: ev.updated_at || ev.created_at,
                }))
            );
        } catch (err) {
            console.error('Error fetching evaluations list:', err);
            toast.error('No se pudo cargar el banco de evaluaciones.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTests();
    }, []);

    const filteredTests = useMemo(() => {
        if (!query.trim()) return tests;
        const q = query.toLowerCase();
        return tests.filter((test) =>
            (test.title || '').toLowerCase().includes(q) ||
            (test.subject || '').toLowerCase().includes(q) ||
            (test.grade || '').toLowerCase().includes(q)
        );
    }, [tests, query]);

    const formatRelativeDate = (dateValue: string) => {
        const d = new Date(dateValue);
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        if (diffHours < 1) return 'Hace menos de 1 hora';
        if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays < 30) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
        return d.toLocaleDateString('es-CL');
    };

    const archiveAssessment = async (id: string) => {
        const { error } = await supabase.from('evaluations').update({ status: 'archived' }).eq('id', id);
        if (error) {
            toast.error('No se pudo archivar la evaluación.');
            return;
        }
        toast.success('Evaluación archivada.');
        fetchTests();
    };

    const handleArchive = (id: string) => {
        toast('¿Archivar esta evaluación?', {
            action: {
                label: 'Archivar',
                onClick: () => archiveAssessment(id),
            },
            cancel: {
                label: 'Cancelar',
                onClick: () => undefined,
            },
        });
    };

    const handleDuplicate = async (test: AssessmentRow) => {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;
        if (!userId) return;

        const { data, error } = await supabase
            .from('evaluations')
            .insert({
                user_id: userId,
                title: `${test.title} (copia)`,
                grade: test.grade,
                subject: test.subject,
                unit: test.unit || '',
                status: 'active',
            })
            .select('id')
            .single();
        if (error || !data?.id) {
            toast.error('No se pudo duplicar la evaluación.');
            return;
        }
        toast.success('Evaluación duplicada.');
        fetchTests();
        onEdit(data.id);
    };

    return (
        <div className="p-0 md:p-6 h-full flex flex-col animate-fade-in">
            <div className="glass-card-premium flex flex-col h-full overflow-hidden">
                <div className="p-6 border-b border-[var(--border)] flex flex-col md:flex-row justify-between items-center gap-4 bg-[var(--card)]/50">
                    <div>
                        <h2 className="text-xl font-bold text-[var(--on-background)]">Banco de Evaluaciones Sumativas</h2>
                        <p className="text-sm text-[var(--muted)] mt-1">Gestiona tus pruebas, ensayos y controles.</p>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={16} />
                            <input
                                type="text"
                                placeholder="Buscar prueba..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl text-sm text-[var(--on-background)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none transition-all placeholder-[var(--muted)]"
                            />
                        </div>
                        <button
                            onClick={onCreate}
                            className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 flex items-center gap-2 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all border border-indigo-500/50"
                        >
                            <Plus size={18} /> <span className="hidden sm:inline">Crear Nueva</span>
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-auto">
                    <table className="w-full text-left border-collapse table-proto">
                        <thead className="bg-[var(--card)] sticky top-0 z-10 backdrop-blur-sm">
                            <tr>
                                <th className="p-5 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider border-b border-[var(--border)]">Evaluación</th>
                                <th className="p-5 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider border-b border-[var(--border)]">Asignatura</th>
                                <th className="p-5 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider border-b border-[var(--border)] text-center">Ítems</th>
                                <th className="p-5 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider border-b border-[var(--border)] text-center">Estado</th>
                                <th className="p-5 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider border-b border-[var(--border)] text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                            {loading && (
                                <tr>
                                    <td colSpan={5} className="p-6 text-center text-[var(--muted)]">Cargando evaluaciones...</td>
                                </tr>
                            )}
                            {!loading && filteredTests.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-6 text-center text-[var(--muted)]">No se encontraron evaluaciones.</td>
                                </tr>
                            )}
                            {!loading && filteredTests.map(test => (
                                <tr key={test.id} className="hover:bg-[var(--card-hover)] group transition-colors">
                                    <td className="p-5 border-t border-[var(--border)]">
                                        <div className="flex items-start gap-3">
                                            <div className={`mt-1 w-2 h-2 rounded-full ${test.status === 'Publicada' ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : test.status === 'Borrador' ? 'bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]' : 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]'}`}></div>
                                            <div>
                                                <p className="font-bold text-[var(--on-background)] text-sm">{test.title}</p>
                                                <p className="text-xs text-[var(--muted)] mt-1 flex items-center gap-2">
                                                    <span>{test.grade}</span>
                                                    <span className="w-1 h-1 rounded-full bg-[var(--muted)]"></span>
                                                    <span>Actualizado {formatRelativeDate(test.lastModified)}</span>
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-5 text-sm font-medium text-[var(--muted)] border-t border-[var(--border)]">
                                        <span className="bg-[var(--input-bg)] border border-[var(--border)] px-2 py-1 rounded-md text-xs text-[var(--on-background)]">{test.subject}</span>
                                    </td>
                                    <td className="p-5 text-center border-t border-[var(--border)]">
                                        <span className="font-mono text-sm font-semibold text-[var(--primary)] bg-[var(--primary)]/10 px-2 py-1 rounded border border-[var(--primary)]/20">{test.items}</span>
                                    </td>
                                    <td className="p-5 text-center border-t border-[var(--border)]">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${test.status === 'Publicada' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                            test.status === 'Corregida' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                            }`}>{test.status}</span>
                                    </td>
                                    <td className="p-5 text-right border-t border-[var(--border)]">
                                        <div className="flex justify-end gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                                            <button onClick={() => onEdit(test.id)} className="p-2 text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--input-bg)] rounded-lg transition-colors border border-transparent hover:border-[var(--border)]" title="Editar"><Edit3 size={16} /></button>
                                            <button onClick={() => handleDuplicate(test)} className="p-2 text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--input-bg)] rounded-lg transition-colors border border-transparent hover:border-[var(--border)]" title="Duplicar"><Copy size={16} /></button>
                                            <button className="p-2 text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--input-bg)] rounded-lg transition-colors border border-transparent hover:border-[var(--border)]" title="Descargar PDF"><Download size={16} /></button>
                                            <button onClick={() => handleArchive(test.id)} className="p-2 text-[var(--muted)] hover:text-red-400 hover:bg-[var(--input-bg)] rounded-lg transition-colors border border-transparent hover:border-[var(--border)]" title="Archivar"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
