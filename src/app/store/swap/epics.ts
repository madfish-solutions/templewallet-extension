import { combineEpics, Epic } from 'redux-observable';
import { map, Observable, of, switchMap } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Action } from 'ts-action';
import { ofType, toPayload } from 'ts-action-operators';

import { fetchRoute3Dexes$ } from 'lib/apis/route3/fetch-route3-dexes';
import { fetchRoute3SwapParams$ } from 'lib/apis/route3/fetch-route3-swap-params';
import { fetchgetRoute3Tokens } from 'lib/apis/route3/fetch-route3-tokens';

import { loadRoute3DexesAction, loadRoute3SwapParamsAction, loadRoute3TokensAction } from './actions';

const loadRoute3TokensEpic: Epic = (action$: Observable<Action>) =>
  action$.pipe(
    ofType(loadRoute3TokensAction.submit),
    switchMap(() =>
      fetchgetRoute3Tokens().pipe(
        map(tokens => loadRoute3TokensAction.success(tokens)),
        catchError(err => of(loadRoute3TokensAction.fail(err.message)))
      )
    )
  );

const loadRoute3SwapParamsEpic: Epic = (action$: Observable<Action>) =>
  action$.pipe(
    ofType(loadRoute3SwapParamsAction.submit),
    toPayload(),
    switchMap(payload =>
      fetchRoute3SwapParams$(payload).pipe(
        map(swapParams => loadRoute3SwapParamsAction.success(swapParams)),
        catchError(err => of(loadRoute3SwapParamsAction.fail(err.message)))
      )
    )
  );

const loadRoute3DexesEpic: Epic = (action$: Observable<Action>) =>
  action$.pipe(
    ofType(loadRoute3DexesAction.submit),
    switchMap(() =>
      fetchRoute3Dexes$().pipe(
        map(dexes => loadRoute3DexesAction.success(dexes)),
        catchError(err => of(loadRoute3DexesAction.fail(err.message)))
      )
    )
  );

export const route3Epics = combineEpics(loadRoute3TokensEpic, loadRoute3SwapParamsEpic, loadRoute3DexesEpic);
