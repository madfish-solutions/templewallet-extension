import React, { memo, useEffect } from 'react';

import { useAccountsInitializedSync } from 'app/hooks/use-accounts-initialized-sync';
import { useAdsImpressionsLinking } from 'app/hooks/use-ads-impressions-linking';
import { useAssetsMigrations } from 'app/hooks/use-assets-migrations';
import { useCollectiblesDetailsLoading } from 'app/hooks/use-collectibles-details-loading';
import { useConversionTracking } from 'app/hooks/use-conversion-tracking';
import { useTokensApyLoading } from 'app/hooks/use-load-tokens-apy.hook';
import { useLongRefreshLoading } from 'app/hooks/use-long-refresh-loading.hook';
import { useMetadataRefresh } from 'app/hooks/use-metadata-refresh';
import { useNoCategoryEvmAssetsLoading } from 'app/hooks/use-no-category-evm-assets-loading';
import { useNoCategoryTezosAssetsLoading } from 'app/hooks/use-no-category-tezos-assets-loading';
import { useStorageAnalytics } from 'app/hooks/use-storage-analytics';
import { useUserAnalyticsAndAdsSettings } from 'app/hooks/use-user-analytics-and-ads-settings.hook';
import { useUserIdAccountPkhSync } from 'app/hooks/use-user-id-account-pkh-sync';
import { useFetchLifiEvmTokensSlugs } from 'app/pages/Swap/form/hooks';
import { dispatch } from 'app/store';
import { useTestnetModeEnabledSelector } from 'app/store/settings/selectors';
import { loadSwapDexesAction, loadSwapTokensAction } from 'app/store/swap/actions';
import { loadTokensWhitelistActions, loadTokensScamlistActions } from 'app/store/tezos/assets/actions';
import { useTempleClient } from 'lib/temple/front';
import { useDidMount } from 'lib/ui/hooks';
import { useAccountAddressForEvm, useAccountAddressForTezos } from 'temple/front';

import { AppTezosAssetsLoading } from './assets-loading';
import { AppTezosBalancesLoading } from './balances-loading';
import { AppEvmBalancesLoading } from './evm/balances-loading';
import { AppEtherlinkDataLoading } from './evm/etherlink-data-loading';
import { AppEvmTokensExchangeRatesLoading } from './evm/tokens-exchange-rates-loading';
import { AppEvmTokensMetadataLoading } from './evm/tokens-metadata-loading';
import { AppTezosTokensMetadataLoading } from './metadata-loading';
import { useChainIDsCheck } from './use-chain-ids-check';
import { useDisableInactiveNetworks } from './use-disable-inactive-networks';

export const AppRootHooks = memo(() => {
  const { ready } = useTempleClient();

  return ready ? <AppReadyRootHooks /> : null;
});

export const ConfirmWindowRootHooks = memo(() => {
  const { ready } = useTempleClient();

  return ready ? <ConfirmWindowReadyRootHooks /> : null;
});

const AppReadyRootHooks = memo(() => {
  useAssetsMigrations();

  useDidMount(() => void dispatch(loadTokensWhitelistActions.submit()));
  useDidMount(() => void dispatch(loadTokensScamlistActions.submit()));

  useMetadataRefresh();

  useLongRefreshLoading();
  useTokensApyLoading();

  useEffect(() => {
    dispatch(loadSwapDexesAction.submit());
    dispatch(loadSwapTokensAction.submit());
  }, []);

  useUserAnalyticsAndAdsSettings();
  useStorageAnalytics();
  useConversionTracking();
  useAdsImpressionsLinking();

  useChainIDsCheck();
  useUserIdAccountPkhSync();
  useAccountsInitializedSync();
  useDisableInactiveNetworks();

  const tezosAddress = useAccountAddressForTezos();
  const evmAddress = useAccountAddressForEvm();

  return (
    <>
      {tezosAddress && <TezosAccountHooks publicKeyHash={tezosAddress} />}
      {evmAddress && <EvmAccountHooks publicKeyHash={evmAddress} />}
    </>
  );
});

const ConfirmWindowReadyRootHooks = memo(() => {
  useAssetsMigrations();

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
  useNoCategoryTezosAssetsLoading(publicKeyHash);

  return (
    <>
      <AppTezosAssetsLoading publicKeyHash={publicKeyHash} />
      <AppTezosBalancesLoading publicKeyHash={publicKeyHash} />
      <AppTezosTokensMetadataLoading publicKeyHash={publicKeyHash} />
    </>
  );
});

const EvmAccountHooks = memo<{ publicKeyHash: HexString }>(({ publicKeyHash }) => {
  useNoCategoryEvmAssetsLoading(publicKeyHash);
  useFetchLifiEvmTokensSlugs(publicKeyHash);
  const testnetModeEnabled = useTestnetModeEnabledSelector();

  return (
    <>
      {!testnetModeEnabled && <AppEvmTokensExchangeRatesLoading publicKeyHash={publicKeyHash} />}
      <AppEvmTokensMetadataLoading publicKeyHash={publicKeyHash} />
      <AppEvmBalancesLoading publicKeyHash={publicKeyHash} />
      <AppEtherlinkDataLoading publicKeyHash={publicKeyHash} />
    </>
  );
});
