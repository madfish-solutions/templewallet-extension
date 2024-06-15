import React, { memo } from 'react';

import { ContentContainer } from 'app/layouts/containers';
import { useAssetsFilterOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { UNDER_DEVELOPMENT_MSG } from 'temple/evm/under_dev_msg';
import { useAccountAddressForEvm, useAccountAddressForTezos } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { AllNetworksTokensTab } from './components/AllNetworksTokensTab';
import { EvmChainTokensTab } from './components/EvmChainTokensTab';
import { EvmTokensTab } from './components/EvmTokensTab';
import { TezosChainTokensTab } from './components/TezosChainTokensTab';
import { TezosTokensTab } from './components/TezosTokensTab';

export const TokensTab = memo(() => {
  const { filterChain } = useAssetsFilterOptionsSelector();

  const accountTezAddress = useAccountAddressForTezos();
  const accountEvmAddress = useAccountAddressForEvm();

  const isTezosFilter = filterChain?.kind === TempleChainKind.Tezos;
  const isEvmFilter = filterChain?.kind === TempleChainKind.EVM;

  const isOnlyTezAccount = Boolean(accountTezAddress && !accountEvmAddress);
  const isOnlyEvmAccount = Boolean(!accountTezAddress && accountEvmAddress);

  if (isTezosFilter && isOnlyEvmAccount)
    return <div>This acc dont support Tezos assets, pls check your network filter</div>;

  if (isEvmFilter && isOnlyTezAccount)
    return <div>This acc dont support EVM assets, pls check your network filter</div>;

  if (isTezosFilter && accountTezAddress)
    return <TezosChainTokensTab chainId={filterChain.chainId} publicKeyHash={accountTezAddress} />;

  if (isEvmFilter && accountEvmAddress)
    return <EvmChainTokensTab chainId={filterChain.chainId} publicKeyHash={accountEvmAddress} />;

  if (!filterChain && accountTezAddress && accountEvmAddress)
    return <AllNetworksTokensTab accountTezAddress={accountEvmAddress} accountEvmAddress={accountEvmAddress} />;

  if (!filterChain && accountTezAddress) return <TezosTokensTab publicKeyHash={accountTezAddress} />;

  if (!filterChain && accountEvmAddress) return <EvmTokensTab publicKeyHash={accountEvmAddress} />;

  return <ContentContainer className="mt-3">{UNDER_DEVELOPMENT_MSG}</ContentContainer>;
});
