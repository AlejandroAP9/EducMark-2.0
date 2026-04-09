'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    Users,
    TrendingUp,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Copy,
    Sparkles,
    ClipboardCheck,
    ChevronRight,
    BookOpen,
    Calendar,
    MessageSquare,
    BarChart3,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { calculateGrade, DEFAULT_SCALE } from '@/shared/lib/gradeCalculator';
import { answerKeyFingerprint } from '../../lib/quickScanFingerprint';
import { toast } from 'sonner';
import type { CorrectAnswers } from '../../types/omrScanner';

// ──────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────

interface OMRScore {
    correct: number;
    incorrect: number;
    blank: number;
    total: number;
    percentage: number;
}

interface OMRResultRow {
    id: string;
    user_id: string;
    scan_type: string;
    student_name: string | null;
    answers: { tf: (string | null)[]; mc: (string | null)[] };
    score: OMRScore;
    answer_key: CorrectAnswers | null;
    captured_at: string;
    // All QuickScan-specific fields live in metadata (student_id, title, grade,
    // mc_options, fingerprint, name_image, debug_info) because the base
    // omr_results table lacks those columns.
    metadata: {
        title?: string | null;
        grade?: string | null;
        mc_options?: number | null;
        fingerprint?: string | null;
        name_image?: string | null;
        student_id?: string | null;
        debug_info?: string | null;
    } | null;
}

interface QuickScanGroup {
    fingerprint: string;
    title: string;
    grade: string;
    dayBucket: string; // "2026-04-08"
    dayLabel: string; // "8 abr"
    rows: OMRResultRow[];
    answerKey: CorrectAnswers;
}

// ──────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────

function dayKey(iso: string): string {
    return iso.slice(0, 10);
}

function dayLabel(iso: string): string {
    try {
        const d = new Date(iso);
        return d.toLocaleDateString('es-CL', {
            day: 'numeric',
            month: 'short',
            year:
                d.getFullYear() !== new Date().getFullYear()
                    ? 'numeric'
                    : undefined,
        });
    } catch {
        return iso.slice(0, 10);
    }
}

/** Agrupa escaneos QuickScan por fingerprint + dia del año (no ventana deslizante). */
function groupScans(rows: OMRResultRow[]): QuickScanGroup[] {
    const map = new Map<string, QuickScanGroup>();
    for (const row of rows) {
        const fp =
            row.metadata?.fingerprint || answerKeyFingerprint(row.answer_key);
        const day = dayKey(row.captured_at);
        const key = `${fp}::${day}`;
        if (!map.has(key)) {
            map.set(key, {
                fingerprint: fp,
                title: row.metadata?.title || 'Correccion Rapida',
                grade: row.metadata?.grade || '',
                dayBucket: day,
                dayLabel: dayLabel(row.captured_at),
                rows: [],
                answerKey: row.answer_key || { tf: [], mc: [] },
            });
        }
        map.get(key)!.rows.push(row);
    }
    // Sort groups: most recent first
    return Array.from(map.values()).sort((a, b) =>
        b.dayBucket.localeCompare(a.dayBucket)
    );
}

/** Compute per-question failure counts across all rows in a group. */
function computeFailureRanking(group: QuickScanGroup): Array<{
    section: 'tf' | 'mc';
    index: number;
    wrong: number;
    blank: number;
    total: number;
    correctAnswer: string;
}> {
    const tfLen = group.answerKey.tf?.length || 0;
    const mcLen = group.answerKey.mc?.length || 0;
    const stats: Array<{
        section: 'tf' | 'mc';
        index: number;
        wrong: number;
        blank: number;
        total: number;
        correctAnswer: string;
    }> = [];

    for (let i = 0; i < tfLen; i++) {
        let wrong = 0;
        let blank = 0;
        for (const row of group.rows) {
            const ans = row.answers?.tf?.[i] ?? null;
            if (ans == null) blank++;
            else if (ans !== group.answerKey.tf[i]) wrong++;
        }
        stats.push({
            section: 'tf',
            index: i,
            wrong,
            blank,
            total: group.rows.length,
            correctAnswer: group.answerKey.tf[i] || '-',
        });
    }
    for (let i = 0; i < mcLen; i++) {
        let wrong = 0;
        let blank = 0;
        for (const row of group.rows) {
            const ans = row.answers?.mc?.[i] ?? null;
            if (ans == null) blank++;
            else if (ans !== group.answerKey.mc[i]) wrong++;
        }
        stats.push({
            section: 'mc',
            index: i,
            wrong,
            blank,
            total: group.rows.length,
            correctAnswer: group.answerKey.mc[i] || '-',
        });
    }
    return stats.sort((a, b) => b.wrong + b.blank - (a.wrong + a.blank));
}

/** Per-student: list of questions failed + blank. */
function studentErrors(row: OMRResultRow, key: CorrectAnswers) {
    const wrong: Array<{ section: 'tf' | 'mc'; index: number; gave: string; expected: string }> = [];
    const blank: Array<{ section: 'tf' | 'mc'; index: number; expected: string }> = [];
    (key.tf || []).forEach((expected, i) => {
        const gave = row.answers?.tf?.[i] ?? null;
        if (gave == null) blank.push({ section: 'tf', index: i, expected });
        else if (gave !== expected) wrong.push({ section: 'tf', index: i, gave, expected });
    });
    (key.mc || []).forEach((expected, i) => {
        const gave = row.answers?.mc?.[i] ?? null;
        if (gave == null) blank.push({ section: 'mc', index: i, expected });
        else if (gave !== expected) wrong.push({ section: 'mc', index: i, gave, expected });
    });
    return { wrong, blank };
}

/** Human-friendly label for a question (e.g. "V/F 3", "SM 12"). */
function qLabel(section: 'tf' | 'mc', index: number): string {
    return `${section === 'tf' ? 'V/F' : 'SM'} ${index + 1}`;
}

/** Build apoderado message (copiable). */
function buildParentMessage(
    row: OMRResultRow,
    grade: number,
    group: QuickScanGroup
): string {
    const name = row.student_name || 'el/la alumno/a';
    const firstName = name.split(' ')[0];
    const { wrong, blank } = studentErrors(row, group.answerKey);
    const correct = row.score.correct;
    const total = row.score.total;
    const percentage = row.score.percentage;
    const isPass = grade >= DEFAULT_SCALE.passingGrade;
    const failedList = [
        ...wrong.map((w) => qLabel(w.section, w.index)),
        ...blank.map((b) => `${qLabel(b.section, b.index)} (en blanco)`),
    ];
    const failedStr = failedList.length ? failedList.join(', ') : 'ninguna';
    const evalLabel = group.title || 'la evaluacion';
    const gradeFmt = grade.toFixed(1);
    const tone = isPass
        ? `Quedo con nota ${gradeFmt}, lo cual indica un buen dominio de los contenidos.`
        : `Quedo con nota ${gradeFmt}. Sugiero reforzar en casa los contenidos asociados.`;

    return `Hola, le cuento brevemente sobre el desempeno de ${firstName} en ${evalLabel}${group.grade ? ` (${group.grade})` : ''}.

Resultado: ${correct} de ${total} respuestas correctas (${percentage}%). ${tone}

${failedList.length ? `Las preguntas que necesita repasar son: ${failedStr}.` : ''}

Cualquier duda, me comento.

Saludos,
Prof.`;
}

// ──────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────

export const QuickScanFeedback: React.FC = () => {
    const [rows, setRows] = useState<OMRResultRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setErr] = useState<string | null>(null);
    const [selectedKey, setSelectedKey] = useState<string | null>(null);
    const [selectedStudent, setSelectedStudent] = useState<OMRResultRow | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setLoading(true);
                setErr(null);
                const supabase = createClient();
                const { data: userData } = await supabase.auth.getUser();
                const userId = userData?.user?.id;
                if (!userId) {
                    if (!cancelled) setErr('No autenticado');
                    return;
                }
                const { data, error: qErr } = await supabase
                    .from('omr_results')
                    .select(
                        'id, user_id, scan_type, student_name, answers, score, answer_key, captured_at, metadata'
                    )
                    .eq('user_id', userId)
                    .eq('scan_type', 'quick')
                    .order('captured_at', { ascending: false })
                    .limit(500);
                if (qErr) throw qErr;
                if (!cancelled) setRows((data as OMRResultRow[]) || []);
            } catch (e) {
                console.error('[QuickScanFeedback] fetch error:', e);
                if (!cancelled) setErr((e as Error).message || 'Error cargando datos');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const groups = useMemo(() => groupScans(rows), [rows]);

    // Auto-select most recent group
    useEffect(() => {
        if (!selectedKey && groups.length > 0) {
            setSelectedKey(`${groups[0].fingerprint}::${groups[0].dayBucket}`);
        }
    }, [groups, selectedKey]);

    const activeGroup = useMemo(() => {
        if (!selectedKey) return null;
        return (
            groups.find(
                (g) => `${g.fingerprint}::${g.dayBucket}` === selectedKey
            ) || null
        );
    }, [groups, selectedKey]);

    // ── KPIs ──
    const kpis = useMemo(() => {
        if (!activeGroup) {
            return { count: 0, average: 0, passed: 0, failed: 0, topScore: 0 };
        }
        const count = activeGroup.rows.length;
        const grades = activeGroup.rows.map((r) =>
            calculateGrade(r.score.correct, r.score.total)
        );
        const average =
            grades.reduce((a, b) => a + b, 0) / Math.max(1, grades.length);
        const passed = grades.filter((g) => g >= DEFAULT_SCALE.passingGrade).length;
        const failed = count - passed;
        const topScore = Math.max(...grades);
        return { count, average, passed, failed, topScore };
    }, [activeGroup]);

    const failureRanking = useMemo(
        () => (activeGroup ? computeFailureRanking(activeGroup).slice(0, 5) : []),
        [activeGroup]
    );

    const copyMessage = useCallback(
        async (row: OMRResultRow) => {
            if (!activeGroup) return;
            const grade = calculateGrade(row.score.correct, row.score.total);
            const msg = buildParentMessage(row, grade, activeGroup);
            try {
                await navigator.clipboard.writeText(msg);
                toast.success('Mensaje copiado. Pegalo en WhatsApp o correo.');
            } catch {
                toast.error('No se pudo copiar. Intenta de nuevo.');
            }
        },
        [activeGroup]
    );

    // ──────────────────────────────────────────────────────────
    // Render
    // ──────────────────────────────────────────────────────────

    return (
        <div className="animate-fade-in max-w-7xl mx-auto pb-12 relative -mt-2">
            {/* Header */}
            <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-start gap-4">
                    <Link
                        href="/dashboard/feedback"
                        className="mt-1 p-2 rounded-xl bg-[var(--input-bg)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--on-background)] transition-colors"
                    >
                        <ArrowLeft size={18} />
                    </Link>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-[var(--on-background)] tracking-tight flex items-center gap-3">
                            Retroalimentacion
                            <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
                                QuickScan
                            </span>
                        </h1>
                        <p className="text-[var(--muted)] text-sm md:text-base mt-1">
                            Resultados de correcciones rapidas agrupadas por pauta y dia.
                        </p>
                    </div>
                </div>
            </div>

            {/* Loading / Error / Empty */}
            {loading && (
                <div className="glass-card-premium p-12 text-center text-[var(--muted)]">
                    Cargando resultados QuickScan...
                </div>
            )}

            {error && !loading && (
                <div className="glass-card-premium p-8 border-rose-500/30 bg-rose-500/5">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="text-rose-400 shrink-0" size={20} />
                        <div>
                            <p className="text-rose-300 font-semibold">Error cargando datos</p>
                            <p className="text-[var(--muted)] text-sm mt-1">{error}</p>
                        </div>
                    </div>
                </div>
            )}

            {!loading && !error && groups.length === 0 && (
                <div className="glass-card-premium p-12 text-center">
                    <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
                        <ClipboardCheck size={28} />
                    </div>
                    <h3 className="text-xl font-bold text-[var(--on-background)] mb-2">
                        Sin correcciones rapidas todavia
                    </h3>
                    <p className="text-[var(--muted)] mb-6 max-w-md mx-auto">
                        Usa la Correccion Rapida OMR para escanear hojas sin necesidad de
                        crear una evaluacion previa.
                    </p>
                    <Link
                        href="/dashboard/summative"
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold shadow-lg shadow-violet-500/20"
                    >
                        <Sparkles size={16} />
                        Ir a Correccion Rapida
                    </Link>
                </div>
            )}

            {/* Content */}
            {!loading && !error && groups.length > 0 && activeGroup && (
                <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
                    {/* Sidebar: group selector */}
                    <aside className="space-y-3">
                        <p className="text-xs uppercase tracking-wide text-[var(--muted)] font-semibold px-2">
                            Evaluaciones
                        </p>
                        <div className="space-y-2">
                            {groups.map((g) => {
                                const key = `${g.fingerprint}::${g.dayBucket}`;
                                const isActive = key === selectedKey;
                                return (
                                    <button
                                        key={key}
                                        onClick={() => {
                                            setSelectedKey(key);
                                            setSelectedStudent(null);
                                        }}
                                        className={`w-full text-left p-3 rounded-xl border transition-all ${
                                            isActive
                                                ? 'bg-[var(--primary)]/10 border-[var(--primary)]/40 shadow-lg shadow-[var(--primary)]/5'
                                                : 'bg-[var(--input-bg)] border-[var(--border)] hover:border-[var(--primary)]/30'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0 flex-1">
                                                <p
                                                    className={`text-sm font-semibold truncate ${
                                                        isActive
                                                            ? 'text-[var(--on-background)]'
                                                            : 'text-[var(--muted)]'
                                                    }`}
                                                >
                                                    {g.title}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1 text-[10px] text-[var(--muted)]">
                                                    {g.grade && (
                                                        <span className="flex items-center gap-0.5">
                                                            <BookOpen size={10} />
                                                            {g.grade}
                                                        </span>
                                                    )}
                                                    <span className="flex items-center gap-0.5">
                                                        <Calendar size={10} />
                                                        {g.dayLabel}
                                                    </span>
                                                </div>
                                            </div>
                                            <span
                                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                                                    isActive
                                                        ? 'bg-[var(--primary)]/20 text-[var(--primary)]'
                                                        : 'bg-[var(--border)] text-[var(--muted)]'
                                                }`}
                                            >
                                                {g.rows.length}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </aside>

                    {/* Main panel */}
                    <div className="space-y-6 min-w-0">
                        {/* KPI cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <KpiCard
                                icon={<Users size={20} />}
                                label="Alumnos"
                                value={kpis.count.toString()}
                                color="cyan"
                            />
                            <KpiCard
                                icon={<TrendingUp size={20} />}
                                label="Promedio"
                                value={kpis.average.toFixed(1)}
                                color="violet"
                                subtitle={`de ${DEFAULT_SCALE.maxGrade.toFixed(1)}`}
                            />
                            <KpiCard
                                icon={<CheckCircle2 size={20} />}
                                label="Aprobados"
                                value={kpis.passed.toString()}
                                color="emerald"
                                subtitle={`de ${kpis.count}`}
                            />
                            <KpiCard
                                icon={<XCircle size={20} />}
                                label="Reprobados"
                                value={kpis.failed.toString()}
                                color="rose"
                                subtitle={`de ${kpis.count}`}
                            />
                        </div>

                        {/* Failed Questions Ranking */}
                        <div className="glass-card-premium p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                                    <BarChart3 size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-[var(--on-background)]">
                                        Preguntas mas falladas
                                    </h3>
                                    <p className="text-xs text-[var(--muted)]">
                                        Top 5 ranking por errores + en blanco.
                                    </p>
                                </div>
                            </div>
                            {failureRanking.length === 0 ? (
                                <p className="text-center text-[var(--muted)] py-6 text-sm">
                                    No hay preguntas con errores.
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {failureRanking.map((q) => {
                                        const failRate = Math.round(
                                            ((q.wrong + q.blank) / q.total) * 100
                                        );
                                        const barColor =
                                            failRate >= 60
                                                ? 'bg-rose-500'
                                                : failRate >= 40
                                                  ? 'bg-amber-500'
                                                  : 'bg-cyan-500';
                                        return (
                                            <div
                                                key={`${q.section}-${q.index}`}
                                                className="flex items-center gap-3 p-3 rounded-xl bg-[var(--input-bg)] border border-[var(--border)]"
                                            >
                                                <div className="w-14 text-center shrink-0">
                                                    <p className="text-[10px] uppercase text-[var(--muted)] font-bold">
                                                        {q.section === 'tf' ? 'V/F' : 'SM'}
                                                    </p>
                                                    <p className="text-lg font-bold text-[var(--on-background)]">
                                                        {q.index + 1}
                                                    </p>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2 mb-1">
                                                        <span className="text-xs text-[var(--muted)]">
                                                            Correcta: <strong className="text-[var(--on-background)]">{q.correctAnswer}</strong>
                                                        </span>
                                                        <span className="text-xs text-[var(--muted)]">
                                                            {q.wrong} mal · {q.blank} blanco
                                                        </span>
                                                    </div>
                                                    <div className="h-2 rounded-full bg-[var(--border)] overflow-hidden">
                                                        <div
                                                            className={`h-full ${barColor} transition-all`}
                                                            style={{ width: `${failRate}%` }}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="text-lg font-bold text-[var(--on-background)]">
                                                        {failRate}%
                                                    </p>
                                                    <p className="text-[10px] text-[var(--muted)]">fallo</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Students Table */}
                        <div className="glass-card-premium p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                                    <Users size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-[var(--on-background)]">
                                        Alumnos evaluados
                                    </h3>
                                    <p className="text-xs text-[var(--muted)]">
                                        Click en un alumno para ver detalles + mensaje para apoderado.
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                {activeGroup.rows.map((row) => {
                                    const grade = calculateGrade(row.score.correct, row.score.total);
                                    const isPass = grade >= DEFAULT_SCALE.passingGrade;
                                    return (
                                        <button
                                            key={row.id}
                                            onClick={() => setSelectedStudent(row)}
                                            className="w-full flex items-center gap-4 p-3 rounded-xl bg-[var(--input-bg)] border border-[var(--border)] hover:border-[var(--primary)]/40 transition-all text-left group"
                                        >
                                            <div
                                                className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                                                    isPass
                                                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                                        : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                                }`}
                                            >
                                                {grade.toFixed(1)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-[var(--on-background)] truncate">
                                                    {row.student_name || '(sin nombre)'}
                                                </p>
                                                <p className="text-xs text-[var(--muted)] mt-0.5">
                                                    {row.score.correct} de {row.score.total} · {row.score.percentage}%
                                                    {row.score.blank > 0 && ` · ${row.score.blank} en blanco`}
                                                </p>
                                            </div>
                                            <ChevronRight
                                                size={18}
                                                className="text-[var(--muted)] group-hover:text-[var(--primary)] transition-colors shrink-0"
                                            />
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Student Drill-Down Modal */}
            <AnimatePresence>
                {selectedStudent && activeGroup && (
                    <StudentDrillDown
                        row={selectedStudent}
                        group={activeGroup}
                        onClose={() => setSelectedStudent(null)}
                        onCopyMessage={copyMessage}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

// ──────────────────────────────────────────────────────────
// Subcomponents
// ──────────────────────────────────────────────────────────

const KpiCard: React.FC<{
    icon: React.ReactNode;
    label: string;
    value: string;
    subtitle?: string;
    color: 'cyan' | 'violet' | 'emerald' | 'rose';
}> = ({ icon, label, value, subtitle, color }) => {
    const colorMap: Record<string, string> = {
        cyan: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
        violet: 'bg-violet-500/10 border-violet-500/20 text-violet-400',
        emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
        rose: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
    };
    return (
        <motion.div
            whileHover={{ y: -2 }}
            className="glass-card-premium p-4 relative overflow-hidden"
        >
            <div
                className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-3 ${colorMap[color]}`}
            >
                {icon}
            </div>
            <p className="text-xs text-[var(--muted)] uppercase tracking-wide font-semibold">
                {label}
            </p>
            <div className="flex items-baseline gap-1.5 mt-1">
                <p className="text-2xl md:text-3xl font-bold text-[var(--on-background)]">
                    {value}
                </p>
                {subtitle && <p className="text-xs text-[var(--muted)]">{subtitle}</p>}
            </div>
        </motion.div>
    );
};

const StudentDrillDown: React.FC<{
    row: OMRResultRow;
    group: QuickScanGroup;
    onClose: () => void;
    onCopyMessage: (row: OMRResultRow) => void;
}> = ({ row, group, onClose, onCopyMessage }) => {
    const grade = calculateGrade(row.score.correct, row.score.total);
    const isPass = grade >= DEFAULT_SCALE.passingGrade;
    const { wrong, blank } = studentErrors(row, group.answerKey);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-2xl max-h-[85vh] overflow-y-auto glass-card-premium p-6 md:p-8 border-[var(--primary)]/30"
            >
                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-6">
                    <div className="flex items-center gap-4">
                        <div
                            className={`w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-2xl ${
                                isPass
                                    ? 'bg-emerald-500/15 text-emerald-400 border-2 border-emerald-500/30'
                                    : 'bg-rose-500/15 text-rose-400 border-2 border-rose-500/30'
                            }`}
                        >
                            {grade.toFixed(1)}
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-[var(--on-background)]">
                                {row.student_name || '(sin nombre)'}
                            </h3>
                            <p className="text-sm text-[var(--muted)]">
                                {row.score.correct} correctas · {row.score.incorrect} mal ·{' '}
                                {row.score.blank} blanco
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-[var(--muted)] hover:text-[var(--on-background)] hover:bg-[var(--input-bg)] transition-colors"
                    >
                        <XCircle size={20} />
                    </button>
                </div>

                {/* Errors */}
                {wrong.length > 0 && (
                    <div className="mb-5">
                        <h4 className="text-xs uppercase tracking-wide text-rose-400 font-semibold mb-2">
                            Preguntas incorrectas ({wrong.length})
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {wrong.map((w, i) => (
                                <span
                                    key={`w-${i}`}
                                    className="px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300"
                                >
                                    {qLabel(w.section, w.index)}:{' '}
                                    <strong className="text-rose-400">{w.gave}</strong>
                                    {' → '}
                                    <span className="text-emerald-400">{w.expected}</span>
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {blank.length > 0 && (
                    <div className="mb-5">
                        <h4 className="text-xs uppercase tracking-wide text-amber-400 font-semibold mb-2">
                            En blanco ({blank.length})
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {blank.map((b, i) => (
                                <span
                                    key={`b-${i}`}
                                    className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300"
                                >
                                    {qLabel(b.section, b.index)} (esperado {b.expected})
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {wrong.length === 0 && blank.length === 0 && (
                    <div className="mb-5 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
                        <CheckCircle2 className="text-emerald-400" size={20} />
                        <p className="text-sm text-emerald-300 font-semibold">
                            Perfecto. {row.student_name?.split(' ')[0] || 'Alumno'} respondio
                            correctamente todas las preguntas.
                        </p>
                    </div>
                )}

                {/* Copy message action */}
                <div className="pt-4 border-t border-[var(--border)]">
                    <button
                        onClick={() => onCopyMessage(row)}
                        className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 transition-shadow"
                    >
                        <Copy size={16} />
                        Copiar mensaje para apoderado
                    </button>
                    <p className="text-[10px] text-[var(--muted)] text-center mt-2 flex items-center justify-center gap-1">
                        <MessageSquare size={10} />
                        Se copia a portapapeles · pegalo en WhatsApp, correo o agenda.
                    </p>
                </div>
            </motion.div>
        </motion.div>
    );
};
