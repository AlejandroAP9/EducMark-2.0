export type TicketQuestionType = 'multiple_choice' | 'true_false' | 'open';

export interface PlanningBlocks {
    objective: string;
    indicators: string[];
    inicio: string;
    desarrollo: string;
    cierre: string;
    resources: string[];
    planningText?: string;
}

export interface ExitTicketQuestion {
    id: number;
    type: TicketQuestionType;
    question: string;
    options?: string[];
    answer?: string | null;
}

export interface ExitTicket {
    title: string;
    instructions: string;
    questions: ExitTicketQuestion[];
}

export interface GeneratedClassWorkflowRow {
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

export interface PlanningVersionRow {
    id: string;
    version_number: number;
    change_summary: string | null;
    created_at: string;
    edited_by: string;
    editor_name?: string;
}

export const EMPTY_BLOCKS: PlanningBlocks = {
    objective: '',
    indicators: [],
    inicio: '',
    desarrollo: '',
    cierre: '',
    resources: [],
    planningText: '',
};

export const EMPTY_EXIT_TICKET: ExitTicket = {
    title: 'Ticket de Salida',
    instructions: 'Responde al finalizar la clase.',
    questions: [],
};

export function normalizeBlocks(raw: unknown): PlanningBlocks {
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

export function normalizeTicket(raw: unknown): ExitTicket {
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
