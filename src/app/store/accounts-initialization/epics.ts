import { Epic, combineEpics } from 'redux-observable';
import { catchError, from, map, mergeMap, of } from 'rxjs';
import { ofType } from 'ts-action-operators';

import { accountIsInitialized } from 'lib/utils/account-is-initialized';

import { loadIsAccountInitializedActions } from './actions';

const loadIsAccountInitializedEpic: Epic = action$ =>
  action$.pipe(
    ofType(loadIsAccountInitializedActions.submit),
    mergeMap(({ payload }) => {
      const { tezosAddress, evmAddress, id } = payload;

      return from(accountIsInitialized(tezosAddress, evmAddress)).pipe(
        map(initialized => loadIsAccountInitializedActions.success({ id, initialized })),
        catchError(err => of(loadIsAccountInitializedActions.fail({ id, error: err.message })))
      );
    })
  );

export const accountsInitializationEpics = combineEpics(loadIsAccountInitializedEpic);
