import { combineEpics, Epic } from 'redux-observable';
import { from, of } from 'rxjs';
import { catchError, concatMap, map } from 'rxjs/operators';
import { ofType, toPayload } from 'ts-action-operators';

import { loadTokensMetadata } from 'lib/metadata/fetch';

import {
  loadCollectiblesMetadataAction,
  putCollectiblesMetadataAction,
  resetCollectiblesMetadataLoadingAction
} from './actions';

const loadCollectiblesMetadataEpic: Epic = action$ =>
  action$.pipe(
    ofType(loadCollectiblesMetadataAction),
    toPayload(),
    concatMap(({ network, slugs }) =>
      from(loadTokensMetadata(network, slugs)).pipe(
        map(records => putCollectiblesMetadataAction({ records, resetLoading: true })),
        catchError(() => of(resetCollectiblesMetadataLoadingAction()))
      )
    )
  );

export const collectiblesMetadataEpics = combineEpics(loadCollectiblesMetadataEpic);
