import { createAction } from '@reduxjs/toolkit';

import { EvmChainCollectiblesInventory, EvmCollectibleSearchHit } from './state';

export const loadEvmCollectiblesInventoryAction = createAction<{
  account: HexString;
  chainIds: number[];
}>('evm/collectibles-inventory/LOAD');

export const loadEvmCollectiblesInventoryNextPageAction = createAction<{
  account: HexString;
  chainId: number;
  pageKey: string;
}>('evm/collectibles-inventory/LOAD_NEXT_PAGE');

export const loadEvmCollectionTokensAction = createAction<{
  account: HexString;
  chainId: number;
  contractAddresses: string[];
  /** OpenSea collection slug. Set for a collection card, omitted for a contract card. */
  openseaCollection?: string;
  /** Display name stored on NFTs loaded from OpenSea. */
  collectionName?: string;
}>('evm/collectibles-inventory/LOAD_COLLECTION_TOKENS');

export const searchEvmCollectiblesAction = createAction<{
  account: HexString;
  chainIds: number[];
  query: string;
}>('evm/collectibles-inventory/SEARCH');

export const clearEvmCollectiblesSearchAction = createAction('evm/collectibles-inventory/CLEAR_SEARCH');

export const setEvmCollectiblesInventoryLoadingAction = createAction<boolean>('evm/collectibles-inventory/SET_LOADING');

export const setEvmCollectiblesSearchLoadingAction = createAction<boolean>(
  'evm/collectibles-inventory/SET_SEARCH_LOADING'
);

export const putEvmChainCollectiblesInventoryAction = createAction<{
  account: HexString;
  chainId: number;
  inventory: EvmChainCollectiblesInventory;
}>('evm/collectibles-inventory/PUT_CHAIN');

export const appendEvmChainCollectiblesInventoryAction = createAction<{
  account: HexString;
  chainId: number;
  /** Set when this append is the next account-wide page. A collection load leaves the cursor alone. */
  nftPageKey?: string;
  replacePageKey?: boolean;
  /**
   * The incoming collection slug is the token's own OpenSea collection.
   * It replaces a slug already stored for that token, such as the contract-level slug Alchemy returns.
   */
  replaceCollectionSlug?: boolean;
  loaded: EvmChainCollectiblesInventory['loaded'];
}>('evm/collectibles-inventory/APPEND_CHAIN');

export const reconcileEvmCollectiblesOwnershipAction = createAction<{
  account: HexString;
  chainId: number;
  /** Slugs the chain says this account does not own. */
  removeSlugs: string[];
  /** Owned tokens. `collectionSlug` replaces whatever was stored, including clearing it. */
  upsert: EvmChainCollectiblesInventory['loaded'];
  collectionCounts: Array<{ slug: string; itemCount: number }>;
}>('evm/collectibles-inventory/RECONCILE_OWNERSHIP');

export const putEvmCollectiblesSearchHitsAction = createAction<{
  query: string;
  hits: EvmCollectibleSearchHit[];
}>('evm/collectibles-inventory/PUT_SEARCH');
