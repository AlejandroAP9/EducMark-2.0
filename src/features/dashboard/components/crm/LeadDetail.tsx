'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import {
    X, Mail, Phone, Building2, Calendar, Tag, MessageCircle,
    Clock, User, Send, Loader2, Plus, CheckCircle, Trash2,
    ChevronDown, Edit3, Save, Instagram, Sparkles
} from 'lucide-react';

interface Lead {
    id: string;
    user_id: string | null;
    nombre: string;
    email: string;
    telefono: string | null;
    rol: string | null;
    plan: string | null;
    estatus_suscripcion: string | null;
    creditos_restantes: number | null;
    institucion: string | null;
    created_at: string;
    descarga_ebook: string | null;
    source: string;
    stage: string;
    last_interaction: string | null;
    notes: string | null;
    tags: string[];
    priority: string;
    instagram: string | null;
    total_revenue: number | null;
    last_contacted_at: string | null;
}

interface PipelineStage {
    name: string;
    display_name: string;
    color: string;
    position: number;
}

interface Interaction {
    id: string;
    lead_id: string;
    type: string;
    content: string;
    direction: string;
    created_at: string;
}

interface Task {
    id: string;
    lead_id: string;
    title: string;
    description: string | null;
    due_date: string | null;
    priority: string;
    status: string;
    created_at: string;
}

interface LeadDetailProps {
    lead: Lead | null;
    stages: PipelineStage[];
    onClose: () => void;
    onUpdate: () => void;
}

export function LeadDetail({ lead, stages, onClose, onUpdate }: LeadDetailProps) {
    const supabase = createClient();
    const [isEditing, setIsEditing] = useState(!lead);
    const [saving, setSaving] = useState(false);
    const [interactions, setInteractions] = useState<Interaction[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loadingInteractions, setLoadingInteractions] = useState(true);
    const [newNote, setNewNote] = useState('');
    const [addingNote, setAddingNote] = useState(false);
    const [showAddTask, setShowAddTask] = useState(false);
    const [newTask, setNewTask] = useState({ title: '', due_date: '' });

    // Form state
    const [formData, setFormData] = useState({
        nombre: lead?.nombre || '',
        email: lead?.email || '',
        telefono: lead?.telefono || '',
        institucion: lead?.institucion || '',
        stage: lead?.stage || 'lead_frio',
        priority: lead?.priority || 'media',
        source: lead?.source || 'organic',
        notes: lead?.notes || '',
        instagram: lead?.instagram || '',
        total_revenue: lead?.total_revenue || 0
    });

    // Fetch interactions and tasks
    useEffect(() => {
        if (lead?.id) {
            fetchInteractions();
            fetchTasks();
        } else {
            setLoadingInteractions(false);
        }
    }, [lead?.id]);

    const fetchInteractions = async () => {
        if (!lead?.id) return;
        try {
            const { data, error } = await supabase
                .from('interactions')
                .select('*')
                .eq('lead_id', lead.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setInteractions(data || []);
        } catch (error) {
            console.error('Error fetching interactions:', error);
        } finally {
            setLoadingInteractions(false);
        }
    };

    const fetchTasks = async () => {
        if (!lead?.id) return;
        try {
            const { data, error } = await supabase
                .from('crm_tasks')
                .select('*')
                .eq('lead_id', lead.id)
                .order('due_date', { ascending: true });

            if (error) throw error;
            setTasks(data || []);
        } catch (error) {
            console.error('Error fetching tasks:', error);
        }
    };

    // Save lead
    const handleSave = async () => {
        if (!formData.email) {
            toast.error('El email es obligatorio');
            return;
        }

        setSaving(true);
        try {
            if (lead?.id) {
                // Update existing
                const { error } = await supabase
                    .from('usuarios_crm')
                    .update({
                        nombre: formData.nombre,
                        email: formData.email,
                        telefono: formData.telefono,
                        institucion: formData.institucion,
                        stage: formData.stage,
                        priority: formData.priority,
                        source: formData.source,
                        notes: formData.notes,
                        instagram: formData.instagram,
                        total_revenue: formData.total_revenue,
                        last_interaction: new Date().toISOString()
                    })
                    .eq('id', lead.id);

                if (error) throw error;
                toast.success('Lead actualizado');
            } else {
                // Create new
                const { error } = await supabase
                    .from('usuarios_crm')
                    .insert({
                        nombre: formData.nombre,
                        email: formData.email,
                        telefono: formData.telefono,
                        institucion: formData.institucion,
                        stage: formData.stage,
                        priority: formData.priority,
                        source: formData.source,
                        notes: formData.notes,
                        instagram: formData.instagram,
                        total_revenue: formData.total_revenue
                    });

                if (error) throw error;
                toast.success('Lead creado');
            }

            setIsEditing(false);
            onUpdate();
            if (!lead) onClose();
        } catch (error: unknown) {
            console.error('Error saving lead FULL:', error);
            const message = error instanceof Error ? error.message : 'Desconocido';
            toast.error(`Error al guardar: ${message}`);
        } finally {
            setSaving(false);
        }
    };

    // Add note/interaction
    const handleAddNote = async () => {
        if (!newNote.trim() || !lead?.id) return;

        setAddingNote(true);
        try {
            const { error } = await supabase
                .from('interactions')
                .insert({
                    lead_id: lead.id,
                    type: 'nota',
                    content: newNote,
                    direction: 'outbound'
                });

            if (error) throw error;

            // Update last_interaction
            await supabase
                .from('usuarios_crm')
                .update({ last_interaction: new Date().toISOString() })
                .eq('id', lead.id);

            setNewNote('');
            fetchInteractions();
            onUpdate();
            toast.success('Nota agregada');
        } catch (error) {
            console.error('Error adding note:', error);
            toast.error('Error al agregar nota');
        } finally {
            setAddingNote(false);
        }
    };

    // Add task
    const handleAddTask = async () => {
        if (!newTask.title.trim() || !lead?.id) return;

        try {
            const { error } = await supabase
                .from('crm_tasks')
                .insert({
                    lead_id: lead.id,
                    title: newTask.title,
                    due_date: newTask.due_date || null,
                    priority: 'media',
                    status: 'pendiente'
                });

            if (error) throw error;

            setNewTask({ title: '', due_date: '' });
            setShowAddTask(false);
            fetchTasks();
            toast.success('Tarea creada');
        } catch (error) {
            console.error('Error creating task:', error);
            toast.error('Error al crear tarea');
        }
    };

    // Complete task
    const handleCompleteTask = async (taskId: string) => {
        try {
            const { error } = await supabase
                .from('crm_tasks')
                .update({
                    status: 'completada',
                    completed_at: new Date().toISOString()
                })
                .eq('id', taskId);

            if (error) throw error;
            fetchTasks();
            toast.success('Tarea completada');
        } catch (error) {
            console.error('Error completing task:', error);
        }
    };

    // Delete task
    const handleDeleteTask = async (taskId: string) => {
        try {
            const { error } = await supabase
                .from('crm_tasks')
                .delete()
                .eq('id', taskId);

            if (error) throw error;
            fetchTasks();
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    };

    // Format date
    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('es-CL', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Interaction type icon
    const getInteractionIcon = (type: string) => {
        switch (type) {
            case 'email': return <Mail className="w-4 h-4" />;
            case 'whatsapp': return <MessageCircle className="w-4 h-4" />;
            case 'llamada': return <Phone className="w-4 h-4" />;
            case 'nota': return <Edit3 className="w-4 h-4" />;
            case 'generacion': return <Sparkles className="w-4 h-4 text-purple-400" />;
            default: return <Clock className="w-4 h-4" />;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-4xl max-h-[90vh] overflow-hidden bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-[var(--border)] flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-[var(--foreground)] flex items-center gap-2">
                            {lead ? (formData.nombre || 'Sin nombre') : 'Nuevo Lead'}
                            {lead?.tags && lead.tags.map(tag => (
                                <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--border)] text-[var(--muted)] font-normal border border-[var(--border)]">
                                    {tag}
                                </span>
                            ))}
                        </h2>
                        <p className="text-[var(--muted)] text-sm">{formData.email}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {formData.telefono && (
                        <a
                            href={`https://wa.me/${formData.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${formData.nombre || ''}, te escribo de EducMark...`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-lg transition-colors shadow-lg shadow-green-600/20"
                            onClick={async () => {
                                if (lead?.id) {
                                    await supabase.from('interactions').insert({
                                        lead_id: lead.id,
                                        type: 'whatsapp',
                                        content: 'Inició conversación por WhatsApp',
                                        direction: 'outbound'
                                    });
                                    onUpdate();
                                }
                            }}
                        >
                            <MessageCircle className="w-4 h-4" />
                            <span>WhatsApp</span>
                        </a>
                    )}
                    <div className="flex items-center gap-2">
                        {lead && !isEditing && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="px-3 py-2 text-sm rounded-lg border border-[var(--border)] hover:bg-[var(--border)] transition-colors text-[var(--foreground)]"
                            >
                                <Edit3 className="w-4 h-4" />
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-[var(--border)] transition-colors text-[var(--foreground)]"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex flex-col md:flex-row max-h-[calc(90vh-100px)] overflow-hidden">
                    {/* Left Panel - Lead Info */}
                    <div className="w-full md:w-1/2 p-6 border-r border-[var(--border)] overflow-y-auto">
                        <h3 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wider mb-4">
                            Información del Lead
                        </h3>

                        <div className="space-y-4">
                            {/* Name */}
                            <div>
                                <label className="text-sm text-[var(--muted)] mb-1 block">Nombre</label>
                                <input
                                    type="text"
                                    value={formData.nombre}
                                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                    disabled={!isEditing}
                                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] disabled:opacity-60"
                                    placeholder="Nombre completo"
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label className="text-sm text-[var(--muted)] mb-1 block">Email *</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    disabled={!isEditing}
                                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] disabled:opacity-60"
                                    placeholder="email@ejemplo.com"
                                />
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="text-sm text-[var(--muted)] mb-1 block">Teléfono</label>
                                <input
                                    type="tel"
                                    value={formData.telefono}
                                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                                    disabled={!isEditing}
                                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] disabled:opacity-60"
                                    placeholder="+56 9 1234 5678"
                                />
                            </div>

                            {/* Instagram */}
                            <div>
                                <label className="text-sm text-[var(--muted)] mb-1 block flex items-center gap-1">
                                    <Instagram className="w-3 h-3" /> Instagram
                                </label>
                                <input
                                    type="text"
                                    value={formData.instagram}
                                    onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                                    disabled={!isEditing}
                                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] disabled:opacity-60"
                                    placeholder="@usuario"
                                />
                            </div>

                            {/* Institution */}
                            <div>
                                <label className="text-sm text-[var(--muted)] mb-1 block">Institución</label>
                                <input
                                    type="text"
                                    value={formData.institucion}
                                    onChange={(e) => setFormData({ ...formData, institucion: e.target.value })}
                                    disabled={!isEditing}
                                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] disabled:opacity-60"
                                    placeholder="Colegio o institución"
                                />
                            </div>

                            {/* Stage */}
                            <div>
                                <label className="text-sm text-[var(--muted)] mb-1 block">Etapa</label>
                                <select
                                    value={formData.stage}
                                    onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                                    disabled={!isEditing}
                                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] disabled:opacity-60"
                                >
                                    {stages.map((stage) => (
                                        <option key={stage.name} value={stage.name}>
                                            {stage.display_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Priority & Source */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-[var(--muted)] mb-1 block">Prioridad</label>
                                    <select
                                        value={formData.priority}
                                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                        disabled={!isEditing}
                                        className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] disabled:opacity-60"
                                    >
                                        <option value="alta">Alta</option>
                                        <option value="media">Media</option>
                                        <option value="baja">Baja</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm text-[var(--muted)] mb-1 block">Ingreso Total (LTV)</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]">$</span>
                                        <input
                                            type="number"
                                            value={formData.total_revenue}
                                            onChange={(e) => setFormData({ ...formData, total_revenue: parseInt(e.target.value) || 0 })}
                                            disabled={!isEditing}
                                            className="w-full pl-7 pr-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] disabled:opacity-60"
                                            placeholder="Ingreso acumulado"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Source */}
                            <div>
                                <label className="text-sm text-[var(--muted)] mb-1 block">Origen</label>
                                <select
                                    value={formData.source}
                                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                                    disabled={!isEditing}
                                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] disabled:opacity-60"
                                >
                                    <option value="organic">Orgánico</option>
                                    <option value="ebook">Ebook</option>
                                    <option value="instagram">Instagram</option>
                                    <option value="referral">Referido</option>
                                </select>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="text-sm text-[var(--muted)] mb-1 block">Notas internas</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    disabled={!isEditing}
                                    rows={3}
                                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] disabled:opacity-60 resize-none"
                                    placeholder="Notas sobre este lead..."
                                />
                            </div>

                            {/* Save Button */}
                            {isEditing && (
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="w-full py-3 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {saving ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Save className="w-4 h-4" />
                                    )}
                                    {saving ? 'Guardando...' : 'Guardar'}
                                </button>
                            )}

                            {/* Lead metadata */}
                            {lead && (
                                <div className="pt-4 border-t border-[var(--border)] text-xs text-[var(--muted)] space-y-1">
                                    <p>Creado: {formatDate(lead.created_at)}</p>
                                    {lead.plan && <p>Plan: {lead.plan}</p>}
                                    {lead.creditos_restantes !== null && (
                                        <p>Créditos restantes: {lead.creditos_restantes}</p>
                                    )}
                                    {lead.descarga_ebook && (
                                        <p>Ebook: {lead.descarga_ebook === 'SI' ? '✅ Descargado' : '❌ No descargado'}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Panel - Interactions & Tasks */}
                    <div className="w-full md:w-1/2 p-6 overflow-y-auto bg-[var(--background)]/50">
                        {/* Tasks Section */}
                        {lead && (
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wider">
                                        Tareas
                                    </h3>
                                    <button
                                        onClick={() => setShowAddTask(!showAddTask)}
                                        className="text-xs text-[var(--primary)] hover:underline flex items-center gap-1"
                                    >
                                        <Plus className="w-3 h-3" /> Agregar
                                    </button>
                                </div>

                                {showAddTask && (
                                    <div className="mb-3 p-3 bg-[var(--surface)] rounded-lg border border-[var(--border)]">
                                        <input
                                            type="text"
                                            value={newTask.title}
                                            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                            placeholder="Título de la tarea..."
                                            className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] text-sm mb-2"
                                        />
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="datetime-local"
                                                value={newTask.due_date}
                                                onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                                                className="flex-1 px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] text-sm"
                                            />
                                            <button
                                                onClick={handleAddTask}
                                                className="px-3 py-2 bg-[var(--primary)] text-white rounded-lg text-sm"
                                            >
                                                Crear
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    {tasks.filter(t => t.status === 'pendiente').map((task) => (
                                        <div
                                            key={task.id}
                                            className="flex items-center gap-3 p-3 bg-[var(--surface)] rounded-lg border border-[var(--border)]"
                                        >
                                            <button
                                                onClick={() => handleCompleteTask(task.id)}
                                                className="w-5 h-5 rounded border border-[var(--border)] hover:bg-[var(--primary)] hover:border-[var(--primary)] transition-colors flex items-center justify-center"
                                            >
                                                <CheckCircle className="w-3 h-3 opacity-0 hover:opacity-100" />
                                            </button>
                                            <div className="flex-1">
                                                <p className="text-sm text-[var(--foreground)]">{task.title}</p>
                                                {task.due_date && (
                                                    <p className="text-xs text-[var(--muted)]">
                                                        📅 {formatDate(task.due_date)}
                                                    </p>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => handleDeleteTask(task.id)}
                                                className="p-1 hover:text-red-400 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    {tasks.filter(t => t.status === 'pendiente').length === 0 && (
                                        <p className="text-sm text-[var(--muted)] text-center py-2">
                                            Sin tareas pendientes
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Interactions Timeline */}
                        {lead && (
                            <div>
                                <h3 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wider mb-3">
                                    Historial de Interacciones
                                </h3>

                                {/* Add Note */}
                                <div className="mb-4 flex gap-2">
                                    <input
                                        type="text"
                                        value={newNote}
                                        onChange={(e) => setNewNote(e.target.value)}
                                        placeholder="Agregar nota..."
                                        className="flex-1 px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--foreground)] text-sm"
                                        onKeyPress={(e) => e.key === 'Enter' && handleAddNote()}
                                    />
                                    <button
                                        onClick={handleAddNote}
                                        disabled={addingNote || !newNote.trim()}
                                        className="px-3 py-2 bg-[var(--primary)] text-white rounded-lg disabled:opacity-50"
                                    >
                                        {addingNote ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Send className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>

                                {/* Timeline */}
                                {loadingInteractions ? (
                                    <div className="flex justify-center py-8">
                                        <Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" />
                                    </div>
                                ) : interactions.length > 0 ? (
                                    <div className="space-y-3">
                                        {interactions.map((interaction) => (
                                            <div
                                                key={interaction.id}
                                                className="flex gap-3 p-3 bg-[var(--surface)] rounded-lg border border-[var(--border)]"
                                            >
                                                <div className="w-8 h-8 rounded-full bg-[var(--border)] flex items-center justify-center text-[var(--muted)]">
                                                    {getInteractionIcon(interaction.type)}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--border)] text-[var(--muted)] capitalize">
                                                            {interaction.type}
                                                        </span>
                                                        <span className="text-xs text-[var(--muted)]">
                                                            {formatDate(interaction.created_at)}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-[var(--foreground)]">{interaction.content}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-[var(--muted)]">
                                        <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">Sin interacciones</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
