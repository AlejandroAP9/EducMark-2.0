'use client';

import React, { useState, useEffect } from 'react';
import { BrainCircuit, Sparkles, AlertTriangle, Lightbulb, MessageCircleHeart, ArrowRight, RefreshCw, Target, Clock, Zap, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { assessmentFetch } from '@/shared/lib/apiConfig';

// ── Types ──

interface Diagnostic {
    question: number;
    oa: string;
    topic: string;
    error_rate: number;
    diagnosis: string;
    root_cause: string;
}

interface Suggestion {
    priority: string;
    oa: string;
    activity: string;
    duration: string;
    description: string;
}

interface TopError {
    question_number: number;
    question_type: string;
    oa: string;
    topic: string;
    skill: string;
    error_rate: number;
    correct_answer: string | null;
    most_common_wrong: string | null;
}

interface ClassInsightsData {
    success: boolean;
    evaluation: {
        title: string;
        grade: string;
        subject: string;
    };
    analysis: {
        top_errors: TopError[];
        oa_gaps: { oa: string; topic: string; percentage: number; question_count: number }[];
        stats: { total_students: number; average_percentage: number; pass_count: number; pass_rate: number };
    };
    action_plan: {
        diagnostics: Diagnostic[];
        suggestions: Suggestion[];
        student_feedback: string;
        summary: string;
    };
}

// ── Component ──

interface ClassInsightsProps {
    evaluationId: string | null;
}

import { getAssessmentApiUrl } from '@/shared/lib/apiConfig';

const API_BASE_URL = getAssessmentApiUrl();

export const ClassInsights: React.FC<ClassInsightsProps> = ({ evaluationId }) => {
    const [data, setData] = useState<ClassInsightsData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expandedDiag, setExpandedDiag] = useState<number | null>(0);
    const [showStudentFeedback, setShowStudentFeedback] = useState(false);

    const fetchInsights = async () => {
        if (!evaluationId) return;

        setLoading(true);
        setError(null);

        try {
            const res = await assessmentFetch(`${API_BASE_URL}/api/v1/feedback/class-insights/${evaluationId}`);
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.detail || `Error ${res.status}`);
            }
            const result = await res.json();
            setData(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al obtener insights');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (evaluationId) {
            // Reset state when evaluation changes
            setData(null);
            setError(null);
        }
    }, [evaluationId]);

    if (!evaluationId) return null;

    // ── Not loaded yet: Show beautiful CTA ──
    if (!data && !loading && !error) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="glass-card-premium p-8 relative overflow-hidden group"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-cyan-500/5 group-hover:from-purple-500/10 group-hover:to-cyan-500/10 transition-all duration-500" />

                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                    <BrainCircuit size={140} />
                </div>

                <div className="relative z-10 text-center max-w-lg mx-auto">
                    <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center border border-purple-500/20">
                        <BrainCircuit size={28} className="text-purple-400" />
                    </div>

                    <h3 className="text-xl font-bold text-[var(--on-background)] mb-2">
                        Insights de Clase
                    </h3>
                    <p className="text-[var(--muted)] text-sm mb-6 leading-relaxed">
                        Analiza los patrones de error, cruza con los Objetivos de Aprendizaje
                        y genera un plan de acción pedagógico personalizado.
                    </p>

                    <button
                        onClick={fetchInsights}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 text-white rounded-xl font-semibold text-sm shadow-lg hover:shadow-purple-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <Sparkles size={16} />
                        Generar Análisis Inteligente
                        <ArrowRight size={16} />
                    </button>
                </div>
            </motion.div>
        );
    }

    // ── Loading state ──
    if (loading) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-card-premium p-12 relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-cyan-500/5 animate-pulse" />
                <div className="relative z-10 text-center">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="inline-block mb-4"
                    >
                        <Loader2 size={40} className="text-purple-400" />
                    </motion.div>
                    <h3 className="text-lg font-bold text-[var(--on-background)] mb-2">Analizando patrones de error…</h3>
                    <p className="text-[var(--muted)] text-sm">
                        Analizando respuestas y generando recomendaciones pedagógicas...
                    </p>
                </div>
            </motion.div>
        );
    }

    // ── Error state ──
    if (error) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-card-premium p-8 border-l-4 border-red-500"
            >
                <div className="flex items-start gap-3">
                    <AlertTriangle className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
                    <div>
                        <h4 className="font-bold text-[var(--on-background)] mb-1">Error al generar insights</h4>
                        <p className="text-[var(--muted)] text-sm">{error}</p>
                        <button
                            onClick={fetchInsights}
                            className="mt-3 text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1"
                        >
                            <RefreshCw size={14} /> Reintentar
                        </button>
                    </div>
                </div>
            </motion.div>
        );
    }

    if (!data) return null;

    const { analysis, action_plan } = data;
    const { diagnostics, suggestions, student_feedback, summary } = action_plan;
    const { top_errors, stats } = analysis;

    // ── Rendered insights ──
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
        >
            {/* ── Header Card ── */}
            <div className="glass-card-premium p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-cyan-500/5" />
                <div className="absolute top-0 right-0 p-4 opacity-5"><BrainCircuit size={100} /></div>

                <div className="relative z-10 flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                                <Sparkles size={16} className="text-white" />
                            </div>
                            <h3 className="text-lg font-bold text-[var(--on-background)]">
                                Insights de Clase
                            </h3>
                        </div>
                        <p className="text-[var(--muted)] text-sm leading-relaxed max-w-xl">
                            {summary || 'Análisis completado.'}
                        </p>
                    </div>
                    <button
                        onClick={fetchInsights}
                        className="p-2 rounded-lg hover:bg-[var(--card-hover)] transition-colors group"
                        title="Regenerar análisis"
                    >
                        <RefreshCw size={16} className="text-[var(--muted)] group-hover:text-purple-400 transition-colors" />
                    </button>
                </div>
            </div>

            {/* ── Top Error Heatmap ── */}
            {top_errors.length > 0 && (
                <div className="glass-card-premium p-6">
                    <h4 className="text-sm font-bold text-[var(--on-background)] mb-4 flex items-center gap-2">
                        <Target size={16} className="text-red-400" />
                        Preguntas con Mayor Error
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                        {top_errors.map((err, idx) => {
                            const intensity = Math.min(err.error_rate / 100, 1);
                            const bg = intensity > 0.6
                                ? 'bg-red-500/15 border-red-500/30'
                                : intensity > 0.4
                                    ? 'bg-amber-500/15 border-amber-500/30'
                                    : 'bg-[var(--card)] border-[var(--border)]';

                            return (
                                <motion.div
                                    key={err.question_number}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className={`p-3 rounded-xl border ${bg} text-center`}
                                >
                                    <div className="text-xs text-[var(--muted)] font-medium mb-1">
                                        {err.question_type.toUpperCase()} #{err.question_number}
                                    </div>
                                    <div className={`text-2xl font-black ${err.error_rate > 60 ? 'text-red-400' : err.error_rate > 40 ? 'text-amber-400' : 'text-[var(--foreground)]'}`}>
                                        {err.error_rate}%
                                    </div>
                                    <div className="text-[10px] text-[var(--muted)] mt-1 truncate">{err.topic}</div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* ── Diagnósticos ── */}
                <div className="glass-card-premium p-6">
                    <h4 className="text-sm font-bold text-[var(--on-background)] mb-4 flex items-center gap-2">
                        <AlertTriangle size={16} className="text-amber-400" />
                        Diagnósticos
                    </h4>

                    {diagnostics.length === 0 ? (
                        <p className="text-sm text-[var(--muted)]">No se generaron diagnósticos. Prueba con más datos.</p>
                    ) : (
                        <div className="space-y-3">
                            {diagnostics.map((diag, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="bg-[var(--card)]/50 rounded-xl border border-[var(--border)] overflow-hidden"
                                >
                                    <button
                                        onClick={() => setExpandedDiag(expandedDiag === idx ? null : idx)}
                                        className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--card-hover)] transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-black text-sm ${diag.error_rate > 60 ? 'bg-red-500' : 'bg-amber-500'}`}>
                                                P{diag.question}
                                            </div>
                                            <div>
                                                <span className="text-sm font-semibold text-[var(--on-background)]">{diag.oa}</span>
                                                <span className="text-xs text-[var(--muted)] block">{diag.topic} · {diag.error_rate}% error</span>
                                            </div>
                                        </div>
                                        {expandedDiag === idx ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </button>

                                    <AnimatePresence>
                                        {expandedDiag === idx && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="px-4 pb-4 space-y-2">
                                                    <p className="text-sm text-[var(--foreground)] leading-relaxed">{diag.diagnosis}</p>
                                                    {diag.root_cause && (
                                                        <p className="text-xs text-[var(--muted)] italic border-l-2 border-amber-500/30 pl-3">
                                                            💡 Causa raíz: {diag.root_cause}
                                                        </p>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Sugerencias de Actividades ── */}
                <div className="glass-card-premium p-6">
                    <h4 className="text-sm font-bold text-[var(--on-background)] mb-4 flex items-center gap-2">
                        <Lightbulb size={16} className="text-green-400" />
                        Plan de Acción
                    </h4>

                    {suggestions.length === 0 ? (
                        <p className="text-sm text-[var(--muted)]">No se generaron sugerencias.</p>
                    ) : (
                        <div className="space-y-3">
                            {suggestions.map((sug, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="bg-[var(--card)]/50 p-4 rounded-xl border border-[var(--border)]"
                                >
                                    <div className="flex items-start justify-between gap-3 mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${sug.priority === 'alta'
                                                ? 'bg-red-500/15 text-red-400 border border-red-500/20'
                                                : sug.priority === 'media'
                                                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                                                    : 'bg-green-500/15 text-green-400 border border-green-500/20'
                                                }`}>
                                                <Zap size={8} className="mr-1" />
                                                {sug.priority}
                                            </span>
                                            <span className="text-[10px] text-[var(--muted)]">{sug.oa}</span>
                                        </div>
                                        {sug.duration && (
                                            <span className="flex items-center gap-1 text-[10px] text-[var(--muted)] flex-shrink-0">
                                                <Clock size={10} />
                                                {sug.duration}
                                            </span>
                                        )}
                                    </div>

                                    <h5 className="text-sm font-bold text-[var(--on-background)] mb-1">{sug.activity}</h5>
                                    <p className="text-xs text-[var(--foreground)] leading-relaxed">{sug.description}</p>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Feedback del Alumno ── */}
            {student_feedback && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="glass-card-premium p-6 relative overflow-hidden group"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-green-500/5 group-hover:from-cyan-500/10 group-hover:to-green-500/10 transition-all duration-500" />

                    <div className="relative z-10">
                        <button
                            onClick={() => setShowStudentFeedback(!showStudentFeedback)}
                            className="w-full flex items-center justify-between"
                        >
                            <h4 className="text-sm font-bold text-[var(--on-background)] flex items-center gap-2">
                                <MessageCircleHeart size={16} className="text-cyan-400" />
                                Feedback para el Alumno
                                <span className="text-[10px] text-[var(--muted)] font-normal ml-2">
                                    (copiar y compartir)
                                </span>
                            </h4>
                            {showStudentFeedback ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>

                        <AnimatePresence>
                            {showStudentFeedback && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="mt-4 p-4 rounded-xl bg-[var(--card)]/50 border border-cyan-500/20">
                                        <p className="text-sm text-[var(--foreground)] leading-relaxed whitespace-pre-line">
                                            {student_feedback}
                                        </p>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(student_feedback);
                                            }}
                                            className="mt-3 text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                                        >
                                            📋 Copiar al portapapeles
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
};
