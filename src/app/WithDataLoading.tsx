import React, { FC, useEffect } from 'react';

import { useDispatch } from 'react-redux';

import { loadSwapDexesAction, loadSwapTokensAction } from 'app/store/swap/actions';

import { useAdvertisingLoading } from './hooks/use-advertising.hook';
import { useAssetsLoading } from './hooks/use-assets-loading';
import { useBalancesLoading } from './hooks/use-balances-loading';
import { useCollectiblesDetailsLoading } from './hooks/use-collectibles-details-loading';
import { useTokensApyLoading } from './hooks/use-load-tokens-apy.hook';
import { useLongRefreshLoading } from './hooks/use-long-refresh-loading.hook';
import { useMetadataLoading } from './hooks/use-metadata-loading';
import { useMetadataRefresh } from './hooks/use-metadata-refresh';
import { useStorageAnalytics } from './hooks/use-storage-analytics';

export const WithDataLoading: FC<PropsWithChildren> = ({ children }) => {
  useAssetsLoading();
  useMetadataLoading();
  useMetadataRefresh();
  useBalancesLoading();
  useCollectiblesDetailsLoading();

  useLongRefreshLoading();
  useAdvertisingLoading();
  useTokensApyLoading();

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(loadSwapDexesAction.submit());
    dispatch(loadSwapTokensAction.submit());
  }, [dispatch]);

  useStorageAnalytics();

  return <>{children}</>;
};
