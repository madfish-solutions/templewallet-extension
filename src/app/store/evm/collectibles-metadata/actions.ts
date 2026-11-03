import { createAction } from '@reduxjs/toolkit';

import { NftAddressBalanceNftResponse } from 'lib/apis/temple/endpoints/evm/api.interfaces';
import { EvmCollectibleMetadata } from 'lib/metadata/types';
import { EvmNetworkEssentials } from 'temple/networks';

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
  loadAllChains: boolean;
  onChainSlugsByChain: Record<number, string[]>;
  readAllInBackground: boolean;
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
}>('evm/collectible-metadata/MARK_SLUGS_CHECKED');
