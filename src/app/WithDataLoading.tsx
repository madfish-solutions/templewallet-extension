import React, { FC, useEffect } from 'react';

import { dispatch } from 'app/store';
import { loadTokensScamlistActions } from 'app/store/assets/actions';
import { loadSwapDexesAction, loadSwapTokensAction } from 'app/store/swap/actions';

import { useAdsImpressionsLinking } from './hooks/use-ads-impressions-linking';
import { useAdvertisingLoading } from './hooks/use-advertising.hook';
import { useAssetsLoading } from './hooks/use-assets-loading';
import { useAssetsMigrations } from './hooks/use-assets-migrations';
import { useBalancesLoading } from './hooks/use-balances-loading';
import { useCollectiblesDetailsLoading } from './hooks/use-collectibles-details-loading';
import { useConversionTracking } from './hooks/use-conversion-tracking';
import { useTokensApyLoading } from './hooks/use-load-tokens-apy.hook';
import { useLongRefreshLoading } from './hooks/use-long-refresh-loading.hook';
import { useMetadataLoading } from './hooks/use-metadata-loading';
import { useMetadataRefresh } from './hooks/use-metadata-refresh';
import { useShowAgreementsSync } from './hooks/use-show-agreements-sync';
import { useStorageAnalytics } from './hooks/use-storage-analytics';
import { useUserAnalyticsAndAdsSettings } from './hooks/use-user-analytics-and-ads-settings.hook';
import { useUserIdAccountPkhSync } from './hooks/use-user-id-account-pkh-sync';

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

  useUserAnalyticsAndAdsSettings();
  useStorageAnalytics();
  useConversionTracking();
  useUserIdAccountPkhSync();
  useAdsImpressionsLinking();
  useShowAgreementsSync();

  return <>{children}</>;
};
