import React, { FC, useEffect } from 'react';

import { useDispatch } from 'react-redux';

import { useAdvertisingLoading } from 'app/hooks/use-advertising.hook';
import { useTokensApyLoading } from 'app/hooks/use-load-tokens-apy.hook';
import { useLongRefreshLoading } from 'app/hooks/use-long-refresh-loading.hook';
import { useMetadataLoading } from 'app/hooks/use-metadata-loading';
import { useStorageAnalytics } from 'app/hooks/use-storage-analytics';
import { useTokensLoading } from 'app/hooks/use-tokens-loading';
import { loadSwapDexesAction, loadSwapTokensAction } from 'app/store/swap/actions';
import { useBalancesLoading } from 'lib/temple/front/load-balances';

export const WithDataLoading: FC<PropsWithChildren> = ({ children }) => {
  useMetadataLoading();
  useTokensLoading();
  useBalancesLoading();

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
