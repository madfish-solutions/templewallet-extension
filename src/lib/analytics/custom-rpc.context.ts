import { createContext } from 'react';

export const CustomTezosChainIdContext = createContext<string | undefined>(undefined);

export const CustomEvmChainIdContext = createContext<number | undefined>(undefined);
