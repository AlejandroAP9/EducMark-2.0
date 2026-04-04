'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
    RotateCcw, CheckCircle2, XCircle, Eye, AlertTriangle, BrainCircuit
} from 'lucide-react';
import type { OMRScanResult, CorrectAnswers } from '../../../types/omrScanner';
import type { QRData } from '../../AnswerSheet/QRCodeGenerator';
import { CoverageSummary } from '../CoverageSummary';

export interface ResultPhaseProps {
    result: OMRScanResult;
    manualAnswers: { tf: (string | null)[]; mc: (string | null)[] } | null;
    manualScore: NonNullable<OMRScanResult['data']>['score'] | null;
    correctAnswers: CorrectAnswers;
    savedResultId: string | null;
    savedAsDuplicate: boolean;
    qrPayload: QRData | null;
    selectedEvaluationId: string;
    retake: () => void;
    onBack: () => void;
    onOpenFeedback?: (evaluationId: string) => void;
    applyManualOverride: (section: 'tf' | 'mc', questionIndex: number, value: string | null) => void;
}

export const ResultPhase: React.FC<ResultPhaseProps> = ({
    result, manualAnswers, manualScore, correctAnswers,
    savedResultId, savedAsDuplicate, qrPayload, selectedEvaluationId,
    retake, onBack, onOpenFeedback, applyManualOverride,
}) => {
    if (!result?.data) return null;
    const { score, answers, name_image } = result.data;
    const lowConfidenceItems = result.data.low_confidence_items || [];
    const displayedAnswers = manualAnswers || answers;
    const displayedScore = manualScore || score;
    const passed = displayedScore.percentage >= 60;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto space-y-8"
        >
            {/* Score Hero */}
            <div className={`glass-card-premium p-8 relative overflow-hidden text-center ${passed ? 'border-emerald-500/20' : 'border-rose-500/20'
                }`} style={{ borderWidth: '1px', borderStyle: 'solid' }}>
                <div className={`absolute inset-0 ${passed ? 'bg-emerald-500/3' : 'bg-rose-500/3'}`}></div>
                <div className="relative z-10">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                        className="inline-block mb-4"
                    >
                        {passed
                            ? <CheckCircle2 size={56} className="text-emerald-400" />
                            : <XCircle size={56} className="text-rose-400" />
                        }
                    </motion.div>

                    <motion.h2
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className={`text-6xl font-black mb-2 ${passed ? 'text-emerald-400' : 'text-rose-400'}`}
                    >
                        {displayedScore.percentage}%
                    </motion.h2>
                    <p className="text-[var(--muted)] text-lg">
                        {displayedScore.correct} correctas de {displayedScore.total} preguntas
                    </p>
                    {(savedAsDuplicate || savedResultId) && (
                        <div className="mt-3 text-xs">
                            {savedAsDuplicate ? (
                                <span className="px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300">
                                    Resultado actualizado (rescaneo sobreescribio intento previo)
                                </span>
                            ) : (
                                <span className="px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-300">
                                    Resultado guardado en la nube
                                </span>
                            )}
                        </div>
                    )}

                    {name_image && (
                        <div className="mt-4 inline-block">
                            <p className="text-xs text-[var(--muted)] mb-1">Nombre detectado</p>
                            <img
                                src={`data:image/jpeg;base64,${name_image}`}
                                alt="Nombre del alumno"
                                className="max-h-10 rounded border border-[var(--border)] bg-white"
                            />
                        </div>
                    )}
                    {qrPayload && (
                        <div className="mt-3 p-2.5 rounded-lg border border-cyan-500/25 bg-cyan-500/10 inline-block">
                            <p className="text-xs text-cyan-200/85">
                                QR detectado: {qrPayload.subject} · {qrPayload.grade} · eval {qrPayload.id}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Score Breakdown */}
            <div className="grid grid-cols-3 gap-4">
                <div className="glass-card-premium p-6 text-center">
                    <p className="text-3xl font-bold text-emerald-400">{displayedScore.correct}</p>
                    <p className="text-sm text-[var(--muted)] mt-1">Correctas</p>
                </div>
                <div className="glass-card-premium p-6 text-center">
                    <p className="text-3xl font-bold text-rose-400">{displayedScore.incorrect}</p>
                    <p className="text-sm text-[var(--muted)] mt-1">Incorrectas</p>
                </div>
                <div className="glass-card-premium p-6 text-center">
                    <p className="text-3xl font-bold text-amber-400">{displayedScore.blank}</p>
                    <p className="text-sm text-[var(--muted)] mt-1">En Blanco</p>
                </div>
            </div>

            {/* Manual review panel */}
            {lowConfidenceItems.length > 0 && (
                <div className="glass-card-premium p-6 border border-amber-500/25">
                    <h3 className="text-lg font-bold text-amber-300 mb-2 flex items-center gap-2">
                        <AlertTriangle size={18} />
                        Marcas Dudosas ({lowConfidenceItems.length})
                    </h3>
                    <p className="text-sm text-[var(--muted)] mb-4">
                        Revisa y corrige estas preguntas. Cada cambio actualiza el puntaje y se guarda en el resultado.
                    </p>
                    <div className="space-y-3">
                        {lowConfidenceItems.map((item) => {
                            const answerList = item.section === 'tf' ? displayedAnswers.tf : displayedAnswers.mc;
                            const currentValue = answerList[item.question_index - 1] ?? '';
                            const options = item.section === 'tf' ? ['V', 'F'] : ['A', 'B', 'C', 'D', 'E'];
                            return (
                                <div key={`${item.section}-${item.question_index}`} className="p-3 rounded-xl border border-[var(--border)] bg-[var(--input-bg)]">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div>
                                            <p className="text-sm font-semibold text-[var(--on-background)]">
                                                {item.section.toUpperCase()} #{item.question_index}
                                            </p>
                                            <p className="text-xs text-[var(--muted)]">
                                                Detectada: {item.detected ?? 'En blanco'} · Confianza: {Math.round((item.confidence || 0) * 100)}% · Dominancia: {item.dominance ?? 0} · Fill: {Math.round((item.fill_ratio || 0) * 100)}%
                                            </p>
                                        </div>
                                        <select
                                            value={currentValue}
                                            onChange={(e) => applyManualOverride(item.section, item.question_index, e.target.value || null)}
                                            className="px-3 py-2 rounded-lg bg-[var(--card)] border border-[var(--border)] text-sm"
                                        >
                                            <option value="">En blanco</option>
                                            {options.map((opt) => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Detected Answers */}
            <div className="glass-card-premium p-8">
                <h3 className="text-xl font-bold text-[var(--on-background)] mb-6 flex items-center gap-2">
                    <Eye size={20} className="text-cyan-400" />
                    Respuestas Detectadas
                </h3>

                {answers.tf.length > 0 && (
                    <div className="mb-6">
                        <h4 className="text-sm font-semibold text-[var(--muted)] mb-3 uppercase tracking-wider">
                            Verdadero / Falso
                        </h4>
                        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                            {displayedAnswers.tf.map((ans, i) => {
                                const isCorrect = correctAnswers.tf[i] === ans;
                                const isBlank = ans === null;
                                return (
                                    <div
                                        key={`result-tf-${i}`}
                                        className={`p-2 text-center rounded-lg border text-sm font-bold ${isBlank
                                            ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                            : isCorrect
                                                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                                                : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                                            }`}
                                    >
                                        <span className="text-[10px] text-[var(--muted)] block">{i + 1}</span>
                                        {isBlank ? '—' : ans}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {answers.mc.length > 0 && (
                    <div>
                        <h4 className="text-sm font-semibold text-[var(--muted)] mb-3 uppercase tracking-wider">
                            Seleccion Multiple
                        </h4>
                        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                            {displayedAnswers.mc.map((ans, i) => {
                                const isCorrect = correctAnswers.mc[i] === ans;
                                const isBlank = ans === null;
                                return (
                                    <div
                                        key={`result-mc-${i}`}
                                        className={`p-2 text-center rounded-lg border text-sm font-bold ${isBlank
                                            ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                            : isCorrect
                                                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                                                : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                                            }`}
                                    >
                                        <span className="text-[10px] text-[var(--muted)] block">{i + 1}</span>
                                        {isBlank ? '—' : ans}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4">
                <button
                    onClick={retake}
                    className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-[var(--input-bg)] border border-[var(--border)] text-[var(--on-background)] font-semibold hover:border-[var(--primary)] transition-colors"
                >
                    <RotateCcw size={18} />
                    Escanear Otro
                </button>
                <button
                    onClick={onBack}
                    className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-[var(--input-bg)] border border-[var(--border)] text-[var(--on-background)] font-semibold hover:border-[var(--primary)] transition-colors"
                >
                    <CheckCircle2 size={18} />
                    Finalizar
                </button>
            </div>
            {onOpenFeedback && savedResultId && (
                <button
                    onClick={() => onOpenFeedback(selectedEvaluationId)}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold shadow-lg hover:opacity-90 transition-opacity"
                >
                    <BrainCircuit size={18} />
                    Ver Retroalimentacion Docente
                </button>
            )}

            {/* E3: Coverage Summary */}
            <CoverageSummary evaluationId={selectedEvaluationId} />
        </motion.div>
    );
};
