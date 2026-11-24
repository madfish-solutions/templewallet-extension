import {
  forgetPreservedLoadedNfts,
  noteFirstPage,
  rememberLoadedBeyondFirstPage,
  withPreservedLoadedNfts
} from './preserve-loaded';
import { EvmChainCollectiblesInventory } from './state';

const account = '0x00000000000000000000000000000000000000aa';
const chainId = 1;

const inventory = (
  loaded: EvmChainCollectiblesInventory['loaded'],
  nftPageKey?: string,
  contracts: EvmChainCollectiblesInventory['contracts'] = []
): EvmChainCollectiblesInventory => ({
  settled: true,
  nftPageKey,
  contracts,
  collections: [],
  loaded
});

const nft = (slug: string, contractAddress = '0xabc') => ({ slug, contractAddress });

describe('withPreservedLoadedNfts', () => {
  beforeEach(() => {
    forgetPreservedLoadedNfts(account, chainId);
  });

  it('drops a first-page token the refresh no longer returns', () => {
    const previous = inventory([nft('0xabc_1'), nft('0xabc_2')], 'page-2');
    const fresh = inventory([nft('0xabc_2')], 'page-2');

    expect(withPreservedLoadedNfts(account, chainId, fresh, previous).loaded.map(item => item.slug)).toEqual([
      '0xabc_2'
    ]);
  });

  it('keeps a token appended after the first page and the cursor that follows it', () => {
    rememberLoadedBeyondFirstPage(account, chainId, ['0xabc_9']);
    const previous = inventory([nft('0xabc_1'), nft('0xabc_9')], 'page-3');
    const fresh = inventory([nft('0xabc_1')], 'page-2');
    const merged = withPreservedLoadedNfts(account, chainId, fresh, previous);

    expect(merged.loaded.map(item => item.slug)).toEqual(['0xabc_1', '0xabc_9']);
    expect(merged.nftPageKey).toBe('page-3');
  });

  it('does not duplicate a preserved token that the new first page already contains', () => {
    rememberLoadedBeyondFirstPage(account, chainId, ['0xabc_4']);
    const previous = inventory([nft('0xabc_4')]);
    const fresh = inventory([nft('0xABC_4')]);

    expect(withPreservedLoadedNfts(account, chainId, fresh, previous).loaded).toEqual(fresh.loaded);
  });

  it('drops a first-page token once that page is known, and keeps a later one the refresh omits', () => {
    noteFirstPage(account, chainId, ['0xabc_1']);
    rememberLoadedBeyondFirstPage(account, chainId, ['0xabc_1', '0xabc_9']);
    const previous = inventory([nft('0xabc_1'), nft('0xabc_9')], 'page-2');
    const fresh = inventory([nft('0xabc_2')], 'page-2');
    const merged = withPreservedLoadedNfts(account, chainId, fresh, previous);

    expect(merged.loaded.map(item => item.slug)).toEqual(['0xabc_2', '0xabc_9']);
  });

  it('does not copy a later token whose contract the new inventory dropped', () => {
    noteFirstPage(account, chainId, ['0xkeep_1']);
    rememberLoadedBeyondFirstPage(account, chainId, ['0xabc_9']);
    const previous = inventory([nft('0xkeep_1', '0xkeep'), nft('0xabc_9')], 'page-2', [
      { address: '0xabc', distinctTokensOwned: 1 },
      { address: '0xkeep', distinctTokensOwned: 1 }
    ]);
    const fresh = inventory([nft('0xkeep_1', '0xkeep')], 'page-2', [{ address: '0xkeep', distinctTokensOwned: 1 }]);

    expect(withPreservedLoadedNfts(account, chainId, fresh, previous).loaded.map(item => item.slug)).toEqual([
      '0xkeep_1'
    ]);
  });

  it('does not keep tokens after the preserved set is cleared', () => {
    rememberLoadedBeyondFirstPage(account, chainId, ['0xabc_9']);
    forgetPreservedLoadedNfts(account, chainId);
    const previous = inventory([nft('0xabc_1'), nft('0xabc_9')], 'page-2');
    const fresh = inventory([nft('0xabc_1')], 'page-2');

    expect(withPreservedLoadedNfts(account, chainId, fresh, previous).loaded.map(item => item.slug)).toEqual([
      '0xabc_1'
    ]);
  });

  it('keeps a later token when the contracts request returned nothing', () => {
    noteFirstPage(account, chainId, ['0xabc_1']);
    rememberLoadedBeyondFirstPage(account, chainId, ['0xabc_9']);
    const previous = inventory([nft('0xabc_1'), nft('0xabc_9')], 'page-2', [
      { address: '0xabc', distinctTokensOwned: 2 }
    ]);
    const fresh = inventory([nft('0xabc_1')], 'page-2');

    expect(withPreservedLoadedNfts(account, chainId, fresh, previous).loaded.map(item => item.slug)).toEqual([
      '0xabc_1',
      '0xabc_9'
    ]);
  });

  it('does not copy later tokens onto an empty inventory', () => {
    rememberLoadedBeyondFirstPage(account, chainId, ['0xabc_9']);
    const previous = inventory([nft('0xabc_1'), nft('0xabc_9')], 'page-2', [
      { address: '0xabc', distinctTokensOwned: 2 }
    ]);

    expect(withPreservedLoadedNfts(account, chainId, inventory([]), previous).loaded).toEqual([]);
    const again = inventory([nft('0xabc_2')], 'page-2', [{ address: '0xabc', distinctTokensOwned: 1 }]);

    expect(withPreservedLoadedNfts(account, chainId, again, previous).loaded.map(item => item.slug)).toEqual([
      '0xabc_2'
    ]);
  });

  it('uses tokens already stored as the first page when this session has not recorded one', () => {
    rememberLoadedBeyondFirstPage(account, chainId, ['0xabc_1', '0xabc_9'], ['0xabc_1']);
    const previous = inventory([nft('0xabc_1'), nft('0xabc_9')], 'page-2');
    const fresh = inventory([nft('0xabc_2')], 'page-2');

    expect(withPreservedLoadedNfts(account, chainId, fresh, previous).loaded.map(item => item.slug)).toEqual([
      '0xabc_2',
      '0xabc_9'
    ]);
  });
});
