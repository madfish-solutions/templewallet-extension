import { nanoid } from '@reduxjs/toolkit';

export interface SettingsState {
  userId: string;
  isAnalyticsEnabled: boolean;
  isOnRampPossibility: boolean;
  shouldBackupMnemonic: boolean;
  /** @deprecated */
  balanceMode?: 'fiat' | 'gas';
}

export const settingsInitialState: SettingsState = {
  userId: nanoid(),
  isAnalyticsEnabled: true,
  isOnRampPossibility: false,
  shouldBackupMnemonic: false
};
