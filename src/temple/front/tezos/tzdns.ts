import { DomainNameValidationResult, isTezosDomainsSupportedNetwork } from '@tezos-domains/core';
import { TaquitoTezosDomainsClient } from '@tezos-domains/taquito-client';
import memoizee from 'memoizee';

import { useTypedSWR } from 'lib/swr';
import { TEZOS_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { useEnabledTezosChains } from 'temple/front/ready';
import { MAX_MEMOIZED_TOOLKITS } from 'temple/misc';
import { TezosNetworkEssentials } from 'temple/networks';
import { getTezosReadOnlyRpcClient } from 'temple/tezos';

export const getTezosDomainsClient = memoizee(
  (network: TezosNetworkEssentials) => {
    const networkName = network.chainId === TEZOS_MAINNET_CHAIN_ID ? 'mainnet' : 'custom';

    return isTezosDomainsSupportedNetwork(networkName)
      ? new TaquitoTezosDomainsClient({
          network: networkName,
          tezos: getTezosReadOnlyRpcClient(network)
        })
      : TaquitoTezosDomainsClient.Unsupported;
  },
  { normalizer: ([network]) => JSON.stringify(network), max: MAX_MEMOIZED_TOOLKITS }
);

export function isTezosDomainsNameValid(name: string, client: TaquitoTezosDomainsClient) {
  return client.validator.validateDomainName(name, { minLevel: 2 }) === DomainNameValidationResult.VALID;
}

export function useTezosAddressByDomainName(domainName: string, network?: TezosNetworkEssentials) {
  const enabledTezosChains = useEnabledTezosChains();
  const tezosChains = network ? [network] : enabledTezosChains;

  return useTypedSWR(
    ['tzdns-address', domainName, ...tezosChains.map(({ rpcBaseURL, chainId }) => `${chainId}_${rpcBaseURL}`)],
    async () => {
      const results = await Promise.allSettled(
        tezosChains.map(network => getTezosDomainsClient(network).resolver.resolveNameToAddress(domainName))
      );

      return (
        results.find((result): result is PromiseFulfilledResult<string | null> => result.status === 'fulfilled')
          ?.value ?? null
      );
    },
    {
      shouldRetryOnError: false,
      revalidateOnFocus: false
    }
  );
}
