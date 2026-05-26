import { createContext } from 'react';

import { TokensTabBaseProps } from '../tokens-tab-base';

import { MultiChainTokensTabProps } from './types';

export const MultiChainTokensTabContext = createContext<
  MultiChainTokensTabProps &
    Pick<
      TokensTabBaseProps,
      'tezosCollectibles' | 'evmCollectibles' | 'collectiblesReady' | 'collectiblesSortPredicate'
    >
>({
  accountTezAddress: '',
  accountEvmAddress: '0x',
  accountId: '',
  tezosCollectibles: [],
  evmCollectibles: [],
  collectiblesReady: false,
  collectiblesSortPredicate: () => 0
});
