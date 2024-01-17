import { combineEpics, Epic } from 'redux-observable';
import { of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { ofType } from 'ts-action-operators';

import { getAdvertisingInfo$ } from 'lib/apis/temple';

import { loadAdvertisingPromotionActions } from './actions';

const loadActivePromotionEpic: Epic = action$ =>
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
