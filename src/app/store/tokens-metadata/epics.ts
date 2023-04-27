import { combineEpics, Epic } from 'redux-observable';
import { Observable, of } from 'rxjs';
import { catchError, concatMap, map, switchMap } from 'rxjs/operators';
import { Action } from 'ts-action';
import { ofType, toPayload } from 'ts-action-operators';

import {
  addTokensMetadataAction,
  loadTokenMetadataActions,
  loadTokensMetadataAction,
  loadTokenSuggestionActions,
  loadWhitelistAction
} from './actions';
import { loadTokenMetadata$, loadTokensMetadata$, loadWhitelist$ } from './utils';

const loadWhitelistEpic: Epic = (action$: Observable<Action>) =>
  action$.pipe(
    ofType(loadWhitelistAction.submit),
    toPayload(),
    switchMap(({ selectedRpcUrl }) =>
      loadWhitelist$(selectedRpcUrl).pipe(
        concatMap(tokensMetadata => [loadWhitelistAction.success(tokensMetadata)]),
        catchError(err => of(loadWhitelistAction.fail(err.message)))
      )
    )
  );

const loadTokenSuggestionEpic = (action$: Observable<Action>) =>
  action$.pipe(
    ofType(loadTokenSuggestionActions.submit),
    toPayload(),
    switchMap(({ tezos, id, address }) =>
      loadTokenMetadata$(tezos, address, id).pipe(
        concatMap(tokenMetadata => [
          loadTokenSuggestionActions.success(tokenMetadata),
          addTokensMetadataAction([tokenMetadata])
        ]),
        catchError(error => {
          console.error(error);

          return of(loadTokenSuggestionActions.fail(error.message));
        })
      )
    )
  );

const loadTokenMetadataEpic = (action$: Observable<Action>) =>
  action$.pipe(
    ofType(loadTokenMetadataActions.submit),
    toPayload(),
    concatMap(({ tezos, id, address }) =>
      loadTokenMetadata$(tezos, address, id).pipe(
        concatMap(tokenMetadata => [
          loadTokenMetadataActions.success(tokenMetadata),
          addTokensMetadataAction([tokenMetadata])
        ]),
        catchError(err => of(loadTokenMetadataActions.fail(err.message)))
      )
    )
  );

const loadTokensMetadataEpic = (action$: Observable<Action>) =>
  action$.pipe(
    ofType(loadTokensMetadataAction),
    toPayload(),
    switchMap(({ tezos, slugs }) =>
      loadTokensMetadata$(tezos, slugs).pipe(
        map(tokensMetadata => addTokensMetadataAction(tokensMetadata)),
        catchError(err => of(loadTokenMetadataActions.fail(err.message)))
      )
    )
  );

export const tokensMetadataEpics = combineEpics(
  loadWhitelistEpic,
  loadTokenSuggestionEpic,
  loadTokenMetadataEpic,
  loadTokensMetadataEpic
);
