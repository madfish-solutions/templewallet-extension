import { createContext } from 'react';

import { TezosTokensPageProps } from './types';

export const TezosTokensPageContext = createContext<TezosTokensPageProps>({ publicKeyHash: '', accountId: '' });
