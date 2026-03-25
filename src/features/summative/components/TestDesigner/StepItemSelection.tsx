'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, Sparkles, Wand2, RefreshCw, Mail, Check, Save, Download, Trash2, ArrowUp, ArrowDown, Pencil, X, GripVertical, Heart, ImagePlus, Printer, Clock, FileText, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Button } from '@/shared/components/ui/UIComponents';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { useTestDesignerStore } from '@/features/summative/store/useTestDesignerStore';
import { Modal } from '@/shared/components/ui/UIComponents';
import { LatexInlineRenderer } from '../shared/LatexInlineRenderer';

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

interface StepItemSelectionProps {
    onFinalize: () => void;
}

interface BankItemRow {
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

interface GeneratedItem {
    id: number;
    type?: string;
    itemType?: string;
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

export const StepItemSelection: React.FC<StepItemSelectionProps> = ({ onFinalize }) => {
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

    const COGNITIVE_SKILLS = ['Recordar', 'Comprender', 'Aplicar', 'Analizar', 'Evaluar', 'Crear'];

    const totalQuestions = blueprint.reduce((acc, row) => acc + row.count, 0);
    const currentCount = selectedItems.length;
    const progress = Math.round((currentCount / (totalQuestions || 1)) * 100);

    const webhookUrl = process.env.NEXT_PUBLIC_SUMMATIVE_WEBHOOK_URL || 'https://n8n.educmark.cl/webhook/summative-generate';

    // Generador Loader UI States
    const [elapsedTime, setElapsedTime] = useState(0);
    const [loadingStage, setLoadingStage] = useState(0);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [currentTip, setCurrentTip] = useState(0);

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

    const formatTime = (ms: number) => {
        const totalSecs = Math.floor(ms / 1000);
        const mins = Math.floor(totalSecs / 60);
        const secs = totalSecs % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        supabase.auth.getUser().then(({ data, error }) => {
            if (error) {
                console.error('Error fetching user:', error);
                return;
            }
            if (data?.user) setUserId(data.user.id);
        }).catch(err => console.error('Error in getUser:', err));
    }, []);

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
                    count: row.count
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

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 240000); // 4 min timeout
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!response.ok) throw new Error('Error en la generación');

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
                setGenerated(true);
                setGenerating(false);
                const links = [];
                if (data.evaluacion || data.webContentLink) links.push('Evaluación');
                if (data.pauta) links.push('Pauta');
                toast.success(`¡Evaluación generada! Archivos: ${links.join(' + ')}`);

                // Open evaluation download in new tab
                const evalUrl = data.evaluacion || data.webContentLink;
                if (evalUrl) {
                    window.open(evalUrl, '_blank');
                }
            } else {
                // Unknown format but not an error — just stop generating
                setGenerated(true);
                setGenerating(false);
                toast.success('Evaluación generada correctamente');
                console.log('Webhook response:', data);
            }

            // === PERSISTIR BLUEPRINT EN SUPABASE ===
            try {
                const evaluationTarget = responseEvaluationId;
                const blueprintRows: Record<string, unknown>[] = [];
                let questionNumber = 1;

                for (const row of blueprint) {
                    for (let i = 0; i < row.count; i++) {
                        blueprintRows.push({
                            evaluation_id: evaluationTarget,
                            question_number: questionNumber,
                            question_type: row.itemType === 'Verdadero o Falso' ? 'tf' : 'mc',
                            oa: row.oa,
                            topic: row.topic,
                            skill: row.skill,
                        });
                        questionNumber++;
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

    const loadBankItems = async () => {
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
    };

    useEffect(() => {
        if (showBankModal) {
            loadBankItems();
        }
    }, [showBankModal, userId]);

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

    const itemsBySkill = items.reduce<Record<string, number>>((acc, item: GeneratedItem) => {
        const skill = (item.skill || 'No definida').trim();
        acc[skill] = (acc[skill] || 0) + 1;
        return acc;
    }, {});
    const skillOptions = ['all', ...Object.keys(itemsBySkill).sort((a, b) => a.localeCompare(b))];
    const filteredItems = items
        .map((item: GeneratedItem, index: number) => ({ item, index }))
        .filter(({ item }) => skillFilter === 'all' || (item.skill || 'No definida') === skillFilter);

    return (
        <div className="w-full h-full font-[var(--font-body)]">

            {!generated && !generating && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className="text-center py-6 h-full flex flex-col justify-center animate-fade-in-up"
                >
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[var(--primary)]/20 to-[var(--secondary)]/20 flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(139,92,246,0.3)] border border-[var(--primary)]/30">
                        <Sparkles size={48} className="text-[var(--primary)] animate-pulse fill-current" />
                    </div>

                    <h2 className="text-3xl font-bold text-[var(--on-background)] mb-2">¡Todo listo para armar tu Evaluación!</h2>
                    <p className="text-[var(--muted)] mb-10">Revisa la tabla de especificaciones antes de que el motor pedagógico comience a procesar.</p>

                    <div className="max-w-4xl mx-auto bg-[var(--input-bg)] border border-[var(--border)] rounded-2xl p-8 mb-10 text-left relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--primary)]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                        <div className="grid grid-cols-2 gap-y-6 gap-x-8 relative z-10 w-full">
                            <div>
                                <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider block mb-1">Asignatura</span>
                                <div className="flex items-center gap-2 text-[var(--foreground)] font-medium text-lg">
                                    {testData.subject}
                                </div>
                            </div>
                            <div>
                                <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider block mb-1">Curso</span>
                                <div className="text-[var(--foreground)] font-medium text-lg">{testData.grade}</div>
                            </div>

                            <div className="col-span-2 pt-4 border-t border-[var(--border)]/50 mt-2">
                                <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider block mb-4">Tabla de Especificaciones Resumida ({totalQuestions} preguntas)</span>
                                <div className="space-y-2 relative z-10 w-full overflow-hidden">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                                        {blueprint.map(row => (
                                            <div key={row.id} className="text-sm p-3 rounded-xl bg-[var(--card)]/50 border border-[var(--border)] w-full">
                                                <div className="flex justify-between items-center mb-1 w-full">
                                                    <span className="text-[var(--on-background)] font-medium text-xs line-clamp-1" title={row.topic}>{row.topic}</span>
                                                    <span className="text-[10px] font-bold bg-[var(--primary)]/10 text-[var(--primary)] px-2 py-0.5 rounded border border-[var(--primary)]/20 whitespace-nowrap ml-2">
                                                        {row.count} ítems
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between mt-2">
                                                    <span className="text-[10px] text-[var(--muted)] uppercase bg-[var(--input-bg)] px-1.5 py-0.5 rounded border border-[var(--border)]">{row.itemType}</span>
                                                    <span className="text-[10px] text-[var(--muted)] truncate max-w-[150px] ml-2">OA: {row.oa}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-center items-center w-full">
                        <Button
                            onClick={handleGenerate}
                            className="bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] hover:brightness-110 !px-12 !py-4 rounded-xl text-lg font-bold shadow-[0_0_30px_rgba(139,92,246,0.5)] border-none transform hover:scale-105 transition-all w-full max-w-sm flex items-center justify-center gap-3"
                        >
                            <Wand2 className="fill-white" size={24} /> Generar Preguntas
                        </Button>
                    </div>
                </motion.div>
            )}

            {generating && (
                <div className="py-12 max-w-2xl mx-auto h-full flex flex-col justify-center animate-fade-in">
                    {/* Main Icon with Animation */}
                    <div className="relative w-28 h-28 mx-auto mb-8 mt-12">
                        <div className="absolute inset-0 bg-[var(--primary)]/30 rounded-full animate-ping"></div>
                        <div className="absolute inset-0 bg-[var(--secondary)]/20 rounded-full animate-pulse"></div>
                        <div className="relative z-10 w-full h-full bg-[var(--card)] rounded-full flex items-center justify-center border-2 border-[var(--primary)] shadow-[0_0_50px_rgba(139,92,246,0.5)]">
                            <span className="text-4xl">{LOADING_MESSAGES[loadingStage]?.icon || '✨'}</span>
                        </div>
                    </div>

                    {/* Current Stage Message */}
                    <h3 className="text-2xl font-bold text-[var(--foreground)] mb-2 text-center h-[3rem]">
                        {LOADING_MESSAGES[loadingStage]?.text || 'Generando evaluación...'}
                    </h3>

                    {/* Timer Display */}
                    <div className="flex items-center justify-center gap-2 text-[var(--muted)] mb-6">
                        <Clock size={16} />
                        <span className="font-mono text-lg">{formatTime(elapsedTime)}</span>
                        <span className="text-sm opacity-70"> / est. 3-4 min</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="relative mb-8 px-4">
                        <div className="h-3 bg-[var(--border)] rounded-full overflow-hidden w-full">
                            <motion.div
                                className="h-full bg-gradient-to-r from-[var(--primary)] via-[var(--secondary)] to-[var(--primary)] rounded-full shadow-[0_0_10px_rgba(139,92,246,0.5)]"
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(loadingProgress, 100)}%` }}
                                transition={{ duration: 0.5, ease: "easeOut" }}
                            />
                        </div>
                        <div className="flex justify-between mt-3 text-xs text-[var(--muted)]">
                            <span>Fase {Math.min(loadingStage + 1, LOADING_MESSAGES.length)} de {LOADING_MESSAGES.length}</span>
                            <span className="font-bold text-[var(--primary)]">{Math.min(Math.round(loadingProgress), 100)}%</span>
                        </div>
                    </div>

                    {/* Educational Tip */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentTip}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className="bg-[var(--primary-bg)]/30 border border-[var(--primary)]/20 rounded-xl p-5 text-center mt-6 shadow-inner mx-4"
                        >
                            <p className="text-sm text-[var(--primary)] font-medium">💡 Sabías que...</p>
                            <p className="text-sm text-[var(--muted)] italic mt-2">
                                {EDUCATIONAL_TIPS[currentTip]}
                            </p>
                        </motion.div>
                    </AnimatePresence>

                    {/* Reassurance Message */}
                    <p className="text-[var(--muted)] text-sm mt-8 text-center opacity-75">
                        El motor de Inteligencia Artificial está construyendo tu instrumento docente.<br />Por favor, no cierres esta pestaña.
                    </p>
                </div>
            )}

            {generated && !generating && (
                <div className="flex flex-col md:flex-row h-full gap-6 items-start animate-fade-in-up font-[var(--font-body)]">
                    {/* Left: Summary */}
                    <div className="w-full md:w-80 space-y-4 md:sticky md:top-0 flex-shrink-0">
                        <div className="glass-card-premium p-5 rounded-2xl border border-[var(--border)] shadow-lg relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-b from-[var(--primary)]/5 to-transparent pointer-events-none"></div>

                            <h3 className="font-bold text-[var(--on-background)] mb-4 text-xs uppercase tracking-wider border-b border-[var(--border)] pb-3 flex justify-between items-center relative z-10 font-[var(--font-heading)]">
                                <span>Progreso de Armado</span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${progress >= 100 ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-[var(--card)] text-[var(--muted)] border border-[var(--border)]'}`}>
                                    {progress}%
                                </span>
                            </h3>

                            <div className="space-y-2 relative z-10 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                                {blueprint.map(row => {
                                    const countSelected = items.filter((item: GeneratedItem) =>
                                        selectedItems.includes(item.id) &&
                                        ((item as any).blueprintRowId === row.id || ((item.type || item.itemType) === row.itemType && item.oa === row.oa))
                                    ).length;
                                    return (
                                        <div key={row.id} className="text-sm p-3 rounded-xl bg-[var(--input-bg)] border border-[var(--border)] group hover:border-[var(--primary)]/30 transition-colors">
                                            <div className="flex justify-between font-semibold items-center mb-1">
                                                <span className="text-[var(--on-background)] line-clamp-1 text-xs" title={row.topic}>{row.topic}</span>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap border ${countSelected >= row.count ? 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20 shadow-[0_0_10px_var(--success)]' : 'bg-[var(--primary)]/5 text-[var(--primary)] border-[var(--primary)]/10'}`}>
                                                    {countSelected}/{row.count}
                                                </span>
                                            </div>
                                            <div className="flex gap-2 text-[10px] text-[var(--muted)]">
                                                <span className="bg-[var(--card)] border border-[var(--border)] px-1.5 py-0.5 rounded opacity-80">{row.itemType}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="mt-6 pt-4 border-t border-[var(--border)] relative z-10">
                                <div className="flex justify-between items-center text-xs text-[var(--muted)] mb-2">
                                    <span>Total Seleccionado</span>
                                    <span className="text-[var(--on-background)] font-bold">{currentCount} / {totalQuestions}</span>
                                </div>
                                <div className="w-full bg-[var(--input-bg)] h-2 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-500 shadow-[0_0_10px_var(--primary)] ${progress >= 100 ? 'bg-green-500' : 'bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)]'}`}
                                        style={{ width: `${Math.min(progress, 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={handlePrintEvaluation}
                                disabled={currentCount === 0}
                                className="w-full bg-[var(--card)] border border-[var(--border)] text-[var(--on-background)] py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 hover:bg-[var(--card-hover)] hover:border-[var(--primary)] disabled:opacity-50 disabled:grayscale"
                            >
                                <Printer size={18} /> Imprimir Prueba y Pauta
                            </button>
                            <button
                                onClick={handleFinalizeAction}
                                disabled={currentCount === 0}
                                className="w-full btn-gradient py-4 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 group disabled:opacity-50 disabled:grayscale"
                            >
                                <Mail size={18} className="group-hover:animate-bounce" /> Finalizar y Publicar
                            </button>
                        </div>
                    </div>

                    {/* Right: Items List */}
                    <div className="flex-1 flex flex-col min-h-[600px] w-full mt-0">
                        {/* EV-14: Shared stimulus text */}
                        <div className="mb-3">
                            <button
                                onClick={() => setShowStimulusInput(!showStimulusInput)}
                                className="text-xs font-bold text-[var(--primary)] hover:underline flex items-center gap-1"
                            >
                                <FileText size={14} />
                                {showStimulusInput ? 'Ocultar texto compartido' : 'Agregar texto compartido (estímulo)'}
                            </button>
                            {showStimulusInput && (
                                <div className="mt-2 p-3 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl">
                                    <label className="text-xs text-[var(--muted)] mb-1 block">Texto estímulo que precede a un grupo de preguntas:</label>
                                    <textarea
                                        value={stimulusText}
                                        onChange={(e) => setStimulusText(e.target.value)}
                                        placeholder="Ej: Lee el siguiente texto y responde las preguntas 1 a 5..."
                                        rows={4}
                                        className="w-full px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg text-sm resize-y"
                                    />
                                    {stimulusText && (
                                        <p className="text-[10px] text-emerald-400 mt-1">Este texto se imprimirá antes de los ítems seleccionados.</p>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="p-4 bg-[var(--card)]/50 border-b border-[var(--border)] flex justify-between items-center rounded-t-2xl backdrop-blur-md sticky top-0 z-20">
                            <div className="space-y-2">
                                <h3 className="font-bold text-[var(--on-background)] flex items-center gap-2 font-[var(--font-heading)]">
                                    <Sparkles size={18} className="text-[var(--primary)] fill-current" />
                                    Sugerencias del Sistema
                                    <span className="text-xs font-normal text-[var(--muted)] ml-2 bg-[var(--input-bg)] px-2 py-0.5 rounded border border-[var(--border)]">
                                        {items.length} resultados
                                    </span>
                                </h3>
                                <div className="flex items-center gap-2">
                                    <label className="text-xs text-[var(--muted)]">Filtrar por habilidad:</label>
                                    <select
                                        value={skillFilter}
                                        onChange={(e) => setSkillFilter(e.target.value)}
                                        className="text-xs rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-2 py-1.5"
                                    >
                                        <option value="all">Todas</option>
                                        {skillOptions.filter((skill) => skill !== 'all').map((skill) => (
                                            <option key={skill} value={skill}>{skill}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={handleImportFromBank} className="text-xs text-[var(--foreground)] font-bold hover:text-[var(--secondary)] flex items-center gap-1 transition-colors px-3 py-1.5 rounded-lg hover:bg-[var(--card)] border border-transparent hover:border-[var(--border)]">
                                    <Download size={14} /> Importar desde Banco
                                </button>
                                <button onClick={handleGenerate} className="text-xs text-[var(--primary)] font-bold hover:text-[var(--secondary)] flex items-center gap-1 transition-colors px-3 py-1.5 rounded-lg hover:bg-[var(--primary)]/5 border border-transparent hover:border-[var(--primary)]/20">
                                    <RefreshCw size={12} /> Regenerar todo
                                </button>
                            </div>
                        </div>

                        <div className="px-4 pt-4">
                            <div className="glass-card-premium rounded-xl border border-[var(--border)] p-3">
                                <p className="text-xs font-semibold text-[var(--on-background)] mb-2">Distribución por habilidad cognitiva</p>
                                <div className="space-y-2">
                                    {Object.entries(itemsBySkill).length === 0 && (
                                        <p className="text-xs text-[var(--muted)]">Sin ítems generados.</p>
                                    )}
                                    {Object.entries(itemsBySkill).map(([skill, count]) => {
                                        const percent = Math.round((count / (items.length || 1)) * 100);
                                        return (
                                            <div key={skill}>
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span className="text-[var(--muted)]">{skill}</span>
                                                    <span className="text-[var(--on-background)] font-semibold">{count} ({percent}%)</span>
                                                </div>
                                                <div className="h-2 rounded-full bg-[var(--input-bg)] overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)]"
                                                        style={{ width: `${percent}% ` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-auto p-4 space-y-4 custom-scrollbar">
                            {filteredItems.map(({ item, index }) => {
                                const isSelected = selectedItems.includes(item.id);
                                const isEditing = editingItemId === item.id;
                                return (
                                    <div
                                        key={item.id}
                                        draggable
                                        onDragStart={() => setDraggingIndex(index)}
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={() => handleDropItem(index)}
                                        onDragEnd={() => setDraggingIndex(null)}
                                        className={`glass - card - premium p - 6 rounded - 2xl border transition - all duration - 300 relative group
                                        ${isSelected
                                                ? 'border-[var(--primary)] bg-[var(--primary)]/5 shadow-[0_0_20px_rgba(139,92,246,0.1)]'
                                                : 'border-[var(--border)] hover:border-[var(--primary)]/30 hover:bg-[var(--card-hover)]'
                                            }
                                        ${draggingIndex === index ? 'opacity-60' : ''}
        `}
                                    >
                                        <div className="absolute top-4 right-4 flex gap-2 z-10">
                                            <button
                                                onClick={() => setEditingItemId(isEditing ? null : item.id)}
                                                className="p-2.5 rounded-xl transition-all flex items-center gap-2 bg-[var(--input-bg)] text-[var(--muted)] hover:text-[var(--primary)] border border-[var(--border)] hover:border-[var(--primary)] opacity-0 group-hover:opacity-100"
                                                title={isEditing ? 'Cancelar edición' : 'Editar ítem'}
                                            >
                                                {isEditing ? <X size={16} /> : <Pencil size={16} />}
                                            </button>
                                            <button
                                                onClick={() => handleMoveItem(index, 'up')}
                                                className="p-2.5 rounded-xl transition-all flex items-center gap-2 bg-[var(--input-bg)] text-[var(--muted)] hover:text-[var(--on-background)] border border-[var(--border)] hover:border-[var(--primary)] opacity-0 group-hover:opacity-100"
                                                title="Mover arriba"
                                                disabled={index === 0}
                                            >
                                                <ArrowUp size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleMoveItem(index, 'down')}
                                                className="p-2.5 rounded-xl transition-all flex items-center gap-2 bg-[var(--input-bg)] text-[var(--muted)] hover:text-[var(--on-background)] border border-[var(--border)] hover:border-[var(--primary)] opacity-0 group-hover:opacity-100"
                                                title="Mover abajo"
                                                disabled={index === items.length - 1}
                                            >
                                                <ArrowDown size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteItem(item.id)}
                                                className="p-2.5 rounded-xl transition-all flex items-center gap-2 bg-[var(--input-bg)] text-[var(--muted)] hover:text-red-500 border border-[var(--border)] hover:border-red-500 opacity-0 group-hover:opacity-100"
                                                title="Eliminar ítem"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleSaveToBank(item)}
                                                className="p-2.5 rounded-xl transition-all flex items-center gap-2 bg-[var(--input-bg)] text-[var(--muted)] hover:text-[var(--warning)] border border-[var(--border)] hover:border-[var(--warning)] opacity-0 group-hover:opacity-100"
                                                title="Guardar en mi Banco de Ítems"
                                            >
                                                <Save size={16} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    onToggleItem(item.id);
                                                    if (!isSelected && item.question) {
                                                        checkItemReuse(item.question);
                                                    }
                                                }}
                                                className={`p - 2.5 rounded - xl transition - all flex items - center gap - 2
                                                ${isSelected
                                                        ? 'bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white shadow-lg shadow-indigo-500/30'
                                                        : 'bg-[var(--input-bg)] text-[var(--muted)] hover:text-[var(--primary)] border border-[var(--border)] hover:border-[var(--primary)]'
                                                    }
        `}
                                            >
                                                {isSelected ? <Check size={18} strokeWidth={3} /> : <Plus size={18} />}
                                                <span className="text-xs font-bold hidden sm:inline">{isSelected ? 'Seleccionada' : 'Seleccionar'}</span>
                                            </button>
                                        </div>

                                        <div className="flex gap-2 mb-4">
                                            <span className="bg-[var(--input-bg)] text-[var(--muted)] px-2 py-1 rounded-md text-[10px] font-bold uppercase border border-[var(--border)] tracking-wider inline-flex items-center gap-1">
                                                <GripVertical size={12} />
                                                Arrastrar
                                            </span>
                                            <span className="bg-[var(--primary)]/5 text-[var(--primary)] px-2.5 py-1 rounded-md text-[10px] font-bold uppercase border border-[var(--primary)]/10 tracking-wider">{item.type || item.itemType || 'Item'}</span>
                                            <span className="bg-[var(--input-bg)] text-[var(--muted)] px-2.5 py-1 rounded-md text-[10px] font-bold uppercase border border-[var(--border)]">{item.oa || 'OA'}</span>
                                            <span className="bg-[var(--input-bg)] text-[var(--muted)] px-2.5 py-1 rounded-md text-[10px] font-bold uppercase border border-[var(--border)]">{item.difficulty || 'General'}</span>
                                            {/* EV-09: Editable cognitive skill badge */}
                                            <span className="relative">
                                                {editingSkillId === item.id ? (
                                                    <select
                                                        value={item.skill || ''}
                                                        onChange={(e) => {
                                                            handleItemFieldChange(item.id, 'skill', e.target.value);
                                                            setEditingSkillId(null);
                                                        }}
                                                        onBlur={() => setEditingSkillId(null)}
                                                        autoFocus
                                                        className="bg-[var(--input-bg)] text-[var(--muted)] px-2 py-1 rounded-md text-[10px] font-bold border border-[var(--primary)] focus:outline-none"
                                                    >
                                                        {COGNITIVE_SKILLS.map(sk => (
                                                            <option key={sk} value={sk}>{sk}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <button
                                                        onClick={() => setEditingSkillId(item.id)}
                                                        className="bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase border border-amber-500/20 tracking-wider cursor-pointer hover:border-amber-500/50 transition-colors"
                                                        title="Clic para cambiar habilidad cognitiva"
                                                    >
                                                        {item.skill || 'Habilidad'}
                                                    </button>
                                                )}
                                            </span>
                                        </div>

                                        {!isEditing && (
                                            <>
                                                {item.stimulusText && (
                                                    <div className="mb-4 p-4 bg-[var(--input-bg)] border-l-4 border-[var(--primary)] rounded-r-xl">
                                                        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--primary)] mb-2 block">
                                                            {item.stimulusType === 'source' ? '📜 Fuente' : item.stimulusType === 'table' ? '📊 Datos' : '📖 Lee el siguiente texto'}
                                                        </span>
                                                        <p className="text-sm text-[var(--on-background)] leading-relaxed whitespace-pre-wrap font-[var(--font-body)]">
                                                            {item.stimulusText}
                                                        </p>
                                                    </div>
                                                )}
                                                {item.imageUrl && (
                                                    <div className="mb-4 max-w-md">
                                                        <img src={item.imageUrl} alt="Imagen del enunciado" className="rounded-xl border border-[var(--border)] shadow-md max-h-48 object-contain" />
                                                    </div>
                                                )}
                                                <p className="text-[var(--on-background)] font-medium mb-3 pr-32 text-lg leading-relaxed font-[var(--font-body)]">
                                                    <LatexInlineRenderer text={item.question || ''} />
                                                </p>
                                            </>
                                        )}

                                        {isEditing && (
                                            <div className="space-y-3 mb-6 pr-2">
                                                {/* Stimulus Text */}
                                                <div>
                                                    <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] mb-1 block">
                                                        📖 Texto estímulo (opcional)
                                                    </label>
                                                    <textarea
                                                        value={item.stimulusText || ''}
                                                        onChange={(e) => handleItemFieldChange(item.id, 'stimulusText', e.target.value || null)}
                                                        placeholder="Ej: Lee el siguiente fragmento: &quot;En 1879, Chile enfrentó...&quot;"
                                                        rows={3}
                                                        className="w-full rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm resize-y"
                                                    />
                                                    {item.stimulusText && (
                                                        <select
                                                            value={item.stimulusType || 'text'}
                                                            onChange={(e) => handleItemFieldChange(item.id, 'stimulusType', e.target.value)}
                                                            className="mt-1 text-xs rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-2 py-1"
                                                        >
                                                            <option value="text">📖 Texto</option>
                                                            <option value="source">📜 Fuente</option>
                                                            <option value="table">📊 Tabla/Datos</option>
                                                        </select>
                                                    )}
                                                </div>
                                                {/* Question */}
                                                <div>
                                                    <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] mb-1 block">
                                                        Enunciado
                                                    </label>
                                                    <textarea
                                                        value={item.question || ''}
                                                        onChange={(e) => handleItemFieldChange(item.id, 'question', e.target.value)}
                                                        className="w-full min-h-[90px] rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm"
                                                    />
                                                </div>
                                                {/* Image Upload */}
                                                <div className="flex items-center gap-3">
                                                    <label className="flex items-center gap-2 px-3 py-2 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl text-xs font-medium text-[var(--muted)] hover:border-[var(--primary)] hover:text-[var(--primary)] cursor-pointer transition-colors">
                                                        <ImagePlus size={16} />
                                                        {item.imageUrl ? 'Cambiar imagen' : 'Agregar imagen'}
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            className="hidden"
                                                            onChange={(e) => {
                                                                const file = e.target.files?.[0];
                                                                if (file) handleImageUpload(item.id, file);
                                                            }}
                                                        />
                                                    </label>
                                                    {item.imageUrl && (
                                                        <>
                                                            <img src={item.imageUrl} alt="Preview" className="h-12 w-12 object-cover rounded-lg border border-[var(--border)]" />
                                                            <button
                                                                type="button"
                                                                onClick={() => handleItemFieldChange(item.id, 'imageUrl', null)}
                                                                className="text-[10px] text-red-400 hover:text-red-300 transition-colors"
                                                            >
                                                                Quitar
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    <input
                                                        value={item.oa || ''}
                                                        onChange={(e) => handleItemFieldChange(item.id, 'oa', e.target.value)}
                                                        className="w-full rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm"
                                                        placeholder="OA"
                                                    />
                                                    <input
                                                        value={item.skill || ''}
                                                        onChange={(e) => handleItemFieldChange(item.id, 'skill', e.target.value)}
                                                        className="w-full rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm"
                                                        placeholder="Habilidad cognitiva"
                                                    />
                                                </div>
                                                <input
                                                    value={item.correctAnswer || ''}
                                                    onChange={(e) => handleItemFieldChange(item.id, 'correctAnswer', e.target.value)}
                                                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm"
                                                    placeholder="Respuesta correcta"
                                                />
                                            </div>
                                        )}

                                        {/* Render options if available (Selection) — EV-15: Doble Proceso uses vertical layout */}
                                        {item.options && Array.isArray(item.options) && (
                                            <div className={`gap-3 max-w-2xl ${(item.type || item.itemType) === 'Doble Proceso' ? 'flex flex-col' : 'grid grid-cols-1 md:grid-cols-2'}`}>
                                                {item.options.map((opt: string, i: number) => (
                                                    <div key={i} className="p-3 rounded-xl border text-sm flex gap-3 items-center transition-colors bg-[var(--input-bg)] border-[var(--border)] hover:bg-[var(--card)]">
                                                        <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-[var(--border)] text-[var(--muted)]">
                                                            {String.fromCharCode(65 + i)}
                                                        </span>
                                                        {!isEditing && (
                                                            <span className="text-[var(--muted)]">
                                                                <LatexInlineRenderer text={opt || ''} />
                                                            </span>
                                                        )}
                                                        {isEditing && (
                                                            <input
                                                                value={opt}
                                                                onChange={(e) => handleItemOptionChange(item.id, i, e.target.value)}
                                                                className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--card)] px-2 py-1 text-xs"
                                                            />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Render answer key if not selection or for debug */}
                                        {!item.options && item.correctAnswer && (
                                            <div className="p-4 bg-[var(--input-bg)] rounded-xl border border-[var(--border)] text-sm text-[var(--muted)] italic mt-4">
                                                Respuesta esperada: <LatexInlineRenderer text={item.correctAnswer || ''} />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            <Modal
                isOpen={showBankModal}
                onClose={() => {
                    setShowBankModal(false);
                    setSelectedBankItemIds([]);
                    setBankQuery('');
                }}
                title="Importar desde Banco de Ítems"
            >
                <div className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={16} />
                        <input
                            value={bankQuery}
                            onChange={(e) => setBankQuery(e.target.value)}
                            placeholder="Buscar por OA, pregunta, asignatura o habilidad..."
                            className="w-full pl-10 pr-4 py-2.5 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl text-sm"
                        />
                    </div>

                    {/* Filter tabs */}
                    <div className="flex gap-1 p-1 bg-[var(--input-bg)] rounded-lg border border-[var(--border)]">
                        {([['all', 'Todos'], ['own', 'Míos'], ['shared', 'Compartidos'], ['favorites', '❤️ Favoritos']] as const).map(([key, label]) => (
                            <button
                                key={key}
                                onClick={() => setBankTabFilter(key as any)}
                                className={`flex-1 px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${bankTabFilter === key ? 'bg-[var(--primary)] text-white' : 'text-[var(--muted)] hover:text-[var(--foreground)]'}`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    <div className="max-h-[50vh] overflow-auto border border-[var(--border)] rounded-xl">
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 bg-[var(--card)] border-b border-[var(--border)]">
                                <tr>
                                    <th className="py-2 px-3 text-left">Sel.</th>
                                    <th className="py-2 px-3 text-left">⭐</th>
                                    <th className="py-2 px-3 text-left">OA</th>
                                    <th className="py-2 px-3 text-left">Pregunta</th>
                                    <th className="py-2 px-3 text-left">Tipo</th>
                                    <th className="py-2 px-3 text-left">Habilidad</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bankLoading && (
                                    <tr>
                                        <td colSpan={6} className="py-4 px-3 text-center text-[var(--muted)]">Cargando ítems...</td>
                                    </tr>
                                )}
                                {!bankLoading && filteredBankItems.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="py-4 px-3 text-center text-[var(--muted)]">No hay ítems para importar.</td>
                                    </tr>
                                )}
                                {!bankLoading && filteredBankItems.map((item) => (
                                    <tr key={item.id} className="border-b border-[var(--border)]">
                                        <td className="py-2 px-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedBankItemIds.includes(item.id)}
                                                onChange={() => toggleBankItem(item.id)}
                                                className="accent-[var(--primary)]"
                                            />
                                        </td>
                                        <td className="py-2 px-3">
                                            <button
                                                onClick={() => toggleFavorite(item.id)}
                                                disabled={togglingFav === item.id}
                                                className="p-1 rounded transition-colors"
                                            >
                                                <Heart size={14} className={item.is_favorite ? 'fill-red-400 text-red-400' : 'text-[var(--muted)] hover:text-red-400'} />
                                            </button>
                                        </td>
                                        <td className="py-2 px-3 whitespace-nowrap">{item.oa || '—'}</td>
                                        <td className="py-2 px-3 max-w-[420px]">{item.question_text}</td>
                                        <td className="py-2 px-3 whitespace-nowrap">{item.question_type || '—'}</td>
                                        <td className="py-2 px-3 whitespace-nowrap">{item.cognitive_skill || '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => {
                                setShowBankModal(false);
                                setSelectedBankItemIds([]);
                                setBankQuery('');
                            }}
                            className="px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--muted)] hover:text-[var(--on-background)]"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleConfirmBankImport}
                            className="px-4 py-2 rounded-lg btn-gradient font-semibold"
                        >
                            Importar Seleccionados ({selectedBankItemIds.length})
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
