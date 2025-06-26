const EXTERNAL_AD_QUERY = 'fromExternalAd';

type chainSlug = {
  chainKind?: string | nullish;
  chainId?: string | nullish;
  assetSlug?: string | nullish;
};

export const buildSwapPagePath = (from?: chainSlug, to?: chainSlug, fromAd?: boolean): string => {
  const url = '/swap';
  const params = new URLSearchParams();

  const buildPathSegment = (slug?: chainSlug): string => {
    if (!slug?.chainKind || !slug?.chainId || !slug?.assetSlug) return '';
    return `${slug.chainKind}/${slug.chainId}/${slug.assetSlug}`;
  };

  const fromSegment = buildPathSegment(from);
  const toSegment = buildPathSegment(to);

  if (fromSegment) params.set('from', fromSegment);
  if (toSegment) params.set('to', toSegment);
  if (fromAd) params.set(EXTERNAL_AD_QUERY, 'true');

  const queryString = params.toString();
  return queryString ? `${url}?${queryString}` : url;
};
