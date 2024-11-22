import { Draft } from '@reduxjs/toolkit';
import { BigNumber } from 'bignumber.js';
import { getAddress } from 'viem';

import { BalanceItem } from 'lib/apis/temple/endpoints/evm/api.interfaces';
import { isNativeTokenAddress } from 'lib/apis/temple/endpoints/evm/api.utils';
import { toTokenSlug } from 'lib/assets';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { fetchEvmRawBalance } from 'lib/evm/on-chain/balance';
import { EvmRpcRequestsExecutor, ExecutionQueueCallbacks } from 'lib/evm/on-chain/utils/evm-rpc-requests-executor';
import { isPositiveCollectibleBalance, isPositiveTokenBalance } from 'lib/utils/evm.utils';

import { LoadOnChainBalancePayload } from './actions';
import { AssetSlugBalanceRecord, EvmBalancesAtomicRecord } from './state';

export const assignBalances = (
  balancesAtomic: Draft<EvmBalancesAtomicRecord>,
  publicKeyHash: HexString,
  chainId: number,
  data: AssetSlugBalanceRecord
) => {
  if (!balancesAtomic[publicKeyHash]) balancesAtomic[publicKeyHash] = {};
  const accountBalances = balancesAtomic[publicKeyHash];

  accountBalances[chainId] = Object.assign({}, accountBalances[chainId] ?? {}, data);
};

export const getTokenSlugBalanceRecord = (data: BalanceItem[], chainId: number) =>
  data.reduce<AssetSlugBalanceRecord>((acc, currentValue) => {
    const contractAddress = getAddress(currentValue.contract_address);

    if (currentValue.nft_data) {
      for (const nftItem of currentValue.nft_data) {
        if (!isPositiveCollectibleBalance(nftItem)) continue;

        acc[toTokenSlug(contractAddress, nftItem.token_id)] = nftItem.token_balance;
      }

      return acc;
    }

    if (!isPositiveTokenBalance(currentValue)) return acc;

    if (isNativeTokenAddress(chainId, currentValue.contract_address)) {
      acc[EVM_TOKEN_SLUG] = currentValue.balance;
    } else {
      acc[toTokenSlug(contractAddress)] = currentValue.balance;
    }

    return acc;
  }, {});

class EvmOnChainBalancesRequestsExecutor extends EvmRpcRequestsExecutor<
  LoadOnChainBalancePayload & ExecutionQueueCallbacks<BigNumber>,
  BigNumber,
  number
> {
  protected getQueueKey(payload: LoadOnChainBalancePayload) {
    return payload.network.chainId;
  }

  protected requestsAreSame(a: LoadOnChainBalancePayload, b: LoadOnChainBalancePayload) {
    return a.network.chainId === b.network.chainId && a.assetSlug === b.assetSlug && a.account === b.account;
  }

  protected async getResult(payload: LoadOnChainBalancePayload) {
    const { network, assetSlug, account, assetStandard } = payload;

    return fetchEvmRawBalance(network, assetSlug, account, assetStandard);
  }
}

export const evmOnChainBalancesRequestsExecutor = new EvmOnChainBalancesRequestsExecutor();
