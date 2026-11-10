import { isUnusableAlchemyOwnerPage, openseaCollectionSlugFromCard } from './collection-load';

describe('isUnusableAlchemyOwnerPage', () => {
  it('follows an empty page that still has a cursor', () => {
    expect(
      isUnusableAlchemyOwnerPage(
        { ownedNfts: [], totalCount: 20, pageKey: 'next' },
        { receivedCount: 0, previousTotalCount: 20 }
      )
    ).toBe(false);
  });

  it('rejects a finished query that claims matches and returns none', () => {
    expect(
      isUnusableAlchemyOwnerPage(
        { ownedNfts: [], totalCount: 100, pageKey: null },
        { receivedCount: 0, previousTotalCount: 100 }
      )
    ).toBe(true);
  });

  it('rejects a count that changes before any NFT arrives', () => {
    expect(
      isUnusableAlchemyOwnerPage(
        { ownedNfts: [], totalCount: 100, pageKey: null },
        { receivedCount: 0, previousTotalCount: 20 }
      )
    ).toBe(true);
  });

  it('keeps a real empty page, a page with NFTs, and a count change after NFTs arrived', () => {
    expect(
      isUnusableAlchemyOwnerPage({ ownedNfts: [], totalCount: 0 }, { receivedCount: 0, previousTotalCount: 0 })
    ).toBe(false);
    expect(
      isUnusableAlchemyOwnerPage(
        { ownedNfts: [{}], totalCount: 2562, pageKey: 'next' },
        { receivedCount: 46, previousTotalCount: 2538 }
      )
    ).toBe(false);
    expect(
      isUnusableAlchemyOwnerPage(
        { ownedNfts: [], totalCount: 2538, pageKey: 'next' },
        { receivedCount: 46, previousTotalCount: 2543 }
      )
    ).toBe(false);
  });
});

describe('openseaCollectionSlugFromCard', () => {
  it('reads the OpenSea slug from a collection card', () => {
    expect(openseaCollectionSlugFromCard('evm:137:collection:nifty-island-creations-polygon')).toBe(
      'nifty-island-creations-polygon'
    );
  });

  it('returns nothing for a contract card', () => {
    expect(openseaCollectionSlugFromCard('evm:137:contract:0xc1374b803dfb1a9c87eab9e76929222dba3a8c39')).toBe(
      undefined
    );
  });
});
