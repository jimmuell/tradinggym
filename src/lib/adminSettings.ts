// Admin-controlled runtime settings, stored in localStorage.
//
// NOTE: These are temporary/pre-launch controls. They will be removed prior to
// public launch. Because they live in localStorage they only affect the
// current browser — good enough for admin/dev workflow, not a security
// boundary. The dev sign-in buttons only work for seeded dev accounts anyway.

const KEY_PREVIEW = 'tg_admin_dev_signin_preview';
const KEY_PROD = 'tg_admin_dev_signin_prod';
const EVENT = 'tg-admin-settings-change';

const readBool = (key: string, defaultValue: boolean): boolean => {
  if (typeof window === 'undefined') return defaultValue;
  const v = window.localStorage.getItem(key);
  if (v === null) return defaultValue;
  return v === '1' || v === 'true';
};

const writeBool = (key: string, value: boolean) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, value ? '1' : '0');
  window.dispatchEvent(new CustomEvent(EVENT));
};

export const isDevHost = (): boolean => {
  if (typeof window === 'undefined') return false;
  const h = window.location.hostname;
  if (h === 'localhost' || h === '127.0.0.1') return true;
  if (h.endsWith('.lovableproject.com')) return true;
  // Only Lovable *preview* subdomains count as dev, not the published *.lovable.app
  if (
    h.endsWith('.lovable.app') &&
    (h.startsWith('preview--') || h.startsWith('id-preview--'))
  ) {
    return true;
  }
  return false;
};

export const getDevSignInPreview = () => readBool(KEY_PREVIEW, true);
export const getDevSignInProd = () => readBool(KEY_PROD, false);

export const setDevSignInPreview = (v: boolean) => writeBool(KEY_PREVIEW, v);
export const setDevSignInProd = (v: boolean) => writeBool(KEY_PROD, v);

/** Whether the dev auto sign-in buttons should be visible in the current env. */
export const shouldShowDevSignIn = (): boolean =>
  isDevHost() ? getDevSignInPreview() : getDevSignInProd();

export const ADMIN_SETTINGS_EVENT = EVENT;
