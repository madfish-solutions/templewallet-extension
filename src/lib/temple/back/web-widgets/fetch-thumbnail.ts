import memoizee from 'memoizee';

const TTL_MS = 10 * 60 * 1000;

/**
 * x.com's `img-src` CSP blocks remote objkt-media gateway URLs, so the pill
 * cannot render `<img src={gatewayHttpsUrl}>` directly. Inlining the bytes
 * as a `data:` URL, so the background fetches them here and hands the
 * content script a self-contained URL.
 */
const fetchThumbnailData = memoizee(
  async (url: string): Promise<string> => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Thumbnail fetch failed with status ${res.status}`);

    const buf = await res.arrayBuffer();
    const contentType = res.headers.get('content-type') ?? 'image/png';

    return `data:${contentType};base64,${Buffer.from(buf).toString('base64')}`;
  },
  { promise: true, maxAge: TTL_MS }
);

export const fetchThumbnailBlob = async (url: string): Promise<string | null> => {
  try {
    return await fetchThumbnailData(url);
  } catch {
    return null;
  }
};
