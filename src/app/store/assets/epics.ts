import axios from 'axios';
import { combineEpics, Epic } from 'redux-observable';
import { from, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { Action } from 'ts-action';
import { ofType, toPayload } from 'ts-action-operators';

import { fetchWhitelistTokens$ } from 'lib/apis/temple';

import { loadAccountTokensActions, loadTokensWhitelistActions } from './actions';
import { fetchAccountTokens } from './utils';

const loadAccountTokensEpic: Epic<Action> = action$ =>
  action$.pipe(
    ofType(loadAccountTokensActions.submit),
    toPayload(),
    switchMap(({ account, chainId }) =>
      from(fetchAccountTokens(account, chainId)).pipe(
        map(tokens => tokens.map(t => t.slug)),
        map(slugs => loadAccountTokensActions.success({ account, chainId, slugs })),
        catchError(err => of(loadAccountTokensActions.fail({ code: axios.isAxiosError(err) ? err.code : undefined })))
      )
    )
  );

const loadTokensWhitelistEpic: Epic<Action> = action$ =>
  action$.pipe(
    ofType(loadTokensWhitelistActions.submit),
    switchMap(() =>
      fetchWhitelistTokens$().pipe(
        map(loadTokensWhitelistActions.success),
        catchError(err => of(loadTokensWhitelistActions.fail({ code: axios.isAxiosError(err) ? err.code : undefined })))
      )
    )
  );

export const assetsEpics = combineEpics(loadAccountTokensEpic, loadTokensWhitelistEpic);
