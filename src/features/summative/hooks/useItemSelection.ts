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

        // Pauta de corrección: N°, Respuesta (o Rúbrica si is_manual), Tipo, Habilidad, OA
        let answerKeySlot = 0;
        const answerKeyRows = itemsToPrint.map((item: GeneratedItem) => {
            const isManual = !!item.is_manual;
            if (!isManual) answerKeySlot++;
            const slotLabel = isManual ? '—' : String(answerKeySlot);
            const typeLabel = item.pedagogical_type === 'doble_proceso' ? 'Doble Proceso'
                : item.pedagogical_type === 'ordenamiento' ? 'Ordenamiento'
                : item.pedagogical_type === 'pareados' ? 'Pareados'
                : item.pedagogical_type === 'completacion' ? 'Completación'
                : item.pedagogical_type === 'desarrollo' ? 'Desarrollo'
                : item.pedagogical_type === 'respuesta_breve' ? 'Respuesta Breve'
                : item.type === 'tf' ? 'V/F' : 'SM';
            const answerCell = isManual
                ? (item.rubric
                    ? `<em style="color:#b45309; font-size:12px;">Rúbrica:</em> ${item.rubric}`
                    : '<em style="color:#b45309;">(Corrección manual — sin rúbrica definida)</em>')
                : `<b>${item.correctAnswer || '—'}</b>`;
            const rowBg = isManual ? 'background-color:#fffbeb;' : '';
            return `
                <tr style="${rowBg}">
                    <td style="border: 1px solid #d1d5db; padding: 10px;">${slotLabel}</td>
                    <td style="border: 1px solid #d1d5db; padding: 10px;">${answerCell}</td>
                    <td style="border: 1px solid #d1d5db; padding: 10px; color: #4b5563; font-size:12px;">${typeLabel}</td>
                    <td style="border: 1px solid #d1d5db; padding: 10px; color: #4b5563;">${item.skill || '-'}</td>
                    <td style="border: 1px solid #d1d5db; padding: 10px; color: #4b5563;">${item.oa || '-'}</td>
                </tr>
            `;
        }).join('');

        const answerKeyHtml = `
            <div style="page-break-before: always; font-family: 'Inter', sans-serif;">
                <h2 style="font-size: 18px; font-weight: 700; margin-bottom: 8px;">Pauta de Corrección: ${title}</h2>
                <p style="font-size: 12px; color: #6b7280; margin-bottom: 20px;">N° = slot OMR. Los ítems marcados con "—" son de corrección manual (desarrollo / respuesta breve).</p>
                <table style="width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 14px;">
                    <thead>
                        <tr style="background-color: #f3f4f6;">
                            <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; width:50px;">N°</th>
                            <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Respuesta / Rúbrica</th>
                            <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; width:120px;">Tipo</th>
                            <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; width:140px;">Habilidad</th>
                            <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; width:100px;">OA</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${answerKeyRows}
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
    ${(() => {
        // Agrupa items consecutivos que comparten group_id + pedagogical_type
        // en bloques pedagógicos. Items manuales (desarrollo/respuesta breve)
        // no consumen slot OMR, los demás sí (contador separado).
        type Block = { kind: string; items: GeneratedItem[]; startSlot: number };
        const blocks: Block[] = [];
        let omrSlot = 1;
        for (let i = 0; i < itemsToPrint.length; i++) {
            const item = itemsToPrint[i];
            const kind = item.pedagogical_type || item.type || 'mc';
            const prev = blocks[blocks.length - 1];
            const isCompound = item.group_id && ['doble_proceso', 'ordenamiento', 'pareados', 'completacion'].includes(kind);
            if (isCompound && prev && prev.items[0].group_id === item.group_id) {
                prev.items.push(item);
            } else {
                blocks.push({ kind, items: [item], startSlot: item.is_manual ? 0 : omrSlot });
            }
            if (!item.is_manual) omrSlot++;
        }

        return blocks.map((block) => {
            const first = block.items[0];
            const slotRange = block.items.filter((i: GeneratedItem) => !i.is_manual).length > 1
                ? `preguntas ${block.startSlot} a ${block.startSlot + block.items.length - 1}`
                : `pregunta ${block.startSlot}`;

            // === Doble Proceso ===
            if (block.kind === 'doble_proceso' && block.items.length === 2) {
                const [tfItem, mcItem] = block.items;
                return `
                <div class="question-block" style="padding:14px 18px; background:#faf7ff; border:1px solid #e9d5ff; border-radius:10px;">
                    <div style="font-size:10px; letter-spacing:2px; color:#7c3aed; font-weight:700; text-transform:uppercase; margin-bottom:8px;">Doble Proceso · ${slotRange}</div>
                    <div class="question-title"><strong>${block.startSlot}.</strong> ${tfItem.question || ''} <span style="color:#7c3aed;">(Marca V o F)</span></div>
                    <div style="margin:10px 0 16px 20px; display:flex; gap:28px; font-size:14px;">
                        <div class="option-item"><div class="circle"></div><span>V) Verdadero</span></div>
                        <div class="option-item"><div class="circle"></div><span>F) Falso</span></div>
                    </div>
                    <div class="question-title"><strong>${block.startSlot + 1}.</strong> ${mcItem.question || ''}</div>
                    ${(mcItem.options && mcItem.options.length > 0) ? `
                        <div class="options-grid">
                            ${mcItem.options.map((opt: string, i: number) => `
                                <div class="option-item"><div class="circle"></div><span>${String.fromCharCode(65 + i)}) ${opt}</span></div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>`;
            }

            // === Ordenamiento ===
            if (block.kind === 'ordenamiento') {
                // Extrae el premise del primer item y los elementos del texto de cada pregunta
                const firstQ = first.question || '';
                const premise = firstQ.includes(' — Elemento ') ? firstQ.split(' — Elemento ')[0] : firstQ;
                const elements = block.items.map((it) => {
                    const m = (it.question || '').match(/— Elemento ([A-Z]): "([^"]*)"/);
                    return m ? { label: m[1], text: m[2] } : { label: '?', text: it.question || '' };
                });
                return `
                <div class="question-block" style="padding:14px 18px; background:#eff6ff; border:1px solid #bfdbfe; border-radius:10px;">
                    <div style="font-size:10px; letter-spacing:2px; color:#2563eb; font-weight:700; text-transform:uppercase; margin-bottom:8px;">Ordenamiento · ${slotRange}</div>
                    <div style="font-size:15px; margin-bottom:10px;"><strong>${premise}</strong></div>
                    <ul style="margin:10px 0 14px 24px; padding:0; list-style:none;">
                        ${elements.map((e) => `<li style="margin:4px 0; font-size:14px;"><strong style="color:#2563eb;">${e.label})</strong> ${e.text}</li>`).join('')}
                    </ul>
                    <div style="background:white; border:1px solid #bfdbfe; border-radius:8px; padding:10px 14px; font-size:13px; color:#1e3a8a;">
                        <strong>Instrucciones:</strong> en la hoja OMR, marca para cada elemento la posición correcta (1°, 2°, 3°, ...) en las <strong>${slotRange}</strong>. Cada posición corresponde a una letra: A=1°, B=2°, C=3°, D=4°, E=5°.
                    </div>
                </div>`;
            }

            // === Términos Pareados ===
            if (block.kind === 'pareados') {
                const firstQ = first.question || '';
                const premise = firstQ.includes(' — Ítem ') ? firstQ.split(' — Ítem ')[0] : firstQ;
                const colA = block.items.map((it) => {
                    const m = (it.question || '').match(/— Ítem ([A-Z0-9]+): "([^"]*)"/);
                    return m ? { label: m[1], text: m[2] } : { label: '?', text: it.question || '' };
                });
                const colB = (first.options || []).map((o: string) => o);
                return `
                <div class="question-block" style="padding:14px 18px; background:#fdf2f8; border:1px solid #fbcfe8; border-radius:10px;">
                    <div style="font-size:10px; letter-spacing:2px; color:#db2777; font-weight:700; text-transform:uppercase; margin-bottom:8px;">Términos Pareados · ${slotRange}</div>
                    <div style="font-size:15px; margin-bottom:10px;"><strong>${premise}</strong></div>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin:12px 0;">
                        <div>
                            <div style="font-size:11px; color:#9f1239; letter-spacing:1px; text-transform:uppercase; font-weight:700; margin-bottom:6px;">Columna A</div>
                            <ol style="margin:0; padding-left:18px;">
                                ${colA.map((a) => `<li style="margin:4px 0; font-size:14px;"><strong>${a.label}.</strong> ${a.text}</li>`).join('')}
                            </ol>
                        </div>
                        <div>
                            <div style="font-size:11px; color:#9f1239; letter-spacing:1px; text-transform:uppercase; font-weight:700; margin-bottom:6px;">Columna B (opciones)</div>
                            <ul style="margin:0; padding-left:18px; list-style:none;">
                                ${colB.map((b: string, i: number) => `<li style="margin:4px 0; font-size:14px;"><strong>${String.fromCharCode(65 + i)}.</strong> ${b}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                    <div style="background:white; border:1px solid #fbcfe8; border-radius:8px; padding:10px 14px; font-size:13px; color:#831843;">
                        <strong>Instrucciones:</strong> para cada ítem de columna A, marca en la hoja OMR la letra de columna B que le corresponde (${slotRange}).
                    </div>
                </div>`;
            }

            // === Desarrollo / Respuesta Breve ===
            if (first.is_manual) {
                const isDev = block.kind === 'desarrollo';
                const linesCount = isDev ? 8 : 3;
                return `
                <div class="question-block" style="padding:14px 18px; background:#fffbeb; border:1px solid #fde68a; border-radius:10px;">
                    <div style="font-size:10px; letter-spacing:2px; color:#b45309; font-weight:700; text-transform:uppercase; margin-bottom:8px;">
                        ${isDev ? 'Desarrollo' : 'Respuesta Breve'} · Corrección Manual
                    </div>
                    <div class="question-title">${first.question || '(Sin enunciado)'}</div>
                    <div class="open-lines" style="margin-top:12px;">
                        ${Array(linesCount).fill('<div class="line"></div>').join('')}
                    </div>
                    <div style="margin-top:8px; font-size:11px; color:#92400e; font-style:italic;">
                        Esta pregunta NO se responde en la hoja OMR; el docente la corrige manualmente.
                    </div>
                </div>`;
            }

            // === Default: MC / VF / Completación suelto ===
            return block.items.map((item: GeneratedItem, localIdx: number) => {
                const slotNum = first.is_manual ? '' : `${block.startSlot + localIdx}.`;
                return `
                <div class="question-block">
                    ${item.stimulusText ? `
                      <div class="stimulus-box" style="margin-bottom: 10px; padding: 12px 16px; background: #f8f9fa; border-left: 4px solid #6e56cf; border-radius: 0 8px 8px 0; font-size: 0.9em; line-height: 1.6;">
                        <strong style="font-size: 0.75em; text-transform: uppercase; letter-spacing: 1px; color: #6e56cf; display: block; margin-bottom: 6px;">
                          ${item.stimulusType === 'source' ? 'Fuente' : item.stimulusType === 'table' ? 'Datos' : 'Lee el siguiente texto'}
                        </strong>
                        <span style="white-space: pre-wrap;">${item.stimulusText}</span>
                      </div>
                    ` : ''}
                    ${item.imageUrl ? `<img src="${item.imageUrl}" class="question-image" alt="Pregunta ${slotNum}" />` : ''}
                    <div class="question-title"><strong>${slotNum}</strong> ${item.question || '(Sin enunciado)'}</div>

                    ${(item.options && item.options.length > 0) ? `
                      <div class="options-grid">
                        ${item.options.map((opt: string, i: number) => `
                          <div class="option-item">
                            <div class="circle"></div>
                            <span>${String.fromCharCode(65 + i)}) ${opt}</span>
                          </div>
                        `).join('')}
                      </div>
                    ` : ''}
                </div>`;
            }).join('');
        }).join('');
    })()}
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

        // Usamos iframe oculto en vez de window.open() para evitar bloqueo de pop-ups.
        // Crea un iframe, escribe el HTML, dispara print, y limpia después.
        try {
            const iframe = document.createElement('iframe');
            iframe.style.position = 'fixed';
            iframe.style.right = '0';
            iframe.style.bottom = '0';
            iframe.style.width = '0';
            iframe.style.height = '0';
            iframe.style.border = '0';
            iframe.setAttribute('aria-hidden', 'true');
            document.body.appendChild(iframe);

            const doc = iframe.contentWindow?.document;
            if (!doc) {
                toast.error('No se pudo preparar la impresión. Intenta descargar el PDF.');
                iframe.remove();
                return;
            }

            doc.open();
            doc.write(html);
            doc.close();

            // El HTML ya tiene window.onload que llama window.print() después de MathJax.
            // Como estamos en iframe, onload dispara dentro del iframe.
            // Limpiamos el iframe 60s después (suficiente para imprimir).
            setTimeout(() => iframe.remove(), 60000);
        } catch (err) {
            console.error('[Print] iframe failed, falling back to window.open:', err);
            // Fallback a window.open si el iframe falla por algún motivo
            const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=900,height=700');
            if (!printWindow) {
                toast.error('No se pudo abrir la ventana de impresión. Revisa que los pop-ups estén permitidos.');
                return;
            }
            printWindow.document.open();
            printWindow.document.write(html);
            printWindow.document.close();
            printWindow.focus();
        }
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
        setSelectedItems: useTestDesignerStore.getState().setSelectedItems,
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
