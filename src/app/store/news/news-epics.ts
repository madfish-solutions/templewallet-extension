import { combineEpics } from 'redux-observable';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { Action } from 'ts-action';
import { ofType } from 'ts-action-operators';

import { withLoadedNews } from 'app/utils/news.utils';
import { getNewsItems } from 'lib/templewallet-api/news';

import { RootState } from '../create-store';
import { loadMoreNewsAction, loadNewsAction } from './news-actions';
import { PlatformType } from './news-interfaces';

const loadNewsEpic = (action$: Observable<Action>) =>
  action$.pipe(
    ofType(loadNewsAction.submit),
    switchMap(() =>
      getNewsItems({
        platform: PlatformType.Extension
      })
    ),
    map(data => loadNewsAction.success(data)),
    catchError(err => of(loadNewsAction.fail(err.message)))
  );

const loadMoreNewsEpic = (action$: Observable<Action>, state$: Observable<RootState>) =>
  action$.pipe(
    ofType(loadMoreNewsAction.submit),
    withLoadedNews(state$),
    switchMap(([, lastNews]) =>
      getNewsItems({
        platform: PlatformType.Extension,
        timeLt: new Date(lastNews[lastNews.length - 1].createdAt).getTime().toString()
      })
    ),
    map(data => loadNewsAction.success(data)),
    catchError(err => of(loadNewsAction.fail(err.message)))
  );

export const newsEpics = combineEpics(loadNewsEpic, loadMoreNewsEpic);
