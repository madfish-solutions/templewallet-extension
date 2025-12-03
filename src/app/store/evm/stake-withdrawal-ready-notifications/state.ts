export interface StakeWithdrawalReadyNotificationsState {
  notified: Record<number, Record<HexString, boolean>>;
}

export const stakeWithdrawalReadyNotificationsInitialState: StakeWithdrawalReadyNotificationsState = {
  notified: {}
};
