import { useCallback, useMemo } from 'react';

import { TezosToolkit } from '@taquito/taquito';
import { DomainNameValidationResult, isTezosDomainsSupportedNetwork } from '@tezos-domains/core';
import { TaquitoTezosDomainsClient } from '@tezos-domains/taquito-client';

import { useTypedSWR } from 'lib/swr';
import { useTezos } from 'lib/temple/front/ready';
import { useTezosNetwork } from 'temple/front';
import { TEZOS_NETWORK_NAMES } from 'temple/networks';

function getClient(networkName: 'mainnet' | 'custom', tezos: TezosToolkit) {
  return isTezosDomainsSupportedNetwork(networkName)
    ? new TaquitoTezosDomainsClient({ network: networkName, tezos })
    : TaquitoTezosDomainsClient.Unsupported;
}

export function isTezosDomainsNameValid(name: string, client: TaquitoTezosDomainsClient) {
  return client.validator.validateDomainName(name, { minLevel: 2 }) === DomainNameValidationResult.VALID;
}

export function useTezosDomainsClient() {
  const { chainId } = useTezosNetwork();
  const tezos = useTezos();

  const networkName = TEZOS_NETWORK_NAMES.get(chainId)!;
  return useMemo(() => getClient(networkName === 'mainnet' ? networkName : 'custom', tezos), [networkName, tezos]);
}

export function useTezosAddressByDomainName(domainName: string) {
  const domainsClient = useTezosDomainsClient();
  const tezos = useTezos();

  const domainAddressFactory = useCallback(
    ([, , name]: [string, string, string]) => domainsClient.resolver.resolveNameToAddress(name),
    [domainsClient]
  );

  return useTypedSWR(['tzdns-address', tezos.checksum, domainName], domainAddressFactory, {
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

  return useTypedSWR(['tzdns-reverse-name', address, tezos.checksum], resolveDomainReverseName, {
    shouldRetryOnError: false,
    revalidateOnFocus: false
  });
}
