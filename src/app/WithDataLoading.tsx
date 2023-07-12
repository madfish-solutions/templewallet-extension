import React, { FC, useEffect } from 'react';

import { useDispatch } from 'react-redux';

import { useAdvertisingLoading } from 'app/hooks/use-advertising.hook';
import { useCollectiblesDetailsLoading } from 'app/hooks/use-collectibles-details-loading';
import { useLongRefreshLoading } from 'app/hooks/use-long-refresh-loading.hook';
import { useMetadataLoading } from 'app/hooks/use-metadata-loading';
import { useTokensLoading } from 'app/hooks/use-tokens-loading';
import { loadSwapDexesAction, loadSwapTokensAction } from 'app/store/swap/actions';
import { useBalancesLoading } from 'lib/temple/front/load-balances';

import { useTokensApyLoading } from './hooks/use-load-tokens-apy.hook';

export const WithDataLoading: FC<PropsWithChildren> = ({ children }) => {
  useMetadataLoading();
  useTokensLoading();
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

  return <>{children}</>;
};
