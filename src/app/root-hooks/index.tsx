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
import { loadTokensWhitelistActions, loadTokensScamlistActions } from 'app/store/assets/actions';
import { loadSwapDexesAction, loadSwapTokensAction } from 'app/store/swap/actions';
import { useTempleClient } from 'lib/temple/front';
import { useDidMount } from 'lib/ui/hooks';
import { useAccountAddressForTezos } from 'temple/front';

import { AppTezosAssetsLoading } from './assets-loading';
import { AppTezosBalancesLoading } from './balances-loading';
import { AppTezosTokensMetadataLoading } from './metadata-loading';
import { useChainIDsCheck } from './use-chain-ids-check';
import { useUserIdAccountPkhSync } from "app/hooks/use-user-id-account-pkh-sync";

export const AppRootHooks = memo(() => {
  const { ready } = useTempleClient();

  return ready ? <AppReadyRootHooks /> : null;
});

const AppReadyRootHooks = memo(() => {
  useAssetsMigrations();

  useDidMount(() => void dispatch(loadTokensWhitelistActions.submit()));
  useDidMount(() => void dispatch(loadTokensScamlistActions.submit()));

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
  useUserIdAccountPkhSync();

  const tezosAddress = useAccountAddressForTezos();

  return tezosAddress ? <TezosAccountHooks publicKeyHash={tezosAddress} /> : null;
});

const TezosAccountHooks = memo<{ publicKeyHash: string }>(({ publicKeyHash }) => {
  useCollectiblesDetailsLoading(publicKeyHash);

  return (
    <>
      <AppTezosAssetsLoading publicKeyHash={publicKeyHash} />
      <AppTezosBalancesLoading publicKeyHash={publicKeyHash} />
      <AppTezosTokensMetadataLoading publicKeyHash={publicKeyHash} />
    </>
  );
});
