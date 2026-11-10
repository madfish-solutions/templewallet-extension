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
  provenUnownedSlugs,
  tokenIdKey
} from './ownership';
import { InventoryLoadedNft } from './place-collections';

const contractKey = (address: string) => {
  try {
    return getAddress(address).toLowerCase();
  } catch {
    return address.toLowerCase();
  }
};

interface OwnerListSample {
  /** The source's report rates, updated by this sample, fall below the owned-chance cutoff. */
  rejectsList: boolean;
  /** Tokens in the sample the chain says this account does not own. */
  unownedSlugs: string[];
}

const keptList = (): OwnerListSample => ({ rejectsList: false, unownedSlugs: [] });

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
  signal: AbortSignal
): Promise<OwnerListSample> => {
  const queries = alchemyOwnerSample(loaded).flatMap(nft => {
    const tokenId = fromAssetSlug(nft.slug)[1];
    if (!tokenId) return [];

    return [{ contract: nft.contractAddress, tokenIds: [tokenId], slug: nft.slug }];
  });
  if (!queries.length) return keptList();

  const active = await getEvmChainsActiveRpcUrls();
  const rpcBaseURL = active[chainId] ?? EVM_DEFAULT_NETWORKS.find(network => network.chainId === chainId)?.rpcBaseURL;
  if (!rpcBaseURL) return keptList();

  try {
    const read = await readContractNftOwnership({ chainId, rpcBaseURL }, account, queries, signal);
    const answers = queries.map(query => {
      const key = contractKey(query.contract);
      const facts = read.failed.has(key) ? undefined : read.facts.get(key);
      const tokenId = tokenIdKey(query.tokenIds[0] ?? '');

      return {
        slug: query.slug,
        owned: facts?.perTokenOwned.get(tokenId),
        balanceOf: facts?.balanceOf ?? null
      };
    });

    return {
      rejectsList: alchemyOwnerSampleRejectsList(answers, source),
      unownedSlugs: provenUnownedSlugs(answers)
    };
  } catch (error) {
    if (isAbortError(error)) throw error;
    console.error(error);

    return keptList();
  }
};
