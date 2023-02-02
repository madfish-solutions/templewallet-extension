import { combineEpics } from 'redux-observable';
import { map, Observable, of, switchMap } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Action } from 'ts-action';
import { ofType } from 'ts-action-operators';

import { getRoute3Tokens$ } from 'lib/apis/route3/get-route3-tokens';

import { loadRoute3TokensAction } from './actions';

const loadRoute3TokensEpic = (action$: Observable<Action>) =>
  action$.pipe(
    ofType(loadRoute3TokensAction.submit),
    switchMap(() =>
      getRoute3Tokens$().pipe(
        map(tokens => loadRoute3TokensAction.success(tokens)),
        catchError(err => of(loadRoute3TokensAction.fail(err.message)))
      )
    )
  );

export const route3Epics = combineEpics(loadRoute3TokensEpic);
