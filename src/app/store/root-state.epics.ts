import type { Action } from 'redux';
import { combineEpics, createEpicMiddleware } from 'redux-observable';
import { catchError } from 'rxjs/operators';

import { reportError, toError } from 'lib/analytics';

import { abTestingEpics } from './ab-testing/epics';
import { accountsInitializationEpics } from './accounts-initialization/epics';
import { buyWithCreditCardEpics } from './buy-with-credit-card/epics';
import { cryptoExchangeEpics } from './crypto-exchange/epics';
import { currencyEpics } from './currency/epics';
import { evmBalancesEpics } from './evm/balances/epics';
import { evmNoCategoryAssetsMetadataEpics } from './evm/no-category-assets-metadata/epics';
import { pendingEvmSwapsEpics } from './evm/pending-transactions/epics';
import { notificationsEpics } from './notifications/epics';
import { rewardsEpics } from './rewards/epics';
import type { RootState } from './root-state.type';
import { swapEpics } from './swap/epics';
import { assetsEpics } from './tezos/assets/epics';
import { balancesEpics } from './tezos/balances/epics';
import { collectiblesEpics } from './tezos/collectibles/epics';
import { collectiblesMetadataEpics } from './tezos/collectibles-metadata/epics';
import { tezosNoCategoryAssetsMetadataEpics } from './tezos/no-category-assets-metadata/epics';
import { pendingTezosTransactionsEpics } from './tezos/pending-transactions/epics';
import { tokensMetadataEpics } from './tezos/tokens-metadata/epics';

const allEpics = combineEpics(
  currencyEpics,
  notificationsEpics,
  swapEpics,
  balancesEpics,
  assetsEpics,
  tokensMetadataEpics,
  collectiblesMetadataEpics,
  tezosNoCategoryAssetsMetadataEpics,
  evmNoCategoryAssetsMetadataEpics,
  abTestingEpics,
  cryptoExchangeEpics,
  buyWithCreditCardEpics,
  collectiblesEpics,
  rewardsEpics,
  evmBalancesEpics,
  pendingEvmSwapsEpics,
  pendingTezosTransactionsEpics,
  accountsInitializationEpics
);

export const epicMiddleware = createEpicMiddleware<Action, Action, RootState>();

export const rootEpic: typeof allEpics = (action$, store$, dependencies) =>
  allEpics(action$, store$, dependencies).pipe(
    catchError((error, source) => {
      console.error(error);

      try {
        const state = store$.value;
        const { userId, isAnalyticsEnabled } = state.settings;
        void reportError(toError(error), userId, undefined, isAnalyticsEnabled, { source: 'Redux Epic' });
      } catch {
        // error
      }

      return source;
    })
  );
