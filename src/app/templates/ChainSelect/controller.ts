import { useMemo, useState } from 'react';

import { OneOfChains, useTezosMainnetChain } from 'temple/front';

export interface ChainSelectController {
  value: OneOfChains;
  setValue: SyncFn<OneOfChains>;
}

export const useChainSelectController = (): ChainSelectController => {
  const tezosMainnetChain = useTezosMainnetChain();

  const [value, setValue] = useState<OneOfChains>(() => tezosMainnetChain);

  return useMemo(() => ({ value, setValue }), [value]);
};
