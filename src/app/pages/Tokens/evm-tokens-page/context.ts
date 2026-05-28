import { createContext } from 'react';

import { EvmTokensPageProps } from './types';

export const EvmTokensPageContext = createContext<EvmTokensPageProps>({ publicKeyHash: '0x', accountId: '' });
