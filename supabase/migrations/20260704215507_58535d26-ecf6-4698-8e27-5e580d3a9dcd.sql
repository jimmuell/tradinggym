DROP POLICY IF EXISTS "app_config_public_dev_signin_select" ON public.app_config;

CREATE POLICY "app_config_public_dev_signin_select"
ON public.app_config
FOR SELECT
TO anon, authenticated
USING (key = 'DEV_SIGNIN_ENABLED');