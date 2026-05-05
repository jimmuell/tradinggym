CREATE POLICY "Users can delete own backtest runs"
ON public.backtest_runs
FOR DELETE
TO public
USING (auth.uid() = user_id);