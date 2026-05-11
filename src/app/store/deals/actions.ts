import { createAction } from '@reduxjs/toolkit';

export const setDealsEnabledAction = createAction<boolean>('deals/SET_ENABLED');

export const setDealsSnoozedUntilAction = createAction<number>('deals/SET_SNOOZED_UNTIL');
