export const parseObjktUrl = (url: string): { contract: string; tokenId: string } | null => {
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

  const [kind, contract, tokenId] = segments;
  if (kind !== 'tokens' && kind !== 'asset') return null;

  if (!/^KT1[1-9A-HJ-NP-Za-km-z]{33}$/.test(contract)) return null;
  if (!/^\d+$/.test(tokenId)) return null;

  return { contract, tokenId };
};
