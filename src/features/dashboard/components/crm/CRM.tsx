'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import {
    Users, UserPlus, Filter, Search, MoreVertical, Phone, Mail,
    MessageCircle, Calendar, Tag, ChevronRight, Clock, Sparkles,
    TrendingUp, ArrowRight, Plus, X, Loader2, GripVertical, Instagram, AlertCircle
} from 'lucide-react';
import { LeadDetail } from './LeadDetail';

// Types
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
    count: number;
}

interface FunnelData {
    stage: string;
    display_name: string;
    color: string;
    position: number;
    count: number;
    percentage: number;
}

interface VelocityStatRow {
    [key: string]: string | number | null;
}

export function CRM() {
    const supabase = createClient();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [stages, setStages] = useState<PipelineStage[]>([]);
    const [funnelData, setFunnelData] = useState<FunnelData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [showDetail, setShowDetail] = useState(false);
    const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
    const [dragOverStage, setDragOverStage] = useState<string | null>(null);
    const [insights, setInsights] = useState({
        needingAttention: 0,
        tasksToday: 0,
        newToday: 0,
        totalRevenue: 0
    });
    const [velocityStats, setVelocityStats] = useState<VelocityStatRow[]>([]);

    // Filters
    const [filterRol, setFilterRol] = useState('');
    const [filterInst, setFilterInst] = useState('');

    // Fetch initial data
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // 1. Fetch Stages (Critical)
            const { data: stagesData, error: stagesError } = await supabase
                .from('pipeline_stages')
                .select('*')
                .order('position');

            if (stagesError) {
                console.error('Error fetching stages:', stagesError);
                toast.error('Error al cargar etapas (usando por defecto)');
                // Fallback Stages incase DB table is missing/restricted
                setStages([
                    { name: 'prospecto', display_name: 'Prospecto', color: '#64748b', position: 1, count: 0 },
                    { name: 'lead_calificado', display_name: 'Lead Calificado', color: '#3b82f6', position: 2, count: 0 },
                    { name: 'propuesta', display_name: 'Propuesta', color: '#eab308', position: 3, count: 0 },
                    { name: 'negociacion', display_name: 'Negociación', color: '#f97316', position: 4, count: 0 },
                    { name: 'ganada', display_name: 'Ganada', color: '#22c55e', position: 5, count: 0 }
                ]);
            } else {
                setStages(stagesData || []);
            }

            // 2. Fetch Leads (Critical)
            const { data: leadsData, error: leadsError } = await supabase
                .from('usuarios_crm')
                .select('*')
                .order('created_at', { ascending: false });

            if (leadsError) {
                console.error('Error fetching leads:', leadsError);
                toast.error('Error al cargar leads');
            } else {
                setLeads(leadsData || []);
            }

            // setStages was already handled above in the if/else block

            // 3. Analytics (Non-critical) - Funnel
            try {
                const { data: funnelRes, error: funnelError } = await supabase.from('crm_funnel').select('*');
                if (funnelError) console.warn('Funnel error (ignored):', funnelError);
                else setFunnelData(funnelRes || []);
            } catch (e) { console.warn('Funnel exception:', e); }

            // 4. Analytics (Non-critical) - Velocity
            try {
                const { data: velocityRes, error: velocityError } = await supabase.from('crm_velocity_analytics').select('*');
                if (velocityError) console.warn('Velocity error (ignored):', velocityError);
                else setVelocityStats(velocityRes || []);
            } catch (e) { console.warn('Velocity exception:', e); }

            // 5. Tasks (Non-critical)
            try {
                const now = new Date();
                const { count: tasksToday } = await supabase
                    .from('crm_tasks')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'pendiente')
                    .lte('due_date', now.toISOString());

                // Recalculate insights
                const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
                const todayStr = now.toISOString().split('T')[0];

                const needingAttention = leadsData?.filter(l =>
                    l.last_interaction && new Date(l.last_interaction) < threeDaysAgo
                ).length || 0;

                const newToday = leadsData?.filter(l =>
                    l.created_at?.startsWith(todayStr)
                ).length || 0;

                const totalRevenue = leadsData?.reduce((sum, l) => sum + (l.total_revenue || 0), 0) || 0;

                setInsights({
                    needingAttention,
                    newToday,
                    tasksToday: tasksToday || 0,
                    totalRevenue
                });

            } catch (e) { console.warn('Tasks/Insights error:', e); }

        } catch (error: unknown) {
            console.error('Critical CRM error:', error);
            toast.error('Error crítico al cargar CRM');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();

        // Subscribe to realtime changes
        const subscription = supabase
            .channel('crm_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'usuarios_crm' }, () => {
                fetchData();
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [fetchData]);

    // List of unique institutions and subjects (roles) for filters
    const institutions = Array.from(new Set(leads.map(l => l.institucion).filter((v): v is string => Boolean(v))));
    const subjects = Array.from(new Set(leads.map(l => l.rol).filter((v): v is string => Boolean(v))));

    // Filter leads
    const filteredLeads = leads.filter(lead => {
        const matchesSearch =
            lead.nombre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            lead.email?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesRol = filterRol === '' || lead.rol === filterRol;
        const matchesInst = filterInst === '' || lead.institucion === filterInst;

        return matchesSearch && matchesRol && matchesInst;
    });

    // Group leads by stage
    const leadsByStage = stages.reduce((acc, stage) => {
        acc[stage.name] = filteredLeads.filter(lead => (lead.stage || 'lead_frio') === stage.name);
        return acc;
    }, {} as Record<string, Lead[]>);

    // Drag and Drop handlers
    const handleDragStart = (e: unknown, lead: Lead) => {
        setDraggedLead(lead);
        const event = e as React.DragEvent;
        if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent, stageName: string) => {
        e.preventDefault();
        setDragOverStage(stageName);
    };

    const handleDragLeave = () => {
        setDragOverStage(null);
    };

    const handleDrop = async (e: React.DragEvent, newStage: string) => {
        e.preventDefault();
        setDragOverStage(null);

        if (!draggedLead || draggedLead.stage === newStage) {
            setDraggedLead(null);
            return;
        }

        try {
            // Use the move_lead_to_stage function
            const { error } = await supabase.rpc('move_lead_to_stage', {
                p_lead_id: draggedLead.id,
                p_new_stage: newStage
            });

            if (error) throw error;

            toast.success(`Lead movido a ${stages.find(s => s.name === newStage)?.display_name}`);
            fetchData();
        } catch (error: unknown) {
            console.error('Error moving lead:', error);
            toast.error('Error al mover el lead');
        } finally {
            setDraggedLead(null);
        }
    };

    // Open lead detail
    const openLeadDetail = (lead: Lead) => {
        setSelectedLead(lead);
        setShowDetail(true);
    };

    // Get time ago string
    const getTimeAgo = (dateStr: string | null) => {
        if (!dateStr) return 'Sin actividad';
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Hoy';
        if (diffDays === 1) return 'Ayer';
        if (diffDays < 7) return `Hace ${diffDays} días`;
        if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} sem`;
        return `Hace ${Math.floor(diffDays / 30)} mes`;
    };

    // Priority badge color
    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'alta': return 'bg-red-500/20 text-red-400 border-red-500/30';
            case 'media': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            case 'baja': return 'bg-green-500/20 text-green-400 border-green-500/30';
            default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }
    };

    // Source badge
    const getSourceBadge = (source: string) => {
        const sourceConfig: Record<string, { icon: string; color: string }> = {
            'ebook': { icon: '📚', color: 'bg-purple-500/20 text-purple-400' },
            'instagram': { icon: '📸', color: 'bg-pink-500/20 text-pink-400' },
            'organic': { icon: '🌱', color: 'bg-green-500/20 text-green-400' },
            'referral': { icon: '🤝', color: 'bg-blue-500/20 text-blue-400' }
        };
        const config = sourceConfig[source] || sourceConfig['organic'];
        return (
            <span className={`text-xs px-2 py-0.5 rounded-full ${config.color}`}>
                {config.icon} {source}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
            </div>
        );
    }

    return (
        <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col px-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--foreground)] flex items-center gap-2">
                        <Users className="w-7 h-7 text-[var(--primary)]" />
                        CRM EducMark
                    </h1>
                    <p className="text-[var(--muted)] mt-1">
                        {leads.length} leads en tu pipeline
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
                        <input
                            type="text"
                            placeholder="Buscar lead..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 w-64"
                        />
                    </div>

                    {/* Add Lead Button */}
                    <button
                        onClick={() => {
                            setSelectedLead(null);
                            setShowDetail(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
                    >
                        <UserPlus className="w-4 h-4" />
                        <span className="hidden sm:inline">Nuevo Lead</span>
                    </button>
                </div>
            </div>

            {/* Velocity & Filters Bar */}
            <div className="flex flex-col lg:flex-row gap-4">
                {/* Advanced Filters */}
                <div className="flex-1 flex flex-wrap items-center gap-3 bg-[var(--card)]/50 p-3 rounded-xl border border-[var(--border)]">
                    <div className="flex items-center gap-2 text-xs text-[var(--muted)] font-bold uppercase tracking-wider px-2">
                        <Filter className="w-3 h-3" /> Filtros:
                    </div>
                    <select
                        value={filterRol}
                        onChange={(e) => setFilterRol(e.target.value)}
                        className="bg-[var(--surface)] text-sm border border-[var(--border)] rounded-lg px-3 py-1.5 text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                    >
                        <option value="">Todas las Asignaturas</option>
                        {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <select
                        value={filterInst}
                        onChange={(e) => setFilterInst(e.target.value)}
                        className="bg-[var(--surface)] text-sm border border-[var(--border)] rounded-lg px-3 py-1.5 text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                    >
                        <option value="">Todas las Instituciones</option>
                        {institutions.map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                    {(filterRol || filterInst) && (
                        <button
                            onClick={() => { setFilterRol(''); setFilterInst(''); }}
                            className="text-xs text-[var(--primary)] hover:underline"
                        >
                            Limpiar
                        </button>
                    )}
                </div>

                {/* Velocity Stats Tooltip/View */}
                <div className="flex items-center gap-2 bg-[var(--card)]/50 p-3 rounded-xl border border-[var(--border)] overflow-x-auto">
                    <div className="flex items-center gap-2 text-xs text-[var(--muted)] font-bold uppercase tracking-wider px-2 border-r border-[var(--border)] mr-2 whitespace-nowrap">
                        <Clock className="w-3 h-3" /> Prom. Días:
                    </div>
                    {stages.map(stage => {
                        const v = velocityStats.find(vs => vs.stage === stage.name);
                        return (
                            <div key={stage.name} className="flex flex-col items-center px-3 border-r last:border-0 border-[var(--border)]">
                                <span className="text-[10px] text-[var(--muted)] whitespace-nowrap">{stage.display_name}</span>
                                <span className="text-xs font-bold text-[var(--foreground)]">{v ? Math.round(Number(v.avg_days_in_stage) || 0) : 0}d</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Actionable Insights Bar - Adoption Phase */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-red-500/20">
                        <AlertCircle className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                        <div className="text-lg font-bold text-red-400">{insights.needingAttention}</div>
                        <div className="text-xs text-red-300">Leads sin contacto ({">"}3 días)</div>
                    </div>
                </div>
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-500/20">
                        <Calendar className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                        <div className="text-lg font-bold text-amber-400">{insights.tasksToday}</div>
                        <div className="text-xs text-amber-300">Tareas para hoy</div>
                    </div>
                </div>
                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/20">
                        <Sparkles className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <div className="text-lg font-bold text-blue-400">{insights.newToday}</div>
                        <div className="text-xs text-blue-300">Nuevos registros hoy</div>
                    </div>
                </div>
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/20">
                        <TrendingUp className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                        <div className="text-lg font-bold text-emerald-400">
                            ${insights.totalRevenue.toLocaleString('es-CL')}
                        </div>
                        <div className="text-xs text-emerald-300">LTV Acumulado (CRM)</div>
                    </div>
                </div>
            </div>

            {/* Funnel Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                {funnelData.map((stage, index) => (
                    <motion.div
                        key={stage.stage}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)]"
                        style={{ borderLeftColor: stage.color, borderLeftWidth: '3px' }}
                    >
                        <div className="text-xl font-bold text-[var(--foreground)]">{stage.count}</div>
                        <div className="text-xs text-[var(--muted)] truncate">{stage.display_name}</div>
                        <div className="text-xs mt-1" style={{ color: stage.color }}>
                            {stage.percentage}%
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Kanban Board */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
                <div className="flex gap-3 h-full min-w-full w-max px-4 pr-12">
                    {stages.map((stage) => (
                        <div
                            key={stage.name}
                            className={`w-60 flex-shrink-0 flex flex-col rounded-xl bg-[var(--surface)]/50 border transition-all duration-200 h-full max-h-[calc(100vh-250px)] ${dragOverStage === stage.name
                                ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                                : 'border-[var(--border)]'
                                }`}
                            onDragOver={(e) => handleDragOver(e, stage.name)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, stage.name)}
                        >
                            {/* Stage Header */}
                            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: stage.color }}
                                    />
                                    <span className="font-medium text-[var(--foreground)]">{stage.display_name}</span>
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--border)] text-[var(--muted)]">
                                        {leadsByStage[stage.name]?.length || 0}
                                    </span>
                                </div>
                            </div>

                            {/* Lead Cards */}
                            <div className="p-3 space-y-3 flex-1 overflow-y-auto custom-scrollbar">
                                <AnimatePresence>
                                    {leadsByStage[stage.name]?.map((lead) => (
                                        <motion.div
                                            key={lead.id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, lead)}
                                            onClick={() => openLeadDetail(lead)}
                                            className={`p-4 rounded-lg bg-[var(--background)] border border-[var(--border)] cursor-pointer hover:border-[var(--primary)]/50 transition-all group ${draggedLead?.id === lead.id ? 'opacity-50' : ''
                                                }`}
                                        >
                                            {/* Drag Handle */}
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <GripVertical className="w-4 h-4 text-[var(--muted)] opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center text-white text-sm font-bold">
                                                        {(lead.nombre || lead.email || '?').charAt(0).toUpperCase()}
                                                    </div>
                                                </div>
                                                <span className={`text-xs px-2 py-0.5 rounded-full border ${getPriorityColor(lead.priority || 'media')}`}>
                                                    {lead.priority || 'media'}
                                                </span>
                                            </div>

                                            {/* Lead Info */}
                                            <div className="ml-6">
                                                <h4 className="font-medium text-[var(--foreground)] truncate flex items-center justify-between">
                                                    {lead.nombre || 'Sin nombre'}
                                                    {lead.last_interaction && (new Date().getTime() - new Date(lead.last_interaction).getTime() > 3 * 24 * 60 * 60 * 1000) && (
                                                        <AlertCircle className="w-3 h-3 text-red-400" />
                                                    )}
                                                </h4>
                                                <p className="text-sm text-[var(--muted)] truncate flex items-center gap-1">
                                                    <Mail className="w-3 h-3" />
                                                    {lead.email ? lead.email.replace(/^(.{2}).*(@.*)$/, '$1***$2') : 'Sin email'}
                                                </p>
                                                {lead.instagram && (
                                                    <p className="text-xs text-[var(--muted)] truncate flex items-center gap-1 mt-1">
                                                        <Instagram className="w-3 h-3" />
                                                        {lead.instagram}
                                                    </p>
                                                )}
                                                {lead.institucion && (
                                                    <p className="text-xs text-[var(--muted)] truncate mt-1">
                                                        🏫 {lead.institucion}
                                                    </p>
                                                )}

                                                {/* Tags */}
                                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                                    {getSourceBadge(lead.source || 'organic')}
                                                    {lead.plan && (
                                                        <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--primary)]/20 text-[var(--primary)]">
                                                            {lead.plan}
                                                        </span>
                                                    )}
                                                    {lead.tags && lead.tags.map(tag => (
                                                        <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--border)] text-[var(--muted)] border border-[var(--border)]">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>

                                                {/* Last interaction */}
                                                <div className="flex items-center gap-1 mt-2 text-xs text-[var(--muted)]">
                                                    <Clock className="w-3 h-3" />
                                                    {getTimeAgo(lead.last_interaction || lead.created_at)}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>

                                {(leadsByStage[stage.name]?.length || 0) === 0 && (
                                    <div className="text-center py-8 text-[var(--muted)]">
                                        <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">Sin leads</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Lead Detail Modal */}
            <AnimatePresence>
                {showDetail && (
                    <LeadDetail
                        lead={selectedLead}
                        stages={stages}
                        onClose={() => {
                            setShowDetail(false);
                            setSelectedLead(null);
                        }}
                        onUpdate={fetchData}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
