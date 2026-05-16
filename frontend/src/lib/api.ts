/** Kotlin API на Render (fallback, если при сборке не задан VITE_API_BASE). */
const PRODUCTION_API_DEFAULT = 'https://attendance-backend-3731.onrender.com';

/** База API без завершающего `/`. */
export function getApiBase(): string {
  const fromEnv = String(import.meta.env.VITE_API_BASE || '').trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, '');
  }
  if (import.meta.env.PROD) {
    return PRODUCTION_API_DEFAULT;
  }
  return '';
}

export function chainBadgeImageUrl(badgeId: string): string {
  const path = `/api/badge/on-chain/${encodeURIComponent(badgeId)}/image`;
  const base = getApiBase();
  return base ? `${base}${path}` : path;
}
