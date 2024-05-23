import { parseAbi } from 'viem';

import { fromAssetSlug } from 'lib/assets';
import { getReadOnlyEvmForNetwork } from 'temple/evm';
import { EvmChain } from 'temple/front';

import { ContractInterfaceId, EvmAssetStandard } from '../../types';

const supportsInterfaceAbi = parseAbi(['function supportsInterface(bytes4 interfaceID) external view returns (bool)']);

export const detectEvmTokenStandard = async (network: EvmChain, assetSlug: string): Promise<EvmAssetStandard> => {
  const [contractAddress] = fromAssetSlug<HexString>(assetSlug);

  const publicClient = getReadOnlyEvmForNetwork(network);

  try {
    const isERC721Supported = await publicClient.readContract({
      address: contractAddress,
      abi: supportsInterfaceAbi,
      functionName: 'supportsInterface',
      args: [ContractInterfaceId.ERC721]
    });

    const isERC1155Supported = await publicClient.readContract({
      address: contractAddress,
      abi: supportsInterfaceAbi,
      functionName: 'supportsInterface',
      args: [ContractInterfaceId.ERC1155]
    });

    if (isERC1155Supported && !isERC721Supported) return EvmAssetStandard.ERC1155;

    if (!isERC1155Supported && !isERC721Supported) throw new Error();

    return EvmAssetStandard.ERC721;
  } catch {
    try {
      await publicClient.readContract({
        address: contractAddress,
        abi: parseAbi(['function totalSupply() public view returns (uint256)']),
        functionName: 'totalSupply'
      });

      return EvmAssetStandard.ERC20;
    } catch {
      return EvmAssetStandard.UNKNOWN;
    }
  }
};
