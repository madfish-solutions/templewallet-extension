import { combineEpics, Epic } from 'redux-observable';
import { of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { ofType, toPayload } from 'ts-action-operators';

import { loadTokensMetadata$ } from 'lib/metadata/fetch';
import { buildTokenMetadataFromWhitelist } from 'lib/metadata/utils';

import { loadTokensWhitelistActions } from '../assets/actions';

import {
  putTokensMetadataAction,
  loadTokensMetadataAction,
  addTokensMetadataAction,
  resetTokensMetadataLoadingAction
} from './actions';

const addWhitelistMetadataEpic: Epic = action$ =>
  action$.pipe(
    ofType(loadTokensWhitelistActions.success),
    toPayload(),
    map(tokens => tokens.map(buildTokenMetadataFromWhitelist)),
    map(addTokensMetadataAction)
  );

const loadTokensMetadataEpic: Epic = action$ =>
  action$.pipe(
    ofType(loadTokensMetadataAction),
    toPayload(),
    switchMap(({ rpcUrl, slugs }) =>
      loadTokensMetadata$(rpcUrl, slugs).pipe(
        map(putTokensMetadataAction),
        catchError(() => of(resetTokensMetadataLoadingAction()))
      )
    )
  );

export const tokensMetadataEpics = combineEpics(addWhitelistMetadataEpic, loadTokensMetadataEpic);
