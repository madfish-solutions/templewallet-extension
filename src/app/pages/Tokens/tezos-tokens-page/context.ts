import { createContext } from 'react';

import { noop } from 'lodash';

import { TokensPageBaseProps } from '../tokens-page-base';

import { TezosTokensPageProps } from './types';

export const TezosTokensPageContext = createContext<
  TezosTokensPageProps & Pick<TokensPageBaseProps, 'toggleManageActive'>
>({ publicKeyHash: '', accountId: '', toggleManageActive: noop });
