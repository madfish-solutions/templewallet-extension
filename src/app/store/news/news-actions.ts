import { createAction } from '@reduxjs/toolkit';

import { createActions } from '../create-actions';
import { NewsNotificationInterface } from './news-interfaces';

export const loadNewsAction = createActions<void, Array<NewsNotificationInterface>>('news/LOAD_NEWS');
export const readNewsAction = createAction<string>('news/READ_NEWS');
export const loadMoreNewsAction = createActions<void, Array<NewsNotificationInterface>>('news/LOAD_MORE_NEWS');
