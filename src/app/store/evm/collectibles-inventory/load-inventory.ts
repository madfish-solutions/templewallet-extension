import { Action } from 'redux';
import { Epic } from 'redux-observable';
import { EMPTY, concat, from, of } from 'rxjs';
import { catchError, filter, finalize, mergeMap, switchMap } from 'rxjs/operators';

import { RootState } from 'app/store/root-state.type';
import {
  ALCHEMY_NFT_EXCLUDE_SPAM,
  getAlchemyNftsByOwner,
  getEvmCollectiblesMetadata,
  getNftAlchemyContractsByOwner,
  getOpenseaAccountCollections,
  NftAddressBalanceNftResponse
} from 'lib/apis/temple/endpoints/evm';
import { AlchemyChainID } from 'lib/apis/temple/endpoints/evm/alchemy';
import { isGoldrushChainId } from 'lib/apis/temple/endpoints/evm/api.utils';
import { isAbortError, withRateLimitRetry } from 'lib/apis/utils';
import { delayUnlessAborted } from 'lib/utils/delay-unless-aborted';

import {
  appendEvmChainCollectiblesInventoryAction,
  loadEvmCollectiblesInventoryAction,
  loadEvmCollectiblesInventoryNextPageAction,
  putEvmChainCollectiblesInventoryAction,
  setEvmCollectiblesInventoryLoadingAction
} from './actions';
import {
  balanceOfByContractFromAnswers,
  OwnerSampleAnswer,
  readListedOwnership,
  readOwnerListSample
} from './alchemy-owner-sample';
import { isAlchemyChainId, isOpenseaChainId } from './chains';
import {
  collectAlchemyNfts,
  collectionsFromResponse,
  CollectedNfts,
  contractsFromResponse,
  emptyAfterAbort,
  emptyCollected,
  publishCollected
} from './collected-nfts';
import {
  goldrushBalanceByContract,
  rememberGoldrushContractBalances,
  withCloserGoldrushCounts
} from './goldrush-balances';
import { inventoryFromGoldrush, withoutProvenUnowned } from './goldrush-inventory';
import {
  listTokensBySource,
  singleSourceFirst,
  singleSourceTokensAfterSample,
  SourcedToken,
  unownedFromOwnerSample
} from './ownership';
import { InventoryContractRef } from './place-collections';
import { forgetPreservedLoadedNfts, rememberLoadedBeyondFirstPage, withPreservedLoadedNfts } from './preserve-loaded';
import { EvmChainCollectiblesInventory } from './state';

const ACCOUNT_COLLECTIONS_PAGE_LIMIT = 5;

const readAccountCollections = async (chainId: number, account: HexString, signal: AbortSignal) => {
  if (!isOpenseaChainId(chainId)) return [];

  const collections: Awaited<ReturnType<typeof getOpenseaAccountCollections>>['collections'] = [];
  let after: string | undefined;

  for (let page = 0; page < ACCOUNT_COLLECTIONS_PAGE_LIMIT; page++) {
    const response = await withRateLimitRetry(
      () => getOpenseaAccountCollections([chainId], account, 100, after, signal),
      signal
    );
    collections.push(...response.collections);
    if (!response.next) break;
    after = response.next;
  }

  return collections;
};

interface GoldrushInventoryRead {
  collected: CollectedNfts;
  contracts: InventoryContractRef[];
  /** The request returned, including a wallet that owns nothing. A thrown request is not fetched. */
  fetched: boolean;
}

const unreadGoldrushInventory = (): GoldrushInventoryRead => ({
  collected: emptyCollected(),
  contracts: [],
  fetched: false
});

const readGoldrushInventory = async (
  account: HexString,
  chainId: number,
  signal: AbortSignal,
  /** Set when this load already requested Goldrush. `data` is omitted when that request failed. */
  preloaded?: { data?: NftAddressBalanceNftResponse }
): Promise<GoldrushInventoryRead> => {
  if (!isGoldrushChainId(chainId)) return unreadGoldrushInventory();

  try {
    const data = preloaded ? preloaded.data : await getEvmCollectiblesMetadata(account, chainId, signal);
    if (!data) return unreadGoldrushInventory();
    const goldrush = inventoryFromGoldrush(data);
    const sample = await readOwnerListSample(account, chainId, goldrush.collected.loaded, 'goldrush', signal);
    if (sample.rejectsList) return { collected: emptyCollected(), contracts: [], fetched: true };

    const trimmed = withoutProvenUnowned(
      goldrush.collected,
      goldrush.contracts,
      sample.unownedSlugs,
      sample.unownedContracts
    );

    return { collected: trimmed.collected, contracts: trimmed.contracts, fetched: true };
  } catch (error) {
    if (isAbortError(error)) throw error;
    console.error(error);

    return unreadGoldrushInventory();
  }
};

const settledOrThrow = <T>(result: PromiseSettledResult<T>) => {
  if (result.status === 'rejected' && isAbortError(result.reason)) throw result.reason;
};

const readOwnerNfts = async (account: HexString, chainId: AlchemyChainID, signal: AbortSignal) => {
  let lastError: unknown;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await getAlchemyNftsByOwner(
        chainId,
        account,
        true,
        undefined,
        undefined,
        signal,
        ALCHEMY_NFT_EXCLUDE_SPAM
      );
    } catch (error) {
      if (isAbortError(error)) throw error;

      lastError = error;
      if (attempt < 2) await delayUnlessAborted(1000, signal);
    }
  }

  throw lastError;
};

const includeSingleSourceTokens = (
  collected: CollectedNfts,
  contracts: readonly InventoryContractRef[],
  goldrush: ReturnType<typeof inventoryFromGoldrush> | undefined,
  decision: { keepSlugs: readonly string[] } | undefined
) => {
  const nextCollected: CollectedNfts = {
    records: { ...collected.records },
    loaded: collected.loaded.slice(),
    slugs: collected.slugs.slice()
  };
  const nextContracts = contracts.slice();
  if (!goldrush || !decision) return { collected: nextCollected, contracts: nextContracts, added: 0 };

  const present = new Set(nextCollected.loaded.map(nft => nft.slug.toLowerCase()));
  const contractsByAddress = new Set(nextContracts.map(contract => contract.address.toLowerCase()));
  const keep = new Set(decision.keepSlugs.map(slug => slug.toLowerCase()));
  let added = 0;

  for (const nft of goldrush.collected.loaded) {
    const key = nft.slug.toLowerCase();
    if (!keep.has(key) || present.has(key)) continue;

    present.add(key);
    nextCollected.loaded.push(nft);
    nextCollected.slugs.push(nft.slug);
    const record = goldrush.collected.records[nft.slug];
    if (record) nextCollected.records[nft.slug] = record;
    added += 1;

    const contractKey = nft.contractAddress.toLowerCase();
    if (contractsByAddress.has(contractKey)) continue;

    const contract = goldrush.contracts.find(item => item.address.toLowerCase() === contractKey);
    if (!contract) continue;

    const ownedHere = goldrush.collected.loaded.filter(
      item => keep.has(item.slug.toLowerCase()) && item.contractAddress.toLowerCase() === contractKey
    ).length;
    contractsByAddress.add(contractKey);
    nextContracts.push({ ...contract, distinctTokensOwned: ownedHere });
  }

  return { collected: nextCollected, contracts: nextContracts, added };
};

const resolveSingleSource = async (
  account: HexString,
  chainId: number,
  sourced: readonly SourcedToken[],
  answers: readonly OwnerSampleAnswer[],
  signal: AbortSignal
) => {
  let next: OwnerSampleAnswer[] = answers.slice();
  let decision = singleSourceTokensAfterSample(sourced, next);

  for (let pass = 0; pass < 2 && decision.readSlugs.length; pass++) {
    const wanted = new Set(decision.readSlugs.map(slug => slug.toLowerCase()));
    const more = await readListedOwnership(
      account,
      chainId,
      sourced.filter(token => wanted.has(token.slug.toLowerCase())),
      signal
    );
    if (!more.length) break;

    next = next.concat(more);
    decision = singleSourceTokensAfterSample(sourced, next);
  }

  if (decision.readSlugs.length) decision = singleSourceTokensAfterSample(sourced, next, true);

  return { decision, answers: next };
};

const readChainInventory = async (account: HexString, chainId: number, signal: AbortSignal): Promise<Action[]> => {
  if (!isAlchemyChainId(chainId)) return [];

  const goldrushResponse = isGoldrushChainId(chainId)
    ? getEvmCollectiblesMetadata(account, chainId, signal).catch(error => {
        if (isAbortError(error)) throw error;

        console.error(error);

        return undefined;
      })
    : Promise.resolve(undefined);
  const [contractsResult, nftsResult, collectionsResult, goldrushResult] = await Promise.allSettled([
    getNftAlchemyContractsByOwner(chainId, account, signal, ALCHEMY_NFT_EXCLUDE_SPAM),
    readOwnerNfts(account, chainId, signal),
    readAccountCollections(chainId, account, signal),
    goldrushResponse
  ]);
  settledOrThrow(contractsResult);
  settledOrThrow(nftsResult);
  settledOrThrow(collectionsResult);
  settledOrThrow(goldrushResult);

  const contracts = contractsResult.status === 'fulfilled' ? contractsFromResponse(contractsResult.value) : [];
  const nfts = nftsResult.status === 'fulfilled' ? nftsResult.value : undefined;
  const collections = collectionsResult.status === 'fulfilled' ? collectionsFromResponse(collectionsResult.value) : [];
  const goldrushData = goldrushResult.status === 'fulfilled' ? goldrushResult.value : undefined;
  if (goldrushData) rememberGoldrushContractBalances(account, chainId, goldrushBalanceByContract(goldrushData));
  const replaceWithGoldrush = async (): Promise<Action[]> => {
    const goldrush = await readGoldrushInventory(
      account,
      chainId,
      signal,
      isGoldrushChainId(chainId) ? { data: goldrushData } : undefined
    );
    if (!goldrush.fetched) return [];

    forgetPreservedLoadedNfts(account, chainId);

    const inventory: EvmChainCollectiblesInventory = {
      settled: true,
      nftTotalCount: goldrush.collected.loaded.length,
      contractsTotalCount: goldrush.contracts.length,
      contracts: goldrush.contracts,
      collections,
      loaded: goldrush.collected.loaded
    };

    return [
      ...publishCollected(account, chainId, goldrush.collected),
      putEvmChainCollectiblesInventoryAction({ account, chainId, inventory })
    ];
  };

  if (!nfts) return replaceWithGoldrush();

  const collected = collectAlchemyNfts(nfts.ownedNfts);
  const goldrush = goldrushData ? inventoryFromGoldrush(goldrushData) : undefined;
  const sourced = goldrush
    ? listTokensBySource(collected.loaded, goldrush.collected.loaded)
    : collected.loaded.map(nft => ({ ...nft, sources: ['alchemy' as const] }));
  const sharedSlugs = goldrush
    ? new Set(sourced.filter(token => token.sources.length > 1).map(token => token.slug.toLowerCase()))
    : undefined;
  const alchemySample = await readOwnerListSample(
    account,
    chainId,
    singleSourceFirst(sourced),
    'alchemy',
    signal,
    sharedSlugs
  );
  if (alchemySample.rejectsList) return replaceWithGoldrush();

  const singleSource = goldrush
    ? await resolveSingleSource(account, chainId, sourced, alchemySample.answers, signal)
    : undefined;
  const ownershipAnswers = singleSource?.answers ?? alchemySample.answers;
  const proved = unownedFromOwnerSample(ownershipAnswers);
  const trimmed = withoutProvenUnowned(
    collected,
    contracts,
    proved.slugs.concat(singleSource?.decision.dropSlugs ?? []),
    proved.contractAddresses
  );
  const withSingleSource = includeSingleSourceTokens(
    trimmed.collected,
    trimmed.contracts,
    goldrush,
    singleSource?.decision
  );
  const adjustedCounts = withCloserGoldrushCounts(
    withSingleSource.contracts,
    collections,
    goldrushData ? goldrushBalanceByContract(goldrushData) : undefined,
    balanceOfByContractFromAnswers(ownershipAnswers)
  );
  const inventoryContracts = adjustedCounts.contracts;
  const nftTotalCount = Math.max(
    0,
    nfts.totalCount - trimmed.removed + withSingleSource.added + adjustedCounts.delta
  );
  const nftPageKey = nfts.pageKey;
  const addedContracts = withSingleSource.contracts.length - trimmed.contracts.length;
  const contractsTotalCount =
    contractsResult.status === 'fulfilled'
      ? Math.max(0, contractsResult.value.totalCount - trimmed.droppedContracts + addedContracts)
      : undefined;

  const inventory: EvmChainCollectiblesInventory = {
    settled: true,
    nftTotalCount,
    nftPageKey,
    contractsTotalCount,
    contracts: inventoryContracts,
    collections,
    loaded: withSingleSource.collected.loaded
  };

  return [
    ...publishCollected(account, chainId, withSingleSource.collected),
    putEvmChainCollectiblesInventoryAction({ account, chainId, inventory })
  ];
};

const readNftPage = async (
  account: HexString,
  chainId: number,
  pageKey: string | undefined,
  contractAddresses: string[] | undefined,
  replacePageKey: boolean,
  signal: AbortSignal,
  alreadyLoaded: readonly string[]
): Promise<Action[]> => {
  if (!isAlchemyChainId(chainId)) return [];

  const page = await getAlchemyNftsByOwner(
    chainId,
    account,
    true,
    pageKey,
    contractAddresses,
    signal,
    ALCHEMY_NFT_EXCLUDE_SPAM
  );
  const collected = collectAlchemyNfts(page.ownedNfts);

  rememberLoadedBeyondFirstPage(
    account,
    chainId,
    collected.loaded.map(nft => nft.slug),
    alreadyLoaded
  );

  return [
    ...publishCollected(account, chainId, collected),
    appendEvmChainCollectiblesInventoryAction({
      account,
      chainId,
      loaded: collected.loaded,
      nftPageKey: page.pageKey,
      replacePageKey
    })
  ];
};

const requestedNftPages = new Set<string>();
const nftPageControllers = new Map<string, AbortController>();

/** Drops this account's page history, including pages that already finished, and aborts the ones still running. */
const cancelNftPageLoads = (account: string) => {
  const prefix = `${account}:`;

  for (const key of requestedNftPages) {
    if (key.startsWith(prefix)) requestedNftPages.delete(key);
  }

  for (const [key, pageController] of nftPageControllers) {
    if (!key.startsWith(prefix)) continue;

    pageController.abort();
    nftPageControllers.delete(key);
  }
};

export const loadInventoryEpic: Epic<Action, Action, RootState> = (action$, state$) =>
  action$.pipe(
    filter(loadEvmCollectiblesInventoryAction.match),
    switchMap(({ payload }) => {
      cancelNftPageLoads(payload.account);
      const controller = new AbortController();
      const chainIds = payload.chainIds.filter(isAlchemyChainId);

      return concat(
        of(setEvmCollectiblesInventoryLoadingAction(true)),
        from(
          Promise.all(chainIds.map(chainId => readChainInventory(payload.account, chainId, controller.signal)))
        ).pipe(
          mergeMap(actionLists =>
            from(
              actionLists.flat().map(action => {
                if (!putEvmChainCollectiblesInventoryAction.match(action)) return action;

                const { account, chainId, inventory } = action.payload;
                const previous = state$.value.evmCollectiblesInventory.byAccount[account]?.[chainId];

                return putEvmChainCollectiblesInventoryAction({
                  account,
                  chainId,
                  inventory: withPreservedLoadedNfts(account, chainId, inventory, previous)
                });
              })
            )
          ),
          catchError(emptyAfterAbort)
        ),
        of(setEvmCollectiblesInventoryLoadingAction(false))
      ).pipe(finalize(() => controller.abort()));
    })
  );

export const loadNextPageEpic: Epic<Action, Action, RootState> = (action$, state$) =>
  action$.pipe(
    filter(loadEvmCollectiblesInventoryNextPageAction.match),
    mergeMap(({ payload }) => {
      if (!isAlchemyChainId(payload.chainId)) return EMPTY;

      const requestKey = `${payload.account}:${payload.chainId}:${payload.pageKey}`;
      if (requestedNftPages.has(requestKey)) return EMPTY;
      requestedNftPages.add(requestKey);

      const controller = new AbortController();
      nftPageControllers.set(requestKey, controller);
      const alreadyLoaded =
        state$.value.evmCollectiblesInventory.byAccount[payload.account]?.[payload.chainId]?.loaded?.map(
          nft => nft.slug
        ) ?? [];

      return from(
        readNftPage(
          payload.account,
          payload.chainId,
          payload.pageKey,
          undefined,
          true,
          controller.signal,
          alreadyLoaded
        )
      ).pipe(
        mergeMap(actions => from(actions)),
        catchError(error => {
          if (nftPageControllers.get(requestKey) === controller) requestedNftPages.delete(requestKey);

          return emptyAfterAbort(error);
        }),
        finalize(() => {
          if (nftPageControllers.get(requestKey) === controller) nftPageControllers.delete(requestKey);
          controller.abort();
        })
      );
    })
  );
