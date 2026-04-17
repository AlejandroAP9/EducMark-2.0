'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

import type {
    PlanningBlocks,
    ExitTicket,
    GeneratedClassWorkflowRow,
    PlanningVersionRow,
} from './KitResultTypes';
import {
    EMPTY_BLOCKS,
    EMPTY_EXIT_TICKET,
    normalizeBlocks,
    normalizeTicket,
} from './KitResultTypes';
import { KitResultHeader } from './KitResultHeader';
import { KitResultPlanningBlocks } from './KitResultPlanningBlocks';
import { KitResultExitTicket } from './KitResultExitTicket';
import { KitResultVersionHistory } from './KitResultVersionHistory';
import { KitResultActions } from './KitResultActions';
import { exportDocument } from './KitResultExportDocument';
import { resolveClassPlanning, isPlanningEmpty } from '@/shared/lib/resolveClassPlanning';

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
                let normalizedBlocks = normalizeBlocks(parsedRow.planning_blocks);
                const normalizedTicket = normalizeTicket(parsedRow.exit_ticket);

                // Fallback: si planning_blocks está vacío (clases antiguas), resolver
                // desde planning_sequences via endpoint server-side (service_role).
                if (isPlanningEmpty(normalizedBlocks)) {
                    const resolved = await resolveClassPlanning(parsedRow.id);
                    if (resolved.source === 'planning_sequences') {
                        normalizedBlocks = resolved.blocks;
                    }
                }

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

    // ── Regenerar seccion individual con IA (PL-26) ──
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

    const handleExport = (type: 'ticket' | 'guide') => {
        if (!row) return;
        exportDocument({ type, row, planningBlocks, exitTicket });
    };

    if (loading) {
        return (
            <section className="animate-fade-in pb-12 space-y-6">
                <div className="glass-card-premium p-6 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/10 animate-pulse"></div>
                    <div className="flex-1 space-y-2">
                        <div className="h-6 w-64 bg-white/10 rounded-lg animate-pulse"></div>
                        <div className="h-4 w-40 bg-white/5 rounded-lg animate-pulse"></div>
                    </div>
                </div>
                <div className="flex gap-2">
                    {[1,2,3,4].map(i => <div key={i} className="h-10 w-28 bg-white/5 rounded-xl animate-pulse"></div>)}
                </div>
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
            <KitResultHeader row={row} />

            <div className="grid grid-cols-1 gap-6">
                <KitResultPlanningBlocks
                    planningBlocks={planningBlocks}
                    setPlanningBlocks={setPlanningBlocks}
                    regeneratingSection={regeneratingSection}
                    onRegenerateSection={regenerateSection}
                    onExportGuide={() => handleExport('guide')}
                    pushUndo={pushUndo}
                />

                <KitResultExitTicket
                    exitTicket={exitTicket}
                    setExitTicket={setExitTicket}
                    onExportTicket={() => handleExport('ticket')}
                    pushUndo={pushUndo}
                />
            </div>

            <KitResultVersionHistory
                versions={versions}
                currentVersion={row.current_version}
                showVersions={showVersions}
                setShowVersions={setShowVersions}
                setPlanningBlocks={setPlanningBlocks}
                setExitTicket={setExitTicket}
                pushUndo={pushUndo}
            />

            <KitResultActions
                summary={summary}
                setSummary={setSummary}
                saving={saving}
                submitting={submitting}
                isDirty={isDirty}
                undoStackLength={undoStack.length}
                onUndo={handleUndo}
                onSave={() => saveVersion()}
                onSubmit={submitForApproval}
            />
        </section>
    );
}
