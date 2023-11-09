import { useCallback, useMemo } from 'react';

import { TezosToolkit } from '@taquito/taquito';
import { DomainNameValidationResult, isTezosDomainsSupportedNetwork } from '@tezos-domains/core';
import { TaquitoTezosDomainsClient } from '@tezos-domains/taquito-client';
import useSWR from 'swr';

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
  const chainId = useChainId(true)!;
  const tezos = useTezos();

  const networkId = NETWORK_IDS.get(chainId)!;
  return useMemo(() => getClient(networkId === 'mainnet' ? networkId : 'custom', tezos), [networkId, tezos]);
}

export function useTezosAddressByDomainName(domainName: string) {
  const domainsClient = useTezosDomainsClient();
  const tezos = useTezos();

  const domainAddressFactory = useCallback(
    ([, , name]: [string, string, string]) => domainsClient.resolver.resolveNameToAddress(name),
    [domainsClient]
  );

  return useSWR(['tzdns-address', tezos.checksum, domainName], domainAddressFactory, {
    shouldRetryOnError: false,
    revalidateOnFocus: false
  });
}

export function useTezosDomainNameByAddress(address: string) {
  const { resolver: domainsResolver } = useTezosDomainsClient();
  const tezos = useTezos();
  const resolveDomainReverseName = useCallback(
    ([, pkh]: [string, string, string]) => domainsResolver.resolveAddressToName(pkh),
    [domainsResolver]
  );

  return useSWR(() => ['tzdns-reverse-name', address, tezos.checksum], resolveDomainReverseName, {
    shouldRetryOnError: false,
    revalidateOnFocus: false
  });
}
