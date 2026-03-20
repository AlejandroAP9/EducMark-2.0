'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw, Smartphone, TrendingUp, Users, CheckCircle, XCircle, AlertCircle, BookOpen, Layers, Download, ToggleLeft, ToggleRight, Ban } from 'lucide-react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { calculateGrade, applyChanceCorrection, DEFAULT_SCALE } from '@/shared/lib/gradeCalculator';

const supabase = createClient();

// Definición de tipos para los resultados
interface OMRScore {
    correct: number;
    incorrect: number;
    blank: number;
    total: number;
    percentage: number;
}

interface OMRResult {
    id: string;
    evaluation_id: string;
    student_name: string | null;
    answers: {
        tf: (string | null)[];
        mc: (string | null)[];
    };
    score: OMRScore;
    captured_at: string;
    created_at: string;
}

interface EvaluationMetadata {
    id: string;
    subject: string;
    grade: string;
    title?: string;
}

interface OMRResultsViewProps {
    onBack: () => void;
    evaluationId?: string; // Opcional, si queremos filtrar
}

export const OMRResultsView: React.FC<OMRResultsViewProps> = ({ onBack, evaluationId }) => {
    const [results, setResults] = useState<OMRResult[]>([]);
    const [evaluationsMap, setEvaluationsMap] = useState<Record<string, EvaluationMetadata>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [missingStudents, setMissingStudents] = useState<string[]>([]);
    const [chanceCorrection, setChanceCorrection] = useState(false);
    const [annulledQuestions, setAnnulledQuestions] = useState<number[]>([]);
    const [annulInput, setAnnulInput] = useState('');
    // AD-10: Institution grade scale
    const [gradeScale, setGradeScale] = useState(DEFAULT_SCALE);

    // AD-10: Load institution grade scale on mount
    useEffect(() => {
        const loadScale = async () => {
            try {
                const { data: authData } = await supabase.auth.getUser();
                if (!authData?.user) return;
                const { data: profile } = await supabase
                    .from('user_profiles')
                    .select('institution')
                    .eq('user_id', authData.user.id)
                    .maybeSingle();
                if (!profile?.institution) return;
                const { data: settings } = await supabase
                    .from('institution_settings')
                    .select('grading_scale')
                    .eq('institution', profile.institution)
                    .maybeSingle();
                if (settings?.grading_scale) {
                    const s = settings.grading_scale as { min?: number; max?: number; pass?: number; passing_percentage?: number };
                    setGradeScale({
                        minGrade: s.min ?? DEFAULT_SCALE.minGrade,
                        maxGrade: s.max ?? DEFAULT_SCALE.maxGrade,
                        passingGrade: s.pass ?? DEFAULT_SCALE.passingGrade,
                        passingPercentage: s.passing_percentage ?? DEFAULT_SCALE.passingPercentage,
                    });
                }
            } catch (err) {
                console.error('Error loading grade scale:', err);
            }
        };
        loadScale();
    }, []);

    const fetchResults = async () => {
        setLoading(true);
        setError(null);
        try {
            // 1. Fetch OMR Results directly from Supabase
            let query = supabase.from('omr_results').select('*').order('captured_at', { ascending: false });
            if (evaluationId) {
                query = query.eq('evaluation_id', evaluationId);
            }

            const { data, error: queryError } = await query;
            if (queryError) throw queryError;

            setResults(data || []);

            // 2. Fetch Metadata from Supabase for all unique evaluation_ids
            const uniqueEvalIds = Array.from(new Set((data || []).map(r => r.evaluation_id)));
            if (uniqueEvalIds.length > 0) {
                const { data: evals, error: evalError } = await supabase
                    .from('evaluations')
                    .select('id, subject, grade, title')
                    .in('id', uniqueEvalIds);

                if (evalError) console.error('Error fetching metadata:', evalError);

                if (evals) {
                    const map: Record<string, EvaluationMetadata> = {};
                    evals.forEach(e => {
                        map[e.id] = e;
                    });
                    setEvaluationsMap(map);

                    // Check for missing students
                    if (evaluationId && data && data.length > 0) {
                        const evalMeta = map[evaluationId] || evals.find((e: EvaluationMetadata) => e.id === evaluationId);
                        if (evalMeta?.grade) {
                            const { data: allStudents } = await supabase
                                .from('students')
                                .select('first_name, last_name')
                                .eq('course_grade', evalMeta.grade);

                            if (allStudents && allStudents.length > 0) {
                                const scannedNames = new Set(data.map((r: OMRResult) => (r.student_name || '').toLowerCase().trim()));
                                const missing = allStudents
                                    .filter((s: { first_name: string; last_name: string }) =>
                                        !scannedNames.has(`${s.first_name} ${s.last_name}`.toLowerCase().trim()) &&
                                        !scannedNames.has(`${s.last_name} ${s.first_name}`.toLowerCase().trim())
                                    )
                                    .map((s: { first_name: string; last_name: string }) => `${s.first_name} ${s.last_name}`);
                                setMissingStudents(missing);
                            } else {
                                setMissingStudents([]);
                            }
                        }
                    }
                }
            }
        } catch (err) {
            console.error(err);
            setError('No se pudieron cargar los datos.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchResults();
    }, [evaluationId]);

    const getAdjustedScore = (result: OMRResult) => {
        let correct = result.score.correct;
        const incorrect = result.score.incorrect;
        const total = result.score.total;

        if (chanceCorrection) {
            correct = applyChanceCorrection(correct, incorrect, 4);
        }

        const adjustedTotal = annulledQuestions.length > 0
            ? Math.max(1, total - annulledQuestions.length)
            : total;
        const adjustedCorrect = Math.min(correct, adjustedTotal);

        return {
            correct: adjustedCorrect,
            total: adjustedTotal,
            percentage: adjustedTotal > 0 ? Math.round((adjustedCorrect / adjustedTotal) * 100) : 0,
            grade: calculateGrade(adjustedCorrect, adjustedTotal, gradeScale),
        };
    };

    const handleAnnulQuestion = () => {
        const num = parseInt(annulInput, 10);
        if (isNaN(num) || num < 1) return;
        const idx = num - 1;
        if (!annulledQuestions.includes(idx)) {
            setAnnulledQuestions(prev => [...prev, idx]);
        }
        setAnnulInput('');
    };

    // Grouping Logic
    const groupedResults = React.useMemo(() => {
        const groups: Record<string, OMRResult[]> = {};

        results.forEach(result => {
            const metadata = evaluationsMap[result.evaluation_id];
            const key = metadata
                ? `${metadata.grade} - ${metadata.subject}`
                : `Evaluación Desconocida (${result.evaluation_id.slice(0, 6)}...)`;

            if (!groups[key]) groups[key] = [];
            groups[key].push(result);
        });

        return groups;
    }, [results, evaluationsMap]);

    // Global Stats
    const totalStudents = results.length;
    const averageScore = totalStudents > 0
        ? Math.round(results.reduce((acc, curr) => acc + curr.score.percentage, 0) / totalStudents)
        : 0;
    const passRate = totalStudents > 0
        ? Math.round((results.filter(r => r.score.percentage >= 60).length / totalStudents) * 100)
        : 0;
    const topScore = totalStudents > 0
        ? Math.max(...results.map(r => r.score.percentage))
        : 0;

    const exportResults = (format: 'csv' | 'xls') => {
        if (results.length === 0) {
            return;
        }

        const separator = format === 'csv' ? ',' : '\t';
        const header = [
            'evaluation_id',
            'evaluation_title',
            'subject',
            'grade',
            'student_name',
            'captured_at',
            'correct',
            'incorrect',
            'blank',
            'total',
            'percentage'
        ];

        const rows = results.map((result) => {
            const metadata = evaluationsMap[result.evaluation_id];
            return [
                result.evaluation_id,
                metadata?.title || '',
                metadata?.subject || '',
                metadata?.grade || '',
                result.student_name || '',
                result.captured_at,
                String(result.score.correct),
                String(result.score.incorrect),
                String(result.score.blank),
                String(result.score.total),
                String(result.score.percentage),
            ];
        });

        const content = [
            header.join(separator),
            ...rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(separator)),
        ].join('\n');

        const blob = new Blob([content], { type: format === 'csv' ? 'text/csv;charset=utf-8;' : 'application/vnd.ms-excel;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `omr_results_${new Date().toISOString().slice(0, 10)}.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="min-h-screen bg-[var(--background)] animate-fade-in relative">
            <div className="max-w-[1400px] mx-auto p-6 space-y-8">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className="p-2 text-[var(--muted)] hover:text-[var(--on-background)] hover:bg-[var(--card-hover)] rounded-lg transition-all"
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold text-[var(--on-background)]">Resultados OMR</h1>
                            <p className="text-[var(--muted)] mt-1">
                                {evaluationId ? `Evaluación: ${evaluationId}` : 'Visualizando todos los escaneos recientes'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => exportResults('csv')}
                            disabled={results.length === 0}
                            className="px-3 py-2 rounded-lg border border-[var(--border)] text-[var(--muted)] hover:text-[var(--on-background)] disabled:opacity-50 flex items-center gap-2"
                        >
                            <Download size={16} />
                            CSV
                        </button>
                        <button
                            onClick={() => exportResults('xls')}
                            disabled={results.length === 0}
                            className="px-3 py-2 rounded-lg border border-[var(--border)] text-[var(--muted)] hover:text-[var(--on-background)] disabled:opacity-50 flex items-center gap-2"
                        >
                            <Download size={16} />
                            XLS
                        </button>
                        <button
                            onClick={fetchResults}
                            className="btn-gradient px-4 py-2 rounded-lg flex items-center gap-2 text-white shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
                        >
                            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                            <span>Actualizar</span>
                        </button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <StatCard
                        title="Total Escaneados"
                        value={totalStudents.toString()}
                        icon={<Users className="text-blue-400" size={24} />}
                        trend={totalStudents > 0 ? "+Reciente" : "Sin datos"}
                        trendColor="text-blue-400"
                    />
                    <StatCard
                        title="Promedio Curso"
                        value={`${averageScore}%`}
                        icon={<TrendingUp className="text-emerald-400" size={24} />}
                        trend={averageScore >= 60 ? "Aprobado" : "Reprobado"}
                        trendColor={averageScore >= 60 ? "text-emerald-400" : "text-red-400"}
                    />
                    <StatCard
                        title="Tasa Aprobación"
                        value={`${passRate}%`}
                        icon={<CheckCircle className="text-indigo-400" size={24} />}
                        trend="Meta: 85%"
                        trendColor="text-indigo-400"
                    />
                    <StatCard
                        title="Puntaje Máximo"
                        value={`${topScore}%`}
                        icon={<Smartphone className="text-purple-400" size={24} />}
                        trend="Excelente"
                        trendColor="text-purple-400"
                    />
                </div>

                {/* Missing Students Alert */}
                {missingStudents.length > 0 && (
                    <div className="glass-card-premium p-4 border-l-4 border-amber-500 bg-amber-500/5">
                        <div className="flex items-start gap-3">
                            <AlertCircle size={20} className="text-amber-400 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-semibold text-amber-400">
                                    {missingStudents.length} alumno(s) sin escanear
                                </p>
                                <p className="text-xs text-[var(--muted)] mt-1">
                                    {missingStudents.slice(0, 5).join(', ')}{missingStudents.length > 5 ? ` y ${missingStudents.length - 5} más...` : ''}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* OM-18: Chance Correction & OM-19: Question Annulment */}
                <div className="glass-card-premium p-4 flex flex-wrap items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                        <button
                            onClick={() => setChanceCorrection(!chanceCorrection)}
                            className="text-[var(--muted)] hover:text-[var(--on-background)] transition-colors"
                        >
                            {chanceCorrection ? <ToggleRight size={24} className="text-[var(--primary)]" /> : <ToggleLeft size={24} />}
                        </button>
                        <span className="text-sm text-[var(--on-background)] font-medium">Descuento por azar</span>
                    </label>

                    <div className="flex items-center gap-2">
                        <Ban size={16} className="text-[var(--muted)]" />
                        <span className="text-sm text-[var(--on-background)] font-medium">Anular pregunta:</span>
                        <input
                            type="number"
                            min={1}
                            value={annulInput}
                            onChange={(e) => setAnnulInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAnnulQuestion()}
                            placeholder="N°"
                            className="w-16 px-2 py-1 bg-[var(--input-bg)] border border-[var(--border)] rounded-lg text-sm text-center"
                        />
                        <button
                            onClick={handleAnnulQuestion}
                            className="px-2 py-1 text-xs font-semibold bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20 rounded-lg hover:bg-[var(--primary)]/20 transition-colors"
                        >
                            Anular
                        </button>
                        {annulledQuestions.length > 0 && (
                            <div className="flex items-center gap-1 ml-2">
                                {annulledQuestions.sort((a, b) => a - b).map((q) => (
                                    <span
                                        key={q}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-red-500/10 text-red-400 border border-red-500/20 cursor-pointer hover:bg-red-500/20"
                                        onClick={() => setAnnulledQuestions(prev => prev.filter(x => x !== q))}
                                        title="Click para restaurar"
                                    >
                                        P{q + 1} &times;
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Content - Groups */}
                <div className="space-y-8">
                    {loading && results.length === 0 ? (
                        <div className="p-12 flex justify-center items-center">
                            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : error ? (
                        <div className="glass-card-premium p-12 flex flex-col justify-center items-center text-center">
                            <AlertCircle size={48} className="text-red-400 mb-4" />
                            <p className="text-[var(--on-background)] font-medium mb-2">Error de conexión</p>
                            <p className="text-[var(--muted)] max-w-sm">{error}</p>
                        </div>
                    ) : Object.keys(groupedResults).length === 0 ? (
                        <div className="glass-card-premium p-12 flex flex-col justify-center items-center text-center">
                            <div className="bg-[var(--primary)]/10 p-4 rounded-full mb-4">
                                <Smartphone size={32} className="text-[var(--primary)]" />
                            </div>
                            <h3 className="text-lg font-semibold text-[var(--on-background)] mb-2">Aún no hay resultados</h3>
                            <p className="text-[var(--muted)] max-w-md mb-6">
                                Descarga la App Móvil de EducMark y escanea las hojas de respuesta generadas para ver los resultados aquí en tiempo real.
                            </p>
                        </div>
                    ) : (
                        Object.entries(groupedResults).map(([groupKey, groupResults]) => (
                            <section key={groupKey} className="glass-card-premium overflow-hidden">
                                {/* Group Header */}
                                <div className="p-6 border-b border-[var(--border)] bg-[var(--card)]/50 backdrop-blur-sm flex items-center gap-3">
                                    <div className="p-2 bg-indigo-500/10 rounded-lg">
                                        <BookOpen size={20} className="text-indigo-400" />
                                    </div>
                                    <h2 className="text-xl font-bold text-[var(--on-background)]">{groupKey}</h2>
                                    <span className="ml-auto text-sm bg-[var(--border)] text-[var(--muted)] px-3 py-1 rounded-full">
                                        {groupResults.length} Estudiantes
                                    </span>
                                </div>

                                {/* Table */}
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-[var(--card)]/80 border-b border-[var(--border)]">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Estudiante</th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Fecha Escaneo</th>
                                                <th className="px-6 py-4 text-center text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Correctas</th>
                                                <th className="px-6 py-4 text-center text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Incorrectas</th>
                                                <th className="px-6 py-4 text-center text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Nota (%)</th>
                                                <th className="px-6 py-4 text-center text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Nota (1-7)</th>
                                                <th className="px-6 py-4 text-center text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Estado</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[var(--border)]">
                                            {groupResults.map((result) => {
                                                const adj = getAdjustedScore(result);
                                                return (
                                                <tr key={result.id} className="hover:bg-[var(--hover-bg)] transition-colors group">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs mr-3 shadow-md">
                                                                {result.student_name ? result.student_name.charAt(0).toUpperCase() : '?'}
                                                            </div>
                                                            <div className="text-sm font-medium text-[var(--on-background)] group-hover:text-white transition-colors">
                                                                {result.student_name || 'Estudiante sin nombre'}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--muted)]">
                                                        {new Date(result.captured_at).toLocaleString('es-CL')}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                            {adj.correct}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                                                            {result.score.incorrect}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                        <span className={`text-sm font-bold ${adj.percentage >= 60 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                            {adj.percentage}%
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                        <span className={`text-sm font-black ${adj.grade >= 4.0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                            {adj.grade.toFixed(1)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                        {adj.grade >= 4.0 ? (
                                                            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
                                                                <CheckCircle size={12} /> Aprobado
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 text-xs font-medium text-red-400 bg-red-500/10 px-2 py-1 rounded-md border border-red-500/20">
                                                                <XCircle size={12} /> Reprobado
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

const StatCard: React.FC<{
    title: string;
    value: string;
    icon: React.ReactNode;
    trend?: string;
    trendColor?: string;
}> = ({ title, value, icon, trend, trendColor = "text-[var(--muted)]" }) => (
    <div className="glass-card-premium p-6 flex items-start justify-between hover:translate-y-[-2px] transition-transform duration-300">
        <div>
            <p className="text-sm font-medium text-[var(--muted)] mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-[var(--on-background)]">{value}</h3>
            {trend && <p className={`text-xs mt-2 font-medium ${trendColor}`}>{trend}</p>}
        </div>
        <div className="p-3 bg-[var(--card)] rounded-xl border border-[var(--border)]">
            {icon}
        </div>
    </div>
);
