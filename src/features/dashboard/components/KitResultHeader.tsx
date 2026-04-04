'use client';

import React, { useMemo } from 'react';
import { ArrowLeft, CheckCircle2, Clock3, AlertCircle, Save, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import type { GeneratedClassWorkflowRow } from './KitResultTypes';

export interface KitResultHeaderProps {
    row: GeneratedClassWorkflowRow;
}

export function KitResultHeader({ row }: KitResultHeaderProps) {
    const router = useRouter();

    const statusBadge = useMemo(() => {
        if (row.planning_status === 'approved') return { label: 'Aprobada', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: <CheckCircle2 size={14} /> };
        if (row.planning_status === 'submitted') return { label: 'En revisión UTP', className: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: <Clock3 size={14} /> };
        if (row.planning_status === 'changes_requested') return { label: 'Cambios solicitados', className: 'bg-red-500/10 text-red-400 border-red-500/20', icon: <AlertCircle size={14} /> };
        return { label: 'Borrador', className: 'bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20', icon: <Save size={14} /> };
    }, [row.planning_status]);

    return (
        <>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <button
                        type="button"
                        onClick={() => router.push('/dashboard/history')}
                        className="inline-flex items-center gap-2 text-[var(--muted)] hover:text-[var(--foreground)] mb-3"
                    >
                        <ArrowLeft size={16} /> Volver a Biblioteca
                    </button>
                    <h1 className="text-3xl font-bold text-[var(--on-background)]">Planificación v1</h1>
                    <p className="text-[var(--muted)] mt-1">
                        {row.asignatura || 'Asignatura'} · {row.curso || 'Curso'} · {row.topic || row.objetivo_clase || 'Clase sin título'}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {statusBadge && (
                        <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border ${statusBadge.className}`}>
                            {statusBadge.icon} {statusBadge.label}
                        </span>
                    )}
                    <span className="px-3 py-1.5 rounded-full text-xs font-bold border border-[var(--border)] text-[var(--muted)]">
                        Versión {row.current_version || 1}
                    </span>
                    <button
                        type="button"
                        onClick={() => {
                            const text = `Acabo de crear una clase de ${row.asignatura || 'mi asignatura'} para ${row.curso || 'mi curso'} en 6 minutos con EducMark. ¡Pruébalo gratis! https://educmark.cl`;
                            if (navigator.share) {
                                navigator.share({ title: 'EducMark — Clase lista en 6 min', text }).catch(() => {});
                            } else {
                                navigator.clipboard.writeText(text);
                                toast.success('Texto copiado — compártelo con un colega');
                            }
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border border-emerald-500/30 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors"
                        title="Compartir con un colega"
                    >
                        <Share2 size={14} /> Compartir
                    </button>
                </div>
            </div>

            {row.approval_notes && (
                <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10">
                    <p className="text-xs uppercase tracking-wider text-amber-300 font-bold mb-1">Comentario de revisión</p>
                    <p className="text-sm text-amber-100">{row.approval_notes}</p>
                </div>
            )}
        </>
    );
}
