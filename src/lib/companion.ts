export const COMPANION_WINDOW_NAME = 'tradinggym-companion';

export function launchCompanionWindow() {
  const width = 360;
  const height = 800;
  const left = Math.max(0, window.screen.width - width - 20);
  const top = 60;
  window.open(
    '/companion',
    COMPANION_WINDOW_NAME,
    `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`,
  );
}
