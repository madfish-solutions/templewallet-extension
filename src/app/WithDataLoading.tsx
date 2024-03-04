import React, { FC, useEffect } from 'react';

import { dispatch } from 'app/store';
import { loadTokensScamlistActions } from 'app/store/assets/actions';
import { loadSwapDexesAction, loadSwapTokensAction } from 'app/store/swap/actions';

import { useAdvertisingLoading } from './hooks/use-advertising.hook';
import { useAssetsLoading } from './hooks/use-assets-loading';
import { useAssetsMigrations } from './hooks/use-assets-migrations';
import { useBalancesLoading } from './hooks/use-balances-loading';
import { useCollectiblesDetailsLoading } from './hooks/use-collectibles-details-loading';
import { useTokensApyLoading } from './hooks/use-load-tokens-apy.hook';
import { useLongRefreshLoading } from './hooks/use-long-refresh-loading.hook';
import { useMetadataLoading } from './hooks/use-metadata-loading';
import { useMetadataRefresh } from './hooks/use-metadata-refresh';
import { useStorageAnalytics } from './hooks/use-storage-analytics';
import { useUserIdSync } from './hooks/use-user-id-sync';

export const WithDataLoading: FC<PropsWithChildren> = ({ children }) => {
  useAssetsMigrations();

  useEffect(() => void dispatch(loadTokensScamlistActions.submit()), []);

  useAssetsLoading();
  useMetadataLoading();
  useMetadataRefresh();
  useBalancesLoading();
  useCollectiblesDetailsLoading();

  useLongRefreshLoading();
  useAdvertisingLoading();
  useTokensApyLoading();

  useEffect(() => {
    dispatch(loadSwapDexesAction.submit());
    dispatch(loadSwapTokensAction.submit());
  }, []);

  useStorageAnalytics();
  useUserIdSync();

  return <>{children}</>;
};
