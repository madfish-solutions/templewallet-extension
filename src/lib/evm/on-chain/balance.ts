import BigNumber from 'bignumber.js';
import { erc20Abi, erc721Abi } from 'viem';

import { erc1155Abi } from 'lib/abi/erc1155';
import { fromAssetSlug } from 'lib/assets';
import { delay } from 'lib/utils';
import { isEvmNativeTokenSlug } from 'lib/utils/evm.utils';
import { ONE, ZERO } from 'lib/utils/numbers';
import { getViemPublicClient } from 'temple/evm';
import { EvmNetworkEssentials } from 'temple/networks';

import { EvmAssetStandard } from '../types';

import { detectEvmTokenStandard } from './utils/common.utils';
import { EvmRpcRequestsExecutor } from './utils/evm-rpc-requests-executor';

export interface LoadOnChainBalancePayload {
  network: EvmNetworkEssentials;
  assetSlug: string;
  account: HexString;
  assetStandard?: EvmAssetStandard;
  throwOnTimeout?: boolean;
}

const fetchEvmRawBalance = async (
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

  const publicClient = getViemPublicClient(network);

  let standard: EvmAssetStandard | undefined;

  if (assetStandard) {
    standard = assetStandard;
  } else {
    standard = await detectEvmTokenStandard(network, assetSlug);
  }

  try {
    if (standard === EvmAssetStandard.ERC1155) {
      const fetchedErc1155Balance = await publicClient.readContract({
        address: contractAddress,
        abi: erc1155Abi,
        functionName: 'balanceOf',
        args: [account, tokenId]
      });

      return new BigNumber(fetchedErc1155Balance.toString());
    }

    if (standard === EvmAssetStandard.ERC721) {
      const ownerAddress = await publicClient.readContract({
        address: contractAddress,
        abi: erc721Abi,
        functionName: 'ownerOf',
        args: [tokenId]
      });

      return ownerAddress === account ? ONE : ZERO;
    }

    const fetchedBalance = await publicClient.readContract({
      address: contractAddress,
      abi: erc20Abi,
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
  const publicClient = getViemPublicClient(network);

  try {
    const fetchedBalance = await publicClient.getBalance({ address });

    return new BigNumber(fetchedBalance.toString());
  } catch (err) {
    console.error(`Failed to fetch native balance for ${network.chainId}`, err);

    return ZERO;
  }
};

class EvmOnChainBalancesRequestsExecutor extends EvmRpcRequestsExecutor<LoadOnChainBalancePayload, BigNumber, number> {
  protected getRequestsPoolKey(payload: LoadOnChainBalancePayload) {
    return payload.network.chainId;
  }

  protected requestsAreSame(a: LoadOnChainBalancePayload, b: LoadOnChainBalancePayload) {
    return a.network.chainId === b.network.chainId && a.assetSlug === b.assetSlug && a.account === b.account;
  }

  protected async getResult({
    network,
    assetSlug,
    account,
    assetStandard,
    throwOnTimeout = true
  }: LoadOnChainBalancePayload) {
    if (!throwOnTimeout) {
      return fetchEvmRawBalance(network, assetSlug, account, assetStandard);
    }

    return Promise.race([
      fetchEvmRawBalance(network, assetSlug, account, assetStandard),
      delay(30_000).then(() => {
        throw new Error(`Request timed out for ${network.chainId} ${assetSlug} ${account}`);
      })
    ]);
  }
}

export const evmOnChainBalancesRequestsExecutor = new EvmOnChainBalancesRequestsExecutor();
