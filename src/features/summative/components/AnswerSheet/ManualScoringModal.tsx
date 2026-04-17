'use client';

/**
 * ManualScoringModal — UI de corrección manual para items de Desarrollo /
 * Respuesta Breve / Completación abierta que no se leen por OMR.
 *
 * Flujo:
 * 1. El profe abre este modal desde OMRResultsView para un estudiante específico.
 * 2. Query a evaluation_items filtrando is_manual=true.
 * 3. Por cada item: muestra enunciado + rúbrica + input de score + notas.
 * 4. Upsert en manual_scores (unique por omr_result_id + item_id).
 * 5. Recalcula la nota final combinando OMR + manual.
 */
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Loader2, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

interface EvaluationItem {
    id: string;
    question: string;
    pedagogical_type: string | null;
    rubric: string | null;
    explanation: string | null;
}

interface ManualScoreRow {
    id?: string;
    item_id: string;
    score_awarded: number;
    max_score: number;
    notes: string;
    student_answer: string;
}

interface ManualScoringModalProps {
    isOpen: boolean;
    onClose: () => void;
    omrResultId: string;
    evaluationId: string;
    studentName: string;
    onSaved: () => void;
}

export const ManualScoringModal: React.FC<ManualScoringModalProps> = ({
    isOpen,
    onClose,
    omrResultId,
    evaluationId,
    studentName,
    onSaved,
}) => {
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [items, setItems] = useState<EvaluationItem[]>([]);
    const [scores, setScores] = useState<Record<string, ManualScoreRow>>({});

    useEffect(() => {
        if (!isOpen) return;

        const loadData = async () => {
            setLoading(true);
            try {
                // 1. Items manuales de la evaluación
                const { data: itemsData, error: itemsErr } = await supabase
                    .from('evaluation_items')
                    .select('id, question, pedagogical_type, rubric, explanation')
                    .eq('evaluation_id', evaluationId)
                    .eq('is_manual', true)
                    .order('created_at', { ascending: true });

                if (itemsErr) throw itemsErr;
                const manualItems = (itemsData || []) as EvaluationItem[];
                setItems(manualItems);

                // 2. Scores previos ya guardados para este omr_result
                const { data: scoresData, error: scoresErr } = await supabase
                    .from('manual_scores')
                    .select('id, item_id, score_awarded, max_score, notes, student_answer')
                    .eq('omr_result_id', omrResultId);

                if (scoresErr) throw scoresErr;

                // Map by item_id para lookup rápido
                const scoresMap: Record<string, ManualScoreRow> = {};
                manualItems.forEach((item) => {
                    const prev = (scoresData || []).find((s) => s.item_id === item.id);
                    scoresMap[item.id] = prev
                        ? {
                              id: prev.id,
                              item_id: item.id,
                              score_awarded: Number(prev.score_awarded || 0),
                              max_score: Number(prev.max_score || 1),
                              notes: prev.notes || '',
                              student_answer: prev.student_answer || '',
                          }
                        : {
                              item_id: item.id,
                              score_awarded: 0,
                              max_score: 1,
                              notes: '',
                              student_answer: '',
                          };
                });
                setScores(scoresMap);
            } catch (err) {
                console.error('[ManualScoring] Error cargando:', err);
                toast.error('No se pudieron cargar los ítems de corrección manual.');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [isOpen, omrResultId, evaluationId, supabase]);

    const updateScore = (itemId: string, patch: Partial<ManualScoreRow>) => {
        setScores((prev) => ({
            ...prev,
            [itemId]: { ...prev[itemId], ...patch },
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const rowsToUpsert = Object.values(scores).map((s) => ({
                omr_result_id: omrResultId,
                evaluation_id: evaluationId,
                item_id: s.item_id,
                item_type: items.find((i) => i.id === s.item_id)?.pedagogical_type || 'desarrollo',
                student_answer: s.student_answer || null,
                score_awarded: s.score_awarded,
                max_score: s.max_score,
                notes: s.notes || null,
                corrected_at: new Date().toISOString(),
            }));

            const { error } = await supabase
                .from('manual_scores')
                .upsert(rowsToUpsert, { onConflict: 'omr_result_id,item_id' });

            if (error) throw error;

            toast.success('Correcciones guardadas. Nota final recalculada.');
            onSaved();
            onClose();
        } catch (err) {
            console.error('[ManualScoring] Error guardando:', err);
            toast.error('No se pudieron guardar las correcciones.');
        } finally {
            setSaving(false);
        }
    };

    const totalAwarded = Object.values(scores).reduce((s, x) => s + (x.score_awarded || 0), 0);
    const totalMax = Object.values(scores).reduce((s, x) => s + (x.max_score || 0), 0);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, y: 10 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.95, y: 10 }}
                        className="bg-[var(--card)] border border-[var(--border)] rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
                            <div>
                                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-500 mb-1">
                                    <FileText size={14} /> Corrección Manual
                                </div>
                                <h2 className="text-lg font-bold text-[var(--on-background)]">{studentName}</h2>
                                <p className="text-xs text-[var(--muted)] mt-0.5">
                                    {items.length} ítem{items.length === 1 ? '' : 's'} de desarrollo / respuesta breve
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-lg hover:bg-[var(--card-hover)] text-[var(--muted)] hover:text-[var(--on-background)] transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-5">
                            {loading ? (
                                <div className="flex items-center justify-center py-12 text-[var(--muted)]">
                                    <Loader2 size={20} className="animate-spin mr-2" />
                                    Cargando ítems...
                                </div>
                            ) : items.length === 0 ? (
                                <div className="text-center py-12 text-[var(--muted)]">
                                    <p>Esta evaluación no tiene ítems de corrección manual.</p>
                                    <p className="text-xs mt-2">Los ítems de tipo Desarrollo o Respuesta Breve aparecen aquí.</p>
                                </div>
                            ) : (
                                items.map((item, idx) => {
                                    const score = scores[item.id];
                                    if (!score) return null;
                                    return (
                                        <div
                                            key={item.id}
                                            className="bg-[var(--input-bg)] border border-[var(--border)] rounded-xl p-4 space-y-3"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1">
                                                    <div className="text-[10px] font-bold uppercase tracking-wider text-amber-500 mb-1">
                                                        Ítem {idx + 1} · {item.pedagogical_type === 'desarrollo' ? 'Desarrollo' : 'Respuesta Breve'}
                                                    </div>
                                                    <p className="text-sm text-[var(--foreground)] leading-relaxed">
                                                        {item.question}
                                                    </p>
                                                </div>
                                            </div>

                                            {item.rubric && (
                                                <div className="bg-amber-500/10 border border-amber-500/25 rounded-lg px-3 py-2">
                                                    <div className="text-[10px] font-bold uppercase tracking-wider text-amber-600 mb-1">Rúbrica</div>
                                                    <p className="text-xs text-[var(--muted)] leading-relaxed">{item.rubric}</p>
                                                </div>
                                            )}

                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] mb-1">
                                                        Puntaje obtenido
                                                    </label>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="number"
                                                            min={0}
                                                            step={0.5}
                                                            max={score.max_score}
                                                            value={score.score_awarded}
                                                            onChange={(e) =>
                                                                updateScore(item.id, {
                                                                    score_awarded: Math.max(0, Math.min(score.max_score, parseFloat(e.target.value) || 0)),
                                                                })
                                                            }
                                                            className="w-20 bg-[var(--card)] border border-[var(--border)] rounded-lg px-2 py-1.5 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
                                                        />
                                                        <span className="text-[var(--muted)] text-sm">/</span>
                                                        <input
                                                            type="number"
                                                            min={1}
                                                            step={0.5}
                                                            value={score.max_score}
                                                            onChange={(e) =>
                                                                updateScore(item.id, {
                                                                    max_score: Math.max(1, parseFloat(e.target.value) || 1),
                                                                })
                                                            }
                                                            className="w-20 bg-[var(--card)] border border-[var(--border)] rounded-lg px-2 py-1.5 text-sm text-[var(--muted)] focus:outline-none focus:border-[var(--primary)]"
                                                            title="Puntaje máximo"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] mb-1">
                                                        Notas (opcional)
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={score.notes}
                                                        onChange={(e) => updateScore(item.id, { notes: e.target.value })}
                                                        placeholder="Comentario corto para el alumno…"
                                                        className="w-full bg-[var(--card)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between p-5 border-t border-[var(--border)]">
                            <div className="text-sm text-[var(--muted)]">
                                Subtotal manual: <strong className="text-[var(--foreground)]">{totalAwarded}/{totalMax}</strong>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 rounded-lg border border-[var(--border)] hover:bg-[var(--card-hover)] text-[var(--foreground)] text-sm font-medium transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving || loading || items.length === 0}
                                    className="px-5 py-2 rounded-lg bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                    Guardar y recalcular nota
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
