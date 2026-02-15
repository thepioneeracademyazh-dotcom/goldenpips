
-- 1. Helper function to check if user is blocked (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.is_user_blocked(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_blocked FROM public.profiles WHERE user_id = _user_id),
    false
  )
$$;

-- 2. Create rate_limits table for server-side rate limiting
CREATE TABLE public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index for fast lookups and cleanup
CREATE INDEX idx_rate_limits_key_created ON public.rate_limits (key, created_at);

-- Enable RLS (no policies needed - only accessed via service role from edge functions)
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Auto-cleanup old entries (older than 1 hour)
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.rate_limits WHERE created_at < now() - interval '1 hour';
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_cleanup_rate_limits
AFTER INSERT ON public.rate_limits
FOR EACH STATEMENT
EXECUTE FUNCTION public.cleanup_rate_limits();

-- 3. Update RLS policies to block blocked users

-- signals: update the authenticated users SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view signals" ON public.signals;
CREATE POLICY "Authenticated users can view signals"
ON public.signals FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR NOT is_user_blocked(auth.uid())
);

-- notifications: update users SELECT policy
DROP POLICY IF EXISTS "Users can view notifications" ON public.notifications;
CREATE POLICY "Users can view notifications"
ON public.notifications FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR NOT is_user_blocked(auth.uid())
);

-- daily_quotes: update anyone can view policy
DROP POLICY IF EXISTS "Anyone can view active quotes" ON public.daily_quotes;
CREATE POLICY "Anyone can view active quotes"
ON public.daily_quotes FOR SELECT
USING (
  expires_at > now() AND (has_role(auth.uid(), 'admin'::app_role) OR NOT is_user_blocked(auth.uid()))
);

-- payment_history: update user SELECT policy
DROP POLICY IF EXISTS "Users can view own payments" ON public.payment_history;
CREATE POLICY "Users can view own payments"
ON public.payment_history FOR SELECT
USING (auth.uid() = user_id AND NOT is_user_blocked(auth.uid()));

-- payment_history: update user INSERT policy
DROP POLICY IF EXISTS "Users can insert own payments" ON public.payment_history;
CREATE POLICY "Users can insert own payments"
ON public.payment_history FOR INSERT
WITH CHECK (auth.uid() = user_id AND NOT is_user_blocked(auth.uid()));

-- subscriptions: update user SELECT policy
DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriptions;
CREATE POLICY "Users can view own subscription"
ON public.subscriptions FOR SELECT
USING (auth.uid() = user_id AND NOT is_user_blocked(auth.uid()));

-- profiles: update user policies (allow SELECT even if blocked so BlockedScreen works, but block UPDATE)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id AND NOT is_user_blocked(auth.uid()));

-- user_roles: update user SELECT policy
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id AND NOT is_user_blocked(auth.uid()));
