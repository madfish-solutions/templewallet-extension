import {
  appendEvmChainCollectiblesInventoryAction,
  putEvmChainCollectiblesInventoryAction,
  reconcileEvmCollectiblesOwnershipAction
} from './actions';
import { evmCollectiblesInventoryReducer } from './reducers';
import { EvmChainCollectiblesInventory, evmCollectiblesInventoryInitialState } from './state';

const account = '0x0000000000000000000000000000000000000001' as HexString;
const chainId = 1;

const inventory = (loaded: EvmChainCollectiblesInventory['loaded']): EvmChainCollectiblesInventory => ({
  settled: true,
  contracts: [],
  collections: [],
  loaded
});

const withLoaded = (loaded: EvmChainCollectiblesInventory['loaded']) =>
  evmCollectiblesInventoryReducer(
    evmCollectiblesInventoryInitialState,
    putEvmChainCollectiblesInventoryAction({ account, chainId, inventory: inventory(loaded) })
  );

describe('appendEvmChainCollectiblesInventoryAction', () => {
  const stored = {
    slug: '0xABB3738f04Dc2Ec20f4AE4462c3d069d02AE045B_31212012',
    contractAddress: '0xABB3738f04Dc2Ec20f4AE4462c3d069d02AE045B',
    collectionSlug: 'xcopy-knownorigin'
  };

  it('keeps the stored collection slug when a later page names the same token', () => {
    const state = evmCollectiblesInventoryReducer(
      withLoaded([stored]),
      appendEvmChainCollectiblesInventoryAction({
        account,
        chainId,
        loaded: [{ ...stored, collectionSlug: 'known-origin' }]
      })
    );

    expect(state.byAccount[account][chainId].loaded).toEqual([stored]);
  });

  it('replaces the stored collection slug with the token collection from OpenSea', () => {
    const state = evmCollectiblesInventoryReducer(
      withLoaded([stored]),
      appendEvmChainCollectiblesInventoryAction({
        account,
        chainId,
        replaceCollectionSlug: true,
        loaded: [{ ...stored, collectionSlug: 'known-origin' }]
      })
    );

    expect(state.byAccount[account][chainId].loaded).toEqual([{ ...stored, collectionSlug: 'known-origin' }]);
  });

  it('replaces a stored token with the chain result and updates the collection count', () => {
    const withCollection = evmCollectiblesInventoryReducer(
      evmCollectiblesInventoryInitialState,
      putEvmChainCollectiblesInventoryAction({
        account,
        chainId,
        inventory: {
          ...inventory([
            stored,
            {
              slug: '0xABB3738f04Dc2Ec20f4AE4462c3d069d02AE045B_1',
              contractAddress: stored.contractAddress,
              collectionSlug: 'xcopy-knownorigin'
            }
          ]),
          collections: [
            {
              slug: 'known-origin',
              name: 'KnownOrigin',
              itemCount: 31,
              contractAddresses: [stored.contractAddress]
            }
          ]
        }
      })
    );
    const state = evmCollectiblesInventoryReducer(
      withCollection,
      reconcileEvmCollectiblesOwnershipAction({
        account,
        chainId,
        removeSlugs: ['0xABB3738f04Dc2Ec20f4AE4462c3d069d02AE045B_1'],
        upsert: [{ ...stored, collectionSlug: 'known-origin' }],
        collectionCounts: [{ slug: 'known-origin', itemCount: 32 }]
      })
    );

    expect(state.byAccount[account][chainId].loaded).toEqual([{ ...stored, collectionSlug: 'known-origin' }]);
    expect(state.byAccount[account][chainId].collections[0].itemCount).toBe(32);
  });

  it('keeps a fetched token balance when ownership verification replaces the token', () => {
    const storedWithBalance = { ...stored, balance: '2' };
    const state = evmCollectiblesInventoryReducer(
      withLoaded([storedWithBalance]),
      reconcileEvmCollectiblesOwnershipAction({
        account,
        chainId,
        removeSlugs: [],
        upsert: [{ ...stored, collectionSlug: 'known-origin' }],
        collectionCounts: []
      })
    );

    expect(state.byAccount[account][chainId].loaded).toEqual([
      { ...storedWithBalance, collectionSlug: 'known-origin' }
    ]);
  });
});
