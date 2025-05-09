import { isString } from 'lodash';
import { normalize } from 'viem/ens';

import { useTypedSWR } from 'lib/swr';
import { getViemPublicClient } from 'temple/evm';
import { EvmChain } from 'temple/front/chains';

async function resolveAddress(domainName: string, network: EvmChain) {
  // need universalResolverAddress from ViemChain definition
  const publicClient = getViemPublicClient(network);

  return publicClient.getEnsAddress({
    name: normalize(domainName)
  });
}

export function useEvmAddressByDomainName(domainName: string, network: EvmChain | nullish) {
  return useTypedSWR(
    network ? ['ens-address', domainName, network.chainId, network.rpcBaseURL] : null,
    () => (network && isString(domainName) ? resolveAddress(domainName, network) : null),
    {
      shouldRetryOnError: false,
      revalidateOnFocus: false
    }
  );
}
