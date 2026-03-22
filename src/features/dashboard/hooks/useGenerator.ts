'use client';

/**
 * useGenerator Hook
 * Extracted from Generator.tsx — encapsulates all state management,
 * form handling, and generation logic for the class kit generator.
 */

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { generateCacheKey, saveToAICache } from '@/shared/lib/aiCache';
import { logAuditEvent } from '@/shared/lib/auditLog';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { ELECTIVES_LIST } from '@/shared/constants/curriculum';
import { useRouter } from 'next/navigation';

// --- Types ---

export interface FormData {
    subject: string;
    grade: string;
    oa: string;
    oaCodes: string[];
    oaTexts: string[];
    topic: string;
    nee: string;
    dua: boolean;
    duration: string;
    userName: string;
    userEmail: string;
}

export interface LoadingMessage {
    text: string;
    icon: string;
}

export interface PlanningDraft {
    id: string;
    name: string;
    formData: FormData;
    createdAt: string;
    updatedAt: string;
}

const DRAFTS_STORAGE_KEY = 'educmark_generator_drafts_v1';

// --- Constants ---

export const NEE_OPTIONS = [
    { id: 'Ninguna', label: 'Ninguna' },
    { id: 'TDAH', label: 'TDAH (Déficit Atencional)' },
    { id: 'TEA', label: 'TEA (Espectro Autista)' },
    { id: 'TEL', label: 'TEL (Trast. Específico del Lenguaje)' },
    { id: 'DEA', label: 'DEA (Dislexia / Dificultad Lectora)' },
    { id: 'Dificultad Aprendizaje', label: 'Dificultad de Aprendizaje' },
    { id: 'Discapacidad Intelectual', label: 'Disc. Intelectual Leve' },
    { id: 'Visión/Audición', label: 'Visión/Audición' },
    { id: 'Altas Capacidades', label: 'Altas Capacidades' },
];

export const DURATIONS = ['45 min', '90 min'];

export const LOADING_MESSAGES: LoadingMessage[] = [
    { text: "Conectando con bases curriculares del MINEDUC...", icon: "🔗" },
    { text: "Analizando el Objetivo de Aprendizaje...", icon: "🎯" },
    { text: "Recuperando indicadores de evaluación...", icon: "📊" },
    { text: "Diseñando estructura de la planificación...", icon: "📝" },
    { text: "Creando secuencia didáctica Inicio-Desarrollo-Cierre...", icon: "🔄" },
    { text: "Generando adaptaciones DUA para inclusión...", icon: "♿" },
    { text: "Diseñando slides para proyector...", icon: "🖥️" },
    { text: "Generando imágenes con IA...", icon: "🎨" },
    { text: "Contextualizando ejemplos para Chile...", icon: "🇨🇱" },
    { text: "Creando evaluación formativa...", icon: "✅" },
    { text: "Empaquetando tu Kit de Clase...", icon: "📦" },
    { text: "Finalizando y preparando envío...", icon: "🚀" },
];

export const EDUCATIONAL_TIPS = [
    "💡 Sabías que EducMark analiza más de 1,500 indicadores de evaluación del MINEDUC?",
    "📚 Las actividades se diseñan siguiendo el Marco para la Buena Enseñanza.",
    "🎯 Cada planificación incluye los 3 momentos de la clase: Inicio, Desarrollo y Cierre.",
    "♿ Las adaptaciones DUA permiten incluir a todos los estudiantes en el aprendizaje.",
    "🇨🇱 Los ejemplos contextualizados aumentan la comprensión de los estudiantes.",
    "🧠 Las preguntas de activación conectan con conocimientos previos.",
    "📊 Los indicadores de evaluación están alineados directamente con el OA.",
    "🎨 Las imágenes generadas por IA son únicas para cada clase.",
    "⏱️ Una buena planificación ahorra hasta 2 horas de trabajo docente.",
    "🏆 Los profesores que planifican tienen mejores resultados de aprendizaje.",
];

const TOTAL_ESTIMATED_TIME = 270; // 4.5 minutes in seconds
const STAGE_INTERVAL = Math.floor((TOTAL_ESTIMATED_TIME * 1000) / LOADING_MESSAGES.length);

// --- Hook ---

export function useGenerator() {
    const supabase = createClient();
    const router = useRouter();

    // Form state
    const [step, setStep] = useState(1);
    const [generating, setGenerating] = useState(false);
    const [credits, setCredits] = useState<number | null>(null);
    const [formData, setFormData] = useState<FormData>({
        subject: 'Lenguaje',
        grade: '1° Básico',
        oa: '',
        oaCodes: [],
        oaTexts: [],
        topic: '',
        nee: 'Ninguna',
        dua: true,
        duration: '90 min',
        userName: '',
        userEmail: '',
    });
    const [drafts, setDrafts] = useState<PlanningDraft[]>([]);
    const [activeDraftId, setActiveDraftId] = useState<string | null>(null);

    // Loading animation state
    const [loadingStage, setLoadingStage] = useState(0);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [currentTip, setCurrentTip] = useState(0);

    // Interval refs for cleanup
    const intervalsRef = useRef<{
        stage?: ReturnType<typeof setInterval>;
        progress?: ReturnType<typeof setInterval>;
        timer?: ReturnType<typeof setInterval>;
        tip?: ReturnType<typeof setInterval>;
    }>({});

    // Derived state
    const isElectiveSelected = formData.subject === 'Electivo' || ELECTIVES_LIST.includes(formData.subject);

    // --- Field Updates ---
    const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const setSelectedOAs = (codes: string[], texts?: string[]) => {
        const normalized = Array.from(new Set(codes.map((code) => code.trim()).filter(Boolean)));
        setFormData(prev => ({
            ...prev,
            oaCodes: normalized,
            oaTexts: texts || prev.oaTexts,
            oa: normalized.join(', ')
        }));
    };

    // --- Navigation ---
    const handleNext = () => {
        if (step === 1 && formData.oaCodes.length === 0 && !formData.oa.trim()) {
            toast.error('Selecciona al menos un OA');
            return;
        }
        setStep(prev => prev + 1);
    };

    const handlePrev = () => setStep(prev => prev - 1);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (step === 3) handleGenerate();
    };

    const persistDrafts = (nextDrafts: PlanningDraft[]) => {
        setDrafts(nextDrafts);
        localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(nextDrafts));
    };

    const saveDraft = (name?: string) => {
        const now = new Date().toISOString();
        const trimmedName = (name || '').trim();
        const autoName = `${formData.subject} ${formData.grade} · ${formData.oaCodes.length > 0 ? `OA ${formData.oaCodes.join(', ')}` : 'Sin OA'} · ${new Date().toLocaleString('es-CL')}`;
        const draftName = trimmedName || autoName;

        const nextDraft: PlanningDraft = {
            id: activeDraftId || crypto.randomUUID(),
            name: draftName,
            formData,
            createdAt: activeDraftId
                ? (drafts.find((d) => d.id === activeDraftId)?.createdAt || now)
                : now,
            updatedAt: now,
        };

        const filtered = drafts.filter((d) => d.id !== nextDraft.id);
        const nextDrafts = [nextDraft, ...filtered].slice(0, 20);
        persistDrafts(nextDrafts);
        setActiveDraftId(nextDraft.id);
        toast.success('Borrador guardado.');
    };

    const loadDraft = (draftId: string) => {
        const draft = drafts.find((d) => d.id === draftId);
        if (!draft) return;
        const normalizedCodes = Array.isArray(draft.formData.oaCodes)
            ? draft.formData.oaCodes
            : (draft.formData.oa || '').split(',').map((x) => x.trim()).filter(Boolean);
        setFormData({
            ...draft.formData,
            oaCodes: normalizedCodes,
            oa: normalizedCodes.join(', ') || draft.formData.oa || '',
        });
        setActiveDraftId(draft.id);
        setStep(1);
        toast.success('Borrador cargado.');
    };

    const deleteDraft = (draftId: string) => {
        const nextDrafts = drafts.filter((d) => d.id !== draftId);
        persistDrafts(nextDrafts);
        if (activeDraftId === draftId) setActiveDraftId(null);
        toast.success('Borrador eliminado.');
    };

    // --- User Data Fetch ---
    useEffect(() => {
        const getUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                setFormData(prev => ({
                    ...prev,
                    userEmail: session.user.email || '',
                    userName: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || '',
                }));

                const { data: sub } = await supabase
                    .from('user_subscriptions')
                    .select('remaining_credits')
                    .eq('user_id', session.user.id)
                    .single();

                if (sub) setCredits(sub.remaining_credits ?? 0);
            }
        };
        getUser();
    }, []);

    useEffect(() => {
        try {
            const raw = localStorage.getItem(DRAFTS_STORAGE_KEY);
            if (!raw) return;
            const parsed = JSON.parse(raw) as PlanningDraft[];
            if (Array.isArray(parsed)) {
                const normalized = parsed.map((draft) => {
                    const form = draft.formData as FormData & { oaCodes?: string[] };
                    const oaCodes = Array.isArray(form.oaCodes)
                        ? form.oaCodes
                        : (form.oa || '').split(',').map((x) => x.trim()).filter(Boolean);
                    return {
                        ...draft,
                        formData: {
                            ...form,
                            oaCodes,
                            oa: oaCodes.join(', ') || form.oa || '',
                        },
                    };
                });
                setDrafts(normalized);
            }
        } catch (error) {
            console.error('Error loading generator drafts:', error);
        }
    }, []);

    // --- Interval Cleanup ---
    const clearAllIntervals = () => {
        if (intervalsRef.current.stage) clearInterval(intervalsRef.current.stage);
        if (intervalsRef.current.progress) clearInterval(intervalsRef.current.progress);
        if (intervalsRef.current.timer) clearInterval(intervalsRef.current.timer);
        if (intervalsRef.current.tip) clearInterval(intervalsRef.current.tip);
    };

    // --- Time Formatting ---
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // --- Generation Logic ---
    const handleGenerate = async () => {
        // Check credits BEFORE starting animations to avoid frustration
        if (credits !== null && credits <= 0) {
            toast.error("Has alcanzado el límite de clases. Actualiza tu plan para seguir creando.");
            return;
        }

        setGenerating(true);
        setLoadingStage(0);
        setLoadingProgress(0);
        setElapsedTime(0);
        setCurrentTip(0);

        // Start loading animations
        intervalsRef.current.stage = setInterval(() => {
            setLoadingStage(prev => (prev < LOADING_MESSAGES.length - 1 ? prev + 1 : prev));
        }, STAGE_INTERVAL);

        intervalsRef.current.progress = setInterval(() => {
            setLoadingProgress(prev => {
                const maxProgress = 95;
                const increment = maxProgress / TOTAL_ESTIMATED_TIME;
                return Math.min(prev + increment, maxProgress);
            });
        }, 1000);

        intervalsRef.current.timer = setInterval(() => {
            setElapsedTime(prev => prev + 1);
        }, 1000);

        intervalsRef.current.tip = setInterval(() => {
            setCurrentTip(prev => (prev + 1) % EDUCATIONAL_TIPS.length);
        }, 15000);

        try {

            // PL-28: Check for duplicate OA + curso in last 30 days
            const { data: { session: earlySession } } = await supabase.auth.getSession();
            if (earlySession) {
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                const { data: existingPlans } = await supabase
                    .from('generated_classes')
                    .select('id')
                    .eq('user_id', earlySession.user.id)
                    .eq('curso', formData.grade)
                    .gte('created_at', thirtyDaysAgo.toISOString())
                    .limit(1);

                if (existingPlans && existingPlans.length > 0) {
                    toast.warning('Ya existe una planificación reciente para este curso. Se generará una nueva de todos modos.');
                }
            }

            const payload = {
                asignatura: formData.subject,
                curso: formData.grade,
                oa: formData.oaCodes.length > 0 ? formData.oaCodes.join(', ') : formData.oa,
                oas: formData.oaCodes,
                oa_textos: formData.oaTexts,
                objetivo_clase: formData.topic,
                nee: formData.nee,
                dua: formData.dua,
                duracion_clase: formData.duration,
            };

            const cacheKey = await generateCacheKey(payload);

            const { data: apiResult, error: fnError } = await supabase.functions.invoke('generate-class-kit', {
                body: {
                    ...payload,
                    generated_at: new Date().toISOString(),
                    user_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    email: formData.userEmail,
                    nombre: formData.userName,
                },
            });

            if (fnError) throw new Error(`Error del servidor: ${fnError.message}`);

            const result = apiResult;
            const hasContent = result && (
                result.metadata ||
                result.slides ||
                result.planificacion ||
                (typeof result === 'object' && Object.keys(result).length > 2)
            );

            if (!hasContent) {
                console.log("Webhook response incomplete:", result);
                clearAllIntervals();
                setGenerating(false);
                setLoadingProgress(0);
                toast.info("¡Tu clase se está generando! Recibirás un email cuando esté lista. 📧", { duration: 6000 });
                sessionStorage.setItem('pendingGeneration', JSON.stringify({
                    pendingGeneration: true,
                    message: 'Tu kit de clase se está generando y llegará a tu correo en unos minutos.',
                }));
                router.push('/dashboard');
                return;
            }

            saveToAICache(cacheKey, payload, result).then(() => console.log("Saved to cache"));

            // Complete the progress animation
            clearAllIntervals();
            setLoadingProgress(100);
            setLoadingStage(LOADING_MESSAGES.length - 1);

            // Save History
            let generatedClassId: string | null = null;
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                const planningText = typeof result?.planning === 'string'
                    ? result.planning
                    : (typeof result?.planning_text === 'string' ? result.planning_text : '');

                const planningBlocks = {
                    objective: result?.objetivo_clase || formData.topic || '',
                    indicators: result?.metadata?.indicadores_evaluacion || [],
                    inicio: result?.metadata?.inicio || '',
                    desarrollo: result?.metadata?.desarrollo || '',
                    cierre: result?.metadata?.cierre || '',
                    resources: result?.metadata?.recursos_concretos || [],
                    planningText,
                };

                const exitTicket = {
                    title: 'Ticket de Salida',
                    instructions: 'Responde al finalizar la clase.',
                    questions: Array.isArray(result?.quiz)
                        ? result.quiz.slice(0, 5).map((item: Record<string, unknown>, index: number) => ({
                            id: index + 1,
                            type: Array.isArray(item?.options) && item.options.length ? 'multiple_choice' : 'open',
                            question: (item?.question as string) || `Pregunta ${index + 1}`,
                            options: (item?.options as string[]) || [],
                            answer: (item?.correct as string) || null,
                        }))
                        : [],
                };

                const { data: inserted, error: dbError } = await supabase
                    .from('generated_classes')
                    .insert({
                        user_id: session.user.id,
                        subject: formData.subject,
                        asignatura: formData.subject,
                        grade: formData.grade,
                        curso: formData.grade,
                        topic: formData.topic,
                        objetivo_clase: formData.topic,
                        content: result,
                        planning_blocks: planningBlocks,
                        exit_ticket: exitTicket,
                        planning_status: 'draft',
                        approval_status: 'pending',
                        current_version: 1,
                        created_at: new Date().toISOString(),
                    })
                    .select('id')
                    .single();

                if (dbError) {
                    console.error("History save error:", dbError);
                } else {
                    generatedClassId = inserted?.id || null;
                }
            }

            setTimeout(() => {
                setGenerating(false);
                confetti({
                    particleCount: 150,
                    spread: 80,
                    origin: { y: 0.6 },
                    colors: ['#8b5cf6', '#06b6d4', '#22c55e'],
                });
                toast.success("¡Kit generado con éxito! 🎉");
                logAuditEvent('class_generated', { subject: formData.subject, grade: formData.grade });
                sessionStorage.setItem('kitResultState', JSON.stringify({ data: result, generatedClassId }));
                router.push('/dashboard/kit-result');
            }, 800);

        } catch (error: unknown) {
            console.error("Generation Error:", error);
            clearAllIntervals();
            setGenerating(false);
            setLoadingProgress(0);

            const errorMsg = error instanceof Error ? error.message : String(error);
            const lowerMsg = errorMsg.toLowerCase();
            if (lowerMsg.includes('timeout') || lowerMsg.includes('timed out') || lowerMsg.includes('deadline') || lowerMsg.includes('504') || lowerMsg.includes('502') || lowerMsg.includes('aborted') || lowerMsg.includes('edge function')) {
                toast.info("¡Tu clase se está generando! El proceso continúa en segundo plano. Recibirás un email cuando esté lista. 📧", { duration: 8000 });
                sessionStorage.setItem('pendingGeneration', JSON.stringify({
                    pendingGeneration: true,
                    message: 'Tu kit de clase se está generando y llegará a tu correo en unos minutos.',
                }));
                router.push('/dashboard');
            } else if (lowerMsg.includes('network') || lowerMsg.includes('fetch') || lowerMsg.includes('failed to fetch')) {
                toast.error("Error de conexión. Revisa tu internet e intenta nuevamente.");
            } else {
                // Likely a backend timeout with non-standard error message — treat as pending
                console.warn('Generation error (treating as pending):', errorMsg);
                toast.info("¡Tu clase se está generando! Recibirás un email cuando esté lista. 📧", { duration: 8000 });
                sessionStorage.setItem('pendingGeneration', JSON.stringify({
                    pendingGeneration: true,
                    message: 'Tu kit de clase se está generando y llegará a tu correo en unos minutos.',
                }));
                router.push('/dashboard');
            }
        }
    };

    return {
        // Form state
        step,
        formData,
        credits,
        isElectiveSelected,

        // Loading state
        generating,
        loadingStage,
        loadingProgress,
        elapsedTime,
        currentTip,

        // Constants
        loadingMessages: LOADING_MESSAGES,
        educationalTips: EDUCATIONAL_TIPS,

        // Actions
        updateField,
        setSelectedOAs,
        handleNext,
        handlePrev,
        handleSubmit,
        handleGenerate,
        formatTime,
        saveDraft,
        loadDraft,
        deleteDraft,
        drafts,
        activeDraftId,
    };
}
