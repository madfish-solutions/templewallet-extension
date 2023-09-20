import { combineEpics, Epic } from 'redux-observable';
import { of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { Action } from 'ts-action';
import { ofType, toPayload } from 'ts-action-operators';

import { loadTokensMetadata$ } from 'lib/metadata/fetch';
import { transformWhitelistToTokenMetadata } from 'lib/metadata/utils';

import { loadTokensWhitelistActions } from '../assets/actions';
import {
  putTokensMetadataAction,
  loadTokensMetadataAction,
  addTokensMetadataAction,
  resetTokensMetadataLoadingAction
} from './actions';

const addWhitelistMetadataEpic: Epic<Action> = action$ =>
  action$.pipe(
    ofType(loadTokensWhitelistActions.success),
    toPayload(),
    map(tokens =>
      tokens.map(token => transformWhitelistToTokenMetadata(token, token.contractAddress, token.fa2TokenId ?? 0))
    ),
    map(addTokensMetadataAction)
  );

const loadTokensMetadataEpic: Epic<Action> = action$ =>
  action$.pipe(
    ofType(loadTokensMetadataAction),
    toPayload(),
    switchMap(({ rpcUrl, slugs }) =>
      loadTokensMetadata$(rpcUrl, slugs).pipe(
        map(tokensMetadata => putTokensMetadataAction(tokensMetadata)),
        catchError(() => of(resetTokensMetadataLoadingAction()))
      )
    )
  );

export const tokensMetadataEpics = combineEpics(addWhitelistMetadataEpic, loadTokensMetadataEpic);
