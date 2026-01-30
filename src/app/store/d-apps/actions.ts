import { TezosToolkit } from '@tezos-x/octez.js';

import { createActions } from 'lib/store';

export const loadTokensApyActions = createActions<TezosToolkit, Record<string, number>>('d-apps/LOAD_TOKENS_APY');
