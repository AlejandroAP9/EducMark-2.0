/** CRM shared types */

export interface Lead {
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

export interface PipelineStage {
    name: string;
    display_name: string;
    color: string;
    position: number;
    count: number;
}

export interface FunnelData {
    stage: string;
    display_name: string;
    color: string;
    position: number;
    count: number;
    percentage: number;
}

export interface Interaction {
    id: string;
    lead_id: string;
    type: string;
    content: string;
    direction: string;
    created_at: string;
}

export interface Task {
    id: string;
    lead_id: string;
    title: string;
    description: string | null;
    due_date: string | null;
    priority: string;
    status: string;
    completed_at: string | null;
    created_at: string;
}

/** Days threshold for "needs attention" alert */
export const ATTENTION_THRESHOLD_DAYS = 3;
export const ATTENTION_THRESHOLD_MS = ATTENTION_THRESHOLD_DAYS * 24 * 60 * 60 * 1000;

/** CRM sources */
export const CRM_SOURCES = ['ebook', 'instagram', 'organic', 'referral', 'whatsapp', 'evento'] as const;

/** CRM priorities */
export const CRM_PRIORITIES = ['alta', 'media', 'baja'] as const;

/** Default fallback stages */
export const DEFAULT_STAGES: PipelineStage[] = [
    { name: 'prospecto', display_name: 'Prospecto', color: '#64748b', position: 1, count: 0 },
    { name: 'lead_calificado', display_name: 'Lead Calificado', color: '#3b82f6', position: 2, count: 0 },
    { name: 'propuesta', display_name: 'Propuesta', color: '#eab308', position: 3, count: 0 },
    { name: 'negociacion', display_name: 'Negociación', color: '#f97316', position: 4, count: 0 },
    { name: 'ganada', display_name: 'Ganada', color: '#22c55e', position: 5, count: 0 }
];
