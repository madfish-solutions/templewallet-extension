import { createContext } from 'react';

import { TokensTabBaseProps } from '../tokens-tab-base';

import { EvmTokensTabProps } from './types';

export const EvmTokensTabContext = createContext<
  EvmTokensTabProps & Pick<TokensTabBaseProps, 'evmCollectibles' | 'collectiblesReady' | 'collectiblesSortPredicate'>
>({
  publicKeyHash: '0x',
  accountId: '',
  evmCollectibles: [],
  collectiblesReady: false,
  collectiblesSortPredicate: () => 0
});
