import { nanoid } from '@reduxjs/toolkit';

export enum BalanceMode {
  Fiat = 'fiat',
  Gas = 'gas'
}

export interface SettingsState {
  userId: string;
  isAnalyticsEnabled: boolean;
  balanceMode: BalanceMode;
  isEnableAdsBanner: boolean;
  isOnRampPossibility: boolean;
}

export const settingsInitialState: SettingsState = {
  userId: nanoid(),
  isAnalyticsEnabled: true,
  balanceMode: BalanceMode.Fiat,
  isEnableAdsBanner: true,
  isOnRampPossibility: false
};
