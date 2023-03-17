import { combineEpics } from 'redux-observable';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { Action } from 'ts-action';
import { ofType, toPayload } from 'ts-action-operators';

import { getOptimalPromotionImage$ } from 'lib/apis/optimal';

import { loadPartnersPromoAction } from './actions';

const loadPartnersPromotionEpic = (action$: Observable<Action>) =>
  action$.pipe(
    ofType(loadPartnersPromoAction.submit),
    toPayload(),
    switchMap(adType =>
      getOptimalPromotionImage$(adType).pipe(
        map(optimalPromotion => loadPartnersPromoAction.success(optimalPromotion)),
        catchError(error => of(loadPartnersPromoAction.fail(error)))
      )
    )
  );

export const partnersPromotionEpics = combineEpics(loadPartnersPromotionEpic);
