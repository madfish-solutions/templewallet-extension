import { isDefined } from '@rnw-community/shared';
import { erc20Abi, parseAbi } from 'viem';

import { fromAssetSlug } from 'lib/assets';
import { ChainPublicClient, getViemPublicClient } from 'temple/evm';
import { EvmNetworkEssentials } from 'temple/networks';

import { ContractInterfaceId, EvmAssetStandard } from '../../types';

const supportsInterfaceAbi = parseAbi(['function supportsInterface(bytes4 interfaceID) external view returns (bool)']);

const standardDetections = new Map<string, Promise<EvmAssetStandard | undefined>>();

export const detectEvmTokenStandard = (
  clientOrNetwork: ChainPublicClient | EvmNetworkEssentials,
  assetSlug: string
): Promise<EvmAssetStandard | undefined> => {
  const [contractAddress] = fromAssetSlug<HexString>(assetSlug);

  const publicClient = isNetworkArg(clientOrNetwork) ? getViemPublicClient(clientOrNetwork) : clientOrNetwork;

  const key = `${publicClient.chain.id}:${contractAddress}`;
  const detection = standardDetections.get(key);

  if (detection) return detection;

  const standard = readEvmTokenStandard(publicClient, contractAddress);
  standardDetections.set(key, standard);
  void standard.then(result => {
    if (result !== EvmAssetStandard.ERC721 && result !== EvmAssetStandard.ERC1155) standardDetections.delete(key);
  });

  return standard;
};

const readEvmTokenStandard = async (
  publicClient: ChainPublicClient,
  contractAddress: HexString
): Promise<EvmAssetStandard | undefined> => {
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
