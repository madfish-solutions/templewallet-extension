import memoizee from 'memoizee';

import { browser } from 'lib/browser';

const TTL_MS = 10 * 60 * 1000;

/**
 * x.com's `img-src` CSP blocks remote objkt-media gateway URLs, so the pill
 * cannot render `<img src={gatewayHttpsUrl}>` directly. Inlining the bytes
 * as a `data:` URL, so the background fetches them here and hands the
 * content script a self-contained URL.
 */
const PAPRIKA_LOGO_HOST = 'static.coinpaprika.com';

// Cloudflare blocks this host when the request has no Referer. Fetch cannot set that header
// to another origin, so send the extension's own URL — any non-empty Referer is accepted.
const paprikaLogoInit = (url: string): RequestInit | undefined => {
  try {
    if (new URL(url).hostname !== PAPRIKA_LOGO_HOST) return undefined;
  } catch {
    return undefined;
  }

  return { referrer: browser.runtime.getURL('/'), referrerPolicy: 'unsafe-url' };
};

const fetchThumbnailData = memoizee(
  async (url: string): Promise<string> => {
    const res = await fetch(url, paprikaLogoInit(url));
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
