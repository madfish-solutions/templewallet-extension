import { useEffect } from 'react';

import { useAnalytics } from './use-analytics.hook';

const pageRoutesWithToken = ['/explore', '/send', '/collectible'];
const pageRoutesWithQueryParams = ['/swap'];

export const usePageRouterAnalytics = (pathname: string, search: string, isContextReady: boolean) => {
  const { pageEvent } = useAnalytics();

  useEffect(() => {
    if (pathname === '/' && !isContextReady) {
      return void pageEvent('/welcome', search);
    }

    if (pageRoutesWithToken.some(route => pathname.startsWith(route))) {
      const [, route = '', tokenSlug = 'tez'] = pathname.split('/');
      const [tokenAddress, tokenId = '0'] = tokenSlug.split('_');

      return void pageEvent(`/${route}`, search, {
        tokenAddress,
        tokenId
      });
    }

    if (pageRoutesWithQueryParams.some(route => pathname.startsWith(route))) {
      const usp = new URLSearchParams(search);

      const inputAssetSlug = usp.get('from') || 'tez';
      const outputAssetSlug = usp.get('to');

      return void pageEvent(pathname, search, { inputAssetSlug, outputAssetSlug });
    }

    return void pageEvent(pathname, search);
  }, [pathname, search, isContextReady, pageEvent]);
};
