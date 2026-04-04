'use client';

import React from 'react';
import { Save, Send, Undo2 } from 'lucide-react';

export interface KitResultActionsProps {
    summary: string;
    setSummary: React.Dispatch<React.SetStateAction<string>>;
    saving: boolean;
    submitting: boolean;
    isDirty: boolean;
    undoStackLength: number;
    onUndo: () => void;
    onSave: () => void;
    onSubmit: () => void;
}

export function KitResultActions({
    summary,
    setSummary,
    saving,
    submitting,
    isDirty,
    undoStackLength,
    onUndo,
    onSave,
    onSubmit,
}: KitResultActionsProps) {
    return (
        <div className="glass-card-premium p-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                <div className="md:col-span-2">
                    <label className="text-xs uppercase tracking-wider font-bold text-[var(--muted)]">Resumen de cambios (opcional)</label>
                    <input
                        value={summary}
                        onChange={(e) => setSummary(e.target.value)}
                        className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-lg p-2.5"
                        placeholder="Ej: Ajuste del cierre y mejora del ticket"
                    />
                </div>
                <div className="flex flex-wrap md:justify-end gap-2">
                    <button
                        type="button"
                        onClick={onUndo}
                        disabled={undoStackLength === 0}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] disabled:opacity-30 transition-colors"
                        title="Deshacer (Ctrl+Z)"
                    >
                        <Undo2 size={16} />
                    </button>
                    <button
                        type="button"
                        onClick={onSave}
                        disabled={saving || !isDirty}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] text-white disabled:opacity-50"
                    >
                        <Save size={16} /> {saving ? 'Guardando...' : 'Guardar versión'}
                    </button>
                    <button
                        type="button"
                        onClick={onSubmit}
                        disabled={submitting}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 disabled:opacity-50"
                    >
                        <Send size={16} /> {submitting ? 'Enviando...' : 'Enviar a UTP'}
                    </button>
                </div>
            </div>
        </div>
    );
}
