import axios from 'axios';
import { Action } from 'redux';
import { combineEpics, Epic } from 'redux-observable';
import { from, of, concatMap } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { ofType, toPayload } from 'ts-action-operators';

import { fetchWhitelistTokens } from 'lib/apis/temple';
import { fetchScamlistTokens } from 'lib/apis/temple/scamlist-tokens';
import { toLatestValue } from 'lib/store';

import { putTokensBalancesAction } from '../balances/actions';
import { fixBalances } from '../balances/utils';
import { putCollectiblesMetadataAction } from '../collectibles-metadata/actions';
import { MetadataMap } from '../collectibles-metadata/state';
import type { RootState } from '../root-state.type';
import { putTokensMetadataAction } from '../tokens-metadata/actions';
import { MetadataRecords } from '../tokens-metadata/state';

import {
  loadAccountTokensActions,
  loadAccountCollectiblesActions,
  loadTokensWhitelistActions,
  loadTokensScamlistActions
} from './actions';
import { loadAccountTokens, loadAccountCollectibles } from './utils';

const loadAccountTokensEpic: Epic<Action, Action, RootState> = (action$, state$) =>
  action$.pipe(
    ofType(loadAccountTokensActions.submit),
    toPayload(),
    toLatestValue(state$),
    switchMap(([{ account, chainId }, state]) =>
      from(
        loadAccountTokens(
          account,
          chainId,
          mergeAssetsMetadata(state.tokensMetadata.metadataRecord, state.collectiblesMetadata.records)
        )
      ).pipe(
        concatMap(({ slugs, balances, newMeta }) => [
          loadAccountTokensActions.success({ account, chainId, slugs }),
          putTokensBalancesAction({ publicKeyHash: account, chainId, balances: fixBalances(balances) }),
          putTokensMetadataAction({ records: newMeta })
        ]),
        catchError(err => of(loadAccountTokensActions.fail({ code: axios.isAxiosError(err) ? err.code : undefined })))
      )
    )
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

const mergeAssetsMetadata = (tokensMetadata: MetadataRecords, collectiblesMetadata: MetadataMap) => {
  const map = new Map(Object.entries(tokensMetadata));

  for (const [slug, metadata] of collectiblesMetadata) {
    map.set(slug, metadata);
  }

  return map;
};
