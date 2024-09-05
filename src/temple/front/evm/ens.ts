import { normalize } from 'viem/ens';

import { useTypedSWR } from 'lib/swr';
import { getReadOnlyEvmForNetwork } from 'temple/evm';
import { EvmChain } from 'temple/front/chains';

async function resolveAddress(domainName: string, network: EvmChain) {
  const publicClient = await getReadOnlyEvmForNetwork(network);

  return publicClient.getEnsAddress({
    name: normalize(domainName)
  });
}

export function useEvmAddressByDomainName(domainName: string, network: EvmChain | nullish) {
  return useTypedSWR(
    network ? ['ens-address', domainName, network.chainId, network.rpcBaseURL] : null,
    () => (network ? resolveAddress(domainName, network) : null),
    {
      shouldRetryOnError: false,
      revalidateOnFocus: false
    }
  );
}
