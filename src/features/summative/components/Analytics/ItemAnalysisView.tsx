'use client';

/**
 * Item Analysis View — AN-19
 * Shows IRT-lite statistics: discrimination, difficulty, defective items detection.
 */
import React from 'react';
import { AlertTriangle, CheckCircle2, Target } from 'lucide-react';
import { type ItemStats } from '@/shared/lib/itemAnalysis';

interface ItemAnalysisViewProps {
    items: ItemStats[];
}

export const ItemAnalysisView: React.FC<ItemAnalysisViewProps> = ({ items }) => {
    if (items.length === 0) {
        return (
            <div className="glass-card-premium p-8 text-center">
                <Target size={32} className="text-[var(--muted)] mx-auto mb-3 opacity-40" />
                <p className="text-[var(--muted)]">Se necesitan al menos 5 estudiantes para el an&#225;lisis de &#237;tems.</p>
            </div>
        );
    }

    const defectiveCount = items.filter(i => i.isDefective).length;

    return (
        <div className="glass-card-premium p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-[var(--on-background)] flex items-center gap-2">
                    <Target size={20} className="text-[var(--primary)]" />
                    An&#225;lisis de &#205;tems (Psicometr&#237;a)
                </h3>
                {defectiveCount > 0 && (
                    <span className="text-xs font-bold bg-red-500/10 text-red-400 px-3 py-1 rounded-full border border-red-500/20">
                        {defectiveCount} &#237;tem(s) problem&#225;tico(s)
                    </span>
                )}
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="border-b border-[var(--border)]">
                        <tr>
                            <th className="text-left px-3 py-2 text-[var(--muted)]">Pregunta</th>
                            <th className="text-center px-3 py-2 text-[var(--muted)]">Dificultad</th>
                            <th className="text-center px-3 py-2 text-[var(--muted)]">Discriminaci&#243;n</th>
                            <th className="text-left px-3 py-2 text-[var(--muted)]">Estado</th>
                            <th className="text-left px-3 py-2 text-[var(--muted)]">Observaci&#243;n</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item) => {
                            const diffColor = item.difficulty >= 0.7 ? 'text-emerald-400' : item.difficulty >= 0.3 ? 'text-amber-400' : 'text-red-400';
                            const discColor = item.discrimination >= 0.3 ? 'text-emerald-400' : item.discrimination >= 0.1 ? 'text-amber-400' : 'text-red-400';

                            return (
                                <tr key={item.questionIndex} className={`border-b border-[var(--border)] ${item.isDefective ? 'bg-red-500/5' : ''}`}>
                                    <td className="px-3 py-2 font-medium">{item.questionLabel}</td>
                                    <td className={`px-3 py-2 text-center font-bold ${diffColor}`}>
                                        {(item.difficulty * 100).toFixed(0)}%
                                    </td>
                                    <td className={`px-3 py-2 text-center font-bold ${discColor}`}>
                                        {item.discrimination.toFixed(2)}
                                    </td>
                                    <td className="px-3 py-2">
                                        {item.isDefective ? (
                                            <span className="inline-flex items-center gap-1 text-xs text-red-400">
                                                <AlertTriangle size={12} /> Revisar
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                                                <CheckCircle2 size={12} /> OK
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-3 py-2 text-xs text-[var(--muted)] max-w-[200px]">
                                        {item.defectReason || 'Sin observaciones'}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-[var(--input-bg)] border border-[var(--border)] text-center">
                    <p className="text-xs text-[var(--muted)]">Dificultad promedio</p>
                    <p className="text-lg font-bold text-[var(--on-background)]">
                        {(items.reduce((s, i) => s + i.difficulty, 0) / items.length * 100).toFixed(0)}%
                    </p>
                </div>
                <div className="p-3 rounded-lg bg-[var(--input-bg)] border border-[var(--border)] text-center">
                    <p className="text-xs text-[var(--muted)]">Discriminaci&#243;n promedio</p>
                    <p className="text-lg font-bold text-[var(--on-background)]">
                        {(items.reduce((s, i) => s + i.discrimination, 0) / items.length).toFixed(2)}
                    </p>
                </div>
                <div className="p-3 rounded-lg bg-[var(--input-bg)] border border-[var(--border)] text-center">
                    <p className="text-xs text-[var(--muted)]">&#205;tems v&#225;lidos</p>
                    <p className="text-lg font-bold text-emerald-400">
                        {items.length - defectiveCount}/{items.length}
                    </p>
                </div>
            </div>
        </div>
    );
};
