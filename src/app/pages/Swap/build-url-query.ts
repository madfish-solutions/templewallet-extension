const EXTERNAL_AD_QUERY = 'fromExternalAd';

type Param = string | nullish;

export const buildSwapPageUrlQuery = (fromSlug?: Param, toSlug?: Param, fromAd?: boolean) => {
  const usp = new URLSearchParams();
  if (fromSlug) usp.set('from', fromSlug);
  if (toSlug) usp.set('to', toSlug);
  if (fromAd) usp.set(EXTERNAL_AD_QUERY, String(fromAd));

  return usp.toString();
};
