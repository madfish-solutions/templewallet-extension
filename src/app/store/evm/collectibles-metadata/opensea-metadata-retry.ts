import { Action } from 'redux';
import { Epic } from 'redux-observable';
import { EMPTY, from, of, timer } from 'rxjs';
import { catchError, filter, finalize, mergeMap, takeUntil, withLatestFrom } from 'rxjs/operators';
import { ofType } from 'ts-action-operators';

import { RootState } from 'app/store/root-state.type';
import { getOpenseaMultichainNftsMetadata, OpenseaNftDetailed } from 'lib/apis/temple/endpoints/evm';
import { isAbortError, readRetryAfterMs } from 'lib/apis/utils';

import {
  loadOpenseaStorefrontCollectionAction,
  putEvmCollectiblesMetadataAction,
  retryOpenseaCollectiblesMetadataAction,
  RetryOpenseaCollectiblesMetadataPayload
} from './actions';
import { emptyAfterLoadError, isCollectiblesListingChange } from './metadata-load-shared';
import {
  actionsForStorefrontCollections,
  OPENSEA_RATE_LIMIT_RETRY_LIMIT,
  putOpenseaBatchRecords,
  putOpenseaRecordsAction,
  requestedStorefrontCollections,
  retryDelayMs
} from './opensea-metadata-load';
import { collectOpenseaMetadataRecords, loadOpenseaAccountNfts } from './opensea-records';
import {
  currentSharedStorefrontFillGeneration,
  finishSharedStorefrontCollectionLoad,
  sharedStorefrontCollectionsToLoad
} from './opensea-storefront';

const actionsForOpenseaRetryFailure = (error: unknown, payload: RetryOpenseaCollectiblesMetadataPayload) => {
  if (isAbortError(error)) return [];

  const delayMs = readRetryAfterMs(error);
  if (delayMs === undefined || payload.attempt >= OPENSEA_RATE_LIMIT_RETRY_LIMIT) {
    console.error(error);

    return [];
  }

  return [retryOpenseaCollectiblesMetadataAction({ ...payload, attempt: payload.attempt + 1, delayMs })];
};

const runOpenseaCollectionLoad = async (
  payload: {
    publicKeyHash: HexString;
    chainId: number;
    collection: string;
    contractAddress: string;
    attempt?: number;
  },
  state: RootState,
  signal?: AbortSignal,
  generation = currentSharedStorefrontFillGeneration()
) => {
  const release = () => finishSharedStorefrontCollectionLoad(payload.chainId, payload.contractAddress, generation);
  const slugs = Object.keys(state.evmAssets.collectibles[payload.publicKeyHash]?.[payload.chainId] ?? {});
  if (!slugs.length) {
    release();

    return [];
  }

  try {
    const loaded = await loadOpenseaAccountNfts(
      payload.chainId,
      payload.publicKeyHash,
      slugs,
      payload.collection,
      signal
    );
    const stored = state.evmCollectiblesMetadata.metadataRecord[payload.chainId];
    const records = collectOpenseaMetadataRecords(slugs, loaded.nfts, [], [], undefined, stored);
    const actions: Action[] = [];
    const putAction = putOpenseaRecordsAction(payload.chainId, records);
    if (putAction) actions.push(putAction);

    if (!loaded.retry) {
      release();

      return actions;
    }

    const attempt = (payload.attempt ?? 0) + 1;
    if (attempt > OPENSEA_RATE_LIMIT_RETRY_LIMIT) {
      console.error('OpenSea collection metadata stayed rate limited');
      release();

      return actions;
    }

    actions.push(
      retryOpenseaCollectiblesMetadataAction({
        kind: 'collection',
        publicKeyHash: payload.publicKeyHash,
        chainId: payload.chainId,
        collection: payload.collection,
        contractAddress: payload.contractAddress,
        attempt,
        delayMs: retryDelayMs(loaded.retry.readyAt)
      })
    );

    return actions;
  } catch (error) {
    if (!isAbortError(error)) console.error(error);
    release();

    return [];
  }
};

const runOpenseaRetry = async (
  payload: RetryOpenseaCollectiblesMetadataPayload,
  state: RootState,
  signal?: AbortSignal,
  generation = currentSharedStorefrontFillGeneration()
) => {
  if (payload.attempt > OPENSEA_RATE_LIMIT_RETRY_LIMIT) {
    if (payload.kind === 'collection')
      finishSharedStorefrontCollectionLoad(payload.chainId, payload.contractAddress, generation);

    return [];
  }

  if (payload.kind === 'batch') {
    try {
      const results = await getOpenseaMultichainNftsMetadata(payload.refs.slice(), signal);
      const actions = putOpenseaBatchRecords(payload.refs, results, state.evmCollectiblesMetadata.metadataRecord);
      const collectibles = state.evmAssets.collectibles[payload.publicKeyHash];
      const byChain = new Map<number, OpenseaNftDetailed[]>();

      payload.refs.forEach((ref, index) => {
        const nft = results[index];
        if (!nft) return;

        const group = byChain.get(ref.chainId) ?? [];
        group.push(nft);
        byChain.set(ref.chainId, group);
      });

      for (const [chainId, nfts] of byChain) {
        const slugs = Object.keys(collectibles?.[chainId] ?? {});
        const stored = state.evmCollectiblesMetadata.metadataRecord[chainId];
        const namedSlugs = new Set(slugs.filter(slug => stored?.[slug]?.openseaCollection));

        for (const action of actions) {
          if (!putEvmCollectiblesMetadataAction.match(action) || action.payload.chainId !== chainId) continue;

          for (const [slug, metadata] of Object.entries(action.payload.records)) {
            if (metadata?.openseaCollection) namedSlugs.add(slug);
          }
        }

        actions.push(
          ...actionsForStorefrontCollections(
            payload.publicKeyHash,
            chainId,
            sharedStorefrontCollectionsToLoad(chainId, nfts, slugs, stored, namedSlugs, requestedStorefrontCollections)
          )
        );
      }

      return actions;
    } catch (error) {
      if (isAbortError(error)) return [];

      return actionsForOpenseaRetryFailure(error, payload);
    }
  }

  if (payload.kind === 'collection') {
    return runOpenseaCollectionLoad(payload, state, signal, generation);
  }

  const slugs = Object.keys(state.evmAssets.collectibles[payload.publicKeyHash]?.[payload.chainId] ?? {});
  if (!slugs.length) return [];

  try {
    const loaded = await loadOpenseaAccountNfts(payload.chainId, payload.publicKeyHash, slugs, undefined, signal);
    const records = collectOpenseaMetadataRecords(
      slugs,
      loaded.nfts,
      [],
      [],
      undefined,
      state.evmCollectiblesMetadata.metadataRecord[payload.chainId]
    );
    const actions: Action[] = [];
    const putAction = putOpenseaRecordsAction(payload.chainId, records);
    if (putAction) actions.push(putAction);
    const namedSlugs = new Set(Object.keys(records).filter(slug => records[slug]?.openseaCollection));

    actions.push(
      ...actionsForStorefrontCollections(
        payload.publicKeyHash,
        payload.chainId,
        sharedStorefrontCollectionsToLoad(
          payload.chainId,
          loaded.nfts,
          slugs,
          state.evmCollectiblesMetadata.metadataRecord[payload.chainId],
          namedSlugs,
          requestedStorefrontCollections
        )
      )
    );

    if (!loaded.retry) return actions;

    const attempt = payload.attempt + 1;
    if (attempt > OPENSEA_RATE_LIMIT_RETRY_LIMIT) {
      console.error('OpenSea account metadata stayed rate limited');

      return actions;
    }

    actions.push(
      retryOpenseaCollectiblesMetadataAction({
        kind: 'account',
        publicKeyHash: payload.publicKeyHash,
        chainId: payload.chainId,
        attempt,
        delayMs: retryDelayMs(loaded.retry.readyAt)
      })
    );

    return actions;
  } catch (error) {
    if (!isAbortError(error)) console.error(error);

    return [];
  }
};

export const retryOpenseaCollectiblesMetadataEpic: Epic<Action, Action, RootState> = (action$, state$) =>
  action$.pipe(
    ofType(retryOpenseaCollectiblesMetadataAction),
    mergeMap(action => {
      const abortController = new AbortController();
      const generation = currentSharedStorefrontFillGeneration();
      let started = false;

      return timer(action.payload.delayMs).pipe(
        withLatestFrom(state$),
        mergeMap(([, state]) => {
          started = true;

          return from(runOpenseaRetry(action.payload, state, abortController.signal, generation));
        }),
        mergeMap(actions => from(actions)),
        takeUntil(action$.pipe(filter(isCollectiblesListingChange))),
        finalize(() => {
          abortController.abort();
          if (!started && action.payload.kind === 'collection') {
            finishSharedStorefrontCollectionLoad(action.payload.chainId, action.payload.contractAddress, generation);
          }
        }),
        catchError(emptyAfterLoadError)
      );
    })
  );

export const loadOpenseaStorefrontCollectionEpic: Epic<Action, Action, RootState> = (action$, state$) =>
  action$.pipe(
    ofType(loadOpenseaStorefrontCollectionAction),
    mergeMap(action => {
      const abortController = new AbortController();
      const generation = currentSharedStorefrontFillGeneration();

      return of(action).pipe(
        withLatestFrom(state$),
        mergeMap(([{ payload }, state]) =>
          from(runOpenseaCollectionLoad(payload, state, abortController.signal, generation))
        ),
        mergeMap(actions => from(actions)),
        takeUntil(action$.pipe(filter(isCollectiblesListingChange))),
        finalize(() => abortController.abort()),
        catchError(error => {
          if (!isAbortError(error)) console.error(error);
          finishSharedStorefrontCollectionLoad(action.payload.chainId, action.payload.contractAddress, generation);

          return EMPTY;
        })
      );
    })
  );
