import { createAction } from '@reduxjs/toolkit';

import { BalanceMode } from './state';

export const toggleBalanceMode = createAction<BalanceMode>('balance-mode/TOGGLE_BALANCE_MODE');
