const cache = new Map<string, HTMLImageElement>();
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) {
    listener();
  }
}

export function onImageCacheUpdate(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getCachedImage(src: string): HTMLImageElement | null {
  const existing = cache.get(src);
  if (existing) return existing.complete && existing.naturalWidth > 0 ? existing : existing;
  return null;
}

export function preloadImage(src: string): HTMLImageElement {
  const existing = cache.get(src);
  if (existing) return existing;

  const img = new Image();
  cache.set(src, img);
  img.onload = () => notify();
  img.onerror = () => notify();
  img.src = src;
  return img;
}

export function invalidateImageCache() {
  cache.clear();
}
