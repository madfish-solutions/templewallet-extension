import { combineEpics, Epic } from 'redux-observable';
import { map, Observable, of, switchMap } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Action } from 'ts-action';
import { ofType } from 'ts-action-operators';

import { fetchRoute3Dexes$ } from 'lib/apis/route3/fetch-route3-dexes';
import { fetchgetRoute3Tokens } from 'lib/apis/route3/fetch-route3-tokens';

import { loadSwapDexesAction, loadSwapTokensAction } from './actions';

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

export const swapEpics = combineEpics(loadSwapTokensEpic, loadSwapDexesEpic);
