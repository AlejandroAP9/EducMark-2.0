'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { FileDown, Printer, ArrowLeft, Eye, Edit2, Users, Loader2, Columns, ExternalLink, FileText, Save, Check, Download } from 'lucide-react';
import { LogoUploader } from './LogoUploader';
import { AnswerSheetPreview, generateDownloadableHTML } from './AnswerSheetPreview';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { downloadHtmlAsPdf } from '@/shared/lib/htmlToPdf';
import { useInstitutionBranding } from '@/shared/hooks/useInstitutionBranding';

const supabase = createClient();

interface EvaluationOption {
    id: string;
    title: string;
    grade: string;
    subject: string;
    unit: string;
}

interface AnswerSheetGeneratorProps {
    evaluationData?: {
        id: string;
        subject: string;
        grade: string;
        unit: string;
        oa: string;
        answers?: {
            tf: string[];
            mc: string[];
        };
        students?: {
            id: string;
            first_name: string;
            last_name: string;
            rut: string;
        }[];
    };
    onBack: () => void;
}

export const AnswerSheetGenerator: React.FC<AnswerSheetGeneratorProps> = ({
    evaluationData,
    onBack,
}) => {
    const { logo: brandingLogo, institutionName, primaryColor } = useInstitutionBranding();
    const branding = { logo: brandingLogo, institutionName, primaryColor };
    const [logo, setLogo] = useState<string | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [showSideBySide, setShowSideBySide] = useState(false);
    const [mcOptions, setMcOptions] = useState<4 | 5>(4);
    // EV-20: Number of row versions (2 = A/B, 3 = A/B/C, 4 = A/B/C/D)
    const [versionCount, setVersionCount] = useState<2 | 3 | 4>(2);

    // Batch students state
    const [batchStudents, setBatchStudents] = useState<{ id: string; first_name: string; last_name: string; rut: string }[]>(
        evaluationData?.students || []
    );
    const [loadingStudents, setLoadingStudents] = useState(false);

    // Editable fields
    const [subject, setSubject] = useState(evaluationData?.subject || 'Matemáticas');
    const [grade, setGrade] = useState(evaluationData?.grade || '7° Básico');
    const [unit, setUnit] = useState(evaluationData?.unit || 'Unidad 1');
    const [oa, setOa] = useState(evaluationData?.oa || 'OA 02');
    const [idealScore, setIdealScore] = useState(50);

    // FIX 1: Editable question counts
    const [trueFalseCount, setTrueFalseCount] = useState(evaluationData?.answers?.tf?.length || 10);
    const [multipleChoiceCount, setMultipleChoiceCount] = useState(evaluationData?.answers?.mc?.length || 40);
    const hasEvalData = !!evaluationData?.answers;

    // FIX 2: Auto-save state
    const [isSaving, setIsSaving] = useState(false);
    const [savedUrl, setSavedUrl] = useState<string | null>(null);

    // FIX 3: Evaluation selector
    const [availableEvals, setAvailableEvals] = useState<EvaluationOption[]>([]);
    const [selectedEvalId, setSelectedEvalId] = useState<string>(evaluationData?.id || '');
    const [loadingEvals, setLoadingEvals] = useState(false);
    const [loadingEvalData, setLoadingEvalData] = useState(false);

    // FIX 3: Load available evaluations on mount (only if no evaluationData provided)
    useEffect(() => {
        if (evaluationData) return;
        const loadEvaluations = async () => {
            setLoadingEvals(true);
            try {
                const { data, error } = await supabase
                    .from('evaluations')
                    .select('id, title, grade, subject, unit')
                    .eq('status', 'active')
                    .order('created_at', { ascending: false })
                    .limit(50);
                if (error) throw error;
                setAvailableEvals(data || []);
            } catch (err) {
                console.error('Error loading evaluations:', err);
            } finally {
                setLoadingEvals(false);
            }
        };
        loadEvaluations();
    }, [evaluationData]);

    // FIX 3: Load evaluation data when selecting from dropdown
    const handleSelectEvaluation = useCallback(async (evalId: string) => {
        setSelectedEvalId(evalId);
        if (!evalId) return;

        setLoadingEvalData(true);
        try {
            // Fetch evaluation metadata
            const { data: evalMeta, error: metaError } = await supabase
                .from('evaluations')
                .select('id, title, grade, subject, unit')
                .eq('id', evalId)
                .single();
            if (metaError) throw metaError;

            // Fetch evaluation items for answers
            const { data: items, error: itemsError } = await supabase
                .from('evaluation_items')
                .select('type, correct_answer')
                .eq('evaluation_id', evalId)
                .order('created_at', { ascending: true });
            if (itemsError) throw itemsError;

            // Populate fields
            if (evalMeta) {
                setSubject(evalMeta.subject || '');
                setGrade(evalMeta.grade || '');
                setUnit(evalMeta.unit || '');
                setOa('Varios');
            }

            // Build answers
            if (items && items.length > 0) {
                const tf: string[] = [];
                const mc: string[] = [];
                for (const item of items) {
                    if (item.type === 'Verdadero o Falso' || item.type === 'tf') {
                        tf.push(item.correct_answer || 'V');
                    } else {
                        mc.push(item.correct_answer || 'A');
                    }
                }
                setTrueFalseCount(tf.length);
                setMultipleChoiceCount(mc.length);
                setLoadedAnswers({ tf, mc });
                setIdealScore(tf.length + mc.length);
            }

            // Fetch students for the grade
            if (evalMeta?.grade) {
                const { data: studentsList } = await supabase
                    .from('students')
                    .select('id, first_name, last_name, rut')
                    .eq('course_grade', evalMeta.grade)
                    .order('last_name', { ascending: true });
                if (studentsList && studentsList.length > 0) {
                    setBatchStudents(studentsList);
                }
            }

            toast.success(`Evaluación "${evalMeta?.title}" cargada.`);
        } catch (err) {
            console.error('Error loading evaluation data:', err);
            toast.error('Error al cargar la evaluación.');
        } finally {
            setLoadingEvalData(false);
        }
    }, []);

    // Answers loaded from evaluation selector
    const [loadedAnswers, setLoadedAnswers] = useState<{ tf: string[]; mc: string[] } | null>(null);

    // Memoized evaluation info
    const evalInfo = useMemo(() => ({
        id: selectedEvalId || evaluationData?.id || `eval-${Date.now()}`,
        subject,
        grade,
        unit,
        oa,
    }), [selectedEvalId, evaluationData?.id, subject, grade, unit, oa]);

    const answers = useMemo(() => {
        if (evaluationData?.answers) return evaluationData.answers;
        if (loadedAnswers) return loadedAnswers;

        // Si no hay datos, generar respuestas aleatorias para el template
        const tfDefaults = Array(trueFalseCount).fill(null).map(() => Math.random() > 0.5 ? 'V' : 'F');
        const mcDefaults = Array(multipleChoiceCount).fill(null).map(() => {
            const opts = ['A', 'B', 'C', 'D', 'E'];
            return opts[Math.floor(Math.random() * opts.length)];
        });

        return { tf: tfDefaults, mc: mcDefaults };
    }, [evaluationData?.answers, loadedAnswers, trueFalseCount, multipleChoiceCount]);

    // Load students from Supabase by grade
    const handleLoadStudents = useCallback(async () => {
        if (!grade.trim()) {
            toast.error('Ingresa un curso para cargar alumnos.');
            return;
        }
        setLoadingStudents(true);
        try {
            const { data, error } = await supabase
                .from('students')
                .select('id, first_name, last_name, rut')
                .eq('course_grade', grade)
                .order('last_name', { ascending: true });

            if (error) throw error;

            if (!data || data.length === 0) {
                toast.info(`No se encontraron alumnos para "${grade}". Verifica el nombre del curso.`);
                return;
            }

            setBatchStudents(data);
            toast.success(`${data.length} alumnos cargados para ${grade}.`);
        } catch (err) {
            console.error('Error loading students:', err);
            toast.error('Error al cargar alumnos.');
        } finally {
            setLoadingStudents(false);
        }
    }, [grade]);

    // FIX 2: Save answer_sheet_url to Supabase
    const handleSaveToSupabase = useCallback(async (html: string) => {
        const currentEvalId = selectedEvalId || evaluationData?.id;
        if (!currentEvalId || currentEvalId.startsWith('eval-')) return;

        setIsSaving(true);
        try {
            // Upload HTML to Supabase Storage
            const filename = `answer_sheets/${currentEvalId}_${Date.now()}.html`;
            const { error: uploadError } = await supabase.storage
                .from('evaluations')
                .upload(filename, new Blob([html], { type: 'text/html' }), {
                    contentType: 'text/html',
                    upsert: true,
                });

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: urlData } = supabase.storage
                .from('evaluations')
                .getPublicUrl(filename);

            const publicUrl = urlData?.publicUrl;
            if (!publicUrl) throw new Error('No se pudo obtener URL pública');

            // Update evaluation record
            const { error: updateError } = await supabase
                .from('evaluations')
                .update({ answer_sheet_url: publicUrl })
                .eq('id', currentEvalId);

            if (updateError) throw updateError;

            setSavedUrl(publicUrl);
            toast.success('Hoja de respuestas guardada en la evaluación.');
        } catch (err) {
            console.error('Error saving answer sheet:', err);
            toast.error('Error al guardar. La descarga continuó normalmente.');
        } finally {
            setIsSaving(false);
        }
    }, [selectedEvalId, evaluationData?.id]);

    const handleDownloadHTML = useCallback(async () => {
        setIsDownloading(true);

        try {
            const html = await generateDownloadableHTML(
                evalInfo,
                answers,
                logo ?? brandingLogo,
                trueFalseCount,
                multipleChoiceCount,
                idealScore,
                undefined,
                batchStudents,
                mcOptions
            );

            // Create filename
            const cleanSubject = subject.replace(/[^a-zA-Z0-9]/g, '_');
            const cleanGrade = grade.replace(/[^a-zA-Z0-9]/g, '_');
            const filename = `HojaRespuestas_${cleanSubject}_${cleanGrade}.html`;

            // Blob download
            const blob = new Blob([html], { type: 'application/octet-stream' });
            const url = window.URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();

            setTimeout(() => {
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            }, 5000);

            // FIX 2: Auto-save to Supabase after download
            handleSaveToSupabase(html);

        } catch (error) {
            console.error('Error downloading:', error);
            toast.error('Error al generar el archivo. Inténtalo de nuevo.');
        } finally {
            setIsDownloading(false);
        }
    }, [evalInfo, answers, logo, subject, grade, idealScore, mcOptions, batchStudents, trueFalseCount, multipleChoiceCount, handleSaveToSupabase]);

    // FIX 5: Open print preview in new window
    const handlePrintPreview = useCallback(async () => {
        try {
            const html = await generateDownloadableHTML(
                evalInfo,
                answers,
                logo ?? brandingLogo,
                trueFalseCount,
                multipleChoiceCount,
                idealScore,
                undefined,
                batchStudents,
                mcOptions
            );

            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(html);
                printWindow.document.close();
            } else {
                toast.error('El navegador bloqueó la ventana emergente. Permite pop-ups e inténtalo de nuevo.');
            }
        } catch (error) {
            console.error('Error opening print preview:', error);
            toast.error('Error al abrir vista previa.');
        }
    }, [evalInfo, answers, logo, trueFalseCount, multipleChoiceCount, idealScore, batchStudents, mcOptions]);

    // PDF download handler
    const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
    const handleDownloadPdf = useCallback(async () => {
        setIsDownloadingPdf(true);
        try {
            const html = await generateDownloadableHTML(
                evalInfo,
                answers,
                logo ?? brandingLogo,
                trueFalseCount,
                multipleChoiceCount,
                idealScore,
                undefined,
                batchStudents,
                mcOptions
            );

            const cleanSubject = subject.replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ]/g, '_');
            const cleanGrade = grade.replace(/[^a-zA-Z0-9°áéíóúñÁÉÍÓÚÑ]/g, '_');
            const filename = `HojaRespuestas_${cleanSubject}_${cleanGrade}.pdf`;

            await downloadHtmlAsPdf(html, filename, { format: 'legal' }, branding);
            toast.success('PDF descargado.');
        } catch (error) {
            console.error('Error downloading PDF:', error);
            toast.error('Error al generar PDF. Usa la descarga HTML.');
        } finally {
            setIsDownloadingPdf(false);
        }
    }, [evalInfo, answers, logo, subject, grade, idealScore, mcOptions, batchStudents, trueFalseCount, multipleChoiceCount]);

    // EV-19/EV-20: Shuffled answers for Fila B/C/D preview
    const shuffleAnswers = useCallback((offset: number) => {
        const shuffled = { ...answers };
        if (shuffled.mc && shuffled.mc.length > 0) {
            const options = ['A', 'B', 'C', 'D', 'E'];
            shuffled.mc = shuffled.mc.map((ans) => {
                const idx = options.indexOf(ans);
                if (idx === -1) return ans;
                return options[(idx + offset) % options.length];
            });
        }
        return shuffled;
    }, [answers]);

    const answersFilaB = useMemo(() => shuffleAnswers(2), [shuffleAnswers]);
    const answersFilaC = useMemo(() => shuffleAnswers(1), [shuffleAnswers]);
    const answersFilaD = useMemo(() => shuffleAnswers(3), [shuffleAnswers]);

    const evalInfoFilaB = useMemo(() => ({ ...evalInfo, id: `${evalInfo.id}-B` }), [evalInfo]);
    const evalInfoFilaC = useMemo(() => ({ ...evalInfo, id: `${evalInfo.id}-C` }), [evalInfo]);
    const evalInfoFilaD = useMemo(() => ({ ...evalInfo, id: `${evalInfo.id}-D` }), [evalInfo]);

    const handlePrint = useCallback(() => {
        const iframe = document.querySelector('iframe[title="Answer Sheet Preview"]') as HTMLIFrameElement;
        if (iframe?.contentWindow) {
            iframe.contentWindow.print();
        }
    }, []);

    return (
        <div className="min-h-screen bg-[var(--background)] animate-fade-in relative">
            {/* Background Texture */}
            <div className="fixed inset-0 pointer-events-none opacity-20" style={{ backgroundImage: 'var(--noise-url)' }}></div>

            {/* Header */}
            <div className="bg-[var(--glass-bg)] backdrop-blur-md border-b border-[var(--border)] px-6 py-4 sticky top-0 z-20">
                <div className="flex items-center justify-between max-w-7xl mx-auto">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className="flex items-center gap-2 text-[var(--muted)] hover:text-[var(--on-background)] transition-colors"
                        >
                            <ArrowLeft size={20} />
                            <span className="hidden sm:inline">Volver</span>
                        </button>
                        <div className="h-6 w-px bg-[var(--border)]" />
                        <div>
                            <h1 className="text-lg font-bold text-[var(--on-background)]">Hoja de Respuestas</h1>
                            <p className="text-sm text-[var(--muted)]">
                                {subject} • {grade}
                                {savedUrl && (
                                    <span className="ml-2 text-emerald-400 text-xs font-medium">
                                        <Check size={12} className="inline mr-0.5" />Guardada
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* EV-19: Side-by-side Fila A/B toggle */}
                        <button
                            onClick={() => setShowSideBySide(!showSideBySide)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${showSideBySide
                                ? 'bg-[var(--primary)]/10 border-[var(--primary)] text-[var(--primary)]'
                                : 'text-[var(--foreground)] bg-[var(--card)] border-[var(--border)] hover:bg-[var(--card-hover)]'
                            }`}
                        >
                            <Columns size={18} />
                            <span className="hidden sm:inline">Vista Filas</span>
                        </button>
                        {showSideBySide && (
                            <select
                                value={versionCount}
                                onChange={(e) => setVersionCount(Number(e.target.value) as 2 | 3 | 4)}
                                className="px-2 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)]"
                                title="Cantidad de filas"
                            >
                                <option value={2}>A/B</option>
                                <option value={3}>A/B/C</option>
                                <option value={4}>A/B/C/D</option>
                            </select>
                        )}
                        {/* FIX 5: Print preview in new window */}
                        <button
                            onClick={handlePrintPreview}
                            className="flex items-center gap-2 px-4 py-2 text-[var(--foreground)] bg-[var(--card)] border border-[var(--border)] rounded-lg hover:bg-[var(--card-hover)] transition-colors"
                            title="Abrir en ventana nueva para imprimir"
                        >
                            <ExternalLink size={18} />
                            <span className="hidden sm:inline">Abrir</span>
                        </button>
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-4 py-2 text-[var(--foreground)] bg-[var(--card)] border border-[var(--border)] rounded-lg hover:bg-[var(--card-hover)] transition-colors"
                        >
                            <Printer size={18} />
                            <span className="hidden sm:inline">Imprimir</span>
                        </button>
                        <button
                            onClick={handleDownloadHTML}
                            disabled={isDownloading || isSaving}
                            className="btn-gradient px-4 py-2 rounded-lg flex items-center gap-2 text-white shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isDownloading || isSaving ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <span className="hidden sm:inline">{isSaving ? 'Guardando...' : 'Generando...'}</span>
                                </>
                            ) : (
                                <>
                                    <FileDown size={18} />
                                    <span className="hidden sm:inline">HTML</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 py-6 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Sidebar - Configuration */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* FIX 3: Evaluation Selector (only when no evaluationData) */}
                        {!evaluationData && (
                            <div className="glass-card-premium p-5">
                                <h3 className="font-semibold text-[var(--on-background)] mb-4 flex items-center gap-2">
                                    <FileText size={16} className="text-[var(--primary)]" />
                                    Cargar Evaluación
                                </h3>
                                {loadingEvals ? (
                                    <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
                                        <Loader2 size={14} className="animate-spin" />
                                        Cargando evaluaciones...
                                    </div>
                                ) : availableEvals.length === 0 ? (
                                    <p className="text-xs text-[var(--muted)]">
                                        No hay evaluaciones activas. Crea una evaluación primero.
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        <select
                                            value={selectedEvalId}
                                            onChange={(e) => handleSelectEvaluation(e.target.value)}
                                            disabled={loadingEvalData}
                                            className="w-full px-3 py-2 text-sm text-[var(--on-background)] bg-[var(--input-bg)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all disabled:opacity-50"
                                        >
                                            <option value="">-- Seleccionar evaluación --</option>
                                            {availableEvals.map((ev) => (
                                                <option key={ev.id} value={ev.id}>
                                                    {ev.title || `${ev.subject} - ${ev.grade}`}
                                                </option>
                                            ))}
                                        </select>
                                        {loadingEvalData && (
                                            <div className="flex items-center gap-2 text-xs text-[var(--primary)]">
                                                <Loader2 size={12} className="animate-spin" />
                                                Cargando datos de la evaluación...
                                            </div>
                                        )}
                                        <p className="text-[10px] text-[var(--muted)]">
                                            Al seleccionar una evaluación, se cargan las respuestas correctas, curso y alumnos automáticamente.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Logo Section */}
                        <div className="glass-card-premium p-5">
                            <h3 className="font-semibold text-[var(--on-background)] mb-4">Personalización</h3>
                            <div className="bg-[var(--input-bg)] rounded-lg p-2 border border-[var(--border)]">
                                <LogoUploader
                                    onLogoChange={setLogo}
                                    currentLogo={logo}
                                />
                            </div>
                        </div>

                        {/* Editable Info Card */}
                        <div className="glass-card-premium p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-[var(--on-background)]">Información</h3>
                                <Edit2 size={14} className="text-[var(--muted)]" />
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs text-[var(--muted)] mb-1">Asignatura</label>
                                    <input
                                        type="text"
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        className="w-full px-3 py-2 text-sm text-[var(--on-background)] bg-[var(--input-bg)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all"
                                        placeholder="Ej: Matemáticas"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-[var(--muted)] mb-1">Curso</label>
                                    <input
                                        type="text"
                                        value={grade}
                                        onChange={(e) => setGrade(e.target.value)}
                                        className="w-full px-3 py-2 text-sm text-[var(--on-background)] bg-[var(--input-bg)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all"
                                        placeholder="Ej: 7° Básico"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-[var(--muted)] mb-1">Unidad</label>
                                    <input
                                        type="text"
                                        value={unit}
                                        onChange={(e) => setUnit(e.target.value)}
                                        className="w-full px-3 py-2 text-sm text-[var(--on-background)] bg-[var(--input-bg)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all"
                                        placeholder="Ej: Unidad 1"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-[var(--muted)] mb-1">Objetivo de Aprendizaje</label>
                                    <input
                                        type="text"
                                        value={oa}
                                        onChange={(e) => setOa(e.target.value)}
                                        className="w-full px-3 py-2 text-sm text-[var(--on-background)] bg-[var(--input-bg)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all"
                                        placeholder="Ej: OA 02"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-[var(--muted)] mb-1">Puntaje Ideal</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="100"
                                        value={idealScore}
                                        onChange={(e) => setIdealScore(parseInt(e.target.value) || 50)}
                                        className="w-full px-3 py-2 text-sm text-[var(--on-background)] bg-[var(--input-bg)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all"
                                        placeholder="50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-[var(--muted)] mb-1">Alternativas por pregunta</label>
                                    <select
                                        value={mcOptions}
                                        onChange={(e) => setMcOptions(parseInt(e.target.value) as 4 | 5)}
                                        className="w-full px-3 py-2 text-sm text-[var(--on-background)] bg-[var(--input-bg)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all"
                                    >
                                        <option value={4}>4 alternativas (A-D)</option>
                                        <option value={5}>5 alternativas (A-E)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* FIX 1: Editable question counts */}
                        <div className="glass-card-premium p-5">
                            <h3 className="font-semibold text-[var(--on-background)] mb-4">Cantidad de Preguntas</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs text-[var(--muted)] mb-1">Verdadero / Falso</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="30"
                                        value={trueFalseCount}
                                        onChange={(e) => {
                                            const v = Math.max(0, Math.min(30, parseInt(e.target.value) || 0));
                                            setTrueFalseCount(v);
                                            if (!hasEvalData) setLoadedAnswers(null);
                                        }}
                                        disabled={hasEvalData}
                                        className="w-full px-3 py-2 text-sm text-[var(--on-background)] bg-[var(--input-bg)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-[var(--muted)] mb-1">Selección Múltiple</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="60"
                                        value={multipleChoiceCount}
                                        onChange={(e) => {
                                            const v = Math.max(0, Math.min(60, parseInt(e.target.value) || 0));
                                            setMultipleChoiceCount(v);
                                            if (!hasEvalData) setLoadedAnswers(null);
                                        }}
                                        disabled={hasEvalData}
                                        className="w-full px-3 py-2 text-sm text-[var(--on-background)] bg-[var(--input-bg)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    />
                                </div>
                                <div className="bg-gradient-to-br from-[var(--primary)]/10 to-[var(--secondary)]/10 rounded-lg p-3 border border-[var(--primary)]/20">
                                    <ul className="text-xs text-[var(--on-background)] space-y-1 opacity-80">
                                        <li>• {trueFalseCount} V/F + {multipleChoiceCount} SM = <strong>{trueFalseCount + multipleChoiceCount}</strong> preguntas</li>
                                        <li>• {mcOptions === 4 ? '4 alternativas (A-D)' : '5 alternativas (A-E)'}</li>
                                    </ul>
                                    {hasEvalData && (
                                        <p className="text-[10px] text-[var(--muted)] mt-2">
                                            Cantidades fijas: cargadas desde la evaluación.
                                        </p>
                                    )}
                                    <p className="text-[10px] text-[var(--muted)] mt-1">
                                        El QR contiene las respuestas correctas encriptadas.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Batch Students Panel */}
                        <div className="glass-card-premium p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-[var(--on-background)] flex items-center gap-2">
                                    <Users size={16} className="text-[var(--primary)]" />
                                    Alumnos
                                </h3>
                                {batchStudents.length > 0 && (
                                    <span className="text-[10px] font-bold bg-[var(--primary)]/10 text-[var(--primary)] px-2 py-0.5 rounded-full border border-[var(--primary)]/20">
                                        {batchStudents.length}
                                    </span>
                                )}
                            </div>

                            {batchStudents.length === 0 ? (
                                <div className="text-center py-4">
                                    <p className="text-xs text-[var(--muted)] mb-3">
                                        Carga alumnos para generar una hoja por estudiante con nombre y RUT pre-impreso.
                                    </p>
                                    <button
                                        onClick={handleLoadStudents}
                                        disabled={loadingStudents}
                                        className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-gradient-to-r from-[var(--primary)] to-indigo-600 text-white rounded-xl text-xs font-semibold shadow-lg hover:shadow-indigo-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                                    >
                                        {loadingStudents ? (
                                            <Loader2 size={14} className="animate-spin" />
                                        ) : (
                                            <Users size={14} />
                                        )}
                                        {loadingStudents ? 'Cargando...' : `Cargar alumnos de ${grade}`}
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <div className="max-h-[200px] overflow-y-auto space-y-1 custom-scrollbar pr-1">
                                        {batchStudents.map((s, idx) => (
                                            <div key={s.id} className="text-xs text-[var(--on-background)] py-1.5 px-2 bg-[var(--input-bg)] rounded-lg border border-[var(--border)] flex justify-between items-center">
                                                <span className="flex items-center gap-2">
                                                    <span className="w-5 h-5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                                                        {idx + 1}
                                                    </span>
                                                    <span className="truncate">{s.last_name}, {s.first_name}</span>
                                                </span>
                                                <span className="text-[var(--muted)] text-[10px] flex-shrink-0 ml-2">{s.rut}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => { setBatchStudents([]); toast.info('Lista de alumnos limpiada.'); }}
                                        className="w-full text-[10px] text-[var(--muted)] hover:text-red-400 transition-colors py-1"
                                    >
                                        Limpiar lista
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Preview Area */}
                    <div className="lg:col-span-3">
                        <div className="glass-card-premium overflow-hidden flex flex-col h-full">
                            <div className="bg-[var(--card)] px-5 py-3 border-b border-[var(--border)] flex items-center justify-between backdrop-blur-sm">
                                <div className="flex items-center gap-2">
                                    <Eye size={18} className="text-[var(--primary)]" />
                                    <span className="font-medium text-[var(--on-background)]">Vista Previa</span>
                                </div>
                                <span className="text-xs text-[var(--muted)]">Tamaño Legal (216mm × 356mm)</span>
                            </div>

                            <div className={`p-8 bg-black/40 flex-1 flex justify-center items-start overflow-y-auto ${showSideBySide ? 'gap-6' : ''}`} style={{ minHeight: '800px' }}>
                                {/* Fila A */}
                                <div className={showSideBySide ? 'flex-shrink-0' : ''}>
                                    {showSideBySide && (
                                        <div className="text-center mb-2">
                                            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">Fila A</span>
                                        </div>
                                    )}
                                    <div
                                        className="shadow-2xl shadow-black relative transform hover:scale-[1.005] transition-transform duration-300 bg-white"
                                        style={{
                                            width: showSideBySide ? '180mm' : '216mm',
                                            height: showSideBySide ? '297mm' : '356mm',
                                            minWidth: showSideBySide ? '180mm' : '216mm',
                                            minHeight: showSideBySide ? '297mm' : '356mm',
                                        }}
                                    >
                                        <AnswerSheetPreview
                                            evaluationInfo={evalInfo}
                                            answers={answers}
                                            logo={logo ?? brandingLogo}
                                            trueFalseCount={trueFalseCount}
                                            multipleChoiceCount={multipleChoiceCount}
                                            idealScore={idealScore}
                                            students={batchStudents}
                                            mcOptions={mcOptions}
                                        />
                                    </div>
                                </div>
                                {/* EV-19/EV-20: Fila B/C/D side-by-side */}
                                {showSideBySide && (
                                    <>
                                        {[
                                            { label: 'Fila B', color: 'amber', info: evalInfoFilaB, ans: answersFilaB },
                                            { label: 'Fila C', color: 'cyan', info: evalInfoFilaC, ans: answersFilaC },
                                            { label: 'Fila D', color: 'rose', info: evalInfoFilaD, ans: answersFilaD },
                                        ].slice(0, versionCount - 1).map((fila) => (
                                            <div key={fila.label} className="flex-shrink-0">
                                                <div className="text-center mb-2">
                                                    <span className={`text-xs font-bold text-${fila.color}-400 bg-${fila.color}-500/10 px-3 py-1 rounded-full border border-${fila.color}-500/20`}>{fila.label}</span>
                                                </div>
                                                <div
                                                    className="shadow-2xl shadow-black relative transform hover:scale-[1.005] transition-transform duration-300 bg-white"
                                                    style={{ width: '180mm', height: '297mm', minWidth: '180mm', minHeight: '297mm' }}
                                                >
                                                    <AnswerSheetPreview
                                                        evaluationInfo={fila.info}
                                                        answers={fila.ans}
                                                        logo={logo ?? brandingLogo}
                                                        trueFalseCount={trueFalseCount}
                                                        multipleChoiceCount={multipleChoiceCount}
                                                        idealScore={idealScore}
                                                        students={batchStudents}
                                                        mcOptions={mcOptions}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnswerSheetGenerator;
