CREATE TABLE public.app_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL DEFAULT '',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID
);

ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "app_config_admin_select" ON public.app_config FOR SELECT USING (public.is_admin());
CREATE POLICY "app_config_admin_insert" ON public.app_config FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "app_config_admin_update" ON public.app_config FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "app_config_admin_delete" ON public.app_config FOR DELETE USING (public.is_admin());

CREATE TRIGGER update_app_config_updated_at
BEFORE UPDATE ON public.app_config
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();