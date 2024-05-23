import { createAction } from '@reduxjs/toolkit';

export const setToastsContainerBottomShiftAction = createAction<number>(
  'toastsContainerStyle/SET_TOASTS_CONTAINER_BOTTOM_SHIFT'
);
