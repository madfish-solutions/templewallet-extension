import { useMemo } from 'react';

import { TezosToolkit } from '@taquito/taquito';
import { DomainNameValidationResult, isTezosDomainsSupportedNetwork } from '@tezos-domains/core';
import { TaquitoTezosDomainsClient } from '@tezos-domains/taquito-client';

import { NETWORK_IDS } from 'lib/temple/networks';

import { useTezos, useChainId } from './ready';

function getClient(networkId: 'mainnet' | 'custom', tezos: TezosToolkit) {
  return isTezosDomainsSupportedNetwork(networkId)
    ? new TaquitoTezosDomainsClient({ network: networkId, tezos })
    : TaquitoTezosDomainsClient.Unsupported;
}

export function isDomainNameValid(name: string, client: TaquitoTezosDomainsClient) {
  return client.validator.validateDomainName(name, { minLevel: 2 }) === DomainNameValidationResult.VALID;
}

export function useTezosDomainsClient() {
  console.log(1);
  const chainId = useChainId(true)!;
  const tezos = useTezos();

  const networkId = NETWORK_IDS.get(chainId)!;
  return useMemo(() => getClient(networkId === 'mainnet' ? networkId : 'custom', tezos), [networkId, tezos]);
}
