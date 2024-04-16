import React, { memo, useEffect } from 'react';

import { useAdvertisingLoading } from 'app/hooks/use-advertising.hook';
import { useAssetsMigrations } from 'app/hooks/use-assets-migrations';
import { useCollectiblesDetailsLoading } from 'app/hooks/use-collectibles-details-loading';
import { useTokensApyLoading } from 'app/hooks/use-load-tokens-apy.hook';
import { useLongRefreshLoading } from 'app/hooks/use-long-refresh-loading.hook';
import { useMetadataRefresh } from 'app/hooks/use-metadata-refresh';
import { useStorageAnalytics } from 'app/hooks/use-storage-analytics';
import { useUserIdSync } from 'app/hooks/use-user-id-sync';
import { dispatch } from 'app/store';
import { loadTokensScamlistActions } from 'app/store/assets/actions';
import { loadSwapDexesAction, loadSwapTokensAction } from 'app/store/swap/actions';
import { useTempleClient } from 'lib/temple/front';
import { useAccountAddressForTezos } from 'temple/front';

import { AppBalancesLoading } from './balances-loading';
import { useAssetsLoading } from './use-assets-loading';
import { useChainIDsCheck } from './use-chain-ids-check';
import { useMetadataLoading } from './use-metadata-loading';

export const AppRootHooks = memo(() => {
  const { ready } = useTempleClient();

  return ready ? <AppReadyRootHooks /> : null;
});

const AppReadyRootHooks = memo(() => {
  useAssetsMigrations();

  useEffect(() => void dispatch(loadTokensScamlistActions.submit()), []);

  useMetadataRefresh();

  useLongRefreshLoading();
  useAdvertisingLoading();
  useTokensApyLoading();

  useEffect(() => {
    dispatch(loadSwapDexesAction.submit());
    dispatch(loadSwapTokensAction.submit());
  }, []);

  useStorageAnalytics();
  useUserIdSync();

  useChainIDsCheck();

  const tezosAddress = useAccountAddressForTezos();

  return tezosAddress ? <WithTezosDataLoading publicKeyHash={tezosAddress} /> : null;
});

const WithTezosDataLoading = memo<{ publicKeyHash: string }>(({ publicKeyHash }) => {
  useAssetsLoading(publicKeyHash);
  useMetadataLoading(publicKeyHash);
  useCollectiblesDetailsLoading(publicKeyHash);

  return (
    <>
      <AppBalancesLoading publicKeyHash={publicKeyHash} />
    </>
  );
});
