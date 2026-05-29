export const parseObjktUrl = (url: string): { fa: string; tokenId: string } | null => {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
  if (host !== 'objkt.com') return null;

  const segments = parsed.pathname.split('/').filter(Boolean);
  if (segments.length < 3) return null;

  const [kind, fa, tokenId] = segments;
  if (kind !== 'tokens' && kind !== 'asset') return null;

  const isContract = /^KT1[1-9A-HJ-NP-Za-km-z]{33}$/.test(fa);
  const isAlias = /^[a-z0-9_-]+$/i.test(fa);
  if (!isContract && !isAlias) return null;
  if (!/^\d+$/.test(tokenId)) return null;

  return { fa, tokenId };
};
