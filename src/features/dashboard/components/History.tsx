'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { ThumbsUp, ThumbsDown, FileText, Presentation, CheckSquare, Trash2, Search, Plus, FolderHeart, PencilLine, Copy, ClipboardList, Download, CheckCheck, X } from 'lucide-react';
import { logAuditEvent } from '@/shared/lib/auditLog';
import { downloadUrlAsPdf, buildPdfFilename } from '@/shared/lib/htmlToPdf';
import { useRouter, useSearchParams } from 'next/navigation';

interface GeneratedClassRow {
    id: string;
    created_at: string;
    objetivo_clase: string | null;
    topic: string | null;
    asignatura: string | null;
    curso: string | null;
    feedback: 'up' | 'down' | null;
    link_presentacion: string | null;
    link_paci: string | null;
    planificacion: string | null;
    quiz: string | null;
    planning_blocks: Record<string, unknown> | null;
    exit_ticket: Record<string, unknown> | null;
}

export function History() {
    const supabase = createClient();
    const router = useRouter();
    const [classes, setClasses] = useState<GeneratedClassRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Filter States — initialized from URL params
    const searchParams = useSearchParams();
    const [selectedSubject, setSelectedSubject] = useState(searchParams.get('subject') || 'Asignatura');
    const [selectedLevel, setSelectedLevel] = useState(searchParams.get('level') || 'Nivel');
    const [dateOrder, setDateOrder] = useState(searchParams.get('order') || 'Recientes');

    // Menu State
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
    const [duplicating, setDuplicating] = useState<string | null>(null);
    const [downloadingPdf, setDownloadingPdf] = useState<string | null>(null);

    // Batch Selection
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [batchDeleting, setBatchDeleting] = useState(false);
    const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);

    // Sync filters to URL
    useEffect(() => {
        const params = new URLSearchParams();
        if (selectedSubject !== 'Asignatura') params.set('subject', selectedSubject);
        if (selectedLevel !== 'Nivel') params.set('level', selectedLevel);
        if (dateOrder !== 'Recientes') params.set('order', dateOrder);
        const qs = params.toString();
        window.history.replaceState({}, '', qs ? `?${qs}` : window.location.pathname);
    }, [selectedSubject, selectedLevel, dateOrder]);

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredClasses.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredClasses.map(c => c.id)));
        }
    };

    const batchDownload = async () => {
        const selected = classes.filter(c => selectedIds.has(c.id));
        for (const item of selected) {
            if (item.planificacion) {
                await handleDownloadPdf(item.planificacion, 'planificacion', item);
            }
        }
        toast.success(`${selected.length} PDF${selected.length !== 1 ? 's' : ''} descargados`);
    };

    const batchDelete = async () => {
        setBatchDeleting(true);
        const ids = Array.from(selectedIds);

        // Optimistic update
        setClasses(prev => prev.filter(c => !selectedIds.has(c.id)));

        const { error } = await supabase
            .from('generated_classes')
            .delete()
            .in('id', ids);

        if (error) {
            console.error('Error batch deleting:', error);
            toast.error('Error al eliminar kits.');
            fetchHistory(); // Rollback
        } else {
            toast.success(`${ids.length} kits eliminados`);
            logAuditEvent('batch_delete', { count: ids.length, classIds: ids });
        }

        setSelectedIds(new Set());
        setShowBatchDeleteConfirm(false);
        setBatchDeleting(false);
    };

    const handleDownloadPdf = async (
        url: string,
        type: 'planificacion' | 'presentacion' | 'evaluacion' | 'pauta',
        item: GeneratedClassRow,
    ) => {
        const key = `${item.id}-${type}`;
        setDownloadingPdf(key);
        try {
            const filename = buildPdfFilename(type, { subject: item.asignatura || undefined, grade: item.curso || undefined });
            await downloadUrlAsPdf(url, filename, {
                orientation: type === 'presentacion' ? 'landscape' : 'portrait',
            });
            toast.success('PDF descargado');
        } catch (err) {
            console.error('PDF download error:', err);
            window.open(url, '_blank');
        } finally {
            setDownloadingPdf(null);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();

            let dbData: GeneratedClassRow[] = [];
            if (session) {
                const { data } = await supabase
                    .from('generated_classes')
                    .select('id, created_at, objetivo_clase, topic, asignatura, curso, feedback, link_presentacion, link_paci, planificacion, quiz, planning_blocks, exit_ticket')
                    .eq('user_id', session.user.id)
                    .order('created_at', { ascending: false });
                dbData = data || [];
            }

            setClasses(dbData);
        } catch (error) {
            console.error('Error fetching history:', error);
            // Fallback to mock data not needed if DB is connected
        } finally {
            setLoading(false);
        }
    };

    const handleFeedback = async (id: string, feedback: 'up' | 'down') => {
        // Optimistic update
        setClasses(prev => prev.map(item =>
            item.id === id ? { ...item, feedback } : item
        ));

        const { error } = await supabase
            .from('generated_classes')
            .update({ feedback })
            .eq('id', id);

        if (error) {
            console.error('Error updating feedback:', error);
            toast.error('Error al guardar feedback');
        }
    };

    // Helper for subject badges
    const getSubjectBadgeStyle = (subject: string) => {
        const sub = (subject || '').toLowerCase();
        if (sub.includes('matem')) return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
        if (sub.includes('cienc') || sub.includes('biol') || sub.includes('quim') || sub.includes('fís')) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
        if (sub.includes('hist') || sub.includes('filos') || sub.includes('ciudad')) return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
        if (sub.includes('leng') || sub.includes('lit')) return 'bg-pink-500/10 text-pink-400 border-pink-500/20';
        return 'bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20';
    };

    const handleDelete = (id: string) => {
        setDeleteTargetId(id);
    };

    const confirmDelete = async () => {
        if (!deleteTargetId) return;

        // Optimistic update
        setClasses(prev => prev.filter(c => c.id !== deleteTargetId));

        const { error } = await supabase
            .from('generated_classes')
            .delete()
            .eq('id', deleteTargetId);

        if (error) {
            console.error('Error deleting:', error);
            toast.error('Error al eliminar el kit.');
            fetchHistory(); // Rollback
        } else {
            toast.success('Kit eliminado correctamente.');
            logAuditEvent('class_deleted', { classId: deleteTargetId });
        }
        setDeleteTargetId(null);
    };

    const handleDuplicate = async (id: string) => {
        setDuplicating(id);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { toast.error('Sesión no disponible.'); return; }

            const { data: original, error: fetchError } = await supabase
                .from('generated_classes')
                .select('topic, objetivo_clase, asignatura, curso, planning_blocks, exit_ticket, planificacion, link_presentacion, link_paci, quiz')
                .eq('id', id)
                .single();

            if (fetchError || !original) { toast.error('No se pudo leer la clase original.'); return; }

            const { data: newRow, error: insertError } = await supabase
                .from('generated_classes')
                .insert({
                    user_id: session.user.id,
                    topic: original.topic ? `${original.topic} (copia)` : null,
                    objetivo_clase: original.objetivo_clase,
                    asignatura: original.asignatura,
                    curso: original.curso,
                    planning_blocks: original.planning_blocks,
                    exit_ticket: original.exit_ticket,
                    planificacion: original.planificacion,
                    link_presentacion: original.link_presentacion,
                    link_paci: original.link_paci,
                    quiz: original.quiz,
                    planning_status: 'draft',
                    approval_status: 'pending',
                    current_version: 1,
                })
                .select('id')
                .single();

            if (insertError || !newRow) { toast.error('No se pudo duplicar la planificación.'); return; }

            toast.success('Planificación duplicada como borrador.');
            router.push(`/dashboard/kit-result?id=${newRow.id}`);
        } catch (err) {
            console.error('Error duplicating:', err);
            toast.error('Error al duplicar la planificación.');
        } finally {
            setDuplicating(null);
        }
    };

    const filteredClasses = classes.filter(cl => {
        const matchesSearch = (cl.objetivo_clase || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (cl.topic || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (cl.asignatura || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSubject = selectedSubject === 'Asignatura' || cl.asignatura === selectedSubject;
        const matchesLevel = selectedLevel === 'Nivel' || (cl.curso && cl.curso.includes(selectedLevel));

        return matchesSearch && matchesSubject && matchesLevel;
    }).sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return dateOrder === 'Recientes' ? dateB - dateA : dateA - dateB;
    });

    return (
        <section className="animate-fade-in max-w-7xl mx-auto pb-12 relative -mt-2">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 relative z-10">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-[var(--on-background)] mb-1 font-[family-name:var(--font-heading)] tracking-tight">Biblioteca</h1>
                    <p className="text-[var(--muted)] text-sm md:text-base max-w-2xl leading-relaxed">Gestiona y organiza tus recursos educativos.</p>
                </div>
                <div>
                    <button
                        onClick={() => router.push('/dashboard/generator')}
                        className="btn-gradient flex items-center gap-2 px-6 py-3 shadow-lg shadow-purple-500/20 hover:scale-105 transition-transform"
                    >
                        <Plus size={20} className="stroke-[3]" /> Nuevo Kit
                    </button>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col lg:flex-row gap-4 mb-6 w-full">
                {/* Search */}
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)] w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Buscar por título..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-xl pl-11 pr-4 py-3 text-[var(--on-background)] focus:border-[var(--primary)] focus:outline-none transition-all"
                    />
                </div>

                <div className="flex gap-4 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
                    <select
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                        className="bg-[var(--input-bg)] border border-[var(--border)] text-[var(--foreground)] rounded-xl px-4 py-3 min-w-[140px] appearance-none cursor-pointer focus:outline-none"
                    >
                        <option>Asignatura</option>
                        <option>Artes Visuales</option>
                        <option>Historia</option>
                        <option>Lenguaje</option>
                        <option>Matemática</option>
                        <option>Ciencias Naturales</option>
                        <option>Biología</option>
                        <option>Física</option>
                        <option>Química</option>
                        <option>Inglés</option>
                        <option>Tecnología</option>
                        <option>Música</option>
                        <option>Educación Física</option>
                        <option>Filosofía</option>
                    </select>

                    <select
                        value={selectedLevel}
                        onChange={(e) => setSelectedLevel(e.target.value)}
                        className="bg-[var(--input-bg)] border border-[var(--border)] text-[var(--foreground)] rounded-xl px-4 py-3 min-w-[140px] appearance-none cursor-pointer focus:outline-none"
                    >
                        <option>Nivel</option>
                        <option>1° Básico</option>
                        <option>2° Básico</option>
                        <option>3° Básico</option>
                        <option>4° Básico</option>
                        <option>5° Básico</option>
                        <option>6° Básico</option>
                        <option>7° Básico</option>
                        <option>8° Básico</option>
                        <option>I° Medio</option>
                        <option>II° Medio</option>
                        <option>III° Medio</option>
                        <option>IV° Medio</option>
                    </select>
                </div>
            </div>

            {/* Batch Actions Bar */}
            {selectedIds.size > 0 && (
                <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-[var(--primary)]/10 border border-[var(--primary)]/30 animate-fade-in">
                    <span className="text-sm font-semibold text-[var(--primary)]">
                        {selectedIds.size} {selectedIds.size === 1 ? 'kit seleccionado' : 'kits seleccionados'}
                    </span>
                    <div className="flex-1" />
                    <button
                        onClick={batchDownload}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
                    >
                        <Download size={14} /> Descargar
                    </button>
                    <button
                        onClick={() => setShowBatchDeleteConfirm(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                    >
                        <Trash2 size={14} /> Eliminar
                    </button>
                    <button
                        onClick={() => setSelectedIds(new Set())}
                        className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                        title="Deseleccionar todo"
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* List Table Layout */}
            <div className="glass-card-premium rounded-2xl overflow-hidden shadow-lg border border-[var(--border)]">
                {loading ? (
                    <div className="p-12 text-center text-[var(--muted)]">Cargando biblioteca...</div>
                ) : filteredClasses.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-[var(--input-bg)] rounded-full flex items-center justify-center mb-4">
                            <Search className="w-6 h-6 text-[var(--muted)]" />
                        </div>
                        <h3 className="text-lg font-bold text-[var(--foreground)] mb-1">No se encontraron resultados</h3>
                        <p className="text-[var(--muted)] text-sm">Intenta ajustar los filtros o tu búsqueda.</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-[var(--border)] bg-[var(--card)]/50 text-xs uppercase tracking-wider text-[var(--muted)]">
                                        <th className="pl-4 pr-2 py-4 w-10">
                                            <button
                                                onClick={toggleSelectAll}
                                                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                                    selectedIds.size === filteredClasses.length && filteredClasses.length > 0
                                                        ? 'bg-[var(--primary)] border-[var(--primary)] text-white'
                                                        : 'border-[var(--border)] hover:border-[var(--primary)]'
                                                }`}
                                            >
                                                {selectedIds.size === filteredClasses.length && filteredClasses.length > 0 && <CheckCheck size={12} />}
                                            </button>
                                        </th>
                                        <th className="px-3 py-4 font-bold">Nombre del Kit</th>
                                        <th className="px-3 py-4 font-bold">Asignatura</th>
                                        <th className="px-3 py-4 font-bold">Curso</th>
                                        <th className="px-3 py-4 font-bold text-center">Feedback</th>
                                        <th className="px-3 py-4 font-bold">Creado</th>
                                        <th className="px-3 py-4 font-bold text-right">Acciones Rápidas</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border)]">
                                    {filteredClasses.map((item) => (
                                        <tr key={item.id} className={`hover:bg-[var(--card-hover)]/50 transition-colors group ${selectedIds.has(item.id) ? 'bg-[var(--primary)]/5' : ''}`}>
                                            <td className="pl-4 pr-2 py-4">
                                                <button
                                                    onClick={() => toggleSelect(item.id)}
                                                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                                        selectedIds.has(item.id)
                                                            ? 'bg-[var(--primary)] border-[var(--primary)] text-white'
                                                            : 'border-[var(--border)] hover:border-[var(--primary)]'
                                                    }`}
                                                >
                                                    {selectedIds.has(item.id) && <CheckCheck size={12} />}
                                                </button>
                                            </td>
                                            <td className="px-3 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)]">
                                                        <FolderHeart size={20} className="fill-current" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-[var(--foreground)] text-sm max-w-[300px]" title={item.topic || item.objetivo_clase || undefined}>
                                                            {item.topic || item.objetivo_clase || 'Sin Título'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getSubjectBadgeStyle(item.asignatura ?? '')}`}>
                                                    {item.asignatura || 'General'}
                                                </span>
                                            </td>
                                            <td className="px-3 py-4">
                                                <span className="text-sm text-[var(--muted)]">
                                                    {item.curso || '—'}
                                                </span>
                                            </td>
                                            <td className="px-3 py-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleFeedback(item.id, 'up')}
                                                        className={`p-1.5 rounded-lg transition-colors ${item.feedback === 'up' ? 'bg-green-500/20 text-green-500' : 'text-[var(--muted)] hover:text-green-500 hover:bg-green-500/10'}`}
                                                    >
                                                        <ThumbsUp size={16} className={item.feedback === 'up' ? 'fill-current' : ''} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleFeedback(item.id, 'down')}
                                                        className={`p-1.5 rounded-lg transition-colors ${item.feedback === 'down' ? 'bg-red-500/20 text-red-500' : 'text-[var(--muted)] hover:text-red-500 hover:bg-red-500/10'}`}
                                                    >
                                                        <ThumbsDown size={16} className={item.feedback === 'down' ? 'fill-current' : ''} />
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-3 py-4 text-sm text-[var(--muted)]">
                                                {new Date(item.created_at).toLocaleDateString('es-CL')}
                                            </td>
                                            <td className="px-3 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                                    {item.link_presentacion && (
                                                        <div className="relative group/doc">
                                                            <button
                                                                onClick={() => handleDownloadPdf(item.link_presentacion!, 'presentacion', item)}
                                                                disabled={downloadingPdf === `${item.id}-presentacion`}
                                                                className="p-2 hover:bg-[var(--primary)]/10 text-[var(--muted)] hover:text-[var(--primary)] rounded-lg transition-colors disabled:opacity-50"
                                                                title="Descargar Presentación"
                                                            >
                                                                {downloadingPdf === `${item.id}-presentacion` ? <Download size={18} className="animate-bounce" /> : <Presentation size={18} />}
                                                            </button>
                                                        </div>
                                                    )}
                                                    {item.planificacion && (
                                                        <div className="relative group/doc">
                                                            <button
                                                                onClick={() => handleDownloadPdf(item.planificacion!, 'planificacion', item)}
                                                                disabled={downloadingPdf === `${item.id}-planificacion`}
                                                                className="p-2 hover:bg-blue-500/10 text-[var(--muted)] hover:text-blue-500 rounded-lg transition-colors disabled:opacity-50"
                                                                title="Descargar Planificación"
                                                            >
                                                                {downloadingPdf === `${item.id}-planificacion` ? <Download size={18} className="animate-bounce" /> : <FileText size={18} />}
                                                            </button>
                                                        </div>
                                                    )}
                                                    {item.quiz && (
                                                        <div className="relative group/doc">
                                                            <button
                                                                onClick={() => handleDownloadPdf(item.quiz!, 'evaluacion', item)}
                                                                disabled={downloadingPdf === `${item.id}-evaluacion`}
                                                                className="p-2 hover:bg-green-500/10 text-[var(--muted)] hover:text-green-500 rounded-lg transition-colors disabled:opacity-50"
                                                                title="Descargar Quiz"
                                                            >
                                                                {downloadingPdf === `${item.id}-evaluacion` ? <Download size={18} className="animate-bounce" /> : <CheckSquare size={18} />}
                                                            </button>
                                                        </div>
                                                    )}
                                                    {item.link_paci && (
                                                        <div className="relative group/doc">
                                                            <button
                                                                onClick={() => handleDownloadPdf(item.link_paci!, 'planificacion', item)}
                                                                disabled={downloadingPdf === `${item.id}-paci`}
                                                                className="p-2 hover:bg-orange-500/10 text-[var(--muted)] hover:text-orange-500 rounded-lg transition-colors disabled:opacity-50"
                                                                title="Descargar PACI"
                                                            >
                                                                {downloadingPdf === `${item.id}-paci` ? <Download size={18} className="animate-bounce" /> : <ClipboardList size={18} />}
                                                            </button>
                                                        </div>
                                                    )}
                                                    <button
                                                        onClick={() => router.push(`/dashboard/kit-result?id=${item.id}`)}
                                                        className="p-2 hover:bg-amber-500/10 text-[var(--muted)] hover:text-amber-400 rounded-lg transition-colors"
                                                        title="Editar planificación"
                                                    >
                                                        <PencilLine size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDuplicate(item.id)}
                                                        disabled={duplicating === item.id}
                                                        className="p-2 hover:bg-indigo-500/10 text-[var(--muted)] hover:text-indigo-400 rounded-lg transition-colors disabled:opacity-50"
                                                        title="Duplicar planificación"
                                                    >
                                                        <Copy size={18} />
                                                    </button>
                                                    <div className="w-px h-4 bg-[var(--border)] mx-1"></div>
                                                    <button
                                                        onClick={() => handleDelete(item.id)}
                                                        className="p-2 hover:bg-red-500/10 text-[var(--muted)] hover:text-red-500 rounded-lg transition-colors"
                                                        title="Eliminar Kit"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="md:hidden flex flex-col divide-y divide-[var(--border)]">
                            {filteredClasses.map((item) => (
                                <div key={item.id} className={`p-4 flex flex-col gap-3 ${selectedIds.has(item.id) ? 'bg-[var(--primary)]/5' : ''}`}>
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <button
                                                onClick={() => toggleSelect(item.id)}
                                                className={`w-5 h-5 shrink-0 rounded border-2 flex items-center justify-center transition-colors ${
                                                    selectedIds.has(item.id)
                                                        ? 'bg-[var(--primary)] border-[var(--primary)] text-white'
                                                        : 'border-[var(--border)]'
                                                }`}
                                            >
                                                {selectedIds.has(item.id) && <CheckCheck size={10} />}
                                            </button>
                                            <div className="w-10 h-10 shrink-0 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)]">
                                                <FolderHeart size={20} className="fill-current" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-[var(--foreground)] text-sm truncate">{item.topic || item.objetivo_clase || 'Sin Título'}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getSubjectBadgeStyle(item.asignatura ?? '')}`}>
                                                        {item.asignatura || 'General'}
                                                    </span>
                                                    <span className="text-[var(--muted)] text-xs">{new Date(item.created_at).toLocaleDateString('es-CL')}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pl-[3.25rem]">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleFeedback(item.id, 'up')}
                                                className={`p-1.5 rounded-lg transition-colors ${item.feedback === 'up' ? 'bg-green-500/20 text-green-500' : 'text-[var(--muted)] hover:text-green-500'}`}
                                            >
                                                <ThumbsUp size={16} className={item.feedback === 'up' ? 'fill-current' : ''} />
                                            </button>
                                            <button
                                                onClick={() => handleFeedback(item.id, 'down')}
                                                className={`p-1.5 rounded-lg transition-colors ${item.feedback === 'down' ? 'bg-red-500/20 text-red-500' : 'text-[var(--muted)] hover:text-red-500'}`}
                                            >
                                                <ThumbsDown size={16} className={item.feedback === 'down' ? 'fill-current' : ''} />
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5 justify-end">
                                            {item.link_presentacion && (
                                                <button onClick={() => handleDownloadPdf(item.link_presentacion!, 'presentacion', item)} disabled={downloadingPdf === `${item.id}-presentacion`} className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--input-bg)] text-[var(--muted)] hover:text-[var(--primary)] border border-[var(--border)] disabled:opacity-50" title="Slide PDF">
                                                    {downloadingPdf === `${item.id}-presentacion` ? <Download size={16} className="animate-bounce" /> : <Presentation size={16} />}
                                                </button>
                                            )}
                                            {item.planificacion && (
                                                <button onClick={() => handleDownloadPdf(item.planificacion!, 'planificacion', item)} disabled={downloadingPdf === `${item.id}-planificacion`} className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--input-bg)] text-[var(--muted)] hover:text-blue-500 border border-[var(--border)] disabled:opacity-50" title="Planificación PDF">
                                                    {downloadingPdf === `${item.id}-planificacion` ? <Download size={16} className="animate-bounce" /> : <FileText size={16} />}
                                                </button>
                                            )}
                                            {item.quiz && (
                                                <button onClick={() => handleDownloadPdf(item.quiz!, 'evaluacion', item)} disabled={downloadingPdf === `${item.id}-evaluacion`} className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--input-bg)] text-[var(--muted)] hover:text-green-500 border border-[var(--border)] disabled:opacity-50" title="Quiz PDF">
                                                    {downloadingPdf === `${item.id}-evaluacion` ? <Download size={16} className="animate-bounce" /> : <CheckSquare size={16} />}
                                                </button>
                                            )}
                                            {item.link_paci && (
                                                <button onClick={() => handleDownloadPdf(item.link_paci!, 'planificacion', item)} disabled={downloadingPdf === `${item.id}-paci`} className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--input-bg)] text-[var(--muted)] hover:text-orange-500 border border-[var(--border)] disabled:opacity-50" title="PACI PDF">
                                                    {downloadingPdf === `${item.id}-paci` ? <Download size={16} className="animate-bounce" /> : <ClipboardList size={16} />}
                                                </button>
                                            )}
                                            <button onClick={() => router.push(`/dashboard/kit-result?id=${item.id}`)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--input-bg)] text-[var(--muted)] hover:text-amber-400 border border-[var(--border)]" title="Editar">
                                                <PencilLine size={16} />
                                            </button>
                                            <button onClick={() => handleDuplicate(item.id)} disabled={duplicating === item.id} className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--input-bg)] text-[var(--muted)] hover:text-indigo-400 border border-[var(--border)] disabled:opacity-50" title="Duplicar">
                                                <Copy size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(item.id)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--input-bg)] text-[var(--muted)] hover:text-red-500 border border-[var(--border)]" title="Eliminar">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Delete Modal */}
            {deleteTargetId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-[var(--card)] border border-[var(--border)] w-full max-w-md rounded-2xl p-6 shadow-2xl relative animate-scale-in">
                        <div className="flex flex-col items-center text-center mb-6">
                            <div className="w-16 h-16 rounded-full bg-[var(--danger)]/10 text-[var(--danger)] flex items-center justify-center text-3xl mb-4">
                                <Trash2 size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-[var(--on-background)] mb-2">¿Eliminar este Kit?</h3>
                            <p className="text-[var(--muted)] text-sm">Esta acción no se puede deshacer. Todos los recursos asociados serán eliminados.</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteTargetId(null)}
                                className="flex-1 px-4 py-2 rounded-xl text-sm font-medium border border-[var(--border)] hover:bg-[var(--card-hover)] transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="flex-1 px-4 py-2 rounded-xl text-sm font-bold bg-[var(--danger)] text-white shadow-lg shadow-red-500/20 hover:bg-red-600 transition-colors"
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Batch Delete Confirmation Modal */}
            {showBatchDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-[var(--card)] border border-[var(--border)] w-full max-w-md rounded-2xl p-6 shadow-2xl relative animate-scale-in">
                        <div className="flex flex-col items-center text-center mb-6">
                            <div className="w-16 h-16 rounded-full bg-[var(--danger)]/10 text-[var(--danger)] flex items-center justify-center text-3xl mb-4">
                                <Trash2 size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-[var(--on-background)] mb-2">¿Eliminar {selectedIds.size} kits?</h3>
                            <p className="text-[var(--muted)] text-sm">Esta acción no se puede deshacer. Todos los recursos asociados serán eliminados permanentemente.</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowBatchDeleteConfirm(false)}
                                className="flex-1 px-4 py-2 rounded-xl text-sm font-medium border border-[var(--border)] hover:bg-[var(--card-hover)] transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={batchDelete}
                                disabled={batchDeleting}
                                className="flex-1 px-4 py-2 rounded-xl text-sm font-bold bg-[var(--danger)] text-white shadow-lg shadow-red-500/20 hover:bg-red-600 transition-colors disabled:opacity-50"
                            >
                                {batchDeleting ? 'Eliminando...' : `Eliminar ${selectedIds.size} kits`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
