
-- Create strategies table
CREATE TABLE public.strategies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  instrument text,
  timeframe text,
  direction_bias text CHECK (direction_bias IN ('Long', 'Short', 'Both')),
  entry_rules text,
  exit_rules text,
  notes text,
  is_system boolean DEFAULT false,
  tier_required text DEFAULT 'foundation' CHECK (tier_required IN ('foundation','tier1','tier2','tier3')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.strategies ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can read system strategies"
  ON public.strategies FOR SELECT
  USING (is_system = true);

CREATE POLICY "Users can read their own strategies"
  ON public.strategies FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own strategies"
  ON public.strategies FOR INSERT
  WITH CHECK (auth.uid() = user_id AND is_system = false);

CREATE POLICY "Users can update their own strategies"
  ON public.strategies FOR UPDATE
  USING (auth.uid() = user_id AND is_system = false);

CREATE POLICY "Users can delete their own strategies"
  ON public.strategies FOR DELETE
  USING (auth.uid() = user_id AND is_system = false);

-- Seed system strategies
INSERT INTO public.strategies
  (user_id, name, description, instrument, timeframe, direction_bias,
   entry_rules, exit_rules, notes, is_system, tier_required)
VALUES
  (null,
   'ORB — Pure Price Action',
   'Opening Range Breakout with no indicators. Trade the break of the first 5-minute candle.',
   'MES', '5m', 'Both',
   E'1. Mark the high and low of the 9:30–9:35 candle (opening range).\n2. Wait for price to close above the high (long) or below the low (short).\n3. Enter on the retest of the breakout level.\n4. Confirm with price action — no wick rejection back inside the range.',
   E'1. Target 2R minimum.\n2. Exit if price re-enters the opening range.\n3. Trail stop to breakeven once +1R is reached.',
   'Core strategy. Works best on high-volatility days. Avoid on choppy, low-range opens.',
   true, 'foundation'),
  (null,
   'ORB + VWAP Confirmation',
   'ORB with VWAP as a directional filter. Only take trades in the direction of VWAP.',
   'MES', '5m', 'Both',
   E'1. Mark the opening range (9:30–9:35).\n2. Check VWAP direction — only trade longs above VWAP, shorts below.\n3. Wait for breakout close beyond the opening range.\n4. Enter on the retest of the breakout level with price on the correct side of VWAP.',
   E'1. Target 2R minimum.\n2. Exit if price crosses VWAP against your position.\n3. Trail stop to breakeven once +1R is reached.',
   'Adds VWAP as a confluence filter. Reduces trade frequency but improves quality.',
   true, 'tier1'),
  (null,
   'AMD + IFVG',
   'Accumulation–Manipulation–Distribution model with Inverse Fair Value Gap entries. ICT/Smart Money Concepts.',
   'MES', '5m', 'Both',
   E'1. Identify the daily AMD structure — accumulation zone, manipulation sweep, and distribution direction.\n2. Mark any open IFVGs on the 5m chart in the direction of distribution.\n3. Wait for price to return to the IFVG after manipulation.\n4. Enter when price enters the IFVG with a displacement candle confirming direction.\n5. Confirm with session time — prefer entries in London or New York open.',
   E'1. Target the opposing daily liquidity pool.\n2. Exit if price closes back through the IFVG.\n3. Move stop to breakeven once +1.5R is reached.',
   'Advanced ICT framework. Requires strong understanding of market structure, liquidity, and session timing.',
   true, 'tier2');
