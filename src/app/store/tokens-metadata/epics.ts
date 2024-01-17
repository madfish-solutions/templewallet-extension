import { combineEpics, Epic } from 'redux-observable';
import { from, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { ofType, toPayload } from 'ts-action-operators';

import { loadTokensMetadata } from 'lib/metadata/fetch';

import { loadTokensWhitelistActions } from '../assets/actions';

import {
  putTokensMetadataAction,
  loadTokensMetadataAction,
  addWhitelistTokensMetadataAction,
  resetTokensMetadataLoadingAction
} from './actions';

const addWhitelistMetadataEpic: Epic = action$ =>
  action$.pipe(ofType(loadTokensWhitelistActions.success), toPayload(), map(addWhitelistTokensMetadataAction));

const loadTokensMetadataEpic: Epic = action$ =>
  action$.pipe(
    ofType(loadTokensMetadataAction),
    toPayload(),
    switchMap(({ rpcUrl, slugs }) =>
      from(loadTokensMetadata(rpcUrl, slugs)).pipe(
        map(records => putTokensMetadataAction({ records, resetLoading: true })),
        catchError(() => of(resetTokensMetadataLoadingAction()))
      )
    )
  );

export const tokensMetadataEpics = combineEpics(addWhitelistMetadataEpic, loadTokensMetadataEpic);
