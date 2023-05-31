import { useState } from 'react';

export const useBanner = (initialState: boolean) => {
  const [isShowBanner, setIsShowBanner] = useState(initialState);

  const hideBanner = (func?: EmptyFn) => {
    setIsShowBanner(false);
    func?.();
  };

  return {
    isShowBanner,
    hideBanner
  };
};
