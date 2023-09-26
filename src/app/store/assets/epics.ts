import axios from 'axios';
import { combineEpics, Epic } from 'redux-observable';
import { from, of, concatMap } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { Action } from 'ts-action';
import { ofType, toPayload } from 'ts-action-operators';

import { fetchWhitelistTokens } from 'lib/apis/temple';

import { putTokensBalancesAction } from '../balances/actions';
import { addTokensMetadataOfFetchedAction, addTokensMetadataOfTzktAction } from '../tokens-metadata/actions';
import { loadAccountTokensActions, loadAccountCollectiblesActions, loadTokensWhitelistActions } from './actions';
import { loadAccountTokens, loadAccountCollectibles } from './utils';

const loadAccountTokensEpic: Epic<Action> = action$ =>
  action$.pipe(
    ofType(loadAccountTokensActions.submit),
    toPayload(),
    switchMap(({ account, chainId }) =>
      from(loadAccountTokens(account, chainId)).pipe(
        concatMap(({ slugs, tzktAssetsWithMeta, metadatas, balances }) => [
          loadAccountTokensActions.success({ account, chainId, slugs }),
          putTokensBalancesAction({ publicKeyHash: account, chainId, balances }),
          addTokensMetadataOfFetchedAction(metadatas),
          addTokensMetadataOfTzktAction(tzktAssetsWithMeta)
        ]),
        catchError(err => of(loadAccountTokensActions.fail({ code: axios.isAxiosError(err) ? err.code : undefined })))
      )
    )
  );

const loadAccountCollectiblesEpic: Epic<Action> = action$ =>
  action$.pipe(
    ofType(loadAccountCollectiblesActions.submit),
    toPayload(),
    switchMap(({ account, chainId }) =>
      from(loadAccountCollectibles(account, chainId)).pipe(
        concatMap(({ slugs, tzktAssetsWithMeta, metadatas, balances }) => [
          loadAccountCollectiblesActions.success({ account, chainId, slugs }),
          putTokensBalancesAction({ publicKeyHash: account, chainId, balances }),
          addTokensMetadataOfFetchedAction(metadatas),
          addTokensMetadataOfTzktAction(tzktAssetsWithMeta)
        ]),
        catchError(err =>
          of(loadAccountCollectiblesActions.fail({ code: axios.isAxiosError(err) ? err.code : undefined }))
        )
      )
    )
  );

const loadTokensWhitelistEpic: Epic<Action> = action$ =>
  action$.pipe(
    ofType(loadTokensWhitelistActions.submit),
    switchMap(() =>
      from(fetchWhitelistTokens()).pipe(
        map(loadTokensWhitelistActions.success),
        catchError(err => of(loadTokensWhitelistActions.fail({ code: axios.isAxiosError(err) ? err.code : undefined })))
      )
    )
  );

export const assetsEpics = combineEpics(loadAccountTokensEpic, loadAccountCollectiblesEpic, loadTokensWhitelistEpic);
