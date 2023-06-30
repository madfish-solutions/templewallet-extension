import { TezosToolkit } from '@taquito/taquito';

import { createActions } from 'lib/store';

export const loadTokensApyActions = createActions<TezosToolkit, Record<string, number>>('d-apps/LOAD_TOKENS_APY');
