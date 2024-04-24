export const buildSendPagePath = (tezosChainId?: string | nullish, assetSlug?: string | nullish) => {
  let url = '/send';

  if (tezosChainId) {
    url += `/${tezosChainId}`;

    if (assetSlug) {
      url += `/${assetSlug}`;
    }
  }

  return url;
};
