type LessonContent = {
  blocks: unknown;
  settings: unknown;
  unlock_rule: unknown;
};

const RAW_API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL ?? '';
const API_BASE_URL = (import.meta as any).env?.DEV ? '' : RAW_API_BASE_URL;

const contentCache = new Map<string, { etag: string | null; data: LessonContent }>();
const inFlight = new Map<string, Promise<LessonContent>>();

async function readJsonSafe(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) return null;
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export function getCachedLessonContent(lessonId: string): LessonContent | null {
  const id = String(lessonId || '').trim();
  if (!id) return null;
  return contentCache.get(id)?.data ?? null;
}

const inFlightFresh = new Map<string, Promise<LessonContent>>();

export async function fetchLessonContent(
  lessonId: string,
  opts?: { bypassCache?: boolean },
): Promise<LessonContent> {
  const id = String(lessonId || '').trim();
  if (!id) return { blocks: null, settings: null, unlock_rule: null };

  const bypassCache = opts?.bypassCache === true;
  const cached = contentCache.get(id);

  if (bypassCache) {
    const existingFresh = inFlightFresh.get(id);
    if (existingFresh) return existingFresh;

    const promise = (async () => {
      try {
        const bust = Date.now();
        const url = `${API_BASE_URL}/api/lessons/${encodeURIComponent(id)}/content?bust=${bust}`;
        const response = await fetch(url, {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        });

        if (!response.ok) {
          const body = await readJsonSafe(response);
          const message =
            (body as any)?.message ||
            (body as any)?.error ||
            `Request failed: ${response.status} ${response.statusText}`;
          throw new Error(String(message));
        }

        const payload = (await readJsonSafe(response)) as any;
        const data: LessonContent = {
          blocks: payload?.blocks ?? null,
          settings: payload?.settings ?? null,
          unlock_rule: payload?.unlock_rule ?? null,
        };
        const etag = response.headers.get('etag');
        contentCache.set(id, { etag, data });
        return data;
      } finally {
        inFlightFresh.delete(id);
      }
    })();

    inFlightFresh.set(id, promise);
    return promise;
  }

  const inflight = inFlight.get(id);
  if (inflight) return inflight;

  const promise = (async () => {
    try {
      const url = `${API_BASE_URL}/api/lessons/${encodeURIComponent(id)}/content`;
      const headers = new Headers();
      if (cached?.etag) headers.set('if-none-match', cached.etag);

      const response = await fetch(url, {
        method: 'GET',
        headers,
        credentials: 'include',
      });

      if (response.status === 304) {
        const etag = response.headers.get('etag');
        if (cached) {
          contentCache.set(id, { etag: etag ?? cached.etag, data: cached.data });
          return cached.data;
        }
      }

      if (!response.ok) {
        const body = await readJsonSafe(response);
        const message =
          (body as any)?.message ||
          (body as any)?.error ||
          `Request failed: ${response.status} ${response.statusText}`;
        throw new Error(String(message));
      }

      const payload = (await readJsonSafe(response)) as any;
      const data: LessonContent = {
        blocks: payload?.blocks ?? null,
        settings: payload?.settings ?? null,
        unlock_rule: payload?.unlock_rule ?? null,
      };
      const etag = response.headers.get('etag');
      contentCache.set(id, { etag, data });
      return data;
    } finally {
      inFlight.delete(id);
    }
  })();

  inFlight.set(id, promise);
  return promise;
}
