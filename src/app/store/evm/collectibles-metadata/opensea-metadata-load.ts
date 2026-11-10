import { Action } from 'redux';

import { isOpenseaChainId } from 'app/store/evm/collectibles-inventory/chains';
import { RootState } from 'app/store/root-state.type';
import {
  getEvmCollectiblesMetadata,
  getOpenseaMultichainNftsMetadata,
  NftAddressBalanceNftResponse,
  OpenseaNftDetailed,
  OpenseaNftRef
} from 'lib/apis/temple/endpoints/evm';
import { isGoldrushChainId } from 'lib/apis/temple/endpoints/evm/api.utils';
import { isAbortError, readRetryAfterMs } from 'lib/apis/utils';
import { toTokenSlug } from 'lib/assets';
import { EvmCollectibleMetadata } from 'lib/metadata/types';
import { isTruthy } from 'lib/utils';
import { EvmNetworkEssentials } from 'temple/networks';

import {
  loadOpenseaStorefrontCollectionAction,
  processLoadedEvmCollectiblesMetadataAction,
  putEvmCollectiblesMetadataAction,
  retryOpenseaCollectiblesMetadataAction
} from './actions';
import { collectOpenseaMetadataRecords, loadOpenseaAccountNfts } from './opensea-records';
import {
  noteSharedStorefrontCollectionLoad,
  sharedStorefrontCollectionsToLoad,
  SharedStorefrontCollectionLoad
} from './opensea-storefront';
import { EvmCollectibleMetadataRecord } from './state';
import { getSlugsWithProperCollectibleMetadata } from './utils';

/** Further 429 responses each wait for their own `Retry-After` and then try once more, up to this many times. */
export const OPENSEA_RATE_LIMIT_RETRY_LIMIT = 3;

interface OpenseaBatchLoad {
  results: Array<OpenseaNftDetailed | null>;
  retries: { refs: OpenseaNftRef[]; readyAt: number }[];
}

export const loadOpenseaBatch = async (
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

export const retryDelayMs = (readyAt: number) => Math.max(0, readyAt - Date.now());

export const putOpenseaBatchRecords = (
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

export const putOpenseaRecordsAction = (chainId: number, records: StringRecord<EvmCollectibleMetadata>) =>
  Object.keys(records).length ? putEvmCollectiblesMetadataAction({ chainId, records }) : undefined;

/** Collection slugs already sent to the filtered account route this session. */
export const requestedStorefrontCollections = new Set<string>();

export const actionsForStorefrontCollections = (
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

export const fetchChainCollectiblesMetadata = async (
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
  const fetchOpensea = !isTestnetMode && isOpenseaChainId(chainId);

  let goldrushData: NftAddressBalanceNftResponse | undefined;
  if (!isTestnetMode && isGoldrushChainId(chainId)) {
    try {
      goldrushData = await getEvmCollectiblesMetadata(publicKeyHash, chainId, signal);
    } catch (error) {
      if (isAbortError(error)) throw error;

      console.error(error);
    }
  }

  const openseaLoad = fetchOpensea
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

export const fetchOpenseaMetadata = async (
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
