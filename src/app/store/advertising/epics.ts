import { combineEpics } from 'redux-observable';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { Action } from 'ts-action';
import { ofType } from 'ts-action-operators';

import { getAdvertisingInfo$ } from 'lib/templewallet-api';

import { loadAdvertisingPromotionActions } from './actions';

const loadActivePromotionEpic = (action$: Observable<Action>) =>
  action$.pipe(
    ofType(loadAdvertisingPromotionActions.submit),
    switchMap(() =>
      getAdvertisingInfo$().pipe(
        map(info => loadAdvertisingPromotionActions.success(info)),
        catchError(err => of(loadAdvertisingPromotionActions.fail(err.message)))
      )
    )
  );

export const advertisingEpics = combineEpics(loadActivePromotionEpic);
