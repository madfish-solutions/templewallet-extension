import { createContext, MutableRefObject, useContext } from 'react';

import type { BatchWalletOperation } from '@taquito/taquito/dist/types/wallet/batch-operation';

export interface SwapFormControl {
  resetForm?: EmptyFn;
  setTezosOperation?: (op?: BatchWalletOperation) => void;
}

export const SwapFormControlContext = createContext<MutableRefObject<SwapFormControl | null> | null>(null);

export const useSwapFormControl = () => {
  const ctx = useContext(SwapFormControlContext);
  if (!ctx) {
    throw new Error('SwapFormControlContext is not provided');
  }
  return ctx;
};
