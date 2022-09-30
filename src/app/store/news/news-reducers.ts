import { createReducer } from '@reduxjs/toolkit';

import { loadMoreNewsAction, loadNewsAction, readNewsAction } from './news-actions';
import { NewsNotificationInterface, StatusType } from './news-interfaces';
import { newsInitialState, NewsState } from './news-state';

export const newsReducer = createReducer<NewsState>(newsInitialState, builder => {
  builder.addCase(readNewsAction, (state, { payload }) => ({
    ...state,
    readNewsIds: [...state.readNewsIds, payload]
  }));
  builder.addCase(loadNewsAction.submit, state => ({
    ...state,
    loading: true
  }));
  builder.addCase(loadNewsAction.fail, state => ({
    ...state,
    loading: false
  }));
  builder.addCase(loadNewsAction.success, (state, { payload }) => ({
    ...state,
    news: unique(
      payload.map(x => ({ ...x, status: StatusType.New })),
      'id'
    ),
    loading: false
  }));
  builder.addCase(loadMoreNewsAction.success, (state, { payload }) => ({
    ...state,
    news: unique([...state.news, ...payload.map(x => ({ ...x, status: StatusType.New }))], 'id')
  }));
});

function unique(array: NewsNotificationInterface[], propertyName: keyof NewsNotificationInterface) {
  return array.filter((e, i) => array.findIndex(a => a[propertyName] === e[propertyName]) === i);
}
