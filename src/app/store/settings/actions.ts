import { createAction } from '@reduxjs/toolkit';

export const setIsAnalyticsEnabledAction = createAction<boolean>('settings/SET_IS_ANALYTICS_ENABLED');

export const setOnRampPossibilityAction = createAction<boolean>('settings/SET_ON_RAMP_POSSIBILITY_ACTION');

export const setShouldBackupMnemonicAction = createAction<boolean>('settings/SET_SHOULD_BACKUP_MNEMONIC_ACTION');
