export const buildSendPagePath = (
  chainKind?: string | nullish,
  chainId?: string | nullish,
  assetSlug?: string | nullish
) => {
  let url = '/send';

  [chainKind, chainId, assetSlug].forEach(param => {
    if (param) url += `/${param}`;
  });

  return url;
};
