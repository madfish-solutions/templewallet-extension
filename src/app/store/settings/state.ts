import { nanoid } from '@reduxjs/toolkit';

export interface SettingsState {
  userId: string;
  isAnalyticsEnabled: boolean;
  isOnRampPossibility: boolean;
  isConversionTracked: boolean;
  pendingReactivateAds: boolean;
  /** @deprecated */
  balanceMode?: 'fiat' | 'gas';
  toastsContainerBottomShift: number;
}

export const settingsInitialState: SettingsState = {
  userId: nanoid(),
  isAnalyticsEnabled: false,
  isOnRampPossibility: false,
  isConversionTracked: false,
  pendingReactivateAds: false,
  toastsContainerBottomShift: 0
};
