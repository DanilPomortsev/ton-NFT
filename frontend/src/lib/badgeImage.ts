/** Загрузка картинки бейджа для TMA: fetch + blob URL (стабильнее, чем прямой cross-origin src). */
export async function fetchBadgeImageObjectUrl(imageUrl: string): Promise<string> {
  const res = await fetch(imageUrl, { method: 'GET', mode: 'cors', cache: 'default' });
  if (!res.ok) {
    throw new Error(`badge image HTTP ${res.status}`);
  }
  const blob = await res.blob();
  if (!blob.size) {
    throw new Error('badge image empty');
  }
  return URL.createObjectURL(blob);
}

export function revokeBadgeImageObjectUrl(objectUrl: string | undefined) {
  if (objectUrl?.startsWith('blob:')) {
    URL.revokeObjectURL(objectUrl);
  }
}
