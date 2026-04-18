'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { createClient } from '@/lib/supabase/client';
import { useTestDesignerStore } from '@/features/summative/store/useTestDesignerStore';
import { fetchInstitutionBranding } from '@/shared/lib/institutionBranding';

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

        const itemsToSave = items.filter(item => selectedItems.includes(item.id));
        if (itemsToSave.length === 0) {
            toast.error('Selecciona al menos un ítem antes de publicar.');
            return;
        }

        // Normaliza el type al formato corto que espera el OMR (mc/tf) y la hoja de respuesta.
        const mapToShortType = (item: GeneratedItem): string => {
            const ped = item.pedagogical_type;
            if (ped === 'doble_proceso' || ped === 'tf') return item.type === 'tf' ? 'tf' : 'tf';
            if (ped === 'desarrollo' || ped === 'respuesta_breve') return 'manual';
            if (item.type === 'tf' || item.type === 'mc') return item.type;
            const t = (item.type || item.itemType || '').toLowerCase();
            if (t.includes('verdadero') || t === 'tf') return 'tf';
            if (t.includes('desarrollo') || t.includes('respuesta breve')) return 'manual';
            return 'mc';
        };

        const dbItems = itemsToSave.map(item => ({
            evaluation_id: evaluationId,
            type: mapToShortType(item),
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

        try {
            const { error: deleteError } = await supabase
                .from('evaluation_items')
                .delete()
                .eq('evaluation_id', evaluationId);
            if (deleteError) {
                console.error('[Publish] delete evaluation_items:', deleteError);
                throw new Error(`No se pudieron limpiar los ítems previos: ${deleteError.message}`);
            }

            const { error: insertError } = await supabase.from('evaluation_items').insert(dbItems);
            if (insertError) {
                console.error('[Publish] insert evaluation_items:', insertError);
                throw new Error(`No se pudieron guardar los ítems: ${insertError.message}`);
            }

            // Refrescar status + updated_at para que la prueba aparezca arriba en el banco.
            const { error: updateError } = await supabase
                .from('evaluations')
                .update({ status: 'active', updated_at: new Date().toISOString() })
                .eq('id', evaluationId);
            if (updateError) {
                console.warn('[Publish] update evaluation status (non-fatal):', updateError);
            }

            confetti({
                particleCount: 150,
                spread: 90,
                origin: { y: 0.5 },
                colors: ['#8b5cf6', '#a78bfa', '#c4b5fd', '#ffffff']
            });
            toast.success(`¡Prueba publicada! La encontrarás en tu banco de evaluaciones para imprimir la hoja OMR o escanear respuestas.`);
            onFinalize();
        } catch (error) {
            console.error('[Publish] Error saving evaluation:', error);
            const msg = error instanceof Error ? error.message : 'Error desconocido al publicar.';
            toast.error(msg);
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

    const handlePrintEvaluation = async () => {
        const itemsToPrint = items.filter((item: GeneratedItem) => selectedItems.includes(item.id));
        if (itemsToPrint.length === 0) {
            toast.error('Selecciona al menos un ítem para imprimir.');
            return;
        }

        const title = testData.testTitle || 'Evaluación Sumativa';

        // Logo + nombre institucional desde el perfil (misma lógica que la hoja OMR).
        let branding: { logo: string | null; institutionName: string | null } = { logo: null, institutionName: null };
        try {
            const result = await fetchInstitutionBranding();
            branding = { logo: result.logo, institutionName: result.institutionName };
        } catch (err) {
            console.warn('[Print] No se pudo cargar branding institucional:', err);
        }

        // === Agrupación por SECCIÓN pedagógica con numeración romana ===
        // Reordena los ítems en bloques: V/F, SM (incluye completación), Doble Proceso,
        // Ordenamiento, Pareados, Respuesta Breve, Desarrollo. Cada sección recibe un
        // header con puntaje total e instrucción específica.
        const POINTS_BY_SECTION: Record<string, number> = {
            tf: 1,
            mc: 2,
            doble_proceso: 3,
            ordenamiento: 1,
            pareados: 1,
            completacion: 1,
            respuesta_breve: 2,
            desarrollo: 4,
        };

        const SECTION_DEFS: { key: string; title: string; instruction: string }[] = [
            {
                key: 'tf',
                title: 'ÍTEM VERDADERO O FALSO',
                instruction: 'Escribe una V si la afirmación es verdadera o una F si es falsa. Debes justificar obligatoriamente las respuestas falsas para obtener el puntaje.',
            },
            {
                key: 'mc',
                title: 'ÍTEM DE SELECCIÓN MÚLTIPLE',
                instruction: 'Marca con una X (equis) la respuesta correcta. Solo una alternativa es válida; las respuestas con más de una marca o con borrones serán anuladas.',
            },
            {
                key: 'completacion',
                title: 'ÍTEM DE COMPLETACIÓN',
                instruction: 'Selecciona la alternativa que completa correctamente la afirmación.',
            },
            {
                key: 'doble_proceso',
                title: 'ÍTEM DE DOBLE PROCESO',
                instruction: 'Primero indica si la afirmación es verdadera o falsa. Luego justifica tu elección marcando la alternativa que mejor explique tu respuesta.',
            },
            {
                key: 'ordenamiento',
                title: 'ÍTEM DE ORDENAMIENTO',
                instruction: 'Ordena los elementos de acuerdo a la secuencia solicitada y marca la posición correspondiente en la hoja de respuestas.',
            },
            {
                key: 'pareados',
                title: 'ÍTEM DE TÉRMINOS PAREADOS',
                instruction: 'Asocia cada concepto de la columna A con su definición en la columna B. Marca la letra correspondiente en la hoja de respuestas.',
            },
            {
                key: 'respuesta_breve',
                title: 'ÍTEM DE RESPUESTA BREVE',
                instruction: 'Responde de forma breve, clara y precisa cada pregunta planteada.',
            },
            {
                key: 'desarrollo',
                title: 'ÍTEM DE DESARROLLO',
                instruction: 'Responde las siguientes preguntas de forma clara y fundamentada, usando un lenguaje formal y sin abreviaturas.',
            },
        ];

        const sectionKeyForItem = (item: GeneratedItem): string => {
            const ped = item.pedagogical_type;
            if (ped && ['doble_proceso', 'ordenamiento', 'pareados', 'completacion', 'desarrollo', 'respuesta_breve'].includes(ped)) {
                return ped;
            }
            const t = (item.type || item.itemType || '').toLowerCase();
            if (t === 'tf' || t === 'verdadero o falso') return 'tf';
            if (t === 'mc' || t === 'selección múltiple' || t === 'seleccion multiple') return 'mc';
            return 'mc';
        };

        // Agrupa por section key, colapsa group_id a un solo "ítem visual"
        const groupedBySection: Record<string, GeneratedItem[][]> = {};
        const seenGroups = new Set<string>();
        for (const item of itemsToPrint) {
            const sectionKey = sectionKeyForItem(item);
            if (!groupedBySection[sectionKey]) groupedBySection[sectionKey] = [];

            if (item.group_id && seenGroups.has(item.group_id)) continue;

            if (item.group_id && ['doble_proceso', 'ordenamiento', 'pareados', 'completacion'].includes(sectionKey)) {
                seenGroups.add(item.group_id);
                const groupItems = itemsToPrint.filter((it) => it.group_id === item.group_id);
                groupedBySection[sectionKey].push(groupItems);
            } else {
                groupedBySection[sectionKey].push([item]);
            }
        }

        // Calcula puntaje total por sección
        const sectionScores: Record<string, { itemCount: number; totalPoints: number }> = {};
        let totalEvalPoints = 0;
        for (const def of SECTION_DEFS) {
            const blocks = groupedBySection[def.key] || [];
            if (blocks.length === 0) continue;
            const ptsPerItem = POINTS_BY_SECTION[def.key] || 1;
            // Para grupos compound, cada elemento del grupo cuenta (Ordenamiento/Pareados con N elementos)
            const itemCount = blocks.reduce((acc, blk) => acc + (def.key === 'ordenamiento' || def.key === 'pareados' ? blk.length : 1), 0);
            const totalPoints = itemCount * ptsPerItem;
            sectionScores[def.key] = { itemCount, totalPoints };
            totalEvalPoints += totalPoints;
        }

        // Renderiza una sección completa
        const renderSection = (def: { key: string; title: string; instruction: string }, romanIdx: number, startSlot: { value: number }): string => {
            const blocks = groupedBySection[def.key] || [];
            if (blocks.length === 0) return '';
            const score = sectionScores[def.key];
            const ptsPerItem = POINTS_BY_SECTION[def.key] || 1;
            const headerLine = `${ROMAN[romanIdx]}. ${def.title} (${ptsPerItem} pto${ptsPerItem !== 1 ? 's' : ''}. c/u. Total ${score.totalPoints} pto${score.totalPoints !== 1 ? 's' : ''}.)`;

            const itemsHtml = blocks.map((block) => {
                const first = block[0];

                // Doble Proceso (group_id, 2 ítems V/F + SM)
                if (def.key === 'doble_proceso' && block.length >= 2) {
                    const [tfItem, mcItem] = block;
                    const startNum = startSlot.value;
                    startSlot.value += 2;
                    return `
                    <div class="question-block">
                        <div class="question-title"><strong>${startNum}.</strong> ${tfItem.question || ''}</div>
                        <div style="margin:6px 0 12px 24px; display:flex; gap:28px; font-size:14px;">
                            <div class="option-item"><div class="circle"></div><span>V) Verdadero</span></div>
                            <div class="option-item"><div class="circle"></div><span>F) Falso</span></div>
                        </div>
                        <div class="question-title"><strong>${startNum + 1}.</strong> ${mcItem.question || ''}</div>
                        ${(mcItem.options && mcItem.options.length > 0) ? `
                            <div class="options-grid">
                                ${mcItem.options.map((opt: string, i: number) => `
                                    <div class="option-item"><strong>${String.fromCharCode(65 + i)})</strong> ${stripLetterPrefix(opt)}</div>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>`;
                }

                // Ordenamiento
                if (def.key === 'ordenamiento') {
                    const firstQ = first.question || '';
                    const premise = firstQ.includes(' — Elemento ') ? firstQ.split(' — Elemento ')[0] : firstQ;
                    const elements = block.map((it) => {
                        const m = (it.question || '').match(/— Elemento ([A-Z]): "([^"]*)"/);
                        return m ? { label: m[1], text: m[2] } : { label: '?', text: it.question || '' };
                    });
                    const startNum = startSlot.value;
                    startSlot.value += block.length;
                    return `
                    <div class="question-block">
                        <div class="question-title"><strong>${startNum}–${startNum + block.length - 1}.</strong> ${premise}</div>
                        <ul style="margin:8px 0 8px 28px; padding:0; list-style:none;">
                            ${elements.map((e) => `<li style="margin:3px 0; font-size:14px;"><strong>${e.label})</strong> ${e.text}</li>`).join('')}
                        </ul>
                    </div>`;
                }

                // Términos Pareados
                if (def.key === 'pareados') {
                    const firstQ = first.question || '';
                    const premise = firstQ.includes(' — Ítem ') ? firstQ.split(' — Ítem ')[0] : firstQ;
                    const colA = block.map((it) => {
                        const m = (it.question || '').match(/— Ítem ([A-Z0-9]+): "([^"]*)"/);
                        return m ? { label: m[1], text: m[2] } : { label: '?', text: it.question || '' };
                    });
                    const colB = (first.options || []).map((o: string) => o);
                    const startNum = startSlot.value;
                    startSlot.value += block.length;
                    return `
                    <div class="question-block">
                        <div class="question-title"><strong>${startNum}–${startNum + block.length - 1}.</strong> ${premise}</div>
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin:10px 0 0 0;">
                            <div>
                                <div style="font-size:11px; letter-spacing:1px; text-transform:uppercase; font-weight:700; margin-bottom:4px;">Columna A</div>
                                <ol style="margin:0; padding-left:18px;">
                                    ${colA.map((a) => `<li style="margin:3px 0; font-size:14px;"><strong>${a.label}.</strong> ${a.text}</li>`).join('')}
                                </ol>
                            </div>
                            <div>
                                <div style="font-size:11px; letter-spacing:1px; text-transform:uppercase; font-weight:700; margin-bottom:4px;">Columna B</div>
                                <ul style="margin:0; padding-left:18px; list-style:none;">
                                    ${colB.map((b: string, i: number) => `<li style="margin:3px 0; font-size:14px;"><strong>${String.fromCharCode(65 + i)}.</strong> ${stripLetterPrefix(b)}</li>`).join('')}
                                </ul>
                            </div>
                        </div>
                    </div>`;
                }

                // Desarrollo / Respuesta Breve
                if (def.key === 'desarrollo' || def.key === 'respuesta_breve') {
                    const linesCount = def.key === 'desarrollo' ? 8 : 3;
                    const startNum = startSlot.value;
                    startSlot.value += 1;
                    return `
                    <div class="question-block">
                        <div class="question-title"><strong>${startNum}.</strong> ${first.question || '(Sin enunciado)'}</div>
                        <div class="open-lines" style="margin-top:10px;">
                            ${Array(linesCount).fill('<div class="line"></div>').join('')}
                        </div>
                    </div>`;
                }

                // V/F suelto
                if (def.key === 'tf') {
                    const startNum = startSlot.value;
                    startSlot.value += 1;
                    return `
                    <div class="question-block">
                        <div class="question-title">
                            <span style="display:inline-block; min-width:30px; border-bottom:1px solid #6b7280; margin-right:8px; text-align:center;">&nbsp;</span>
                            <strong>${startNum}.</strong> ${first.question || '(Sin enunciado)'}
                        </div>
                        <div style="margin:6px 0 0 38px; font-size:12px; color:#4b5563;">Justificación (si es Falso): <span style="display:inline-block; width:60%; border-bottom:1px solid #d1d5db;">&nbsp;</span></div>
                    </div>`;
                }

                // Default: MC / Completación
                const startNum = startSlot.value;
                startSlot.value += 1;
                return `
                <div class="question-block">
                    ${first.stimulusText ? `
                      <div class="stimulus-box" style="margin-bottom: 10px; padding: 12px 16px; background: #f8f9fa; border-left: 4px solid #6e56cf; border-radius: 0 8px 8px 0; font-size: 0.9em; line-height: 1.6;">
                        <strong style="font-size: 0.75em; text-transform: uppercase; letter-spacing: 1px; color: #6e56cf; display: block; margin-bottom: 6px;">
                          ${first.stimulusType === 'source' ? 'Fuente' : first.stimulusType === 'table' ? 'Datos' : 'Lee el siguiente texto'}
                        </strong>
                        <span style="white-space: pre-wrap;">${first.stimulusText}</span>
                      </div>
                    ` : ''}
                    ${first.imageUrl ? `<img src="${first.imageUrl}" class="question-image" alt="Pregunta ${startNum}" />` : ''}
                    <div class="question-title"><strong>${startNum}.</strong> ${first.question || '(Sin enunciado)'}</div>
                    ${(first.options && first.options.length > 0) ? `
                      <div class="options-grid">
                        ${first.options.map((opt: string, i: number) => `
                          <div class="option-item"><strong>${String.fromCharCode(65 + i)})</strong> ${stripLetterPrefix(opt)}</div>
                        `).join('')}
                      </div>
                    ` : ''}
                </div>`;
            }).join('');

            return `
            <div class="section-block">
                <h2 class="section-header">${headerLine}</h2>
                <p class="section-instruction"><strong>Instrucciones:</strong> ${def.instruction}</p>
                ${itemsHtml}
            </div>`;
        };

        // Remueve "A.", "A)", "a)" etc. del inicio del texto de la opción
        // para evitar que salga duplicado cuando nuestro renderer ya agrega "A)".
        const stripLetterPrefix = (s: string): string =>
            (s || '').replace(/^\s*[A-Za-z][\.\)]\s+/, '');

        const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
        const slotCounter = { value: 1 };
        let romanIdx = 0;
        const sectionsHtml = SECTION_DEFS.map((def) => {
            if (!groupedBySection[def.key] || groupedBySection[def.key].length === 0) return '';
            const html = renderSection(def, romanIdx, slotCounter);
            romanIdx++;
            return html;
        }).join('');

        // Pauta de corrección: N° (correlativo de impresión), Respuesta, Tipo, Habilidad, OA.
        // Reordenada para coincidir con el orden de impresión por sección.
        // Se compacta la columna OA: solo el código (OA 16) para evitar páginas infinitas;
        // el texto completo va en un glosario al final (una vez por OA, no repetido).
        const itemsForAnswerKey: GeneratedItem[] = [];
        for (const def of SECTION_DEFS) {
            const blocks = groupedBySection[def.key] || [];
            for (const block of blocks) {
                for (const it of block) itemsForAnswerKey.push(it);
            }
        }

        // Extrae el código corto del OA (ej "OA 16" de "OA 16 — Reconocer que la Constitución…")
        const extractOACode = (oa: string | undefined): string => {
            if (!oa) return '—';
            const m = oa.match(/^(OA\s*\d+[A-Za-z]?)/i);
            return m ? m[1].replace(/\s+/g, ' ') : oa.slice(0, 10);
        };
        const extractOAText = (oa: string | undefined): string => {
            if (!oa) return '';
            return oa.replace(/^OA\s*\d+[A-Za-z]?\s*[—\-:]\s*/i, '').trim();
        };

        // Numeración impresa: incluye manuales (47, 48, 49…). Coincide con lo que el alumno ve.
        let printNum = 0;
        let omrSlot = 0;
        const answerKeyRows = itemsForAnswerKey.map((item: GeneratedItem) => {
            const isManual = !!item.is_manual;
            printNum++;
            if (!isManual) omrSlot++;
            const typeLabel = item.pedagogical_type === 'doble_proceso' ? 'Doble P.'
                : item.pedagogical_type === 'ordenamiento' ? 'Orden.'
                : item.pedagogical_type === 'pareados' ? 'Pareados'
                : item.pedagogical_type === 'completacion' ? 'Compl.'
                : item.pedagogical_type === 'desarrollo' ? 'Desarrollo'
                : item.pedagogical_type === 'respuesta_breve' ? 'Resp. Breve'
                : item.type === 'tf' ? 'V/F' : 'SM';
            const answerCell = isManual
                ? (item.rubric
                    ? `<em style="color:#b45309;">Rúbrica:</em> ${item.rubric}`
                    : '<em style="color:#b45309;">Corrección manual</em>')
                : `<b>${item.correctAnswer || '—'}</b>`;
            const rowBg = isManual ? 'background-color:#fffbeb;' : '';
            const numCell = isManual
                ? `<b>${printNum}</b> <span style="color:#9ca3af; font-size:10px;">(manual)</span>`
                : `<b>${printNum}</b>`;
            return `
                <tr style="${rowBg}">
                    <td style="border: 1px solid #d1d5db; padding: 5px 7px;">${numCell}</td>
                    <td style="border: 1px solid #d1d5db; padding: 5px 7px;">${answerCell}</td>
                    <td style="border: 1px solid #d1d5db; padding: 5px 7px; color: #4b5563;">${typeLabel}</td>
                    <td style="border: 1px solid #d1d5db; padding: 5px 7px; color: #4b5563;">${item.skill || '-'}</td>
                    <td style="border: 1px solid #d1d5db; padding: 5px 7px; color: #4b5563; font-weight:600;">${extractOACode(item.oa)}</td>
                </tr>
            `;
        }).join('');

        // Glosario de OAs — uno por código, ordenado por número
        const oaSet = new Map<string, string>();
        for (const it of itemsForAnswerKey) {
            const code = extractOACode(it.oa);
            if (code !== '—' && !oaSet.has(code)) {
                oaSet.set(code, extractOAText(it.oa));
            }
        }
        const sortedOAs = Array.from(oaSet.entries()).sort((a, b) => {
            const numA = parseInt(a[0].replace(/\D/g, ''), 10) || 0;
            const numB = parseInt(b[0].replace(/\D/g, ''), 10) || 0;
            return numA - numB;
        });
        const oaGlossaryHtml = sortedOAs.length > 0 ? `
            <h3 style="font-size:13px; font-weight:700; margin:18px 0 6px 0; text-transform:uppercase; letter-spacing:0.5px;">Objetivos de Aprendizaje</h3>
            <table style="width:100%; border-collapse:collapse; font-size:11px;">
                <tbody>
                    ${sortedOAs.map(([code, text]) => `
                        <tr>
                            <td style="border:1px solid #d1d5db; padding:4px 7px; font-weight:700; width:70px; vertical-align:top;">${code}</td>
                            <td style="border:1px solid #d1d5db; padding:4px 7px; color:#374151;">${text}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        ` : '';

        const answerKeyHtml = `
            <div style="page-break-before: always; font-family: 'Inter', sans-serif;">
                <h2 style="font-size: 16px; font-weight: 700; margin-bottom: 4px;">Pauta de Corrección: ${title}</h2>
                <p style="font-size: 11px; color: #6b7280; margin-bottom: 10px;">N° = número impreso en la prueba. Filas amarillas = corrección manual (desarrollo/respuesta breve). Total OMR: ${omrSlot} ítems.</p>
                <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                    <thead>
                        <tr style="background-color: #f3f4f6;">
                            <th style="border: 1px solid #d1d5db; padding: 6px 7px; text-align: left; width:60px;">N°</th>
                            <th style="border: 1px solid #d1d5db; padding: 6px 7px; text-align: left;">Respuesta / Rúbrica</th>
                            <th style="border: 1px solid #d1d5db; padding: 6px 7px; text-align: left; width:90px;">Tipo</th>
                            <th style="border: 1px solid #d1d5db; padding: 6px 7px; text-align: left; width:110px;">Habilidad</th>
                            <th style="border: 1px solid #d1d5db; padding: 6px 7px; text-align: left; width:70px;">OA</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${answerKeyRows}
                    </tbody>
                </table>
                ${oaGlossaryHtml}
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

    @page { size: legal; margin: 18mm; }

    body { font-family: 'Inter', sans-serif; color: #111827; line-height: 1.45; background: #fff; margin: 0; font-size: 13px; }

    /* Header institucional con logo */
    .header { display: grid; grid-template-columns: 90px 1fr 130px; gap: 14px; align-items: center; padding-bottom: 12px; margin-bottom: 14px; border-bottom: 2px solid #111827; }
    .header-logo { width: 90px; height: 90px; display: flex; align-items: center; justify-content: center; }
    .header-logo img { max-width: 90px; max-height: 90px; object-fit: contain; }
    .header-logo .logo-placeholder { width: 80px; height: 80px; border: 1px dashed #9ca3af; display: flex; align-items: center; justify-content: center; font-size: 9px; color: #9ca3af; text-align: center; padding: 6px; }
    .header-center { text-align: center; }
    .header-center .institution-name { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #374151; margin-bottom: 4px; }
    .header-center h1 { margin: 0; font-size: 18px; font-weight: 700; text-transform: uppercase; color: #111827; }
    .header-center .subtitle { color: #4b5563; font-size: 12px; font-weight: 500; margin-top: 2px; }
    .nota-box { border: 2px solid #111827; border-radius: 6px; padding: 8px 10px; text-align: center; }
    .nota-box .label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; }
    .nota-box .value-line { height: 36px; border-bottom: 1px solid #9ca3af; margin-top: 4px; }

    /* Datos del alumno (tabla compacta) */
    .student-table { width: 100%; border-collapse: collapse; margin-bottom: 14px; font-size: 12px; }
    .student-table td { border: 1px solid #d1d5db; padding: 6px 8px; }
    .student-table .label-cell { background: #f9fafb; font-weight: 600; color: #374151; width: 18%; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; }

    /* Instrucciones generales */
    .general-instructions { border: 1px solid #d1d5db; border-radius: 6px; padding: 10px 14px; margin-bottom: 18px; background: #f9fafb; }
    .general-instructions h3 { margin: 0 0 6px 0; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #111827; }
    .general-instructions ul { margin: 0; padding-left: 18px; font-size: 12px; color: #374151; }
    .general-instructions li { margin: 2px 0; }

    /* Sección con header + instrucción */
    .section-block { margin: 18px 0 12px 0; page-break-inside: auto; }
    .section-header { font-size: 13px; font-weight: 700; text-transform: uppercase; margin: 0 0 4px 0; padding: 6px 10px; background: #111827; color: #fff; border-radius: 4px; letter-spacing: 0.5px; page-break-after: avoid; break-after: avoid; }
    .section-instruction { font-size: 12px; color: #374151; margin: 0 0 12px 0; padding: 6px 10px; background: #f3f4f6; border-left: 3px solid #6e56cf; font-style: italic; page-break-after: avoid; break-after: avoid; }

    /* Preguntas — widow/orphan control para evitar enunciados colgados al final de página */
    .question-block { margin-bottom: 14px; page-break-inside: avoid; break-inside: avoid; orphans: 3; widows: 3; }
    .question-title { font-size: 13px; font-weight: 500; margin-bottom: 8px; line-height: 1.5; page-break-after: avoid; break-after: avoid; }
    .question-image { max-width: 380px; max-height: 280px; margin: 8px 0; display: block; border: 1px solid #d1d5db; border-radius: 4px; }

    /* Opciones: 1 columna, sin burbujas (el alumno marca con X sobre la letra) */
    .options-grid { display: flex; flex-direction: column; gap: 6px; margin: 4px 0 6px 30px; }
    .option-item { display: block; font-size: 13px; color: #1f2937; line-height: 1.45; }

    /* Líneas de desarrollo */
    .open-lines { margin-top: 8px; }
    .line { border-bottom: 1px solid #d1d5db; height: 22px; margin-bottom: 4px; }

    /* LaTeX */
    .math-inline { display: inline-block; }
    .math-display { display: block; text-align: center; margin: 8px 0; }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
</head>
<body>
  <div class="header">
    <div class="header-logo">
      ${branding.logo
        ? `<img src="${branding.logo}" alt="Logo institución" />`
        : `<div class="logo-placeholder">Sin logo institucional</div>`
      }
    </div>
    <div class="header-center">
      ${branding.institutionName ? `<div class="institution-name">${branding.institutionName}</div>` : ''}
      <h1>${title}</h1>
      <div class="subtitle">${testData.subject || 'Asignatura'} · ${testData.grade || 'Curso'}${testData.unit ? ` · ${testData.unit}` : ''}</div>
    </div>
    <div class="nota-box">
      <div class="label">Nota</div>
      <div class="value-line"></div>
    </div>
  </div>

  <table class="student-table">
    <tbody>
      <tr>
        <td class="label-cell">Nombre</td>
        <td colspan="3"></td>
      </tr>
      <tr>
        <td class="label-cell">Curso</td>
        <td style="width:32%;"></td>
        <td class="label-cell">Fecha</td>
        <td></td>
      </tr>
      <tr>
        <td class="label-cell">Puntaje ideal</td>
        <td style="width:32%;">${totalEvalPoints} pts.</td>
        <td class="label-cell">Puntaje obtenido</td>
        <td></td>
      </tr>
    </tbody>
  </table>

  <div class="general-instructions">
    <h3>Instrucciones generales</h3>
    <ul>
      <li>Lee con atención cada pregunta antes de responder.</li>
      <li>Usa lápiz pasta azul o negro. <strong>No se acepta el uso de corrector</strong>.</li>
      <li>Mantén tu letra clara y legible.</li>
      <li>No está permitido el uso de celular ni dispositivos electrónicos durante la evaluación.</li>
      <li>Cualquier indicio de copia anula la evaluación.</li>
      <li>Lee atentamente las instrucciones específicas de cada sección antes de comenzar.</li>
    </ul>
  </div>

  <div class="questions">
    ${sectionsHtml}
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
