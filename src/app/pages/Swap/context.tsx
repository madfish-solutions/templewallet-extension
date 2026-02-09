import { createContext, MutableRefObject, useContext } from 'react';

import type { BatchWalletOperation } from '@tezos-x/octez.js/dist/types/wallet/batch-operation';

export interface SwapFormControl {
  resetForm?: EmptyFn;
  setTezosOperation?: (op?: BatchWalletOperation) => void;
}

export const SwapFormControlContext = createContext<MutableRefObject<SwapFormControl | null> | null>(null);

export const useSwapFormControl = () => {
  const context = useContext(SwapFormControlContext);
  if (!context) throw new Error('SwapFormControlContext must be used within a SwapFormControlContext.Provider');
  return context;
};
