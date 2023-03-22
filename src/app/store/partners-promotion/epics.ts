import { combineEpics, Epic } from 'redux-observable';
import { from, Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Action } from 'ts-action';
import { ofType, toPayload } from 'ts-action-operators';

import { getOptimalPromotionImage$ } from 'lib/apis/optimal';

import { loadPartnersPromoAction } from './actions';

const loadPartnersPromotionEpic: Epic = (action$: Observable<Action>) =>
  action$.pipe(
    ofType(loadPartnersPromoAction.submit),
    toPayload(),
    switchMap(adType =>
      getOptimalPromotionImage$(adType).pipe(
        switchMap(optimalPromo =>
          from(fetch(optimalPromo.image)).pipe(
            map(res => {
              if (res.ok) {
                return loadPartnersPromoAction.success(optimalPromo);
              }

              return loadPartnersPromoAction.fail('Promotion loading failed');
            })
          )
        )
      )
    )
  );

export const partnersPromotionEpics = combineEpics(loadPartnersPromotionEpic);
