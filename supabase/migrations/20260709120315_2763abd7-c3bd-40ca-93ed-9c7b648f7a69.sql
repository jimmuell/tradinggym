
CREATE TABLE public.user_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  trade_alerts boolean NOT NULL DEFAULT false,
  session_reminders boolean NOT NULL DEFAULT false,
  performance_reports boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.user_settings TO authenticated;
GRANT ALL ON public.user_settings TO service_role;

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users select own settings" ON public.user_settings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own settings" ON public.user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own settings" ON public.user_settings
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
