import axios from 'axios';
import { combineEpics, Epic } from 'redux-observable';
import { from, of, catchError, map, switchMap } from 'rxjs';
import { ofType } from 'ts-action-operators';

import { fetchWhitelistTokens } from 'lib/apis/temple';
import { fetchScamlistTokens } from 'lib/apis/temple/scamlist-tokens';

import { loadTokensWhitelistActions, loadTokensScamlistActions } from './actions';

const loadTokensWhitelistEpic: Epic = action$ =>
  action$.pipe(
    ofType(loadTokensWhitelistActions.submit),
    switchMap(() =>
      from(fetchWhitelistTokens()).pipe(
        map(loadTokensWhitelistActions.success),
        catchError(err => of(loadTokensWhitelistActions.fail({ code: axios.isAxiosError(err) ? err.code : undefined })))
      )
    )
  );

const loadTokensScamlistEpic: Epic = action$ =>
  action$.pipe(
    ofType(loadTokensScamlistActions.submit),
    switchMap(() =>
      from(fetchScamlistTokens()).pipe(
        map(loadTokensScamlistActions.success),
        catchError(err => of(loadTokensScamlistActions.fail({ code: axios.isAxiosError(err) ? err.code : undefined })))
      )
    )
  );

export const assetsEpics = combineEpics(loadTokensWhitelistEpic, loadTokensScamlistEpic);
