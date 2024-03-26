import { useCallback, useMemo } from 'react';

import { DomainNameValidationResult, isTezosDomainsSupportedNetwork } from '@tezos-domains/core';
import { TaquitoTezosDomainsClient } from '@tezos-domains/taquito-client';

import { useTypedSWR } from 'lib/swr';
import { getReadOnlyTezos } from 'temple/tezos';

import { TEZOS_NETWORK_NAMES } from '../../networks';
import { useTezosNetwork, useTezosNetworkRpcUrl } from '../networks';

function getClient(networkName: 'mainnet' | 'custom', rpcUrl: string) {
  return isTezosDomainsSupportedNetwork(networkName)
    ? new TaquitoTezosDomainsClient({ network: networkName, tezos: getReadOnlyTezos(rpcUrl) })
    : TaquitoTezosDomainsClient.Unsupported;
}

export function isTezosDomainsNameValid(name: string, client: TaquitoTezosDomainsClient) {
  return client.validator.validateDomainName(name, { minLevel: 2 }) === DomainNameValidationResult.VALID;
}

export function useTezosDomainsClient() {
  const { chainId, rpcUrl } = useTezosNetwork();

  return useMemo(() => {
    const networkName = TEZOS_NETWORK_NAMES.get(chainId)!;

    return getClient(networkName === 'mainnet' ? networkName : 'custom', rpcUrl);
  }, [chainId, rpcUrl]);
}

export function useTezosAddressByDomainName(domainName: string) {
  const domainsClient = useTezosDomainsClient();
  const rpcUrl = useTezosNetworkRpcUrl();

  const domainAddressFactory = useCallback(
    ([, , name]: [string, string, string]) => domainsClient.resolver.resolveNameToAddress(name),
    [domainsClient]
  );

  return useTypedSWR(['tzdns-address', rpcUrl, domainName], domainAddressFactory, {
    shouldRetryOnError: false,
    revalidateOnFocus: false
  });
}

export function useTezosDomainNameByAddress(address: string) {
  const { resolver: domainsResolver } = useTezosDomainsClient();
  const rpcUrl = useTezosNetworkRpcUrl();

  const resolveDomainReverseName = useCallback(
    ([, pkh]: [string, string, string]) => domainsResolver.resolveAddressToName(pkh),
    [domainsResolver]
  );

  return useTypedSWR(['tzdns-reverse-name', address, rpcUrl], resolveDomainReverseName, {
    shouldRetryOnError: false,
    revalidateOnFocus: false
  });
}
