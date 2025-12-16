import { useMemo } from 'react';

import { Ethereum } from '@temple-wallet/everstake-wallet-sdk';
import memoizee from 'memoizee';

import { ETHEREUM_HOODI_CHAIN_ID } from 'lib/temple/types';
import { getViemPublicClient } from 'temple/evm';
import { useGetEvmActiveBlockExplorer } from 'temple/front/ready';
import { EvmNetworkEssentials } from 'temple/networks';

export const useBlockExplorerUrl = (network: EvmNetworkEssentials): string | undefined => {
  const getBlockExplorer = useGetEvmActiveBlockExplorer();
  const blockExplorer = useMemo(
    () => getBlockExplorer(network.chainId.toString()),
    [getBlockExplorer, network.chainId]
  );

  return blockExplorer?.url;
};

export const makeEthereumToolkit = memoizee(
  (network: EvmNetworkEssentials) =>
    new Ethereum(network.chainId === ETHEREUM_HOODI_CHAIN_ID ? 'hoodi' : 'mainnet', getViemPublicClient(network)),
  { normalizer: args => JSON.stringify(args) }
);
