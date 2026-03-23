'use client';

import React, { useEffect, useState } from 'react';
import { FileText, Layers, Plus, Sparkles, ClipboardList, Camera, Download, ExternalLink, Trash2, Package, Lightbulb, BookKey, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { downloadAnswerKey } from '@/shared/lib/generateAnswerKey';
import type { AnswerKeyItem } from '@/shared/lib/generateAnswerKey';
import { downloadUrlAsHtml, buildHtmlFilename } from '@/shared/lib/htmlToPdf';

const supabase = createClient();

interface Evaluation {
    id: string;
    title: string;
    grade: string;
    subject: string;
    unit: string;
    file_url: string | null;
    answer_key_url: string | null;
    answer_sheet_url: string | null;
    status: string;
    created_at: string;
}

interface DashboardOverviewProps {
    onCreateTest: () => void;
    onOpenAnswerSheet?: (evalData?: Record<string, unknown>) => void;
    onOpenResults?: () => void;
    onViewSpecs?: () => void;
    onOpenAnalytics?: () => void;
    onOpenScanner?: () => void;
    onOpenFeedback?: () => void;
    onOpenStudents?: () => void;
    onOpenTrash?: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ onCreateTest, onOpenAnswerSheet, onOpenScanner, onOpenFeedback, onOpenStudents, onOpenTrash }) => {
    const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
    const [loading, setLoading] = useState(true);
    const [downloadingPdf, setDownloadingPdf] = useState<string | null>(null);

    const fetchEvaluations = async () => {
        try {
            const { data, error } = await supabase
                .from('evaluations')
                .select('*')
                .eq('status', 'active')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching evaluations:', error);
                setLoading(false);
                return;
            }

            setEvaluations(data || []);
            setLoading(false);
        } catch (err) {
            console.error('Error:', err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvaluations();

        const channel = supabase
            .channel('dashboard-evaluations')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'evaluations' },
                () => fetchEvaluations()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const archiveEvaluation = async (id: string) => {
        try {
            const { error } = await supabase.from('evaluations').update({ status: 'archived' }).eq('id', id);
            if (error) throw error;
            fetchEvaluations();
            toast.success('Evaluación archivada.');
        } catch (err) {
            console.error('Error al archivar la evaluación:', err);
            toast.error('No se pudo archivar la evaluación.');
        }
    };

    const handleDelete = (id: string) => {
        toast('¿Archivar esta evaluación?', {
            action: {
                label: 'Archivar',
                onClick: () => archiveEvaluation(id),
            },
            cancel: {
                label: 'Cancelar',
                onClick: () => undefined,
            },
        });
    };

    const handleGenerateOMR = async (ev: Evaluation) => {
        try {
            const { data: items, error } = await supabase
                .from('evaluation_items')
                .select('type, correct_answer')
                .eq('evaluation_id', ev.id)
                .order('created_at', { ascending: true });

            if (error) throw error;

            const answers = { tf: [] as string[], mc: [] as string[] };

            if (items) {
                for (const item of items) {
                    if (item.type === 'Verdadero o Falso' || item.type === 'tf') {
                        answers.tf.push(item.correct_answer || 'V');
                    } else {
                        answers.mc.push(item.correct_answer || 'A');
                    }
                }
            }

            // Fetch students for the given grade
            const { data: studentsList, error: stdError } = await supabase
                .from('students')
                .select('id, first_name, last_name, rut')
                .eq('course_grade', ev.grade)
                .order('last_name', { ascending: true });

            if (stdError) {
                console.warn('Error fetching students:', stdError);
            }

            const evalData = {
                id: ev.id,
                subject: ev.subject || '',
                grade: ev.grade || '',
                unit: ev.unit || '',
                oa: 'Varios',
                answers: answers.tf.length > 0 || answers.mc.length > 0 ? answers : undefined,
                students: studentsList || []
            };

            onOpenAnswerSheet?.(evalData);
        } catch (error) {
            console.error('Error fetching items for answer sheet:', error);
            onOpenAnswerSheet?.({
                id: ev.id,
                subject: ev.subject || '',
                grade: ev.grade || '',
                unit: ev.unit || '',
                oa: 'Varios'
            });
        }
    };

    const handleDownloadAnswerKey = async (ev: Evaluation, fila?: 'A' | 'B') => {
        try {
            const { data: items, error } = await supabase
                .from('evaluation_items')
                .select('type, question, correct_answer, oa, cognitive_skill, rubric, points')
                .eq('evaluation_id', ev.id)
                .order('created_at', { ascending: true });

            if (error) throw error;
            if (!items || items.length === 0) {
                toast.error('No hay preguntas asociadas a esta evaluación.');
                return;
            }

            const answerKeyItems: AnswerKeyItem[] = items.map((item, idx) => ({
                questionNumber: idx + 1,
                questionType: item.type === 'Verdadero o Falso' || item.type === 'tf' ? 'V/F' : 'Selección Múltiple',
                question: item.question || `Pregunta ${idx + 1}`,
                correctAnswer: item.correct_answer || '—',
                oa: item.oa || undefined,
                cognitiveSkill: item.cognitive_skill || undefined,
                rubric: item.rubric || undefined,
                points: item.points ?? 1,
            }));

            downloadAnswerKey({
                evaluationTitle: ev.title,
                subject: ev.subject,
                grade: ev.grade,
                items: answerKeyItems,
                fila,
            });

            toast.success(`Pauta de corrección${fila ? ` (Fila ${fila})` : ''} descargada.`);
        } catch (err) {
            console.error('Error downloading answer key:', err);
            toast.error('No se pudo descargar la pauta de corrección.');
        }
    };

    const handleDownloadHtml = async (url: string, type: 'evaluacion' | 'pauta' | 'hoja_respuestas', ev: Evaluation) => {
        const key = `${ev.id}-${type}`;
        setDownloadingPdf(key);
        try {
            const filename = buildHtmlFilename(type, { subject: ev.subject, grade: ev.grade });
            await downloadUrlAsHtml(url, filename);
            toast.success('Descarga iniciada');
        } catch (err) {
            console.error('Error downloading HTML:', err);
            window.open(url, '_blank', 'noopener,noreferrer');
        } finally {
            setDownloadingPdf(null);
        }
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const evaluationsWithFile = evaluations.filter(e => e.file_url);

    return (
        <div className="max-w-7xl mx-auto p-0 md:p-4 animate-fade-in pb-20">

            {/* Header Section */}
            <div className="mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-[var(--on-background)] font-[family-name:var(--font-heading)] tracking-tight">Evaluaciones</h1>
                <p className="text-[var(--muted)] text-sm md:text-base mt-1">Diseña, escanea y analiza evaluaciones sumativas alineadas al currículum.</p>
            </div>

            {/* Hero Card - Full Width */}
            <motion.div
                className="glass-card-premium relative overflow-hidden flex flex-col justify-center p-6 mb-6 group cursor-pointer"
                onClick={onCreateTest}
                whileHover={{ scale: 1.005 }}
            >
                <div className="neural-bg absolute inset-0 opacity-30 pointer-events-none transition-opacity duration-700 group-hover:opacity-50">
                    <div className="neural-orb orb-1" style={{ width: '200px', height: '200px', top: '-10%', right: '-10%', background: 'var(--primary)' }}></div>
                    <div className="neural-orb orb-2" style={{ width: '180px', height: '180px', bottom: '-10%', left: '20%', background: 'var(--secondary)' }}></div>
                </div>

                <div className="relative z-10 max-w-lg">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-xs font-bold uppercase tracking-wider border border-[var(--primary)]/20 mb-3 backdrop-blur-sm">
                        <Sparkles size={12} className="fill-current" /> Recomendado
                    </span>
                    <h2 className="text-2xl md:text-3xl font-bold text-[var(--on-background)] mb-3 leading-tight">
                        Diseñar Nueva{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)]">Evaluación Sumativa</span>
                    </h2>
                    <p className="text-[var(--muted)] text-sm mb-5 leading-relaxed">
                        Crea pruebas alineadas al currículum en segundos con nuestra Tabla de Especificaciones Inteligente.
                    </p>

                    <button className="btn-gradient px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/30 transition-all w-fit">
                        <Plus size={18} className="stroke-[3]" /> Comenzar Diseño
                    </button>
                </div>

                <div className="absolute right-[-20px] bottom-[-20px] text-[var(--primary)] opacity-10 rotate-[-15deg] transition-transform duration-500 group-hover:scale-110 group-hover:rotate-0">
                    <Layers size={140} />
                </div>
            </motion.div>

            {/* Tool Cards - 4 columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">

                {/* Hoja de Respuesta */}
                <motion.div
                    whileHover={{ y: -5, scale: 1.02 }}
                    onClick={() => onOpenAnswerSheet?.()}
                    className="glass-card-premium p-6 flex flex-col justify-center relative overflow-hidden cursor-pointer group"
                >
                    <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-amber-500/10"></div>
                    <div className="relative z-10">
                        <div className="w-11 h-11 rounded-xl bg-[var(--input-bg)] border border-[var(--border)] flex items-center justify-center text-amber-500 mb-4 shadow-sm group-hover:scale-110 transition-transform duration-300">
                            <ClipboardList size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-[var(--on-background)] mb-1.5 group-hover:text-amber-400 transition-colors">
                            Hoja de Respuestas
                        </h3>
                        <p className="text-[var(--muted)] text-xs leading-relaxed">
                            Genera hojas OMR con código QR para corrección automática.
                        </p>
                    </div>
                </motion.div>

                {/* Escáner Evaluación */}
                <motion.div
                    whileHover={{ y: -5, scale: 1.02 }}
                    onClick={onOpenScanner}
                    className="glass-card-premium p-6 flex flex-col justify-center relative overflow-hidden cursor-pointer group"
                >
                    <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-cyan-500/10"></div>
                    <div className="relative z-10">
                        <div className="w-11 h-11 rounded-xl bg-[var(--input-bg)] border border-[var(--border)] flex items-center justify-center text-cyan-500 mb-4 shadow-sm group-hover:scale-110 transition-transform duration-300">
                            <Camera size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-[var(--on-background)] mb-1.5 group-hover:text-cyan-400 transition-colors">
                            Escáner Evaluación
                        </h3>
                        <p className="text-[var(--muted)] text-xs leading-relaxed">
                            Escanea hojas de respuestas con la cámara del dispositivo.
                        </p>
                    </div>
                </motion.div>

                {/* Retroalimentación Docente */}
                <motion.div
                    whileHover={{ y: -5, scale: 1.02 }}
                    onClick={onOpenFeedback}
                    className="glass-card-premium p-6 flex flex-col justify-center relative overflow-hidden cursor-pointer group"
                >
                    <div className="absolute top-0 right-0 w-48 h-48 bg-violet-500/5 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-violet-500/10"></div>
                    <div className="relative z-10">
                        <div className="w-11 h-11 rounded-xl bg-[var(--input-bg)] border border-[var(--border)] flex items-center justify-center text-violet-500 mb-4 shadow-sm group-hover:scale-110 transition-transform duration-300">
                            <Lightbulb size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-[var(--on-background)] mb-1.5 group-hover:text-violet-400 transition-colors">
                            Retroalimentación
                        </h3>
                        <p className="text-[var(--muted)] text-xs leading-relaxed">
                            Análisis inteligente de resultados y sugerencias pedagógicas.
                        </p>
                    </div>
                </motion.div>

                {/* Estudiantes */}
                <motion.div
                    whileHover={{ y: -5, scale: 1.02 }}
                    onClick={onOpenStudents}
                    className="glass-card-premium p-6 flex flex-col justify-center relative overflow-hidden cursor-pointer group"
                >
                    <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-emerald-500/10"></div>
                    <div className="relative z-10">
                        <div className="w-11 h-11 rounded-xl bg-[var(--input-bg)] border border-[var(--border)] flex items-center justify-center text-emerald-500 mb-4 shadow-sm group-hover:scale-110 transition-transform duration-300">
                            <Users size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-[var(--on-background)] mb-1.5 group-hover:text-emerald-400 transition-colors">
                            Estudiantes
                        </h3>
                        <p className="text-[var(--muted)] text-xs leading-relaxed">
                            Gestiona listas de alumnos por curso para tus evaluaciones.
                        </p>
                    </div>
                </motion.div>

            </div>

            {/* === MIS KITS DE EVALUACIONES === */}
            <div className="mb-10">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-[var(--on-background)] flex items-center gap-2">
                        <Package size={24} className="text-[var(--primary)]" />
                        Mis Kits de Evaluaciones
                    </h2>
                    <div className="flex items-center gap-2">
                        {evaluations.length > 0 && (
                            <span className="text-sm text-[var(--muted)] bg-[var(--card)] px-3 py-1 rounded-full border border-[var(--border)]">
                                {evaluations.length} {evaluations.length === 1 ? 'evaluación' : 'evaluaciones'}
                            </span>
                        )}
                        {onOpenTrash && (
                            <button
                                onClick={onOpenTrash}
                                className="p-2 rounded-lg text-[var(--muted)] hover:text-red-400 hover:bg-red-500/10 border border-[var(--border)] transition-colors"
                                title="Papelera"
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
                    </div>
                </div>

                {loading ? (
                    <div className="glass-card-premium p-8 text-center text-[var(--muted)]">
                        <div className="animate-pulse">Cargando evaluaciones...</div>
                    </div>
                ) : evaluations.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-card-premium p-8 text-center"
                    >
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
                            <Package size={28} className="text-[var(--primary)]" />
                        </div>
                        <h3 className="text-lg font-bold text-[var(--on-background)] mb-2">Sin evaluaciones aún</h3>
                        <p className="text-[var(--muted)] mb-4">Diseña tu primera evaluación sumativa y aparecerá aquí con su evaluación y pauta descargable.</p>
                        <button
                            onClick={onCreateTest}
                            className="btn-gradient px-6 py-2.5 rounded-xl font-bold text-sm inline-flex items-center gap-2"
                        >
                            <Plus size={16} /> Crear Evaluación
                        </button>
                    </motion.div>
                ) : (
                    <div className="glass-card-premium overflow-hidden">
                        {/* Desktop Table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-[var(--border)]">
                                        <th className="text-left px-5 py-3 text-[var(--muted)] font-semibold text-xs uppercase tracking-wider">Evaluación</th>
                                        <th className="text-left px-5 py-3 text-[var(--muted)] font-semibold text-xs uppercase tracking-wider">Curso</th>
                                        <th className="text-left px-5 py-3 text-[var(--muted)] font-semibold text-xs uppercase tracking-wider">Asignatura</th>
                                        <th className="text-left px-5 py-3 text-[var(--muted)] font-semibold text-xs uppercase tracking-wider">Unidad</th>
                                        <th className="text-left px-5 py-3 text-[var(--muted)] font-semibold text-xs uppercase tracking-wider">Fecha</th>
                                        <th className="text-right px-5 py-3 text-[var(--muted)] font-semibold text-xs uppercase tracking-wider">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <AnimatePresence>
                                        {evaluations.map((ev, idx) => (
                                            <motion.tr
                                                key={ev.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ delay: idx * 0.03 }}
                                                className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--card-hover)] transition-colors group"
                                            >
                                                <td className="px-5 py-3.5">
                                                    <span className="font-semibold text-[var(--on-background)]">{ev.title}</span>
                                                </td>
                                                <td className="px-5 py-3.5 text-[var(--muted)]">{ev.grade}</td>
                                                <td className="px-5 py-3.5 text-[var(--muted)]">{ev.subject}</td>
                                                <td className="px-5 py-3.5 text-[var(--muted)] text-xs max-w-[220px] truncate" title={ev.unit || ''}>{ev.unit || '—'}</td>
                                                <td className="px-5 py-3.5 text-[var(--muted)] text-xs whitespace-nowrap">{formatDate(ev.created_at)}</td>
                                                <td className="px-5 py-3.5 text-right">
                                                    <div className="flex flex-wrap gap-2 justify-end items-center">
                                                        {ev.file_url && (
                                                            <button
                                                                onClick={() => handleDownloadHtml(ev.file_url!, 'evaluacion', ev)}
                                                                disabled={downloadingPdf === `${ev.id}-evaluacion`}
                                                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-bold hover:bg-blue-500/20 transition-colors disabled:opacity-50"
                                                                title="Descargar evaluación como PDF"
                                                            >
                                                                {downloadingPdf === `${ev.id}-evaluacion` ? <Download size={12} className="animate-bounce" /> : <Download size={12} />} Evaluación
                                                            </button>
                                                        )}
                                                        {ev.answer_key_url ? (
                                                            <button
                                                                onClick={() => handleDownloadHtml(ev.answer_key_url!, 'pauta', ev)}
                                                                disabled={downloadingPdf === `${ev.id}-pauta`}
                                                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                                                                title="Descargar Pauta de Corrección como PDF"
                                                            >
                                                                {downloadingPdf === `${ev.id}-pauta` ? <BookKey size={12} className="animate-bounce" /> : <BookKey size={12} />} Pauta
                                                            </button>
                                                        ) : ev.file_url && (
                                                            <button
                                                                onClick={() => handleDownloadAnswerKey(ev)}
                                                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition-colors"
                                                                title="Generar Pauta de Corrección"
                                                            >
                                                                <BookKey size={12} /> Pauta
                                                            </button>
                                                        )}
                                                        {ev.answer_sheet_url ? (
                                                            <button
                                                                onClick={() => handleDownloadHtml(ev.answer_sheet_url!, 'hoja_respuestas', ev)}
                                                                disabled={downloadingPdf === `${ev.id}-hoja_respuestas`}
                                                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 text-xs font-bold hover:bg-indigo-500/20 transition-colors disabled:opacity-50"
                                                                title="Descargar Hoja de Respuestas OMR como PDF"
                                                            >
                                                                {downloadingPdf === `${ev.id}-hoja_respuestas` ? <ClipboardList size={12} className="animate-bounce" /> : <ClipboardList size={12} />} Hoja OMR
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleGenerateOMR(ev)}
                                                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 text-xs font-bold hover:bg-indigo-500/20 transition-colors"
                                                                title="Generar Hoja OMR"
                                                            >
                                                                <ClipboardList size={12} /> Hoja OMR
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleDelete(ev.id)}
                                                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-red-500/10 rounded-lg"
                                                            title="Archivar"
                                                        >
                                                            <Trash2 size={14} className="text-red-400" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="md:hidden flex flex-col divide-y divide-[var(--border)]">
                            {evaluations.map((ev) => (
                                <div key={ev.id} className="p-4 flex flex-col gap-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <p className="font-semibold text-[var(--on-background)] text-sm truncate">{ev.title}</p>
                                            <div className="flex items-center gap-2 mt-1 text-xs text-[var(--muted)]">
                                                <span>{ev.grade}</span>
                                                <span>&bull;</span>
                                                <span>{ev.subject}</span>
                                            </div>
                                            <p className="text-[var(--muted)] text-xs mt-0.5">{formatDate(ev.created_at)}</p>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(ev.id)}
                                            className="p-1.5 hover:bg-red-500/10 rounded-lg shrink-0"
                                            title="Archivar"
                                        >
                                            <Trash2 size={14} className="text-red-400" />
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {ev.file_url && (
                                            <>
                                                <button
                                                    onClick={() => handleDownloadHtml(ev.file_url!, 'evaluacion', ev)}
                                                    disabled={downloadingPdf === `${ev.id}-evaluacion`}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-bold disabled:opacity-50"
                                                >
                                                    {downloadingPdf === `${ev.id}-evaluacion` ? <Download size={12} className="animate-bounce" /> : <Download size={12} />} Evaluación
                                                </button>
                                                {ev.answer_key_url ? (
                                                    <button
                                                        onClick={() => handleDownloadHtml(ev.answer_key_url!, 'pauta', ev)}
                                                        disabled={downloadingPdf === `${ev.id}-pauta`}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-bold disabled:opacity-50"
                                                    >
                                                        {downloadingPdf === `${ev.id}-pauta` ? <BookKey size={12} className="animate-bounce" /> : <BookKey size={12} />} Pauta
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleDownloadAnswerKey(ev)}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-bold"
                                                    >
                                                        <BookKey size={12} /> Pauta
                                                    </button>
                                                )}
                                                {ev.answer_sheet_url && (
                                                    <button
                                                        onClick={() => handleDownloadHtml(ev.answer_sheet_url!, 'hoja_respuestas', ev)}
                                                        disabled={downloadingPdf === `${ev.id}-hoja_respuestas`}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 text-xs font-bold disabled:opacity-50"
                                                    >
                                                        {downloadingPdf === `${ev.id}-hoja_respuestas` ? <ClipboardList size={12} className="animate-bounce" /> : <ClipboardList size={12} />} Hoja OMR
                                                    </button>
                                                )}
                                            </>
                                        )}
                                        {!ev.answer_sheet_url && (
                                            <button
                                                onClick={() => handleGenerateOMR(ev)}
                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 text-xs font-bold"
                                            >
                                                <ClipboardList size={12} /> Hoja OMR
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
