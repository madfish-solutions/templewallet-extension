import { createAction } from '@reduxjs/toolkit';

export const setIsAnalyticsEnabledAction = createAction<boolean>('settings/SET_IS_ANALYTICS_ENABLED');
