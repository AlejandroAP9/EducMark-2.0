'use client';

/**
 * Trash Bin / Papelera — EV-30
 * Shows soft-deleted evaluations and items, allows restore within 30 days.
 */
import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Trash2, RotateCcw, AlertTriangle } from 'lucide-react';

interface DeletedItem {
    id: string;
    type: 'evaluation' | 'item';
    title: string;
    deleted_at: string;
    daysLeft: number;
}

export const TrashBin: React.FC = () => {
    const supabase = createClient();
    const [items, setItems] = useState<DeletedItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchDeleted(); }, []);

    const fetchDeleted = async () => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            // Fetch soft-deleted evaluations
            const { data: evals } = await supabase
                .from('evaluations')
                .select('id, title, deleted_at')
                .eq('user_id', session.user.id)
                .not('deleted_at', 'is', null)
                .gte('deleted_at', thirtyDaysAgo.toISOString())
                .order('deleted_at', { ascending: false });

            // Fetch soft-deleted items
            const { data: bankItems } = await supabase
                .from('item_bank')
                .select('id, question, deleted_at')
                .eq('user_id', session.user.id)
                .not('deleted_at', 'is', null)
                .gte('deleted_at', thirtyDaysAgo.toISOString())
                .order('deleted_at', { ascending: false });

            const now = Date.now();
            const deleted: DeletedItem[] = [
                ...(evals || []).map(e => ({
                    id: e.id,
                    type: 'evaluation' as const,
                    title: e.title || 'Evaluaci\u00f3n sin t\u00edtulo',
                    deleted_at: e.deleted_at,
                    daysLeft: Math.max(0, 30 - Math.floor((now - new Date(e.deleted_at).getTime()) / 86400000)),
                })),
                ...(bankItems || []).map(i => ({
                    id: i.id,
                    type: 'item' as const,
                    title: (i.question || '\u00cdtem sin texto').substring(0, 80),
                    deleted_at: i.deleted_at,
                    daysLeft: Math.max(0, 30 - Math.floor((now - new Date(i.deleted_at).getTime()) / 86400000)),
                })),
            ].sort((a, b) => new Date(b.deleted_at).getTime() - new Date(a.deleted_at).getTime());

            setItems(deleted);
        } catch (err) {
            console.error(err);
            toast.error('Error al cargar papelera.');
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async (item: DeletedItem) => {
        const table = item.type === 'evaluation' ? 'evaluations' : 'item_bank';
        const { error } = await supabase
            .from(table)
            .update({ deleted_at: null })
            .eq('id', item.id);

        if (error) {
            toast.error('Error al restaurar.');
            return;
        }
        toast.success(`${item.type === 'evaluation' ? 'Evaluaci\u00f3n' : '\u00cdtem'} restaurado.`);
        setItems(prev => prev.filter(i => i.id !== item.id));
    };

    if (loading) return <div className="p-8 text-center text-[var(--muted)]">Cargando papelera...</div>;

    return (
        <div className="glass-card-premium p-6">
            <h3 className="text-lg font-semibold text-[var(--on-background)] mb-4 flex items-center gap-2">
                <Trash2 size={20} className="text-[var(--muted)]" />
                Papelera de Reciclaje
            </h3>
            <p className="text-xs text-[var(--muted)] mb-6">Los elementos se eliminan permanentemente despu&#233;s de 30 d&#237;as.</p>

            {items.length === 0 ? (
                <div className="p-6 text-center text-[var(--muted)]">La papelera est&#225; vac&#237;a.</div>
            ) : (
                <div className="space-y-2">
                    {items.map(item => (
                        <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border border-[var(--border)] bg-[var(--card)]/40">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${item.type === 'evaluation' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                                        {item.type === 'evaluation' ? 'Evaluaci\u00f3n' : '\u00cdtem'}
                                    </span>
                                    <span className="text-sm text-[var(--on-background)] truncate">{item.title}</span>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] text-[var(--muted)]">
                                        Eliminado: {new Date(item.deleted_at).toLocaleDateString('es-CL')}
                                    </span>
                                    {item.daysLeft <= 5 && (
                                        <span className="text-[10px] text-red-400 flex items-center gap-1">
                                            <AlertTriangle size={10} /> {item.daysLeft} d&#237;as restantes
                                        </span>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={() => handleRestore(item)}
                                className="p-2 hover:bg-emerald-500/10 text-[var(--muted)] hover:text-emerald-400 rounded-lg transition-colors"
                                title="Restaurar"
                            >
                                <RotateCcw size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
