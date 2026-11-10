import { Action } from 'redux';
import { combineEpics, Epic } from 'redux-observable';
import { concat, defer, EMPTY, from, of } from 'rxjs';
import { catchError, concatMap, filter, finalize, map, mergeMap, takeUntil, withLatestFrom } from 'rxjs/operators';

import { setEvmCollectiblesMetadataLoading } from 'app/store/evm/actions';
import { isOpenseaChainId } from 'app/store/evm/collectibles-inventory/chains';
import { RootState } from 'app/store/root-state.type';
import { isGoldrushChainId } from 'lib/apis/temple/endpoints/evm/api.utils';
import { isAbortError } from 'lib/apis/utils';
import { toTokenSlug } from 'lib/assets';
import { EMPTY_FROZEN_ARRAY } from 'lib/utils';
import { EvmNetworkEssentials } from 'temple/networks';

import {
  EvmCollectiblesMetadataSession,
  loadEvmCollectiblesMetadataAction,
  retryOpenseaCollectiblesMetadataAction,
  updateEvmCollectiblesMetadataSessionAction
} from './actions';
import { cancelMetadataLoads, createMetadataLoadQueue, metadataLoadWasCancelled, noteMetadataLoad } from './load-queue';
import { emptyAfterLoadError, isCollectiblesListingChange } from './metadata-load-shared';
import {
  continueEvmCollectiblesOnChainLoadEpic,
  queueVisibleOnChainReads,
  slugSetsFromRecords,
  visibleOnChainItems,
  withOnChainSlugs
} from './on-chain-metadata-load';
import { buildOpenseaMultichainRefBatches } from './opensea-batches';
import {
  fetchChainCollectiblesMetadata,
  fetchOpenseaMetadata,
  loadOpenseaBatch,
  retryDelayMs
} from './opensea-metadata-load';
import { loadOpenseaStorefrontCollectionEpic, retryOpenseaCollectiblesMetadataEpic } from './opensea-metadata-retry';
import { cancelSharedStorefrontCollectionLoads } from './opensea-storefront';

const canFetchCollectiblesMetadataFromApi = (chainId: number, isTestnetMode: boolean) =>
  isGoldrushChainId(chainId) && !isTestnetMode;

const collectChainLoads = (
  publicKeyHash: HexString,
  chains: EvmNetworkEssentials[],
  loadAllChains: boolean,
  state: RootState
) => {
  const currentAccountCollectibles = state.evmAssets.collectibles[publicKeyHash];
  const { metadataRecord, lastFullLoadAccount, seenChainsByAccount, checkedSlugsByAccount, onChainSlugsByAccount } =
    state.evmCollectiblesMetadata;
  const isTestnetMode = state.settings.isTestnetModeEnabled;

  let nextLastFullLoadAccount = lastFullLoadAccount;
  let checkedSlugsByChain = { ...checkedSlugsByAccount[publicKeyHash] };
  let onChainSlugsByChain = { ...onChainSlugsByAccount[publicKeyHash] };
  const seenChains = new Set(seenChainsByAccount[publicKeyHash] ?? EMPTY_FROZEN_ARRAY);

  if (loadAllChains && lastFullLoadAccount !== publicKeyHash) {
    nextLastFullLoadAccount = publicKeyHash;
    checkedSlugsByChain = {};
    onChainSlugsByChain = {};
    seenChains.clear();
  }

  const chainLoads = chains.flatMap(chain => {
    const { chainId } = chain;
    const chainCollectiblesRecord = currentAccountCollectibles?.[chainId];
    const chainMetadataRecord = metadataRecord[chainId];
    const allSlugs = chainCollectiblesRecord ? Object.keys(chainCollectiblesRecord) : [];
    const checkedSlugs = checkedSlugsByChain[chainId] ?? [];
    const slugsWithoutMeta = allSlugs.filter(slug => !chainMetadataRecord?.[slug] && !checkedSlugs.includes(slug));
    const loadEntireChain = !seenChains.has(chainId);

    seenChains.add(chainId);

    if (!loadEntireChain && !slugsWithoutMeta.length) {
      return [];
    }

    if (loadEntireChain && !canFetchCollectiblesMetadataFromApi(chainId, isTestnetMode) && !slugsWithoutMeta.length) {
      return [];
    }

    if (slugsWithoutMeta.length) {
      checkedSlugsByChain[chainId] = checkedSlugs.concat(slugsWithoutMeta);
    }

    return [{ chain, slugsWithoutMeta, allSlugs }];
  });

  return {
    chainLoads,
    session: {
      publicKeyHash,
      lastFullLoadAccount: nextLastFullLoadAccount,
      seenChains: Array.from(seenChains),
      checkedSlugsByChain,
      onChainSlugsByChain
    }
  };
};

const metadataLoadQueue = createMetadataLoadQueue();

type MetadataLoadEvent =
  | { kind: 'cancel' }
  | { kind: 'load'; action: ReturnType<typeof loadEvmCollectiblesMetadataAction>; id: number };

export const loadEvmCollectiblesMetadataEpic: Epic<Action, Action, RootState> = (action$, state$) =>
  action$.pipe(
    filter(action => loadEvmCollectiblesMetadataAction.match(action) || isCollectiblesListingChange(action)),
    map((action): MetadataLoadEvent => {
      if (!loadEvmCollectiblesMetadataAction.match(action)) {
        cancelMetadataLoads(metadataLoadQueue);
        cancelSharedStorefrontCollectionLoads();

        return { kind: 'cancel' };
      }

      return { kind: 'load', action, id: noteMetadataLoad(metadataLoadQueue) };
    }),
    concatMap(event => {
      if (event.kind === 'cancel') return of(setEvmCollectiblesMetadataLoading(false));
      if (metadataLoadWasCancelled(metadataLoadQueue, event.id)) return EMPTY;

      const abortController = new AbortController();

      return of(event.action).pipe(
        withLatestFrom(state$),
        mergeMap(([{ payload }, state]) => {
          const { signal } = abortController;
          const { publicKeyHash, chains, loadAllChains, openseaNftRefs: requestedOpenseaNftRefs } = payload;
          const { chainLoads, session } = collectChainLoads(publicKeyHash, chains, loadAllChains, state);
          let sessionToCommit: EvmCollectiblesMetadataSession = session;
          const isTestnetMode = state.settings.isTestnetModeEnabled;
          const requestedOpenseaNftRefsFiltered = isTestnetMode
            ? []
            : requestedOpenseaNftRefs.filter(ref => isOpenseaChainId(ref.chainId));
          const openseaBatches = buildOpenseaMultichainRefBatches(
            requestedOpenseaNftRefsFiltered,
            state.evmAssets.collectibles[publicKeyHash],
            state.evmCollectiblesMetadata.metadataRecord
          );
          const openseaNftRefs = openseaBatches.flat();
          const visibleNftRefs = requestedOpenseaNftRefs;
          const openseaRequest = loadOpenseaBatch(openseaBatches, signal);
          const openseaBatch = openseaRequest.then(load => load.results);
          const batchRetryActions$ = from(openseaRequest).pipe(
            mergeMap(load =>
              from(
                load.retries.map(retry =>
                  retryOpenseaCollectiblesMetadataAction({
                    kind: 'batch',
                    publicKeyHash,
                    refs: retry.refs,
                    attempt: 1,
                    delayMs: retryDelayMs(retry.readyAt)
                  })
                )
              )
            ),
            catchError(emptyAfterLoadError)
          );
          const loadedChainIds = new Set(chainLoads.map(({ chain }) => chain.chainId));
          const extraOpenseaChainIds = Array.from(
            new Set(openseaNftRefs.map(ref => ref.chainId).filter(chainId => !loadedChainIds.has(chainId)))
          );
          const metadataRecord = state.evmCollectiblesMetadata.metadataRecord;

          const queueVisibleReads = async (resolvedByChain: Record<number, ReadonlySet<string>>) => {
            const pendingRetryKeys = new Set<string>();
            const { retries } = await openseaRequest;

            for (const retry of retries) {
              for (const ref of retry.refs)
                pendingRetryKeys.add(`${ref.chainId}:${toTokenSlug(ref.contractAddress, ref.tokenId)}`);
            }

            const items = visibleOnChainItems(
              chains,
              visibleNftRefs,
              metadataRecord,
              session.onChainSlugsByChain,
              resolvedByChain
            ).filter(item => !pendingRetryKeys.has(`${item.chain.chainId}:${item.slug}`));

            sessionToCommit = withOnChainSlugs(sessionToCommit, items);

            return queueVisibleOnChainReads(items);
          };
          const commitCheckedSlugs$ = defer(() => of(updateEvmCollectiblesMetadataSessionAction(sessionToCommit)));

          if (!chainLoads.length) {
            return concat(
              from(
                extraOpenseaChainIds.length
                  ? fetchOpenseaMetadata(
                      publicKeyHash,
                      extraOpenseaChainIds,
                      openseaNftRefs,
                      state,
                      openseaBatch,
                      signal
                    ).then(async ({ actions, recordsByChain }) => {
                      const queued = await queueVisibleReads(slugSetsFromRecords(recordsByChain));

                      return actions.concat(queued);
                    })
                  : queueVisibleReads({})
              ).pipe(
                mergeMap(actions => from(actions)),
                catchError(emptyAfterLoadError)
              ),
              batchRetryActions$,
              commitCheckedSlugs$
            );
          }

          const resolvedByChain: Record<number, Set<string>> = {};

          return concat(
            of(setEvmCollectiblesMetadataLoading(true)),
            from(chainLoads).pipe(
              mergeMap(({ chain, allSlugs }) =>
                from(
                  fetchChainCollectiblesMetadata(
                    publicKeyHash,
                    chain,
                    allSlugs,
                    isTestnetMode,
                    openseaNftRefs,
                    openseaBatch,
                    metadataRecord[chain.chainId],
                    signal
                  )
                ).pipe(
                  mergeMap(({ actions, resolvedSlugs }) => {
                    const resolved = resolvedByChain[chain.chainId] ?? new Set<string>();

                    for (const slug of resolvedSlugs) resolved.add(slug);
                    resolvedByChain[chain.chainId] = resolved;

                    return from(actions);
                  }),
                  catchError(emptyAfterLoadError)
                )
              )
            ),
            extraOpenseaChainIds.length
              ? from(
                  fetchOpenseaMetadata(publicKeyHash, extraOpenseaChainIds, openseaNftRefs, state, openseaBatch, signal)
                ).pipe(
                  mergeMap(({ actions, recordsByChain }) => {
                    for (const chainIdKey of Object.keys(recordsByChain)) {
                      const chainId = Number(chainIdKey);
                      const resolved = resolvedByChain[chainId] ?? new Set<string>();

                      for (const slug of Object.keys(recordsByChain[chainId])) resolved.add(slug);
                      resolvedByChain[chainId] = resolved;
                    }

                    return from(actions);
                  }),
                  catchError(emptyAfterLoadError)
                )
              : EMPTY,
            from(queueVisibleReads(resolvedByChain)).pipe(
              mergeMap(actions => from(actions)),
              catchError(emptyAfterLoadError)
            ),
            batchRetryActions$,
            commitCheckedSlugs$,
            of(setEvmCollectiblesMetadataLoading(false))
          ).pipe(
            catchError(error => {
              if (!isAbortError(error)) console.error(error);

              return of(setEvmCollectiblesMetadataLoading(false));
            })
          );
        }),
        takeUntil(action$.pipe(filter(isCollectiblesListingChange))),
        finalize(() => abortController.abort())
      );
    })
  );

export const evmCollectiblesMetadataEpics = combineEpics(
  loadEvmCollectiblesMetadataEpic,
  retryOpenseaCollectiblesMetadataEpic,
  loadOpenseaStorefrontCollectionEpic,
  continueEvmCollectiblesOnChainLoadEpic
);
