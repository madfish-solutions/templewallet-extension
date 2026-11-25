import { use } from 'react';

const importPromoSurfaceInfoModule = async () => {
  try {
    return await import(
      // An error appears below if and only the imported file is removed
      // oxlint-disable-next-line @typescript-eslint/prefer-ts-expect-error
      // @ts-ignore
      // oxlint-disable-next-line import/no-unresolved
      'app/templates/promo-surface-info/surface-info-modal'
    );
  } catch {
    return null;
  }
};

const importPromise = importPromoSurfaceInfoModule();

export const usePromoSurfaceInfoModule = () => use(importPromise);
