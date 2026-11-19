import { ChainOwnershipFacts } from 'lib/evm/on-chain/nft-ownership';

export type OwnershipSource = 'opensea' | 'alchemy' | 'goldrush';

export interface OwnershipCandidate {
  tokenId: string;
  sources: readonly OwnershipSource[];
}

interface ReconcileOwnershipInput {
  candidates: readonly OwnershipCandidate[];
  /** Sources that were actually asked. A source that was not asked is not silence. */
  queriedSources: readonly OwnershipSource[];
  /**
   * Sources that listed some tokens and were not asked about the rest.
   * A token they listed is evidence it is owned. A token they skipped is not evidence it is not.
   */
  partialSources?: readonly OwnershipSource[];
  chain: ChainOwnershipFacts | null;
}

interface ReconciledOwnership {
  ownedTokenIds: string[];
  /** Distinct tokens owned. Higher than `ownedTokenIds` when the counter exceeds the ids we could list. */
  ownedCount: number;
  chainSettled: boolean;
}

/**
 * How often each API reports a token it should, and how often it reports one the account does not own.
 * OpenSea misses some owned tokens and rarely adds extras. Alchemy and Goldrush add extras more often.
 */
const SOURCE_REPORT: Record<OwnershipSource, { whenOwned: number; whenNot: number }> = {
  opensea: { whenOwned: 0.9, whenNot: 0.06 },
  alchemy: { whenOwned: 0.88, whenNot: 0.22 },
  goldrush: { whenOwned: 0.84, whenNot: 0.28 }
};

/** An unchecked report is kept when the chance the account owns it is at least this. */
const OWNED_CHANCE_CUTOFF = 0.5;

export const tokenIdKey = (tokenId: string) => {
  try {
    return BigInt(tokenId).toString();
  } catch {
    return tokenId;
  }
};

/** Posterior that the account owns the token, before any chain call. Prior is even. */
const ownershipPosterior = (
  sources: readonly OwnershipSource[],
  queriedSources: readonly OwnershipSource[],
  partialSources: readonly OwnershipSource[] = []
) => {
  const reported = new Set(sources);
  let odds = 1;

  for (const source of queriedSources) {
    const rates = SOURCE_REPORT[source];
    const likelihood = reported.has(source)
      ? rates.whenOwned / rates.whenNot
      : (1 - rates.whenOwned) / (1 - rates.whenNot);
    odds *= likelihood;
  }

  for (const source of partialSources) {
    if (!reported.has(source)) continue;

    const rates = SOURCE_REPORT[source];
    odds *= rates.whenOwned / rates.whenNot;
  }

  return odds / (1 + odds);
};

/**
 * Chance that a token this source reported is owned.
 * The source rates are the prior weight. Each chain-confirmed token adds one.
 * This is the chance that the rest of the list is good enough.
 */
export const reportedTokenOwnedChance = (source: OwnershipSource, confirmedOwned: number, confirmedUnowned: number) => {
  const rates = SOURCE_REPORT[source];
  const owned = rates.whenOwned + confirmedOwned;
  const unowned = rates.whenNot + confirmedUnowned;

  return owned / (owned + unowned);
};

const unique = (tokenIds: readonly string[]) => Array.from(new Set(tokenIds));

/**
 * The chain's per-token answer wins. `balanceOf` then decides how many unchecked API tokens still fit.
 * A complete on-chain listing is the set, plus any id `ownerOf` confirms that the listing left out.
 */
export const reconcileOwnership = ({
  candidates,
  queriedSources,
  partialSources = [],
  chain
}: ReconcileOwnershipInput): ReconciledOwnership => {
  const merged = new Map<string, Set<OwnershipSource>>();
  for (const candidate of candidates) {
    const tokenId = tokenIdKey(candidate.tokenId);
    const sources = merged.get(tokenId) ?? new Set<OwnershipSource>();
    candidate.sources.forEach(source => sources.add(source));
    merged.set(tokenId, sources);
  }
  const normalized = Array.from(merged, ([tokenId, sources]) => ({ tokenId, sources: Array.from(sources) }));

  if (chain?.enumeratedTokenIds) {
    const ownedTokenIds = chain.enumeratedTokenIds.filter(tokenId => chain.perTokenOwned.get(tokenId) !== false);
    for (const [tokenId, owned] of chain.perTokenOwned) {
      if (owned && !ownedTokenIds.includes(tokenId)) ownedTokenIds.push(tokenId);
    }

    return {
      ownedTokenIds,
      ownedCount: Math.max(chain.balanceOf ?? 0, ownedTokenIds.length),
      chainSettled: true
    };
  }

  const proven: string[] = [];
  const unknown: OwnershipCandidate[] = [];
  const seen = new Set<string>();

  for (const candidate of normalized) {
    if (seen.has(candidate.tokenId)) continue;
    seen.add(candidate.tokenId);
    const proof = chain?.perTokenOwned.get(candidate.tokenId);
    if (proof === true) proven.push(candidate.tokenId);
    else if (proof !== false) unknown.push(candidate);
  }

  if (chain) {
    for (const [tokenId, owned] of chain.perTokenOwned) {
      if (owned && !proven.includes(tokenId)) proven.push(tokenId);
    }
  }

  const chainAnswered = chain != null && (chain.balanceOf != null || chain.perTokenOwned.size > 0);
  if (!chainAnswered) {
    const ownedTokenIds = unique(
      normalized
        .filter(
          candidate => ownershipPosterior(candidate.sources, queriedSources, partialSources) >= OWNED_CHANCE_CUTOFF
        )
        .map(candidate => candidate.tokenId)
    );

    return { ownedTokenIds, ownedCount: ownedTokenIds.length, chainSettled: false };
  }

  const ownedTokenIds = unique(proven);
  if (chain?.balanceOf != null) {
    const ranked = unknown
      .filter(candidate => !ownedTokenIds.includes(candidate.tokenId))
      .map(candidate => ({
        tokenId: candidate.tokenId,
        score: ownershipPosterior(candidate.sources, queriedSources, partialSources)
      }))
      .sort((a, b) => b.score - a.score || (a.tokenId < b.tokenId ? -1 : 1));

    for (const candidate of ranked) {
      if (ownedTokenIds.length >= chain.balanceOf) break;
      ownedTokenIds.push(candidate.tokenId);
    }

    return {
      ownedTokenIds,
      ownedCount: Math.max(chain.balanceOf, ownedTokenIds.length),
      chainSettled: true
    };
  }

  for (const candidate of unknown) {
    if (ownershipPosterior(candidate.sources, queriedSources, partialSources) >= OWNED_CHANCE_CUTOFF)
      ownedTokenIds.push(candidate.tokenId);
  }

  const settled = unique(ownedTokenIds);

  return { ownedTokenIds: settled, ownedCount: settled.length, chainSettled: true };
};

/**
 * Contract `balanceOf` is the collection count only when this account has no other collection on that contract.
 * Otherwise the count is the tokens attributed to the collection. Per-token proof can exceed the counter.
 */
export const collectionOwnedCount = (
  attributed: number,
  balanceOf: number | null,
  soleCollectionOnContract: boolean
) => {
  if (!soleCollectionOnContract || balanceOf == null) return attributed;

  return Math.max(balanceOf, attributed);
};

/**
 * OpenSea's per-token collection wins. A token OpenSea did not name joins the only collection
 * this account has on the contract. When several collections share it, a slug already reported
 * for the token is kept if it is one of those collections.
 */
export const attributeOwnedToken = (
  openseaSlug: string | undefined,
  accountCollectionSlugs: readonly string[],
  reportedSlug?: string
) => {
  if (openseaSlug) return openseaSlug;
  if (accountCollectionSlugs.length === 1) return accountCollectionSlugs[0];
  if (reportedSlug && accountCollectionSlugs.includes(reportedSlug)) return reportedSlug;

  return undefined;
};

/** How many tokens are checked before the owner list is trusted. One token per contract. */
const ALCHEMY_OWNER_SAMPLE_LIMIT = 3;

export type ListedBy = 'alchemy' | 'goldrush';

export interface SourcedToken {
  slug: string;
  contractAddress: string;
  sources: readonly ListedBy[];
}

const slugKey = (slug: string) => slug.toLowerCase();

/** Tokens only one source reported come first. The sample spends its slots on those disagreements. */
export const singleSourceFirst = <T extends { sources: readonly unknown[] }>(tokens: readonly T[]) => {
  const exclusive: T[] = [];
  const shared: T[] = [];

  for (const token of tokens) {
    if (token.sources.length === 1) exclusive.push(token);
    else shared.push(token);
  }

  return exclusive.concat(shared);
};

export const listTokensBySource = (
  alchemy: readonly Omit<SourcedToken, 'sources'>[],
  goldrush: readonly Omit<SourcedToken, 'sources'>[]
): SourcedToken[] => {
  const bySlug = new Map<string, SourcedToken>();
  const add = (token: Omit<SourcedToken, 'sources'>, source: ListedBy) => {
    const key = slugKey(token.slug);
    const existing = bySlug.get(key);
    if (!existing) {
      bySlug.set(key, { ...token, sources: [source] });

      return;
    }

    if (!existing.sources.includes(source)) existing.sources = existing.sources.concat(source);
  };

  for (const token of alchemy) add(token, 'alchemy');
  for (const token of goldrush) add(token, 'goldrush');

  return Array.from(bySlug.values());
};

export interface SingleSourceSampleAnswer {
  slug: string;
  /** Missing when that token's call did not return. */
  owned?: boolean;
  /** ERC-721 `balanceOf`. Zero means this account owns no token of that contract. */
  balanceOf: number | null;
}

/** Unowned checks of one contract, or of one source, before its remaining tokens are dropped. */
const COLLECTION_UNOWNED_CHECKS = 3;
/** Exclusive tokens read on the next pass. The loaded page is already bounded; this caps one multicall. */
const SOURCE_FOLLOW_UP_LIMIT = 40;

const contractKey = (address: string) => address.toLowerCase();

const answerSettled = (answer: SingleSourceSampleAnswer) => answer.owned != null || answer.balanceOf === 0;

const answerUnowned = (answer: SingleSourceSampleAnswer) => answer.owned === false || answer.balanceOf === 0;

export interface SingleSourceDecision {
  keepSlugs: string[];
  dropSlugs: string[];
  /**
   * Tokens that still need an on-chain read.
   * A source that has not been shown to be right does not keep these, and does not drop them, until the chain answers.
   */
  readSlugs: string[];
}

/**
 * What to do with tokens only one source reported, after the chain has answered the sample.
 * A confirmed owned token is kept. A confirmed unowned token is dropped. One unowned token does not drop another contract.
 * Those other tokens are read first. A contract, and the rest of a source, is dropped when several checked tokens are unowned and none are owned.
 * When every answered token of a source was owned, the other source omitted real tokens, so the rest are kept.
 * `settle` resolves tokens the chain did not answer. Their chance uses this source's report rates.
 * With no answer, Alchemy's tokens stay and Goldrush-only tokens are not added.
 */
export const singleSourceTokensAfterSample = (
  tokens: readonly SourcedToken[],
  answers: readonly SingleSourceSampleAnswer[],
  settle = false
): SingleSourceDecision => {
  const answerBySlug = new Map(answers.map(answer => [slugKey(answer.slug), answer]));
  const keepSlugs: string[] = [];
  const dropSlugs: string[] = [];
  const readSlugs: string[] = [];
  const trustedSource = new Set<ListedBy>();
  const sourceStats = new Map<ListedBy, { owned: number; unowned: number }>();

  for (const source of ['alchemy', 'goldrush'] as const) {
    let owned = 0;
    let unowned = 0;

    for (const token of tokens) {
      if (token.sources.length !== 1 || token.sources[0] !== source) continue;

      const answer = answerBySlug.get(slugKey(token.slug));
      if (!answer || !answerSettled(answer)) continue;
      if (answer.owned === true) owned++;
      else if (answerUnowned(answer)) unowned++;
    }

    sourceStats.set(source, { owned, unowned });
    if (owned > 0 && unowned === 0) trustedSource.add(source);
  }

  for (const source of ['alchemy', 'goldrush'] as const) {
    const byContract = new Map<string, SourcedToken[]>();

    for (const token of tokens) {
      if (token.sources.length !== 1 || token.sources[0] !== source) continue;

      const key = contractKey(token.contractAddress);
      const group = byContract.get(key) ?? [];
      group.push(token);
      byContract.set(key, group);
    }

    for (const group of byContract.values()) {
      const settled = group.flatMap(token => {
        const answer = answerBySlug.get(slugKey(token.slug));

        return answer && answerSettled(answer) ? [answer] : [];
      });
      if (settled.some(answer => answer.balanceOf === 0)) {
        for (const token of group) dropSlugs.push(token.slug);
        continue;
      }

      const owned = settled.filter(answer => answer.owned === true);
      const unowned = settled.filter(answerUnowned);
      const unread = group.filter(token => !answerBySlug.has(slugKey(token.slug)));
      const inconclusive = group.filter(token => {
        const answer = answerBySlug.get(slugKey(token.slug));

        return answer != null && !answerSettled(answer);
      });

      for (const answer of owned) keepSlugs.push(answer.slug);
      for (const answer of unowned) dropSlugs.push(answer.slug);

      if (unowned.length > 0 && owned.length === 0) {
        if (unread.length && unowned.length < COLLECTION_UNOWNED_CHECKS && !settle) {
          const stillNeeded = COLLECTION_UNOWNED_CHECKS - unowned.length;
          for (const token of unread.slice(0, stillNeeded)) readSlugs.push(token.slug);
          continue;
        }

        if (unowned.length >= COLLECTION_UNOWNED_CHECKS) {
          for (const token of unread) dropSlugs.push(token.slug);
          for (const token of inconclusive) dropSlugs.push(token.slug);
          continue;
        }
      }

      if (owned.length > 0 && unowned.length > 0 && unread.length && !settle) {
        for (const token of unread) readSlugs.push(token.slug);
        continue;
      }

      const pending = owned.length > 0 && unowned.length > 0 ? inconclusive.concat(unread) : inconclusive;
      const chance = reportedTokenOwnedChance(source, owned.length, unowned.length);
      const pendingKept = owned.length > 0 && chance >= OWNED_CHANCE_CUTOFF;

      for (const token of pending) {
        if (pendingKept) keepSlugs.push(token.slug);
        else if (source === 'goldrush') dropSlugs.push(token.slug);
        else keepSlugs.push(token.slug);
      }

      if (owned.length > 0 && unowned.length > 0) continue;

      const stat = sourceStats.get(source) ?? { owned: 0, unowned: 0 };
      const sourceMissed = stat.owned === 0 && stat.unowned >= COLLECTION_UNOWNED_CHECKS;

      for (const token of unread) {
        if (owned.length > 0 || trustedSource.has(source)) {
          keepSlugs.push(token.slug);
          continue;
        }

        if (!settle && !sourceMissed) {
          if (readSlugs.length < SOURCE_FOLLOW_UP_LIMIT) readSlugs.push(token.slug);
          continue;
        }

        if (sourceMissed) {
          dropSlugs.push(token.slug);
          continue;
        }

        if (stat.owned > 0 && reportedTokenOwnedChance(source, stat.owned, stat.unowned) >= OWNED_CHANCE_CUTOFF) {
          keepSlugs.push(token.slug);
          continue;
        }

        if (source === 'goldrush') dropSlugs.push(token.slug);
        else keepSlugs.push(token.slug);
      }
    }
  }

  return { keepSlugs, dropSlugs, readSlugs };
};

/** The first tokens of distinct contracts, up to the sample limit. */
export const alchemyOwnerSample = <T extends { contractAddress: string }>(
  loaded: readonly T[],
  limit = ALCHEMY_OWNER_SAMPLE_LIMIT
) => {
  const picked: T[] = [];
  const seen = new Set<string>();

  for (const nft of loaded) {
    const key = nft.contractAddress.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    picked.push(nft);
    if (picked.length >= limit) break;
  }

  return picked;
};

/** One token from an Alchemy owner page, after its balance was read. */
interface AlchemyOwnerSampleAnswer {
  /** Missing when that token's call did not return. */
  owned?: boolean;
  /** ERC-721 `balanceOf`. Zero means this account owns no token of that contract. */
  balanceOf: number | null;
}

/**
 * The Alchemy page is not kept when the sampled balances pull the chance a reported token is owned
 * below the cutoff. One owned token does not outweigh a sample that is mostly unowned.
 * A sample that did not answer leaves the prior, so the page stays.
 */
export const alchemyOwnerSampleRejectsList = (
  answers: readonly AlchemyOwnerSampleAnswer[],
  source: OwnershipSource = 'alchemy'
) => {
  let confirmedOwned = 0;
  let confirmedUnowned = 0;

  for (const answer of answers) {
    if (answer.owned === true) confirmedOwned++;
    else if (answer.owned === false || answer.balanceOf === 0) confirmedUnowned++;
  }

  return reportedTokenOwnedChance(source, confirmedOwned, confirmedUnowned) < OWNED_CHANCE_CUTOFF;
};

interface SampledUnowned {
  /** One token the chain rejected while the account still has a balance on its contract. */
  slugs: string[];
  /** Contracts whose ERC-721 `balanceOf` is 0. Every token of that contract is unowned. */
  contractAddresses: string[];
}

/**
 * Tokens and contracts the sample proved unowned.
 * `balanceOf` of 0 covers the whole contract. `ownerOf` of one token does not.
 */
export const unownedFromOwnerSample = (
  answers: readonly (AlchemyOwnerSampleAnswer & { slug?: string; contractAddress?: string })[]
): SampledUnowned => {
  const slugs: string[] = [];
  const contractAddresses: string[] = [];

  for (const answer of answers) {
    if (answer.owned === true) continue;

    if (answer.balanceOf === 0 && answer.contractAddress) {
      contractAddresses.push(answer.contractAddress);
      continue;
    }

    if (answer.slug && (answer.owned === false || answer.balanceOf === 0)) slugs.push(answer.slug);
  }

  return { slugs, contractAddresses };
};
