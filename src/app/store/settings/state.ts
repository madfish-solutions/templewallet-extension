import { nanoid } from '@reduxjs/toolkit';

export enum BalanceMode {
  Fiat = 'fiat',
  Gas = 'gas'
}

export interface SettingsState {
  userId: string;
  isAnalyticsEnabled: boolean;
  balanceMode: BalanceMode;
  isOnRampPossibility: boolean;
  isConversionTracked: boolean;
  pendingReactivateAds: boolean;
  adsImpressionsLinked: boolean;
  acceptedTermsVersion: number;
  referralLinksEnabled: boolean;
}

export const settingsInitialState: SettingsState = {
  userId: nanoid(),
  isAnalyticsEnabled: false,
  balanceMode: BalanceMode.Fiat,
  isOnRampPossibility: false,
  isConversionTracked: false,
  pendingReactivateAds: false,
  adsImpressionsLinked: false,
  acceptedTermsVersion: 0,
  referralLinksEnabled: false
};
