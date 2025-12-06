import { createAction } from '@reduxjs/toolkit';

interface SetNotifiedActionPayload {
  chainId: number;
  address: HexString;
  notified: boolean;
}

export const setStakeWithdrawalReadyNotified = createAction<SetNotifiedActionPayload>(
  'evm/stake-withdrawal-ready-notifications/SET_NOTIFIED'
);
