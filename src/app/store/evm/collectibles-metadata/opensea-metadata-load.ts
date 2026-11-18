import { Action } from 'redux';

import { getOpenseaMultichainNftsMetadata, OpenseaNftDetailed, OpenseaNftRef } from 'lib/apis/temple/endpoints/evm';
import { isAbortError, readRetryAfterMs } from 'lib/apis/utils';
import { toTokenSlug } from 'lib/assets';
import { EvmCollectibleMetadata } from 'lib/metadata/types';

import { loadOpenseaStorefrontCollectionAction, putEvmCollectiblesMetadataAction } from './actions';
import { collectOpenseaMetadataRecords } from './opensea-records';
import { noteSharedStorefrontCollectionLoad, SharedStorefrontCollectionLoad } from './opensea-storefront';
import { EvmCollectibleMetadataRecord } from './state';

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
