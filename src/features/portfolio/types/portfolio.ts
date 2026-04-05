// Types para el feature Portfolio Carrera Docente

export interface PortfolioDraft {
  id: string;
  user_id: string;
  title: string;
  asignatura: string;
  curso: string;
  periodo: string | null;
  status: 'borrador' | 'listo';
  selected_classes: string[];
  selected_evaluation: string | null;
  draft_t1: string;
  draft_t2: string;
  draft_t3: string;
  guided_answers: GuidedAnswers;
  created_at: string;
  updated_at: string;
}

export interface GuidedAnswers {
  t1_diversidad?: Record<string, string>;
  t2_uso_formativo?: Record<string, string>;
  t2_analisis_causas?: Record<string, string>;
  t3_socioemocional?: Record<string, string>;
}

export interface GeneratedClassRow {
  id: string;
  user_id: string;
  asignatura: string;
  curso: string;
  objetivo_clase: string | null;
  planning_blocks: PlanningBlock[] | null;
  status: string;
  created_at: string;
  oa_label?: string;
  skills?: string;
  attitudes?: string;
}

export interface PlanningBlock {
  title?: string;
  duration?: string;
  activities?: string;
  resources?: string;
  evaluation?: string;
  [key: string]: unknown;
}

export interface EvaluationRow {
  id: string;
  user_id: string;
  title: string;
  subject: string;
  grade: string;
  status: string;
  created_at: string;
}

export interface EvaluationItemRow {
  id: string;
  evaluation_id: string;
  question_text: string;
  cognitive_skill: string | null;
  oa: string | null;
  options: string[] | null;
  correct_answer: string | null;
}

export interface OMRResultRow {
  question_number: number;
  skill_tag: string | null;
  correct_count: number;
  total_count: number;
  pct_correct: number;
}

export interface PortfolioWizardState {
  step: number;
  asignatura: string;
  curso: string;
  periodo: string;
  selectedClasses: string[];
  selectedEvaluation: string | null;
  hasOMR: boolean;
}

export type TemplateSection = 'auto' | 'template' | 'auto+template';

export interface RubricIndicator {
  id: string;
  name: string;
  tarea: 'T1' | 'T2' | 'T3';
  type: TemplateSection;
  nivel_competente: string;
  nivel_destacado: string;
}
