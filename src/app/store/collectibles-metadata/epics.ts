import { combineEpics, Epic } from 'redux-observable';
import { of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { ofType, toPayload } from 'ts-action-operators';

import { loadTokensMetadata$ } from 'lib/metadata/fetch';

import {
  loadCollectiblesMetadataAction,
  putCollectiblesMetadataAction,
  resetCollectiblesMetadataLoadingAction
} from './actions';

const loadCollectiblesMetadataEpic: Epic = action$ =>
  action$.pipe(
    ofType(loadCollectiblesMetadataAction),
    toPayload(),
    switchMap(({ rpcUrl, slugs }) =>
      loadTokensMetadata$(rpcUrl, slugs).pipe(
        map(data => putCollectiblesMetadataAction(data)),
        catchError(() => of(resetCollectiblesMetadataLoadingAction()))
      )
    )
  );

export const collectiblesMetadataEpics = combineEpics(loadCollectiblesMetadataEpic);
