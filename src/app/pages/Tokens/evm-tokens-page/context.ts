import { createContext } from 'react';

import { noop } from 'lodash';

import { TokensPageBaseProps } from '../tokens-page-base';

import { EvmTokensPageProps } from './types';

export const EvmTokensPageContext = createContext<EvmTokensPageProps & Pick<TokensPageBaseProps, 'toggleManageActive'>>(
  { publicKeyHash: '0x', accountId: '', toggleManageActive: noop }
);
