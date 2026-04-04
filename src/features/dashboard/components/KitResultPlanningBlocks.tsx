'use client';

import React from 'react';
import { Plus, Trash2, FileDown, Loader2, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import type { PlanningBlocks } from './KitResultTypes';

export interface KitResultPlanningBlocksProps {
    planningBlocks: PlanningBlocks;
    setPlanningBlocks: React.Dispatch<React.SetStateAction<PlanningBlocks>>;
    regeneratingSection: string | null;
    onRegenerateSection: (sectionKey: 'inicio' | 'desarrollo' | 'cierre') => void;
    onExportGuide: () => void;
    pushUndo: () => void;
}

export function KitResultPlanningBlocks({
    planningBlocks,
    setPlanningBlocks,
    regeneratingSection,
    onRegenerateSection,
    onExportGuide,
    pushUndo,
}: KitResultPlanningBlocksProps) {
    const addResource = () => {
        pushUndo();
        setPlanningBlocks((prev) => ({ ...prev, resources: [...prev.resources, ''] }));
    };

    const updateResource = (idx: number, value: string) => {
        setPlanningBlocks((prev) => ({
            ...prev,
            resources: prev.resources.map((item, index) => (index === idx ? value : item)),
        }));
    };

    const removeResource = (idx: number) => {
        pushUndo();
        setPlanningBlocks((prev) => ({
            ...prev,
            resources: prev.resources.filter((_, index) => index !== idx),
        }));
    };

    const addIndicator = () => {
        pushUndo();
        setPlanningBlocks((prev) => ({ ...prev, indicators: [...prev.indicators, ''] }));
    };

    const updateIndicator = (idx: number, value: string) => {
        setPlanningBlocks((prev) => ({
            ...prev,
            indicators: prev.indicators.map((item, index) => (index === idx ? value : item)),
        }));
    };

    const removeIndicator = (idx: number) => {
        pushUndo();
        setPlanningBlocks((prev) => ({
            ...prev,
            indicators: prev.indicators.filter((_, index) => index !== idx),
        }));
    };

    return (
        <div className="glass-card-premium p-6 space-y-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-[var(--on-background)]">Bloques editables de la clase</h2>
                <button
                    type="button"
                    onClick={onExportGuide}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--card-hover)] text-sm font-medium"
                >
                    <FileDown size={14} /> Imprimir Guía (Basada en Desarrollo)
                </button>
            </div>

            <div className="space-y-3">
                <label className="text-xs uppercase tracking-wider font-bold text-[var(--muted)]">Objetivo de la clase</label>
                <textarea
                    value={planningBlocks.objective}
                    onChange={(e) => setPlanningBlocks((prev) => ({ ...prev, objective: e.target.value }))}
                    className="w-full min-h-[80px] bg-[var(--input-bg)] border border-[var(--border)] rounded-lg p-3"
                />
            </div>

            <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider font-bold text-[var(--muted)]">Indicadores de evaluación</label>
                {planningBlocks.indicators.map((item, idx) => (
                    <div key={`indicator-${idx}`} className="flex items-center gap-2">
                        <input
                            value={item}
                            onChange={(e) => updateIndicator(idx, e.target.value)}
                            className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-lg p-2.5"
                            placeholder={`Indicador ${idx + 1}`}
                        />
                        <button type="button" onClick={() => removeIndicator(idx)} className="p-2 rounded-md text-red-400 hover:bg-red-500/10">
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
                <button type="button" onClick={addIndicator} className="inline-flex items-center gap-1 text-sm text-[var(--primary)]">
                    <Plus size={15} /> Agregar indicador
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {(['inicio', 'desarrollo', 'cierre'] as const).map(sectionKey => (
                    <div key={sectionKey}>
                        <div className="flex items-center justify-between mb-1">
                            <label className="text-xs uppercase tracking-wider font-bold text-[var(--muted)]">
                                {sectionKey === 'inicio' ? '🟢 Inicio' : sectionKey === 'desarrollo' ? '🔵 Desarrollo' : '🟠 Cierre'}
                            </label>
                            <button
                                type="button"
                                onClick={() => onRegenerateSection(sectionKey)}
                                disabled={regeneratingSection === sectionKey}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold text-[var(--primary)] bg-[var(--primary)]/10 border border-[var(--primary)]/20 hover:bg-[var(--primary)]/20 disabled:opacity-50 transition-colors"
                            >
                                {regeneratingSection === sectionKey
                                    ? <><Loader2 size={10} className="animate-spin" /> Regenerando...</>
                                    : <><Wand2 size={10} /> Regenerar sección</>}
                            </button>
                        </div>
                        <textarea
                            value={planningBlocks[sectionKey]}
                            onChange={(e) => setPlanningBlocks(prev => ({ ...prev, [sectionKey]: e.target.value }))}
                            className={`w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-lg p-3 ${sectionKey === 'desarrollo' ? 'min-h-[120px]' : 'min-h-[100px]'}`}
                        />
                    </div>
                ))}
            </div>

            <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider font-bold text-[var(--muted)]">Recursos</label>
                {planningBlocks.resources.map((item, idx) => (
                    <div key={`resource-${idx}`} className="flex items-center gap-2">
                        <input
                            value={item}
                            onChange={(e) => updateResource(idx, e.target.value)}
                            className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-lg p-2.5"
                            placeholder={`Recurso ${idx + 1}`}
                        />
                        <button type="button" onClick={() => removeResource(idx)} className="p-2 rounded-md text-red-400 hover:bg-red-500/10">
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
                <div className="flex items-center gap-3">
                    <button type="button" onClick={addResource} className="inline-flex items-center gap-1 text-sm text-[var(--primary)]">
                        <Plus size={15} /> Agregar recurso
                    </button>
                    <label className="inline-flex items-center gap-1 text-sm text-[var(--primary)] cursor-pointer hover:underline">
                        <FileDown size={15} /> Adjuntar archivo
                        <input
                            type="file"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                if (file.size > 5 * 1024 * 1024) {
                                    toast.error('El archivo no puede superar 5 MB.');
                                    return;
                                }
                                const reader = new FileReader();
                                reader.onload = (ev) => {
                                    const dataUrl = ev.target?.result as string;
                                    pushUndo();
                                    setPlanningBlocks((prev) => ({ ...prev, resources: [...prev.resources, `[Archivo: ${file.name}] ${dataUrl.slice(0, 100)}...`] }));
                                    toast.success(`Archivo "${file.name}" adjuntado como recurso.`);
                                };
                                reader.readAsDataURL(file);
                                e.target.value = '';
                            }}
                        />
                    </label>
                </div>
            </div>
        </div>
    );
}
