import { createActions } from 'lib/store';

export const loadTokensApyActions = createActions<void, Record<string, number>>('d-apps/LOAD_TOKENS_APY');
