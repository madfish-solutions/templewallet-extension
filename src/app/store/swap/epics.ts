import { isDefined } from '@rnw-community/shared';
import { BigNumber } from 'bignumber.js';
import { combineEpics, Epic } from 'redux-observable';
import { catchError, from, map, of, switchMap } from 'rxjs';
import { ofType, toPayload } from 'ts-action-operators';

import { fetchRoute3Dexes$ } from 'lib/apis/route3/fetch-route3-dexes';
import { fetchRoute3SwapParams } from 'lib/apis/route3/fetch-route3-swap-params';
import { fetchgetRoute3Tokens } from 'lib/apis/route3/fetch-route3-tokens';
import { Route3SwapParamsRequest, Route3SwapParamsRequestRaw } from 'lib/route3/interfaces';

import { loadSwapDexesAction, loadSwapParamsAction, loadSwapTokensAction, resetSwapParamsAction } from './actions';

const isAmountDefined = (
  requestParams: Route3SwapParamsRequest | Route3SwapParamsRequestRaw
): requestParams is Route3SwapParamsRequest =>
  isDefined(requestParams.amount) &&
  new BigNumber(requestParams.amount).isGreaterThan(0) &&
  requestParams.fromSymbol.length > 0 &&
  requestParams.toSymbol.length > 0;

const loadSwapParamsEpic: Epic = action$ =>
  action$.pipe(
    ofType(loadSwapParamsAction.submit),
    toPayload(),
    switchMap(payload => {
      if (isAmountDefined(payload)) {
        return from(fetchRoute3SwapParams(payload)).pipe(
          map(params => loadSwapParamsAction.success(params)),
          catchError(error => of(loadSwapParamsAction.fail(error.message)))
        );
      }

      return of(resetSwapParamsAction());
    })
  );

const loadSwapTokensEpic: Epic = action$ =>
  action$.pipe(
    ofType(loadSwapTokensAction.submit),
    switchMap(() =>
      fetchgetRoute3Tokens().pipe(
        map(tokens => loadSwapTokensAction.success(tokens)),
        catchError(err => of(loadSwapTokensAction.fail(err.message)))
      )
    )
  );

const loadSwapDexesEpic: Epic = action$ =>
  action$.pipe(
    ofType(loadSwapDexesAction.submit),
    switchMap(() =>
      fetchRoute3Dexes$().pipe(
        map(dexes => loadSwapDexesAction.success(dexes)),
        catchError(err => of(loadSwapDexesAction.fail(err.message)))
      )
    )
  );

export const swapEpics = combineEpics(loadSwapParamsEpic, loadSwapTokensEpic, loadSwapDexesEpic);
