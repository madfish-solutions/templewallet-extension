import { Action } from 'redux';
import { Epic } from 'redux-observable';
import { EMPTY, from } from 'rxjs';
import { catchError, concatMap, filter, finalize, mergeMap, takeUntil } from 'rxjs/operators';

import { deadEvmCollectiblePreviewSlugs } from 'app/hooks/evm-collectible-dead-preview';
import { isOpenseaChainId } from 'app/store/evm/collectibles-inventory/chains';
import { RootState } from 'app/store/root-state.type';
import { OpenseaNftDetailed, OpenseaNftRef } from 'lib/apis/temple/endpoints/evm';
import { isAbortError } from 'lib/apis/utils';
import { toChainAssetSlug, toTokenSlug } from 'lib/assets/utils';
import { isTruthy } from 'lib/utils';
import { TempleChainKind } from 'temple/types';

import {
  cancelEvmCollectiblesMetadataLoadingAction,
  loadEvmCollectiblesMetadataAction,
  retryOpenseaCollectiblesMetadataAction
} from './actions';
import { emptyAfterLoadError, isCollectiblesListingChange } from './metadata-load-shared';
import { buildOpenseaMultichainRefBatches, openseaNftRefsFromVisibleSlugs } from './opensea-batches';
import {
  actionsForStorefrontCollections,
  loadOpenseaBatch,
  putOpenseaRecordsAction,
  requestedStorefrontCollections,
  retryDelayMs
} from './opensea-metadata-load';
import { collectOpenseaMetadataRecords, loadOpenseaAccountNfts } from './opensea-records';
import { cancelSharedStorefrontCollectionLoads, sharedStorefrontCollectionsToLoad } from './opensea-storefront';
import { isSharedStorefrontTokenId } from './utils';

/** Nameless collectibles already sent to OpenSea during this session. */
const collectionNameRequestedSlugs = new Set<string>();
/** Account pages already stored this session, keyed by account and chain. */
const loadedAccountPages = new Set<string>();

const accountPageKey = (publicKeyHash: HexString, chainId: number) => `${publicKeyHash}:${chainId}`;

const rememberRequestedCollectionNames = (refs: readonly OpenseaNftRef[], state: RootState) => {
  for (const ref of refs) {
    const assetSlug = toTokenSlug(ref.contractAddress, ref.tokenId);
    const metadata = state.evmCollectiblesMetadata.metadataRecord[ref.chainId]?.[assetSlug];
    const collectionKnown = isSharedStorefrontTokenId(ref.tokenId) ? metadata?.openseaCollection : metadata?.name;
    if (collectionKnown) continue;

    collectionNameRequestedSlugs.add(toChainAssetSlug(TempleChainKind.EVM, ref.chainId, assetSlug));
  }
};

const chainAssetSlugsFromVisible = (visibleSlugsByChain: Record<number, string[]>) =>
  Object.entries(visibleSlugsByChain).flatMap(([chainId, slugs]) =>
    slugs.map(slug => toChainAssetSlug(TempleChainKind.EVM, Number(chainId), slug))
  );

/**
 * OpenSea enrichment beside the development metadata loader.
 * Goldrush dumps and on-chain reads stay in that loader. This epic only asks OpenSea.
 */
const loadOpenseaForVisibleCollectibles = async (
  payload: ReturnType<typeof loadEvmCollectiblesMetadataAction>['payload'],
  state: RootState,
  signal: AbortSignal,
  previousRefsKey: { current: string }
): Promise<Action[]> => {
  if (state.settings.isTestnetModeEnabled) return [];

  const { publicKeyHash, chains, visibleSlugsByChain } = payload;
  const metadataRecord = state.evmCollectiblesMetadata.metadataRecord;
  const collectibles = state.evmAssets.collectibles[publicKeyHash];
  const requestedRefs = openseaNftRefsFromVisibleSlugs(
    chainAssetSlugsFromVisible(visibleSlugsByChain),
    metadataRecord,
    deadEvmCollectiblePreviewSlugs(),
    collectionNameRequestedSlugs
  ).filter(ref => isOpenseaChainId(ref.chainId));
  const batches = buildOpenseaMultichainRefBatches(requestedRefs, collectibles, metadataRecord);
  const openseaNftRefs = batches.flat();
  const refsKey = openseaNftRefs.map(ref => `${ref.chainId}:${ref.contractAddress}:${ref.tokenId}`).join('|');
  const chainIds = Array.from(
    new Set([...chains.map(chain => chain.chainId), ...openseaNftRefs.map(ref => ref.chainId)].filter(isOpenseaChainId))
  );
  const needsAccountPage = chainIds.some(chainId => {
    const slugs = collectibles?.[chainId];

    return (
      Boolean(slugs && Object.keys(slugs).length) && !loadedAccountPages.has(accountPageKey(publicKeyHash, chainId))
    );
  });

  if (!needsAccountPage && refsKey === previousRefsKey.current) return [];

  previousRefsKey.current = refsKey;
  rememberRequestedCollectionNames(requestedRefs, state);

  const emptyResults: Array<OpenseaNftDetailed | null> = [];
  const batchLoad = openseaNftRefs.length
    ? loadOpenseaBatch(batches, signal)
    : Promise.resolve({ results: emptyResults, retries: [] });
  const actions: Action[] = [];
  const accountNftsByChain = new Map<number, OpenseaNftDetailed[]>();

  await Promise.all(
    chainIds.map(async chainId => {
      const slugs = Object.keys(collectibles?.[chainId] ?? {});
      const key = accountPageKey(publicKeyHash, chainId);
      if (!slugs.length || loadedAccountPages.has(key)) return;

      try {
        const loaded = await loadOpenseaAccountNfts(chainId, publicKeyHash, slugs, undefined, signal);
        if (signal.aborted) return;

        loadedAccountPages.add(key);
        accountNftsByChain.set(chainId, loaded.nfts);

        if (loaded.retry) {
          actions.push(
            retryOpenseaCollectiblesMetadataAction({
              kind: 'account',
              publicKeyHash,
              chainId,
              attempt: 1,
              delayMs: retryDelayMs(loaded.retry.readyAt)
            })
          );
        }
      } catch (error) {
        if (isAbortError(error)) throw error;

        console.error(error);
      }
    })
  );

  const batch = await batchLoad;

  for (const retry of batch.retries) {
    actions.push(
      retryOpenseaCollectiblesMetadataAction({
        kind: 'batch',
        publicKeyHash,
        refs: retry.refs,
        attempt: 1,
        delayMs: retryDelayMs(retry.readyAt)
      })
    );
  }

  for (const chainId of chainIds) {
    const slugs = Object.keys(collectibles?.[chainId] ?? {});
    if (!slugs.length) continue;

    const accountNfts = accountNftsByChain.get(chainId) ?? [];
    const chainHasBatch = openseaNftRefs.some(ref => ref.chainId === chainId);
    if (!accountNfts.length && !chainHasBatch) continue;

    const records = collectOpenseaMetadataRecords(
      slugs,
      accountNfts,
      openseaNftRefs,
      batch.results,
      undefined,
      metadataRecord[chainId]
    );
    const putRecords = putOpenseaRecordsAction(chainId, records);
    const receivedNfts = accountNfts.slice();

    batch.results.forEach((nft, index) => {
      const ref = openseaNftRefs[index];
      if (!nft || !ref || ref.chainId !== chainId) return;

      receivedNfts.push(nft);
    });

    const namedSlugs = new Set(Object.keys(records).filter(slug => records[slug]?.openseaCollection));

    if (putRecords) actions.push(putRecords);

    actions.push(
      ...actionsForStorefrontCollections(
        publicKeyHash,
        chainId,
        sharedStorefrontCollectionsToLoad(
          chainId,
          receivedNfts,
          slugs,
          metadataRecord[chainId],
          namedSlugs,
          requestedStorefrontCollections
        )
      )
    );
  }

  return actions.filter(isTruthy);
};

let trackedAccount: HexString | undefined;

export const loadVisibleOpenseaCollectiblesEpic: Epic<Action, Action, RootState> = (action$, state$) => {
  const previousRefsKey = { current: '' };

  return action$.pipe(
    filter(
      action =>
        loadEvmCollectiblesMetadataAction.match(action) ||
        cancelEvmCollectiblesMetadataLoadingAction.match(action) ||
        isCollectiblesListingChange(action)
    ),
    concatMap(action => {
      if (!loadEvmCollectiblesMetadataAction.match(action)) {
        previousRefsKey.current = '';
        collectionNameRequestedSlugs.clear();
        if (isCollectiblesListingChange(action)) cancelSharedStorefrontCollectionLoads();

        return EMPTY;
      }

      const { publicKeyHash } = action.payload;
      if (trackedAccount !== publicKeyHash) {
        trackedAccount = publicKeyHash;
        previousRefsKey.current = '';
        collectionNameRequestedSlugs.clear();
      }

      const abortController = new AbortController();

      return from(
        loadOpenseaForVisibleCollectibles(action.payload, state$.value, abortController.signal, previousRefsKey)
      ).pipe(
        mergeMap(actions => from(actions)),
        catchError(emptyAfterLoadError),
        takeUntil(
          action$.pipe(
            filter(
              next =>
                cancelEvmCollectiblesMetadataLoadingAction.match(next) ||
                isCollectiblesListingChange(next) ||
                (loadEvmCollectiblesMetadataAction.match(next) && next.payload.publicKeyHash !== publicKeyHash)
            )
          )
        ),
        finalize(() => abortController.abort())
      );
    })
  );
};
