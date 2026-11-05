import { Action } from 'redux';
import { combineEpics, Epic } from 'redux-observable';
import { concat, defer, EMPTY, from, of, timer } from 'rxjs';
import { catchError, concatMap, filter, finalize, map, mergeMap, takeUntil, withLatestFrom } from 'rxjs/operators';
import { ofType } from 'ts-action-operators';

import {
  setAssetsFilterChain,
  setCollectiblesViewAsCollectionsFilterOption
} from 'app/store/assets-filter-options/actions';
import { setEvmCollectiblesMetadataLoading } from 'app/store/evm/actions';
import { RootState } from 'app/store/root-state.type';
import {
  getEvmCollectiblesMetadata,
  getOpenseaMultichainNftsMetadata,
  NftAddressBalanceNftResponse,
  OpenseaNftDetailed,
  OpenseaNftRef
} from 'lib/apis/temple/endpoints/evm';
import { isSupportedChainId } from 'lib/apis/temple/endpoints/evm/api.utils';
import { isAbortError, readRetryAfterMs } from 'lib/apis/utils';
import { toTokenSlug } from 'lib/assets';
import { fetchEvmCollectiblesMetadataFromChain } from 'lib/evm/on-chain/metadata';
import { EvmCollectibleMetadata } from 'lib/metadata/types';
import { EMPTY_FROZEN_ARRAY, isTruthy } from 'lib/utils';
import { EvmNetworkEssentials } from 'temple/networks';

import {
  continueEvmCollectiblesOnChainLoadAction,
  EvmCollectiblesMetadataSession,
  loadEvmCollectiblesMetadataAction,
  loadOpenseaStorefrontCollectionAction,
  processLoadedEvmCollectiblesMetadataAction,
  putEvmCollectiblesMetadataAction,
  retryOpenseaCollectiblesMetadataAction,
  RetryOpenseaCollectiblesMetadataPayload,
  updateEvmCollectiblesMetadataSessionAction
} from './actions';
import { cancelMetadataLoads, createMetadataLoadQueue, metadataLoadWasCancelled, noteMetadataLoad } from './load-queue';
import {
  ON_CHAIN_COLLECTIBLES_BATCH_DELAY_MS,
  DeferredEvmCollectibleOnChainLoad,
  splitOnChainCollectibleBatch
} from './on-chain-queue';
import {
  buildOpenseaMultichainRefBatches,
  cancelSharedStorefrontCollectionLoads,
  collectOpenseaMetadataRecords,
  currentSharedStorefrontFillGeneration,
  finishSharedStorefrontCollectionLoad,
  loadOpenseaAccountNfts,
  noteSharedStorefrontCollectionLoad,
  sharedStorefrontCollectionsToLoad,
  SharedStorefrontCollectionLoad
} from './opensea';
import { EvmCollectibleMetadataRecord } from './state';
import { getSlugsWithProperCollectibleMetadata } from './utils';

const canFetchCollectiblesMetadataFromApi = (chainId: number, isTestnetMode: boolean) =>
  isSupportedChainId(chainId) && !isTestnetMode;

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

const loadEvmCollectiblesMetadataFromChain = async (slugsWithoutMeta: string[], chain: EvmNetworkEssentials) => {
  try {
    const records = await fetchEvmCollectiblesMetadataFromChain(chain, slugsWithoutMeta);

    return putEvmCollectiblesMetadataAction({ chainId: chain.chainId, records });
  } catch (error) {
    console.error(error);

    return undefined;
  }
};

/** Further 429 responses each wait for their own `Retry-After` and then try once more, up to this many times. */
const OPENSEA_RATE_LIMIT_RETRY_LIMIT = 3;

interface OpenseaBatchLoad {
  results: Array<OpenseaNftDetailed | null>;
  retries: { refs: OpenseaNftRef[]; readyAt: number }[];
}

const loadOpenseaBatch = async (
  batches: readonly (readonly OpenseaNftRef[])[],
  signal?: AbortSignal
): Promise<OpenseaBatchLoad> => {
  const ranges: { batch: readonly OpenseaNftRef[]; start: number }[] = [];
  let count = 0;

  for (const batch of batches) {
    if (!batch.length) continue;

    ranges.push({ batch, start: count });
    count += batch.length;
  }

  if (!count) return { results: [], retries: [] };

  const results: Array<OpenseaNftDetailed | null> = new Array(count).fill(null);
  const retries: OpenseaBatchLoad['retries'] = [];

  await Promise.all(
    ranges.map(async ({ batch, start }) => {
      try {
        const response = await getOpenseaMultichainNftsMetadata(batch.slice(), signal);

        for (let index = 0; index < batch.length; index++) results[start + index] = response[index] ?? null;
      } catch (error) {
        if (isAbortError(error)) throw error;

        const delayMs = readRetryAfterMs(error);
        if (delayMs === undefined) {
          console.error(error);

          return;
        }

        retries.push({ refs: batch.slice(), readyAt: Date.now() + delayMs });
      }
    })
  );

  return { results, retries };
};

const retryDelayMs = (readyAt: number) => Math.max(0, readyAt - Date.now());

const putOpenseaBatchRecords = (
  refs: readonly OpenseaNftRef[],
  results: ReadonlyArray<OpenseaNftDetailed | null>,
  metadataRecord: EvmCollectibleMetadataRecord
) => {
  const byChain = new Map<number, { refs: OpenseaNftRef[]; results: Array<OpenseaNftDetailed | null> }>();

  refs.forEach((ref, index) => {
    const group = byChain.get(ref.chainId) ?? { refs: [], results: [] };

    group.refs.push(ref);
    group.results.push(results[index] ?? null);
    byChain.set(ref.chainId, group);
  });

  const actions: Action[] = [];

  for (const [chainId, group] of byChain) {
    const records = collectOpenseaMetadataRecords(
      group.refs.map(ref => toTokenSlug(ref.contractAddress, ref.tokenId)),
      [],
      group.refs,
      group.results,
      undefined,
      metadataRecord[chainId]
    );
    const action = putOpenseaRecordsAction(chainId, records);
    if (action) actions.push(action);
  }

  return actions;
};

const loadOpenseaRecordsForChain = async (
  publicKeyHash: HexString,
  chainId: number,
  slugs: readonly string[],
  openseaNftRefs: readonly OpenseaNftRef[],
  openseaBatch: Promise<Array<OpenseaNftDetailed | null>>,
  goldrushData?: NftAddressBalanceNftResponse,
  storedBySlug?: StringRecord<EvmCollectibleMetadata>,
  includeAccount = true,
  signal?: AbortSignal
): Promise<{
  records: StringRecord<EvmCollectibleMetadata>;
  retryActions: Action[];
  storefrontCollections: SharedStorefrontCollectionLoad[];
}> => {
  if (!slugs.length) return { records: {}, retryActions: [], storefrontCollections: [] };

  const retryActions: Action[] = [];
  let accountNfts: OpenseaNftDetailed[] = [];

  if (includeAccount) {
    try {
      const loaded = await loadOpenseaAccountNfts(chainId, publicKeyHash, slugs, undefined, signal);
      accountNfts = loaded.nfts;

      if (loaded.retry) {
        retryActions.push(
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
  }

  const batchResults = await openseaBatch;
  const records = collectOpenseaMetadataRecords(
    slugs,
    accountNfts,
    openseaNftRefs,
    batchResults,
    goldrushData,
    storedBySlug
  );
  const receivedNfts = accountNfts.slice();

  batchResults.forEach((nft, index) => {
    const ref = openseaNftRefs[index];
    if (!nft || !ref || ref.chainId !== chainId) return;

    receivedNfts.push(nft);
  });

  const namedSlugs = new Set(Object.keys(records).filter(slug => records[slug]?.openseaCollection));

  return {
    records,
    retryActions,
    storefrontCollections: sharedStorefrontCollectionsToLoad(
      chainId,
      receivedNfts,
      slugs,
      storedBySlug,
      namedSlugs,
      requestedStorefrontCollections
    )
  };
};

const putOpenseaRecordsAction = (chainId: number, records: StringRecord<EvmCollectibleMetadata>) =>
  Object.keys(records).length ? putEvmCollectiblesMetadataAction({ chainId, records }) : undefined;

/** Collection slugs already sent to the filtered account route this session. */
const requestedStorefrontCollections = new Set<string>();

const actionsForStorefrontCollections = (
  publicKeyHash: HexString,
  chainId: number,
  loads: readonly SharedStorefrontCollectionLoad[]
) => {
  const actions: Action[] = [];

  for (const load of loads) {
    const key = `${chainId}:${load.collection}`;
    if (requestedStorefrontCollections.has(key)) continue;

    requestedStorefrontCollections.add(key);
    noteSharedStorefrontCollectionLoad(chainId, load.contractAddress);
    actions.push(
      loadOpenseaStorefrontCollectionAction({
        publicKeyHash,
        chainId,
        collection: load.collection,
        contractAddress: load.contractAddress
      })
    );
  }

  return actions;
};

const fetchChainCollectiblesMetadata = async (
  publicKeyHash: HexString,
  chain: EvmNetworkEssentials,
  allSlugs: string[],
  isTestnetMode: boolean,
  openseaNftRefs: readonly OpenseaNftRef[],
  openseaBatch: Promise<Array<OpenseaNftDetailed | null>>,
  storedBySlug?: StringRecord<EvmCollectibleMetadata>,
  signal?: AbortSignal
) => {
  const { chainId } = chain;
  const canFetchFromApi = !isTestnetMode && isSupportedChainId(chainId);

  let goldrushData: NftAddressBalanceNftResponse | undefined;
  if (canFetchFromApi) {
    try {
      goldrushData = await getEvmCollectiblesMetadata(publicKeyHash, chainId, signal);
    } catch (error) {
      if (isAbortError(error)) throw error;

      console.error(error);
    }
  }

  const openseaLoad = canFetchFromApi
    ? await loadOpenseaRecordsForChain(
        publicKeyHash,
        chainId,
        allSlugs,
        openseaNftRefs,
        openseaBatch,
        goldrushData,
        storedBySlug,
        true,
        signal
      )
    : { records: {}, retryActions: [], storefrontCollections: [] };
  const loadedSlugs = goldrushData ? getSlugsWithProperCollectibleMetadata(goldrushData) : new Set<string>();
  const resolvedSlugs = new Set<string>(loadedSlugs);

  for (const slug of Object.keys(openseaLoad.records)) resolvedSlugs.add(slug);

  return {
    actions: [
      goldrushData ? processLoadedEvmCollectiblesMetadataAction({ chainId, data: goldrushData }) : undefined,
      putOpenseaRecordsAction(chainId, openseaLoad.records),
      ...openseaLoad.retryActions,
      ...actionsForStorefrontCollections(publicKeyHash, chainId, openseaLoad.storefrontCollections)
    ].filter(isTruthy),
    resolvedSlugs
  };
};

const loadOnChainCollectibleBatch = async (items: readonly DeferredEvmCollectibleOnChainLoad[]) => {
  const actions: Action[] = [];
  if (!items.length) return actions;

  const { now, later } = splitOnChainCollectibleBatch(items);
  const byChainId = new Map<number, { chain: EvmNetworkEssentials; slugs: string[] }>();

  for (const item of now) {
    const group = byChainId.get(item.chain.chainId);

    if (group) group.slugs.push(item.slug);
    else byChainId.set(item.chain.chainId, { chain: item.chain, slugs: [item.slug] });
  }

  const loaded = await Promise.all(
    Array.from(byChainId.values(), ({ chain, slugs }) => loadEvmCollectiblesMetadataFromChain(slugs, chain))
  ).catch(error => {
    console.error(error);

    return [];
  });

  for (const action of loaded) {
    if (action) actions.push(action);
  }

  if (later.length) actions.push(continueEvmCollectiblesOnChainLoadAction({ items: later }));

  return actions;
};

const slugSetsFromRecords = (recordsByChain: Record<number, StringRecord<EvmCollectibleMetadata>>) => {
  const resolvedByChain: Record<number, Set<string>> = {};

  for (const chainIdKey of Object.keys(recordsByChain)) {
    resolvedByChain[Number(chainIdKey)] = new Set(Object.keys(recordsByChain[Number(chainIdKey)]));
  }

  return resolvedByChain;
};

const visibleOnChainItems = (
  chains: readonly EvmNetworkEssentials[],
  visibleNftRefs: readonly OpenseaNftRef[],
  metadataByChain: RootState['evmCollectiblesMetadata']['metadataRecord'],
  attemptedByChain: Record<number, readonly string[]> | undefined,
  resolvedByChain?: Record<number, ReadonlySet<string> | undefined>
) => {
  const chainById = new Map(chains.map(chain => [chain.chainId, chain]));
  const seen = new Set<string>();
  const items: DeferredEvmCollectibleOnChainLoad[] = [];

  for (const ref of visibleNftRefs) {
    const chain = chainById.get(ref.chainId);
    if (!chain) continue;

    const slug = toTokenSlug(ref.contractAddress, ref.tokenId);
    const key = `${ref.chainId}:${slug}`;
    if (seen.has(key)) continue;
    if (metadataByChain[ref.chainId]?.[slug]) continue;
    if (resolvedByChain?.[ref.chainId]?.has(slug)) continue;
    if ((attemptedByChain?.[ref.chainId] ?? []).includes(slug)) continue;

    seen.add(key);
    items.push({ chain, slug });
  }

  return items;
};

const withOnChainSlugs = (
  session: EvmCollectiblesMetadataSession,
  items: readonly DeferredEvmCollectibleOnChainLoad[]
): EvmCollectiblesMetadataSession => {
  if (!items.length) return session;

  const onChainSlugsByChain = { ...session.onChainSlugsByChain };

  for (const item of items) {
    const previous = onChainSlugsByChain[item.chain.chainId] ?? [];
    if (previous.includes(item.slug)) continue;

    onChainSlugsByChain[item.chain.chainId] = previous.concat(item.slug);
  }

  return { ...session, onChainSlugsByChain };
};

const queueVisibleOnChainReads = async (items: DeferredEvmCollectibleOnChainLoad[]): Promise<Action[]> => {
  if (!items.length) return [];

  return loadOnChainCollectibleBatch(items);
};

const fetchOpenseaMetadata = async (
  publicKeyHash: HexString,
  chainIds: readonly number[],
  openseaNftRefs: readonly OpenseaNftRef[],
  state: RootState,
  openseaBatch: Promise<Array<OpenseaNftDetailed | null>>,
  signal?: AbortSignal
) => {
  const collectibles = state.evmAssets.collectibles[publicKeyHash];
  const results = await Promise.all(
    chainIds.map(async chainId => {
      const slugs = Object.keys(collectibles?.[chainId] ?? {});
      const loaded = await loadOpenseaRecordsForChain(
        publicKeyHash,
        chainId,
        slugs,
        openseaNftRefs,
        openseaBatch,
        undefined,
        state.evmCollectiblesMetadata.metadataRecord[chainId],
        false,
        signal
      );

      return {
        chainId,
        records: loaded.records,
        actions: [
          putOpenseaRecordsAction(chainId, loaded.records),
          ...loaded.retryActions,
          ...actionsForStorefrontCollections(publicKeyHash, chainId, loaded.storefrontCollections)
        ].filter(isTruthy)
      };
    })
  );

  const recordsByChain: Record<number, StringRecord<EvmCollectibleMetadata>> = {};
  const actions: Action[] = [];

  for (const result of results) {
    recordsByChain[result.chainId] = result.records;
    actions.push(...result.actions);
  }

  return { actions, recordsByChain };
};

const metadataLoadQueue = createMetadataLoadQueue();
const onChainLoadQueue = createMetadataLoadQueue();

const isCollectiblesListingChange = (action: Action) =>
  setAssetsFilterChain.match(action) || setCollectiblesViewAsCollectionsFilterOption.match(action);

const emptyAfterLoadError = (error: unknown) => {
  if (!isAbortError(error)) console.error(error);

  return EMPTY;
};

type MetadataLoadEvent =
  | { kind: 'cancel' }
  | { kind: 'load'; action: ReturnType<typeof loadEvmCollectiblesMetadataAction>; id: number };

const loadEvmCollectiblesMetadataEpic: Epic<Action, Action, RootState> = (action$, state$) =>
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
            : requestedOpenseaNftRefs.filter(ref => isSupportedChainId(ref.chainId));
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

const retryOpenseaCollectiblesMetadataEpic: Epic<Action, Action, RootState> = (action$, state$) =>
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

const loadOpenseaStorefrontCollectionEpic: Epic<Action, Action, RootState> = (action$, state$) =>
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

type OnChainLoadEvent =
  | { kind: 'cancel' }
  | { kind: 'continue'; action: ReturnType<typeof continueEvmCollectiblesOnChainLoadAction>; id: number };

const continueEvmCollectiblesOnChainLoadEpic: Epic<Action, Action, RootState> = action$ =>
  action$.pipe(
    filter(action => continueEvmCollectiblesOnChainLoadAction.match(action) || isCollectiblesListingChange(action)),
    map((action): OnChainLoadEvent => {
      if (!continueEvmCollectiblesOnChainLoadAction.match(action)) {
        cancelMetadataLoads(onChainLoadQueue);

        return { kind: 'cancel' };
      }

      return { kind: 'continue', action, id: noteMetadataLoad(onChainLoadQueue) };
    }),
    concatMap(event => {
      if (event.kind === 'cancel' || metadataLoadWasCancelled(onChainLoadQueue, event.id)) return EMPTY;

      return timer(ON_CHAIN_COLLECTIBLES_BATCH_DELAY_MS).pipe(
        mergeMap(() => from(loadOnChainCollectibleBatch(event.action.payload.items))),
        mergeMap(actions => from(actions)),
        takeUntil(action$.pipe(filter(isCollectiblesListingChange))),
        catchError(emptyAfterLoadError)
      );
    })
  );

export const evmCollectiblesMetadataEpics = combineEpics(
  loadEvmCollectiblesMetadataEpic,
  retryOpenseaCollectiblesMetadataEpic,
  loadOpenseaStorefrontCollectionEpic,
  continueEvmCollectiblesOnChainLoadEpic
);
