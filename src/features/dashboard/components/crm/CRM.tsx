'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import {
    Users, UserPlus, Filter, Search, MoreVertical, Phone, Mail,
    MessageCircle, Calendar, Tag, ChevronRight, Clock, Sparkles,
    TrendingUp, ArrowRight, Plus, X, Loader2, GripVertical, Instagram, AlertCircle,
    Download, CheckSquare, Square, ArrowUpDown, List, LayoutGrid, Percent
} from 'lucide-react';
import { LeadDetail } from './LeadDetail';
import { Lead, PipelineStage, FunnelData, DEFAULT_STAGES, ATTENTION_THRESHOLD_MS, CRM_SOURCES } from './types';

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
    const [filterSource, setFilterSource] = useState('');

    // Bulk selection
    const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
    const [bulkMoving, setBulkMoving] = useState(false);

    // Sort & View
    const [sortBy, setSortBy] = useState<'created' | 'name' | 'revenue' | 'last_contact'>('created');
    const [mobileView, setMobileView] = useState<'kanban' | 'list'>('kanban');

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
                setStages(DEFAULT_STAGES);
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
                const threeDaysAgo = new Date(now.getTime() - ATTENTION_THRESHOLD_MS);
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

    // Sort leads (must be defined before leadsByStage)
    const sortLeads = (leadsArr: Lead[]) => {
        return [...leadsArr].sort((a, b) => {
            switch (sortBy) {
                case 'name': return (a.nombre || '').localeCompare(b.nombre || '');
                case 'revenue': return (b.total_revenue || 0) - (a.total_revenue || 0);
                case 'last_contact':
                    return new Date(b.last_interaction || 0).getTime() - new Date(a.last_interaction || 0).getTime();
                default: return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            }
        });
    };

    // Filter leads
    const filteredLeads = leads.filter(lead => {
        const matchesSearch =
            lead.nombre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            lead.email?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesRol = filterRol === '' || lead.rol === filterRol;
        const matchesInst = filterInst === '' || lead.institucion === filterInst;
        const matchesSource = filterSource === '' || lead.source === filterSource;

        return matchesSearch && matchesRol && matchesInst && matchesSource;
    });

    // Group leads by stage (with sorting)
    const leadsByStage = stages.reduce((acc, stage) => {
        acc[stage.name] = sortLeads(filteredLeads.filter(lead => (lead.stage || 'lead_frio') === stage.name));
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

    // Export CSV
    const exportCSV = () => {
        const headers = ['Nombre', 'Email', 'Telefono', 'Institucion', 'Etapa', 'Prioridad', 'Fuente', 'Plan', 'LTV', 'Creado'];
        const rows = filteredLeads.map(l => [
            l.nombre || '', l.email || '', l.telefono || '', l.institucion || '',
            stages.find(s => s.name === l.stage)?.display_name || l.stage,
            l.priority || 'media', l.source || 'organic', l.plan || '',
            String(l.total_revenue || 0),
            l.created_at ? new Date(l.created_at).toLocaleDateString('es-CL') : ''
        ]);
        const csv = [headers, ...rows].map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `crm-leads-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(`${filteredLeads.length} leads exportados`);
    };

    // Duplicate detection
    const duplicateEmails = leads.reduce((acc, lead) => {
        const email = lead.email?.toLowerCase();
        if (email) acc[email] = (acc[email] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    const duplicateCount = Object.values(duplicateEmails).filter(c => c > 1).length;

    // Conversion rate
    const conversionRate = leads.length > 0
        ? Math.round((leads.filter(l => l.stage === 'ganada').length / leads.length) * 100)
        : 0;

    // Bulk move
    const bulkMoveToStage = async (newStage: string) => {
        if (selectedLeadIds.size === 0) return;
        setBulkMoving(true);
        try {
            for (const id of selectedLeadIds) {
                await supabase.rpc('move_lead_to_stage', { p_lead_id: id, p_new_stage: newStage });
            }
            toast.success(`${selectedLeadIds.size} leads movidos`);
            setSelectedLeadIds(new Set());
            fetchData();
        } catch {
            toast.error('Error al mover leads');
        } finally {
            setBulkMoving(false);
        }
    };

    // Toggle lead selection
    const toggleLeadSelection = (e: React.MouseEvent, leadId: string) => {
        e.stopPropagation();
        setSelectedLeadIds(prev => {
            const next = new Set(prev);
            if (next.has(leadId)) next.delete(leadId); else next.add(leadId);
            return next;
        });
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

                <div className="flex items-center gap-2 flex-wrap">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
                        <input
                            type="text"
                            placeholder="Buscar lead..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 w-56"
                        />
                    </div>

                    {/* Sort */}
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                        className="bg-[var(--surface)] text-sm border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                        title="Ordenar leads"
                    >
                        <option value="created">Mas recientes</option>
                        <option value="name">Nombre A-Z</option>
                        <option value="revenue">Mayor LTV</option>
                        <option value="last_contact">Ultimo contacto</option>
                    </select>

                    {/* Mobile view toggle */}
                    <div className="flex md:hidden border border-[var(--border)] rounded-lg overflow-hidden">
                        <button
                            onClick={() => setMobileView('kanban')}
                            className={`p-2 ${mobileView === 'kanban' ? 'bg-[var(--primary)]/20 text-[var(--primary)]' : 'text-[var(--muted)]'}`}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setMobileView('list')}
                            className={`p-2 ${mobileView === 'list' ? 'bg-[var(--primary)]/20 text-[var(--primary)]' : 'text-[var(--muted)]'}`}
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Export CSV */}
                    <button
                        onClick={exportCSV}
                        className="flex items-center gap-1.5 px-3 py-2 bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)] rounded-lg hover:bg-[var(--border)] transition-colors text-sm"
                        title="Exportar leads a CSV"
                    >
                        <Download className="w-4 h-4" />
                        <span className="hidden lg:inline">CSV</span>
                    </button>

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
                    <select
                        value={filterSource}
                        onChange={(e) => setFilterSource(e.target.value)}
                        className="bg-[var(--surface)] text-sm border border-[var(--border)] rounded-lg px-3 py-1.5 text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                    >
                        <option value="">Todas las Fuentes</option>
                        {CRM_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {(filterRol || filterInst || filterSource) && (
                        <button
                            onClick={() => { setFilterRol(''); setFilterInst(''); setFilterSource(''); }}
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

            {/* Bulk actions bar */}
            {selectedLeadIds.size > 0 && (
                <div className="flex items-center gap-3 p-3 bg-[var(--primary)]/10 border border-[var(--primary)]/30 rounded-xl">
                    <span className="text-sm font-medium text-[var(--primary)]">{selectedLeadIds.size} seleccionados</span>
                    <span className="text-[var(--muted)]">→ Mover a:</span>
                    {stages.map(s => (
                        <button
                            key={s.name}
                            onClick={() => bulkMoveToStage(s.name)}
                            disabled={bulkMoving}
                            className="text-xs px-3 py-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--surface)] text-[var(--foreground)] transition-colors disabled:opacity-50"
                            style={{ borderColor: s.color }}
                        >
                            {s.display_name}
                        </button>
                    ))}
                    <button onClick={() => setSelectedLeadIds(new Set())} className="ml-auto text-xs text-[var(--muted)] hover:text-[var(--foreground)]">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Duplicate warning */}
            {duplicateCount > 0 && (
                <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-sm text-amber-400">
                    <AlertCircle className="w-4 h-4" />
                    <span>{duplicateCount} emails duplicados detectados en tu pipeline.</span>
                </div>
            )}

            {/* Actionable Insights Bar */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
                <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/20">
                        <Percent className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                        <div className="text-lg font-bold text-purple-400">{conversionRate}%</div>
                        <div className="text-xs text-purple-300">Tasa de conversion</div>
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

            {/* Mobile List View */}
            {mobileView === 'list' && (
                <div className="md:hidden flex-1 overflow-y-auto space-y-2 pb-4">
                    {stages.map(stage => {
                        const stageLeads = leadsByStage[stage.name] || [];
                        if (stageLeads.length === 0) return null;
                        return (
                            <div key={stage.name}>
                                <div className="flex items-center gap-2 px-2 py-2 sticky top-0 bg-[var(--background)] z-10">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
                                    <span className="text-sm font-semibold text-[var(--foreground)]">{stage.display_name}</span>
                                    <span className="text-xs text-[var(--muted)]">({stageLeads.length})</span>
                                </div>
                                {stageLeads.map(lead => (
                                    <div
                                        key={lead.id}
                                        onClick={() => openLeadDetail(lead)}
                                        className="flex items-center gap-3 p-3 mx-1 rounded-lg bg-[var(--surface)] border border-[var(--border)] mb-1.5"
                                    >
                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                            {(lead.nombre || '?').charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm text-[var(--foreground)] truncate">{lead.nombre || 'Sin nombre'}</p>
                                            <p className="text-xs text-[var(--muted)] truncate">{lead.institucion || lead.email}</p>
                                        </div>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full border flex-shrink-0 ${getPriorityColor(lead.priority || 'media')}`}>
                                            {lead.priority || 'media'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Kanban Board */}
            <div className={`flex-1 overflow-x-auto overflow-y-hidden pb-4 ${mobileView === 'list' ? 'hidden md:block' : ''}`}>
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
                                            {/* Drag Handle + Select */}
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <button onClick={(e) => toggleLeadSelection(e, lead.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {selectedLeadIds.has(lead.id)
                                                            ? <CheckSquare className="w-4 h-4 text-[var(--primary)]" />
                                                            : <Square className="w-4 h-4 text-[var(--muted)]" />}
                                                    </button>
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
                                                    {lead.last_interaction && (new Date().getTime() - new Date(lead.last_interaction).getTime() > ATTENTION_THRESHOLD_MS) && (
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
