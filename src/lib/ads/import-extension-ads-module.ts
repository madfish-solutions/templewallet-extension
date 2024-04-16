export const importExtensionAdsModule = () => {
  // An error appears below if and only if optional dependencies are not installed
  // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error
  // @ts-ignore
  // eslint-disable-next-line import/no-unresolved
  return import('@temple-wallet/extension-ads');
};
