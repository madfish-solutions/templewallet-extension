import {
  ContractFunctionExecutionError,
  ContractFunctionRevertedError,
  ContractFunctionZeroDataError,
  erc20Abi,
  erc721Abi,
  isHex,
  parseAbi
} from 'viem';

import { erc1155Abi } from 'lib/abi/erc1155';
import { ChainPublicClient } from 'temple/evm';

const commonPropertiesByContract = new Map<
  string,
  Promise<[PromiseSettledResult<string>, PromiseSettledResult<string>]>
>();

const isContractLevelFailure = (reason: unknown) =>
  reason instanceof ContractFunctionExecutionError &&
  reason.walk(
    error =>
      error instanceof ContractFunctionZeroDataError ||
      (error instanceof ContractFunctionRevertedError && isHex(error.raw))
  ) !== null;

const getCommonProperties = (
  publicClient: ChainPublicClient,
  contractAddress: HexString
): Promise<[PromiseSettledResult<string>, PromiseSettledResult<string>]> => {
  const key = `${publicClient.chain.id}:${contractAddress}`;
  const memoised = commonPropertiesByContract.get(key);

  if (memoised) return memoised;

  const properties = Promise.allSettled([
    publicClient.readContract({
      address: contractAddress,
      abi: parseAbi(['function name() public view returns (string)']),
      functionName: 'name'
    }),
    publicClient.readContract({
      address: contractAddress,
      abi: parseAbi(['function symbol() public view returns (string)']),
      functionName: 'symbol'
    })
  ]);
  commonPropertiesByContract.set(key, properties);
  void properties.then(results => {
    if (results.some(result => result.status === 'rejected' && !isContractLevelFailure(result.reason)))
      commonPropertiesByContract.delete(key);
  });

  return properties;
};

const withCommonProperties = async <T>(
  publicClient: ChainPublicClient,
  contractAddress: HexString,
  tokenProperty: Promise<T>
): Promise<[PromiseSettledResult<string>, PromiseSettledResult<string>, PromiseSettledResult<T>]> => {
  const [[name, symbol], [property]] = await Promise.all([
    getCommonProperties(publicClient, contractAddress),
    Promise.allSettled([tokenProperty])
  ]);

  return [name, symbol, property];
};

export const getValue = <T>(result: PromiseSettledResult<T>) =>
  result.status === 'fulfilled' ? result.value : undefined;

export const getERC20Properties = (publicClient: ChainPublicClient, contractAddress: HexString) =>
  withCommonProperties(
    publicClient,
    contractAddress,
    publicClient.readContract({
      address: contractAddress,
      abi: erc20Abi,
      functionName: 'decimals'
    })
  );

export const getERC721Properties = (publicClient: ChainPublicClient, contractAddress: HexString, tokenId: bigint) =>
  withCommonProperties(
    publicClient,
    contractAddress,
    publicClient.readContract({
      address: contractAddress,
      abi: erc721Abi,
      functionName: 'tokenURI',
      args: [tokenId]
    })
  );

export const getERC1155Properties = (publicClient: ChainPublicClient, contractAddress: HexString, tokenId: bigint) =>
  withCommonProperties(
    publicClient,
    contractAddress,
    publicClient.readContract({
      address: contractAddress,
      abi: erc1155Abi,
      functionName: 'uri',
      args: [tokenId]
    })
  );
