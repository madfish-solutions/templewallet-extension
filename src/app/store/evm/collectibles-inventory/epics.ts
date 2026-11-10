import { Action } from 'redux';
import { combineEpics, Epic } from 'redux-observable';
import { EMPTY, concat, from, of } from 'rxjs';
import { catchError, filter, finalize, mergeMap, switchMap, tap } from 'rxjs/operators';
import { getAddress } from 'viem';

import { RootState } from 'app/store/root-state.type';
import {
  ALCHEMY_NFT_EXCLUDE_SPAM,
  getAlchemyNftsByOwner,
  getEvmCollectiblesMetadata,
  getNftAlchemyContractsByOwner,
  getOpenseaAccountCollections,
  getOpenseaChainNftsMetadata,
  getOpenseaSearchResults
} from 'lib/apis/temple/endpoints/evm';
import { AlchemyChainID, GetContractsForOwnerResponse, NftsResponse } from 'lib/apis/temple/endpoints/evm/alchemy';
import { isGoldrushChainId } from 'lib/apis/temple/endpoints/evm/api.utils';
import { OpenseaChainID, OpenseaNftDetailed } from 'lib/apis/temple/endpoints/evm/opensea';
import { isAbortError, readRetryAfterMs } from 'lib/apis/utils';
import { fromAssetSlug, toTokenSlug } from 'lib/assets';
import { EvmCollectibleMetadata } from 'lib/metadata/types';
import { delayUnlessAborted } from 'lib/utils/delay-unless-aborted';

import { enableEvmCollectiblesAction } from '../assets/actions';
import { putEvmCollectiblesMetadataAction } from '../collectibles-metadata/actions';
import { buildEvmCollectibleMetadataFromOpensea, isSharedStorefrontTokenId } from '../collectibles-metadata/utils';

import {
  appendEvmChainCollectiblesInventoryAction,
  clearEvmCollectiblesSearchAction,
  loadEvmCollectiblesInventoryAction,
  loadEvmCollectiblesInventoryNextPageAction,
  loadEvmCollectionTokensAction,
  putEvmChainCollectiblesInventoryAction,
  putEvmCollectiblesSearchHitsAction,
  reconcileEvmCollectiblesOwnershipAction,
  searchEvmCollectiblesAction,
  setEvmCollectiblesInventoryLoadingAction,
  setEvmCollectiblesSearchLoadingAction
} from './actions';
import { loadedNftFromAlchemy, metadataFromAlchemyNft } from './alchemy-nft';
import { readOwnerListSample } from './alchemy-owner-sample';
import { isAlchemyChainId, isOpenseaChainId } from './chains';
import { isUnusableAlchemyOwnerPage } from './collection-load';
import { inventoryFromGoldrush, withoutProvenUnowned } from './goldrush-inventory';
import { OwnershipSource } from './ownership';
import { InventoryCollectionRef, InventoryContractRef, InventoryLoadedNft } from './place-collections';
import { alchemyContractAddressesForSearch, directContractSearch } from './search-query';
import { EvmChainCollectiblesInventory, EvmCollectibleSearchHit } from './state';
import { ReportedCollectible, verifyCollectionOwnership } from './verify-collection-ownership';

const ALCHEMY_CONTRACT_FILTER_LIMIT = 45;
const ALCHEMY_TOKEN_ID_PAGE_LIMIT = 5;
/** Visible collection previews share this many owner-NFT requests at once. */
const COLLECTION_LOAD_CONCURRENCY = 2;
/** Further 429 responses each wait for their own `Retry-After` and then try once more, up to this many times. */
const COLLECTION_RATE_LIMIT_RETRY_LIMIT = 3;

const distinctCount = (value: string) => {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
};

const sameTokenId = (left: string, right: string) => {
  if (left === right) return true;
  if (!/^\d+$/.test(left) || !/^\d+$/.test(right)) return false;

  try {
    return BigInt(left) === BigInt(right);
  } catch {
    return false;
  }
};

const checksumAddress = (address: string) => {
  try {
    return getAddress(address);
  } catch {
    return undefined;
  }
};

interface CollectedNfts {
  records: StringRecord<EvmCollectibleMetadata>;
  loaded: InventoryLoadedNft[];
  slugs: string[];
}

const emptyCollected = (): CollectedNfts => ({ records: {}, loaded: [], slugs: [] });

const collectAlchemyNfts = (nfts: NftsResponse['ownedNfts']): CollectedNfts => {
  const collected = emptyCollected();

  for (const nft of nfts) {
    const metadata = metadataFromAlchemyNft(nft);
    if (!metadata) continue;

    const slug = toTokenSlug(metadata.address, metadata.tokenId);
    collected.records[slug] = metadata;
    collected.loaded.push(loadedNftFromAlchemy(nft, slug));
    collected.slugs.push(slug);
  }

  return collected;
};

const contractsFromResponse = (response: GetContractsForOwnerResponse): InventoryContractRef[] => {
  const contracts: InventoryContractRef[] = [];

  for (const contract of response.contracts) {
    const address = checksumAddress(contract.address);
    if (!address) continue;

    contracts.push({
      address,
      name: contract.name || contract.openSeaMetadata.collectionName,
      distinctTokensOwned: distinctCount(contract.numDistinctTokensOwned),
      imageUrl:
        contract.image.thumbnailUrl || contract.image.cachedUrl || contract.image.pngUrl || contract.image.originalUrl
    });
  }

  return contracts;
};

const ACCOUNT_COLLECTIONS_PAGE_LIMIT = 5;

const readAccountCollections = async (chainId: number, account: HexString, signal: AbortSignal) => {
  if (!isOpenseaChainId(chainId)) return [];

  const collections: Awaited<ReturnType<typeof getOpenseaAccountCollections>>['collections'] = [];
  let after: string | undefined;

  for (let page = 0; page < ACCOUNT_COLLECTIONS_PAGE_LIMIT; page++) {
    const response = await getOpenseaAccountCollections([chainId], account, 100, after, signal);
    collections.push(...response.collections);
    if (!response.next) break;
    after = response.next;
  }

  return collections;
};

const collectionsFromResponse = (
  collections: Awaited<ReturnType<typeof getOpenseaAccountCollections>>['collections']
): InventoryCollectionRef[] =>
  collections.map(collection => ({
    slug: collection.collection,
    name: collection.name,
    imageUrl: collection.imageUrl || undefined,
    itemCount: collection.itemCount,
    contractAddresses: collection.contracts.map(contract => contract.address)
  }));

const emptyGoldrushInventory = (): { collected: CollectedNfts; contracts: InventoryContractRef[] } => ({
  collected: emptyCollected(),
  contracts: []
});

const readGoldrushInventory = async (account: HexString, chainId: number, signal: AbortSignal) => {
  if (!isGoldrushChainId(chainId)) return emptyGoldrushInventory();

  try {
    const data = await getEvmCollectiblesMetadata(account, chainId, signal);
    const goldrush = inventoryFromGoldrush(data);
    const sample = await readOwnerListSample(account, chainId, goldrush.collected.loaded, 'goldrush', signal);
    if (sample.rejectsList) return emptyGoldrushInventory();

    const trimmed = withoutProvenUnowned(goldrush.collected, goldrush.contracts, sample.unownedSlugs);

    return { collected: trimmed.collected, contracts: trimmed.contracts };
  } catch (error) {
    if (isAbortError(error)) throw error;
    console.error(error);

    return emptyGoldrushInventory();
  }
};

const publishCollected = (account: HexString, chainId: number, collected: CollectedNfts): Action[] => {
  const actions: Action[] = [];

  if (collected.slugs.length) {
    actions.push(
      putEvmCollectiblesMetadataAction({ chainId, records: collected.records }),
      enableEvmCollectiblesAction({ publicKeyHash: account, chainId, slugs: collected.slugs })
    );
  }

  return actions;
};

const readChainInventory = async (account: HexString, chainId: number, signal: AbortSignal): Promise<Action[]> => {
  if (!isAlchemyChainId(chainId)) return [];

  const [contractsResult, nftsResult, collectionsResult] = await Promise.allSettled([
    getNftAlchemyContractsByOwner(chainId, account, undefined, signal, ALCHEMY_NFT_EXCLUDE_SPAM),
    getAlchemyNftsByOwner(chainId, account, true, undefined, undefined, signal, ALCHEMY_NFT_EXCLUDE_SPAM),
    readAccountCollections(chainId, account, signal)
  ]);

  const contracts = contractsResult.status === 'fulfilled' ? contractsFromResponse(contractsResult.value) : [];
  const nfts = nftsResult.status === 'fulfilled' ? nftsResult.value : undefined;
  const collected = nfts ? collectAlchemyNfts(nfts.ownedNfts) : emptyCollected();
  const collections = collectionsResult.status === 'fulfilled' ? collectionsFromResponse(collectionsResult.value) : [];
  const alchemySample = await readOwnerListSample(account, chainId, collected.loaded, 'alchemy', signal);
  let trusted = collected;
  let inventoryContracts = contracts;
  let nftTotalCount = nfts?.totalCount;
  let nftPageKey = nfts?.pageKey;
  let contractsTotalCount = contractsResult.status === 'fulfilled' ? contractsResult.value.totalCount : undefined;

  if (alchemySample.rejectsList) {
    const goldrush = await readGoldrushInventory(account, chainId, signal);
    trusted = goldrush.collected;
    inventoryContracts = goldrush.contracts;
    nftTotalCount = trusted.loaded.length;
    nftPageKey = undefined;
    contractsTotalCount = inventoryContracts.length;
  } else {
    const trimmed = withoutProvenUnowned(collected, contracts, alchemySample.unownedSlugs);
    trusted = trimmed.collected;
    inventoryContracts = trimmed.contracts.slice();
    if (nftTotalCount != null) nftTotalCount = Math.max(0, nftTotalCount - trimmed.removed);
    if (contractsTotalCount != null) contractsTotalCount = Math.max(0, contractsTotalCount - trimmed.droppedContracts);
  }

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

const metadataFromOpenseaOwnedNft = (nft: OpenseaNftDetailed, collectionName: string) => {
  const metadata = buildEvmCollectibleMetadataFromOpensea(nft, nft.contract, nft.identifier);
  const storefront = isSharedStorefrontTokenId(nft.identifier);
  const name = storefront ? nft.collection : collectionName;

  return {
    ...metadata,
    name,
    openseaCollection: storefront ? nft.collection : undefined,
    collectibleName: nft.name || undefined
  };
};

interface SearchSink {
  collected: CollectedNfts;
  hits: EvmCollectibleSearchHit[];
}

const rememberHit = (
  sink: SearchSink,
  chainId: number,
  metadata: EvmCollectibleMetadata,
  collectionSlug: string | undefined
) => {
  const slug = toTokenSlug(metadata.address, metadata.tokenId);
  if (!sink.collected.records[slug]) {
    sink.collected.records[slug] = metadata;
    sink.collected.slugs.push(slug);
  }

  const existing = sink.hits.find(hit => hit.slug === slug);
  if (!existing) {
    sink.hits.push({
      chainId,
      slug,
      contractAddress: metadata.address,
      collectionSlug,
      title: metadata.name
    });

    return;
  }

  if (!existing.collectionSlug && collectionSlug) existing.collectionSlug = collectionSlug;
  if (!existing.title && metadata.name) existing.title = metadata.name;
};

const hitsFromOpenseaNfts = (
  chainId: number,
  nfts: readonly OpenseaNftDetailed[],
  collectionName: string,
  sink: SearchSink
) => {
  for (const nft of nfts) {
    const address = checksumAddress(nft.contract);
    if (!address) continue;

    let metadata: EvmCollectibleMetadata;

    try {
      metadata = metadataFromOpenseaOwnedNft(nft, collectionName);
    } catch {
      continue;
    }

    rememberHit(sink, chainId, metadata, nft.collection);
  }
};

const collectOpenseaSearch = async (
  account: HexString,
  chainId: AlchemyChainID & OpenseaChainID,
  query: string,
  sink: SearchSink,
  signal: AbortSignal
) => {
  const response = await getOpenseaSearchResults([chainId], query, 20, undefined, signal);
  const nftHits = response.results.flatMap(result => (result.type === 'nft' ? [result.nft] : []));
  const collectionHits = response.results.flatMap(result => (result.type === 'collection' ? [result.collection] : []));
  const wantedContracts = Array.from(new Set(nftHits.map(nft => nft.contract)));

  for (let index = 0; index < wantedContracts.length; index += ALCHEMY_CONTRACT_FILTER_LIMIT) {
    const contractAddresses = wantedContracts.slice(index, index + ALCHEMY_CONTRACT_FILTER_LIMIT);
    const page = await getAlchemyNftsByOwner(
      chainId,
      account,
      true,
      undefined,
      contractAddresses,
      signal,
      ALCHEMY_NFT_EXCLUDE_SPAM
    );

    for (const nft of page.ownedNfts) {
      const matched = nftHits.some(
        hit =>
          hit.contract.toLowerCase() === nft.contract.address.toLowerCase() && sameTokenId(hit.identifier, nft.tokenId)
      );
      if (!matched) continue;

      const metadata = metadataFromAlchemyNft(nft);
      if (!metadata) continue;

      rememberHit(sink, chainId, metadata, nft.collection?.slug);
    }
  }

  for (const collection of collectionHits) {
    const page = await getOpenseaChainNftsMetadata(chainId, account, collection.collection, undefined, signal);
    hitsFromOpenseaNfts(chainId, page.nfts, collection.name, sink);
  }
};

/** Owned NFTs of the given contracts. A token id is followed for a few pages of that contract. */
const collectAlchemyContractNfts = async (
  account: HexString,
  chainId: AlchemyChainID,
  contractAddresses: string[],
  tokenId: string | undefined,
  sink: SearchSink,
  signal: AbortSignal
) => {
  let pageKey: string | undefined;
  const pageLimit = tokenId ? ALCHEMY_TOKEN_ID_PAGE_LIMIT : 1;

  for (let page = 0; page < pageLimit; page++) {
    const response = await getAlchemyNftsByOwner(
      chainId,
      account,
      true,
      pageKey,
      contractAddresses,
      signal,
      ALCHEMY_NFT_EXCLUDE_SPAM
    );
    let foundToken = false;

    for (const nft of response.ownedNfts) {
      if (tokenId && !sameTokenId(tokenId, nft.tokenId)) continue;

      const metadata = metadataFromAlchemyNft(nft);
      if (!metadata) continue;

      rememberHit(sink, chainId, metadata, nft.collection?.slug);
      foundToken = true;
    }

    if (!tokenId || foundToken || !response.pageKey) break;
    pageKey = response.pageKey;
  }
};

const searchChain = async (
  account: HexString,
  chainId: number,
  query: string,
  inventory: EvmChainCollectiblesInventory | undefined,
  signal: AbortSignal
): Promise<{ hits: EvmCollectibleSearchHit[]; actions: Action[] }> => {
  if (!isAlchemyChainId(chainId)) return { hits: [], actions: [] };

  const sink: SearchSink = { collected: emptyCollected(), hits: [] };
  const direct = directContractSearch(query);
  const contractAddresses = direct
    ? [direct.address]
    : alchemyContractAddressesForSearch(query, inventory?.contracts ?? [], inventory?.collections ?? []);

  const requests: Promise<void>[] = [];
  if (isOpenseaChainId(chainId)) requests.push(collectOpenseaSearch(account, chainId, query, sink, signal));
  if (contractAddresses.length)
    requests.push(collectAlchemyContractNfts(account, chainId, contractAddresses, direct?.tokenId, sink, signal));

  await Promise.all(requests);

  return { hits: sink.hits, actions: publishCollected(account, chainId, sink.collected) };
};

const emptyAfterAbort = (error: unknown) => {
  if (!isAbortError(error)) console.error(error);

  return EMPTY;
};

const loadInventoryEpic: Epic<Action, Action> = action$ =>
  action$.pipe(
    filter(loadEvmCollectiblesInventoryAction.match),
    switchMap(({ payload }) => {
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

const requestedNftPages = new Set<string>();

const loadNextPageEpic: Epic<Action, Action> = action$ =>
  action$.pipe(
    filter(loadEvmCollectiblesInventoryNextPageAction.match),
    mergeMap(({ payload }) => {
      if (!isAlchemyChainId(payload.chainId)) return EMPTY;

      const requestKey = `${payload.account}:${payload.chainId}:${payload.pageKey}`;
      if (requestedNftPages.has(requestKey)) return EMPTY;
      requestedNftPages.add(requestKey);

      const controller = new AbortController();

      return from(
        readNftPage(payload.account, payload.chainId, payload.pageKey, undefined, true, controller.signal)
      ).pipe(
        mergeMap(actions => from(actions)),
        catchError(error => {
          requestedNftPages.delete(requestKey);

          return emptyAfterAbort(error);
        }),
        finalize(() => controller.abort())
      );
    })
  );

const requestedCollectionLoads = new Set<string>();

const readAlchemyOwnerPage = async (
  account: HexString,
  chainId: AlchemyChainID,
  contractAddresses: string[],
  pageKey: string | undefined,
  signal: AbortSignal
) => {
  for (let attempt = 0; ; attempt++) {
    try {
      return await getAlchemyNftsByOwner(
        chainId,
        account,
        true,
        pageKey,
        contractAddresses,
        signal,
        ALCHEMY_NFT_EXCLUDE_SPAM
      );
    } catch (error) {
      const delayMs = readRetryAfterMs(error);
      if (delayMs === undefined || attempt >= COLLECTION_RATE_LIMIT_RETRY_LIMIT) throw error;

      await delayUnlessAborted(delayMs, signal);
    }
  }
};

const openseaBalanceForAccount = (nft: OpenseaNftDetailed, account: string) => {
  const owner = nft.owners?.find(item => item.address.toLowerCase() === account.toLowerCase());
  if (!owner) return undefined;

  return owner.quantityString || (Number.isFinite(owner.quantity) ? String(owner.quantity) : undefined);
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
  let nfts: OpenseaNftDetailed[] = [];

  for (let attempt = 0; ; attempt++) {
    try {
      const response = await getOpenseaChainNftsMetadata(chainId, account, collectionSlug, undefined, signal);
      nfts = response.nfts ?? [];
      break;
    } catch (error) {
      const delayMs = readRetryAfterMs(error);
      if (delayMs === undefined || attempt >= COLLECTION_RATE_LIMIT_RETRY_LIMIT) throw error;

      await delayUnlessAborted(delayMs, signal);
    }
  }

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
        openseaCollection: openseaNamed ? nft.collectionSlug : undefined
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
      openseaCollection: nft.collectionSlug && knownSlugs.has(nft.collectionSlug) ? nft.collectionSlug : undefined
    });
  }

  const assets = state.evmAssets.collectibles[account]?.[chainId] ?? {};
  for (const [slug, asset] of Object.entries(assets)) {
    if (asset.status === 'removed' || seen.has(slug)) continue;
    const [contract, tokenId] = fromAssetSlug<HexString>(slug);
    if (!tokenId || !onTheseContracts(contract)) continue;
    seen.add(slug);
    reported.push({ slug, contractAddress: contract, tokenId, source: 'goldrush' });
  }

  const queriedSources: OwnershipSource[] = ['alchemy'];
  if (openseaQueried) queriedSources.push('opensea');
  if (reported.some(nft => nft.source === 'goldrush')) queriedSources.push('goldrush');

  try {
    const verified = await verifyCollectionOwnership(
      account,
      chainId,
      contractAddresses,
      reported,
      queriedSources,
      stored,
      inventory?.collections ?? [],
      signal
    );
    if (!verified) return null;

    const records: StringRecord<EvmCollectibleMetadata> = { ...verified.metadata };
    for (const nft of verified.upsert) {
      const record = metadataBySlug[nft.slug];
      if (record) records[nft.slug] = record;
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

const loadCollectionTokensEpic: Epic<Action, Action, RootState> = (action$, state$) =>
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

const searchEpic: Epic<Action, Action, RootState> = (action$, state$) =>
  action$.pipe(
    filter(searchEvmCollectiblesAction.match),
    switchMap(({ payload }) => {
      const controller = new AbortController();
      const chainIds = payload.chainIds.filter(isAlchemyChainId);
      const inventoryByChain = state$.value.evmCollectiblesInventory.byAccount[payload.account];

      return concat(
        of(setEvmCollectiblesSearchLoadingAction(true)),
        from(
          (async () => {
            const hits: EvmCollectibleSearchHit[] = [];
            const actions: Action[] = [];

            for (const chainId of chainIds) {
              const searched = await searchChain(
                payload.account,
                chainId,
                payload.query,
                inventoryByChain?.[chainId],
                controller.signal
              );
              hits.push(...searched.hits);
              actions.push(...searched.actions);
            }

            actions.push(putEvmCollectiblesSearchHitsAction({ query: payload.query, hits }));

            return actions;
          })()
        ).pipe(
          mergeMap(actions => from(actions)),
          catchError(error => {
            if (isAbortError(error)) return EMPTY;

            console.error(error);

            return of(clearEvmCollectiblesSearchAction());
          })
        )
      ).pipe(finalize(() => controller.abort()));
    })
  );

export const evmCollectiblesInventoryEpics = combineEpics(
  loadInventoryEpic,
  loadNextPageEpic,
  loadCollectionTokensEpic,
  searchEpic
);
