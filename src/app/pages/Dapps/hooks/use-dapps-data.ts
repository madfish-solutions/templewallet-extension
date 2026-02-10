import { useMemo } from 'react';

import { DappEnum, getDAppsList } from 'lib/apis/temple/endpoints/get-dapps-list';
import { DAPPS_LIST_SYNC_INTERVAL } from 'lib/fixed-times';
import { useRetryableSWR } from 'lib/swr';

export const useDappsData = () => {
  const { data, isLoading } = useRetryableSWR('dapps-list', getDAppsList, {
    revalidateOnFocus: false,
    refreshInterval: DAPPS_LIST_SYNC_INTERVAL
  });

  return useMemo(() => {
    if (!data || isLoading) return { dApps: [], isLoading };

    const processedDApps = data.dApps.map(({ categories: rawCategories, ...restProps }) => {
      const categories: DappEnum[] = rawCategories.filter(name => name !== DappEnum.Other);
      if (categories.length !== rawCategories.length) {
        categories.push(DappEnum.Other);
      }
      return { categories, ...restProps };
    });

    return { dApps: processedDApps, isLoading };
  }, [data, isLoading]);
};
