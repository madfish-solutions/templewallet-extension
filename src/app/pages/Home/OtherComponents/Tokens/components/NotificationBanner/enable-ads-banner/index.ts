import { use } from 'react';

const importEnableAdsBannerModule = async () => {
  try {
    // An error appears below if and only the imported file is removed
    // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error
    // @ts-ignore
    // eslint-disable-next-line import/no-unresolved
    return await import(
      'app/pages/Home/OtherComponents/Tokens/components/NotificationBanner/enable-ads-banner/component'
    );
  } catch {
    return null;
  }
};

const importPromise = importEnableAdsBannerModule();

export const useEnableAdsBannerModule = () => use(importPromise);
