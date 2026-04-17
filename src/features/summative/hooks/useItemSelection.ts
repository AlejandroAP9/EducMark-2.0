'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { createClient } from '@/lib/supabase/client';
import { useTestDesignerStore } from '@/features/summative/store/useTestDesignerStore';

const supabase = createClient();

const LOADING_MESSAGES = [
    { text: 'Consultando marco curricular...', icon: '📚' },
    { text: 'Estructurando base de conocimiento RAG...', icon: '🧠' },
    { text: 'Creando preguntas y distractores plausibles...', icon: '⚖️' },
    { text: 'Aplicando Taxonomía de Bloom...', icon: '💡' },
    { text: 'Validando alineación con la Tabla de Especificaciones...', icon: '🎯' },
    { text: 'Empaquetando evaluación y respuestas...', icon: '📦' }
];

const EDUCATIONAL_TIPS = [
    "Las evaluaciones basadas en datos curriculares aseguran alineación con los OA.",
    "Distractores plausibles ayudan a medir comprensión real, no solo memoria.",
    "La recomendación de dificultad respeta la progresión del curso."
];

const COGNITIVE_SKILLS = ['Recordar', 'Comprender', 'Aplicar', 'Analizar', 'Evaluar', 'Crear'];

export interface BankItemRow {
    id: string;
    user_id: string | null;
    oa: string | null;
    subject: string | null;
    grade: string | null;
    cognitive_skill: string | null;
    question_type: string | null;
    question_text: string;
    options: string[] | null;
    correct_answer: string | null;
    rubric: string | null;
    created_at: string;
    is_favorite?: boolean;
}

export interface GeneratedItem {
    id: number;
    type?: string;
    itemType?: string;
    /** Tipo pedagógico: mc, tf, doble_proceso, ordenamiento, pareados, completacion, desarrollo, respuesta_breve */
    pedagogical_type?: string;
    /** UUID compartido entre filas que forman un ítem pedagógico compuesto */
    group_id?: string;
    /** Si true, este item no se corrige por OMR (desarrollo, respuesta breve) */
    is_manual?: boolean;
    oa?: string;
    topic?: string;
    skill?: string;
    difficulty?: string;
    question?: string;
    options?: string[] | null;
    correctAnswer?: string | null;
    explanation?: string | null;
    imageUrl?: string | null;
    rubric?: string | null;
    /** EV-14: Shared stimulus text that groups items */
    stimulusText?: string | null;
    stimulusType?: string | null;
}

interface UseItemSelectionParams {
    onFinalize: () => void;
}

export const useItemSelection = ({ onFinalize }: UseItemSelectionParams) => {
    const {
        blueprint,
        selectedItems,
        toggleItem: onToggleItem,
        testData,
        generatedItems,
        setGeneratedItems: setItems
    } = useTestDesignerStore();

    const items = generatedItems as GeneratedItem[];

    const [generating, setGenerating] = useState(false);
    const [generated, setGenerated] = useState(items.length > 0);
    const [userId, setUserId] = useState<string | null>(null);
    const [evaluationId, setEvaluationId] = useState<string | null>(null);
    const [showBankModal, setShowBankModal] = useState(false);
    const [bankLoading, setBankLoading] = useState(false);
    const [bankItems, setBankItems] = useState<BankItemRow[]>([]);
    const [bankQuery, setBankQuery] = useState('');
    const [selectedBankItemIds, setSelectedBankItemIds] = useState<string[]>([]);
    const [editingItemId, setEditingItemId] = useState<number | null>(null);
    const [skillFilter, setSkillFilter] = useState<string>('all');
    const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
    const [bankTabFilter, setBankTabFilter] = useState<'all' | 'own' | 'shared' | 'favorites'>('all');
    const [togglingFav, setTogglingFav] = useState<string | null>(null);
    const [editingSkillId, setEditingSkillId] = useState<number | null>(null);
    // EV-14: Shared stimulus text
    const [stimulusText, setStimulusText] = useState<string>('');
    const [showStimulusInput, setShowStimulusInput] = useState(false);

    // Generador Loader UI States
    const [elapsedTime, setElapsedTime] = useState(0);
    const [loadingStage, setLoadingStage] = useState(0);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [currentTip, setCurrentTip] = useState(0);

    // --- Computed values ---

    const totalQuestions = blueprint.reduce((acc, row) => acc + row.count, 0);
    const currentCount = selectedItems.length;
    const progress = Math.round((currentCount / (totalQuestions || 1)) * 100);

    const webhookUrl = process.env.NEXT_PUBLIC_SUMMATIVE_WEBHOOK_URL || 'https://n8n.educmark.cl/webhook/summative-generate';

    const itemsBySkill = items.reduce<Record<string, number>>((acc, item: GeneratedItem) => {
        const skill = (item.skill || 'No definida').trim();
        acc[skill] = (acc[skill] || 0) + 1;
        return acc;
    }, {});
    const skillOptions = ['all', ...Object.keys(itemsBySkill).sort((a, b) => a.localeCompare(b))];
    const filteredItems = items
        .map((item: GeneratedItem, index: number) => ({ item, index }))
        .filter(({ item }) => skillFilter === 'all' || (item.skill || 'No definida') === skillFilter);

    // --- Effects ---

    useEffect(() => {
        let timerAndProgressInterval: ReturnType<typeof setInterval> | undefined;
        let stageInterval: ReturnType<typeof setInterval> | undefined;
        let tipInterval: ReturnType<typeof setInterval> | undefined;

        if (generating) {
            // Start from 0 when generating begins
            setElapsedTime(0);
            setLoadingStage(0);
            setLoadingProgress(0);

            let currentStage = 0;
            const updateIntervalMs = 100;

            timerAndProgressInterval = setInterval(() => {
                setElapsedTime((prev) => prev + 100);
                setLoadingProgress((prev) => {
                    const stageTarget = ((currentStage + 1) / LOADING_MESSAGES.length) * 95; // max 95% until done
                    if (prev < stageTarget) {
                        return prev + 0.038; // ~4 min to reach 95%
                    }
                    return prev;
                });
            }, updateIntervalMs);

            stageInterval = setInterval(() => {
                currentStage++;
                setLoadingStage((prev) => {
                    if (prev < LOADING_MESSAGES.length - 1) return prev + 1;
                    return prev;
                });
            }, 35000); // 35s per stage × 6 stages = ~3.5 min

            // Rotación de tips educativos
            tipInterval = setInterval(() => {
                setCurrentTip((prev) => (prev + 1) % EDUCATIONAL_TIPS.length);
            }, 5000);
        }

        return () => {
            if (timerAndProgressInterval) clearInterval(timerAndProgressInterval);
            if (stageInterval) clearInterval(stageInterval);
            if (tipInterval) clearInterval(tipInterval);
        };
    }, [generating]);

    useEffect(() => {
        supabase.auth.getUser().then(({ data, error }) => {
            if (error) {
                console.error('Error fetching user:', error);
                return;
            }
            if (data?.user) setUserId(data.user.id);
        }).catch(err => console.error('Error in getUser:', err));
    }, []);

    const loadBankItems = useCallback(async () => {
        if (!userId) {
            setBankItems([]);
            return;
        }

        setBankLoading(true);
        try {
            const { data: profileData, error: profileError } = await supabase
                .from('user_profiles')
                .select('institution')
                .eq('user_id', userId)
                .maybeSingle();

            if (profileError) {
                console.warn('No se pudo obtener institución del usuario:', profileError.message);
            }

            const institution = profileData?.institution || null;
            let memberIds: string[] = [userId];

            if (institution) {
                const { data: members, error: membersError } = await supabase
                    .from('user_profiles')
                    .select('user_id')
                    .eq('institution', institution);

                if (!membersError && members) {
                    memberIds = Array.from(new Set(members.map((m: { user_id: string }) => m.user_id).filter(Boolean)));
                }
            }

            const { data: ownItems, error: ownError } = await supabase
                .from('item_bank')
                .select('id, user_id, oa, subject, grade, cognitive_skill, question_type, question_text, options, correct_answer, rubric, created_at, is_favorite')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (ownError) throw ownError;

            let sharedItems: BankItemRow[] = [];
            if (memberIds.length > 0) {
                const { data: shared, error: sharedError } = await supabase
                    .from('item_bank')
                    .select('id, user_id, oa, subject, grade, cognitive_skill, question_type, question_text, options, correct_answer, rubric, created_at, is_favorite')
                    .eq('is_shared', true)
                    .in('user_id', memberIds)
                    .order('created_at', { ascending: false });

                if (sharedError) throw sharedError;
                sharedItems = (shared || []) as BankItemRow[];
            }

            const merged = [...(ownItems || []), ...sharedItems];
            const dedup = new Map<string, BankItemRow>();
            merged.forEach((row) => dedup.set(row.id, row as BankItemRow));
            setBankItems(Array.from(dedup.values()).sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)));
        } catch (error) {
            console.error('Error cargando banco de ítems:', error);
            toast.error('No se pudo cargar el banco de ítems.');
            setBankItems([]);
        } finally {
            setBankLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        if (showBankModal) {
            loadBankItems();
        }
    }, [showBankModal, userId, loadBankItems]);

    // --- Filtered bank items ---

    const filteredBankItems = bankItems.filter((item) => {
        if (bankTabFilter === 'own' && item.user_id !== userId) return false;
        if (bankTabFilter === 'shared' && item.user_id === userId) return false;
        if (bankTabFilter === 'favorites' && !item.is_favorite) return false;
        const q = bankQuery.trim().toLowerCase();
        if (!q) return true;
        return (
            (item.question_text || '').toLowerCase().includes(q) ||
            (item.oa || '').toLowerCase().includes(q) ||
            (item.subject || '').toLowerCase().includes(q) ||
            (item.grade || '').toLowerCase().includes(q) ||
            (item.cognitive_skill || '').toLowerCase().includes(q)
        );
    });

    // --- Helpers ---

    const formatTime = (ms: number) => {
        const totalSecs = Math.floor(ms / 1000);
        const mins = Math.floor(totalSecs / 60);
        const secs = totalSecs % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const ensureEvaluationContext = async (currentUserId: string): Promise<string> => {
        if (evaluationId) return evaluationId;

        const title = (testData.testTitle || 'Evaluación Sumativa').trim();
        const { data, error } = await supabase
            .from('evaluations')
            .insert({
                user_id: currentUserId,
                title,
                grade: testData.grade || '',
                subject: testData.subject || '',
                unit: testData.unit || '',
                status: 'active',
            })
            .select('id')
            .single();

        if (error || !data?.id) {
            throw new Error(error?.message || 'No se pudo crear la evaluación base.');
        }

        setEvaluationId(data.id);
        return data.id;
    };

    const checkItemReuse = async (questionText: string) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

            const { data: usedItems } = await supabase
                .from('evaluation_items')
                .select('evaluation_id')
                .eq('question', questionText)
                .gte('created_at', sixMonthsAgo.toISOString())
                .limit(1);

            if (usedItems && usedItems.length > 0) {
                toast.warning('Este ítem ya fue usado en otra evaluación reciente. Considera modificarlo para evitar repetición.');
            }
        } catch {
            // Silently fail - this is a non-critical check
        }
    };

    // --- Handlers ---

    const handleGenerate = async () => {
        if (!userId) {
            toast.error('Debes iniciar sesión para generar evaluaciones');
            return;
        }

        setGenerating(true);
        try {
            const stableEvaluationId = await ensureEvaluationContext(userId);

            const { fetchOAsStatic } = await import('@/shared/lib/staticCurriculum');
            const unitOAs = await fetchOAsStatic(testData.grade || '', testData.subject || '', testData.unit || '');

            // Mapping blueprint for API
            const blueprintPayload = blueprint.map(row => {
                const oaData = unitOAs.find(o => (o.label === row.oa || o.id === row.oa));
                return {
                    id: row.id,
                    oa: row.oa,
                    oa_description: oaData?.description || '', // ¡CORRECCIÓN CLAVE PARA EL CONTEXTO!
                    topic: row.topic,
                    skill: row.skill,
                    itemType: row.itemType,
                    count: row.count,
                    elementsPerItem: row.elementsPerItem,
                };
            });

            const payload = {
                userId,
                evaluationId: stableEvaluationId,
                testTitle: testData.testTitle,
                grade: testData.grade,
                subject: testData.subject,
                unit: testData.unit,
                blueprint: blueprintPayload
            };

            // FEATURE FLAG: default = endpoint Next.js multi-tipo (30-90s).
            // Opt-out legacy: NEXT_PUBLIC_USE_LEGACY_EVAL_GENERATOR=true vuelve al webhook n8n.
            const useLegacy = process.env.NEXT_PUBLIC_USE_LEGACY_EVAL_GENERATOR === 'true';
            const targetUrl = useLegacy ? webhookUrl : '/api/evaluations/generate';

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 min timeout
            const response = await fetch(targetUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || 'Error en la generación');
            }

            const data = await response.json();
            const responseEvaluationId = data?.evaluationId || data?.evaluation_id || stableEvaluationId;
            setEvaluationId(responseEvaluationId);

            // The webhook may return items (old flow) or Drive URLs (new flow with merge)
            if (data.items && Array.isArray(data.items)) {
                const newItems = data.items.map((item: Record<string, unknown>, idx: number) => ({
                    ...item,
                    id: item.id || Date.now() + idx
                }));
                setItems(newItems);
                setGenerated(true);
                setGenerating(false);
                toast.success(`¡${newItems.length} ítems generados con éxito!`);
            } else if (data.evaluacion || data.webContentLink || data.pauta) {
                // New flow: webhook returns Drive URLs after merge
                setGenerating(false);
                const evalUrl = data.evaluacion || data.webContentLink;
                const pautaUrl = data.pauta;

                // Download both files
                if (evalUrl) window.open(evalUrl, '_blank');
                if (pautaUrl) setTimeout(() => window.open(pautaUrl, '_blank'), 500);

                toast.success('¡Evaluación y Pauta generadas! Descargando archivos...');

                // Return to dashboard after a short delay
                setTimeout(() => onFinalize(), 1500);
            } else {
                // Unknown format — stop generating and go back
                setGenerating(false);
                toast.success('Evaluación generada correctamente');
                console.log('Webhook response:', data);
                setTimeout(() => onFinalize(), 1500);
            }

            // === PERSISTIR BLUEPRINT EN SUPABASE ===
            // Ahora expande Ordenamiento/Pareados/Completación a N slots OMR por ítem,
            // Doble Proceso a 1 TF + 1 MC, y Desarrollo/Respuesta Breve NO se persiste
            // en blueprint (no ocupan slot OMR, se manejan por is_manual en evaluation_items).
            try {
                const evaluationTarget = responseEvaluationId;
                const blueprintRows: Record<string, unknown>[] = [];
                let questionNumber = 1;

                for (const row of blueprint) {
                    const els = row.elementsPerItem ?? (row.itemType === 'Ordenamiento' ? 5 : row.itemType === 'Términos Pareados' ? 4 : 1);
                    for (let i = 0; i < row.count; i++) {
                        switch (row.itemType) {
                            case 'Verdadero o Falso':
                                blueprintRows.push({ evaluation_id: evaluationTarget, question_number: questionNumber++, question_type: 'tf', oa: row.oa, topic: row.topic, skill: row.skill });
                                break;
                            case 'Selección Múltiple':
                            case 'Completación':
                                blueprintRows.push({ evaluation_id: evaluationTarget, question_number: questionNumber++, question_type: 'mc', oa: row.oa, topic: row.topic, skill: row.skill });
                                break;
                            case 'Doble Proceso':
                                // 1 TF + 1 MC secuenciales (misma lógica que SM con V/F previo)
                                blueprintRows.push({ evaluation_id: evaluationTarget, question_number: questionNumber++, question_type: 'tf', oa: row.oa, topic: row.topic, skill: row.skill });
                                blueprintRows.push({ evaluation_id: evaluationTarget, question_number: questionNumber++, question_type: 'mc', oa: row.oa, topic: row.topic, skill: row.skill });
                                break;
                            case 'Ordenamiento':
                            case 'Términos Pareados':
                                // N slots MC consecutivos (cada elemento/ítem es 1 slot)
                                for (let j = 0; j < els; j++) {
                                    blueprintRows.push({ evaluation_id: evaluationTarget, question_number: questionNumber++, question_type: 'mc', oa: row.oa, topic: row.topic, skill: row.skill });
                                }
                                break;
                            case 'Desarrollo':
                            case 'Respuesta Breve':
                                // Sin slot OMR — se salta
                                break;
                            default:
                                // Fallback conservador
                                blueprintRows.push({ evaluation_id: evaluationTarget, question_number: questionNumber++, question_type: 'mc', oa: row.oa, topic: row.topic, skill: row.skill });
                        }
                    }
                }

                if (blueprintRows.length > 0) {
                    await supabase.from('evaluation_blueprint').delete().eq('evaluation_id', evaluationTarget);
                    await supabase.from('evaluation_blueprint').insert(blueprintRows);
                }
            } catch (bpError) {
                console.error('Error guardando blueprint:', bpError);
            }

        } catch (error) {
            console.error(error);
            toast.error('Error al conectar con el generador de evaluaciones');
            setGenerating(false); // Only set false on error, or rely on normal state
        }
    };

    const handleFinalizeAction = async () => {
        if (!evaluationId) {
            toast.error('No se pudo encontrar el ID de la evaluación para guardar los ítems.');
            return;
        }

        try {
            // Filtrar solo los ítems seleccionados
            const itemsToSave = items.filter(item => selectedItems.includes(item.id));

            if (itemsToSave.length > 0) {
                const dbItems = itemsToSave.map(item => ({
                    evaluation_id: evaluationId,
                    type: item.type || item.itemType || 'mc',
                    pedagogical_type: item.pedagogical_type || null,
                    group_id: item.group_id || null,
                    is_manual: item.is_manual ?? false,
                    rubric: item.rubric || null,
                    oa: item.oa,
                    topic: item.topic,
                    skill: item.skill,
                    difficulty: item.difficulty || 'medium',
                    question: item.question,
                    options: item.options || null,
                    correct_answer: item.correctAnswer || null,
                    explanation: item.explanation || null
                }));

                await supabase.from('evaluation_items').delete().eq('evaluation_id', evaluationId);
                const { error } = await supabase.from('evaluation_items').insert(dbItems);
                if (error) throw error;
            }

            confetti({
                particleCount: 150,
                spread: 90,
                origin: { y: 0.5 },
                colors: ['#8b5cf6', '#a78bfa', '#c4b5fd', '#ffffff']
            });
            toast.success('Evaluación publicada y enviada a tu correo.');
            onFinalize();
        } catch (error) {
            console.error('Error saving evaluation items:', error);
            toast.error('Ocurrió un error al guardar los ítems de la evaluación.');
        }
    };

    const handleSaveToBank = async (item: GeneratedItem) => {
        if (!userId) {
            toast.error('Debes iniciar sesión para usar el banco de ítems.');
            return;
        }

        try {
            const payload = {
                user_id: userId,
                subject: testData.subject,
                grade: testData.grade,
                oa: item.oa,
                cognitive_skill: item.skill || 'Desconocida',
                question_type: item.type || item.itemType || 'mc',
                question_text: item.question,
                options: item.options || null,
                correct_answer: item.correctAnswer || null,
                rubric: item.explanation || item.rubric || null,
                is_shared: false
            };

            const { error } = await supabase.from('item_bank').insert([payload]);
            if (error) throw error;
            toast.success('Pregunta guardada en tu banco personal.');
        } catch (error) {
            console.error('Error saving to bank:', error);
            toast.error('Ocurrió un error al guardar en el banco de ítems.');
        }
    };

    const handleImportFromBank = () => {
        setShowBankModal(true);
    };

    const toggleFavorite = async (itemId: string) => {
        setTogglingFav(itemId);
        try {
            const item = bankItems.find(i => i.id === itemId);
            if (!item) return;
            const newVal = !item.is_favorite;
            const { error } = await supabase.from('item_bank').update({ is_favorite: newVal }).eq('id', itemId);
            if (error) throw error;
            setBankItems(prev => prev.map(i => i.id === itemId ? { ...i, is_favorite: newVal } : i));
            toast.success(newVal ? 'Agregado a favoritos' : 'Removido de favoritos');
        } catch {
            toast.error('Error al actualizar favorito.');
        } finally {
            setTogglingFav(null);
        }
    };

    // EV-28: Request to share an item (pending UTP approval)
    const requestShareItem = async (itemId: string) => {
        try {
            const { error } = await supabase
                .from('item_bank')
                .update({ approval_status: 'pending' })
                .eq('id', itemId);
            if (error) throw error;
            toast.success('Solicitud de compartir enviada. UTP debe aprobar.');
        } catch {
            toast.error('Error al solicitar compartir el ítem.');
        }
    };

    const toggleBankItem = (id: string) => {
        setSelectedBankItemIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    };

    const handleConfirmBankImport = () => {
        if (selectedBankItemIds.length === 0) {
            toast.error('Selecciona al menos un ítem del banco.');
            return;
        }

        const chosen = bankItems.filter((item) => selectedBankItemIds.includes(item.id));
        if (chosen.length === 0) return;

        const existingFingerprint = new Set(
            items.map((it) => `${(it.question || '').trim().toLowerCase()}|${(it.oa || '').trim().toLowerCase()}`)
        );

        const baseId = Date.now();
        const imported = chosen
            .filter((item) => {
                const fp = `${(item.question_text || '').trim().toLowerCase()}|${(item.oa || '').trim().toLowerCase()}`;
                return !existingFingerprint.has(fp);
            })
            .map((item, idx) => ({
                id: baseId + idx,
                type: item.question_type || 'mc',
                itemType: item.question_type || 'mc',
                oa: item.oa || 'General',
                topic: item.subject || testData.subject || 'General',
                skill: item.cognitive_skill || 'No definida',
                difficulty: 'medium',
                question: item.question_text,
                options: item.options || null,
                correctAnswer: item.correct_answer || null,
                explanation: item.rubric || null,
            }));

        if (imported.length === 0) {
            toast.info('No se importaron ítems nuevos (posibles duplicados).');
            return;
        }

        const merged = [...items, ...imported];
        setItems(merged);
        setGenerated(true);
        const importedIds = imported.map((x) => x.id);
        const selectedSet = new Set<number>(selectedItems);
        importedIds.forEach((id) => selectedSet.add(id));
        useTestDesignerStore.getState().setSelectedItems(Array.from(selectedSet));

        setShowBankModal(false);
        setSelectedBankItemIds([]);
        setBankQuery('');
        toast.success(`Se importaron ${imported.length} ítems desde el banco.`);

        // Check each imported item for reuse in recent evaluations
        imported.forEach((item) => {
            if (item.question) {
                checkItemReuse(item.question);
            }
        });
    };

    const handlePrintEvaluation = () => {
        const itemsToPrint = items.filter((item: GeneratedItem) => selectedItems.includes(item.id));
        if (itemsToPrint.length === 0) {
            toast.error('Selecciona al menos un ítem para imprimir.');
            return;
        }

        const title = testData.testTitle || 'Evaluación Sumativa';

        const answerKeyHtml = `
            <div style="page-break-before: always; font-family: 'Inter', sans-serif;">
                <h2 style="font-size: 18px; font-weight: 700; margin-bottom: 20px;">Pauta de Corrección: ${title}</h2>
                <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px;">
                    <thead>
                        <tr style="background-color: #f3f4f6;">
                            <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">N°</th>
                            <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Respuesta Sugerida</th>
                            <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Habilidad</th>
                            <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">OA</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsToPrint.map((item: GeneratedItem, idx: number) => `
                            <tr>
                                <td style="border: 1px solid #d1d5db; padding: 10px;">${idx + 1}</td>
                                <td style="border: 1px solid #d1d5db; padding: 10px;"><b>${item.correctAnswer || '(Ver Rúbrica)'}</b></td>
                                <td style="border: 1px solid #d1d5db; padding: 10px; color: #4b5563;">${item.skill || '-'}</td>
                                <td style="border: 1px solid #d1d5db; padding: 10px; color: #4b5563;">${item.oa || '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        const html = `
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    @page { size: letter; margin: 20mm; }

    body { font-family: 'Inter', sans-serif; color: #111827; line-height: 1.5; background: #fff; margin: 0; }

    /* Header Institucional */
    .header { border-bottom: 2px solid #111827; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; }
    .header-left h1 { margin: 0 0 4px 0; font-size: 20px; font-weight: 700; text-transform: uppercase; }
    .header-left .subtitle { color: #4b5563; font-size: 14px; font-weight: 500; }
    .institution-box { text-align: right; font-size: 12px; color: #6b7280; }

    /* Datos del alumno */
    .student-data { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 32px; padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px; }
    .data-field { display: flex; font-size: 14px; }
    .data-field strong { margin-right: 8px; font-weight: 600; color: #374151; width: 60px; }
    .data-field .line-fill { flex: 1; border-bottom: 1px solid #9ca3af; }

    /* Cajas y Preguntas */
    .question-block { margin-bottom: 24px; page-break-inside: avoid; break-inside: avoid; }
    .question-title { font-size: 15px; font-weight: 500; margin-bottom: 12px; }
    .question-image { max-width: 400px; max-height: 300px; margin: 12px 0; display: block; border: 1px solid #d1d5db; border-radius: 4px; }

    /* Opciones */
    .options-grid { display: grid; grid-template-columns: 1fr; gap: 12px; margin-left: 20px; }
    .option-item { display: flex; align-items: flex-start; gap: 10px; font-size: 14px; color: #374151; }
    .circle { width: 14px; height: 14px; min-width: 14px; border: 1px solid #6b7280; border-radius: 50%; margin-top: 3px; }

    /* Líneas de desarrollo */
    .open-lines { margin-top: 20px; }
    .line { border-bottom: 1px solid #d1d5db; height: 28px; margin-bottom: 8px; }

    /* LaTeX block fixes */
    .math-inline { display: inline-block; }
    .math-display { display: block; text-align: center; margin: 10px 0; }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <h1>${title}</h1>
      <div class="subtitle">${testData.subject || 'Asignatura'} · ${testData.grade || 'Curso'}</div>
    </div>
    <div class="institution-box">
      <strong>EducMark Generative AI</strong><br/>
      Impreso el ${new Date().toLocaleDateString('es-CL')}
    </div>
  </div>

  <div class="student-data">
    <div class="data-field">
      <strong>Nombre:</strong>
      <div class="line-fill"></div>
    </div>
    <div class="data-field">
      <strong>Fecha:</strong>
      <div class="line-fill"></div>
    </div>
    <div class="data-field" style="grid-column: span 2;">
      <strong>Puntaje:</strong>
      <div style="flex: 1;">__________ / ${itemsToPrint.length} pts.</div>
      <strong style="margin-left:auto; width:auto; margin-right:8px;">Nota:</strong>
      <div style="width: 80px; border-bottom: 1px solid #9ca3af;"></div>
    </div>
  </div>

  <div class="questions">
    ${itemsToPrint.map((item: GeneratedItem, idx: number) => `
      <div class="question-block">
        ${item.stimulusText ? `
          <div class="stimulus-box" style="margin-bottom: 10px; padding: 12px 16px; background: #f8f9fa; border-left: 4px solid #6e56cf; border-radius: 0 8px 8px 0; font-size: 0.9em; line-height: 1.6;">
            <strong style="font-size: 0.75em; text-transform: uppercase; letter-spacing: 1px; color: #6e56cf; display: block; margin-bottom: 6px;">
              ${item.stimulusType === 'source' ? 'Fuente' : item.stimulusType === 'table' ? 'Datos' : 'Lee el siguiente texto'}
            </strong>
            <span style="white-space: pre-wrap;">${item.stimulusText}</span>
          </div>
        ` : ''}
        ${item.imageUrl ? `<img src="${item.imageUrl}" class="question-image" alt="Pregunta ${idx + 1}" />` : ''}
        <div class="question-title"><strong>${idx + 1}.</strong> ${item.question || '(Sin enunciado)'}</div>

        ${(item.options && item.options.length > 0) ? `
          <div class="options-grid">
            ${item.options.map((opt: string, i: number) => `
              <div class="option-item">
                <div class="circle"></div>
                <span>${String.fromCharCode(65 + i)}) ${opt}</span>
              </div>
            `).join('')}
          </div>
        ` : `
          <div class="open-lines">
            <div class="line"></div>
            <div class="line"></div>
            <div class="line"></div>
            <div class="line"></div>
          </div>
        `}
      </div>
    `).join('')}
  </div>

  ${answerKeyHtml}

  <script>
    window.onload = function() {
      if (window.MathJax) {
        MathJax.typesetPromise().then(() => {
          setTimeout(() => window.print(), 500);
        });
      } else {
        setTimeout(() => window.print(), 500);
      }
    };
  </script>
</body>
</html>`;

        const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=900,height=700');
        if (!printWindow) {
            toast.error('No se pudo abrir la ventana de impresión.');
            return;
        }
        printWindow.document.open();
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
    };

    const handleItemFieldChange = (itemId: number, field: keyof GeneratedItem, value: string | null) => {
        const nextItems = items.map((item: GeneratedItem) => (
            item.id === itemId ? { ...item, [field]: value } : item
        ));
        setItems(nextItems);
    };

    const handleImageUpload = (itemId: number, file: File) => {
        if (file.size > 2 * 1024 * 1024) {
            toast.error('La imagen no puede superar 2 MB.');
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            handleItemFieldChange(itemId, 'imageUrl', dataUrl);
        };
        reader.readAsDataURL(file);
    };

    const handleItemOptionChange = (itemId: number, optionIndex: number, value: string) => {
        const nextItems = items.map((item: GeneratedItem) => {
            if (item.id !== itemId) return item;
            const currentOptions = Array.isArray(item.options) ? [...item.options] : [];
            currentOptions[optionIndex] = value;
            return { ...item, options: currentOptions };
        });
        setItems(nextItems);
    };

    const handleDeleteItem = (itemId: number) => {
        const nextItems = items.filter((item: GeneratedItem) => item.id !== itemId);
        setItems(nextItems);
        const nextSelected = selectedItems.filter((id: number) => id !== itemId);
        useTestDesignerStore.getState().setSelectedItems(nextSelected);
        if (editingItemId === itemId) setEditingItemId(null);
        toast.success('Ítem eliminado.');
    };

    const handleMoveItem = (fromIndex: number, direction: 'up' | 'down') => {
        const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
        if (toIndex < 0 || toIndex >= items.length) return;
        const nextItems = [...items];
        const [moved] = nextItems.splice(fromIndex, 1);
        nextItems.splice(toIndex, 0, moved);
        setItems(nextItems);
    };

    const handleDropItem = (targetIndex: number) => {
        if (draggingIndex === null || draggingIndex === targetIndex) return;
        const nextItems = [...items];
        const [draggedItem] = nextItems.splice(draggingIndex, 1);
        nextItems.splice(targetIndex, 0, draggedItem);
        setItems(nextItems);
        setDraggingIndex(null);
    };

    const closeBankModal = () => {
        setShowBankModal(false);
        setSelectedBankItemIds([]);
        setBankQuery('');
    };

    const handleToggleItemWithReuse = (itemId: number, question?: string) => {
        const isCurrentlySelected = selectedItems.includes(itemId);
        onToggleItem(itemId);
        if (!isCurrentlySelected && question) {
            checkItemReuse(question);
        }
    };

    return {
        // Constants
        LOADING_MESSAGES,
        EDUCATIONAL_TIPS,
        COGNITIVE_SKILLS,

        // Store data
        blueprint,
        selectedItems,
        testData,
        items,

        // State
        generating,
        generated,
        showBankModal,
        bankLoading,
        bankQuery,
        setBankQuery,
        selectedBankItemIds,
        editingItemId,
        setEditingItemId,
        skillFilter,
        setSkillFilter,
        draggingIndex,
        setDraggingIndex,
        bankTabFilter,
        setBankTabFilter,
        togglingFav,
        editingSkillId,
        setEditingSkillId,
        stimulusText,
        setStimulusText,
        showStimulusInput,
        setShowStimulusInput,

        // Loader states
        elapsedTime,
        loadingStage,
        loadingProgress,
        currentTip,

        // Computed
        totalQuestions,
        currentCount,
        progress,
        itemsBySkill,
        skillOptions,
        filteredItems,
        filteredBankItems,

        // Helpers
        formatTime,

        // Handlers
        handleGenerate,
        handleFinalizeAction,
        handleSaveToBank,
        handleImportFromBank,
        handleConfirmBankImport,
        handlePrintEvaluation,
        handleItemFieldChange,
        handleImageUpload,
        handleItemOptionChange,
        handleDeleteItem,
        handleMoveItem,
        handleDropItem,
        toggleFavorite,
        requestShareItem,
        toggleBankItem,
        closeBankModal,
        handleToggleItemWithReuse,
    };
};
