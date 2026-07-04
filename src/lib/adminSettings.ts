// Admin-controlled runtime settings.
//
// A single global toggle controls whether the dev auto sign-in buttons appear
// on the /auth page. Stored in the `app_config` table so it applies across
// preview AND published URLs (localStorage is a per-origin fallback for
// instant UI while the DB value loads).
//
// NOTE: Pre-launch control — remove before public launch.

import { supabase } from '@/integrations/supabase/client';

const CONFIG_KEY = 'DEV_SIGNIN_ENABLED';
const LS_KEY = 'tg_admin_dev_signin_enabled';
export const ADMIN_SETTINGS_EVENT = 'tg-admin-settings-change';

const parseBool = (v: string | null | undefined): boolean =>
  v === '1' || v === 'true';

/** Local cached value (used for the initial synchronous render). */
export const getLocalDevSignIn = (): boolean => {
  if (typeof window === 'undefined') return false;
  return parseBool(window.localStorage.getItem(LS_KEY));
};

const writeLocal = (value: boolean) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LS_KEY, value ? '1' : '0');
  window.dispatchEvent(new CustomEvent(ADMIN_SETTINGS_EVENT));
};

/** Fetch the global toggle from the DB, falling back to localStorage. */
export const fetchDevSignInEnabled = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('app_config')
      .select('value')
      .eq('key', CONFIG_KEY)
      .maybeSingle();
    if (error) throw error;
    const v = parseBool(data?.value);
    writeLocal(v); // cache
    return v;
  } catch {
    return getLocalDevSignIn();
  }
};

/** Admin-only: update the global toggle. */
export const setDevSignInEnabled = async (value: boolean): Promise<void> => {
  const { error } = await supabase
    .from('app_config')
    .upsert(
      { key: CONFIG_KEY, value: value ? 'true' : 'false' },
      { onConflict: 'key' },
    );
  if (error) throw error;
  writeLocal(value);
};
