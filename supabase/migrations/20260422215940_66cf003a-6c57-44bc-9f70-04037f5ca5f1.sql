-- 1a. Add role column to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user';

-- 1b. get_user_role RPC
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE user_id = auth.uid();
$$;

-- 1c. investor_notes table
CREATE TABLE IF NOT EXISTS public.investor_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name text,
  content text NOT NULL,
  parent_id uuid REFERENCES public.investor_notes(id) ON DELETE CASCADE,
  is_pinned boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.investor_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY investor_notes_select ON public.investor_notes
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin', 'investor'))
  );

CREATE POLICY investor_notes_insert ON public.investor_notes
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = author_id AND
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin', 'investor'))
  );

CREATE POLICY investor_notes_update_own ON public.investor_notes
  FOR UPDATE TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY investor_notes_delete_own ON public.investor_notes
  FOR DELETE TO authenticated
  USING (auth.uid() = author_id);

CREATE TRIGGER update_investor_notes_updated_at
BEFORE UPDATE ON public.investor_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_investor_notes_parent ON public.investor_notes(parent_id);
CREATE INDEX IF NOT EXISTS idx_investor_notes_created ON public.investor_notes(created_at DESC);