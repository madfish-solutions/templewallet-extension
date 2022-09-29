import { combineEpics } from 'redux-observable';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { Action } from 'ts-action';
import { ofType } from 'ts-action-operators';

import { getNewsItems } from 'lib/templewallet-api/news';

import { loadNewsAction } from './news-actions';
import { PlatformType } from './news-interfaces';

const loadNewsEpic = (action$: Observable<Action>) =>
  action$.pipe(
    ofType(loadNewsAction.submit),
    switchMap(() =>
      getNewsItems({
        platform: PlatformType.Extension,
        timeGt: new Date().toISOString()
      })
    ),
    map(data => loadNewsAction.success(data)),
    catchError(err => of(loadNewsAction.fail(err.message)))
  );

export const newsEpics = combineEpics(loadNewsEpic);
