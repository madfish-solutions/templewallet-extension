import { createReducer } from '@reduxjs/toolkit';

import { setConversionTrackedAction } from './conversion-actions';
import { ConversionState, conversionInitialState } from './conversion-state';

export const conversionReducers = createReducer<ConversionState>(conversionInitialState, builder => {
  builder.addCase(setConversionTrackedAction, _ => ({
    isTracked: true
  }));
});
