import { mockPersistedState } from 'lib/store';

import { crossChainSendInitialState, CrossChainSendState } from './state';

export const mockCrossChainSendState = mockPersistedState<CrossChainSendState>(crossChainSendInitialState);
