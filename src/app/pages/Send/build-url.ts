export const buildSendPagePath = (
  chainKind?: string | nullish,
  chainId?: string | nullish,
  assetSlug?: string | nullish
) => {
  let url = '/send';

  if (chainKind) {
    url += `/${chainKind}`;

    if (chainId) {
      url += `/${chainId}`;

      if (assetSlug) {
        url += `/${assetSlug}`;
      }
    }
  }

  return url;
};
