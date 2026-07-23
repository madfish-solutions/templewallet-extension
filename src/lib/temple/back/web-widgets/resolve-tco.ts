import memoizee from 'memoizee';

const TTL_MS = 10 * 60 * 1000;

const OBJKT_URL_RE = /https?:\/\/(?:www\.)?objkt\.com\/[^\s"'<>\\]+/i;

const hostnameOf = (url: string): string => {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return '';
  }
};

/**
 * Resolve a `https://t.co/...` short link to its objkt.com destination, in the background.
 *
 * t.co behaves in two ways for our request:
 *  - HTTP redirects, so `response.url` already is the objkt.com URL;
 *  - serves a 200 HTML, then extracts the destination objkt.com URL from the page body.
 */
export const resolveTco = memoizee(
  async (tco: string): Promise<string | null> => {
    let resolved: string | null = null;
    try {
      const response = await fetch(tco, { redirect: 'follow' });

      if (hostnameOf(response.url) === 'objkt.com') {
        resolved = response.url;
      } else {
        const body = (await response.text()).replace(/\\\//g, '/');
        const match = body.match(OBJKT_URL_RE);
        resolved = match ? match[0] : null;
      }
    } catch {
      // ignore
    }

    return resolved;
  },
  { promise: true, maxAge: TTL_MS }
);
