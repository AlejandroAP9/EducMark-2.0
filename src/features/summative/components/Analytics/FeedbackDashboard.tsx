'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Activity, AlertCircle, CheckCircle, BrainCircuit, Sparkles, ChevronDown, Users, TrendingUp, XCircle, FileText, BarChart3, Download, Loader2, Presentation, Mail, Send, Zap, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { ClassInsights } from './ClassInsights';
import { OAEvolution } from './OAEvolution';
import { generateExecutiveReport, downloadExecutivePresentationHTML } from '@/shared/lib/generateReport';
import { useInstitutionBranding } from '@/shared/hooks/useInstitutionBranding';
import { getAssessmentApiUrl, assessmentFetch } from '@/shared/lib/apiConfig';
import { toast } from 'sonner';

const supabase = createClient();

const API_BASE_URL = getAssessmentApiUrl();

// ---- Types ----

interface Evaluation {
    id: string;
    title: string;
    grade: string;
    subject: string;
    unit: string;
    created_at: string;
}

interface OMRResult {
    id: string;
    evaluation_id: string;
    student_name: string | null;
    answers: { mc: (string | null)[]; tf: (string | null)[] };
    score: { correct: number; incorrect: number; blank: number; total: number; percentage: number };
    captured_at: string;
}

interface BlueprintItem {
    question_number: number;
    question_type: string;
    oa: string;
    topic: string;
    skill: string;
    correct_answer: string | null;
}

interface EvaluationItem {
    id: string;
    type: string;
    oa: string;
    topic: string;
    question: string;
    options: string[] | null;
    correct_answer: string | null;
}

interface OAMastery {
    oa: string;
    topic: string;
    totalQuestions: number;
    correctAnswers: number;
    percentage: number;
    status: 'high' | 'medium' | 'low';
}

// ---- Component ----

interface FeedbackDashboardProps {
    initialEvalId?: string;
}

export const FeedbackDashboard: React.FC<FeedbackDashboardProps> = ({ initialEvalId }) => {
    const { logo, institutionName, primaryColor } = useInstitutionBranding();
    const branding = { logo, institutionName, primaryColor };
    const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
    const [selectedEvalId, setSelectedEvalId] = useState<string | null>(initialEvalId ?? null);
    const [results, setResults] = useState<OMRResult[]>([]);
    const [blueprint, setBlueprint] = useState<BlueprintItem[]>([]);
    const [evalItems, setEvalItems] = useState<EvaluationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [exportingSlides, setExportingSlides] = useState(false);
    const [quickScanCount, setQuickScanCount] = useState<number>(0);

    // Remedial Plan State
    const [remedialModalOpen, setRemedialModalOpen] = useState(false);
    const [remedialLoading, setRemedialLoading] = useState(false);
    const [selectedOARemedial, setSelectedOARemedial] = useState<string | null>(null);
    const [remedialData, setRemedialData] = useState<{ oa: string, topic: string, guide: string } | null>(null);

    // Fetch evaluations list
    useEffect(() => {
        const fetchEvals = async () => {
            try {
                const { data: { user }, error: userError } = await supabase.auth.getUser();
                if (userError) throw userError;
                if (!user) return;

                const { data, error } = await supabase
                    .from('evaluations')
                    .select('id, title, grade, subject, unit, created_at')
                    .eq('user_id', user.id)
                    .eq('status', 'active')
                    .order('created_at', { ascending: false });

                if (error) throw error;

                if (data && data.length > 0) {
                    setEvaluations(data);
                    if (!initialEvalId) {
                        setSelectedEvalId(data[0].id);
                    }
                }

                // Count QuickScan results (scan_type='quick') for this user — for banner
                const { count: qsCount } = await supabase
                    .from('omr_results')
                    .select('id', { count: 'exact', head: true })
                    .eq('user_id', user.id)
                    .eq('scan_type', 'quick');
                setQuickScanCount(qsCount || 0);
            } catch (err) {
                console.error('Error fetching evaluations in FeedbackDashboard:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchEvals();
    }, [initialEvalId]);

    // Fetch results + blueprint when evaluation changes
    useEffect(() => {
        if (!selectedEvalId) return;

        const fetchData = async () => {
            setLoading(true);

            try {
                const [resultsRes, blueprintRes, itemsRes] = await Promise.all([
                    supabase
                        .from('omr_results')
                        .select('*')
                        .eq('evaluation_id', selectedEvalId)
                        .order('captured_at', { ascending: true }),
                    supabase
                        .from('evaluation_blueprint')
                        .select('question_number, question_type, oa, topic, skill, correct_answer')
                        .eq('evaluation_id', selectedEvalId)
                        .order('question_number', { ascending: true }),
                    supabase
                        .from('evaluation_items')
                        .select('id, type, oa, topic, question, options, correct_answer')
                        .eq('evaluation_id', selectedEvalId)
                        .order('id', { ascending: true })
                ]);

                if (resultsRes.error) throw resultsRes.error;
                if (blueprintRes.error) throw blueprintRes.error;
                if (itemsRes.error) throw itemsRes.error;

                setResults(resultsRes.data || []);
                setBlueprint(blueprintRes.data || []);
                setEvalItems(itemsRes.data || []);
            } catch (err) {
                console.error('Error fetching data in FeedbackDashboard:', err);
            } finally {
                setLoading(false);
            }
        };

        let cancelled = false;

        fetchData();

        // Real-time subscription for new scan results
        const channel = supabase
            .channel(`feedback-${selectedEvalId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'omr_results', filter: `evaluation_id=eq.${selectedEvalId}` }, () => {
                if (!cancelled) fetchData();
            })
            .subscribe((status) => {
                if (status === 'CHANNEL_ERROR') {
                    console.error('[FeedbackDashboard] Supabase realtime subscribe failed');
                }
            });

        return () => {
            cancelled = true;
            supabase.removeChannel(channel);
        };
    }, [selectedEvalId]);

    const selectedEval = evaluations.find(e => e.id === selectedEvalId);

    // ---- Computed Analytics ----

    const totalStudents = results.length;

    const averagePercentage = useMemo(() => {
        if (totalStudents === 0) return 0;
        return Math.round(results.reduce((sum, r) => sum + r.score.percentage, 0) / totalStudents);
    }, [results, totalStudents]);

    // Convert percentage to Chilean grade (1.0 - 7.0, 60% = 4.0)
    const averageGrade = useMemo(() => {
        if (averagePercentage <= 0) return '1.0';
        if (averagePercentage >= 100) return '7.0';
        // Linear scale: 0% = 1.0, 60% = 4.0, 100% = 7.0
        if (averagePercentage < 60) {
            return (1.0 + (averagePercentage / 60) * 3.0).toFixed(1);
        }
        return (4.0 + ((averagePercentage - 60) / 40) * 3.0).toFixed(1);
    }, [averagePercentage]);

    const passCount = useMemo(() => results.filter(r => r.score.percentage >= 60).length, [results]);
    const passRate = totalStudents > 0 ? Math.round((passCount / totalStudents) * 100) : 0;

    // OA Mastery analysis
    const oaMastery: OAMastery[] = useMemo(() => {
        if (blueprint.length === 0 || results.length === 0) return [];

        // Group blueprint items by OA
        const oaGroups: Record<string, { topic: string; questions: BlueprintItem[] }> = {};
        blueprint.forEach(bp => {
            if (!oaGroups[bp.oa]) {
                oaGroups[bp.oa] = { topic: bp.topic || '', questions: [] };
            }
            oaGroups[bp.oa].questions.push(bp);
        });

        return Object.entries(oaGroups).map(([oa, { topic, questions }]) => {
            let totalAnswered = 0;
            let totalCorrect = 0;

            questions.forEach(q => {
                results.forEach(r => {
                    const answerArray = q.question_type === 'tf' ? r.answers.tf : r.answers.mc;
                    // question_number is 1-indexed, for 'tf' questions 1-10, for 'mc' questions start after tf
                    let idx: number;
                    if (q.question_type === 'tf') {
                        idx = q.question_number - 1;
                    } else {
                        // mc questions in blueprint are numbered sequentially after tf
                        // Find the index within the mc array
                        const tfCount = blueprint.filter(b => b.question_type === 'tf').length;
                        idx = q.question_number - tfCount - 1;
                    }

                    if (answerArray && idx >= 0 && idx < answerArray.length) {
                        const studentAnswer = answerArray[idx];
                        if (studentAnswer !== null && studentAnswer !== undefined) {
                            totalAnswered++;
                            if (q.correct_answer && studentAnswer === q.correct_answer) {
                                totalCorrect++;
                            }
                        }
                    }
                });
            });

            const percentage = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
            const status: 'high' | 'medium' | 'low' = percentage >= 70 ? 'high' : percentage >= 50 ? 'medium' : 'low';

            return { oa, topic, totalQuestions: questions.length, correctAnswers: totalCorrect, percentage, status };
        }).sort((a, b) => a.percentage - b.percentage); // Lowest first
    }, [blueprint, results]);

    const criticalOA = oaMastery.length > 0 ? oaMastery[0] : null;

    // Top Failed Questions analysis
    const failedQuestions = useMemo(() => {
        if (blueprint.length === 0 || results.length === 0) return [];

        const tfCount = blueprint.filter(b => b.question_type === 'tf').length;

        // Count errors per question number
        const errorsCount: Record<number, number> = {};
        blueprint.forEach(bp => {
            errorsCount[bp.question_number] = 0;

            results.forEach(r => {
                const answerArray = bp.question_type === 'tf' ? r.answers.tf : r.answers.mc;
                const idx = bp.question_type === 'tf' ? bp.question_number - 1 : bp.question_number - tfCount - 1;

                if (answerArray && idx >= 0 && idx < answerArray.length) {
                    const studentAnswer = answerArray[idx];
                    // If wrong or blank
                    if (studentAnswer === null || studentAnswer === undefined || (bp.correct_answer && studentAnswer !== bp.correct_answer)) {
                        errorsCount[bp.question_number]++;
                    }
                } else {
                    // Missing answer array counts as error
                    errorsCount[bp.question_number]++;
                }
            });
        });

        // Map to items to get full text
        return blueprint.map(bp => {
            const errors = errorsCount[bp.question_number] || 0;
            const errorRate = totalStudents > 0 ? Math.round((errors / totalStudents) * 100) : 0;

            // Try to find matching text in evalItems (ordered mapping as best effort)
            // It assumes evalItems are ordered first TF, then MC, matching blueprint.
            // If we have items:
            let questionText = `Pregunta ${bp.question_number}`;
            if (evalItems.length > 0) {
                // simple mapping: if there are the exact same number of items as blueprint items
                if (evalItems.length === blueprint.length) {
                    questionText = evalItems[bp.question_number - 1]?.question || questionText;
                } else {
                    // Fallback: finding by OA might be too vague, just use generic string
                    const matchingItems = evalItems.filter(e => e.oa === bp.oa && (
                        (bp.question_type === 'tf' && (e.type === 'tf' || e.type === 'Verdadero o Falso')) ||
                        (bp.question_type === 'mc' && (e.type === 'mc' || e.type === 'Selección Múltiple'))
                    ));
                    if (matchingItems.length > 0) {
                        questionText = matchingItems[0].question; // rough guess
                    }
                }
            }

            return {
                question_number: bp.question_number,
                oa: bp.oa,
                topic: bp.topic,
                questionText,
                errors,
                errorRate
            };
        }).sort((a, b) => b.errorRate - a.errorRate).slice(0, 5); // Take top 5
    }, [blueprint, results, evalItems, totalStudents]);

    // ---- PDF Export ----
    const handleExportPDF = async () => {
        if (!selectedEvalId || !selectedEval) return;
        setExporting(true);
        try {
            const [insightsRes, evolutionRes] = await Promise.allSettled([
                assessmentFetch(`${API_BASE_URL}/api/v1/feedback/class-insights/${selectedEvalId}`).then(r => r.ok ? r.json() : null),
                assessmentFetch(`${API_BASE_URL}/api/v1/feedback/oa-evolution/${selectedEvalId}`).then(r => r.ok ? r.json() : null),
            ]);
            const insights = insightsRes.status === 'fulfilled' ? insightsRes.value : null;
            const evolution = evolutionRes.status === 'fulfilled' ? evolutionRes.value : null;
            await generateExecutiveReport({
                evaluationTitle: selectedEval.title,
                subject: selectedEval.subject,
                grade: selectedEval.grade,
                date: new Date().toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' }),
                insights: insights?.success ? insights : undefined,
                evolution: evolution?.success ? evolution : undefined,
            }, branding);
        } catch (err) {
            console.error('Error exporting PDF:', err);
            toast.error('Error al generar el reporte. Intenta de nuevo.');
        } finally {
            setExporting(false);
        }
    };

    // AN-04: Enviar a Apoderado (stub)
    const handleSendToGuardian = () => {
        toast.info('Función "Enviar a Apoderado" disponible próximamente. Se enviará un resumen vía correo electrónico.');
    };

    // AN-20: Weekly executive email (stub)
    const handleWeeklyEmail = () => {
        toast.info('Resumen ejecutivo semanal por correo disponible próximamente.');
    };

    const handleExportPresentation = async () => {
        if (!selectedEvalId || !selectedEval) return;
        setExportingSlides(true);
        try {
            const [insightsRes, evolutionRes] = await Promise.allSettled([
                assessmentFetch(`${API_BASE_URL}/api/v1/feedback/class-insights/${selectedEvalId}`).then(r => r.ok ? r.json() : null),
                assessmentFetch(`${API_BASE_URL}/api/v1/feedback/oa-evolution/${selectedEvalId}`).then(r => r.ok ? r.json() : null),
            ]);
            const insights = insightsRes.status === 'fulfilled' ? insightsRes.value : null;
            const evolution = evolutionRes.status === 'fulfilled' ? evolutionRes.value : null;

            downloadExecutivePresentationHTML({
                evaluationTitle: selectedEval.title,
                subject: selectedEval.subject,
                grade: selectedEval.grade,
                date: new Date().toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' }),
                insights: insights?.success ? insights : undefined,
                evolution: evolution?.success ? evolution : undefined,
            }, branding);
            toast.success('Presentación HTML descargada.');
        } catch (err) {
            console.error('Error exporting slides:', err);
            toast.error('Error al generar la presentación.');
        } finally {
            setExportingSlides(false);
        }
    };

    // ---- RAG Remedial Plan Generation ----
    const handleGenerateRemedial = async (oa: string, topic: string) => {
        if (!selectedEval) return;

        setSelectedOARemedial(oa);
        setRemedialModalOpen(true);
        setRemedialLoading(true);
        setRemedialData(null);

        try {
            // Find error rate and top mistakes for this OA
            const oaData = oaMastery.find(m => m.oa === oa);
            const errorRate = oaData ? 100 - oaData.percentage : 50;
            const topMistakesForOA = failedQuestions
                .filter(fq => fq.oa === oa)
                .map(fq => fq.questionText)
                .slice(0, 3);

            const { data, error } = await supabase.functions.invoke('generate-remedial-plan', {
                body: {
                    oaId: oa,
                    subject: selectedEval.subject,
                    grade: selectedEval.grade,
                    errorRate: errorRate,
                    topMistakes: topMistakesForOA.length > 0 ? topMistakesForOA : undefined
                }
            });

            if (error) throw error;
            if (!data || !data.guide) throw new Error('Respuesta inválida del servidor');

            setRemedialData({
                oa,
                topic,
                guide: data.guide
            });

            toast.success('Plan de nivelación generado con éxito');

        } catch (err) {
            console.error('Error generating remedial plan:', err);
            toast.error('No se pudo generar el plan de nivelación en este momento.');
            setRemedialModalOpen(false);
        } finally {
            setRemedialLoading(false);
        }
    };

    const handlePrintRemedial = () => {
        if (!remedialData) return;

        // Simple printable window approach
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        // Convert basic markdown to HTML for printing
        let htmlContent = remedialData.guide
            .replace(/\\n/g, '<br/>')
            .replace(/## (.*)/g, '<h2>$1</h2>')
            .replace(/# (.*)/g, '<h1>$1</h1>')
            .replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>');

        printWindow.document.write(`
            <html>
                <head>
                    <title>Plan Remedial - ${remedialData.oa}</title>
                    <style>
                        body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 40px; }
                        h1 { color: #2563eb; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
                        h2 { color: #4b5563; margin-top: 30px; }
                        strong { color: #111827; }
                        @media print {
                            body { padding: 0; }
                            button { display: none; }
                        }
                    </style>
                </head>
                <body>
                    <div style="text-align: right; margin-bottom: 20px;">
                        <button onclick="window.print()" style="padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer;">Imprimir PDF</button>
                    </div>
                    ${htmlContent}
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    // ---- AN-16: Download Remediation Guide for all weak OAs ----
    const handleDownloadRemediationGuide = () => {
        if (!selectedEval || oaMastery.length === 0) {
            toast.error('No hay datos de OA para generar la guía.');
            return;
        }

        const weakOAs = oaMastery.filter(m => m.status === 'low' || m.status === 'medium');
        if (weakOAs.length === 0) {
            toast.info('No se detectan OA con bajo rendimiento. No se requiere guía de reforzamiento.');
            return;
        }

        const oaSections = weakOAs.map(oa => {
            const relatedQuestions = failedQuestions.filter(fq => fq.oa === oa.oa);
            const questionsHtml = relatedQuestions.length > 0
                ? `<ul>${relatedQuestions.map(fq => `<li><strong>P${fq.question_number}</strong> (${fq.errorRate}% error): ${fq.questionText}</li>`).join('')}</ul>`
                : '<p>Sin preguntas espec&#237;ficas asociadas.</p>';

            return `
                <div class="oa-section">
                    <h2>${oa.oa}: ${oa.topic}</h2>
                    <div class="badge ${oa.status === 'low' ? 'badge-danger' : 'badge-warning'}">${oa.percentage}% de logro</div>
                    <h3>Preguntas cr&#237;ticas</h3>
                    ${questionsHtml}
                    <h3>Ejercicios sugeridos de reforzamiento</h3>
                    <ol>
                        <li>Revisa con los estudiantes las preguntas falladas y analiza los distractores.</li>
                        <li>Realiza una actividad grupal de 15 min centrada en ${oa.topic}.</li>
                        <li>Aplica una evaluaci&#243;n formativa breve (3-5 preguntas) sobre ${oa.oa} antes de avanzar.</li>
                        <li>Usa ejemplos cotidianos vinculados a ${oa.topic} para reforzar la comprensi&#243;n.</li>
                    </ol>
                </div>`;
        }).join('');

        const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Gu&#237;a de Reforzamiento - ${selectedEval.title}</title>
<style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 32px; color: #1e293b; }
    h1 { color: #4f46e5; border-bottom: 3px solid #4f46e5; padding-bottom: 8px; }
    h2 { color: #334155; margin-top: 28px; }
    h3 { color: #475569; font-size: 14px; margin-top: 16px; }
    .meta { color: #64748b; font-size: 13px; margin-bottom: 24px; }
    .oa-section { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
    .badge { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: bold; }
    .badge-danger { background: #fef2f2; color: #dc2626; border: 1px solid #fca5a5; }
    .badge-warning { background: #fffbeb; color: #d97706; border: 1px solid #fcd34d; }
    ul, ol { line-height: 1.8; }
    .footer { text-align: center; color: #94a3b8; font-size: 11px; margin-top: 40px; }
    @media print { body { padding: 16px; } button { display: none; } }
</style>
</head>
<body>
    <div style="text-align:right;margin-bottom:16px;">
        <button onclick="window.print()" style="padding:8px 20px;background:#4f46e5;color:white;border:none;border-radius:8px;cursor:pointer;font-weight:bold;">Imprimir / PDF</button>
    </div>
    <h1>Gu&#237;a de Reforzamiento</h1>
    <div class="meta">
        <strong>${selectedEval.title}</strong> &bull; ${selectedEval.subject} &bull; ${selectedEval.grade}<br/>
        ${weakOAs.length} objetivo(s) con rendimiento bajo o medio &bull; ${totalStudents} estudiantes evaluados
    </div>
    ${oaSections}
    <div class="footer">Generado por EducMark &bull; ${new Date().toLocaleDateString('es-CL')} &bull; Documento para uso del docente</div>
</body>
</html>`;

        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Guia_Reforzamiento_${selectedEval.subject.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.html`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 3000);
        toast.success('Guía de reforzamiento descargada.');
    };

    // ---- Render ----

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl md:text-5xl font-bold mb-3 text-[var(--on-background)] tracking-tight">
                        Retroalimentación <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)]">Docente</span>
                    </h1>
                    <p className="text-[var(--muted)] text-lg max-w-2xl leading-relaxed">
                        Análisis inteligente de resultados y sugerencias pedagógicas.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Export Buttons */}
                    {selectedEvalId && results.length > 0 && (
                        <>
                            {/* AN-16: Remediation Guide */}
                            <button
                                onClick={handleDownloadRemediationGuide}
                                className="flex items-center gap-2 px-4 py-2.5 bg-[var(--card)] border border-[var(--border)] text-[var(--on-background)] rounded-xl font-semibold text-sm shadow-sm hover:bg-[var(--card-hover)] transition-all"
                            >
                                <FileText size={16} />
                                Guía Reforzamiento
                            </button>

                            <button
                                onClick={handleExportPresentation}
                                disabled={exportingSlides}
                                className="flex items-center gap-2 px-4 py-2.5 bg-[var(--card)] border border-[var(--border)] text-[var(--on-background)] rounded-xl font-semibold text-sm shadow-sm hover:bg-[var(--card-hover)] transition-all disabled:opacity-50"
                            >
                                {exportingSlides ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <Presentation size={16} />
                                )}
                                {exportingSlides ? 'Generando...' : 'Descargar Presentación'}
                            </button>

                            <button
                                onClick={handleExportPDF}
                                disabled={exporting}
                                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[var(--primary)] to-indigo-600 text-white rounded-xl font-semibold text-sm shadow-lg hover:shadow-indigo-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                            >
                                {exporting ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <Download size={16} />
                                )}
                                {exporting ? 'Generando...' : 'Exportar PDF'}
                            </button>

                            {/* AN-04: Enviar a Apoderado */}
                            <button
                                onClick={handleSendToGuardian}
                                className="flex items-center gap-2 px-4 py-2.5 bg-[var(--card)] border border-[var(--border)] text-[var(--on-background)] rounded-xl font-semibold text-sm shadow-sm hover:bg-[var(--card-hover)] transition-all"
                            >
                                <Mail size={16} />
                                Enviar a Apoderado
                            </button>

                            {/* AN-20: Email semanal */}
                            <button
                                onClick={handleWeeklyEmail}
                                className="flex items-center gap-2 px-4 py-2.5 bg-[var(--card)] border border-[var(--border)] text-[var(--on-background)] rounded-xl font-semibold text-sm shadow-sm hover:bg-[var(--card-hover)] transition-all"
                            >
                                <Send size={16} />
                                Resumen Semanal
                            </button>
                        </>
                    )}

                    {/* Evaluation Selector */}
                    <div className="relative">
                        <button
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            className="px-4 py-2.5 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm text-[var(--on-background)] flex items-center gap-3 hover:bg-[var(--card-hover)] transition-colors min-w-[280px] justify-between"
                        >
                            <div className="flex items-center gap-2 truncate">
                                <FileText size={16} className="text-[var(--primary)] flex-shrink-0" />
                                <span className="truncate text-sm font-medium">{selectedEval?.title || 'Seleccionar evaluación'}</span>
                            </div>
                            <ChevronDown size={16} className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        <AnimatePresence>
                            {dropdownOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -5 }}
                                    className="absolute right-0 top-full mt-2 w-full bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl"
                                >
                                    {evaluations.map(ev => (
                                        <button
                                            key={ev.id}
                                            onClick={() => { setSelectedEvalId(ev.id); setDropdownOpen(false); }}
                                            className={`w-full text-left px-4 py-3 hover:bg-[var(--card-hover)] transition-colors flex flex-col gap-0.5 ${ev.id === selectedEvalId ? 'bg-[var(--primary)]/5 border-l-2 border-[var(--primary)]' : ''}`}
                                        >
                                            <span className="text-sm font-medium text-[var(--on-background)] truncate">{ev.title}</span>
                                            <span className="text-[10px] text-[var(--muted)]">{ev.grade} • {ev.subject} • {new Date(ev.created_at).toLocaleDateString('es-CL')}</span>
                                        </button>
                                    ))}
                                    {evaluations.length === 0 && (
                                        <div className="px-4 py-3 text-sm text-[var(--muted)]">No hay evaluaciones disponibles</div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* QuickScan banner: visible whenever the user has any scan_type='quick' results */}
            {quickScanCount > 0 && (
                <Link
                    href="/dashboard/feedback/quickscan"
                    className="block group"
                >
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-card-premium p-4 md:p-5 border-cyan-500/25 bg-linear-to-r from-cyan-500/5 to-violet-500/5 relative overflow-hidden"
                    >
                        <div className="absolute -right-10 -top-10 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
                        <div className="relative flex items-center justify-between gap-4 flex-wrap">
                            <div className="flex items-center gap-4 min-w-0">
                                <div className="w-12 h-12 rounded-xl bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center text-cyan-400 shrink-0">
                                    <Zap size={22} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm md:text-base font-bold text-[var(--on-background)]">
                                        Tienes {quickScanCount} correcci{quickScanCount === 1 ? 'ón' : 'ones'} rápida{quickScanCount === 1 ? '' : 's'} con QuickScan
                                    </p>
                                    <p className="text-xs md:text-sm text-[var(--muted)] mt-0.5">
                                        Hojas escaneadas con Corrección Rápida OMR. Mira el análisis agrupado por pauta y día.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-sm font-semibold group-hover:bg-cyan-500/20 transition-colors">
                                Ver QuickScan Feedback
                                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                            </div>
                        </div>
                    </motion.div>
                </Link>
            )}

            {/* Loading / Empty State */}
            {loading ? (
                <div className="glass-card-premium p-12 flex justify-center">
                    <div className="w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : !selectedEvalId ? (
                <div className="glass-card-premium p-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
                        <BarChart3 size={28} className="text-[var(--primary)]" />
                    </div>
                    <h3 className="text-lg font-bold text-[var(--on-background)] mb-2">Sin evaluaciones</h3>
                    <p className="text-[var(--muted)]">Genera una evaluación sumativa y escanea las hojas de respuesta para ver el análisis aquí.</p>
                </div>
            ) : results.length === 0 ? (
                <div className="glass-card-premium p-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/10 flex items-center justify-center">
                        <Users size={28} className="text-amber-400" />
                    </div>
                    <h3 className="text-lg font-bold text-[var(--on-background)] mb-2">Sin resultados escaneados</h3>
                    <p className="text-[var(--muted)] max-w-md mx-auto">
                        Aún no hay hojas de respuesta escaneadas para "{selectedEval?.title}". Usa el Escáner OMR para cargar resultados.
                    </p>
                </div>
            ) : (
                <>
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card-premium p-6 flex flex-col items-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-3 opacity-5"><TrendingUp size={60} /></div>
                            <span className="text-[var(--muted)] mb-2 font-medium text-sm">Promedio del Curso</span>
                            <div className="text-5xl font-bold text-[var(--primary)]">{averageGrade}</div>
                            <span className="text-xs text-[var(--muted)] mt-2">{averagePercentage}% logro</span>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card-premium p-6 flex flex-col items-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-3 opacity-5"><Users size={60} /></div>
                            <span className="text-[var(--muted)] mb-2 font-medium text-sm">Logro General</span>
                            <div className="text-5xl font-bold text-[var(--on-background)]">{passRate}%</div>
                            <span className="text-xs text-[var(--muted)] mt-2">{passCount}/{totalStudents} Estudiantes Aprobados</span>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card-premium p-6 flex flex-col items-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-3 opacity-5"><AlertCircle size={60} /></div>
                            <span className="text-[var(--muted)] mb-2 font-medium text-sm">OA Crítico</span>
                            {criticalOA ? (
                                <>
                                    <div className="text-xl font-bold text-[var(--danger)] text-center">{criticalOA.oa}</div>
                                    <span className="text-xs text-[var(--muted)] mt-1 text-center">{criticalOA.topic} ({criticalOA.percentage}%)</span>
                                </>
                            ) : (
                                <>
                                    <div className="text-xl font-bold text-[var(--muted)]">—</div>
                                    <span className="text-xs text-[var(--muted)] mt-1">Sin datos de blueprint</span>
                                </>
                            )}
                        </motion.div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Dominio por Objetivo (Semáforo) */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card-premium p-6">
                            <h3 className="text-lg font-bold text-[var(--on-background)] mb-6 flex items-center gap-2">
                                <Activity className="text-[var(--primary)]" />
                                Dominio por Objetivo
                            </h3>

                            {oaMastery.length > 0 ? (
                                <div className="space-y-5">
                                    {oaMastery.map((item, idx) => (
                                        <motion.div
                                            key={item.oa}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.3 + idx * 0.05 }}
                                            className="flex flex-col gap-2"
                                        >
                                            <div className="flex justify-between text-sm">
                                                <span className="font-medium text-[var(--foreground)]">{item.oa}: {item.topic}</span>
                                                <span className={`font-bold ${item.status === 'high' ? 'text-[var(--success)]' : item.status === 'medium' ? 'text-[var(--warning)]' : 'text-[var(--danger)]'}`}>
                                                    {item.percentage}%
                                                </span>
                                            </div>
                                            <div className="w-full h-2.5 bg-[var(--border)] rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${item.percentage}%` }}
                                                    transition={{ duration: 1, delay: 0.5 + idx * 0.1 }}
                                                    className={`h-full rounded-full ${item.status === 'high' ? 'bg-[var(--success)]' : item.status === 'medium' ? 'bg-[var(--warning)]' : 'bg-[var(--danger)]'}`}
                                                />
                                            </div>

                                            {/* RAG Remedial Trigger */}
                                            {(item.status === 'low' || item.status === 'medium') && (
                                                <div className="flex justify-end mt-1 gap-2">
                                                    {/* AN-15: RAG Remediation via assessment-api */}
                                                    <button
                                                        onClick={async () => {
                                                            try {
                                                                const res = await assessmentFetch(`${API_BASE_URL}/api/v1/feedback/remediation/${selectedEvalId}?oa=${encodeURIComponent(item.oa)}`);
                                                                if (res.ok) {
                                                                    const data = await res.json();
                                                                    if (data?.guide) {
                                                                        handleGenerateRemedial(item.oa, item.topic);
                                                                    } else {
                                                                        toast.info('Remediación RAG aún no disponible para este OA.');
                                                                    }
                                                                } else {
                                                                    toast.info('Endpoint de remediación RAG no disponible. Usando generación estándar.');
                                                                    handleGenerateRemedial(item.oa, item.topic);
                                                                }
                                                            } catch {
                                                                toast.info('Endpoint RAG no disponible. Usando plan remedial estándar.');
                                                                handleGenerateRemedial(item.oa, item.topic);
                                                            }
                                                        }}
                                                        className="text-[10px] font-bold px-2 py-1 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 rounded-md border border-amber-500/20 transition-colors flex items-center gap-1"
                                                    >
                                                        <Sparkles size={12} />
                                                        Remediar RAG
                                                    </button>
                                                    <button
                                                        onClick={() => handleGenerateRemedial(item.oa, item.topic)}
                                                        className="text-[10px] font-bold px-2 py-1 bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20 rounded-md border border-[var(--primary)]/20 transition-colors flex items-center gap-1"
                                                    >
                                                        <BrainCircuit size={12} />
                                                        Generar Plan Remedial
                                                    </button>
                                                </div>
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-[var(--muted)] text-sm">Sin datos de blueprint. Genera una nueva evaluación para obtener el análisis por OA.</p>
                                </div>
                            )}
                        </motion.div>

                        {/* Análisis Pedagógico */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card-premium p-6 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <BrainCircuit size={120} className="text-[var(--primary)]" />
                            </div>

                            <h3 className="text-lg font-bold text-[var(--on-background)] mb-6 flex items-center gap-2 relative z-10">
                                <BrainCircuit className="text-[var(--primary)]" />
                                Análisis Pedagógico
                            </h3>

                            <div className="space-y-4 relative z-10">
                                {oaMastery.length > 0 ? (
                                    <>
                                        {/* Fortaleza — highest OA */}
                                        {oaMastery.length > 0 && (() => {
                                            const strongest = oaMastery[oaMastery.length - 1];
                                            return (
                                                <div className="bg-[var(--card)]/50 p-4 rounded-xl border border-[var(--border)] backdrop-blur-sm">
                                                    <h4 className="text-sm font-bold text-[var(--primary)] mb-1 flex items-center gap-2">
                                                        <CheckCircle size={14} /> Fortaleza Detectada
                                                    </h4>
                                                    <p className="text-sm text-[var(--foreground)] leading-relaxed">
                                                        El curso demuestra buen dominio en <strong className="text-[var(--on-background)]">{strongest.topic}</strong> ({strongest.oa}) con un {strongest.percentage}% de logro.
                                                    </p>
                                                </div>
                                            );
                                        })()}

                                        {/* Brecha — lowest OA */}
                                        {criticalOA && criticalOA.percentage < 70 && (
                                            <div className="bg-red-500/10 p-4 rounded-xl border border-red-500/20 backdrop-blur-sm">
                                                <h4 className="text-sm font-bold text-[var(--danger)] mb-1 flex items-center gap-2">
                                                    <AlertCircle size={14} /> Brecha Crítica
                                                </h4>
                                                <p className="text-sm text-[var(--foreground)] leading-relaxed">
                                                    Se detecta bajo rendimiento en <strong className="text-[var(--on-background)]">{criticalOA.topic}</strong> ({criticalOA.oa}) con solo {criticalOA.percentage}% de logro. Se recomienda reforzar este objetivo antes de avanzar.
                                                </p>
                                            </div>
                                        )}

                                        {/* Sugerencia */}
                                        <div className="bg-green-500/10 p-4 rounded-xl border border-green-500/20 backdrop-blur-sm">
                                            <h4 className="text-sm font-bold text-[var(--success)] mb-1 flex items-center gap-2">
                                                <Sparkles size={14} /> Sugerencia Remedial
                                            </h4>
                                            <p className="text-sm text-[var(--foreground)] leading-relaxed">
                                                {passRate >= 70
                                                    ? `El curso presenta un buen nivel general (${passRate}% aprobación). Enfocarse en el refuerzo individual de los ${totalStudents - passCount} estudiantes con bajo rendimiento.`
                                                    : `Con ${passRate}% de aprobación, se sugiere realizar una sesión de retroalimentación grupal centrada en ${criticalOA?.topic || 'los objetivos con menor logro'} antes de continuar con nuevos contenidos.`
                                                }
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-8">
                                        <BrainCircuit size={40} className="text-[var(--muted)] mx-auto mb-3 opacity-30" />
                                        <p className="text-[var(--muted)] text-sm">El análisis pedagógico se genera automáticamente cuando hay datos de blueprint vinculados a la evaluación.</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                        {/* Preguntas Falladas */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="glass-card-premium p-6">
                            <h3 className="text-lg font-bold text-[var(--on-background)] mb-6 flex items-center gap-2">
                                <AlertCircle className="text-rose-400" />
                                Top Preguntas Falladas
                            </h3>

                            {failedQuestions.length > 0 ? (
                                <div className="space-y-4">
                                    {failedQuestions.map((fq, idx) => (
                                        <motion.div
                                            key={`fq-${fq.question_number}`}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.5 + idx * 0.05 }}
                                            className="p-4 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl relative overflow-hidden group hover:border-red-500/30 transition-colors"
                                        >
                                            <div className="absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-b from-rose-500 to-red-600"></div>

                                            <div className="pl-3">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="text-xs font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                                                        Pregunta {fq.question_number}
                                                    </span>
                                                    <span className="text-xs font-bold text-[var(--muted)] bg-[var(--card)] px-2 py-0.5 rounded border border-[var(--border)]">
                                                        {fq.errorRate}% Fallo
                                                    </span>
                                                </div>
                                                <p className="text-sm font-medium text-[var(--on-background)] mb-2 line-clamp-2" title={fq.questionText}>
                                                    {fq.questionText}
                                                </p>
                                                <div className="flex justify-between items-center text-xs text-[var(--muted)]">
                                                    <span className="truncate pr-4 border-r border-[var(--border)]">{fq.oa}</span>
                                                    <span className="pl-4 font-medium text-rose-300">
                                                        {fq.errors} de {totalStudents} alumnos erraron
                                                    </span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-[var(--muted)] text-sm">Aún no hay suficientes datos para determinar preguntas críticas.</p>
                                </div>
                            )}
                        </motion.div>

                        {/* Analysis Context Panel */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.48 }} className="glass-card-premium p-6 flex flex-col justify-center text-center">
                            <div className="w-16 h-16 mx-auto mb-6 bg-indigo-500/10 border border-indigo-500/20 rounded-full flex items-center justify-center">
                                <FileText size={28} className="text-indigo-400" />
                            </div>
                            <h4 className="text-xl font-bold text-[var(--on-background)] mb-4">¿Por qué fallan estas preguntas?</h4>
                            <p className="text-sm text-[var(--muted)] mb-6 leading-relaxed max-w-sm mx-auto">
                                El sistema correlaciona los patrones de error para determinar si corresponden a debilidades en la <strong>comprensión lectora</strong>, el <strong>razonamiento crítico</strong> o una confusión generalizada debido a <strong>distractores plausibles</strong>.
                            </p>
                            <button className="px-6 py-3 bg-[var(--input-bg)] border border-[var(--border)] hover:border-indigo-500/50 rounded-xl text-sm font-semibold text-[var(--on-background)] hover:text-indigo-400 transition-all flex items-center justify-center gap-2 mx-auto">
                                <Sparkles size={16} /> Ver Análisis Profundo
                            </button>
                        </motion.div>
                    </div>

                    {/* ── Class Insights (AI-Generated) ── */}
                    <ClassInsights evaluationId={selectedEvalId} />

                    {/* ── OA Evolution (Comparison) ── */}
                    <OAEvolution evaluationId={selectedEvalId} />

                    {/* Detalle de Estudiantes */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card-premium overflow-hidden">
                        <div className="p-5 border-b border-[var(--border)] flex items-center justify-between">
                            <h3 className="text-lg font-bold text-[var(--on-background)] flex items-center gap-2">
                                <Users size={20} className="text-[var(--primary)]" />
                                Detalle por Estudiante
                            </h3>
                            <span className="text-xs text-[var(--muted)] bg-[var(--card)] px-3 py-1 rounded-full border border-[var(--border)]">
                                {totalStudents} {totalStudents === 1 ? 'estudiante' : 'estudiantes'}
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-[var(--card)]/80 border-b border-[var(--border)]">
                                    <tr>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Estudiante</th>
                                        <th className="px-5 py-3 text-center text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Correctas</th>
                                        <th className="px-5 py-3 text-center text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Incorrectas</th>
                                        <th className="px-5 py-3 text-center text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">En Blanco</th>
                                        <th className="px-5 py-3 text-center text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Logro</th>
                                        <th className="px-5 py-3 text-center text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border)]">
                                    {results.map((r, idx) => (
                                        <motion.tr
                                            key={r.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.5 + idx * 0.03 }}
                                            className="hover:bg-[var(--card-hover)] transition-colors"
                                        >
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-md flex-shrink-0">
                                                        {r.student_name ? r.student_name.charAt(0).toUpperCase() : '?'}
                                                    </div>
                                                    <span className="font-medium text-[var(--on-background)]">{r.student_name || `Estudiante ${idx + 1}`}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 text-center">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                    {r.score.correct}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-center">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                                                    {r.score.incorrect}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-center">
                                                <span className="text-xs text-[var(--muted)]">{r.score.blank}</span>
                                            </td>
                                            <td className="px-5 py-3.5 text-center">
                                                <span className={`text-sm font-bold ${r.score.percentage >= 60 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                    {r.score.percentage}%
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-center">
                                                {r.score.percentage >= 60 ? (
                                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
                                                        <CheckCircle size={12} /> Aprobado
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-red-400 bg-red-500/10 px-2 py-1 rounded-md border border-red-500/20">
                                                        <XCircle size={12} /> Reprobado
                                                    </span>
                                                )}
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>

                    {/* ── Puente a Portafolio Carrera Docente ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.55 }}
                        className="glass-card-premium p-6 md:p-8 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-[var(--primary)]/10 to-[var(--secondary)]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                        <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6 justify-between">
                            <div className="flex-1">
                                <span className="inline-flex items-center gap-2 py-1 px-3 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-[10px] font-bold uppercase tracking-wider border border-[var(--primary)]/25 mb-3">
                                    Carrera Docente
                                </span>
                                <h3 className="text-xl md:text-2xl font-bold text-[var(--on-background)] mb-2">
                                    Estos resultados son evidencia para tu Portafolio
                                </h3>
                                <p className="text-sm text-[var(--muted)] leading-relaxed max-w-xl">
                                    La Tarea 2 del Portafolio pide análisis de evaluación y decisiones
                                    pedagógicas a partir de datos. Con un click, pre-llenamos tu borrador
                                    usando los resultados OMR, indicadores y habilidades de esta prueba.
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    if (selectedEvalId) {
                                        window.location.href = `/dashboard/portfolio?evaluation_id=${selectedEvalId}`;
                                    } else {
                                        window.location.href = `/dashboard/portfolio`;
                                    }
                                }}
                                className="btn-gradient px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all hover:scale-105 w-full md:w-auto justify-center"
                            >
                                <FileText size={16} />
                                Usar en mi Portafolio
                            </button>
                        </div>
                    </motion.div>
                </>
            )}

            {/* Modal de Nivelación RAG */}
            <AnimatePresence>
                {remedialModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-[var(--card)] border border-[var(--border)] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
                        >
                            <div className="p-6 border-b border-[var(--border)] flex justify-between items-center bg-[var(--background)]">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-[var(--primary)]/10 rounded-lg">
                                        <BrainCircuit className="text-[var(--primary)]" size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-[var(--on-background)]">Plan de Nivelación</h2>
                                        <p className="text-xs text-[var(--muted)]">Generado para {selectedOARemedial}</p>
                                    </div>
                                </div>
                                <button onClick={() => setRemedialModalOpen(false)} className="text-[var(--muted)] hover:text-[var(--on-background)] transition-colors">
                                    <XCircle size={24} />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto flex-1">
                                {remedialLoading ? (
                                    <div className="flex flex-col items-center justify-center py-12">
                                        <Loader2 className="w-12 h-12 text-[var(--primary)] animate-spin mb-4" />
                                        <p className="text-[var(--on-background)] font-medium">Buscando recursos en la base de conocimientos...</p>
                                        <p className="text-[var(--muted)] text-sm mt-2 text-center max-w-sm">EducMark está analizando el objetivo {selectedOARemedial} midiendo los errores conceptuales del curso para construir un set de ejercicios focalizado.</p>
                                    </div>
                                ) : remedialData ? (
                                    <div className="prose prose-sm prose-invert max-w-none text-[var(--on-background)]">
                                        <div dangerouslySetInnerHTML={{ __html: remedialData.guide.replace(/\n/g, '<br/>') }} />

                                        <div className="mt-8 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl relative overflow-hidden">
                                            <div className="absolute top-0 right-0 p-2 opacity-10"><AlertCircle size={40} /></div>
                                            <h4 className="text-sm font-bold text-amber-400 mb-2 flex items-center gap-2">
                                                <Sparkles size={16} /> Intervención Sugerida
                                            </h4>
                                            <p className="text-sm text-[var(--muted)]">Le recomendamos agendar una sesión de 20 minutos al bloque siguiente, enfocándose exclusivamente en este material antes de proceder a la siguiente unidad formativa.</p>
                                        </div>
                                    </div>
                                ) : null}
                            </div>

                            <div className="p-4 border-t border-[var(--border)] bg-[var(--input-bg)] flex justify-end gap-3">
                                <button onClick={() => setRemedialModalOpen(false)} className="px-4 py-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--on-background)] transition-colors">
                                    Cerrar
                                </button>
                                <button
                                    disabled={remedialLoading}
                                    onClick={handlePrintRemedial}
                                    className="btn-gradient px-4 py-2 text-sm font-bold rounded-lg flex items-center gap-2 disabled:opacity-50"
                                >
                                    <Download size={16} /> Exportar PDF
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
