import { evmAccountCollectiblesForChain } from './collectibles-list';

const MANUAL = '0x0000000000000000000000000000000000000001_1';
const LISTED = '0x0000000000000000000000000000000000000002_2';

describe('evmAccountCollectiblesForChain', () => {
  it('keeps a manually added NFT when the Alchemy inventory and its balance omit it', () => {
    const collectibles = evmAccountCollectiblesForChain(
      1,
      {
        [MANUAL]: { status: 'idle', manual: true },
        [LISTED]: { status: 'enabled' }
      },
      { [MANUAL]: '0' },
      { settled: true, loaded: [{ slug: LISTED }] }
    );

    expect(collectibles).toEqual([
      { slug: LISTED, chainId: 1, status: 'enabled', manual: undefined },
      { slug: MANUAL, chainId: 1, status: 'enabled', manual: true }
    ]);
  });

  it('shows only manually added NFTs while the Alchemy inventory is unsettled', () => {
    const collectibles = evmAccountCollectiblesForChain(
      1,
      { [MANUAL]: { status: 'enabled', manual: true }, [LISTED]: { status: 'enabled' } },
      {},
      { settled: false, loaded: [{ slug: LISTED }] }
    );

    expect(collectibles.map(({ slug }) => slug)).toEqual([MANUAL]);
  });

  it('keeps a disabled manual NFT hidden from the enabled list and drops a removed one', () => {
    const collectibles = evmAccountCollectiblesForChain(
      1,
      {
        [MANUAL]: { status: 'disabled', manual: true },
        removed: { status: 'removed', manual: true }
      },
      { [MANUAL]: '0', removed: '0' },
      { settled: true, loaded: [] }
    );

    expect(collectibles).toEqual([{ slug: MANUAL, chainId: 1, status: 'disabled', manual: true }]);
  });

  it('leaves out an NFT the account removed when a later inventory response uses a different slug case', () => {
    const collectibles = evmAccountCollectiblesForChain(
      1,
      { [LISTED.toUpperCase()]: { status: 'removed' }, [MANUAL]: { status: 'disabled' } },
      { [LISTED]: '1', [MANUAL]: '1' },
      { settled: true, loaded: [{ slug: LISTED }, { slug: MANUAL }] }
    );

    expect(collectibles).toEqual([{ slug: MANUAL, chainId: 1, status: 'disabled', manual: undefined }]);
  });

  it('keeps a manually added NFT on a chain Alchemy does not support when its balance is zero', () => {
    const collectibles = evmAccountCollectiblesForChain(
      1284,
      { [MANUAL]: { status: 'idle', manual: true } },
      { [MANUAL]: '0' },
      undefined
    );

    expect(collectibles).toEqual([{ slug: MANUAL, chainId: 1284, status: 'enabled', manual: true }]);
  });
});
