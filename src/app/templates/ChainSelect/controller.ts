import { useMemo, useState } from 'react';

import { OneOfChains, useAccountAddressForTezos, useEthereumMainnetChain, useTezosMainnetChain } from 'temple/front';

export interface ChainSelectController {
  value: OneOfChains;
  setValue: SyncFn<OneOfChains>;
}

export const useChainSelectController = (): ChainSelectController => {
  const tezosMainnetChain = useTezosMainnetChain();
  const evmMainnet = useEthereumMainnetChain();
  const accountTezAddress = useAccountAddressForTezos();

  const [value, setValue] = useState<OneOfChains>(() => (accountTezAddress ? tezosMainnetChain : evmMainnet));

  return useMemo(() => ({ value, setValue }), [value]);
};
