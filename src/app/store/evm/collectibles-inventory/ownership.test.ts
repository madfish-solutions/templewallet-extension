import {
  alchemyOwnerSample,
  alchemyOwnerSampleRejectsList,
  attributeOwnedToken,
  collectionOwnedCount,
  provenUnownedSlugs,
  reconcileOwnership,
  reportedTokenOwnedChance
} from './ownership';

const chain = (
  balanceOf: number | null,
  owned: readonly string[],
  notOwned: readonly string[] = [],
  enumerated: readonly string[] | null = null
) => ({
  balanceOf,
  perTokenOwned: new Map<string, boolean>([
    ...owned.map(tokenId => [tokenId, true] as const),
    ...notOwned.map(tokenId => [tokenId, false] as const)
  ]),
  perTokenBalance: new Map<string, string>(),
  enumeratedTokenIds: enumerated
});

describe('reconcileOwnership', () => {
  const queried = ['alchemy', 'opensea'] as const;
  const both = (tokenId: string) => ({ tokenId, sources: ['alchemy', 'opensea'] as const });
  const alchemyOnly = (tokenId: string) => ({ tokenId, sources: ['alchemy'] as const });

  it('keeps the token OpenSea missed when the chain says it is owned', () => {
    const opensea = Array.from({ length: 31 }, (_, index) => both(String(index + 1)));
    const missed = alchemyOnly('32');
    const reconciled = reconcileOwnership({
      candidates: [...opensea, missed],
      queriedSources: queried,
      chain: chain(32, opensea.map(candidate => candidate.tokenId).concat('32'))
    });

    expect(reconciled.chainSettled).toBe(true);
    expect(reconciled.ownedTokenIds).toHaveLength(32);
    expect(reconciled.ownedTokenIds).toContain('32');
    expect(reconciled.ownedCount).toBe(32);
  });

  it('drops tokens the chain says the account does not own', () => {
    const reconciled = reconcileOwnership({
      candidates: [both('1'), alchemyOnly('2')],
      queriedSources: queried,
      chain: chain(1, ['1'], ['2'])
    });

    expect(reconciled.ownedTokenIds).toEqual(['1']);
    expect(reconciled.ownedCount).toBe(1);
  });

  it('uses the balance counter to admit an unchecked token OpenSea did not list', () => {
    const reconciled = reconcileOwnership({
      candidates: [both('1'), alchemyOnly('2')],
      queriedSources: queried,
      chain: chain(2, ['1'])
    });

    expect(reconciled.ownedTokenIds).toEqual(['1', '2']);
    expect(reconciled.ownedCount).toBe(2);
  });

  it('does not admit an unchecked token once the counter is filled', () => {
    const reconciled = reconcileOwnership({
      candidates: [both('1'), alchemyOnly('2')],
      queriedSources: queried,
      chain: chain(1, ['1'])
    });

    expect(reconciled.ownedTokenIds).toEqual(['1']);
  });

  it('keeps a per-token proof that exceeds the counter', () => {
    const reconciled = reconcileOwnership({
      candidates: [both('1'), alchemyOnly('2')],
      queriedSources: queried,
      chain: chain(1, ['1', '2'])
    });

    expect(reconciled.ownedTokenIds).toEqual(['1', '2']);
    expect(reconciled.ownedCount).toBe(2);
  });

  it('adds an id the listing left out when ownerOf confirms it', () => {
    const reconciled = reconcileOwnership({
      candidates: [both('1')],
      queriedSources: queried,
      chain: chain(2, ['1', '2'], [], ['1'])
    });

    expect(reconciled.ownedTokenIds).toEqual(['1', '2']);
    expect(reconciled.ownedCount).toBe(2);
  });
});

describe('collectionOwnedCount', () => {
  it('uses the contract counter when the account has one collection there', () => {
    expect(collectionOwnedCount(31, 32, true)).toBe(32);
  });

  it('counts only attributed tokens when the contract hosts another collection', () => {
    expect(collectionOwnedCount(31, 40, false)).toBe(31);
  });
});

describe('attributeOwnedToken', () => {
  it('puts an unnamed token on the only collection this account has for the contract', () => {
    expect(attributeOwnedToken(undefined, ['known-origin'])).toBe('known-origin');
  });

  it('keeps the OpenSea collection and does not guess across several collections', () => {
    expect(attributeOwnedToken('known-origin', ['known-origin', 'xcopy-knownorigin'])).toBe('known-origin');
    expect(attributeOwnedToken(undefined, ['known-origin', 'xcopy-knownorigin'])).toBeUndefined();
  });

  it('keeps a reported slug when several collections share the contract', () => {
    const collections = ['the-philosopher-brand', 'other-wearables'];

    expect(attributeOwnedToken(undefined, collections, 'the-philosopher-brand')).toBe('the-philosopher-brand');
    expect(attributeOwnedToken(undefined, collections, 'cryptovoxels')).toBeUndefined();
    expect(attributeOwnedToken('other-wearables', collections, 'the-philosopher-brand')).toBe('other-wearables');
  });

  it('prefers the only collection over a different reported slug', () => {
    expect(attributeOwnedToken(undefined, ['known-origin'], 'xcopy-knownorigin')).toBe('known-origin');
  });
});

describe('alchemyOwnerSampleRejectsList', () => {
  it('starts from Alchemy’s rate that a reported token is owned', () => {
    expect(reportedTokenOwnedChance('alchemy', 0, 0)).toBeCloseTo(0.88 / (0.88 + 0.22));
  });

  it('rejects the page when the sample is mostly unowned, including one owned token', () => {
    expect(
      alchemyOwnerSampleRejectsList([
        { owned: false, balanceOf: 0 },
        { owned: true, balanceOf: 1 },
        { owned: undefined, balanceOf: 0 }
      ])
    ).toBe(true);
    expect(reportedTokenOwnedChance('alchemy', 1, 2)).toBeLessThan(0.5);
  });

  it('keeps the page when the sample is mostly owned', () => {
    expect(
      alchemyOwnerSampleRejectsList([
        { owned: true, balanceOf: 1 },
        { owned: true, balanceOf: 1 },
        { owned: false, balanceOf: 0 }
      ])
    ).toBe(false);
    expect(reportedTokenOwnedChance('alchemy', 2, 1)).toBeGreaterThanOrEqual(0.5);
  });

  it('keeps the page when the sample did not answer', () => {
    expect(alchemyOwnerSampleRejectsList([{ balanceOf: null }, { balanceOf: null }])).toBe(false);
    expect(alchemyOwnerSampleRejectsList([])).toBe(false);
  });

  it('counts an ERC-721 balance of zero as unowned when ownerOf did not return', () => {
    expect(alchemyOwnerSampleRejectsList([{ balanceOf: 0 }])).toBe(true);
  });

  it('names the sampled token that is unowned while the page stays', () => {
    const answers = [
      { slug: 'owned', owned: true, balanceOf: 1 },
      { slug: 'owned-too', owned: true, balanceOf: 1 },
      { slug: 'not-owned', owned: false, balanceOf: 0 }
    ];

    expect(alchemyOwnerSampleRejectsList(answers)).toBe(false);
    expect(provenUnownedSlugs(answers)).toEqual(['not-owned']);
  });
});

describe('alchemyOwnerSample', () => {
  const nft = (contractAddress: string) => ({ contractAddress });

  it('takes one token from each of the first three contracts', () => {
    const first = nft('0x01A0a3E70B94EdB22119cE2cc4a792F765f8D6a3');
    const sameContract = nft('0x01a0a3e70b94edb22119ce2cc4a792f765f8d6a3');
    const second = nft('0x2f9dB65c8e4404a55BbaF95414A1aFa067873c19');
    const third = nft('0x9e84e73834A3e05E87Dfa9Bd585300263d9fFAF0');
    const fourth = nft('0xADEb8BE17BA861E8847c23b2040C221607A70B21');

    expect(alchemyOwnerSample([first, sameContract, second, third, fourth])).toEqual([first, second, third]);
  });
});
