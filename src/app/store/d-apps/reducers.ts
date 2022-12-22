import { createReducer } from '@reduxjs/toolkit';

import { loadTokensApyActions } from './actions';
import { dAppsInitialState, DAppsState } from './state';

export const dAppsReducer = createReducer<DAppsState>(dAppsInitialState, builder => {
  builder.addCase(loadTokensApyActions.success, (state, { payload: apyRecords }) => {
    const slugs = Object.keys(apyRecords);
    const tokensApy = slugs.reduce(
      (acc, slug) => ({
        ...acc,
        [slug]: {
          ...state.tokensApyInfo[slug],
          rate: apyRecords[slug]
        }
      }),
      {}
    );

    return { ...state, tokensApyInfo: { ...state.tokensApyInfo, ...tokensApy } };
  });
});
