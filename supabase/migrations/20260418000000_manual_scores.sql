-- Tabla para scores de corrección manual (items tipo desarrollo / respuesta breve)
-- que no se corrigen por OMR. El profe ingresa puntaje + notas desde ManualScoringModal
-- y el ResultsView combina OMR + manual para la nota final.

CREATE TABLE IF NOT EXISTS public.manual_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  omr_result_id UUID NOT NULL REFERENCES public.omr_results(id) ON DELETE CASCADE,
  evaluation_id TEXT NOT NULL,
  question_number INTEGER,
  item_id UUID REFERENCES public.evaluation_items(id) ON DELETE SET NULL,
  item_type TEXT NOT NULL,
  student_answer TEXT,
  score_awarded NUMERIC(5,2) NOT NULL DEFAULT 0,
  max_score NUMERIC(5,2) NOT NULL DEFAULT 1,
  corrected_by UUID REFERENCES auth.users(id),
  corrected_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT,
  UNIQUE (omr_result_id, item_id)
);

CREATE INDEX IF NOT EXISTS idx_manual_scores_omr_result
  ON public.manual_scores(omr_result_id);

CREATE INDEX IF NOT EXISTS idx_manual_scores_evaluation
  ON public.manual_scores(evaluation_id);

ALTER TABLE public.manual_scores ENABLE ROW LEVEL SECURITY;

-- RLS: solo el dueño de la evaluación puede ver/editar los scores manuales
-- (via omr_results.user_id → auth.uid())
CREATE POLICY "users_read_own_manual_scores" ON public.manual_scores
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.omr_results r
      WHERE r.id = manual_scores.omr_result_id
        AND r.user_id = auth.uid()
    )
  );

CREATE POLICY "users_write_own_manual_scores" ON public.manual_scores
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.omr_results r
      WHERE r.id = manual_scores.omr_result_id
        AND r.user_id = auth.uid()
    )
  );

CREATE POLICY "users_update_own_manual_scores" ON public.manual_scores
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.omr_results r
      WHERE r.id = manual_scores.omr_result_id
        AND r.user_id = auth.uid()
    )
  );

CREATE POLICY "users_delete_own_manual_scores" ON public.manual_scores
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.omr_results r
      WHERE r.id = manual_scores.omr_result_id
        AND r.user_id = auth.uid()
    )
  );

COMMENT ON TABLE public.manual_scores IS
  'Scores manuales para items de desarrollo/respuesta breve que no se leen por OMR. El profe los ingresa desde ManualScoringModal y ResultsView los combina con el score OMR para la nota final.';
