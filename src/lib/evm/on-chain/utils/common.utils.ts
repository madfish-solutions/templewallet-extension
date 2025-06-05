import { isDefined } from '@rnw-community/shared';
import { erc20Abi, parseAbi } from 'viem';

import { fromAssetSlug } from 'lib/assets';
import { ChainPublicClient, getViemPublicClient } from 'temple/evm';
import { EvmNetworkEssentials } from 'temple/networks';

import { ContractInterfaceId, EvmAssetStandard } from '../../types';

const supportsInterfaceAbi = parseAbi(['function supportsInterface(bytes4 interfaceID) external view returns (bool)']);

export const equalsIgnoreCase = (a: string | undefined, b: string | undefined) => a?.toLowerCase() === b?.toLowerCase();

export const detectEvmTokenStandard = async (
  clientOrNetwork: ChainPublicClient | EvmNetworkEssentials,
  assetSlug: string
): Promise<EvmAssetStandard | undefined> => {
  const [contractAddress] = fromAssetSlug<HexString>(assetSlug);

  const publicClient = isNetworkArg(clientOrNetwork) ? getViemPublicClient(clientOrNetwork) : clientOrNetwork;

  try {
    const isERC721Supported = await publicClient.readContract({
      address: contractAddress,
      abi: supportsInterfaceAbi,
      functionName: 'supportsInterface',
      args: [ContractInterfaceId.ERC721]
    });

    if (isERC721Supported) return EvmAssetStandard.ERC721;

    const isERC1155Supported = await publicClient.readContract({
      address: contractAddress,
      abi: supportsInterfaceAbi,
      functionName: 'supportsInterface',
      args: [ContractInterfaceId.ERC1155]
    });

    if (isERC1155Supported) return EvmAssetStandard.ERC1155;
  } catch {}

  try {
    await publicClient.readContract({
      address: contractAddress,
      abi: erc20Abi,
      functionName: 'totalSupply'
    });

    return EvmAssetStandard.ERC20;
  } catch {
    return undefined;
  }
};

const isNetworkArg = (
  clientOrNetwork: ChainPublicClient | EvmNetworkEssentials
): clientOrNetwork is EvmNetworkEssentials => isDefined((clientOrNetwork as EvmNetworkEssentials).rpcBaseURL);
