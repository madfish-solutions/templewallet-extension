export const importExtensionAdsModule = () => {
  // An error appears below if and only if optional dependencies are not installed
  // oxlint-disable-next-line @typescript-eslint/prefer-ts-expect-error
  // @ts-ignore
  // oxlint-disable-next-line import/no-unresolved
  return import('@temple-wallet/extension-ads');
};

export const importExtensionAdsReferralsModule = () => {
  // An error appears below if and only if optional dependencies are not installed
  // oxlint-disable-next-line @typescript-eslint/prefer-ts-expect-error
  // @ts-ignore
  // oxlint-disable-next-line import/no-unresolved
  return import('@temple-wallet/extension-ads/dist/referrals');
};
