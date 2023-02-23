import { combineEpics, Epic } from 'redux-observable';
import { map, Observable, of, switchMap } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Action } from 'ts-action';
import { ofType, toPayload } from 'ts-action-operators';

import { fetchRoute3Dexes$ } from 'lib/apis/route3/fetch-route3-dexes';
import { fetchRoute3SwapParams$ } from 'lib/apis/route3/fetch-route3-swap-params';
import { fetchgetRoute3Tokens } from 'lib/apis/route3/fetch-route3-tokens';

import { loadSwapDexesAction, loadSwapParamsAction, loadSwapTokensAction } from './actions';

const loadSwapTokensEpic: Epic = (action$: Observable<Action>) =>
  action$.pipe(
    ofType(loadSwapTokensAction.submit),
    switchMap(() =>
      fetchgetRoute3Tokens().pipe(
        map(tokens => loadSwapTokensAction.success(tokens)),
        catchError(err => of(loadSwapTokensAction.fail(err.message)))
      )
    )
  );

const loadSwapParamsEpic: Epic = (action$: Observable<Action>) =>
  action$.pipe(
    ofType(loadSwapParamsAction.submit),
    toPayload(),
    switchMap(payload =>
      fetchRoute3SwapParams$(payload).pipe(
        map(swapParams => loadSwapParamsAction.success(swapParams)),
        catchError(err => of(loadSwapParamsAction.fail(err.message)))
      )
    )
  );

const loadSwapDexesEpic: Epic = (action$: Observable<Action>) =>
  action$.pipe(
    ofType(loadSwapDexesAction.submit),
    switchMap(() =>
      fetchRoute3Dexes$().pipe(
        map(dexes => loadSwapDexesAction.success(dexes)),
        catchError(err => of(loadSwapDexesAction.fail(err.message)))
      )
    )
  );

export const swapEpics = combineEpics(loadSwapTokensEpic, loadSwapParamsEpic, loadSwapDexesEpic);
