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
const ownershipPosterior = (sources: readonly OwnershipSource[], queriedSources: readonly OwnershipSource[]) => {
  const reported = new Set(sources);
  let odds = 1;

  for (const source of queriedSources) {
    const rates = SOURCE_REPORT[source];
    const likelihood = reported.has(source)
      ? rates.whenOwned / rates.whenNot
      : (1 - rates.whenOwned) / (1 - rates.whenNot);
    odds *= likelihood;
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
        .filter(candidate => ownershipPosterior(candidate.sources, queriedSources) >= OWNED_CHANCE_CUTOFF)
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
        score: ownershipPosterior(candidate.sources, queriedSources)
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
    if (ownershipPosterior(candidate.sources, queriedSources) >= OWNED_CHANCE_CUTOFF)
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

/** How many of Alchemy's tokens are checked before the owner list is trusted. One token per contract. */
const ALCHEMY_OWNER_SAMPLE_LIMIT = 3;

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

/** Sampled tokens the chain says this account does not own. An owned answer is kept. */
export const provenUnownedSlugs = (answers: readonly (AlchemyOwnerSampleAnswer & { slug?: string })[]) =>
  answers.flatMap(answer => {
    if (!answer.slug || answer.owned === true) return [];
    if (answer.owned === false || answer.balanceOf === 0) return [answer.slug];

    return [];
  });
