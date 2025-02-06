import { chunk } from 'lodash';
import { Action } from 'redux';
import { combineEpics, Epic } from 'redux-observable';
import { EMPTY, forkJoin, from, of } from 'rxjs';
import { catchError, exhaustMap, map, switchMap, withLatestFrom } from 'rxjs/operators';
import { ofType, toPayload } from 'ts-action-operators';

import { RootState } from 'app/store/root-state.type';
import { METADATA_API_LOAD_CHUNK_SIZE } from 'lib/apis/temple';
import { fromAssetSlug } from 'lib/assets';
import { FetchedMetadataRecord, loadTokensMetadata } from 'lib/metadata/fetch';

import {
  putNoCategoryAssetsMetadataAction,
  loadNoCategoryAssetsMetadataAction,
  setNoCategoryAssetsMetadataLoadingAction,
  refreshNoCategoryAssetsMetadataActions
} from './actions';

const loadNoCategoryAssetsMetadataEpic: Epic = action$ =>
  action$.pipe(
    ofType(loadNoCategoryAssetsMetadataAction),
    toPayload(),
    switchMap(({ rpcUrl, chainId, associatedAccountPkh, slugs }) =>
      from(loadTokensMetadata(rpcUrl, slugs)).pipe(
        map(records =>
          putNoCategoryAssetsMetadataAction({ records, chainId, associatedAccountPkh, resetLoading: true })
        ),
        catchError(() => of(setNoCategoryAssetsMetadataLoadingAction(false)))
      )
    )
  );

const refreshAllAssetsMetadataEpic: Epic<Action, Action, RootState> = (action$, state$) =>
  action$.pipe(
    ofType(refreshNoCategoryAssetsMetadataActions.submit),
    toPayload(),
    withLatestFrom(state$),
    exhaustMap(([{ rpcUrls, associatedAccountPkh }, { noCategoryAssetMetadata }]) => {
      const { contractsChainIds, accountToAssetAssociations } = noCategoryAssetMetadata;
      const slugs = accountToAssetAssociations[associatedAccountPkh] || [];

      if (!slugs.length) {
        return EMPTY;
      }

      const slugsByRpcUrls = slugs.reduce<StringRecord<string[]>>((acc, slug) => {
        const [address] = fromAssetSlug(slug);
        const rpcUrl = rpcUrls[contractsChainIds[address]];
        if (rpcUrl) {
          acc[rpcUrl] = acc[rpcUrl] || [];
          acc[rpcUrl].push(slug);
        }

        return acc;
      }, {});

      return forkJoin(
        Object.entries(slugsByRpcUrls).map(([rpcUrl, slugs]) =>
          forkJoin(
            chunk(slugs, METADATA_API_LOAD_CHUNK_SIZE).map(slugsChunk =>
              loadTokensMetadata(rpcUrl, slugsChunk)
                .then(data => ({ data }))
                .catch(e => ({ e }))
            )
          )
        )
      );
    }),
    map(results => {
      const flattenedResults = results.flat();

      if (flattenedResults.every((r): r is { e: any } => 'e' in r) && flattenedResults.length) {
        return refreshNoCategoryAssetsMetadataActions.fail(flattenedResults[0].e);
      }

      return refreshNoCategoryAssetsMetadataActions.success(
        flattenedResults
          .filter((r): r is { data: FetchedMetadataRecord } => 'data' in r)
          .reduce<FetchedMetadataRecord>((acc, { data }) => Object.assign(acc, data), {})
      );
    }),
    catchError(err => of(refreshNoCategoryAssetsMetadataActions.fail(err)))
  );

export const noCategoryAssetsMetadataEpics = combineEpics(
  loadNoCategoryAssetsMetadataEpic,
  refreshAllAssetsMetadataEpic
);
