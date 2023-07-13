import { combineEpics, Epic } from 'redux-observable';
import { Observable, of } from 'rxjs';
import { catchError, concatMap, map, switchMap } from 'rxjs/operators';
import { Action } from 'ts-action';
import { ofType, toPayload } from 'ts-action-operators';

import { loadOneTokenMetadata$, loadTokensMetadata$, loadWhitelist$ } from 'lib/metadata/fetch';

import {
  addTokensMetadataAction,
  loadOneTokenMetadataActions,
  loadTokensMetadataAction,
  loadTokenSuggestionActions,
  loadWhitelistAction
} from './actions';

const loadWhitelistEpic: Epic = (action$: Observable<Action>) =>
  action$.pipe(
    ofType(loadWhitelistAction.submit),
    switchMap(() =>
      loadWhitelist$().pipe(
        concatMap(tokensMetadata => [loadWhitelistAction.success(tokensMetadata)]),
        catchError(err => of(loadWhitelistAction.fail(err.message)))
      )
    )
  );

const loadTokenSuggestionEpic = (action$: Observable<Action>) =>
  action$.pipe(
    ofType(loadTokenSuggestionActions.submit),
    toPayload(),
    switchMap(({ rpcUrl, id, address }) =>
      loadOneTokenMetadata$(rpcUrl, address, id).pipe(
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

const loadOneTokenMetadataEpic = (action$: Observable<Action>) =>
  action$.pipe(
    ofType(loadOneTokenMetadataActions.submit),
    toPayload(),
    concatMap(({ rpcUrl, id, address }) =>
      loadOneTokenMetadata$(rpcUrl, address, id).pipe(
        concatMap(tokenMetadata => [
          loadOneTokenMetadataActions.success(tokenMetadata),
          addTokensMetadataAction([tokenMetadata])
        ]),
        catchError(err => of(loadOneTokenMetadataActions.fail(err.message)))
      )
    )
  );

const loadTokensMetadataEpic = (action$: Observable<Action>) =>
  action$.pipe(
    ofType(loadTokensMetadataAction),
    toPayload(),
    switchMap(({ rpcUrl, slugs }) =>
      loadTokensMetadata$(rpcUrl, slugs).pipe(
        map(tokensMetadata => addTokensMetadataAction(tokensMetadata)),
        catchError(err => of(loadOneTokenMetadataActions.fail(err.message)))
      )
    )
  );

export const tokensMetadataEpics = combineEpics(
  loadWhitelistEpic,
  loadTokenSuggestionEpic,
  loadOneTokenMetadataEpic,
  loadTokensMetadataEpic
);
