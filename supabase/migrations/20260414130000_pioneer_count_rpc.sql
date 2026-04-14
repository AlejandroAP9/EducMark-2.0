-- Public RPC to return the count of active Pionero subscriptions.
-- Needed because user_subscriptions RLS only exposes own row + admin.
-- Returning a bare integer leaks no user data.

CREATE OR REPLACE FUNCTION public.get_pioneer_count()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COUNT(*)::integer
  FROM public.user_subscriptions
  WHERE plan_type = 'pionero'
    AND status = 'active';
$$;

GRANT EXECUTE ON FUNCTION public.get_pioneer_count() TO anon, authenticated;
