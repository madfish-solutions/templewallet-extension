import {
  alchemyOwnerSample,
  alchemyOwnerSampleRejectsList,
  attributeOwnedToken,
  collectionOwnedCount,
  listTokensBySource,
  reconcileOwnership,
  reportedTokenOwnedChance,
  singleSourceFirst,
  singleSourceTokensAfterSample,
  unownedFromOwnerSample
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

  it('keeps an Alchemy token that one OpenSea page did not include', () => {
    const reconciled = reconcileOwnership({
      candidates: [alchemyOnly('1'), both('2')],
      queriedSources: ['alchemy'],
      partialSources: ['opensea'],
      chain: null
    });

    expect(reconciled.chainSettled).toBe(false);
    expect(reconciled.ownedTokenIds).toEqual(['1', '2']);
  });

  it('drops an Alchemy token when OpenSea was asked about that token and stayed silent', () => {
    const reconciled = reconcileOwnership({
      candidates: [alchemyOnly('1')],
      queriedSources: ['alchemy', 'opensea'],
      chain: null
    });

    expect(reconciled.ownedTokenIds).toEqual([]);
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

  it('names the sampled token that is unowned while its contract still has a balance', () => {
    const answers = [
      { slug: 'owned', contractAddress: '0x01', owned: true, balanceOf: 1 },
      { slug: 'owned-too', contractAddress: '0x02', owned: true, balanceOf: 1 },
      { slug: 'not-owned', contractAddress: '0x03', owned: false, balanceOf: 2 }
    ];

    expect(alchemyOwnerSampleRejectsList(answers)).toBe(false);
    expect(unownedFromOwnerSample(answers)).toEqual({ slugs: ['not-owned'], contractAddresses: [] });
  });

  it('drops the whole contract when its ERC-721 balance is zero', () => {
    expect(
      unownedFromOwnerSample([{ slug: 'not-owned', contractAddress: '0x03', owned: false, balanceOf: 0 }])
    ).toEqual({ slugs: [], contractAddresses: ['0x03'] });
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

  it('checks a token only one source reported before tokens both sources reported', () => {
    const shared = { slug: 'shared', contractAddress: '0x01', sources: ['alchemy', 'goldrush'] as const };
    const alchemyOnly = { slug: 'alchemy', contractAddress: '0x02', sources: ['alchemy'] as const };
    const goldrushOnly = { slug: 'goldrush', contractAddress: '0x03', sources: ['goldrush'] as const };
    const laterShared = { slug: 'later', contractAddress: '0x04', sources: ['alchemy', 'goldrush'] as const };

    const sampled = alchemyOwnerSample(singleSourceFirst([shared, laterShared, alchemyOnly, goldrushOnly]));

    expect(sampled.map(token => token.slug)).toEqual(['alchemy', 'goldrush', 'shared']);
  });
});

describe('singleSourceTokensAfterSample', () => {
  const goldrushOnly = (slug: string) => ({ slug, contractAddress: '0x01', sources: ['goldrush'] as const });
  const alchemyOnly = (slug: string) => ({ slug, contractAddress: '0x02', sources: ['alchemy'] as const });

  it('keeps a Goldrush token the chain says is owned when Alchemy left it out', () => {
    const tokens = listTokensBySource([], [goldrushOnly('owned')]);

    expect(singleSourceTokensAfterSample(tokens, [{ slug: 'owned', owned: true, balanceOf: 1 }])).toEqual({
      keepSlugs: ['owned'],
      dropSlugs: [],
      readSlugs: []
    });
  });

  it('keeps the other tokens only that source reported when every checked one is owned', () => {
    const tokens = [goldrushOnly('checked'), goldrushOnly('rest')];

    expect(singleSourceTokensAfterSample(tokens, [{ slug: 'checked', owned: true, balanceOf: 1 }]).keepSlugs).toEqual([
      'checked',
      'rest'
    ]);
  });

  it('reads more of a contract before dropping it for one unowned token', () => {
    const contract = (slug: string) => ({ slug, contractAddress: '0x01', sources: ['alchemy'] as const });
    const other = { slug: 'other', contractAddress: '0x02', sources: ['alchemy'] as const };
    const decision = singleSourceTokensAfterSample(
      [contract('lie'), contract('next'), contract('later'), contract('tail'), other],
      [{ slug: 'lie', owned: false, balanceOf: 2 }]
    );

    expect(decision.dropSlugs).toEqual(['lie']);
    expect(decision.readSlugs).toEqual(['next', 'later', 'other']);
    expect(decision.keepSlugs).toEqual([]);
  });

  it('drops the rest of a contract when several of its tokens are unowned and none are owned', () => {
    const contract = (slug: string) => ({ slug, contractAddress: '0x01', sources: ['goldrush'] as const });
    const other = { slug: 'other', contractAddress: '0x02', sources: ['alchemy'] as const };
    const decision = singleSourceTokensAfterSample(
      [contract('a'), contract('b'), contract('c'), contract('tail'), other],
      [
        { slug: 'a', owned: false, balanceOf: 4 },
        { slug: 'b', owned: false, balanceOf: 4 },
        { slug: 'c', owned: false, balanceOf: 4 }
      ]
    );

    expect(decision.keepSlugs).toEqual([]);
    expect(decision.readSlugs).toEqual(['other']);
    expect(decision.dropSlugs).toEqual(['a', 'b', 'c', 'tail']);
  });

  it('reads the remaining tokens of a contract that has both an owned and an unowned token', () => {
    const contract = (slug: string) => ({ slug, contractAddress: '0x01', sources: ['goldrush'] as const });
    const decision = singleSourceTokensAfterSample(
      [contract('lie'), contract('owned'), contract('left')],
      [
        { slug: 'lie', owned: false, balanceOf: 2 },
        { slug: 'owned', owned: true, balanceOf: 2 }
      ]
    );

    expect(decision.keepSlugs).toEqual(['owned']);
    expect(decision.dropSlugs).toEqual(['lie']);
    expect(decision.readSlugs).toEqual(['left']);
  });

  it('keeps an unread token when the contract answers still favor ownership', () => {
    const contract = (slug: string) => ({ slug, contractAddress: '0x01', sources: ['goldrush'] as const });
    const decision = singleSourceTokensAfterSample(
      [contract('owned'), contract('lie'), contract('quiet')],
      [
        { slug: 'owned', owned: true, balanceOf: 2 },
        { slug: 'lie', owned: false, balanceOf: 2 }
      ],
      true
    );

    expect(decision.readSlugs).toEqual([]);
    expect(decision.keepSlugs.slice().sort()).toEqual(['owned', 'quiet']);
    expect(decision.dropSlugs).toEqual(['lie']);
  });

  it('does not add a Goldrush-only token the chain did not answer', () => {
    const tokens = [goldrushOnly('quiet'), alchemyOnly('listed')];
    const decision = singleSourceTokensAfterSample(tokens, [{ slug: 'quiet', balanceOf: null }], true);

    expect(decision.keepSlugs).toEqual(['listed']);
    expect(decision.dropSlugs).toEqual(['quiet']);
    expect(decision.readSlugs).toEqual([]);
  });

  it('reads Goldrush tokens the first sample did not reach, and drops Alchemy after several misses', () => {
    const alchemy = (slug: string, contractAddress: string) => ({
      slug,
      contractAddress,
      sources: ['alchemy'] as const
    });
    const goldrush = (slug: string, contractAddress: string) => ({
      slug,
      contractAddress,
      sources: ['goldrush'] as const
    });
    const tokens = [
      alchemy('a1', '0x01'),
      alchemy('a2', '0x02'),
      alchemy('a3', '0x03'),
      alchemy('a4', '0x04'),
      goldrush('g1', '0x11'),
      goldrush('g2', '0x12')
    ];
    const sampled = [
      { slug: 'a1', owned: false, balanceOf: 0 },
      { slug: 'a2', owned: false, balanceOf: 1 },
      { slug: 'a3', owned: false, balanceOf: 1 }
    ];
    const first = singleSourceTokensAfterSample(tokens, sampled);

    expect(first.keepSlugs).toEqual([]);
    expect(first.dropSlugs).toEqual(['a1', 'a2', 'a3', 'a4']);
    expect(first.readSlugs).toEqual(['g1', 'g2']);

    const second = singleSourceTokensAfterSample(tokens, [
      ...sampled,
      { slug: 'g1', owned: true, balanceOf: null },
      { slug: 'g2', owned: true, balanceOf: null }
    ]);

    expect(second.keepSlugs).toEqual(['g1', 'g2']);
    expect(second.dropSlugs).toEqual(['a1', 'a2', 'a3', 'a4']);
    expect(second.readSlugs).toEqual([]);
  });
});
