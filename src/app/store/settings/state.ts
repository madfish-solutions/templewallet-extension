import { nanoid } from '@reduxjs/toolkit';

export interface SettingsState {
  isAnalyticsEnabled: boolean;
  userId: string;
}

export const settingsInitialState: SettingsState = {
  isAnalyticsEnabled: true,
  userId: nanoid()
};
