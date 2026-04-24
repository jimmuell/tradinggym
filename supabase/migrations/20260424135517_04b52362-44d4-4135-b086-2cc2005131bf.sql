UPDATE public.strategies
SET source = 'ai_extracted'
WHERE is_system = false
  AND user_id = 'd6413bc7-1a9e-4f42-90ae-8452ce44cf07'
  AND name = 'Opening Range Breakout'
  AND source = 'manual';