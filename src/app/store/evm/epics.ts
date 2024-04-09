import { combineEpics, Epic } from 'redux-observable';
import { catchError, concatMap, from, of, switchMap } from 'rxjs';
import { ofType, toPayload } from 'ts-action-operators';

import { getEVMData } from 'lib/apis/temple/endpoints/evm-data';

import { loadEVMDataActions } from './actions';
import { proceedLoadedEVMAssetsAction } from './assets/actions';
import { proceedLoadedEVMBalancesAction } from './balances/actions';

const loadEVMDataEpic: Epic = action$ =>
  action$.pipe(
    ofType(loadEVMDataActions.submit),
    toPayload(),
    switchMap(({ publicKeyHash, chainIds, quoteCurrency }) =>
      from(getEVMData(publicKeyHash, chainIds, quoteCurrency)).pipe(
        concatMap(data => [
          proceedLoadedEVMAssetsAction({ publicKeyHash, data }),
          proceedLoadedEVMBalancesAction({ publicKeyHash, data })
        ]),
        catchError(err => of(loadEVMDataActions.fail(err.message)))
      )
    )
  );

export const evmEpics = combineEpics(loadEVMDataEpic);
