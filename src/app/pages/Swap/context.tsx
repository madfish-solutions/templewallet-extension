import { createContext, RefObject, useContext } from 'react';

import type { BatchWalletOperation } from '@taquito/taquito/dist/types/wallet/batch-operation';

export interface SwapFormControl {
  resetForm?: EmptyFn;
  setTezosOperation?: (op?: BatchWalletOperation) => void;
}

export const SwapFormControlContext = createContext<RefObject<SwapFormControl | null> | null>(null);

export const useSwapFormControl = () => {
  const context = useContext(SwapFormControlContext);
  if (!context) throw new Error('SwapFormControlContext must be used within a provider');
  return context;
};
