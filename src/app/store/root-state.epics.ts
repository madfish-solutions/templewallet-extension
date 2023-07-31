import { combineEpics, createEpicMiddleware } from 'redux-observable';
import { catchError } from 'rxjs/operators';

import { notificationsEpics } from 'lib/notifications';

import { abTestingEpics } from './ab-testing/epics';
import { advertisingEpics } from './advertising/epics';
import { balancesEpics } from './balances/epics';
import { buyWithCreditCardEpics } from './buy-with-credit-card/epics';
import { currencyEpics } from './currency/epics';
import { partnersPromotionEpics } from './partners-promotion/epics';
import { swapEpics } from './swap/epics';
import { tokensMetadataEpics } from './tokens-metadata/epics';

const allEpics = combineEpics(
  currencyEpics,
  advertisingEpics,
  notificationsEpics,
  swapEpics,
  partnersPromotionEpics,
  balancesEpics,
  tokensMetadataEpics,
  abTestingEpics,
  buyWithCreditCardEpics
);

export const epicMiddleware = createEpicMiddleware();

export const rootEpic: typeof allEpics = (action$, store$, dependencies) =>
  allEpics(action$, store$, dependencies).pipe(
    catchError((error, source) => {
      console.error(error);

      return source;
    })
  );
