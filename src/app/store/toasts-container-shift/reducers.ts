import { createReducer } from '@reduxjs/toolkit';

import { setToastsContainerBottomShiftAction } from './actions';
import { ToastsContainerShiftState, toastsContainerStyleInitialState } from './state';

export const toastsContainerShiftReducer = createReducer<ToastsContainerShiftState>(
  toastsContainerStyleInitialState,
  builder => {
    builder.addCase(setToastsContainerBottomShiftAction, (state, { payload }) => {
      state.bottomShift = payload;
    });
  }
);
