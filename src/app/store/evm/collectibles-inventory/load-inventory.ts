import { Action } from 'redux';
import { Epic } from 'redux-observable';
import { EMPTY, concat, from, of } from 'rxjs';
import { catchError, filter, finalize, mergeMap, switchMap } from 'rxjs/operators';

import {
  ALCHEMY_NFT_EXCLUDE_SPAM,
  getAlchemyNftsByOwner,
  getEvmCollectiblesMetadata,
  getNftAlchemyContractsByOwner,
  getOpenseaAccountCollections
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
import { readOwnerListSample } from './alchemy-owner-sample';
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
import { inventoryFromGoldrush, withoutProvenUnowned } from './goldrush-inventory';
import { InventoryContractRef } from './place-collections';
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
  signal: AbortSignal
): Promise<GoldrushInventoryRead> => {
  if (!isGoldrushChainId(chainId)) return unreadGoldrushInventory();

  try {
    const data = await getEvmCollectiblesMetadata(account, chainId, signal);
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

const readChainInventory = async (account: HexString, chainId: number, signal: AbortSignal): Promise<Action[]> => {
  if (!isAlchemyChainId(chainId)) return [];

  const [contractsResult, nftsResult, collectionsResult] = await Promise.allSettled([
    getNftAlchemyContractsByOwner(chainId, account, undefined, signal, ALCHEMY_NFT_EXCLUDE_SPAM),
    readOwnerNfts(account, chainId, signal),
    readAccountCollections(chainId, account, signal)
  ]);
  settledOrThrow(contractsResult);
  settledOrThrow(nftsResult);
  settledOrThrow(collectionsResult);

  const contracts = contractsResult.status === 'fulfilled' ? contractsFromResponse(contractsResult.value) : [];
  const nfts = nftsResult.status === 'fulfilled' ? nftsResult.value : undefined;
  const collections = collectionsResult.status === 'fulfilled' ? collectionsFromResponse(collectionsResult.value) : [];
  const replaceWithGoldrush = async (): Promise<Action[]> => {
    const goldrush = await readGoldrushInventory(account, chainId, signal);
    if (!goldrush.fetched) return [];

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
  const alchemySample = await readOwnerListSample(account, chainId, collected.loaded, 'alchemy', signal);
  if (alchemySample.rejectsList) return replaceWithGoldrush();

  const trimmed = withoutProvenUnowned(
    collected,
    contracts,
    alchemySample.unownedSlugs,
    alchemySample.unownedContracts
  );
  const trusted = trimmed.collected;
  const inventoryContracts = trimmed.contracts.slice();
  const nftTotalCount = Math.max(0, nfts.totalCount - trimmed.removed);
  const nftPageKey = nfts.pageKey;
  const contractsTotalCount =
    contractsResult.status === 'fulfilled'
      ? Math.max(0, contractsResult.value.totalCount - trimmed.droppedContracts)
      : undefined;

  const inventory: EvmChainCollectiblesInventory = {
    settled: true,
    nftTotalCount,
    nftPageKey,
    contractsTotalCount,
    contracts: inventoryContracts,
    collections,
    loaded: trusted.loaded
  };

  return [
    ...publishCollected(account, chainId, trusted),
    putEvmChainCollectiblesInventoryAction({ account, chainId, inventory })
  ];
};

const readNftPage = async (
  account: HexString,
  chainId: number,
  pageKey: string | undefined,
  contractAddresses: string[] | undefined,
  replacePageKey: boolean,
  signal: AbortSignal
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

const cancelNftPageLoads = (account: string) => {
  const prefix = `${account}:`;

  for (const [key, pageController] of nftPageControllers) {
    if (!key.startsWith(prefix)) continue;

    pageController.abort();
    nftPageControllers.delete(key);
    requestedNftPages.delete(key);
  }
};

export const loadInventoryEpic: Epic<Action, Action> = action$ =>
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
          mergeMap(actionLists => from(actionLists.flat())),
          catchError(emptyAfterAbort)
        ),
        of(setEvmCollectiblesInventoryLoadingAction(false))
      ).pipe(finalize(() => controller.abort()));
    })
  );

export const loadNextPageEpic: Epic<Action, Action> = action$ =>
  action$.pipe(
    filter(loadEvmCollectiblesInventoryNextPageAction.match),
    mergeMap(({ payload }) => {
      if (!isAlchemyChainId(payload.chainId)) return EMPTY;

      const requestKey = `${payload.account}:${payload.chainId}:${payload.pageKey}`;
      if (requestedNftPages.has(requestKey)) return EMPTY;
      requestedNftPages.add(requestKey);

      const controller = new AbortController();
      nftPageControllers.set(requestKey, controller);

      return from(
        readNftPage(payload.account, payload.chainId, payload.pageKey, undefined, true, controller.signal)
      ).pipe(
        mergeMap(actions => from(actions)),
        catchError(error => {
          requestedNftPages.delete(requestKey);

          return emptyAfterAbort(error);
        }),
        finalize(() => {
          nftPageControllers.delete(requestKey);
          controller.abort();
        })
      );
    })
  );
