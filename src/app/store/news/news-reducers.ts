import { createReducer } from '@reduxjs/toolkit';

import { loadNewsAction, readNewsAction, setNewsLoadingAction } from './news-actions';
import { newsInitialState, NewsState } from './news-state';

export const newsReducer = createReducer<NewsState>(newsInitialState, builder => {
  builder.addCase(readNewsAction, (state, { payload }) => ({
    ...state,
    readNewsIds: [...state.readNewsIds, payload]
  }));
  builder.addCase(loadNewsAction.success, (state, { payload }) => ({
    ...state,
    news: payload
  }));
  builder.addCase(setNewsLoadingAction.submit, state => ({
    ...state,
    loading: true
  }));
  builder.addCase(setNewsLoadingAction.success, state => ({
    ...state,
    loading: false
  }));
});
