
-- Create a secure view that masks price data for non-premium users
CREATE OR REPLACE VIEW public.signals_secure
WITH (security_invoker = on) AS
SELECT
  id,
  signal_type,
  CASE WHEN public.is_premium(auth.uid()) OR public.has_role(auth.uid(), 'admin') THEN entry_price ELSE NULL END AS entry_price,
  CASE WHEN public.is_premium(auth.uid()) OR public.has_role(auth.uid(), 'admin') THEN stop_loss ELSE NULL END AS stop_loss,
  CASE WHEN public.is_premium(auth.uid()) OR public.has_role(auth.uid(), 'admin') THEN take_profit_1 ELSE NULL END AS take_profit_1,
  CASE WHEN public.is_premium(auth.uid()) OR public.has_role(auth.uid(), 'admin') THEN take_profit_2 ELSE NULL END AS take_profit_2,
  status,
  notes,
  created_by,
  created_at,
  updated_at
FROM public.signals;
