import { createContext, RefObject, useContext } from 'react';

export interface SendFormControl {
  resetForm: EmptyFn;
}

export const SendFormControlContext = createContext<RefObject<SendFormControl | null> | null>(null);

export const useSendFormControl = () => {
  const context = useContext(SendFormControlContext);
  if (!context) throw new Error('useSendFormControl must be used within a SendFormControlContext.Provider');
  return context;
};
