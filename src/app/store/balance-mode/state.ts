export enum BalanceMode {
  Fiat = 'fiat',
  Gas = 'gas'
}
export interface BalanceModeState {
  balanceMode: BalanceMode;
}
export const balanceModeInitialState: BalanceModeState = {
  balanceMode: BalanceMode.Fiat
};
