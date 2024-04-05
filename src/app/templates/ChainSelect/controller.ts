import { useMemo, useState } from 'react';

import { SomeChain, useTezosMainnetChain } from 'temple/front';

export interface ChainSelectController {
  value: SomeChain;
  setValue: SyncFn<SomeChain>;
}

export const useChainSelectController = (): ChainSelectController => {
  const tezosMainnetChain = useTezosMainnetChain();

  const [value, setValue] = useState<SomeChain>(() => tezosMainnetChain);

  return useMemo(() => ({ value, setValue }), [value]);
};
