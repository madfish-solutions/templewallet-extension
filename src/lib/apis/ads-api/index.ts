export const importAdsApiModule = () => {
  // An error appears below if and only the imported file is removed
  // oxlint-disable-next-line @typescript-eslint/prefer-ts-expect-error
  // @ts-ignore
  // oxlint-disable-next-line import/no-unresolved
  return import('lib/apis/ads-api/ads-api');
};

export * from './types';
