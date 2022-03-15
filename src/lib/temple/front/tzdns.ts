import { useMemo } from 'react';

import { TezosToolkit } from '@taquito/taquito';
import { DomainNameValidationResult, isTezosDomainsSupportedNetwork } from '@tezos-domains/core';
import { TaquitoTezosDomainsClient } from '@tezos-domains/taquito-client';

import { useTezos, useChainId, NETWORK_IDS } from 'lib/temple/front';

export function getClient(networkId: string, tezos: TezosToolkit) {
  return isTezosDomainsSupportedNetwork(networkId)
    ? new TaquitoTezosDomainsClient({ network: networkId, tezos })
    : TaquitoTezosDomainsClient.Unsupported;
}

export function isDomainNameValid(name: string, client: TaquitoTezosDomainsClient) {
  return client.validator.validateDomainName(name) === DomainNameValidationResult.VALID;
}

export function useTezosDomainsClient() {
  const chainId = useChainId(true)!;
  const tezos = useTezos();

  const networkId = NETWORK_IDS.get(chainId)!;
  return useMemo(() => getClient(networkId, tezos), [networkId, tezos]);
}
