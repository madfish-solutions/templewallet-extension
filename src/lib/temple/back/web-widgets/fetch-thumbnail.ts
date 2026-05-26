import memoizee from 'memoizee';

const TTL_MS = 10 * 60 * 1000;

/**
 * x.com's `img-src` CSP blocks remote objkt-media gateway URLs, so the pill
 * cannot render `<img src={gatewayHttpsUrl}>` directly. Inlining the bytes
 * as a `data:` URL, so the background fetches them here and hands the
 * content script a self-contained URL.
 */
export const fetchThumbnailBlob = memoizee(
  async (url: string): Promise<string | null> => {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;

      const buf = await res.arrayBuffer();
      const contentType = res.headers.get('content-type') ?? 'image/png';

      return `data:${contentType};base64,${Buffer.from(buf).toString('base64')}`;
    } catch {
      return null;
    }
  },
  { promise: true, maxAge: TTL_MS }
);
