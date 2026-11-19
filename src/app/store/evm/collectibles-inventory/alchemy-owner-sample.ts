import { getAddress } from 'viem';

import { isAbortError } from 'lib/apis/utils';
import { fromAssetSlug } from 'lib/assets';
import { readContractNftOwnership } from 'lib/evm/on-chain/nft-ownership';
import { getEvmChainsActiveRpcUrls } from 'temple/evm/evm-chains-rpc-urls';
import { EVM_DEFAULT_NETWORKS } from 'temple/networks';

import {
  OwnershipSource,
  alchemyOwnerSample,
  alchemyOwnerSampleRejectsList,
  tokenIdKey,
  unownedFromOwnerSample
} from './ownership';
import { InventoryLoadedNft } from './place-collections';

const contractKey = (address: string) => {
  try {
    return getAddress(address).toLowerCase();
  } catch {
    return address.toLowerCase();
  }
};

export interface OwnerSampleAnswer {
  slug: string;
  contractAddress: string;
  /** Missing when that token's call did not return. */
  owned?: boolean;
  /** ERC-721 `balanceOf`. Zero means this account owns no token of that contract. */
  balanceOf: number | null;
}

interface OwnerListSample {
  /** The source's report rates, updated by this sample, fall below the owned-chance cutoff. */
  rejectsList: boolean;
  /** Tokens in the sample the chain says this account does not own. */
  unownedSlugs: string[];
  /** Contracts whose ERC-721 balance is zero. Every loaded token of these contracts is unowned. */
  unownedContracts: string[];
  /** ERC-721 `balanceOf` for a sampled contract, keyed by lowercase address. */
  balanceOfByContract: ReadonlyMap<string, number>;
  /** Every token this sample asked the chain about. */
  answers: readonly OwnerSampleAnswer[];
}

const keptList = (): OwnerListSample => ({
  rejectsList: false,
  unownedSlugs: [],
  unownedContracts: [],
  balanceOfByContract: new Map(),
  answers: []
});

const ownershipQueries = (loaded: readonly InventoryLoadedNft[]) =>
  loaded.flatMap(nft => {
    const tokenId = fromAssetSlug(nft.slug)[1];
    if (!tokenId) return [];

    return [{ contract: nft.contractAddress, tokenIds: [tokenId], slug: nft.slug }];
  });

/** ERC-721 `balanceOf` from ownership answers, keyed by lowercase address. */
export const balanceOfByContractFromAnswers = (answers: readonly OwnerSampleAnswer[]) => {
  const balances = new Map<string, number>();

  for (const answer of answers) {
    if (answer.balanceOf == null) continue;

    balances.set(contractKey(answer.contractAddress), answer.balanceOf);
  }

  return balances;
};

/**
 * `ownerOf` and ERC-721 `balanceOf` for these tokens.
 * An empty list means the chain was not asked or did not answer. It is not a list of unowned tokens.
 */
export const readListedOwnership = async (
  account: HexString,
  chainId: number,
  loaded: readonly InventoryLoadedNft[],
  signal: AbortSignal
): Promise<OwnerSampleAnswer[]> => {
  const queries = ownershipQueries(loaded);
  if (!queries.length) return [];

  const active = await getEvmChainsActiveRpcUrls();
  const rpcBaseURL = active[chainId] ?? EVM_DEFAULT_NETWORKS.find(network => network.chainId === chainId)?.rpcBaseURL;
  if (!rpcBaseURL) return [];

  try {
    const read = await readContractNftOwnership({ chainId, rpcBaseURL }, account, queries, signal);

    return queries.map(query => {
      const key = contractKey(query.contract);
      const facts = read.failed.has(key) ? undefined : read.facts.get(key);
      const tokenId = tokenIdKey(query.tokenIds[0] ?? '');

      return {
        slug: query.slug,
        contractAddress: query.contract,
        owned: facts?.perTokenOwned.get(tokenId),
        balanceOf: facts?.balanceOf ?? null
      };
    });
  } catch (error) {
    if (isAbortError(error)) throw error;
    console.error(error);

    return [];
  }
};

/**
 * Balances for a few reported tokens.
 * `rejectsList` is the chance this source's page is not good enough.
 * `unownedSlugs` are removed even when the page stays.
 */
export const readOwnerListSample = async (
  account: HexString,
  chainId: number,
  loaded: readonly InventoryLoadedNft[],
  source: OwnershipSource,
  signal: AbortSignal,
  /** Slugs that count toward rejecting this source's page. Other sampled tokens are disagreements with a second source. */
  listSlugs?: ReadonlySet<string>
): Promise<OwnerListSample> => {
  const picked = alchemyOwnerSample(loaded);
  if (!ownershipQueries(picked).length) return keptList();

  const answers = await readListedOwnership(account, chainId, picked, signal);
  if (!answers.length) return keptList();

  const unowned = unownedFromOwnerSample(answers);
  const listAnswers = listSlugs ? answers.filter(answer => listSlugs.has(answer.slug.toLowerCase())) : answers;

  return {
    rejectsList: alchemyOwnerSampleRejectsList(listAnswers, source),
    unownedSlugs: unowned.slugs,
    unownedContracts: unowned.contractAddresses,
    balanceOfByContract: balanceOfByContractFromAnswers(answers),
    answers
  };
};
