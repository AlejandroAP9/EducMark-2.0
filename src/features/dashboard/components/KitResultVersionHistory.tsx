'use client';

import React from 'react';
import { History, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import type { PlanningVersionRow, PlanningBlocks, ExitTicket } from './KitResultTypes';
import { normalizeBlocks, normalizeTicket } from './KitResultTypes';

export interface KitResultVersionHistoryProps {
    versions: PlanningVersionRow[];
    currentVersion: number | null;
    showVersions: boolean;
    setShowVersions: React.Dispatch<React.SetStateAction<boolean>>;
    setPlanningBlocks: React.Dispatch<React.SetStateAction<PlanningBlocks>>;
    setExitTicket: React.Dispatch<React.SetStateAction<ExitTicket>>;
    pushUndo: () => void;
}

export function KitResultVersionHistory({
    versions,
    currentVersion,
    showVersions,
    setShowVersions,
    setPlanningBlocks,
    setExitTicket,
    pushUndo,
}: KitResultVersionHistoryProps) {
    const supabase = createClient();

    const restoreVersion = async (versionId: string, versionNumber: number) => {
        const { data, error } = await supabase
            .from('planning_versions')
            .select('snapshot')
            .eq('id', versionId)
            .single();
        if (error || !data?.snapshot) {
            toast.error('No se pudo cargar esta versión.');
            return;
        }
        const snap = data.snapshot as { planning_blocks?: unknown; exit_ticket?: unknown };
        pushUndo();
        if (snap.planning_blocks) setPlanningBlocks(normalizeBlocks(snap.planning_blocks));
        if (snap.exit_ticket) setExitTicket(normalizeTicket(snap.exit_ticket));
        toast.success(`Versión ${versionNumber} restaurada. Guarda para confirmar.`);
    };

    return (
        <div className="glass-card-premium overflow-hidden">
            <button
                type="button"
                onClick={() => setShowVersions(v => !v)}
                className="w-full flex items-center justify-between p-5 hover:bg-[var(--card-hover)]/40 transition-colors"
            >
                <span className="flex items-center gap-2 text-sm font-bold text-[var(--on-background)]">
                    <History size={16} className="text-[var(--primary)]" />
                    Historial de versiones ({versions.length})
                </span>
                {showVersions ? <ChevronUp size={16} className="text-[var(--muted)]" /> : <ChevronDown size={16} className="text-[var(--muted)]" />}
            </button>
            <AnimatePresence>
                {showVersions && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="px-5 pb-5 space-y-2 border-t border-[var(--border)]">
                            {versions.length === 0 && (
                                <p className="text-sm text-[var(--muted)] pt-3">Aún no hay versiones guardadas.</p>
                            )}
                            {versions.map(v => (
                                <div key={v.id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-[var(--input-bg)] border border-[var(--border)]">
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-[var(--foreground)]">
                                            v{v.version_number}
                                            <span className="text-xs font-normal text-[var(--muted)] ml-2">
                                                {v.editor_name || 'Docente'} · {new Date(v.created_at).toLocaleString('es-CL')}
                                            </span>
                                        </p>
                                        {v.change_summary && (
                                            <p className="text-xs text-[var(--muted)] truncate">{v.change_summary}</p>
                                        )}
                                    </div>
                                    {v.version_number !== currentVersion && (
                                        <button
                                            type="button"
                                            onClick={() => restoreVersion(v.id, v.version_number)}
                                            className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20 hover:bg-[var(--primary)]/20 transition-colors"
                                        >
                                            <RotateCcw size={12} /> Restaurar
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
