ALTER TABLE public.live_trades ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "live_trades anon insert" ON public.live_trades;
DROP POLICY IF EXISTS "live_trades anon update" ON public.live_trades;
DROP POLICY IF EXISTS "live_trades open insert temp" ON public.live_trades;