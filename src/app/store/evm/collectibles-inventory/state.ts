import { InventoryCollectionRef, InventoryContractRef, InventoryLoadedNft } from './place-collections';

export interface EvmChainCollectiblesInventory {
  settled: boolean;
  nftTotalCount?: number;
  nftPageKey?: string;
  contractsTotalCount?: number;
  contracts: InventoryContractRef[];
  collections: InventoryCollectionRef[];
  loaded: InventoryLoadedNft[];
}

export interface EvmCollectibleSearchHit {
  chainId: number;
  slug: string;
  contractAddress: string;
  collectionSlug?: string;
  /** Collection or contract name, used when this hit is not on a card already. */
  title?: string;
}

export interface EvmCollectiblesInventoryState {
  byAccount: Record<string, Record<number, EvmChainCollectiblesInventory>>;
  loading: boolean;
  searchQuery?: string;
  searchLoading: boolean;
  searchHits: EvmCollectibleSearchHit[];
}

export const evmCollectiblesInventoryInitialState: EvmCollectiblesInventoryState = {
  byAccount: {},
  loading: false,
  searchLoading: false,
  searchHits: []
};
