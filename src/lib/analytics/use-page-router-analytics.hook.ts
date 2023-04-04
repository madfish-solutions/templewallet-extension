import { useEffect } from 'react';

import { useUserTestingGroupNameSelector } from '../../app/store/ab-testing/selectors';
import { useAnalytics } from './use-analytics.hook';

const pageRoutesWithToken = ['/explore', '/send', '/collectible'];
const pageRoutesWithQueryParams = ['/swap'];

export const usePageRouterAnalytics = (pathname: string, search: string, isContextReady: boolean) => {
  const { pageEvent } = useAnalytics();
  const testGroupName = useUserTestingGroupNameSelector();

  useEffect(() => {
    if (pathname === '/' && !isContextReady) {
      return void pageEvent('/welcome', search);
    }

    if (pageRoutesWithToken.some(route => pathname.startsWith(route))) {
      const [, route = '', tokenSlug = 'tez'] = pathname.split('/');
      const [tokenAddress, tokenId = '0'] = tokenSlug.split('_');

      return void pageEvent(`/${route}`, search, {
        tokenAddress,
        tokenId,
        ...(tokenAddress === 'tez' && { apTestingCategory: testGroupName })
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
