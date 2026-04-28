import { use } from 'react';

const importAdsConstants = async () => {
  try {
    // An error appears below if and only the imported file is removed
    // oxlint-disable-next-line @typescript-eslint/prefer-ts-expect-error
    // @ts-ignore
    // oxlint-disable-next-line import/no-unresolved
    return await import('lib/ads-constants/ads-constants');
  } catch {
    return null;
  }
};

const importPromise = importAdsConstants();

export const useAdsConstantsModule = () => use(importPromise);
