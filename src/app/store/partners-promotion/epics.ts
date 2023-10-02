import { combineEpics, Epic } from 'redux-observable';
import { of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { ofType, toPayload } from 'ts-action-operators';

import { getOptimalPromotionImage$ } from 'lib/apis/optimal';

import { loadPartnersPromoAction } from './actions';

const loadPartnersPromotionEpic: Epic = action$ =>
  action$.pipe(
    ofType(loadPartnersPromoAction.submit),
    toPayload(),
    switchMap(({ optimalPromoVariantEnum, accountAddress }) =>
      getOptimalPromotionImage$(optimalPromoVariantEnum, accountAddress).pipe(
        map(optimalPromo => loadPartnersPromoAction.success(optimalPromo)),
        catchError(() => of(loadPartnersPromoAction.fail('Promotion loading failed')))
      )
    )
  );

export const partnersPromotionEpics = combineEpics(loadPartnersPromotionEpic);
