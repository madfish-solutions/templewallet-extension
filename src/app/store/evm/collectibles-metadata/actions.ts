import { createAction } from '@reduxjs/toolkit';

import { NftAddressBalanceNftResponse } from 'lib/apis/temple/endpoints/evm/api.interfaces';
import { OpenseaNftRef } from 'lib/apis/temple/endpoints/evm/opensea';
import { EvmCollectibleMetadata } from 'lib/metadata/types';
import { EvmNetworkEssentials } from 'temple/networks';

import { DeferredEvmCollectibleOnChainLoad } from './on-chain-queue';

interface processLoadedEvmCollectiblesMetadataActionPayload {
  chainId: number;
  data: NftAddressBalanceNftResponse;
}

export const processLoadedEvmCollectiblesMetadataAction =
  createAction<processLoadedEvmCollectiblesMetadataActionPayload>(
    'evm/collectible-metadata/PROCESS_LOADED_COLLECTIBLES_METADATA_ACTION'
  );

interface PutEvmCollectiblesMetadataActionActionPayload {
  chainId: number;
  records: StringRecord<EvmCollectibleMetadata | undefined>;
}

export const putEvmCollectiblesMetadataAction = createAction<PutEvmCollectiblesMetadataActionActionPayload>(
  'evm/collectible-metadata/PUT_COLLECTIBLES_METADATA_ACTION'
);

export const loadEvmCollectiblesMetadataAction = createAction<{
  publicKeyHash: HexString;
  chains: EvmNetworkEssentials[];
  visibleSlugsByChain: Record<number, string[]>;
  readAllInBackground: boolean;
  priorityChainIds: number[];
}>('evm/collectible-metadata/LOAD');

export const cancelEvmCollectiblesMetadataLoadingAction = createAction('evm/collectible-metadata/CANCEL_LOADING');

export const markEvmCollectiblesMetadataChainLoadedAction = createAction<{
  publicKeyHash: HexString;
  chainId: number;
}>('evm/collectible-metadata/MARK_CHAIN_LOADED');

export const markEvmCollectibleSlugsCheckedAction = createAction<{
  publicKeyHash: HexString;
  chainId: number;
  slugs: string[];
  retryAt?: number;
}>('evm/collectible-metadata/MARK_SLUGS_CHECKED');

/** Remaining visible on-chain reads. Processed one small batch at a time. */
export const continueEvmCollectiblesOnChainLoadAction = createAction<{
  items: DeferredEvmCollectibleOnChainLoad[];
}>('evm/collectible-metadata/CONTINUE_ON_CHAIN_LOAD');

interface RetryOpenseaCollectiblesMetadataPayloadBase {
  delayMs: number;
  attempt: number;
  publicKeyHash: HexString;
}

export type RetryOpenseaCollectiblesMetadataPayload = RetryOpenseaCollectiblesMetadataPayloadBase &
  (
    | { kind: 'batch'; refs: OpenseaNftRef[] }
    | { kind: 'account'; chainId: number }
    | { kind: 'collection'; chainId: number; collection: string; contractAddress: string }
  );

/** One collection-filtered account page for a shared-storefront collection the wallet still holds unnamed. */
export const loadOpenseaStorefrontCollectionAction = createAction<{
  publicKeyHash: HexString;
  chainId: number;
  collection: string;
  contractAddress: string;
}>('evm/collectible-metadata/LOAD_OPENSEA_STOREFRONT_COLLECTION');

/** A rate-limited OpenSea request. The wait happens in its own epic. */
export const retryOpenseaCollectiblesMetadataAction = createAction<RetryOpenseaCollectiblesMetadataPayload>(
  'evm/collectible-metadata/RETRY_OPENSEA'
);

export interface EvmCollectiblesMetadataSession {
  publicKeyHash: HexString;
  lastFullLoadAccount?: HexString;
  seenChains: number[];
  checkedSlugsByChain: Record<number, string[]>;
  onChainSlugsByChain: Record<number, string[]>;
}
