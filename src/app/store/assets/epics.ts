import axios from 'axios';
import { Action } from 'redux';
import { combineEpics, Epic } from 'redux-observable';
import { from, of, catchError, map, mergeMap, switchMap, concatMap, EMPTY } from 'rxjs';
import { ofType, toPayload } from 'ts-action-operators';

import { fetchWhitelistTokens } from 'lib/apis/temple';
import { fetchScamlistTokens } from 'lib/apis/temple/scamlist-tokens';
import { toLatestValue } from 'lib/store';

import { putTokensBalancesAction } from '../balances/actions';
import { fixBalances } from '../balances/utils';
import { putCollectiblesMetadataAction } from '../collectibles-metadata/actions';
import type { RootState } from '../root-state.type';
import { putTokensMetadataAction } from '../tokens-metadata/actions';

import {
  loadAccountTokensActions,
  loadAccountCollectiblesActions,
  loadTokensWhitelistActions,
  loadTokensScamlistActions,
  addAccountTokensAction
} from './actions';
import { loadAccountTokens, loadAccountCollectibles, mergeAssetsMetadata } from './utils';

const loadAccountTokensEpic: Epic<Action, Action, RootState> = (action$, state$) =>
  action$.pipe(
    ofType(loadAccountTokensActions.submit),
    toPayload(),
    toLatestValue(state$),
    switchMap(([{ account, networks }, state]) => {
      const allMetadata = mergeAssetsMetadata(state.tokensMetadata.metadataRecord, state.collectiblesMetadata.records);

      return from(networks).pipe(
        mergeMap(network => {
          const chainId = network.chainId;

          return from(loadAccountTokens(account, chainId, network.rpcBaseURL, allMetadata)).pipe(
            concatMap(({ slugs, balances, newMeta }) => [
              addAccountTokensAction({ account, chainId, slugs }),
              putTokensBalancesAction({ publicKeyHash: account, chainId, balances: fixBalances(balances) }),
              putTokensMetadataAction({ records: newMeta })
            ]),
            catchError(error => {
              console.error(error);

              return EMPTY;
            })
          );
        })
      );
    })
  );

const loadAccountCollectiblesEpic: Epic<Action, Action, RootState> = (action$, state$) =>
  action$.pipe(
    ofType(loadAccountCollectiblesActions.submit),
    toPayload(),
    toLatestValue(state$),
    switchMap(([{ account, chainId }, state]) =>
      from(
        loadAccountCollectibles(
          account,
          chainId,
          mergeAssetsMetadata(state.tokensMetadata.metadataRecord, state.collectiblesMetadata.records)
        )
      ).pipe(
        concatMap(({ slugs, balances, newMeta }) => [
          loadAccountCollectiblesActions.success({ account, chainId, slugs }),
          putTokensBalancesAction({ publicKeyHash: account, chainId, balances: fixBalances(balances) }),
          putCollectiblesMetadataAction({ records: newMeta })
        ]),
        catchError(err =>
          of(loadAccountCollectiblesActions.fail({ code: axios.isAxiosError(err) ? err.code : undefined }))
        )
      )
    )
  );

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

export const assetsEpics = combineEpics(
  loadAccountTokensEpic,
  loadAccountCollectiblesEpic,
  loadTokensWhitelistEpic,
  loadTokensScamlistEpic
);
