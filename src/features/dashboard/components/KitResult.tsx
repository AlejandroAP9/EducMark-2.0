'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Plus, Save, Send, Trash2, FileDown, CheckCircle2, Clock3, AlertCircle, History, ChevronDown, ChevronUp, RotateCcw, Undo2, Wand2, Loader2, Share2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

type TicketQuestionType = 'multiple_choice' | 'true_false' | 'open';

interface PlanningBlocks {
    objective: string;
    indicators: string[];
    inicio: string;
    desarrollo: string;
    cierre: string;
    resources: string[];
    planningText?: string;
}

interface ExitTicketQuestion {
    id: number;
    type: TicketQuestionType;
    question: string;
    options?: string[];
    answer?: string | null;
}

interface ExitTicket {
    title: string;
    instructions: string;
    questions: ExitTicketQuestion[];
}

interface GeneratedClassWorkflowRow {
    id: string;
    topic: string | null;
    objetivo_clase: string | null;
    asignatura: string | null;
    curso: string | null;
    planning_blocks: PlanningBlocks | null;
    exit_ticket: ExitTicket | null;
    planning_status: 'draft' | 'submitted' | 'approved' | 'changes_requested';
    approval_status: 'pending' | 'approved' | 'changes_requested';
    current_version: number | null;
    approval_notes: string | null;
    approved_at: string | null;
}

interface PlanningVersionRow {
    id: string;
    version_number: number;
    change_summary: string | null;
    created_at: string;
    edited_by: string;
    editor_name?: string;
}

const EMPTY_BLOCKS: PlanningBlocks = {
    objective: '',
    indicators: [],
    inicio: '',
    desarrollo: '',
    cierre: '',
    resources: [],
    planningText: '',
};

const EMPTY_EXIT_TICKET: ExitTicket = {
    title: 'Ticket de Salida',
    instructions: 'Responde al finalizar la clase.',
    questions: [],
};

function normalizeBlocks(raw: unknown): PlanningBlocks {
    const source = (raw && typeof raw === 'object' ? raw : {}) as Partial<PlanningBlocks>;
    return {
        objective: source.objective || '',
        indicators: Array.isArray(source.indicators) ? source.indicators.filter(Boolean).map(String) : [],
        inicio: source.inicio || '',
        desarrollo: source.desarrollo || '',
        cierre: source.cierre || '',
        resources: Array.isArray(source.resources) ? source.resources.filter(Boolean).map(String) : [],
        planningText: source.planningText || '',
    };
}

function normalizeTicket(raw: unknown): ExitTicket {
    const source = (raw && typeof raw === 'object' ? raw : {}) as Partial<ExitTicket>;
    const questions = Array.isArray(source.questions)
        ? source.questions
            .map((q, idx) => {
                const qRaw = q as Partial<ExitTicketQuestion>;
                const type = qRaw.type === 'multiple_choice' || qRaw.type === 'true_false' || qRaw.type === 'open'
                    ? qRaw.type
                    : 'open';
                return {
                    id: typeof qRaw.id === 'number' ? qRaw.id : idx + 1,
                    type,
                    question: qRaw.question || '',
                    options: Array.isArray(qRaw.options) ? qRaw.options.map((item) => String(item || '')) : (type === 'multiple_choice' ? ['', '', '', ''] : []),
                    answer: qRaw.answer ?? null,
                } satisfies ExitTicketQuestion;
            })
        : [];

    return {
        title: source.title || 'Ticket de Salida',
        instructions: source.instructions || 'Responde al finalizar la clase.',
        questions,
    };
}

export function KitResult() {
    const supabase = createClient();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const stateId = null as unknown as string;
    const generatedClassId = stateId || searchParams.get('id') || '';

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [summary, setSummary] = useState('');

    const [row, setRow] = useState<GeneratedClassWorkflowRow | null>(null);
    const [planningBlocks, setPlanningBlocks] = useState<PlanningBlocks>(EMPTY_BLOCKS);
    const [exitTicket, setExitTicket] = useState<ExitTicket>(EMPTY_EXIT_TICKET);
    const [baseSnapshot, setBaseSnapshot] = useState('');
    const [versions, setVersions] = useState<PlanningVersionRow[]>([]);
    const [showVersions, setShowVersions] = useState(false);
    const [undoStack, setUndoStack] = useState<Array<{ blocks: PlanningBlocks; ticket: ExitTicket }>>([]);
    const [regeneratingSection, setRegeneratingSection] = useState<string | null>(null);

    useEffect(() => {
        const loadClass = async () => {
            if (!generatedClassId) {
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('generated_classes')
                    .select('id, topic, objetivo_clase, asignatura, curso, planning_blocks, exit_ticket, planning_status, approval_status, current_version, approval_notes, approved_at')
                    .eq('id', generatedClassId)
                    .single();

                if (error) throw error;

                const parsedRow = data as GeneratedClassWorkflowRow;
                const normalizedBlocks = normalizeBlocks(parsedRow.planning_blocks);
                const normalizedTicket = normalizeTicket(parsedRow.exit_ticket);
                const snapshot = JSON.stringify({ normalizedBlocks, normalizedTicket });

                setRow(parsedRow);
                setPlanningBlocks(normalizedBlocks);
                setExitTicket(normalizedTicket);
                setBaseSnapshot(snapshot);
            } catch (error) {
                console.error('Error loading generated class workflow:', error);
                toast.error('No se pudo cargar la planificación.');
            } finally {
                setLoading(false);
            }
        };

        loadClass();
    }, [generatedClassId]);

    // Load version history
    useEffect(() => {
        if (!generatedClassId) return;
        const loadVersions = async () => {
            const { data, error } = await supabase
                .from('planning_versions')
                .select('id, version_number, change_summary, created_at, edited_by')
                .eq('generated_class_id', generatedClassId)
                .order('version_number', { ascending: false })
                .limit(20);

            if (error) { console.error('Error loading versions:', error); return; }
            const rows = (data || []) as PlanningVersionRow[];

            // Enrich editor names
            const userIds = [...new Set(rows.map(v => v.edited_by).filter(Boolean))];
            if (userIds.length > 0) {
                const { data: profiles } = await supabase
                    .from('user_profiles')
                    .select('user_id, full_name')
                    .in('user_id', userIds);
                const nameMap = new Map((profiles || []).map((p: { user_id: string; full_name: string | null }) => [p.user_id, p.full_name]));
                rows.forEach(v => { v.editor_name = nameMap.get(v.edited_by) || 'Docente'; });
            }
            setVersions(rows);
        };
        loadVersions();
    }, [generatedClassId, row?.current_version]);

    // Push current state to undo stack
    const pushUndo = useCallback(() => {
        setUndoStack(prev => [...prev.slice(-19), { blocks: { ...planningBlocks }, ticket: { ...exitTicket } }]);
    }, [planningBlocks, exitTicket]);

    const handleUndo = useCallback(() => {
        setUndoStack(prev => {
            if (prev.length === 0) return prev;
            const last = prev[prev.length - 1];
            setPlanningBlocks(last.blocks);
            setExitTicket(last.ticket);
            return prev.slice(0, -1);
        });
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const tagName = document.activeElement?.tagName.toLowerCase();
            const isTyping = tagName === 'input' || tagName === 'textarea';

            if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
                if (!isTyping) {
                    e.preventDefault();
                    handleUndo();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleUndo]);

    // ── Regenerar sección individual con IA (PL-26) ──
    const regenerateSection = async (sectionKey: 'inicio' | 'desarrollo' | 'cierre') => {
        if (regeneratingSection) return;
        setRegeneratingSection(sectionKey);
        try {
            const { data, error } = await supabase.functions.invoke('generate-class-kit', {
                body: {
                    asignatura: row?.asignatura || '',
                    curso: row?.curso || '',
                    objetivo: planningBlocks.objective || row?.objetivo_clase || '',
                    regenerateSection: sectionKey,
                },
            });
            if (error) throw error;
            const newText = data?.section_text || data?.planning_blocks?.[sectionKey];
            if (newText && typeof newText === 'string') {
                pushUndo();
                setPlanningBlocks(prev => ({ ...prev, [sectionKey]: newText }));
                toast.success(`Sección "${sectionKey}" regenerada.`);
            } else {
                toast.error('No se pudo regenerar esta sección.');
            }
        } catch (err) {
            console.error('Error regenerating section:', err);
            const message = err instanceof Error && err.message.includes('not found')
                ? 'La funcion de regeneracion no esta disponible. Contacta soporte.'
                : 'Error al regenerar. Intenta nuevamente.';
            toast.error(message);
        } finally {
            setRegeneratingSection(null);
        }
    };

    const isDirty = useMemo(() => {
        const current = JSON.stringify({ normalizedBlocks: planningBlocks, normalizedTicket: exitTicket });
        return current !== baseSnapshot;
    }, [planningBlocks, exitTicket, baseSnapshot]);

    const addResource = () => {
        pushUndo();
        setPlanningBlocks((prev) => ({ ...prev, resources: [...prev.resources, ''] }));
    };

    const updateResource = (idx: number, value: string) => {
        setPlanningBlocks((prev) => ({
            ...prev,
            resources: prev.resources.map((item, index) => (index === idx ? value : item)),
        }));
    };

    const removeResource = (idx: number) => {
        pushUndo();
        setPlanningBlocks((prev) => ({
            ...prev,
            resources: prev.resources.filter((_, index) => index !== idx),
        }));
    };

    const addIndicator = () => {
        pushUndo();
        setPlanningBlocks((prev) => ({ ...prev, indicators: [...prev.indicators, ''] }));
    };

    const updateIndicator = (idx: number, value: string) => {
        setPlanningBlocks((prev) => ({
            ...prev,
            indicators: prev.indicators.map((item, index) => (index === idx ? value : item)),
        }));
    };

    const removeIndicator = (idx: number) => {
        pushUndo();
        setPlanningBlocks((prev) => ({
            ...prev,
            indicators: prev.indicators.filter((_, index) => index !== idx),
        }));
    };

    const addQuestion = (type: TicketQuestionType) => {
        setExitTicket((prev) => {
            const nextId = prev.questions.length + 1;
            const question: ExitTicketQuestion = {
                id: nextId,
                type,
                question: '',
                options: type === 'multiple_choice' ? ['', '', '', ''] : [],
                answer: null,
            };
            return { ...prev, questions: [...prev.questions, question] };
        });
    };

    const updateQuestion = (idx: number, patch: Partial<ExitTicketQuestion>) => {
        setExitTicket((prev) => ({
            ...prev,
            questions: prev.questions.map((item, index) => (index === idx ? { ...item, ...patch } : item)),
        }));
    };

    const removeQuestion = (idx: number) => {
        pushUndo();
        setExitTicket((prev) => ({
            ...prev,
            questions: prev.questions
                .filter((_, index) => index !== idx)
                .map((item, index) => ({ ...item, id: index + 1 })),
        }));
    };

    const saveVersion = async (changeSummary?: string) => {
        if (!row) return false;

        setSaving(true);
        try {
            const { data: authData, error: authError } = await supabase.auth.getUser();
            if (authError || !authData?.user?.id) throw authError || new Error('Usuario no autenticado');
            const userId = authData.user.id;

            const { data: currentData, error: currentError } = await supabase
                .from('generated_classes')
                .select('current_version')
                .eq('id', row.id)
                .single();

            if (currentError) throw currentError;
            const nextVersion = (currentData?.current_version || row.current_version || 0) + 1;
            const cleanBlocks = {
                ...planningBlocks,
                indicators: planningBlocks.indicators.map((item) => item.trim()).filter(Boolean),
                resources: planningBlocks.resources.map((item) => item.trim()).filter(Boolean),
            };
            const cleanTicket = {
                ...exitTicket,
                questions: exitTicket.questions.map((q, idx) => ({
                    ...q,
                    id: idx + 1,
                    question: q.question.trim(),
                    options: (q.options || []).map((item) => item.trim()).filter(Boolean),
                })),
            };

            const snapshot = {
                planning_blocks: cleanBlocks,
                exit_ticket: cleanTicket,
                previous_status: row.planning_status,
                previous_approval: row.approval_status,
                saved_at: new Date().toISOString(),
            };

            const { error: insertVersionError } = await supabase
                .from('planning_versions')
                .insert({
                    generated_class_id: row.id,
                    version_number: nextVersion,
                    edited_by: userId,
                    change_summary: (changeSummary || summary || 'Edición manual de planificación').trim(),
                    snapshot,
                });

            if (insertVersionError) throw insertVersionError;

            const { data: updatedRow, error: updateRowError } = await supabase
                .from('generated_classes')
                .update({
                    planning_blocks: cleanBlocks,
                    exit_ticket: cleanTicket,
                    planning_status: 'draft',
                    approval_status: 'pending',
                    approval_notes: null,
                    approved_at: null,
                    current_version: nextVersion,
                })
                .eq('id', row.id)
                .select('id, topic, objetivo_clase, asignatura, curso, planning_blocks, exit_ticket, planning_status, approval_status, current_version, approval_notes, approved_at')
                .single();

            if (updateRowError) throw updateRowError;

            const parsedRow = updatedRow as GeneratedClassWorkflowRow;
            const normalizedBlocks = normalizeBlocks(parsedRow.planning_blocks);
            const normalizedTicket = normalizeTicket(parsedRow.exit_ticket);
            const snapshotString = JSON.stringify({ normalizedBlocks, normalizedTicket });

            setRow(parsedRow);
            setPlanningBlocks(normalizedBlocks);
            setExitTicket(normalizedTicket);
            setBaseSnapshot(snapshotString);
            setSummary('');
            toast.success(`Versión ${nextVersion} guardada.`);
            return true;
        } catch (error) {
            console.error('Error saving planning version:', error);
            toast.error('No se pudo guardar la versión.');
            return false;
        } finally {
            setSaving(false);
        }
    };

    const submitForApproval = async () => {
        if (!row) return;

        setSubmitting(true);
        try {
            const { data: authData, error: authError } = await supabase.auth.getUser();
            if (authError || !authData?.user?.id) throw authError || new Error('Usuario no autenticado');
            const userId = authData.user.id;

            const saved = isDirty ? await saveVersion('Actualización antes de enviar a aprobación UTP') : true;
            if (!saved) return;

            const { data: existingPending, error: existingPendingError } = await supabase
                .from('planning_approvals')
                .select('id')
                .eq('generated_class_id', row.id)
                .eq('status', 'pending')
                .maybeSingle();

            if (existingPendingError) throw existingPendingError;
            if (existingPending?.id) {
                toast.info('Ya existe una solicitud pendiente de revisión para esta planificación.');
                return;
            }

            const { error: approvalInsertError } = await supabase
                .from('planning_approvals')
                .insert({
                    generated_class_id: row.id,
                    submitted_by: userId,
                    status: 'pending',
                });

            if (approvalInsertError) throw approvalInsertError;

            const { data: updatedRow, error: updateError } = await supabase
                .from('generated_classes')
                .update({
                    planning_status: 'submitted',
                    approval_status: 'pending',
                })
                .eq('id', row.id)
                .select('id, topic, objetivo_clase, asignatura, curso, planning_blocks, exit_ticket, planning_status, approval_status, current_version, approval_notes, approved_at')
                .single();

            if (updateError) throw updateError;
            setRow(updatedRow as GeneratedClassWorkflowRow);
            toast.success('Planificación enviada a UTP para revisión.');
        } catch (error) {
            console.error('Error submitting planning for approval:', error);
            const pgError = error as { code?: string; message?: string };
            if (pgError?.code === '23505') {
                toast.info('Ya existe una aprobación pendiente para esta planificación.');
            } else {
                toast.error('No se pudo enviar a aprobación.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const exportDocument = (type: 'ticket' | 'guide') => {
        const classLabel = row?.topic || row?.objetivo_clase || 'Clase sin título';

        let contentHtml = '';

        if (type === 'ticket') {
            contentHtml = `
                <div class="instructions">${exitTicket.instructions || 'Responde al finalizar la clase.'}</div>
                <div class="questions">
                    ${exitTicket.questions.map((q, idx) => `
                        <div class="question-block">
                            <div class="question-title"><strong>${idx + 1}.</strong> ${q.question || '(Sin enunciado)'}</div>
                            ${q.type === 'multiple_choice' ? `
                                <div class="options-grid">
                                    ${(q.options || []).map(opt => `<div class="option-item"><div class="circle"></div> <span>${opt || '(opción)'}</span></div>`).join('')}
                                </div>
                            ` : ''}
                            ${q.type === 'true_false' ? `
                                <div class="options-inline">
                                    <div class="option-item"><div class="circle"></div> <span>Verdadero</span></div>
                                    <div class="option-item"><div class="circle"></div> <span>Falso</span></div>
                                </div>
                            ` : ''}
                            ${q.type === 'open' ? `
                                <div class="open-lines">
                                    <div class="line"></div>
                                    <div class="line"></div>
                                    <div class="line"></div>
                                    <div class="line"></div>
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            `;
        } else {
            // Guía de trabajo basada en el bloque de desarrollo
            contentHtml = `
                <div class="instructions">Lee atentamente las instrucciones y desarrolla las siguientes actividades.</div>
                <div class="guide-content">
                    <div class="section-title">Actividad Central</div>
                    <div class="content-text">${planningBlocks.desarrollo.replace(/\n/g, '<br/>')}</div>
                    
                    <div class="section-title" style="margin-top: 30px;">Recursos Adicionales</div>
                    <ul class="resources-list">
                        ${planningBlocks.resources.length > 0 ? planningBlocks.resources.map(r => `<li>${r}</li>`).join('') : '<li>Ningún recurso adicional listado.</li>'}
                    </ul>
                    
                    <div class="open-lines" style="margin-top: 40px; border-top: 1px dashed #ccc; padding-top: 20px;">
                        <h4 style="margin-bottom: 20px; color: #555;">Espacio para desarrollo:</h4>
                        <div class="line"></div>
                        <div class="line"></div>
                        <div class="line"></div>
                        <div class="line"></div>
                        <div class="line"></div>
                        <div class="line"></div>
                        <div class="line"></div>
                        <div class="line"></div>
                    </div>
                </div>
            `;
        }

        const html = `
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>${type === 'ticket' ? exitTicket.title : 'Guía de Trabajo'}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    @page {
        size: letter;
        margin: 20mm;
    }
    
    body { 
        font-family: 'Inter', sans-serif; 
        color: #111827; 
        line-height: 1.5;
        margin: 0;
        padding: 0;
        background: #fff;
    }
    
    .header {
        border-bottom: 2px solid #111827;
        padding-bottom: 16px;
        margin-bottom: 24px;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
    }
    
    .header-left h1 {
        margin: 0 0 4px 0;
        font-size: 24px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: -0.02em;
    }
    
    .header-left .subtitle {
        color: #4b5563;
        font-size: 14px;
        font-weight: 500;
    }
    
    .institution-box {
        text-align: right;
        font-size: 12px;
        color: #6b7280;
    }
    
    .student-data {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        margin-bottom: 32px;
        background: #f9fafb;
        padding: 16px;
        border-radius: 8px;
        border: 1px solid #e5e7eb;
    }
    
    .data-field {
        display: flex;
        font-size: 14px;
    }
    
    .data-field strong {
        margin-right: 8px;
        font-weight: 600;
        color: #374151;
        width: 60px;
    }
    
    .data-field .line-fill {
        flex: 1;
        border-bottom: 1px solid #9ca3af;
    }
    
    .instructions {
        background: #eff6ff;
        border-left: 4px solid #3b82f6;
        padding: 12px 16px;
        font-size: 14px;
        color: #1e3a8a;
        margin-bottom: 32px;
        border-radius: 0 8px 8px 0;
    }
    
    .section-title {
        font-size: 18px;
        font-weight: 700;
        margin: 0 0 16px 0;
        color: #111827;
        text-transform: uppercase;
        letter-spacing: -0.01em;
    }
    
    .content-text {
        font-size: 15px;
        color: #374151;
    }
    
    .resources-list {
        padding-left: 20px;
        margin: 0;
        font-size: 14px;
        color: #4b5563;
    }
    
    .resources-list li {
        margin-bottom: 6px;
    }
    
    .question-block {
        margin-bottom: 32px;
        page-break-inside: avoid;
    }
    
    .question-title {
        font-size: 16px;
        font-weight: 500;
        margin-bottom: 12px;
    }
    
    .options-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        margin-left: 24px;
    }
    
    .options-inline {
        display: flex;
        gap: 40px;
        margin-left: 24px;
    }
    
    .option-item {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        font-size: 15px;
        color: #374151;
    }
    
    .circle {
        width: 16px;
        height: 16px;
        min-width: 16px;
        border: 1px solid #6b7280;
        border-radius: 50%;
        margin-top: 3px;
    }
    
    .open-lines {
        margin-top: 20px;
    }
    
    .line {
        border-bottom: 1px solid #d1d5db;
        height: 28px;
        margin-bottom: 8px;
    }
    
    @media print {
        body { margin: 0; }
        .student-data { background: transparent; border-color: #111; }
        .instructions { background: transparent; border: 1px solid #111; border-left: 4px solid #111; color: #111; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <h1>${type === 'ticket' ? exitTicket.title : 'GUÍA DE ACTIVIDADES'}</h1>
      <div class="subtitle">${row?.asignatura || 'Asignatura'} · ${row?.curso || 'Curso'}</div>
    </div>
    <div class="institution-box">
      <strong>EducMark</strong><br/>
      Documento Generado<br/>
      ${new Date().toLocaleDateString('es-CL')}
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
      <strong>Clase:</strong>
      <div style="padding-left: 8px; font-weight: 500; color: #1f2937;">${classLabel}</div>
    </div>
  </div>
  
  ${contentHtml}

  ${type === 'ticket' && row?.id ? `
  <div style="margin-top: 24px; text-align: right; opacity: 0.6;">
    <img src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(`educmark://class/${row.id}`)}" alt="QR" width="80" height="80" style="display: inline-block;" />
    <div style="font-size: 8px; color: #9ca3af; margin-top: 4px;">ID: ${row.id.slice(0, 8)}</div>
  </div>
  ` : ''}
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
        setTimeout(() => {
            printWindow.print();
        }, 500);
    };

    const statusBadge = useMemo(() => {
        if (!row) return null;
        if (row.planning_status === 'approved') return { label: 'Aprobada', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: <CheckCircle2 size={14} /> };
        if (row.planning_status === 'submitted') return { label: 'En revisión UTP', className: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: <Clock3 size={14} /> };
        if (row.planning_status === 'changes_requested') return { label: 'Cambios solicitados', className: 'bg-red-500/10 text-red-400 border-red-500/20', icon: <AlertCircle size={14} /> };
        return { label: 'Borrador', className: 'bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20', icon: <Save size={14} /> };
    }, [row]);

    if (loading) {
        return (
            <section className="animate-fade-in pb-12 space-y-6">
                {/* Header skeleton */}
                <div className="glass-card-premium p-6 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/10 animate-pulse"></div>
                    <div className="flex-1 space-y-2">
                        <div className="h-6 w-64 bg-white/10 rounded-lg animate-pulse"></div>
                        <div className="h-4 w-40 bg-white/5 rounded-lg animate-pulse"></div>
                    </div>
                </div>
                {/* Tabs skeleton */}
                <div className="flex gap-2">
                    {[1,2,3,4].map(i => <div key={i} className="h-10 w-28 bg-white/5 rounded-xl animate-pulse"></div>)}
                </div>
                {/* Content skeleton */}
                <div className="glass-card-premium p-6 space-y-4">
                    <div className="h-5 w-48 bg-white/10 rounded-lg animate-pulse"></div>
                    <div className="h-4 w-full bg-white/5 rounded animate-pulse"></div>
                    <div className="h-4 w-full bg-white/5 rounded animate-pulse"></div>
                    <div className="h-4 w-3/4 bg-white/5 rounded animate-pulse"></div>
                    <div className="h-32 w-full bg-white/5 rounded-xl animate-pulse mt-4"></div>
                </div>
            </section>
        );
    }

    if (!generatedClassId || !row) {
        return (
            <section className="animate-fade-in pb-12">
                <div className="glass-card-premium p-8 text-center space-y-3">
                    <h2 className="text-xl font-bold text-[var(--on-background)]">No hay planificación para editar</h2>
                    <p className="text-[var(--muted)]">Abre un kit desde la Biblioteca o genera una clase nueva.</p>
                    <button
                        type="button"
                        onClick={() => router.push('/dashboard/history')}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] text-white"
                    >
                        <ArrowLeft size={16} /> Ir a Biblioteca
                    </button>
                </div>
            </section>
        );
    }

    return (
        <section className="animate-fade-in max-w-6xl mx-auto pb-12 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <button
                        type="button"
                        onClick={() => router.push('/dashboard/history')}
                        className="inline-flex items-center gap-2 text-[var(--muted)] hover:text-[var(--foreground)] mb-3"
                    >
                        <ArrowLeft size={16} /> Volver a Biblioteca
                    </button>
                    <h1 className="text-3xl font-bold text-[var(--on-background)]">Planificación v1</h1>
                    <p className="text-[var(--muted)] mt-1">
                        {row.asignatura || 'Asignatura'} · {row.curso || 'Curso'} · {row.topic || row.objetivo_clase || 'Clase sin título'}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {statusBadge && (
                        <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border ${statusBadge.className}`}>
                            {statusBadge.icon} {statusBadge.label}
                        </span>
                    )}
                    <span className="px-3 py-1.5 rounded-full text-xs font-bold border border-[var(--border)] text-[var(--muted)]">
                        Versión {row.current_version || 1}
                    </span>
                    {/* 6.5 — Share with colleague */}
                    <button
                        type="button"
                        onClick={() => {
                            const text = `Acabo de crear una clase de ${row.asignatura || 'mi asignatura'} para ${row.curso || 'mi curso'} en 6 minutos con EducMark. ¡Pruébalo gratis! https://educmark.cl`;
                            if (navigator.share) {
                                navigator.share({ title: 'EducMark — Clase lista en 6 min', text }).catch(() => {});
                            } else {
                                navigator.clipboard.writeText(text);
                                toast.success('Texto copiado — compártelo con un colega');
                            }
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border border-emerald-500/30 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors"
                        title="Compartir con un colega"
                    >
                        <Share2 size={14} /> Compartir
                    </button>
                </div>
            </div>

            {row.approval_notes && (
                <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10">
                    <p className="text-xs uppercase tracking-wider text-amber-300 font-bold mb-1">Comentario de revisión</p>
                    <p className="text-sm text-amber-100">{row.approval_notes}</p>
                </div>
            )}

            <div className="grid grid-cols-1 gap-6">
                <div className="glass-card-premium p-6 space-y-4">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-[var(--on-background)]">Bloques editables de la clase</h2>
                        <button
                            type="button"
                            onClick={() => exportDocument('guide')}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--card-hover)] text-sm font-medium"
                        >
                            <FileDown size={14} /> Imprimir Guía (Basada en Desarrollo)
                        </button>
                    </div>

                    <div className="space-y-3">
                        <label className="text-xs uppercase tracking-wider font-bold text-[var(--muted)]">Objetivo de la clase</label>
                        <textarea
                            value={planningBlocks.objective}
                            onChange={(e) => setPlanningBlocks((prev) => ({ ...prev, objective: e.target.value }))}
                            className="w-full min-h-[80px] bg-[var(--input-bg)] border border-[var(--border)] rounded-lg p-3"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wider font-bold text-[var(--muted)]">Indicadores de evaluación</label>
                        {planningBlocks.indicators.map((item, idx) => (
                            <div key={`indicator-${idx}`} className="flex items-center gap-2">
                                <input
                                    value={item}
                                    onChange={(e) => updateIndicator(idx, e.target.value)}
                                    className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-lg p-2.5"
                                    placeholder={`Indicador ${idx + 1}`}
                                />
                                <button type="button" onClick={() => removeIndicator(idx)} className="p-2 rounded-md text-red-400 hover:bg-red-500/10">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                        <button type="button" onClick={addIndicator} className="inline-flex items-center gap-1 text-sm text-[var(--primary)]">
                            <Plus size={15} /> Agregar indicador
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {(['inicio', 'desarrollo', 'cierre'] as const).map(sectionKey => (
                            <div key={sectionKey}>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="text-xs uppercase tracking-wider font-bold text-[var(--muted)]">
                                        {sectionKey === 'inicio' ? '🟢 Inicio' : sectionKey === 'desarrollo' ? '🔵 Desarrollo' : '🟠 Cierre'}
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => regenerateSection(sectionKey)}
                                        disabled={regeneratingSection === sectionKey}
                                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold text-[var(--primary)] bg-[var(--primary)]/10 border border-[var(--primary)]/20 hover:bg-[var(--primary)]/20 disabled:opacity-50 transition-colors"
                                    >
                                        {regeneratingSection === sectionKey
                                            ? <><Loader2 size={10} className="animate-spin" /> Regenerando...</>
                                            : <><Wand2 size={10} /> Regenerar sección</>}
                                    </button>
                                </div>
                                <textarea
                                    value={planningBlocks[sectionKey]}
                                    onChange={(e) => setPlanningBlocks(prev => ({ ...prev, [sectionKey]: e.target.value }))}
                                    className={`w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-lg p-3 ${sectionKey === 'desarrollo' ? 'min-h-[120px]' : 'min-h-[100px]'}`}
                                />
                            </div>
                        ))}
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wider font-bold text-[var(--muted)]">Recursos</label>
                        {planningBlocks.resources.map((item, idx) => (
                            <div key={`resource-${idx}`} className="flex items-center gap-2">
                                <input
                                    value={item}
                                    onChange={(e) => updateResource(idx, e.target.value)}
                                    className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-lg p-2.5"
                                    placeholder={`Recurso ${idx + 1}`}
                                />
                                <button type="button" onClick={() => removeResource(idx)} className="p-2 rounded-md text-red-400 hover:bg-red-500/10">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                        <div className="flex items-center gap-3">
                            <button type="button" onClick={addResource} className="inline-flex items-center gap-1 text-sm text-[var(--primary)]">
                                <Plus size={15} /> Agregar recurso
                            </button>
                            {/* PL-14: Attach own resources via file upload */}
                            <label className="inline-flex items-center gap-1 text-sm text-[var(--primary)] cursor-pointer hover:underline">
                                <FileDown size={15} /> Adjuntar archivo
                                <input
                                    type="file"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        if (file.size > 5 * 1024 * 1024) {
                                            toast.error('El archivo no puede superar 5 MB.');
                                            return;
                                        }
                                        const reader = new FileReader();
                                        reader.onload = (ev) => {
                                            const dataUrl = ev.target?.result as string;
                                            pushUndo();
                                            setPlanningBlocks((prev) => ({ ...prev, resources: [...prev.resources, `[Archivo: ${file.name}] ${dataUrl.slice(0, 100)}...`] }));
                                            toast.success(`Archivo "${file.name}" adjuntado como recurso.`);
                                        };
                                        reader.readAsDataURL(file);
                                        e.target.value = '';
                                    }}
                                />
                            </label>
                        </div>
                    </div>
                </div>

                <div className="glass-card-premium p-6 space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <h2 className="text-xl font-bold text-[var(--on-background)]">Ticket de salida configurable</h2>
                        <button
                            type="button"
                            onClick={() => exportDocument('ticket')}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--card-hover)]"
                        >
                            <FileDown size={16} /> Exportar / Imprimir
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs uppercase tracking-wider font-bold text-[var(--muted)]">Título</label>
                            <input
                                value={exitTicket.title}
                                onChange={(e) => setExitTicket((prev) => ({ ...prev, title: e.target.value }))}
                                className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-lg p-2.5"
                            />
                        </div>
                        <div>
                            <label className="text-xs uppercase tracking-wider font-bold text-[var(--muted)]">Instrucciones</label>
                            <input
                                value={exitTicket.instructions}
                                onChange={(e) => setExitTicket((prev) => ({ ...prev, instructions: e.target.value }))}
                                className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-lg p-2.5"
                            />
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => addQuestion('multiple_choice')} className="px-3 py-1.5 rounded-lg text-xs bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20">
                            + Opción múltiple
                        </button>
                        <button type="button" onClick={() => addQuestion('true_false')} className="px-3 py-1.5 rounded-lg text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            + Verdadero/Falso
                        </button>
                        <button type="button" onClick={() => addQuestion('open')} className="px-3 py-1.5 rounded-lg text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            + Respuesta abierta
                        </button>
                    </div>

                    <div className="space-y-3">
                        {exitTicket.questions.length === 0 && (
                            <p className="text-sm text-[var(--muted)]">Aún no hay preguntas en el ticket.</p>
                        )}
                        {exitTicket.questions.map((q, idx) => (
                            <div key={`question-${q.id}-${idx}`} className="rounded-xl border border-[var(--border)] bg-[var(--card)]/30 p-4 space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-xs uppercase tracking-wider text-[var(--muted)] font-bold">
                                        Pregunta {idx + 1} · {q.type === 'multiple_choice' ? 'Opción múltiple' : q.type === 'true_false' ? 'V/F' : 'Abierta'}
                                    </span>
                                    <button type="button" onClick={() => removeQuestion(idx)} className="p-1.5 rounded-md text-red-400 hover:bg-red-500/10">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                                <input
                                    value={q.question}
                                    onChange={(e) => updateQuestion(idx, { question: e.target.value })}
                                    className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-lg p-2.5"
                                    placeholder="Enunciado de la pregunta"
                                />
                                {q.type === 'multiple_choice' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {(q.options || []).map((opt, optIdx) => (
                                            <input
                                                key={`option-${idx}-${optIdx}`}
                                                value={opt}
                                                onChange={(e) => {
                                                    const nextOptions = [...(q.options || [])];
                                                    nextOptions[optIdx] = e.target.value;
                                                    updateQuestion(idx, { options: nextOptions });
                                                }}
                                                className="bg-[var(--input-bg)] border border-[var(--border)] rounded-lg p-2.5"
                                                placeholder={`Opción ${String.fromCharCode(65 + optIdx)}`}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Version History Panel ── */}
            <div className="glass-card-premium overflow-hidden">
                <button
                    type="button"
                    onClick={() => setShowVersions(v => !v)}
                    className="w-full flex items-center justify-between p-5 hover:bg-[var(--card-hover)]/40 transition-colors"
                >
                    <span className="flex items-center gap-2 text-sm font-bold text-[var(--on-background)]">
                        <History size={16} className="text-[var(--primary)]" />
                        Historial de versiones ({versions.length})
                    </span>
                    {showVersions ? <ChevronUp size={16} className="text-[var(--muted)]" /> : <ChevronDown size={16} className="text-[var(--muted)]" />}
                </button>
                <AnimatePresence>
                    {showVersions && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                        >
                            <div className="px-5 pb-5 space-y-2 border-t border-[var(--border)]">
                                {versions.length === 0 && (
                                    <p className="text-sm text-[var(--muted)] pt-3">Aún no hay versiones guardadas.</p>
                                )}
                                {versions.map(v => (
                                    <div key={v.id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-[var(--input-bg)] border border-[var(--border)]">
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-[var(--foreground)]">
                                                v{v.version_number}
                                                <span className="text-xs font-normal text-[var(--muted)] ml-2">
                                                    {v.editor_name || 'Docente'} · {new Date(v.created_at).toLocaleString('es-CL')}
                                                </span>
                                            </p>
                                            {v.change_summary && (
                                                <p className="text-xs text-[var(--muted)] truncate">{v.change_summary}</p>
                                            )}
                                        </div>
                                        {v.version_number !== row?.current_version && (
                                            <button
                                                type="button"
                                                onClick={async () => {
                                                    const { data, error } = await supabase
                                                        .from('planning_versions')
                                                        .select('snapshot')
                                                        .eq('id', v.id)
                                                        .single();
                                                    if (error || !data?.snapshot) {
                                                        toast.error('No se pudo cargar esta versión.');
                                                        return;
                                                    }
                                                    const snap = data.snapshot as { planning_blocks?: unknown; exit_ticket?: unknown };
                                                    pushUndo();
                                                    if (snap.planning_blocks) setPlanningBlocks(normalizeBlocks(snap.planning_blocks));
                                                    if (snap.exit_ticket) setExitTicket(normalizeTicket(snap.exit_ticket));
                                                    toast.success(`Versión ${v.version_number} restaurada. Guarda para confirmar.`);
                                                }}
                                                className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20 hover:bg-[var(--primary)]/20 transition-colors"
                                            >
                                                <RotateCcw size={12} /> Restaurar
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="glass-card-premium p-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                    <div className="md:col-span-2">
                        <label className="text-xs uppercase tracking-wider font-bold text-[var(--muted)]">Resumen de cambios (opcional)</label>
                        <input
                            value={summary}
                            onChange={(e) => setSummary(e.target.value)}
                            className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-lg p-2.5"
                            placeholder="Ej: Ajuste del cierre y mejora del ticket"
                        />
                    </div>
                    <div className="flex flex-wrap md:justify-end gap-2">
                        <button
                            type="button"
                            onClick={handleUndo}
                            disabled={undoStack.length === 0}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] disabled:opacity-30 transition-colors"
                            title="Deshacer (Ctrl+Z)"
                        >
                            <Undo2 size={16} />
                        </button>
                        <button
                            type="button"
                            onClick={() => saveVersion()}
                            disabled={saving || !isDirty}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] text-white disabled:opacity-50"
                        >
                            <Save size={16} /> {saving ? 'Guardando...' : 'Guardar versión'}
                        </button>
                        <button
                            type="button"
                            onClick={submitForApproval}
                            disabled={submitting}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 disabled:opacity-50"
                        >
                            <Send size={16} /> {submitting ? 'Enviando...' : 'Enviar a UTP'}
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}
