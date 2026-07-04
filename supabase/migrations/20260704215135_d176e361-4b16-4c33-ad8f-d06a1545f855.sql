GRANT SELECT ON public.app_config TO anon, authenticated;
GRANT ALL ON public.app_config TO service_role;

INSERT INTO public.app_config (key, value, description)
VALUES ('DEV_SIGNIN_ENABLED', 'false', 'Show dev auto sign-in buttons on /auth (pre-launch)')
ON CONFLICT (key) DO NOTHING;