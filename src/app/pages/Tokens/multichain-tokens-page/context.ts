import { createContext } from 'react';

import { MultiChainTokensPageProps } from './types';

export const MultiChainTokensPageContext = createContext<MultiChainTokensPageProps>({
  accountTezAddress: '',
  accountEvmAddress: '0x',
  accountId: ''
});
