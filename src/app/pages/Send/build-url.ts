export const buildSendPagePath = (
  chainKind?: string | nullish,
  chainId?: string | nullish,
  assetSlug?: string | nullish
) => {
  const pathElements = [chainKind, chainId, assetSlug];
  let url = '/send';

  for (const pathEl of pathElements) {
    if (pathEl) url += `/${pathEl}`;
    else break;
  }

  return url;
};
