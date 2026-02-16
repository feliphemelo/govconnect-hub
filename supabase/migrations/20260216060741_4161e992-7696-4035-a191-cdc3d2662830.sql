
-- Fix overly permissive INSERT on access_logs - restrict to authenticated users inserting their own logs
DROP POLICY "System can insert access logs" ON public.access_logs;
CREATE POLICY "Authenticated users can insert own access logs" ON public.access_logs
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
