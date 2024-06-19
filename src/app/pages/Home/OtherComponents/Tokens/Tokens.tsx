import React, { memo, useEffect } from 'react';

import { useAssetsFilterOptionsState } from 'app/hooks/use-assets-filter-options';
import { ContentContainer } from 'app/layouts/containers';
import { dispatch } from 'app/store';
import { setAssetsFilterChain } from 'app/store/assets-filter-options/actions';
import { useAssetsFilterOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { UNDER_DEVELOPMENT_MSG } from 'temple/evm/under_dev_msg';
import { useAccountAddressForEvm, useAccountAddressForTezos } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { AllNetworksTokensTab } from './components/AllNetworksTokensTab';
import { EvmChainTokensTab } from './components/EvmChainTokensTab';
import { EvmTokensTab } from './components/EvmTokensTab';
import { Filters } from './components/Filters';
import { TezosChainTokensTab } from './components/TezosChainTokensTab';
import { TezosTokensTab } from './components/TezosTokensTab';

export const TokensTab = memo(() => {
  const { filtersOpened } = useAssetsFilterOptionsState();
  const { filterChain } = useAssetsFilterOptionsSelector();

  const accountTezAddress = useAccountAddressForTezos();
  const accountEvmAddress = useAccountAddressForEvm();

  const isTezosFilter = filterChain?.kind === TempleChainKind.Tezos;
  const isEvmFilter = filterChain?.kind === TempleChainKind.EVM;

  const isOnlyTezAccount = Boolean(accountTezAddress && !accountEvmAddress);
  const isOnlyEvmAccount = Boolean(!accountTezAddress && accountEvmAddress);

  useEffect(() => {
    if ((isTezosFilter && isOnlyEvmAccount) || (isEvmFilter && isOnlyTezAccount)) dispatch(setAssetsFilterChain(null));
  }, [filterChain, accountTezAddress, accountEvmAddress]);

  if (filtersOpened) return <Filters />;

  if (isTezosFilter && accountTezAddress)
    return <TezosChainTokensTab chainId={filterChain.chainId} publicKeyHash={accountTezAddress} />;

  if (isEvmFilter && accountEvmAddress)
    return <EvmChainTokensTab chainId={filterChain.chainId} publicKeyHash={accountEvmAddress} />;

  if (!filterChain && accountTezAddress && accountEvmAddress)
    return <AllNetworksTokensTab accountTezAddress={accountTezAddress} accountEvmAddress={accountEvmAddress} />;

  if (!filterChain && accountTezAddress) return <TezosTokensTab publicKeyHash={accountTezAddress} />;

  if (!filterChain && accountEvmAddress) return <EvmTokensTab publicKeyHash={accountEvmAddress} />;

  return <ContentContainer className="mt-3">{UNDER_DEVELOPMENT_MSG}</ContentContainer>;
});
