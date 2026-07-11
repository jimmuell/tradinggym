ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS payment_past_due boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS past_due_since timestamptz NULL;