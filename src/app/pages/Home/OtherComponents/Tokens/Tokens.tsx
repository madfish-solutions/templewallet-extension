import React, { memo, useEffect, useState } from 'react';

import { useAssetsViewState } from 'app/hooks/use-assets-view-state';
import { dispatch } from 'app/store';
import { setAssetsFilterChain } from 'app/store/assets-filter-options/actions';
import { useAssetsFilterOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { useAccountAddressForEvm, useAccountAddressForTezos } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { EvmChainTokensTab } from './components/EvmChainTokensTab';
import { EvmTokensTab } from './components/EvmTokensTab';
import { MultiChainTokensTab } from './components/MultiChainTokensTab';
import { TezosChainTokensTab } from './components/TezosChainTokensTab';
import { TezosTokensTab } from './components/TezosTokensTab';

export const TokensTab = memo(() => {
  const { filtersOpened } = useAssetsViewState();
  const { filterChain } = useAssetsFilterOptionsSelector();

  const [localFilterChain, setLocalFilterChain] = useState(filterChain);

  const accountTezAddress = useAccountAddressForTezos();
  const accountEvmAddress = useAccountAddressForEvm();

  const isTezosFilter = localFilterChain?.kind === TempleChainKind.Tezos;
  const isEvmFilter = localFilterChain?.kind === TempleChainKind.EVM;

  const isOnlyTezAccount = Boolean(accountTezAddress && !accountEvmAddress);
  const isOnlyEvmAccount = Boolean(!accountTezAddress && accountEvmAddress);

  useEffect(() => {
    if ((isTezosFilter && isOnlyEvmAccount) || (isEvmFilter && isOnlyTezAccount)) {
      dispatch(setAssetsFilterChain(null));
      setLocalFilterChain(null);
    }
  }, [filterChain, accountTezAddress, accountEvmAddress]);

  useEffect(() => {
    if (!filtersOpened) setLocalFilterChain(filterChain);
  }, [filtersOpened]);

  if (isTezosFilter && accountTezAddress)
    return <TezosChainTokensTab chainId={localFilterChain.chainId} publicKeyHash={accountTezAddress} />;

  if (isEvmFilter && accountEvmAddress)
    return <EvmChainTokensTab chainId={localFilterChain.chainId} publicKeyHash={accountEvmAddress} />;

  if (!localFilterChain && accountTezAddress && accountEvmAddress)
    return <MultiChainTokensTab accountTezAddress={accountTezAddress} accountEvmAddress={accountEvmAddress} />;

  if (!localFilterChain && accountTezAddress) return <TezosTokensTab publicKeyHash={accountTezAddress} />;

  if (!localFilterChain && accountEvmAddress) return <EvmTokensTab publicKeyHash={accountEvmAddress} />;

  return null;
});
