import { useEffect, useState } from 'react';

import { dispatch } from 'app/store';
import { setAssetsFilterChain } from 'app/store/assets-filter-options/actions';
import { useAssetsFilterOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { useAccountAddressForEvm, useAccountAddressForTezos, useCurrentAccountId } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { EvmChainTokensPage } from './evm-chain-tokens-page';
import { EvmTokensPage } from './evm-tokens-page';
import { MultiChainTokensPage } from './multichain-tokens-page';
import { TezosChainTokensPage } from './tezos-chain-tokens-page';
import { TezosTokensPage } from './tezos-tokens-page';

export const TokensPage = () => {
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
  }, [isTezosFilter, isEvmFilter, isOnlyEvmAccount, isOnlyTezAccount]);

  useEffect(() => {
    if (filterChain?.chainId !== localFilterChain?.chainId) setLocalFilterChain(filterChain);
  }, [filterChain]);

  if (isTezosFilter && accountTezAddress)
    return (
      <TezosChainTokensPage
        accountId={accountId}
        chainId={localFilterChain.chainId}
        publicKeyHash={accountTezAddress}
      />
    );

  if (isEvmFilter && accountEvmAddress)
    return (
      <EvmChainTokensPage accountId={accountId} chainId={localFilterChain.chainId} publicKeyHash={accountEvmAddress} />
    );

  if (!localFilterChain && accountTezAddress && accountEvmAddress)
    return (
      <MultiChainTokensPage
        accountId={accountId}
        accountTezAddress={accountTezAddress}
        accountEvmAddress={accountEvmAddress}
      />
    );

  if (!localFilterChain && accountTezAddress)
    return <TezosTokensPage accountId={accountId} publicKeyHash={accountTezAddress} />;

  if (!localFilterChain && accountEvmAddress)
    return <EvmTokensPage accountId={accountId} publicKeyHash={accountEvmAddress} />;

  return null;
};
