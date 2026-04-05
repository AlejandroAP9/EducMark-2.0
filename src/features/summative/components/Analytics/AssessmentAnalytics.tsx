'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, RefreshCw, TrendingUp, Users, Target, BarChart3, AlertTriangle, CheckCircle2, Award, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { generateStudentReport } from '@/shared/lib/generateReport';
import { useInstitutionBranding } from '@/shared/hooks/useInstitutionBranding';
import { getAssessmentApiUrl, assessmentFetch } from '@/shared/lib/apiConfig';

const API_BASE_URL = getAssessmentApiUrl();
import { toast } from 'sonner';
import { ItemAnalysisView } from './ItemAnalysisView';
import { analyzeItems, type ItemStats } from '@/shared/lib/itemAnalysis';

const supabase = createClient();

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
    student_id?: string | null;
    answers: {
        tf: (string | null)[];
        mc: (string | null)[];
    };
    score: OMRScore;
    captured_at: string;
    created_at: string;
}

interface CorrectAnswers {
    tf: string[];
    mc: string[];
}

interface BlueprintKeyRow {
    question_number: number;
    question_type: string;
    oa?: string | null;
    topic?: string | null;
    correct_answer: string | null;
}

interface EvaluationMetaRow {
    id: string;
    title: string;
    subject: string | null;
    grade: string | null;
    created_at: string;
    user_id: string;
}

interface StudentOption {
    key: string;
    studentName: string;
    studentId: string | null;
}

interface StudentTrajectoryPoint {
    evaluationId: string;
    evaluationTitle: string;
    date: string;
    percentage: number;
}

interface StudentQuestionReviewRow {
    questionNumber: number;
    questionType: 'tf' | 'mc';
    oa: string;
    topic: string;
    studentAnswer: string | null;
    correctAnswer: string | null;
    status: 'correct' | 'incorrect' | 'blank';
}

interface AssessmentAnalyticsProps {
    onBack: () => void;
    evaluationId?: string;
}

function getDistribution(results: OMRResult[]) {
    const buckets = [
        { label: '0-20%', min: 0, max: 20, count: 0, color: '#ef4444' },
        { label: '21-40%', min: 21, max: 40, count: 0, color: '#f97316' },
        { label: '41-60%', min: 41, max: 60, count: 0, color: '#eab308' },
        { label: '61-80%', min: 61, max: 80, count: 0, color: '#22c55e' },
        { label: '81-100%', min: 81, max: 100, count: 0, color: '#06b6d4' },
    ];
    results.forEach(r => {
        const pct = r.score.percentage;
        const bucket = buckets.find(b => pct >= b.min && pct <= b.max);
        if (bucket) bucket.count++;
    });
    return buckets;
}

function getQuestionDifficulty(results: OMRResult[], correctAnswers: CorrectAnswers) {
    if (results.length === 0) return [];
    if (correctAnswers.tf.length === 0 && correctAnswers.mc.length === 0) return [];

    const firstResult = results[0];
    const mcCount = firstResult.answers.mc?.length || 0;
    const tfCount = firstResult.answers.tf?.length || 0;

    const questions: { index: number; type: string; correctRate: number; label: string }[] = [];

    for (let i = 0; i < tfCount; i++) {
        const key = correctAnswers.tf[i];
        const answeredCorrectly = results.filter(r => !!r.answers.tf?.[i] && !!key && r.answers.tf[i] === key).length;
        questions.push({
            index: i,
            type: 'V/F',
            correctRate: results.length > 0 ? Math.round((answeredCorrectly / results.length) * 100) : 0,
            label: `V/F ${i + 1}`,
        });
    }

    for (let i = 0; i < mcCount; i++) {
        const key = correctAnswers.mc[i];
        const answeredCorrectly = results.filter(r => !!r.answers.mc?.[i] && !!key && r.answers.mc[i] === key).length;
        questions.push({
            index: i + tfCount,
            type: 'SM',
            correctRate: results.length > 0 ? Math.round((answeredCorrectly / results.length) * 100) : 0,
            label: `SM ${i + 1}`,
        });
    }

    return questions;
}

export const AssessmentAnalytics: React.FC<AssessmentAnalyticsProps> = ({ onBack, evaluationId }) => {
    const { logo, institutionName, primaryColor } = useInstitutionBranding();
    const branding = { logo, institutionName, primaryColor };
    const [results, setResults] = useState<OMRResult[]>([]);
    const [correctAnswers, setCorrectAnswers] = useState<CorrectAnswers>({ tf: [], mc: [] });
    const [blueprintRows, setBlueprintRows] = useState<BlueprintKeyRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [evaluationMeta, setEvaluationMeta] = useState<EvaluationMetaRow | null>(null);
    const [selectedStudentKey, setSelectedStudentKey] = useState<string>('');
    const [studentTrajectory, setStudentTrajectory] = useState<StudentTrajectoryPoint[]>([]);
    const [loadingTrajectory, setLoadingTrajectory] = useState(false);

    const buildStudentKey = (row: { student_id?: string | null; student_name?: string | null }) =>
        `${row.student_id || ''}::${(row.student_name || '').trim().toLowerCase()}`;

    const fetchResults = async (signal: { cancelled: boolean }) => {
        setLoading(true);
        setError(null);
        try {
            const url = new URL(`${API_BASE_URL}/api/v1/omr-results`);
            if (evaluationId) {
                url.searchParams.append('evaluation_id', evaluationId);
            }

            const response = await assessmentFetch(url.toString());
            if (signal.cancelled) return;
            if (!response.ok) throw new Error('Error al cargar resultados');
            const data: OMRResult[] = await response.json();
            if (signal.cancelled) return;

            setResults(data);
            if (data.length > 0) {
                const firstWithIdentity = data.find((r) => (r.student_id || r.student_name));
                if (firstWithIdentity) {
                    setSelectedStudentKey(buildStudentKey(firstWithIdentity));
                }
            } else {
                setSelectedStudentKey('');
            }

            if (evaluationId) {
                const { data: keyRows, error: keyError } = await supabase
                    .from('evaluation_blueprint')
                    .select('question_number, question_type, oa, topic, correct_answer')
                    .eq('evaluation_id', evaluationId)
                    .order('question_number', { ascending: true });

                if (signal.cancelled) return;
                if (keyError) {
                    console.error('Error loading blueprint keys:', keyError);
                    setCorrectAnswers({ tf: [], mc: [] });
                    setBlueprintRows([]);
                } else {
                    const tf = (keyRows || [])
                        .filter((row: BlueprintKeyRow) => row.question_type === 'tf')
                        .map((row: BlueprintKeyRow) => row.correct_answer || '');
                    const mc = (keyRows || [])
                        .filter((row: BlueprintKeyRow) => row.question_type === 'mc')
                        .map((row: BlueprintKeyRow) => row.correct_answer || '');
                    setCorrectAnswers({ tf, mc });
                    setBlueprintRows((keyRows || []) as BlueprintKeyRow[]);
                }

                const { data: evalMetaData, error: evalMetaError } = await supabase
                    .from('evaluations')
                    .select('id, title, subject, grade, created_at, user_id')
                    .eq('id', evaluationId)
                    .maybeSingle();

                if (signal.cancelled) return;
                if (evalMetaError) {
                    console.error('Error loading evaluation metadata:', evalMetaError);
                    setEvaluationMeta(null);
                } else {
                    setEvaluationMeta((evalMetaData || null) as EvaluationMetaRow | null);
                }
            } else {
                setCorrectAnswers({ tf: [], mc: [] });
                setBlueprintRows([]);
                setEvaluationMeta(null);
            }
        } catch (err) {
            if (signal.cancelled) return;
            console.error(err);
            setError('No se pudieron cargar los datos del API de evaluaciones.');
        } finally {
            if (!signal.cancelled) setLoading(false);
        }
    };

    const refreshResults = () => {
        const signal = { cancelled: false };
        fetchResults(signal);
    };

    useEffect(() => {
        const signal = { cancelled: false };
        fetchResults(signal);
        return () => { signal.cancelled = true; };
    }, [evaluationId]);

    const analytics = useMemo(() => {
        if (results.length === 0) return null;

        const scores = results.map(r => r.score.percentage);
        const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        const max = Math.max(...scores);
        const min = Math.min(...scores);
        const passing = results.filter(r => r.score.percentage >= 60).length;
        const passRate = Math.round((passing / results.length) * 100);
        const median = (() => {
            const sorted = [...scores].sort((a, b) => a - b);
            const mid = Math.floor(sorted.length / 2);
            return sorted.length % 2 !== 0 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
        })();
        const stdDev = Math.round(Math.sqrt(scores.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) / scores.length));

        return {
            totalStudents: results.length,
            average: avg,
            median,
            max,
            min,
            passRate,
            passing,
            failing: results.length - passing,
            stdDev,
            distribution: getDistribution(results),
            questionDifficulty: getQuestionDifficulty(results, correctAnswers),
        };
    }, [results, correctAnswers]);

    const itemStats = useMemo<ItemStats[]>(() => {
        if (results.length < 5) return [];
        const allCorrect = [...correctAnswers.tf, ...correctAnswers.mc];
        if (allCorrect.length === 0) return [];

        const studentResults = results.map((r) => {
            const allAnswers = [...(r.answers.tf || []), ...(r.answers.mc || [])];
            return { answers: allAnswers, totalScore: r.score.correct };
        });

        const labels = allCorrect.map((_, i) => {
            const bp = blueprintRows.find((b) => b.question_number === i + 1);
            return bp ? `P${i + 1} (${bp.oa || 'OA'})` : `P${i + 1}`;
        });

        return analyzeItems(studentResults, allCorrect, labels);
    }, [results, correctAnswers, blueprintRows]);

    const studentOptions = useMemo<StudentOption[]>(() => {
        const map = new Map<string, StudentOption>();
        results.forEach((row) => {
            const key = buildStudentKey(row);
            if (!key) return;
            map.set(key, {
                key,
                studentName: (row.student_name || 'Sin nombre').trim() || 'Sin nombre',
                studentId: row.student_id || null,
            });
        });
        return Array.from(map.values()).sort((a, b) => a.studentName.localeCompare(b.studentName));
    }, [results]);

    const selectedStudentResult = useMemo<OMRResult | null>(() => {
        if (!selectedStudentKey) return null;
        return results.find((row) => buildStudentKey(row) === selectedStudentKey) || null;
    }, [results, selectedStudentKey]);

    const studentQuestionReview = useMemo<StudentQuestionReviewRow[]>(() => {
        if (!selectedStudentResult || blueprintRows.length === 0) return [];
        const tfTotal = blueprintRows.filter((row) => row.question_type === 'tf').length;

        return blueprintRows.map((row) => {
            let studentAnswer: string | null = null;
            if (row.question_type === 'tf') {
                const idx = row.question_number - 1;
                studentAnswer = selectedStudentResult.answers.tf?.[idx] ?? null;
            } else {
                const idx = row.question_number - tfTotal - 1;
                studentAnswer = selectedStudentResult.answers.mc?.[idx] ?? null;
            }

            let status: 'correct' | 'incorrect' | 'blank' = 'blank';
            if (!studentAnswer) {
                status = 'blank';
            } else if ((row.correct_answer || '') === studentAnswer) {
                status = 'correct';
            } else {
                status = 'incorrect';
            }

            return {
                questionNumber: row.question_number,
                questionType: row.question_type === 'tf' ? 'tf' : 'mc',
                oa: row.oa || '—',
                topic: row.topic || '—',
                studentAnswer,
                correctAnswer: row.correct_answer,
                status,
            };
        });
    }, [blueprintRows, selectedStudentResult]);

    const oaMastery = useMemo(() => {
        if (blueprintRows.length === 0 || results.length === 0) return [];

        const oaMap = new Map<string, { correct: number; total: number }>();
        const tfTotal = blueprintRows.filter(r => r.question_type === 'tf').length;

        blueprintRows.forEach((row) => {
            const oa = row.oa || 'Sin OA';
            if (!oaMap.has(oa)) oaMap.set(oa, { correct: 0, total: 0 });

            const entry = oaMap.get(oa)!;

            results.forEach((result) => {
                entry.total++;
                let studentAnswer: string | null = null;
                if (row.question_type === 'tf') {
                    studentAnswer = result.answers.tf?.[row.question_number - 1] ?? null;
                } else {
                    studentAnswer = result.answers.mc?.[row.question_number - tfTotal - 1] ?? null;
                }
                if (studentAnswer && studentAnswer === row.correct_answer) {
                    entry.correct++;
                }
            });
        });

        return Array.from(oaMap.entries()).map(([oa, data]) => ({
            oa,
            percentage: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
            correct: data.correct,
            total: data.total,
        }));
    }, [blueprintRows, results]);

    const consecutiveDropAlert = useMemo(() => {
        if (studentTrajectory.length < 3) return null;
        const sorted = [...studentTrajectory].sort((a, b) => +new Date(a.date) - +new Date(b.date));
        const lastThree = sorted.slice(-3);
        const d1 = lastThree[1].percentage - lastThree[0].percentage;
        const d2 = lastThree[2].percentage - lastThree[1].percentage;
        if (d1 <= -5 && d2 <= -5) {
            return `Descenso consecutivo detectado: ${lastThree[0].percentage}% → ${lastThree[1].percentage}% → ${lastThree[2].percentage}%`;
        }
        return null;
    }, [studentTrajectory]);

    useEffect(() => {
        const fetchTrajectory = async () => {
            if (!evaluationMeta || !selectedStudentResult) {
                setStudentTrajectory([]);
                return;
            }
            setLoadingTrajectory(true);
            try {
                const { data: comparableEvals, error: evalsError } = await supabase
                    .from('evaluations')
                    .select('id, title, created_at')
                    .eq('user_id', evaluationMeta.user_id)
                    .eq('subject', evaluationMeta.subject || '')
                    .eq('grade', evaluationMeta.grade || '')
                    .order('created_at', { ascending: true })
                    .limit(30);

                if (evalsError) throw evalsError;
                const evalIds = (comparableEvals || []).map((row: { id: string }) => row.id);
                if (evalIds.length === 0) {
                    setStudentTrajectory([]);
                    return;
                }

                let query = supabase
                    .from('omr_results')
                    .select('evaluation_id, score, captured_at, student_name, student_id')
                    .in('evaluation_id', evalIds);

                if (selectedStudentResult.student_id) {
                    query = query.eq('student_id', selectedStudentResult.student_id);
                } else {
                    query = query.eq('student_name', selectedStudentResult.student_name || '');
                }

                const { data: historyRows, error: historyError } = await query.order('captured_at', { ascending: true });
                if (historyError) throw historyError;

                const evalMap = new Map<string, { title: string; created_at: string }>();
                (comparableEvals || []).forEach((e: { id: string; title: string; created_at: string }) => {
                    evalMap.set(e.id, { title: e.title, created_at: e.created_at });
                });

                const latestByEval = new Map<string, { percentage: number; captured_at: string }>();
                (historyRows || []).forEach((row: { evaluation_id: string; captured_at: string; score: { percentage: number } }) => {
                    const current = latestByEval.get(row.evaluation_id);
                    if (!current || +new Date(row.captured_at) > +new Date(current.captured_at)) {
                        latestByEval.set(row.evaluation_id, {
                            percentage: row.score?.percentage ?? 0,
                            captured_at: row.captured_at,
                        });
                    }
                });

                const trajectory: StudentTrajectoryPoint[] = Array.from(latestByEval.entries())
                    .map(([evalId, value]) => ({
                        evaluationId: evalId,
                        evaluationTitle: evalMap.get(evalId)?.title || `Evaluación ${evalId.slice(0, 6)}`,
                        date: evalMap.get(evalId)?.created_at || value.captured_at,
                        percentage: value.percentage,
                    }))
                    .sort((a, b) => +new Date(a.date) - +new Date(b.date));

                setStudentTrajectory(trajectory);
            } catch (trajectoryError) {
                console.error('Error loading student trajectory:', trajectoryError);
                setStudentTrajectory([]);
            } finally {
                setLoadingTrajectory(false);
            }
        };

        fetchTrajectory();
    }, [evaluationMeta, selectedStudentResult]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[var(--background)] p-6">
                <button onClick={onBack} className="flex items-center gap-2 text-[var(--muted)] hover:text-[var(--on-background)] mb-6 transition-colors">
                    <ArrowLeft size={20} /> Volver
                </button>
                <div className="glass-card-premium p-12 text-center">
                    <AlertTriangle size={48} className="text-amber-400 mx-auto mb-4" />
                    <p className="text-[var(--on-background)] font-medium mb-2">Error de conexión</p>
                    <p className="text-[var(--muted)] max-w-sm mx-auto">{error}</p>
                    <button onClick={refreshResults} className="btn-gradient px-4 py-2 rounded-lg mt-6 text-white">Reintentar</button>
                </div>
            </div>
        );
    }

    if (!analytics) {
        return (
            <div className="min-h-screen bg-[var(--background)] p-6">
                <button onClick={onBack} className="flex items-center gap-2 text-[var(--muted)] hover:text-[var(--on-background)] mb-6 transition-colors">
                    <ArrowLeft size={20} /> Volver
                </button>
                <div className="glass-card-premium p-12 text-center">
                    <BarChart3 size={48} className="text-[var(--muted)] mx-auto mb-4 opacity-40" />
                    <h3 className="text-lg font-semibold text-[var(--on-background)] mb-2">Sin datos para analizar</h3>
                    <p className="text-[var(--muted)]">Escanea hojas de respuesta para ver analytics aquí.</p>
                </div>
            </div>
        );
    }

    const maxBucketCount = Math.max(...analytics.distribution.map(b => b.count), 1);

    const handleExportStudentPDF = () => {
        if (!selectedStudentResult) {
            toast.error('Selecciona un estudiante para exportar su informe.');
            return;
        }

        generateStudentReport({
            studentName: selectedStudentResult.student_name || 'Sin nombre',
            studentId: selectedStudentResult.student_id || null,
            evaluationTitle: evaluationMeta?.title || 'Evaluación',
            subject: evaluationMeta?.subject || '',
            grade: evaluationMeta?.grade || '',
            score: selectedStudentResult.score,
            questionRows: studentQuestionReview.map((row) => ({
                questionNumber: row.questionNumber,
                questionType: row.questionType,
                oa: row.oa,
                topic: row.topic,
                studentAnswer: row.studentAnswer,
                correctAnswer: row.correctAnswer,
                status: row.status,
            })),
            trajectory: studentTrajectory.map((point) => ({
                evaluationTitle: point.evaluationTitle,
                date: new Date(point.date).toLocaleDateString('es-CL'),
                percentage: point.percentage,
            })),
            consecutiveDropAlert,
        }, branding);
    };

    return (
        <div className="min-h-screen bg-[var(--background)] animate-fade-in">
            <div className="max-w-[1400px] mx-auto p-6 space-y-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className="p-2 text-[var(--muted)] hover:text-[var(--on-background)] hover:bg-[var(--card-hover)] rounded-lg transition-all"
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold text-[var(--on-background)]">Analytics de Evaluación</h1>
                            <p className="text-[var(--muted)] mt-1">{analytics.totalStudents} estudiantes evaluados</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleExportStudentPDF}
                            disabled={!selectedStudentResult}
                            className="px-3 py-2 rounded-lg border border-[var(--border)] text-[var(--muted)] hover:text-[var(--on-background)] disabled:opacity-50 flex items-center gap-2"
                        >
                            <FileText size={16} />
                            PDF Alumno
                        </button>
                        <button
                            onClick={refreshResults}
                            className="btn-gradient px-4 py-2 rounded-lg flex items-center gap-2 text-white shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
                        >
                            <RefreshCw size={18} />
                            <span>Actualizar</span>
                        </button>
                    </div>
                </div>

                <div className="glass-card-premium p-5">
                    <div className="flex flex-wrap items-center gap-3">
                        <label className="text-sm text-[var(--muted)]">Estudiante:</label>
                        <select
                            value={selectedStudentKey}
                            onChange={(e) => setSelectedStudentKey(e.target.value)}
                            className="px-3 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--border)] text-sm min-w-[280px]"
                        >
                            {studentOptions.length === 0 && <option value="">Sin estudiantes</option>}
                            {studentOptions.map((student) => (
                                <option key={student.key} value={student.key}>
                                    {student.studentName}{student.studentId ? ` · ${student.studentId}` : ''}
                                </option>
                            ))}
                        </select>
                        {selectedStudentResult && (
                            <span className="text-xs text-[var(--muted)]">
                                Resultado actual: {selectedStudentResult.score.percentage}% ({selectedStudentResult.score.correct}/{selectedStudentResult.score.total})
                            </span>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        className="glass-card-premium p-6"
                    >
                        <h3 className="text-lg font-semibold text-[var(--on-background)] mb-4">Desempeño por Pregunta (Alumno)</h3>
                        <div className="max-h-[360px] overflow-auto rounded-xl border border-[var(--border)]">
                            <table className="w-full text-sm">
                                <thead className="sticky top-0 bg-[var(--card)] border-b border-[var(--border)]">
                                    <tr>
                                        <th className="text-left px-3 py-2">#</th>
                                        <th className="text-left px-3 py-2">Tipo</th>
                                        <th className="text-left px-3 py-2">OA</th>
                                        <th className="text-left px-3 py-2">Resp.</th>
                                        <th className="text-left px-3 py-2">Clave</th>
                                        <th className="text-left px-3 py-2">Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {studentQuestionReview.length === 0 && (
                                        <tr><td colSpan={6} className="px-3 py-4 text-center text-[var(--muted)]">Sin datos de preguntas para este estudiante.</td></tr>
                                    )}
                                    {studentQuestionReview.map((row) => (
                                        <tr key={`${row.questionType}-${row.questionNumber}`} className="border-b border-[var(--border)]">
                                            <td className="px-3 py-2">{row.questionNumber}</td>
                                            <td className="px-3 py-2 uppercase">{row.questionType}</td>
                                            <td className="px-3 py-2">{row.oa}</td>
                                            <td className="px-3 py-2">{row.studentAnswer || '—'}</td>
                                            <td className="px-3 py-2">{row.correctAnswer || '—'}</td>
                                            <td className="px-3 py-2">
                                                <span className={`text-xs font-semibold ${row.status === 'correct' ? 'text-emerald-400' : row.status === 'incorrect' ? 'text-red-400' : 'text-amber-400'}`}>
                                                    {row.status === 'correct' ? 'Correcto' : row.status === 'incorrect' ? 'Incorrecto' : 'En blanco'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.08 }}
                        className="glass-card-premium p-6"
                    >
                        <h3 className="text-lg font-semibold text-[var(--on-background)] mb-4">Trayectoria Temporal del Alumno</h3>
                        {loadingTrajectory && (
                            <p className="text-sm text-[var(--muted)]">Cargando trayectoria…</p>
                        )}
                        {!loadingTrajectory && studentTrajectory.length === 0 && (
                            <p className="text-sm text-[var(--muted)]">Sin historial suficiente para mostrar trayectoria.</p>
                        )}
                        {!loadingTrajectory && studentTrajectory.length > 0 && (
                            <div className="space-y-3">
                                {studentTrajectory.map((point, idx) => {
                                    const prev = idx > 0 ? studentTrajectory[idx - 1].percentage : null;
                                    const delta = prev !== null ? point.percentage - prev : null;
                                    return (
                                        <div key={`${point.evaluationId}-${idx}`} className="p-3 rounded-xl border border-[var(--border)] bg-[var(--card)]/40">
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                <span className="text-sm font-semibold text-[var(--on-background)]">{point.evaluationTitle}</span>
                                                <span className="text-sm font-bold text-[var(--primary)]">{point.percentage}%</span>
                                            </div>
                                            <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                                                <span>{new Date(point.date).toLocaleDateString('es-CL')}</span>
                                                <span>
                                                    {delta === null ? 'Inicio' : `${delta > 0 ? '+' : ''}${delta} pp`}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                                {consecutiveDropAlert && (
                                    <div className="p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-sm text-red-300">
                                        <strong>Alerta:</strong> {consecutiveDropAlert}
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <KPICard
                        title="Promedio"
                        value={`${analytics.average}%`}
                        icon={<TrendingUp className="text-blue-400" size={22} />}
                        subtitle={`Mediana: ${analytics.median}%`}
                    />
                    <KPICard
                        title="Tasa Aprobación"
                        value={`${analytics.passRate}%`}
                        icon={<CheckCircle2 className="text-emerald-400" size={22} />}
                        subtitle={`${analytics.passing} de ${analytics.totalStudents}`}
                    />
                    <KPICard
                        title="Puntaje Máximo"
                        value={`${analytics.max}%`}
                        icon={<Award className="text-amber-400" size={22} />}
                        subtitle={`Mínimo: ${analytics.min}%`}
                    />
                    <KPICard
                        title="Desviación Estándar"
                        value={`${analytics.stdDev}%`}
                        icon={<Target className="text-purple-400" size={22} />}
                        subtitle={analytics.stdDev > 20 ? 'Alta dispersión' : analytics.stdDev > 10 ? 'Moderada' : 'Homogéneo'}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="glass-card-premium p-6"
                    >
                        <h3 className="text-lg font-semibold text-[var(--on-background)] mb-6 flex items-center gap-2">
                            <BarChart3 size={20} className="text-[var(--primary)]" />
                            Distribución de Puntajes
                        </h3>
                        <div className="space-y-3">
                            {analytics.distribution.map((bucket) => (
                                <div key={bucket.label} className="flex items-center gap-3">
                                    <span className="text-xs font-medium text-[var(--muted)] w-16 text-right">{bucket.label}</span>
                                    <div className="flex-1 h-8 bg-[var(--input-bg)] rounded-lg overflow-hidden relative">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(bucket.count / maxBucketCount) * 100}%` }}
                                            transition={{ duration: 0.8, ease: 'easeOut' }}
                                            className="h-full rounded-lg"
                                            style={{ backgroundColor: bucket.color, minWidth: bucket.count > 0 ? '24px' : '0' }}
                                        />
                                        {bucket.count > 0 && (
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--on-background)]">
                                                {bucket.count} est.
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 flex gap-4">
                            <div className="flex-1 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
                                <p className="text-2xl font-bold text-emerald-400">{analytics.passing}</p>
                                <p className="text-xs text-emerald-400/70 mt-1">Aprobados (≥60%)</p>
                            </div>
                            <div className="flex-1 bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
                                <p className="text-2xl font-bold text-red-400">{analytics.failing}</p>
                                <p className="text-xs text-red-400/70 mt-1">Reprobados (&lt;60%)</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="glass-card-premium p-6"
                    >
                        <h3 className="text-lg font-semibold text-[var(--on-background)] mb-6 flex items-center gap-2">
                            <Users size={20} className="text-[var(--primary)]" />
                            Ranking de Estudiantes
                        </h3>
                        <div className="space-y-2 max-h-[380px] overflow-y-auto pr-2 custom-scrollbar">
                            {[...results]
                                .sort((a, b) => b.score.percentage - a.score.percentage)
                                .map((result, idx) => (
                                    <div key={result.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--card-hover)] transition-colors">
                                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${idx < 3
                                            ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md'
                                            : 'bg-[var(--input-bg)] text-[var(--muted)]'
                                            }`}>
                                            {idx + 1}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-[var(--on-background)] truncate">{result.student_name || 'Sin nombre'}</p>
                                            <p className="text-xs text-[var(--muted)]">{result.score.correct}/{result.score.total} correctas</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-20 h-2 bg-[var(--input-bg)] rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${result.score.percentage >= 60 ? 'bg-emerald-500' : 'bg-red-500'}`}
                                                    style={{ width: `${result.score.percentage}%` }}
                                                />
                                            </div>
                                            <span className={`text-sm font-bold min-w-[40px] text-right ${result.score.percentage >= 60 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {result.score.percentage}%
                                            </span>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </motion.div>
                </div>

                {analytics.questionDifficulty.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                        className="glass-card-premium p-6"
                    >
                        <h3 className="text-lg font-semibold text-[var(--on-background)] mb-6 flex items-center gap-2">
                            <Target size={20} className="text-[var(--primary)]" />
                            Dificultad por Pregunta
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {[...analytics.questionDifficulty]
                                .sort((a, b) => a.correctRate - b.correctRate)
                                .slice(0, 12)
                                .map((q) => (
                                    <div key={q.label} className="p-3 rounded-lg border border-[var(--border)] bg-[var(--card)]/40">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-semibold text-[var(--on-background)]">{q.label}</span>
                                            <span className={`text-xs font-bold ${q.correctRate >= 70 ? 'text-emerald-400' : q.correctRate >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                                                {q.correctRate}% logro
                                            </span>
                                        </div>
                                        <div className="h-2 rounded-full bg-[var(--input-bg)] overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${q.correctRate >= 70 ? 'bg-emerald-500' : q.correctRate >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                                                style={{ width: `${q.correctRate}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </motion.div>
                )}

                {oaMastery.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.27 }}
                        className="glass-card-premium p-6"
                    >
                        <h3 className="text-lg font-semibold text-[var(--on-background)] mb-6 flex items-center gap-2">
                            <Target size={20} className="text-[var(--primary)]" />
                            Dominio por OA (Semáforo)
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {oaMastery.map((item) => {
                                const colorClasses = item.percentage >= 70
                                    ? { bg: 'bg-emerald-500/5', border: 'border-emerald-500/20', text: 'text-emerald-400', dot: 'bg-emerald-500' }
                                    : item.percentage >= 50
                                    ? { bg: 'bg-amber-500/5', border: 'border-amber-500/20', text: 'text-amber-400', dot: 'bg-amber-500' }
                                    : { bg: 'bg-red-500/5', border: 'border-red-500/20', text: 'text-red-400', dot: 'bg-red-500' };
                                return (
                                    <div key={item.oa} className={`p-4 rounded-xl border ${colorClasses.bg} ${colorClasses.border}`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-bold text-[var(--on-background)]">{item.oa}</span>
                                            <span className={`w-3 h-3 rounded-full ${colorClasses.dot}`} />
                                        </div>
                                        <p className={`text-2xl font-bold ${colorClasses.text}`}>{item.percentage}%</p>
                                        <p className="text-xs text-[var(--muted)] mt-1">
                                            {item.percentage >= 70 ? 'Logrado' : item.percentage >= 50 ? 'En desarrollo' : 'Crítico'}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="glass-card-premium p-6"
                >
                    <h3 className="text-lg font-semibold text-[var(--on-background)] mb-4 flex items-center gap-2">
                        <Target size={20} className="text-[var(--primary)]" />
                        Insights Pedagógicos
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <InsightCard
                            condition={analytics.average >= 70}
                            positive="Rendimiento sólido"
                            positiveDesc={`El promedio de ${analytics.average}% indica buen dominio general del contenido evaluado.`}
                            negative="Atención requerida"
                            negativeDesc={`El promedio de ${analytics.average}% sugiere que el contenido necesita refuerzo. Considere actividades de remediación.`}
                        />
                        <InsightCard
                            condition={analytics.stdDev <= 15}
                            positive="Grupo homogéneo"
                            positiveDesc={`La desviación estándar de ${analytics.stdDev}% indica que los estudiantes tienen niveles similares.`}
                            negative="Alta dispersión"
                            negativeDesc={`La desviación de ${analytics.stdDev}% sugiere niveles muy distintos. Considere trabajo diferenciado.`}
                        />
                        <InsightCard
                            condition={analytics.passRate >= 75}
                            positive="Objetivo cumplido"
                            positiveDesc={`${analytics.passRate}% de aprobación alcanza la meta institucional. Excelente resultado.`}
                            negative="Bajo logro"
                            negativeDesc={`Solo ${analytics.passRate}% aprobó. Revise la evaluación o realice retroalimentación grupal.`}
                        />
                    </div>
                </motion.div>

                {/* Item Analysis — AN-19 */}
                {itemStats.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                        <ItemAnalysisView items={itemStats} />
                    </motion.div>
                )}
            </div>
        </div>
    );
};

const KPICard: React.FC<{
    title: string;
    value: string;
    icon: React.ReactNode;
    subtitle: string;
}> = ({ title, value, icon, subtitle }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card-premium p-5 hover:translate-y-[-2px] transition-transform duration-300"
    >
        <div className="flex items-start justify-between mb-3">
            <p className="text-sm font-medium text-[var(--muted)]">{title}</p>
            <div className="p-2 bg-[var(--input-bg)] rounded-lg border border-[var(--border)]">{icon}</div>
        </div>
        <h3 className="text-3xl font-bold text-[var(--on-background)] mb-1">{value}</h3>
        <p className="text-xs text-[var(--muted)]">{subtitle}</p>
    </motion.div>
);

const InsightCard: React.FC<{
    condition: boolean;
    positive: string;
    positiveDesc: string;
    negative: string;
    negativeDesc: string;
}> = ({ condition, positive, positiveDesc, negative, negativeDesc }) => (
    <div className={`p-4 rounded-xl border ${condition ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-amber-500/5 border-amber-500/20'}`}>
        <div className="flex items-center gap-2 mb-2">
            {condition
                ? <CheckCircle2 size={16} className="text-emerald-400" />
                : <AlertTriangle size={16} className="text-amber-400" />
            }
            <span className={`text-sm font-semibold ${condition ? 'text-emerald-400' : 'text-amber-400'}`}>
                {condition ? positive : negative}
            </span>
        </div>
        <p className="text-xs text-[var(--muted)] leading-relaxed">{condition ? positiveDesc : negativeDesc}</p>
    </div>
);
