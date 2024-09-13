import BigNumber from 'bignumber.js';
import { parseAbi } from 'viem';

import { fromAssetSlug } from 'lib/assets';
import { isEvmNativeTokenSlug } from 'lib/utils/evm.utils';
import { ONE, ZERO } from 'lib/utils/numbers';
import { getReadOnlyEvm } from 'temple/evm';
import { EvmNetworkEssentials } from 'temple/networks';

import { EvmAssetStandard } from '../types';

import { detectEvmTokenStandard } from './utils/common.utils';

export const fetchEvmRawBalance = async (
  network: EvmNetworkEssentials,
  assetSlug: string,
  account: HexString,
  assetStandard?: EvmAssetStandard
) => {
  if (isEvmNativeTokenSlug(assetSlug)) {
    return fetchEvmNativeBalance(account, network);
  }

  const [contractAddress, tokenIdStr] = fromAssetSlug<HexString>(assetSlug);

  const tokenId = BigInt(tokenIdStr ?? 0);

  const publicClient = getReadOnlyEvm(network.rpcBaseURL);

  let standard: EvmAssetStandard | undefined;

  if (assetStandard) {
    standard = assetStandard;
  } else {
    standard = await detectEvmTokenStandard(network.rpcBaseURL, assetSlug);
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

    if (standard === EvmAssetStandard.ERC721) {
      const ownerAddress = await publicClient.readContract({
        address: contractAddress,
        abi: parseAbi(['function ownerOf(uint256 tokenId) view returns (address owner)']),
        functionName: 'ownerOf',
        args: [tokenId]
      });

      return ownerAddress === account ? ONE : ZERO;
    }

    const fetchedBalance = await publicClient.readContract({
      address: contractAddress,
      abi: parseAbi(['function balanceOf(address owner) view returns (uint256)']),
      functionName: 'balanceOf',
      args: [account]
    });

    return new BigNumber(fetchedBalance.toString());
  } catch {
    console.error('Failed to fetch balance for: ', assetSlug);

    return ZERO;
  }
};

const fetchEvmNativeBalance = async (address: HexString, network: EvmNetworkEssentials) => {
  const publicClient = getReadOnlyEvm(network.rpcBaseURL);

  try {
    const fetchedBalance = await publicClient.getBalance({ address });

    return new BigNumber(fetchedBalance.toString());
  } catch (err) {
    console.error(`Failed to fetch native balance for ${network.chainId}`, err);

    return ZERO;
  }
};