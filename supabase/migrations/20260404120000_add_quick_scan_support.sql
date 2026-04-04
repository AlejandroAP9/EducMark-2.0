-- PRP-001: Correccion Rapida OMR
-- Extender omr_results para soportar scans sin evaluacion interna

-- 1. Hacer evaluation_id nullable (hoy es NOT NULL)
ALTER TABLE public.omr_results ALTER COLUMN evaluation_id DROP NOT NULL;

-- 2. Tipo de scan: 'evaluation' (actual) | 'quick' (correccion rapida)
ALTER TABLE public.omr_results ADD COLUMN IF NOT EXISTS scan_type TEXT NOT NULL DEFAULT 'evaluation';

-- 3. Pauta de correccion para quick scans
ALTER TABLE public.omr_results ADD COLUMN IF NOT EXISTS answer_key JSONB;

-- 4. User ID para filtrar quick scans por usuario
ALTER TABLE public.omr_results ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- 5. Indice para queries de quick scan por usuario
CREATE INDEX IF NOT EXISTS idx_omr_results_user_scan_type ON public.omr_results(user_id, scan_type);

-- 6. Backfill: marcar resultados existentes como tipo 'evaluation'
UPDATE public.omr_results SET scan_type = 'evaluation' WHERE scan_type IS NULL;

-- 7. RLS: permitir que usuarios vean sus propios quick scans
CREATE POLICY "Users can view own quick scans"
    ON public.omr_results FOR SELECT
    USING (user_id = auth.uid() AND scan_type = 'quick');

CREATE POLICY "Users can insert own quick scans"
    ON public.omr_results FOR INSERT
    WITH CHECK (user_id = auth.uid() AND scan_type = 'quick');
