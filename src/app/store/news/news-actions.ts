import { createAction } from '@reduxjs/toolkit';

import { createActions } from '../create-actions';
import { NewsNotificationInterface } from './news-interfaces';

export const loadNewsAction = createActions<void, Array<NewsNotificationInterface>>('news/LOAD_NEWS');
export const setNewsLoadingAction = createActions<void, void>('news/SET_NEWS_LOADING');
export const readNewsAction = createAction<string>('news/READ_NEWS');
