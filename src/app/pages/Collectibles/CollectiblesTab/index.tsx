import React, { memo, useEffect, useState } from 'react';

import { useAssetsViewState } from 'app/hooks/use-assets-view-state';
import { ContentContainer } from 'app/layouts/containers';
import { dispatch } from 'app/store';
import { setAssetsFilterChain } from 'app/store/assets-filter-options/actions';
import { useAssetsFilterOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { UNDER_DEVELOPMENT_MSG } from 'temple/evm/under_dev_msg';
import { useAccountAddressForEvm, useAccountAddressForTezos } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { EvmChainCollectiblesTab } from './components/EvmChainCollectiblesTab';
import { EvmCollectiblesTab } from './components/EvmCollectiblesTab';
import { MultiChainCollectiblesTab } from './components/MultiChainCollectiblesTab';
import { TezosChainCollectiblesTab } from './components/TezosChainCollectiblesTab';
import { TezosCollectiblesTab } from './components/TezosCollectiblesTab';

export const CollectiblesTab = memo(() => {
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

  useEffect(() => {
    if (filterChain?.chainId !== localFilterChain?.chainId) setLocalFilterChain(filterChain);
  }, [filterChain]);

  if (isTezosFilter && accountTezAddress)
    return <TezosChainCollectiblesTab chainId={localFilterChain.chainId} publicKeyHash={accountTezAddress} />;

  if (isEvmFilter && accountEvmAddress)
    return <EvmChainCollectiblesTab chainId={localFilterChain.chainId} publicKeyHash={accountEvmAddress} />;

  if (!localFilterChain && accountTezAddress && accountEvmAddress)
    return <MultiChainCollectiblesTab accountTezAddress={accountTezAddress} accountEvmAddress={accountEvmAddress} />;

  if (!localFilterChain && accountTezAddress) return <TezosCollectiblesTab publicKeyHash={accountTezAddress} />;

  if (!localFilterChain && accountEvmAddress) return <EvmCollectiblesTab publicKeyHash={accountEvmAddress} />;

  return <ContentContainer className="mt-3">{UNDER_DEVELOPMENT_MSG}</ContentContainer>;
});
