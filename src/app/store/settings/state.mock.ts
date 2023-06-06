import { BalanceMode, SettingsState } from './state';

export const mockSettingsState: SettingsState = {
  isAnalyticsEnabled: true,
  userId: '0',
  balanceMode: BalanceMode.Fiat,
  isOnRampPossibility: false
};
