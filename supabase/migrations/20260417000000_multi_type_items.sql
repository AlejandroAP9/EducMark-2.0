-- Multi-type items support — aditivo, backward-compatible
-- Agrega metadatos de tipo pedagógico, agrupamiento y corrección manual a evaluation_items

ALTER TABLE public.evaluation_items
  ADD COLUMN IF NOT EXISTS pedagogical_type TEXT,
  ADD COLUMN IF NOT EXISTS group_id UUID,
  ADD COLUMN IF NOT EXISTS is_manual BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS rubric TEXT;

-- Índice para lookup rápido de items de un grupo (Doble Proceso, Ordenamiento, Pareados)
CREATE INDEX IF NOT EXISTS idx_evaluation_items_group_id
  ON public.evaluation_items(group_id)
  WHERE group_id IS NOT NULL;

-- Índice parcial para levantar solo items manuales al abrir ManualScoringModal
CREATE INDEX IF NOT EXISTS idx_evaluation_items_manual
  ON public.evaluation_items(evaluation_id)
  WHERE is_manual = true;

COMMENT ON COLUMN public.evaluation_items.pedagogical_type IS
  'Tipo pedagógico del item: mc, tf, doble_proceso, ordenamiento, pareados, completacion, desarrollo, respuesta_breve';
COMMENT ON COLUMN public.evaluation_items.group_id IS
  'UUID compartido entre filas que forman un ítem pedagógico compuesto (Doble Proceso = tf+mc, Ordenamiento = N mc secuenciales).';
COMMENT ON COLUMN public.evaluation_items.is_manual IS
  'Si true, este item no se corrige por OMR (desarrollo, respuesta breve). Usa ManualScoringModal.';
COMMENT ON COLUMN public.evaluation_items.rubric IS
  'Rúbrica sugerida para items de corrección manual.';
