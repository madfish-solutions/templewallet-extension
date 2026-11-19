import { Action } from 'redux';
import { Epic } from 'redux-observable';
import { concat, EMPTY, from, of } from 'rxjs';
import { catchError, filter, finalize, mergeMap, switchMap } from 'rxjs/operators';

import { RootState } from 'app/store/root-state.type';
import {
  ALCHEMY_NFT_EXCLUDE_SPAM,
  getAlchemyNftsByOwner,
  getOpenseaChainNftsMetadata,
  getOpenseaSearchResults
} from 'lib/apis/temple/endpoints/evm';
import { AlchemyChainID } from 'lib/apis/temple/endpoints/evm/alchemy';
import { OpenseaChainID, OpenseaNftDetailed } from 'lib/apis/temple/endpoints/evm/opensea';
import { isAbortError, withRateLimitRetry } from 'lib/apis/utils';
import { toTokenSlug } from 'lib/assets';
import { EvmCollectibleMetadata } from 'lib/metadata/types';

import {
  clearEvmCollectiblesSearchAction,
  putEvmCollectiblesSearchHitsAction,
  searchEvmCollectiblesAction,
  setEvmCollectiblesSearchLoadingAction
} from './actions';
import { metadataFromAlchemyNft } from './alchemy-nft';
import { isAlchemyChainId, isOpenseaChainId } from './chains';
import {
  ALCHEMY_CONTRACT_FILTER_LIMIT,
  ALCHEMY_TOKEN_ID_PAGE_LIMIT,
  checksumAddress,
  emptyCollected,
  metadataFromOpenseaOwnedNft,
  publishCollected,
  sameTokenId,
  CollectedNfts
} from './collected-nfts';
import { alchemyContractAddressesForSearch, directContractSearch } from './search-query';
import { EvmChainCollectiblesInventory, EvmCollectibleSearchHit } from './state';

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
  const response = await withRateLimitRetry(
    () => getOpenseaSearchResults([chainId], query, 20, undefined, signal),
    signal
  );
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
    try {
      const page = await withRateLimitRetry(
        () => getOpenseaChainNftsMetadata(chainId, account, collection.collection, undefined, signal),
        signal
      );
      hitsFromOpenseaNfts(chainId, page.nfts, collection.name, sink);
    } catch (error) {
      if (isAbortError(error)) throw error;

      console.error(error);
    }
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
): Promise<{ hits: EvmCollectibleSearchHit[]; actions: Action[]; failed: boolean }> => {
  if (!isAlchemyChainId(chainId)) return { hits: [], actions: [], failed: false };

  const sink: SearchSink = { collected: emptyCollected(), hits: [] };
  const direct = directContractSearch(query);
  const contractAddresses = direct
    ? [direct.address]
    : alchemyContractAddressesForSearch(query, inventory?.contracts ?? [], inventory?.collections ?? []);
  let failed = false;
  const rememberFailure = (error: unknown) => {
    if (isAbortError(error)) throw error;

    console.error(error);
    failed = true;
  };

  const requests: Promise<void>[] = [];
  if (isOpenseaChainId(chainId))
    requests.push(collectOpenseaSearch(account, chainId, query, sink, signal).catch(rememberFailure));
  if (contractAddresses.length)
    requests.push(
      collectAlchemyContractNfts(account, chainId, contractAddresses, direct?.tokenId, sink, signal).catch(
        rememberFailure
      )
    );

  await Promise.all(requests);

  return {
    hits: sink.hits,
    actions: publishCollected(account, chainId, sink.collected, { enable: false }),
    failed: failed && sink.hits.length === 0
  };
};

export const searchEpic: Epic<Action, Action, RootState> = (action$, state$) =>
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

            let anySuccess = false;
            let anyFailure = false;

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
              if (searched.failed) anyFailure = true;
              else anySuccess = true;
            }

            if (anySuccess || !anyFailure)
              actions.push(putEvmCollectiblesSearchHitsAction({ query: payload.query, hits }));
            else actions.push(setEvmCollectiblesSearchLoadingAction(false));

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
