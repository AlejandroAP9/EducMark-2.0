// Servicio de datos para el feature Portfolio Carrera Docente
// Queries a Supabase para obtener clases, evaluaciones y resultados OMR

import { createClient } from '@/lib/supabase/client';
import type {
  PortfolioDraft,
  GeneratedClassRow,
  EvaluationRow,
  EvaluationItemRow,
  OMRResultRow,
} from '../types/portfolio';

const supabase = createClient();

// --- Opciones disponibles (asignaturas + cursos reales del usuario) ---

export async function fetchUserSubjectsCourses(
  userId: string
): Promise<{ asignaturas: string[]; cursos: string[] }> {
  const { data, error } = await supabase
    .from('generated_classes')
    .select('asignatura, curso')
    .eq('user_id', userId)
    .eq('status', 'completed');

  if (error) throw new Error(`Error cargando opciones: ${error.message}`);

  const asignaturas = [...new Set((data ?? []).map((r) => r.asignatura))].sort();
  const cursos = [...new Set((data ?? []).map((r) => r.curso))].sort();

  return { asignaturas, cursos };
}

// --- Clases generadas ---

export async function fetchClassesByPeriod(
  userId: string,
  asignatura: string,
  curso: string
): Promise<GeneratedClassRow[]> {
  const { data, error } = await supabase
    .from('generated_classes')
    .select('id, user_id, asignatura, curso, objetivo_clase, planning_blocks, status, created_at, topic, planificacion')
    .eq('user_id', userId)
    .eq('asignatura', asignatura)
    .eq('curso', curso)
    .eq('status', 'completed')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Error cargando clases: ${error.message}`);
  return (data ?? []) as GeneratedClassRow[];
}

// --- Evaluaciones ---

export async function fetchEvaluations(
  userId: string,
  subject: string,
  grade: string
): Promise<EvaluationRow[]> {
  const { data, error } = await supabase
    .from('evaluations')
    .select('id, user_id, title, subject, grade, status, created_at')
    .eq('user_id', userId)
    .eq('subject', subject)
    .eq('grade', grade)
    .eq('status', 'active')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Error cargando evaluaciones: ${error.message}`);
  return (data ?? []) as EvaluationRow[];
}

export async function fetchEvaluationItems(
  evaluationId: string
): Promise<EvaluationItemRow[]> {
  const { data, error } = await supabase
    .from('evaluation_items')
    .select('id, evaluation_id, question_text, cognitive_skill, oa, options, correct_answer')
    .eq('evaluation_id', evaluationId);

  if (error) throw new Error(`Error cargando items: ${error.message}`);
  return (data ?? []) as EvaluationItemRow[];
}

// --- Resultados OMR ---

export async function fetchOMRResults(
  evaluationId: string
): Promise<OMRResultRow[]> {
  // OMR results son por estudiante. Agregamos por pregunta para el análisis.
  const { data, error } = await supabase
    .from('omr_results')
    .select('answers, score')
    .eq('evaluation_id', evaluationId);

  if (error) throw new Error(`Error cargando resultados OMR: ${error.message}`);
  if (!data || data.length === 0) return [];

  // Agregar: contar correctas por pregunta usando los answers + score de cada estudiante
  return aggregateOMRByQuestion(data);
}

function aggregateOMRByQuestion(
  records: { answers: Record<string, unknown>; score: Record<string, unknown> }[]
): OMRResultRow[] {
  // Si no hay registros con structure parseable, retornar vacío
  if (records.length === 0) return [];

  const totalStudents = records.length;
  const avgScore =
    records.reduce((sum, r) => {
      const pct = (r.score as { percentage?: number })?.percentage ?? 0;
      return sum + pct;
    }, 0) / totalStudents;

  // Retornar un resumen general (los datos OMR son por estudiante, no por pregunta)
  return [
    {
      question_number: 0,
      skill_tag: 'promedio_general',
      correct_count: Math.round((avgScore / 100) * totalStudents),
      total_count: totalStudents,
      pct_correct: Math.round(avgScore * 10) / 10,
    },
  ];
}

// --- Portfolio Drafts CRUD ---

export async function saveDraft(
  draft: Omit<PortfolioDraft, 'id' | 'created_at' | 'updated_at'>
): Promise<PortfolioDraft> {
  const { data, error } = await supabase
    .from('portfolio_drafts')
    .insert(draft)
    .select()
    .single();

  if (error) throw new Error(`Error guardando borrador: ${error.message}`);
  return data as PortfolioDraft;
}

export async function updateDraft(
  id: string,
  updates: Partial<Pick<PortfolioDraft, 'draft_t1' | 'draft_t2' | 'draft_t3' | 'guided_answers' | 'status' | 'title'>>
): Promise<PortfolioDraft> {
  const { data, error } = await supabase
    .from('portfolio_drafts')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Error actualizando borrador: ${error.message}`);
  return data as PortfolioDraft;
}

export async function fetchUserDrafts(userId: string): Promise<PortfolioDraft[]> {
  const { data, error } = await supabase
    .from('portfolio_drafts')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) throw new Error(`Error cargando borradores: ${error.message}`);
  return (data ?? []) as PortfolioDraft[];
}

export async function fetchDraftById(id: string): Promise<PortfolioDraft | null> {
  const { data, error } = await supabase
    .from('portfolio_drafts')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data as PortfolioDraft;
}
