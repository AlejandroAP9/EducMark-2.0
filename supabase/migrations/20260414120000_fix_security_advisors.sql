-- Pre-launch security hardening (2026-04-14)
-- Addresses Supabase advisors: data leaks, SECURITY DEFINER view, mutable search_path.

-- 1. DATA LEAK: user_subscriptions readable by any authenticated user.
DROP POLICY IF EXISTS "Permitir lectura a autenticados" ON public.user_subscriptions;

CREATE POLICY "Users can view own subscription"
  ON public.user_subscriptions
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR (auth.jwt() ->> 'email') = 'aalvarezp@gmail.com'
  );

-- 2. DATA LEAK: omr_results readable by anyone (public role, USING true).
DROP POLICY IF EXISTS "Allow public read from omr_results" ON public.omr_results;
DROP POLICY IF EXISTS "Allow authenticated insert to omr_results" ON public.omr_results;

-- 3. SECURITY DEFINER VIEW: recreate user_stats without definer semantics.
DROP VIEW IF EXISTS public.user_stats;

CREATE VIEW public.user_stats
WITH (security_invoker = true)
AS
SELECT
  up.user_id,
  up.full_name,
  up.email,
  up.role,
  us.plan_type,
  us.status AS subscription_status,
  us.classes_limit,
  us.remaining_credits,
  us.total_credits,
  us.total_generations,
  COALESCE(mu.classes_generated, 0) AS classes_used_this_month,
  (SELECT count(*) FROM public.generated_classes gc WHERE gc.user_id = up.user_id) AS total_classes_generated,
  up.created_at AS user_since
FROM public.user_profiles up
LEFT JOIN public.user_subscriptions us ON up.user_id = us.user_id
LEFT JOIN public.monthly_usage mu
  ON mu.user_id = up.user_id
  AND mu.year::numeric = EXTRACT(year FROM now())
  AND mu.month::numeric = EXTRACT(month FROM now());

-- 4. MUTABLE search_path on 14 functions + 2 overloads of process_referral.
ALTER FUNCTION public.notif_new_referral()                       SET search_path = public, pg_temp;
ALTER FUNCTION public.set_updated_at_timestamp()                 SET search_path = public, pg_temp;
ALTER FUNCTION public.process_referral(uuid)                     SET search_path = public, pg_temp;
ALTER FUNCTION public.process_referral(text, uuid)               SET search_path = public, pg_temp;
ALTER FUNCTION public.notif_subscription_event()                 SET search_path = public, pg_temp;
ALTER FUNCTION public.generate_referral_code()                   SET search_path = public, pg_temp;
ALTER FUNCTION public.notif_quota_threshold()                    SET search_path = public, pg_temp;
ALTER FUNCTION public.notify_user(uuid, text, text, text, text)  SET search_path = public, pg_temp;
ALTER FUNCTION public.calculate_user_health_scores()             SET search_path = public, pg_temp;
ALTER FUNCTION public.is_admin()                                 SET search_path = public, pg_temp;
ALTER FUNCTION public.handle_new_user()                          SET search_path = public, pg_temp;
ALTER FUNCTION public.process_health_alerts()                    SET search_path = public, pg_temp;
ALTER FUNCTION public.notif_class_generated()                    SET search_path = public, pg_temp;
ALTER FUNCTION public.capture_daily_metrics(date)                SET search_path = public, pg_temp;
ALTER FUNCTION public.update_students_updated_at()               SET search_path = public, pg_temp;

-- 5. Admin read on daily_metrics (currently RLS on, zero policies).
CREATE POLICY "Admin can view daily_metrics"
  ON public.daily_metrics
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'email') = 'aalvarezp@gmail.com');
