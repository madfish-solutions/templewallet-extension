import { uniq } from 'lodash';
import memoizee from 'memoizee';
import { GetEnsAddressReturnType, createPublicClient, http, isAddress } from 'viem';
import { normalize } from 'viem/ens';

import { getMessage } from 'lib/i18n';
import { useTypedSWR } from 'lib/swr';
import { getViemChainsList } from 'temple/evm/utils';

import { EvmChain } from '../chains';
import { useEnabledEvmChains } from '../ready';

export const validateEvmContractAddress = (value: string) => (isAddress(value) ? true : getMessage('invalidAddress'));

const getEnsCapableChains = memoizee(() =>
  getViemChainsList().filter(chain => chain.contracts && 'ensRegistry' in chain.contracts)
);

const getEnsCapableEnabledChainsReadOnlyEvms = memoizee(
  (enabledChains: EvmChain[]) =>
    getEnsCapableChains()
      .filter(chain => enabledChains.some(({ chainId }) => chain.id === chainId))
      .map(chain => createPublicClient({ chain, transport: http(chain.rpcUrls.default.http[0]) })),
  { normalizer: ([chains]) => uniq(chains.map(({ chainId }) => chainId)).join('_') }
);

export function useEvmAddressByDomainName(domainName: string) {
  const enabledEvmChains = useEnabledEvmChains();

  return useTypedSWR(
    ['ens-address', domainName, ...enabledEvmChains.map(({ rpcBaseURL, chainId }) => `${chainId}_${rpcBaseURL}`)],
    async () => {
      const ensCapableChainsReadOnlyEvms = getEnsCapableEnabledChainsReadOnlyEvms(enabledEvmChains);
      const results = await Promise.allSettled(
        ensCapableChainsReadOnlyEvms.map(evm => evm.getEnsAddress({ name: normalize(domainName) }))
      );

      return (
        results.find(
          (result): result is PromiseFulfilledResult<GetEnsAddressReturnType | null> => result.status === 'fulfilled'
        )?.value ?? null
      );
    },
    {
      dedupingInterval: 1000,
      shouldRetryOnError: false,
      revalidateOnFocus: false
    }
  );
}
