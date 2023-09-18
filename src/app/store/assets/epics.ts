import { combineEpics, Epic } from 'redux-observable';
import { from, Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { Action } from 'ts-action';
import { ofType, toPayload } from 'ts-action-operators';

import { loadAccountTokensActions } from './actions';
import { fetchAccountTokens } from './utils';

const loadAccountTokensEpic: Epic = (action$: Observable<Action>) =>
  action$.pipe(
    ofType(loadAccountTokensActions.submit),
    toPayload(),
    switchMap(({ account, chainId }) =>
      from(fetchAccountTokens(account, chainId)).pipe(
        map(tokens =>
          loadAccountTokensActions.success({
            account,
            chainId,
            slugs: tokens.map(t => t.slug)
          })
        ),
        catchError(err => of(loadAccountTokensActions.fail({ code: 404 })))
      )
    )
  );

export const assetsEpics = combineEpics(loadAccountTokensEpic);
