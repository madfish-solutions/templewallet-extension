import { use } from 'react';

const importEnableAdsBannerModule = async () => {
  try {
    return await import(
      'app/pages/Home/OtherComponents/Tokens/components/NotificationBanner/enable-ads-banner/component'
    );
  } catch {
    return null;
  }
};

const importPromise = importEnableAdsBannerModule();

export const useEnableAdsBannerModule = () => use(importPromise);
