import BigNumber from 'bignumber.js';
import { erc20Abi, erc721Abi } from 'viem';

import { erc1155Abi } from 'lib/abi/erc1155';
import { fromAssetSlug } from 'lib/assets';
import { delay } from 'lib/utils';
import { ONE, ZERO } from 'lib/utils/numbers';
import { getViemPublicClient } from 'temple/evm';
import { getMulticallCallOptions } from 'temple/evm/multicall-config';
import { EvmNetworkEssentials } from 'temple/networks';

import { EvmAssetStandard } from '../types';

import { equalsIgnoreCase } from './utils/common.utils';

interface MulticallBalanceRequest {
  assetSlug: string;
  standard: EvmAssetStandard;
}

interface MulticallBalancesResult {
  balances: Record<string, string>;
  failed: Record<string, Error>;
}

const MULTICALL_TIMEOUT_MS = 30_000;

export const fetchBalancesViaMulticall = async (
  network: EvmNetworkEssentials,
  account: HexString,
  requests: MulticallBalanceRequest[],
  { throwOnTimeout = true }: { throwOnTimeout?: boolean } = {}
): Promise<MulticallBalancesResult> => {
  if (requests.length === 0) {
    return { balances: {}, failed: {} };
  }

  const publicClient = getViemPublicClient(network);
  const contracts = requests.map(({ assetSlug, standard }) => {
    const [contractAddress, tokenId] = fromAssetSlug<HexString>(assetSlug);

    switch (standard) {
      case EvmAssetStandard.ERC20:
        return {
          address: contractAddress,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [account]
        } as const;
      case EvmAssetStandard.ERC721:
        return {
          address: contractAddress,
          abi: erc721Abi,
          functionName: 'ownerOf',
          args: [BigInt(tokenId ?? '0')]
        } as const;
      case EvmAssetStandard.ERC1155:
        return {
          address: contractAddress,
          abi: erc1155Abi,
          functionName: 'balanceOf',
          args: [account, BigInt(tokenId ?? '0')]
        } as const;
      default:
        throw new Error(`Unsupported standard for multicall: ${standard}`);
    }
  });

  const executeMulticall = () =>
    publicClient.multicall({
      allowFailure: true,
      contracts,
      ...getMulticallCallOptions(network.chainId)
    });

  const responses = throwOnTimeout
    ? await Promise.race([
        executeMulticall(),
        delay(MULTICALL_TIMEOUT_MS).then(() => {
          throw new Error('Multicall request timed out');
        })
      ])
    : await executeMulticall();

  const balances: Record<string, string> = {};
  const failed: Record<string, Error> = {};

  responses.forEach((response, index) => {
    const { assetSlug, standard } = requests[index];

    if (response.status === 'success') {
      try {
        balances[assetSlug] = parseResult(standard, response.result, account).toFixed();
      } catch (err) {
        failed[assetSlug] = err instanceof Error ? err : new Error(String(err));
      }
      return;
    }

    failed[assetSlug] = response.error;
  });

  return { balances, failed };
};

const parseResult = (standard: EvmAssetStandard, value: unknown, account: HexString): BigNumber => {
  switch (standard) {
    case EvmAssetStandard.ERC20:
    case EvmAssetStandard.ERC1155: {
      if (typeof value !== 'bigint') {
        throw new Error('Unexpected multicall result type for fungible token');
      }
      return new BigNumber(value.toString());
    }
    case EvmAssetStandard.ERC721: {
      if (typeof value !== 'string') {
        throw new Error('Unexpected multicall result type for ERC721');
      }
      return equalsIgnoreCase(value, account) ? ONE : ZERO;
    }
    default:
      return ZERO;
  }
};
