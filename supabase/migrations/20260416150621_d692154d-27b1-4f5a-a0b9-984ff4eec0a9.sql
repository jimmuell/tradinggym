
DROP POLICY IF EXISTS "Users can read system strategies by tier" ON public.strategies;

CREATE POLICY "Users can read system strategies by tier"
  ON public.strategies FOR SELECT
  USING (
    is_system = true
    AND (
      tier_required = 'foundation'
      OR (tier_required = 'tier1' AND EXISTS (
        SELECT 1 FROM profiles
        WHERE user_id = auth.uid()
        AND tier_state IN ('tier1','tier2','tier3','coach')
      ))
      OR (tier_required = 'tier2' AND EXISTS (
        SELECT 1 FROM profiles
        WHERE user_id = auth.uid()
        AND tier_state IN ('tier2','tier3','coach')
      ))
      OR (tier_required = 'tier3' AND EXISTS (
        SELECT 1 FROM profiles
        WHERE user_id = auth.uid()
        AND tier_state IN ('tier3','coach')
      ))
    )
  );
