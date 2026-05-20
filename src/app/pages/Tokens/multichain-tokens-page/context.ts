import { createContext } from 'react';

import { noop } from 'lodash';

import { TokensPageBaseProps } from '../tokens-page-base';

import { MultiChainTokensPageProps } from './types';

export const MultiChainTokensPageContext = createContext<
  MultiChainTokensPageProps & Pick<TokensPageBaseProps, 'toggleManageActive'>
>({ accountTezAddress: '', accountEvmAddress: '0x', accountId: '', toggleManageActive: noop });
