import { createContext } from 'react';

/** TODO: Might wanna have CustomChainIdProvider  */
export const CustomRpcContext = createContext<string | undefined>(undefined);
