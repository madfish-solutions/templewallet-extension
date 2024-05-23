import BigNumber from 'bignumber.js';
import { parseAbi } from 'viem';

import { fromAssetSlug } from 'lib/assets';
import { ONE, ZERO } from 'lib/utils/numbers';
import { getReadOnlyEvmForNetwork } from 'temple/evm';
import { EvmChain } from 'temple/front';

import { EvmAssetStandard } from '../types';

import { detectEvmTokenStandard } from './utils/common.utils';

export const fetchEvmRawBalance = async (
  network: EvmChain,
  assetSlug: string,
  account: HexString,
  assetStandard?: EvmAssetStandard
) => {
  const [contractAddress, tokenIdStr] = fromAssetSlug<HexString>(assetSlug);

  const tokenId = BigInt(tokenIdStr ?? 0);

  const publicClient = getReadOnlyEvmForNetwork(network);

  let standard: EvmAssetStandard;

  if (assetStandard) {
    standard = assetStandard;
  } else {
    standard = await detectEvmTokenStandard(network, assetSlug);
  }

  try {
    if (standard === EvmAssetStandard.ERC1155) {
      const fetchedErc1155Balance = await publicClient.readContract({
        address: contractAddress,
        abi: parseAbi(['function balanceOf(address account, uint256 id) view returns (uint256)']),
        functionName: 'balanceOf',
        args: [account, tokenId]
      });

      return new BigNumber(fetchedErc1155Balance.toString());
    }

    const fetchedBalance = await publicClient.readContract({
      address: contractAddress,
      abi: parseAbi(['function balanceOf(address owner) view returns (uint256)']),
      functionName: 'balanceOf',
      args: [account]
    });

    const balance = new BigNumber(fetchedBalance.toString());

    if (standard === EvmAssetStandard.ERC721 && balance.gte(ONE)) {
      const ownerAddress = await publicClient.readContract({
        address: contractAddress,
        abi: parseAbi(['function ownerOf(uint256 tokenId) view returns (address owner)']),
        functionName: 'ownerOf',
        args: [tokenId]
      });

      return ownerAddress === account ? ONE : ZERO;
    }

    return balance;
  } catch {
    console.error('Failed to fetch balance for: ', assetSlug);

    return ZERO;
  }
};
