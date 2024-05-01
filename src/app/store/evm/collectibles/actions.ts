import { createAction } from '@reduxjs/toolkit';

import { NftAddressBalanceNftResponse } from 'lib/apis/temple/evm-data.interfaces';

interface proceedLoadedEvmCollectiblesActionPayload {
  publicKeyHash: HexString;
  chainId: number;
  data: NftAddressBalanceNftResponse;
}

export const proceedLoadedEvmCollectiblesAction = createAction<proceedLoadedEvmCollectiblesActionPayload>(
  'evm/PROCEED_LOADED_COLLECTIBLES_ACTION'
);
