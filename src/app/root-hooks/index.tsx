import React, { memo, useEffect } from 'react';

import { useAdvertisingLoading } from 'app/hooks/use-advertising.hook';
import { useAssetsMigrations } from 'app/hooks/use-assets-migrations';
import { useCollectiblesDetailsLoading } from 'app/hooks/use-collectibles-details-loading';
import { useTokensApyLoading } from 'app/hooks/use-load-tokens-apy.hook';
import { useLongRefreshLoading } from 'app/hooks/use-long-refresh-loading.hook';
import { useMetadataRefresh } from 'app/hooks/use-metadata-refresh';
import { useStorageAnalytics } from 'app/hooks/use-storage-analytics';
import { useUserIdAccountPkhSync } from 'app/hooks/use-user-id-account-pkh-sync';
import { dispatch } from 'app/store';
import { loadSwapDexesAction, loadSwapTokensAction } from 'app/store/swap/actions';
import { loadTokensWhitelistActions, loadTokensScamlistActions } from 'app/store/tezos/assets/actions';
import { useTempleClient } from 'lib/temple/front';
import { useDidMount } from 'lib/ui/hooks';
import { useAccountAddressForEvm, useAccountAddressForTezos } from 'temple/front';

import { AppTezosAssetsLoading } from './assets-loading';
import { AppTezosBalancesLoading } from './balances-loading';
import { AppEvmBalancesLoading } from './evm/balances-loading';
import { AppEvmCollectiblesMetadataLoading } from './evm/collectibles-metadata-loading';
import { AppEvmTokensExchangeRatesLoading } from './evm/tokens-exchange-rates-loading';
import { AppEvmTokensMetadataLoading } from './evm/tokens-metadata-loading';
import { AppTezosTokensMetadataLoading } from './metadata-loading';
import { useChainIDsCheck } from './use-chain-ids-check';

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

  useChainIDsCheck();
  useUserIdAccountPkhSync();

  const tezosAddress = useAccountAddressForTezos();
  const evmAddress = useAccountAddressForEvm();

  return (
    <>
      {tezosAddress && <TezosAccountHooks publicKeyHash={tezosAddress} />}
      {evmAddress && <EvmAccountHooks publicKeyHash={evmAddress} />}
    </>
  );
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

const EvmAccountHooks = memo<{ publicKeyHash: HexString }>(({ publicKeyHash }) => (
  <>
    <AppEvmTokensExchangeRatesLoading publicKeyHash={publicKeyHash} />
    <AppEvmTokensMetadataLoading publicKeyHash={publicKeyHash} />
    <AppEvmCollectiblesMetadataLoading publicKeyHash={publicKeyHash} />
    <AppEvmBalancesLoading publicKeyHash={publicKeyHash} />
  </>
));