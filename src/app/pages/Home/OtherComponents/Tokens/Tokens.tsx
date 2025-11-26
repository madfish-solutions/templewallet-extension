import React, { memo, useEffect, useState } from 'react';

import { useAssetsViewState } from 'app/hooks/use-assets-view-state';
import { dispatch } from 'app/store';
import { setAssetsFilterChain } from 'app/store/assets-filter-options/actions';
import { useAssetsFilterOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { useAccountAddressForEvm, useAccountAddressForTezos, useCurrentAccountId } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { EvmChainTokensTab } from './components/EvmChainTokensTab';
import { EvmTokensTab } from './components/EvmTokensTab';
import { MultiChainTokensTab } from './components/MultiChainTokensTab';
import { TezosChainTokensTab } from './components/TezosChainTokensTab';
import { TezosTokensTab } from './components/TezosTokensTab';

interface TokensTabProps {
  onTokensTabClick: EmptyFn;
  onCollectiblesTabClick: EmptyFn;
}

export const TokensTab = memo<TokensTabProps>(({ onTokensTabClick, onCollectiblesTabClick }) => {
  const { filtersOpened } = useAssetsViewState();
  const { filterChain } = useAssetsFilterOptionsSelector();

  const [localFilterChain, setLocalFilterChain] = useState(filterChain);

  const accountTezAddress = useAccountAddressForTezos();
  const accountEvmAddress = useAccountAddressForEvm();
  const accountId = useCurrentAccountId();

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
    return (
      <TezosChainTokensTab
        accountId={accountId}
        chainId={localFilterChain.chainId}
        publicKeyHash={accountTezAddress}
        onTokensTabClick={onTokensTabClick}
        onCollectiblesTabClick={onCollectiblesTabClick}
      />
    );

  if (isEvmFilter && accountEvmAddress)
    return (
      <EvmChainTokensTab
        accountId={accountId}
        chainId={localFilterChain.chainId}
        publicKeyHash={accountEvmAddress}
        onTokensTabClick={onTokensTabClick}
        onCollectiblesTabClick={onCollectiblesTabClick}
      />
    );

  if (!localFilterChain && accountTezAddress && accountEvmAddress)
    return (
      <MultiChainTokensTab
        accountId={accountId}
        accountTezAddress={accountTezAddress}
        accountEvmAddress={accountEvmAddress}
        onTokensTabClick={onTokensTabClick}
        onCollectiblesTabClick={onCollectiblesTabClick}
      />
    );

  if (!localFilterChain && accountTezAddress)
    return (
      <TezosTokensTab
        accountId={accountId}
        publicKeyHash={accountTezAddress}
        onTokensTabClick={onTokensTabClick}
        onCollectiblesTabClick={onCollectiblesTabClick}
      />
    );

  if (!localFilterChain && accountEvmAddress)
    return (
      <EvmTokensTab
        accountId={accountId}
        publicKeyHash={accountEvmAddress}
        onTokensTabClick={onTokensTabClick}
        onCollectiblesTabClick={onCollectiblesTabClick}
      />
    );

  return null;
});
