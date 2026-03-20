'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BookOpen, Target, TrendingUp, AlertCircle, Award,
    ChevronDown, ChevronUp, ExternalLink, CheckCircle2,
    Clock, MessageSquare, User,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { CurriculumCoverage } from './CurriculumCoverage';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface EvaluationRow {
    id: string;
    grade: string | null;
    subject: string | null;
}

interface OMRResultRow {
    evaluation_id: string;
    answers: {
        tf: (string | null)[];
        mc: (string | null)[];
    };
    score: {
        percentage: number;
        correct: number;
        total: number;
    };
}

interface BlueprintRow {
    evaluation_id: string;
    question_number: number;
    question_type: string;
    oa: string | null;
    topic: string | null;
    correct_answer: string | null;
}

interface DashboardMetrics {
    coveragePct: number;
    avgAchievement: number;
    alertsCount: number;
    totalEvaluations: number;
    levelPerformance: Array<{ level: string; percentage: number }>;
    criticalOAs: Array<{ label: string; percentage: number; oa: string; topic: string }>;
}

interface PlanningBlocks {
    objective: string;
    indicators: string[];
    inicio: string;
    desarrollo: string;
    cierre: string;
    resources: string[];
}

interface ExitTicketQuestion {
    id: number;
    type: string;
    question: string;
    options?: string[];
}

interface ExitTicket {
    title: string;
    instructions: string;
    questions: ExitTicketQuestion[];
}

interface PlanningApprovalRow {
    id: string;
    generated_class_id: string;
    submitted_by: string;
    status: 'pending' | 'approved' | 'changes_requested';
    reviewer_comment: string | null;
    reviewed_at: string | null;
    created_at: string;
    generated_classes: {
        id: string;
        topic: string | null;
        objetivo_clase: string | null;
        asignatura: string | null;
        curso: string | null;
        current_version: number | null;
        planning_blocks: PlanningBlocks | null;
        exit_ticket: ExitTicket | null;
    } | null;
    submitter_name?: string;
}

type ApprovalFilter = 'all' | 'pending' | 'approved' | 'changes_requested';

const DEFAULT_METRICS: DashboardMetrics = {
    coveragePct: 0,
    avgAchievement: 0,
    alertsCount: 0,
    totalEvaluations: 0,
    levelPerformance: [],
    criticalOAs: [],
};

export const UTPDashboard: React.FC = () => {
    const supabase = createClient();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [metrics, setMetrics] = useState<DashboardMetrics>(DEFAULT_METRICS);
    const [allApprovals, setAllApprovals] = useState<PlanningApprovalRow[]>([]);
    const [reviewingId, setReviewingId] = useState<string | null>(null);
    const [reviewComments, setReviewComments] = useState<Record<string, string>>({});
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [approvalFilter, setApprovalFilter] = useState<ApprovalFilter>('pending');

    useEffect(() => {
        const loadMetrics = async () => {
            setLoading(true);
            try {
                const { data: authData, error: authError } = await supabase.auth.getUser();
                if (authError || !authData?.user?.id) throw authError || new Error('Usuario no autenticado');
                const userId = authData.user.id;

                const { data: myProfile } = await supabase
                    .from('user_profiles')
                    .select('institution')
                    .eq('user_id', userId)
                    .maybeSingle();

                let memberIds = [userId];
                const institution = myProfile?.institution || null;

                if (institution) {
                    const { data: members } = await supabase
                        .from('user_profiles')
                        .select('user_id')
                        .eq('institution', institution);

                    const ids = (members || []).map((m: { user_id: string }) => m.user_id).filter(Boolean);
                    if (ids.length > 0) memberIds = Array.from(new Set(ids));
                }

                const { data: evaluations, error: evalError } = await supabase
                    .from('evaluations')
                    .select('id, grade, subject')
                    .in('user_id', memberIds)
                    .neq('status', 'archived');
                if (evalError) throw evalError;

                const evalRows = (evaluations || []) as EvaluationRow[];
                if (evalRows.length === 0) {
                    setMetrics(DEFAULT_METRICS);
                    return;
                }

                const evaluationIds = evalRows.map(e => e.id);

                const [resultsRes, blueprintRes] = await Promise.all([
                    supabase
                        .from('omr_results')
                        .select('evaluation_id, score, answers')
                        .in('evaluation_id', evaluationIds),
                    supabase
                        .from('evaluation_blueprint')
                        .select('evaluation_id, question_number, question_type, oa, topic, correct_answer')
                        .in('evaluation_id', evaluationIds),
                ]);

                if (resultsRes.error) throw resultsRes.error;
                if (blueprintRes.error) throw blueprintRes.error;

                const results = (resultsRes.data || []) as OMRResultRow[];
                const blueprints = (blueprintRes.data || []) as BlueprintRow[];

                const evalsWithBlueprint = new Set(blueprints.map(b => b.evaluation_id));
                const coveragePct = evalRows.length > 0 ? Math.round((evalsWithBlueprint.size / evalRows.length) * 100) : 0;

                const avgAchievement = results.length > 0
                    ? Math.round(results.reduce((acc, r) => acc + (r.score?.percentage || 0), 0) / results.length)
                    : 0;

                const gradeByEval = new Map(evalRows.map(e => [e.id, e.grade || 'Sin nivel']));
                const levelMap = new Map<string, { total: number; sum: number }>();

                results.forEach((r) => {
                    const level = gradeByEval.get(r.evaluation_id) || 'Sin nivel';
                    const current = levelMap.get(level) || { total: 0, sum: 0 };
                    current.total += 1;
                    current.sum += (r.score?.percentage || 0);
                    levelMap.set(level, current);
                });

                const levelPerformance = Array.from(levelMap.entries())
                    .map(([level, v]) => ({ level, percentage: v.total > 0 ? Math.round(v.sum / v.total) : 0 }))
                    .sort((a, b) => b.percentage - a.percentage)
                    .slice(0, 6);

                const alertsCount = levelPerformance.filter(l => l.percentage < 50).length;

                const resultByEval = new Map<string, OMRResultRow[]>();
                results.forEach((r) => {
                    const arr = resultByEval.get(r.evaluation_id) || [];
                    arr.push(r);
                    resultByEval.set(r.evaluation_id, arr);
                });

                const blueprintByEval = new Map<string, BlueprintRow[]>();
                blueprints.forEach((b) => {
                    const arr = blueprintByEval.get(b.evaluation_id) || [];
                    arr.push(b);
                    blueprintByEval.set(b.evaluation_id, arr);
                });

                const evalMeta = new Map(evalRows.map(e => [e.id, { grade: e.grade || 'Sin nivel', subject: e.subject || 'Sin asignatura' }]));

                const oaStats = new Map<string, { total: number; correct: number; label: string; oa: string; topic: string }>();

                blueprintByEval.forEach((bpRows, evalId) => {
                    const scans = resultByEval.get(evalId) || [];
                    if (scans.length === 0) return;

                    const tfCount = bpRows.filter(b => b.question_type === 'tf').length;
                    const meta = evalMeta.get(evalId);

                    bpRows.forEach((bp) => {
                        const oa = bp.oa || 'OA sin etiqueta';
                        const topic = bp.topic || 'Tema no especificado';
                        const label = `${meta?.subject || 'Asignatura'} - ${meta?.grade || 'Nivel'}`;
                        const key = `${oa}||${topic}||${label}`;
                        const stat = oaStats.get(key) || { total: 0, correct: 0, label, oa, topic };

                        scans.forEach((scan) => {
                            const answersTf = scan.answers?.tf || [];
                            const answersMc = scan.answers?.mc || [];
                            const idx = bp.question_type === 'tf' ? bp.question_number - 1 : bp.question_number - tfCount - 1;
                            const answer = bp.question_type === 'tf' ? answersTf[idx] : answersMc[idx];
                            if (answer) {
                                stat.total += 1;
                                if (bp.correct_answer && answer === bp.correct_answer) {
                                    stat.correct += 1;
                                }
                            }
                        });

                        oaStats.set(key, stat);
                    });
                });

                const criticalOAs = Array.from(oaStats.values())
                    .map((s) => ({
                        label: s.label,
                        oa: s.oa,
                        topic: s.topic,
                        percentage: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0,
                    }))
                    .filter(s => s.percentage > 0)
                    .sort((a, b) => a.percentage - b.percentage)
                    .slice(0, 3);

                setMetrics({
                    coveragePct,
                    avgAchievement,
                    alertsCount,
                    totalEvaluations: evalRows.length,
                    levelPerformance,
                    criticalOAs,
                });
            } catch (err) {
                console.error('Error loading UTP metrics:', err);
                setMetrics(DEFAULT_METRICS);
            } finally {
                setLoading(false);
            }
        };

        loadMetrics();
    }, []);

    useEffect(() => {
        const loadApprovals = async () => {
            try {
                const { data, error } = await supabase
                    .from('planning_approvals')
                    .select(`
                        id,
                        generated_class_id,
                        submitted_by,
                        status,
                        reviewer_comment,
                        reviewed_at,
                        created_at,
                        generated_classes:generated_class_id (
                            id,
                            topic,
                            objetivo_clase,
                            asignatura,
                            curso,
                            current_version,
                            planning_blocks,
                            exit_ticket
                        )
                    `)
                    .order('created_at', { ascending: false })
                    .limit(50);

                if (error) throw error;

                const rows = (data || []) as unknown as PlanningApprovalRow[];

                // Enrich with submitter names
                const uniqueUserIds = [...new Set(rows.map(r => r.submitted_by).filter(Boolean))];
                if (uniqueUserIds.length > 0) {
                    const { data: profiles } = await supabase
                        .from('user_profiles')
                        .select('user_id, full_name')
                        .in('user_id', uniqueUserIds);

                    const nameMap = new Map((profiles || []).map((p: { user_id: string; full_name: string | null }) => [p.user_id, p.full_name]));
                    rows.forEach(r => {
                        r.submitter_name = nameMap.get(r.submitted_by) || 'Docente';
                    });
                }

                setAllApprovals(rows);
            } catch (error) {
                console.error('Error loading planning approvals:', error);
            }
        };

        loadApprovals();
    }, []);

    const filteredApprovals = useMemo(() => {
        if (approvalFilter === 'all') return allApprovals;
        return allApprovals.filter(a => a.status === approvalFilter);
    }, [allApprovals, approvalFilter]);

    const pendingCount = useMemo(() => allApprovals.filter(a => a.status === 'pending').length, [allApprovals]);

    const reviewPlanning = async (approval: PlanningApprovalRow, status: 'approved' | 'changes_requested') => {
        if (status === 'changes_requested' && !(reviewComments[approval.id] || '').trim()) {
            toast.error('Agrega un comentario explicando los cambios necesarios.');
            return;
        }
        setReviewingId(approval.id);
        try {
            const { data: authData, error: authError } = await supabase.auth.getUser();
            if (authError || !authData?.user?.id) throw authError || new Error('Usuario no autenticado');

            const reviewerComment = (reviewComments[approval.id] || '').trim() || null;
            const now = new Date().toISOString();
            const payload = {
                status,
                reviewer_comment: reviewerComment,
                reviewer_id: authData.user.id,
                reviewed_at: now,
            };

            const { error } = await supabase
                .from('planning_approvals')
                .update(payload)
                .eq('id', approval.id);

            if (error) throw error;

            setAllApprovals((prev) =>
                prev.map((item) =>
                    item.id === approval.id
                        ? { ...item, status, reviewer_comment: reviewerComment, reviewed_at: now }
                        : item
                )
            );
            setExpandedId(null);
            toast.success(status === 'approved' ? 'Planificación aprobada.' : 'Cambios solicitados al docente.');
        } catch (error) {
            console.error('Error reviewing planning approval:', error);
            toast.error('No se pudo registrar la revisión.');
        } finally {
            setReviewingId(null);
        }
    };

    const suggestedMessage = useMemo(() => {
        if (metrics.levelPerformance.length === 0) {
            return 'Aún no hay resultados suficientes para generar recomendaciones de intervención.';
        }
        const weakest = [...metrics.levelPerformance].sort((a, b) => a.percentage - b.percentage)[0];
        return `Se recomienda priorizar acompañamiento en ${weakest.level} (logro ${weakest.percentage}%) con foco en evaluación formativa y nivelación por OA.`;
    }, [metrics.levelPerformance]);

    if (loading) {
        return (
            <div className="space-y-6 animate-fade-in pb-12">
                <div className="glass-card-premium p-6 text-[var(--muted)]">Cargando métricas UTP...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in pb-12">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-[var(--on-background)] font-[family-name:var(--font-heading)] tracking-tight">
                    Panel UTP
                </h1>
                <p className="text-[var(--muted)] text-sm md:text-base mt-1">Visión global del rendimiento académico y progreso curricular del establecimiento.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card-premium p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-indigo-500/10 rounded-xl">
                            <BookOpen className="text-indigo-400" />
                        </div>
                        <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded">Actual</span>
                    </div>
                    <div className="text-4xl font-bold text-[var(--on-background)]">{metrics.coveragePct}%</div>
                    <p className="text-sm text-[var(--muted)] mt-2">Cobertura Curricular Promedio</p>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card-premium p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-emerald-500/10 rounded-xl">
                            <Target className="text-emerald-400" />
                        </div>
                    </div>
                    <div className="text-4xl font-bold text-[var(--on-background)]">{metrics.avgAchievement}%</div>
                    <p className="text-sm text-[var(--muted)] mt-2">Logro de Aprendizaje General</p>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card-premium p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-rose-500/10 rounded-xl">
                            <AlertCircle className="text-rose-400" />
                        </div>
                    </div>
                    <div className="text-4xl font-bold text-[var(--on-background)]">{metrics.alertsCount}</div>
                    <p className="text-sm text-[var(--muted)] mt-2">Niveles en Estado de Alerta (&lt; 50%)</p>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card-premium p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-amber-500/10 rounded-xl">
                            <Award className="text-amber-400" />
                        </div>
                    </div>
                    <div className="text-4xl font-bold text-[var(--on-background)]">{metrics.totalEvaluations}</div>
                    <p className="text-sm text-[var(--muted)] mt-2">Evaluaciones Sumativas Registradas</p>
                </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card-premium p-6">
                    <h3 className="text-lg font-bold text-[var(--on-background)] mb-6 flex items-center gap-2">
                        <TrendingUp className="text-[var(--primary)]" />
                        Rendimiento por Nivel
                    </h3>
                    <div className="space-y-4">
                        {metrics.levelPerformance.length === 0 && (
                            <p className="text-sm text-[var(--muted)]">Sin datos suficientes para mostrar rendimiento por nivel.</p>
                        )}
                        {metrics.levelPerformance.map((nivel) => (
                            <div key={nivel.level} className="flex flex-col gap-2">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium text-[var(--foreground)]">{nivel.level}</span>
                                    <span className="font-bold text-[var(--primary)]">{nivel.percentage}% Logro</span>
                                </div>
                                <div className="w-full h-2.5 bg-[var(--border)] rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)]"
                                        style={{ width: `${Math.max(2, nivel.percentage)}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card-premium p-6">
                    <h3 className="text-lg font-bold text-[var(--on-background)] mb-6 flex items-center gap-2">
                        <AlertCircle className="text-rose-400" />
                        OAs Críticos Institucionales
                    </h3>
                    <div className="space-y-4">
                        {metrics.criticalOAs.length === 0 && (
                            <p className="text-sm text-[var(--muted)]">Sin datos de OA críticos para mostrar.</p>
                        )}
                        {metrics.criticalOAs.map((oa, idx) => (
                            <div key={`${oa.oa}-${idx}`} className="p-4 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">{oa.label}</span>
                                    <span className="text-xs font-bold text-[var(--muted)]">{oa.percentage}% Logro</span>
                                </div>
                                <p className="text-sm font-medium text-[var(--on-background)]">{oa.oa}: {oa.topic}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* ── Approval Panel ── */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="glass-card-premium p-6 mt-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <h3 className="text-lg font-bold text-[var(--on-background)] flex items-center gap-2">
                        <MessageSquare className="text-[var(--primary)]" size={20} />
                        Revisión de Planificaciones
                        {pendingCount > 0 && (
                            <span className="ml-2 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                {pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}
                            </span>
                        )}
                    </h3>
                    <div className="flex gap-1 bg-[var(--input-bg)] rounded-xl p-1 border border-[var(--border)]">
                        {([['pending', 'Pendientes'], ['approved', 'Aprobadas'], ['changes_requested', 'Con cambios'], ['all', 'Todas']] as [ApprovalFilter, string][]).map(([key, label]) => (
                            <button
                                key={key}
                                onClick={() => setApprovalFilter(key)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${approvalFilter === key
                                        ? 'bg-[var(--primary)] text-white shadow-md'
                                        : 'text-[var(--muted)] hover:text-[var(--foreground)]'
                                    }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-3">
                    {filteredApprovals.length === 0 && (
                        <div className="text-center py-8">
                            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-[var(--input-bg)] flex items-center justify-center">
                                <CheckCircle2 className="text-emerald-400" size={24} />
                            </div>
                            <p className="text-sm text-[var(--muted)]">
                                {approvalFilter === 'pending' ? 'No hay planificaciones pendientes de revisión.' : 'No hay planificaciones en esta categoría.'}
                            </p>
                        </div>
                    )}

                    <AnimatePresence mode="popLayout">
                        {filteredApprovals.map((approval) => {
                            const isExpanded = expandedId === approval.id;
                            const gc = approval.generated_classes;
                            const blocks = gc?.planning_blocks;
                            const ticket = gc?.exit_ticket;
                            const isPending = approval.status === 'pending';

                            const statusBadge = approval.status === 'approved'
                                ? { label: 'Aprobada', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: <CheckCircle2 size={12} /> }
                                : approval.status === 'changes_requested'
                                    ? { label: 'Cambios', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: <AlertCircle size={12} /> }
                                    : { label: 'Pendiente', cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: <Clock size={12} /> };

                            return (
                                <motion.div
                                    key={approval.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.97 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className={`rounded-xl border bg-[var(--card)]/40 overflow-hidden transition-colors ${isPending ? 'border-amber-500/30' : 'border-[var(--border)]'
                                        }`}
                                >
                                    {/* Header Row */}
                                    <button
                                        type="button"
                                        onClick={() => setExpandedId(isExpanded ? null : approval.id)}
                                        className="w-full flex items-center justify-between gap-3 p-4 hover:bg-[var(--card-hover)]/40 transition-colors text-left"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-9 h-9 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center shrink-0">
                                                <User size={16} className="text-[var(--primary)]" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-[var(--on-background)] text-sm truncate">
                                                    {gc?.topic || gc?.objetivo_clase || 'Clase sin título'}
                                                </p>
                                                <p className="text-xs text-[var(--muted)] truncate">
                                                    {approval.submitter_name || 'Docente'} · {gc?.asignatura || 'Asignatura'} · {gc?.curso || 'Curso'} · v{gc?.current_version || 1}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold border ${statusBadge.cls}`}>
                                                {statusBadge.icon} {statusBadge.label}
                                            </span>
                                            <span className="text-[10px] text-[var(--muted)] hidden sm:block">
                                                {new Date(approval.created_at).toLocaleDateString('es-CL')}
                                            </span>
                                            {isExpanded ? <ChevronUp size={16} className="text-[var(--muted)]" /> : <ChevronDown size={16} className="text-[var(--muted)]" />}
                                        </div>
                                    </button>

                                    {/* Expanded Preview */}
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.25 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="px-4 pb-4 space-y-4 border-t border-[var(--border)]">
                                                    {/* Planning Blocks Preview */}
                                                    {blocks && (
                                                        <div className="mt-4 space-y-3">
                                                            <h4 className="text-xs uppercase tracking-wider font-bold text-[var(--muted)]">Vista previa de la planificación</h4>
                                                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                                                                {(['inicio', 'desarrollo', 'cierre'] as const).map((key) => (
                                                                    <div key={key} className="bg-[var(--input-bg)] rounded-lg p-3 border border-[var(--border)]">
                                                                        <p className="text-[10px] uppercase tracking-wider font-bold text-[var(--primary)] mb-1.5">
                                                                            {key === 'inicio' ? '🟢 Inicio' : key === 'desarrollo' ? '🔵 Desarrollo' : '🟠 Cierre'}
                                                                        </p>
                                                                        <p className="text-xs text-[var(--foreground)] leading-relaxed whitespace-pre-line line-clamp-6">
                                                                            {(blocks as unknown as Record<string, string>)[key] || '(vacío)'}
                                                                        </p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            {blocks.objective && (
                                                                <div className="bg-[var(--input-bg)] rounded-lg p-3 border border-[var(--border)]">
                                                                    <p className="text-[10px] uppercase tracking-wider font-bold text-[var(--muted)] mb-1">Objetivo</p>
                                                                    <p className="text-xs text-[var(--foreground)] leading-relaxed">{blocks.objective}</p>
                                                                </div>
                                                            )}
                                                            {blocks.indicators && blocks.indicators.length > 0 && (
                                                                <div className="flex flex-wrap gap-1.5">
                                                                    {blocks.indicators.filter(Boolean).map((ind, i) => (
                                                                        <span key={i} className="px-2 py-0.5 rounded text-[10px] bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20">
                                                                            {ind}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Exit Ticket Preview */}
                                                    {ticket && ticket.questions && ticket.questions.length > 0 && (
                                                        <div className="bg-[var(--input-bg)] rounded-lg p-3 border border-[var(--border)]">
                                                            <p className="text-[10px] uppercase tracking-wider font-bold text-[var(--muted)] mb-2">🎟️ Ticket de Salida ({ticket.questions.length} preguntas)</p>
                                                            <ul className="space-y-1">
                                                                {ticket.questions.slice(0, 5).map((q, i) => (
                                                                    <li key={i} className="text-xs text-[var(--foreground)]">
                                                                        <span className="font-bold text-[var(--muted)]">{i + 1}.</span>{' '}
                                                                        {q.question || '(Sin enunciado)'}
                                                                        <span className="text-[10px] text-[var(--muted)] ml-1">
                                                                            ({q.type === 'multiple_choice' ? 'SM' : q.type === 'true_false' ? 'V/F' : 'Abierta'})
                                                                        </span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}

                                                    {/* Previous review comment */}
                                                    {approval.reviewer_comment && !isPending && (
                                                        <div className="bg-amber-500/5 rounded-lg p-3 border border-amber-500/20">
                                                            <p className="text-[10px] uppercase tracking-wider font-bold text-amber-400 mb-1">Comentario de revisión</p>
                                                            <p className="text-xs text-amber-100">{approval.reviewer_comment}</p>
                                                            {approval.reviewed_at && (
                                                                <p className="text-[10px] text-[var(--muted)] mt-1">
                                                                    Revisado: {new Date(approval.reviewed_at).toLocaleString('es-CL')}
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Actions */}
                                                    <div className="flex flex-col gap-3">
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => router.push(`/dashboard/kit-result?id=${gc?.id}`)}
                                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-[var(--primary)] bg-[var(--primary)]/10 border border-[var(--primary)]/20 hover:bg-[var(--primary)]/20 transition-colors"
                                                            >
                                                                <ExternalLink size={12} /> Abrir en editor
                                                            </button>
                                                        </div>

                                                        {isPending && (
                                                            <>
                                                                <textarea
                                                                    value={reviewComments[approval.id] || ''}
                                                                    onChange={(e) => setReviewComments((prev) => ({ ...prev, [approval.id]: e.target.value }))}
                                                                    className="w-full min-h-[70px] bg-[var(--input-bg)] border border-[var(--border)] rounded-lg p-2.5 text-sm placeholder:text-[var(--muted)]"
                                                                    placeholder="Comentario de revisión (requerido para solicitar cambios)"
                                                                />
                                                                <div className="flex flex-wrap justify-end gap-2">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => reviewPlanning(approval, 'changes_requested')}
                                                                        disabled={reviewingId === approval.id}
                                                                        className="px-4 py-2 rounded-lg text-sm font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 disabled:opacity-50 transition-colors"
                                                                    >
                                                                        Solicitar cambios
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => reviewPlanning(approval, 'approved')}
                                                                        disabled={reviewingId === approval.id}
                                                                        className="px-4 py-2 rounded-lg text-sm font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 disabled:opacity-50 transition-colors"
                                                                    >
                                                                        ✓ Aprobar planificación
                                                                    </button>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </motion.div>

            {/* Curriculum Coverage — PL-05 */}
            <CurriculumCoverage />

            {/* Suggested Actions */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="glass-card-premium p-6 mt-6">
                <h3 className="text-lg font-bold text-[var(--on-background)] mb-4">Próximos Pasos (IA Sugerida)</h3>
                <p className="text-[var(--muted)] text-sm mb-4">{suggestedMessage}</p>
                <button className="px-4 py-2 bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20 border border-[var(--primary)]/20 rounded-lg text-sm font-semibold transition-colors">
                    Generar Plan de Intervención UTP
                </button>
            </motion.div>
        </div>
    );
};
