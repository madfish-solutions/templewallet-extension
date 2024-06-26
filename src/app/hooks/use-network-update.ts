import { useEffect } from 'react';

import { ChainSelectController } from 'app/templates/ChainSelect/controller';
import {
  useAccount,
  useAccountAddressForEvm,
  useAccountAddressForTezos,
  useEthereumMainnetChain,
  useTezosMainnetChain
} from 'temple/front';
import { TempleChainKind } from 'temple/types';

export const useNetworkUpdate = (chainSelectController: ChainSelectController) => {
  const network = chainSelectController.value;

  const tezosMainnet = useTezosMainnetChain();
  const evmMainnet = useEthereumMainnetChain();

  const selectedAccount = useAccount();

  const accountTezAddress = useAccountAddressForTezos();
  const accountEvmAddress = useAccountAddressForEvm();

  const isOnlyTezosAddress = Boolean(!accountEvmAddress && accountTezAddress);
  const isOnlyEvmAddress = Boolean(!accountTezAddress && accountEvmAddress);

  useEffect(() => {
    if (network.kind === TempleChainKind.Tezos && isOnlyEvmAddress) chainSelectController.setValue(evmMainnet);
    if (network.kind === TempleChainKind.EVM && isOnlyTezosAddress) chainSelectController.setValue(tezosMainnet);
  }, [selectedAccount]);
};
