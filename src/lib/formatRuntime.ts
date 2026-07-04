export function formatRuntime(ms: number | null | undefined): string | null {
  if (ms == null) return null;
  const totalSec = Math.round(ms / 1000);
  if (totalSec < 90) return `${totalSec}s`;
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return sec ? `${min}m ${sec}s` : `${min}m`;
}
