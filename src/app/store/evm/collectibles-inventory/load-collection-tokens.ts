import { Action } from 'redux';
import { Epic } from 'redux-observable';
import { EMPTY, from } from 'rxjs';
import { catchError, filter, finalize, mergeMap, tap } from 'rxjs/operators';

import { RootState } from 'app/store/root-state.type';
import {
  ALCHEMY_NFT_EXCLUDE_SPAM,
  getAlchemyNftsByOwner,
  getOpenseaChainNftsMetadata
} from 'lib/apis/temple/endpoints/evm';
import { AlchemyChainID } from 'lib/apis/temple/endpoints/evm/alchemy';
import { OpenseaChainID, OpenseaNftDetailed } from 'lib/apis/temple/endpoints/evm/opensea';
import { isAbortError, withRateLimitRetry } from 'lib/apis/utils';
import { fromAssetSlug, toTokenSlug } from 'lib/assets';
import { EvmCollectibleMetadata } from 'lib/metadata/types';

import { enableEvmCollectiblesAction } from '../assets/actions';
import { putEvmCollectiblesMetadataAction } from '../collectibles-metadata/actions';

import {
  appendEvmChainCollectiblesInventoryAction,
  loadEvmCollectionTokensAction,
  reconcileEvmCollectiblesOwnershipAction
} from './actions';
import { isAlchemyChainId, isOpenseaChainId } from './chains';
import {
  ALCHEMY_CONTRACT_FILTER_LIMIT,
  ALCHEMY_TOKEN_ID_PAGE_LIMIT,
  collectAlchemyNfts,
  emptyAfterAbort,
  emptyCollected,
  metadataFromOpenseaOwnedNft,
  publishCollected,
  CollectedNfts
} from './collected-nfts';
import { isUnusableAlchemyOwnerPage } from './collection-load';
import { OwnershipSource } from './ownership';
import { InventoryLoadedNft } from './place-collections';
import {
  mergeCollectibleMetadata,
  ReportedCollectible,
  verifyCollectionOwnership
} from './verify-collection-ownership';

/** Visible collection previews share this many owner-NFT requests at once. */
const COLLECTION_LOAD_CONCURRENCY = 2;
/** Further 429 responses each wait for their own `Retry-After` and then try once more, up to this many times. */
const COLLECTION_RATE_LIMIT_RETRY_LIMIT = 3;

const requestedCollectionLoads = new Set<string>();

const readAlchemyOwnerPage = (
  account: HexString,
  chainId: AlchemyChainID,
  contractAddresses: string[],
  pageKey: string | undefined,
  signal: AbortSignal
) =>
  withRateLimitRetry(
    () => getAlchemyNftsByOwner(chainId, account, true, pageKey, contractAddresses, signal, ALCHEMY_NFT_EXCLUDE_SPAM),
    signal,
    COLLECTION_RATE_LIMIT_RETRY_LIMIT
  );

const positiveBalance = (quantityString: string | undefined, quantity: number | undefined) => {
  if (quantityString && quantityString !== '0') return quantityString;
  if (typeof quantity === 'number' && Number.isFinite(quantity) && quantity > 0) return String(quantity);

  return undefined;
};

/** Balance of this account. By-account sends `quantity`; the single-NFT route sends `owners`. */
const openseaBalanceForAccount = (nft: OpenseaNftDetailed, account: string) => {
  const owner = nft.owners?.find(item => item.address.toLowerCase() === account.toLowerCase());
  if (owner) return positiveBalance(owner.quantityString, owner.quantity);

  return positiveBalance(nft.quantityString, nft.quantity);
};

const collectOpenseaCollectionNfts = (
  nfts: readonly OpenseaNftDetailed[],
  account: string,
  collectionSlug: string,
  collectionName: string
): CollectedNfts => {
  const collected = emptyCollected();

  for (const nft of nfts) {
    let metadata: EvmCollectibleMetadata;

    try {
      metadata = metadataFromOpenseaOwnedNft(nft, collectionName);
    } catch {
      continue;
    }

    const slug = toTokenSlug(metadata.address, metadata.tokenId);
    if (collected.records[slug]) continue;

    collected.records[slug] = metadata;
    collected.loaded.push({
      slug,
      contractAddress: metadata.address,
      collectionSlug: nft.collection || collectionSlug,
      balance: openseaBalanceForAccount(nft, account)
    });
    collected.slugs.push(slug);
  }

  return collected;
};

/** One OpenSea page for this collection. `next` is not followed. */
const readOpenseaCollectionNfts = async (
  account: HexString,
  chainId: OpenseaChainID,
  collectionSlug: string,
  collectionName: string | undefined,
  signal: AbortSignal
): Promise<{ actions: Action[]; collected: CollectedNfts }> => {
  const response = await withRateLimitRetry(
    () => getOpenseaChainNftsMetadata(chainId, account, collectionSlug, undefined, signal),
    signal,
    COLLECTION_RATE_LIMIT_RETRY_LIMIT
  );
  const nfts = response.nfts ?? [];

  const collected = collectOpenseaCollectionNfts(nfts, account, collectionSlug, collectionName || collectionSlug);

  return {
    actions: [
      ...publishCollected(account, chainId, collected),
      appendEvmChainCollectiblesInventoryAction({
        account,
        chainId,
        loaded: collected.loaded,
        replaceCollectionSlug: true
      })
    ],
    collected
  };
};

const reportedCollectibles = (
  loaded: readonly InventoryLoadedNft[],
  source: OwnershipSource,
  openseaNamed: boolean
): ReportedCollectible[] =>
  loaded.flatMap(nft => {
    const tokenId = fromAssetSlug(nft.slug)[1];
    if (!tokenId) return [];

    return [
      {
        slug: nft.slug,
        contractAddress: nft.contractAddress,
        tokenId,
        source,
        collectionSlug: nft.collectionSlug,
        openseaCollection: openseaNamed ? nft.collectionSlug : undefined,
        balance: nft.balance
      }
    ];
  });

const verifiedCollectionActions = async (
  state: RootState,
  account: HexString,
  chainId: number,
  contractAddresses: readonly string[],
  reported: ReportedCollectible[],
  openseaQueried: boolean,
  metadataBySlug: StringRecord<EvmCollectibleMetadata>,
  signal: AbortSignal
): Promise<Action[] | null> => {
  const inventory = state.evmCollectiblesInventory.byAccount[account]?.[chainId];
  const contractSet = new Set(contractAddresses.map(address => address.toLowerCase()));
  const onTheseContracts = (address: string) => contractSet.has(address.toLowerCase());
  const stored = (inventory?.loaded ?? []).filter(nft => onTheseContracts(nft.contractAddress));
  const knownSlugs = new Set((inventory?.collections ?? []).map(collection => collection.slug));
  const seen = new Set(reported.map(nft => nft.slug));

  for (const nft of stored) {
    if (seen.has(nft.slug)) continue;
    const tokenId = fromAssetSlug(nft.slug)[1];
    if (!tokenId) continue;
    seen.add(nft.slug);
    reported.push({
      slug: nft.slug,
      contractAddress: nft.contractAddress,
      tokenId,
      source: 'alchemy',
      collectionSlug: nft.collectionSlug,
      openseaCollection: nft.collectionSlug && knownSlugs.has(nft.collectionSlug) ? nft.collectionSlug : undefined,
      balance: nft.balance
    });
  }

  const queriedSources: OwnershipSource[] = ['alchemy'];
  if (reported.some(nft => nft.source === 'goldrush')) queriedSources.push('goldrush');
  const partialSources: OwnershipSource[] = openseaQueried ? ['opensea'] : [];

  try {
    const verified = await verifyCollectionOwnership(
      account,
      chainId,
      contractAddresses,
      reported,
      queriedSources,
      partialSources,
      stored,
      inventory?.collections ?? [],
      signal
    );
    if (!verified) return null;

    const records: StringRecord<EvmCollectibleMetadata> = {};
    for (const nft of verified.upsert) {
      const merged = mergeCollectibleMetadata(metadataBySlug[nft.slug], verified.metadata[nft.slug]);
      if (merged) records[nft.slug] = merged;
    }

    const actions: Action[] = [];
    const slugs = verified.upsert.map(nft => nft.slug);
    if (Object.keys(records).length) actions.push(putEvmCollectiblesMetadataAction({ chainId, records }));
    if (slugs.length) actions.push(enableEvmCollectiblesAction({ publicKeyHash: account, chainId, slugs }));
    actions.push(
      reconcileEvmCollectiblesOwnershipAction({
        account,
        chainId,
        removeSlugs: verified.removeSlugs,
        upsert: verified.upsert,
        collectionCounts: verified.collectionCounts
      })
    );

    return actions;
  } catch (error) {
    if (isAbortError(error)) throw error;

    console.error(error);

    return null;
  }
};

export const loadCollectionTokensEpic: Epic<Action, Action, RootState> = (action$, state$) =>
  action$.pipe(
    filter(loadEvmCollectionTokensAction.match),
    mergeMap(({ payload }) => {
      if (!isAlchemyChainId(payload.chainId) || !payload.contractAddresses.length) return EMPTY;

      const key = [
        payload.account,
        payload.chainId,
        payload.openseaCollection ?? '',
        payload.contractAddresses
          .map(address => address.toLowerCase())
          .sort()
          .join()
      ].join(':');
      if (requestedCollectionLoads.has(key)) return EMPTY;
      requestedCollectionLoads.add(key);

      const controller = new AbortController();
      const chainId = payload.chainId;
      let finished = false;
      let openseaFailed = false;

      return from(
        (async () => {
          const actions: Action[] = [];
          const reported: ReportedCollectible[] = [];
          const metadataBySlug: StringRecord<EvmCollectibleMetadata> = {};
          let sawUnusablePage = false;
          let suppliedCollection = false;
          let openseaQueried = false;
          const matchesCollection = (loaded: readonly InventoryLoadedNft[]) =>
            !payload.openseaCollection || loaded.some(nft => nft.collectionSlug === payload.openseaCollection);
          const remember = (collected: CollectedNfts, source: OwnershipSource, openseaNamed: boolean) => {
            Object.assign(metadataBySlug, collected.records);
            reported.push(...reportedCollectibles(collected.loaded, source, openseaNamed));
          };

          try {
            for (let index = 0; index < payload.contractAddresses.length; index += ALCHEMY_CONTRACT_FILTER_LIMIT) {
              const batch = payload.contractAddresses.slice(index, index + ALCHEMY_CONTRACT_FILTER_LIMIT);
              let pageKey: string | undefined;
              let receivedCount = 0;
              let previousTotalCount: number | undefined;

              for (let pageIndex = 0; pageIndex < ALCHEMY_TOKEN_ID_PAGE_LIMIT; pageIndex++) {
                const page = await readAlchemyOwnerPage(payload.account, chainId, batch, pageKey, controller.signal);

                if (
                  isUnusableAlchemyOwnerPage(page, {
                    receivedCount,
                    previousTotalCount: previousTotalCount ?? page.totalCount
                  })
                ) {
                  sawUnusablePage = true;
                  break;
                }

                previousTotalCount = page.totalCount;
                receivedCount += page.ownedNfts.length;

                if (page.ownedNfts.length > 0) {
                  const collected = collectAlchemyNfts(page.ownedNfts);
                  if (matchesCollection(collected.loaded)) suppliedCollection = true;
                  remember(collected, 'alchemy', false);
                  actions.push(
                    ...publishCollected(payload.account, chainId, collected),
                    appendEvmChainCollectiblesInventoryAction({
                      account: payload.account,
                      chainId,
                      loaded: collected.loaded
                    })
                  );
                }

                if (!page.pageKey) break;
                pageKey = page.pageKey;
              }
            }
          } catch (error) {
            if (isAbortError(error)) throw error;

            console.error(error);
            sawUnusablePage = true;
          }

          const openseaCollection = payload.openseaCollection;
          if ((sawUnusablePage || !suppliedCollection) && openseaCollection && isOpenseaChainId(chainId)) {
            try {
              const opensea = await readOpenseaCollectionNfts(
                payload.account,
                chainId,
                openseaCollection,
                payload.collectionName,
                controller.signal
              );
              remember(opensea.collected, 'opensea', true);
              openseaQueried = true;
              actions.push(...opensea.actions);
            } catch (error) {
              if (isAbortError(error)) throw error;

              console.error(error);
              openseaFailed = true;
            }
          }

          const verified = await verifiedCollectionActions(
            state$.value,
            payload.account,
            chainId,
            payload.contractAddresses,
            reported,
            openseaQueried,
            metadataBySlug,
            controller.signal
          );

          return verified ?? actions;
        })()
      ).pipe(
        mergeMap(actions => from(actions)),
        tap({
          complete: () => {
            if (!openseaFailed) finished = true;
          }
        }),
        catchError(emptyAfterAbort),
        finalize(() => {
          if (!finished) requestedCollectionLoads.delete(key);
          controller.abort();
        })
      );
    }, COLLECTION_LOAD_CONCURRENCY)
  );
