import { createContext } from 'react';

import { TokensTabBaseProps } from '../tokens-tab-base';

import { TezosTokensTabProps } from './types';

export const TezosTokensTabContext = createContext<
  TezosTokensTabProps &
    Pick<TokensTabBaseProps, 'tezosCollectibles' | 'collectiblesReady' | 'collectiblesSortPredicate'>
>({
  publicKeyHash: '',
  accountId: '',
  tezosCollectibles: [],
  collectiblesReady: false,
  collectiblesSortPredicate: () => 0
});
